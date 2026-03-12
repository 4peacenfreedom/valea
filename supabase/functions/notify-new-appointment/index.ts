/**
 * supabase/functions/notify-new-appointment/index.ts
 * Edge Function de Supabase para notificaciones automáticas de citas.
 *
 * Se activa mediante Database Webhooks en la tabla `appointments`.
 * Por cada evento ejecuta en paralelo:
 *   1. Email de confirmación al cliente (vía Resend)
 *   2. WhatsApp de alerta a la doctora (vía CallMeBot) — solo en INSERT pending
 *   3. WhatsApp de confirmación al cliente (vía CallMeBot)
 *   4. Evento en Google Calendar (vía Service Account JWT)
 *
 * Flujos:
 *   INSERT status="pending"   → formulario público → email + WhatsApp doctora + WhatsApp cliente + Calendar
 *   INSERT status="confirmed" → dashboard (doctora) → email + WhatsApp cliente + Calendar
 *   UPDATE pending→confirmed  → doctora aprueba cita → email + WhatsApp cliente + Calendar
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CONFIGURACIÓN REQUERIDA EN SUPABASE
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Variables de entorno (Supabase → Settings → Edge Functions → Secrets):
 *    RESEND_API_KEY                → API key de Resend.com
 *    DOCTOR_WHATSAPP_PHONE         → Número de la doctora con código país
 *    DOCTOR_CALLMEBOT_KEY          → API key de CallMeBot de la doctora
 *    CLINIC_NAME                   → VALEA Aesthetics
 *    DOCTOR_NAME                   → Dra. Carolina Castillo Rodas
 *    FROM_EMAIL                    → notificaciones@valeacr.com
 *    GOOGLE_SERVICE_ACCOUNT_EMAIL  → email de la service account
 *    GOOGLE_PRIVATE_KEY            → clave privada PEM (con \n como texto literal)
 *    GOOGLE_CALENDAR_ID            → ID del calendario de Google
 *
 * 2. Database Webhooks (Supabase → Database → Webhooks):
 *    Webhook A — nueva cita:
 *    - Nombre: notify-new-appointment
 *    - Tabla: public.appointments  |  Evento: INSERT
 *    - Tipo: Supabase Edge Functions  |  Edge Function: notify-new-appointment
 *
 *    Webhook B — cita confirmada:
 *    - Nombre: notify-appointment-confirmed
 *    - Tabla: public.appointments  |  Evento: UPDATE
 *    - Tipo: Supabase Edge Functions  |  Edge Function: notify-new-appointment
 *
 * 3. Deploy (desde la raíz del proyecto):
 *    npx supabase functions deploy notify-new-appointment
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface AppointmentRecord {
  id: string
  patient_name: string
  phone: string
  email: string
  service: string
  appointment_date: string   // 'YYYY-MM-DD'
  appointment_time: string   // 'HH:MM' o 'HH:MM:SS'
  notes?: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  confirmation_number?: string
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: AppointmentRecord
  old_record?: AppointmentRecord
  schema: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formatea 'YYYY-MM-DD' → 'lunes DD de mes, YYYY' en español */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('es-CR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Formatea 'HH:MM' o 'HH:MM:SS' → 'H:MM AM/PM' */
function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`
}

/** Normaliza 'HH:MM:SS' → 'HH:MM' */
function normalizeTime(timeStr: string): string {
  return timeStr.substring(0, 5)
}

// ─── Google Calendar ───────────────────────────────────────────────────────────

/**
 * Obtiene un access token de Google usando una Service Account via JWT (RS256).
 */
async function getGoogleAccessToken(
  serviceAccountEmail: string,
  privateKeyPem: string
): Promise<string | null> {
  try {
    // Reemplazar \n literal por saltos de línea reales
    const privateKey = privateKeyPem.replace(/\\n/g, '\n')

    const now = Math.floor(Date.now() / 1000)

    // Encodear a base64url
    const b64url = (obj: unknown) =>
      btoa(JSON.stringify(obj))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

    const header = b64url({ alg: 'RS256', typ: 'JWT' })
    const payload = b64url({
      iss: serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/calendar',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    })

    const signingInput = `${header}.${payload}`

    // Decodificar la clave privada PEM a ArrayBuffer
    const pemBody = privateKey
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '')
    const keyBuffer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0))

    // Importar la clave privada
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      keyBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    )

    // Firmar
    const encoder = new TextEncoder()
    const signatureBuffer = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      encoder.encode(signingInput)
    )

    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    const jwt = `${signingInput}.${signature}`

    // Intercambiar JWT por access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    })

    if (!tokenRes.ok) {
      console.error('[Calendar] Error obteniendo access token:', await tokenRes.text())
      return null
    }

    const tokenData = await tokenRes.json()
    return tokenData.access_token as string
  } catch (err) {
    console.error('[Calendar] Error en autenticación JWT:', err)
    return null
  }
}

/**
 * Crea un evento en Google Calendar usando la Service Account.
 * Falla silenciosamente — la cita ya está en Supabase.
 */
async function createGoogleCalendarEvent(appt: AppointmentRecord): Promise<void> {
  const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')
  const privateKeyRaw = Deno.env.get('GOOGLE_PRIVATE_KEY')
  const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID')

  if (!serviceAccountEmail || !privateKeyRaw || !calendarId) {
    console.log('[Calendar] Variables no configuradas — omitiendo evento')
    return
  }

  try {
    const accessToken = await getGoogleAccessToken(serviceAccountEmail, privateKeyRaw)
    if (!accessToken) return

    const time = normalizeTime(appt.appointment_time)
    const [h, m] = time.split(':').map(Number)
    const endH = String(h + 1).padStart(2, '0')
    const endTime = `${endH}:${String(m).padStart(2, '0')}`

    const event = {
      summary: `VALEA | ${appt.patient_name} — ${appt.service}`,
      description: [
        `Paciente: ${appt.patient_name}`,
        `Teléfono: ${appt.phone}`,
        `Email: ${appt.email}`,
        `Servicio: ${appt.service}`,
        appt.notes ? `Notas: ${appt.notes}` : '',
        `Ref: #${appt.confirmation_number ?? '—'}`,
      ]
        .filter(Boolean)
        .join('\n'),
      start: {
        dateTime: `${appt.appointment_date}T${time}:00`,
        timeZone: 'America/Costa_Rica',
      },
      end: {
        dateTime: `${appt.appointment_date}T${endTime}:00`,
        timeZone: 'America/Costa_Rica',
      },
      location: 'VALEA Aesthetics, Alajuela, Costa Rica',
      colorId: '1',
    }

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    )

    if (!res.ok) {
      console.error('[Calendar] Error al crear evento:', res.status, await res.text())
    } else {
      const data = await res.json()
      console.log('[Calendar] Evento creado:', data.id)
    }
  } catch (err) {
    console.error('[Calendar] Error inesperado:', err)
  }
}

