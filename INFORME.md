# Informe de Desarrollo — Sweet Shots

## Proyecto

**Sweet Shots** — E-commerce lite de postres artesanales con pagos Bitcoin via Lightning Network y autenticacion con Nostr.

Desarrollado para la hackathon **FOUNDATIONS** de La Crypta (Marzo 2026, premio: 1,000,000 sats).

---

## Decisiones de arquitectura

### SPA (Single Page Application) con Vanilla JS + Vite

Se eligio **HTML/CSS/JavaScript puro** (sin frameworks como React o Vue) por dos razones:

1. **Nivel del desarrollador**: Al ser principiante, vanilla JS permite entender que pasa en cada linea sin la "magia" de un framework. Cada evento, cada renderizado, cada cambio de vista es explicito.

2. **Simplicidad del MVP**: Para un e-commerce lite con 4 vistas, un framework agrega complejidad innecesaria. Vanilla JS es suficiente y el bundle final es mas liviano.

**Vite** se usa como bundler porque ya venia configurado en el starter kit. Vite hace dos cosas:
- En desarrollo: sirve los archivos con hot reload (cambias algo y se actualiza solo)
- En produccion: empaqueta todo en archivos optimizados para deploy

### Navegacion por vistas (no por paginas)

En vez de tener multiples archivos HTML (catalogo.html, carrito.html, etc.), toda la app vive en un solo `index.html`. JavaScript se encarga de "cambiar" el contenido del `<div id="app">` segun la vista seleccionada.

**Por que?** Porque asi:
- No se recarga la pagina al navegar (es instantaneo)
- Se comparte estado entre vistas (el carrito persiste al cambiar de vista)
- Es el patron estandar de las apps web modernas

### localStorage para persistencia

Los datos (carrito, pedidos, puntos) se guardan en `localStorage` del navegador. No hay base de datos ni servidor backend.

**Por que?** Porque para el MVP de la hackathon:
- No necesitamos servidor propio (menos complejidad, menos costos)
- Los datos persisten entre sesiones (cerras el navegador y siguen ahi)
- Los pedidos se organizan por pubkey de Nostr (cada usuario ve solo los suyos)

**Limitacion**: Los datos viven solo en ese navegador. Si el usuario cambia de dispositivo, pierde el historial. Para produccion habria que agregar un backend.

---

## Estructura de archivos creados

```
lightning-starter/
├── index.html                     → Shell de la app
├── start-dev.js                   → Script para levantar Vite en desarrollo
├── src/
│   ├── app.js                     → Punto de entrada, navegacion entre vistas
│   ├── data/
│   │   ├── products.js            → Catalogo de pasteles (datos)
│   │   └── config.js              → Configuracion del negocio
│   ├── services/
│   │   ├── cart-store.js          → Logica del carrito de compras
│   │   ├── lightning.js           → Pagos Lightning + conversion USD/sats
│   │   ├── nostr-auth.js          → Autenticacion con Nostr
│   │   ├── order-history.js       → Historial de pedidos
│   │   └── loyalty.js             → Programa de fidelidad
│   ├── views/
│   │   ├── catalog.js             → Vista del catalogo de productos
│   │   ├── cart.js                → Vista del carrito
│   │   ├── checkout.js            → Vista de checkout + pago
│   │   └── account.js             → Vista de mi cuenta
│   └── styles/
│       └── main.css               → Todos los estilos
└── .claude/
    └── launch.json                → Configuracion del servidor de desarrollo
```

### Por que esta estructura?

Se separo el codigo en 3 capas:

- **`data/`** — Datos estaticos. Aca van los productos y la configuracion. Si queres cambiar un precio o agregar un pastel, solo tocas estos archivos.

- **`services/`** — Logica de negocio. Cada servicio maneja una responsabilidad: el carrito maneja items, lightning maneja pagos, nostr-auth maneja login. Estan separados para que sean faciles de entender y modificar individualmente.

- **`views/`** — Lo que el usuario ve. Cada archivo genera el HTML de una vista y conecta los botones con los servicios correspondientes.

---

## Detalle de cada archivo

### index.html

El "esqueleto" de la app. Contiene:
- **Header fijo**: Logo "Sweet Shots", navegacion (Catalogo, Carrito, Mi Cuenta), boton de login
- **Contenedor `#app`**: Donde se inyectan las vistas dinamicamente
- **Footer**: Creditos del negocio y la hackathon
- Carga el CSS y el JS como modulos de ES6

### src/app.js — El cerebro

Funcion principal: `navigateTo(viewName)`. Cuando el usuario hace click en un link de la navegacion:
1. Limpia el contenido actual
2. Llama a la funcion de renderizado de la vista correspondiente
3. Actualiza el link activo en el header
4. Hace scroll al inicio

Tambien maneja:
- `updateCartBadge()`: Actualiza el numerito del carrito en el header
- `updateLoginButton()`: Muestra nombre/foto del usuario si esta logueado
- Listener del boton de login: Si no esta logueado, intenta login. Si ya esta, navega a "Mi Cuenta".

### src/data/products.js — Catalogo

