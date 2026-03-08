/**
 * tabs/EvolutionNotesTab.tsx — Tab 3: Notas de evolución.
 * Timeline cronológico con modal para nueva nota.
 */
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, CheckCircle, Circle, X, Activity } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { EvolutionNote } from '../../../types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  patientId: string
}

export default function EvolutionNotesTab({ patientId }: Props) {
  const [notes, setNotes] = useState<EvolutionNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset } = useForm<EvolutionNote>({
    defaultValues: {
      visit_date: format(new Date(), 'yyyy-MM-dd'),
      doctor_name: 'Dra. Carolina Castillo Rodas',
      signed: false,
    },
  })

  useEffect(() => {
    fetchNotes()
  }, [patientId])

  const fetchNotes = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('evolution_notes')
      .select('*')
      .eq('patient_id', patientId)
      .order('visit_date', { ascending: false })
    setNotes(data || [])
    setLoading(false)
  }

  const onSubmit = async (data: EvolutionNote) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('evolution_notes')
        .insert([{ ...data, patient_id: patientId }])

      if (!error) {
        await fetchNotes()
        reset()
        setShowForm(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const toggleSign = async (note: EvolutionNote) => {
    await supabase
      .from('evolution_notes')
      .update({ signed: !note.signed })
      .eq('id', note.id)
    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, signed: !n.signed } : n))
    )
  }

  const inputClass = 'w-full border border-gray-200 px-3 py-2.5 text-sm font-opensans text-brand-blue focus:outline-none focus:border-brand-blue bg-white'
  const labelClass = 'font-opensans text-xs font-medium tracking-wider uppercase text-brand-tierra mb-1 block'

  return (
    <div className="space-y-5">
      {/* Header + botón */}
      <div className="flex items-center justify-between">
        <h3 className="font-cormorant text-xl font-light tracking-wider text-brand-blue">
          Notas de Evolución
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand-blue text-brand-lino px-4 py-2.5 font-opensans text-xs tracking-widest uppercase hover:bg-brand-tierra transition-colors cursor-pointer border-none"
        >
          <Plus size={14} /> Nueva Nota
        </button>
      </div>

      {/* Modal de nueva nota */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-blue/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h4 className="font-cormorant text-xl font-light text-brand-blue tracking-wider">
                Nueva Nota de Evolución
              </h4>
              <button onClick={() => setShowForm(false)} className="text-brand-bruma hover:text-brand-blue cursor-pointer border-none bg-transparent">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              {/* Fecha + doctor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Fecha de visita *</label>
                  <input type="date" {...register('visit_date', { required: true })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Médico</label>
                  <input {...register('doctor_name')} className={inputClass} />
                </div>
              </div>

              {/* Signos vitales */}
              <div>
                <p className="font-opensans text-xs tracking-widest uppercase text-brand-tierra mb-3 flex items-center gap-2">
                  <Activity size={12} /> Signos Vitales
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className={labelClass}>Tensión arterial</label>
                    <input {...register('blood_pressure')} placeholder="120/80" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>FC (lpm)</label>
                    <input type="number" {...register('heart_rate')} placeholder="72" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Temperatura °C</label>
                    <input type="number" step="0.1" {...register('temperature')} placeholder="36.5" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Peso (kg)</label>
                    <input type="number" step="0.1" {...register('weight')} placeholder="60.0" className={inputClass} />
                  </div>
                </div>
              </div>

              {/* Nota clínica */}
              <div>
                <label className={labelClass}>Nota clínica *</label>
                <textarea
                  {...register('note_text', { required: true })}
                  rows={5}
                  placeholder="Descripción de la evolución, hallazgos clínicos, procedimientos realizados..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>Diagnóstico</label>
                <textarea {...register('diagnosis')} rows={2} className={`${inputClass} resize-none`} placeholder="Diagnóstico / impresión diagnóstica..." />
              </div>

              <div>
                <label className={labelClass}>Cambios en tratamiento</label>
                <textarea {...register('treatment_changes')} rows={2} className={`${inputClass} resize-none`} placeholder="Modificaciones al plan terapéutico..." />
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" {...register('signed')} id="signed" className="cursor-pointer" />
                <label htmlFor="signed" className="font-opensans text-xs text-brand-tierra cursor-pointer">
                  Marcar como firmada
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-brand-blue text-brand-lino py-3 font-opensans text-xs tracking-widest uppercase hover:bg-brand-tierra transition-colors cursor-pointer border-none disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar Nota'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 border border-gray-200 text-brand-bruma hover:border-brand-blue hover:text-brand-blue font-opensans text-xs tracking-widest uppercase transition-colors cursor-pointer bg-white">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-28 bg-gray-50 animate-pulse border border-gray-100" />)}
        </div>
      ) : notes.length === 0 ? (
        <div className="p-10 bg-gray-50 text-center border border-gray-100">
          <p className="font-opensans text-sm text-brand-bruma">Sin notas de evolución registradas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="border border-gray-100 bg-white">
              {/* Header de la nota */}
              <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <p className="font-cormorant text-base font-light text-brand-blue">
                    {format(new Date(note.visit_date), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                  <span className="text-brand-bruma/40">·</span>
                  <p className="font-opensans text-xs text-brand-bruma">{note.doctor_name}</p>
                </div>
                <button
                  onClick={() => toggleSign(note)}
                  className={`flex items-center gap-1.5 font-opensans text-xs cursor-pointer border-none bg-transparent transition-colors ${note.signed ? 'text-green-600' : 'text-brand-bruma hover:text-brand-blue'}`}
                >
                  {note.signed ? <CheckCircle size={13} /> : <Circle size={13} />}
                  {note.signed ? 'Firmada' : 'Borrador'}
                </button>
              </div>

              {/* Signos vitales */}
              {(note.blood_pressure || note.heart_rate || note.temperature || note.weight) && (
                <div className="px-5 py-2 border-b border-gray-50 flex flex-wrap gap-4">
                  {note.blood_pressure && <Vital label="TA" value={note.blood_pressure} />}
                  {note.heart_rate && <Vital label="FC" value={`${note.heart_rate} lpm`} />}
                  {note.temperature && <Vital label="Temp" value={`${note.temperature}°C`} />}
                  {note.weight && <Vital label="Peso" value={`${note.weight} kg`} />}
                </div>
              )}

              {/* Contenido */}
              <div className="px-5 py-4 space-y-3">
                <p className="font-opensans text-sm text-brand-blue leading-relaxed whitespace-pre-line">
                  {note.note_text}
                </p>
                {note.diagnosis && (
                  <div>
                    <p className="font-opensans text-xs uppercase tracking-wider text-brand-tierra mb-1">Diagnóstico</p>
                    <p className="font-opensans text-sm text-brand-tierra">{note.diagnosis}</p>
                  </div>
                )}
                {note.treatment_changes && (
                  <div>
                    <p className="font-opensans text-xs uppercase tracking-wider text-brand-tierra mb-1">Cambios en tratamiento</p>
                    <p className="font-opensans text-sm text-brand-tierra">{note.treatment_changes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Vital({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-opensans text-xs text-brand-bruma uppercase tracking-wider">{label}:</span>
      <span className="font-opensans text-xs text-brand-blue font-medium">{value}</span>
    </div>
  )
}
