/**
 * catalog.js — Vista del catálogo de productos
 *
 * Muestra los pasteles en una grilla con:
 * - Imagen real o placeholder con degradé rosa→turquesa
 * - Nombre con fuente Satisfy
 * - Tags de sabores (chips interactivos)
 * - Tag de porciones (rosa) y tiempo de anticipación
 * - Precio USD tachado + precio en sats destacado
 * - Badge Lightning con descuento
 * - Botón "Agregar al carrito"
 */

import { products } from '../data/products.js';
import { cartStore } from '../services/cart-store.js';
import { lightning } from '../services/lightning.js';
import { updateCartBadge } from '../app.js';

/**
 * Genera el HTML de la imagen del producto.
 * Si hay imagen real en /public/images/products/, la usa.
 * Si no, muestra un placeholder con degradé rosa→turquesa.
 */
function productImageHtml(product) {
  return `
    <div class="product-image">
      <img
        src="/images/products/${product.id}.jpg"
        alt="${product.name}"
        onerror="this.parentElement.innerHTML='<div class=\\'product-image-placeholder\\'>${product.emoji}</div>'"
      >
    </div>
  `;
}

/**
 * Genera los tags de sabores como chips
 */
function flavorsHtml(product) {
  if (!product.flavors || product.flavors.length === 0) return '';
  const chips = product.flavors
    .map(f => `<span class="product-tag">${f}</span>`)
    .join('');
  return `<div class="product-tags">${chips}</div>`;
}

/**
 * Renderizar el catálogo de productos
 */
export async function renderCatalog(container) {
  // Loader mientras carga el precio de BTC
  container.innerHTML = `
    <h1 class="view-title">Nuestros Pasteles</h1>
    <p class="view-subtitle">Postres artesanales con amor. Pagá con Lightning y obtené 5% de descuento ⚡</p>
    <div style="text-align: center; padding: 40px;">
      <div class="loader"></div>
      <p style="margin-top: 16px; color: var(--color-text-muted);">Cargando precios...</p>
    </div>
  `;

  // Obtener precio de BTC
  let btcPrice;
  try {
    btcPrice = await lightning.getBtcPrice();
  } catch (e) {
    btcPrice = 100000;
  }

  // Construir HTML de cada producto
  const productCards = products.map(product => {
    const sats = Math.round((product.priceUsd / btcPrice) * 100_000_000);
    const satsWithDiscount = Math.round(sats * 0.95);

    return `
      <div class="product-card" data-product-id="${product.id}">
        ${productImageHtml(product)}
        <div class="product-info">
          <h3 class="product-name">${product.name}</h3>
          <p class="product-description">${product.description}</p>
          ${flavorsHtml(product)}
          <div class="product-tags">
            <span class="product-tag tag-portions">👥 ${product.servings}</span>
          </div>
          <div class="product-prices">
            <span class="price-usd">$${product.priceUsd} USD</span>
            <div class="product-badges">
              <span class="badge-sats">${lightning.formatSats(sats)} sats</span>
              <span class="badge-lightning">⚡ ${lightning.formatSats(satsWithDiscount)} sats c/Lightning</span>
            </div>
          </div>
          <button class="btn-add-cart" data-product-id="${product.id}">
            Agregar al carrito
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Inyectar HTML
  container.innerHTML = `
    <h1 class="view-title">Nuestros Pasteles</h1>
    <p class="view-subtitle">Postres artesanales con amor. Pagá con Lightning y obtené 5% de descuento ⚡</p>
    <div class="products-grid">
      ${productCards}
    </div>
  `;

  // Event listeners
  container.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = btn.dataset.productId;
      cartStore.addItem(productId);
      updateCartBadge();

      btn.textContent = '✓ Agregado!';
      btn.style.background = 'var(--color-success)';
      btn.style.color = '#fff';
      setTimeout(() => {
        btn.textContent = 'Agregar al carrito';
        btn.style.background = '';
        btn.style.color = '';
      }, 1200);
    });
  });
}