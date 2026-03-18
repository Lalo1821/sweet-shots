// api/check-payment.js
// Vercel Serverless Function — Verifica si un invoice Lightning fue pagado

const BLINK_API = 'https://api.blink.sv/graphql';

export default async function handler(req, res) {
  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentRequest } = req.body;

    if (!paymentRequest) {
      return res.status(400).json({ error: 'paymentRequest es requerido' });
    }

    // Consultar estado del invoice en Blink
    const response = await fetch(BLINK_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.BLINK_API_KEY,
      },
      body: JSON.stringify({
        query: `
          query LnInvoicePaymentStatus($input: LnInvoicePaymentStatusInput!) {
            lnInvoicePaymentStatus(input: $input) {
              status
              errors {
                message
              }
            }
          }
        `,
        variables: {
          input: {
            paymentRequest: paymentRequest,
          },
        },
      }),
    });

    const data = await response.json();

    const result = data?.data?.lnInvoicePaymentStatus;
    if (!result) {
      console.error('[check-payment] Respuesta inesperada de Blink:', JSON.stringify(data));
      return res.status(200).json({ paid: false });
    }

    if (result.errors && result.errors.length > 0) {
      console.error('[check-payment] Error de Blink:', result.errors);
      return res.status(200).json({ paid: false });
    }

    // Blink devuelve status: "PAID", "PENDING", o "EXPIRED"
    const paid = result.status === 'PAID';

    return res.status(200).json({
      paid,
      status: result.status,
    });

  } catch (error) {
    console.error('[check-payment] Error:', error.message);
    return res.status(200).json({ paid: false });
  }
}
