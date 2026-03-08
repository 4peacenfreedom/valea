/**
 * tabs/TreatmentsTab.tsx — Tab 4: Tratamientos y órdenes médicas.
 * Historial + formulario con medicamentos dinámicos.
 */
import { useState, useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Plus, Trash2, X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { Treatment, Medication } from '../../../types'
import { SERVICES } from '../../../types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  patientId: string
}

type TreatmentForm = Omit<Treatment, 'id' | 'patient_id' | 'created_at'>

export default function TreatmentsTab({ patientId }: Props) {
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, control, reset } = useForm<TreatmentForm>({
    defaultValues: {
      treatment_date: format(new Date(), 'yyyy-MM-dd'),
      medications: [],
      service: '',
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'medications' })

  useEffect(() => {
    fetchTreatments()
  }, [patientId])

  const fetchTreatments = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('treatments')
      .select('*')
      .eq('patient_id', patientId)
      .order('treatment_date', { ascending: false })
    setTreatments(data || [])
    setLoading(false)
  }

  const onSubmit = async (data: TreatmentForm) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('treatments')
        .insert([{ ...data, patient_id: patientId }])

      if (!error) {
        await fetchTreatments()
        reset()
        setShowForm(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const addMedication = () => {
    append({ name: '', dose: '', route: '', frequency: '', duration: '' } as Medication)
  }

  const inputClass = 'w-full border border-gray-200 px-3 py-2.5 text-sm font-opensans text-brand-blue focus:outline-none focus:border-brand-blue bg-white'
  const labelClass = 'font-opensans text-xs font-medium tracking-wider uppercase text-brand-tierra mb-1 block'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-cormorant text-xl font-light tracking-wider text-brand-blue">
          Tratamientos y Órdenes
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand-blue text-brand-lino px-4 py-2.5 font-opensans text-xs tracking-widest uppercase hover:bg-brand-tierra transition-colors cursor-pointer border-none"
        >
          <Plus size={14} /> Nuevo Tratamiento
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-blue/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h4 className="font-cormorant text-xl font-light text-brand-blue tracking-wider">
                Nuevo Tratamiento
              </h4>
              <button onClick={() => setShowForm(false)} className="text-brand-bruma hover:text-brand-blue cursor-pointer border-none bg-transparent">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Fecha *</label>
                  <input type="date" {...register('treatment_date', { required: true })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Servicio *</label>
                  <select {...register('service', { required: true })} className={inputClass}>
                    <option value="">Seleccionar</option>
                    {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Medicamentos dinámicos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={labelClass}>Medicamentos</label>
                  <button
                    type="button"
                    onClick={addMedication}
                    className="flex items-center gap-1.5 font-opensans text-xs text-brand-blue hover:text-brand-tierra cursor-pointer border-none bg-transparent"
                  >
                    <Plus size={12} /> Agregar
                  </button>
                </div>

                {fields.length === 0 && (
                  <p className="font-opensans text-xs text-brand-bruma italic">Sin medicamentos agregados.</p>
                )}

                {fields.map((field, idx) => (
                  <div key={field.id} className="grid grid-cols-5 gap-2 mb-2 items-start">
                    <input {...register(`medications.${idx}.name`)} placeholder="Medicamento" className={`${inputClass} col-span-2`} />
                    <input {...register(`medications.${idx}.dose`)} placeholder="Dosis" className={inputClass} />
                    <input {...register(`medications.${idx}.route`)} placeholder="Vía" className={inputClass} />
                    <div className="flex gap-1">
                      <input {...register(`medications.${idx}.frequency`)} placeholder="Frecuencia" className={inputClass} />
                      <button type="button" onClick={() => remove(idx)} className="shrink-0 text-red-400 hover:text-red-600 cursor-pointer border-none bg-transparent p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {fields.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-1">
                    <div className="col-span-2" />
                    <div />
                    <div />
                    <div className="flex gap-1">
                      <div className="flex-1">
                        {fields.map((field, idx) => (
                          <input key={field.id} {...register(`medications.${idx}.duration`)} placeholder="Duración" className={`${inputClass} mb-1`} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>Procedimientos realizados</label>
                <textarea {...register('procedures')} rows={3} className={`${inputClass} resize-none`} placeholder="Descripción de procedimientos..." />
              </div>

              <div>
                <label className={labelClass}>Estudios solicitados</label>
                <textarea {...register('studies_ordered')} rows={2} className={`${inputClass} resize-none`} placeholder="Laboratorios, imágenes, otros..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Fecha de seguimiento</label>
                  <input type="date" {...register('follow_up_date')} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Notas adicionales</label>
                <textarea {...register('notes')} rows={2} className={`${inputClass} resize-none`} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-brand-blue text-brand-lino py-3 font-opensans text-xs tracking-widest uppercase hover:bg-brand-tierra transition-colors cursor-pointer border-none disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar Tratamiento'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 border border-gray-200 text-brand-bruma hover:text-brand-blue font-opensans text-xs tracking-widest uppercase cursor-pointer bg-white">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Historial */}
      {loading ? (
        <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-20 bg-gray-50 animate-pulse border border-gray-100" />)}</div>
      ) : treatments.length === 0 ? (
        <div className="p-10 bg-gray-50 text-center border border-gray-100">
          <p className="font-opensans text-sm text-brand-bruma">Sin tratamientos registrados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {treatments.map((t) => (
            <div key={t.id} className="border border-gray-100 bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-cormorant text-base font-light text-brand-blue">
                    {format(new Date(t.treatment_date), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                  <p className="font-opensans text-xs text-brand-tierra tracking-wider">{t.service}</p>
                </div>
                {t.follow_up_date && (
                  <p className="font-opensans text-xs text-brand-bruma">
                    Seguimiento: {format(new Date(t.follow_up_date), "d MMM yyyy", { locale: es })}
                  </p>
                )}
              </div>

              {t.procedures && (
                <div className="mb-2">
                  <p className="font-opensans text-xs uppercase tracking-wider text-brand-tierra mb-1">Procedimientos</p>
                  <p className="font-opensans text-sm text-brand-blue">{t.procedures}</p>
                </div>
              )}

              {Array.isArray(t.medications) && t.medications.length > 0 && (
                <div>
                  <p className="font-opensans text-xs uppercase tracking-wider text-brand-tierra mb-2">Medicamentos</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-opensans">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['Medicamento', 'Dosis', 'Vía', 'Frecuencia', 'Duración'].map((h) => (
                            <th key={h} className="text-left py-1.5 pr-3 text-brand-bruma uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(t.medications as Medication[]).map((med, i) => (
                          <tr key={i} className="border-b border-gray-50">
                            <td className="py-1.5 pr-3 text-brand-blue font-medium">{med.name}</td>
                            <td className="py-1.5 pr-3 text-brand-tierra">{med.dose}</td>
                            <td className="py-1.5 pr-3 text-brand-tierra">{med.route}</td>
                            <td className="py-1.5 pr-3 text-brand-tierra">{med.frequency}</td>
                            <td className="py-1.5 text-brand-tierra">{med.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
