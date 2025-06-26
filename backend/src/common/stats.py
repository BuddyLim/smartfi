from __future__ import annotations

from enum import Enum

from fastapi import Depends
from pydantic import BaseModel, field_validator
from sqlalchemy import (
    Case,
    column,
    func,
    literal,
    literal_column,
    select,
    table,
)
from sqlalchemy.orm import aliased

from src.account.model import AccountSA
from src.category.model import CategorySA
from src.common.db import DatabaseService, get_db_service
from src.transaction.model import TransactionSA


class DurationEnum(Enum):
    SEVEN_DAYS = "1W"
    THIRTY_DAYS = "1M"
    THREE_MONTHS = "3M"
    SIX_MONTHS = "6M"
    ONE_YEAR = "1Y"
    ALL_TIME = "All"


DURATION_MAP = {
    "1W": "-7 days",
    "1M": "-31 days",
    "3M": "-91 days",
    "6M": "-186 days",
    "1Y": "-367 days",
    "All": "All",
}


class DurationModel(BaseModel):
    duration: str = DurationEnum.SEVEN_DAYS.value
    account_ids: list[int]

    @field_validator("duration", mode="after")
    @classmethod
    def duration_validator(cls, value: str) -> str:
        return DURATION_MAP[value]


class StatsService:
    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service

    def __query_expenses_specified_duration(self, duration_model: DurationModel):
        duration_table = table("duration", column("date"))

        # Step 1: Base case (start date - 6 days ago)
        start_date_expr = select(
            func.date("now", duration_model.duration).label("date"),
        )

        # Step 2: Recursive step — add 1 day until today
        recursive_expr = select(
            func.date(duration_table.c.date, "+1 day"),
        ).where(duration_table.c.date < func.date("now"))

        # Combine into recursive CTE
        cte = start_date_expr.union_all(recursive_expr).cte(
            "duration",
            recursive=True,
        )

        # Alias the CTE for joining
        cte_alias = aliased(cte)

        # Final query: join with transaction table
        stmt = (
            select(
                cte_alias.c.date.label("date"),
                func.coalesce(func.sum(TransactionSA.amount), 0).label("amount"),
            )
            # .where(TransactionSA.account_id.in_(duration_model.account_ids))
            .outerjoin(
                TransactionSA,
                (func.substr(TransactionSA.date, 1, 10) == cte_alias.c.date)
                & (TransactionSA.account_id.in_(duration_model.account_ids))
                & (TransactionSA.entry_type == "debit"),
            )
            .group_by(cte_alias.c.date)
            .order_by(cte_alias.c.date.desc())
        )

        return self.db_service.execute_statement_sa(stmt).mappings().all()

    def __query_expenses_all_time(self, duration_model: DurationModel):
        min_date_subquery = select(
            func.date(func.min(TransactionSA.date)),
        ).scalar_subquery()

        # Step 2: Build the recursive CTE for all_days
        all_days = table("all_days", column("date"))

        base = select(min_date_subquery.label("date")).cte("all_days", recursive=True)
        recursive = select(
            func.date(func.date(all_days.c.date, literal_column("'+1 day'"))).label(
                "date",
            ),
        ).where(func.date(all_days.c.date) < func.current_date())

        all_days = base.union_all(recursive)

        # Step 3: Join with transaction table
        stmt = (
            select(
                all_days.c.date,
                func.coalesce(func.sum(TransactionSA.amount), 0).label("amount"),
            )
            .select_from(
                all_days.outerjoin(
                    TransactionSA,
                    (func.substr(TransactionSA.date, 1, 10) == all_days.c.date)
                    & (TransactionSA.entry_type == literal("debit")),
                ),
            )
            .where(TransactionSA.account_id.in_(duration_model.account_ids))
            # .where(TransactionSA.entry_type == literal("debit"))
            .group_by(all_days.c.date)
            .order_by(all_days.c.date.desc())
        )

        return self.db_service.execute_statement_sa(stmt).mappings().all()

    def get_expenses_over_duration(self, duration_model: DurationModel):
        if duration_model.duration == DurationEnum.ALL_TIME.value:
            return self.__query_expenses_all_time(duration_model=duration_model)

        return self.__query_expenses_specified_duration(duration_model=duration_model)

    def __query_net_worth_specified_duration(
        self,
        account_ids: list[int],
        duration: str,
    ):
        last_x_days = table("last_x_days", column("date"))

        base = select(func.date(func.datetime("now", duration)).label("date"))

        step = select(func.date(last_x_days.c.date, "+1 day")).where(
            last_x_days.c.date < func.date("now"),
        )
        last_x_days_cte = base.union_all(step).cte("last_x_days", recursive=True)
        ld = aliased(last_x_days_cte)

        # Filter accounts
        account_query = select(AccountSA).where(AccountSA.id.in_(account_ids))
        account_cte = account_query.cte("filtered_accounts")
        fa = aliased(account_cte)

        # Pre-window balance per account
        tx = aliased(TransactionSA)
        pre_window = (
            select(
                fa.c.id.label("account_id"),
                (
                    fa.c.initial_balance
                    + func.coalesce(
                        func.sum(
                            Case(
                                (tx.entry_type == "credit", tx.amount),
                                (tx.entry_type == "debit", -tx.amount),
                                else_=literal(0),
                            ),
                        ),
                        0,
                    )
                ).label("start_balance"),
            )
            .outerjoin(
                tx,
                (tx.account_id == fa.c.id)
                & (func.date(tx.date) < func.date(func.datetime("now", duration))),
            )
            .group_by(fa.c.id)
            .cte("pre_window_balances")
        )
        pb = aliased(pre_window)

        # Daily net change per account
        txn = aliased(TransactionSA)
        daily_net = (
            select(
                ld.c.date,
                fa.c.id.label("account_id"),
                func.coalesce(
                    func.sum(
                        Case(
                            (txn.entry_type == "credit", txn.amount),
                            (txn.entry_type == "debit", -txn.amount),
                            else_=literal(0),
                        ),
                    ),
                    0,
                ).label("daily_change"),
            )
            .select_from(
                ld.join(fa, literal(value=True)).outerjoin(
                    txn,
                    (txn.account_id == fa.c.id) & (func.date(txn.date) == ld.c.date),
                ),
            )
            .group_by(ld.c.date, fa.c.id)
            .cte("daily_net")
        )
        dn = aliased(daily_net)

        # Running change using window function
        running_cte = (
            select(
                dn.c.date,
                dn.c.account_id,
                dn.c.daily_change,
                func.sum(dn.c.daily_change)
                .over(partition_by=dn.c.account_id, order_by=dn.c.date)
                .label("running_change"),
            )
        ).cte("account_running")
        ar = aliased(running_cte)

        # Combine with start balances
        running_with_base = (
            select(
                ar.c.date,
                ar.c.account_id,
                (pb.c.start_balance + ar.c.running_change).label("running_balance"),
            )
            .join(pb, pb.c.account_id == ar.c.account_id)
            .cte("running_with_base")
        )
        rb = aliased(running_with_base)

        # Final query
        stmt = (
            select(rb.c.date, func.sum(rb.c.running_balance).label("amount"))
            .group_by(rb.c.date)
            .order_by(rb.c.date.desc())
        )

        return self.db_service.execute_statement_sa(stmt).mappings().all()

    def __query_net_worth_all_time(self, account_ids: list[int], duration: str):
        last_x_days = table("last_x_days", column("date"))
        earliest_date_query = select(func.min(AccountSA.created_at)).scalar_subquery()

        start_date_expr = select(func.date(earliest_date_query).label("date"))

        # base = select(
        #     func.date(func.datetime("now", duration_model.duration)).label("date")
        # )

        recursive_expr = select(
            func.date(last_x_days.c.date, "+1 day").label("date"),
        ).where(last_x_days.c.date < func.date("now"))

        cte = start_date_expr.union_all(recursive_expr).cte(
            "last_x_days",
            recursive=True,
        )

        # step = select(func.date(last_x_days.c.date, "+1 day")).where(
        #     last_x_days.c.date < func.date("now")
        # )
        # last_x_days_cte = base.union_all(step).cte("last_x_days", recursive=True)
        ld = aliased(cte)

        # Filter accounts
        account_query = select(AccountSA).where(AccountSA.id.in_(account_ids))

        account_cte = account_query.cte("filtered_accounts")
        fa = aliased(account_cte)

        # Pre-window balance per account
        tx = aliased(TransactionSA)
        pre_window = (
            select(
                fa.c.id.label("account_id"),
                (
                    fa.c.initial_balance
                    + func.coalesce(
                        func.sum(
                            Case(
                                (tx.entry_type == "credit", tx.amount),
                                (tx.entry_type == "debit", -tx.amount),
                                else_=literal(0),
                            ),
                        ),
                        0,
                    )
                ).label("start_balance"),
            )
            .outerjoin(
                tx,
                (tx.account_id == fa.c.id)
                & (func.date(tx.date) < func.date(func.datetime("now", duration))),
            )
            .group_by(fa.c.id)
            .cte("pre_window_balances")
        )
        pb = aliased(pre_window)

        # Daily net change per account
        txn = aliased(TransactionSA)
        daily_net = (
            select(
                ld.c.date,
                fa.c.id.label("account_id"),
                func.coalesce(
                    func.sum(
                        Case(
                            (txn.entry_type == "credit", txn.amount),
                            (txn.entry_type == "debit", -txn.amount),
                            else_=literal(0),
                        ),
                    ),
                    0,
                ).label("daily_change"),
            )
            .select_from(
                ld.join(fa, literal(value=True)).outerjoin(
                    txn,
                    (txn.account_id == fa.c.id) & (func.date(txn.date) == ld.c.date),
                ),
            )
            .group_by(ld.c.date, fa.c.id)
            .cte("daily_net")
        )
        dn = aliased(daily_net)

        # Running change using window function
        running_cte = (
            select(
                dn.c.date,
                dn.c.account_id,
                dn.c.daily_change,
                func.sum(dn.c.daily_change)
                .over(partition_by=dn.c.account_id, order_by=dn.c.date)
                .label("running_change"),
            )
        ).cte("account_running")
        ar = aliased(running_cte)

        # Combine with start balances
        running_with_base = (
            select(
                ar.c.date,
                ar.c.account_id,
                (pb.c.start_balance + ar.c.running_change).label("running_balance"),
            )
            .join(pb, pb.c.account_id == ar.c.account_id)
            .cte("running_with_base")
        )
        rb = aliased(running_with_base)

        # Final query
        stmt = (
            select(rb.c.date, func.sum(rb.c.running_balance).label("amount"))
            .group_by(rb.c.date)
            .order_by(rb.c.date.desc())
        )

        return self.db_service.execute_statement_sa(stmt).mappings().all()

    def get_net_worth_over_duration(self, net_worth_model: DurationModel):
        if net_worth_model.duration == DurationEnum.ALL_TIME.value:
            return self.__query_net_worth_all_time(
                account_ids=net_worth_model.account_ids,
                duration=net_worth_model.duration,
            )

        return self.__query_net_worth_specified_duration(
            account_ids=net_worth_model.account_ids,
            duration=net_worth_model.duration,
        )

    def get_category_spent_over_duration(self):
        stmt = (
            select(
                TransactionSA.category_id,
                CategorySA.name.label("category_name"),
                func.sum(TransactionSA.amount).label("total_amount"),
            )
            .join(
                CategorySA,
                CategorySA.id == TransactionSA.category_id,
            )
            .where(
                TransactionSA.user_id == 1,
                TransactionSA.date >= func.date(func.datetime("now", "start of month")),
                TransactionSA.entry_type == "debit",
            )
            .group_by(
                TransactionSA.category_id,
            )
            .order_by(column("total_amount").asc())
        )

        return self.db_service.execute_statement_sa(stmt).mappings().all()

    def average_expenses_at_a_glance(self):
        calendar = table("calendar", column("day"))

        # Step 1: Recursive calendar CTE - last 14 days (inclusive)
        start_date_expr = select(func.date("now", "-14 days").label("day"))

        recursive_expr = select(func.date(calendar.c.day, "+1 day")).where(
            calendar.c.day < func.date("now"),
        )

        calendar_cte = start_date_expr.union_all(recursive_expr).cte(
            "calendar",
            recursive=True,
        )
        calendar_alias = aliased(calendar_cte)

        # Step 2: Daily debit sums from Transaction
        daily_sums_subq = (
            select(
                func.date(TransactionSA.date).label("day"),
                func.sum(TransactionSA.amount).label("total"),
            )
            .where(
                TransactionSA.entry_type == "debit",
                TransactionSA.date >= func.date("now", "-14 days"),
            )
            .group_by(func.date(TransactionSA.date))
            .subquery("daily_sums")
        )

        daily_sums_alias = aliased(daily_sums_subq)

        # Step 3: Join calendar and daily_sums to zero-fill
        joined_subq = (
            select(
                calendar_alias.c.day,
                func.coalesce(daily_sums_alias.c.total, 0).label("total"),
            ).select_from(
                calendar_alias.outerjoin(
                    daily_sums_alias,
                    calendar_alias.c.day == daily_sums_alias.c.day,
                ),
            )
        ).subquery("joined")

        # Step 4: Final aggregation with CASE logic
        stmt = select(
            func.round(
                func.avg(
                    Case(
                        (
                            joined_subq.c.day >= func.date("now", "-7 days"),
                            joined_subq.c.total,
                        ),
                    ),
                ),
                2,
            ).label("past_7_days_avg"),
            func.round(
                func.avg(
                    Case(
                        (
                            func.date(joined_subq.c.day).between(
                                func.date("now", "-14 days"),
                                func.date("now", "-7 days"),
                            ),
                            joined_subq.c.total,
                        ),
                    ),
                ),
                2,
            ).label("past_14_days_avg"),
        )

        return self.db_service.execute_statement_sa(stmt).mappings().one_or_none()

    def account_balance_at_a_glance(self):
        end_of_last_month_case = Case(
            (
                TransactionSA.date < func.date("now", "start of month"),
                Case(
                    (TransactionSA.entry_type == "credit", TransactionSA.amount),
                    else_=-TransactionSA.amount,
                ),
            ),
            else_=0,
        )

        current_balance_case = Case(
            (
                TransactionSA.date <= func.date("now"),
                Case(
                    (TransactionSA.entry_type == "credit", TransactionSA.amount),
                    else_=-TransactionSA.amount,
                ),
            ),
            else_=0,
        )

        # Final SELECT statement
        stmt = (
            select(
                AccountSA.name.label("account_name"),
                AccountSA.id.label("account_id"),
                (
                    AccountSA.initial_balance
                    + func.coalesce(func.sum(end_of_last_month_case), 0)
                ).label("end_of_last_month_account_balance"),
                (
                    AccountSA.initial_balance
                    + func.coalesce(func.sum(current_balance_case), 0)
                ).label("current_account_balance"),
            )
            .outerjoin(TransactionSA, TransactionSA.account_id == AccountSA.id)
            .where(AccountSA.id == 1)
            .group_by(AccountSA.id, AccountSA.initial_balance)
        )

        return self.db_service.execute_statement_sa(stmt).mappings().one_or_none()


def get_stats_service(
    db_service: DatabaseService = Depends(get_db_service),
) -> StatsService:
    """Return Chart service instance."""
    return StatsService(
        db_service=db_service,
    )
