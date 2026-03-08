import { useEffect, useCallback, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { motion } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Review } from '../../types'

const reviews: Review[] = [
  {
    id: 1,
    name: 'Mariana V.',
    avatar_initial: 'M',
    rating: 5,
    text: 'La Dra. Carolina es increíble. El resultado del botox fue muy natural, justo lo que buscaba. Me fui encantada.',
    service: 'Toxina Botulínica',
  },
  {
    id: 2,
    name: 'Sofía R.',
    avatar_initial: 'S',
    rating: 5,
    text: 'Excelente atención desde el primer momento. El ambiente del consultorio es hermoso, muy limpio y elegante.',
    service: 'Rellenos con Ácido Hialurónico',
  },
  {
    id: 3,
    name: 'Andrea P.',
    avatar_initial: 'A',
    rating: 5,
    text: 'Vine por perfilado facial y los resultados superaron mis expectativas. Totalmente recomendada, una profesional de alto nivel.',
    service: 'Perfilado Facial',
  },
  {
    id: 4,
    name: 'Daniela M.',
    avatar_initial: 'D',
    rating: 5,
    text: 'Los bioestimuladores de colágeno han transformado mi piel. La Dra. explica todo con paciencia y cuidado.',
    service: 'Bioestimuladores de Colágeno',
  },
  {
    id: 5,
    name: 'Valeria C.',
    avatar_initial: 'V',
    rating: 5,
    text: 'Mi piel nunca había lucido tan bien. Los tratamientos faciales médicos son un nivel completamente diferente.',
    service: 'Tratamientos Faciales Médicos',
  },
  {
    id: 6,
    name: 'Laura G.',
    avatar_initial: 'L',
    rating: 5,
    text: 'La mesoterapia hizo una diferencia visible desde la primera sesión. Profesionalismo y calidez en cada visita.',
    service: 'Mesoterapia',
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={i < rating ? 'text-brand-tierra fill-brand-tierra' : 'text-brand-bruma'}
        />
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="min-w-0 flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_25%] px-3">
      <div className="border border-brand-bruma/30 bg-white/60 p-6 h-full flex flex-col gap-4 hover:border-brand-arena/60 hover:bg-white/80 transition-all duration-300">
        {/* Avatar + nombre */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-arena flex items-center justify-center shrink-0">
            <span className="font-cormorant text-lg font-medium text-brand-blue">
              {review.avatar_initial}
            </span>
          </div>
          <div>
            <p className="font-opensans text-sm font-medium text-brand-blue">
              {review.name}
            </p>
            <StarRating rating={review.rating} />
          </div>
        </div>

        {/* Texto */}
        <p className="font-opensans text-sm text-brand-tierra/80 leading-relaxed flex-1 italic">
          "{review.text}"
        </p>

        {/* Servicio */}
        <p className="font-opensans text-xs tracking-wider uppercase text-brand-bruma border-t border-brand-bruma/20 pt-3">
          {review.service}
        </p>
      </div>
    </div>
  )
}

export default function Reviews() {
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    slidesToScroll: 1,
  })

  const startAutoplay = useCallback(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current)
    autoplayRef.current = setInterval(() => {
      emblaApi?.scrollNext()
    }, 4000)
  }, [emblaApi])

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current)
      autoplayRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    startAutoplay()
    emblaApi.on('pointerDown', stopAutoplay)
    emblaApi.on('pointerUp', startAutoplay)
    return () => {
      stopAutoplay()
    }
  }, [emblaApi, startAutoplay, stopAutoplay])

  const scrollPrev = useCallback(() => {
    stopAutoplay()
    emblaApi?.scrollPrev()
    setTimeout(startAutoplay, 5000)
  }, [emblaApi, stopAutoplay, startAutoplay])

  const scrollNext = useCallback(() => {
    stopAutoplay()
    emblaApi?.scrollNext()
    setTimeout(startAutoplay, 5000)
  }, [emblaApi, stopAutoplay, startAutoplay])

  return (
    <section id="reviews" className="py-20 lg:py-28 bg-brand-lino">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <p className="font-opensans text-xs tracking-[0.3em] uppercase text-brand-tierra mb-4">
            Experiencias reales
          </p>
          <h2 className="font-cormorant text-4xl md:text-5xl font-light tracking-[0.05em] text-brand-blue">
            Lo que dicen nuestras pacientes
          </h2>
          <div className="w-12 h-px bg-brand-arena mx-auto mt-6" />
        </motion.div>

        {/* Carrusel */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          onMouseEnter={stopAutoplay}
          onMouseLeave={startAutoplay}
        >
          <div className="overflow-hidden -mx-3" ref={emblaRef}>
            <div className="flex">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={scrollPrev}
              className="w-10 h-10 border border-brand-bruma/40 flex items-center justify-center text-brand-bruma hover:border-brand-tierra hover:text-brand-tierra transition-all duration-300 bg-transparent cursor-pointer"
              aria-label="Anterior"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Indicadores */}
            <div className="flex gap-2">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => emblaApi?.scrollTo(i)}
                  className="w-1.5 h-1.5 rounded-full bg-brand-bruma/40 hover:bg-brand-tierra transition-colors duration-300 border-none cursor-pointer"
                  aria-label={`Ir a review ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={scrollNext}
              className="w-10 h-10 border border-brand-bruma/40 flex items-center justify-center text-brand-bruma hover:border-brand-tierra hover:text-brand-tierra transition-all duration-300 bg-transparent cursor-pointer"
              aria-label="Siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
