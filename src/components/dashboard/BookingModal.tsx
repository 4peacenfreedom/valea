/**
 * components/dashboard/BookingModal.tsx
 * Modal para agendar una cita manualmente desde el expediente del paciente.
 * Solo accesible desde el Tab 6 "Historial de Citas" del dashboard médico.
 */
import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import DatePicker, { registerLocale } from 'react-datepicker'
import { es } from 'date-fns/locale/es'
import { format } from 'date-fns'
import 'react-datepicker/dist/react-datepicker.css'
import { supabase } from '../../lib/supabase'
import { createCalendarEvent, getOccupiedSlots } from '../../lib/googleCalendar'
import {
  generateConfirmationNumber,
  generateTimeSlots,
  formatDisplayTime,
  isSunday,
  isPastDate,
} from '../../lib/utils'
import { SERVICES } from '../../types'
import type { Patient } from '../../types'

// Registrar locale español para el DatePicker
registerLocale('es', es)

interface Props {
  isOpen: boolean
  onClose: () => void
  patient: Patient
  onSuccess: () => void  // Se llama al cerrar tras éxito para refrescar la lista
}

interface FormState {
  service: string
  date: Date | null
  time: string
  notes: string
}

interface SuccessData {
  confirmationNumber: string
  date: string
  time: string
  service: string
}

type ModalView = 'form' | 'success'

