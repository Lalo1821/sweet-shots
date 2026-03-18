// api/create-invoice.js
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure';
import { bytesToHex } from '@noble/hashes/utils';

// Lightning Address de la pastelería
const LIGHTNING_ADDRESS = process.env.LIGHTNING_ADDRESS || 'sweetshotsp@walletofsatoshi.com';

// Relays donde WoS debe publicar el zap receipt
const RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://nostr.wine'
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { amountSats, description } = req.body;

    if (!amountSats || amountSats <= 0) {
      return res.status(400).json({ error: 'amountSats requerido y mayor a 0' });
    }

    // 1. Resolver Lightning Address directamente
    const [user, domain] = LIGHTNING_ADDRESS.split('@');
    const lnurlResponse = await fetch(`https://${domain}/.well-known/lnurlp/${user}`);
    const lnurlData = await lnurlResponse.json();

    if (!lnurlData.callback) {
      return res.status(500).json({ error: 'WoS no retornó callback URL' });
    }

    const amountMillisats = amountSats * 1000;

    // Validar que el monto está en el rango permitido por WoS
    if (amountMillisats < lnurlData.minSendable || amountMillisats > lnurlData.maxSendable) {
      return res.status(400).json({
        error: `Monto fuera de rango: min ${lnurlData.minSendable/1000} sats, max ${lnurlData.maxSendable/1000} sats`
      });
    }

    // 2. Generar clave efímera para firmar el zap request
    const ephemeralSk = generateSecretKey();
    const ephemeralPk = getPublicKey(ephemeralSk);

    // 3. Construir zap request (kind 9734)
    const zapRequestEvent = {
      kind: 9734,
      created_at: Math.floor(Date.now() / 1000),
      content: description || '',
      tags: [
        ['relays', ...RELAYS],
        ['amount', String(amountMillisats)],
        ['p', lnurlData.nostrPubkey]  // pubkey de WoS
      ]
    };

    // 4. Firmar con la clave efímera
    const signedZapRequest = finalizeEvent(zapRequestEvent, ephemeralSk);

    console.log('[create-invoice] Zap request firmado, id:', signedZapRequest.id);
    console.log('[create-invoice] Ephemeral pubkey:', ephemeralPk);

    // 5. Enviar al callback LNURL con el parámetro nostr
    const zapRequestJSON = JSON.stringify(signedZapRequest);
    const encodedZap = encodeURIComponent(zapRequestJSON);
    const separator = lnurlData.callback.includes('?') ? '&' : '?';
    const invoiceUrl = `${lnurlData.callback}${separator}amount=${amountMillisats}&nostr=${encodedZap}`;

    console.log('[create-invoice] Llamando callback WoS...');
    const invoiceResponse = await fetch(invoiceUrl);
    const invoiceData = await invoiceResponse.json();

    if (!invoiceData.pr) {
      console.error('[create-invoice] WoS no retornó invoice:', invoiceData);
      return res.status(500).json({ error: 'WoS no retornó invoice', details: invoiceData });
    }

    console.log('[create-invoice] Invoice recibido OK');

    // 6. Retornar al frontend
    return res.status(200).json({
      paymentRequest: invoiceData.pr,               // bolt11 para el QR
      zapRequestId: signedZapRequest.id,             // para buscar el receipt después
      zapRequestPubkey: ephemeralPk,                 // pubkey efímera usada
      wosNostrPubkey: lnurlData.nostrPubkey,         // pubkey de WoS (firma el receipt)
      relays: RELAYS                                  // dónde buscar el receipt
    });

  } catch (error) {
    console.error('[create-invoice] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
