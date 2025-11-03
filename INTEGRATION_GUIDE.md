# Integration Guide - Teammate Code

This guide explains how your teammates' code has been integrated into the main project.

## Frontend Components Integration

Your teammate's frontend components from `frontend/` folder have been adapted for Pages Router:

### ✅ Integrated Components

1. **WarrantyDeckLogo** (`components/WarrantyDeckLogo.js`)
   - Converted from TypeScript to JavaScript
   - Compatible with Pages Router
   - Usage: `<WarrantyDeckLogo size={32} />`

2. **Navbar** (`components/Navbar.js`)
   - Converted from App Router to Pages Router
   - Uses Supabase auth instead of zustand store
   - Includes notification bell and profile dropdown
   - Usage: `<Navbar notificationCount={5} />`

3. **Sidebar** (`components/Sidebar.js`)
   - Converted from App Router to Pages Router
   - Uses Next.js router.pathname instead of usePathname hook
   - Includes navigation with icons
   - Usage: `<Sidebar />`

4. **DashboardLayout** (`components/DashboardLayout.js`)
   - Combines Navbar and Sidebar in a layout wrapper
   - Usage: Wrap your page content with `<DashboardLayout>...</DashboardLayout>`

### Updated Pages

- ✅ `pages/dashboard.js` - Now uses DashboardLayout
- ⚠️ Other pages (`upload.js`, `receipts.js`, `warranties.js`, `settings.js`) can be updated similarly

## OCR Service Integration

Your teammate's Python OCR service has been integrated in two ways:

### Option 1: Enhanced JavaScript Parser (Currently Active)

The JavaScript parser in `lib/ocr.js` has been enhanced with logic from `OCR service/receipt_ocr/receipt_parser.py`:

- ✅ Advanced store name detection (uppercase ratio, keywords)
- ✅ Better receipt number extraction
- ✅ Multiple date format parsing
- ✅ Tax amount extraction
- ✅ Payment method detection
- ✅ Currency inference
- ✅ Line items parsing with quantity and unit price

**Usage:** Already integrated in `pages/upload.js` - works client-side with Tesseract.js

### Option 2: Python OCR Service API Route (Optional)

An API route at `pages/api/ocr/process.js` allows you to use the Python OCR service:

**Setup Steps:**

1. Start your Python OCR service:
   ```bash
   cd "OCR service"
   python -m receipt_ocr.cli --help  # Check if it works
   ```

2. Create a simple API wrapper in Python (or use Flask/FastAPI):
   ```python
   # Example: Create a simple HTTP server for OCR
   # You may need to create this based on your Python service structure
   ```

3. Set environment variable:
   ```
   OCR_SERVICE_URL=http://localhost:8000  # Or your Python service URL
   ```

4. Update `pages/upload.js` to call the API route instead of Tesseract.js:
   ```javascript
   // Instead of: extractTextFromImage(file)
   const formData = new FormData()
   formData.append('file', file)
   const response = await fetch('/api/ocr/process', {
     method: 'POST',
     body: formData
   })
   const data = await response.json()
   ```

**Benefits of Python OCR:**
- More accurate (docTR with PyTorch)
- Better structured parsing
- Handles PDFs natively
- More sophisticated receipt parsing

**Benefits of JavaScript OCR:**
- No backend needed
- Faster for simple receipts
- Works offline
- Easier deployment

## How to Use the Integrated Components

### Update a Page to Use New Layout

Example for `pages/receipts.js`:

```javascript
import { DashboardLayout } from '../components/DashboardLayout'

export default function ReceiptsPage() {
  // ... your code ...
  
  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Your page content */}
      </div>
    </DashboardLayout>
  )
}
```

### Using the Enhanced OCR Parser

The enhanced parser returns more data:

```javascript
import { extractTextFromImage, parseReceiptData } from '../lib/ocr'

const { text } = await extractTextFromImage(file)
const parsed = parseReceiptData(text)

// parsed now includes:
// - store_name, store_address, store_website
// - total_amount, tax_amount
// - receipt_number
// - payment_method
// - currency
// - items[] (with description, quantity, unit_price, total_price)
```

## Next Steps

1. **Update remaining pages** to use DashboardLayout:
   - `pages/upload.js`
   - `pages/receipts.js`
   - `pages/warranties.js`
   - `pages/settings.js`

2. **Optional: Set up Python OCR service** if you want more accuracy:
   - Follow the API route integration steps above
   - Or keep using client-side Tesseract.js

3. **Test the enhanced parser** with real receipts to see improved extraction

## Files Added/Modified

- ✅ `components/WarrantyDeckLogo.js` - Logo component
- ✅ `components/Navbar.js` - Navigation bar with profile dropdown
- ✅ `components/Sidebar.js` - Side navigation
- ✅ `components/DashboardLayout.js` - Layout wrapper
- ✅ `lib/ocr.js` - Enhanced with Python parsing logic
- ✅ `pages/api/ocr/process.js` - API route for Python OCR service
- ✅ `pages/dashboard.js` - Updated to use DashboardLayout

All components maintain the same visual design as your teammate's frontend while being compatible with Pages Router and Supabase authentication.

