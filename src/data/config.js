/**
 * config.js — Configuracion del negocio
 *
 * EXPLICACION:
 * Aca van los datos de configuracion de Sweet Shots.
 * Cuando quieras poner tu Lightning Address real, la cambias aca.
 *
 * IMPORTANTE: La Lightning Address es como un "email" para recibir Bitcoin.
 * Si tenes Alby, tu address seria algo como "tunombre@getalby.com".
 * Si usas otro servicio, sera diferente (ej: "usuario@walletofsatoshi.com").
 */

export const config = {
  // Nombre del negocio
  businessName: 'Sweet Shots',

  // Lightning Address del negocio (para recibir pagos)
  // CAMBIA ESTO por tu Lightning Address real
  lightningAddress: 'sweetshotsp@walletofsatoshi.com',

  // Numero de WhatsApp para pagos en USD (con codigo de pais)
  // CAMBIA ESTO por tu numero real
  whatsappNumber: '+5491112345678',

  // Mensaje predeterminado de WhatsApp para pagos en USD
  whatsappMessage: 'Hola! Quiero pagar mi pedido de Sweet Shots en USD.',

  // Descuento por pagar con Lightning (5% = 0.05)
  lightningDiscount: 0.05,

  // Metodo de entrega habilitados
  deliveryMethods: {
    pickup: true,    // Retiro en local
    delivery: true,  // Envio a domicilio
  },

  // Direccion del local (para retiro)
  pickupAddress: 'Tu direccion del local aca',

  // Relays de Nostr para buscar perfiles de usuarios
  // Los relays son servidores que almacenan datos de Nostr
  nostrRelays: [
    'wss://relay.damus.io',
    'wss://relay.nostr.band',
    'wss://nos.lol',
  ],

  // Nostr pubkey de WoS (para validar zap receipts NIP-57)
  wosNostrPubkey: 'be1d89794bf92de5dd64c1e60f6a2c70c140abac9932418fee30c5c637fe9479',
};
