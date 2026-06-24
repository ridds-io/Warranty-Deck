// =============================================================================
// WARRANTYDECK — useWarranties
// src/hooks/useWarranties.js
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

function computeStatus(expiresOn) {
  if (!expiresOn || expiresOn === '-') return 'active'
  const today = new Date()
  const expiry = new Date(expiresOn)
  const diffMs = expiry.getTime() - today.setHours(0, 0, 0, 0)
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'expired'
  if (days <= 30) return 'expiring'
  return 'active'
}

function toBenefits(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  return String(value)
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

function mapWarranty(row) {
  const expiresOn = formatDate(row.warranty_end_date || row.expires_on || row.expiry_date || row.end_date)
  return {
    id: row.id,
    receiptId: row.receipt_id || row.receiptId || null,
    title: row.title || row.product_name || row.warranty_name || 'Warranty',
    provider: row.provider || row.brand || 'Coverage',
    purchaseDate: formatDate(row.warranty_start_date || row.purchase_date || row.purchaseDate),
    expiresOn,
    status: row.status || computeStatus(expiresOn),
    benefits: toBenefits(row.warranty_benefits || row.benefits),
  }
}

export function useWarranties() {
  const { user } = useAuth()
  const [warranties, setWarranties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchWarranties = useCallback(async () => {
    if (!user) {
      setWarranties([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    let query = supabase
      .from('warranties')
      .select('*')
      .order('warranty_end_date', { ascending: true })

    if (user?.id) {
      query = query.eq('user_id', user.id)
    }

    const { data, error: queryError } = await query

    if (queryError) {
      setError(queryError)
      setWarranties([])
    } else {
      setWarranties((data || []).map(mapWarranty))
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchWarranties()
  }, [fetchWarranties])

  return { warranties, loading, error, refresh: fetchWarranties }
}

export function useWarranty(warrantyId) {
  const { user } = useAuth()
  const [warranty, setWarranty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchWarranty = useCallback(async () => {
    if (!user || !warrantyId) {
      setWarranty(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    let query = supabase
      .from('warranties')
      .select('*')
      .eq('id', warrantyId)

    if (user?.id) {
      query = query.eq('user_id', user.id)
    }

    const { data, error: queryError } = await query.single()

    if (queryError) {
      setError(queryError)
      setWarranty(null)
    } else {
      setWarranty(mapWarranty(data))
    }

    setLoading(false)
  }, [user, warrantyId])

  useEffect(() => {
    fetchWarranty()
  }, [fetchWarranty])

  return { warranty, loading, error, refresh: fetchWarranty }
}
