import datetime as dt

from pydantic import BaseModel
from pydantic_extra_types.currency_code import ISO4217
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, MappedAsDataclass, mapped_column

from src.common.base_model import Base


class AccountRequest(BaseModel):
    user_id: int


class AccountBase(BaseModel):
    name: str
    initial_balance: float
    currency: ISO4217
    user_id: int


class AccountTransfer(BaseModel):
    name: str
    id: int


class AccountCreate(AccountBase):
    pass


class AccountPublic(AccountBase):
    id: int
    latest_balance: float


class Account(AccountBase):
    pass


class AccountSA(MappedAsDataclass, Base):
    __tablename__ = "account"

    id = Column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(30))
    initial_balance: Mapped[float] = mapped_column(Numeric(2))
    currency: Mapped[ISO4217] = mapped_column(String(3))
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    # https://github.com/sqlalchemy/sqlalchemy/discussions/11372
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(), default_factory=lambda: dt.datetime.now(dt.UTC)
    )

    def __repr__(self):
        return f"<Account(id='{self.id}', created_at='{self.created_at}')>"
