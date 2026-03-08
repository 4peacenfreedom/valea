/**
 * tabs/MedicalHistoryTab.tsx — Tab 2: Historia Clínica del paciente.
 * Incluye antecedentes, revisión por aparatos y sistemas.
 */
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Save, ChevronDown, ChevronUp } from 'lucide-react'
import type { Patient, SystemsReview } from '../../../types'

interface Props {
  patient: Patient
  onSave: (updates: Partial<Patient>) => Promise<void>
}

const SYSTEMS: { key: keyof SystemsReview; label: string }[] = [
  { key: 'cardiovascular', label: 'Cardiovascular' },
  { key: 'respiratory', label: 'Respiratorio' },
  { key: 'digestive', label: 'Digestivo' },
  { key: 'neurological', label: 'Neurológico' },
  { key: 'dermatological', label: 'Dermatológico' },
  { key: 'musculoskeletal', label: 'Musculoesquelético' },
  { key: 'endocrine', label: 'Endocrino' },
  { key: 'genitourinary', label: 'Genitourinario' },
]

function AccordionItem({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-100">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer border-none"
      >
        <span className="font-opensans text-xs tracking-wider uppercase text-brand-blue">{label}</span>
        {open ? <ChevronUp size={14} className="text-brand-bruma" /> : <ChevronDown size={14} className="text-brand-bruma" />}
      </button>
      {open && (
        <div className="p-3">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            placeholder={`Hallazgos en sistema ${label.toLowerCase()}...`}
            className="w-full border border-gray-200 px-3 py-2 text-sm font-opensans text-brand-blue focus:outline-none focus:border-brand-blue resize-none"
          />
        </div>
      )}
    </div>
  )
}

export default function MedicalHistoryTab({ patient, onSave }: Props) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [systems, setSystems] = useState<SystemsReview>(patient.systems_review ?? {})

  const { register, handleSubmit } = useForm({
    defaultValues: {
      consultation_reason: patient.consultation_reason ?? '',
      current_condition: patient.current_condition ?? '',
      current_medications: patient.current_medications ?? '',
      previous_studies: patient.previous_studies ?? '',
      medical_history: {
        allergies: patient.medical_history?.allergies ?? '',
        previous_surgeries: patient.medical_history?.previous_surgeries ?? '',
        chronic_diseases: patient.medical_history?.chronic_diseases ?? '',
        family_history: patient.medical_history?.family_history ?? '',
      },
    },
  })

  const onSubmit = async (data: typeof patient) => {
    setSaving(true)
    try {
      await onSave({ ...data, systems_review: systems })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const textareaClass =
    'w-full border border-gray-200 px-3 py-2.5 text-sm font-opensans text-brand-blue focus:outline-none focus:border-brand-blue resize-none bg-white'
  const labelClass = 'font-opensans text-xs font-medium tracking-wider uppercase text-brand-tierra mb-1.5 block'

  return (
    <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-7">
      {/* Motivo de consulta */}
      <Section title="Consulta">
        <div>
          <label className={labelClass}>Motivo de consulta</label>
          <textarea {...register('consultation_reason')} rows={3} className={textareaClass} placeholder="¿Por qué consulta hoy?" />
        </div>
        <div>
          <label className={labelClass}>Padecimiento actual</label>
          <textarea {...register('current_condition')} rows={4} className={textareaClass} placeholder="Descripción del padecimiento actual..." />
        </div>
      </Section>

      {/* Antecedentes */}
      <Section title="Antecedentes">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Alergias</label>
            <textarea {...register('medical_history.allergies')} rows={2} className={textareaClass} placeholder="Medicamentos, alimentos, materiales..." />
          </div>
          <div>
            <label className={labelClass}>Cirugías previas</label>
            <textarea {...register('medical_history.previous_surgeries')} rows={2} className={textareaClass} placeholder="Tipo de cirugía, año..." />
          </div>
          <div>
            <label className={labelClass}>Enfermedades crónicas</label>
            <textarea {...register('medical_history.chronic_diseases')} rows={2} className={textareaClass} placeholder="Diabetes, hipertensión, tiroides..." />
          </div>
          <div>
            <label className={labelClass}>Antecedentes familiares</label>
            <textarea {...register('medical_history.family_history')} rows={2} className={textareaClass} placeholder="Enfermedades hereditarias relevantes..." />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Medicamentos actuales</label>
            <textarea {...register('current_medications')} rows={2} className={textareaClass} placeholder="Nombre, dosis, frecuencia..." />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Estudios previos</label>
            <textarea {...register('previous_studies')} rows={2} className={textareaClass} placeholder="Laboratorios, imágenes, otros estudios..." />
          </div>
        </div>
      </Section>

      {/* Revisión por aparatos */}
      <Section title="Revisión por Aparatos y Sistemas">
        <div className="space-y-2">
          {SYSTEMS.map(({ key, label }) => (
            <AccordionItem
              key={key}
              label={label}
              value={systems[key] ?? ''}
              onChange={(v) => setSystems((prev) => ({ ...prev, [key]: v }))}
            />
          ))}
        </div>
      </Section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-brand-blue text-brand-lino px-6 py-3 font-opensans text-xs tracking-widest uppercase hover:bg-brand-tierra transition-colors duration-300 disabled:opacity-50 cursor-pointer border-none"
        >
          <Save size={14} />
          {saving ? 'Guardando...' : 'Guardar Historia'}
        </button>
        {saved && <p className="font-opensans text-xs text-green-600">✓ Guardado</p>}
      </div>
    </form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-cormorant text-base font-light tracking-widest text-brand-blue uppercase mb-3 pb-2 border-b border-gray-100">
        {title}
      </h3>
      {children}
    </div>
  )
}
