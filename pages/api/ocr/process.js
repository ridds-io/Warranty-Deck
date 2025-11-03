/**
 * API route for Python OCR service integration
 * 
 * This route forwards file uploads to the Python OCR service running on localhost:8000
 * The Python service uses docTR (PyTorch-based OCR) for more accurate extraction
 * 
 * Make sure the Python OCR service is running:
 *   cd "OCR service"
 *   python api_server.py
 */
import FormData from 'form-data'
import fetch from 'node-fetch'

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://localhost:8000'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '16mb', // 16MB max file size
    },
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check if OCR service is available
    try {
      const healthCheck = await fetch(`${OCR_SERVICE_URL}/health`, {
        method: 'GET',
        timeout: 2000,
      })
      if (!healthCheck.ok) {
        throw new Error('OCR service health check failed')
      }
    } catch (error) {
      return res.status(503).json({
        error: 'OCR service unavailable',
        message: `Cannot connect to OCR service at ${OCR_SERVICE_URL}`,
        hint: 'Make sure the Python OCR service is running: cd "OCR service" && python api_server.py'
      })
    }

    // Get file from request
    // Next.js handles multipart/form-data through formData
    const formData = new FormData()
    
    // If file is sent as base64, convert it
    if (req.body.file) {
      // File is already in request body (handled by Next.js)
      // We need to reconstruct it for the Python service
      
      // Try to get file from request
      // Note: Next.js doesn't handle file uploads by default, so we'll use a different approach
      // We'll accept the file as a data URL or buffer
      
      return res.status(400).json({
        error: 'File upload not properly configured',
        message: 'Please use the upload page which sends files directly to this endpoint',
        hint: 'Files should be sent as multipart/form-data with field name "file"'
      })
    }

    // Forward the request to Python OCR service
    const response = await fetch(`${OCR_SERVICE_URL}/api/ocr`, {
      method: 'POST',
      body: req.body,
      headers: {
        ...req.headers,
        // Remove host header
        host: undefined,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }))
      return res.status(response.status).json(errorData)
    }

    const data = await response.json()
    
    // Transform Python service response to match frontend expectations
    // The Python service returns the full ReceiptResponse schema
    return res.status(200).json({
      success: true,
      text: data.receipts?.ocr_raw_text || '',
      parsed: {
        store_name: data.store?.store_name || 'Unknown Store',
        store_address: data.store?.address || null,
        store_website: data.store?.website || null,
        purchase_date: data.receipts?.purchase_date 
          ? new Date(data.receipts.purchase_date).toISOString().split('T')[0]
          : null,
        total_amount: data.receipts?.total_amount || 0,
        tax_amount: data.receipts?.tax_amount || 0,
        receipt_number: data.receipts?.receipt_no || null,
        payment_method: data.receipts?.payment_method || null,
        currency: data.receipts?.ocr_meta?.currency || 'USD',
        items: (data.receipt_items || []).map(item => ({
          description: item.item_description || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || null,
          total_price: item.total_price || null,
          serial_no: item.serial_no || null,
        })),
      },
      ocr_meta: data.receipts?.ocr_meta || {},
      raw_response: data, // Include full response for debugging
    })
  } catch (error) {
    console.error('OCR API Error:', error)
    return res.status(500).json({ 
      error: 'Failed to process OCR',
      message: error.message,
      hint: 'Check if Python OCR service is running on port 8000'
    })
  }
}
