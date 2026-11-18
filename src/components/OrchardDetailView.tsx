import React, { useEffect, useMemo, useState } from 'react';
import { RealYalaMap } from './RealYalaMap';
import {
  AppRoute,
  BookingRequest,
  DailyMarketPriceRow,
  OrchardLocation,
  ReviewItem,
} from '../types/durian';

interface OrchardDetailViewProps {
  orchard: OrchardLocation;
  dailyPrices: DailyMarketPriceRow[];
  onNavigate: (route: AppRoute) => void;
  onFilterByDistrict: (district: string) => void;
  onSubmitBooking: (booking: Omit<BookingRequest, 'id' | 'createdAt'>) => BookingRequest;
  onAddReview: (orchardId: string, review: Omit<ReviewItem, 'id'>) => void;
  onOpenShareModal: () => void;
}

export const OrchardDetailView: React.FC<OrchardDetailViewProps> = ({
  orchard,
  dailyPrices,
  onNavigate,
  onFilterByDistrict,
  onSubmitBooking,
  onAddReview,
  onOpenShareModal,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedCultivarIdx, setSelectedCultivarIdx] = useState(0);

  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState<'buffet' | 'delivery' | 'pickup' | 'wholesale'>('buffet');
  const [date, setDate] = useState(todayStr);
  const [quantity, setQuantity] = useState(2);
  const [bookingSuccess, setBookingSuccess] = useState<BookingRequest | null>(null);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRole, setReviewRole] = useState('นักท่องเที่ยว / ผู้เยี่ยมชมสวน');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const [routeGuideOpen, setRouteGuideOpen] = useState(false);
  const [traceabilityModalOpen, setTraceabilityModalOpen] = useState(false);
  const [traceCode, setTraceCode] = useState(`${orchard.code}-2568-014`);

  useEffect(() => {
    setSelectedCultivarIdx(0);
  }, [orchard.id]);

  const cultivarPriceOptions = useMemo(() => {
    const codeMap: { keyword: string; code: string }[] = [
      { keyword: 'หมอนทอง', code: 'หม' },
      { keyword: 'ก้านยาว', code: 'กย' },
      { keyword: 'มูซังคิง', code: 'มซ' },
      { keyword: 'พวงมณี', code: 'พม' },
      { keyword: 'ชะนี', code: 'ชน' },
    ];

    const fromOrchard = orchard.varieties.map((v) => {
      const matchedMarket = dailyPrices.find(
        (p) =>
          (v.name.includes('หมอนทอง') && p.cultivar.includes('หมอนทอง')) ||
          (v.name.includes('ก้านยาว') && p.cultivar.includes('ก้านยาว')) ||
          (v.name.includes('มูซังคิง') && p.cultivar.includes('มูซังคิง')) ||
          (v.name.includes('พวงมณี') && p.cultivar.includes('พวงมณี')) ||
          (v.name.includes('ชะนี') && p.cultivar.includes('ชะนี'))
      );

      return {
        id: v.name,
        shortLabel: v.name.split('(')[0].trim(),
        fullName: v.name,
        code: v.code,
        badge: v.badge,
        description: v.description,
        availabilityText: v.availabilityText,
        availabilityIcon: v.availabilityIcon,
        pricePerKg: v.pricePerKg,
        marketStallRange: matchedMarket
          ? `${matchedMarket.stallPriceMin} - ${matchedMarket.stallPriceMax} บ./กก.`
          : null,
        changeDelta: matchedMarket ? matchedMarket.changeDelta : 0,
        updatedAt: matchedMarket ? matchedMarket.updatedAt : '07:45 น.',
      };
    });

    const extraFromMarket = dailyPrices
      .filter(
        (p) =>
          !fromOrchard.some(
            (o) =>
              (p.cultivar.includes('หมอนทอง') && o.fullName.includes('หมอนทอง')) ||
              (p.cultivar.includes('ก้านยาว') && o.fullName.includes('ก้านยาว')) ||
              (p.cultivar.includes('มูซังคิง') && o.fullName.includes('มูซังคิง')) ||
              (p.cultivar.includes('พวงมณี') && o.fullName.includes('พวงมณี')) ||
              (p.cultivar.includes('ชะนี') && o.fullName.includes('ชะนี'))
          )
      )
      .map((p) => {
        const matchedCode =
          codeMap.find((c) => p.cultivar.includes(c.keyword))?.code || 'ทร';
        return {
          id: p.id,
          shortLabel: p.cultivar.split('(')[0].trim(),
          fullName: p.cultivar,
          code: matchedCode,
          badge: 'ราคากลาง จ.ยะลา',
          description: p.grade,
          availabilityText: `ความต้องการตลาด: ${p.demandLevel}`,
          availabilityIcon: 'trending_up',
          pricePerKg: p.giPriceMax,
          marketStallRange: `${p.stallPriceMin} - ${p.stallPriceMax} บ./กก.`,
          changeDelta: p.changeDelta,
          updatedAt: p.updatedAt,
        };
      });

    return [...fromOrchard, ...extraFromMarket];
  }, [orchard.varieties, dailyPrices]);

  const activeCultivar =
    cultivarPriceOptions[selectedCultivarIdx] || cultivarPriceOptions[0];

  const purposeLabels: Record<BookingRequest['purpose'], string> = {
    buffet: 'จองรอบบุฟเฟต์และชมสวน (599 บ./ท่าน)',
    delivery: 'สั่งซื้อผลผลิตจัดส่งปลายทาง (กล่องละ 5-10 กก.)',
    pickup: 'สั่งจองตัดสดมารับเองที่สวน',
    wholesale: 'ติดต่อรับซื้อเหมาสวน / คอนเทนเนอร์',
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !phone.trim()) return;
    const saved = onSubmitBooking({
      orchardId: orchard.id,
      orchardName: orchard.name,
      contactName: contactName.trim(),
      phone: phone.trim(),
      purpose,
      purposeLabel: purposeLabels[purpose],
      date,
      quantity,
    });
    setBookingSuccess(saved);
    setContactName('');
    setPhone('');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor.trim() || !reviewComment.trim()) return;
    const cleanName = reviewAuthor.trim();
    const initials = cleanName.slice(0, 2);
    onAddReview(orchard.id, {
      initials,
      avatarBg: 'bg-primary-fixed',
      avatarText: 'text-primary',
      author: cleanName,
      meta: `${reviewRole} · เมื่อสักครู่`,
      rating: reviewRating,
      comment: `"${reviewComment.trim()}"`,
    });
    setReviewAuthor('');
    setReviewComment('');
    setReviewRating(5);
    setReviewModalOpen(false);
  };

  const gallery = orchard.galleryImages.length > 0
    ? orchard.galleryImages
    : [
        {
          url: orchard.thumbnailUrl,
          caption: orchard.name,
          tag: orchard.district,
          alt: orchard.name,
        },
      ];

  const mainPhoto = gallery[0];
  const subPhoto1 = gallery[1] || gallery[0];
  const subPhoto2 = gallery[2] || gallery[0];
  const subPhoto3 = gallery[3] || gallery[0];

  return (
    <div className="flex flex-col w-full">
      {/* Top Breadcrumb & Status Bar */}
      <div className="w-full bg-surface-container-low py-2 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <nav className="flex items-center gap-1.5 text-[12px] leading-[16px] font-semibold text-on-surface-variant flex-wrap">
            <button
              type="button"
              onClick={() => onNavigate('map-directory')}
              className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">home</span>
              <span>หน้าหลัก</span>
            </button>
            <span className="text-outline-variant">/</span>
            <button
              type="button"
              onClick={() => {
                onFilterByDistrict(orchard.district);
                onNavigate('directory-list');
              }}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              {orchard.district.replace('อ.', 'อำเภอ')}
            </button>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-bold">
              {orchard.name} {orchard.giCertified ? '(GI ทุเรียนสะเด็ดน้ำยะลา)' : ''}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-on-primary text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-secondary-container" />
              ฤดูกาลตัดผลผลิตเปิดแล้ว (2025)
            </span>
            <button
              type="button"
              onClick={() => onNavigate('daily-market-prices')}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface-variant hover:text-primary text-[11px] font-semibold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm text-secondary">update</span>
              อัปเดตราคาเช้านี้: 07:45 น.
            </button>
            <button
              type="button"
              onClick={onOpenShareModal}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container hover:opacity-90 text-[11px] font-bold transition-opacity cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">qr_code_2</span>
              <span>แชร์ลิงก์ / QR สวนนี้</span>
            </button>
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-6 py-6 w-full">
        {/* Header Title & Certifications */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {orchard.giCertified && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container text-primary text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-sm text-secondary">verified</span>
                  GI สิ่งบ่งชี้ทางภูมิศาสตร์ ทุเรียนสะเด็ดน้ำยะลา (เลขทะเบียน{' '}
                  {orchard.giRegistrationNo || 'GI 62100125'})
                </span>
              )}
              {orchard.gapCertified && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container text-primary text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-sm">eco</span>
                  มาตรฐาน GAP กรมวิชาการเกษตร
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold">
                <span className="material-symbols-outlined text-sm">workspace_premium</span>
                {orchard.category === 'orchard_tour'
                  ? 'สวนเกษตรเชิงท่องเที่ยวดีเด่น จ.ยะลา'
                  : orchard.categoryLabel}
              </span>
            </div>

            <h1 className="text-[30px] md:text-[40px] leading-[1.2] font-bold text-primary tracking-tight">
              {orchard.name}{' '}
              {orchard.englishName && (
                <span className="text-[20px] md:text-[22px] text-outline font-normal">
                  ({orchard.englishName})
                </span>
              )}
            </h1>

            <p className="text-[14px] leading-[22px] text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-base">pin_drop</span>
              <span>{orchard.addressLabel}</span>
            </p>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="flex items-stretch gap-1 bg-surface-container p-2 rounded-xl self-start lg:self-auto shrink-0 shadow-sm tabular-nums">
            <div className="px-4 py-1 text-center border-r border-outline-variant/30">
              <div className="flex items-center justify-center gap-1 text-secondary text-[18px] leading-[26px] font-semibold">
                <span className="material-symbols-outlined material-symbols-filled text-base">
                  star
                </span>
                <span>{orchard.rating.toFixed(1)}</span>
              </div>
              <span className="text-[11px] font-semibold text-on-surface-variant">
                {orchard.reviewCount} รีวิวรับรอง
              </span>
            </div>
            <div className="px-4 py-1 text-center border-r border-outline-variant/30">
              <span className="block text-[18px] leading-[26px] font-semibold text-primary">
                {orchard.heritageYears} ปี
              </span>
              <span className="text-[11px] font-semibold text-on-surface-variant">
                รุ่นส่งต่อภูมิปัญญา
              </span>
            </div>
            <div className="px-4 py-1 text-center border-r border-outline-variant/30">
              <span className="block text-[18px] leading-[26px] font-semibold text-primary">
                {orchard.areaRai} ไร่
              </span>
              <span className="text-[11px] font-semibold text-on-surface-variant">
                พื้นที่ปลูกลาดชัน
              </span>
            </div>
            <div className="px-4 py-1 text-center">
              <span className="block text-[18px] leading-[26px] font-semibold text-secondary">
                {orchard.elevationMeters} ม.
              </span>
              <span className="text-[11px] font-semibold text-on-surface-variant">
                เหนือระดับน้ำทะเล
              </span>
            </div>
          </div>
        </div>

        {/* Prominent Single-Box Interactive Durian Price Showcase */}
        {activeCultivar && (
          <div className="mb-8 rounded-2xl bg-primary text-on-primary shadow-lg overflow-hidden">
            {/* Header Row + Cultivar Selector Pills */}
            <div className="px-6 pt-5 pb-4 bg-primary-container/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">payments</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-secondary-fixed">
                      ราคาทุเรียนวันนี้ · {orchard.name}
                    </span>
                    <span className="text-[11px] text-on-primary/75 tabular-nums">
                      อัปเดต {activeCultivar.updatedAt}
                    </span>
                  </div>
                  <h2 className="text-[20px] md:text-[22px] font-bold text-on-primary leading-tight">
                    คลิกเลือกสายพันธุ์เพื่อดูราคาประจำวัน
                  </h2>
                </div>
              </div>

              {/* Clickable Cultivar Tabs */}
              <div
                role="tablist"
                aria-label="เลือกสายพันธุ์ทุเรียนเพื่อดูราคา"
                className="flex flex-wrap items-center gap-2"
              >
                {cultivarPriceOptions.map((item, idx) => {
                  const isActive = idx === selectedCultivarIdx;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setSelectedCultivarIdx(idx)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-secondary-container text-on-secondary-container shadow-sm scale-[1.02]'
                          : 'bg-on-primary/10 text-on-primary/90 hover:bg-on-primary/20'
                      }`}
                    >
                      <span className="font-bold">{item.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Single Unified Price Display Box */}
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center text-xl font-bold shrink-0">
                  {activeCultivar.code}
                </div>
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[22px] md:text-[24px] font-bold text-on-primary leading-tight">
                      {activeCultivar.fullName}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-bold">
                      {activeCultivar.badge}
                    </span>
                    {activeCultivar.changeDelta !== 0 && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${
                          activeCultivar.changeDelta > 0
                            ? 'bg-secondary-fixed text-on-secondary-fixed'
                            : 'bg-error-container text-on-error-container'
                        }`}
                      >
                        {activeCultivar.changeDelta > 0 ? '+' : ''}
                        {activeCultivar.changeDelta.toFixed(2)} บ. จากสัปดาห์ก่อน
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] leading-[20px] text-on-primary/85 max-w-2xl">
                    {activeCultivar.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 pt-1 text-[12px] text-secondary-fixed font-semibold">
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">
                        {activeCultivar.availabilityIcon}
                      </span>
                      {activeCultivar.availabilityText}
                    </span>
                    {activeCultivar.marketStallRange && (
                      <span className="inline-flex items-center gap-1 text-on-primary/80 tabular-nums">
                        <span className="material-symbols-outlined text-base">storefront</span>
                        ราคารับซื้อหน้าล้ง จ.ยะลา: {activeCultivar.marketStallRange}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Single Prominent Price Number */}
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 bg-on-primary/10 px-6 py-4 rounded-2xl tabular-nums">
                <div className="text-left md:text-right">
                  <span className="text-[11px] uppercase tracking-wider text-secondary-fixed font-semibold block">
                    ราคาจำหน่ายหน้าสวนวันนี้
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-[38px] md:text-[44px] leading-none font-bold text-secondary-container">
                      {activeCultivar.pricePerKg}
                    </span>
                    <span className="text-base font-semibold text-on-primary">฿ / กก.</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('daily-market-prices')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-secondary-fixed hover:underline cursor-pointer whitespace-nowrap"
                >
                  <span>เปรียบเทียบทุกสายพันธุ์</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Quick Scannable QR Image Strip */}
            <div className="px-6 py-3 bg-primary-container/50 border-t border-on-primary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/yala-durian-qr.png"
                  alt="ภาพคิวอาร์โค้ดเข้าใช้งาน ยะลา ทุเรียนฮับ"
                  className="w-12 h-12 rounded-lg bg-white p-1 object-contain shrink-0 shadow"
                />
                <div className="text-xs">
                  <span className="font-bold text-secondary-fixed block">
                    ภาพ QR Code เข้าใช้งานเว็บไซต์สาธารณะ
                  </span>
                  <span className="text-on-primary/80">
                    สแกนด้วยมือถือได้ทันที หรือบันทึกเป็นภาพเพื่อแชร์ให้ลูกค้า/นักท่องเที่ยว
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <a
                  href="/yala-durian-qr.png"
                  download="yala-durian-hub-qr.png"
                  className="px-3 py-1.5 rounded-lg bg-secondary-container text-on-secondary-container text-xs font-bold inline-flex items-center gap-1 hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>ดาวน์โหลดภาพ QR (PNG)</span>
                </a>
                <button
                  type="button"
                  onClick={onOpenShareModal}
                  className="px-3 py-1.5 rounded-lg bg-on-primary/15 text-on-primary hover:bg-on-primary/25 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">qr_code_2</span>
                  <span>ดูภาพ QR ขนาดใหญ่</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Editorial Gallery Bento Mosaic */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 mb-10 h-auto md:h-[460px]">
          <div
            onClick={() => {
              setActiveImageIdx(0);
              setGalleryOpen(true);
            }}
            className="md:col-span-6 relative overflow-hidden rounded-2xl group shadow-sm cursor-pointer bg-surface-container h-64 md:h-full"
          >
            <img
              alt={mainPhoto.alt}
              src={mainPhoto.url}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/20 to-transparent flex flex-col justify-end p-5 text-on-primary">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-secondary-fixed">
                {mainPhoto.tag || 'จุดเด่นทางภูมิศาสตร์'}
              </span>
              <h2 className="text-[18px] leading-[26px] font-bold">{mainPhoto.caption}</h2>
              <p className="text-[12px] leading-[18px] text-on-primary/90">
                น้ำฝนระบายฉับพลันผ่านชั้นหินแกรนิต ให้เนื้อทุเรียนแห้งเนียน ไร้ความแฉะ
              </p>
            </div>
          </div>

          <div className="md:col-span-3 grid grid-rows-2 gap-2.5 h-80 md:h-full">
            <div
              onClick={() => {
                setActiveImageIdx(Math.min(1, gallery.length - 1));
                setGalleryOpen(true);
              }}
              className="relative overflow-hidden rounded-xl group shadow-sm cursor-pointer bg-surface-container"
            >
              <img
                alt={subPhoto1.alt}
                src={subPhoto1.url}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-primary/85 text-on-primary text-[11px] font-semibold backdrop-blur-sm">
                เนื้อเนียนแห้ง ไร้เสี้ยน
              </div>
            </div>
            <div
              onClick={() => {
                setActiveImageIdx(Math.min(2, gallery.length - 1));
                setGalleryOpen(true);
              }}
              className="relative overflow-hidden rounded-xl group shadow-sm cursor-pointer bg-surface-container"
            >
              <img
                alt={subPhoto2.alt}
                src={subPhoto2.url}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-primary/85 text-on-primary text-[11px] font-semibold backdrop-blur-sm">
                บรรยากาศชิมสดใต้ต้น
              </div>
            </div>
          </div>

          <div className="md:col-span-3 grid grid-rows-2 gap-2.5 h-80 md:h-full">
            <div
              onClick={() => {
                setActiveImageIdx(Math.min(3, gallery.length - 1));
                setGalleryOpen(true);
              }}
              className="relative overflow-hidden rounded-xl group shadow-sm cursor-pointer bg-surface-container"
            >
              <img
                alt={subPhoto3.alt}
                src={subPhoto3.url}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-secondary text-on-secondary text-[11px] font-semibold">
                ทะเบียนรับรอง GI แท้
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl bg-surface-container flex flex-col justify-between p-4 shadow-sm">
              <div className="space-y-1">
                <span className="text-[11px] text-primary font-bold">
                  แกลเลอรีรูปภาพสวน (38 ภาพ)
                </span>
                <p className="text-[12px] leading-[18px] text-on-surface-variant">
                  ชมบรรยากาศเก็บเกี่ยว เส้นทางวิบาก และระบบตรวจวัดความสุกด้วยเซนเซอร์ความชื้น
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveImageIdx(0);
                  setGalleryOpen(true);
                }}
                className="inline-flex items-center justify-between w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-primary font-semibold text-[12px] hover:bg-primary hover:text-on-primary transition-all cursor-pointer"
              >
                <span>เปิดดูภาพทั้งหมด</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Layout: 2 Columns Content + 1 Column Sticky Interaction Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left & Center Content (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Story & Provenance Section */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-2xl text-secondary">
                  psychiatry
                </span>
                <h3 className="text-[22px] leading-[30px] font-semibold tracking-tight">
                  เรื่องราวและความพิเศษของ &apos;{orchard.name}&apos;
                </h3>
              </div>
              <p className="text-[16px] leading-[26px] text-on-surface">{orchard.story}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="bg-surface-container-low p-3 rounded-xl space-y-1">
                  <span className="material-symbols-outlined text-primary text-xl">water_drop</span>
                  <h4 className="text-[14px] font-semibold text-primary">สะเด็ดน้ำธรรมชาติ</h4>
                  <p className="text-[12px] leading-[18px] text-on-surface-variant">
                    น้ำไม่สะสมที่โคนต้น ทำให้เซลล์เนื้อทุเรียนแน่น แห้งเนียน นุ่มหนึบ ไม่เป็นปลิง
                  </p>
                </div>
                <div className="bg-surface-container-low p-3 rounded-xl space-y-1">
                  <span className="material-symbols-outlined text-secondary text-xl">
                    thermostat
                  </span>
                  <h4 className="text-[14px] font-semibold text-primary">หมอกเช้า-แดดบ่าย</h4>
                  <p className="text-[12px] leading-[18px] text-on-surface-variant">
                    อุณหภูมิกลางวัน-กลางคืนต่างกัน 10°C ช่วยสะสมน้ำตาลธรรมชาติ รสหวานละมุน
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTraceabilityModalOpen(true)}
                  className="bg-surface-container-low hover:bg-surface-container p-3 rounded-xl space-y-1 text-left transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-tertiary-container text-xl">
                    qr_code_2
                  </span>
                  <h4 className="text-[14px] font-semibold text-primary flex items-center justify-between">
                    <span>ระบบ Traceability รายลูก</span>
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </h4>
                  <p className="text-[12px] leading-[18px] text-on-surface-variant">
                    สแกนรหัสแท็กขั้วผล เพื่อตรวจวันเก็บเกี่ยว เปอร์เซ็นต์แป้ง และแปลงย่อยที่ปลูก
                  </p>
                </button>
              </div>
            </div>



            {/* Orchard Services & Activities */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-2xl text-secondary">explore</span>
                <h3 className="text-[22px] leading-[30px] font-semibold tracking-tight">
                  บริการและกิจกรรมต้อนรับนักท่องเที่ยว
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-container-low flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary shrink-0">
                    <span className="material-symbols-outlined">restaurant</span>
                  </div>
                  <div>
                    <h4 className="text-[14px] font-semibold text-primary">
                      บุฟเฟต์ทุเรียน &amp; ผลไม้ตามฤดูกาล
                    </h4>
                    <p className="text-[12px] leading-[18px] text-on-surface-variant mt-1">
                      เปิดวันละ 3 รอบ ลิ้มลองทุเรียนสะเด็ดน้ำ มังคุดเขา ลองกองตันหยงมัส ส้มโชกุนเบตง
                      เสิร์ฟไม่อั้น (599 บ./ท่าน)
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined">airport_shuttle</span>
                  </div>
                  <div>
                    <h4 className="text-[14px] font-semibold text-primary">
                      รถ 4WD พาชมสวนยอดเขาสันกาลาคีรี
                    </h4>
                    <p className="text-[12px] leading-[18px] text-on-surface-variant mt-1">
                      สัมผัสวิถีการเก็บเกี่ยวบนเนินสูงชัน พร้อมจุดชมวิวทิวทัศน์หุบเขาหมอกธารโตแบบ
                      360 องศา
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary shrink-0">
                    <span className="material-symbols-outlined">yard</span>
                  </div>
                  <div>
                    <h4 className="text-[14px] font-semibold text-primary">
                      จำหน่ายกิ่งพันธุ์แท้ขยายพันธุ์ในถิ่น
                    </h4>
                    <p className="text-[12px] leading-[18px] text-on-surface-variant mt-1">
                      ต้นกล้าเสียบยอดจากต้นแม่พันธุ์สะเด็ดน้ำแท้
                      พร้อมคำแนะนำการจัดการระบบน้ำตามไหล่เขา
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined">local_shipping</span>
                  </div>
                  <div>
                    <h4 className="text-[14px] font-semibold text-primary">
                      จัดส่งควบคุมอุณหภูมิทั่วประเทศ
                    </h4>
                    <p className="text-[12px] leading-[18px] text-on-surface-variant mt-1">
                      บรรจุกล่องหนาพิเศษพร้อมแผ่นดูดซับกลิ่น จัดส่งด้วยรถ Cold-chain ถึงหน้าบ้านภายใน
                      24-48 ชม.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coordinates, Map & Transportation Guide */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-2xl text-secondary">map</span>
                  <h3 className="text-[22px] leading-[30px] font-semibold tracking-tight">
                    พิกัดแผนที่ &amp; เส้นทางขึ้นสวน
                  </h3>
                </div>
                <span className="text-[12px] font-semibold text-outline font-mono tabular-nums">
                  ละติจูด {orchard.lat.toFixed(4)}° N, ลองจิจูด {orchard.lng.toFixed(4)}° E
                </span>
              </div>

              <RealYalaMap
                orchards={[orchard]}
                selectedOrchardId={orchard.id}
                singleFocusMode
                heightClass="h-80"
              />
              <div className="bg-surface-container-low px-3.5 py-2.5 rounded-xl text-xs text-on-surface flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong className="text-primary">เส้นทางแนะนำ:</strong> {orchard.routeHint}
                </span>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${orchard.lat},${orchard.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-secondary hover:underline shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  <span>เปิดนำทางใน Google Maps</span>
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[12px] leading-[18px] text-on-surface-variant">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary text-base mt-0.5">
                    directions_car
                  </span>
                  <p>
                    <strong className="text-on-surface">การเดินทางด้วยรถยนต์:</strong>{' '}
                    รถเก๋งและรถตู้สามารถขึ้นถึงจุดบริการลานชิมทุเรียนด้านล่างได้สะดวก
                    มีที่จอดรถรองรับได้กว่า 35 คัน
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-secondary text-base mt-0.5">
                    terrain
                  </span>
                  <p>
                    <strong className="text-on-surface">เส้นทางแปลงบนยอดเขา:</strong>{' '}
                    สำหรับแปลงสาธิตยอดเขา ความลาดชันสูง สวนมีบริการรถขับเคลื่อนสี่ล้อรับ-ส่ง
                    ฟรีสำหรับผู้เยี่ยมชม
                  </p>
                </div>
              </div>
            </div>

            {/* Verified Reviews & Trader Endorsements */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-2xl text-secondary">
                    rate_review
                  </span>
                  <h3 className="text-[22px] leading-[30px] font-semibold tracking-tight">
                    รีวิวจากผู้เยี่ยมชมและผู้รับซื้อประจำ
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(true)}
                  className="text-[12px] text-primary font-bold hover:underline cursor-pointer"
                >
                  เขียนรีวิวของท่าน
                </button>
              </div>

              {orchard.reviews.length === 0 ? (
                <div className="p-6 rounded-xl bg-surface-container-low text-center space-y-2">
                  <p className="text-sm text-on-surface-variant">
                    ยังไม่มีรีวิวสำหรับสถานที่นี้ เป็นคนแรกที่แบ่งปันประสบการณ์ของคุณ
                  </p>
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(true)}
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold cursor-pointer"
                  >
                    เขียนรีวิวแรก
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orchard.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-xl bg-surface-container-low space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-full ${rev.avatarBg} ${rev.avatarText} font-bold flex items-center justify-center text-sm shrink-0`}
                          >
                            {rev.initials}
                          </div>
                          <div>
                            <h5 className="text-[12px] font-semibold text-on-surface">
                              {rev.author}
                            </h5>
                            <span className="text-[11px] text-outline">{rev.meta}</span>
                          </div>
                        </div>
                        <div className="flex text-secondary text-xs" aria-label={`${rev.rating} ดาว`}>
                          {'★'.repeat(rev.rating)}
                          {'☆'.repeat(5 - rev.rating)}
                        </div>
                      </div>
                      <p className="text-[12px] leading-[18px] text-on-surface-variant">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Contact, Booking & Direct Order Panel (4 cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-md border-t-4 border-primary space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] text-secondary uppercase font-bold tracking-wider">
                  ติดต่อตรงกับเจ้าของสวน
                </span>
                <h3 className="text-[18px] leading-[26px] font-semibold text-primary">
                  สั่งซื้อผลผลิต &amp; จองรอบเยี่ยมชม
                </h3>
                <p className="text-[12px] text-on-surface-variant">
                  ไม่ผ่านคนกลาง ราคายุติธรรม ได้รับของแท้ 100%
                </p>
              </div>

              <div className="space-y-2">
                <a
                  href={`tel:${orchard.phone.replace(/-/g, '')}`}
                  className="w-full py-3 px-4 rounded-xl bg-primary text-on-primary font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-primary-container transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-xl text-secondary-fixed">
                    phone_in_talk
                  </span>
                  <span className="tabular-nums">
                    {orchard.phone} ({orchard.ownerName.split('/')[0].trim()})
                  </span>
                </a>
                <button
                  type="button"
                  onClick={() => setRouteGuideOpen(true)}
                  className="w-full py-3 px-4 rounded-xl bg-secondary-container text-on-secondary-container font-semibold text-[14px] flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">chat</span>
                  <span>Line ID: {orchard.lineId}</span>
                </button>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${orchard.lat},${orchard.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-surface-container text-primary font-semibold text-[12px] flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-lg text-secondary">near_me</span>
                  <span>นำทางด้วย Google Maps ไปยังพิกัดสวน</span>
                </a>
                <button
                  type="button"
                  onClick={onOpenShareModal}
                  className="w-full py-2.5 px-4 rounded-xl bg-primary-fixed text-on-primary-fixed font-semibold text-[12px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">qr_code_2</span>
                  <span>สร้าง QR Code &amp; ลิงก์แชร์หน้าสวนนี้</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low space-y-2">
                <div className="flex items-center justify-between text-on-surface">
                  <span className="text-[12px] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-base text-primary">schedule</span>
                    เวลาเปิดบริการหน้าร้าน
                  </span>
                  <span className="text-[12px] text-primary font-bold tabular-nums">
                    {orchard.openHours}
                  </span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant text-[12px]">
                  <span>ช่วงฤดูกาลเปิดสวน:</span>
                  <span className="text-on-surface">{orchard.seasonMonths}</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant text-[12px]">
                  <span>สถานะการรองรับทัวร์:</span>
                  <span className="text-primary font-bold">{orchard.tourCapacity}</span>
                </div>
              </div>

              {bookingSuccess && (
                <div className="p-3.5 rounded-xl bg-primary-fixed text-on-primary-fixed space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      บันทึกคำขอจองเรียบร้อยแล้ว
                    </span>
                    <button
                      type="button"
                      onClick={() => setBookingSuccess(null)}
                      className="text-on-primary-fixed/70 hover:text-on-primary-fixed cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                  <p className="text-[11px] leading-[16px]">
                    รหัสอ้างอิง <strong className="font-mono">{bookingSuccess.id}</strong> · คุณ{' '}
                    {bookingSuccess.contactName} ({bookingSuccess.quantity} หน่วย)
                    เจ้าหน้าที่จะติดต่อกลับภายใน 15 นาที
                  </p>
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-2.5 pt-1">
                <span className="block text-[12px] text-primary font-bold">
                  แบบฟอร์มจองคิว / สั่งจองผลผลิตล่วงหน้า
                </span>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-on-surface-variant">
                    ชื่อผู้ติดต่อ
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="เช่น คุณอดิศักดิ์ มีสุข"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface text-[12px] outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-on-surface-variant">
                    เบอร์โทรศัพท์ที่ติดต่อได้
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface text-[12px] outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-on-surface-variant">
                    จุดประสงค์
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) =>
                      setPurpose(e.target.value as BookingRequest['purpose'])
                    }
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface text-[12px] outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="buffet">{purposeLabels.buffet}</option>
                    <option value="delivery">{purposeLabels.delivery}</option>
                    <option value="pickup">{purposeLabels.pickup}</option>
                    <option value="wholesale">{purposeLabels.wholesale}</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-on-surface-variant">
                      วันที่ต้องการ
                    </label>
                    <input
                      type="date"
                      value={date}
                      min={todayStr}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface text-[12px] outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-on-surface-variant">
                      จำนวน (คน/กก.)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface text-[12px] outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 tabular-nums"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full mt-2 py-3 rounded-xl bg-primary text-on-primary font-semibold text-[14px] hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">send</span>
                  <span>ส่งคำขอจองล่วงหน้า</span>
                </button>
                <p className="text-center text-[11px] text-outline">
                  เจ้าหน้าที่จะโทรยืนยันคิวภายใน 30 นาที
                </p>
              </form>
            </div>

            {/* GI Provenance Guarantee Shield */}
            <div className="bg-surface-container p-4 rounded-2xl flex items-start gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-secondary shrink-0">
                <span className="material-symbols-outlined text-xl">verified_user</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-[12px] text-primary font-bold">ตราสัญลักษณ์ GI ยะลาแท้</h4>
                <p className="text-[12px] leading-[18px] text-on-surface-variant">
                  ทุเรียนทุกลูกที่ออกจากสวนผ่านการติดคิวอาร์โค้ดสิ่งบ่งชี้ทางภูมิศาสตร์
                  สามารถสแกนตรวจสอบแปลงปลูกและวันตัดได้ทันที
                </p>
              </div>
            </div>

            {/* Scannable Public Website QR Code Card */}
            <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm flex items-center gap-3.5">
              <div className="bg-white p-1.5 rounded-xl shadow-inner shrink-0 border border-outline-variant/20">
                <img
                  src="/yala-durian-qr.png"
                  alt="คิวอาร์โค้ดเข้าใช้งานเว็บไซต์ ยะลา ทุเรียนฮับ"
                  className="w-24 h-24 object-contain"
                />
              </div>
              <div className="min-w-0 space-y-1.5">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
                  สแกนเข้าเว็บ (สาธารณะ)
                </span>
                <h4 className="text-[13px] font-bold text-primary leading-snug">
                  QR Code เข้าใช้งาน ยะลา ทุเรียนฮับ
                </h4>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <a
                    href="/yala-durian-qr.png"
                    download="yala-durian-hub-qr.png"
                    className="px-2.5 py-1 rounded-lg bg-secondary-container text-on-secondary-container text-[11px] font-bold inline-flex items-center gap-1 hover:opacity-90"
                  >
                    <span className="material-symbols-outlined text-xs">download</span>
                    <span>โหลด QR</span>
                  </a>
                  <button
                    type="button"
                    onClick={onOpenShareModal}
                    className="px-2.5 py-1 rounded-lg bg-surface-container text-primary text-[11px] font-semibold hover:bg-surface-container-high cursor-pointer"
                  >
                    เลือก QR หน้าอื่น
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Lightbox Modal */}
      {galleryOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setGalleryOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-surface-container-low flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-primary">
                  แกลเลอรีภาพ {orchard.name}
                </h4>
                <p className="text-xs text-on-surface-variant">
                  ภาพที่ {activeImageIdx + 1} จาก {gallery.length} · {gallery[activeImageIdx].caption}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGalleryOpen(false)}
                className="p-2 rounded-lg hover:bg-surface-container text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="relative h-[420px] bg-black flex items-center justify-center">
              <img
                src={gallery[activeImageIdx].url}
                alt={gallery[activeImageIdx].alt}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIdx((prev) => (prev - 1 + gallery.length) % gallery.length)
                    }
                    className="absolute left-3 p-2 rounded-full bg-surface/90 text-primary hover:bg-surface shadow cursor-pointer"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImageIdx((prev) => (prev + 1) % gallery.length)}
                    className="absolute right-3 p-2 rounded-full bg-surface/90 text-primary hover:bg-surface shadow cursor-pointer"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </>
              )}
            </div>
            <div className="p-3 bg-surface-container-lowest flex items-center gap-2 overflow-x-auto">
              {gallery.map((img, idx) => (
                <button
                  key={img.url + idx}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 cursor-pointer ${
                    idx === activeImageIdx ? 'border-primary' : 'border-transparent opacity-60'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.alt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {reviewModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setReviewModalOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">เขียนรีวิว {orchard.name}</h3>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleReviewSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  ชื่อผู้รีวิว *
                </label>
                <input
                  type="text"
                  required
                  value={reviewAuthor}
                  onChange={(e) => setReviewAuthor(e.target.value)}
                  placeholder="เช่น คุณกิตติศักดิ์ ใจดี"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  บทบาท / แหล่งที่มา
                </label>
                <input
                  type="text"
                  value={reviewRole}
                  onChange={(e) => setReviewRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  คะแนนความพึงพอใจ
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`text-2xl cursor-pointer ${
                        star <= reviewRating ? 'text-secondary' : 'text-outline-variant'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  ความคิดเห็น *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="แบ่งปันรสชาติ ความประทับใจ และคุณภาพผลผลิต..."
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container text-sm font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold cursor-pointer"
                >
                  เผยแพร่รีวิว
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Navigation & Line Contact Info Modal */}
      {routeGuideOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setRouteGuideOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">ข้อมูลนำทาง &amp; ช่องทางติดต่อด่วน</h3>
              <button
                type="button"
                onClick={() => setRouteGuideOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="p-3 rounded-xl bg-surface-container-low">
                <span className="text-xs text-on-surface-variant block">พิกัด GPS (WGS84)</span>
                <span className="font-mono font-bold text-primary tabular-nums">
                  {orchard.lat.toFixed(6)}, {orchard.lng.toFixed(6)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low">
                <span className="text-xs text-on-surface-variant block">เส้นทางแนะนำ</span>
                <span className="text-on-surface font-medium">{orchard.routeHint}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between">
                <div>
                  <span className="text-xs text-on-surface-variant block">Line Official</span>
                  <span className="font-bold text-primary">{orchard.lineId}</span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold">
                  ตอบกลับไว
                </span>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${orchard.lat},${orchard.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-secondary-container text-on-secondary-container text-sm font-bold inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-base">near_me</span>
                <span>นำทาง Google Maps</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setRouteGuideOpen(false);
                  onNavigate('map-directory');
                }}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold cursor-pointer"
              >
                ดูตำแหน่งบนแผนที่จังหวัด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Traceability QR Inspection Modal */}
      {traceabilityModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setTraceabilityModalOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined">qr_code_scanner</span>
                <h3 className="text-lg font-bold">ตรวจสอบย้อนกลับผลผลิต GI</h3>
              </div>
              <button
                type="button"
                onClick={() => setTraceabilityModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                รหัสแท็กขั้วผลทุเรียน
              </label>
              <input
                type="text"
                value={traceCode}
                onChange={(e) => setTraceCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low font-mono text-sm outline-none"
              />
            </div>
            <div className="p-4 rounded-xl bg-primary-fixed/60 text-on-primary-fixed space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>แหล่งผลิต:</span>
                <strong>{orchard.name}</strong>
              </div>
              <div className="flex justify-between">
                <span>รหัสแปลงรับรอง:</span>
                <strong className="font-mono">{orchard.code}</strong>
              </div>
              <div className="flex justify-between">
                <span>ความสูงพื้นที่ปลูก:</span>
                <strong className="tabular-nums">{orchard.elevationMeters} ม. รทก.</strong>
              </div>
              <div className="flex justify-between">
                <span>ค่าความแก่แห้ง (Dry Matter):</span>
                <strong className="tabular-nums">34.8% (ผ่านเกณฑ์ GI 85%+)</strong>
              </div>
              <div className="flex justify-between">
                <span>สถานะการรับรอง:</span>
                <strong>ยืนยันแหล่งกำเนิดแท้</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
