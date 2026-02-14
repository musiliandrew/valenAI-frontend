'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowRight, ArrowLeft, Heart, Sparkles, Music, Image as ImageIcon, Loader2, X, Search, BookOpen, Share2, Wallet, Copy, Check } from 'lucide-react'
import Link from 'next/link'

// Validation schema
const valentineSchema = z.object({
  senderName: z.string().min(2, 'Name must be at least 2 characters'),
  senderLocation: z.string().max(100).optional(),
  receiverName: z.string().min(2, 'Name must be at least 2 characters'),
  theme: z.enum(['classic', 'midnight', 'golden']),
  template_type: z.enum(['classic', 'love_letter', 'poem']),
  title: z.string().optional(),
  message: z.string().min(1, 'Message is required').max(2000, 'Message is too long'),
  musicLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  imageFile: z.any().optional(),
  protectionQuestion: z.string().max(255).optional(),
  protectionAnswer: z.string().max(255).optional(),
})

type ValentineFormData = z.infer<typeof valentineSchema>

const themes = [
  { id: 'classic', name: 'Classic Rose', emoji: '🌹', description: 'Romantic red & pink', color: 'from-rose-500 to-pink-500' },
  { id: 'midnight', name: 'Midnight Rose', emoji: '🌙', description: 'Deep red & slate', color: 'from-slate-900 to-rose-900' },
  { id: 'golden', name: 'Golden Love', emoji: '✨', description: 'Luxury gold', color: 'from-amber-500 to-yellow-500' },
]

const templates = [
  { id: 'classic', name: 'Classic Gift Box', emoji: '🎁', description: 'A timeless surprise box', premium: false },
  { id: 'love_letter', name: 'Digital Love Letter', emoji: '💌', description: 'An interactive sealed envelope', premium: true },
  { id: 'poem', name: 'Romantic Poem Card', emoji: '📜', description: 'A beautiful animated parchment', premium: true },
]

const steps = [
  { id: 1, title: 'Names', description: 'Who is this for?' },
  { id: 2, title: 'Experience', description: 'Choose your presentation' },
  { id: 3, title: 'Customize', description: 'Style and message' },
  { id: 4, title: 'Extras', description: 'Music or photo' },
  { id: 5, title: 'Security', description: 'Secret question' },
  { id: 6, title: 'Preview & Finish', description: 'Double check everything' },
]

