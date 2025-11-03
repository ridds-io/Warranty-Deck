# PowerShell wrapper to run receipt OCR CLI
$env:PYTHONPATH = "$PWD"
python -m receipt_ocr.cli $args