export default function BookingModal({ isOpen, onClose, patient, onSuccess }: Props) {
  const [view, setView] = useState<ModalView>('form')
  const [form, setForm] = useState<FormState>({ service: '', date: null, time: '', notes: '' })
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([])
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [calendarWarning, setCalendarWarning] = useState(false)
  const [successData, setSuccessData] = useState<SuccessData | null>(null)

  // Al abrir el modal, resetear todo el estado
  useEffect(() => {
    if (isOpen) {
      setView('form')
      setForm({ service: '', date: null, time: '', notes: '' })
      setOccupiedSlots([])
      setErrors({})
      setSubmitError(null)
      setCalendarWarning(false)
      setSuccessData(null)
    }
  }, [isOpen])

  // Al cambiar la fecha, consultar disponibilidad en Google Calendar
  useEffect(() => {
    if (!form.date) return
    const dateStr = format(form.date, 'yyyy-MM-dd')
    // Resetear hora al cambiar fecha
    setForm((prev) => ({ ...prev, time: '' }))
    setCheckingAvailability(true)
    getOccupiedSlots(dateStr)
      .then((slots) => setOccupiedSlots(slots))
      .finally(() => setCheckingAvailability(false))
  }, [form.date])

  // Slots de hora disponibles según la fecha seleccionada
  const timeSlots = form.date ? generateTimeSlots(form.date) : []

  // Validar campos requeridos
  const validate = (): boolean => {
    const e: typeof errors = {}
    if (!form.service) e.service = 'Seleccioná un servicio'
    if (!form.date) e.date = 'Seleccioná una fecha'
    if (!form.time) e.time = 'Seleccioná un horario disponible'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleConfirm = async () => {
    if (!validate()) return
    setSubmitting(true)
    setSubmitError(null)

    const confirmationNumber = generateConfirmationNumber()
    const dateStr = format(form.date!, 'yyyy-MM-dd')

    // 1. Guardar en Supabase — status "confirmed" porque la agenda la doctora
    const { error: dbError } = await supabase.from('appointments').insert({
      patient_name: patient.full_name,
      phone: patient.phone ?? '',
      email: patient.email ?? '',
      service: form.service,
      appointment_date: dateStr,
      appointment_time: form.time,
      notes: form.notes || undefined,
      status: 'confirmed',
      confirmation_number: confirmationNumber,
    })

    if (dbError) {
      setSubmitError('No se pudo guardar la cita. Intentá de nuevo.')
      setSubmitting(false)
      return
    }

    // 2. Crear evento en Google Calendar (colorId '1' = azul para citas del dashboard)
    const eventId = await createCalendarEvent({
      patientName: patient.full_name,
      service: form.service,
      date: dateStr,
      time: form.time,
      phone: patient.phone ?? '',
      email: patient.email ?? '',
      notes: form.notes,
      confirmationNumber,
      recordNumber: patient.record_number,
      colorId: '1',
    })

    if (!eventId) {
      // La cita ya fue guardada en Supabase; advertir sobre el calendario
      setCalendarWarning(true)
    }

    setSuccessData({
      confirmationNumber,
      date: format(form.date!, "d 'de' MMMM, yyyy", { locale: es }),
      time: formatDisplayTime(form.time),
      service: form.service,
    })
    setView('success')
    setSubmitting(false)
  }

  // Al cerrar desde éxito, notificar para refrescar el Tab 6
  const handleClose = () => {
    if (view === 'success') onSuccess()
    onClose()
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      {/* onClose vacío: no cerrar al click fuera para evitar pérdida de datos */}
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-brand-blue/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg bg-brand-lino relative shadow-2xl">

                {/* ── Header del modal ─────────────────────────────────── */}
                <div className="bg-brand-blue px-6 py-4 flex items-center justify-between">
                  <div>
                    <Dialog.Title className="font-cormorant text-xl font-light tracking-widest text-brand-lino uppercase">
                      Agendar Cita
                    </Dialog.Title>
                    <p className="font-opensans text-xs text-brand-lino/70 mt-0.5">
                      {patient.full_name}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-brand-lino/60 hover:text-brand-lino transition-colors bg-transparent border-none cursor-pointer"
                    aria-label="Cerrar"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* ── Vista: Formulario ─────────────────────────────────── */}
                {view === 'form' && (
                  <div className="p-6 space-y-5">

                    {/* Datos pre-llenados del expediente (solo lectura) */}
                    <div className="bg-white border border-gray-100 px-4 py-3 grid grid-cols-3 gap-3">
                      <div>
                        <p className="font-opensans text-xs text-brand-bruma uppercase tracking-wider">Paciente</p>
                        <p className="font-opensans text-xs text-brand-blue mt-0.5 truncate">{patient.full_name}</p>
                      </div>
                      <div>
                        <p className="font-opensans text-xs text-brand-bruma uppercase tracking-wider">Teléfono</p>
                        <p className="font-opensans text-xs text-brand-blue mt-0.5">{patient.phone || '—'}</p>
                      </div>
                      <div>
                        <p className="font-opensans text-xs text-brand-bruma uppercase tracking-wider">Email</p>
                        <p className="font-opensans text-xs text-brand-blue mt-0.5 truncate">{patient.email || '—'}</p>
                      </div>
                    </div>

                    {/* Servicio */}
                    <div>
                      <label className="block font-opensans text-xs uppercase tracking-wider text-brand-blue mb-1.5">
                        Servicio <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={form.service}
                        onChange={(e) => {
                          setForm((p) => ({ ...p, service: e.target.value }))
                          setErrors((p) => ({ ...p, service: undefined }))
                        }}
                        className="w-full border border-gray-200 bg-white px-3 py-2.5 font-opensans text-sm text-brand-blue focus:outline-none focus:border-brand-blue"
                      >
                        <option value="">Seleccioná un servicio…</option>
                        {SERVICES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {errors.service && (
                        <p className="font-opensans text-xs text-red-500 mt-1">{errors.service}</p>
                      )}
                    </div>

                    {/* Fecha */}
                    <div>
                      <label className="block font-opensans text-xs uppercase tracking-wider text-brand-blue mb-1.5">
                        Fecha <span className="text-red-400">*</span>
                      </label>
                      <DatePicker
                        selected={form.date}
                        onChange={(date: Date | null) => {
                          setForm((p) => ({ ...p, date }))
                          setErrors((p) => ({ ...p, date: undefined }))
                        }}
                        filterDate={(d) => !isSunday(d) && !isPastDate(d)}
                        minDate={new Date()}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="dd/mm/aaaa"
                        locale="es"
                        className="w-full border border-gray-200 bg-white px-3 py-2.5 font-opensans text-sm text-brand-blue focus:outline-none focus:border-brand-blue"
                        wrapperClassName="w-full"
                      />
                      {errors.date && (
                        <p className="font-opensans text-xs text-red-500 mt-1">{errors.date}</p>
                      )}
                    </div>

                    {/* Hora */}
                    <div>
                      <label className="block font-opensans text-xs uppercase tracking-wider text-brand-blue mb-1.5">
                        Horario <span className="text-red-400">*</span>
                      </label>
                      {checkingAvailability ? (
                        <div className="flex items-center gap-2 text-brand-bruma border border-gray-200 bg-white px-3 py-2.5">
                          <Loader2 size={14} className="animate-spin" />
                          <span className="font-opensans text-xs">Verificando disponibilidad…</span>
                        </div>
                      ) : (
                        <select
                          value={form.time}
                          onChange={(e) => {
                            setForm((p) => ({ ...p, time: e.target.value }))
                            setErrors((p) => ({ ...p, time: undefined }))
                          }}
                          disabled={!form.date}
                          className="w-full border border-gray-200 bg-white px-3 py-2.5 font-opensans text-sm text-brand-blue focus:outline-none focus:border-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {form.date ? 'Seleccioná un horario…' : 'Primero seleccioná una fecha'}
                          </option>
                          {timeSlots.map((slot) => {
                            const ocupado = occupiedSlots.includes(slot)
                            return (
                              <option key={slot} value={slot} disabled={ocupado}>
                                {formatDisplayTime(slot)}{ocupado ? ' (Ocupado)' : ''}
                              </option>
                            )
                          })}
                        </select>
                      )}
                      {errors.time && (
                        <p className="font-opensans text-xs text-red-500 mt-1">{errors.time}</p>
                      )}
                    </div>

                    {/* Notas adicionales */}
                    <div>
                      <label className="block font-opensans text-xs uppercase tracking-wider text-brand-blue mb-1.5">
                        Notas adicionales
                      </label>
                      <textarea
                        value={form.notes}
                        onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                        rows={3}
                        placeholder="Indicaciones especiales, materiales necesarios, etc."
                        className="w-full border border-gray-200 bg-white px-3 py-2.5 font-opensans text-sm text-brand-blue placeholder:text-brand-bruma/60 focus:outline-none focus:border-brand-blue resize-none"
                      />
                    </div>

                    {/* Error de guardado */}
                    {submitError && (
                      <p className="font-opensans text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2">
                        {submitError}
                      </p>
                    )}

                    {/* Botones de acción */}
                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={handleConfirm}
                        disabled={submitting}
                        className="flex-1 bg-brand-blue text-brand-lino font-opensans text-xs tracking-widest uppercase py-3 hover:bg-brand-tierra transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {submitting && <Loader2 size={14} className="animate-spin" />}
                        {submitting ? 'Guardando…' : 'Confirmar Cita'}
                      </button>
                      <button
                        onClick={handleClose}
                        disabled={submitting}
                        className="flex-1 border border-brand-blue text-brand-blue font-opensans text-xs tracking-widest uppercase py-3 hover:bg-brand-blue/5 transition-colors disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Vista: Éxito ──────────────────────────────────────── */}
                {view === 'success' && successData && (
                  <div className="p-8 text-center">
                    <div className="flex justify-center mb-5">
                      <CheckCircle className="text-green-500" size={56} strokeWidth={1.5} />
                    </div>

                    <h3 className="font-cormorant text-2xl font-light tracking-widest text-brand-blue uppercase mb-2">
                      ¡Cita confirmada!
                    </h3>
                    <p className="font-opensans text-sm text-brand-tierra mb-5">
                      La cita fue agendada exitosamente.
                    </p>

                    {/* Advertencia si Google Calendar falló */}
                    {calendarWarning && (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 px-4 py-3 mb-5 text-left">
                        <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                        <p className="font-opensans text-xs text-amber-700">
                          ⚠️ Cita guardada pero no se pudo sincronizar con Google Calendar.
                          Agrégala manualmente.
                        </p>
                      </div>
                    )}

                    {/* Detalle de la cita confirmada */}
                    <div className="border border-brand-arena p-4 mb-6 text-left space-y-2.5">
                      {[
                        { label: 'Número de confirmación', value: successData.confirmationNumber },
                        { label: 'Paciente', value: patient.full_name },
                        { label: 'Servicio', value: successData.service },
                        { label: 'Fecha', value: successData.date },
                        { label: 'Hora', value: successData.time },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between font-opensans">
                          <span className="text-brand-bruma uppercase tracking-wider text-xs">{label}</span>
                          <span className="text-brand-blue text-xs text-right max-w-[55%]">{value}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleClose}
                      className="w-full bg-brand-blue text-brand-lino font-opensans text-xs tracking-widest uppercase py-3 hover:bg-brand-tierra transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                )}

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
