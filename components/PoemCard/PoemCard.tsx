'use client'

import React, { useEffect, useState } from 'react'
import styles from './PoemCard.module.css'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import SpotifyPlayer from '@/components/SpotifyPlayer'

interface PoemCardProps {
    title?: string
    sender_name: string
    recipient_name: string
    lines: string[]
    image?: string
    music_link?: string
    onAccept: () => void | Promise<void>
    runCount: number
    moveNoButton: () => void
    noBtnPos: { x: number; y: number }
    noButtonRef: React.RefObject<HTMLButtonElement | null>
}

export default function PoemCard({
    title,
    sender_name,
    recipient_name,
    lines,
    image,
    music_link,
    onAccept,
    runCount,
    moveNoButton,
    noBtnPos,
    noButtonRef
}: PoemCardProps) {
    const [petals, setPetals] = useState<{ id: number; symbol: string; left: number; duration: number; delay: number }[]>([])

    useEffect(() => {
        const symbols = ['🌹', '❤️', '✿', '♡', '❧']
        const newPetals = Array.from({ length: 18 }, (_, i) => ({
            id: i,
            symbol: symbols[Math.floor(Math.random() * symbols.length)],
            left: Math.random() * 100,
            duration: 7 + Math.random() * 8,
            delay: Math.random() * 10
        }))
        setPetals(newPetals)
    }, [])

    // Split lines into stanzas (every 4 lines for example, or based on empty strings if API returned them)
    // Since the simplistic API returns array of strings, we'll group them. 
    // A sonnet is usually 14 lines: 4-4-4-2 or similar. 
    // Let's just render line by line but adding a spacing every 4 lines if meaningful structure isn't present

    const renderContent = () => {
        return lines.map((line, index) => (
            <React.Fragment key={index}>
                {line}
                <br />
                {(index + 1) % 4 === 0 && <span style={{ display: 'block', marginBottom: '16px' }} />}
            </React.Fragment>
        ))
    }

    return (
        <div className={`flex items-center justify-center min-h-screen relative overflow-hidden ${styles.container}`}>
            {/* Falling Petals */}
            <div className={styles.petalsContainer}>
                {petals.map(p => (
                    <div
                        key={p.id}
                        className={styles.petal}
                        style={{
                            left: `${p.left}%`,
                            animationDuration: `${p.duration}s`,
                            animationDelay: `${p.delay}s`
                        }}
                    >
                        {p.symbol}
                    </div>
                ))}
            </div>

            <div className={styles.cardWrap}>
                <div className={styles.card}>
                    <span className={styles.rnCorner} style={{ top: 14, left: 14 }}>✦</span>
                    <span className={styles.rnCorner} style={{ top: 14, right: 14 }}>✦</span>
                    <span className={styles.rnCorner} style={{ bottom: 14, left: 14 }}>✦</span>
                    <span className={styles.rnCorner} style={{ bottom: 14, right: 14 }}>✦</span>

                    <div className={styles.topRule}></div>
                    <div className={styles.label}>For {recipient_name} — This Valentine's Day</div>

                    <div className={styles.heartIcon}>❤</div>

                    <h1 className={styles.poemTitle}>{title || 'Your Poem'}</h1>

                    {image && (
                        <div className="mb-6 w-32 h-32 rounded-full overflow-hidden border-4 border-[#C9A84C]/30 mx-auto shadow-md">
                            <img src={image} alt="Poem Image" className="w-full h-full object-cover" />
                        </div>
                    )}

                    <div className={styles.divider}>· · · ♡ · · ·</div>

                    <div className={styles.poem}>
                        <div className={styles.stanza} style={{ animationDelay: '0.8s' }}>
                            {renderContent()}
                        </div>
                    </div>

                    <div className={styles.closing}>
                        <div className={styles.closingRule}></div>
                        <p className="mb-4">Will you be my Valentine?</p>

                        <div className="flex flex-col gap-3 items-center justify-center relative min-h-[100px] mb-8 mt-6">
                            <Button
                                onClick={onAccept}
                                className="bg-[#C0392B] hover:bg-[#a02e22] text-white text-lg font-bold px-8 py-3 rounded-xl shadow-lg hover:scale-105 transition-all w-full sm:w-auto relative z-20"
                            >
                                YES! 💖
                            </Button>

                            <motion.div
                                animate={{ x: noBtnPos.x, y: noBtnPos.y }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                style={{ position: 'relative', zIndex: 10 }}
                            >
                                <Button
                                    ref={noButtonRef}
                                    variant="ghost"
                                    onMouseEnter={moveNoButton}
                                    onTouchStart={moveNoButton}
                                    className={`text-[#E8A0A0] hover:text-[#C0392B] hover:bg-transparent transition-colors ${runCount > 0 ? 'absolute' : 'relative'}`}
                                >
                                    {runCount === 0 ? 'No' :
                                        runCount < 3 ? 'Are you sure?' :
                                            runCount < 5 ? 'Really sure? 😢' :
                                                runCount < 8 ? 'Please?' :
                                                    "Okay I'm fast! 🏃‍♂️"}
                                </Button>
                            </motion.div>
                        </div>

                        <div className={styles.closingRule}></div>
                        <p>With all my heart</p>
                        <div className={styles.signature}>— {sender_name} ♡</div>

                        {music_link && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.5 }}
                                className="mt-8"
                            >
                                <SpotifyPlayer url={music_link} />
                            </motion.div>
                        )}
                    </div>

                    <div className={styles.bottomRule}></div>
                </div>
            </div>
        </div>
    )
}
