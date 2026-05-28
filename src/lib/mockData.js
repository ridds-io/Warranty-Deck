// =============================================================================
// WARRANTYDECK — MOCK DATA
// src/lib/mockData.js
//
// Temporary UI data used until Supabase hooks are wired up.
// =============================================================================

export const receipts = [
  {
    id: 'rcpt-1001',
    storeName: 'Aurora Electronics',
    purchaseDate: '2025-01-24',
    totalAmount: 4299.0,
    category: 'Electronics',
    folderType: 'vault',
    returnDays: 5,
    hasWarranty: true,
    warrantyId: 'w-2001',
    items: [
      { name: 'Aurora 4K TV', qty: 1, price: 3999.0 },
      { name: 'Wall mount kit', qty: 1, price: 300.0 },
    ],
  },
  {
    id: 'rcpt-1002',
    storeName: 'Northside Grocers',
    purchaseDate: '2025-02-12',
    totalAmount: 185.5,
    category: 'Dining',
    folderType: 'vault',
    returnDays: 0,
    hasWarranty: false,
    warrantyId: null,
    items: [
      { name: 'Pantry staples', qty: 6, price: 120.5 },
      { name: 'Fresh produce', qty: 3, price: 65.0 },
    ],
  },
  {
    id: 'rcpt-1003',
    storeName: 'Lumen Camera Co',
    purchaseDate: '2025-03-04',
    totalAmount: 899.99,
    category: 'Electronics',
    folderType: 'reimbursement',
    returnDays: 14,
    hasWarranty: true,
    warrantyId: 'w-2002',
    items: [
      { name: 'Mirrorless camera', qty: 1, price: 899.99 },
    ],
  },
  {
    id: 'rcpt-1004',
    storeName: 'Evergreen Books',
    purchaseDate: '2025-03-19',
    totalAmount: 42.0,
    category: 'Lifestyle',
    folderType: 'memorabilia',
    returnDays: 0,
    hasWarranty: false,
    warrantyId: null,
    items: [
      { name: 'Hardcover anthology', qty: 1, price: 42.0 },
    ],
  },
  {
    id: 'rcpt-1005',
    storeName: 'Summit Outdoor',
    purchaseDate: '2025-04-02',
    totalAmount: 260.0,
    category: 'Travel',
    folderType: 'vault',
    returnDays: 30,
    hasWarranty: true,
    warrantyId: 'w-2003',
    items: [
      { name: 'Trail backpack', qty: 1, price: 210.0 },
      { name: 'Water filter', qty: 1, price: 50.0 },
    ],
  },
  {
    id: 'rcpt-1006',
    storeName: 'City Health',
    purchaseDate: '2025-04-18',
    totalAmount: 145.75,
    category: 'Medical',
    folderType: 'reimbursement',
    returnDays: 0,
    hasWarranty: false,
    warrantyId: null,
    items: [
      { name: 'Clinic visit', qty: 1, price: 145.75 },
    ],
  },
]

export const warranties = [
  {
    id: 'w-2001',
    title: 'Aurora 4K TV Coverage',
    provider: 'Aurora Care',
    purchaseDate: '2025-01-24',
    expiresOn: '2026-01-24',
    status: 'active',
    benefits: [
      'Panel replacement for defects',
      'One free in-home service visit',
      'Priority support line',
    ],
  },
  {
    id: 'w-2002',
    title: 'Lumen Camera Protection',
    provider: 'Lumen Shield',
    purchaseDate: '2025-03-04',
    expiresOn: '2027-03-04',
    status: 'active',
    benefits: [
      'Lens calibration included',
      'Two accidental damage claims',
      'Expedited repair turnaround',
    ],
  },
  {
    id: 'w-2003',
    title: 'Summit Pack Warranty',
    provider: 'Summit Outdoor',
    purchaseDate: '2025-04-02',
    expiresOn: '2025-10-02',
    status: 'expiring',
    benefits: [
      'Stitching repairs',
      'Hardware replacement',
      'Waterproofing refresh',
    ],
  },
]

export const notifications = [
  {
    id: 'note-1',
    title: 'Warranty expiring',
    message: 'Summit Pack warranty expires in 30 days.',
  },
  {
    id: 'note-2',
    title: 'Return window closing',
    message: 'Aurora Electronics return period ends soon.',
  },
]