// ─── Notificaciones ───────────────────────────────────────────────────────────

/**
 * Envía email de confirmación al cliente vía Resend.
 */
async function sendConfirmationEmail(appt: AppointmentRecord): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'notificaciones@valeacr.com'
  const clinicName = Deno.env.get('CLINIC_NAME') ?? 'VALEA Aesthetics'
  const doctorName = Deno.env.get('DOCTOR_NAME') ?? 'Dra. Carolina Castillo Rodas'

  if (!apiKey || !appt.email) return

  const fecha = formatDate(appt.appointment_date)
  const hora = formatTime(appt.appointment_time)
  const firstName = appt.patient_name.split(' ')[0]
  const confirmNum = appt.confirmation_number ?? '—'
  const statusLabel = appt.status === 'confirmed' ? 'Confirmada' : 'Pendiente de confirmación'

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cita Confirmada — ${clinicName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f0;font-family:'Open Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#FAF9F6;max-width:580px;">

          <!-- Header -->
          <tr>
            <td style="background:#1C4BA7;padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#D1BAA6;font-family:Georgia,serif;font-size:28px;font-weight:300;letter-spacing:6px;text-transform:uppercase;">
                VALEA
              </p>
              <p style="margin:4px 0 0;color:rgba(250,249,246,0.6);font-size:11px;letter-spacing:3px;text-transform:uppercase;">
                Aesthetics
              </p>
            </td>
          </tr>

          <!-- Ícono de check -->
          <tr>
            <td style="padding:40px 40px 0;text-align:center;">
              <div style="width:64px;height:64px;border-radius:50%;background:#e8f5e9;margin:0 auto;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:32px;">✅</span>
              </div>
            </td>
          </tr>

          <!-- Saludo y título -->
          <tr>
            <td style="padding:24px 40px 0;text-align:center;">
              <h1 style="margin:0;color:#1C4BA7;font-family:Georgia,serif;font-size:26px;font-weight:300;letter-spacing:2px;">
                ¡Cita ${statusLabel}!
              </h1>
              <p style="margin:12px 0 0;color:#8B6D53;font-size:14px;line-height:1.6;">
                Hola <strong>${firstName}</strong>, tu cita ha sido registrada exitosamente.
              </p>
            </td>
          </tr>

          <!-- Detalle de la cita -->
          <tr>
            <td style="padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="border:1px solid #D1BAA6;border-collapse:collapse;">
                ${[
                  ['🔖 Número de confirmación', confirmNum],
                  ['💉 Servicio', appt.service],
                  ['📅 Fecha', fecha],
                  ['⏰ Hora', hora],
                  ['📍 Lugar', 'VALEA Aesthetics — Alajuela, Costa Rica'],
                  ['📋 Estado', statusLabel],
                ].map(([label, value]) => `
                  <tr>
                    <td style="padding:10px 16px;border-bottom:1px solid #f0ede8;background:#faf9f6;">
                      <span style="font-size:12px;color:#929471;text-transform:uppercase;letter-spacing:1px;">${label}</span>
                    </td>
                    <td style="padding:10px 16px;border-bottom:1px solid #f0ede8;text-align:right;">
                      <span style="font-size:13px;color:#1C4BA7;font-weight:500;">${value}</span>
                    </td>
                  </tr>`).join('')}
              </table>
            </td>
          </tr>

          <!-- Recordatorio -->
          <tr>
            <td style="padding:0 40px 32px;">
              <p style="margin:0;color:#8B6D53;font-size:13px;line-height:1.7;text-align:center;">
                Recuerda llegar <strong>10 minutos antes</strong> de tu cita.<br />
                Si necesitas cancelar o reagendar, contáctanos:
              </p>
              <p style="margin:16px 0 0;text-align:center;">
                <a href="tel:+50670278704" style="color:#1C4BA7;font-size:13px;text-decoration:none;">📞 7027-8704</a>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <a href="mailto:info@valeacr.com" style="color:#1C4BA7;font-size:13px;text-decoration:none;">📧 info@valeacr.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1C4BA7;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:rgba(250,249,246,0.7);font-size:12px;">
                ${doctorName} · ${clinicName}
              </p>
              <p style="margin:6px 0 0;color:rgba(250,249,246,0.4);font-size:11px;letter-spacing:1px;">
                Alajuela, Costa Rica
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${clinicName} <${fromEmail}>`,
      to: [appt.email],
      subject: `✅ Tu cita en ${clinicName} — ${fecha}`,
      html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[Resend] Error al enviar email:', res.status, body)
  } else {
    console.log('[Resend] Email enviado a', appt.email)
  }
}

/**
 * Envía notificación WhatsApp vía CallMeBot.
 */
async function sendWhatsApp(
  phone: string,
  apiKey: string,
  message: string
): Promise<void> {
  const encodedPhone = encodeURIComponent(phone)
  const encodedMsg = encodeURIComponent(message)
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodedPhone}&text=${encodedMsg}&apikey=${apiKey}`

  try {
    await fetch(url)
    console.log('[CallMeBot] WhatsApp enviado a', phone)
  } catch (err) {
    console.error('[CallMeBot] Error:', err)
  }
}

