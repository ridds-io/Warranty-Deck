# Warranty Deck

A digital receipt and warranty management system built with Next.js and Supabase.

## Features

- 🔐 **Authentication**: Secure login/signup with Supabase Auth
- 📄 **Receipt Management**: Upload and store receipts with OCR text extraction
- 🛡️ **Warranty Tracking**: Track product warranties with expiry notifications
- 📊 **Dashboard**: View statistics and recent receipts
- 🔔 **Notifications**: Configure email, SMS, and push notification preferences
- 🖼️ **Image Storage**: Supabase Storage integration for receipt images

## Tech Stack

- **Frontend**: Next.js 16, React 19
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **OCR**: Tesseract.js (client-side)
- **Styling**: Tailwind CSS

## Project Structure

```
warranty-deck/
├── pages/              # Next.js Pages Router
│   ├── index.js       # Landing page (redirects)
│   ├── login.js       # Login page
│   ├── signup.js      # Signup page
│   ├── dashboard.js   # Main dashboard
│   ├── upload.js      # Receipt upload with OCR
│   ├── receipts.js    # Receipts listing
│   ├── warranties.js  # Warranties listing
│   └── settings.js    # User settings
├── lib/
│   ├── supabase.js    # Supabase client
│   ├── auth.js        # Auth utilities
│   └── ocr.js         # OCR wrapper
└── supabase_queries.sql  # Advanced SQL queries
```

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create `.env.local` in the root directory:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Set up Supabase Database:**
   - Run the SQL queries from `supabase_queries.sql` in your Supabase SQL Editor
   - This will create views, functions, procedures, and triggers

4. **Set up Storage Buckets:**
   - In Supabase Dashboard, go to Storage
   - Create two public buckets: `receipts` and `warranties`

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

### Tables

- **users**: User profiles
  - user_id (UUID, Primary Key)
  - email
  - password_hash (not used with Supabase Auth)
  - first_name
  - phone
  - created_at

- **receipts**: Receipt records
  - receipt_id (UUID, Primary Key)
  - user_id (Foreign Key → users)
  - receipt_number
  - file_url
  - store_name
  - purchase_date
  - total_amount
  - upload_date
  - status

- **warranties**: Warranty records
  - warranty_id (UUID, Primary Key)
  - user_id (Foreign Key → users)
  - receipt_id (Foreign Key → receipts)
  - product_name
  - brand
  - warranty_start_date
  - warranty_end_date
  - warranty_type
  - warranty_number
  - file_url
  - status
  - created_at

- **notification_preferences**: User notification settings
  - preference_id (UUID, Primary Key)
  - user_id (Foreign Key → users)
  - email_enabled
  - sms_enabled
  - push_enabled
  - days_before_expiry
  - created_at

## Advanced SQL Features

The `supabase_queries.sql` file contains:

- **Views**: 
  - `active_warranties_view`: Active warranties with user/receipt info
  - `user_dashboard_stats`: Aggregated user statistics
  - `expiring_warranties_view`: Warranties expiring within 90 days

- **Functions**:
  - `get_warranty_days_remaining()`: Calculate days until warranty expires
  - `get_user_total_coverage()`: Sum of all receipt amounts
  - `check_warranty_status()`: Determine warranty status
  - `get_expiring_warranties_count()`: Count expiring warranties

- **Procedures**:
  - `create_warranty_from_receipt()`: Auto-create warranty from receipt
  - `update_warranty_statuses()`: Batch update expired warranties
  - `get_user_dashboard()`: Retrieve dashboard statistics

- **Triggers**:
  - `on_auth_user_created`: Auto-create user record on signup
  - `check_warranty_expiry`: Auto-update warranty status
  - `set_receipt_upload_date`: Set upload timestamp

- **Advanced Queries**:
  - Complex JOINs with aggregations
  - Window functions (RANK, PERCENT_RANK)
  - Subqueries with EXISTS
  - CTEs (Common Table Expressions)
  - UNION queries

## Usage

### Authentication
1. Sign up with email and password
2. User record is automatically created in `users` table via trigger
3. Login redirects to dashboard

### Upload Receipt
1. Go to Upload page
2. Select a receipt image
3. Click "Extract Text with OCR" to run OCR
4. Review and edit extracted data
5. Click "Save Receipt" to upload

### View Dashboard
- See total receipts count
- View active warranties
- Check warranties expiring soon (90 days)
- View total coverage value

### Manage Warranties
- View all warranties
- Filter by: All, Active, Expiring Soon
- See warranty status and days remaining

### Settings
- Configure notification preferences
- Enable/disable email, SMS, push notifications
- Set days before expiry to notify

## Notes

- OCR processing happens client-side using Tesseract.js
- Images are stored in Supabase Storage buckets
- All database queries use Supabase client with RLS (Row Level Security)
- User can only see their own data (filtered by user_id)

## Development

This project uses Next.js Pages Router. For API routes, see `pages/api/` directory.

To build for production:
```bash
npm run build
npm start
```
