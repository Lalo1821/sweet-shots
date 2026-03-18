/**
 * loyalty.js — Programa de fidelidad
 *
 * EXPLICACION:
 * Los clientes que pagan con Lightning acumulan puntos.
 * Por cada sat gastado, ganan 1 punto.
 * Al acumular suficientes puntos, desbloquean descuentos.
 *
 * NIVELES:
 * - 0 a 49,999 puntos     → Sin descuento (nivel "Nuevo")
 * - 50,000 a 99,999 puntos → 5% descuento (nivel "Regular")
 * - 100,000+ puntos        → 10% descuento (nivel "VIP")
 *
 * Los puntos se calculan a partir del historial de pedidos,
 * no se guardan por separado. Esto evita inconsistencias.
 */

import { orderHistory } from './order-history.js';

// Definicion de niveles
const LEVELS = [
  { name: 'Nuevo', minPoints: 0, discount: 0, emoji: '⭐' },
  { name: 'Regular', minPoints: 50_000, discount: 0.05, emoji: '🌟' },
  { name: 'VIP', minPoints: 100_000, discount: 0.10, emoji: '💎' },
];

export const loyalty = {
  /**
   * Obtener los puntos acumulados de un usuario
   * (1 sat gastado via Lightning = 1 punto)
   *
   * @param {string} pubkey — Pubkey del usuario
   * @returns {number} — Puntos totales
   */
  getPoints(pubkey) {
    return orderHistory.getTotalSpentSats(pubkey);
  },

  /**
   * Obtener el nivel actual del usuario
   *
   * @param {string} pubkey — Pubkey del usuario
   * @returns {Object} — { name, minPoints, discount, emoji }
   */
  getLevel(pubkey) {
    const points = this.getPoints(pubkey);

    // Recorrer niveles de mayor a menor para encontrar el que aplica
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (points >= LEVELS[i].minPoints) {
        return LEVELS[i];
      }
    }

    return LEVELS[0]; // Nunca deberia llegar aca, pero por seguridad
  },

  /**
   * Obtener el descuento que le corresponde al usuario
   *
   * @param {string} pubkey — Pubkey del usuario
   * @returns {number} — Descuento como decimal (ej: 0.05 = 5%)
   */
  getDiscount(pubkey) {
    return this.getLevel(pubkey).discount;
  },

  /**
   * Obtener el siguiente nivel (para mostrar progreso)
   *
   * @param {string} pubkey — Pubkey del usuario
   * @returns {Object|null} — Siguiente nivel o null si es VIP
   */
  getNextLevel(pubkey) {
    const points = this.getPoints(pubkey);

    for (const level of LEVELS) {
      if (points < level.minPoints) {
        return level;
      }
    }

    return null; // Ya es el nivel maximo
  },

  /**
   * Obtener progreso hacia el siguiente nivel (0 a 100)
   *
   * @param {string} pubkey — Pubkey del usuario
   * @returns {number} — Porcentaje de progreso (0-100)
   */
  getProgress(pubkey) {
    const points = this.getPoints(pubkey);
    const currentLevel = this.getLevel(pubkey);
    const nextLevel = this.getNextLevel(pubkey);

    if (!nextLevel) return 100; // Ya es VIP

    const range = nextLevel.minPoints - currentLevel.minPoints;
    const progress = points - currentLevel.minPoints;
    return Math.min(100, Math.round((progress / range) * 100));
  },

  /**
   * Obtener todos los niveles (para mostrar tabla de niveles)
   * @returns {Array}
   */
  getAllLevels() {
    return LEVELS;
  },
};
