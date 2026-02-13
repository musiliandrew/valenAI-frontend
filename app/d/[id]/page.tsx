import { Metadata } from 'next'
import ReceiverView from './ReceiverView'

interface Props {
  params: { id: string }
}

async function getValentine(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/valentines/${id}/`, {
    next: { revalidate: 60 }
  })
  if (!res.ok) return null
  return res.json()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const valentine = await getValentine(params.id)

  if (!valentine) {
    return {
      title: 'Valentine Not Found | ValenAI',
      description: 'Oops! This Valentine surprise could not be found.'
    }
  }

  const title = `A special surprise for ${valentine.recipient_name}... ❤️`
  const description = `${valentine.sender_name} has left a personalized Valentine surprise for you on ValenAI. Open to reveal! 🌹`

  // Construct the dynamic image URL from our opengraph-image generator
  // Note: Next.js automatically associates opengraph-image.tsx with the page, 
  // but we can explicitly set it for better control.
  const ogImage = `/api/valentines/card/${params.id}?sender=${encodeURIComponent(valentine.sender_name)}&recipient=${encodeURIComponent(valentine.recipient_name)}&theme=${valentine.theme}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `Valentine Card for ${valentine.recipient_name}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default function Page({ params }: Props) {
  return <ReceiverView />
}
