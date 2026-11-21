type RecognitionResult = { 0: { transcript: string } }
type RecognitionEvent = { results: ArrayLike<RecognitionResult> }
type RecognitionError = { error: string }
type RecognitionInstance = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: RecognitionEvent) => void) | null
  onerror: ((event: RecognitionError) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
type RecognitionConstructor = new () => RecognitionInstance

export function listenOnce(onText: (text: string) => void, onStatus: (text: string) => void) {
  const w = window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }
  const Recognition = w.SpeechRecognition || w.webkitSpeechRecognition
  if (!Recognition) {
    onStatus('এই Browser-এ voice input নেই। Chrome ব্যবহার করে দেখো।')
    return
  }
  const recognition = new Recognition()
  recognition.lang = 'bn-BD'
  recognition.interimResults = false
  recognition.maxAlternatives = 1
  recognition.onresult = event => {
    const text = event.results[0]?.[0]?.transcript?.trim()
    if (text) onText(text)
    else onStatus('কথাটা বুঝতে পারিনি, আবার বলবে?')
  }
  recognition.onerror = event => onStatus(`Voice input সমস্যা: ${event.error}`)
  recognition.onend = () => onStatus('তোমার কথা শুনতে প্রস্তুত')
  try {
    recognition.start()
    onStatus('শুনছি… এখন কথা বলো')
  } catch {
    onStatus('Microphone চালু হয়নি। Browser permission পরীক্ষা করো।')
  }
}

export function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = /[\u0980-\u09FF]/.test(text) ? 'bn-BD' : 'en-US'
  utterance.rate = 0.92
  utterance.pitch = 1.08
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(v =>
    (utterance.lang.startsWith('bn') ? v.lang.toLowerCase().startsWith('bn') : v.lang.toLowerCase().startsWith('en')) &&
    /female|zira|samantha|aria|jenny|google.*(বাংলা|bengali)/i.test(v.name)
  ) || voices.find(v => v.lang.toLowerCase().startsWith(utterance.lang.slice(0, 2)))
  if (preferred) utterance.voice = preferred
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}