---
name: responsive-audit
description: Audit Sweet Shots for responsive design issues. Use before submitting to the hackathon, after cambios visuales grandes, o cuando algo se ve raro en mobile.
disable-model-invocation: true
---

Auditoria responsive de: $ARGUMENTS

Revisa en este orden y reporta problemas por severidad.

## Breakpoints a verificar
- Mobile: 375px (iPhone SE, el mas chico comun)
- Mobile grande: 430px (iPhone 15)
- Tablet: 768px
- Desktop: 1280px

## Checklist por componente

### Navegacion
- El logo Sweet Shots y el boton Iniciar Sesion caben en mobile sin solaparse
- Las tabs Catalogo / Carrito / Mi Cuenta no se cortan ni apilan mal
- El badge del contador del carrito es visible en mobile

### Cards de postres
- Las cards ocupan el ancho completo en mobile (no quedan dos columnas mini)
- Los precios USD y sats caben en una linea o se apilan limpiamente
- El badge Lightning y el badge -5% no se superponen
- El boton Agregar al carrito tiene minimo 44px de alto
- Las imagenes no se deforman ni se cortan mal

### Checkout y pago Lightning
- El QR de la invoice es legible en mobile (minimo 250x250px)
- El boton Copiar invoice es facilmente tappeable
- El countdown de expiracion es visible sin hacer scroll
- El monto en sats es legible en fuente mono

### Textos
- Ningun texto se corta con puntos suspensivos inesperados
- El texto Paga con Lightning y obtene 5% de descuento no se parte en lugares raros
- Los titulos de postres no desbordan la card

### General
- No hay scroll horizontal en ninguna vista
- Los modales y popups no quedan cortados en mobile
- El historial de pedidos es legible en pantalla chica

## Formato del reporte
Para cada problema encontrado indicar:
- CRITICO: rompe funcionalidad o hace ilegible informacion clave
- IMPORTANTE: se ve mal pero funciona
- MENOR: detalle estetico

Terminar con un resumen: X criticos, X importantes, X menores.
