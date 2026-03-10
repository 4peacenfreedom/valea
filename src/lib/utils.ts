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
// 12:00 PM siempre bloqueado (almuerzo).
// Lunes-Viernes: 9-11 AM y 1-5 PM (8 slots)
// Sábados:       9-11 AM y 1 PM     (4 slots)
export function generateTimeSlots(date: Date): string[] {
  const isSat = date.getDay() === 6
  const slots: string[] = []

  // Mañana: 9:00, 10:00, 11:00
  for (let h = 9; h <= 11; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
  }

  // Tarde: 13:00–17:00 (lunes-viernes) o solo 13:00 (sábado)
  const afternoonEnd = isSat ? 14 : 18
  for (let h = 13; h < afternoonEnd; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
  }

  return slots
}

export function formatDisplayTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`
}
