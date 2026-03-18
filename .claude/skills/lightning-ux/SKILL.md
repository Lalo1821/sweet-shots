---
name: lightning-ux
description: Optimize the Lightning payment flow UX in Sweet Shots. Use when working on checkout, invoice display, QR code, payment confirmation, or anything related to Bitcoin and Lightning payments.
---

## Sweet Shots - Lightning Payment UX

### Principio central
El flujo Lightning debe sentirse mas rapido, mas moderno y mas premium que el flujo de WhatsApp. El usuario tiene que sentir que eligio la opcion inteligente.

### Lenguaje permitido con el usuario
- SI: Lightning, Bitcoin, sats, descuento, pago instantaneo
- NO: invoice, BOLT11, hex, pubkey, preimage, WebLN, NDK

### Flujo de pago: estados visuales obligatorios
1. SELECCION: boton Lightning con badge naranja y descuento visible en grande
   - Mostrar ahorro en USD Y en sats, no solo el porcentaje
   - Ejemplo: "Ahorras $0.75 USD (1.005 sats)"

2. GENERANDO: spinner mientras se crea la invoice
   - Texto: "Generando tu pago Lightning..." no "Cargando..."
   - Duracion maxima visual: 3 segundos, si tarda mas mostrar mensaje de espera

3. INVOICE LISTA: pantalla de pago
   - QR code grande y centrado, minimo 250x250px
   - Boton "Copiar" prominente debajo del QR
   - Monto en sats en fuente mono grande, monto en USD mas chico abajo
   - Countdown visible si la invoice expira
   - Texto de ayuda: "Escanea con tu wallet Bitcoin"

4. PROCESANDO: cuando WebLN confirma o el usuario pago
   - Animacion de confirmacion: check verde con pulso suave
   - Texto: "Pago recibido" con el monto confirmado

5. CONFIRMADO: pantalla final
   - Resumen del pedido
   - Destacar el descuento que obtuvo
   - Opcion de ver historial de pedidos

### Manejo de errores
- WebLN no disponible: mostrar QR automaticamente sin mencionar WebLN
- Invoice expirada: boton visible para generar nueva, sin tecnicismos
- Error de red: mensaje claro con opcion de reintentar

### Colores especificos para Lightning
- Naranja Bitcoin #f7931a: botones y badges Lightning
- Verde confirmacion #4caf50: estados exitosos
- Fondo invoice: surface #16213e con borde naranja sutil
