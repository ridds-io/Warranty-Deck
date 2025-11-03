/**
 * API route that handles file upload and forwards to Python OCR service
 * 
 * This endpoint:
 * 1. Receives the uploaded file
 * 2. Forwards it to Python OCR service
 * 3. Returns parsed receipt data
 * 
 * Usage from frontend:
 *   const formData = new FormData()
 *   formData.append('file', file)
 *   const response = await fetch('/api/ocr/upload', {
 *     method: 'POST',
 *     body: formData
 *   })
 */
import { createReadStream } from 'fs'
import FormData from 'form-data'
import fetch from 'node-fetch'

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://localhost:8000'

export const config = {
  api: {
    bodyParser: false, // We'll handle multipart manually
  },
}

// Helper to parse multipart form data
import multiparty from 'multiparty'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check if OCR service is available
    try {
      const healthCheck = await fetch(`${OCR_SERVICE_URL}/health`, {
        timeout: 2000,
      })
      if (!healthCheck.ok) {
        throw new Error('OCR service unavailable')
      }
    } catch (error) {
      return res.status(503).json({
        error: 'OCR service unavailable',
        message: `Cannot connect to OCR service at ${OCR_SERVICE_URL}`,
        hint: 'Make sure Python OCR service is running. See INTEGRATION_GUIDE.md'
      })
    }

    // Parse multipart form data
    const form = new multiparty.Form()
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        else resolve([fields, files])
      })
    })

    const fileArray = files.file || files.files || []
    if (fileArray.length === 0) {
      return res.status(400).json({ error: 'No file provided' })
    }

    const uploadedFile = fileArray[0]
    const fileStream = createReadStream(uploadedFile.path)

    // Forward to Python OCR service
    const formData = new FormData()
    formData.append('file', fileStream, {
      filename: uploadedFile.originalFilename || 'receipt.jpg',
      contentType: uploadedFile.headers['content-type'] || 'image/jpeg',
    })

    // Optional parameters
    if (fields.language && fields.language[0]) {
      formData.append('language', fields.language[0])
    }
    if (fields.min_confidence && fields.min_confidence[0]) {
      formData.append('min_confidence', fields.min_confidence[0])
    }
    if (fields.return_text && fields.return_text[0]) {
      formData.append('return_text', fields.return_text[0])
    }

    const response = await fetch(`${OCR_SERVICE_URL}/api/ocr`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    })

    // Clean up temp file
    try {
      // multiparty cleans up temp files automatically
    } catch (e) {
      // Ignore cleanup errors
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }))
      return res.status(response.status).json(errorData)
    }

    const data = await response.json()
    
    // Transform to match frontend expectations
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
    })
  } catch (error) {
    console.error('OCR Upload Error:', error)
    return res.status(500).json({ 
      error: 'Failed to process OCR',
      message: error.message 
    })
  }
}

