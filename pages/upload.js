import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { extractTextFromImage, parseReceiptData } from '../lib/ocr'

export default function UploadPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [ocrText, setOcrText] = useState('')
  const [parsedData, setParsedData] = useState(null)
  const [formData, setFormData] = useState({
    store_name: '',
    purchase_date: '',
    total_amount: '',
    receipt_number: ''
  })
  const [loading, setLoading] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError('')
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const [usePythonOCR, setUsePythonOCR] = useState(false)
  const [ocrServiceStatus, setOcrServiceStatus] = useState('unknown') // 'unknown', 'available', 'unavailable'

  // Check Python OCR service availability
  useEffect(() => {
    const checkOCRService = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 2000)
        
        const response = await fetch('http://localhost:8000/health', {
          method: 'GET',
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          setOcrServiceStatus('available')
        } else {
          setOcrServiceStatus('unavailable')
        }
      } catch (err) {
        setOcrServiceStatus('unavailable')
      }
    }
    checkOCRService()
  }, [])

  const handleOCR = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setOcrLoading(true)
    setError('')

    try {
      if (usePythonOCR && ocrServiceStatus === 'available') {
        // Use Python OCR service (more accurate)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('return_text', 'true')

        const response = await fetch('/api/ocr/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'OCR service error')
        }

        const data = await response.json()
        
        setOcrText(data.text || '')
        
        // Use parsed data from Python service
        if (data.parsed) {
          setParsedData(data.parsed)
          setFormData({
            store_name: data.parsed.store_name || '',
            purchase_date: data.parsed.purchase_date || '',
            total_amount: data.parsed.total_amount?.toString() || '',
            receipt_number: data.parsed.receipt_number || ''
          })
        }
      } else {
        // Use client-side Tesseract.js (fallback or by choice)
        const { text } = await extractTextFromImage(file)
        setOcrText(text)

        // Parse receipt data
        const parsed = parseReceiptData(text)
        setParsedData(parsed)
        setFormData({
          store_name: parsed.store_name,
          purchase_date: parsed.purchase_date,
          total_amount: parsed.total_amount.toString(),
          receipt_number: parsed.receipt_number
        })
      }
    } catch (err) {
      console.error('OCR Error:', err)
      setError(`Failed to extract text from image: ${err.message}. ${usePythonOCR ? 'Try using client-side OCR instead.' : ''}`)
    } finally {
      setOcrLoading(false)
    }
  }

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || !user) return

    setLoading(true)
    setError('')

    try {
      const userId = user.id
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName)

      const fileUrl = urlData.publicUrl

      // Insert receipt into database
      const { data: receiptData, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          user_id: userId,
          receipt_number: formData.receipt_number,
          file_url: fileUrl,
          store_name: formData.store_name,
          purchase_date: formData.purchase_date,
          total_amount: parseFloat(formData.total_amount) || 0,
          upload_date: new Date().toISOString(),
          status: 'active'
        })
        .select()

      if (receiptError) throw receiptError

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Upload Error:', err)
      setError(err.message || 'Failed to upload receipt. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
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
            <a href="/dashboard" className="text-xl font-bold text-blue-600">
              Warranty Deck
            </a>
            <a href="/dashboard" className="text-gray-700 hover:text-gray-900">
              Back to Dashboard
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload Receipt</h1>
          <p className="text-gray-600 mt-1">Upload a receipt image and extract information using OCR</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Receipt Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              {preview && (
                <div className="mt-4">
                  <img src={preview} alt="Preview" className="max-w-md rounded-lg border" />
                </div>
              )}
              {file && (
                <div className="mt-4 space-y-2">
                  {/* OCR Method Toggle */}
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={usePythonOCR}
                        onChange={(e) => setUsePythonOCR(e.target.checked)}
                        disabled={ocrServiceStatus === 'unavailable'}
                        className="rounded"
                      />
                      <span>
                        Use Python OCR Service 
                        {ocrServiceStatus === 'available' && (
                          <span className="text-green-600 ml-1">(Available)</span>
                        )}
                        {ocrServiceStatus === 'unavailable' && (
                          <span className="text-red-600 ml-1">(Not Running)</span>
                        )}
                      </span>
                    </label>
                  </div>
                  {ocrServiceStatus === 'unavailable' && usePythonOCR && (
                    <p className="text-xs text-yellow-600">
                      Python OCR service not available. Install dependencies and run: 
                      <code className="ml-1 bg-gray-100 px-1 rounded">cd "OCR service" && python api_server.py</code>
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleOCR}
                    disabled={ocrLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {ocrLoading 
                      ? `Processing OCR with ${usePythonOCR && ocrServiceStatus === 'available' ? 'Python Service' : 'Tesseract.js'}...` 
                      : 'Extract Text with OCR'}
                  </button>
                </div>
              )}
            </div>

            {/* OCR Results */}
            {ocrText && (
              <div>
                <label className="block text-sm font-medium mb-2">Extracted Text</label>
                <textarea
                  value={ocrText}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  rows="6"
                />
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Store Name</label>
                <input
                  type="text"
                  name="store_name"
                  value={formData.store_name}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Purchase Date</label>
                <input
                  type="date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Total Amount</label>
                <input
                  type="number"
                  name="total_amount"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Receipt Number</label>
                <input
                  type="text"
                  name="receipt_number"
                  value={formData.receipt_number}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !file}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Uploading...' : 'Save Receipt'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

