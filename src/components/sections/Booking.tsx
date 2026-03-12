/**
 * components/sections/Booking.tsx — Formulario público de agendamiento.
 *
 * Limpieza realizada:
 *   - Se eliminó la llamada directa a sendWhatsAppNotification().
 *     Las notificaciones (email + WhatsApp) las maneja la Edge Function
 *     notify-new-appointment que se dispara automáticamente al INSERT
 *     en la tabla appointments de Supabase.
 *   - La lógica de disponibilidad migró a useAvailability (vía TimeSlotSelect).
 *   - Se eliminaron los estados locales checkingAvailability, occupiedSlots
 *     y la función loadAvailability que duplicaban esa lógica.
 */
import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { es } from 'date-fns/locale'
import { Input, Textarea } from '../ui/Input'
import Button from '../ui/Button'
import ConfirmationModal from '../ui/Modal'
import TimeSlotSelect from '../ui/TimeSlotSelect'
import { supabase } from '../../lib/supabase'
import { SERVICES, type Appointment } from '../../types'
import { generateConfirmationNumber, isSunday, isPastDate } from '../../lib/utils'
import { format } from 'date-fns'

const schema = z.object({
  full_name: z.string().min(3, 'Ingresa tu nombre completo'),
  phone: z.string().min(8, 'Ingresa un teléfono válido'),
  email: z.string().email('Ingresa un correo válido'),
  service: z.string().min(1, 'Selecciona un servicio'),
  date: z.date().refine((d) => d instanceof Date, { message: 'Selecciona una fecha' }),
  time: z.string().min(1, 'Selecciona una hora'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function Booking() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmation, setConfirmation] = useState<{
    number: string
    name: string
    date: string
    time: string
    service: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const selectedDate = watch('date')
  const selectedTime = watch('time')
  // Fecha en 'YYYY-MM-DD' para pasar al TimeSlotSelect
  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const confirmationNumber = generateConfirmationNumber()
      const formattedDate = format(data.date, 'yyyy-MM-dd')
      const displayDate = format(data.date, "EEEE d 'de' MMMM, yyyy", { locale: es })
      const displayTime = data.time.replace(/^(\d{2}):00$/, (_, h) => {
        const hour = parseInt(h)
        const period = hour >= 12 ? 'PM' : 'AM'
        const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
        return `${display}:00 ${period}`
      })

      // Guardar en Supabase — dispara Edge Function notify-new-appointment
      // (la Edge Function crea el evento en Google Calendar server-side)
      const appointment: Omit<Appointment, 'id' | 'created_at'> = {
        patient_name: data.full_name,
        phone: data.phone,
        email: data.email,
        service: data.service,
        appointment_date: formattedDate,
        appointment_time: data.time,
        notes: data.notes || '',
        status: 'pending',
        confirmation_number: confirmationNumber,
      }

      const { error } = await supabase.from('appointments').insert([appointment])
      if (error) {
        console.error('Supabase error:', error)
        setSubmitError('Este horario ya fue reservado. Por favor seleccioná otro horario.')
        return
      }

      setConfirmation({
        number: confirmationNumber,
        name: data.full_name.split(' ')[0],
        date: displayDate,
        time: displayTime,
        service: data.service,
      })
      setModalOpen(true)
      reset()
    } catch (err) {
      console.error('Error al enviar la cita:', err)
      setSubmitError('Ocurrió un error al enviar la cita. Por favor intentá de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="booking" className="py-20 lg:py-28 bg-brand-blue">
      {/* Estilos del DatePicker para fondo oscuro */}
      <style>{`
        .booking-datepicker .react-datepicker {
          font-family: 'Open Sans', sans-serif;
          background: #1C4BA7;
          border: 1px solid rgba(209,186,166,0.3);
          border-radius: 0;
          color: #FAF9F6;
        }
        .booking-datepicker .react-datepicker__header {
          background: rgba(28,75,167,0.8);
          border-bottom: 1px solid rgba(209,186,166,0.2);
        }
        .booking-datepicker .react-datepicker__current-month,
        .booking-datepicker .react-datepicker__day-name,
        .booking-datepicker .react-datepicker__day { color: #FAF9F6; }
        .booking-datepicker .react-datepicker__day:hover {
          background: rgba(209,186,166,0.3); border-radius: 0;
        }
        .booking-datepicker .react-datepicker__day--selected {
          background: #D1BAA6 !important; color: #1C4BA7 !important; border-radius: 0;
        }
        .booking-datepicker .react-datepicker__day--disabled {
          color: rgba(250,249,246,0.2) !important;
        }
        .booking-datepicker .react-datepicker__navigation-icon::before { border-color: #D1BAA6; }
        .booking-datepicker .react-datepicker__day--keyboard-selected {
          background: rgba(209,186,166,0.2); border-radius: 0;
        }
        .booking-datepicker .react-datepicker__input-container input {
          width: 100%;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: #FAF9F6;
          padding: 12px 16px;
          font-size: 14px;
          font-family: 'Open Sans', sans-serif;
          outline: none;
          cursor: pointer;
        }
        .booking-datepicker .react-datepicker__input-container input::placeholder {
          color: rgba(250,249,246,0.4);
        }
        .booking-datepicker .react-datepicker__input-container input:focus {
          border-color: #D1BAA6;
          background: rgba(255,255,255,0.15);
        }
        .booking-datepicker .react-datepicker-popper { z-index: 20; }

        /* TimeSlotSelect público: fondo oscuro */
        .booking-timeslot select {
          background: rgba(255,255,255,0.1) !important;
          border: 1px solid rgba(255,255,255,0.2) !important;
          color: #FAF9F6 !important;
        }
        .booking-timeslot select option { background: #1C4BA7; color: #FAF9F6; }
        .booking-timeslot select option:disabled { color: rgba(250,249,246,0.35) !important; }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12 lg:mb-16"
        >
          <p className="font-opensans text-xs tracking-[0.3em] uppercase text-brand-arena/60 mb-4">
            Reserva tu espacio
          </p>
          <h2 className="font-cormorant text-4xl md:text-5xl font-light tracking-[0.05em] text-brand-lino">
            Agenda tu Cita
          </h2>
          <div className="w-12 h-px bg-brand-arena/40 mx-auto mt-6" />
        </motion.div>

        {/* Formulario */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="max-w-4xl mx-auto"
        >
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

              {/* Columna izquierda: Información Personal */}
              <div className="space-y-5">
                <h3 className="font-cormorant text-xl font-light tracking-wider text-brand-arena uppercase mb-6">
                  Información Personal
                </h3>
                <Input
                  label="Nombre completo"
                  placeholder="Tu nombre completo"
                  error={errors.full_name?.message}
                  {...register('full_name')}
                />
                <Input
                  label="Teléfono"
                  type="tel"
                  placeholder="8888-8888"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
                <Input
                  label="Correo electrónico"
                  type="email"
                  placeholder="tu@email.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              {/* Columna derecha: Detalles de la Cita */}
              <div className="space-y-5">
                <h3 className="font-cormorant text-xl font-light tracking-wider text-brand-arena uppercase mb-6">
                  Detalles de la Cita
                </h3>

                {/* Servicio */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-opensans text-xs font-medium tracking-wider uppercase text-brand-lino/80">
                    Servicio
                  </label>
                  <select
                    className="w-full bg-white/10 border border-white/20 text-brand-lino px-4 py-3 font-opensans text-sm focus:outline-none focus:border-brand-arena"
                    {...register('service')}
                  >
                    <option value="" className="bg-brand-blue">Selecciona un servicio</option>
                    {SERVICES.map((s) => (
                      <option key={s} value={s} className="bg-brand-blue">{s}</option>
                    ))}
                  </select>
                  {errors.service && (
                    <p className="text-red-400 text-xs font-opensans">{errors.service.message}</p>
                  )}
                </div>

                {/* Fecha */}
                <div className="flex flex-col gap-1.5 booking-datepicker">
                  <label className="font-opensans text-xs font-medium tracking-wider uppercase text-brand-lino/80">
                    Fecha
                  </label>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        selected={field.value}
                        onChange={(date: Date | null) => {
                          field.onChange(date)
                          // Al cambiar la fecha, resetear la hora seleccionada
                          setValue('time', '')
                        }}
                        filterDate={(d) => !isSunday(d) && !isPastDate(d)}
                        minDate={new Date()}
                        placeholderText="Selecciona una fecha"
                        dateFormat="dd/MM/yyyy"
                        locale={es}
                        showPopperArrow={false}
                        autoComplete="off"
                      />
                    )}
                  />
                  {errors.date && (
                    <p className="text-red-400 text-xs font-opensans">{errors.date.message}</p>
                  )}
                </div>

                {/* Hora — TimeSlotSelect sin info de paciente (formulario público) */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-opensans text-xs font-medium tracking-wider uppercase text-brand-lino/80">
                    Hora
                  </label>
                  <div className="booking-timeslot">
                    <TimeSlotSelect
                      date={dateStr}
                      value={selectedTime ?? ''}
                      onChange={(time) => setValue('time', time, { shouldValidate: true })}
                      showPatientInfo={false}
                    />
                  </div>
                  {errors.time && (
                    <p className="text-red-400 text-xs font-opensans">{errors.time.message}</p>
                  )}
                </div>

                {/* Notas */}
                <Textarea
                  label="Notas adicionales (opcional)"
                  placeholder="¿Alguna consulta o información relevante?"
                  rows={3}
                  {...register('notes')}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="mt-10 flex flex-col items-center gap-4">
              {submitError && (
                <p className="font-opensans text-sm text-red-400 text-center bg-white/10 border border-red-400/30 px-4 py-3 max-w-sm">
                  {submitError}
                </p>
              )}
              <Button
                type="submit"
                variant="arena"
                size="lg"
                disabled={isSubmitting}
                className="min-w-48"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
              <p className="font-opensans text-xs text-brand-lino/40 text-center max-w-xs">
                Al confirmar, recibirás un correo de confirmación con los detalles de tu cita.
              </p>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Modal de confirmación */}
      {confirmation && (
        <ConfirmationModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setConfirmation(null) }}
          confirmationNumber={confirmation.number}
          name={confirmation.name}
          date={confirmation.date}
          time={confirmation.time}
          service={confirmation.service}
        />
      )}
    </section>
  )
}
