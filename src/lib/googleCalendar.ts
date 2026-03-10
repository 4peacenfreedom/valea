/**
 * lib/googleCalendar.ts — Integración con Google Calendar API v3.
 * Responsabilidad única: crear eventos de cita en el calendario de VALEA.
 *
 * Limpieza realizada:
 *   - Se eliminó getOccupiedSlots() que intentaba leer disponibilidad desde
 *     Google Calendar con API Key. Esa lógica migró a useAvailability.ts,
 *     que consulta Supabase (fuente de verdad real del sistema).
 *   - Se eliminó el import dinámico de supabase que había quedado aquí.
 *
 * Nota: createCalendarEvent() requiere OAuth 2.0 para funcionar.
 * Una API Key sola no puede crear eventos (error 401/403).
 * Pendiente: configurar Google Apps Script o Supabase Edge Function como proxy.
 *
 * Variables de entorno requeridas:
 *   VITE_GOOGLE_CALENDAR_ID — ID del calendario
 *   VITE_GOOGLE_API_KEY     — API Key
 */

const CALENDAR_ID = import.meta.env.VITE_GOOGLE_CALENDAR_ID as string
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string

export interface CalendarEventInput {
  patientName: string
  service: string
  date: string              // 'YYYY-MM-DD'
  time: string              // 'HH:MM'
  phone: string
  email: string
  notes?: string
  confirmationNumber: string
  recordNumber?: string     // Número de expediente (solo desde dashboard)
  colorId?: string          // Color del evento (default: '5' banana, dashboard: '1' azul)
}

/**
 * Crea un evento de cita en Google Calendar.
 * Retorna el ID del evento creado, o null si falla.
 *
 * Falla silenciosamente — la cita ya está guardada en Supabase
 * independientemente del resultado de esta función.
 */
export async function createCalendarEvent(
  input: CalendarEventInput
): Promise<string | null> {
  if (!CALENDAR_ID || !API_KEY) {
    console.warn('Google Calendar no configurado — omitiendo creación de evento')
    return null
  }

  try {
    const startDateTime = `${input.date}T${input.time}:00-06:00`
    const [h, m] = input.time.split(':').map(Number)
    const endH = String(h + 1).padStart(2, '0')
    const endDateTime = `${input.date}T${endH}:${String(m).padStart(2, '0')}:00-06:00`

    const esDashboard = Boolean(input.recordNumber)
    const event = {
      summary: esDashboard
        ? `VALEA | ${input.patientName} — ${input.service}`
        : `Cita VALEA - ${input.patientName} - ${input.service}`,
      description: [
        `✅ Confirmación: #${input.confirmationNumber}`,
        `👤 Paciente: ${input.patientName}`,
        input.recordNumber ? `📋 Expediente: ${input.recordNumber}` : '',
        `💉 Servicio: ${input.service}`,
        `📞 Teléfono: ${input.phone}`,
        `📧 Email: ${input.email}`,
        input.notes ? `📝 Notas: ${input.notes}` : '',
        esDashboard ? '🖥️ Agendado por: Dashboard VALEA' : '',
      ]
        .filter(Boolean)
        .join('\n'),
      location: 'VALEA Aesthetics, Alajuela, Costa Rica',
      start: { dateTime: startDateTime, timeZone: 'America/Costa_Rica' },
      end: { dateTime: endDateTime, timeZone: 'America/Costa_Rica' },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 },
        ],
      },
      colorId: input.colorId ?? '5',
    }

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?key=${API_KEY}`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error('Google Calendar API error:', response.status, errBody)
      return null
    }

    const data = await response.json()
    return data.id as string
  } catch (error) {
    console.error('Error al crear evento en Google Calendar:', error)
    return null
  }
}
