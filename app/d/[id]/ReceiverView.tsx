'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Heart, Gift, Music, Share2, Sparkles, Loader2, Frown, ArrowRight, Copy, Check } from 'lucide-react'
import confetti from 'canvas-confetti'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import LoveLetter from '@/components/LoveLetter/LoveLetter'
import PoemCard from '@/components/PoemCard/PoemCard'
import SpotifyPlayer from '@/components/SpotifyPlayer'

const themes = {
  classic: {
    bg: 'bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 bg-[url("https://www.transparenttextures.com/patterns/natural-paper.png")]',
    text: 'text-gray-900',
    accent: 'text-rose-600',
    button: 'bg-rose-600 hover:bg-rose-700',
    border: 'border-rose-200',
    icon: 'text-rose-500',
  },
  midnight: {
    bg: 'bg-slate-900 bg-[url("https://www.transparenttextures.com/patterns/xv.png")]',
    text: 'text-slate-100',
    cardText: 'text-gray-900',
    accent: 'text-rose-400',
    button: 'bg-rose-600 hover:bg-rose-700',
    border: 'border-slate-700',
    icon: 'text-rose-400',
  },
  golden: {
    bg: 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 bg-[url("https://www.transparenttextures.com/patterns/lined-paper-2.png")]',
    text: 'text-amber-900',
    accent: 'text-amber-600',
    button: 'bg-amber-500 hover:bg-amber-600',
    border: 'border-amber-300',
    icon: 'text-amber-500',
  },
}

interface ValentineData {
  sender_name: string
  recipient_name: string
  theme: string
  title?: string
  message: string
  music_link?: string
  image_url?: string
  image?: string
  template_type?: 'classic' | 'love_letter' | 'poem'
  is_locked: boolean
  is_accepted: boolean
  protection_question?: string
  protection_answer?: string
  is_paid?: boolean
  views_count: number
}

