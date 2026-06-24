// =============================================================================
// WARRANTYDECK — GROQ API WRAPPER
// src/lib/groq.js
// =============================================================================

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const OCR_SPACE_API_KEY = import.meta.env.VITE_OCR_SPACE_API_KEY || 'K83151128888957'

// Text/chat model: Llama 3.3 70B — best general-purpose model on Groq
const CHAT_MODEL = 'llama-3.3-70b-versatile'

/**
 * Helper to call Groq chat completions API
 */
async function callGroqAPI(body) {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API Key is not configured. Please set VITE_GROQ_API_KEY in your .env file.')
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData?.error?.message || `Groq API error: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Extract JSON from model output — handles both raw JSON and markdown-wrapped ```json blocks.
 */
function extractJSON(text) {
  if (!text) throw new Error('Empty response from model.')
  // Strip markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenceMatch ? fenceMatch[1].trim() : text.trim()
  try {
    return JSON.parse(raw)
  } catch {
    // Try finding the first { ... } block
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    throw new Error('Could not parse JSON from model response.')
  }
}

/**
 * Extracts text from image using OCR.space API
 * @param {string} base64Data - Base64 encoded image
 * @param {number} ocrEngine - OCR Engine (2 or 3)
 * @param {string} language - Language code (default: 'eng')
 * @returns {Promise<string>} Extracted text
 */
async function extractTextWithOCRSpace(base64Data, ocrEngine = 3, language = 'eng') {
  const formData = new FormData()

  // Convert base64 to blob
  const base64WithPrefix = base64Data.startsWith('data:') ? base64Data : `data:image/jpeg;base64,${base64Data}`

  formData.append('base64Image', base64WithPrefix)
  formData.append('apikey', OCR_SPACE_API_KEY)
  formData.append('OCREngine', ocrEngine.toString())
  formData.append('language', language)
  formData.append('isOverlayRequired', 'false')
  formData.append('detectOrientation', 'true')
  formData.append('scale', 'true')

  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    body: formData,
  })

  const result = await response.json()

  if (result.OCRExitCode !== 1) {
    throw new Error(`OCR failed: ${result.ErrorMessage || 'Unknown error'}`)
  }

  if (!result.ParsedResults || result.ParsedResults.length === 0) {
    throw new Error('No text found in image')
  }

  return result.ParsedResults[0].ParsedText
}

/**
 * Analyzes a receipt image using OCR.space for text extraction and Gemini for smart parsing.
 * With automatic fallback from Engine 3 to Engine 2.
 * Extracts all details and synthesizes store return policy & warranty info.
 *
 * @param {string} base64Data - Base64 encoded image string (raw, no data: prefix)
 * @param {string} mimeType   - e.g. 'image/jpeg', 'image/png'
 * @param {string} language   - Language code for OCR (default: 'eng')
 * @returns {Promise<object>} Structured receipt data
 */
