from __future__ import annotations

from collections.abc import Sequence
from sqlite3 import DatabaseError
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse

from src.app_logger.custom_logger import logger
from src.common.stats import DurationModel, StatsService, get_stats_service
from src.transaction.model import (
    ExpenseStatsDurationPublic,
    NetWorthStatsDurationPublic,
    TransactionCreate,
    TransactionDeleteRequest,
    TransactionEditRequest,
    TransactionGetByIDRequest,
    TransactionGetByUserIDRequest,
    TransactionLLMCreateRequest,
    TransactionPublic,
)
from src.transaction.service import TransactionService, get_transaction_service

router = APIRouter()

TRANSACTION_TAG = "transaction"


@router.post(
    "/transactions/get",
    response_model=Sequence[TransactionPublic],
    tags=[TRANSACTION_TAG],
)
def get_all_transactions(
    query: TransactionGetByUserIDRequest,
    transaction_service: Annotated[
        TransactionService,
        Depends(get_transaction_service),
    ],
):
    try:
        resp = transaction_service.get_transactions(
            transaction_id=None,
            user_id=query.user_id,
        )
        return resp
    except Exception as err:
        logger.exception(JSONResponse(err))
        return HTTPException(status_code=500, detail=JSONResponse(err))


@router.post(
    "/transaction/get",
    response_model=TransactionPublic,
    tags=[TRANSACTION_TAG],
)
def get_transaction(
    query: TransactionGetByIDRequest,
    transaction_service: Annotated[
        TransactionService,
        Depends(get_transaction_service),
    ],
) -> Sequence[TransactionPublic] | HTTPException:
    try:
        return transaction_service.get_transactions(
            transaction_id=query.transaction_id,
            user_id=query.user_id,
        )

    except Exception as err:
        logger.exception(JSONResponse(err))
        return HTTPException(status_code=500, detail=JSONResponse(err))


@router.post(
    "/transaction/create-by-text",
    tags=[TRANSACTION_TAG],
)
async def create_transaction_by_text(
    query: TransactionLLMCreateRequest,
    transaction_service: Annotated[
        TransactionService,
        Depends(get_transaction_service),
    ],
    background_tasks: BackgroundTasks,
):
    try:
        job_id = str(uuid4())
        background_tasks.add_task(
            transaction_service.infer_and_create_transaction,
            query,
            job_id,
        )
        return {"job_id": job_id}
    except Exception as err:
        logger.exception(JSONResponse(err))
        return HTTPException(status_code=500, detail=JSONResponse(err))


@router.get(
    "/transaction/stream/{job_id}",
    tags=[TRANSACTION_TAG],
)
async def get_transaction_stream(
    job_id: str,
    request: Request,
    transaction_service: Annotated[
        TransactionService,
        Depends(get_transaction_service),
    ],
):
    return StreamingResponse(
        transaction_service.get_transaction_progress(
            request=request,
            job_id=job_id,
        ),
        headers={
            "Cache-Control": "no-cache",
            "Content-Type": "text/event-stream",
            "Connection": "keep-alive",
        },
    )


@router.patch(
    "/transaction/edit/{transaction_id}",
    tags=[TRANSACTION_TAG],
)
def edit_transaction(
    transaction_id: int,
    query: TransactionEditRequest,
    transaction_service: Annotated[
        TransactionService,
        Depends(get_transaction_service),
    ],
):
    try:
        return transaction_service.edit_transaction(
            transaction_id=transaction_id,
            values=query,
        )
    except Exception as err:
        logger.exception(JSONResponse(err))
        return HTTPException(status_code=500, detail=JSONResponse(err))


@router.post(
    "/transaction/create",
    response_model=TransactionPublic,
    tags=[TRANSACTION_TAG],
)
def create_transactions(
    query: TransactionCreate,
    transaction_service: Annotated[
        TransactionService, Depends(get_transaction_service)
    ],
):
    try:
        transaction = transaction_service.create_transaction(transaction=query)
        return transaction
    except Exception as err:
        raise HTTPException(status_code=500, detail=err)


@router.delete(
    "/transaction/delete",
    tags=[TRANSACTION_TAG],
)
def delete_transaction(
    query: TransactionDeleteRequest,
    transaction_service: Annotated[
        TransactionService,
        Depends(get_transaction_service),
    ],
):
    """Delete a transaction by ID.

    Args:
        query: Contains transaction_id and user_id for deletion

    Returns:
        Success message if transaction was deleted

    Raises:
        HTTPException: If transaction not found or doesn't belong to user
    """
    try:
        success = transaction_service.delete_transaction(
            transaction_id=query.transaction_id,
            user_id=query.user_id,
        )
        if success:
            return {"message": "Transaction deleted successfully"}

        raise HTTPException(status_code=404, detail="Transaction not found")
    except DatabaseError as err:
        logger.exception("Database error deleting transaction: %s", err)
        raise HTTPException(
            status_code=404,
            detail="Transaction not found or access denied",
        )
    except Exception as err:
        logger.exception("Error deleting transaction: %s", err)
        raise HTTPException(status_code=500, detail=str(err))


@router.post(
    "/stats/expenses/get",
    tags=["stats"],
    response_model=list[ExpenseStatsDurationPublic],
)
def get_expenses_over_duration(
    query: DurationModel,
    stats_service: Annotated[StatsService, Depends(get_stats_service)],
):
    return stats_service.get_expenses_over_duration(query)


@router.get(
    "/stats/expenses/glance",
    tags=["stats"],
    # response_model=list[ExpenseStatsDurationPublic],
)
def get_average_expenses_at_a_glance(
    # query: DurationModel,
    stats_service: Annotated[StatsService, Depends(get_stats_service)],
):
    return stats_service.average_expenses_at_a_glance()


@router.post(
    "/stats/net-worth/get",
    tags=["stats"],
    response_model=list[NetWorthStatsDurationPublic],
)
def get_net_worth_over_duration(
    query: DurationModel,
    stats_service: Annotated[StatsService, Depends(get_stats_service)],
):
    return stats_service.get_net_worth_over_duration(query)


@router.post(
    "/stats/category/get",
    tags=["stats"],
    # response_model=list[NetWorthStatsDurationPublic],
)
def get_category_spent_over_duration(
    # query: DurationModel,
    stats_service: Annotated[StatsService, Depends(get_stats_service)],
):
    return stats_service.get_category_spent_over_duration()


@router.post(
    "/stats/account/get",
    tags=["stats"],
    # response_model=list[NetWorthStatsDurationPublic],
)
def get_account_balance_at_a_glance(
    # query: DurationModel,
    stats_service: Annotated[StatsService, Depends(get_stats_service)],
):
    return stats_service.account_balance_at_a_glance()


# @router.post(
#     "/transaction/edit", response_model=TransactionPublic, tags=[TRANSACTION_TAG]
# )
# def edit_transaction(
#     query: TransactionEditRequest,
#     transaction_service: Annotated[
#         TransactionService, Depends(get_transaction_service)
#     ],
# ):
#     try:
#         transaction = transaction_service.infer_and_create_transaction(text=query.text)
#         logger.info(transaction)
#         return transaction
#     except Exception as err:
#         raise HTTPException(status_code=500, detail=err)
