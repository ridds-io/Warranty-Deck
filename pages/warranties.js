import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export default function WarrantiesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [warranties, setWarranties] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, active, expiring

  useEffect(() => {
    if (!authLoading && user) {
      loadWarranties()
    }
  }, [user, authLoading])

  const loadWarranties = async () => {
    try {
      const userId = user.id
      const today = new Date().toISOString().split('T')[0]
      
      let query = supabase
        .from('warranties')
        .select('*, receipts(*)')
        .eq('user_id', userId)

      // Apply filter
      if (filter === 'active') {
        query = query.gte('warranty_end_date', today)
      } else if (filter === 'expiring') {
        const ninetyDaysFromNow = new Date()
        ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)
        query = query.gte('warranty_end_date', today).lte('warranty_end_date', ninetyDaysFromNow.toISOString().split('T')[0])
      }

      const { data, error } = await query.order('warranty_end_date', { ascending: true })

      if (error) throw error
      setWarranties(data || [])
    } catch (error) {
      console.error('Error loading warranties:', error)
      alert('Failed to load warranties. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      loadWarranties()
    }
  }, [filter])

  const getWarrantyStatus = (endDate) => {
    const today = new Date()
    const end = new Date(endDate)
    const daysRemaining = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
    
    if (daysRemaining < 0) return { status: 'expired', color: 'red', text: 'Expired' }
    if (daysRemaining <= 30) return { status: 'expiring', color: 'orange', text: `${daysRemaining} days left` }
    if (daysRemaining <= 90) return { status: 'warning', color: 'yellow', text: `${daysRemaining} days left` }
    return { status: 'active', color: 'green', text: `${daysRemaining} days left` }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/dashboard" className="text-xl font-bold text-blue-600">
              Warranty Deck
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">Dashboard</Link>
              <Link href="/upload" className="text-gray-700 hover:text-gray-900">Upload</Link>
              <Link href="/receipts" className="text-gray-700 hover:text-gray-900">Receipts</Link>
              <Link href="/settings" className="text-gray-700 hover:text-gray-900">Settings</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Warranties</h1>
            <p className="text-gray-600 mt-1">Manage your product warranties</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-md ${filter === 'active' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('expiring')}
              className={`px-4 py-2 rounded-md ${filter === 'expiring' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              Expiring Soon
            </button>
          </div>
        </div>

        {warranties.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No warranties found.</p>
            <Link href="/upload" className="text-blue-600 hover:underline">
              Upload a receipt to create a warranty
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {warranties.map((warranty) => {
              const status = getWarrantyStatus(warranty.warranty_end_date)
              return (
                <div key={warranty.warranty_id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{warranty.product_name || 'Unknown Product'}</h3>
                      <p className="text-sm text-gray-600">{warranty.brand || 'Unknown Brand'}</p>
                    </div>
                    <span 
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        status.color === 'red' ? 'bg-red-100 text-red-800' :
                        status.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                        status.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}
                    >
                      {status.text}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-600">Start Date</p>
                      <p className="font-semibold">
                        {warranty.warranty_start_date
                          ? new Date(warranty.warranty_start_date).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">End Date</p>
                      <p className="font-semibold">
                        {new Date(warranty.warranty_end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Type</p>
                      <p className="font-semibold">{warranty.warranty_type || 'Standard'}</p>
                    </div>
                    {warranty.warranty_number && (
                      <div>
                        <p className="text-gray-600">Warranty #</p>
                        <p className="font-semibold">{warranty.warranty_number}</p>
                      </div>
                    )}
                  </div>
                  {warranty.receipts && warranty.receipts.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <Link
                        href="/receipts"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View Receipt →
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

