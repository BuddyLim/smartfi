from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Annotated, Any, Optional

from pydantic import BaseModel
from pydantic.functional_validators import AfterValidator
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, MappedAsDataclass, mapped_column, relationship
from sqlalchemy.sql import func

from src.common.base_model import Base
from src.suggested_category.model import SuggestedCategory
from src.utils import val_date

yyyymmdd = Annotated[str, AfterValidator(val_date)]


class EntryType(str, Enum):
    credit = "credit"
    debit = "debit"
    unknown = "unknown"


class BaseTransactionGetRequest(BaseModel):
    user_id: int


class TransactionGetByIDRequest(BaseTransactionGetRequest):
    transaction_id: Optional[int]


class TransactionGetByUserIDRequest(BaseTransactionGetRequest):
    pass


class TransactionLLMCreateRequest(BaseModel):
    text: str
    account_id: int
    user_id: int


class TransactionEditRequest(BaseModel):
    category_id: Optional[int] = None
    account_id: Optional[int] = None
    date: Optional[str] = None
    name: Optional[str] = None
    amount: Optional[float] = None


class TransactionBase(BaseModel):
    name: str
    amount: float
    # date: yyyymmdd


class TransactionLLMCreate(TransactionBase):
    category_name: str
    date: yyyymmdd


class TransactionCreate(TransactionBase):
    category_id: int
    account_id: int
    user_id: int
    entry_type: EntryType
    date: yyyymmdd
    suggested_categories: list[int]


class TransactionCreateTool(TransactionBase):
    date: yyyymmdd


class TransactionResult(TransactionBase):
    id: int
    category_id: int
    account_id: int
    user_id: int
    entry_type: EntryType
    date: datetime
    category_name: str
    account_name: str
    currency: str
    running_balance: float


class TransactionPublic(TransactionBase):
    id: int
    category_id: int
    account_id: int
    user_id: int
    entry_type: EntryType
    date: str
    category_name: str
    account_name: str
    currency: str
    running_balance: float
    suggested_categories: Optional[list[dict]]


class StatsDurationBase(BaseModel):
    date: str
    amount: float


class ExpenseStatsDurationPublic(StatsDurationBase):
    pass


class NetWorthStatsDurationPublic(StatsDurationBase):
    pass


class TransactionSA(MappedAsDataclass, Base):
    """Transaction table."""

    __tablename__ = "transaction"

    id = Column(Integer, primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("category.id"))
    account_id: Mapped[int] = mapped_column(ForeignKey("account.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    name: Mapped[str] = mapped_column(String(30))
    entry_type: Mapped[str] = mapped_column(String(length=10))
    amount: Mapped[float] = mapped_column(Numeric(2))
    date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    suggested_categories: Mapped[list["CategorySA"]] = relationship(
        lazy="subquery",
        secondary=SuggestedCategory.__table__,
        back_populates="suggested_for_transaction",
    )
