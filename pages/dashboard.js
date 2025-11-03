import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { DashboardLayout } from '../components/DashboardLayout'

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const [receipts, setReceipts] = useState([])
  const [warranties, setWarranties] = useState([])
  const [stats, setStats] = useState({
    totalReceipts: 0,
    activeWarranties: 0,
    expiringSoon: 0,
    totalCoverage: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && user) {
      loadDashboardData()
    }
  }, [user, authLoading])

  const loadDashboardData = async () => {
    try {
      const userId = user.id

      // Fetch receipts
      const { data: receiptsData, error: receiptsError } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', userId)
        .order('upload_date', { ascending: false })

      if (receiptsError) throw receiptsError

      // Fetch warranties
      const today = new Date().toISOString().split('T')[0]
      const { data: warrantiesData, error: warrantiesError } = await supabase
        .from('warranties')
        .select('*')
        .eq('user_id', userId)
        .gte('warranty_end_date', today)
        .order('warranty_end_date', { ascending: true })

      if (warrantiesError) throw warrantiesError

      setReceipts(receiptsData || [])
      setWarranties(warrantiesData || [])

      // Calculate stats
      const totalReceipts = receiptsData?.length || 0
      const activeWarranties = warrantiesData?.length || 0
      
      // Calculate expiring soon (within 90 days)
      const ninetyDaysFromNow = new Date()
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)
      const expiringSoon = warrantiesData?.filter(w => {
        const endDate = new Date(w.warranty_end_date)
        return endDate <= ninetyDaysFromNow && endDate >= new Date()
      }).length || 0

      // Calculate total coverage (sum of receipt amounts)
      const totalCoverage = receiptsData?.reduce((sum, r) => sum + (parseFloat(r.total_amount) || 0), 0) || 0

      setStats({
        totalReceipts,
        activeWarranties,
        expiringSoon,
        totalCoverage
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
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
    <DashboardLayout>
      <div className="p-6 space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's an overview of your receipts and warranties</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Receipts</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.totalReceipts}</p>
            <p className="text-xs text-gray-500 mt-1">Documents uploaded</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Active Warranties</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.activeWarranties}</p>
            <p className="text-xs text-gray-500 mt-1">Currently active</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Expiring Soon</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.expiringSoon}</p>
            <p className="text-xs text-gray-500 mt-1">Next 90 days</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Coverage</h3>
            <p className="text-2xl font-bold text-gray-900">
              ${stats.totalCoverage.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">Protected value</p>
          </div>
        </div>

        {/* Upload Button */}
        <Link href="/upload">
          <button className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 mb-8">
            + Upload New Receipt
          </button>
        </Link>

        {/* Recent Receipts */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Recent Receipts</h2>
            <p className="text-sm text-gray-600 mt-1">All your uploaded receipts</p>
          </div>
          <div className="p-6">
            {receipts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No receipts yet. Start by uploading one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold">Store</th>
                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                      <th className="text-left py-3 px-4 font-semibold">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold">Receipt #</th>
                      <th className="text-left py-3 px-4 font-semibold">Uploaded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {receipts.slice(0, 10).map((receipt) => (
                      <tr key={receipt.receipt_id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{receipt.store_name || 'Unknown'}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {receipt.purchase_date ? new Date(receipt.purchase_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          ${parseFloat(receipt.total_amount || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{receipt.receipt_number || 'N/A'}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(receipt.upload_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

