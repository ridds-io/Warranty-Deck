// =============================================================================
// WARRANTYDECK — useReceipts
// src/hooks/useReceipts.js
// =============================================================================

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toISOString().split('T')[0]
}

function calculateReturnDays(returnDeadline) {
  if (!returnDeadline) return 0
  const today = new Date()
  const deadline = new Date(returnDeadline)
  const diffMs = deadline.getTime() - today.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

function mapReceipt(row) {
  return {
    id: row.id,
    storeName: row.store_name || row.store || 'Unknown store',
    purchaseDate: formatDate(row.purchase_date || row.purchaseDate),
    totalAmount: Number(row.total_amount || row.total || 0),
    category: row.category_name || row.category || 'Uncategorized',
    folderType: row.folder_type || 'vault',
    returnDays: calculateReturnDays(row.return_deadline),
    hasWarranty: Boolean(row.has_warranty || row.warranty_id),
    warrantyId: row.warranty_id || null,
    aiSummary: row.ai_summary || '',
    imagePath: row.file_url || null,
    items: Array.isArray(row.receipt_items)
      ? row.receipt_items.map(item => ({
        name: item.item_description || item.item_name || item.name || 'Item',
        qty: Number(item.quantity || item.qty || 1),
        price: Number(item.unit_price || item.price || item.amount || 0),
      }))
      : [],
  }
}

export function useReceipts() {
  const { user } = useAuth()
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchReceipts = useCallback(async () => {
    if (!user) {
      setReceipts([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    let query = supabase
      .from('receipts')
      .select(`
        id,
        user_id,
        store_name,
        purchase_date,
        total_amount,
        category_name,
        category_id,
        folder_type,
        return_deadline,
        has_warranty,
        warranty_id,
        ai_summary,
        file_url,
        receipt_items(*)
      `)
      .order('purchase_date', { ascending: false })

    if (user?.id) {
      query = query.eq('user_id', user.id)
    }

    const { data, error: queryError } = await query

    if (queryError) {
      setError(queryError)
      setReceipts([])
    } else {
      setReceipts((data || []).map(mapReceipt))
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchReceipts()
  }, [fetchReceipts])

  return { receipts, loading, error, refresh: fetchReceipts }
}

export function useReceipt(receiptId) {
  const { user } = useAuth()
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchReceipt = useCallback(async () => {
    if (!user || !receiptId) {
      setReceipt(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    let query = supabase
      .from('receipts')
      .select(`
        id,
        user_id,
        store_name,
        purchase_date,
        total_amount,
        category_name,
        category_id,
        folder_type,
        return_deadline,
        has_warranty,
        warranty_id,
        ai_summary,
        file_url,
        receipt_items(*)
      `)
      .eq('id', receiptId)

    if (user?.id) {
      query = query.eq('user_id', user.id)
    }

    const { data, error: queryError } = await query.single()

    if (queryError) {
      setError(queryError)
      setReceipt(null)
    } else {
      setReceipt(mapReceipt(data))
    }

    setLoading(false)
  }, [user, receiptId])

  useEffect(() => {
    fetchReceipt()
  }, [fetchReceipt])

  return { receipt, loading, error, refresh: fetchReceipt }
}