/**
 * Alerta WhatsApp a la doctora cuando llega una nueva cita del formulario público.
 */
async function notifyDoctor(appt: AppointmentRecord): Promise<void> {
  const phone = Deno.env.get('DOCTOR_WHATSAPP_PHONE')
  const apiKey = Deno.env.get('DOCTOR_CALLMEBOT_KEY')
  if (!phone || !apiKey) return

  const message = [
    '🏥 *Nueva Cita VALEA*',
    `👤 Paciente: ${appt.patient_name}`,
    `📅 Fecha: ${formatDate(appt.appointment_date)}`,
    `⏰ Hora: ${formatTime(appt.appointment_time)}`,
    `💉 Servicio: ${appt.service}`,
    `📞 Tel: ${appt.phone}`,
    `📧 ${appt.email}`,
    `🔖 Confirmación: #${appt.confirmation_number ?? '—'}`,
    '',
    '_Agendado desde el sitio web_',
  ].join('\n')

  await sendWhatsApp(phone, apiKey, message)
}

/**
 * Confirmación WhatsApp al cliente.
 */
async function notifyClient(appt: AppointmentRecord): Promise<void> {
  const doctorApiKey = Deno.env.get('DOCTOR_CALLMEBOT_KEY')
  const clinicName = Deno.env.get('CLINIC_NAME') ?? 'VALEA Aesthetics'

  if (!appt.phone || !doctorApiKey) return

  const firstName = appt.patient_name.split(' ')[0]
  const message = [
    `✅ *Cita Confirmada — ${clinicName}*`,
    '',
    `Hola ${firstName} 👋`,
    `Tu cita quedó agendada:`,
    `📅 ${formatDate(appt.appointment_date)}`,
    `⏰ ${formatTime(appt.appointment_time)}`,
    `💉 ${appt.service}`,
    `📍 Alajuela, Costa Rica`,
    `🔖 Ref: #${appt.confirmation_number ?? '—'}`,
    '',
    '_Recuerda llegar 10 min antes._',
    `Consultas: 7027-8704`,
  ].join('\n')

  await sendWhatsApp(appt.phone, doctorApiKey, message)
}

