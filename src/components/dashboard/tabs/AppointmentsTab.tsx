/**
 * tabs/AppointmentsTab.tsx — Tab 6: Historial de citas del paciente.
 * Incluye botón para agendar nueva cita con el modal BookingModal.
 */
import { useState } from 'react'
import { CalendarX, CalendarPlus } from 'lucide-react'
import { usePatientAppointments } from '../../../hooks/useAppointments'
import { formatDisplayTime } from '../../../lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Appointment, Patient } from '../../../types'
import BookingModal from '../BookingModal'

interface Props {
  patient: Patient
}

// Colores de badge por status
const statusMap: Record<NonNullable<Appointment['status']>, { label: string; className: string }> = {
  pending:   { label: 'Pendiente',  className: 'bg-amber-50 text-amber-600 border border-amber-200' },
  confirmed: { label: 'Confirmada', className: 'bg-blue-50 text-blue-600 border border-blue-200' },
  completed: { label: 'Completada', className: 'bg-green-50 text-green-600 border border-green-200' },
  cancelled: { label: 'Cancelada',  className: 'bg-red-50 text-red-400 border border-red-200' },
}

export default function AppointmentsTab({ patient }: Props) {
  const { appointments, loading, refetch } = usePatientAppointments(patient.email)
  const [modalOpen, setModalOpen] = useState(false)

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-50 animate-pulse border border-gray-100" />
        ))}
      </div>
    )
  }

  // Separar próximas y pasadas
  const today = new Date().toISOString().split('T')[0]
  const upcoming = appointments.filter((a) => a.appointment_date >= today)
  const past = appointments.filter((a) => a.appointment_date < today)

  return (
    <div className="space-y-6">
      {/* Encabezado con botón de agendar */}
      <div className="flex items-center justify-between">
        <h3 className="font-cormorant text-xl font-light tracking-wider text-brand-blue">
          Historial de Citas
        </h3>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-brand-blue text-brand-lino font-opensans text-xs tracking-widest uppercase px-4 py-2.5 hover:bg-brand-tierra transition-colors cursor-pointer border-none"
        >
          <CalendarPlus size={14} />
          + Agendar Nueva Cita
        </button>
      </div>

      {/* Lista vacía */}
      {appointments.length === 0 && (
        <div className="p-10 bg-gray-50 border border-gray-100 text-center">
          <CalendarX size={32} className="text-brand-bruma mx-auto mb-3" strokeWidth={1} />
          <p className="font-opensans text-sm text-brand-bruma">Sin citas registradas.</p>
        </div>
      )}

      {/* Grupos de citas */}
      {upcoming.length > 0 && (
        <Group title="Próximas" appointments={upcoming} />
      )}
      {past.length > 0 && (
        <Group title="Historial" appointments={past} />
      )}

      {/* Nota informativa */}
      {appointments.length > 0 && (
        <p className="font-opensans text-xs text-brand-bruma/70 italic">
          Para cancelar o reagendar una cita, ve a la sección <strong>Citas</strong> en el menú principal.
        </p>
      )}

      {/* Modal de agendamiento */}
      <BookingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        patient={patient}
        onSuccess={() => {
          setModalOpen(false)
          refetch()
        }}
      />
    </div>
  )
}

function Group({ title, appointments }: { title: string; appointments: Appointment[] }) {
  return (
    <div>
      <p className="font-opensans text-xs uppercase tracking-wider text-brand-tierra mb-3">{title}</p>
      <div className="border border-gray-100 bg-white divide-y divide-gray-50">
        {appointments.map((appt) => {
          const status = statusMap[appt.status ?? 'pending']
          return (
            <div
              key={appt.id}
              className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5"
            >
              {/* Fecha y hora */}
              <div className="shrink-0 min-w-[130px]">
                <p className="font-cormorant text-base font-light text-brand-blue">
                  {format(new Date(appt.appointment_date + 'T12:00:00'), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
                <p className="font-opensans text-xs text-brand-bruma">
                  {formatDisplayTime(appt.appointment_time)}
                </p>
              </div>

              <div className="w-px h-8 bg-gray-100 hidden sm:block" />

              {/* Servicio y número de confirmación */}
              <div className="flex-1 min-w-0">
                <p className="font-opensans text-sm text-brand-blue">{appt.service}</p>
                {appt.confirmation_number && (
                  <p className="font-opensans text-xs text-brand-bruma">#{appt.confirmation_number}</p>
                )}
              </div>

              {/* Status badge */}
              <span className={`font-opensans text-xs px-2.5 py-1 shrink-0 ${status.className}`}>
                {status.label}
              </span>

              {/* Acción */}
              <button
                className="shrink-0 font-opensans text-xs text-brand-blue hover:underline bg-transparent border-none cursor-pointer"
                onClick={() => {/* Próximamente: panel de detalles */}}
              >
                Ver detalles
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
