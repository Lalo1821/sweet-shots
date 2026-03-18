// api/create-invoice.js
// Vercel Serverless Function — Crea un invoice Lightning via Blink API

const BLINK_API = 'https://api.blink.sv/graphql';

export default async function handler(req, res) {
  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amountSats, description } = req.body;

    // Validar input
    if (!amountSats || amountSats < 1) {
      return res.status(400).json({ error: 'amountSats debe ser mayor a 0' });
    }

    // Llamar a Blink GraphQL API para crear invoice
    const response = await fetch(BLINK_API, {
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

    const data = await response.json();

    // Verificar errores de Blink
    const result = data?.data?.lnInvoiceCreate;
    if (!result) {
      console.error('[create-invoice] Respuesta inesperada de Blink:', JSON.stringify(data));
      return res.status(500).json({ error: 'Respuesta inesperada de Blink' });
    }

    if (result.errors && result.errors.length > 0) {
      console.error('[create-invoice] Error de Blink:', result.errors);
      return res.status(500).json({ error: result.errors[0].message });
    }

    if (!result.invoice || !result.invoice.paymentRequest) {
      return res.status(500).json({ error: 'Blink no retornó un invoice' });
    }

    // Devolver invoice al frontend
    return res.status(200).json({
      paymentRequest: result.invoice.paymentRequest,
      paymentHash: result.invoice.paymentHash,
    });

  } catch (error) {
    console.error('[create-invoice] Error:', error.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
