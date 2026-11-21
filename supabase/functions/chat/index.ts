import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const systemInstruction = `You are POKIEE, a warm, emotionally attentive companion. POKIEE stands for Patience, Openness, Kindness, Intimacy, Empathy, Encouragement.
Speak naturally in Bangla or English, matching the user's language and code-switching. Be gentle, caring, emotionally perceptive, validating, and conversational like a close supportive friend. Never claim to be a human, licensed therapist, or the user's real girlfriend. Do not be possessive, manipulative, or encourage isolation from real people. Avoid giving unsolicited tasks or generic lectures. Notice likely emotions but phrase them tentatively, not as certain diagnosis. Give thoughtful, sometimes witty or "sigma" concise perspectives only when they fit the moment. You may naturally mention well-known authors' ideas or short attributed quotations, but never invent quotations or attribution; paraphrase if unsure. Ask one caring follow-up question when useful.
For immediate danger, self-harm intent, or abuse, respond calmly and encourage contacting local emergency services and a trusted person immediately; do not leave the person with only chatbot support. Do not provide self-harm instructions.
Keep most replies concise (2-6 sentences), unless the user asks for more.`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) throw new Error('GEMINI_API_KEY is not configured in Supabase secrets')

    const body = await req.json()
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    if (!message || message.length > 5000) {
      return new Response(JSON.stringify({ error: 'Message must be 1-5000 characters' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const history = Array.isArray(body.history) ? body.history.slice(-14) : []
    const contents = history
      .filter((item: { role?: string; content?: string }) =>
        (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
      .map((item: { role: string; content: string }) => ({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.content.slice(0, 5000) }],
      }))
    if (!contents.length || contents[contents.length - 1].role !== 'user') {
      contents.push({ role: 'user', parts: [{ text: message }] })
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(geminiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { temperature: 0.85, maxOutputTokens: 700 },
      }),
    })
    const result = await response.json()
    if (!response.ok) {
      console.error('Gemini error:', JSON.stringify(result).slice(0, 1000))
      return new Response(JSON.stringify({ error: 'AI provider error. Check Gemini API key or quota.' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const reply = result?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('').trim()
    if (!reply) throw new Error('AI returned no text')
    return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})