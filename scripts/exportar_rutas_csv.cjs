const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.cwd(), 'public', 'metaversos');
const records = [];

function walk(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else {
      if (item.startsWith('.')) continue; // ignore .gitkeep
      const ext = path.extname(item).toLowerCase();
      if (!['.webp', '.png', '.jpg', '.jpeg', '.svg'].includes(ext)) continue;

      // Generar ruta relativa limpia empezando por /metaversos/...
      const relPath = full.replace(path.join(process.cwd(), 'public'), '').split(path.sep).join('/');
      const parts = relPath.split('/').filter(Boolean); // ['metaversos', 'calipsofest', 'SALIDAS', ...]
      
      const metaverso = parts[1] || '';
      const section = parts[2] || ''; 
      
      let category = '';
      if (section.toUpperCase() === 'SALIDAS') {
        category = parts[3] || '';
        if (category.toUpperCase() === 'PDFS' && parts[4]) {
          category = 'PDFS/' + parts[4];
          if (parts[4].toUpperCase() === 'PAPERCRAFTS' && parts[5]) {
            category = 'PDFS/PAPERCRAFTS/' + parts[5];
          }
        }
      } else {
        category = section;
      }

      records.push({
        metaverso,
        categoria: category,
        archivo: item,
        ruta_completa: relPath
      });
    }
  }
}

walk(baseDir);
console.log('Total de plantillas encontradas:', records.length);

// Escape CSV field
function csvField(str) {
  if (str === null || str === undefined) return '';
  const s = String(str);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

const csvHeader = 'metaverso,categoria,archivo,ruta_completa\n';
const csvRows = records.map(r => [
  csvField(r.metaverso),
  csvField(r.categoria),
  csvField(r.archivo),
  csvField(r.ruta_completa)
].join(',')).join('\n');

const outPath = path.join(process.cwd(), 'rutas_plantillas_metaversos.csv');
fs.writeFileSync(outPath, '\uFEFF' + csvHeader + csvRows, 'utf8');
console.log('Archivo CSV guardado en:', outPath);
