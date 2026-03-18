/**
 * nostr-auth.js — Autenticacion con Nostr
 *
 * EXPLICACION:
 * Nostr es un protocolo descentralizado (como Bitcoin pero para identidad y mensajes).
 * Los usuarios tienen una "clave publica" (pubkey) que es su identidad.
 *
 * NIP-07 es un estandar que define como las extensiones del navegador
 * (como Alby o nos2x) exponen la identidad del usuario a las paginas web.
 * La extension agrega un objeto `window.nostr` al navegador.
 *
 * NDK (Nostr Dev Kit) es una libreria que facilita conectarse a "relays"
 * (servidores de Nostr) para buscar perfiles, mensajes, etc.
 *
 * FLUJO DE LOGIN:
 * 1. Verificar que el usuario tiene una extension Nostr (window.nostr)
 * 2. Pedir la pubkey con window.nostr.getPublicKey()
 * 3. Conectar a relays de Nostr con NDK
 * 4. Buscar el perfil del usuario (nombre, foto, etc)
 * 5. Guardar los datos en memoria
 */

import NDK from '@nostr-dev-kit/ndk';
import { config } from '../data/config.js';

// Variable que guarda los datos del usuario logueado (null = no logueado)
let currentUser = null;

export const nostrAuth = {
  /**
   * Intentar login con Nostr
   *
   * @returns {Object} — Datos del usuario { pubkey, name, picture, ... }
   * @throws {Error} — Si no hay extension Nostr instalada
   */
  async login() {
    // Paso 1: Verificar que existe window.nostr (extension instalada)
    if (!window.nostr) {
      throw new Error(
        'No se detecto una extension de Nostr. ' +
        'Instala Alby (getalby.com) o nos2x para poder iniciar sesion.'
      );
    }

    // Paso 2: Pedir la clave publica al usuario
    // La extension le muestra un popup al usuario para que autorice
    const pubkey = await window.nostr.getPublicKey();

    // Paso 3: Conectar a relays de Nostr para buscar el perfil (timeout 3s)
    const ndk = new NDK({
      explicitRelayUrls: config.nostrRelays,
    });
    await ndk.connect(3000);

    // Paso 4: Buscar el perfil del usuario en los relays
    // El perfil en Nostr se llama "kind 0" y contiene nombre, foto, bio, etc.
    const user = ndk.getUser({ pubkey });
    try {
      await user.fetchProfile();
    } catch (_) {
      // Si no se puede obtener el perfil, continuar con solo la pubkey
    }

    // Paso 5: Guardar datos del usuario
    currentUser = {
      pubkey,
      name: user.profile?.displayName || user.profile?.name || null,
      picture: user.profile?.image || user.profile?.picture || null,
      about: user.profile?.about || null,
      nip05: user.profile?.nip05 || null,
      lud16: user.profile?.lud16 || null, // Lightning Address del usuario
    };

    return currentUser;
  },

  /**
   * Cerrar sesion
   */
  logout() {
    currentUser = null;
  },

  /**
   * Obtener datos del usuario actual
   * @returns {Object|null} — Datos del usuario o null si no esta logueado
   */
  getUser() {
    return currentUser;
  },

  /**
   * Verificar si el usuario esta logueado
   * @returns {boolean}
   */
  isLoggedIn() {
    return currentUser !== null;
  },
};
