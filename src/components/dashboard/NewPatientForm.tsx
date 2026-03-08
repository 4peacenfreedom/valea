/**
 * components/dashboard/NewPatientForm.tsx
 * Formulario para crear nuevo paciente desde el dashboard.
 * Autogenera número de expediente VA-YYYY-XXXX.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { usePatients } from '../../hooks/usePatients'
import { format } from 'date-fns'

const schema = z.object({
  full_name: z.string().min(3, 'Ingresa el nombre completo'),
  id_number: z.string().optional(),
  birth_date: z.string().optional(),
  sex: z.enum(['Femenino', 'Masculino', 'Otro']).optional(),
  phone: z.string().optional(),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

/** Genera número de expediente: VA-2025-XXXX */
function generateRecordNumber(): string {
  const year = format(new Date(), 'yyyy')
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `VA-${year}-${seq}`
}

export default function NewPatientForm() {
  const navigate = useNavigate()
  const { createPatient } = usePatients()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    setError(null)
    try {
      const patient = await createPatient({
        ...data,
        record_number: generateRecordNumber(),
        active: true,
        medical_history: {},
        systems_review: {},
      })
      navigate(`/dashboard/patients/${patient.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear paciente')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full border border-gray-200 px-3 py-2.5 text-sm font-opensans text-brand-blue focus:outline-none focus:border-brand-blue transition-colors bg-white'
  const labelClass = 'font-opensans text-xs font-medium tracking-wider uppercase text-brand-tierra mb-1.5 block'
  const errorClass = 'font-opensans text-xs text-red-500 mt-1'

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-cormorant text-3xl font-light tracking-widest text-brand-blue uppercase">
          Nuevo Paciente
        </h1>
        <p className="font-opensans text-xs text-brand-bruma tracking-wider mt-1">
          Se generará un número de expediente automáticamente.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-100 p-6 space-y-6">
        {/* Datos principales */}
        <Section title="Identificación">
          <div className="col-span-2">
            <label className={labelClass}>Nombre completo *</label>
            <input {...register('full_name')} className={inputClass} placeholder="Nombre completo del paciente" />
            {errors.full_name && <p className={errorClass}>{errors.full_name.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Cédula / Pasaporte</label>
            <input {...register('id_number')} className={inputClass} placeholder="1-XXXX-XXXX" />
          </div>

          <div>
            <label className={labelClass}>Fecha de nacimiento</label>
            <input type="date" {...register('birth_date')} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Sexo</label>
            <select {...register('sex')} className={inputClass}>
              <option value="">Seleccionar</option>
              <option value="Femenino">Femenino</option>
              <option value="Masculino">Masculino</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Dirección</label>
            <input {...register('address')} className={inputClass} placeholder="Provincia, cantón, distrito" />
          </div>
        </Section>

        {/* Contacto */}
        <Section title="Contacto">
          <div>
            <label className={labelClass}>Teléfono</label>
            <input type="tel" {...register('phone')} className={inputClass} placeholder="8888-8888" />
          </div>

          <div>
            <label className={labelClass}>Correo electrónico</label>
            <input type="email" {...register('email')} className={inputClass} placeholder="correo@ejemplo.com" />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Contacto de emergencia</label>
            <input {...register('emergency_contact')} className={inputClass} placeholder="Nombre del familiar" />
          </div>

          <div>
            <label className={labelClass}>Teléfono de emergencia</label>
            <input type="tel" {...register('emergency_phone')} className={inputClass} placeholder="8888-8888" />
          </div>
        </Section>

        {/* Notas iniciales */}
        <div>
          <label className={labelClass}>Notas iniciales (opcional)</label>
          <textarea
            {...register('notes')}
            rows={3}
            className={`${inputClass} resize-none`}
            placeholder="Observaciones iniciales, motivo de primera consulta..."
          />
        </div>

        {error && (
          <p className="font-opensans text-sm text-red-500 bg-red-50 px-4 py-3">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-brand-blue text-brand-lino py-3 font-opensans text-xs tracking-widest uppercase hover:bg-brand-tierra transition-colors disabled:opacity-50 cursor-pointer border-none"
          >
            {saving ? 'Creando expediente...' : 'Crear Expediente'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/patients')}
            className="px-6 border border-gray-200 text-brand-bruma hover:text-brand-blue hover:border-brand-blue font-opensans text-xs tracking-widest uppercase transition-colors cursor-pointer bg-white"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-cormorant text-sm font-light tracking-widest text-brand-blue uppercase mb-3 pb-2 border-b border-gray-100">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  )
}
