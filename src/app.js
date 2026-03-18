/**
 * app.js — Punto de entrada de Sweet Shots
 *
 * EXPLICACION PARA APRENDER:
 * Este archivo es el "cerebro" de la app. Hace 3 cosas:
 *
 * 1. NAVEGACION: Decide que vista mostrar (catalogo, carrito, checkout, cuenta)
 *    cuando el usuario hace click en los links del header.
 *
 * 2. IMPORTACIONES: Trae los modulos de cada vista y servicio.
 *    En JavaScript moderno, cada archivo es un "modulo" independiente
 *    que exporta funciones. Aca los importamos para usarlos.
 *
 * 3. INICIALIZACION: Arranca la app cuando la pagina carga.
 */

// Importamos las vistas (cada una sabe como renderizar su seccion)
import { renderCatalog } from './views/catalog.js';
import { renderCart } from './views/cart.js';
import { renderCheckout } from './views/checkout.js';
import { renderAccount } from './views/account.js';

// Importamos los servicios
import { cartStore } from './services/cart-store.js';
import { nostrAuth } from './services/nostr-auth.js';
import { toast } from './services/toast.js';

/**
 * navigateTo — Cambia la vista actual
 *
 * @param {string} viewName — Nombre de la vista ('catalog', 'cart', 'checkout', 'account')
 *
 * COMO FUNCIONA:
 * 1. Busca el contenedor principal (#app)
 * 2. Limpia su contenido
 * 3. Llama a la funcion de renderizado de la vista correspondiente
 * 4. Actualiza los links del header para marcar cual esta activo
 */
export function navigateTo(viewName) {
  // Limpiar polling de pago si existe
  if (window.__serverPollCleanup) {
    window.__serverPollCleanup();
    window.__serverPollCleanup = null;
  }

  const app = document.getElementById('app');

  // Actualizar link activo en la navegacion
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.view === viewName);
  });

  // Re-trigger animacion fade-in quitando y re-agregando la clase
  app.style.animation = 'none';
  app.offsetHeight; // force reflow
  app.style.animation = '';

  // Renderizar la vista correspondiente
  switch (viewName) {
    case 'catalog':
      renderCatalog(app);
      break;
    case 'cart':
      renderCart(app);
      break;
    case 'checkout':
      renderCheckout(app);
      break;
    case 'account':
      renderAccount(app);
      break;
    default:
      renderCatalog(app);
  }

  // Scroll al inicio al cambiar de vista
  window.scrollTo(0, 0);
}

/**
 * updateCartBadge — Actualiza el numerito del carrito en el header
 *
 * Se llama cada vez que se agrega/quita un item del carrito.
 * Si el carrito esta vacio, oculta el badge.
 */
export function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  const count = cartStore.getTotalItems();

  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

/**
 * updateLoginButton — Actualiza el boton de login en el header
 *
 * Si el usuario esta logueado, muestra su nombre y foto.
 * Si no, muestra "Iniciar sesion".
 */
export function updateLoginButton() {
  const btn = document.getElementById('nostr-login-btn');
  const user = nostrAuth.getUser();

  if (user) {
    btn.classList.add('logged-in');
    btn.innerHTML = `
      ${user.picture ? `<img src="${user.picture}" alt="" class="avatar">` : ''}
      ${user.name || 'Usuario Nostr'}
    `;
  } else {
    btn.classList.remove('logged-in');
    btn.textContent = 'Iniciar sesion';
  }
}

/**
 * Inicializacion — Se ejecuta cuando la pagina termina de cargar
 *
 * 1. Configura los event listeners para la navegacion
 * 2. Configura el boton de login
 * 3. Muestra la vista inicial (catalogo)
 * 4. Actualiza el badge del carrito
 */
function init() {
  // Navegacion: escuchar clicks en los links del header
  document.querySelectorAll('[data-view]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault(); // Evitar que el navegador recargue la pagina
      navigateTo(link.dataset.view);
    });
  });

  // Login: escuchar click en el boton de login
  document.getElementById('nostr-login-btn').addEventListener('click', async () => {
    if (nostrAuth.getUser()) {
      // Ya logueado -> ir a mi cuenta
      navigateTo('account');
    } else {
      // No logueado -> intentar login
      try {
        await nostrAuth.login();
        updateLoginButton();
        // Si estaba intentando ir al checkout, redirigir
        const currentView = document.querySelector('.nav-link.active')?.dataset.view;
        if (currentView === 'checkout') {
          renderCheckout(document.getElementById('app'));
        }
      } catch (err) {
        toast.error('Error al iniciar sesion: ' + err.message);
      }
    }
  });

  // Mostrar vista inicial
  navigateTo('catalog');
  updateCartBadge();
  updateLoginButton();
}

// Esperar a que el DOM este listo y ejecutar init()
document.addEventListener('DOMContentLoaded', init);
