import { useState, useEffect } from 'react'
import { Card } from './ui'
import type { ServiceCategory } from '@/lib/types'

interface ServiceShowcaseProps {
  serviceCategory?: ServiceCategory
}

export default function ServiceShowcase({ serviceCategory = 'car-detailing' }: ServiceShowcaseProps) {
  const tabs = [
    { id: 'upholstery', label: 'Upholstery' },
    { id: 'move', label: 'Move‑In/Out' },
    { id: 'post', label: 'Post‑Construction' },
    { id: 'deep', label: 'Deep Cleaning' },
  ]

  const media: Record<string, Array<{ id: number; type: 'image' | 'video'; src: string; title: string; caption?: string; poster?: string }>> = {
    upholstery: [
      { id: 1, type: 'image', src: '/assets/cleaning/pexels-tima-miroshnichenko-6195895.jpg', title: 'Sofa Shampoo' },
      { id: 2, type: 'image', src: '/assets/cleaning/pexels-tima-miroshnichenko-6195952.jpg', title: 'Detail Vacuum' },
      { id: 3, type: 'image', src: '/assets/cleaning/pexels-tima-miroshnichenko-6200808.jpg', title: 'Fabric Care' },
    ],
    move: [
      { id: 11, type: 'image', src: '/assets/cleaning/pexels-matilda-wormwood-4098579.jpg', title: 'Move‑Out Prep' },
      { id: 12, type: 'video', src: '/assets/cleaning/6195933-mobile-720p.mp4', title: 'Hallway Sweep', poster: '/assets/cleaning/ashwini-chaudhary-monty-Iu6parQAO-U-unsplash.jpg' },
      { id: 13, type: 'video', src: '/assets/cleaning/uhd_25fps-mobile-720p.mp4', title: 'Floor Glide', poster: '/assets/cleaning/pexels-tima-miroshnichenko-6196688.jpg' },
    ],
    post: [
      { id: 21, type: 'image', src: '/assets/cleaning/ashwini-chaudhary-monty-Iu6parQAO-U-unsplash.jpg', title: 'After Build' },
      { id: 22, type: 'video', src: '/assets/cleaning/6197568-mobile-720p.mp4', title: 'Dust Removal', poster: '/assets/cleaning/pexels-tima-miroshnichenko-6200780.jpg' },
      { id: 23, type: 'video', src: '/assets/cleaning/6195933-mobile-720p.mp4', title: 'Surface Polish', poster: '/assets/cleaning/pexels-tima-miroshnichenko-6197122.jpg' },
    ],
    deep: [
      { id: 31, type: 'video', src: '/assets/cleaning/6197568-mobile-720p.mp4', title: 'Machine Scrub', poster: '/assets/cleaning/pexels-tima-miroshnichenko-6195956.jpg' },
      { id: 32, type: 'image', src: '/assets/cleaning/pexels-tima-miroshnichenko-6196688.jpg', title: 'Edge Clean' },
      { id: 33, type: 'image', src: '/assets/cleaning/pexels-tima-miroshnichenko-6200780.jpg', title: 'Shine Finish' },
    ],
  }

  const [active, setActive] = useState<string>(tabs[0].id)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [slider, setSlider] = useState<number>(50)
  const featuredVideo = '/assets/cleaning/6197568-mobile-720p.mp4'
  const featuredPoster = '/assets/cleaning/pexels-tima-miroshnichenko-6195956.jpg'
  const [failed, setFailed] = useState<Record<number, boolean>>({})

  const items = media[active]

  
  const handleVideoClick = (e: any) => {
    const video = e.currentTarget;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const handleModalVideoClick = (e: any) => {
    const video = e.currentTarget;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const goNext = () => {
    setOpenIndex((prev: number | null) => {
      if (prev === null) return null
      return (prev + 1) % items.length
    })
  }

  const goPrev = () => {
    setOpenIndex((prev: number | null) => {
      if (prev === null) return null
      return (prev - 1 + items.length) % items.length
    })
  }

  useEffect(() => {
    if (openIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenIndex(null)
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openIndex, items.length])

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
              active === t.id
                ? 'bg-yellow-100 text-yellow-900 border-yellow-300 shadow-sm'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((m, idx) => (
          <Card
            key={m.id}
            variant="outlined"
            hoverable
            className="relative p-0 overflow-hidden cursor-pointer group"
            onClick={() => setOpenIndex(idx)}
          >
            {m.type === 'image' ? (
              <img src={m.src} alt={m.title} className="w-full h-36 sm:h-40 object-cover" loading="lazy" />
            ) : failed[m.id] ? (
              <img src={m.poster || '/assets/cleaning/pexels-tima-miroshnichenko-6195956.jpg'} alt={m.title} className="w-full h-36 sm:h-40 object-cover" loading="lazy" />
            ) : (
              <video
                className="w-full h-36 sm:h-40 object-cover"
                src={m.src}
                poster={m.poster}
                muted
                loop
                playsInline
                preload="none"
                controls={false}
                onClick={handleVideoClick}
                onError={() => setFailed((f: Record<number, boolean>) => ({ ...f, [m.id]: true }))}
              />
            )}
            <div className="absolute inset-x-0 bottom-0 p-2 text-white text-xs bg-gradient-to-t from-black/60 via-black/20 to-transparent">
              <span className="font-semibold">{m.title}</span>
            </div>
          </Card>
        ))}
      </div>

      

      {openIndex !== null && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center" onClick={() => setOpenIndex(null)}>
          <div className="max-w-3xl w-[92%] rounded-2xl overflow-hidden border border-gray-700 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            {items[openIndex].type === 'image' ? (
              <img src={items[openIndex].src} alt={items[openIndex].title} className="w-full h-full object-contain bg-black" />
            ) : failed[items[openIndex].id] ? (
              <img src={items[openIndex].poster || '/assets/cleaning/pexels-tima-miroshnichenko-6195956.jpg'} alt={items[openIndex].title} className="w-full h-full object-contain bg-black" />
            ) : (
              <video
                className="w-full h-full bg-black"
                src={items[openIndex].src}
                poster={items[openIndex].poster}
                controls
                muted
                loop
                playsInline
                preload="none"
                onClick={handleModalVideoClick}
                onError={() => setFailed((f: Record<number, boolean>) => ({ ...f, [items[openIndex].id]: true }))}
              />
            )}
            <div className="absolute inset-y-0 left-2 right-2 flex items-center justify-between pointer-events-none">
              <button className="pointer-events-auto px-3 py-2 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20" onClick={goPrev}>Prev</button>
              <button className="pointer-events-auto px-3 py-2 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20" onClick={goNext}>Next</button>
            </div>
            <div className="p-3 bg-black text-white text-sm flex items-center justify-between">
              <span className="font-semibold">{items[openIndex].title}</span>
              <button className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20" onClick={() => setOpenIndex(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
