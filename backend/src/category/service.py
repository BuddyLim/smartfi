from __future__ import annotations

from typing import Annotated

from fastapi import Depends

from src.app_logger.custom_logger import logger
from src.category.model import CategoryCreate, CategoryListCreate, CategorySA
from src.category.repository import CategoryRepository, get_category_repository
from src.common.llm import LLMService, get_llm_service


class CategoryService:
    def __init__(
        self,
        llm_service: LLMService,
        category_repository: CategoryRepository,
    ):
        self.llm_service = llm_service
        self.category_repository = category_repository

    def create_category(
        self,
        category_create_list: list[CategoryCreate],
    ):
        return self.category_repository.create_category(
            category_create_list=category_create_list,
        )

    def get_category_by_id(self, category_id: int):
        return self.category_repository.get_category_by_id(category_id=category_id)

    def get_category_by_lower_cased_name(
        self,
        lower_cased_name: str,
    ) -> CategorySA | None:
        return self.category_repository.get_category_by_lower_cased_name(
            lower_cased_name=lower_cased_name,
        )

    def get_transfer_category_credit(self) -> CategorySA | None:
        return self.category_repository.get_category_by_lower_cased_name_and_entry_type(
            lower_cased_name="transfer",
            entry_type="credit",
        )

    def get_transfer_category_debit(self) -> CategorySA | None:
        return self.category_repository.get_category_by_lower_cased_name_and_entry_type(
            lower_cased_name="transfer",
            entry_type="debit",
        )

    def get_categories_by_lower_cased_name(
        self,
        category_list: list[str],
    ):
        return self.category_repository.get_categories_by_lower_cased_name(
            category_list=category_list,
        )

    def get_category_by_user_id(self):
        return self.category_repository.get_category_by_user_id()

    def __create_category_suggestion_prompt(self, text: str | None):
        return f"""
        1. Create an array of category for a model with {
            list(CategoryCreate.model_fields.keys())
        } for a budget tracking application, suggest up to 7 categories

        {
            f'''
        2. Here is a short summary of the user and create categories tailored to them:
        {text}
        '''
            if text is not None
            else ""
        }
        </instructions>
        """

    def suggest_categories(self, text: str | None):
        prompt = self.__create_category_suggestion_prompt(text)
        logger.info(prompt)
        return self.llm_service.query_llm_with_validator(
            prompt=prompt,
            validator=CategoryListCreate,
        )


def get_category_service(
    category_repository: Annotated[
        CategoryRepository,
        Depends(get_category_repository),
    ],
    llm_service: Annotated[
        LLMService,
        Depends(get_llm_service),
    ],
):
    return CategoryService(
        llm_service=llm_service,
        category_repository=category_repository,
    )
