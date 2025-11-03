import Tesseract from 'tesseract.js'

/**
 * Extract text from an image using Tesseract OCR
 * @param {File|string} image - Image file or URL
 * @returns {Promise<{text: string, data: any}>} OCR result
 */
export const extractTextFromImage = async (image) => {
  try {
    const { data } = await Tesseract.recognize(image, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`Progress: ${Math.round(m.progress * 100)}%`)
        }
      }
    })
    
    return {
      text: data.text,
      data: data
    }
  } catch (error) {
    console.error('OCR Error:', error)
    throw new Error('Failed to extract text from image')
  }
}

/**
 * Enhanced receipt parser based on Python receipt_parser.py logic
 * Extracts structured data from OCR text using advanced heuristics
 * @param {string} ocrText - Raw OCR text
 * @returns {Object} Parsed receipt data with items, payment method, etc.
 */
export const parseReceiptData = (ocrText) => {
  const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  // Extract store info (name, address, website)
  const storeInfo = extractStoreInfo(lines)
  
  // Extract receipt number with better pattern matching
  const receiptNumber = extractReceiptNumber(ocrText)
  
  // Parse date with multiple formats
  const purchaseDate = parseDate(ocrText)
  
  // Extract totals (total_amount and tax_amount)
  const totals = extractTotals(lines)
  
  // Extract payment method
  const paymentMethod = extractPaymentMethod(ocrText)
  
  // Infer currency
  const currency = inferCurrency(ocrText) || 'USD'
  
  // Parse line items
  const items = parseItems(lines)
  
  return {
    store_name: storeInfo.store_name || 'Unknown Store',
    store_address: storeInfo.address,
    store_website: storeInfo.website,
    purchase_date: purchaseDate || new Date().toISOString().split('T')[0],
    total_amount: totals.total_amount || 0,
    tax_amount: totals.tax_amount || 0,
    receipt_number: receiptNumber || `REC-${Date.now()}`,
    payment_method: paymentMethod,
    currency: currency,
    items: items,
    raw_text: ocrText
  }
}

/**
 * Extract store information from header lines
 */
function extractStoreInfo(lines) {
  let storeName = null
  const addressParts = []
  let website = null
  
  const storeKeywords = ['store', 'mart', 'shop', 'supermarket', 'electronics', 'retail', 'market']
  
  // Check first 10 lines
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i]
    if (!line) continue
    
    // Detect URL
    if (/www\.|\.com|\.org|\.net|https?:\/\//i.test(line)) {
      website = line
      continue
    }
    
    // Calculate uppercase ratio
    const upperRatio = (line.match(/[A-Z]/g) || []).length / Math.max(line.length, 1)
    const hasKeyword = storeKeywords.some(kw => line.toLowerCase().includes(kw))
    
    // Store name is often uppercase or has store keywords
    if ((upperRatio > 0.5 || hasKeyword) && !storeName) {
      storeName = line
    } else if (storeName && addressParts.length < 3) {
      // Next lines after store name are likely address
      addressParts.push(line)
    }
  }
  
  return {
    store_name: storeName,
    address: addressParts.length > 0 ? addressParts.join(', ') : null,
    website: website
  }
}

/**
 * Extract receipt/invoice number using advanced pattern
 */
function extractReceiptNumber(text) {
  // Pattern: receipt/invoice/bill/txn followed by optional "no."/# and then alphanumeric ID
  const pattern = /(?:receipt|invoice|bill|txn|trans|order)\s*(?:no\.?|num(?:ber)?|id)?\s*[:#\-]?\s*([A-Z0-9][A-Z0-9\-]+)/i
  const match = text.match(pattern)
  return match ? match[1] : null
}

/**
 * Parse date from text with multiple formats
 */
function parseDate(text) {
  const patterns = [
    /(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})/, // DD/MM/YYYY or MM/DD/YYYY
    /(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})/, // YYYY-MM-DD
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})/i, // DD Month YYYY
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      try {
        if (match[2] && isNaN(match[2])) {
          // Month name format
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          const month = monthNames.findIndex(m => match[2].substring(0, 3).toLowerCase() === m.toLowerCase())
          const day = parseInt(match[1])
          let year = parseInt(match[3])
          if (year < 100) year += 2000
          const date = new Date(year, month, day)
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0]
          }
        } else {
          // Numeric format
          if (match[0].startsWith('20') || match[1].length === 4) {
            // YYYY-MM-DD
            const date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0]
            }
          } else {
            // Assume MM/DD/YYYY (ambiguous with DD/MM)
            const date = new Date(parseInt(match[3]) + (parseInt(match[3]) < 100 ? 2000 : 0), parseInt(match[1]) - 1, parseInt(match[2]))
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0]
            }
          }
        }
      } catch (e) {
        // Continue to next pattern
      }
    }
  }
  return null
}