export default function CreatorPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [completed, setCompleted] = useState(false)
  const [generatedSlug, setGeneratedSlug] = useState('')
  const [managementToken, setManagementToken] = useState('')
  const [copied, setCopied] = useState(false)
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'paypal'>('mpesa')

  // AI State
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiMessages, setAiMessages] = useState<string[]>([])
  const [aiPoems, setAiPoems] = useState<any[]>([])
  const [aiTone, setAiTone] = useState('romantic')

  // Poem Search State
  const [poemSearch, setPoemSearch] = useState({ author: '', title: '' })
  const [isSearchingPoem, setIsSearchingPoem] = useState(false)
  const [poemResults, setPoemResults] = useState<any[]>([])

  // Music Search State
  const [musicSearch, setMusicSearch] = useState('')
  const [isSearchingMusic, setIsSearchingMusic] = useState(false)
  const [musicResults, setMusicResults] = useState<any[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [isPolling, setIsPolling] = useState(false)

  const getPrice = () => {
    switch (formData.template_type) {
      case 'poem': return 500;
      case 'love_letter': return 350;
      default: return 250;
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ValentineFormData>({
    resolver: zodResolver(valentineSchema),
    mode: 'onChange',
    defaultValues: {
      theme: 'classic',
      template_type: 'classic',
      title: '',
      musicLink: '',
      imageUrl: '',
    },
  })

  const formData = watch()

  const [mpesaCode, setMpesaCode] = useState('')

  const handleManualPayment = async () => {
    if (!mpesaCode || mpesaCode.length < 8) {
      alert('Please enter a valid M-Pesa confirmation code')
      return
    }
    setIsVerifying(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/valentines/${generatedSlug}/submit_manual_payment/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: mpesaCode })
      })
      const result = await response.json()
      if (result.success) {
        setIsPaid(true)
      } else {
        alert(result.message)
      }
    } catch (e) {
      console.error('Payment error:', e)
      alert('Failed to connect to server')
    } finally {
      setIsVerifying(false)
    }
  }

  const generateAiContent = async () => {
    if (!formData.senderName || !formData.receiverName) {
      alert('Please fill in names first!')
      setCurrentStep(1)
      setShowAiModal(false)
      return
    }

    setIsGenerating(true)
    const isPoem = formData.template_type === 'poem'
    const endpoint = isPoem ? 'generate_poem' : 'generate_message'

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/valentines/${endpoint}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_name: formData.senderName,
          recipient_name: formData.receiverName,
          tone: aiTone,
          vibe: aiTone, // Use same for poem vibe
          length: 'medium',
          context: 'Valentine\'s Day'
        })
      })
      const data = await response.json()
      if (data.success) {
        if (isPoem) {
          setAiPoems(data.poems)
        } else {
          setAiMessages(data.messages)
        }
      } else {
        alert('Failed to generate content. Please try again.')
      }
    } catch (error) {
      console.error('AI Generation Error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const searchPoem = async () => {
    if (!poemSearch.author && !poemSearch.title) return;

    setIsSearchingPoem(true)
    try {
      let url = 'https://poetrydb.org/'
      if (poemSearch.author && poemSearch.title) {
        url += `author,title/${poemSearch.author};${poemSearch.title}`
      } else if (poemSearch.author) {
        url += `author/${poemSearch.author}`
      } else {
        url += `title/${poemSearch.title}`
      }

      setPoemResults([]) // Clear previous results
      const response = await fetch(url)
      const data = await response.json()

      if (Array.isArray(data)) {
        setPoemResults(data.slice(0, 10))
      } else {
        setPoemResults([])
        if (data.status === 404) {
          alert("No poems found with that title or author. Try a broader search!")
        }
      }
    } catch (e) {
      console.error('Poem Search Error:', e)
    } finally {
      setIsSearchingPoem(false)
    }
  }

  const searchMusic = async () => {
    if (!musicSearch) return;
    setIsSearchingMusic(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/valentines/search_music/?q=${encodeURIComponent(musicSearch)}`)
      const result = await response.json()
      if (result.success) {
        setMusicResults(result.data)
      }
    } catch (e) {
      console.error('Music Search Error:', e)
    } finally {
      setIsSearchingMusic(false)
    }
  }

  const copyToClipboard = () => {
    const link = `${window.location.origin}/d/${generatedSlug}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareToWhatsApp = () => {
    const link = `${window.location.origin}/d/${generatedSlug}`
    const text = `I've created a special Valentine surprise for you! ❤️ View it here: ${link}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(whatsappUrl, '_blank')
  }

  const copyPhone = () => {
    navigator.clipboard.writeText('0759313238')
    setCopiedPhone(true)
    setTimeout(() => setCopiedPhone(false), 2000)
  }

  const contactSupport = () => {
    const text = `Hi Andrew, I'm having an issue with my ValenAI payment for Valentine ${generatedSlug || ''}.`
    const whatsappUrl = `https://wa.me/254759313238?text=${encodeURIComponent(text)}`
    window.open(whatsappUrl, '_blank')
  }

  const copyEmail = () => {
    navigator.clipboard.writeText('musiliofficialandrew@gmail.com')
    setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  const getDollarPrice = () => {
    const p = getPrice()
    if (p === 500) return 5
    if (p === 350) return 3
    return 2
  }

  const handlePreview = () => {
    window.open(`/d/${generatedSlug}`, '_blank')
  }

  const onSubmit = async (data: ValentineFormData) => {
    setIsSubmitting(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('sender_name', data.senderName)
      if (data.senderLocation) formDataToSend.append('sender_location', data.senderLocation)
      formDataToSend.append('recipient_name', data.receiverName)
      formDataToSend.append('message', data.message)
      formDataToSend.append('theme', data.theme)
      formDataToSend.append('template_type', data.template_type)
      if (data.title) formDataToSend.append('title', data.title)
      if (data.musicLink) formDataToSend.append('music_link', data.musicLink)
      if (data.imageUrl) formDataToSend.append('image_url', data.imageUrl)
      if (data.protectionQuestion) formDataToSend.append('protection_question', data.protectionQuestion)
      if (data.protectionAnswer) formDataToSend.append('protection_answer', data.protectionAnswer)

      if (data.imageFile && data.imageFile[0]) {
        formDataToSend.append('image', data.imageFile[0])
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/valentines/`, {
        method: 'POST',
        body: formDataToSend,
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setGeneratedSlug(result.data.slug)
        setManagementToken(result.data.management_token)
        setCompleted(true) // Keep existing state for rendering success page
        setCurrentStep(6) // Assuming this is the intended step for success

        // Save ownership to prevent self-responding
        const owned = JSON.parse(localStorage.getItem('valenai_owned') || '{}')
        owned[result.data.slug] = result.data.management_token
        localStorage.setItem('valenai_owned', JSON.stringify(owned))
      } else {
        alert(result.message || 'Failed to create Valentine. Please try again.')
      }
    } catch (error) {
      console.error('Submission Error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getFieldsForStep = (step: number) => {
    switch (step) {
      case 1:
        return ['senderName', 'senderLocation', 'receiverName']
      case 2:
        return ['template_type']
      case 3:
        return ['theme', 'message']
      case 4:
        return [] // Optional
      case 5:
        if (formData.protectionQuestion?.trim()) {
          return ['protectionAnswer']
        }
        return []
      case 6:
        return ['senderName', 'receiverName', 'message']
      default:
        return []
    }
  }

  const canProceed = () => {
    const fieldsForStep = getFieldsForStep(currentStep)
    return fieldsForStep.every((field) => {
      const value = formData[field as keyof ValentineFormData]
      return value && (typeof value === 'string' ? value.trim().length > 0 : true)
    })
  }

  if (completed) {
    const price = getPrice()
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="w-full max-w-md text-center border-2 border-rose-200 shadow-2xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500" />
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center">
                  <Heart className="w-10 h-10 text-rose-600 fill-current animate-pulse" />
                </div>
              </div>
              <CardTitle className="font-playfair text-3xl text-rose-900">Valentine Created! 🎉</CardTitle>
              <CardDescription>
                {isPaid ? "Your message is live and ready to send!" : "One last step to publish your message"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
              {!isPaid ? (
                <div className="space-y-6">
                  {/* Payment Method Toggle */}
                  <div className="flex bg-rose-100/50 p-1 rounded-2xl border border-rose-100">
                    <button
                      onClick={() => setPaymentMethod('mpesa')}
                      className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all ${paymentMethod === 'mpesa' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-600 hover:bg-rose-50'}`}
                    >
                      M-Pesa (Kenya)
                    </button>
                    <button
                      onClick={() => setPaymentMethod('paypal')}
                      className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all ${paymentMethod === 'paypal' ? 'bg-[#0070ba] text-white shadow-sm' : 'text-[#0070ba] hover:bg-blue-50'}`}
                    >
                      PayPal (International)
                    </button>
                  </div>

                  {paymentMethod === 'mpesa' ? (
                    <div className="bg-rose-50 border-2 border-rose-100 rounded-2xl p-6 text-left space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-rose-900 flex items-center gap-2 text-sm">
                          <Wallet className="w-4 h-4 text-rose-600" />
                          Pay via M-Pesa
                        </h3>
                        <span className="bg-rose-600 text-white text-[10px] font-black px-3 py-1 rounded-full">
                          KES {price}
                        </span>
                      </div>

                      <div className="text-sm text-gray-700">
                        <p className="font-bold text-[10px] uppercase text-gray-400 mb-1">Payment Instructions:</p>
                        <p>1. Go to M-Pesa &gt; Send Money</p>
                        <div className="flex items-center justify-between bg-white rounded-xl p-2 my-2 border border-rose-100 shadow-sm">
                          <p className="text-xs">2. Number: <strong>0759313238</strong></p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={copyPhone}
                            className={`h-7 px-2 ${copiedPhone ? 'text-green-600 bg-green-50' : 'text-rose-500 hover:bg-rose-50'}`}
                          >
                            {copiedPhone ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                            <span className="text-[10px]">{copiedPhone ? 'Copied' : 'Copy'}</span>
                          </Button>
                        </div>
                        <p>3. Recipient: <strong>ANDREW MUSILI</strong></p>
                        <p>4. Pay <strong>KES {price}</strong></p>
                        <p className="mt-2 text-xs">5. Paste the <strong>Full M-Pesa Message</strong> below</p>
                      </div>

                      <div className="space-y-2">
                        <Textarea
                          id="mpesaCode"
                          placeholder="Paste the whole M-Pesa confirmation here..."
                          value={mpesaCode}
                          onChange={(e) => setMpesaCode(e.target.value)}
                          className="bg-white border-rose-200 focus:border-rose-400 min-h-[100px] text-xs font-mono rounded-xl shadow-inner italic"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-6 text-left space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-blue-900 flex items-center gap-2 text-sm">
                          <span className="text-xl">💳</span>
                          Pay via PayPal
                        </h3>
                        <span className="bg-[#0070ba] text-white text-[10px] font-black px-3 py-1 rounded-full">
                          USD ${getDollarPrice()}
                        </span>
                      </div>

                      <div className="text-sm text-gray-700">
                        <p className="font-bold text-[10px] uppercase text-gray-400 mb-1">Instructions:</p>
                        <p>1. Send <strong>USD ${getDollarPrice()}</strong> to:</p>
                        <div className="flex items-center justify-between bg-white rounded-xl p-2 my-2 border border-blue-100 shadow-sm">
                          <p className="text-[10px] font-bold truncate pr-2">musiliofficialandrew@gmail.com</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={copyEmail}
                            className={`h-7 px-2 ${copiedEmail ? 'text-green-600 bg-green-50' : 'text-blue-500 hover:bg-blue-50'}`}
                          >
                            {copiedEmail ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                            <span className="text-[10px]">{copiedEmail ? 'Copy' : 'Copy'}</span>
                          </Button>
                        </div>
                        <p className="text-xs">2. Paste <strong>Transaction ID / Email</strong> below</p>
                      </div>

                      <div className="space-y-2">
                        <Input
                          id="paypalId"
                          placeholder="Transaction ID / Your Email"
                          value={mpesaCode}
                          onChange={(e) => setMpesaCode(e.target.value)}
                          className="bg-white border-blue-200 focus:border-blue-400 h-11 text-sm rounded-xl shadow-inner font-mono"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      onClick={handleManualPayment}
                      disabled={isVerifying || !mpesaCode.trim()}
                      className={`w-full h-14 text-lg font-bold rounded-2xl shadow-lg transition-all active:scale-95 ${paymentMethod === 'paypal' ? 'bg-[#0070ba] hover:bg-[#005ea6] shadow-blue-100' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'}`}
                    >
                      {isVerifying ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : <>Verify & Get Link 🚀</>}
                    </Button>
                    <button
                      onClick={contactSupport}
                      className="w-full text-center text-[10px] text-gray-400 hover:text-rose-500 font-bold uppercase tracking-widest mt-6 transition-colors"
                    >
                      Payment help? WhatsApp Andrew 📱
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                  <div className="bg-green-50 border-2 border-green-100 rounded-2xl p-4 text-left">
                    <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mb-2 text-center">Your Live Share Link</p>
                    <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-green-200 shadow-sm">
                      <p className="text-sm font-mono flex-1 truncate text-green-700 font-bold">
                        {typeof window !== 'undefined' ? window.location.origin : ''}/d/{generatedSlug}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={copyToClipboard}
                        className={`h-9 px-3 ${copied ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-rose-600'}`}
                      >
                        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        <span className="text-xs font-bold">{copied ? 'Copied!' : 'Copy'}</span>
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      onClick={shareToWhatsApp}
                      className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-14 rounded-2xl text-lg shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-95"
                    >
                      <Share2 className="w-5 h-5" />
                      Send via WhatsApp 📱
                    </Button>
                    <Button asChild variant="outline" className="h-12 rounded-xl border-rose-100 text-rose-500 hover:text-rose-600 font-bold bg-white/50">
                      <Link href={`/manage/${managementToken}`}>
                        Live Tracker & Stats 📊
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              <div className="h-px bg-gray-100 w-full" />
              <Button asChild variant="ghost" size="sm" className="text-gray-400 text-xs">
                <Link href="/">Create another one</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 py-8 px-4">
      {/* AI Message Generator Modal */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="font-playfair text-xl font-bold">AI Cupid Helper</h3>
                </div>
                <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex gap-2 mb-4">
                  {['romantic', 'playful', 'deep', 'funny'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setAiTone(t)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${aiTone === t
                        ? 'bg-rose-100 text-rose-700 border-rose-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>

                {(aiMessages.length === 0 && aiPoems.length === 0) && !isGenerating && (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      {formData.template_type === 'poem'
                        ? "I'll help you write a beautiful, personalized poem."
                        : "Tell me who you're writing to, and I'll help you find the perfect words."}
                    </p>
                    <Button
                      onClick={generateAiContent}
                      className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {formData.template_type === 'poem' ? 'Generate Poems' : 'Generate Messages'}
                    </Button>
                  </div>
                )}

                {isGenerating && (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 mx-auto text-rose-500 animate-spin mb-4" />
                    <p className="text-gray-600">Working my magic...</p>
                  </div>
                )}

                {aiMessages.length > 0 && !isGenerating && (
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {aiMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setValue('message', msg, { shouldValidate: true })
                          setShowAiModal(false)
                        }}
                        className="p-4 rounded-xl border border-gray-200 hover:border-rose-400 hover:bg-rose-50 cursor-pointer transition-all group"
                      >
                        <p className="text-gray-700 text-sm leading-relaxed">{msg}</p>
                        <p className="text-xs text-rose-600 mt-2 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to use this message
                        </p>
                      </div>
                    ))}
                    <div className="pt-2 text-center">
                      <Button variant="ghost" size="sm" onClick={generateAiContent} className="text-gray-500">
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}

                {aiPoems.length > 0 && !isGenerating && (
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {aiPoems.map((poem, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setValue('message', poem.lines.join('\n'), { shouldValidate: true })
                          setValue('title', poem.title, { shouldValidate: true })
                          setShowAiModal(false)
                        }}
                        className="p-4 rounded-xl border border-gray-200 hover:border-rose-400 hover:bg-rose-50 cursor-pointer transition-all group"
                      >
                        <p className="font-bold text-gray-900 mb-2">{poem.title}</p>
                        <div className="text-gray-700 text-sm italic font-serif space-y-1">
                          {poem.lines.slice(0, 4).map((line: string, i: number) => (
                            <p key={i}>{line}</p>
                          ))}
                          {poem.lines.length > 4 && <p className="text-gray-400">...</p>}
                        </div>
                        <p className="text-xs text-rose-600 mt-3 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to use this poem
                        </p>
                      </div>
                    ))}
                    <div className="pt-2 text-center">
                      <Button variant="ghost" size="sm" onClick={generateAiContent} className="text-gray-500">
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-flex items-center gap-2 mb-4 text-gray-600 hover:text-rose-600 transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-8 h-8 text-rose-600 fill-rose-600 animate-pulse" />
            <h1 className="text-3xl sm:text-4xl font-bold font-playfair text-gray-900">Create Your Valentine</h1>
          </div>
          <p className="text-gray-600">Step {currentStep} of {steps.length}</p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8 flex gap-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`h-2 flex-1 rounded-full transition-all ${step.id <= currentStep ? 'bg-gradient-to-r from-rose-600 to-pink-600' : 'bg-rose-200'
                }`}
            />
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-2 border-rose-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="font-playfair text-2xl text-gray-900">{steps[currentStep - 1].title}</CardTitle>
                  <CardDescription className="text-gray-600">{steps[currentStep - 1].description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Step 1: Names */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="senderName" className="text-base text-gray-700">
                          Your Name
                        </Label>
                        <Input
                          id="senderName"
                          placeholder="Enter your name"
                          {...register('senderName')}
                          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                          className="mt-2 border-rose-200 focus:border-rose-400"
                        />
                        {errors.senderName && (
                          <p className="text-sm text-red-600 mt-1">{errors.senderName.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="senderLocation" className="text-base text-gray-700">
                          Your Location (Optional)
                        </Label>
                        <Input
                          id="senderLocation"
                          placeholder="e.g. Nairobi, Kenya"
                          {...register('senderLocation')}
                          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                          className="mt-2 border-rose-200 focus:border-rose-400"
                        />
                      </div>
                      <div>
                        <Label htmlFor="receiverName" className="text-base text-gray-700">
                          Their Name
                        </Label>
                        <Input
                          id="receiverName"
                          placeholder="Enter their name"
                          {...register('receiverName')}
                          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                          className="mt-2 border-rose-200 focus:border-rose-400"
                        />
                        {errors.receiverName && (
                          <p className="text-sm text-red-600 mt-1">{errors.receiverName.message}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Experience Selection */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div className="grid gap-4">
                        {templates.map((template) => (
                          <label
                            key={template.id}
                            className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.template_type === template.id
                              ? 'border-rose-500 bg-rose-50 shadow-lg'
                              : 'border-rose-200 hover:border-rose-300 hover:bg-rose-50/50'
                              }`}
                          >
                            <input
                              type="radio"
                              value={template.id}
                              {...register('template_type')}
                              className="sr-only"
                            />
                            <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center text-3xl shadow-sm border border-rose-100`}>
                              {template.emoji}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-gray-900">{template.name}</p>
                                {template.premium && (
                                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    Premium
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{template.description}</p>
                            </div>
                            {formData.template_type === template.id && (
                              <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center">
                                <ArrowRight className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Customize */}
                  {currentStep === 3 && (
                    <div className="space-y-8">
                      {/* Theme Selection Sub-section */}
                      <div className="space-y-4">
                        <Label className="text-base text-gray-700 font-bold">Choose a Color Theme</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {themes.map((theme) => (
                            <label
                              key={theme.id}
                              className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.theme === theme.id
                                ? 'border-rose-500 bg-rose-50 shadow-md'
                                : 'border-rose-100 hover:border-rose-200'
                                }`}
                            >
                              <input
                                type="radio"
                                value={theme.id}
                                {...register('theme')}
                                className="sr-only"
                              />
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${theme.color} flex items-center justify-center text-xl`}>
                                {theme.emoji}
                              </div>
                              <p className="text-[10px] font-bold text-gray-800 text-center uppercase tracking-tighter">{theme.name}</p>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="h-px bg-rose-100 w-full" />

                      {/* Content Section (Message or Poem Search) */}
                      {formData.template_type === 'poem' ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-base text-gray-700 font-bold flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-rose-500" />
                              Search Romantic Poems
                            </Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setAiPoems([]) // Reset poems list for new generation
                                setShowAiModal(true)
                              }}
                              className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              AI Poet
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Author (e.g. Shakespeare)"
                              value={poemSearch.author}
                              onChange={(e) => setPoemSearch(prev => ({ ...prev, author: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchPoem())}
                              className="border-rose-200"
                            />
                            <Input
                              placeholder="Poem Title"
                              value={poemSearch.title}
                              onChange={(e) => setPoemSearch(prev => ({ ...prev, title: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchPoem())}
                              className="border-rose-200"
                            />
                            <Button type="button" onClick={searchPoem} disabled={isSearchingPoem} className="bg-rose-500">
                              {isSearchingPoem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            </Button>
                          </div>

                          {poemResults.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Select a poem to autofill:</p>
                              <div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-rose-50/50 rounded-lg border border-rose-100 shadow-inner">
                                {poemResults.map((poem, i) => (
                                  <div
                                    key={i}
                                    onClick={() => {
                                      setValue('message', poem.lines.join('\n'), {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                        shouldTouch: true
                                      })
                                      if (poem.title) setValue('title', poem.title, { shouldValidate: true })
                                      setPoemResults([])
                                    }}
                                    className="p-3 bg-white rounded-lg border border-rose-100 hover:border-rose-400 cursor-pointer transition-all hover:shadow-sm group flex justify-between items-center"
                                  >
                                    <div>
                                      <p className="text-sm font-bold text-gray-900 group-hover:text-rose-600 transition-colors">{poem.title}</p>
                                      <p className="text-xs text-gray-500 italic">by {poem.author}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-rose-300 opacity-0 group-hover:opacity-100 transition-all" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="space-y-4 pt-4">
                            <Label htmlFor="title" className="text-sm font-bold">Poem Title</Label>
                            <Input
                              id="title"
                              {...register('title')}
                              placeholder="Poem Title"
                              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                              className="border-rose-200"
                            />
                            <Label htmlFor="message" className="text-sm font-bold">Poem Content (Edit as you wish)</Label>
                            <Textarea
                              id="message"
                              placeholder="Poem lines appear here..."
                              {...register('message')}
                              className="mt-2 min-h-60 font-serif border-rose-200 focus:border-rose-400"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <Label htmlFor="message" className="text-base text-gray-700 font-bold">
                              Your Heartfelt Message
                            </Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAiModal(true)}
                              className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              AI Helper
                            </Button>
                          </div>
                          <Textarea
                            id="message"
                            placeholder="Express your feelings... be authentic and heartfelt ❤️"
                            {...register('message')}
                            className="mt-2 min-h-40 border-rose-200 focus:border-rose-400"
                          />
                          <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>
                              {formData.message?.length || 0} / 2000 characters
                            </span>
                          </div>
                        </div>
                      )}
                      {errors.message && (
                        <p className="text-sm text-red-600 mt-1">{errors.message.message}</p>
                      )}
                    </div>
                  )}

                  {/* Step 4: Extras */}
                  {currentStep === 4 && (
                    <div className="space-y-4">
                      <div className="space-y-4">
                        <Label htmlFor="musicSearch" className="text-base text-gray-700 font-bold flex items-center gap-2">
                          <Music className="w-4 h-4 text-rose-500" />
                          Add a Romantic Song
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="musicSearch"
                            placeholder="Search song or artist..."
                            value={musicSearch}
                            onChange={(e) => setMusicSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchMusic())}
                            className="border-rose-200 focus:border-rose-400"
                          />
                          <Button
                            type="button"
                            onClick={searchMusic}
                            disabled={isSearchingMusic}
                            className="bg-rose-500 hover:bg-rose-600 shadow-sm transition-all active:scale-95"
                          >
                            {isSearchingMusic ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          </Button>
                        </div>

                        {musicResults.length > 0 && (
                          <div className="max-h-60 overflow-y-auto space-y-2 p-2 bg-rose-50/50 rounded-xl border border-rose-100 shadow-inner">
                            {musicResults.map((track) => (
                              <div
                                key={track.id}
                                onClick={() => {
                                  setValue('musicLink', track.external_url, { shouldValidate: true })
                                  setMusicSearch(`${track.name} - ${track.artist}`)
                                  setMusicResults([])
                                }}
                                className={`flex items-center gap-3 p-2 bg-white rounded-lg border cursor-pointer transition-all hover:border-rose-400 group ${formData.musicLink === track.external_url ? 'border-rose-500 ring-2 ring-rose-100' : 'border-rose-100'}`}
                              >
                                <img src={track.album_art} alt={track.name} className="w-10 h-10 rounded-md shadow-sm group-hover:scale-105 transition-transform" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-gray-900 truncate">{track.name}</p>
                                  <p className="text-[10px] text-gray-500 truncate uppercase tracking-wider">{track.artist}</p>
                                </div>
                                {formData.musicLink === track.external_url && (
                                  <div className="bg-rose-500 rounded-full p-1">
                                    <Heart className="w-3 h-3 text-white fill-white" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {formData.musicLink && !musicResults.length && (
                          <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-1">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                                <Music className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-green-700 truncate">Song Attached!</span>
                                <span className="text-[10px] text-green-600/80 truncate">
                                  {musicSearch || 'Ready to play'}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setValue('musicLink', '')
                                setMusicSearch('')
                              }}
                              className="w-8 h-8 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        <Label htmlFor="imageUpload" className="text-base text-gray-700 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Upload Photo (Recommended)
                        </Label>
                        <Input
                          id="imageUpload"
                          type="file"
                          accept="image/*"
                          {...register('imageFile')}
                          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                          className="mt-2 border-rose-200 focus:border-rose-400 file:bg-rose-50 file:text-rose-700 file:border-0 file:rounded-md file:mr-4 file:px-4 file:py-1 cursor-pointer"
                        />
                        <div className="flex items-center gap-2 py-2">
                          <div className="h-px bg-rose-100 flex-1" />
                          <span className="text-[10px] text-gray-400 uppercase font-bold px-2">or use a link</span>
                          <div className="h-px bg-rose-100 flex-1" />
                        </div>
                        <div>
                          <Label htmlFor="imageUrl" className="text-sm text-gray-500 flex items-center gap-2">
                            Photo URL
                          </Label>
                          <Input
                            id="imageUrl"
                            type="url"
                            placeholder="https://example.com/photo.jpg"
                            {...register('imageUrl')}
                            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                            className="mt-1 border-rose-200 focus:border-rose-400 text-sm h-8"
                          />
                        </div>
                        {errors.imageUrl && (
                          <p className="text-sm text-red-600 mt-1">{errors.imageUrl.message}</p>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 italic">
                        💡 Tip: Add a song or photo to make it extra special!
                      </p>
                    </div>
                  )}

                  {/* Step 5: Security */}
                  {currentStep === 5 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-bold text-amber-900">Add a Personal Challenge!</h3>
                          <p className="text-xs text-amber-700">Make {formData.receiverName} answer a secret question to unlock your message. Something only you two know! ❤️</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="protectionQuestion" className="text-base text-gray-700 font-bold">The Secret Question (Optional)</Label>
                          <Input
                            id="protectionQuestion"
                            placeholder="e.g., Where was our first date?"
                            {...register('protectionQuestion')}
                            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                            className="mt-2 border-rose-200 focus:border-rose-400"
                          />
                        </div>

                        <div>
                          <Label htmlFor="protectionAnswer" className="text-base text-gray-700 font-bold">The Correct Answer</Label>
                          <Input
                            id="protectionAnswer"
                            placeholder="The answer they must type..."
                            {...register('protectionAnswer')}
                            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                            className="mt-2 border-rose-200 focus:border-rose-400"
                          />
                          <p className="text-[10px] text-gray-400 mt-2 lowercase italic">Note: Answers are case-insensitive</p>
                        </div>
                      </div>

                      <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md">$1</div>
                          <div>
                            <p className="text-xs font-bold text-gray-800">Steal a Peek (Premium)</p>
                            <p className="text-[10px] text-gray-500">Track clicks without notifying partner</p>
                          </div>
                        </div>
                        <Button type="button" variant="outline" size="sm" className="text-[10px] h-7 border-rose-300 text-rose-600 font-bold bg-white hover:bg-rose-50">Upgrade</Button>
                      </div>
                    </div>
                  )}

                  {/* Step 6: Review */}
                  {currentStep === 6 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                      <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                          <h3 className="font-bold text-rose-900">Valentine Preview</h3>
                          <span className="text-xs bg-rose-200 text-rose-700 px-2 py-1 rounded-full uppercase font-black">Ready</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 text-[10px] uppercase font-bold">To</p>
                            <p className="font-bold text-gray-900">{formData.receiverName}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-[10px] uppercase font-bold">From</p>
                            <p className="font-bold text-gray-900">{formData.senderName}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-[10px] uppercase font-bold">Theme</p>
                            <p className="font-bold text-gray-900 capitalize">{formData.theme}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-[10px] uppercase font-bold">Template</p>
                            <p className="font-bold text-gray-900 capitalize">{formData.template_type?.replace('_', ' ')}</p>
                          </div>
                          {formData.protectionQuestion && (
                            <div className="col-span-2 pt-2 border-t border-rose-100">
                              <p className="text-amber-600 text-[10px] uppercase font-bold">Secret Question</p>
                              <p className="font-bold text-gray-900 italic">"{formData.protectionQuestion}"</p>
                              <p className="text-[10px] text-gray-400 mt-1">Answer: {formData.protectionAnswer}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-center p-4">
                        <p className="text-sm text-gray-500 italic">Everything looks perfect! Ready to create your magical link? ✨</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-4 justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="gap-2 border-2 border-rose-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {currentStep < steps.length ? (
              <Button
                type="button"
                onClick={() => {
                  if (canProceed()) {
                    setCurrentStep(currentStep + 1)
                  }
                }}
                disabled={!canProceed()}
                className="gap-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Valentine
                    <Heart className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div >
  )
}
