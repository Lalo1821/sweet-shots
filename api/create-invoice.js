// api/create-invoice.js
// Crea un invoice Lightning via Blink Y guarda el pedido en Supabase

import { getSupabase } from './lib/supabase.js';

const BLINK_API = 'https://api.blink.sv/graphql';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amountSats, description, orderData } = req.body;

    // Validar input
    if (!amountSats || amountSats < 1) {
      return res.status(400).json({ error: 'amountSats debe ser mayor a 0' });
    }

    // --- 1. Crear invoice en Blink ---
    const blinkResponse = await fetch(BLINK_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.BLINK_API_KEY,
      },
      body: JSON.stringify({
        query: `
          mutation LnInvoiceCreate($input: LnInvoiceCreateInput!) {
            lnInvoiceCreate(input: $input) {
              invoice {
                paymentRequest
                paymentHash
                satoshis
              }
              errors {
                message
              }
            }
          }
        `,
        variables: {
          input: {
            walletId: process.env.BLINK_WALLET_ID,
            amount: amountSats,
            memo: description || 'Sweet Shots',
          },
        },
      }),
    });

    const blinkData = await blinkResponse.json();
    const result = blinkData?.data?.lnInvoiceCreate;

    if (!result) {
      console.error('[create-invoice] Respuesta inesperada de Blink:', JSON.stringify(blinkData));
      return res.status(500).json({ error: 'Respuesta inesperada de Blink' });
    }

    if (result.errors && result.errors.length > 0) {
      console.error('[create-invoice] Error de Blink:', result.errors);
      return res.status(500).json({ error: result.errors[0].message });
    }

    if (!result.invoice || !result.invoice.paymentRequest) {
      return res.status(500).json({ error: 'Blink no retornó un invoice' });
    }

    const { paymentRequest, paymentHash } = result.invoice;

    // --- 2. Guardar pedido en Supabase como "pending" ---
    if (orderData) {
      try {
        const supabase = getSupabase();
        const { error: dbError } = await supabase.from('orders').insert({
          customer_name: orderData.customerName,
          customer_phone: orderData.customerPhone,
          nostr_pubkey: orderData.nostrPubkey || null,
          items: orderData.items,
          total_usd: orderData.totalUsd,
          total_sats: amountSats,
          delivery_method: orderData.deliveryMethod,
          delivery_address: orderData.deliveryAddress || null,
          payment_method: 'lightning',
          payment_status: 'pending',
          payment_request: paymentRequest,
          payment_hash: paymentHash,
        });
        if (dbError) {
          console.error('[create-invoice] Error Supabase:', dbError.message, dbError.details, dbError.hint);
        }
      } catch (unexpectedError) {
        console.error('[create-invoice] Error inesperado en Supabase:', unexpectedError.message);
      }
    }

    // Devolver invoice al frontend
    return res.status(200).json({
      paymentRequest,
      paymentHash,
    });

  } catch (error) {
    console.error('[create-invoice] Error:', error.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
