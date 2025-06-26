from typing import Annotated

from fastapi import Depends

from src.account.model import Account, AccountCreate, AccountPublic
from src.account.repository import AccountRepository, get_account_repository


class AccountService:
    def __init__(self, account_repository: AccountRepository) -> None:
        self.account_repository = account_repository

    def create_account_sa(self, account_create: AccountCreate):
        validated_account = Account.model_validate(
            account_create.model_dump(),
        )
        account = self.account_repository.create_account(
            account=validated_account,
        )
        return AccountPublic(
            currency=account.currency,
            id=account.id,  # type: ignore
            initial_balance=account.initial_balance,
            latest_balance=account.initial_balance,
            name=account.name,
            user_id=account.user_id,
        )

    def get_account_by_user_id(self, user_id: int):
        return self.account_repository.get_account_by_user_id(user_id=user_id)


def get_account_service(
    account_repository: Annotated[
        AccountRepository,
        Depends(get_account_repository),
    ],
):
    return AccountService(account_repository)
