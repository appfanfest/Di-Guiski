const fs = require('fs');
const es = JSON.parse(fs.readFileSync('src/i18n/locales/es.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf8'));

for (const key of Object.keys(es)) {
  if (!en[key]) {
    en[key] = es[key];
  }
}

fs.writeFileSync('src/i18n/locales/en.json', JSON.stringify(en, null, 2));
console.log('Fixed en.json');
