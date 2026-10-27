/**
 * src/lib/assetHelper.ts
 * Utilidades para resolución de rutas de assets y metaversos.
 * Arquitectura Híbrida:
 * - Soporta URLs externas existentes (ImgBB, Supabase Storage, CDN).
 * - Soporta rutas estáticas locales en Vercel (/metaversos/... y /assets/...).
 * - Mapea exactamente la estructura de carpetas física del usuario.
 */

export const CATEGORY_FOLDER_MAP: Record<string, string> = {
  'Hora Loca Hats': 'Salidas/Hora Loca Hats',
  'Face Glam': 'Salidas/Face Glam',
  'Marcos Pro': 'Salidas/Marcos Pro',
  'Postales Wassap': 'Salidas/Postales Wassap',
  'Photo Booth': 'Salidas/Photo Booth',
  'Fondos Inmersivos': 'Salidas/Fondos Inmersivos',
  'Mi Album': 'Salidas/PDFS/MI ALBUM',
  'Mi Álbum': 'Salidas/PDFS/MI ALBUM',
  'Postales': 'Salidas/PDFS/POSTALES',
  'Postales Dobladas': 'Salidas/PDFS/POSTALES DOBLADAS',
  'Posters': 'Salidas/PDFS/POSTERS',
  'Papercraft Caja': 'Salidas/PDFS/PAPERCRAFTS/CAJAS',
  'Papercraft Cajita Feliz': 'Salidas/PDFS/PAPERCRAFTS/HAPPY MEALS',
  'Papercraft Domo': 'Salidas/PDFS/PAPERCRAFTS/DIORAMAS',
  'Papercraft Carrusel': 'Salidas/PDFS/PAPERCRAFTS/CARRUSELES',
};

/**
 * Obtiene la subcarpeta correspondiente a una categoría de experiencia.
 */
export function getCategoryFolder(category: string): string {
  if (CATEGORY_FOLDER_MAP[category]) {
    return CATEGORY_FOLDER_MAP[category];
  }
  // Normalización fallback
  return `Salidas/${category}`;
}

/**
 * Resuelve cualquier URL de asset de manera segura.
 * - Si es http://, https://, data:, blob: -> la devuelve intacta (soporte híbrido).
 * - Si es ruta local -> asegura la barra inicial y codifica caracteres especiales/espacios.
 */
export function resolveAssetUrl(url: string | null | undefined, fallback: string = ''): string {
  if (!url) return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  // URLs completas (ImgBB, Supabase Storage, data:image, blob:)
  if (/^(https?:|data:|blob:|\/\/)/i.test(trimmed)) {
    return trimmed;
  }

  // Rutas locales de Vercel (public)
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return encodeURI(normalizedPath);
}

/**
 * Construye la ruta estática hacia un asset dentro de un metaverso según la estructura acordada:
 * /metaversos/[Nombre_Metaverso]/Salidas/[Categoria]/[Archivo]
 */
export function buildMetaverseAssetUrl(
  metaverseName: string,
  category: string,
  filename: string
): string {
  const metaDir = metaverseName.trim();
  const catFolder = getCategoryFolder(category);
  const cleanFilename = filename.replace(/^\/+/, '');
  const rawPath = `/metaversos/${metaDir}/${catFolder}/${cleanFilename}`;
  return encodeURI(rawPath);
}
