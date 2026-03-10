/**
 * supabase/functions/notify-new-appointment/index.ts
 * Edge Function de Supabase para notificaciones automáticas de nuevas citas.
 *
 * Se activa mediante un Database Webhook en Supabase al INSERT en la tabla
 * `appointments`. Envía en paralelo:
 *   1. Email de confirmación al cliente (vía Resend)
 *   2. WhatsApp de alerta a la doctora (vía CallMeBot) — solo si status=pending
 *   3. WhatsApp de confirmación al cliente (vía CallMeBot) — si tiene número válido
 *
 * Diferencia entre flujos:
 *   status="pending"   → formulario público → notificar a doctora + cliente
 *   status="confirmed" → modal del dashboard → solo notificar al cliente
 *                        (la doctora ya está al tanto porque ella misma la agendó)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CONFIGURACIÓN REQUERIDA EN SUPABASE
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Variables de entorno (Supabase → Settings → Edge Functions → Secrets):
 *    RESEND_API_KEY         → API key de Resend.com
 *    DOCTOR_WHATSAPP_PHONE  → Número de la doctora con código país (+50670278704)
 *    DOCTOR_CALLMEBOT_KEY   → API key de CallMeBot de la doctora
 *    CLINIC_NAME            → VALEA Aesthetics
 *    DOCTOR_NAME            → Dra. Carolina Castillo Rodas
 *    FROM_EMAIL             → notificaciones@valeacr.com (dominio verificado en Resend)
 *
 * 2. Database Webhook (Supabase → Database → Webhooks → Create webhook):
 *    - Nombre: notify-new-appointment
 *    - Tabla: public.appointments
 *    - Evento: INSERT
 *    - Tipo: Supabase Edge Functions
 *    - Edge Function: notify-new-appointment
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
  appointment_time: string   // 'HH:MM'
  notes?: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  confirmation_number?: string
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: AppointmentRecord
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

/** Formatea 'HH:MM' → 'H:MM AM/PM' */
function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`
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

  // CallMeBot requiere que el número del cliente también esté registrado
  // en CallMeBot. Enviamos solo si el cliente tiene número válido.
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

  // Nota: el número del cliente requiere su propia API key de CallMeBot.
  // Por ahora se usa la API key de la doctora como fallback.
  // Para implementación completa, el cliente debe registrar su número en CallMeBot.
  await sendWhatsApp(appt.phone, doctorApiKey, message)
}

// ─── Handler principal ────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // Solo aceptar POST
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  let payload: WebhookPayload
  try {
    payload = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  // Solo procesar INSERT en appointments
  if (payload.type !== 'INSERT' || payload.table !== 'appointments') {
    return new Response('OK — evento ignorado', { status: 200 })
  }

  const appt = payload.record
  console.log(`[notify-new-appointment] Nueva cita: ${appt.confirmation_number} — ${appt.patient_name}`)

  // Ejecutar notificaciones en paralelo — los errores individuales no detienen el flujo
  const tasks: Promise<void>[] = [
    sendConfirmationEmail(appt).catch((e) =>
      console.error('[notify] Error en email:', e)
    ),
    notifyClient(appt).catch((e) =>
      console.error('[notify] Error en WhatsApp cliente:', e)
    ),
  ]

  // WhatsApp a la doctora solo cuando el cliente agenda desde el sitio (pending)
  // No cuando la doctora agenda desde el dashboard (confirmed)
  if (appt.status === 'pending') {
    tasks.push(
      notifyDoctor(appt).catch((e) =>
        console.error('[notify] Error en WhatsApp doctora:', e)
      )
    )
  }

  await Promise.all(tasks)

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
