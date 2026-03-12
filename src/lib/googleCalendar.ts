/**
 * lib/googleCalendar.ts
 *
 * La creación de eventos en Google Calendar se realiza desde la Edge Function
 * notify-new-appointment usando una Service Account (GOOGLE_SERVICE_ACCOUNT_EMAIL,
 * GOOGLE_PRIVATE_KEY, GOOGLE_CALENDAR_ID). Las credenciales nunca salen del servidor.
 *
 * Esta función se mantiene como stub para compatibilidad con los formularios
 * que aún la importan. Retorna null — el evento ya será creado server-side
 * cuando el INSERT en Supabase dispare el webhook.
 */

export interface CalendarEventInput {
  patientName: string
  service: string
  date: string
  time: string
  phone: string
  email: string
  notes?: string
  confirmationNumber: string
  recordNumber?: string
  colorId?: string
}

/** @deprecated Creación de eventos manejada por la Edge Function. */
export async function createCalendarEvent(
  _input: CalendarEventInput
): Promise<string | null> {
  return null
}
