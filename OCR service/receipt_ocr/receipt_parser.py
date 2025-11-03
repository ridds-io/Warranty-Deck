"""
Heuristic parser to extract structured receipt data from OCR text.
"""
import re
import uuid
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path

from receipt_ocr.schemas import (
    ReceiptResponse, Receipt, ReceiptItem, StoreModel, UploadHistory, OCRMeta
)

logger = logging.getLogger(__name__)

# Regex patterns
# Capture receipt/invoice number following labels like "Receipt No:", "Invoice #", etc.
# Avoid capturing the label token (e.g., "No").
RECEIPT_NO_PATTERN = re.compile(
    r"(?ix)\b(?:receipt|invoice|bill|txn|trans|order)\s*"
    r"(?:no\.?|num(?:ber)?|id)?\s*"  # optional label tokens
    r"[:#\-]?\s*"
    r"([A-Z0-9][A-Z0-9\-]+)\b"
)
DATE_PATTERNS = [
    re.compile(r"\b(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})\b"),  # DD/MM/YYYY or MM/DD/YYYY
    re.compile(r"\b(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})\b"),    # YYYY-MM-DD
    re.compile(r"\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})\b", re.I),
]
CURRENCY_SYMBOLS = {
    "$": "USD", "€": "EUR", "£": "GBP", "₹": "INR", "¥": "JPY", "₱": "PHP"
}
PAYMENT_METHODS = [
    "visa", "mastercard", "amex", "rupay", "upi", "cash", "debit", "credit", "card"
]


