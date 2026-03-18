/**
 * checkout.js — Vista de checkout (pago)
 *
 * Estados:
 * 1. FORMULARIO: Datos de entrega + metodo de pago
 * 2. PAGO: Invoice Lightning con QR code, o link WhatsApp
 * 3. CONFIRMACION: Pago exitoso
 *
 * Requiere login con Nostr.
 */

import { products } from '../data/products.js';
import { cartStore } from '../services/cart-store.js';
import { lightning, createServerInvoice, checkServerPayment } from '../services/lightning.js';
import { nostrAuth } from '../services/nostr-auth.js';
import { orderHistory } from '../services/order-history.js';
import { loyalty } from '../services/loyalty.js';
import { toast } from '../services/toast.js';
import { navigateTo, updateCartBadge } from '../app.js';
import QRCode from 'qrcode';

function findProduct(productId) {
  return products.find(p => p.id === productId);
}

/**
 * Genera un QR code como canvas y lo inserta en el contenedor
 */
async function renderQRCode(text, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const canvas = await QRCode.toCanvas(text, {
      width: 256,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });
    container.appendChild(canvas);
  } catch (err) {
    container.innerHTML = '<p style="color: var(--color-text-muted);">No se pudo generar el QR</p>';
  }
}

/**
 * Renderizar la vista de checkout
 */
