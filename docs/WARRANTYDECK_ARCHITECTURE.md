# WarrantyDeck — Architecture & Design System
> Complete blueprint before a single line of app code is written.
> Read this top to bottom before building anything.

---

## 1. WHAT WE'RE BUILDING

WarrantyDeck is a personal receipt + warranty management web app. It lives in the browser, talks to Supabase for auth + data, uses Tesseract.js for OCR receipt scanning, and Groq (LLaMA 3) for the AI chatbot.

**User journey in one line:**
Upload a receipt or warranty → AI reads and summarises it → get notified before things expire → chat about your products anytime.

---

## 2. TECH STACK

| Layer | Tool | Why |
|---|---|---|
| UI Framework | React (via CDN / Vite) | Component-based, great ecosystem |
| Styling | CSS Variables + custom CSS | Full control, receipt aesthetic |
| Auth | Supabase Auth (Google OAuth) | Already in your project |
| Database | Supabase Postgres | Already set up with your schema |
| File Storage | Supabase Storage | Receipt image/PDF uploads |
| OCR | Tesseract.js | Free, browser-based receipt parsing |
| AI Chatbot | Groq API (LLaMA 3.3 70B) | Fast, free tier, great comprehension |
| Notifications | Supabase Edge Functions (later) | Warranty expiry alerts |

---

## 3. YOUR EXISTING SCHEMA — MAPPED TO FEATURES

Here's how every table connects to a WarrantyDeck feature:

```
auth.users (Supabase built-in)
    └── public.user_profiles          → Profile page, "Hi [name]" greeting, theme preference
    └── public.receipts               → Receipt Vault (core feature)
            └── public.receipt_items  → Line items on each receipt
            └── public.warranties     → Warranty cards linked to receipts
    └── public.notifications          → Expiry alerts, return reminders
            └── public.notification_preferences → User's alert settings
                    └── public.escalation_rules → Escalation if alerts are ignored

public.products                       → Product catalogue (linked from receipt_items)
    └── public.categories             → Smart category tagging (Electronics, Dining, etc.)
    └── public.return_policies        → Store return policy lookup
    └── public.stores                 → Store directory

public.upload_history                 → Tracks every file upload, processing status
public.financial_knowledge            → Vector store for RAG chatbot (already has embeddings!)
```

### ⚠️ Schema gaps to fill (new columns/tables needed)

These features are planned but not in your schema yet. We'll add them with ALTER TABLE statements:

| Missing | Where | What to add |
|---|---|---|
| Theme preference | `user_profiles` | `theme text DEFAULT 'light'` |
| Folder type | `receipts` | `folder_type text DEFAULT 'vault'` — values: `'vault'`, `'memorabilia'`, `'reimbursement'` |
| Tags/notes | `receipts` | `tags text[]`, `notes text` |
| AI summary | `receipts` | `ai_summary text` |
| AI summary | `warranties` | `ai_summary text`, `warranty_benefits text` |
| Return deadline | `receipts` | `return_deadline date` (calculated from return_policies) |
| Category auto-tag | `receipts` | `category_id integer` FK to categories |

---

## 4. FILE ARCHITECTURE

