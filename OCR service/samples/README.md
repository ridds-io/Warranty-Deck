# Sample Receipts

Place your test receipt images or PDFs in this folder.

## Supported formats

- **Images**: PNG, JPG, JPEG, TIFF, BMP
- **PDFs**: Multi-page PDFs (up to 10 pages by default)

## Quick test

```powershell
# From project root
python -m receipt_ocr.cli samples\your_receipt.jpg
```

## Tips for best results

1. **Image quality**: Use high-resolution scans or photos (300+ DPI)
2. **Lighting**: Ensure even lighting with no shadows
3. **Orientation**: Keep receipt text straight (not skewed)
4. **Contrast**: Good contrast between text and background
5. **Format**: Common retail receipt layouts work best

## Example receipt structure

For optimal parsing, receipts should typically have:

```
STORE NAME
Address Line 1
Address Line 2
Website

Receipt No: ABC123
Date: 15/01/2024

ITEM 1        10.00
ITEM 2  2x    50.00

Subtotal     60.00
Tax (10%)     6.00
Total        66.00

Payment: VISA ****1234
Thank you!
```
