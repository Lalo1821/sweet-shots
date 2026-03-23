/**
 * order-history.js — Historial de pedidos
 *
 * EXPLICACION:
 * Guarda los pedidos completados en localStorage, organizados por
 * la pubkey del usuario (su identidad en Nostr).
 *
 * Cada usuario ve solo SUS pedidos. Como la clave es la pubkey,
 * aunque otro usuario use la misma computadora, ve su propio historial.
 *
 * ESTRUCTURA en localStorage:
 * {
 *   "npub1abc...": [
 *     { id: "order_123", date: "2026-03-05", items: [...], total: 50000, ... },
 *     { id: "order_124", date: "2026-03-10", items: [...], total: 30000, ... }
 *   ],
 *   "npub1xyz...": [...]
 * }
 */

const STORAGE_KEY = 'sweetshots_orders';

/**
 * Leer todos los pedidos de localStorage
 */
function getAllOrders() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
}

/**
 * Guardar todos los pedidos en localStorage
 */
function saveAllOrders(orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export const orderHistory = {
  /**
   * Guardar un nuevo pedido
   *
   * @param {string} pubkey — Pubkey del usuario
   * @param {Object} order — Datos del pedido:
   *   - items: Array de items [{productId, quantity, priceUsd, priceSats}, ...]
   *   - totalUsd: Total en USD
   *   - totalSats: Total en sats
   *   - paymentMethod: 'lightning' o 'usd'
   *   - deliveryMethod: 'pickup' o 'delivery'
   *   - deliveryAddress: String (si es delivery)
   *   - customerName: Nombre del cliente
   *   - customerPhone: Telefono
   */
  addOrder(pubkey, order) {
    if (!pubkey) {
      // Guest: no guardar en localStorage (el pedido ya está en Supabase)
      return;
    }
    const allOrders = getAllOrders();

    // Crear array para este usuario si no existe
    if (!allOrders[pubkey]) {
      allOrders[pubkey] = [];
    }

    // Crear el pedido con ID y fecha automaticos
    const newOrder = {
      id: 'order_' + Date.now(),
      date: new Date().toISOString(),
      status: order.paymentMethod === 'lightning' ? 'paid' : 'pending',
      ...order,
    };

    // Agregar al inicio (el mas reciente primero)
    allOrders[pubkey].unshift(newOrder);

    saveAllOrders(allOrders);
    return newOrder;
  },

  /**
   * Obtener pedidos de un usuario
   *
   * @param {string} pubkey — Pubkey del usuario
   * @returns {Array} — Array de pedidos (el mas reciente primero)
   */
  getOrders(pubkey) {
    if (!pubkey) return [];
    const allOrders = getAllOrders();
    return allOrders[pubkey] || [];
  },

  /**
   * Obtener el total historico gastado en sats (para fidelidad)
   *
   * @param {string} pubkey — Pubkey del usuario
   * @returns {number} — Total de sats gastados
   */
  getTotalSpentSats(pubkey) {
    if (!pubkey) return 0;
    const orders = this.getOrders(pubkey);
    return orders
      .filter(order => order.status === 'paid')
      .reduce((total, order) => total + (order.totalSats || 0), 0);
  },
};
