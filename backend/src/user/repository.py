from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from src.common.db import DatabaseService, get_db_service
from src.user.model import UserSA


class UserRepository:
    def __init__(self, db_service: DatabaseService) -> None:
        self.db_service = db_service

    def get_all_users(self):
        with Session(self.db_service.sa_engine) as session:
            return session.query(UserSA).all()

    def create_new_user(self):
        with Session(self.db_service.sa_engine) as session:
            user = (
                UserSA(
                    account=[],
                    category=[],
                ),
            )

            session.add(user)
            session.commit()
            session.refresh(user)

            return user


def get_user_repository(
    db_service: Annotated[
        DatabaseService,
        Depends(get_db_service),
    ],
):
    return UserRepository(
        db_service=db_service,
    )
