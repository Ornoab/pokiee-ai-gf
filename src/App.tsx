import { FormEvent, useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase'
import { listenOnce, speak, stopSpeaking } from './lib/voice'

type Message = { role: 'user' | 'assistant'; content: string; id: string }
const STORAGE_KEY = 'pokiee-chat-v1'
const WELCOME = 'হাই! আমি POKIEE। আজ তোমার মন কেমন? চাইলে নির্ভয়ে বলো—আমি মন দিয়ে শুনছি। ❤️'

function loadMessages(): Message[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Message[]
      if (Array.isArray(parsed) && parsed.length) return parsed.slice(-60)
    }
  } catch { /* Start with a fresh chat if local data is invalid. */ }
  return [{ role: 'assistant', content: WELCOME, id: 'welcome' }]
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>(loadMessages)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [voiceOn, setVoiceOn] = useState(true)
  const [status, setStatus] = useState('তোমার কথা শুনতে প্রস্তুত')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-60)))
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  useEffect(() => () => stopSpeaking(), [])

  async function sendMessage(raw: string) {
    const text = raw.trim()
    if (!text || busy) return
    setInput('')
    const next = [...messages, { role: 'user' as const, content: text, id: crypto.randomUUID() }]
    setMessages(next)
    if (!supabase) {
      const reply = 'আমাকে চালু করতে এখনো Supabase setup বাকি আছে। Setup Guide-এর ধাপগুলো শেষ করলে আমি তোমার সঙ্গে কথা বলতে পারব। ❤️'
      setMessages([...next, { role: 'assistant', content: reply, id: crypto.randomUUID() }])
      if (voiceOn) speak(reply)
      setStatus('Supabase setup বাকি')
      return
    }
    setBusy(true)
    setStatus('তোমার কথা মন দিয়ে শুনছি…')
    try {
      const history = next.slice(-14).map(({ role, content }) => ({ role, content }))
      const { data, error } = await supabase.functions.invoke('chat', { body: { message: text, history } })
      if (error) throw new Error(error.message)
      if (typeof data?.reply !== 'string' || !data.reply.trim()) throw new Error('AI থেকে উত্তর পাওয়া যায়নি')
      const reply = data.reply.trim()
      setMessages(current => [...current, { role: 'assistant', content: reply, id: crypto.randomUUID() }])
      setStatus('আমি আছি, বলো…')
      if (voiceOn) speak(reply)
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Connection problem'
      const reply = `এই মুহূর্তে সংযোগে সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করো। (${detail})`
      setMessages(current => [...current, { role: 'assistant', content: reply, id: crypto.randomUUID() }])
      setStatus('Connection সমস্যা')
      if (voiceOn) speak('একটু সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করো।')
    } finally {
      setBusy(false)
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendMessage(input)
  }

  function clearChat() {
    const fresh = [{ role: 'assistant' as const, content: WELCOME, id: crypto.randomUUID() }]
    setMessages(fresh)
    localStorage.removeItem(STORAGE_KEY)
    stopSpeaking()
    setStatus('নতুন আলাপ শুরু হলো')
  }

  return (
    <main className="page">
      <header className="header">
        <a className="brand" href="#home" aria-label="POKIEE home">
          <span className="brand-mark">♥</span>
          <span><b>POKIEE</b><small>Your gentle companion</small></span>
        </a>
        <div className="header-actions">
          <button className={`small-button ${voiceOn ? 'selected' : ''}`} onClick={() => { setVoiceOn(v => !v); if (voiceOn) stopSpeaking() }}>
            {voiceOn ? '🔊 Voice on' : '🔇 Voice off'}
          </button>
          <button className="small-button" onClick={clearChat}>New chat</button>
        </div>
      </header>

      <section className="intro" id="home">
        <div className="heart-glow">♥</div>
        <div className="eyebrow">A LITTLE SPACE JUST FOR YOU</div>
        <h1>Hey, I’m <span>POKIEE</span>.</h1>
        <p>You don’t have to pretend here. Tell me what’s on your mind.</p>
        <div className="status"><i />{status}</div>
      </section>

      <section className="chat-card" aria-label="Chat with POKIEE">
        <div className="chat-title">
          <div><span className="online-dot" /> <b>Your safe space</b></div>
          <span>Kindness, always ♡</span>
        </div>
        <div className="messages">
          {messages.map(message => (
            <div className={`message ${message.role}`} key={message.id}>
              <div className="message-avatar">{message.role === 'assistant' ? '♥' : 'You'}</div>
              <div className="bubble">
                <small>{message.role === 'assistant' ? 'POKIEE' : 'YOU'}</small>
                <div>{message.content}</div>
                {message.role === 'assistant' && <button className="replay" onClick={() => speak(message.content)} aria-label="Play reply">▶ শুনি</button>}
              </div>
            </div>
          ))}
          {busy && <div className="thinking"><span/><span/><span/> POKIEE ভাবছে…</div>}
          <div ref={bottomRef}/>
        </div>
        <form className="composer" onSubmit={submit}>
          <button className="mic-button" type="button" title="Speak" onClick={() => listenOnce(text => void sendMessage(text), setStatus)}>🎙</button>
          <input value={input} onChange={event => setInput(event.target.value)} placeholder="Write what you’re feeling…" aria-label="Message" />
          <button className="send-button" type="submit" disabled={!input.trim() || busy}>➤</button>
        </form>
        <div className="composer-foot"><span>Be yourself. No judgement.</span><button onClick={stopSpeaking} type="button">Stop voice</button></div>
      </section>

      <div className="privacy-note">তোমার কথাগুলো এই Browser-এ সংরক্ষিত থাকে। Clear chat চাপলে মুছে যাবে।</div>
      <footer>POKIEE · Patience · Openness · Kindness · Intimacy · Empathy · Encouragement</footer>
    </main>
  )
}