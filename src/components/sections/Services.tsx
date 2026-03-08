import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Clock } from 'lucide-react'

const services = [
  {
    name: 'Toxina Botulínica',
    subtitle: 'Botox',
    description: 'Suaviza líneas de expresión y arrugas dinámicas con resultados naturales y duraderos.',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8">
        <circle cx="20" cy="12" r="6" />
        <path d="M14 12 C14 24 20 32 20 32 C20 32 26 24 26 12" />
        <path d="M8 20 Q20 16 32 20" />
      </svg>
    ),
  },
  {
    name: 'Ácido Hialurónico',
    subtitle: 'Rellenos',
    description: 'Restaura volumen y define contornos faciales de forma armoniosa y proporcionada.',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8">
        <ellipse cx="20" cy="20" rx="12" ry="16" />
        <path d="M20 4 L20 36" />
        <path d="M12 14 Q16 18 20 14 Q24 10 28 14" />
        <path d="M12 26 Q16 22 20 26 Q24 30 28 26" />
      </svg>
    ),
  },
  {
    name: 'Bioestimuladores',
    subtitle: 'de Colágeno',
    description: 'Estimula la producción natural de colágeno para una piel más firme y radiante.',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8">
        <path d="M20 4 C8 4 4 12 4 20 C4 30 12 36 20 36 C28 36 36 30 36 20 C36 12 32 4 20 4Z" />
        <path d="M14 16 Q20 20 26 16" />
        <path d="M14 24 Q20 28 26 24" />
        <circle cx="20" cy="20" r="3" />
      </svg>
    ),
  },
  {
    name: 'Tratamientos Faciales',
    subtitle: 'Médicos',
    description: 'Protocolos clínicos personalizados para tratar pigmentación, acné y envejecimiento.',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8">
        <path d="M10 10 L30 10 L32 30 L8 30 Z" />
        <line x1="14" y1="18" x2="26" y2="18" />
        <line x1="20" y1="14" x2="20" y2="26" />
        <circle cx="20" cy="20" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'Perfilado Facial',
    subtitle: 'Armonización',
    description: 'Redefinición y equilibrio del perfil facial con técnicas de alta precisión.',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8">
        <path d="M20 4 C14 4 10 10 10 18 C10 28 14 36 20 36 C26 36 30 28 30 18 C30 10 26 4 20 4Z" />
        <path d="M10 18 Q20 22 30 18" />
        <path d="M12 26 Q20 28 28 26" />
      </svg>
    ),
  },
  {
    name: 'Mesoterapia',
    subtitle: 'Revitalización',
    description: 'Microinyecciones de vitaminas y activos para revitalizar y nutrir la piel profundamente.',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8">
        <line x1="20" y1="4" x2="20" y2="22" />
        <circle cx="20" cy="26" r="4" />
        <path d="M14 10 L20 4 L26 10" />
        <line x1="8" y1="28" x2="14" y2="20" />
        <line x1="32" y1="28" x2="26" y2="20" />
        <line x1="6" y1="34" x2="34" y2="34" />
      </svg>
    ),
  },
]

const schedule = [
  { day: 'Lunes — Viernes', hours: '9:00 AM – 6:00 PM', open: true },
  { day: 'Sábados', hours: '9:00 AM – 2:00 PM', open: true },
  { day: 'Domingos', hours: 'Cerrado', open: false },
]

function ServiceCard({ service, index }: { service: typeof services[0]; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease: 'easeOut' }}
      className="group border border-brand-bruma/40 p-7 hover:border-brand-arena hover:shadow-sm transition-all duration-400 bg-white/40 hover:bg-white/70"
    >
      <div className="text-brand-tierra/60 group-hover:text-brand-tierra mb-5 transition-colors duration-300">
        {service.icon}
      </div>
      <h3 className="font-cormorant text-xl font-light tracking-wider text-brand-blue mb-0.5">
        {service.name}
      </h3>
      <p className="font-opensans text-xs tracking-widest uppercase text-brand-tierra/60 mb-3">
        {service.subtitle}
      </p>
      <p className="font-opensans text-sm text-brand-tierra/70 leading-relaxed">
        {service.description}
      </p>
    </motion.div>
  )
}

export default function Services() {
  const titleRef = useRef(null)
  const titleInView = useInView(titleRef, { once: true, margin: '-80px' })

  return (
    <section id="services" className="py-20 lg:py-28 bg-brand-lino">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">

        {/* Header de sección */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 20 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14 lg:mb-18"
        >
          <p className="font-opensans text-xs tracking-[0.3em] uppercase text-brand-tierra mb-4">
            Lo que ofrecemos
          </p>
          <h2 className="font-cormorant text-4xl md:text-5xl font-light tracking-[0.05em] text-brand-blue">
            Nuestros Servicios
          </h2>
          <div className="w-12 h-px bg-brand-arena mx-auto mt-6" />
        </motion.div>

        {/* Grid de servicios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-16 lg:mb-20">
          {services.map((service, i) => (
            <ServiceCard key={service.name} service={service} index={i} />
          ))}
        </div>

        {/* Horario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
          className="bg-brand-blue text-brand-lino"
        >
          <div className="px-8 lg:px-12 py-10 lg:py-12">
            <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-16">
              {/* Título horario */}
              <div className="shrink-0">
                <div className="flex items-center gap-3 mb-2">
                  <Clock size={18} className="text-brand-arena" strokeWidth={1.5} />
                  <h3 className="font-cormorant text-2xl font-light tracking-widest text-brand-arena uppercase">
                    Horario
                  </h3>
                </div>
                <p className="font-opensans text-xs text-brand-lino/50 tracking-wider">
                  Alajuela, Alajuela
                </p>
              </div>

              {/* Divisor */}
              <div className="hidden lg:block w-px h-16 bg-brand-arena/20" />

              {/* Schedule */}
              <div className="flex flex-col sm:flex-row gap-6 lg:gap-10 flex-1">
                {schedule.map((item) => (
                  <div key={item.day} className="flex-1">
                    <p className="font-opensans text-xs tracking-widest uppercase text-brand-lino/50 mb-1">
                      {item.day}
                    </p>
                    <p className={`font-cormorant text-xl font-light tracking-wider ${item.open ? 'text-brand-arena' : 'text-brand-lino/30'}`}>
                      {item.hours}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
