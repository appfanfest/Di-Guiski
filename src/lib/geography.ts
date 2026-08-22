export const countryStatesMapping: Record<string, string[]> = {
  'Venezuela': [
    'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar', 'Carabobo', 'Cojedes', 'Delta Amacuro',
    'Distrito Capital', 'Falcón', 'Guárico', 'Lara', 'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta', 'Portuguesa',
    'Sucre', 'Táchira', 'Trujillo', 'La Guaira', 'Yaracuy', 'Zulia'
  ],
  'Colombia': [
    'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá', 'Casanare',
    'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena',
    'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia', 'Santander',
    'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada'
  ],
  'México': [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México',
    'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán',
    'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
    'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
  ],
  'Argentina': [
    'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Ciudad Autónoma de Buenos Aires', 'Córdoba', 'Corrientes', 'Entre Ríos',
    'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
    'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
  ],
  'España': [
    'Andalucía', 'Aragón', 'Asturias', 'Islas Baleares', 'Canarias', 'Cantabria', 'Castilla y León', 'Castilla-La Mancha',
    'Cataluña', 'Comunidad Valenciana', 'Extremadura', 'Galicia', 'Madrid', 'Murcia', 'Navarra', 'País Vasco', 'La Rioja',
    'Ceuta', 'Melilla'
  ]
};

export const getStatesForCountry = (countryName: string): string[] => {
  if (!countryName) return [];
  
  // Normalizar: Primera letra mayúscula, resto minúscula (Ej: VENEZUELA -> Venezuela)
  const normalized = countryName.trim().charAt(0).toUpperCase() + countryName.trim().slice(1).toLowerCase();
  
  return countryStatesMapping[normalized] || countryStatesMapping[countryName.trim()] || [];
};
