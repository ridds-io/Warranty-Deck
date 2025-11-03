"""
Logging configuration with job_id tracking and file output.
"""
import os
import uuid
import logging
from pathlib import Path
from logging.handlers import RotatingFileHandler


def setup_logging(log_dir: str = "logs", log_file: str = "ocr.log", level: int = logging.INFO) -> str:
    """
    Configure logging to console and rotating file.
    Returns a unique job_id for this run.
    """
    job_id = str(uuid.uuid4())

    # Create logs directory
    Path(log_dir).mkdir(exist_ok=True)
    log_path = Path(log_dir) / log_file

    # Root logger
    logger = logging.getLogger()
    logger.setLevel(level)

    # Clear existing handlers
    logger.handlers.clear()

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(level)
    console_format = logging.Formatter(
        f"[%(asctime)s] [JOB:{job_id[:8]}] [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    console_handler.setFormatter(console_format)
    logger.addHandler(console_handler)

    # File handler with rotation (10MB max, 5 backups)
    file_handler = RotatingFileHandler(
        log_path, maxBytes=10 * 1024 * 1024, backupCount=5, encoding="utf-8"
    )
    file_handler.setLevel(level)
    file_format = logging.Formatter(
        f"[%(asctime)s] [JOB:{job_id}] [%(name)s] [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    file_handler.setFormatter(file_format)
    logger.addHandler(file_handler)

    logger.info(f"Logging initialized. Job ID: {job_id}")
    return job_id
