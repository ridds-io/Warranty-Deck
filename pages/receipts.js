import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export default function ReceiptsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReceipt, setSelectedReceipt] = useState(null)

  useEffect(() => {
    if (!authLoading && user) {
      loadReceipts()
    }
  }, [user, authLoading])

  const loadReceipts = async () => {
    try {
      const userId = user.id
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', userId)
        .order('upload_date', { ascending: false })

      if (error) throw error
      setReceipts(data || [])
    } catch (error) {
      console.error('Error loading receipts:', error)
      alert('Failed to load receipts. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (receiptId) => {
    if (!confirm('Are you sure you want to delete this receipt?')) return

    try {
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('receipt_id', receiptId)
        .eq('user_id', user.id)

      if (error) throw error
      loadReceipts()
    } catch (error) {
      console.error('Error deleting receipt:', error)
      alert('Failed to delete receipt.')
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/dashboard" className="text-xl font-bold text-blue-600">
              Warranty Deck
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">Dashboard</Link>
              <Link href="/upload" className="text-blue-600 hover:text-blue-700">Upload</Link>
              <Link href="/warranties" className="text-gray-700 hover:text-gray-900">Warranties</Link>
              <Link href="/settings" className="text-gray-700 hover:text-gray-900">Settings</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
          <p className="text-gray-600 mt-1">View all your uploaded receipts</p>
        </div>

        {receipts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No receipts yet.</p>
            <Link href="/upload" className="text-blue-600 hover:underline">
              Upload your first receipt
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {receipts.map((receipt) => (
              <div key={receipt.receipt_id} className="bg-white rounded-lg shadow overflow-hidden">
                {receipt.file_url && (
                  <img
                    src={receipt.file_url}
                    alt={receipt.store_name}
                    className="w-full h-48 object-cover cursor-pointer"
                    onClick={() => setSelectedReceipt(receipt)}
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{receipt.store_name || 'Unknown Store'}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {receipt.purchase_date ? new Date(receipt.purchase_date).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-lg font-bold mt-2">
                    ${parseFloat(receipt.total_amount || 0).toFixed(2)}
                  </p>
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => setSelectedReceipt(receipt)}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(receipt.receipt_id)}
                      className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt Detail Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{selectedReceipt.store_name || 'Unknown Store'}</h2>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              {selectedReceipt.file_url && (
                <img
                  src={selectedReceipt.file_url}
                  alt={selectedReceipt.store_name}
                  className="w-full rounded-lg mb-4"
                />
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Purchase Date</p>
                  <p className="font-semibold">
                    {selectedReceipt.purchase_date
                      ? new Date(selectedReceipt.purchase_date).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Total Amount</p>
                  <p className="font-semibold">
                    ${parseFloat(selectedReceipt.total_amount || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Receipt Number</p>
                  <p className="font-semibold">{selectedReceipt.receipt_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Upload Date</p>
                  <p className="font-semibold">
                    {new Date(selectedReceipt.upload_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

