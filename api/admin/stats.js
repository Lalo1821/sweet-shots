// api/admin/stats.js
import { getSupabase } from '../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  try {
    const supabase = getSupabase();

    // Todos los pedidos pagados
    const { data: paidOrders, error } = await supabase
      .from('orders')
      .select('total_usd, total_sats, payment_method, items, created_at')
      .in('payment_status', ['paid', 'processing', 'delivered']);

    if (error) {
      console.error('[admin/stats] Error Supabase:', error.message);
      return res.status(500).json({ error: 'Error consultando estadísticas' });
    }

    const orders = paidOrders || [];

    // Calcular estadísticas
    const totalOrders = orders.length;
    const totalUsd = orders.reduce((sum, o) => sum + parseFloat(o.total_usd || 0), 0);
    const totalSats = orders.reduce((sum, o) => sum + (o.total_sats || 0), 0);
    const lightningOrders = orders.filter(o => o.payment_method === 'lightning').length;
    const usdOrders = orders.filter(o => o.payment_method === 'usd').length;

    // Producto más vendido
    const productCount = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        const key = item.name || item.productId;
        productCount[key] = (productCount[key] || 0) + (item.quantity || 1);
      });
    });
    const topProduct = Object.entries(productCount)
      .sort((a, b) => b[1] - a[1])[0] || null;

    // Pedidos hoy
    const today = new Date().toISOString().split('T')[0];
    const ordersToday = orders.filter(o => o.created_at?.startsWith(today)).length;

    return res.status(200).json({
      totalOrders,
      totalUsd: totalUsd.toFixed(2),
      totalSats,
      lightningOrders,
      usdOrders,
      ordersToday,
      topProduct: topProduct ? { name: topProduct[0], count: topProduct[1] } : null,
    });

  } catch (error) {
    console.error('[admin/stats] Error:', error.message);
    return res.status(500).json({ error: 'Error interno' });
  }
}
