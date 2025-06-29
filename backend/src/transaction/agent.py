# from __future__ import annotations # This breaks type hinting for agents!
import json
from datetime import datetime, timezone

from google import genai
from google.genai import types

from src.app_logger.custom_logger import logger
from src.config import get_settings
from src.transaction.model import (
    TransactionLLMCreate,
)

config = get_settings()
GCP_KEY = config.GCP_KEY


def call_function(function_call, functions):
    function_name = function_call.name
    function_args = function_call.args
    # Find the function object from the list based on the function name
    for func in functions:
        if func.__name__ == function_name:
            return func(**function_args)
    return None


class TransactionAgent:
    def __init__(self) -> None:
        self.client = genai.Client(api_key=GCP_KEY)
        self.automatic_function_calling = types.AutomaticFunctionCallingConfig(
            disable=True,
        )
        self.tool_config = types.ToolConfig(
            function_calling_config=types.FunctionCallingConfig(
                mode=types.FunctionCallingConfigMode.ANY,
            ),
        )

    def __format_text(self, text: str):
        resp = self.client.models.generate_content(
            model="gemini-2.0-flash-lite",
            contents=[text],
            config=types.GenerateContentConfig(
                temperature=0,
                system_instruction="""
                Your task is to convert this text into an JSON array of text without any markdown.
                Group the relevant text into its own element ex: Lunch $5 Yesterday is an element
                You should NOT provide any introductory text or explanations.
                """,
            ),
        )

        return resp.text

    def __infer_from_text_config(self, category_list: list[str]):
        today = datetime.now(tz=timezone.utc).date()
        long_today = today.strftime("%Y-%m-%d")
        today_name = today.strftime("%A")

        tools: types.ToolListUnion = [self.create_transaction_from_text]

        return types.GenerateContentConfig(
            tools=tools,
            tool_config=self.tool_config,
            automatic_function_calling=self.automatic_function_calling,
            temperature=0,
            system_instruction=f"""
            <role>
                You are an autonomous financial data processing agent.
            Your task is to analyze financial input strings and extract relevant information.
            </role>

            <tools>
                You have access to the following two tools:
                Tool 1: {self.create_transaction_from_text.__name__}:
                This tool extracts information from simple financial transaction strings (e.g., "Groceries $50").
                It outputs data in JSON format, with fields for category_name, amount, name, and date. Use this list,
                {category_list} to help derive the category.
                If you really do not and *ABSOULUTELY* unable to figure out the category, assign 'unknown' to it.
            </tools>

            <objective>
                Your Goal: Given any input string, you must determine the correct tool to use.
            Use the appropriate tool to process the input and output ONLY the resulting JSON object.
            You should NOT provide any introductory text or explanations.
            If the input seems to be a bank transfer, use Tool 2. If it appears to be a
            basic financial transaction, use Tool 1.
            </objective>

            <additional-requirements>
            Today is {long_today} which is a {today_name} in YYYY-MM-DD,
            convert any human readable dates to YYYY-MM-DD format.
            If no date is provided, assume it is today.

            The text may contain more than one financial data
            Maintain the name casing and isolate each transaction dates
            </additional-requirements>
            """,
        )

    def infer_from_text(
        self,
        text: str,
        category_list: list[str],
    ):
        formatted_text = self.__format_text(text=text)

        resp_list = []

        agent_config = self.__infer_from_text_config(category_list=category_list)

        response = self.client.models.generate_content_stream(
            model="gemini-2.0-flash",
            contents=[f"<transaction>{formatted_text}</transaction>"],
            config=agent_config,
        )

        chunk = response.__next__()

        if chunk.candidates[0].content.parts is None:
            return

        for part in chunk.candidates[0].content.parts:
            if part.function_call:
                res = call_function(
                    part.function_call,
                    agent_config.tools,
                )

                logger.debug(res)
                resp_list.append(res)

        yield from resp_list

    def create_transaction_from_text(
        self,
        name: str,
        amount: float,
        category_name: str,
        date: str,
    ):
        """Create a transaction based on the input text.

        <format>
        Args:
            date: Extract date into YYYY-MM-DD format. If only a time period (e.g., 'last year', 'this month') is provided,
            adjust the dates based on context (e.g., 'last year'). If no date is provided, assume it is today which is today.
            Favour past dates unless specified
            name: Name of transaction
            amount: Transaction amount that is within the text and may contain PEMDAS operations.
            category_name: category name of the transaction
        Returns:
            A dictionary containing the transaction.
        </format>

        """
        return TransactionLLMCreate(
            name=name,
            amount=amount,
            date=date,
            category_name=category_name,
        )

    def suggest_category(self, text: str, category_list: list[str]) -> None | list[str]:
        resp = self.client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[text],
            config=types.GenerateContentConfig(
                temperature=0.5,
                system_instruction=f"""
                You seem to have forgotten to categorize this transaction. Based on the following category list,
                please suggest 3 possible categories for this transaction, ordered from most likely to least likely:

                Category list:
                {category_list}

                You should NOT provide any introductory text or explanations.
                Please ignore `unknown` category
                Return your response in an JSON array of strings
                """,
            ),
        )

        if resp.text is None:
            return None

        try:
            return json.loads(resp.text)
        except json.JSONDecodeError as err:
            logger.exception(err)
            return None


def get_transaction_agent():
    return TransactionAgent()
