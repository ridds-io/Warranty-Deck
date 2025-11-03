# Receipt OCR Service

Python-based receipt OCR tool using **docTR** that extracts structured data from images and PDFs, outputting JSON aligned to a relational database schema.

## Features

- **OCR Engine**: docTR (db_resnet50 detector + crnn_vgg16_bn recognizer)
- **Input**: Images (PNG, JPG, TIFF, BMP) and PDFs
- **Output**: Structured JSON with:
  - `receipts`: receipt metadata (ID, date, total, tax, payment method, etc.)
  - `receipt_items`: parsed line items with quantity, unit price, total
  - `store`: store name, address, website
  - `upload_history`: file metadata and processing status
  - `ocr_meta`: OCR confidence, inference time, page count, model versions
- **Heuristic Parsing**: Extracts store info, receipt number, purchase date, items, totals, tax, payment method, and currency
- **Logging**: Job ID tracking with console and rotating file logs
- **Tests**: pytest unit tests for parser logic

## Requirements

- **Python 3.10+**
- **Poppler** (for PDF support via pdf2image)
- **PyTorch** (CPU wheels)

## Installation (Windows)

### 1. Install Poppler for PDF support

```powershell
choco install poppler -y
```

After installation, verify Poppler is in PATH:

```powershell
pdftoppm -v
```

If not found, manually add Poppler bin directory to PATH:
- Typical location: `C:\Program Files\poppler-xx\Library\bin`
- Add to System Environment Variables → Path

### 2. Create virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3. Upgrade pip

```powershell
python -m pip install --upgrade pip
```

### 4. Install PyTorch CPU wheels

```powershell
pip install torch==2.4.0 torchvision==0.19.0 --index-url https://download.pytorch.org/whl/cpu
```

### 5. Install dependencies

```powershell
pip install -r requirements.txt
```

## Usage

### Basic usage (single image)

```powershell
python -m receipt_ocr.cli samples\receipt.jpg
```

Or use the PowerShell wrapper:

```powershell
.\run_cli.ps1 samples\receipt.jpg
```

### Process PDF with options

```powershell
python -m receipt_ocr.cli receipt.pdf --page-limit 5 --return-text --output output.json
```

### Multiple files

```powershell
python -m receipt_ocr.cli receipt1.jpg receipt2.pdf --min-confidence 0.4
```

### CLI Options

| Option              | Default | Description                                   |
|---------------------|---------|-----------------------------------------------|
| `files`             | -       | One or more image/PDF paths (required)        |
| `--language`        | `en`    | OCR language code                             |
| `--min-confidence`  | `0.3`   | Minimum word confidence threshold             |
| `--page-limit`      | `10`    | Max pages to process for PDFs                 |
| `--return-text`     | `False` | Include full OCR text in response             |
| `--return-blocks`   | `False` | Include structured OCR blocks in response     |
| `--output`          | stdout  | Output JSON file path                         |
| `--log-level`       | `INFO`  | Logging level (DEBUG, INFO, WARNING, ERROR)   |

## Output Schema

### Single file success:

```json
{
  "receipts": {
    "receipt_id": "uuid",
    "user_id": null,
    "store_id": null,
    "receipt_no": "RCP-123",
    "purchase_date": "2024-01-15T00:00:00",
    "total_amount": 194.25,
    "tax_amount": 9.25,
    "payment_method": "VISA ****1234",
    "original_filename": "receipt.jpg",
    "ocr_raw_text": "...",
    "ocr_meta": {
      "detector": "db_resnet50",
      "recognizer": "crnn_vgg16_bn",
      "backend": "pytorch",
      "device": "cpu",
      "inference_ms": 1500.0,
      "page_count": 1,
      "language": "en",
      "average_confidence": 0.92,
      "median_confidence": 0.94,
      "min_confidence": 0.3,
      "currency": "USD",
      "page_limit_used": 10,
      "model_versions": {...}
    },
    "status": "processed",
    "created_at": "2024-11-02T06:00:00Z",
    "updated_at": "2024-11-02T06:00:00Z"
  },
  "receipt_items": [
    {
      "receipt_item_id": "uuid",
      "product_id": null,
      "receipt_id": "uuid",
      "item_id": null,
      "quantity": 2.0,
      "unit_price": 25.0,
      "item_description": "MILK 2L",
      "total_price": 50.0,
      "serial_no": 1,
      "confidence": null
    }
  ],
  "store": {
    "store_id": null,
    "store_name": "BIG MART",
    "website": "www.bigmart.com",
    "address": "Shop 12, MG Road, Bangalore 560001"
  },
  "upload_history": {
    "upload_id": "uuid",
    "user_id": null,
    "file_type": ".jpg",
    "original_filename": "receipt.jpg",
    "file_path": null,
    "file_size": 102400,
    "processing_status": "completed",
    "uploaded_at": "2024-11-02T06:00:00Z"
  }
}
```

