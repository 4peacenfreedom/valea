/**
 * components/dashboard/PatientList.tsx
 * Lista de pacientes con búsqueda en tiempo real y filtros.
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, ChevronRight, Circle } from 'lucide-react'
import { usePatients } from '../../hooks/usePatients'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type Filter = 'todos' | 'activos' | 'inactivos'

export default function PatientList() {
  const { patients, loading, error } = usePatients()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('activos')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return patients.filter((p) => {
      // Filtro por estado
      if (filter === 'activos' && p.active === false) return false
      if (filter === 'inactivos' && p.active !== false) return false

      // Búsqueda en tiempo real
      if (!q) return true
      return (
        p.full_name.toLowerCase().includes(q) ||
        (p.id_number ?? '').toLowerCase().includes(q) ||
        (p.phone ?? '').includes(q) ||
        (p.email ?? '').toLowerCase().includes(q)
      )
    })
  }, [patients, search, filter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-cormorant text-3xl font-light tracking-widest text-brand-blue uppercase">
            Pacientes
          </h1>
          <p className="font-opensans text-xs text-brand-bruma mt-1">
            {patients.length} pacientes registrados
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard/new-patient')}
          className="flex items-center gap-2 bg-brand-blue text-brand-lino px-5 py-3 font-opensans text-xs tracking-widest uppercase hover:bg-brand-tierra transition-colors duration-300 cursor-pointer border-none shrink-0"
        >
          <UserPlus size={15} />
          Nuevo Paciente
        </button>
      </div>

      {/* Buscador + filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-bruma" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, cédula o teléfono..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 font-opensans text-sm text-brand-blue focus:outline-none focus:border-brand-blue bg-white"
          />
        </div>

        {/* Filtros */}
        <div className="flex border border-gray-200 bg-white overflow-hidden">
          {(['todos', 'activos', 'inactivos'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-3 font-opensans text-xs tracking-wider capitalize cursor-pointer border-none transition-colors ${
                filter === f
                  ? 'bg-brand-blue text-brand-lino'
                  : 'text-brand-bruma hover:text-brand-blue bg-transparent'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-white border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-100 text-center">
          <p className="font-opensans text-sm text-red-500">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 bg-white border border-gray-100 text-center">
          <p className="font-opensans text-sm text-brand-bruma">
            {search ? 'No se encontraron resultados.' : 'Sin pacientes registrados.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 divide-y divide-gray-50">
          {/* Encabezado tabla desktop */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-gray-50">
            {['Paciente', 'Cédula', 'Teléfono', 'Registro', ''].map((h) => (
              <span key={h} className="font-opensans text-xs text-brand-bruma tracking-wider uppercase">
                {h}
              </span>
            ))}
          </div>

          {filtered.map((patient) => (
            <button
              key={patient.id}
              onClick={() => navigate(`/dashboard/patients/${patient.id}`)}
              className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer border-none bg-transparent group"
            >
              {/* Mobile */}
              <div className="md:hidden flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Circle
                      size={8}
                      className={patient.active !== false ? 'text-green-400 fill-green-400' : 'text-gray-300 fill-gray-300'}
                    />
                    <p className="font-opensans text-sm font-medium text-brand-blue">{patient.full_name}</p>
                  </div>
                  <p className="font-opensans text-xs text-brand-bruma mt-0.5">
                    {patient.id_number ?? '—'} · {patient.phone ?? '—'}
                  </p>
                </div>
                <ChevronRight size={16} className="text-brand-bruma group-hover:text-brand-blue shrink-0" />
              </div>

              {/* Desktop */}
              <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Circle
                    size={8}
                    className={patient.active !== false ? 'text-green-400 fill-green-400' : 'text-gray-300 fill-gray-300'}
                  />
                  <div>
                    <p className="font-opensans text-sm font-medium text-brand-blue">{patient.full_name}</p>
                    {patient.email && (
                      <p className="font-opensans text-xs text-brand-bruma">{patient.email}</p>
                    )}
                  </div>
                </div>
                <p className="font-opensans text-sm text-brand-tierra">{patient.id_number ?? '—'}</p>
                <p className="font-opensans text-sm text-brand-tierra">{patient.phone ?? '—'}</p>
                <p className="font-opensans text-xs text-brand-bruma">
                  {patient.created_at
                    ? format(new Date(patient.created_at), "d MMM yyyy", { locale: es })
                    : '—'}
                </p>
                <ChevronRight size={16} className="text-brand-bruma group-hover:text-brand-blue" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
