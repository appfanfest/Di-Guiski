const fs = require('fs');
const path = require('path');

const categories = [
  { file: 'carnaval-hats.svg', title: 'Hora Loca Hats', color1: '#FF2D31', color2: '#FF8A00' },
  { file: 'face-glam.svg', title: 'Face Glam', color1: '#EC4899', color2: '#8B5CF6' },
  { file: 'photo-booth.svg', title: 'Photo Booth', color1: '#3B82F6', color2: '#06B6D4' },
  { file: 'postales-wassap.svg', title: 'Postales Wassap', color1: '#10B981', color2: '#059669' },
  { file: 'marcos-pro.svg', title: 'Marcos Pro', color1: '#EAB308', color2: '#F59E0B' },
  { file: 'fondos-inmersivos.svg', title: 'Fondos Inmersivos', color1: '#6366F1', color2: '#3B82F6' },
  { file: 'posters.svg', title: 'Posters', color1: '#8B5CF6', color2: '#EC4899' },
  { file: 'mi-album.svg', title: 'Mi Álbum', color1: '#F43F5E', color2: '#BE123C' },
  { file: 'postales.svg', title: 'Postales', color1: '#14B8A6', color2: '#0D9488' },
  { file: 'postales-dobladas.svg', title: 'Postales Dobladas', color1: '#0284C7', color2: '#0369A1' },
  { file: 'papercraft-caja.svg', title: 'Papercraft Caja', color1: '#D97706', color2: '#B45309' },
  { file: 'papercraft-cajita-feliz.svg', title: 'Papercraft Cajita Feliz', color1: '#DC2626', color2: '#F59E0B' },
  { file: 'papercraft-domo.svg', title: 'Papercraft Domo', color1: '#7C3AED', color2: '#4F46E5' },
  { file: 'papercraft-carrusel.svg', title: 'Papercraft Carrusel', color1: '#DB2777', color2: '#9333EA' }
];

const targetDir = path.join(__dirname, '..', 'public', 'assets', 'categories');
fs.mkdirSync(targetDir, { recursive: true });

for (const c of categories) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <defs>
    <linearGradient id="g_${c.file.replace(/[^a-z0-9]/gi, '_')}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c.color1}" />
      <stop offset="100%" stop-color="${c.color2}" />
    </linearGradient>
  </defs>
  <rect width="600" height="800" rx="32" fill="url(#g_${c.file.replace(/[^a-z0-9]/gi, '_')})" />
  <circle cx="300" cy="350" r="140" fill="white" opacity="0.12" />
  <text x="300" y="360" font-family="system-ui, sans-serif" font-size="34" font-weight="900" fill="white" text-anchor="middle" letter-spacing="1">${c.title.toUpperCase()}</text>
  <text x="300" y="410" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="white" opacity="0.8" text-anchor="middle" letter-spacing="3">SAYLUCY METAVERSE</text>
</svg>`;

  fs.writeFileSync(path.join(targetDir, c.file), svg, 'utf8');
}
console.log('Categories SVGs created successfully!');
