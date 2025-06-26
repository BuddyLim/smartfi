from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from src.user.model import UserPublic
from src.user.service import UserService, get_user_service

router = APIRouter()

USER_TAG = "user"


@router.post("/user/create", response_model=UserPublic, tags=[USER_TAG])
def create_new_user(
    user_service: Annotated[
        UserService,
        Depends(get_user_service),
    ],
):
    try:
        return user_service.create_new_user()
    except Exception as err:
        raise HTTPException(status_code=500, detail=err)


@router.post("/user/get", response_model=list[UserPublic], tags=[USER_TAG])
def get_all_users(
    user_service: Annotated[
        UserService,
        Depends(get_user_service),
    ],
):
    try:
        return user_service.get_all_users()
    except Exception as err:
        raise HTTPException(status_code=500, detail=err)
