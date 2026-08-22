// Atlantis 5.0 Types — Restauración Fiel para FanFest 5.0

export enum AccessLevel { BRONZE = 'Bronce', SILVER = 'Silver', GOLD = 'Gold', ADMIN = 'Admin' }
export enum ExperienceType { HORA_LOCA_HATS = 'Hora Loca Hats', FACE_GLAM = 'Face Glam', PHOTO_BOOTH = 'Photo Booth', POSTALES_WASSAP = 'Postales Wassap', MARCOS_PRO = 'Marcos Pro', FONDOS_INMERSIVOS = 'Fondos Inmersivos', POSTERS = 'Posters', MI_ALBUM = 'Mi Album', POSTALES = 'Postales', POSTALES_DOBLADAS = 'Postales Dobladas', PAPERCRAFT_CAJA = 'Papercraft Caja', PAPERCRAFT_CAJITA_FELIZ = 'Papercraft Cajita Feliz', PAPERCRAFT_DOMO = 'Papercraft Domo', PAPERCRAFT_CARRUSEL = 'Papercraft Carrusel' }
export enum SocialNetwork { TIKTOK = 'TikTok', SNAPCHAT = 'Snapchat', CANVA = 'Canva', GEMINI = 'Gemini', ATLANTIS = 'Atlantis', FANFEST = 'FanFest' }

export type NicheType = string | number;

export interface CategoryConfig { label: string; img: string; icon?: string; }
export interface FAQItem { title: string; img: string; description: string; }

export interface NicheConfig {
  id: NicheType;
  name: string;
  title?: string;
  slogan?: string;
  logo_url: string;
  hero_url: string;
  hero_print?: string | null;
  onboarding_images: string[];
  primary_color: string;
  secondary_color: string;
  base_color: string;
  category_configs: Record<string, CategoryConfig>;
  faq_configs?: FAQItem[];
  is_commercial?: boolean;
}

export interface UserAccess {
  id: string;
  user_id: string;
  niche_id: NicheType;
  unlocked_at: string;
  niche_data?: { name: string; logo_url: string; title?: string; };
}

export interface Experience {
  id: string;
  title: string;
  description: string;
  socialNetwork: SocialNetwork;
  activationLink: string;
  activation_link: string;
  demoLink: string;
  photoboothLink3?: string;
  photoboothLink4?: string;
  es_poster?: boolean;
  es_album?: boolean;
  es_papercraft?: boolean;
  imageUrl: string;
  level: AccessLevel;
  type: ExperienceType;
  category: string;
  isMultiUser: boolean;
  photofiestas_postal?: boolean;
  niche: NicheType;
}

export interface AtlantisUser { id: string; email: string; name?: string; thumbUrl?: string; level: AccessLevel; isAdmin: boolean; }

export interface AppContextType {
  user: AtlantisUser | null;
  experiences: Experience[];
  allNiches: { id: NicheType; name: string; logo_url: string; is_commercial?: boolean }[];
  unlockedNiches: UserAccess[];
  currentNiche: NicheType;
  nicheConfig: NicheConfig | null;
  setCurrentNiche: (niche: NicheType) => void;
  loading: boolean;
  logout: () => void;
}
