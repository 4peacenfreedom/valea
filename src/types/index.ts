export interface Appointment {
  id?: string
  full_name: string
  phone: string
  email: string
  service: string
  date: string
  time: string
  notes?: string
  status?: 'pending' | 'confirmed' | 'cancelled'
  created_at?: string
  confirmation_number?: string
}

export interface Patient {
  id: string
  full_name: string
  phone: string
  email: string
  date_of_birth?: string
  cedula?: string
  created_at: string
  notes?: string
}

export interface PatientRecord {
  id: string
  patient_id: string
  date: string
  service: string
  doctor_notes: string
  products_used?: string
  follow_up_date?: string
  photos?: string[]
  created_at: string
}

export interface Review {
  id: number
  name: string
  avatar_initial: string
  rating: number
  text: string
  service: string
}

export const SERVICES = [
  'Toxina Botulínica (Botox)',
  'Rellenos con Ácido Hialurónico',
  'Bioestimuladores de Colágeno',
  'Tratamientos Faciales Médicos',
  'Perfilado Facial',
  'Mesoterapia',
] as const

export type Service = typeof SERVICES[number]