```
warrantydeck/
│
├── index.html                  # Entry point
├── vite.config.js              # Build config
├── .env                        # 🔑 API keys — NEVER commit this
│
├── src/
│   ├── main.jsx                # App entry, mounts React
│   ├── App.jsx                 # Router, auth listener, theme provider
│   │
│   ├── lib/                    # Pure utility/service files (no UI)
│   │   ├── supabase.js         # Supabase client initialisation
│   │   ├── groq.js             # Groq API wrapper + prompt templates
│   │   ├── tesseract.js        # OCR helper — image → extracted text
│   │   ├── ocr-parser.js       # Takes raw OCR text → structured receipt object
│   │   └── date-utils.js       # Warranty expiry countdowns, return deadlines
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.js          # Auth state, Google login, logout
│   │   ├── useReceipts.js      # CRUD for receipts table
│   │   ├── useWarranties.js    # CRUD for warranties table
│   │   ├── useProfile.js       # User profile + theme preference
│   │   └── useNotifications.js # Fetch + manage notifications
│   │
│   ├── context/
│   │   ├── AuthContext.jsx     # Global auth state
│   │   └── ThemeContext.jsx    # Light/dark theme toggle
│   │
│   ├── pages/                  # One file per route/screen
│   │   ├── Landing.jsx         # Stats, pitch, login CTA
│   │   ├── Dashboard.jsx       # "Hi [name]" + summary cards
│   │   ├── Analytics.jsx       # Spending overview, category charts, expiry alerts
│   │   ├── Vault.jsx           # All receipts + warranties
│   │   ├── Memorabilia.jsx     # Sentimental bills
│   │   ├── Reimbursement.jsx   # Work/medical expense bills
│   │   ├── ReceiptDetail.jsx   # Single receipt + AI summary + chat
│   │   ├── WarrantyDetail.jsx  # Single warranty + benefits + chat
│   │   ├── Chatbot.jsx         # Global AI assistant
│   │   └── Settings.jsx        # Profile, theme toggle, notification prefs
│   │
│   ├── components/             # Reusable UI pieces
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── PageWrapper.jsx
│   │   │
│   │   ├── receipt/
│   │   │   ├── ReceiptCard.jsx      # Card in the vault grid
│   │   │   ├── ReceiptUploader.jsx  # Drag-drop + camera upload
│   │   │   ├── ReceiptScanner.jsx   # Tesseract OCR trigger
│   │   │   └── ReceiptSummary.jsx   # AI-generated benefit summary
│   │   │
│   │   ├── warranty/
│   │   │   ├── WarrantyCard.jsx
│   │   │   ├── WarrantyBadge.jsx    # "Expires in 30 days" pill
│   │   │   └── BenefitsList.jsx     # Parsed warranty benefits
│   │   │
│   │   ├── chat/
│   │   │   ├── ChatWindow.jsx       # Chat UI shell
│   │   │   ├── ChatMessage.jsx      # Individual message bubble
│   │   │   └── ChatInput.jsx        # Input + send button
│   │   │
│   │   ├── ui/                      # Design system primitives
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Tooltip.jsx
│   │   │   ├── TypewriterText.jsx   # "Hi Sarah" typing animation
│   │   │   └── ExpiryCountdown.jsx  # Days remaining display
│   │   │
│   │   └── charts/
│   │       ├── SpendingChart.jsx    # Monthly spend bar chart
│   │       └── CategoryPie.jsx     # Spend by category
│   │
│   └── styles/
│       ├── tokens.css          # ALL design tokens (colours, fonts, spacing)
│       ├── global.css          # Reset + base styles
│       ├── themes.css          # Light + dark theme variable overrides
│       └── animations.css      # Keyframes (typewriter, fade, slide)
│
├── public/
│   └── fonts/                  # Self-hosted fonts (see Design System below)
│
└── docs/
    └── ARCHITECTURE.md         # This file
```

---

## 5. DESIGN SYSTEM

### 5.1 Concept: Premium Paper Receipt

Every design decision should feel like you're holding a high-quality paper receipt — warm, tactile, structured, trustworthy. NOT cold or digital. The grid lines, the monospace type, the perforated edges — all of it should feel like paper brought to screen.

---

### 5.2 Typography

```css
/* PRIMARY — for headings, brand name, stats */
--font-display: 'Playfair Display', serif;
/* Feels like premium printed paper. Elegant, high contrast strokes. */

/* SECONDARY — for body text, labels, descriptions */
--font-body: 'DM Serif Text', serif;
/* Warm editorial serif. Readable at small sizes. */

/* MONO — for receipt data: amounts, dates, codes, IDs */
--font-mono: 'IBM Plex Mono', monospace;
/* The STAR of this design. Receipt numbers, prices, dates all live here. */
/* This is what makes it feel like an actual receipt. */
```

