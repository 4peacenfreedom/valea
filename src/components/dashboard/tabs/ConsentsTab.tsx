/**
 * tabs/ConsentsTab.tsx — Tab 5: Documentos y consentimientos informados.
 */
import { useState, useEffect } from 'react'
import { CheckSquare, Square, FileText, Plus } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { Consent } from '../../../types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  patientId: string
}

// ── Templates de consentimiento pre-cargados ──────────────────────────────────
const CONSENT_TEMPLATES = [
  {
    type: 'Consentimiento General',
    text: `Yo, el/la abajo firmante, declaro que he sido informado/a por la Dra. Carolina Castillo Rodas (Código MED16178) sobre los tratamientos a realizar, sus beneficios, riesgos posibles y alternativas disponibles. Autorizo de forma voluntaria la realización del procedimiento indicado y me comprometo a seguir las indicaciones médicas post-procedimiento.`,
  },
  {
    type: 'Toxina Botulínica (Botox)',
    text: `Consiento la aplicación de toxina botulínica tipo A para el tratamiento de líneas de expresión y/o arrugas dinámicas. He sido informado/a sobre el mecanismo de acción, duración del efecto (3-6 meses), posibles efectos secundarios (equimosis, cefalea transitoria, ptosis palpebral excepcional) y contraindicaciones. Confirmo no estar embarazada, en lactancia, ni padecer enfermedades neuromusculares.`,
  },
  {
    type: 'Rellenos Dérmicos (Ácido Hialurónico)',
    text: `Autorizo la aplicación de rellenos dérmicos con ácido hialurónico para restaurar volumen y/o perfilar estructuras faciales. He sido informado/a sobre la naturaleza reabsorbible del producto, su duración variable (6-18 meses), y los posibles efectos como edema, equimosis, asimetría temporal o reacciones inflamatorias infrecuentes. Confirmo no tener antecedentes de reacciones alérgicas al ácido hialurónico.`,
  },
  {
    type: 'Procedimiento Estético General',
    text: `He sido adecuadamente informado/a sobre el procedimiento estético a realizar, incluyendo objetivo, técnica, cuidados pre y post procedimiento, y posibles riesgos. Entiendo que los resultados pueden variar según características individuales. Autorizo la documentación fotográfica con fines de seguimiento clínico y acepto los términos del tratamiento.`,
  },
]

export default function ConsentsTab({ patientId }: Props) {
  const [consents, setConsents] = useState<Consent[]>([])
  const [loading, setLoading] = useState(true)
  const [addingTemplate, setAddingTemplate] = useState<string | null>(null)

  useEffect(() => {
    fetchConsents()
  }, [patientId])

  const fetchConsents = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('consents')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
    setConsents(data || [])
    setLoading(false)
  }

  // Agregar template sin firmar
  const addConsent = async (template: typeof CONSENT_TEMPLATES[0]) => {
    setAddingTemplate(template.type)
    const { error } = await supabase.from('consents').insert([{
      patient_id: patientId,
      consent_type: template.type,
      consent_text: template.text,
    }])
    if (!error) await fetchConsents()
    setAddingTemplate(null)
  }

  // Marcar como firmado
  const signConsent = async (consent: Consent) => {
    const signed = !consent.signed_at
    const { error } = await supabase
      .from('consents')
      .update({
        signed_at: signed ? new Date().toISOString() : null,
        signed_by: signed ? 'Paciente' : null,
      })
      .eq('id', consent.id)

    if (!error) {
      setConsents((prev) =>
        prev.map((c) =>
          c.id === consent.id
            ? { ...c, signed_at: signed ? new Date().toISOString() : undefined, signed_by: signed ? 'Paciente' : undefined }
            : c
        )
      )
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="font-cormorant text-xl font-light tracking-wider text-brand-blue">
        Documentos y Consentimientos
      </h3>

      {/* Templates disponibles */}
      <div>
        <p className="font-opensans text-xs uppercase tracking-wider text-brand-tierra mb-3">
          Agregar consentimiento
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CONSENT_TEMPLATES.map((t) => {
            const alreadyAdded = consents.some((c) => c.consent_type === t.type)
            return (
              <button
                key={t.type}
                onClick={() => !alreadyAdded && addConsent(t)}
                disabled={alreadyAdded || addingTemplate === t.type}
                className={`flex items-center gap-3 px-4 py-3 border text-left transition-colors cursor-pointer ${
                  alreadyAdded
                    ? 'border-green-200 bg-green-50 text-green-600 cursor-default'
                    : 'border-gray-200 bg-white hover:border-brand-blue text-brand-blue'
                }`}
              >
                {alreadyAdded ? (
                  <CheckSquare size={15} className="shrink-0" />
                ) : (
                  <Plus size={15} className="shrink-0 text-brand-bruma" />
                )}
                <span className="font-opensans text-xs">{t.type}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Lista de consentimientos del paciente */}
      {loading ? (
        <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-20 bg-gray-50 animate-pulse border border-gray-100" />)}</div>
      ) : consents.length === 0 ? (
        <div className="p-10 bg-gray-50 border border-gray-100 text-center">
          <FileText size={32} className="text-brand-bruma mx-auto mb-3" strokeWidth={1} />
          <p className="font-opensans text-sm text-brand-bruma">Sin consentimientos registrados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {consents.map((consent) => (
            <div key={consent.id} className="border border-gray-100 bg-white">
              <div className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-opensans text-sm font-medium text-brand-blue">{consent.consent_type}</p>
                  {consent.signed_at ? (
                    <p className="font-opensans text-xs text-green-600 mt-0.5">
                      ✓ Firmado — {format(new Date(consent.signed_at), "d 'de' MMMM, yyyy · HH:mm", { locale: es })}
                    </p>
                  ) : (
                    <p className="font-opensans text-xs text-amber-500 mt-0.5">Pendiente de firma</p>
                  )}
                </div>

                {/* Toggle firma */}
                <button
                  onClick={() => signConsent(consent)}
                  className={`flex items-center gap-1.5 shrink-0 font-opensans text-xs px-3 py-2 border transition-colors cursor-pointer ${
                    consent.signed_at
                      ? 'border-green-200 bg-green-50 text-green-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500'
                      : 'border-gray-200 bg-white text-brand-blue hover:border-brand-blue'
                  }`}
                >
                  {consent.signed_at ? <CheckSquare size={13} /> : <Square size={13} />}
                  {consent.signed_at ? 'Firmado' : 'Marcar firmado'}
                </button>
              </div>

              {/* Texto del consentimiento (colapsable) */}
              {consent.consent_text && (
                <details className="px-5 pb-4">
                  <summary className="font-opensans text-xs text-brand-bruma cursor-pointer hover:text-brand-blue">
                    Ver texto completo
                  </summary>
                  <p className="font-opensans text-xs text-brand-tierra/80 mt-2 leading-relaxed border-l-2 border-brand-arena pl-3">
                    {consent.consent_text}
                  </p>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
