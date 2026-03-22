// api/save-order-usd.js
// Guarda un pedido pagado en USD (via WhatsApp) en Supabase

import { getSupabase } from './lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderData } = req.body;

    if (!orderData) {
      return res.status(400).json({ error: 'orderData es requerido' });
    }

    const supabase = getSupabase();

    const { error } = await supabase.from('orders').insert({
      customer_name: orderData.customerName,
      customer_phone: orderData.customerPhone,
      nostr_pubkey: orderData.nostrPubkey || null,
      items: orderData.items,
      total_usd: orderData.totalUsd,
      total_sats: 0,
      delivery_method: orderData.deliveryMethod,
      delivery_address: orderData.deliveryAddress || null,
      payment_method: 'usd',
      payment_status: 'pending',
    });

    if (error) {
      console.error('[save-order-usd] Error Supabase:', error.message);
      return res.status(500).json({ error: 'Error guardando pedido' });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('[save-order-usd] Error:', error.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
