/**
 * lib/whatsapp.ts — Notificación por WhatsApp vía CallMeBot
 *
 * CallMeBot es gratuito y permite enviar mensajes WhatsApp a un número registrado.
 * Registro: https://www.callmebot.com/blog/free-api-whatsapp-messages/
 *
 * Variables de entorno requeridas:
 *   VITE_WHATSAPP_PHONE    — Número de la doctora con código país: +50670278704
 *   VITE_CALLMEBOT_APIKEY  — API key recibida por WhatsApp al registrarse
 */

const DOCTOR_PHONE = import.meta.env.VITE_WHATSAPP_PHONE as string
const CALLMEBOT_KEY = import.meta.env.VITE_CALLMEBOT_APIKEY as string

export interface WhatsAppNotificationInput {
  patientName: string
  service: string
  date: string          // formato legible: 'lunes 12 de junio, 2025'
  time: string          // formato legible: '10:00 AM'
  phone: string
  email: string
  confirmationNumber: string
}

/**
 * Envía una notificación WhatsApp a la doctora cuando se agenda una nueva cita.
 * Usa la API de CallMeBot (GET request con URL encoding).
 */
export async function sendWhatsAppNotification(
  input: WhatsAppNotificationInput
): Promise<boolean> {
  if (!DOCTOR_PHONE || !CALLMEBOT_KEY) {
    console.warn('WhatsApp/CallMeBot no configurado — omitiendo notificación')
    return false
  }

  const message = [
    '🏥 *Nueva Cita VALEA*',
    `👤 Paciente: ${input.patientName}`,
    `📅 Fecha: ${input.date}`,
    `⏰ Hora: ${input.time}`,
    `💉 Servicio: ${input.service}`,
    `📞 Tel: ${input.phone}`,
    `📧 ${input.email}`,
    `✅ Confirmación #${input.confirmationNumber}`,
  ].join('\n')

  try {
    const encodedMessage = encodeURIComponent(message)
    const encodedPhone = encodeURIComponent(DOCTOR_PHONE)
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodedPhone}&text=${encodedMessage}&apikey=${CALLMEBOT_KEY}`

    // CallMeBot requiere fetch en modo no-cors desde el navegador
    await fetch(url, { method: 'GET', mode: 'no-cors' })
    return true
  } catch (error) {
    console.error('Error al enviar notificación WhatsApp:', error)
    return false
  }
}
