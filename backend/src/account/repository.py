from typing import Annotated

from fastapi import Depends
from sqlalchemy import Case, func, select
from sqlalchemy.orm import Session

from src.account.model import Account, AccountSA
from src.common.db import DatabaseService, get_db_service
from src.transaction.model import TransactionSA


class AccountRepository:
    def __init__(self, db_service: DatabaseService) -> None:
        self.db_service = db_service

    def create_account(self, account: Account):
        with Session(bind=self.db_service.sa_engine) as session:
            db_account = AccountSA(
                user_id=account.user_id,
                currency=account.currency,
                initial_balance=account.initial_balance,
                name=account.name,
            )
            session.add(db_account)
            session.commit()
            session.refresh(db_account)

            return db_account

    def get_account_by_user_id(self, user_id: int):
        with Session(bind=self.db_service.sa_engine) as session:
            transaction_case: Case[float] = Case(
                (
                    TransactionSA.entry_type == "credit",
                    TransactionSA.amount,
                ),
                (
                    TransactionSA.entry_type == "debit",
                    -TransactionSA.amount,
                ),
                else_=0,
            )

            stmt = (
                select(
                    AccountSA.id,
                    AccountSA.name,
                    AccountSA.currency,
                    AccountSA.initial_balance,
                    AccountSA.user_id,
                    (
                        AccountSA.initial_balance
                        + func.coalesce(
                            transaction_case,
                            0,
                        )
                    ).label("latest_balance"),
                )
                .where(AccountSA.user_id == user_id)
                .outerjoin(TransactionSA, AccountSA.id == TransactionSA.account_id)
                .group_by(AccountSA.id, AccountSA.name, AccountSA.initial_balance)
            )

            return session.execute(stmt).mappings().all()


def get_account_repository(
    db_service: Annotated[
        DatabaseService,
        Depends(get_db_service),
    ],
):
    return AccountRepository(
        db_service=db_service,
    )
