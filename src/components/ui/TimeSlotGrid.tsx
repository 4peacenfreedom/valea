/**
 * components/ui/TimeSlotGrid.tsx
 * Grid visual de horarios para el dashboard (BookingModal).
 * Reemplaza el <select> nativo en el contexto del dashboard para permitir
 * tooltips reales al hacer hover sobre los slots ocupados.
 *
 * - Slots disponibles: botones clickeables con hover azul.
 * - Slots ocupados:    botones deshabilitados, grises, con tooltip HTML nativo
 *                      mostrando nombre del paciente y servicio.
 */
import { useAvailability } from '../../hooks/useAvailability'
import { formatDisplayTime } from '../../lib/utils'
import { Loader2 } from 'lucide-react'

interface TimeSlotGridProps {
  /** Fecha seleccionada en formato 'YYYY-MM-DD', o null */
  date: string | null
  /** Valor actualmente seleccionado ('HH:MM' o '') */
  value: string
  /** Callback al seleccionar un horario */
  onChange: (time: string) => void
  /** Mensaje de error a mostrar bajo el grid */
  error?: string
}

export default function TimeSlotGrid({ date, value, onChange, error }: TimeSlotGridProps) {
  const { allSlots, occupiedSlots, isLoading } = useAvailability(date)

  const occupiedMap = new Map(occupiedSlots.map((s) => [s.time, s]))

  if (!date) {
    return (
      <p className="font-opensans text-xs text-brand-bruma py-2">
        Primero seleccioná una fecha
      </p>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-brand-bruma py-2">
        <Loader2 size={14} className="animate-spin shrink-0" />
        <span className="font-opensans text-xs">Verificando disponibilidad…</span>
      </div>
    )
  }

  if (allSlots.length === 0) {
    return (
      <p className="font-opensans text-xs text-brand-bruma py-2">
        No hay horarios disponibles para este día.
      </p>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-1.5">
        {allSlots.map((slot) => {
          const ocupado = occupiedMap.get(slot)
          const isSelected = slot === value

          if (ocupado) {
            return (
              <div
                key={slot}
                title={`Ocupado: ${ocupado.patientName} — ${ocupado.service}`}
                className="relative group"
              >
                <button
                  type="button"
                  disabled
                  className="w-full py-1.5 font-opensans text-xs bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                >
                  {formatDisplayTime(slot)}
                </button>
                {/* Tooltip CSS — visible en hover sobre el contenedor */}
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 hidden group-hover:flex flex-col items-center">
                  <div className="bg-brand-blue text-brand-lino font-opensans text-xs px-2.5 py-1.5 whitespace-nowrap max-w-[200px] text-center leading-snug shadow-lg">
                    <span className="block font-medium truncate">{ocupado.patientName}</span>
                    <span className="block text-brand-lino/70 truncate">{ocupado.service}</span>
                  </div>
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-brand-blue" />
                </div>
              </div>
            )
          }

          return (
            <button
              key={slot}
              type="button"
              onClick={() => onChange(slot)}
              className={`py-1.5 font-opensans text-xs border transition-colors ${
                isSelected
                  ? 'bg-brand-blue text-brand-lino border-brand-blue'
                  : 'bg-white text-brand-blue border-gray-200 hover:border-brand-blue hover:bg-brand-blue/5'
              }`}
            >
              {formatDisplayTime(slot)}
            </button>
          )
        })}
      </div>

      {error && (
        <p className="font-opensans text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}
