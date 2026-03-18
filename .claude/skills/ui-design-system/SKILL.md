---
name: ui-design-system
description: Sweet Shots design system. Use for ANY visual, UI, CSS, or styling work on this project. Always apply these rules before making visual decisions.
---

## Sweet Shots - Design System

### Paleta actual
- Background principal: #1a1a2e
- Background cards: #16213e
- Accent rosa (logo, botones): #e91e8c
- Accent amarillo (badges): #f0c040
- Texto principal: #ffffff
- Texto secundario: #a0a0b0

### Problemas visuales a resolver
- Las cards necesitan mas contraste con el fondo
- El badge Lightning debe diferenciarse del badge de precio en sats
- Los precios en sats deben usar fuente monospace

### Tipografia objetivo
- Headings: Playfair Display
- Body: Inter
- Precios en sats: JetBrains Mono

### Componentes clave
- Card de postre: imagen real prominente, sombra para separarse del fondo
- Badge Lightning: simbolo rayo + color naranja Bitcoin #f7931a, no amarillo generico
- Badge sats: fondo oscuro, fuente mono
- Boton primario: rosa actual esta bien, agregar hover con glow suave
- Descuento Lightning: debe verse como ventaja clara, no solo un numero

### Principios UX
- Mobile-first: mayoria de usuarios pagan desde el celular
- El flujo Lightning debe sentirse mas rapido y premium que el de WhatsApp
- Nunca mostrar terminos tecnicos al usuario: BOLT11, invoice, hex keys
- Precios USD y sats siempre visibles juntos, nunca uno solo
