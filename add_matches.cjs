const fs = require('fs');
const es = JSON.parse(fs.readFileSync('src/i18n/locales/es.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf8'));

es.matches_view = {
  calendario: 'Calendario',
  partidosOficiales: 'Partidos Oficiales',
  partidos: 'partidos',
  todos: 'Todos',
  fecha: 'Fecha',
  grupo: 'Grupo',
  sede: 'Sede',
  equipo: 'Equipo',
  todas: 'Todas',
  buscarEquipo: 'Buscar equipo...',
  todosEquipos: 'Todos los Equipos',
  noMatches: 'No hay partidos para este filtro'
};

en.matches_view = {
  calendario: 'Schedule',
  partidosOficiales: 'Official Matches',
  partidos: 'matches',
  todos: 'All',
  fecha: 'Date',
  grupo: 'Group',
  sede: 'Venue',
  equipo: 'Team',
  todas: 'All',
  buscarEquipo: 'Search team...',
  todosEquipos: 'All Teams',
  noMatches: 'No matches for this filter'
};

fs.writeFileSync('src/i18n/locales/es.json', JSON.stringify(es, null, 2));
fs.writeFileSync('src/i18n/locales/en.json', JSON.stringify(en, null, 2));
console.log('Matches view added.');
