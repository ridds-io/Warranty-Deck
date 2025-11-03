"""
Command-line interface for receipt OCR.
"""
import sys
import json
import logging
import argparse
from pathlib import Path
from typing import List

from receipt_ocr.logging_utils import setup_logging
from receipt_ocr.ocr_engine import run_ocr
from receipt_ocr.receipt_parser import parse_receipt

logger = logging.getLogger(__name__)


def process_file(
    file_path: str,
    language: str,
    min_confidence: float,
    page_limit: int,
    return_text: bool,
    return_blocks: bool
) -> dict:
    """
    Process a single file and return JSON response.
    """
    file_path_obj = Path(file_path)
    if not file_path_obj.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    file_size = file_path_obj.stat().st_size
    logger.info(f"Processing file: {file_path} ({file_size} bytes)")

    # Run OCR
    ocr_output = run_ocr(
        file_path=file_path,
        min_confidence=min_confidence,
        page_limit=page_limit,
        return_blocks=return_blocks
    )

    # Parse receipt
    receipt_response = parse_receipt(
        ocr_output=ocr_output,
        filename=file_path_obj.name,
        file_size=file_size,
        language=language,
        min_confidence=min_confidence,
        return_text=return_text
    )

    # Convert to dict
    return receipt_response.model_dump(mode="json")


def main():
    parser = argparse.ArgumentParser(
        description="Receipt OCR using docTR - extracts structured data from images and PDFs"
    )
    parser.add_argument(
        "files",
        nargs="+",
        help="One or more image or PDF files to process"
    )
    parser.add_argument(
        "--language",
        default="en",
        help="OCR language code (default: en)"
    )
    parser.add_argument(
        "--min-confidence",
        type=float,
        default=0.3,
        help="Minimum word confidence threshold (default: 0.3)"
    )
    parser.add_argument(
        "--page-limit",
        type=int,
        default=10,
        help="Maximum pages to process for PDFs (default: 10)"
    )
    parser.add_argument(
        "--return-text",
        action="store_true",
        help="Include full OCR text in response"
    )
    parser.add_argument(
        "--return-blocks",
        action="store_true",
        help="Include structured OCR blocks in response"
    )
    parser.add_argument(
        "--output",
        help="Output JSON file path (default: stdout)"
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Logging level (default: INFO)"
    )

    args = parser.parse_args()

    # Setup logging
    log_level = getattr(logging, args.log_level)
    job_id = setup_logging(level=log_level)

    results = []
    errors = []

    for file_path in args.files:
        try:
            result = process_file(
                file_path=file_path,
                language=args.language,
                min_confidence=args.min_confidence,
                page_limit=args.page_limit,
                return_text=args.return_text,
                return_blocks=args.return_blocks
            )
            results.append(result)
            logger.info(f"Successfully processed: {file_path}")
        except Exception as e:
            logger.error(f"Failed to process {file_path}: {e}", exc_info=True)
            errors.append({"file": file_path, "error": str(e)})

    # Prepare output
    if len(results) == 1 and not errors:
        output = results[0]
    else:
        output = {
            "job_id": job_id,
            "results": results,
            "errors": errors,
            "summary": {
                "total_files": len(args.files),
                "successful": len(results),
                "failed": len(errors)
            }
        }

    # Write output
    output_json = json.dumps(output, indent=2, default=str)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output_json)
        logger.info(f"Output written to: {args.output}")
    else:
        print(output_json)

    # Exit with error code if any failures
    if errors:
        logger.warning(f"{len(errors)} file(s) failed to process.")
        sys.exit(1)

    logger.info("Processing complete.")
    sys.exit(0)


if __name__ == "__main__":
    main()
