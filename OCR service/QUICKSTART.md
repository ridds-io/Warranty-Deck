# Quick Start Guide

Get your receipt OCR service up and running in 5 minutes.

## Prerequisites

- **Python 3.10+** installed
- **Chocolatey** (for Poppler installation)
- **PowerShell** (Windows)

## Installation Steps

### Option 1: Automated Setup (Recommended)

Run the setup script:

```powershell
.\setup.ps1
```

This will:
1. Check Python and Poppler
2. Create virtual environment
3. Install PyTorch CPU
4. Install all dependencies
5. Run tests

### Option 2: Manual Setup

#### 1. Install Poppler

```powershell
choco install poppler -y
```

Verify installation:

```powershell
pdftoppm -v
```

#### 2. Create and activate virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

#### 3. Install dependencies

```powershell
# Upgrade pip
python -m pip install --upgrade pip

# Install PyTorch CPU (must be first)
pip install torch==2.4.0 torchvision==0.19.0 --index-url https://download.pytorch.org/whl/cpu

# Install other dependencies
pip install -r requirements.txt
```

#### 4. Verify installation

```powershell
pytest tests -q
```

## Usage

### 1. Add sample receipt

Place a receipt image (PNG/JPG) or PDF in the `samples/` folder.

### 2. Run OCR

```powershell
python -m receipt_ocr.cli samples\your_receipt.jpg
```

Or use the wrapper:

```powershell
.\run_cli.ps1 samples\your_receipt.jpg
```

### 3. View output

The tool will print JSON to stdout with:

```json
{
  "receipts": {
    "receipt_id": "...",
    "store_id": null,
    "receipt_no": "...",
    "purchase_date": "...",
    "total_amount": 100.00,
    "tax_amount": 10.00,
    "payment_method": "...",
    "ocr_meta": {...}
  },
  "receipt_items": [...],
  "store": {...},
  "upload_history": {...}
}
```

## Common Options

### Save to file

```powershell
python -m receipt_ocr.cli receipt.jpg --output result.json
```

### Include full OCR text

```powershell
python -m receipt_ocr.cli receipt.jpg --return-text
```

### Process PDF with custom page limit

```powershell
python -m receipt_ocr.cli receipt.pdf --page-limit 5
```

### Adjust confidence threshold

```powershell
python -m receipt_ocr.cli receipt.jpg --min-confidence 0.2
```

### Process multiple files

```powershell
python -m receipt_ocr.cli receipt1.jpg receipt2.pdf receipt3.png
```

## Troubleshooting

### "pdf2image failed"

**Cause**: Poppler not installed or not in PATH

**Fix**:
```powershell
choco install poppler -y
# Restart PowerShell
```

### "No module named 'torch'"

**Cause**: PyTorch not installed

**Fix**:
```powershell
pip install torch==2.4.0 torchvision==0.19.0 --index-url https://download.pytorch.org/whl/cpu
```

### Low accuracy / Missing fields

**Solutions**:
- Use higher resolution images (300+ DPI)
- Ensure receipt text is straight and well-lit
- Lower `--min-confidence` to 0.2 or 0.1
- Check receipt format is standard retail layout

## First Run Notes

- **Model download**: First run downloads ~50MB docTR models (cached for future use)
- **Inference time**: ~1-3 seconds per page on modern CPUs
- **Memory**: ~500MB RAM during processing

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [samples/README.md](samples/README.md) for tips on best input quality
- Explore CLI options: `python -m receipt_ocr.cli --help`
- Run tests: `pytest tests -v`

## Getting Help

For issues or questions:
1. Check [README.md](README.md) → Troubleshooting section
2. Review test cases in `tests/test_parser.py` for examples
3. Enable debug logging: `--log-level DEBUG`

## Project Structure

```
D:\OCR Service\
├── receipt_ocr/        # Main package
│   ├── cli.py          # Command-line interface
│   ├── ocr_engine.py   # docTR OCR wrapper
│   ├── receipt_parser.py  # Heuristic parser
│   ├── schemas.py      # Pydantic models
│   └── logging_utils.py
├── tests/              # Unit tests
├── samples/            # Your receipts go here
├── logs/               # Auto-generated logs
├── setup.ps1           # Automated setup
└── run_cli.ps1         # CLI wrapper
```

Enjoy! 🎉
