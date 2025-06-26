from __future__ import annotations

import logging
from typing import Any, TypeVar

from sqlalchemy import MetaData
from sqlalchemy import (
    create_engine as sa_create_engine,
)
from sqlalchemy.orm import Session as SASession

from src.common.base_model import Base, get_base

BASE = get_base()


logger = logging.getLogger("main.app")

metadata = MetaData()

S = TypeVar("S", bound=Base)


class DatabaseService:
    def __init__(self, path: str) -> None:
        self.db_path = path
        self.sa_engine = sa_create_engine(self.db_path, echo=True)
        self.__perform_check()

    def execute_statement_sa(
        self,
        stmt: Any,
    ) -> Any:
        with SASession(bind=self.sa_engine) as session:
            return session.execute(stmt, execution_options={"prebuffer_rows": True})

    def add_new_row_sa(self, new_row: S) -> S:
        with SASession(bind=self.sa_engine) as session:
            session.add(new_row)
            session.commit()
            session.refresh(new_row)
            return new_row

    def add_multiple_row_sa(self, new_row_list: list[S]) -> list[S]:
        with SASession(bind=self.sa_engine) as session:
            session.add_all(new_row_list)
            session.commit()
            logger.info("Succesfully inserted bulk records")

            for row in new_row_list:
                session.refresh(row)

            return new_row_list

    def __perform_check(self):
        self.__init_db()

        logger.info("Successfully init db")

    def __init_sqlalchemy(self):
        BASE.metadata.create_all(self.sa_engine)

    def __init_db(self):
        self.__init_sqlalchemy()


DB_PATH = "sqlite:///database.db"
db_service = DatabaseService(DB_PATH)


def get_db_service():
    return db_service
