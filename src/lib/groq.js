// =============================================================================
// WARRANTYDECK — GROQ & GEMINI API WRAPPER
// src/lib/groq.js
// =============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

// Text/chat model: Llama 3.3 70B — best general-purpose model on Groq
const CHAT_MODEL   = 'llama-3.3-70b-versatile'

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
 * Analyzes a receipt image (base64) using Gemini 2.5 Flash for OCR and extraction.
 * Extracts all details and synthesizes store return policy & warranty info.
 *
 * @param {string} base64Data - Base64 encoded image string (raw, no data: prefix)
 * @param {string} mimeType   - e.g. 'image/jpeg', 'image/png'
 * @returns {Promise<object>} Structured receipt data
 */
export async function analyzeReceiptImage(base64Data, mimeType = 'image/jpeg') {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API Key is not configured. Please get a free API key from Google AI Studio and add it as VITE_GEMINI_API_KEY in your .env file.')
  }

  // Strip prefix if somehow it got here
  const rawBase64 = base64Data.startsWith('data:')
    ? base64Data.split(',')[1]
    : base64Data

  const systemPrompt = `You are a receipt extraction and customer rights AI. Analyze the uploaded receipt image.
Extract all details accurately. Additionally, research and retrieve the return policy and warranty coverage for the store and the items listed from your knowledge base.
You must output a single JSON object. Do not include any markdown backticks, conversational preamble, or explanation.

JSON format required:
{
  "storeName": "Name of the store (e.g. Costco, Walmart)",
  "purchaseDate": "YYYY-MM-DD (format strictly like 2026-06-23)",
  "totalAmount": 123.45,
  "category": "One of: Electronics, Dining, Travel, Medical, Lifestyle, Groceries, Miscellaneous",
  "folderType": "One of: vault, memorabilia, reimbursement",
  "returnDeadline": "YYYY-MM-DD (calculate this using the store's return policy length starting from purchaseDate)",
  "aiSummary": "A concise summary detailing the return policy window (e.g., 30 or 90 days), any exclusions, and standard manufacturer warranty duration/benefits or claim steps for the items in the list.",
  "items": [
    {
      "name": "Item description",
      "qty": 1,
      "price": 99.99
    }
  ],
  "warranty": {
    "title": "Warranty name (e.g. TV Warranty, Backpack Coverage)",
    "provider": "Warranty provider or manufacturer name",
    "expiresOn": "YYYY-MM-DD (calculate this if a warranty is standard for this type of product, e.g. 1 year or 2 years from purchaseDate)",
    "benefits": ["Benefit 1", "Benefit 2"]
  }
}
Note: Only include the "warranty" object if at least one item on the receipt is a durable product typically covered by a manufacturer warranty (e.g., electronics, appliances, quality outdoor gear, tools). Otherwise, set "warranty" to null.`

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

  const result = await model.generateContent([
    systemPrompt,
    {
      inlineData: {
        data: rawBase64,
        mimeType: mimeType
      }
    }
  ])

  const content = result.response.text()
  return extractJSON(content)
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
