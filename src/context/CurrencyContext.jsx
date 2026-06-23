// =============================================================================
// WARRANTYDECK — CURRENCY CONTEXT
// src/context/CurrencyContext.jsx
// =============================================================================

import { createContext, useContext, useState, useCallback } from 'react'

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', label: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (GBP)' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee (INR)' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar (CAD)' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar (AUD)' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen (JPY)' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar (SGD)' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc (CHF)' },
  { code: 'AED', symbol: 'AED', label: 'UAE Dirham (AED)' },
]

export { CURRENCIES }

const CurrencyContext = createContext(null)

function getStoredCurrency() {
  try {
    return localStorage.getItem('warrantydeck_currency') || 'USD'
  } catch {
    return 'USD'
  }
}

function storeCurrency(code) {
  try {
    localStorage.setItem('warrantydeck_currency', code)
  } catch {
    // silent
  }
}

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => getStoredCurrency())

  const setCurrency = useCallback((code) => {
    setCurrencyState(code)
    storeCurrency(code)
  }, [])

  const formatAmount = useCallback((amount) => {
    const cur = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0]
    const num = Number(amount) || 0

    // Use Intl.NumberFormat for proper locale-aware formatting
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: cur.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num)
    } catch {
      return `${cur.symbol}${num.toFixed(2)}`
    }
  }, [currency])

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount, currencies: CURRENCIES }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === null) {
    throw new Error('[WarrantyDeck] useCurrency() must be inside <CurrencyProvider>')
  }
  return context
}
