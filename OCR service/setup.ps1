# Receipt OCR Service - Windows Setup Script
# Run this script to set up the environment

Write-Host "=== Receipt OCR Service Setup ===" -ForegroundColor Green
Write-Host ""

# Check Python version
Write-Host "1. Checking Python installation..." -ForegroundColor Cyan
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Python not found. Please install Python 3.10+" -ForegroundColor Red
    exit 1
}
Write-Host "   Found: $pythonVersion" -ForegroundColor Green

# Check Poppler
Write-Host ""
Write-Host "2. Checking Poppler installation (required for PDFs)..." -ForegroundColor Cyan
$popplerCheck = where.exe pdftoppm 2>$null
if (-not $popplerCheck) {
    Write-Host "   WARNING: Poppler not found in PATH" -ForegroundColor Yellow
    Write-Host "   PDF processing will fail without Poppler" -ForegroundColor Yellow
    Write-Host "   Install with: choco install poppler -y" -ForegroundColor Yellow
} else {
    Write-Host "   Found: $popplerCheck" -ForegroundColor Green
}

# Create virtual environment
Write-Host ""
Write-Host "3. Creating virtual environment..." -ForegroundColor Cyan
if (Test-Path ".venv") {
    Write-Host "   Virtual environment already exists" -ForegroundColor Yellow
} else {
    python -m venv .venv
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Virtual environment created" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
}

# Activate virtual environment
Write-Host ""
Write-Host "4. Activating virtual environment..." -ForegroundColor Cyan
& .\.venv\Scripts\Activate.ps1

# Upgrade pip
Write-Host ""
Write-Host "5. Upgrading pip..." -ForegroundColor Cyan
python -m pip install --upgrade pip --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "   pip upgraded" -ForegroundColor Green
} else {
    Write-Host "   WARNING: pip upgrade failed" -ForegroundColor Yellow
}

# Install PyTorch CPU
Write-Host ""
Write-Host "6. Installing PyTorch CPU wheels..." -ForegroundColor Cyan
Write-Host "   This may take a few minutes..." -ForegroundColor Yellow
pip install torch==2.4.0 torchvision==0.19.0 --index-url https://download.pytorch.org/whl/cpu --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "   PyTorch installed" -ForegroundColor Green
} else {
    Write-Host "   ERROR: PyTorch installation failed" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "7. Installing dependencies..." -ForegroundColor Cyan
Write-Host "   This may take a few minutes..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "   Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ERROR: Dependency installation failed" -ForegroundColor Red
    exit 1
}

# Create logs directory
Write-Host ""
Write-Host "8. Creating logs directory..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path "logs" -Force | Out-Null
Write-Host "   logs/ directory created" -ForegroundColor Green

# Run tests
Write-Host ""
Write-Host "9. Running tests..." -ForegroundColor Cyan
pytest tests -q
if ($LASTEXITCODE -eq 0) {
    Write-Host "   All tests passed" -ForegroundColor Green
} else {
    Write-Host "   WARNING: Some tests failed" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Place receipt images/PDFs in the samples/ folder" -ForegroundColor White
Write-Host "2. Run OCR:" -ForegroundColor White
Write-Host "   python -m receipt_ocr.cli samples\your_receipt.jpg" -ForegroundColor Yellow
Write-Host "   OR" -ForegroundColor White
Write-Host "   .\run_cli.ps1 samples\your_receipt.jpg" -ForegroundColor Yellow
Write-Host ""
Write-Host "For help:" -ForegroundColor Cyan
Write-Host "   python -m receipt_ocr.cli --help" -ForegroundColor Yellow
Write-Host ""

if (-not $popplerCheck) {
    Write-Host "REMINDER: Install Poppler for PDF support:" -ForegroundColor Yellow
    Write-Host "   choco install poppler -y" -ForegroundColor Yellow
    Write-Host ""
}
