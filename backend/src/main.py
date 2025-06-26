from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.account.router import router as account
from src.app_logger.custom_logger import logger
from src.category.router import router as category
from src.config import Settings, get_settings
from src.transaction.router import router as transaction
from src.user.router import router as user

logger.info("FastAPI application is starting...")


app = FastAPI(debug=True)
app.include_router(transaction)
app.include_router(category)
app.include_router(account)
app.include_router(user)

origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/info")
async def info(settings: Annotated[Settings, Depends(get_settings)]):
    return settings
