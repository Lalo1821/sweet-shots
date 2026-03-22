/**
 * lightning.js — Servicios de pago Lightning
 *
 * EXPLICACION:
 * Este modulo maneja todo lo relacionado con pagos Lightning:
 *
 * 1. TIPO DE CAMBIO: Obtiene el precio actual de Bitcoin en USD
 *    para poder convertir precios de USD a sats y viceversa.
 *
 * 2. GENERAR INVOICES: Crea facturas Lightning via el servidor Vercel.
 *
 * 3. PAGO CON WEBLN: Si el cliente tiene una wallet en el navegador
 *    (como Alby), puede pagar con un solo click.
 *
 * ¿Que es un "sat" (satoshi)?
 * Es la unidad mas pequena de Bitcoin. 1 Bitcoin = 100,000,000 sats.
 * Si Bitcoin vale $100,000 USD, entonces 1 sat ≈ $0.001 USD.
 *
 * ¿Que es un Invoice?
 * Es un string que empieza con "lnbc..." y codifica un pedido de pago.
 * Contiene: cuanto pagar, a quien, y una descripcion.
 */

import { config } from '../data/config.js';

// ============================================================
// Funciones que usan el servidor Vercel para pagos
// ============================================================

/**
 * Crea un invoice Lightning via el servidor Vercel.
 * El servidor habla con Blink y guarda el pedido en Supabase.
 *
 * @param {number} amountSats - Monto en satoshis
 * @param {string} description - Descripción del pedido
 * @param {Object} orderData - Datos del pedido (cliente, items, entrega)
 * @returns {Object} { paymentRequest, paymentHash }
 */
export async function createServerInvoice(amountSats, description = '', orderData = null) {
  const response = await fetch('/api/create-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amountSats, description, orderData })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error del servidor: ${response.status}`);
  }

  return await response.json();
}

/**
 * Verifica si un invoice fue pagado consultando al servidor Vercel.
 * El servidor consulta a Blink el estado del invoice.
 *
 * @param {Object} invoiceData - Datos retornados por createServerInvoice
 * @returns {Object} { paid: boolean, status: string }
 */
export async function checkServerPayment(invoiceData) {
  const response = await fetch('/api/check-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentRequest: invoiceData.paymentRequest
    })
  });

  if (!response.ok) {
    return { paid: false };
  }

  return await response.json();
}

// Cache del tipo de cambio (para no llamar a la API en cada producto)
let btcPriceUsd = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

export const lightning = {
  /**
   * Obtener el precio actual de Bitcoin en USD
   *
   * Usa la API de CoinGecko (gratis, no requiere API key).
   * Cachea el resultado por 5 minutos para no hacer muchas llamadas.
   *
   * @returns {number} — Precio de 1 BTC en USD (ej: 100000)
   */
  async getBtcPrice() {
    const now = Date.now();

    // Si tenemos un precio cacheado y no expiro, usarlo
    if (btcPriceUsd && (now - lastFetchTime) < CACHE_DURATION) {
      return btcPriceUsd;
    }

    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      );
      const data = await response.json();
      btcPriceUsd = data.bitcoin.usd;
      lastFetchTime = now;
      return btcPriceUsd;
    } catch (error) {
      // Si falla la API, usar un precio de fallback
      console.warn('No se pudo obtener precio de BTC, usando fallback');
      if (btcPriceUsd) return btcPriceUsd; // Usar el ultimo precio conocido
      return 100000; // Fallback: $100,000 USD
    }
  },

  /**
   * Convertir USD a satoshis
   *
   * Formula: sats = (usd / btcPriceUsd) * 100,000,000
   *
   * @param {number} usd — Cantidad en dolares
   * @returns {number} — Cantidad en satoshis (redondeado)
   */
  async usdToSats(usd) {
    const btcPrice = await this.getBtcPrice();
    // 1 BTC = 100,000,000 sats
    return Math.round((usd / btcPrice) * 100_000_000);
  },

  /**
   * Formatear sats para mostrar (ej: 25000 -> "25,000")
   * @param {number} sats
   * @returns {string}
   */
  formatSats(sats) {
    return sats.toLocaleString('es-AR');
  },

  /**
   * Intentar pagar con WebLN (wallet del navegador)
   *
   * WebLN es un estandar que permite que wallets como Alby
   * paguen directamente desde el navegador, sin escanear QR.
   *
   * @param {string} paymentRequest — Invoice bolt11 (el string "lnbc...")
   * @returns {Object|null} — Resultado del pago o null si no hay WebLN
   */
  async payWithWebLN(paymentRequest) {
    if (!window.webln) {
      return null; // No hay wallet WebLN disponible
    }

    try {
      await window.webln.enable();
      const result = await window.webln.sendPayment(paymentRequest);
      return result; // { preimage: '...' } = pago exitoso
    } catch (error) {
      console.warn('Pago WebLN cancelado o fallido:', error.message);
      return null;
    }
  },

  /**
   * Generar URL de WhatsApp para pagos en USD
   *
   * @param {number} totalUsd — Total en dolares
   * @param {string} orderDetails — Detalle del pedido
   * @returns {string} — URL de WhatsApp
   */
  getWhatsAppPaymentUrl(totalUsd, orderDetails) {
    const message = encodeURIComponent(
      `${config.whatsappMessage}\n\nPedido: ${orderDetails}\nTotal: $${totalUsd.toFixed(2)} USD`
    );
    const phone = config.whatsappNumber.replace(/\+/g, '');
    return `https://wa.me/${phone}?text=${message}`;
  },
};
