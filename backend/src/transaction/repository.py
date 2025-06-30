from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from random import randint
from sqlite3 import DatabaseError
from typing import Annotated

from fastapi import Depends
from sqlalchemy import Case, alias, func, literal, select
from sqlalchemy.orm import Session as SASession

from src.account.model import AccountSA
from src.category.model import CategorySA
from src.common.db import DatabaseService, get_db_service
from src.suggested_category.model import SuggestedCategory
from src.transaction.model import (
    TransactionCreate,
    TransactionEditRequest,
    TransactionPublic,
    TransactionSA,
)


class TransactionRepository:
    """Transaction Repository."""

    def __init__(self, db_service: DatabaseService) -> None:
        self.db_service = db_service

    def create_transaction(self, transaction_create: TransactionCreate):
        with SASession(bind=self.db_service.sa_engine) as session:
            suggest_categories = session.scalars(
                select(CategorySA).where(
                    CategorySA.id.in_(transaction_create.suggested_categories),
                )
            ).all()

            now = datetime.now(timezone.utc)
            transaction = TransactionSA(
                user_id=transaction_create.user_id,
                name=transaction_create.name,
                entry_type=transaction_create.entry_type,
                category_id=transaction_create.category_id,
                amount=transaction_create.amount,
                date=datetime.strptime(transaction_create.date, "%Y-%m-%d").replace(
                    tzinfo=timezone.utc,
                    hour=now.hour,
                    minute=now.minute,
                    second=now.second,
                    microsecond=now.microsecond,
                ),
                account_id=transaction_create.account_id,
                suggested_categories=suggest_categories,
            )
            session.add(transaction)
            session.commit()
            session.refresh(transaction)
            return transaction

    def get_transaction(self, user_id: int, transaction_id: int):
        with SASession(bind=self.db_service.sa_engine) as session:
            tx_with_account = (
                select(
                    TransactionSA.id,
                    TransactionSA.amount,
                    TransactionSA.date,
                    TransactionSA.name,
                    TransactionSA.entry_type,
                    TransactionSA.category_id,
                    TransactionSA.user_id,
                    TransactionSA.account_id,
                    AccountSA.created_at.label("account_created_at"),
                    AccountSA.initial_balance,
                    AccountSA.currency,
                    AccountSA.name.label("account_name"),
                    CategorySA.name.label("category_name"),
                )
                .where(
                    TransactionSA.user_id == user_id,
                )
                .join(
                    AccountSA,
                    AccountSA.id == TransactionSA.account_id,
                    isouter=True,
                )
                .join(
                    CategorySA,
                    CategorySA.id == TransactionSA.category_id,
                    isouter=True,
                )
                # .subquery()
            )

            initial_tx = select(
                literal(value=randint(9999, 99999)).label("id"),
                AccountSA.initial_balance.label("amount"),
                AccountSA.created_at.label("date"),
                literal("Account Creation").label("name"),
                literal("credit").label("entry_type"),
                literal(1).label("category_id"),
                AccountSA.user_id.label("user_id"),
                AccountSA.id.label("account_id"),
                AccountSA.created_at.label("account_created_at"),
                AccountSA.initial_balance.label("initial_balance"),
                AccountSA.currency.label("currency"),
                AccountSA.name.label("account_name"),
                literal("Initial Balance").label("category_name"),
            ).select_from(AccountSA)

            combined_tx = initial_tx.union_all(tx_with_account).subquery()

            tx = alias(combined_tx)

            adjusted_amount: Case[int] = Case(
                (
                    tx.c.entry_type == "credit",
                    tx.c.amount,
                ),  # Credit adds amount
                (
                    tx.c.entry_type == "debit",
                    -tx.c.amount,
                ),  # Debit subtracts amount
                else_=0,
            )
            running_total = (
                func.sum(adjusted_amount)
                .over(
                    partition_by=tx.c.account_id,
                    order_by=tx.c.date,
                    rows=(None, 0),  # UNBOUNDED PRECEDING TO CURRENT ROW
                )
                .label("running_total")
            )

            running_balance = running_total.label("running_balance")

            running_total_cte = select(
                tx.c.amount,
                tx.c.date,
                tx.c.name,
                tx.c.entry_type,
                tx.c.category_id,
                tx.c.user_id,
                tx.c.id,
                tx.c.account_id,
                tx.c.category_name,
                tx.c.account_name,
                tx.c.currency,
                running_balance,
            ).cte("RunningTotal")

            stmt = (
                select(
                    running_total_cte.c.id,
                    running_total_cte.c.account_id,
                    running_total_cte.c.amount,
                    running_total_cte.c.category_name,
                    running_total_cte.c.entry_type,
                    running_total_cte.c.category_id,
                    running_total_cte.c.user_id,
                    running_total_cte.c.name,
                    running_total_cte.c.date,
                    running_total_cte.c.account_name,
                    running_total_cte.c.currency,
                    running_total_cte.c.running_balance,
                )
                .where(
                    running_total_cte.c.id == transaction_id,
                )
                .order_by(running_total_cte.c.date.desc())
            )

            result = (
                session.execute(
                    stmt,
                    execution_options={"prebuffer_rows": True},
                )
                .mappings()
                .one_or_none()
            )

            if result is None:
                msg = "Could not grab data with ID: %d"
                raise DatabaseError(msg, transaction_id)

            suggested_list = []

            if result.category_name == "Unknown":
                # Get suggested categories in bulk
                rows = session.execute(
                    select(
                        SuggestedCategory.category_id,
                        SuggestedCategory.transaction_id,
                        CategorySA.name,
                    )
                    .where(SuggestedCategory.transaction_id == result.id)
                    .join(
                        CategorySA,
                        SuggestedCategory.category_id == CategorySA.id,
                    )
                ).all()

                for category_id, transaction_id, name in rows:
                    suggested_list.append(
                        {
                            "category_name": name,
                            "category_id": category_id,
                        },
                    )

            return TransactionPublic.model_validate(
                {
                    **result,
                    "date": result.date.isoformat() + "Z",
                    "suggested_categories": suggested_list,
                },
                from_attributes=True,
            )

    def get_transactions(self, user_id: int):
        with SASession(bind=self.db_service.sa_engine) as session:
            tx_with_account = (
                select(
                    TransactionSA.id,
                    TransactionSA.amount,
                    TransactionSA.date,
                    TransactionSA.name,
                    TransactionSA.entry_type,
                    TransactionSA.category_id,
                    TransactionSA.user_id,
                    TransactionSA.account_id,
                    AccountSA.created_at.label("account_created_at"),
                    AccountSA.initial_balance,
                    AccountSA.currency,
                    AccountSA.name.label("account_name"),
                    CategorySA.name.label("category_name"),
                )
                .where(TransactionSA.user_id == user_id)
                .join(
                    AccountSA,
                    AccountSA.id == TransactionSA.account_id,
                    isouter=True,
                )
                .join(
                    CategorySA,
                    CategorySA.id == TransactionSA.category_id,
                    isouter=True,
                )
            )

            initial_tx = select(
                literal(value=randint(9999, 99999)).label("id"),
                AccountSA.initial_balance.label("amount"),
                AccountSA.created_at.label("date"),
                literal("Account Creation").label("name"),
                literal("credit").label("entry_type"),
                literal(1).label("category_id"),
                AccountSA.user_id.label("user_id"),
                AccountSA.id.label("account_id"),
                AccountSA.created_at.label("account_created_at"),
                AccountSA.initial_balance.label("initial_balance"),
                AccountSA.currency.label("currency"),
                AccountSA.name.label("account_name"),
                literal("Initial Balance").label("category_name"),
            ).select_from(AccountSA)

            combined_tx = initial_tx.union_all(tx_with_account).subquery()

            tx = alias(combined_tx)

            adjusted_amount: Case[int] = Case(
                (
                    tx.c.entry_type == "credit",
                    tx.c.amount,
                ),  # Credit adds amount
                (
                    tx.c.entry_type == "debit",
                    -tx.c.amount,
                ),  # Debit subtracts amount
                else_=0,
            )
            running_total = (
                func.sum(adjusted_amount)
                .over(
                    partition_by=tx.c.account_id,
                    order_by=tx.c.date,
                    rows=(None, 0),  # UNBOUNDED PRECEDING TO CURRENT ROW
                )
                .label("running_total")
            )

            running_balance = running_total.label("running_balance")

            running_total_cte = select(
                tx.c.amount,
                tx.c.date,
                tx.c.name,
                tx.c.entry_type,
                tx.c.category_id,
                tx.c.user_id,
                tx.c.id,
                tx.c.account_id,
                tx.c.category_name,
                tx.c.account_name,
                tx.c.currency,
                running_balance,
            ).cte("RunningTotal")

            stmt = select(
                running_total_cte.c.id,
                running_total_cte.c.account_id,
                running_total_cte.c.amount,
                running_total_cte.c.category_name,
                running_total_cte.c.entry_type,
                running_total_cte.c.category_id,
                running_total_cte.c.user_id,
                running_total_cte.c.name,
                running_total_cte.c.date,
                running_total_cte.c.account_name,
                running_total_cte.c.currency,
                running_total_cte.c.running_balance,
            ).order_by(running_total_cte.c.date.desc())

            result_tuples = (
                session.execute(stmt, execution_options={"prebuffer_rows": True})
                .mappings()
                .all()
            )

            tx_ids = [r.id for r in result_tuples if isinstance(r.id, int)]

            # Get suggested categories in bulk
            suggested_map: dict[int, list[dict]] = {}
            rows = session.execute(
                select(
                    SuggestedCategory.category_id,
                    SuggestedCategory.transaction_id,
                    CategorySA.name,
                )
                .where(SuggestedCategory.transaction_id.in_(tx_ids))
                .join(
                    CategorySA,
                    SuggestedCategory.category_id == CategorySA.id,
                )
            ).all()

            print(rows)

            suggested_map = defaultdict(list)
            for category_id, transaction_id, name in rows:
                suggested_map[transaction_id].append(
                    {
                        "category_name": name,
                        "category_id": category_id,
                    }
                )

            return [
                TransactionPublic(
                    category_name=transaction_result.category_name,
                    date=transaction_result.date.isoformat() + "Z",
                    category_id=transaction_result.category_id,
                    entry_type=transaction_result.entry_type,
                    id=transaction_result.id,
                    name=transaction_result.name,
                    user_id=transaction_result.user_id,
                    amount=transaction_result.amount,
                    account_id=transaction_result.account_id,
                    account_name=transaction_result.account_name,
                    currency=transaction_result.currency,
                    running_balance=transaction_result.running_balance,
                    suggested_categories=suggested_map.get(transaction_result.id, []),
                )
                for transaction_result in result_tuples
            ]

    def edit_transaction(self, transaction_id: int, values: TransactionEditRequest):
        dict_values = values.model_dump(exclude_none=True)
        with SASession(bind=self.db_service.sa_engine) as session:
            db_transaction: TransactionSA | None = session.get(
                TransactionSA,
                transaction_id,
            )
            if db_transaction is None:
                return None

            for key, value in dict_values.items():
                if key == "category_id":
                    db_category = session.get(CategorySA, value)
                    if db_category is None:
                        return None

                if key == "date":
                    db_transaction.date = datetime.strptime(
                        value,
                        "%Y-%m-%dT%H:%M:%S.%fZ",
                    ).replace(
                        tzinfo=timezone.utc,
                    )
                    continue

                setattr(db_transaction, key, value)

            session.commit()
            session.refresh(db_transaction)
            return db_transaction


def get_transaction_repository(
    db_service: Annotated[
        DatabaseService,
        Depends(get_db_service),
    ],
):
    return TransactionRepository(
        db_service=db_service,
    )
