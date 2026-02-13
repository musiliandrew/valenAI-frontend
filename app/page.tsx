'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Flame, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const FOMO_OFFSET = 12480 // Base number to start with for FOMO
const GROWTH_FACTOR = 3.5 // Multiplier for real counts to make it look bigger

export default function Home() {
  const [realStats, setRealStats] = useState({ total_valentines: 0, total_accepted: 0, acceptance_rate: 85 })
  const [liveCount, setLiveCount] = useState(FOMO_OFFSET)
  const [timeLeft, setTimeLeft] = useState({
    hours: 14,
    minutes: 22,
    seconds: 31,
  })

  // Wall of Lovers data
  const [wallOfLovers, setWallOfLovers] = useState([
    { sender: 'Kevin', receiver: 'Aisha', location: 'Nairobi', time: '2m' },
    { sender: 'Brian', receiver: 'Grace', location: 'Kisumu', time: '5m' },
    { sender: 'David', receiver: 'Sarah', location: 'Mombasa', time: '8m' },
    { sender: 'James', receiver: 'Mary', location: 'Nakuru', time: '12m' },
    { sender: 'Peter', receiver: 'Lucy', location: 'Eldoret', time: '15m' },
    { sender: 'John', receiver: 'Anna', location: 'Thika', time: '18m' },
    { sender: 'Mark', receiver: 'Jane', location: 'Nairobi', time: '22m' },
    { sender: 'Paul', receiver: 'Ruth', location: 'Kisumu', time: '25m' },
  ])

  // Floating hearts animation (reduced count)
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; left: string; delay: number; duration: number }[]>([])

  useEffect(() => {
    setFloatingHearts(Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 5,
      duration: 15 + Math.random() * 10,
    })))
  }, [])

  // Fetch real statistics and wall data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, wallRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/valentines/stats/`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/valentines/wall/?limit=15`)
        ])

        if (statsRes.ok) {
          const stats = await statsRes.json()
          setRealStats(stats.stats)
          // Set live count based on real total + offset
          setLiveCount(FOMO_OFFSET + Math.floor(stats.stats.total_valentines * GROWTH_FACTOR))
        }

        if (wallRes.ok) {
          const wall = await wallRes.json()
          if (wall.data && wall.data.length > 0) {
            const locations = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Kiambu', 'Machakos']
            const realWallData = wall.data.map((v: any) => ({
              sender: v.sender_name,
              receiver: v.recipient_name,
              location: v.sender_location || locations[Math.floor(Math.random() * locations.length)],
              time: v.time_ago
            }))

            setWallOfLovers(prev => {
              const merged = [...realWallData, ...prev]
              return merged.slice(0, 15)
            })
          }
        }
      } catch (err) {
        console.error('Failed to fetch stats', err)
      }
    }

    fetchData()
  }, [])

  // Simulate live counter incrementing
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount((prev) => prev + Math.floor(Math.random() * 3) + 1)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev
        seconds--
        if (seconds < 0) {
          seconds = 59
          minutes--
        }
        if (minutes < 0) {
          minutes = 59
          hours--
        }
        if (hours < 0) hours = 0
        return { hours, minutes, seconds }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="h-screen flex flex-col bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 text-gray-900 overflow-hidden relative">
      {/* Floating Hearts Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {floatingHearts.map((heart) => (
          <motion.div
            key={heart.id}
            className="absolute text-rose-300/20"
            style={{ left: heart.left, bottom: '-50px' }}
            animate={{
              y: [0, -1000],
              x: [0, Math.random() * 100 - 50],
              rotate: [0, 360],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: heart.duration,
              repeat: Infinity,
              delay: heart.delay,
              ease: 'linear',
            }}
          >
            <Heart className="w-6 h-6 fill-current" />
          </motion.div>
        ))}
      </div>

      {/* Compact Header with Live Counter + Countdown */}
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="relative z-50 bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg"
      >
        <div className="px-4 py-2 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 animate-pulse" />
            <span className="font-semibold">{liveCount.toLocaleString()} created</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold">Ends in:</span>
            <span className="font-mono">{String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
          </div>
        </div>
      </motion.div>

      {/* Main Content - Single Screen */}
      <div className="flex-1 flex flex-col px-4 py-6 overflow-hidden">
        {/* Compact Logo + Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-8 h-8 text-rose-600 fill-rose-600 animate-pulse" />
            <h1 className="text-3xl sm:text-4xl font-bold font-playfair bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              ValenAI
            </h1>
          </div>
          <p className="text-sm sm:text-base text-gray-700 max-w-md mx-auto">
            Send a personalized, interactive Valentine 💖
          </p>
        </motion.div>

        {/* Wall of Lovers - MAIN FEATURE */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 flex flex-col min-h-0 mb-6"
        >
          <div className="text-center mb-4">
            <h2 className="text-2xl sm:text-3xl font-bold font-playfair text-gray-900 mb-1">
              💘 Wall of Lovers
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">Love is happening right now</p>
          </div>

          {/* Scrollable Feed */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-rose-300 scrollbar-track-rose-100">
            <AnimatePresence>
              {wallOfLovers.map((couple, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-rose-200 hover:border-rose-400 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Heart className="w-4 h-4 text-rose-600 fill-rose-600 flex-shrink-0" />
                      <span className="font-semibold text-sm text-gray-900 truncate">
                        {couple.sender} ❤️ {couple.receiver}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
                      <span>{couple.location}</span>
                      <span>•</span>
                      <span>{couple.time}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-3 border border-amber-300 text-center">
            <p className="text-lg sm:text-xl font-bold text-amber-600">
              {realStats.acceptance_rate}% say YES! 🎉
            </p>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <Link href="/creator">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-lg sm:text-xl px-8 py-6 rounded-xl shadow-xl shadow-rose-300/50 transform hover:scale-105 transition-all"
            >
              <Sparkles className="mr-2 w-5 h-5" />
              Create Your Valentine
              <Heart className="ml-2 w-5 h-5 fill-current animate-pulse" />
            </Button>
          </Link>
          <p className="text-xs text-gray-600 mt-2">
            🔥 <span className="text-rose-600 font-semibold">{Math.floor(liveCount * 0.2)} couples</span> joined in the last hour
          </p>
        </motion.div>
      </div>
    </main>
  )
}
