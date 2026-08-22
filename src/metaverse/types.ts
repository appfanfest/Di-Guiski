
export enum ExperienceType { 
  HORA_LOCA_HATS = 'Hora Loca Hats', 
  FACE_GLAM = 'Face Glam', 
  PHOTO_BOOTH = 'Photo Booth', 
  POSTALES_WASSAP = 'Postales Wassap', 
  MARCOS_PRO = 'Marcos Pro', 
  FONDOS_INMERSIVOS = 'Fondos Inmersivos' 
}

export enum SocialNetwork { 
  TIKTOK = 'TikTok', 
  SNAPCHAT = 'Snapchat', 
  INSTAGRAM = 'Instagram',
  FANFEST = 'FanFest'
}

export enum AccessLevel {
  FREE = 'Gratis',
  SILVER = 'Silver',
  GOLD = 'Gold'
}

// ── Particle system config ─────────────────────────────────
export interface ParticleConfig {
  enabled: boolean;
  image_url: string;          // sprite PNG hosted on imgbb (required to activate)
  count: number;              // particles per burst
  trigger: 'always' | 'movement';
}

// ── AR config stored as JSONB in experiences.ar_config ─────
export interface ARConfig {
  // Hora Loca Hats ──────────────────────────────────────────
  hat_url?: string;           // PNG sombrero — anchors to crown landmark
  glasses_url?: string;       // PNG lentes — anchors to nose bridge
  sticker_urls?: string[];    // extra PNGs on cheeks / forehead

  // Face Glam — Modo A: project image onto face ─────────────
  face_paint_url?: string;    // PNG (flag, tiger, logo...) clipped to face oval
  face_paint_opacity?: number;// 0.0–1.0 (default 0.75)
  face_paint_blend?: 'normal' | 'multiply' | 'overlay'; // default 'normal'

  // Face Glam — Modo B: color zones ────────────────────────
  face_paint_zones?: {
    lips?:   { color: string; opacity: number };
    eyes?:   { color: string; opacity: number };
    cheeks?: { color: string; opacity: number };
  };

  // Fondos Inmersivos ───────────────────────────────────────
  background_url?: string;    // background image (falls back to activation_link)
  blur_edge?: number;         // segmentation edge blur 0–10 (default 4)

  // Shared: particle system ─────────────────────────────────
  particles?: ParticleConfig; // omit entirely to disable particles
}

export interface Experience {
  id: string; 
  title: string; 
  description: string; 
  socialNetwork: SocialNetwork; 
  activationLink: string; 
  demoLink: string; 
  photoboothLink3?: string; 
  photoboothLink4?: string; 
  imageUrl: string; 
  type: ExperienceType; 
  category: string; 
  isMultiUser: boolean; 
  promotor_id?: string;
  level: AccessLevel;
  ar_config?: ARConfig;       // null → video + marco overlay only
}
