
export enum AccessLevel { BRONZE = 'Bronce', SILVER = 'Silver', GOLD = 'Gold', ADMIN = 'Admin' }
export enum ExperienceType { HORA_LOCA_HATS = 'Hora Loca Hats', GLAM_NAVIDENO = 'Face Glam', PHOTO_BOOTH = 'Photo Booth', POSTALES_WASSAP = 'Postales Wassap', MARCOS_PRO = 'Marcos Pro', FONDOS_INMERSIVOS = 'Fondos Inmersivos' }
export enum SocialNetwork { TIKTOK = 'TikTok', SNAPCHAT = 'Snapchat', CANVA = 'Canva', GEMINI = 'Gemini' }

export enum NicheTypeEnum { 
  NAVIFEST = 'navifest', 
  KIDS = 'kids', 
  SPORTS = 'sports',
  GLOBAL = 'global' 
}

export type NicheType = NicheTypeEnum | string | number;

export interface CategoryConfig {
  label: string;
  img: string;
}

export interface FAQItem {
  title: string;
  img: string;
  description: string;
}

export interface NicheConfig {
  id: NicheType;
  name: string;
  title?: string;
  slogan?: string;
  logo_url: string;
  hero_url: string;
  onboarding_images: string[];
  primary_color: string; 
  secondary_color: string;
  base_color: string; 
  category_configs: Record<string, CategoryConfig>;
  faq_configs?: FAQItem[]; 
  domain?: string;
  is_commercial?: boolean;
  campaign_end?: string;
  commercial_description?: string;
}

export interface UserAccess {
  id: string;
  user_id: string;
  niche_id: NicheType;
  unlocked_at: string;
  niche_data?: {
    name: string;
    logo_url: string;
    title?: string;
  };
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
  level: AccessLevel; 
  type: ExperienceType; 
  category: string; 
  isMultiUser: boolean; 
  photofiestas_postal?: boolean;
  niche: NicheType;
}

export interface User { id: string; email: string; name?: string; thumbUrl?: string; level: AccessLevel; isAdmin: boolean; }
export interface UserProfile { id: string; email: string; full_name?: string; level: AccessLevel; created_at: string; avatar_url?: string; niche?: NicheType; }
export interface Coupon { id: string; code: string; discount_percent: number; is_active: boolean; created_at?: string; niche: NicheType; }
export interface Payment { id: string; userEmail: string; beneficiaryEmail: string; plan: AccessLevel; dateTime: string; bank?: string; originBank?: string; originPhone?: string; amountVes?: number; reference: string; rateBCV: number; amount: number; paymentMethod: 'Zelle' | 'Pago Movil'; status: 'pending' | 'approved' | 'rejected'; couponCode?: string; niche: NicheType; }
export interface SystemConfig { id: string; bcv_rate: number; zelle_email: string; zelle_name: string; pm_bank: string; pm_phone: string; pm_rif: string; }

export interface AuthResult { success: boolean; message?: string; }

export interface AppContextType {
  user: User | null; 
  experiences: Experience[]; 
  payments: Payment[]; 
  allProfiles: UserProfile[];
  allNiches: { id: NicheType; name: string; logo_url: string; is_commercial?: boolean }[];
  unlockedNiches: UserAccess[];
  currentNiche: NicheType;
  nicheConfig: NicheConfig | null;
  setCurrentNiche: (niche: NicheType) => void;
  login: (email: string, pass: string) => Promise<AuthResult>;
  loginWithGoogle: () => Promise<AuthResult>;
  logout: () => void;
  registerUser: (email: string, pass: string) => Promise<AuthResult>;
  fetchExperiences: () => Promise<void>;
  addExperience: (exp: Omit<Experience, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateExperience: (exp: Experience) => Promise<{ success: boolean; error?: string }>;
  deleteExperience: (id: string) => Promise<{ success: boolean; error?: string }>;
  duplicateExperience: (id: string) => Promise<{ success: boolean; error?: string }>;
  addPayment: (payment: Omit<Payment, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updatePaymentStatus: (id: string, status: 'approved' | 'rejected') => Promise<{ success: boolean; error?: string }>;
  fetchAllProfiles: () => Promise<void>;
  updateUserPlan: (email: string, plan: AccessLevel) => Promise<{ success: boolean; error?: string }>;
  fetchSystemConfig: () => Promise<SystemConfig | null>;
  validateCoupon: (code: string) => Promise<{ success: boolean; discount?: number; error?: string }>;
  fetchCoupons: () => Promise<Coupon[]>;
  addCoupon: (coupon: Omit<Coupon, 'id'>) => Promise<{ success: boolean; error?: string }>;
  deleteCoupon: (id: string) => Promise<{ success: boolean; error?: string }>;
  removeAccess: (accessId: string) => Promise<void>;
  loading: boolean;
}
