/**
 * cart-store.js — Manejo del carrito de compras
 *
 * EXPLICACION:
 * Este modulo maneja todo lo relacionado con el carrito.
 * Usa "localStorage" para guardar los datos, lo que significa que
 * si cerras el navegador y volves, el carrito sigue ahi.
 *
 * localStorage es como una mini base de datos que el navegador
 * guarda en tu computadora. Solo almacena texto (strings),
 * por eso usamos JSON.stringify/parse para convertir objetos a texto y viceversa.
 *
 * PATRON: Este archivo exporta un objeto "cartStore" con metodos.
 * Es como una "caja" que guarda los items y tiene funciones para
 * agregar, quitar, y consultar.
 */

const STORAGE_KEY = 'sweetshots_cart';

/**
 * Leer el carrito de localStorage
 * @returns {Array} — Array de items [{productId, quantity}, ...]
 */
function getItems() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Guardar el carrito en localStorage
 * @param {Array} items — Array de items para guardar
 */
function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const cartStore = {
  /**
   * Obtener todos los items del carrito
   * @returns {Array} — [{productId: 'cake-6', quantity: 2}, ...]
   */
  getItems() {
    return getItems();
  },

  /**
   * Agregar un producto al carrito
   * Si ya existe, incrementa la cantidad en 1.
   * Si no existe, lo agrega con cantidad 1.
   *
   * @param {string} productId — ID del producto (ej: 'cake-6')
   */
  addItem(productId) {
    const items = getItems();
    const existing = items.find(item => item.productId === productId);

    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({ productId, quantity: 1 });
    }

    saveItems(items);
  },

  /**
   * Cambiar la cantidad de un producto
   * Si la cantidad llega a 0 o menos, lo elimina del carrito.
   *
   * @param {string} productId — ID del producto
   * @param {number} quantity — Nueva cantidad
   */
  setQuantity(productId, quantity) {
    let items = getItems();

    if (quantity <= 0) {
      // Eliminar el item si la cantidad es 0 o negativa
      items = items.filter(item => item.productId !== productId);
    } else {
      const existing = items.find(item => item.productId === productId);
      if (existing) {
        existing.quantity = quantity;
      }
    }

    saveItems(items);
  },

  /**
   * Eliminar un producto del carrito
   * @param {string} productId — ID del producto a eliminar
   */
  removeItem(productId) {
    const items = getItems().filter(item => item.productId !== productId);
    saveItems(items);
  },

  /**
   * Obtener la cantidad total de items en el carrito
   * Suma todas las cantidades (ej: 2 pasteles + 3 pasteles = 5)
   * @returns {number}
   */
  getTotalItems() {
    return getItems().reduce((total, item) => total + item.quantity, 0);
  },

  /**
   * Vaciar el carrito completamente
   */
  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
