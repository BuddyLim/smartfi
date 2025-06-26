from __future__ import annotations

from pydantic import BaseModel
from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, MappedAsDataclass, mapped_column, relationship
from sqlmodel import SQLModel  # type: ignore

from src.common.base_model import Base
from src.suggested_category.model import SuggestedCategory
from src.transaction.model import EntryType
from typing import List


class CategorySuggestRequest(BaseModel):
    text: str | None


class CategoryGetRequest(BaseModel):
    category_id: int


class SubCategoryBase(BaseModel):
    sub_category_name: str


class CategoryBase(BaseModel):
    name: str


class CategoryCreate(CategoryBase):
    entry_type: EntryType
    user_id: int


class CategoryCreateRequest(BaseModel):
    category_create_list: list[CategoryCreate]


class CategoryListCreate(SQLModel):
    category_list: list[CategoryCreate]


class CategoryPublic(CategoryBase):
    id: int
    entry_type: EntryType


class CategorySA(MappedAsDataclass, Base):
    __tablename__ = "category"

    id = Column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    name: Mapped[str] = mapped_column(String(30))
    lower_cased_name: Mapped[str] = mapped_column(String(30))
    entry_type: Mapped[EntryType] = mapped_column(String(length=6))

    suggested_for_transaction: Mapped[List["TransactionSA"]] = relationship(
        lazy="subquery",
        secondary=SuggestedCategory.__table__,
        back_populates="suggested_categories",
    )
