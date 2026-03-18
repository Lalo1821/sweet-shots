// api/check-payment.js
import { SimplePool } from 'nostr-tools/pool';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { zapRequestId, wosNostrPubkey, relays } = req.body;

    if (!zapRequestId || !wosNostrPubkey || !relays) {
      return res.status(400).json({ error: 'Faltan parámetros: zapRequestId, wosNostrPubkey, relays' });
    }

    console.log('[check-payment] Buscando zap receipt para zapRequestId:', zapRequestId);

    // Crear pool de conexiones a relays
    const pool = new SimplePool();

    // Buscar zap receipts (kind 9735) recientes
    const since = Math.floor(Date.now() / 1000) - 600; // últimos 10 minutos

    const events = await pool.querySync(
      relays,
      {
        kinds: [9735],
        authors: [wosNostrPubkey],  // solo receipts firmados por WoS
        since: since,
        limit: 20
      }
    );

    console.log(`[check-payment] Encontrados ${events.length} zap receipts recientes`);

    // Buscar entre los receipts uno que contenga nuestro zapRequestId
    for (const event of events) {
      const descriptionTag = event.tags.find(t => t[0] === 'description');
      if (!descriptionTag) continue;

      try {
        const embeddedRequest = JSON.parse(descriptionTag[1]);

        if (embeddedRequest.id === zapRequestId) {
          console.log('[check-payment] ¡MATCH! Pago confirmado');

          const bolt11Tag = event.tags.find(t => t[0] === 'bolt11');

          // Cerrar conexiones
          pool.close(relays);

          return res.status(200).json({
            paid: true,
            preimage: null,
            receiptId: event.id,
            bolt11: bolt11Tag ? bolt11Tag[1] : null
          });
        }
      } catch (parseError) {
        continue;
      }
    }

    // No se encontró match
    pool.close(relays);

    return res.status(200).json({
      paid: false,
      receiptsChecked: events.length
    });

  } catch (error) {
    console.error('[check-payment] Error:', error);
    return res.status(500).json({ error: error.message, paid: false });
  }
}
