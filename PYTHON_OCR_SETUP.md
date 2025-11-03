# Python OCR Service Integration - Complete Setup

Your teammate's Python OCR service has been integrated! This uses **docTR** (PyTorch-based OCR) which is more accurate than client-side Tesseract.js.

## What Was Integrated

✅ **Flask API Server** (`OCR service/api_server.py`)
   - Wraps your teammate's existing OCR code (cli.py, ocr_engine.py, receipt_parser.py)
   - All their code is preserved - we just added an HTTP wrapper
   - RESTful API endpoints for OCR processing

✅ **Next.js API Routes** (`pages/api/ocr/upload.js`)
   - Handles file uploads and forwards to Python service
   - Transforms response to match frontend expectations

✅ **Updated Upload Page** (`pages/upload.js`)
   - Toggle between Python OCR (accurate) and Tesseract.js (fast)
   - Automatically detects if Python service is available
   - Falls back gracefully if service is offline

## Setup Instructions

### Step 1: Install Python Dependencies

```bash
cd "OCR service"

# Create virtual environment
python -m venv .venv

# Activate it
# macOS/Linux:
source .venv/bin/activate
# Windows:
.venv\Scripts\Activate.ps1

# Install PyTorch first (CPU version)
pip install torch==2.4.0 torchvision==0.19.0 --index-url https://download.pytorch.org/whl/cpu

# Install other dependencies
pip install -r requirements.txt
```

### Step 2: Start the Python OCR Service

```bash
# Make sure you're in the OCR service directory
cd "OCR service"

# Activate virtual environment
source .venv/bin/activate  # or .venv\Scripts\Activate.ps1 on Windows

# Start the server
python api_server.py
```

You should see:
```
Starting Receipt OCR API Server on http://127.0.0.1:8000
Health check: http://127.0.0.1:8000/health
OCR endpoint: http://127.0.0.1:8000/api/ocr
 * Running on http://127.0.0.1:8000
```

### Step 3: Verify Integration

1. **Health Check:**
   Open http://localhost:8000/health in browser
   Should return: `{"status": "ok", "service": "receipt-ocr"}`

2. **In Next.js App:**
   - Go to Upload page
   - You should see "Python OCR Service (Available)" option
   - Check the box to use Python OCR
   - Upload a receipt image

### Step 4: Test OCR

1. Upload a receipt image on the Upload page
2. Check "Use Python OCR Service" checkbox
3. Click "Extract Text with OCR"
4. The Python service will process it and return structured data

## How It Works

```
User Uploads Receipt
    ↓
Next.js Upload Page (/pages/upload.js)
    ↓
Checks if Python OCR is enabled
    ↓
Sends file to /api/ocr/upload
    ↓
Next.js API Route (/pages/api/ocr/upload.js)
    ↓
Forwards to Python Flask API (localhost:8000/api/ocr)
    ↓
Python Service (api_server.py)
    ↓
Uses teammate's OCR code:
  - ocr_engine.py (docTR OCR)
  - receipt_parser.py (heuristic parsing)
    ↓
Returns structured JSON
    ↓
Next.js transforms response
    ↓
Frontend displays parsed data
```

## Files Created/Modified

### New Files:
- `OCR service/api_server.py` - Flask API server wrapper
- `pages/api/ocr/upload.js` - Next.js API route for file uploads
- `OCR service/START_SERVICE.md` - Quick start guide

### Modified Files:
- `OCR service/requirements.txt` - Added Flask dependencies
- `pages/upload.js` - Added Python OCR option and toggle

### Preserved Files (All Your Teammate's Code):
- ✅ `receipt_ocr/cli.py` - CLI interface (unchanged)
- ✅ `receipt_ocr/ocr_engine.py` - OCR engine (unchanged)
- ✅ `receipt_ocr/receipt_parser.py` - Parser logic (unchanged)
- ✅ `receipt_ocr/schemas.py` - Data models (unchanged)
- ✅ `receipt_ocr/logging_utils.py` - Logging (unchanged)

## API Details

### Python Flask API (`localhost:8000`)

**Health Check:**
```bash
GET /health
```

**Process Single File:**
```bash
POST /api/ocr
Content-Type: multipart/form-data

file: <file>
language: en (optional)
min_confidence: 0.3 (optional)
return_text: true (optional)
```

**Response:**
```json
{
  "receipts": {...},
  "receipt_items": [...],
  "store": {...},
  "upload_history": {...}
}
```

### Next.js API Route (`/api/ocr/upload`)

**Request:**
```javascript
const formData = new FormData()
formData.append('file', file)
const response = await fetch('/api/ocr/upload', {
  method: 'POST',
  body: formData
})
```

**Response:**
```json
{
  "success": true,
  "text": "Full OCR text...",
  "parsed": {
    "store_name": "...",
    "purchase_date": "...",
    "total_amount": 123.45,
    "items": [...]
  }
}
```

## Advantages of Python OCR

✅ **More Accurate:** docTR (PyTorch) is more accurate than Tesseract.js
✅ **Better Parsing:** Advanced heuristic parsing from receipt_parser.py
✅ **Structured Data:** Returns items, tax, payment method, currency
✅ **PDF Support:** Native PDF processing
✅ **Production Ready:** Your teammate's tested code

## Fallback Option

If Python OCR service is not running:
- Upload page automatically falls back to client-side Tesseract.js
- User can still upload receipts
- Works offline

## Troubleshooting

### Service Won't Start
```bash
# Check if dependencies are installed
pip list | grep flask

# Reinstall if needed
pip install -r requirements.txt
```

### "Connection Refused" Error
- Make sure Python service is running on port 8000
- Check firewall settings
- Verify `OCR_SERVICE_URL` in Next.js (defaults to localhost:8000)

### OCR Processing Fails
- Check Python service logs
- Verify file format is supported (PNG, JPG, PDF)
- Ensure PyTorch models downloaded (first run downloads ~50MB)

### Port Already in Use
```bash
# Use different port
python api_server.py --port 8001

# Update Next.js .env.local
OCR_SERVICE_URL=http://localhost:8001
```

## Next Steps

1. ✅ Start Python OCR service
2. ✅ Test with a receipt image
3. ✅ Verify parsed data is accurate
4. ✅ Optionally run Python service in background for production

For production deployment, consider:
- Running Python service as a systemd service (Linux)
- Using a process manager like PM2
- Docker containerization
- Cloud deployment (AWS, GCP, etc.)

