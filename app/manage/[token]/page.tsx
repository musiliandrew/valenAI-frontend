'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Heart, Eye, CheckCircle2, Copy, ArrowLeft, Loader2, Sparkles, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import confetti from 'canvas-confetti'

interface ManagementData {
    recipient_name: string
    sender_name: string
    management_token: string
    is_accepted: boolean
    accepted_at: string | null
    views_count: number
    slug: string
    created_at: string
}

export default function ManageValentine() {
    const params = useParams()
    const token = params?.token as string
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<ManagementData | null>(null)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/valentines/manage/${token}/`)
                if (res.ok) {
                    const result = await res.json()
                    setData(result.data)
                    if (result.data.is_accepted) {
                        confetti({
                            particleCount: 100,
                            spread: 70,
                            origin: { y: 0.6 },
                            colors: ['#e11d48', '#fb7185', '#f43f5e']
                        })
                    }
                } else {
                    setError('Invalid or expired management link.')
                }
            } catch (err) {
                setError('Failed to connect to the server.')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [token])

    const copyLink = () => {
        if (!data) return
        const url = `${window.location.origin}/d/${data.slug}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-rose-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Loading your stats...</p>
                </div>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8 border-rose-200">
                    <Heart className="w-16 h-16 text-rose-200 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
                    <p className="text-gray-600 mb-6">{error || 'Something went wrong.'}</p>
                    <Button asChild className="bg-rose-600 hover:bg-rose-700">
                        <Link href="/creator">Create New Valentine</Link>
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-rose-600 transition mb-2">
                            <ArrowLeft className="w-4 h-4" />
                            Main Page
                        </Link>
                        <h1 className="text-3xl font-bold font-playfair text-gray-900">Valentine Dashboard</h1>
                        <p className="text-gray-500">Tracking your surprise to {data.recipient_name}</p>
                    </div>
                    <Button onClick={copyLink} variant="outline" className="border-rose-200 text-rose-600 bg-white hover:bg-rose-50">
                        {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? 'Copied Link!' : 'Copy Share Link'}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Status Card */}
                    <Card className={`${data.is_accepted ? 'bg-green-50 border-green-200' : 'bg-white border-rose-100'} shadow-sm`}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2 rounded-lg ${data.is_accepted ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'}`}>
                                    <Heart className={`w-5 h-5 ${data.is_accepted ? 'fill-current' : ''}`} />
                                </div>
                                <span className={`text-xs font-bold uppercase tracking-wider ${data.is_accepted ? 'text-green-600' : 'text-rose-400'}`}>
                                    {data.is_accepted ? 'Accepted' : 'Sent'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mb-1">Response</p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {data.is_accepted ? 'They said YES! 🎉' : 'Waiting... 🤞'}
                            </h3>
                        </CardContent>
                    </Card>

                    {/* Views Card */}
                    <Card className="bg-white border-rose-100 shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <Eye className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Engagement</span>
                            </div>
                            <p className="text-sm text-gray-500 mb-1">Total Views</p>
                            <h3 className="text-2xl font-bold text-gray-900">{data.views_count}</h3>
                        </CardContent>
                    </Card>

                    {/* Live Link Card */}
                    <Card className="bg-white border-rose-100 shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                    <Share2 className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Live URL</span>
                            </div>
                            <p className="text-sm text-gray-500 mb-1">Short Slug</p>
                            <h3 className="text-2xl font-bold text-gray-900">/d/{data.slug}</h3>
                        </CardContent>
                    </Card>
                </div>

                {/* Action Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="border-rose-100 h-full">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-500" />
                                Next Steps
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">Share the love</p>
                                    <p className="text-xs text-gray-500">Send the link to {data.recipient_name} via WhatsApp, DM, or Story.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">Watch the stats</p>
                                    <p className="text-xs text-gray-500">This dashboard updates instantly when they open or accept your message.</p>
                                </div>
                            </div>
                            <div className="pt-2">
                                <Button asChild className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 h-11">
                                    <Link href={`/d/${data.slug}`} target="_blank">View Live Valentine</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-rose-100 h-full">
                        <CardHeader>
                            <CardTitle className="text-lg">Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-px bg-rose-100 relative">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-rose-400"></div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">Valentine Created</p>
                                        <p className="text-xs text-gray-400">{new Date(data.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                {data.is_accepted && (
                                    <div className="flex gap-4">
                                        <div className="w-px bg-rose-100 relative">
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-green-500"></div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-green-600 uppercase">Said YES!</p>
                                            <p className="text-xs text-gray-400">{data.accepted_at ? new Date(data.accepted_at).toLocaleString() : 'Just now'}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-4">
                                    <div className="w-px bg-rose-100 relative h-4">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-rose-200"></div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-400 italic">Waiting for more activity...</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