Import from Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Serif+Text&family=IBM+Plex+Mono:wght@300;400;500&display=swap" rel="stylesheet">
```

**Type scale:**
```
--text-xs:   0.75rem   /* receipt footnotes */
--text-sm:   0.875rem  /* labels, metadata */
--text-base: 1rem      /* body */
--text-lg:   1.125rem  /* card titles */
--text-xl:   1.25rem   /* section headers */
--text-2xl:  1.5rem    /* page titles */
--text-3xl:  2rem      /* dashboard greeting */
--text-5xl:  3.5rem    /* landing page stats */
```

---

### 5.3 Colour Palette

#### Light Theme (default — "Paper")
```css
:root {
  /* Backgrounds */
  --color-bg-base:      #FAF9F6;  /* warm white — like aged receipt paper */
  --color-bg-surface:   #F5F3EE;  /* slightly warmer — card backgrounds */
  --color-bg-elevated:  #EEEAE2;  /* hover states, sidebar */
  --color-bg-inset:     #E8E4DB;  /* input backgrounds */

  /* Text */
  --color-text-primary:   #1C1A17;  /* near-black, warm not cold */
  --color-text-secondary: #5C5750;  /* warm medium grey */
  --color-text-tertiary:  #9C9589;  /* muted labels */
  --color-text-inverse:   #FAF9F6;  /* text on dark bg */

  /* Borders & Lines */
  --color-border-strong:  #C8C3B8;  /* solid borders */
  --color-border-soft:    #E0DDD6;  /* subtle separators */
  --color-border-dashed:  #C8C3B8;  /* receipt perforations */

  /* Accent — the ONLY colour in an otherwise greyscale world */
  --color-accent:         #2C2C2C;  /* deep charcoal stamp */
  --color-accent-hover:   #1C1C1C;
  
  /* Status colours — muted, not neon */
  --color-success:   #4A7C59;  /* muted forest green */
  --color-warning:   #B5892A;  /* warm amber */
  --color-danger:    #8B3A3A;  /* muted crimson */
  --color-info:      #3A5F8B;  /* slate blue */

  /* Special */
  --color-stamp:     #8B3A3A;  /* "PAID", "EXPIRED" stamps */
  --color-highlight: #F0EAD0;  /* selected/highlighted receipts */
}
```

#### Dark Theme ("Carbon Copy")
```css
[data-theme="dark"] {
  /* Backgrounds */
  --color-bg-base:      #1C1A17;  /* deep warm charcoal */
  --color-bg-surface:   #252320;  /* card backgrounds */
  --color-bg-elevated:  #2E2B27;  /* hover states */
  --color-bg-inset:     #333028;  /* inputs */

  /* Text — warm whites, not cold */
  --color-text-primary:   #FAF9F6;
  --color-text-secondary: #C8C3B8;
  --color-text-tertiary:  #7A756C;
  --color-text-inverse:   #1C1A17;

  /* Borders */
  --color-border-strong:  #3D3A34;
  --color-border-soft:    #2A2822;
  --color-border-dashed:  #4A4640;

  /* Accent */
  --color-accent:         #F5F3EE;
  --color-accent-hover:   #FFFFFF;

  /* Status — slightly brighter in dark mode */
  --color-success:   #5A9C6E;
  --color-warning:   #C9A040;
  --color-danger:    #A04A4A;
  --color-info:      #4A7AAA;

  --color-stamp:     #A04A4A;
  --color-highlight: #2E2B20;
}
```

---

### 5.4 Spacing System
```css
/* 8px base grid */
--space-1:  0.25rem  /*  4px */
--space-2:  0.5rem   /*  8px */
--space-3:  0.75rem  /* 12px */
--space-4:  1rem     /* 16px */
--space-5:  1.25rem  /* 20px */
--space-6:  1.5rem   /* 24px */
--space-8:  2rem     /* 32px */
--space-10: 2.5rem   /* 40px */
--space-12: 3rem     /* 48px */
--space-16: 4rem     /* 64px */
--space-20: 5rem     /* 80px */
--space-24: 6rem     /* 96px */
```

---

### 5.5 Border Radius
```css
/* Receipts have SQUARE corners — minimal rounding */
--radius-sm:   2px   /* tags, badges */
--radius-md:   4px   /* cards — almost square */
--radius-lg:   6px   /* modals */
--radius-full: 9999px /* pills only */
```

---

### 5.6 Shadows
```css
/* Paper-lift shadows — warm, not grey/blue */
--shadow-sm:  0 1px 3px rgba(28, 26, 23, 0.08);
--shadow-md:  0 4px 12px rgba(28, 26, 23, 0.10);
--shadow-lg:  0 8px 24px rgba(28, 26, 23, 0.14);
--shadow-receipt: 2px 2px 0px rgba(28, 26, 23, 0.12); /* offset shadow like paper stacks */
```

---

### 5.7 Signature Visual Patterns

These make WarrantyDeck look like no other app:

**1. Perforated divider** — between receipt sections:
```css
.perforation {
  border-top: 2px dashed var(--color-border-dashed);
  margin: var(--space-6) 0;
}
```

**2. Receipt card** — with torn bottom edge illusion:
```css
.receipt-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-receipt);
  padding: var(--space-6);
  font-family: var(--font-mono);
}
```

**3. Stamp overlay** — for expired / returned / reimbursed:
```css
.stamp {
  position: absolute;
  border: 3px solid var(--color-stamp);
  color: var(--color-stamp);
  font-family: var(--font-mono);
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  transform: rotate(-12deg);
  opacity: 0.75;
  padding: var(--space-1) var(--space-3);
}
```

**4. Monospace data rows** — for amounts, dates, IDs:
```css
.receipt-row {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border-soft);
}
```

**5. Typewriter greeting** — JS animation on login:
```
"Hi Sarah_" — cursor blinks, letters appear one by one
Speed: 80ms per character
Cursor: blinking block ▌
```

---

## 6. PAGE-BY-PAGE BLUEPRINT

### 6.1 Landing Page (`/`)
```
┌─────────────────────────────────────┐
│  WARRANTYDECK          [Login]       │  ← Navbar, monospace brand name
├─────────────────────────────────────┤
│                                     │
│   Don't be one of them.             │  ← Playfair Display, large
│                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────┐│
│  │   75%    │ │  22.1%   │ │  47% ││  ← IBM Plex Mono, huge numbers
│  │ don't    │ │ returns  │ │ lose ││
│  │ know how │ │ no recpt │ │reimb ││
│  │ to claim │ │          │ │      ││
│  └──────────┘ └──────────┘ └──────┘│
│                                     │
│   WarrantyDeck will make sure       │
│   you're not one of them.           │  ← Playfair italic
│                                     │
│         [Get Started Free]          │  ← CTA button
│                                     │
├─────────────────────────────────────┤
│  Feature highlights (4 cards)       │
│  Receipts / Warranties / AI / Alerts│
└─────────────────────────────────────┘
```

### 6.2 Dashboard (`/dashboard`)
```
┌─────────────────────────────────────┐
│  Hi Sarah▌                          │  ← Typewriter animation
│  Here's your receipt overview       │
├──────────┬──────────────────────────┤
│ Sidebar  │  Summary cards           │
│          │  ┌────┐ ┌────┐ ┌────┐   │
│ Vault    │  │ 12 │ │  3 │ │ 2  │   │  ← total/expiring/reimbursable
│ Memorab. │  │rcpt│ │wrnt│ │alrt│   │
│ Reimb.   │  └────┘ └────┘ └────┘   │
│ Chatbot  │                          │
│ Settings │  Expiring soon ──────    │
│          │  ┌──────────────────┐    │
│          │  │ Samsung TV       │    │  ← WarrantyCard
│          │  │ Expires: 30 days │    │
│          │  └──────────────────┘    │
│          │                          │
│          │  Spending this month ─── │
│          │  [Bar chart]             │
└──────────┴──────────────────────────┘
```

### 6.3 Vault / Memorabilia / Reimbursement
All three use the same layout, filtered by `folder_type`:
```
Filter bar: [All] [Electronics] [Dining] [Travel] ...
Search bar