export async function renderCheckout(container) {
  // Verificar login
  if (!nostrAuth.isLoggedIn()) {
    container.innerHTML = `
      <div class="login-required">
        <div class="login-required-icon">🔐</div>
        <h2>Inicia sesion para continuar</h2>
        <p>Necesitas una cuenta de Nostr para realizar pedidos. Hace click en "Iniciar sesion" en el header.</p>
        <div class="message message-info" style="max-width: 500px; margin: 24px auto; text-align: left;">
          <strong>¿No tenes extension de Nostr?</strong><br>
          Instala <a href="https://getalby.com" target="_blank" style="color: var(--color-secondary);">Alby</a>
          en tu navegador. Es gratis y te sirve tambien como wallet Lightning.
        </div>
      </div>
    `;
    return;
  }

  // Verificar que haya items en el carrito
  const items = cartStore.getItems();
  if (items.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <h2>Tu carrito esta vacio</h2>
        <p style="margin: 16px 0;">Agrega pasteles antes de ir al checkout.</p>
        <button class="btn btn-primary" id="btn-go-catalog">Ver catalogo</button>
      </div>
    `;
    container.querySelector('#btn-go-catalog').addEventListener('click', () => {
      navigateTo('catalog');
    });
    return;
  }

  // Obtener datos
  const user = nostrAuth.getUser();
  let btcPrice;
  try {
    btcPrice = await lightning.getBtcPrice();
  } catch (e) {
    btcPrice = 100000;
  }

  // Calcular totales
  let totalUsd = 0;
  const itemsSummary = items.map(item => {
    const product = findProduct(item.productId);
    if (!product) return null;
    totalUsd += product.priceUsd * item.quantity;
    return { ...product, quantity: item.quantity };
  }).filter(Boolean);

  const totalSats = Math.round((totalUsd / btcPrice) * 100_000_000);
  const totalSatsWithDiscount = Math.round(totalSats * 0.95);

  const loyaltyDiscount = loyalty.getDiscount(user.pubkey);
  const loyaltyLevel = loyalty.getLevel(user.pubkey);
  const totalSatsWithAllDiscounts = Math.round(totalSatsWithDiscount * (1 - loyaltyDiscount));

  const itemsListHtml = itemsSummary.map(item =>
    `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
      <span>${item.emoji} ${item.name} x${item.quantity}</span>
      <span>$${(item.priceUsd * item.quantity).toFixed(2)}</span>
    </div>`
  ).join('');

  container.innerHTML = `
    <h1 class="view-title">Checkout</h1>

    <div class="checkout-grid">
      <!-- COLUMNA IZQUIERDA: Formulario -->
      <div class="checkout-form">
        <h2 style="margin-bottom: 16px;">Datos de entrega</h2>

        <div class="form-group">
          <label class="form-label">Nombre</label>
          <input type="text" class="form-input" id="checkout-name"
            value="${user.name || ''}" placeholder="Tu nombre">
        </div>

        <div class="form-group">
          <label class="form-label">Telefono</label>
          <input type="tel" class="form-input" id="checkout-phone"
            placeholder="+54 9 11 1234-5678">
        </div>

        <div class="form-group">
          <label class="form-label">Metodo de entrega</label>
          <div class="delivery-options">
            <div class="delivery-option selected" data-delivery="pickup">
              <div class="delivery-option-icon">🏪</div>
              <div class="delivery-option-label">Retiro en local</div>
            </div>
            <div class="delivery-option" data-delivery="delivery">
              <div class="delivery-option-icon">🚗</div>
              <div class="delivery-option-label">Delivery</div>
            </div>
          </div>
        </div>

        <div class="form-group" id="address-group" style="display: none;">
          <label class="form-label">Direccion de entrega</label>
          <input type="text" class="form-input" id="checkout-address"
            placeholder="Calle, numero, piso, depto">
        </div>

        <h2 style="margin: 24px 0 16px;">Metodo de pago</h2>

        <div class="payment-options">
          <div class="payment-option selected" data-payment="lightning">
            <div class="payment-option-icon">⚡</div>
            <div class="payment-option-label">Lightning</div>
            <div class="payment-option-detail">5% descuento</div>
          </div>
          <div class="payment-option" data-payment="usd">
            <div class="payment-option-icon">💵</div>
            <div class="payment-option-label">USD</div>
            <div class="payment-option-detail">Via WhatsApp</div>
          </div>
        </div>

        <button class="btn btn-lightning btn-full btn-lg" id="btn-pay">
          Pagar $${totalUsd.toFixed(2)} USD
        </button>
      </div>

      <!-- COLUMNA DERECHA: Resumen -->
      <div>
        <div class="card">
          <h2 style="margin-bottom: 16px;">Resumen</h2>
          ${itemsListHtml}
          <hr style="border-color: var(--color-border); margin: 12px 0;">
          <div style="display: flex; justify-content: space-between;">
            <strong>Total USD</strong>
            <strong>$${totalUsd.toFixed(2)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 8px; color: var(--color-secondary);">
            <span>Total Lightning (-5%)</span>
            <span>${lightning.formatSats(totalSatsWithDiscount)} sats</span>
          </div>
          ${loyaltyDiscount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-top: 8px; color: var(--color-success);">
              <span>${loyaltyLevel.emoji} Descuento ${loyaltyLevel.name} (-${loyaltyDiscount * 100}%)</span>
              <span>${lightning.formatSats(totalSatsWithAllDiscounts)} sats</span>
            </div>
          ` : ''}
        </div>

        ${loyaltyDiscount > 0 ? `
          <div class="message message-success" style="margin-top: 16px;">
            ${loyaltyLevel.emoji} Tu nivel <strong>${loyaltyLevel.name}</strong> te da
            <strong>${loyaltyDiscount * 100}%</strong> de descuento adicional!
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // --- EVENT LISTENERS ---

  // Delivery options
  let selectedDelivery = 'pickup';
  container.querySelectorAll('.delivery-option').forEach(opt => {
    opt.addEventListener('click', () => {
      container.querySelectorAll('.delivery-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedDelivery = opt.dataset.delivery;
      document.getElementById('address-group').style.display =
        selectedDelivery === 'delivery' ? 'block' : 'none';
    });
  });

  // Payment options
  let selectedPayment = 'lightning';
  container.querySelectorAll('.payment-option').forEach(opt => {
    opt.addEventListener('click', () => {
      container.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedPayment = opt.dataset.payment;

      const btn = document.getElementById('btn-pay');
      if (selectedPayment === 'lightning') {
        const finalSats = loyaltyDiscount > 0 ? totalSatsWithAllDiscounts : totalSatsWithDiscount;
        btn.textContent = `⚡ Pagar ${lightning.formatSats(finalSats)} sats`;
        btn.className = 'btn btn-lightning btn-full btn-lg';
      } else {
        btn.textContent = `Pagar $${totalUsd.toFixed(2)} USD via WhatsApp`;
        btn.className = 'btn btn-primary btn-full btn-lg';
      }
    });
  });

  // Trigger inicial
  container.querySelector('.payment-option.selected').click();

  // Boton PAGAR
  document.getElementById('btn-pay').addEventListener('click', async () => {
    const name = document.getElementById('checkout-name').value.trim();
    const phone = document.getElementById('checkout-phone').value.trim();
    const address = document.getElementById('checkout-address')?.value.trim() || '';

    // Validaciones con toast
    if (!name) { toast.warning('Ingresa tu nombre'); return; }
    if (!phone) { toast.warning('Ingresa tu telefono'); return; }
    if (selectedDelivery === 'delivery' && !address) {
      toast.warning('Ingresa la direccion de entrega'); return;
    }

    if (selectedPayment === 'usd') {
      // --- PAGO USD: Abrir WhatsApp ---
      const orderDetails = itemsSummary
        .map(i => `${i.name} x${i.quantity}`)
        .join(', ');
      const whatsappUrl = lightning.getWhatsAppPaymentUrl(totalUsd, orderDetails);

      orderHistory.addOrder(user.pubkey, {
        items: itemsSummary.map(i => ({
          productId: i.id, name: i.name,
          quantity: i.quantity, priceUsd: i.priceUsd,
        })),
        totalUsd, totalSats: 0,
        paymentMethod: 'usd', deliveryMethod: selectedDelivery,
        deliveryAddress: address, customerName: name, customerPhone: phone,
      });

      cartStore.clear();
      updateCartBadge();

      container.innerHTML = `
        <div class="payment-success">
          <div class="payment-success-icon">📱</div>
          <h2>Pedido registrado!</h2>
          <p style="color: var(--color-text-muted); margin: 16px 0;">
            Tu pedido quedo registrado. Contacta por WhatsApp para coordinar el pago en USD.
          </p>
          <a href="${whatsappUrl}" target="_blank" class="btn btn-primary btn-lg" style="text-decoration: none;">
            Abrir WhatsApp
          </a>
          <br><br>
          <button class="btn btn-secondary" id="btn-back-catalog">Volver al catalogo</button>
        </div>
      `;
      container.querySelector('#btn-back-catalog').addEventListener('click', () => navigateTo('catalog'));

    } else {
      // --- PAGO LIGHTNING: Generar invoice con QR ---
      const btn = document.getElementById('btn-pay');
      btn.disabled = true;
      btn.innerHTML = '<span class="loader"></span> Generando invoice...';

      try {
        const finalSats = loyaltyDiscount > 0 ? totalSatsWithAllDiscounts : totalSatsWithDiscount;
        const description = `Sweet Shots - ${itemsSummary.map(i => `${i.name} x${i.quantity}`).join(', ')}`;

        // Crear invoice via servidor Vercel (sin CORS, sin popups NIP-07)
        const invoiceData = await createServerInvoice(finalSats, description);
        const paymentRequest = invoiceData.paymentRequest;

        // Mostrar invoice con QR code
        container.innerHTML = `
          <div class="invoice-container">
            <h2 style="margin-bottom: 8px;">Pagar con Lightning</h2>
            <p style="color: var(--color-text-muted); margin-bottom: 24px;">
              Escanea el codigo QR con tu wallet o paga desde el navegador
            </p>

            <div style="font-size: 2rem; font-weight: 700; color: var(--color-lightning); margin-bottom: 16px;">
              ⚡ ${lightning.formatSats(finalSats)} sats
            </div>

            <!-- QR Code -->
            <div class="invoice-qr" id="qr-container"></div>

            <div class="invoice-bolt11" id="invoice-text">
              ${paymentRequest}
            </div>

            <div style="display: flex; gap: 8px; justify-content: center; margin-bottom: 16px;">
              <button class="btn btn-secondary" id="btn-copy">
                Copiar invoice
              </button>
            </div>

            <button class="btn btn-lightning btn-full btn-lg" id="btn-webln-pay">
              ⚡ Pagar con Wallet del navegador
            </button>

            <p style="color: var(--color-text-muted); font-size: 0.8rem; margin-top: 16px;">
              Si tenes Alby u otra wallet, podes pagar con un click.
            </p>

            <div id="zap-status" style="margin-top: 16px; padding: 12px; background: #FFF3E0; border-radius: 8px; color: var(--color-lightning); font-size: 0.85rem; display: none;">
              <span class="loader" style="margin-right: 8px;"></span>
              Esperando confirmacion de pago...
            </div>
          </div>
        `;

        // Generar QR code
        renderQRCode(paymentRequest, 'qr-container');

        // Copiar invoice
        document.getElementById('btn-copy').addEventListener('click', () => {
          navigator.clipboard.writeText(paymentRequest);
          toast.success('Invoice copiado al portapapeles');
        });

        // --- Variables de deteccion (se limpian en handlePaymentSuccess) ---
        let serverPollInterval = null;

        // --- Funcion de exito compartida (WebLN y server polling) ---
        function handlePaymentSuccess(preimage) {
          // Detener mecanismos de deteccion
          if (serverPollInterval) { clearInterval(serverPollInterval); serverPollInterval = null; }
          if (window.__serverPollCleanup) { window.__serverPollCleanup(); window.__serverPollCleanup = null; }

          orderHistory.addOrder(user.pubkey, {
            items: itemsSummary.map(i => ({
              productId: i.id, name: i.name,
              quantity: i.quantity, priceUsd: i.priceUsd,
              priceSats: Math.round((i.priceUsd / btcPrice) * 100_000_000 * 0.95),
            })),
            totalUsd, totalSats: finalSats,
            paymentMethod: 'lightning', deliveryMethod: selectedDelivery,
            deliveryAddress: address, customerName: name, customerPhone: phone,
            preimage: preimage || null,
          });

          cartStore.clear();
          updateCartBadge();

          const pointsEarned = finalSats;
          container.innerHTML = `
            <div class="payment-success">
              <div class="payment-success-icon">✅</div>
              <h2 style="color: var(--color-success);">Pago exitoso!</h2>
              <p style="color: var(--color-text-muted); margin: 16px 0;">
                Gracias por tu compra! Tu pedido ha sido confirmado.
              </p>
              <div class="message message-success" style="max-width: 400px; margin: 16px auto;">
                Ganaste <strong>${lightning.formatSats(pointsEarned)} puntos</strong> de fidelidad!
              </div>
              <div style="margin-top: 24px;">
                <button class="btn btn-primary" id="btn-my-orders">Ver mis pedidos</button>
                <button class="btn btn-secondary" id="btn-back-catalog" style="margin-left: 8px;">Seguir comprando</button>
              </div>
            </div>
          `;
          toast.success('Pago confirmado!');
          container.querySelector('#btn-my-orders').addEventListener('click', () => navigateTo('account'));
          container.querySelector('#btn-back-catalog').addEventListener('click', () => navigateTo('catalog'));
        }

        // --- DETECCION 1: Polling al servidor cada 3 segundos (NIP-57 server-side) ---
        const zapStatus = document.getElementById('zap-status');
        if (zapStatus) zapStatus.style.display = 'block';

        serverPollInterval = setInterval(async () => {
          try {
            const result = await checkServerPayment(invoiceData);
            if (result.paid) {
              clearInterval(serverPollInterval);
              serverPollInterval = null;
              handlePaymentSuccess(result.preimage);
            }
          } catch (err) {
            console.error('[CHECKOUT] Error en server poll:', err);
          }
        }, 3000);

        // Cleanup al navegar fuera
        window.__serverPollCleanup = () => {
          if (serverPollInterval) { clearInterval(serverPollInterval); serverPollInterval = null; }
        };

        // Timeout de 10 minutos
        setTimeout(() => {
          if (serverPollInterval) { clearInterval(serverPollInterval); serverPollInterval = null; }
        }, 600000);

        // --- DETECCION 3: Pagar con WebLN (wallet del navegador) ---
        document.getElementById('btn-webln-pay').addEventListener('click', async () => {
          const weblnBtn = document.getElementById('btn-webln-pay');
          weblnBtn.disabled = true;
          weblnBtn.innerHTML = '<span class="loader"></span> Procesando pago...';

          const weblnResult = await lightning.payWithWebLN(paymentRequest);

          if (weblnResult) {
            handlePaymentSuccess(weblnResult.preimage);
          } else {
            weblnBtn.disabled = false;
            weblnBtn.textContent = '⚡ Pagar con Wallet del navegador';
            toast.warning('Pago cancelado. Podes intentar de nuevo o escanear el QR con otra wallet.');
          }
        });

      } catch (error) {
        btn.disabled = false;
        btn.textContent = 'Reintentar pago';
        toast.error('Error al generar invoice: ' + error.message);
      }
    }
  });
}
