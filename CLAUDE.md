# Sweet Shots — Contexto para Claude Code

## Qué es este proyecto
E-commerce de postres artesanales con pagos Bitcoin Lightning Network y login Nostr.
Proyecto de hackathon FOUNDATIONS (La Crypta, Buenos Aires, Marzo 2026).
Sin backend. Todo en cliente + localStorage. Sin frameworks.

## Stack
- Vanilla JavaScript (ES Modules) + Vite 5.x
- CSS puro con variables (1 archivo: `src/styles/main.css`)
- Google Fonts: Satisfy (marca), DM Sans (cuerpo), JetBrains Mono (sats)

## Comandos
```bash
npm run dev        # Dev server → http://127.0.0.1:5173
npm run build      # Build → dist/
```
Requisito para probar pagos: extensión Alby en el navegador (NIP-07).

## Estructura de carpetas clave
```
src/
├── app.js          # Entry point + navegación (navigateTo) + updateCartBadge
├── data/
│   ├── products.js # 7 pasteles: id, nombre, precio USD, sabores, porciones, imagen
│   └── config.js   # Lightning Address, WhatsApp, relays Nostr, descuento Lightning
├── services/
│   ├── lightning.js      # Precio BTC via CoinGecko, invoices, WebLN
│   ├── nostr-auth.js     # Login NIP-07 + NDK
│   ├── cart-store.js     # Carrito en localStorage
│   ├── order-history.js  # Pedidos por pubkey en localStorage
│   ├── loyalty.js        # Niveles fidelidad (calcula on-demand desde order-history)
│   └── toast.js          # Notificaciones (4 tipos, auto-dismiss 4s)
└── views/
    ├── catalog.js   # Grilla de productos
    ├── cart.js      # Carrito con controles +/-
    ├── checkout.js  # Formulario + invoice Lightning + QR + WhatsApp
    └── account.js   # Perfil Nostr + fidelidad + historial
```

## Cómo funciona la navegación
SPA sin router de librería. `navigateTo('catalog'|'cart'|'checkout'|'account')` en
`app.js` limpia `<main id="app">` e inyecta el HTML de la vista correspondiente.
`index.html` es un shell fijo (header + footer). El contenido es 100% dinámico.

## Sistema de diseño (paleta CSS)
```css
--color-bg: #FDF8F3          /* crema — fondo principal */
--color-primary: #7EC8C8     /* turquesa — botones, links (color de marca) */
--color-rose-medium: #E8A4B8 /* rosa — badges de producto */
--color-lightning: #F7931A   /* naranja Bitcoin — SOLO para pagos/sats */
--color-text: #2C3E3E        /* marrón oscuro — nunca negro puro */
```
Regla de oro: naranja SOLO para contexto de pagos Lightning/sats. Turquesa para UI/marca.

## Reglas de desarrollo — NO hacer sin instrucción explícita
- NO agregar dependencias npm nuevas
- NO modificar `src/data/products.js` (datos reales del negocio)
- NO modificar `src/data/config.js` (Lightning Address real configurada)
- NO cambiar la estructura de carpetas
- NO agregar archivos en `src/examples/` (son residuos del template, ignorar)
- NO implementar features que no estén en el prompt actual

## Dependencias activas
- `@getalby/lightning-tools` — invoices Lightning (usar esta)
- `@getalby/sdk` — instalada pero NO usada, no importar
- `@nostr-dev-kit/ndk` — conexión relays Nostr
- `qrcode` — QR codes como canvas
- `webln` — pagos desde wallet del navegador

## Contexto del hackathon
Hay deadlines duros. Prioridad: terminar features pendientes antes que agregar nuevas.
Si algo no está claro en el prompt, preguntar antes de implementar.
