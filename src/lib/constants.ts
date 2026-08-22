/**
 * CONFIGURACIÓN GLOBAL Y FALLBACKS DE FANFEST 2026
 * Este archivo centraliza la identidad visual para garantizar estabilidad.
 */

export const APP_CONFIG = {
  NAME: 'FANFEST 5.0',
  VIBE_CODING: 'Pedro Luis Ríos',
  RIF: 'J-507150585',
  INIT_TIMEOUT: 5000, // 5 segundos de espera máxima para datos de DB
};

export const FLAG_FALLBACKS: Record<string, string> = {
  'Venezuela': 'https://flagcdn.com/w320/ve.png',
  'Colombia': 'https://flagcdn.com/w320/co.png',
  'Panamá': 'https://flagcdn.com/w320/pa.png',
  'Estados Unidos': 'https://flagcdn.com/w320/us.png',
  'España': 'https://flagcdn.com/w320/es.png',
  'México': 'https://flagcdn.com/w320/mx.png',
  'Ecuador': 'https://flagcdn.com/w320/ec.png',
  'Perú': 'https://flagcdn.com/w320/pe.png',
  'Chile': 'https://flagcdn.com/w320/cl.png',
  'Argentina': 'https://flagcdn.com/w320/ar.png',
};

export const ORG_FALLBACK = {
  nombre: 'FanFest Digital 2026',
  slogan: 'Lleva tu fanfest al siguiente nivel',
  hero_image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80',
  logo_url: null, // Si es null, se usa el icono Trophy por defecto
  atlantis_dir: 'metaverso-2026',
  video_youtube: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder seguro
};

export const DEFAULT_COUNTRIES = Object.entries(FLAG_FALLBACKS).map(([nombre, url]) => ({
  id: nombre,
  nombre,
  bandera_pais: url,
  bandera_url: url,
}));
