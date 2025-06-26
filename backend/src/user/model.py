import datetime as dt
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, MetaData
from sqlalchemy.orm import Mapped, MappedAsDataclass, mapped_column, relationship
from sqlmodel import Field, SQLModel  # type: ignore

from src.common.base_model import Base

metadata_obj = MetaData()


if TYPE_CHECKING:
    from src.account.model import AccountSA
    from src.category.model import CategorySA


class UserBase(SQLModel):
    pass


class UserCreate(BaseModel):
    pass


class UserPublic(UserBase):
    id: int
    created_at: datetime


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: str = Field(default=datetime.now(timezone.utc).isoformat())


class UserSA(MappedAsDataclass, Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True)
    account: Mapped[list["AccountSA"]] = relationship()
    category: Mapped[list["CategorySA"]] = relationship()
    # https://github.com/sqlalchemy/sqlalchemy/discussions/11372
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(), default_factory=lambda: dt.datetime.now(dt.UTC)
    )

    def __repr__(self):
        return f"<User(id='{self.id}', created_at='{self.created_at}')>"
