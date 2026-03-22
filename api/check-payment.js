// api/check-payment.js
// Verifica si un invoice fue pagado, actualiza Supabase, y notifica al dueño

import { getSupabase } from './lib/supabase.js';

const BLINK_API = 'https://api.blink.sv/graphql';
const RESEND_API = 'https://api.resend.com/emails';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentRequest } = req.body;

    if (!paymentRequest) {
      return res.status(400).json({ error: 'paymentRequest es requerido' });
    }

    // --- 1. Consultar estado del invoice en Blink ---
    const blinkResponse = await fetch(BLINK_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.BLINK_API_KEY,
      },
      body: JSON.stringify({
        query: `
          query LnInvoicePaymentStatus($input: LnInvoicePaymentStatusInput!) {
            lnInvoicePaymentStatus(input: $input) {
              status
              errors {
                message
              }
            }
          }
        `,
        variables: {
          input: { paymentRequest },
        },
      }),
    });

    const blinkData = await blinkResponse.json();
    const result = blinkData?.data?.lnInvoicePaymentStatus;

    if (!result) {
      return res.status(200).json({ paid: false });
    }

    const paid = result.status === 'PAID';

    // --- 2. Si está pagado, actualizar Supabase y notificar ---
    if (paid) {
      try {
        const supabase = getSupabase();

        // Buscar el pedido por payment_request
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .eq('payment_request', paymentRequest)
          .eq('payment_status', 'pending')
          .limit(1);

        if (orders && orders.length > 0) {
          const order = orders[0];

          // Actualizar estado a "paid"
          await supabase
            .from('orders')
            .update({ payment_status: 'paid' })
            .eq('id', order.id);

          // Enviar email al dueño
          await notifyOwner(order);
        }
      } catch (dbError) {
        // Si falla Supabase o el email, no bloqueamos la respuesta al frontend
        console.error('[check-payment] Error en post-pago:', dbError.message);
      }
    }

    return res.status(200).json({
      paid,
      status: result.status,
    });

  } catch (error) {
    console.error('[check-payment] Error:', error.message);
    return res.status(200).json({ paid: false });
  }
}

/**
 * Envía email al dueño de la pastelería con el detalle del pedido.
 * Usa Resend (100 emails/día gratis).
 */
async function notifyOwner(order) {
  const ownerEmail = process.env.OWNER_EMAIL;
  const resendKey = process.env.RESEND_API_KEY;

  if (!ownerEmail || !resendKey) {
    console.warn('[notify] Faltan OWNER_EMAIL o RESEND_API_KEY, no se envía email');
    return;
  }

  // Formatear items para el email
  const itemsList = order.items
    .map(item => `• ${item.name} x${item.quantity} — $${(item.priceUsd * item.quantity).toFixed(2)}`)
    .join('\n');

  const deliveryText = order.delivery_method === 'pickup'
    ? 'Retiro en local'
    : `Delivery a: ${order.delivery_address}`;

  const emailBody = `
🎂 ¡Nuevo pedido pagado con Lightning!

👤 Cliente: ${order.customer_name}
📱 Teléfono: ${order.customer_phone}

📦 Pedido:
${itemsList}

💰 Total: $${order.total_usd} USD (${order.total_sats.toLocaleString()} sats)
🚚 Entrega: ${deliveryText}

⚡ Pago confirmado automáticamente via Lightning Network.
  `.trim();

  try {
    await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'Sweet Shots <onboarding@resend.dev>',
        to: [ownerEmail],
        subject: `🎂 Nuevo pedido - ${order.customer_name} - $${order.total_usd} USD`,
        text: emailBody,
      }),
    });
  } catch (emailError) {
    console.error('[notify] Error enviando email:', emailError.message);
  }
}
