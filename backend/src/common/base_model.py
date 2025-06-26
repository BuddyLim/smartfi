from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    metadata = MetaData(
        naming_convention={
            "ix": "ix_%(column_0_label)s",
            "uq": "uq_%(table_name)s_%(column_0_name)s",
            "ck": "ck_%(table_name)s_`%(constraint_name)s`",
            "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
            "pk": "pk_%(table_name)s",
        }
    )


def get_base():
    from src.account.model import AccountSA
    from src.category.model import CategorySA
    from src.transaction.model import EntryType, TransactionSA
    from src.user.model import UserSA
    from src.suggested_category.model import SuggestedCategory

    return Base
