/**
 * hooks/useAvailability.ts
 * Hook compartido entre el formulario público y el modal del dashboard.
 * Consulta Supabase para obtener disponibilidad real de una fecha.
 *
 * Reemplaza la lógica dispersa que antes existía en Booking.tsx y
 * BookingModal.tsx por un único punto de verdad.
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { generateTimeSlots } from '../lib/utils'
import type { OccupiedSlot } from '../types'

interface AvailabilityResult {
  allSlots: string[]          // todos los slots del día según horario
  occupiedSlots: OccupiedSlot[]  // slots ya reservados con info del paciente
  isLoading: boolean
  error: string | null
}

/**
 * Retorna los slots del día y cuáles están ocupados según Supabase.
 * @param date - Fecha en formato 'YYYY-MM-DD', o null si no hay fecha seleccionada.
 */
export function useAvailability(date: string | null): AvailabilityResult {
  const [allSlots, setAllSlots] = useState<string[]>([])
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!date) {
      setAllSlots([])
      setOccupiedSlots([])
      setIsLoading(false)
      setError(null)
      return
    }

    // Hora neutra (12:00) para evitar problemas de DST al parsear la fecha
    const dateObj = new Date(date + 'T12:00:00')
    setAllSlots(generateTimeSlots(dateObj))
    setOccupiedSlots([])
    setIsLoading(true)
    setError(null)

    supabase
      .from('appointments')
      .select('appointment_time, patient_name, service')
      .eq('appointment_date', date)
      .neq('status', 'cancelled')
      .then(({ data, error: err }) => {
        if (err) {
          setError('No se pudo verificar disponibilidad')
        } else {
          setOccupiedSlots(
            (data ?? []).map((row) => ({
              time: row.appointment_time,
              patientName: row.patient_name,
              service: row.service,
            }))
          )
        }
        setIsLoading(false)
      })
  }, [date])

  return { allSlots, occupiedSlots, isLoading, error }
}
