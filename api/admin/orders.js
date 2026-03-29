// api/admin/orders.js
import { getSupabase } from '../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password, status, limit } = req.body;

  // Validar contraseña
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  try {
    const supabase = getSupabase();

    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit || 50);

    // Filtrar por estado si se especifica
    if (status && status !== 'all') {
      query = query.eq('payment_status', status);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('[admin/orders] Error Supabase:', error.message);
      return res.status(500).json({ error: 'Error consultando pedidos' });
    }

    return res.status(200).json({ orders: orders || [] });

  } catch (error) {
    console.error('[admin/orders] Error:', error.message);
    return res.status(500).json({ error: 'Error interno' });
  }
}
