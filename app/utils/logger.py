import logging
import os
import sys
from logging.handlers import RotatingFileHandler

INVALID_FORMAT = "INVALID_FORMAT"
INVALID_CHECKSUM = "INVALID_CHECKSUM"
MALICIOUS_INPUT = "MALICIOUS_INPUT"
RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
VALIDATION_SUCCESS = "VALIDATION_SUCCESS"

DEFAULT_EXTRA = {
    "client_ip": "-",
    "raw_input": "-",
    "endpoint": "-",
}

LOGGER_NAME = "rut_validator.security"

LOG_FORMAT = (
    "%(asctime)s.%(msecs)03d | %(levelname)-8s | %(name)s | "
    "ip=%(client_ip)s | %(message)s | %(filename)s:%(lineno)d"
)
DATE_FORMAT = "%Y-%m-%dT%H:%M:%S"


def setup_audit_logger() -> logging.Logger:
    logger = logging.getLogger(LOGGER_NAME)

    if logger.handlers:
        return logger

    raw_level = os.environ.get("LOG_LEVEL", "WARNING")
    level = logging.getLevelName(raw_level)
    if not isinstance(level, int):
        level = logging.WARNING
    logger.setLevel(level)

    formatter = logging.Formatter(fmt=LOG_FORMAT, datefmt=DATE_FORMAT)

    audit_log_path = os.environ.get("AUDIT_LOG_PATH", "logs/audit.log")
    log_dir = os.path.dirname(audit_log_path)
    if log_dir:
        os.makedirs(log_dir, exist_ok=True)

    file_handler = RotatingFileHandler(
        filename=audit_log_path,
        mode="a",
        maxBytes=5 * 1024 * 1024,
        backupCount=3,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    flask_env = os.environ.get("FLASK_ENV", "production")
    if flask_env == "development":
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

    logger.propagate = False

    return logger


audit_logger = setup_audit_logger()