def extract_store_info(lines: List[str]) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Extract store name, address, and website from header lines.
    Typically the first few lines contain store name (often uppercase or title case),
    followed by address, and optionally a URL.
    """
    store_name = None
    address_parts = []
    website = None

    # Keywords that indicate a store name
    store_keywords = ["store", "mart", "shop", "supermarket", "electronics", "retail", "market"]

    for i, line in enumerate(lines[:10]):  # Check first 10 lines
        line_clean = line.strip()
        if not line_clean:
            continue

        # Detect URL
        if re.search(r"www\.|\.com|\.org|\.net|https?://", line_clean, re.I):
            website = line_clean
            continue

        # Heuristic: store name is often in uppercase or has store keywords
        upper_ratio = sum(c.isupper() for c in line_clean) / max(len(line_clean), 1)
        has_keyword = any(kw in line_clean.lower() for kw in store_keywords)

        if (upper_ratio > 0.5 or has_keyword) and not store_name:
            store_name = line_clean
        elif store_name and len(address_parts) < 3:
            # Next lines after store name are likely address
            address_parts.append(line_clean)

    address = ", ".join(address_parts) if address_parts else None
    return store_name, address, website


def extract_receipt_number(text: str) -> Optional[str]:
    """Extract receipt/invoice number using pattern."""
    match = RECEIPT_NO_PATTERN.search(text)
    return match.group(1) if match else None


def parse_date(text: str) -> Optional[datetime]:
    """
    Attempt to parse a date from text using multiple formats.
    Returns a datetime object or None.
    """
    for pattern in DATE_PATTERNS:
        match = pattern.search(text)
        if match:
            groups = match.groups()
            try:
                if len(groups) == 3:
                    if groups[1].isdigit():
                        # DD/MM/YYYY or MM/DD/YYYY or YYYY-MM-DD
                        if len(groups[0]) == 4:  # YYYY-MM-DD
                            return datetime(int(groups[0]), int(groups[1]), int(groups[2]))
                        else:
                            # Assume DD/MM/YYYY (can be ambiguous)
                            day, month, year = int(groups[0]), int(groups[1]), int(groups[2])
                            if year < 100:
                                year += 2000
                            return datetime(year, month, day)
                    else:
                        # DD Month YYYY
                        day = int(groups[0])
                        month_str = groups[1][:3].title()
                        year = int(groups[2])
                        if year < 100:
                            year += 2000
                        month_map = {
                            "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
                            "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12
                        }
                        month = month_map.get(month_str, 1)
                        return datetime(year, month, day)
            except (ValueError, KeyError):
                continue
    return None


def extract_totals(lines: List[str]) -> Tuple[Optional[float], Optional[float]]:
    """
    Extract total_amount and tax_amount from bottom lines.
    Look for patterns like 'Total', 'Grand Total', 'Subtotal', 'Tax', 'VAT'.
    """
    total_amount = None
    tax_amount = None
    totals_candidates = []

    # Scan bottom 15 lines
    for line in lines[-15:]:
        line_lower = line.lower()
        # Extract amounts (numbers with optional currency symbols)
        amounts = re.findall(r"[\d,]+\.\d{2}", line)
        amounts = [float(a.replace(",", "")) for a in amounts]

        if "tax" in line_lower or "vat" in line_lower or "gst" in line_lower:
            if amounts:
                tax_amount = amounts[-1]
        elif "total" in line_lower and "sub" not in line_lower:
            if amounts:
                totals_candidates.append(amounts[-1])
        elif "grand" in line_lower or "amount" in line_lower:
            if amounts:
                totals_candidates.append(amounts[-1])

    # Choose the maximum as total (exclude tips if present)
    if totals_candidates:
        total_amount = max(totals_candidates)

    return total_amount, tax_amount


def extract_payment_method(text: str) -> Optional[str]:
    """
    Detect payment method from text: visa, mastercard, cash, UPI, etc.
    Also capture masked card numbers like ****1234.
    """
    text_lower = text.lower()
    for method in PAYMENT_METHODS:
        if method in text_lower:
            # Check for masked card
            card_match = re.search(r"\*{4,}\d{4}", text)
            if card_match:
                return f"{method.upper()} {card_match.group()}"
            return method.upper()
    return None


def infer_currency(text: str) -> Optional[str]:
    """Infer currency from symbols in text."""
    for symbol, code in CURRENCY_SYMBOLS.items():
        if symbol in text:
            return code
    return None


def parse_items(lines: List[str], start_idx: int, end_idx: int) -> List[Dict[str, Any]]:
    """
    Parse line items from the middle section of the receipt.
    Heuristic: lines that end with a price and have description.
    """
    items = []
    for i, line in enumerate(lines[start_idx:end_idx], start=start_idx):
        line_clean = line.strip()
        if not line_clean:
            continue

        # Look for lines ending with price
        price_match = re.search(r"([\d,]+\.\d{2})$", line_clean)
        if not price_match:
            continue

        total_price = float(price_match.group(1).replace(",", ""))

        # Split line into parts (description, qty, unit price, total)
        # Common pattern: "ITEM_NAME   QTY   UNIT_PRICE   TOTAL"
        parts = re.split(r"\s{2,}", line_clean)  # Split on 2+ spaces
        if len(parts) < 2:
            parts = line_clean.split()

        # Extract quantity if present (e.g., "2x", "2.00")
        qty = 1.0
        description = parts[0]
        unit_price = None

        for part in parts[1:]:
            # Check for qty patterns
            qty_match = re.match(r"(\d+\.?\d*)x?", part, re.I)
            if qty_match:
                qty = float(qty_match.group(1))
            elif re.match(r"[\d,]+\.\d{2}", part):
                # Could be unit price or total
                val = float(part.replace(",", ""))
                if unit_price is None and val != total_price:
                    unit_price = val

        # Compute missing values
        if unit_price is None and qty > 0:
            unit_price = total_price / qty

        items.append({
            "description": description,
            "quantity": qty,
            "unit_price": unit_price,
            "total_price": total_price,
            "serial_no": len(items) + 1,
        })

    return items


def parse_receipt(
    ocr_output: Dict[str, Any],
    filename: str,
    file_size: Optional[int] = None,
    language: str = "en",
    min_confidence: float = 0.3,
    return_text: bool = False
) -> ReceiptResponse:
    """
    Parse OCR output into ReceiptResponse.

    Args:
        ocr_output: Output from ocr_engine.run_ocr
        filename: Original filename
        file_size: File size in bytes
        language: Language code
        min_confidence: Min confidence threshold
        return_text: Whether to include full OCR text in response
    """
    text = ocr_output.get("text", "")
    pages = ocr_output.get("pages", [])
    lines = [line["text"] for page in pages for line in page.get("lines", [])]

    # Generate IDs
    receipt_id = str(uuid.uuid4())
    upload_id = str(uuid.uuid4())

    # Extract store info
    store_name, address, website = extract_store_info(lines)
    store = StoreModel(
        store_id=None,
        store_name=store_name,
        website=website,
        address=address
    )

    # Extract receipt number and date
    receipt_no = extract_receipt_number(text)
    purchase_date = parse_date(text)

    # Extract totals
    total_amount, tax_amount = extract_totals(lines)

    # Extract payment method
    payment_method = extract_payment_method(text)

    # Infer currency (default to USD for English if symbol absent)
    currency = infer_currency(text) or ("USD" if language.lower().startswith("en") else None)

    # Parse items region dynamically: from first item-like line up to totals section
    totals_keywords = ("subtotal", "total", "grand", "tax", "vat", "gst")
    items_end = next(
        (i for i, l in enumerate(lines) if any(k in l.lower() for k in totals_keywords)),
        len(lines)
    )
    item_candidates = [
        i for i, l in enumerate(lines[:items_end])
        if re.search(r"([\d,]+\.\d{2})\s*$", l.strip())
    ]
    items_start = item_candidates[0] if item_candidates else 0
    items_data = parse_items(lines, items_start, items_end)

    receipt_items = [
        ReceiptItem(
            receipt_item_id=str(uuid.uuid4()),
            product_id=None,
            receipt_id=receipt_id,
            item_id=None,
            quantity=item["quantity"],
            unit_price=item.get("unit_price"),
            item_description=item["description"],
            total_price=item.get("total_price"),
            serial_no=item.get("serial_no"),
            confidence=None  # Could average word confidences per item
        )
        for item in items_data
    ]

    # Build OCRMeta
    ocr_meta = OCRMeta(
        detector=ocr_output.get("detector", "db_resnet50"),
        recognizer=ocr_output.get("recognizer", "crnn_vgg16_bn"),
        backend="pytorch",
        device="cpu",
        inference_ms=ocr_output.get("inference_ms", 0.0),
        page_count=ocr_output.get("page_count", 1),
        language=language,
        average_confidence=ocr_output.get("average_confidence"),
        median_confidence=ocr_output.get("median_confidence"),
        min_confidence=min_confidence,
        currency=currency,
        page_limit_used=10,
        model_versions={"detector": "db_resnet50", "recognizer": "crnn_vgg16_bn"},
        blocks=ocr_output.get("blocks") if return_text else None
    )

    # Build Receipt
    receipt = Receipt(
        receipt_id=receipt_id,
        user_id=None,
        store_id=None,
        receipt_no=receipt_no,
        purchase_date=purchase_date,
        total_amount=total_amount,
        tax_amount=tax_amount,
        payment_method=payment_method,
        original_filename=filename,
        ocr_raw_text=text if return_text else None,
        ocr_meta=ocr_meta,
        status="processed",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    # Build UploadHistory
    upload_history = UploadHistory(
        upload_id=upload_id,
        user_id=None,
        file_type=Path(filename).suffix.lower(),
        original_filename=filename,
        file_path=None,
        file_size=file_size,
        processing_status="completed",
        uploaded_at=datetime.utcnow()
    )

    response = ReceiptResponse(
        receipts=receipt,
        receipt_items=receipt_items,
        store=store,
        upload_history=upload_history
    )

    logger.info(
        f"Parsed receipt: store={store_name}, total={total_amount}, "
        f"items={len(receipt_items)}, receipt_no={receipt_no}"
    )

    return response
