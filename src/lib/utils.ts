import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function generateConfirmationNumber(): string {
  const prefix = 'VA'
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return `${prefix}-${timestamp}-${random}`
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`
  }
  return phone
}

export function isSunday(date: Date): boolean {
  return date.getDay() === 0
}

export function isPastDate(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

// Genera slots de 1 hora según el día de la semana.
// Lunes-Jueves: 3:00 PM – 6:00 PM (3 slots: 15, 16, 17)
// Viernes:      2:00 PM – 6:00 PM (4 slots: 14, 15, 16, 17)
// Sábados:      7:00 AM – 5:00 PM (10 slots: 7–16)
// Domingos:     Cerrado
export function generateTimeSlots(date: Date): string[] {
  const day = date.getDay() // 0=Dom, 1=Lun, ..., 5=Vie, 6=Sáb
  const slots: string[] = []

  if (day === 0) return [] // Domingo cerrado

  if (day === 6) {
    // Sábado: 7am a 5pm (último slot a las 4pm)
    for (let h = 7; h <= 16; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`)
    }
  } else if (day === 5) {
    // Viernes: 2pm a 6pm (último slot a las 5pm)
    for (let h = 14; h <= 17; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`)
    }
  } else {
    // Lunes–Jueves: 3pm a 6pm (último slot a las 5pm)
    for (let h = 15; h <= 17; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`)
    }
  }

  return slots
}

export function formatDisplayTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`
}
