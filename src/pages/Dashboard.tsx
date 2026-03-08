// Dashboard — Parte 2 del proyecto
// Se implementará en el siguiente sprint con:
// - Lista de pacientes
// - Expedientes médicos
// - Gestión de citas
// - Autenticación

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-brand-lino flex items-center justify-center">
      <div className="text-center px-6">
        <p className="font-opensans text-xs tracking-[0.3em] uppercase text-brand-tierra mb-4">
          Próximamente
        </p>
        <h1 className="font-cormorant text-4xl font-light tracking-widest text-brand-blue mb-4">
          Panel de Administración
        </h1>
        <p className="font-opensans text-sm text-brand-bruma max-w-sm">
          El módulo de gestión de pacientes y expedientes estará disponible pronto.
        </p>
        <a
          href="/"
          className="inline-block mt-8 font-opensans text-xs tracking-widest uppercase text-brand-tierra border border-brand-bruma/40 px-6 py-3 hover:border-brand-tierra transition-colors duration-300"
        >
          Volver al sitio
        </a>
      </div>
    </div>
  )
}
