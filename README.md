# 🧁 Sweet Shots — Postres Artesanales con Bitcoin Lightning

E-commerce real de pastelería artesanal que acepta pagos con Bitcoin Lightning Network.
Desarrollado para la hackathon **FOUNDATIONS 2026** de [La Crypta](https://lacrypta.ar), Buenos Aires.

**🌐 App en producción:** [sweet-shots.vercel.app](https://sweet-shots.vercel.app)

## Qué es

Sweet Shots es la tienda online de una pastelería artesanal real en Buenos Aires.
Los clientes pueden explorar el catálogo de pasteles, agregar productos al carrito,
y pagar con Bitcoin Lightning Network recibiendo un **5% de descuento** por elegir
pagos en sats. También pueden pagar en USD coordinando por WhatsApp.

## Screenshots

![Catálogo de productos](public/images/screenshots/screenshot-catalog.png)

![Checkout con Lightning](public/images/screenshots/screenshot-checkout.png)

![Panel de administración](public/images/screenshots/screenshot-admin.png)

## Features

- Catálogo de 7 pasteles artesanales (un piso y dos pisos) con precios en USD convertidos a sats en tiempo real
- Carrito de compras persistente
- Checkout con invoice Lightning + QR code para escanear
- Pago directo desde wallet del navegador via WebLN
- 5% de descuento por pagar con Lightning
- Pago alternativo en USD coordinado por WhatsApp
- Login opcional con Nostr (NIP-07) para programa de fidelidad
- Programa de fidelidad: 3 niveles basados en sats acumulados
- Panel de administración con estadísticas y gestión de pedidos
- Notificación por email al dueño cuando entra un pedido

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Vanilla JS (ES Modules) + Vite |
| Hosting | Vercel (estáticos + serverless functions) |
| Pagos Lightning | Blink API (GraphQL) |
| Base de datos | Supabase (PostgreSQL) |
| Notificaciones | Resend |
| Identidad | Nostr NIP-07 (opcional) |

## Arquitectura de pagos

```
Cliente (navegador)
    │
    ├─ POST /api/create-invoice  →  Vercel Serverless  →  Blink API (crea invoice)
    │                                                         │
    │                                                         ▼
    │                                                    Invoice Lightning
    │                                                         │
    ├─ GET /api/check-payment    →  Vercel Serverless  →  Blink API (verifica pago)
    │
    └─ Supabase (guarda pedido con status pending → paid)
```

El frontend nunca habla directamente con la wallet. Toda la lógica de pagos
pasa por serverless functions, lo que hace la wallet intercambiable sin tocar el frontend.

## Correr localmente

```bash
git clone https://github.com/Lalo1821/sweet-shots.git
cd sweet-shots
npm install
npm run dev
```

La app corre en `http://127.0.0.1:5173`.

### Variables de entorno (para serverless functions)

Configurar en Vercel o en archivo `.env`:

| Variable | Descripción |
|----------|------------|
| `BLINK_API_KEY` | API key de Blink |
| `BLINK_WALLET_ID` | Wallet ID BTC de Blink |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key de Supabase |
| `RESEND_API_KEY` | API key de Resend |
| `OWNER_EMAIL` | Email del dueño para notificaciones |
| `ADMIN_PASSWORD` | Contraseña del panel admin |

**Nota:** Sin las variables de entorno, el catálogo y carrito funcionan normalmente.
Las variables solo son necesarias para procesar pagos Lightning y persistir pedidos.

## Decisiones de diseño

- **Vanilla JS sin frameworks:** El proyecto prioriza simplicidad. 4 vistas, navegación con `navigateTo()`, estado manual. Un framework agregaría complejidad innecesaria.
- **Blink como procesador:** API GraphQL con buena documentación. Las serverless functions abstraen el procesador, permitiendo migrar a BTCPay Server sin cambiar el frontend.
- **Guest checkout:** Cualquier persona puede comprar sin crear cuenta. Nostr es opcional, solo para el programa de fidelidad.
- **Precios en USD:** El negocio maneja costos en dólares. La conversión a sats se hace en tiempo real via CoinGecko con cache de 5 minutos.

## Estructura del proyecto

```
sweet-shots/
├── index.html                    # Shell HTML
├── admin.html                    # Panel de administración
├── api/                          # Vercel serverless functions
│   ├── create-invoice.js         # Crear invoice Lightning via Blink
│   ├── check-payment.js          # Verificar pago via Blink
│   ├── lib/supabase.js           # Helper Supabase compartido
│   └── admin/                    # Endpoints del panel admin
│       ├── orders.js
│       ├── update-order.js
│       └── stats.js
├── src/
│   ├── app.js                    # Entry point, navegación
│   ├── data/
│   │   ├── products.js           # Catálogo de productos
│   │   └── config.js             # Configuración general
│   ├── services/                 # Lógica de negocio
│   │   ├── cart-store.js
│   │   ├── lightning.js
│   │   ├── nostr-auth.js
│   │   ├── order-history.js
│   │   ├── loyalty.js
│   │   └── toast.js
│   ├── views/                    # Vistas de la SPA
│   │   ├── catalog.js
│   │   ├── cart.js
│   │   ├── checkout.js
│   │   └── account.js
│   └── styles/
│       └── main.css
└── public/images/                # Assets estáticos
```

## Panel de administración

Accesible en `/admin.html`. Protegido con contraseña (variable `ADMIN_PASSWORD`).
Permite ver estadísticas del negocio, filtrar pedidos por estado, y cambiar el
estado de cada pedido (procesar, entregar, cancelar).

## Créditos

Desarrollado por Lalo ([@Lalo1821](https://github.com/Lalo1821)) para la
hackathon FOUNDATIONS 2026 de [La Crypta](https://lacrypta.ar).

Construido con el [Lightning Starter Kit](https://github.com/nicbus/lightning-starter-kit) de La Crypta como punto de partida.

## Licencia

MIT
