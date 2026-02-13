'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Share2 } from 'lucide-react'
import Link from 'next/link'

// Mock declarations data
const mockDeclarations = [
  {
    id: '1',
    senderName: 'Alex',
    receiverName: 'Jordan',
    excerpt: 'From the moment I met you, you\'ve been a light in my life...',
    date: '2 days ago',
    theme: 'romantic',
  },
  {
    id: '2',
    senderName: 'Sam',
    receiverName: 'Casey',
    excerpt: 'Three years of friendship have led me to this moment of truth...',
    date: '1 week ago',
    theme: 'heartfelt',
  },
  {
    id: '3',
    senderName: 'Morgan',
    receiverName: 'River',
    excerpt: 'Life is better with you in it. Will you make me the happiest person?',
    date: '3 days ago',
    theme: 'passionate',
  },
  {
    id: '4',
    senderName: 'Taylor',
    receiverName: 'Jamie',
    excerpt: 'Every moment with you feels like a scene from my favorite movie...',
    date: '5 days ago',
    theme: 'poetic',
  },
  {
    id: '5',
    senderName: 'Quinn',
    receiverName: 'Blair',
    excerpt: 'You\'ve changed my life in ways I never thought possible...',
    date: '1 week ago',
    theme: 'tender',
  },
  {
    id: '6',
    senderName: 'Riley',
    receiverName: 'Parker',
    excerpt: 'This Valentine\'s Day, I want to share the truth about my feelings...',
    date: '4 days ago',
    theme: 'sincere',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-sm bg-background/80 border-b border-border py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <Heart className="w-5 h-5 text-primary fill-primary" />
            <span className="font-bold font-playfair text-foreground">ValenAI</span>
          </Link>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/creator">Create Declaration</Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold font-playfair text-foreground mb-4">
            Wall of Love
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover heartfelt declarations from around the world. These are the stories of people brave enough to say "I love you."
          </p>
        </motion.div>

        {/* Declarations Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {mockDeclarations.map((declaration) => (
            <motion.div key={declaration.id} variants={itemVariants}>
              <Card className="h-full border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg group overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <CardTitle className="text-xl font-playfair">
                        {declaration.senderName} → {declaration.receiverName}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {declaration.date}
                      </CardDescription>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Heart className="w-4 h-4 text-primary fill-primary" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-foreground/80 leading-relaxed min-h-20">
                    "{declaration.excerpt}"
                  </p>

                  <div className="pt-4 border-t border-border flex gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs border-primary text-primary hover:bg-primary/10"
                    >
                      <Link href={`/d/${declaration.id}`}>
                        Read Full
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(`valentine.ai/d/${declaration.id}`)
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty state when viewing actual Wall of Lovers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground">
            Want to add your declaration to the Wall of Love?{' '}
            <Link href="/creator" className="text-primary font-semibold hover:underline">
              Create one now
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
