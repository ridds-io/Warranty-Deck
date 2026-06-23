// =============================================================================
// WARRANTYDECK — GROQ API WRAPPER
// src/lib/groq.js
// =============================================================================

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

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
 * Analyzes a receipt image (base64) using llama-3.2-11b-vision-preview.
 * Extracts details and synthesizes store return policy & warranty details.
 * 
 * @param {string} base64Data - Base64 encoded image string (including mime header if possible, or raw)
 * @param {string} mimeType - e.g., 'image/jpeg', 'image/png'
 * @returns {Promise<object>} The extracted structured receipt data
 */
export async function analyzeReceiptImage(base64Data, mimeType = 'image/jpeg') {
  // Ensure we have a clean data URL format: data:<mimeType>;base64,<base64Data>
  let imageUrl = base64Data
  if (!base64Data.startsWith('data:')) {
    imageUrl = `data:${mimeType};base64,${base64Data}`
  }

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

  const body = {
    model: 'llama-3.2-11b-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: systemPrompt
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl
            }
          }
        ]
      }
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' }
  }

  const result = await callGroqAPI(body)
  const content = result?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Received empty response from Groq Vision API.')
  }

  return JSON.parse(content)
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
    model: 'llama-3.3-70b-versatile',
    messages: apiMessages,
    temperature: 0.5
  }

  const result = await callGroqAPI(body)
  return result?.choices?.[0]?.message?.content || "I couldn't process that response."
}