Grid of ReceiptCards:
┌──────────────┐ ┌──────────────┐
│ RECEIPT      │ │ RECEIPT      │
│ ──────────── │ │ ──────────── │
│ Store name   │ │ Store name   │
│ 24 Jan 2025  │ │ 12 Feb 2025  │
│ ──────────── │ │ ──────────── │
│ ₹ 4,299.00   │ │ ₹ 1,850.00   │
│ ──────────── │ │ ──────────── │
│ [WARRANTY ✓] │ │ [RETURN: 5d] │
└──────────────┘ └──────────────┘
```

### 6.4 Receipt Detail
```
Full receipt view (like a real unfolded receipt):
- Store header
- Perforated divider
- Line items (monospace table)
- Perforated divider  
- Total
- Perforated divider
- AI Summary box ("Benefits you can claim:")
- Warranty section (if exists)
- [Open Chat about this receipt]
```

### 6.5 Chatbot
```
Context-aware — knows which receipt/warranty you're viewing
Sidebar shows conversation history
Groq LLaMA 3.3 70B with system prompt:
  "You are a warranty and receipt assistant. You only answer
   questions about the user's products, warranties, and receipts.
   Current context: [receipt/warranty data injected here]"
```

### 6.6 Settings
```
Profile section:
  - Name, phone, address (from user_profiles)
  
Theme section:
  - [☀ Light — Paper]  [● Dark — Carbon Copy]
  - Saves to user_profiles.theme

Notifications section:
  - Toggle: warranty expiry alerts
  - Toggle: return deadline reminders
  - Days before expiry: [30] [14] [7]
