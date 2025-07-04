from __future__ import annotations

import asyncio
import time
from typing import Annotated

from fastapi import Depends, Request
from pydantic import BaseModel
from redis import Redis

from src.account.model import AccountTransfer
from src.account.service import AccountService, get_account_service
from src.app_logger.custom_logger import logger
from src.category.service import CategoryService, get_category_service
from src.common.llm import LLMService, get_llm_service
from src.redis_client import get_redis_client
from src.transaction.agent import TransactionAgent, get_transaction_agent
from src.transaction.model import (
    EntryType,
    TransactionBankTransfer,
    TransactionCreate,
    TransactionEditRequest,
    TransactionLLMCreate,
    TransactionLLMCreateRequest,
    TransactionSA,
)
from src.transaction.repository import TransactionRepository, get_transaction_repository


class CreateTransactionPrompt(BaseModel):
    """Create transaction DTO."""

    text: str
    category_list: list[str]


class TransactionService:
    """Transaction service handler."""

    def __init__(
        self,
        llm_service: LLMService,
        transaction_repository: TransactionRepository,
        category_service: CategoryService,
        transaction_agent: TransactionAgent,
        redis_client: Redis,
        account_service: AccountService,
    ) -> None:
        """Transaction service init."""
        self.llm_service = llm_service
        self.transaction_repository = transaction_repository
        self.category_service = category_service
        self.transaction_agent = transaction_agent
        self.redis_client = redis_client
        self.account_service = account_service

    def __match_infer_data_with_records(
        self,
        transaction: TransactionLLMCreate,
    ):
        """Return matched inferred data and records from db."""
        return self.category_service.get_category_by_lower_cased_name(
            transaction.category_name,
        )

    def create_transaction(self, transaction: TransactionCreate) -> TransactionSA:
        """Return created transaction."""
        logger.info("Creating transaction of: %s ", transaction.model_dump_json())
        return self.transaction_repository.create_transaction(
            transaction_create=transaction,
        )

    def get_category_transaction_suggestion(
        self,
        query: TransactionLLMCreateRequest,
    ) -> list[int]:
        category_model_list = self.category_service.get_category_by_user_id()

        category_list = [
            category_model.lower_cased_name for category_model in category_model_list
        ]

        category_list = [
            category_name
            for category_name in category_list
            if category_name != "unknown"
        ]

        suggested_list = self.transaction_agent.suggest_category(
            query.text,
            category_list=category_list,
        )
        if suggested_list is None:
            return []

        d_category_list = self.category_service.get_categories_by_lower_cased_name(
            category_list=suggested_list,
        )

        return [category.id for category in d_category_list]

    def infer_and_create_transaction(
        self,
        query: TransactionLLMCreateRequest,
        job_id: str,
    ):
        """Return inferred and created db record from text."""
        category_model_list = self.category_service.get_category_by_user_id()
        category_list = [
            category_model.lower_cased_name for category_model in category_model_list
        ]

        # Fetch accounts for the user and convert to AccountTransfer
        account_records = self.account_service.get_account_by_user_id(query.user_id)
        account_transfer_list = [AccountTransfer(**acc) for acc in account_records]

        transactions = self.transaction_agent.infer_from_text(
            text=query.text,
            category_list=category_list,
            account_list=account_transfer_list,
        )
        channel = f"job:{job_id}"

        for transaction in transactions:
            if isinstance(transaction, TransactionBankTransfer):
                self.handle_bank_transfer(transaction, query, channel)
                continue
            self.handle_standard_transaction(
                transaction,
                query,
                channel,
            )

        self.redis_client.publish(
            channel=channel,
            message="[DONE]",
        )

    def handle_bank_transfer(
        self,
        transaction: TransactionBankTransfer,
        query: TransactionLLMCreateRequest,
        channel: str,
    ):
        # Create debit transaction for bank_from
        debit_transaction = TransactionCreate(
            category_id=self.category_service.get_transfer_category_debit().id,  # type: ignore
            entry_type=EntryType.debit,
            account_id=transaction.bank_from.id,
            user_id=query.user_id,
            name=f"To {transaction.bank_towards.name}",
            amount=transaction.amount,
            date=transaction.date,
            suggested_categories=[],
        )
        db_debit = self.create_transaction(transaction=debit_transaction)
        t_public_debit = self.transaction_repository.get_transaction(
            user_id=query.user_id,
            transaction_id=db_debit.id,
        )
        t_dumped_debit = t_public_debit.model_dump_json()
        self.redis_client.publish(
            channel=channel,
            message=t_dumped_debit,
        )

        # Create credit transaction for bank_towards
        credit_transaction = TransactionCreate(
            category_id=self.category_service.get_transfer_category_credit().id,  # type: ignore
            entry_type=EntryType.credit,
            account_id=transaction.bank_towards.id,
            user_id=query.user_id,
            name=f"From {transaction.bank_from.name}",
            amount=transaction.amount,
            date=transaction.date,
            suggested_categories=[],
        )
        db_credit = self.create_transaction(transaction=credit_transaction)
        t_public_credit = self.transaction_repository.get_transaction(
            user_id=query.user_id,
            transaction_id=db_credit.id,
        )
        t_dumped_credit = t_public_credit.model_dump_json()
        self.redis_client.publish(
            channel=channel,
            message=t_dumped_credit,
        )

    def handle_standard_transaction(
        self,
        transaction: TransactionLLMCreate,
        query: TransactionLLMCreateRequest,
        channel: str,
    ):
        suggested_categories = []
        category = self.__match_infer_data_with_records(transaction)

        if category is None:
            logger.error("Category is none for %s", query.text)
            return

        if category.lower_cased_name == "unknown":
            logger.debug("Category is none!")
            suggested_categories = self.get_category_transaction_suggestion(
                query=query,
            )

        create_transaction = TransactionCreate(
            category_id=category.id,  # type: ignore
            entry_type=category.entry_type,
            account_id=query.account_id,
            user_id=query.user_id,
            name=transaction.name,
            amount=transaction.amount,
            date=transaction.date,
            suggested_categories=suggested_categories,
        )

        db_t = self.create_transaction(transaction=create_transaction)

        t_public = self.transaction_repository.get_transaction(
            user_id=query.user_id,
            transaction_id=db_t.id,
        )
        t_dumped = t_public.model_dump_json()

        self.redis_client.publish(
            channel=channel,
            message=t_dumped,
        )

    async def get_transaction_progress(self, request: Request, job_id: str):
        pub_sub = self.redis_client.pubsub()

        channel = f"job:{job_id}"

        pub_sub.subscribe(channel)

        try:
            while True:
                message = pub_sub.get_message()

                if message:
                    if message["type"] != "message":
                        continue

                    data = message["data"]

                    if data == "[DONE]":
                        yield "event: message\ndata: done\n\n"
                        continue

                    yield f"event: message\ndata: {data}\n\n"

                    if await request.is_disconnected():
                        break
                await asyncio.sleep(0.001)  # be nice to the system :)

        finally:
            pub_sub.unsubscribe(channel)
            pub_sub.close()

    def get_transactions(
        self,
        transaction_id: int | None,
        user_id: int,
    ):
        return self.transaction_repository.get_transactions(user_id=user_id)

    def edit_transaction(
        self,
        transaction_id: int,
        values: TransactionEditRequest,
    ):
        return self.transaction_repository.edit_transaction(
            transaction_id=transaction_id,
            values=values,
        )

    # def delete_transaction(self, transaction_id: int) -> Literal[True]:
    #     """Return flag for deleted transaction."""
    #     stmt = select(TransactionSA).where(TransactionSA.id == transaction_id)
    #     result = self.db_service.execute_statement_sa(stmt)

    #     transaction = result.scalar_one_or_none()
    #     # self.db_service.delete_row(transaction)

    #     # return True


def get_transaction_service(
    llm_service: Annotated[
        LLMService,
        Depends(get_llm_service),
    ],
    transaction_repository: Annotated[
        TransactionRepository,
        Depends(get_transaction_repository),
    ],
    category_service: Annotated[
        CategoryService,
        Depends(get_category_service),
    ],
    account_service: Annotated[
        CategoryService,
        Depends(get_account_service),
    ],
    transaction_agent: Annotated[
        TransactionAgent,
        Depends(get_transaction_agent),
    ],
    redis_client: Annotated[
        Redis,
        Depends(get_redis_client),
    ],
) -> TransactionService:
    """Return Transaction service instance."""

    return TransactionService(
        transaction_repository=transaction_repository,
        category_service=category_service,
        llm_service=llm_service,
        transaction_agent=transaction_agent,
        redis_client=redis_client,
        account_service=account_service,
    )
