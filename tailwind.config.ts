import type { Config } from 'tailwindcss';

// FERVOR (Germán) identity — fuego/naranja
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fervor: {
          flame:       '#FF5A1F',  // primario fuego
          'flame-l':   '#FF7E4D',  // hover
          'flame-d':   '#C73C0A',  // sombra
          ember:       '#FFA257',  // acento cálido
          ink:         '#0A0908',  // fondo principal
          'ink-2':     '#16120E',  // surfaces
          'ink-3':     '#211A14',  // hover/inputs
          border:      '#2C241D',
          'border-soft':'#3A3127',
          smoke:       '#9A8F85',  // muted
          ash:         '#D6CDC4',  // texto
          paper:       '#F7F2EC',  // alt claro
        },
        ok:    '#27D17F',
        warn:  '#FFC53D',
        alert: '#FF4D4D',
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        flame: '0 0 40px rgba(255, 90, 31, 0.35)',
        card:  '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};
export default config;
