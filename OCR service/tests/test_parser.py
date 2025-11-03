"""
Unit tests for receipt parser.
"""
import pytest
from datetime import datetime
import os
import sys
# Ensure project root is on sys.path so 'receipt_ocr' can be imported when running tests directly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from receipt_ocr.receipt_parser import (
    extract_store_info,
    extract_receipt_number,
    parse_date,
    extract_totals,
    extract_payment_method,
    infer_currency,
    parse_items,
    parse_receipt
)


def test_extract_store_info():
    lines = [
        "BIG BAZAAR",
        "Shop No 12, MG Road",
        "Bangalore 560001",
        "www.bigbazaar.com",
        "Date: 12/05/2023"
    ]
    store_name, address, website = extract_store_info(lines)
    assert store_name == "BIG BAZAAR"
    assert "MG Road" in address
    assert website == "www.bigbazaar.com"


def test_extract_receipt_number():
    text = "Receipt No: ABC123456 Date: 01/01/2024"
    receipt_no = extract_receipt_number(text)
    assert receipt_no == "ABC123456"


def test_parse_date():
    text1 = "Date: 12/05/2023"
    date1 = parse_date(text1)
    assert date1 is not None
    assert date1.year == 2023

    text2 = "15 Jan 2024 10:30 AM"
    date2 = parse_date(text2)
    assert date2 is not None
    assert date2.month == 1
    assert date2.day == 15


def test_extract_totals():
    lines = [
        "Item A   10.00",
        "Item B   20.00",
        "Subtotal   30.00",
        "Tax (10%)   3.00",
        "Grand Total   33.00"
    ]
    total, tax = extract_totals(lines)
    assert total == 33.00
    assert tax == 3.00


def test_extract_payment_method():
    text1 = "Payment: VISA ****1234"
    method1 = extract_payment_method(text1)
    assert "VISA" in method1
    assert "****1234" in method1

    text2 = "Paid by Cash"
    method2 = extract_payment_method(text2)
    assert method2 == "CASH"


def test_infer_currency():
    text1 = "Total: ₹100.00"
    currency1 = infer_currency(text1)
    assert currency1 == "INR"

    text2 = "Total: $50.00"
    currency2 = infer_currency(text2)
    assert currency2 == "USD"


def test_parse_items():
    lines = [
        "Header line",
        "MILK  2x  25.00  50.00",
        "BREAD     15.00",
        "EGGS  12  10.00  120.00",
        "Subtotal  185.00",
        "Total  185.00"
    ]
    items = parse_items(lines, 1, 4)
    assert len(items) >= 1
    # Check that at least one item was parsed
    assert any(item["total_price"] > 0 for item in items)


def test_parse_receipt_integration():
    """Integration test with synthetic OCR output."""
    ocr_output = {
        "text": """BIG MART
Shop 12, MG Road
Bangalore 560001
www.bigmart.com

Receipt No: RCP-2024-001
Date: 15/01/2024

MILK 2L  2x  25.00  50.00
BREAD        15.00
EGGS 12      120.00

Subtotal   185.00
Tax (5%)     9.25
Total      194.25

Payment: VISA ****1234
Thank you!""",
        "pages": [
            {
                "page": 1,
                "lines": [
                    {"text": "BIG MART", "words": []},
                    {"text": "Shop 12, MG Road", "words": []},
                    {"text": "Bangalore 560001", "words": []},
                    {"text": "www.bigmart.com", "words": []},
                    {"text": "", "words": []},
                    {"text": "Receipt No: RCP-2024-001", "words": []},
                    {"text": "Date: 15/01/2024", "words": []},
                    {"text": "", "words": []},
                    {"text": "MILK 2L  2x  25.00  50.00", "words": []},
                    {"text": "BREAD        15.00", "words": []},
                    {"text": "EGGS 12      120.00", "words": []},
                    {"text": "", "words": []},
                    {"text": "Subtotal   185.00", "words": []},
                    {"text": "Tax (5%)     9.25", "words": []},
                    {"text": "Total      194.25", "words": []},
                    {"text": "", "words": []},
                    {"text": "Payment: VISA ****1234", "words": []},
                    {"text": "Thank you!", "words": []}
                ]
            }
        ],
        "confidences": [0.95] * 20,
        "average_confidence": 0.95,
        "median_confidence": 0.95,
        "page_count": 1,
        "inference_ms": 1500.0,
        "detector": "db_resnet50",
        "recognizer": "crnn_vgg16_bn"
    }

    response = parse_receipt(
        ocr_output=ocr_output,
        filename="test_receipt.jpg",
        file_size=102400,
        language="en",
        min_confidence=0.3,
        return_text=True
    )

    # Assertions
    assert response.receipts.receipt_id is not None
    assert response.store.store_name == "BIG MART"
    assert "MG Road" in response.store.address
    assert response.store.website == "www.bigmart.com"
    assert response.receipts.receipt_no == "RCP-2024-001"
    assert response.receipts.purchase_date is not None
    assert response.receipts.purchase_date.year == 2024
    assert response.receipts.purchase_date.month == 1
    assert response.receipts.purchase_date.day == 15
    assert response.receipts.total_amount == 194.25
    assert response.receipts.tax_amount == 9.25
    assert "VISA" in response.receipts.payment_method
    assert len(response.receipt_items) >= 1
    assert response.receipts.ocr_meta.average_confidence == 0.95
    assert response.receipts.ocr_meta.page_count == 1
    assert response.receipts.ocr_meta.currency == "USD"  # Note: might be None if no $ symbol
    assert response.upload_history.file_type == ".jpg"
    assert response.upload_history.processing_status == "completed"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