Array de objetos, cada uno representando un pastel:
- `id`: Identificador unico (ej: 'cake-6')
- `name`: Nombre visible (ej: 'Pastel 6"')
- `description`: Descripcion con cantidad de personas
- `priceUsd`: Precio en dolares (la moneda base)
- `category`: 'un-piso' o 'dos-pisos'
- `emoji`: Placeholder visual (se reemplazara por fotos reales)
- `sizes`: Texto del tamano

**Productos actuales:**
| Producto | Precio USD |
|---|---|
| Pastel 6" (un piso) | $15 |
| Pastel 7" (un piso) | $20 |
| Pastel 8" (un piso) | $25 |
| Pastel 10" (un piso) | $35 |
| Pastel 5"+7" (dos pisos) | $45 |
| Pastel 6"+8" (dos pisos) | $55 |
| Pastel 7"+9" (dos pisos) | $70 |

### src/data/config.js — Configuracion

Datos editables del negocio:
- `lightningAddress`: Direccion Lightning para recibir pagos (actualmente 'hello@getalby.com', hay que cambiarlo)
- `whatsappNumber`: Numero de WhatsApp para pagos en USD
- `lightningDiscount`: Porcentaje de descuento por pagar con Lightning (5%)
- `nostrRelays`: Lista de servidores Nostr para buscar perfiles de usuarios

### src/services/cart-store.js — Carrito

Usa localStorage con la clave `sweetshots_cart`. Guarda un array de `{productId, quantity}`.

Metodos:
- `addItem(productId)`: Agrega o incrementa cantidad
- `setQuantity(productId, qty)`: Cambia cantidad (si llega a 0, elimina)
- `removeItem(productId)`: Elimina del carrito
- `getTotalItems()`: Suma de todas las cantidades
- `clear()`: Vacia el carrito

### src/services/lightning.js — Pagos Lightning

El servicio mas complejo. Maneja:

1. **Tipo de cambio BTC/USD**: Llama a la API de CoinGecko para obtener el precio actual de Bitcoin. Cachea el resultado por 5 minutos para no saturar la API. Si la API falla, usa el ultimo precio conocido o un fallback de $100,000.

2. **Conversion USD a sats**: Formula: `sats = (usd / btcPrice) * 100,000,000`

3. **Generacion de invoices**: Usa `@getalby/lightning-tools` para resolver la Lightning Address del negocio y pedir un invoice por X sats. El invoice es un string bolt11 que codifica el pedido de pago.

4. **Pago con WebLN**: Si el cliente tiene una wallet en el navegador (como Alby), puede pagar con un click usando `window.webln.sendPayment()`.

5. **Link de WhatsApp**: Para pagos en USD, genera un link `wa.me` con el detalle del pedido pre-armado.

### src/services/nostr-auth.js — Autenticacion Nostr

Usa el estandar NIP-07: las extensiones de navegador (Alby, nos2x) exponen un objeto `window.nostr` que permite obtener la identidad del usuario.

Flujo de login:
1. Verifica que `window.nostr` existe (extension instalada)
2. Llama a `window.nostr.getPublicKey()` — la extension muestra un popup de autorizacion
3. Conecta a relays de Nostr usando NDK (Nostr Dev Kit)
4. Busca el perfil del usuario (nombre, foto, bio) en los relays
5. Guarda los datos en memoria

Datos que extrae del perfil: `name`, `picture`, `about`, `nip05` (identidad verificada), `lud16` (Lightning Address del usuario).

### src/services/order-history.js — Historial de pedidos

Guarda pedidos en localStorage organizados por pubkey del usuario. Cada pedido incluye:
- ID y fecha automaticos
- Items con cantidades y precios
- Total en USD y sats
- Metodo de pago (lightning/usd) y estado (paid/pending)
- Datos de entrega (nombre, telefono, direccion, metodo)
- Preimage del pago Lightning (prueba criptografica del pago)

### src/services/loyalty.js — Programa de fidelidad

Calcula puntos a partir del historial de pedidos (no se guardan por separado para evitar inconsistencias).

Regla: **1 sat gastado via Lightning = 1 punto**.

Niveles:
| Nivel | Puntos minimos | Descuento |
|---|---|---|
| Nuevo | 0 | Sin descuento |
| Regular | 50,000 | 5% |
| VIP | 100,000 | 10% |

El descuento de fidelidad se aplica **sobre el precio ya descontado** por Lightning. Es decir, un VIP que paga con Lightning obtiene: -5% Lightning + -10% fidelidad.

### src/views/catalog.js — Vista catalogo

Renderiza un grid de cards de productos. Cada card muestra:
- Emoji del pastel (placeholder)
- Nombre y descripcion
- Precio en USD y en sats (con descuento Lightning)
- Tag amarillo "-5%"
- Boton "Agregar al carrito"

Al agregar, el boton cambia a verde "Agregado!" por 1 segundo como feedback visual.

La conversion a sats se hace al cargar usando el precio real de BTC (via CoinGecko).

### src/views/cart.js — Vista carrito

