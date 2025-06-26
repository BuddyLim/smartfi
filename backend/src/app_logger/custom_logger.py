import logging
import sys
from pprint import pformat

from colorama import Fore, Style, init

logging.getLogger("boto3").setLevel(logging.CRITICAL)
logging.getLogger("botocore").setLevel(logging.CRITICAL)
logging.getLogger("nose").setLevel(logging.CRITICAL)
logging.getLogger("s3transfer").setLevel(logging.CRITICAL)
logging.getLogger("urllib3").setLevel(logging.CRITICAL)

init(autoreset=True)


# Define a custom logging formatter with colors
class ColoredFormatter(logging.Formatter):
    LEVEL_COLORS = {
        logging.DEBUG: Fore.CYAN,
        logging.INFO: Fore.GREEN,
        logging.WARNING: Fore.YELLOW,
        logging.ERROR: Fore.RED,
        logging.CRITICAL: Fore.RED + Style.BRIGHT,
    }

    def format(self, record: logging.LogRecord):
        level_color = self.LEVEL_COLORS.get(record.levelno, "")
        message = pformat(super().format(record))
        return f"{level_color}{message}{Style.RESET_ALL}"


# Configure the logger
logging.basicConfig(
    level=logging.DEBUG,
    format=pformat("%(asctime)s - %(name)s - %(levelname)s - %(message)s"),
    handlers=[
        logging.StreamHandler(sys.stdout),
    ],
)

# Apply the custom formatter to the root logger
for handler in logging.getLogger().handlers:
    handler.setFormatter(
        ColoredFormatter("[%(asctime)s] [%(name)s] [%(levelname)s] %(message)s")
    )

logger = logging.getLogger("main.app")
