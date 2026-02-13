'use client'

import React, { useState, useRef, useEffect } from 'react'
import styles from './LoveLetter.module.css'
import { motion, AnimatePresence } from 'framer-motion'

interface LoveLetterProps {
    isOpen: boolean
    onOpen: () => void
    children: React.ReactNode
    onClose?: () => void
}

export default function LoveLetter({ isOpen, onOpen, children, onClose }: LoveLetterProps) {
    const letterRef = useRef<HTMLDivElement>(null)

    // Use a ref to store mutable drag state without causing re-renders
    const dragState = useRef({
        isDragging: false,
        offsetX: 0,
        offsetY: 0,
        zIndex: 10
    })

    // Handle Dragging
    useEffect(() => {
        const letter = letterRef.current
        if (!letter || !isOpen) return

        const handleMouseDown = (e: MouseEvent) => {
            // Don't drag if clicking buttons or inputs
            if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) return

            const rect = letter.getBoundingClientRect()

            // Calculate offset relative to the letter's top-left corner
            dragState.current.offsetX = e.clientX - rect.left
            dragState.current.offsetY = e.clientY - rect.top
            dragState.current.isDragging = true
            dragState.current.zIndex += 1

            // Set fixed position to allow dragging freely
            letter.style.position = 'fixed'
            letter.style.left = `${rect.left}px`
            letter.style.top = `${rect.top}px`
            letter.style.zIndex = `${dragState.current.zIndex}`
            letter.style.cursor = 'grabbing'
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (!dragState.current.isDragging) return

            const x = e.clientX - dragState.current.offsetX
            const y = e.clientY - dragState.current.offsetY

            letter.style.left = `${x}px`
            letter.style.top = `${y}px`
        }

        const handleMouseUp = () => {
            if (!dragState.current.isDragging) return
            dragState.current.isDragging = false
            letter.style.cursor = 'grab'
        }

        letter.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            if (letter) letter.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isOpen])

    return (
        <div className={`${styles.container} ${styles.cssletter}`}>
            <div className={`${styles.envelope} ${isOpen ? styles.active : ''}`}>
                <button
                    className={styles.heart}
                    id="openEnvelope"
                    aria-label="Open Envelope"
                    onClick={onOpen}
                >
                    <span className={styles.heartText}>Open</span>
                </button>
                <div className={styles.envelopeFlap}></div>
                <div className={styles.envelopeFolds}>
                    <div className={styles.envelopeLeft}></div>
                    <div className={styles.envelopeRight}></div>
                    <div className={styles.envelopeBottom}></div>
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <div className={styles.letters}>
                        <motion.div
                            ref={letterRef}
                            initial={{ y: "100%", opacity: 0, scale: 0.5 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5, type: 'spring', damping: 15 }}
                            className={`${styles.letter} ${styles.center}`}
                        >
                            {onClose && (
                                <button className={styles.closeLetter} title="Close letter" onClick={onClose}>
                                    Close letter
                                </button>
                            )}
                            <div className="w-full h-full overflow-y-auto custom-scrollbar relative z-10">
                                {children}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
