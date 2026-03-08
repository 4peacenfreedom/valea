/**
 * lib/googleCalendar.ts — Integración con Google Calendar API v3
 * Crea eventos de cita en el calendario de VALEA Aesthetics.
 *
 * Variables de entorno requeridas:
 *   VITE_GOOGLE_CALENDAR_ID — ID del calendario (e.g. xxx@group.calendar.google.com)
 *   VITE_GOOGLE_API_KEY     — API Key con acceso a Calendar API v3
 *
 * Nota: Para producción se recomienda mover a Supabase Edge Function
 * para no exponer el API key en el cliente.
 */

const CALENDAR_ID = import.meta.env.VITE_GOOGLE_CALENDAR_ID as string
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string

export interface CalendarEventInput {
  patientName: string
  service: string
  date: string        // 'YYYY-MM-DD'
  time: string        // 'HH:MM'
  phone: string
  email: string
  notes?: string
  confirmationNumber: string
}

/**
 * Crea un evento de cita en Google Calendar.
 * Retorna el ID del evento creado, o null si falla.
 */
export async function createCalendarEvent(
  input: CalendarEventInput
): Promise<string | null> {
  if (!CALENDAR_ID || !API_KEY) {
    console.warn('Google Calendar no configurado — omitiendo creación de evento')
    return null
  }

  try {
    // Construcción de fechas ISO 8601 con timezone de Costa Rica (UTC-6)
    const startDateTime = `${input.date}T${input.time}:00-06:00`
    // Duración por defecto: 1 hora
    const [h, m] = input.time.split(':').map(Number)
    const endH = String(h + 1).padStart(2, '0')
    const endDateTime = `${input.date}T${endH}:${String(m).padStart(2, '0')}:00-06:00`

    const event = {
      summary: `Cita VALEA - ${input.patientName} - ${input.service}`,
      description: [
        `✅ Confirmación: #${input.confirmationNumber}`,
        `👤 Paciente: ${input.patientName}`,
        `💉 Servicio: ${input.service}`,
        `📞 Teléfono: ${input.phone}`,
        `📧 Correo: ${input.email}`,
        input.notes ? `📝 Notas: ${input.notes}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      location: 'VALEA Aesthetics, Alajuela, Costa Rica',
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Costa_Rica',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Costa_Rica',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },  // 24 horas antes
          { method: 'popup', minutes: 60 },         // 1 hora antes
        ],
      },
      colorId: '5', // Banana (amarillo suave)
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
