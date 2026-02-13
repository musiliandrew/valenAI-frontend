'use client'

import React from 'react'

interface SpotifyPlayerProps {
    url: string
    className?: string
}

export default function SpotifyPlayer({ url, className = "" }: SpotifyPlayerProps) {
    if (!url) return null

    // Transform standard Spotify URL to Embed URL
    // Handles: https://open.spotify.com/track/4cOdK9uRMU7qyg0oP9M99M?si=...
    // Turns it into: https://open.spotify.com/embed/track/4cOdK9uRMU7qyg0oP9M99M

    const getEmbedUrl = (originalUrl: string) => {
        try {
            const urlObj = new URL(originalUrl)
            const pathParts = urlObj.pathname.split('/')
            const trackId = pathParts[pathParts.length - 1]
            return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`
        } catch (e) {
            return originalUrl
        }
    }

    const embedUrl = getEmbedUrl(url)

    return (
        <div className={`w-full overflow-hidden rounded-xl shadow-lg ${className}`}>
            <iframe
                style={{ borderRadius: '12px' }}
                src={embedUrl}
                width="100%"
                height="152"
                frameBorder="0"
                allowFullScreen={false}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
            ></iframe>
        </div>
    )
}
