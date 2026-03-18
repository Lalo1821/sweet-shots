/**
 * toast.js — Sistema de notificaciones toast
 *
 * Reemplaza los alert() nativos del navegador por notificaciones
 * elegantes que aparecen arriba a la derecha y desaparecen solas.
 *
 * Tipos: 'error', 'success', 'warning', 'info'
 */

// Contenedor de toasts (se crea una sola vez)
let container = null;

function getContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Mostrar un toast
 *
 * @param {string} message — Texto del mensaje
 * @param {string} type — 'error' | 'success' | 'warning' | 'info'
 * @param {number} duration — Milisegundos antes de desaparecer (default 4000)
 */
export function showToast(message, type = 'info', duration = 4000) {
  const cont = getContainer();

  const icons = {
    error: '✕',
    success: '✓',
    warning: '!',
    info: 'i',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" aria-label="Cerrar">&times;</button>
  `;

  // Cerrar al hacer click en la X
  toast.querySelector('.toast-close').addEventListener('click', () => {
    dismiss(toast);
  });

  cont.appendChild(toast);

  // Trigger animation (necesario para que el transition funcione)
  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });

  // Auto-dismiss
  if (duration > 0) {
    setTimeout(() => dismiss(toast), duration);
  }
}

function dismiss(toast) {
  toast.classList.remove('toast-visible');
  toast.classList.add('toast-exit');
  toast.addEventListener('transitionend', () => {
    toast.remove();
  });
}

// Shortcuts
export const toast = {
  error: (msg, duration) => showToast(msg, 'error', duration),
  success: (msg, duration) => showToast(msg, 'success', duration),
  warning: (msg, duration) => showToast(msg, 'warning', duration),
  info: (msg, duration) => showToast(msg, 'info', duration),
};
