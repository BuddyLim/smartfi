from typing import TypeVar

import instructor
from openai import OpenAI
from openai.types.chat import ChatCompletionMessageParam
from pydantic import BaseModel

from src.app_logger.custom_logger import logger
from src.config import get_settings

config = get_settings()

USE_BEDROCK = config.USE_BEDROCK
USE_GEMINI = config.USE_GEMINI


def get_model_id():
    if USE_BEDROCK:
        return "anthropic.claude-3-haiku-20240307-v1:0"
    if USE_GEMINI:
        return "gemini-2.0-flash-lite"
    return "gemma3:12b"


MODEL_ID = get_model_id()

instructor_client = instructor.from_openai(
    OpenAI(
        base_url="http://localhost:11434/v1",
        api_key="ollama",  # required, but unused
    ),
    mode=instructor.Mode.JSON,
)

client = OpenAI(
    base_url="http://localhost:11434",
    api_key="ollama",  # required, but unused
)

if USE_GEMINI:
    GCP_KEY = config.GCP_KEY

    from google import genai

    client = genai.Client(api_key=GCP_KEY)

    instructor_client = instructor.from_genai(
        client=client,
        mode=instructor.Mode.GENAI_STRUCTURED_OUTPUTS,
    )

if USE_BEDROCK:
    from anthropic import AnthropicBedrock

    AWS_KEY = config.AWS_KEY
    AWS_SECRET_KEY = config.AWS_SECRET_KEY

    instructor_client = instructor.from_anthropic(
        AnthropicBedrock(
            aws_access_key=AWS_KEY,
            aws_secret_key=AWS_SECRET_KEY,
            aws_region="ap-northeast-1",
        )
    )

    client = AnthropicBedrock(
        aws_access_key=AWS_KEY,
        aws_secret_key=AWS_SECRET_KEY,
        aws_region="ap-northeast-1",
    )
T = TypeVar("T", bound=BaseModel)

logger.info("Using client %s and instructor %s", client, instructor_client)


class LLMService:
    """Creates LLM service handler."""

    def __create_llm_message(self, prompt: str) -> list[ChatCompletionMessageParam]:
        return [
            {
                "role": "user",
                "content": prompt,
            },
        ]

    def query_llm_with_validator(self, prompt: str, validator: type[T]) -> T:
        """Return response model from LLM."""
        request_message = self.__create_llm_message(prompt=prompt)
        logger.info(
            "Received prompt of %s",
            prompt,
        )
        return instructor_client.chat.completions.create(
            model=MODEL_ID,
            # max_tokens=2000,
            messages=request_message,
            response_model=validator,
        )

    # def query_llm(self, prompt: str):
    #     try:
    #         # request_message = self.__create_llm_message(prompt=prompt)

    #         response = client.request(
    #             model=MODEL_ID,
    #             max_tokens=2000,
    #             messages=[
    #                 {
    #                     "role": "user",
    #                     "content": prompt,
    #                 }
    #             ],
    #         )

    #         return response
    #     except Exception as e:
    #         logger.error("An error occurred: %s", e.response["Error"]["Message"])  # type: ignore
    #         raise e


def get_llm_service() -> LLMService:
    """Return LLM service handler."""
    return LLMService()
