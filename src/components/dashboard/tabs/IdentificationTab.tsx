/**
 * tabs/IdentificationTab.tsx — Tab 1: Ficha de identificación del paciente.
 */
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Save, Hash } from 'lucide-react'
import type { Patient } from '../../../types'

interface Props {
  patient: Patient
  onSave: (updates: Partial<Patient>) => Promise<void>
}

export default function IdentificationTab({ patient, onSave }: Props) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit } = useForm<Patient>({
    defaultValues: patient,
  })

  const onSubmit = async (data: Patient) => {
    setSaving(true)
    try {
      await onSave(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full border border-gray-200 px-3 py-2.5 text-sm font-opensans text-brand-blue focus:outline-none focus:border-brand-blue transition-colors bg-white'
  const labelClass = 'font-opensans text-xs font-medium tracking-wider uppercase text-brand-tierra'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Número de expediente prominente */}
      <div className="bg-brand-blue/5 border border-brand-blue/20 px-4 py-3 flex items-center gap-3">
        <Hash size={18} className="text-brand-blue shrink-0" strokeWidth={1.5} />
        <div>
          <p className="font-opensans text-xs text-brand-bruma tracking-wider uppercase">
            Número de Expediente
          </p>
          <p className="font-cormorant text-xl font-light text-brand-blue tracking-wider">
            {patient.record_number ?? 'Sin asignar'}
          </p>
        </div>
      </div>

      {/* Datos personales */}
      <Section title="Datos Personales">
        <Field label="Nombre completo *">
          <input {...register('full_name')} className={inputClass} required />
        </Field>
        <Field label="Cédula / Pasaporte">
          <input {...register('id_number')} className={inputClass} />
        </Field>
        <Field label="Fecha de nacimiento">
          <input type="date" {...register('birth_date')} className={inputClass} />
        </Field>
        <Field label="Edad">
          <input type="number" {...register('age')} className={inputClass} min={0} max={120} />
        </Field>
        <Field label="Sexo">
          <select {...register('sex')} className={inputClass}>
            <option value="">Seleccionar</option>
            <option value="Femenino">Femenino</option>
            <option value="Masculino">Masculino</option>
            <option value="Otro">Otro</option>
          </select>
        </Field>
        <Field label="Dirección">
          <input {...register('address')} className={inputClass} />
        </Field>
      </Section>

      {/* Contacto */}
      <Section title="Contacto">
        <Field label="Teléfono">
          <input type="tel" {...register('phone')} className={inputClass} />
        </Field>
        <Field label="Correo electrónico">
          <input type="email" {...register('email')} className={inputClass} />
        </Field>
        <Field label="Contacto de emergencia">
          <input {...register('emergency_contact')} className={inputClass} />
        </Field>
        <Field label="Teléfono de emergencia">
          <input type="tel" {...register('emergency_phone')} className={inputClass} />
        </Field>
      </Section>

      {/* Notas generales */}
      <Section title="Notas Generales">
        <div className="col-span-full">
          <label className={labelClass}>Notas</label>
          <textarea
            {...register('notes')}
            rows={3}
            className={`${inputClass} mt-1.5 resize-none`}
            placeholder="Observaciones generales..."
          />
        </div>
        <Field label="Estado">
          <select {...register('active', { setValueAs: (v) => v === 'true' || v === true })} className={inputClass}>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </Field>
      </Section>

      {/* Guardar */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-brand-blue text-brand-lino px-6 py-3 font-opensans text-xs tracking-widest uppercase hover:bg-brand-tierra transition-colors duration-300 disabled:opacity-50 cursor-pointer border-none"
        >
          <Save size={14} />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {saved && (
          <p className="font-opensans text-xs text-green-600 tracking-wider">
            ✓ Guardado correctamente
          </p>
        )}
      </div>
    </form>
  )
}

// ── Helpers de layout ─────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-cormorant text-base font-light tracking-widest text-brand-blue uppercase mb-3 pb-2 border-b border-gray-100">
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-opensans text-xs font-medium tracking-wider uppercase text-brand-tierra">
        {label}
      </label>
      {children}
    </div>
  )
}
