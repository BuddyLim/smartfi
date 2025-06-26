from collections.abc import Sequence
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from src.category.model import (
    CategoryCreateRequest,
    CategoryGetRequest,
    CategoryListCreate,
    CategoryPublic,
    CategorySuggestRequest,
)
from src.category.service import CategoryService, get_category_service

router = APIRouter()

CATEGORY_TAG = "category"


@router.post(
    "/category/create",
    response_model=list[CategoryPublic],
    tags=[CATEGORY_TAG],
)
def create_new_category(
    query: CategoryCreateRequest,
    category_service: Annotated[
        CategoryService,
        Depends(get_category_service),
    ],
):
    try:
        category_list = category_service.create_category(
            category_create_list=query.category_create_list,
        )
        return category_list
    except Exception as err:
        raise HTTPException(status_code=500, detail=err)


@router.get(
    "/categories/get",
    response_model=Sequence[CategoryPublic],
    tags=[CATEGORY_TAG],
)
def get_category_by_user_id(
    category_service: Annotated[
        CategoryService,
        Depends(get_category_service),
    ],
):
    try:
        return category_service.get_category_by_user_id()
    except Exception as err:
        raise HTTPException(status_code=500, detail=err)


@router.post(
    "/category/get",
    response_model=CategoryPublic,
    tags=[CATEGORY_TAG],
)
def get_category(
    query: CategoryGetRequest,
    category_service: Annotated[
        CategoryService,
        Depends(get_category_service),
    ],
):
    try:
        return category_service.get_category_by_id(category_id=query.category_id)
    except Exception as err:
        raise HTTPException(status_code=500, detail=err)


@router.post(
    "/category/suggest",
    response_model=CategoryListCreate,
    tags=[CATEGORY_TAG],
)
def suggest_categories(
    query: CategorySuggestRequest,
    category_service: Annotated[
        CategoryService,
        Depends(get_category_service),
    ],
):
    try:
        return category_service.suggest_categories(query.text)
    except Exception as err:
        raise HTTPException(status_code=500, detail=err)
