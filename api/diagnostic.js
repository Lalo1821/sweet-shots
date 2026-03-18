// api/diagnostic.js
// Función de diagnóstico: consulta directamente a WoS sin proxy ni CORS
// TEMPORAL — borrar después de confirmar los resultados

export default async function handler(req, res) {
  // Permitir CORS desde nuestro frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    // 1. Resolver la Lightning Address directamente (sin proxy de Alby)
    const lnurlResponse = await fetch(
      'https://walletofsatoshi.com/.well-known/lnurlp/sweetshotsp'
    );

    if (!lnurlResponse.ok) {
      return res.status(500).json({
        error: 'Fetch a WoS falló',
        status: lnurlResponse.status
      });
    }

    const lnurlData = await lnurlResponse.json();

    // 2. Crear un invoice de prueba (1 sat = mínimo) para ver si tiene verify
    const callbackUrl = lnurlData.callback;
    const minSendable = lnurlData.minSendable || 1000; // millisats

    const invoiceResponse = await fetch(
      `${callbackUrl}?amount=${minSendable}`
    );
    const invoiceData = await invoiceResponse.json();

    // 3. Retornar TODO para análisis
    return res.status(200).json({
      message: 'Diagnóstico WoS directo (sin proxy)',
      lnurlData: {
        callback: lnurlData.callback,
        minSendable: lnurlData.minSendable,
        maxSendable: lnurlData.maxSendable,
        allowsNostr: lnurlData.allowsNostr || false,
        nostrPubkey: lnurlData.nostrPubkey || null,
        // Buscar cualquier campo relacionado con verify
        rawFields: Object.keys(lnurlData)
      },
      invoiceData: {
        pr: invoiceData.pr ? invoiceData.pr.substring(0, 50) + '...' : null,
        verify: invoiceData.verify || null,
        successAction: invoiceData.successAction || null,
        // Todos los campos del invoice para ver si hay algo útil
        rawFields: Object.keys(invoiceData)
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}
