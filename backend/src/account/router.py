from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

from src.account.model import AccountCreate, AccountPublic, AccountRequest
from src.account.service import AccountService, get_account_service
from src.app_logger.custom_logger import logger

router = APIRouter()

ACCOUNT_TAG = "accounts"


@router.post(
    "/account/create",
    response_model=AccountPublic,
    tags=[ACCOUNT_TAG],
)
def create_new_account(
    query: AccountCreate,
    account_service: Annotated[AccountService, Depends(get_account_service)],
):
    try:
        return account_service.create_account_sa(account_create=query)
    except Exception as err:
        return HTTPException(status_code=500, detail=JSONResponse(err))


@router.post(
    "/accounts/get",
    response_model=list[AccountPublic],
    tags=[ACCOUNT_TAG],
)
def get_account_by_user_id(
    query: AccountRequest,
    account_service: Annotated[AccountService, Depends(get_account_service)],
):
    try:
        return account_service.get_account_by_user_id(query.user_id)
    except Exception as err:
        logger.error(JSONResponse(err))
        return HTTPException(status_code=500, detail=JSONResponse(err))
