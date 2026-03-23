/**
 * account.js — Vista de "Mi Cuenta"
 *
 * EXPLICACION:
 * Esta vista muestra 3 cosas:
 *
 * 1. PERFIL: Nombre y foto del usuario de Nostr
 * 2. FIDELIDAD: Puntos acumulados, nivel actual, y progreso al siguiente nivel
 * 3. HISTORIAL: Lista de pedidos anteriores con fecha, items, total y estado
 *
 * Si el usuario no esta logueado, le pide que inicie sesion.
 */

import { nostrAuth } from '../services/nostr-auth.js';
import { orderHistory } from '../services/order-history.js';
import { loyalty } from '../services/loyalty.js';
import { lightning } from '../services/lightning.js';
import { navigateTo, updateLoginButton } from '../app.js';

/**
 * Renderizar la vista de Mi Cuenta
 */
export function renderAccount(container) {
  // Verificar login
  if (!nostrAuth.isLoggedIn()) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; margin-bottom: 16px;">👤</div>
        <h2>Mi Cuenta</h2>
        <p style="color: var(--color-text-muted); margin: 16px 0; max-width: 400px; margin-left: auto; margin-right: auto;">
          Inicia sesion con Nostr para ver tu historial de pedidos,
          puntos de fidelidad y descuentos exclusivos.
        </p>
        <p style="color: var(--color-text-muted); font-size: 0.9rem;">
          ¿No tenes Nostr? Podes comprar como invitado desde el checkout sin necesidad de cuenta.
        </p>
      </div>
    `;
    return;
  }

  const user = nostrAuth.getUser();
  const pubkey = user.pubkey;

  // Datos de fidelidad
  const points = loyalty.getPoints(pubkey);
  const level = loyalty.getLevel(pubkey);
  const nextLevel = loyalty.getNextLevel(pubkey);
  const progress = loyalty.getProgress(pubkey);
  const allLevels = loyalty.getAllLevels();

  // Historial de pedidos
  const orders = orderHistory.getOrders(pubkey);

  // Pubkey acortada para mostrar (las pubkeys son muy largas)
  const shortPubkey = pubkey.substring(0, 8) + '...' + pubkey.substring(pubkey.length - 8);

  // HTML del historial
  let ordersHtml = '';
  if (orders.length === 0) {
    ordersHtml = `
      <div class="cart-empty" style="padding: 24px 0;">
        <p style="color: var(--color-text-muted);">Todavia no tenes pedidos.</p>
        <button class="btn btn-primary" id="btn-go-catalog" style="margin-top: 12px;">Ver catalogo</button>
      </div>
    `;
  } else {
    ordersHtml = orders.map(order => {
      const date = new Date(order.date);
      const dateStr = date.toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
      const timeStr = date.toLocaleTimeString('es-AR', {
        hour: '2-digit', minute: '2-digit'
      });

      const itemsList = order.items
        .map(i => `${i.name} x${i.quantity}`)
        .join(', ');

      return `
        <div class="order-card">
          <div class="order-header">
            <span class="order-date">${dateStr} ${timeStr}</span>
            <span class="order-status ${order.status}">${order.status === 'paid' ? 'Pagado' : 'Pendiente'}</span>
          </div>
          <div class="order-items">${itemsList}</div>
          <div class="order-total">
            ${order.paymentMethod === 'lightning'
              ? `⚡ ${lightning.formatSats(order.totalSats)} sats`
              : `💵 $${order.totalUsd.toFixed(2)} USD`
            }
            &mdash; ${order.deliveryMethod === 'pickup' ? '🏪 Retiro' : '🚗 Delivery'}
          </div>
        </div>
      `;
    }).join('');
  }

  // Tabla de niveles
  const levelsHtml = allLevels.map(l => `
    <div style="display: flex; justify-content: space-between; padding: 8px 0;
      ${l.name === level.name ? 'font-weight: 700; color: var(--color-primary);' : 'color: var(--color-text-muted);'}">
      <span>${l.emoji} ${l.name}</span>
      <span>${l.minPoints > 0 ? lightning.formatSats(l.minPoints) + ' pts' : 'Inicio'}</span>
      <span>${l.discount > 0 ? l.discount * 100 + '% desc.' : 'Sin descuento'}</span>
    </div>
  `).join('');

  container.innerHTML = `
    <h1 class="view-title">Mi Cuenta</h1>

    <!-- Perfil -->
    <div class="account-header">
      ${user.picture
        ? `<img src="${user.picture}" alt="${user.name}" class="account-avatar">`
        : `<div class="account-avatar" style="display: flex; align-items: center; justify-content: center; font-size: 2rem;">👤</div>`
      }
      <div>
        <div class="account-name">${user.name || 'Usuario Nostr'}</div>
        <div class="account-pubkey">${shortPubkey}</div>
        ${user.nip05 ? `<div style="color: var(--color-success); font-size: 0.85rem; margin-top: 4px;">✓ ${user.nip05}</div>` : ''}
      </div>
      <button class="btn btn-secondary" id="btn-logout" style="margin-left: auto;">Cerrar sesion</button>
    </div>

    <!-- Fidelidad -->
    <div class="loyalty-card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 0.85rem; opacity: 0.7;">Puntos acumulados</div>
          <div class="loyalty-points">${lightning.formatSats(points)}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 2rem;">${level.emoji}</div>
          <div class="loyalty-level">Nivel ${level.name}</div>
          ${level.discount > 0 ? `<div style="font-size: 0.85rem;">${level.discount * 100}% descuento</div>` : ''}
        </div>
      </div>
      ${nextLevel ? `
        <div class="loyalty-progress">
          <div class="loyalty-progress-bar" style="width: ${progress}%;"></div>
        </div>
        <div style="font-size: 0.8rem; margin-top: 8px; opacity: 0.7;">
          ${lightning.formatSats(nextLevel.minPoints - points)} puntos para nivel ${nextLevel.name}
        </div>
      ` : `
        <div style="font-size: 0.85rem; margin-top: 12px; opacity: 0.8;">
          Sos nivel maximo! Disfrutas ${level.discount * 100}% de descuento en todos tus pedidos.
        </div>
      `}
    </div>

    <!-- Niveles -->
    <div class="card" style="margin-bottom: 24px;">
      <h2 style="margin-bottom: 12px;">Niveles de fidelidad</h2>
      ${levelsHtml}
    </div>

    <!-- Historial -->
    <h2 style="margin-bottom: 16px;">Historial de pedidos</h2>
    <div class="order-list">
      ${ordersHtml}
    </div>
  `;

  // Event: Cerrar sesion
  document.getElementById('btn-logout').addEventListener('click', () => {
    nostrAuth.logout();
    updateLoginButton();
    navigateTo('catalog');
  });

  // Event: Ir al catalogo (si no hay pedidos)
  const goBtn = container.querySelector('#btn-go-catalog');
  if (goBtn) {
    goBtn.addEventListener('click', () => navigateTo('catalog'));
  }
}
