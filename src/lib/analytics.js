// =============================================================================
// WARRANTYDECK — ANALYTICS HELPERS
// src/lib/analytics.js
// =============================================================================

export function groupSpendByWeekday(receipts) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const totals = new Map(days.map(day => [day, 0]))

  receipts.forEach(receipt => {
    if (!receipt.purchaseDate || receipt.purchaseDate === '-') return
    const date = new Date(receipt.purchaseDate)
    if (Number.isNaN(date.getTime())) return
    const day = days[date.getDay()]
    totals.set(day, totals.get(day) + (receipt.totalAmount || 0))
  })

  return days.map(day => ({ label: day, value: totals.get(day) }))
}

export function groupSpendByCategory(receipts) {
  const totals = new Map()

  receipts.forEach(receipt => {
    const key = receipt.category || 'Uncategorized'
    const current = totals.get(key) || 0
    totals.set(key, current + (receipt.totalAmount || 0))
  })

  return Array.from(totals.entries()).map(([label, value]) => ({ label, value }))
}
