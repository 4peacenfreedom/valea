/**
 * pages/Dashboard.tsx — Punto de entrada del dashboard médico.
 * Actúa como router de sub-vistas. Protegido por PrivateRoute.
 */
import { Routes, Route } from 'react-router-dom'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import Overview from '../components/dashboard/Overview'
import PatientList from '../components/dashboard/PatientList'
import PatientRecord from '../components/dashboard/PatientRecord'
import NewPatientForm from '../components/dashboard/NewPatientForm'
import AppointmentsList from '../components/dashboard/AppointmentsList'

export default function Dashboard() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Overview />} />
        <Route path="patients" element={<PatientList />} />
        <Route path="patients/:id" element={<PatientRecord />} />
        <Route path="appointments" element={<AppointmentsList />} />
        <Route path="new-patient" element={<NewPatientForm />} />
      </Route>
    </Routes>
  )
}
