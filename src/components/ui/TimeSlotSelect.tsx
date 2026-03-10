/**
 * components/ui/TimeSlotSelect.tsx
 * Componente compartido para selección de horario de cita.
 * Usado en el formulario público (landing) y en el modal del dashboard.
 *
 * Diferencia clave entre contextos:
 *   showPatientInfo=false → slots ocupados muestran "(No disponible)" (privacidad pública)
 *   showPatientInfo=true  → slots ocupados muestran tooltip con nombre y servicio (dashboard)
 */
import { useAvailability } from '../../hooks/useAvailability'
import { formatDisplayTime } from '../../lib/utils'
import { Loader2 } from 'lucide-react'

interface TimeSlotSelectProps {
  /** Fecha seleccionada en formato 'YYYY-MM-DD', o null */
  date: string | null
  /** Valor actual del select ('HH:MM' o '') */
  value: string
  /** Callback al cambiar selección */
  onChange: (time: string) => void
  /** Si true, muestra nombre del paciente y servicio en slots ocupados (solo dashboard) */
  showPatientInfo?: boolean
  /** Mensaje de error a mostrar bajo el select */
  error?: string
  /** Clases CSS adicionales para el elemento select */
  className?: string
}

export default function TimeSlotSelect({
  date,
  value,
  onChange,
  showPatientInfo = false,
  error,
  className = '',
}: TimeSlotSelectProps) {
  const { allSlots, occupiedSlots, isLoading } = useAvailability(date)

  // Mapa de tiempo → datos del slot ocupado para acceso O(1)
  const occupiedMap = new Map(occupiedSlots.map((s) => [s.time, s]))

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-brand-bruma border border-gray-200 bg-white px-3 py-2.5 ${className}`}>
        <Loader2 size={14} className="animate-spin shrink-0" />
        <span className="font-opensans text-xs">Verificando disponibilidad…</span>
      </div>
    )
  }

  return (
    <div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={!date || allSlots.length === 0}
        className={`w-full border border-gray-200 bg-white px-3 py-2.5 font-opensans text-sm text-brand-blue focus:outline-none focus:border-brand-blue disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <option value="">
          {date ? 'Seleccioná un horario…' : 'Primero seleccioná una fecha'}
        </option>

        {allSlots.map((slot) => {
          const ocupado = occupiedMap.get(slot)

          if (ocupado) {
            // Etiqueta del slot ocupado según el contexto
            const label = showPatientInfo
              ? `${formatDisplayTime(slot)} — 👤 ${ocupado.patientName} · ${ocupado.service}`
              : `${formatDisplayTime(slot)} (No disponible)`

            return (
              <option
                key={slot}
                value={slot}
                disabled
                title={
                  showPatientInfo
                    ? `${ocupado.patientName} — ${ocupado.service}`
                    : undefined
                }
              >
                {label}
              </option>
            )
          }

          return (
            <option key={slot} value={slot}>
              {formatDisplayTime(slot)}
            </option>
          )
        })}
      </select>

      {error && (
        <p className="font-opensans text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}
