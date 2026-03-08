/**
 * tabs/AppointmentsTab.tsx — Tab 6: Historial de citas del paciente.
 */
import { CalendarX } from 'lucide-react'
import { usePatientAppointments } from '../../../hooks/useAppointments'
import { formatDisplayTime } from '../../../lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Appointment } from '../../../types'

interface Props {
  patientEmail: string | undefined
}

const statusMap: Record<NonNullable<Appointment['status']>, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-amber-50 text-amber-600 border border-amber-200' },
  confirmed: { label: 'Confirmada', className: 'bg-green-50 text-green-600 border border-green-200' },
  completed: { label: 'Completada', className: 'bg-brand-oliva/10 text-brand-oliva border border-brand-oliva/20' },
  cancelled: { label: 'Cancelada', className: 'bg-red-50 text-red-400 border border-red-200' },
}

export default function AppointmentsTab({ patientEmail }: Props) {
  const { appointments, loading } = usePatientAppointments(patientEmail)

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-50 animate-pulse border border-gray-100" />
        ))}
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="p-10 bg-gray-50 border border-gray-100 text-center">
        <CalendarX size={32} className="text-brand-bruma mx-auto mb-3" strokeWidth={1} />
        <p className="font-opensans text-sm text-brand-bruma">Sin citas registradas.</p>
      </div>
    )
  }

  // Separar futuras y pasadas
  const today = new Date().toISOString().split('T')[0]
  const upcoming = appointments.filter((a) => a.appointment_date >= today)
  const past = appointments.filter((a) => a.appointment_date < today)

  return (
    <div className="space-y-6">
      <h3 className="font-cormorant text-xl font-light tracking-wider text-brand-blue">
        Historial de Citas
      </h3>

      {upcoming.length > 0 && (
        <Group title="Próximas" appointments={upcoming} />
      )}
      {past.length > 0 && (
        <Group title="Historial" appointments={past} />
      )}
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
            <div key={appt.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              {/* Fecha y hora */}
              <div className="shrink-0">
                <p className="font-cormorant text-base font-light text-brand-blue">
                  {format(new Date(appt.appointment_date), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
                <p className="font-opensans text-xs text-brand-bruma">
                  {formatDisplayTime(appt.appointment_time)}
                </p>
              </div>

              <div className="w-px h-8 bg-gray-100 hidden sm:block" />

              {/* Servicio */}
              <div className="flex-1">
                <p className="font-opensans text-sm text-brand-blue">{appt.service}</p>
                {appt.confirmation_number && (
                  <p className="font-opensans text-xs text-brand-bruma">#{appt.confirmation_number}</p>
                )}
              </div>

              {/* Estado */}
              <span className={`font-opensans text-xs px-2.5 py-1 ${status.className} shrink-0`}>
                {status.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
