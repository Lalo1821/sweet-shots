---
name: component-polish
description: Refine and improve the visual quality of a specific UI component in Sweet Shots. Use when improving cards de postres, botones, navegacion, badges de precio, o cualquier elemento visual.
disable-model-invocation: true
---

Refina el componente: $ARGUMENTS

Antes de tocar cualquier codigo, lee el skill ui-design-system para aplicar la identidad visual correcta.

Checklist obligatorio para cada componente:

1. CONTRASTE: el componente debe distinguirse claramente del fondo #1a1a2e
   - Cards: agregar box-shadow y borde sutil, no usar el mismo color de fondo
   - Usar surface #16213e para cards con sombra: 0 4px 20px rgba(0,0,0,0.4)

2. TIPOGRAFIA: aplicar las fuentes del design system
   - Nombres de postres: Playfair Display
   - Precios USD: Inter bold
   - Precios en sats: JetBrains Mono, color #a0a0b0

3. BADGE LIGHTNING: diferenciar claramente del badge de sats
   - Badge Lightning: fondo #f7931a, texto blanco, icono rayo antes del texto
   - Badge sats: fondo #1a1a2e, borde #444, fuente mono
   - Badge -5%: solo aparece junto al badge Lightning, mismo fondo naranja

4. BOTONES: el boton primario rosa necesita personalidad
   - Estado normal: background #e91e8c, texto blanco, border-radius 8px
   - Estado hover: glow suave con box-shadow 0 0 12px rgba(233,30,140,0.5)
   - Transicion: all 0.2s ease

5. MOBILE: verificar que el componente funcione en 375px de ancho
   - Precios duales deben caber en una sola linea o apilarse limpiamente
   - Tap targets minimos de 44px de alto

6. IMAGENES: si el componente tiene imagen de postre
   - Usar aspect-ratio 4/3 para consistencia entre cards
   - object-fit: cover para que no se deforme
   - Si no hay imagen real, usar un placeholder con gradiente rosa/oscuro, no emoji
