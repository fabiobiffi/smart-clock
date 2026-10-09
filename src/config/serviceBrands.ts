import fabiobiffiLogo from '../assets/brands/fabiobiffi.png'
import giocaLogo from '../assets/brands/gioca.png'
import jiptvLogo from '../assets/brands/jiptv.png'
import onliteLogo from '../assets/brands/onlite.png'

/**
 * Visual identity of the services, by id (the same as in server/config.ts).
 * Colors and logos taken from the sites themselves (favicons/icons, theme-color, CSS).
 * gioca: the logo navy (#1e3a89) is almost invisible on black, so the light blue
 * from its CSS (#3b82f6) is used as the main color.
 * A service without an entry here uses the neutral style.
 */
export interface ServiceBrand {
  logo: string
  /** Colore principale del marchio. */
  primary: string
  /** Optional secondary color (second glow of the card). */
  secondary: string | null
  /** Sfondo del riquadro del logo. */
  logoBackground: string
}

export const SERVICE_BRANDS: Record<string, ServiceBrand> = {
  onlite: { logo: onliteLogo, primary: '#ce332a', secondary: '#5f599b', logoBackground: '#ffffff' },
  // Avatar drawn in black on white, inverted so as not to light up a white square on the AMOLED.
  fabiobiffi: { logo: fabiobiffiLogo, primary: '#f7f7f6', secondary: null, logoBackground: '#000000' },
  jiptv: { logo: jiptvLogo, primary: '#fedb03', secondary: null, logoBackground: '#08080a' },
  gioca: { logo: giocaLogo, primary: '#3b82f6', secondary: '#fb910d', logoBackground: '#1e3a89' },
}