export default function ReceiverPage() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [valentineData, setValentineData] = useState<ValentineData | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [unwrapped, setUnwrapped] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const noButtonRef = useRef<HTMLButtonElement>(null)
  const [noBtnPos, setNoBtnPos] = useState({ x: 0, y: 0 })
  const [runCount, setRunCount] = useState(0)

  const [unlockAnswer, setUnlockAnswer] = useState('')
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [unlockError, setUnlockError] = useState('')

  const [floatingHearts, setFloatingHearts] = useState<{ id: number; delay: number; duration: number; x: number }[]>([])
  const [showStatusPanel, setShowStatusPanel] = useState(true)
  const [viewAsRecipient, setViewAsRecipient] = useState(false)
  const [bragCopied, setBragCopied] = useState(false)

  useEffect(() => {
    setFloatingHearts(Array.from({ length: 15 }, (_, i) => ({
      id: i,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 10,
      x: Math.random() * 100
    })))

    const fetchValentine = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/valentines/${id}/`)
        if (response.ok) {
          const data = await response.json()
          setValentineData(data)
        } else {
          setError('Valentine not found 💔')
        }
      } catch (err) {
        setError('Something went wrong...')
      } finally {
        setLoading(false)
      }
    }

    if (id && id !== 'undefined') {
      fetchValentine()
      const owned = JSON.parse(localStorage.getItem('valenai_owned') || '{}')
      if (owned[id]) {
        setIsAdmin(true)
        setViewAsRecipient(false)
      }
    }
  }, [id])

  const managementToken = isAdmin ? JSON.parse(localStorage.getItem('valenai_owned') || '{}')[id] : null

  const theme = (valentineData?.theme && themes[valentineData.theme as keyof typeof themes])
    ? themes[valentineData.theme as keyof typeof themes]
    : themes.classic

  const handleUnwrap = () => {
    setUnwrapped(true)
    if (valentineData?.template_type !== 'love_letter') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#db2777'],
      })
    }
  }

  const [manualCode, setManualCode] = useState('')
  const [showMpesaInput, setShowMpesaInput] = useState(false)

  const handleManualReveal = async () => {
    if (!manualCode || manualCode.length < 8) {
      alert('Please enter a valid M-Pesa code')
      return
    }
    setIsUnlocking(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/valentines/${id}/reveal_manual_payment/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: manualCode })
      })
      const result = await response.json()
      if (result.success) {
        alert(`Success! The Secret Answer is: ${result.answer}`)
        setUnlockAnswer(result.answer)
        setShowMpesaInput(false)
      } else {
        alert(result.message)
      }
    } catch (e) {
      console.error('Mpesa error:', e)
      alert('Failed to verify code')
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleUnlock = async () => {
    if (!unlockAnswer.trim() || !id) return
    setIsUnlocking(true)
    setUnlockError('')
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/valentines/${id}/unlock/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: unlockAnswer })
      })
      const result = await response.json()
      if (response.ok && result.success) {
        // Add a small delay so it doesn't feel 'too fast'
        setTimeout(() => {
          setValentineData(result.data)
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#e11d48', '#db2777'],
          })
        }, 800)
      } else {
        setUnlockError(result.message || "Nope! Try again? 😉")
      }
    } catch (e) {
      setUnlockError("Something went wrong. Check your connection.")
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleAccept = async () => {
    if (isAdmin) {
      alert("This is a preview! Only your recipient can say YES. ❤️")
      return
    }
    setAccepted(true)
    if (id) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/valentines/${id}/respond/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accepted: true })
        })
      } catch (e) {
        console.error('Failed to record response', e)
      }
    }

    const duration = 3000
    const end = Date.now() + duration
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#e11d48', '#db2777', '#fbbf24'] })
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#e11d48', '#db2777', '#fbbf24'] })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }

  const handleBrag = () => {
    const text = `Someone just went above and beyond for me with a personalized Valentine! 🌹 I couldn't say no! ❤️ \n\nCheck out the surprise here: ${window.location.href}\n\nMake your own at ValenAI.love #ValenAI #Valentines2026`

    if (navigator.share) {
      navigator.share({
        title: 'My Valentine Surprise! ❤️',
        text: text,
        url: window.location.href,
      }).catch(console.error)
    } else {
      navigator.clipboard.writeText(text)
      setBragCopied(true)
      setTimeout(() => setBragCopied(false), 2000)
    }
  }

  const handleWhatsAppBrag = () => {
    const text = `Someone just went above and beyond for me with a personalized Valentine! 🌹 I couldn't say no! ❤️ \n\nCheck out the surprise here: ${window.location.href}\n\nMake your own at ValenAI.love #ValenAI #Valentines2026`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(whatsappUrl, '_blank')
  }

  const moveNoButton = () => {
    const randomX = (Math.random() - 0.5) * 300
    const randomY = (Math.random() - 0.5) * 300
    setNoBtnPos(prev => ({ x: prev.x + randomX, y: prev.y + randomY }))
    setRunCount(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-rose-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Fetching something special...</p>
      </div>
    )
  }

  if (error || !valentineData) {
    return (
      <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center p-4 text-center">
        <Frown className="w-16 h-16 text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h1>
        <p className="text-gray-600">{error || 'Valentine not found'}</p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme.bg} flex items-center justify-center p-4 overflow-hidden relative`}>
      {isAdmin && !viewAsRecipient && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/95 backdrop-blur-xl border-2 border-rose-200 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="bg-rose-500 text-white px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                Live Tracker
              </div>
              <button onClick={() => setShowStatusPanel(!showStatusPanel)} className="text-[10px] underline uppercase font-bold opacity-80 hover:opacity-100">
                {showStatusPanel ? 'Hide' : 'Show'}
              </button>
            </div>

            <AnimatePresence>
              {showStatusPanel && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 grid grid-cols-2 gap-4">
                    <div className="bg-rose-50 rounded-2xl p-3 text-center transition-colors hover:bg-rose-100">
                      <p className="text-[10px] text-rose-400 font-bold uppercase">Views</p>
                      <h4 className="text-xl font-black text-rose-600 font-playfair">{valentineData.views_count}</h4>
                    </div>
                    <div className={`${valentineData.is_accepted ? 'bg-green-50' : 'bg-amber-50'} rounded-2xl p-3 text-center transition-colors`}>
                      <p className={`text-[10px] ${valentineData.is_accepted ? 'text-green-500' : 'text-amber-500'} font-bold uppercase tracking-tighter`}>
                        Status
                      </p>
                      <h4 className={`text-sm font-bold ${valentineData.is_accepted ? 'text-green-600' : 'text-amber-600'}`}>
                        {valentineData.is_accepted ? 'Accepted! ❤️' : 'Waiting... ⏳'}
                      </h4>
                    </div>
                  </div>
                  <div className="px-4 pb-4 flex gap-2">
                    <Button
                      onClick={() => setViewAsRecipient(true)}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-[10px] h-8 border-rose-200 text-rose-600 font-bold bg-white"
                    >
                      Preview Flow
                    </Button>
                    <Button asChild size="sm" className="flex-1 text-[10px] h-8 bg-rose-600 font-bold text-white">
                      <Link href={`/manage/${managementToken}`}>
                        Dashboard
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {isAdmin && viewAsRecipient && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-center py-2 z-[110] font-bold text-[10px] shadow-lg flex items-center justify-center gap-4 px-4 uppercase tracking-wider">
          Testing Mode: You are seeing what they see
          <button
            onClick={() => setViewAsRecipient(false)}
            className="bg-white text-amber-600 px-3 py-1 rounded-full text-xs font-black shadow-sm"
          >
            Exit Preview
          </button>
        </div>
      )}
      <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full">
        {floatingHearts.map((heart) => (
          <motion.div
            key={heart.id}
            className={`absolute ${theme.icon} opacity-20`}
            style={{ left: `${heart.x}%` }}
            initial={{ y: '110vh' }}
            animate={{ y: '-10vh' }}
            transition={{ duration: heart.duration, repeat: Infinity, delay: heart.delay, ease: 'linear' }}
          >
            <Heart className="w-8 h-8 fill-current" />
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {valentineData.is_locked && (!isAdmin || viewAsRecipient) ? (
          <motion.div
            key="lock-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="z-50 max-w-md w-full px-4"
          >
            <Card className="border-2 border-rose-200 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500" />
              <CardHeader className="text-center space-y-2">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-8 h-8 text-rose-500 animate-pulse" />
                </div>
                <CardTitle className="font-playfair text-2xl text-rose-800">A Secret Surprise...</CardTitle>
                <CardDescription className="text-gray-600 font-medium italic">
                  {valentineData.sender_name} has a message for you, but you must prove it's you!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-2 pb-8">
                <div className="space-y-4 text-center">
                  <p className="text-lg font-bold text-gray-800 px-4 py-3 bg-rose-50/50 rounded-xl border border-rose-100 italic">
                    "{valentineData.protection_question || 'What is our secret answer?'}"
                  </p>
                  <div className="space-y-2 relative">
                    <Input
                      placeholder="Type the answer..."
                      value={unlockAnswer}
                      onChange={(e) => setUnlockAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                      className={`text-center h-12 border-2 ${unlockError ? 'border-red-300' : 'border-rose-100'} rounded-xl bg-white text-lg`}
                    />
                    {unlockError && <p className="text-sm font-bold text-red-500 mt-2">{unlockError}</p>}
                  </div>
                  <Button onClick={handleUnlock} disabled={isUnlocking || !unlockAnswer.trim()} className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold text-lg rounded-xl transition-all group">
                    {isUnlocking ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Unlock my Valentine 💌 <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></>}
                  </Button>

                  <div className="pt-2">
                    {!showMpesaInput ? (
                      <button
                        onClick={() => setShowMpesaInput(true)}
                        className="text-[10px] text-rose-400 font-bold uppercase tracking-widest hover:text-rose-600 transition-colors"
                      >
                        Stuck? Reveal Answer for KES 350 ✨
                      </button>
                    ) : (
                      <div className="space-y-3 p-4 bg-rose-50 rounded-xl border border-rose-100 animate-in fade-in zoom-in-95">
                        <div className="text-[10px] text-gray-500 text-left space-y-1 mb-2">
                          <p>1. Go to M-Pesa &gt; Send Money</p>
                          <p>2. Number: <strong>0759313238</strong></p>
                          <p>3. Pay: <strong>KES 350</strong></p>
                        </div>
                        <Label htmlFor="rvCode" className="text-[10px] uppercase font-bold text-rose-500 text-left block">Confirmation Code</Label>
                        <Input
                          id="rvCode"
                          placeholder="SBN8SDF92"
                          value={manualCode}
                          onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                          className="bg-white border-rose-200 h-10 text-center font-mono"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleManualReveal}
                            disabled={isUnlocking}
                            size="sm"
                            className="flex-1 bg-rose-600 hover:bg-rose-700 font-bold text-[10px]"
                          >
                            {isUnlocking ? <Loader2 className="w-3 h-3 animate-spin" /> : "Verify Code"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowMpesaInput(false)}
                            className="text-[10px] text-gray-400"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (accepted || (valentineData.is_accepted && unwrapped)) && (!isAdmin || viewAsRecipient) ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.5, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            className="text-center z-10 w-full max-w-lg px-4"
          >
            <Card className={`border-4 ${theme.border} shadow-2xl bg-white/95 backdrop-blur-md overflow-hidden relative`}>
              <CardContent className="pt-12 pb-12 space-y-8 relative z-10 px-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-28 h-28 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Heart className="w-14 h-14 text-rose-600 fill-current animate-bounce" />
                </motion.div>
                <div>
                  <h1 className={`text-4xl sm:text-5xl font-playfair font-bold ${theme.text} mb-4`}>IT'S A MATCH! ❤️</h1>
                  <p className="text-xl text-gray-600 font-medium italic text-center">
                    You've made {valentineData.sender_name} the happiest person in the world!
                  </p>
                </div>

                <div className="bg-rose-50/50 rounded-2xl p-6 border-2 border-rose-100 shadow-sm space-y-4">
                  <p className="text-gray-700 font-medium">Keep the love going...</p>
                  <Button asChild className="w-full bg-rose-600 hover:bg-rose-700 text-white gap-2 h-12 text-lg rounded-xl shadow-lg shadow-rose-200">
                    <Link href="/creator">
                      <Sparkles className="w-5 h-5" />
                      Create one for {valentineData.sender_name}
                    </Link>
                  </Button>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleWhatsAppBrag}
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-12 rounded-xl shadow-lg flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-5 h-5" />
                    Brag on WhatsApp! 📱
                  </Button>

                  <Button
                    variant="outline"
                    className={`w-full border-rose-200 gap-2 h-12 rounded-xl font-bold transition-all ${bragCopied ? 'text-green-600 border-green-200 bg-green-50' : 'text-rose-600'}`}
                    onClick={handleBrag}
                  >
                    {bragCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {bragCopied ? 'Copied Link!' : 'Copy Share Link'}
                  </Button>

                  <Link href="/" className="inline-block text-gray-400 hover:text-rose-500 text-sm font-medium transition-colors">
                    Back to ValenAI.love
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full flex items-center justify-center">
            {valentineData.template_type === 'love_letter' ? (
              <LoveLetter isOpen={unwrapped} onOpen={handleUnwrap}>
                <div className="flex flex-col items-center py-10 text-[#180d07] text-center w-full">
                  <div className="mx-auto bg-rose-100/50 w-16 h-16 rounded-full flex items-center justify-center mb-6 shrink-0">
                    <Heart className="w-8 h-8 text-rose-500 fill-current animate-pulse" />
                  </div>
                  <h1 className="text-4xl font-bold mb-8 font-serif text-rose-800 shrink-0 px-4 leading-tight">Dear {valentineData.recipient_name}...</h1>
                  {(valentineData.image || valentineData.image_url) && (
                    <div className="mb-6 w-full max-w-[200px] aspect-square rounded-lg overflow-hidden border-2 border-rose-200 shadow-sm mx-auto">
                      <img src={valentineData.image || valentineData.image_url} alt="Valentine" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <p className="text-xl leading-relaxed font-medium font-serif px-2 mb-8 whitespace-pre-wrap">{valentineData.message}</p>
                  {valentineData.music_link && <SpotifyPlayer url={valentineData.music_link} className="mb-8" />}
                  <div className="mt-auto space-y-6 w-full">
                    <h2 className="text-2xl font-bold text-rose-600 font-serif">Will you be my Valentine?</h2>
                    <div className="flex flex-col gap-3 items-center justify-center relative min-h-[100px]">
                      <Button onClick={handleAccept} className="bg-rose-600 hover:bg-rose-700 text-white text-lg font-bold px-8 py-3 rounded-xl shadow-lg hover:scale-105 transition-all relative z-20">YES! 💖</Button>
                      <motion.div animate={{ x: noBtnPos.x, y: noBtnPos.y }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                        <Button ref={noButtonRef} variant="ghost" onMouseEnter={moveNoButton} onTouchStart={moveNoButton} className="text-gray-400 hover:text-rose-500 hover:bg-transparent">
                          {runCount === 0 ? 'No' : runCount < 3 ? 'Are you sure?' : 'Really? 😢'}
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </LoveLetter>
            ) : !unwrapped ? ( // This is the new "Unwrap" condition for poem/classic
              <div className="z-10 w-full max-w-lg px-4 flex flex-col items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="cursor-pointer py-12 text-center"
                  onClick={handleUnwrap}
                >
                  <div className="relative mb-8">
                    <Gift className={`w-32 h-32 ${theme.icon} animate-bounce mx-auto`} />
                    <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-amber-400 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-playfair font-bold text-rose-800 mb-6 drop-shadow-sm">
                    {valentineData.sender_name} sent you a {valentineData.template_type === 'poem' ? 'Poem' : 'Surprise'}!
                  </h3>
                  <Button className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-lg font-bold px-10 py-7 rounded-2xl shadow-xl border-b-4 border-rose-800 active:border-b-0 active:translate-y-1 transition-all">
                    Unwrap with Love 💝
                  </Button>
                </motion.div>
                <p className="text-gray-400 italic text-sm mt-4 font-medium animate-pulse text-center">Click to open your special gift</p>
              </div>
            ) : valentineData.template_type === 'poem' ? (
              <div className="w-full max-w-2xl px-4">
                <PoemCard
                  title={valentineData.title}
                  sender_name={valentineData.sender_name}
                  recipient_name={valentineData.recipient_name}
                  lines={valentineData.message ? valentineData.message.split('\n') : []}
                  image={valentineData.image || valentineData.image_url}
                  music_link={valentineData.music_link}
                  onAccept={handleAccept}
                  moveNoButton={moveNoButton}
                  noBtnPos={noBtnPos}
                  noButtonRef={noButtonRef}
                  runCount={runCount}
                />
              </div>
            ) : (
              <div className="z-10 w-full max-w-lg px-4">
                <Card className={`border-4 ${theme.border} shadow-2xl bg-white/95 backdrop-blur-md overflow-hidden pb-8`}>
                  <CardHeader className="text-center pt-8">
                    <CardTitle className={`text-3xl font-playfair ${valentineData.theme === 'midnight' ? 'text-gray-900' : theme.text}`}>For {valentineData.recipient_name}</CardTitle>
                    <CardDescription>A special gift is waiting...</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8 text-center">
                    <div className="space-y-8">
                      {(valentineData.image || valentineData.image_url) && (
                        <div className="w-full max-w-[300px] aspect-square rounded-2xl overflow-hidden border-4 border-rose-100 shadow-lg mx-auto">
                          <img src={valentineData.image || valentineData.image_url} alt="Valentine" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="bg-rose-50/50 p-8 rounded-3xl border-2 border-rose-100 shadow-inner">
                        {valentineData.title && <h2 className="text-2xl font-bold text-rose-800 mb-4 font-playfair">{valentineData.title}</h2>}
                        <p className="text-2xl font-medium text-gray-800 leading-relaxed font-serif italic italic text-center">"{valentineData.message}"</p>
                      </div>
                      {valentineData.music_link && <SpotifyPlayer url={valentineData.music_link} />}
                      <div className="space-y-6 pt-4 border-t border-rose-100">
                        <h2 className={`text-3xl font-bold ${valentineData.theme === 'midnight' ? 'text-rose-700' : theme.accent} font-playfair italic`}>Will you be my Valentine?</h2>
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center relative min-h-[120px]">
                          <Button onClick={handleAccept} className={`${theme.button} text-white text-xl font-bold px-12 py-8 rounded-2xl shadow-xl hover:scale-105 transition-all z-20`}>YES! 💍</Button>
                          <motion.div animate={{ x: noBtnPos.x, y: noBtnPos.y }}>
                            <Button ref={noButtonRef} variant="outline" size="lg" onMouseEnter={moveNoButton} onTouchStart={moveNoButton} className="border-rose-300 text-rose-600 rounded-2xl px-10 py-8">No</Button>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 font-medium text-center">With love from {valentineData.sender_name}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
