/**
 * products.js — Catálogo de productos de Sweet Shots
 *
 * Cada producto tiene:
 * - id: identificador único (coincide con nombre de imagen en /public/images/products/)
 * - name: nombre del pastel
 * - description: descripción breve
 * - priceUsd: precio en dólares (se convierte a sats automáticamente)
 * - category: 'un-piso' o 'dos-pisos'
 * - emoji: placeholder si no hay foto
 * - sizes: tamaño del pastel
 * - servings: para cuántas personas alcanza
 * - flavors: array de sabores disponibles
 */

export const products = [
  // === PASTELES DE UN PISO ===
  {
    id: 'cake-6',
    name: 'Pastel 6"',
    description: 'Pastel de un piso, 6 pulgadas de diámetro.',
    priceUsd: 0.085, // TEST: ~100 sats — cambiar a 15 después de probar
    category: 'un-piso',
    emoji: '🎂',
    sizes: '6"',
    servings: '6-8 personas',
    flavors: ['Chocolate', 'Vainilla', 'Red Velvet', 'Dulce de leche'],
  },
  {
    id: 'cake-7',
    name: 'Pastel 7"',
    description: 'Pastel de un piso, 7 pulgadas de diámetro.',
    priceUsd: 20,
    category: 'un-piso',
    emoji: '🎂',
    sizes: '7"',
    servings: '8-12 personas',
    flavors: ['Chocolate', 'Vainilla', 'Red Velvet', 'Dulce de leche'],
  },
  {
    id: 'cake-8',
    name: 'Pastel 8"',
    description: 'Pastel de un piso, 8 pulgadas de diámetro.',
    priceUsd: 25,
    category: 'un-piso',
    emoji: '🎂',
    sizes: '8"',
    servings: '12-16 personas',
    flavors: ['Chocolate', 'Vainilla', 'Red Velvet', 'Dulce de leche', 'Limón'],
  },
  {
    id: 'cake-10',
    name: 'Pastel 10"',
    description: 'Pastel de un piso, 10 pulgadas de diámetro.',
    priceUsd: 35,
    category: 'un-piso',
    emoji: '🎂',
    sizes: '10"',
    servings: '20-25 personas',
    flavors: ['Chocolate', 'Vainilla', 'Red Velvet', 'Dulce de leche', 'Limón'],
  },

  // === PASTELES DE DOS PISOS ===
  {
    id: 'cake-5-7',
    name: 'Pastel 5" + 7"',
    description: 'Pastel de dos pisos (5" y 7").',
    priceUsd: 45,
    category: 'dos-pisos',
    emoji: '🎂',
    sizes: '5" + 7"',
    servings: '15-20 personas',
    flavors: ['Chocolate', 'Vainilla', 'Red Velvet', 'Dulce de leche'],
  },
  {
    id: 'cake-6-8',
    name: 'Pastel 6" + 8"',
    description: 'Pastel de dos pisos (6" y 8").',
    priceUsd: 55,
    category: 'dos-pisos',
    emoji: '🎂',
    sizes: '6" + 8"',
    servings: '20-28 personas',
    flavors: ['Chocolate', 'Vainilla', 'Red Velvet', 'Dulce de leche', 'Limón'],
  },
  {
    id: 'cake-7-9',
    name: 'Pastel 7" + 9"',
    description: 'Pastel de dos pisos (7" y 9").',
    priceUsd: 70,
    category: 'dos-pisos',
    emoji: '🎂',
    sizes: '7" + 9"',
    servings: '28-35 personas',
    flavors: ['Chocolate', 'Vainilla', 'Red Velvet', 'Dulce de leche', 'Limón'],
  },
];