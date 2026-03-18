/**
 * zap-listener.js — Detectar pagos Lightning via NIP-57 Zap Receipts
 *
 * EXPLICACION:
 * Cuando un usuario paga un invoice creado con zap request (NIP-57),
 * el proveedor (ej: Wallet of Satoshi) publica un "zap receipt"
 * (evento kind 9735) en los relays de Nostr.
 *
 * Este servicio se suscribe a esos eventos y detecta cuando
 * un pago especifico fue completado, sin necesidad de polling HTTP.
 *
 * FLUJO:
 * 1. La app genera un zap invoice (kind 9734 + invoice bolt11)
 * 2. Este listener se suscribe a kind 9735 en los relays
 * 3. El usuario paga escaneando el QR
 * 4. WoS publica un kind 9735 en los relays
 * 5. Este listener lo detecta y llama onZapReceived()
 */

import NDK from '@nostr-dev-kit/ndk';
import { config } from '../data/config.js';

// Relays adicionales para escuchar zap receipts (mayor cobertura)
const ZAP_RELAYS = [
  ...config.nostrRelays,
  'wss://relay.primal.net',
  'wss://purplepag.es',
  'wss://relay.snort.social',
  'wss://nostr.wine',
];

// Instancia NDK dedicada para escuchar zap receipts
let ndk = null;
let connected = false;

/**
 * Asegurar que NDK esta conectado a los relays
 */
async function ensureConnected() {
  if (connected && ndk) return ndk;

  // Usar set para eliminar duplicados
  const uniqueRelays = [...new Set(ZAP_RELAYS)];
  console.log('[ZAP-LISTENER] Conectando a relays:', uniqueRelays);

  ndk = new NDK({
    explicitRelayUrls: uniqueRelays,
  });

  try {
    await ndk.connect(5000);
  } catch (e) {
    // NDK no falla si algunos relays no conectan, solo si todos fallan
    console.warn('[ZAP-LISTENER] Algunos relays pueden no haber conectado:', e.message);
  }
  connected = true;
  console.log('[ZAP-LISTENER] NDK conectado');
  return ndk;
}

export const zapListener = {
  /**
   * Suscribirse a zap receipts (kind 9735) y detectar pagos
   *
   * @param {Object} params
   * @param {string} params.recipientPubkey — Nostr pubkey del receptor (WoS)
   * @param {string} params.buyerPubkey — Nostr pubkey del comprador
   * @param {number} params.amountMillisats — Monto esperado en millisats
   * @param {number} params.since — Timestamp unix (segundos) desde cuando escuchar
   * @param {string} [params.zapRequestId] — ID del zap request para matching preciso
   * @param {Function} params.onZapReceived — Callback cuando se detecta el pago
   * @returns {Function} cleanup — Llamar para detener la suscripcion
   */
  async subscribe({ recipientPubkey, buyerPubkey, amountMillisats, since, zapRequestId, onZapReceived }) {
    const ndkInstance = await ensureConnected();

    console.log('[ZAP-LISTENER] Suscribiendose a kind 9735...');
    console.log('[ZAP-LISTENER] Buscando zapRequestId:', zapRequestId);
    console.log('[ZAP-LISTENER] recipientPubkey:', recipientPubkey);
    console.log('[ZAP-LISTENER] since:', since, '(' + new Date(since * 1000).toISOString() + ')');

    // Suscripcion amplia: kind 9735 sin filtro #p
    // Filtramos client-side para no perder receipts por tags inesperados
    const sub = ndkInstance.subscribe(
      {
        kinds: [9735],
        since: since,
      },
      { closeOnEose: false }
    );

    let resolved = false;

    sub.on('event', (event) => {
      if (resolved) return;

      console.log('[ZAP-LISTENER] Recibido kind 9735, pubkey:', event.pubkey?.slice(0, 16) + '...');

      // Extraer el zap request embebido en el tag "description"
      const descriptionTag = event.tags.find(t => t[0] === 'description');
      if (!descriptionTag || !descriptionTag[1]) {
        console.log('[ZAP-LISTENER] Sin tag description, ignorando');
        return;
      }

      try {
        const zapRequest = JSON.parse(descriptionTag[1]);

        // Validar: debe ser kind 9734 (zap request)
        if (zapRequest.kind !== 9734) {
          console.log('[ZAP-LISTENER] No es kind 9734, ignorando');
          return;
        }

        console.log('[ZAP-LISTENER] Zap request embebido, id:', zapRequest.id);

        // Matchear por zapRequestId (preciso) o por pubkey+monto (fallback)
        if (zapRequestId) {
          if (zapRequest.id !== zapRequestId) {
            console.log('[ZAP-LISTENER] ID no coincide, esperando:', zapRequestId, 'recibido:', zapRequest.id);
            return;
          }
          console.log('[ZAP-LISTENER] MATCH por zapRequestId!');
        } else {
          if (zapRequest.pubkey !== buyerPubkey) {
            console.log('[ZAP-LISTENER] Pubkey no coincide, ignorando');
            return;
          }
          const amountTag = zapRequest.tags.find(t => t[0] === 'amount');
          if (!amountTag || parseInt(amountTag[1]) !== amountMillisats) {
            console.log('[ZAP-LISTENER] Monto no coincide, ignorando');
            return;
          }
          console.log('[ZAP-LISTENER] MATCH por pubkey+monto!');
        }

        // Pago detectado!
        console.log('[ZAP-LISTENER] *** PAGO DETECTADO ***');
        resolved = true;

        const preimageTag = event.tags.find(t => t[0] === 'preimage');
        const bolt11Tag = event.tags.find(t => t[0] === 'bolt11');

        sub.stop();
        onZapReceived({
          zapReceipt: event,
          preimage: preimageTag ? preimageTag[1] : null,
          bolt11: bolt11Tag ? bolt11Tag[1] : null,
        });
      } catch (e) {
        console.warn('[ZAP-LISTENER] Error parseando zap receipt:', e);
      }
    });

    // Retornar funcion de cleanup
    return () => {
      if (!resolved) {
        resolved = true;
        sub.stop();
      }
    };
  },

  /**
   * Desconectar NDK (para limpieza)
   */
  disconnect() {
    if (ndk) {
      connected = false;
      ndk = null;
    }
  },
};
