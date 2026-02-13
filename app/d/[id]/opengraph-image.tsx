import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export default async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Fetch real data for the image
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/valentines/${params.id}/`)
        const valentine = res.ok ? await res.json() : null

        const sender = valentine?.sender_name || 'Someone'
        const recipient = valentine?.recipient_name || 'You'
        const themeName = valentine?.theme || 'classic'

        // Colors based on theme
        let bg = 'linear-gradient(to bottom right, #fff1f2, #ffe4e6)'
        let text = '#9f1239'
        let accent = '#e11d48'

        if (themeName === 'midnight') {
            bg = 'linear-gradient(to bottom right, #020617, #450a0a)'
            text = '#fff1f2'
            accent = '#fb7185'
        } else if (themeName === 'golden') {
            bg = 'linear-gradient(to bottom right, #fffbeb, #fef3c7)'
            text = '#92400e'
            accent = '#d97706'
        }

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: bg,
                        fontFamily: 'sans-serif',
                        position: 'relative',
                    }}
                >
                    {/* Decorative Hearts */}
                    <div style={{ position: 'absolute', top: 40, left: 40, fontSize: 40 }}>❤️</div>
                    <div style={{ position: 'absolute', bottom: 40, right: 40, fontSize: 40 }}>💖</div>
                    <div style={{ position: 'absolute', top: 100, right: 80, fontSize: 30, opacity: 0.5 }}>🌹</div>
                    <div style={{ position: 'absolute', bottom: 100, left: 80, fontSize: 30, opacity: 0.5 }}>✨</div>

                    {/* Main Card Content */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255, 255, 255, 0.4)',
                            padding: '60px',
                            borderRadius: '40px',
                            border: `4px solid ${accent}`,
                            boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                        }}
                    >
                        <div style={{ fontSize: 32, fontWeight: 'bold', color: text, marginBottom: 10, opacity: 0.8 }}>
                            VALEN AI SURPRISE
                        </div>
                        <div style={{ fontSize: 60, fontWeight: '900', color: text, textAlign: 'center', marginBottom: 20 }}>
                            For {recipient}
                        </div>
                        <div style={{ fontSize: 32, color: accent, fontWeight: '600' }}>
                            From {sender} with Love
                        </div>
                    </div>

                    <div style={{ marginTop: 40, fontSize: 24, fontWeight: 'bold', color: text, opacity: 0.6 }}>
                        Click to unlock your Valentine 💌
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        )
    } catch (e) {
        return new Response(`Failed to generate the image`, {
            status: 500,
        })
    }
}
