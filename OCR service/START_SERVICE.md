# Starting the Python OCR Service

This guide explains how to start the Python OCR API server so your Next.js app can use it.

## Quick Start

1. **Navigate to OCR service directory:**
   ```bash
   cd "OCR service"
   ```

2. **Create and activate virtual environment (if not done):**
   ```bash
   python -m venv .venv
   
   # On macOS/Linux:
   source .venv/bin/activate
   
   # On Windows:
   .venv\Scripts\Activate.ps1
   ```

3. **Install PyTorch (CPU version) - Required First:**
   ```bash
   pip install torch==2.4.0 torchvision==0.19.0 --index-url https://download.pytorch.org/whl/cpu
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Start the API server:**
   ```bash
   python api_server.py
   ```

   The server will start on `http://localhost:8000`

## Verify It's Working

1. **Health check:**
   Open browser: http://localhost:8000/health
   Should return: `{"status": "ok", "service": "receipt-ocr"}`

2. **Test from Next.js:**
   - Go to the Upload page in your Next.js app
   - You should see "Python OCR Service (Available)" checkbox
   - Enable it and upload a receipt

## Running in Background

### macOS/Linux:
```bash
nohup python api_server.py > ocr_service.log 2>&1 &
```

### Windows (PowerShell):
```powershell
Start-Process python -ArgumentList "api_server.py" -WindowStyle Hidden
```

## Custom Port

If port 8000 is in use:
```bash
python api_server.py --port 8001
```

Then update `.env.local` in warranty-deck:
```
OCR_SERVICE_URL=http://localhost:8001
```

## Troubleshooting

### "ModuleNotFoundError: No module named 'flask'"
```bash
pip install flask flask-cors
```

### "ModuleNotFoundError: No module named 'torch'"
Install PyTorch first (see step 3 above)

### "Connection refused" in Next.js
- Make sure Python service is running
- Check the port matches (default: 8000)
- Verify firewall isn't blocking localhost:8000

### Service starts but OCR fails
- Check if Poppler is installed (for PDF support)
- On Windows: `choco install poppler -y`
- On macOS: `brew install poppler`

## API Endpoints

- `GET /health` - Health check
- `POST /api/ocr` - Process single file
- `POST /api/ocr/batch` - Process multiple files

See `api_server.py` for details.

