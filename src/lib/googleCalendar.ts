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
  recordNumber?: string   // Número de expediente (solo desde dashboard)
  colorId?: string        // Color del evento en Google Calendar (default: '5')
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
      colorId: input.colorId ?? '5', // Default: Banana; Dashboard usa '1' (azul)
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

/**
 * Consulta Google Calendar y retorna los slots de 30 min ocupados en una fecha.
 * Usa el endpoint events.list con una API Key (requiere calendario público o compartido).
 * Retorna un array de strings en formato 'HH:MM'.
 */
export async function getOccupiedSlots(date: string): Promise<string[]> {
  if (!CALENDAR_ID || !API_KEY) return []

  try {
    const timeMin = encodeURIComponent(`${date}T00:00:00-06:00`)
    const timeMax = encodeURIComponent(`${date}T23:59:59-06:00`)
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?key=${API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&fields=items(start,end)`

    const res = await fetch(url)
    if (!res.ok) return []

    const data = await res.json()
    const events: { start: { dateTime: string }; end: { dateTime: string } }[] =
      data.items ?? []

    // Slots de 30 min que coinciden con algún evento
    const occupied: string[] = []

    for (const ev of events) {
      const evStart = new Date(ev.start.dateTime)
      const evEnd = new Date(ev.end.dateTime)

      // Generar todos los slots del día para verificar solapamiento
      const dateObj = new Date(date + 'T12:00:00') // hora neutra para evitar DST
      const isSat = dateObj.getDay() === 6
      const endHour = isSat ? 14 : 18

      for (let h = 9; h < endHour; h++) {
        for (const m of [0, 30]) {
          const slotStart = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00-06:00`)
          const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000)
          if (slotStart < evEnd && slotEnd > evStart) {
            occupied.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
          }
        }
      }
    }

    return [...new Set(occupied)]
  } catch (err) {
    console.warn('No se pudo verificar disponibilidad en Google Calendar:', err)
    return []
  }
}