### Multiple files or errors:

```json
{
  "job_id": "uuid",
  "results": [...],
  "errors": [{"file": "bad.pdf", "error": "..."}],
  "summary": {
    "total_files": 3,
    "successful": 2,
    "failed": 1
  }
}
```

## Testing

Run unit tests:

```powershell
pytest tests -v
```

Quick test:

```powershell
pytest tests/test_parser.py -q
```

## Troubleshooting

### Poppler not found (PDF processing fails)

**Error**: `pdf2image failed. Ensure Poppler is installed and in PATH.`

**Fix**:
1. Install Poppler: `choco install poppler -y`
2. Restart PowerShell or add manually to PATH:
   ```
   C:\Program Files\poppler-xx\Library\bin
   ```
3. Verify: `pdftoppm -v`

### Torch import error

**Error**: `ModuleNotFoundError: No module named 'torch'`

**Fix**: Install PyTorch CPU wheels first:

```powershell
pip install torch==2.4.0 torchvision==0.19.0 --index-url https://download.pytorch.org/whl/cpu
```

### Low OCR confidence

**Symptoms**: Missing or incorrect fields in output.

**Fix**:
- Lower `--min-confidence` (e.g., `0.2`)
- Improve input image quality (higher resolution, better lighting)
- Ensure receipt text is straight (not skewed)

### Date parsing ambiguity

The parser assumes **DD/MM/YYYY** for ambiguous formats. If your receipts use **MM/DD/YYYY**, you may need to adjust `parse_date()` in `receipt_parser.py`.

## Project Structure

```
D:\OCR Service\
├── receipt_ocr/
│   ├── __init__.py
│   ├── cli.py              # Command-line interface
│   ├── ocr_engine.py       # docTR OCR wrapper
│   ├── receipt_parser.py   # Heuristic parser
│   ├── schemas.py          # Pydantic models
│   └── logging_utils.py    # Logging setup
├── tests/
│   └── test_parser.py      # Unit tests
├── samples/                # Sample receipts (add your own)
├── logs/                   # Log files (auto-created)
│   └── ocr.log
├── requirements.txt        # Python dependencies
├── run_cli.ps1             # PowerShell wrapper
└── README.md
```

## Dependencies

- **pydantic**: Schema validation
- **pillow**: Image processing
- **opencv-python-headless**: Image operations
- **pdf2image**: PDF to image conversion (requires Poppler)
- **python-doctr**: OCR models
- **torch / torchvision**: Deep learning backend (CPU)
- **numpy**: Numerical operations
- **pytest**: Testing

## Performance

- **Inference time**: ~1-3 seconds per page on modern CPUs
- **Model download**: First run downloads ~50MB models (cached)
- **Memory**: ~500MB RAM per process

## Limitations

- **Item parsing**: Heuristic-based; accuracy depends on receipt format consistency
- **Date formats**: Assumes common formats; may need customization for regional formats
- **Currency**: Inferred from symbols; may be `null` if no symbol present
- **Multi-column receipts**: May not parse correctly if items span multiple columns

## Future Enhancements

- Fine-tune docTR models on receipt datasets
- Add LLM-based parsing for better accuracy
- Support for warranty extraction
- REST API wrapper (FastAPI)
- Database integration (PostgreSQL/MySQL)
- Batch processing with progress bar
- Docker image


## Credits

- **docTR**: https://github.com/mindee/doctr
- **pdf2image**: https://github.com/Belval/pdf2image
- **Poppler**: https://poppler.freedesktop.org/