/**
 * Extract total_amount and tax_amount from bottom lines
 */
function extractTotals(lines) {
  let totalAmount = null
  let taxAmount = null
  const totalsCandidates = []
  
  // Scan bottom 15 lines
  const bottomLines = lines.slice(-15)
  
  for (const line of bottomLines) {
    const lineLower = line.toLowerCase()
    // Extract amounts (numbers with decimals)
    const amounts = line.match(/[\d,]+\.\d{2}/g)
    const parsedAmounts = amounts ? amounts.map(a => parseFloat(a.replace(/,/g, ''))) : []
    
    if (/tax|vat|gst/.test(lineLower)) {
      if (parsedAmounts.length > 0) {
        taxAmount = parsedAmounts[parsedAmounts.length - 1]
      }
    } else if (/total/.test(lineLower) && !/sub/.test(lineLower)) {
      if (parsedAmounts.length > 0) {
        totalsCandidates.push(parsedAmounts[parsedAmounts.length - 1])
      }
    } else if (/grand|amount/.test(lineLower)) {
      if (parsedAmounts.length > 0) {
        totalsCandidates.push(parsedAmounts[parsedAmounts.length - 1])
      }
    }
  }
  
  // Choose the maximum as total
  if (totalsCandidates.length > 0) {
    totalAmount = Math.max(...totalsCandidates)
  }
  
  return { total_amount: totalAmount, tax_amount: taxAmount }
}

/**
 * Detect payment method from text
 */
function extractPaymentMethod(text) {
  const textLower = text.toLowerCase()
  const methods = ['visa', 'mastercard', 'amex', 'rupay', 'upi', 'cash', 'debit', 'credit', 'card']
  
  for (const method of methods) {
    if (textLower.includes(method)) {
      // Check for masked card
      const cardMatch = text.match(/\*{4,}\d{4}/)
      if (cardMatch) {
        return `${method.toUpperCase()} ${cardMatch[0]}`
      }
      return method.toUpperCase()
    }
  }
  return null
}

/**
 * Infer currency from symbols
 */
function inferCurrency(text) {
  const symbols = {
    '$': 'USD',
    '€': 'EUR',
    '£': 'GBP',
    '₹': 'INR',
    '¥': 'JPY',
    '₱': 'PHP'
  }
  
  for (const [symbol, code] of Object.entries(symbols)) {
    if (text.includes(symbol)) {
      return code
    }
  }
  return null
}

/**
 * Parse line items from receipt
 */
function parseItems(lines) {
  const items = []
  
  // Find items section (before totals keywords)
  const totalsKeywords = ['subtotal', 'total', 'grand', 'tax', 'vat', 'gst']
  let itemsEnd = lines.length
  for (let i = 0; i < lines.length; i++) {
    if (totalsKeywords.some(kw => lines[i].toLowerCase().includes(kw))) {
      itemsEnd = i
      break
    }
  }
  
  // Find lines with prices (ending with amount)
  for (let i = 0; i < itemsEnd; i++) {
    const line = lines[i]
    const priceMatch = line.match(/([\d,]+\.\d{2})\s*$/)
    if (!priceMatch) continue
    
    const totalPrice = parseFloat(priceMatch[1].replace(/,/g, ''))
    
    // Split on multiple spaces
    const parts = line.split(/\s{2,}/)
    if (parts.length < 2) {
      const words = line.split(/\s+/)
      parts.splice(0, parts.length, ...words)
    }
    
    let qty = 1.0
    let description = parts[0] || ''
    let unitPrice = null
    
    // Extract quantity and unit price
    for (let j = 1; j < parts.length; j++) {
      const part = parts[j]
      const qtyMatch = part.match(/(\d+\.?\d*)x?/i)
      if (qtyMatch) {
        qty = parseFloat(qtyMatch[1])
      } else if (/^[\d,]+\.\d{2}$/.test(part)) {
        const val = parseFloat(part.replace(/,/g, ''))
        if (unitPrice === null && val !== totalPrice) {
          unitPrice = val
        }
      }
    }
    
    // Compute missing values
    if (unitPrice === null && qty > 0) {
      unitPrice = totalPrice / qty
    }
    
    items.push({
      description: description,
      quantity: qty,
      unit_price: unitPrice,
      total_price: totalPrice,
      serial_no: items.length + 1
    })
  }
  
  return items
}