```

---

## 7. DATA FLOW — HOW EVERYTHING CONNECTS

### Upload a receipt:
```
User drops image
→ Tesseract.js reads it → raw text
→ ocr-parser.js extracts: store, date, total, items
→ Groq API generates: ai_summary + warranty_benefits
→ INSERT into receipts (store_name, purchase_date, total_amount, ai_summary, folder_type)
→ INSERT into receipt_items (for each line item)
→ INSERT into upload_history (file metadata, status: completed)
→ If warranty detected → INSERT into warranties
→ Dashboard updates
```

### Open chatbot on a receipt:
```
User clicks "Chat about this"
→ receipt data + warranty data fetched from Supabase
→ Injected into Groq system prompt as context
→ User asks question → Groq responds with product-specific answer
→ Conversation stored in component state (not persisted — per session)
```

### Theme toggle:
```
User clicks Dark in Settings
→ UPDATE user_profiles SET theme = 'dark'
→ ThemeContext updates → document.documentElement.setAttribute('data-theme', 'dark')
→ All CSS variables switch instantly via :root vs [data-theme="dark"]
```

### Google login:
```
User clicks "Sign in with Google"
→ supabase.auth.signInWithOAuth({ provider: 'google' })
→ Supabase handles OAuth redirect
→ On return: session established
→ Check if user_profiles row exists → if not, INSERT with first_name from Google metadata
→ AuthContext updates → App shows Dashboard
→ Typewriter animation: "Hi [first_name]▌"
```

---

## 8. MISSING TABLES / NEW COLUMNS — SQL TO RUN

Run these in your Supabase SQL editor before building:

```sql
-- Add folder type to receipts (vault / memorabilia / reimbursement)
ALTER TABLE public.receipts 
  ADD COLUMN folder_type text DEFAULT 'vault' 
  CHECK (folder_type IN ('vault', 'memorabilia', 'reimbursement'));

-- Add AI summary and tags to receipts
ALTER TABLE public.receipts 
  ADD COLUMN ai_summary text,
  ADD COLUMN tags text[],
  ADD COLUMN notes text,
  ADD COLUMN return_deadline date,
  ADD COLUMN category_id integer REFERENCES public.categories(category_id);

-- Add AI summary and benefits to warranties
ALTER TABLE public.warranties 
  ADD COLUMN ai_summary text,
  ADD COLUMN warranty_benefits text;

-- Add theme preference to user_profiles
ALTER TABLE public.user_profiles 
  ADD COLUMN theme text DEFAULT 'light' 
  CHECK (theme IN ('light', 'dark'));

-- Add avatar URL (comes from Google OAuth)
ALTER TABLE public.user_profiles 
  ADD COLUMN avatar_url text;
```

---

## 9. ENV FILE STRUCTURE

Create a `.env` file in the project root (never commit this):

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
```

Access in code: `import.meta.env.VITE_SUPABASE_URL`

---

## 10. BUILD ORDER (WHAT WE BUILD FIRST → LAST)

```
Phase 1 — Foundation
  [ ] Design tokens (tokens.css, themes.css, animations.css)
  [ ] Supabase client (lib/supabase.js)
  [ ] Auth context + Google login (context/AuthContext.jsx, hooks/useAuth.js)
  [ ] App.jsx with routing

Phase 2 — Landing Page
  [ ] Landing.jsx with stats + pitch
  [ ] TypewriterText.jsx component

Phase 3 — Core Vault
  [ ] Dashboard.jsx
  [ ] Vault.jsx + ReceiptCard.jsx
  [ ] ReceiptUploader.jsx + Tesseract OCR
  [ ] ReceiptDetail.jsx + AI summary via Groq

Phase 4 — Warranties
  [ ] WarrantyCard.jsx + WarrantyDetail.jsx
  [ ] BenefitsList.jsx + ExpiryCountdown.jsx

Phase 5 — Folders
  [ ] Memorabilia.jsx
  [ ] Reimbursement.jsx

Phase 6 — Chatbot
  [ ] ChatWindow.jsx + Groq integration
  [ ] Context-aware prompting

Phase 7 — Settings & Polish
  [ ] Settings.jsx + theme toggle
  [ ] SpendingChart.jsx
  [ ] Notifications UI
  [ ] Export to PDF
```

---

## 11. KEY DECISIONS & RATIONALE

| Decision | Why |
|---|---|
| IBM Plex Mono for data | Makes amounts/dates feel like a real receipt printout |
| Square corners (2–4px radius) | Receipts don't have rounded corners |
| Warm whites not pure white | Pure white (#FFF) feels digital/cold; #FAF9F6 feels paper |
| folder_type on receipts table | Simpler than 3 separate tables; same receipt can move between folders |
| Groq over OpenAI | Free tier, very fast, LLaMA 3.3 70B is excellent for structured data Q&A |
| Theme stored in Supabase | Persists across devices/sessions, not just localStorage |
| Tesseract in browser | No server needed, fully free, works offline |

---

*End of WarrantyDeck Architecture & Design System v1.0*
*Next step: Run the SQL migrations, then we start Phase 1.*
