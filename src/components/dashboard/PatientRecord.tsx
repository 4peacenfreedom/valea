/**
 * components/dashboard/PatientRecord.tsx
 * Expediente completo del paciente con 6 pestañas.
 */
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Hash } from 'lucide-react'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { usePatient } from '../../hooks/usePatients'
import IdentificationTab from './tabs/IdentificationTab'
import MedicalHistoryTab from './tabs/MedicalHistoryTab'
import EvolutionNotesTab from './tabs/EvolutionNotesTab'
import TreatmentsTab from './tabs/TreatmentsTab'
import ConsentsTab from './tabs/ConsentsTab'
import AppointmentsTab from './tabs/AppointmentsTab'
import type { Patient } from '../../types'
import { cn } from '../../lib/utils'

const TABS = [
  'Identificación',
  'Historia Clínica',
  'Evolución',
  'Tratamientos',
  'Consentimientos',
  'Citas',
]

export default function PatientRecord() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { patient, loading, error, updatePatient } = usePatient(id)

  const handleSave = async (updates: Partial<Patient>) => {
    await updatePatient(updates)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-100 animate-pulse" />
        <div className="h-40 bg-white border border-gray-100 animate-pulse" />
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="p-8 bg-red-50 border border-red-100 text-center">
        <p className="font-opensans text-sm text-red-500">{error ?? 'Paciente no encontrado.'}</p>
        <button
          onClick={() => navigate('/dashboard/patients')}
          className="mt-4 font-opensans text-xs text-brand-blue hover:underline cursor-pointer border-none bg-transparent"
        >
          ← Volver a pacientes
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          onClick={() => navigate('/dashboard/patients')}
          className="flex items-center gap-2 font-opensans text-xs text-brand-bruma hover:text-brand-blue transition-colors cursor-pointer border-none bg-transparent"
        >
          <ArrowLeft size={14} />
          Todos los pacientes
        </button>

        <div className="flex-1">
          <h1 className="font-cormorant text-3xl font-light tracking-widest text-brand-blue uppercase">
            {patient.full_name}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            {patient.record_number && (
              <span className="flex items-center gap-1 font-opensans text-xs text-brand-bruma">
                <Hash size={10} />
                {patient.record_number}
              </span>
            )}
            {patient.id_number && (
              <span className="font-opensans text-xs text-brand-bruma">
                Cédula: {patient.id_number}
              </span>
            )}
            <span
              className={`font-opensans text-xs px-2 py-0.5 ${
                patient.active !== false
                  ? 'bg-green-50 text-green-600 border border-green-200'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {patient.active !== false ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabGroup>
        <TabList className="flex gap-0 border-b border-gray-200 overflow-x-auto">
          {TABS.map((tab) => (
            <Tab
              key={tab}
              className={({ selected }) =>
                cn(
                  'shrink-0 px-4 py-3 font-opensans text-xs tracking-wider uppercase transition-colors border-b-2 -mb-px cursor-pointer border-none bg-transparent',
                  selected
                    ? 'border-brand-blue text-brand-blue'
                    : 'border-transparent text-brand-bruma hover:text-brand-blue'
                )
              }
            >
              {tab}
            </Tab>
          ))}
        </TabList>

        <TabPanels className="mt-6">
          <TabPanel>
            <IdentificationTab patient={patient} onSave={handleSave} />
          </TabPanel>
          <TabPanel>
            <MedicalHistoryTab patient={patient} onSave={handleSave} />
          </TabPanel>
          <TabPanel>
            {id && <EvolutionNotesTab patientId={id} />}
          </TabPanel>
          <TabPanel>
            {id && <TreatmentsTab patientId={id} />}
          </TabPanel>
          <TabPanel>
            {id && <ConsentsTab patientId={id} />}
          </TabPanel>
          <TabPanel>
            <AppointmentsTab patientEmail={patient.email} />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  )
}
