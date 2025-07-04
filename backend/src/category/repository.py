from typing import Annotated

from fastapi import Depends
from sqlalchemy import false, or_
from sqlalchemy.orm import Session

from src.category.model import CategoryCreate, CategorySA
from src.common.db import DatabaseService, get_db_service


class CategoryRepository:
    def __init__(self, db_service: DatabaseService) -> None:
        self.db_service = db_service

    def get_category_by_id(self, category_id: int):
        with Session(bind=self.db_service.sa_engine) as session:
            return (
                session.query(CategorySA)
                .where(CategorySA.id == category_id)
                .one_or_none()
            )

    def get_category_by_lower_cased_name(
        self,
        lower_cased_name: str,
    ):
        with Session(bind=self.db_service.sa_engine) as session:
            return (
                session.query(CategorySA)
                .where(
                    CategorySA.lower_cased_name == lower_cased_name,
                )
                .one_or_none()
            )

    def get_category_by_lower_cased_name_and_entry_type(
        self,
        lower_cased_name: str,
        entry_type: str,
    ):
        with Session(bind=self.db_service.sa_engine) as session:
            return (
                session.query(CategorySA)
                .where(
                    CategorySA.lower_cased_name == lower_cased_name,
                    CategorySA.entry_type == entry_type,
                )
                .one_or_none()
            )

    def get_categories_by_lower_cased_name(self, category_list: list[str]):
        with Session(bind=self.db_service.sa_engine) as session:
            return (
                session.query(CategorySA)
                .where(CategorySA.lower_cased_name.in_(category_list))
                .all()
            )

    def create_category(
        self,
        category_create_list: list[CategoryCreate],
    ):
        with Session(bind=self.db_service.sa_engine) as session:
            category_list = [
                CategoryCreate.model_validate(category)
                for category in category_create_list
            ]
            db_category_list = [
                CategorySA(
                    user_id=category.user_id,
                    name=category.name,
                    lower_cased_name=category.name.lower(),
                    entry_type=category.entry_type,
                )
                for category in category_list
            ]

            session.add_all(db_category_list)
            session.commit()

            for row in db_category_list:
                session.refresh(row)

            return db_category_list

    def get_category_by_user_id(self):
        with Session(bind=self.db_service.sa_engine) as session:
            return (
                session.query(CategorySA)
                .where(
                    # CategorySA.entry_type != "unknown",
                    CategorySA.lower_cased_name != "transfer",
                    CategorySA.lower_cased_name != "others",
                )
                .all()
            )


def get_category_repository(
    db_service: Annotated[
        DatabaseService,
        Depends(get_db_service),
    ],
):
    return CategoryRepository(db_service=db_service)
