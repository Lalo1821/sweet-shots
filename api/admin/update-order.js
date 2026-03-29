// api/admin/update-order.js
//
// IMPORTANTE — Eduardo debe ejecutar este SQL en Supabase SQL Editor
// ANTES de usar este endpoint:
//
// ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
// ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
//   CHECK (payment_status IN ('pending', 'paid', 'processing', 'delivered', 'cancelled', 'expired'));
//

import { getSupabase } from '../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password, orderId, newStatus } = req.body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  const validStatuses = ['pending', 'paid', 'processing', 'delivered', 'cancelled'];
  if (!validStatuses.includes(newStatus)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  try {
    const supabase = getSupabase();

    const { error } = await supabase
      .from('orders')
      .update({ payment_status: newStatus })
      .eq('id', orderId);

    if (error) {
      console.error('[admin/update-order] Error Supabase:', error.message, error.details);
      return res.status(500).json({ error: 'Error actualizando pedido' });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('[admin/update-order] Error:', error.message);
    return res.status(500).json({ error: 'Error interno' });
  }
}
