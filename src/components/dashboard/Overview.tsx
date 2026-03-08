/**
 * components/dashboard/Overview.tsx
 * Vista principal del dashboard: KPIs + citas del día + accesos rápidos.
 */
import { useNavigate } from 'react-router-dom'
import { Users, CalendarCheck, CalendarDays, UserPlus, Clock, CheckCircle, XCircle, Circle } from 'lucide-react'
import { useDashboardKPIs, useTodayAppointments } from '../../hooks/useAppointments'
import { formatDisplayTime } from '../../lib/utils'

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="bg-white border border-gray-100 p-5 flex items-center gap-4 shadow-xs">
      <div className={`w-11 h-11 flex items-center justify-center ${color}`}>
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-opensans text-2xl font-semibold text-brand-blue leading-none">
          {value}
        </p>
        <p className="font-opensans text-xs text-brand-bruma tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ── Status badge de cita ───────────────────────────────────────────────────────
const statusConfig = {
  pending: { label: 'Pendiente', icon: Circle, className: 'text-amber-500' },
  confirmed: { label: 'Confirmada', icon: CheckCircle, className: 'text-green-500' },
  completed: { label: 'Completada', icon: CheckCircle, className: 'text-brand-oliva' },
  cancelled: { label: 'Cancelada', icon: XCircle, className: 'text-red-400' },
}

export default function Overview() {
  const { kpis, loading: kpisLoading } = useDashboardKPIs()
  const { appointments: todayAppts, loading: apptLoading } = useTodayAppointments()
  const navigate = useNavigate()

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <h1 className="font-cormorant text-3xl font-light tracking-widest text-brand-blue uppercase">
          Inicio
        </h1>
        <p className="font-opensans text-xs text-brand-bruma tracking-wider mt-1">
          Bienvenida, Dra. Carolina
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpisLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 p-5 h-20 animate-pulse" />
          ))
        ) : (
          <>
            <KpiCard
              label="Total Pacientes"
              value={kpis.totalPatients}
              icon={Users}
              color="bg-brand-blue/10 text-brand-blue"
            />
            <KpiCard
              label="Citas Hoy"
              value={kpis.appointmentsToday}
              icon={CalendarCheck}
              color="bg-brand-tierra/10 text-brand-tierra"
            />
            <KpiCard
              label="Esta Semana"
              value={kpis.appointmentsThisWeek}
              icon={CalendarDays}
              color="bg-brand-oliva/10 text-brand-oliva"
            />
            <KpiCard
              label="Nuevos este Mes"
              value={kpis.newThisMonth}
              icon={UserPlus}
              color="bg-brand-arena/30 text-brand-tierra"
            />
          </>
        )}
      </div>

      {/* Citas del día */}
      <div className="bg-white border border-gray-100 shadow-xs">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-cormorant text-xl font-light tracking-wider text-brand-blue">
            Citas de Hoy
          </h2>
          <Clock size={16} className="text-brand-bruma" strokeWidth={1.5} />
        </div>

        {apptLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-50 animate-pulse" />
            ))}
          </div>
        ) : todayAppts.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-opensans text-sm text-brand-bruma">Sin citas programadas para hoy.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {todayAppts.map((appt) => {
              const status = statusConfig[appt.status ?? 'pending']
              const StatusIcon = status.icon
              return (
                <div key={appt.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  {/* Hora */}
                  <div className="w-16 shrink-0 text-center">
                    <p className="font-opensans text-sm font-medium text-brand-blue">
                      {formatDisplayTime(appt.appointment_time)}
                    </p>
                  </div>

                  {/* Separador */}
                  <div className="w-px h-8 bg-brand-bruma/20" />

                  {/* Datos */}
                  <div className="flex-1 min-w-0">
                    <p className="font-opensans text-sm font-medium text-brand-blue truncate">
                      {appt.patient_name}
                    </p>
                    <p className="font-opensans text-xs text-brand-tierra/70 truncate">
                      {appt.service}
                    </p>
                  </div>

                  {/* Teléfono */}
                  <a
                    href={`tel:${appt.phone}`}
                    className="font-opensans text-xs text-brand-tierra hover:underline hidden sm:block shrink-0"
                  >
                    {appt.phone}
                  </a>

                  {/* Estado */}
                  <div className={`flex items-center gap-1 shrink-0 ${status.className}`}>
                    <StatusIcon size={14} strokeWidth={1.5} />
                    <span className="font-opensans text-xs hidden sm:inline">{status.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/dashboard/new-patient')}
          className="bg-brand-blue text-brand-lino px-6 py-4 flex items-center gap-3 hover:bg-brand-tierra transition-colors duration-300 cursor-pointer border-none"
        >
          <UserPlus size={18} strokeWidth={1.5} />
          <span className="font-opensans text-sm tracking-wider uppercase">Nuevo Paciente</span>
        </button>
        <button
          onClick={() => navigate('/dashboard/appointments')}
          className="bg-white border border-brand-bruma/30 text-brand-blue px-6 py-4 flex items-center gap-3 hover:border-brand-blue transition-colors duration-300 cursor-pointer"
        >
          <CalendarCheck size={18} strokeWidth={1.5} />
          <span className="font-opensans text-sm tracking-wider uppercase">Ver todas las Citas</span>
        </button>
      </div>
    </div>
  )
}
