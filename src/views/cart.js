/**
 * cart.js — Vista del carrito de compras
 *
 * EXPLICACION:
 * Muestra los productos que el usuario agrego al carrito.
 * Permite cambiar cantidades, eliminar items, y ver el total.
 *
 * El boton "Ir a pagar" lleva al checkout (pero solo si esta logueado).
 */

import { products } from '../data/products.js';
import { cartStore } from '../services/cart-store.js';
import { lightning } from '../services/lightning.js';
import { navigateTo, updateCartBadge } from '../app.js';

/**
 * Buscar un producto por su ID
 * @param {string} productId
 * @returns {Object} — El producto encontrado
 */
function findProduct(productId) {
  return products.find(p => p.id === productId);
}

/**
 * Renderizar la vista del carrito
 * @param {HTMLElement} container
 */
export async function renderCart(container) {
  const items = cartStore.getItems();

  // Si el carrito esta vacio, mostrar mensaje
  if (items.length === 0) {
    container.innerHTML = `
      <h1 class="view-title">Tu Carrito</h1>
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <h2>Tu carrito esta vacio</h2>
        <p style="margin: 16px 0;">Agrega algunos pasteles deliciosos!</p>
        <button class="btn btn-primary" id="btn-go-catalog">Ver catalogo</button>
      </div>
    `;
    container.querySelector('#btn-go-catalog').addEventListener('click', () => {
      navigateTo('catalog');
    });
    return;
  }

  // Obtener precio de BTC para mostrar sats
  let btcPrice;
  try {
    btcPrice = await lightning.getBtcPrice();
  } catch (e) {
    btcPrice = 100000;
  }

  // Calcular totales
  let totalUsd = 0;
  const itemsHtml = items.map(item => {
    const product = findProduct(item.productId);
    if (!product) return ''; // Producto no encontrado (por si acaso)

    const subtotal = product.priceUsd * item.quantity;
    totalUsd += subtotal;

    return `
      <div class="cart-item">
        <div class="cart-item-image">${product.emoji}</div>
        <div class="cart-item-details">
          <div class="cart-item-name">${product.name} (${product.sizes})</div>
          <div class="cart-item-price">$${product.priceUsd} USD c/u</div>
        </div>
        <div class="cart-item-controls">
          <button class="btn-qty" data-action="decrease" data-product-id="${product.id}">-</button>
          <span class="cart-item-qty">${item.quantity}</span>
          <button class="btn-qty" data-action="increase" data-product-id="${product.id}">+</button>
          <button class="btn-remove" data-action="remove" data-product-id="${product.id}">Eliminar</button>
        </div>
      </div>
    `;
  }).join('');

  // Convertir totales a sats
  const totalSats = Math.round((totalUsd / btcPrice) * 100_000_000);
  const totalSatsWithDiscount = Math.round(totalSats * 0.95);

  container.innerHTML = `
    <h1 class="view-title">Tu Carrito</h1>

    <div class="cart-items">
      ${itemsHtml}
    </div>

    <div class="cart-summary">
      <div class="cart-summary-row">
        <span>Subtotal (USD)</span>
        <span>$${totalUsd.toFixed(2)}</span>
      </div>
      <div class="cart-summary-row">
        <span>Precio en sats</span>
        <span class="sats-total">${lightning.formatSats(totalSats)} sats</span>
      </div>
      <div class="cart-summary-row">
        <span>Con descuento Lightning (-5%)</span>
        <span class="sats-total">${lightning.formatSats(totalSatsWithDiscount)} sats</span>
      </div>
      <div class="cart-summary-row total">
        <span>Total</span>
        <div>
          <div>$${totalUsd.toFixed(2)} USD</div>
          <div class="sats-total">${lightning.formatSats(totalSatsWithDiscount)} sats con Lightning</div>
        </div>
      </div>
      <button class="btn btn-lightning btn-full btn-lg" id="btn-checkout" style="margin-top: 16px;">
        Ir a pagar
      </button>
    </div>
  `;

  // Event listeners para los botones de cantidad
  container.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = btn.dataset.productId;
      const action = btn.dataset.action;
      const currentItem = cartStore.getItems().find(i => i.productId === productId);

      if (action === 'increase') {
        cartStore.setQuantity(productId, currentItem.quantity + 1);
      } else if (action === 'decrease') {
        cartStore.setQuantity(productId, currentItem.quantity - 1);
      } else if (action === 'remove') {
        cartStore.removeItem(productId);
      }

      updateCartBadge();
      renderCart(container); // Re-renderizar el carrito
    });
  });

  // Boton "Ir a pagar"
  container.querySelector('#btn-checkout').addEventListener('click', () => {
    navigateTo('checkout');
  });
}
