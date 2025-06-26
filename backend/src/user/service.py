from fastapi import Depends

from src.user.repository import UserRepository, get_user_repository


class UserService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    def get_all_users(self):
        return self.user_repository.get_all_users()

    def create_new_user(self):
        return self.user_repository.create_new_user()


def get_user_service(
    user_repository: UserRepository = Depends(get_user_repository),
):
    return UserService(user_repository=user_repository)
