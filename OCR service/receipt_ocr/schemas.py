"""
Pydantic models for receipt OCR response aligned to the relational schema.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


class OCRMeta(BaseModel):
    """OCR metadata for the processing job."""
    detector: str = Field(..., description="Detection model architecture")
    recognizer: str = Field(..., description="Recognition model architecture")
    backend: str = "pytorch"
    device: str = "cpu"
    inference_ms: float = Field(..., description="Total inference time in milliseconds")
    page_count: int = Field(default=1, description="Number of pages processed")
    language: str = Field(default="en", description="OCR language")
    average_confidence: Optional[float] = Field(None, description="Mean word confidence across document")
    median_confidence: Optional[float] = Field(None, description="Median word confidence")
    min_confidence: float = Field(default=0.3, description="Minimum confidence threshold applied")
    currency: Optional[str] = Field(None, description="Detected currency symbol or code")
    page_limit_used: int = Field(default=10, description="Max pages processed for PDFs")
    model_versions: Dict[str, str] = Field(default_factory=dict, description="Model version info")
    blocks: Optional[List[Dict[str, Any]]] = Field(None, description="Optional structured blocks from OCR")


class ReceiptItem(BaseModel):
    """Line item from the receipt."""
    receipt_item_id: str = Field(..., description="Unique item ID (UUID)")
    product_id: Optional[str] = Field(None, description="Product reference if matched")
    receipt_id: str = Field(..., description="Parent receipt ID")
    item_id: Optional[str] = Field(None, description="Item identifier on receipt")
    quantity: float = Field(default=1.0, description="Quantity purchased")
    unit_price: Optional[float] = Field(None, description="Price per unit")
    item_description: Optional[str] = Field(None, description="Item name or description")
    total_price: Optional[float] = Field(None, description="Total line price")
    serial_no: Optional[int] = Field(None, description="Line sequence number")
    confidence: Optional[float] = Field(None, description="Average confidence for this item's words")


class StoreModel(BaseModel):
    """Store information extracted from receipt header."""
    store_id: Optional[str] = Field(None, description="Store UUID if matched")
    store_name: Optional[str] = Field(None, description="Store or merchant name")
    website: Optional[str] = Field(None, description="Website URL if found")
    address: Optional[str] = Field(None, description="Physical address")


class UploadHistory(BaseModel):
    """Metadata about the uploaded file."""
    upload_id: str = Field(..., description="Unique upload ID (UUID)")
    user_id: Optional[str] = Field(None, description="User who uploaded (UUID)")
    file_type: str = Field(..., description="MIME type or extension")
    original_filename: str = Field(..., description="Original filename")
    file_path: Optional[str] = Field(None, description="Storage path")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    processing_status: str = Field(default="completed", description="processing|completed|failed")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow, description="Upload timestamp")


class Receipt(BaseModel):
    """Main receipt entity with parsed fields and OCR metadata."""
    receipt_id: str = Field(..., description="Unique receipt ID (UUID)")
    user_id: Optional[str] = Field(None, description="Owner user ID")
    store_id: Optional[str] = Field(None, description="Store reference")
    receipt_no: Optional[str] = Field(None, description="Receipt or invoice number")
    purchase_date: Optional[datetime] = Field(None, description="Transaction date and time")
    total_amount: Optional[float] = Field(None, description="Grand total")
    tax_amount: Optional[float] = Field(None, description="Tax or VAT")
    payment_method: Optional[str] = Field(None, description="Payment type: cash, card, UPI, etc.")
    original_filename: str = Field(..., description="Source filename")
    ocr_raw_text: Optional[str] = Field(None, description="Full OCR text if requested")
    ocr_meta: OCRMeta = Field(..., description="OCR processing metadata")
    status: str = Field(default="processed", description="Status: pending, processed, failed")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ReceiptResponse(BaseModel):
    """Complete receipt processing response."""
    receipts: Receipt = Field(..., description="Main receipt entity")
    receipt_items: List[ReceiptItem] = Field(default_factory=list, description="Parsed line items")
    store: StoreModel = Field(..., description="Store information")
    upload_history: UploadHistory = Field(..., description="Upload metadata")