export async function analyzeReceiptImage(base64Data, mimeType = 'image/jpeg', language = 'eng') {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API Key is not configured. Please set VITE_GROQ_API_KEY in your .env file.')
  }

  // Step 1: Extract text using OCR.space
  let extractedText = null
  let ocrEngine = 3 // Start with Engine 3 (better quality)

  try {
    console.log('Extracting text with OCR.space Engine 3...')
    extractedText = await extractTextWithOCRSpace(base64Data, 3, language)
    console.log('OCR Engine 3 successful')
  } catch (error) {
    console.warn('OCR Engine 3 failed, falling back to Engine 2:', error.message)
    try {
      extractedText = await extractTextWithOCRSpace(base64Data, 2, language)
      ocrEngine = 2
      console.log('OCR Engine 2 successful')
    } catch (fallbackError) {
      throw new Error(`OCR extraction failed: ${fallbackError.message}`)
    }
  }

  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error('No text could be extracted from the receipt image')
  }

  console.log('Extracted text length:', extractedText.length, 'characters')

  // Step 2: Use Groq (Llama 3.3 70B) to parse and structure the extracted text
  const systemPrompt = `You are a receipt extraction and customer rights AI. Parse the OCR-extracted text from a receipt and extract all details accurately.

Additionally, use your knowledge to infer:
- The store's typical return policy window
- Standard manufacturer warranty for the items (if applicable)
- Appropriate categorization

You must output ONLY a valid JSON object. No markdown, no explanations, just the JSON.

Required JSON format:
{
  "storeName": "Name of the store",
  "purchaseDate": "YYYY-MM-DD",
  "totalAmount": 123.45,
  "category": "One of: Electronics, Dining, Travel, Medical, Lifestyle, Groceries, Miscellaneous",
  "folderType": "vault",
  "returnDeadline": "YYYY-MM-DD (calculate from purchaseDate + store's return policy)",
  "aiSummary": "Brief summary of return policy and warranty info",
  "items": [
    {"name": "Item name", "qty": 1, "price": 99.99}
  ],
  "warranty": {
    "title": "Product warranty name",
    "provider": "Manufacturer or provider",
    "expiresOn": "YYYY-MM-DD",
    "benefits": ["Benefit 1", "Benefit 2"]
  }
}

Note: Set "warranty" to null if no durable goods with typical manufacturer warranties (like electronics, appliances, tools) are present.`

  const userPrompt = `Parse this receipt text and extract the required information:\n\n${extractedText}`

  // Call Groq API
  const body = {
    model: CHAT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3, // Lower temperature for more consistent parsing
    response_format: { type: 'json_object' } // Request JSON response
  }

  try {
    console.log('Analyzing with Groq Llama 3.3 70B...')
    const result = await callGroqAPI(body)
    const content = result?.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No response from Groq API')
    }

    return extractJSON(content)
  } catch (error) {
    console.error('Groq parsing error:', error)
    throw new Error(`Failed to parse receipt: ${error.message}`)
  }
}

/**
 * Chats with Groq (llama-3.3-70b-versatile) with system context about receipts/warranties.
 * 
 * @param {Array} messages - Chat history in format [{ role: 'user'|'assistant', content: string }]
 * @param {object} context - { receipts: Array, warranties: Array }
 * @returns {Promise<string>} The chatbot response
 */
export async function chatWithGroq(messages, context = {}) {
  const receiptsText = (context.receipts || []).map(r => {
    const itemsList = (r.items || []).map(i => `${i.qty}x ${i.name} ($${i.price})`).join(', ')
    return `- Store: ${r.storeName}, Date: ${r.purchaseDate}, Total: $${r.totalAmount}, Category: ${r.category}, Return Days Remaining: ${r.returnDays || 0} days, AI Summary: "${r.aiSummary || ''}", Items: [${itemsList}]`
  }).join('\n')

  const warrantiesText = (context.warranties || []).map(w => {
    return `- Title: ${w.title}, Provider: ${w.provider}, Expires: ${w.expiresOn}, Status: ${w.status}, Benefits: ${Array.isArray(w.benefits) ? w.benefits.join(', ') : w.benefits}`
  }).join('\n')

  const systemMessage = {
    role: 'system',
    content: `You are the WarrantyDeck AI assistant. You help the user manage, query, and understand their receipts, warranties, store return policies, and reimbursement/memorabilia folders.
Answer user questions concisely, friendly, and accurately based on the user's receipts and warranties listed below.

Here is the user's current data context:
=== RECEIPTS ===
${receiptsText || 'No receipts registered.'}

=== WARRANTIES ===
${warrantiesText || 'No active warranties.'}
===

Rules:
1. ONLY discuss information relevant to the user's receipts, warranties, return windows, claim steps, or related questions.
2. If the user asks about a specific product/receipt not in the data, explain that you don't have that receipt stored.
3. Be direct and helpful.`
  }

  // Format messages into Groq-compliant structure and prepend the system message
  const apiMessages = [
    systemMessage,
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ]

  const body = {
    model: CHAT_MODEL,
    messages: apiMessages,
    temperature: 0.5
  }

  const result = await callGroqAPI(body)
  return result?.choices?.[0]?.message?.content || "I couldn't process that response."
}