// ─── Handler principal ────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  let payload: WebhookPayload
  try {
    payload = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (payload.table !== 'appointments') {
    return new Response('OK — evento ignorado', { status: 200 })
  }

  const appt = payload.record
  const tasks: Promise<void>[] = []

  // ── Caso 1: nueva cita (INSERT) ───────────────────────────────────────────
  if (payload.type === 'INSERT') {
    console.log(`[notify] INSERT — ${appt.confirmation_number} — ${appt.patient_name}`)

    tasks.push(
      sendConfirmationEmail(appt).catch((e) =>
        console.error('[notify] Error en email:', e)
      ),
      notifyClient(appt).catch((e) =>
        console.error('[notify] Error en WhatsApp cliente:', e)
      ),
      createGoogleCalendarEvent(appt).catch((e) =>
        console.error('[notify] Error en Google Calendar:', e)
      )
    )

    // WhatsApp a la doctora solo cuando el cliente agenda desde el sitio (pending)
    if (appt.status === 'pending') {
      tasks.push(
        notifyDoctor(appt).catch((e) =>
          console.error('[notify] Error en WhatsApp doctora:', e)
        )
      )
    }

  // ── Caso 2: cita aprobada (UPDATE pending → confirmed) ────────────────────
  } else if (
    payload.type === 'UPDATE' &&
    payload.old_record?.status !== 'confirmed' &&
    appt.status === 'confirmed'
  ) {
    console.log(`[notify] UPDATE confirmed — ${appt.confirmation_number} — ${appt.patient_name}`)

    tasks.push(
      sendConfirmationEmail(appt).catch((e) =>
        console.error('[notify] Error en email confirmación:', e)
      ),
      notifyClient(appt).catch((e) =>
        console.error('[notify] Error en WhatsApp cliente confirmación:', e)
      ),
      createGoogleCalendarEvent(appt).catch((e) =>
        console.error('[notify] Error en Google Calendar confirmación:', e)
      )
    )

  } else {
    return new Response('OK — evento ignorado', { status: 200 })
  }

  await Promise.all(tasks)

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
