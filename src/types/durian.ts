export type AppRoute =
  | 'map-directory'
  | 'directory-list'
  | 'orchard-detail'
  | 'daily-market-prices'
  | 'admin-portal';

export type LocationCategory =
  | 'orchard_tour'
  | 'orchard_farm'
  | 'stall_export'
  | 'stall_local';

export type LocationStatus = 'เปิดบริการปกติ' | 'เปิดรับซื้อปกติ' | 'พักช่วงนอกฤดู' | 'รอตรวจพิกัดแปลง';

export interface VarietyOffer {
  code: string;
  name: string;
  badge: string;
  badgeStyle: 'primary' | 'secondary' | 'neutral';
  description: string;
  availabilityText: string;
  availabilityIcon: string;
  availabilityTone: 'primary' | 'secondary' | 'outline';
  pricePerKg: number;
  avatarTone: 'primary' | 'secondary' | 'highest' | 'fixed';
}

export interface ReviewItem {
  id: string;
  initials: string;
  avatarBg: string;
  avatarText: string;
  author: string;
  meta: string;
  rating: number;
  comment: string;
}

export interface OrchardLocation {
  id: string;
  code: string;
  name: string;
  englishName?: string;
  ownerName: string;
  category: LocationCategory;
  categoryLabel: string;
  categoryIcon: string;
  district: string;
  subDistrict: string;
  addressLabel: string;
  routeHint: string;
  lat: number;
  lng: number;
  elevationMeters: number;
  areaRai: number;
  heritageYears: number;
  rating: number;
  reviewCount: number;
  giCertified: boolean;
  giRegistrationNo?: string;
  gapCertified: boolean;
  gmpExport?: boolean;
  standards: string[];
  phone: string;
  lineId: string;
  openHours: string;
  seasonMonths: string;
  tourCapacity: string;
  primaryPriceSummary: string;
  secondaryPriceSummary: string;
  monthongPrice: number;
  status: LocationStatus;
  thumbnailUrl: string;
  galleryImages: {
    url: string;
    caption: string;
    tag?: string;
    alt: string;
  }[];
  story: string;
  varieties: VarietyOffer[];
  reviews: ReviewItem[];
  mapPosition: { xPercent: number; yPercent: number };
}

export interface DailyMarketPriceRow {
  id: string;
  cultivar: string;
  grade: string;
  giPriceMin: number;
  giPriceMax: number;
  stallPriceMin: number;
  stallPriceMax: number;
  changeDelta: number;
  updatedAt: string;
  demandLevel: 'สูงมาก' | 'สูง' | 'ปานกลาง';
}

export interface BookingRequest {
  id: string;
  orchardId: string;
  orchardName: string;
  contactName: string;
  phone: string;
  purpose: 'buffet' | 'delivery' | 'pickup' | 'wholesale';
  purposeLabel: string;
  date: string;
  quantity: number;
  createdAt: string;
}

export interface SecurityLogEntry {
  id: string;
  title: string;
  timestamp: string;
  actor: string;
  detail: string;
  icon: string;
  tone: 'primary' | 'secondary' | 'tertiary';
}
