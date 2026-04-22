'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Slide {
  id: string
  image: string
  title: string
  subtitle?: string
  cta?: {
    label: string
    href: string
  }
  gradient?: string
}

interface ImageSliderProps {
  slides: Slide[]
  autoplay?: boolean
  className?: string
}

export function ImageSlider({ slides, autoplay = true, className }: ImageSliderProps) {
  // FIX #3: ลดความเร็ว autoplay จาก 5000 → 7000ms ให้ลูกค้าอ่านทัน
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    ...(autoplay ? [Autoplay({ delay: 7000, stopOnInteraction: false })] : []),
  ])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi, onSelect])

  return (
    <div className={cn('relative overflow-hidden rounded-2xl', className)}>
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((slide, index) => (
            <div key={slide.id} className="relative min-w-0 flex-none basis-full">
              <div
                className={cn(
                  'relative flex h-[300px] items-center overflow-hidden rounded-2xl sm:h-[400px] lg:h-[480px]',
                  slide.gradient || 'bg-gradient-to-br from-primary via-primary/90 to-blue-600'
                )}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <pattern id={`grid-${index}`} width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#grid-${index})`} />
                  </svg>
                </div>

                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

                {/* Content */}
                <div className="relative z-10 flex w-full items-center justify-between px-6 sm:px-12 lg:px-16">
                  <div className="max-w-xl space-y-4 text-white">
                    {/* FIX #2: เพิ่ม text-shadow เพิ่ม contrast บน banner สีแดง-ส้ม */}
                    <h2
                      className="text-balance text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl xl:text-5xl"
                      style={{ textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
                    >
                      {slide.title}
                    </h2>
                    {slide.subtitle && (
                      <p
                        className="text-pretty text-sm text-white/90 sm:text-base lg:text-lg"
                        style={{ textShadow: '0 1px 6px rgba(0,0,0,0.35)' }}
                      >
                        {slide.subtitle}
                      </p>
                    )}
                    {/* FIX: ปุ่ม CTA ใช้ Next.js Link ให้ navigation ทำงานถูกต้อง + สีส้ม-ทอง */}
                    {slide.cta && (
                      <Link href={slide.cta.href}>
                        <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-400 px-6 py-3 text-sm font-bold text-black shadow-lg transition-all hover:scale-105 hover:shadow-orange-500/40 hover:shadow-xl active:scale-95 sm:text-base min-h-[48px]">
                          {slide.cta.label}
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </Link>
                    )}
                  </div>

                  {/* FIX Performance: ใช้ Next.js Image แทน img + lazy loading */}
                  <div className="hidden lg:block">
                    <div className="relative">
                      <div className="absolute inset-0 animate-pulse rounded-2xl bg-white/20 blur-2xl" />
                      <Image
                        src={slide.image}
                        alt={slide.title}
                        width={320}
                        height={320}
                        className="relative h-64 w-64 rounded-2xl object-cover shadow-2xl xl:h-80 xl:w-80"
                        priority={index === 0}
                        loading={index === 0 ? 'eager' : 'lazy'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-all hover:bg-white/30"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-all hover:bg-white/30"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={cn(
              'h-2 rounded-full transition-all',
              selectedIndex === index ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