Dos estados:
- **Carrito vacio**: Mensaje con emoji y boton "Ver catalogo"
- **Con items**: Lista de items con controles +/- y boton "Eliminar", mas resumen con:
  - Subtotal en USD
  - Precio en sats
  - Precio con descuento Lightning (-5%)
  - Boton dorado "Ir a pagar"

### src/views/checkout.js — Vista checkout

Tres estados:

1. **Sin login**: Mensaje "Inicia sesion para continuar" con link a Alby
2. **Formulario**: Dos columnas
   - Izquierda: Datos de entrega (nombre auto-completado de Nostr, telefono, retiro/delivery, direccion si delivery) + metodo de pago (Lightning con -5% o USD via WhatsApp)
   - Derecha: Resumen del pedido con descuentos aplicados
3. **Pago Lightning**: Muestra el invoice bolt11, boton "Copiar", y boton "Pagar con Wallet del navegador" (WebLN)
4. **Confirmacion**: Mensaje de exito con puntos ganados

Para pago en USD: Registra el pedido como "pendiente" y abre WhatsApp con el detalle pre-armado.

### src/views/account.js — Vista mi cuenta

Muestra:
- **Perfil**: Foto, nombre, pubkey acortada, NIP-05 si tiene
- **Card de fidelidad**: Puntos, nivel actual, barra de progreso al siguiente nivel
- **Tabla de niveles**: Todos los niveles con requisitos y descuentos
- **Historial de pedidos**: Lista con fecha, items, total, metodo de pago y estado
- **Boton cerrar sesion**

### src/styles/main.css — Estilos

Organizado en 11 secciones con variables CSS al inicio para facil personalizacion.

Tema: Fondo oscuro (#1a1a2e) con acentos rosa pastel (#e8a0bf) y dorado (#ffc800). El rosa evoca pasteleria/dulzura, el dorado evoca Bitcoin/Lightning.

Responsive: Breakpoints en 768px (tablet) y 480px (mobile). En mobile, las grillas pasan a 1 columna y el header se reorganiza.

---

## Tecnologias utilizadas

| Tecnologia | Para que se usa |
|---|---|
| **Vite** | Bundler y servidor de desarrollo |
| **@getalby/lightning-tools** | Resolver Lightning Address y generar invoices |
| **@getalby/sdk** | SDK completo de Alby (disponible para uso futuro) |
| **@nostr-dev-kit/ndk** | Conectar a relays Nostr y buscar perfiles |
| **webln** | Pagar invoices desde wallet del navegador |
| **CoinGecko API** | Obtener tipo de cambio BTC/USD en tiempo real |

---

## Features implementadas

1. **Catalogo de productos** con precios duales (USD + sats)
2. **Carrito de compras** con persistencia en localStorage
3. **Login obligatorio con Nostr** (NIP-07) para comprar
4. **Checkout** con formulario de entrega (retiro en local o delivery)
5. **Pago con Lightning** — genera invoice, copia bolt11, pago WebLN con un click
6. **Pago en USD** — genera link de WhatsApp con detalle del pedido
7. **5% descuento** por pagar con Lightning
8. **Programa de fidelidad** — puntos por compra, 3 niveles con descuentos progresivos
9. **Historial de pedidos** por usuario
10. **Responsive** — mobile, tablet y desktop
11. **Conversion de precios en tiempo real** via CoinGecko

---

## Pendientes para mejorar

### Prioridad alta (para la hackathon)
- [ ] Reemplazar emojis por fotos reales de los pasteles
- [ ] Configurar Lightning Address real del negocio en `config.js`
- [ ] Configurar numero de WhatsApp real en `config.js`
- [ ] Agregar mas productos al catalogo en `products.js`
- [ ] Escribir README para el repositorio
- [ ] Generar QR code visual para los invoices (actualmente solo muestra el texto bolt11)

### Prioridad media (mejoras de UX)
- [ ] Animaciones de transicion entre vistas
- [ ] Notificaciones toast en vez de `alert()`
- [ ] Boton "Repetir pedido" en el historial
- [ ] Filtros por categoria en el catalogo (un piso / dos pisos)
- [ ] Busqueda de productos

### Prioridad baja (para produccion)
- [ ] Backend con base de datos real (los pedidos se perderian si el usuario limpia el navegador)
- [ ] Sistema de notificaciones al negocio cuando llega un pedido
- [ ] Panel de administracion para el dueno
- [ ] Verificacion de pago Lightning (actualmente confia en WebLN)
- [ ] Deploy a hosting (Vercel, Netlify, etc.)
- [ ] Dominio propio
- [ ] SEO y meta tags para redes sociales

---

## Como correr el proyecto

```bash
# Instalar dependencias
npm install

# Levantar servidor de desarrollo
npm run dev

# Compilar para produccion
npm run build

# Previsualizar build de produccion
npm run preview
```

La app corre en `http://localhost:5173`.

Para probar el login se necesita la extension **Alby** (getalby.com) o **nos2x** en el navegador.

---

*Informe generado el 5 de marzo de 2026 durante la sesion 1 de desarrollo.*
