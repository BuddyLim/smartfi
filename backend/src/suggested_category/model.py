from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, MappedAsDataclass, mapped_column

from src.common.base_model import Base


class SuggestedCategory(MappedAsDataclass, Base):
    __tablename__ = "suggested_category"

    transaction_id: Mapped[int] = mapped_column(
        ForeignKey(
            "transaction.id",
            ondelete="CASCADE",
        ),
        primary_key=True,
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey(
            "category.id",
            ondelete="CASCADE",
        ),
        primary_key=True,
    )
