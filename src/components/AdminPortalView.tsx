import React, { useEffect, useMemo, useState } from 'react';
import { ASSETS, YALA_DISTRICTS } from '../data/mockData';
import {
  AppRoute,
  BookingRequest,
  DailyMarketPriceRow,
  LocationCategory,
  LocationStatus,
  OrchardLocation,
  SecurityLogEntry,
} from '../types/durian';
import { RealYalaMap } from './RealYalaMap';

const ADMIN_PAGE_SIZE = 10;

interface AdminPortalViewProps {
  adminEmail: string;
  orchards: OrchardLocation[];
  dailyPrices: DailyMarketPriceRow[];
  securityLogs: SecurityLogEntry[];
  bookings: BookingRequest[];
  onNavigate: (route: AppRoute) => void;
  onLogout: () => void;
  onViewOrchard: (orchardId: string) => void;
  onAddOrchard: (orchard: OrchardLocation) => void;
  onUpdateOrchard: (orchard: OrchardLocation) => void;
  onDeleteOrchard: (orchardId: string) => void;
  onApproveOrchard: (orchardId: string) => void;
  onUpdatePriceRow: (row: DailyMarketPriceRow) => void;
}

type AdminTab = 'all' | 'stalls' | 'pending' | 'pricing' | 'gi' | 'bookings';

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  adminEmail,
  orchards,
  dailyPrices,
  securityLogs,
  bookings,
  onNavigate,
  onLogout,
  onViewOrchard,
  onAddOrchard,
  onUpdateOrchard,
  onDeleteOrchard,
  onApproveOrchard,
  onUpdatePriceRow,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [giFilter, setGiFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrchard, setEditingOrchard] = useState<OrchardLocation | null>(null);

  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OrchardLocation | null>(null);
  const [logsModalOpen, setLogsModalOpen] = useState(false);

  // Modal Form States
  const [formName, setFormName] = useState('');
  const [formOwner, setFormOwner] = useState('');
  const [formCategory, setFormCategory] = useState<LocationCategory>('orchard_tour');
  const [formDistrict, setFormDistrict] = useState('อ.เบตง');
  const [formLat, setFormLat] = useState('6.038421');
  const [formLng, setFormLng] = useState('101.182145');
  const [formGi, setFormGi] = useState(true);
  const [formGap, setFormGap] = useState(true);
  const [formZeroChem, setFormZeroChem] = useState(false);
  const [formPhone, setFormPhone] = useState('');
  const [formPrice, setFormPrice] = useState(150);

  // Quick Price Update Form State
  const [selectedPriceId, setSelectedPriceId] = useState(dailyPrices[0]?.id || '');
  const selectedPriceRow =
    dailyPrices.find((p) => p.id === selectedPriceId) || dailyPrices[0];
  const [editGiMin, setEditGiMin] = useState(selectedPriceRow?.giPriceMin || 185);
  const [editGiMax, setEditGiMax] = useState(selectedPriceRow?.giPriceMax || 210);
  const [editStallMin, setEditStallMin] = useState(selectedPriceRow?.stallPriceMin || 150);
  const [editStallMax, setEditStallMax] = useState(selectedPriceRow?.stallPriceMax || 162);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const openCreateModal = () => {
    setEditingOrchard(null);
    setFormName('');
    setFormOwner('');
    setFormCategory('orchard_tour');
    setFormDistrict('อ.เบตง');
    setFormLat('6.038421');
    setFormLng('101.182145');
    setFormGi(true);
    setFormGap(true);
    setFormZeroChem(false);
    setFormPhone('');
    setFormPrice(150);
    setModalOpen(true);
  };

  const openEditModal = (item: OrchardLocation) => {
    setEditingOrchard(item);
    setFormName(item.name);
    setFormOwner(item.ownerName);
    setFormCategory(item.category);
    setFormDistrict(item.district);
    setFormLat(item.lat.toFixed(6));
    setFormLng(item.lng.toFixed(6));
    setFormGi(item.giCertified);
    setFormGap(item.gapCertified);
    setFormZeroChem(item.standards.includes('ปลอดสารเคมีตกค้างเป็นศูนย์'));
    setFormPhone(item.phone);
    setFormPrice(item.monthongPrice);
    setModalOpen(true);
  };

  const handleLocateCurrentGps = () => {
    setFormLat((6.0 + Math.random() * 0.45).toFixed(6));
    setFormLng((101.08 + Math.random() * 0.2).toFixed(6));
    showToast('ดึงพิกัดดาวเทียม GPS ปัจจุบันสำเร็จ (±1.2 เมตร)');
  };

  const handleSaveOrchard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formOwner.trim() || !formPhone.trim()) return;

    const categoryMeta: Record<
      LocationCategory,
      { label: string; icon: string; defaultStatus: LocationStatus }
    > = {
      orchard_tour: {
        label: 'สวนท่องเที่ยวเชิงเกษตร',
        icon: 'tour',
        defaultStatus: 'เปิดบริการปกติ',
      },
      orchard_farm: {
        label: 'สวนผลผลิตจำหน่ายตรง',
        icon: 'agriculture',
        defaultStatus: 'เปิดบริการปกติ',
      },
      stall_export: {
        label: 'แผงรับซื้อส่งออก (ล้ง)',
        icon: 'local_shipping',
        defaultStatus: 'เปิดรับซื้อปกติ',
      },
      stall_local: {
        label: 'ศูนย์รวบรวมกลุ่มวิสาหกิจชุมชน',
        icon: 'storefront',
        defaultStatus: 'เปิดรับซื้อปกติ',
      },
    };

    const standards: string[] = [];
    if (formGi) standards.push('GI สะเด็ดน้ำ');
    if (formGap) standards.push('GAP มาตรฐาน');
    if (formZeroChem) standards.push('ปลอดสารเคมีตกค้างเป็นศูนย์');
    if (standards.length === 0) standards.push('รอประเมินมาตรฐาน');

    const latNum = parseFloat(formLat) || 6.0384;
    const lngNum = parseFloat(formLng) || 101.1821;

    if (editingOrchard) {
      const updated: OrchardLocation = {
        ...editingOrchard,
        name: formName.trim(),
        ownerName: formOwner.trim(),
        category: formCategory,
        categoryLabel: categoryMeta[formCategory].label,
        categoryIcon: categoryMeta[formCategory].icon,
        district: formDistrict,
        lat: latNum,
        lng: lngNum,
        giCertified: formGi,
        gapCertified: formGap,
        standards,
        phone: formPhone.trim(),
        monthongPrice: Number(formPrice) || 150,
        primaryPriceSummary: `หมอนทอง ${Number(formPrice) || 150} บ./กก.`,
      };
      onUpdateOrchard(updated);
      showToast(`อัปเดตข้อมูล "${updated.name}" เรียบร้อยแล้ว`);
    } else {
      const newOrchard: OrchardLocation = {
        id: `orch-${Date.now()}`,
        code: `YLA-NEW-${Math.floor(100 + Math.random() * 900)}`,
        name: formName.trim(),
        ownerName: formOwner.trim(),
        category: formCategory,
        categoryLabel: categoryMeta[formCategory].label,
        categoryIcon: categoryMeta[formCategory].icon,
        district: formDistrict,
        subDistrict: 'ต.ในเขตพื้นที่',
        addressLabel: `${formDistrict} จ.ยะลา`,
        routeHint: `ทางหลวงหมายเลข 410 เขต${formDistrict}`,
        lat: latNum,
        lng: lngNum,
        elevationMeters: 410,
        areaRai: 20,
        heritageYears: 10,
        rating: 4.8,
        reviewCount: 1,
        giCertified: formGi,
        giRegistrationNo: formGi ? `GI 6210${Math.floor(100 + Math.random() * 900)}` : undefined,
        gapCertified: formGap,
        standards,
        phone: formPhone.trim(),
        lineId: '@yaladurian',
        openHours: '08:00 - 17:30 น.',
        seasonMonths: 'มิถุนายน - กันยายน',
        tourCapacity: 'เปิดบริการตามนัดหมาย',
        primaryPriceSummary: `หมอนทอง ${Number(formPrice) || 150} บ./กก.`,
        secondaryPriceSummary: 'คัดเกรดหน้าสวน',
        monthongPrice: Number(formPrice) || 150,
        status: categoryMeta[formCategory].defaultStatus,
        thumbnailUrl:
          formCategory === 'stall_export' || formCategory === 'stall_local'
            ? ASSETS.rowJaeNee
            : ASSETS.rowPooSook,
        galleryImages: [
          {
            url: ASSETS.orchardHillside,
            caption: formName.trim(),
            tag: formDistrict,
            alt: formName.trim(),
          },
        ],
        story: `แหล่งผลิตและจำหน่ายทุเรียนคุณภาพในเขต${formDistrict} จังหวัดยะลา บริหารจัดการโดย ${formOwner.trim()}`,
        varieties: [
          {
            code: 'หม',
            name: 'หมอนทองยะลา',
            badge: formGi ? 'GI Certified' : 'เกรดคัดสวน',
            badgeStyle: formGi ? 'primary' : 'neutral',
            description: 'เนื้อแน่นแห้ง รสหวานมันกลมกล่อม',
            availabilityText: 'พร้อมจำหน่ายและรับจอง',
            availabilityIcon: 'check_circle',
            availabilityTone: 'primary',
            pricePerKg: Number(formPrice) || 150,
            avatarTone: 'primary',
          },
        ],
        reviews: [],
        mapPosition: {
          xPercent: 25 + Math.floor(Math.random() * 50),
          yPercent: 25 + Math.floor(Math.random() * 50),
        },
      };
      onAddOrchard(newOrchard);
      showToast('บันทึกพิกัดแปลงใหม่เข้าสู่ระบบเกษตรจังหวัดยะลาเรียบร้อยแล้ว');
    }

    setModalOpen(false);
  };

  const handleOpenPriceModal = () => {
    const first = dailyPrices[0];
    if (first) {
      setSelectedPriceId(first.id);
      setEditGiMin(first.giPriceMin);
      setEditGiMax(first.giPriceMax);
      setEditStallMin(first.stallPriceMin);
      setEditStallMax(first.stallPriceMax);
    }
    setPriceModalOpen(true);
  };

  const handleSelectPriceCultivar = (id: string) => {
    setSelectedPriceId(id);
    const found = dailyPrices.find((p) => p.id === id);
    if (found) {
      setEditGiMin(found.giPriceMin);
      setEditGiMax(found.giPriceMax);
      setEditStallMin(found.stallPriceMin);
      setEditStallMax(found.stallPriceMax);
    }
  };

  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPriceRow) return;
    const oldAvg = (selectedPriceRow.stallPriceMin + selectedPriceRow.stallPriceMax) / 2;
    const newAvg = (editStallMin + editStallMax) / 2;
    onUpdatePriceRow({
      ...selectedPriceRow,
      giPriceMin: Number(editGiMin),
      giPriceMax: Number(editGiMax),
      stallPriceMin: Number(editStallMin),
      stallPriceMax: Number(editStallMax),
      changeDelta: Number((newAvg - oldAvg).toFixed(2)) || selectedPriceRow.changeDelta,
      updatedAt: new Date().toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      }) + ' น.',
    });
    setPriceModalOpen(false);
    showToast(`อัปเดตราคากลาง "${selectedPriceRow.cultivar}" เรียบร้อยแล้ว`);
  };

  const handleExportCsv = () => {
    const headers = [
      'รหัสแปลง',
      'ชื่อสถานที่',
      'เจ้าของ/ผู้ดูแล',
      'ประเภท',
      'อำเภอ',
      'ละติจูด',
      'ลองจิจูด',
      'รับรองGI',
      'เบอร์โทร',
      'ราคาหมอนทอง(บาท/กก.)',
      'สถานะ',
    ];
    const rows = orchards.map((o) => [
      o.code,
      o.name,
      o.ownerName,
      o.categoryLabel,
      o.district,
      o.lat,
      o.lng,
      o.giCertified ? 'ใช่' : 'ไม่ใช่',
      o.phone,
      o.monthongPrice,
      o.status,
    ]);
    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `yala-durian-registry-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('ส่งออกข้อมูลทะเบียนสวนและแผงทุเรียนเป็นไฟล์ CSV เรียบร้อยแล้ว');
  };

  // Filtered table rows
  const filteredOrchards = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orchards.filter((o) => {
      if (
        activeTab === 'stalls' &&
        o.category !== 'stall_export' &&
        o.category !== 'stall_local'
      ) {
        return false;
      }
      if (activeTab === 'pending' && o.status !== 'รอตรวจพิกัดแปลง') {
        return false;
      }
      if (activeTab === 'gi' && !o.giCertified) {
        return false;
      }

      const matchQuery =
        !q ||
        o.name.toLowerCase().includes(q) ||
        o.ownerName.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q) ||
        o.district.toLowerCase().includes(q) ||
        o.standards.some((s) => s.toLowerCase().includes(q));

      const matchDistrict =
        !districtFilter || o.district.includes(districtFilter);

      const matchStatus =
        !statusFilter ||
        (statusFilter === 'เปิดบริการ' &&
          (o.status === 'เปิดบริการปกติ' || o.status === 'เปิดรับซื้อปกติ')) ||
        (statusFilter === 'พักช่วง' && o.status === 'พักช่วงนอกฤดู') ||
        (statusFilter === 'รอตรวจ' && o.status === 'รอตรวจพิกัดแปลง');

      const matchGi =
        !giFilter ||
        (giFilter === 'GI สะเด็ดน้ำ' && o.giCertified) ||
        (giFilter === 'GAP' && o.gapCertified);

      return matchQuery && matchDistrict && matchStatus && matchGi;
    });
  }, [orchards, activeTab, searchQuery, districtFilter, statusFilter, giFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, districtFilter, statusFilter, giFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrchards.length / ADMIN_PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedOrchards = filteredOrchards.slice(
    (safePage - 1) * ADMIN_PAGE_SIZE,
    safePage * ADMIN_PAGE_SIZE
  );

  // Dynamic KPIs
  const totalOrchardCount = orchards.filter(
    (o) => o.category === 'orchard_tour' || o.category === 'orchard_farm'
  ).length;
  const totalStallCount = orchards.filter(
    (o) => o.category === 'stall_export' || o.category === 'stall_local'
  ).length;
  const giCount = orchards.filter((o) => o.giCertified).length;
  const generalOrchardCount = Math.max(0, totalOrchardCount - orchards.filter((o) => (o.category === 'orchard_tour' || o.category === 'orchard_farm') && o.giCertified).length);
  const activeStallCount = orchards.filter(
    (o) =>
      (o.category === 'stall_export' || o.category === 'stall_local') &&
      o.status !== 'พักช่วงนอกฤดู'
  ).length;
  const pausedCount = orchards.filter((o) => o.status === 'พักช่วงนอกฤดู').length;
  const pendingCount = orchards.filter((o) => o.status === 'รอตรวจพิกัดแปลง').length;
  const avgMonthongPrice =
    dailyPrices[0]
      ? ((dailyPrices[0].stallPriceMin + dailyPrices[0].stallPriceMax) / 2).toFixed(2)
      : '152.50';
  const passRate = orchards.length
    ? ((orchards.filter((o) => o.giCertified || o.gapCertified).length / orchards.length) * 100).toFixed(1)
    : '94.2';

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[60] bg-primary text-on-primary px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-sm font-semibold">
          <span className="material-symbols-outlined text-secondary-fixed">check_circle</span>
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-on-primary/70 hover:text-on-primary ml-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Fixed Left Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-surface-container-lowest z-50 flex flex-col shadow-[2px_0_12px_rgba(27,77,62,0.05)] transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-20 px-4 flex items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center gap-2">
            <img
              alt="Yala Durian Hub Logo"
              className="h-8 w-auto object-contain"
              src={ASSETS.logo}
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col">
              <span className="text-[18px] font-semibold text-primary leading-none">
                Admin Portal
              </span>
              <span className="text-[11px] font-semibold text-on-surface-variant">จ.ยะลา</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-surface-container"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="px-4 py-2">
          <div className="p-2.5 bg-surface-container-low rounded-xl flex items-center gap-2.5">
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover shrink-0 bg-surface-container"
              src={ASSETS.avatarAdminSidebar}
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] font-semibold text-on-surface truncate">
                ผู้ดูแลระบบ
              </span>
              <span className="text-[11px] text-on-surface-variant truncate">
                {adminEmail}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 flex flex-col gap-1 overflow-y-auto">
          <span className="px-2 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
            จัดการข้อมูลสวนและผลผลิต
          </span>

          {[
            { id: 'all', icon: 'dashboard', label: 'ภาพรวมแดชบอร์ด' },
            { id: 'all_orchards', icon: 'nature_people', label: 'จัดการข้อมูลสวนทุเรียน' },
            { id: 'stalls', icon: 'storefront', label: 'จัดการแผงรับซื้อ (ล้ง)' },
            { id: 'pricing', icon: 'payments', label: 'อัปเดตราคากลางประจำวัน' },
            { id: 'gi', icon: 'verified_user', label: 'รับรองมาตรฐาน GI สะเด็ดน้ำ' },
            { id: 'bookings', icon: 'event_available', label: `คิวจองเยี่ยมชม (${bookings.length})` },
          ].map((item) => {
            const targetTab = item.id === 'all_orchards' ? 'all' : (item.id as AdminTab);
            const active =
              item.id === 'all'
                ? activeTab === 'all'
                : item.id === 'all_orchards'
                ? false
                : activeTab === targetTab;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(targetTab);
                  setSidebarOpen(false);
                }}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-left text-[13px] transition-all rounded-xl cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-primary-container text-on-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          <div className="my-2 bg-surface-container h-[1px]" />
          <span className="px-2 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
            มุมมองผู้ใช้งาน
          </span>

          <button
            type="button"
            onClick={() => onNavigate('map-directory')}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[13px] font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-lg">public</span>
            <span>กลับสู่หน้าแผนที่หลัก</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('orchard-detail')}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[13px] font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-lg">park</span>
            <span>ดูหน้าสวนปู่สุข (สาธารณะ)</span>
          </button>
        </nav>

        <div className="p-4">
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-error-container hover:text-on-error-container transition-colors text-[12px] font-semibold cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-72">
        <header className="fixed top-0 left-0 lg:left-72 right-0 h-20 bg-surface/90 backdrop-blur-md shadow-[0_1px_8px_rgba(27,77,62,0.04)] z-40 flex items-center justify-between px-6 gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-surface-container-low text-on-surface"
              aria-label="เปิดแถบเมนูหลังบ้าน"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="text-[13px] font-semibold text-primary bg-primary-fixed px-3 py-1 rounded-full whitespace-nowrap">
              เขตตรวจราชการที่ 8 จ.ยะลา
            </span>
            <span className="hidden md:inline text-[11px] font-semibold text-on-surface-variant truncate">
              ฤดูกาลผลผลิต: ทุเรียนสะเด็ดน้ำยะลา 2568
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center bg-surface-container-low rounded-lg px-3 py-1.5 focus-within:bg-surface-container-lowest transition-colors">
              <span className="material-symbols-outlined text-outline text-base mr-1.5">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาทะเบียนสวน, ผู้รับซื้อ..."
                className="bg-transparent text-on-surface text-[12px] outline-none w-44 placeholder:text-outline"
              />
            </div>

            <a
              href="tel:073212870"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface text-[11px] font-semibold tabular-nums"
            >
              <span className="material-symbols-outlined text-base text-secondary">call</span>
              <span>073-212870</span>
            </a>

            <div className="flex items-center gap-2 pl-1">
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover bg-surface-container"
                src={ASSETS.avatarAdminHeader}
                referrerPolicy="no-referrer"
              />
              <span className="hidden sm:inline text-[11px] text-on-surface font-semibold whitespace-nowrap">
                เจ้าหน้าที่เกษตร
              </span>
            </div>
          </div>
        </header>

        <main className="relative pt-20 bg-background min-h-screen">
          <div className="p-6 flex flex-col gap-6">
            {/* Top Admin Overview & Session State */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-primary-container" />
                    ออนไลน์ความปลอดภัยสูง SSL/TLS
                  </span>
                  <span className="text-on-surface-variant text-[11px] font-semibold">
                    พิกัดศูนย์ควบคุม: ศาลากลางจังหวัดยะลา
                  </span>
                </div>
                <h1 className="text-[26px] md:text-[32px] leading-[1.2] font-bold text-primary">
                  ระบบจัดการพิกัดสวนและแผงทุเรียน จ.ยะลา
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-on-surface-variant text-[12px]">
                  <span className="material-symbols-outlined text-base text-primary">
                    shield_person
                  </span>
                  <span>
                    ยินดีต้อนรับ:{' '}
                    <strong className="text-on-surface font-semibold">{adminEmail}</strong>{' '}
                    (สิทธิ์ผู้ดูแลระบบสูงสุด Super Admin / เจ้าหน้าที่ ID: 136868000)
                  </span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-outline-variant" />
                  <span className="text-secondary text-[11px] font-semibold">
                    ยืนยัน 2FA เรียบร้อย
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="flex items-center gap-1.5 px-4 h-11 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-[14px] font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-lg">add_location_alt</span>
                  <span>+ เพิ่มพิกัดสวน/แผงใหม่</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenPriceModal}
                  className="flex items-center gap-1.5 px-4 h-11 rounded-lg bg-secondary hover:bg-secondary-container hover:text-on-secondary-container text-on-secondary text-[14px] font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-lg">price_change</span>
                  <span>อัปเดตราคาตลาดวันนี้</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 px-4 h-11 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface text-[14px] font-semibold transition-all cursor-pointer whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-lg">download</span>
                  <span>ส่งออกข้อมูล CSV/Excel</span>
                </button>
              </div>
            </div>

            {/* Summary Metric KPI Cards (4 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Card 1 */}
              <div className="relative bg-surface-container-lowest rounded-xl p-4 shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
                <div className="flex items-start justify-between pl-1">
                  <div>
                    <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                      แปลงเพาะปลูกในระบบ
                    </span>
                    <h3 className="text-[18px] font-semibold text-on-surface mt-1">
                      สวนทุเรียนทั้งหมด
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-xl">park</span>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-1.5 pl-1 tabular-nums">
                  <span className="text-[36px] leading-[1.1] text-primary font-bold">
                    {totalOrchardCount}
                  </span>
                  <span className="text-[14px] text-on-surface-variant">สวน</span>
                  <span className="ml-auto text-[11px] font-semibold text-primary bg-primary-fixed/60 px-2 py-0.5 rounded-full">
                    รวมทั้งหมด {orchards.length} รายชื่อ
                  </span>
                </div>
                <div className="mt-2 pt-2 flex items-center justify-between text-on-surface-variant text-[11px] font-semibold pl-1 tabular-nums">
                  <span>
                    สะเด็ดน้ำ GI: <strong className="text-primary font-bold">{giCount}</strong>{' '}
                    แห่ง
                  </span>
                  <span>
                    สวนทั่วไป: <strong className="text-on-surface">{generalOrchardCount}</strong> แห่ง
                  </span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="relative bg-surface-container-lowest rounded-xl p-4 shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary" />
                <div className="flex items-start justify-between pl-1">
                  <div>
                    <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                      เครือข่ายจุดรับซื้อ
                    </span>
                    <h3 className="text-[18px] font-semibold text-on-surface mt-1">
                      แผงรับซื้อ/ล้งทุเรียน
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-secondary-fixed flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-xl">storefront</span>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-1.5 pl-1 tabular-nums">
                  <span className="text-[36px] leading-[1.1] text-secondary font-bold">
                    {totalStallCount}
                  </span>
                  <span className="text-[14px] text-on-surface-variant">แห่ง</span>
                  <span className="ml-auto text-[11px] font-semibold text-on-tertiary-fixed-variant bg-tertiary-fixed px-2 py-0.5 rounded-full">
                    เปิดรับซื้อปกติ {activeStallCount}
                  </span>
                </div>
                <div className="mt-2 pt-2 flex items-center justify-between text-on-surface-variant text-[11px] font-semibold pl-1">
                  <span>
                    พักช่วงนอกฤดู: <strong className="text-secondary font-bold">{pausedCount}</strong> แห่ง
                  </span>
                  <span className="text-primary">อัตราครอบคลุม 8 อำเภอ</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="relative bg-surface-container-lowest rounded-xl p-4 shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-tertiary-container" />
                <div className="flex items-start justify-between pl-1">
                  <div>
                    <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                      ราคากลางพาณิชย์ จ.ยะลา
                    </span>
                    <h3 className="text-[18px] font-semibold text-on-surface mt-1">
                      ราคาเฉลี่ยหมอนทองวันนี้
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-xl">trending_up</span>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-1.5 pl-1 tabular-nums">
                  <span className="text-[36px] leading-[1.1] text-tertiary font-bold">
                    {avgMonthongPrice}
                  </span>
                  <span className="text-[14px] text-on-surface-variant">บ./กก.</span>
                  <span className="ml-auto text-[11px] text-primary font-semibold flex items-center">
                    <span className="material-symbols-outlined text-sm">arrow_drop_up</span> +5.00
                    บ.
                  </span>
                </div>
                <div className="mt-2 pt-2 flex items-center justify-between text-on-surface-variant text-[11px] font-semibold pl-1">
                  <span>เทียบสัปดาห์ก่อน (+3.38%)</span>
                  <span className="text-on-surface">เกรด AB พรีเมียม</span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="relative bg-surface-container-lowest rounded-xl p-4 shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary-fixed-dim" />
                <div className="flex items-start justify-between pl-1">
                  <div>
                    <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                      การประเมินคุณภาพ
                    </span>
                    <h3 className="text-[18px] font-semibold text-on-surface mt-1">
                      สถานะการตรวจรับรอง GAP/GI
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-xl">verified</span>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-1.5 pl-1 tabular-nums">
                  <span className="text-[36px] leading-[1.1] text-primary font-bold">
                    {passRate}%
                  </span>
                  <span className="text-[14px] text-on-surface-variant">ผ่านเกณฑ์</span>
                  <span className="ml-auto text-[11px] font-semibold text-on-surface-variant">
                    {orchards.filter((o) => o.giCertified || o.gapCertified).length} จาก{' '}
                    {orchards.length} รายการ
                  </span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 mt-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${passRate}%` }} />
                </div>
              </div>
            </div>

            {/* Main Interactive Management Table & CRUD Section */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm flex flex-col overflow-hidden">
              {/* Tabs Bar */}
              <div className="flex flex-wrap items-center justify-between px-6 pt-4 bg-surface-container-low gap-2">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-3 text-[13px] font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === 'all'
                        ? 'text-primary border-b-2 border-primary bg-surface-container-lowest'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    รายการสวนทั้งหมด ({orchards.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('stalls')}
                    className={`px-4 py-3 text-[13px] font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === 'stalls'
                        ? 'text-primary border-b-2 border-primary bg-surface-container-lowest'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    แผงรับซื้อ/ล้ง ({totalStallCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-3 text-[13px] font-semibold rounded-t-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      activeTab === 'pending'
                        ? 'text-primary border-b-2 border-primary bg-surface-container-lowest'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span>รอการอนุมัติพิกัดใหม่</span>
                    <span className="bg-secondary text-on-secondary px-1.5 py-0.5 rounded-full text-[11px] tabular-nums">
                      {pendingCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('pricing')}
                    className={`px-4 py-3 text-[13px] font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === 'pricing'
                        ? 'text-primary border-b-2 border-primary bg-surface-container-lowest'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    บันทึกราคาตลาดประจำวัน
                  </button>
                </div>
                <div className="py-2 text-on-surface-variant text-[11px] font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-primary">sync</span>
                  <span>ซิงค์ดาวเทียม GIS ล่าสุด: 10:45 น. วันนี้</span>
                </div>
              </div>

              {activeTab === 'pricing' ? (
                <div className="p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-primary">
                        ตารางจัดการราคากลางทุเรียน จ.ยะลา ประจำวัน
                      </h2>
                      <p className="text-xs text-on-surface-variant">
                        แก้ไขราคาอ้างอิงหน้าสวน GI และราคารับซื้อหน้าล้งส่งออกได้ทันที
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenPriceModal}
                      className="px-4 py-2 rounded-lg bg-secondary text-on-secondary text-xs font-semibold cursor-pointer"
                    >
                      ปรับปรุงราคาใหม่
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container text-[11px] font-semibold text-on-surface-variant uppercase">
                          <th className="py-3 px-4">สายพันธุ์</th>
                          <th className="py-3 px-4">เกรด</th>
                          <th className="py-3 px-4 text-right">หน้าสวน GI (บ./กก.)</th>
                          <th className="py-3 px-4 text-right">หน้าล้ง (บ./กก.)</th>
                          <th className="py-3 px-4 text-right">อัปเดตล่าสุด</th>
                          <th className="py-3 px-4 text-center">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20 text-sm tabular-nums">
                        {dailyPrices.map((row) => (
                          <tr key={row.id} className="hover:bg-surface-container-low">
                            <td className="py-3.5 px-4 font-bold text-primary">{row.cultivar}</td>
                            <td className="py-3.5 px-4 text-on-surface-variant">{row.grade}</td>
                            <td className="py-3.5 px-4 text-right font-bold text-secondary">
                              {row.giPriceMin} - {row.giPriceMax}
                            </td>
                            <td className="py-3.5 px-4 text-right font-semibold">
                              {row.stallPriceMin} - {row.stallPriceMax}
                            </td>
                            <td className="py-3.5 px-4 text-right text-xs text-on-surface-variant">
                              {row.updatedAt}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  handleSelectPriceCultivar(row.id);
                                  setPriceModalOpen(true);
                                }}
                                className="px-3 py-1 rounded-lg bg-surface-container text-primary text-xs font-semibold hover:bg-primary hover:text-on-primary transition-colors cursor-pointer"
                              >
                                แก้ไขราคา
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : activeTab === 'bookings' ? (
                <div className="p-6 space-y-4">
                  <h2 className="text-base font-bold text-primary">
                    คำขอจองเยี่ยมชมสวนและสั่งจองผลผลิตล่วงหน้า ({bookings.length} รายการ)
                  </h2>
                  {bookings.length === 0 ? (
                    <div className="p-8 rounded-xl bg-surface-container-low text-center text-sm text-on-surface-variant">
                      ยังไม่มีคำขอจองคิวใหม่จากหน้าเว็บไซต์สาธารณะ
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-surface-container text-[11px] font-semibold text-on-surface-variant uppercase">
                            <th className="py-3 px-4">รหัสอ้างอิง</th>
                            <th className="py-3 px-4">สวนปลายทาง</th>
                            <th className="py-3 px-4">ผู้ติดต่อ / เบอร์โทร</th>
                            <th className="py-3 px-4">จุดประสงค์</th>
                            <th className="py-3 px-4">วันที่ / จำนวน</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20 text-sm tabular-nums">
                          {bookings.map((b) => (
                            <tr key={b.id} className="hover:bg-surface-container-low">
                              <td className="py-3 px-4 font-mono text-xs font-bold text-primary">
                                {b.id}
                              </td>
                              <td className="py-3 px-4 font-semibold">{b.orchardName}</td>
                              <td className="py-3 px-4">
                                <div>{b.contactName}</div>
                                <div className="text-xs text-on-surface-variant">{b.phone}</div>
                              </td>
                              <td className="py-3 px-4 text-xs">{b.purposeLabel}</td>
                              <td className="py-3 px-4 text-xs">
                                {b.date} · <strong>{b.quantity}</strong> หน่วย
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Filters & Controls Inside Table */}
                  <div className="p-6 bg-surface-container-lowest flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                      <div className="relative flex-1 min-w-[260px] max-w-md">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">
                          search
                        </span>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="ค้นหาชื่อสวน, แผงล้ง, ทะเบียน GI หรือรหัสแปลง..."
                          className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface text-on-surface text-[12px] outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={districtFilter}
                          onChange={(e) => setDistrictFilter(e.target.value)}
                          className="px-3 py-2 rounded-lg bg-surface text-on-surface text-[11px] font-semibold outline-none cursor-pointer"
                        >
                          <option value="">ทุกอำเภอ (จ.ยะลา)</option>
                          {YALA_DISTRICTS.map((d) => (
                            <option key={d} value={d.replace('อ.', '')}>
                              {d}
                            </option>
                          ))}
                        </select>

                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="px-3 py-2 rounded-lg bg-surface text-on-surface text-[11px] font-semibold outline-none cursor-pointer"
                        >
                          <option value="">ทุกสถานะกิจการ</option>
                          <option value="เปิดบริการ">เปิดบริการปกติ</option>
                          <option value="พักช่วง">พักช่วงนอกฤดู</option>
                          <option value="รอตรวจ">รอตรวจพิกัด</option>
                        </select>

                        <select
                          value={giFilter}
                          onChange={(e) => setGiFilter(e.target.value)}
                          className="px-3 py-2 rounded-lg bg-surface text-on-surface text-[11px] font-semibold outline-none cursor-pointer"
                        >
                          <option value="">การรับรองทั้งหมด</option>
                          <option value="GI สะเด็ดน้ำ">เฉพาะสะเด็ดน้ำ GI</option>
                          <option value="GAP">เฉพาะ GAP</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-on-surface-variant text-[11px] font-semibold tabular-nums">
                      <span>
                        แสดง <strong className="text-on-surface">{filteredOrchards.length}</strong>{' '}
                        จาก {orchards.length} รายการ
                      </span>
                      {(searchQuery || districtFilter || statusFilter || giFilter) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setDistrictFilter('');
                            setStatusFilter('');
                            setGiFilter('');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-container text-primary transition-colors cursor-pointer"
                        >
                          ล้างตัวกรอง
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Data Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                          <th className="py-3 px-4">ชื่อสถานที่ / ผู้ดูแล</th>
                          <th className="py-3 px-4">ประเภท</th>
                          <th className="py-3 px-4">อำเภอ / พิกัด GPS</th>
                          <th className="py-3 px-4">มาตรฐานที่ได้รับ</th>
                          <th className="py-3 px-4">เบอร์ติดต่อ</th>
                          <th className="py-3 px-4">ราคากลางวันนี้</th>
                          <th className="py-3 px-4">สถานะ</th>
                          <th className="py-3 px-4 text-center">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="text-[12px] text-on-surface divide-y divide-outline-variant/15">
                        {paginatedOrchards.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-10 text-center text-on-surface-variant">
                              ไม่พบข้อมูลสวนหรือแผงรับซื้อตามเงื่อนไขที่เลือก
                            </td>
                          </tr>
                        ) : (
                          paginatedOrchards.map((row, idx) => {
                            const isStall =
                              row.category === 'stall_export' || row.category === 'stall_local';
                            const isPending = row.status === 'รอตรวจพิกัดแปลง';
                            const isPaused = row.status === 'พักช่วงนอกฤดู';

                            return (
                              <tr
                                key={row.id}
                                className={`${
                                  idx % 2 === 1 ? 'bg-surface-container-lowest/50' : ''
                                } hover:bg-surface-container-low transition-colors`}
                              >
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-surface-container">
                                      <img
                                        src={row.thumbnailUrl}
                                        alt={row.name}
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <button
                                        type="button"
                                        onClick={() => onViewOrchard(row.id)}
                                        className="text-[15px] font-semibold text-on-surface hover:text-primary text-left truncate cursor-pointer"
                                      >
                                        {row.name}
                                      </button>
                                      <span className="text-[11px] font-medium text-on-surface-variant truncate">
                                        รหัสแปลง: {row.code} · {row.ownerName}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-4 px-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                      isStall
                                        ? 'bg-secondary-fixed text-on-secondary-fixed'
                                        : 'bg-surface-container-high text-primary'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-xs">
                                      {row.categoryIcon}
                                    </span>
                                    <span>{row.categoryLabel}</span>
                                  </span>
                                </td>

                                <td className="py-4 px-4">
                                  <div className="flex flex-col tabular-nums">
                                    <span className="text-[12px] font-semibold text-on-surface">
                                      {row.district}
                                    </span>
                                    <span className="text-[11px] text-on-surface-variant font-mono">
                                      {row.lat.toFixed(4)}, {row.lng.toFixed(4)}
                                    </span>
                                    <span className="text-[11px] text-secondary">
                                      ความสูง {row.elevationMeters} ม. รทก.
                                    </span>
                                  </div>
                                </td>

                                <td className="py-4 px-4">
                                  <div className="flex flex-wrap gap-1">
                                    {row.giCertified && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[11px] font-semibold">
                                        <span className="material-symbols-outlined text-xs">
                                          verified
                                        </span>
                                        GI สะเด็ดน้ำ
                                      </span>
                                    )}
                                    {row.standards
                                      .filter((s) => s !== 'GI สะเด็ดน้ำ' && s !== 'จุดรับซื้อ GI')
                                      .map((std) => (
                                        <span
                                          key={std}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-medium"
                                        >
                                          {std}
                                        </span>
                                      ))}
                                  </div>
                                </td>

                                <td className="py-4 px-4 whitespace-nowrap tabular-nums">
                                  <div className="flex flex-col">
                                    <span className="text-[12px] font-semibold text-on-surface">
                                      {row.phone}
                                    </span>
                                    <span className="text-[11px] text-on-surface-variant">
                                      Line: {row.lineId}
                                    </span>
                                  </div>
                                </td>

                                <td className="py-4 px-4 whitespace-nowrap tabular-nums">
                                  <div className="flex flex-col">
                                    <span
                                      className={`text-[12px] font-semibold ${
                                        isStall ? 'text-secondary' : 'text-primary'
                                      }`}
                                    >
                                      {row.primaryPriceSummary}
                                    </span>
                                    <span className="text-[11px] text-on-surface-variant">
                                      {row.secondaryPriceSummary}
                                    </span>
                                  </div>
                                </td>

                                <td className="py-4 px-4 whitespace-nowrap">
                                  {isPending ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed-dim text-on-secondary-fixed text-[11px] font-semibold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                                      {row.status}
                                    </span>
                                  ) : isPaused ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-semibold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                                      {row.status}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed/70 text-on-primary-fixed text-[11px] font-semibold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                      {row.status}
                                    </span>
                                  )}
                                </td>

                                <td className="py-4 px-4 whitespace-nowrap text-center">
                                  {isPending ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onApproveOrchard(row.id);
                                          showToast(`อนุมัติพิกัดและรับรอง GI "${row.name}" เรียบร้อย`);
                                        }}
                                        className="px-2.5 py-1 rounded-lg bg-primary text-on-primary text-[11px] font-semibold flex items-center gap-1 hover:bg-primary-container cursor-pointer"
                                        title="อนุมัติพิกัด"
                                      >
                                        <span className="material-symbols-outlined text-sm">
                                          check_circle
                                        </span>
                                        <span>ตรวจรับรอง</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openEditModal(row)}
                                        className="p-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-on-surface-variant hover:text-primary cursor-pointer"
                                        title="แก้ไขข้อมูล"
                                      >
                                        <span className="material-symbols-outlined text-base">
                                          edit
                                        </span>
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => openEditModal(row)}
                                        className="p-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                                        title="แก้ไขข้อมูล"
                                      >
                                        <span className="material-symbols-outlined text-base">
                                          edit
                                        </span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onViewOrchard(row.id)}
                                        className="p-1.5 rounded-lg bg-surface hover:bg-surface-container-high text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"
                                        title="ดูหน้าสวนสาธารณะ"
                                      >
                                        <span className="material-symbols-outlined text-base">
                                          map
                                        </span>
                                      </button>
                                      <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${row.lat},${row.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 rounded-lg bg-surface hover:bg-secondary-container text-on-surface-variant hover:text-on-secondary-container transition-colors"
                                        title="นำทาง Google Maps"
                                      >
                                        <span className="material-symbols-outlined text-base">
                                          near_me
                                        </span>
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => setDeleteTarget(row)}
                                        className="p-1.5 rounded-lg bg-surface hover:bg-error-container text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                                        title="ลบข้อมูล"
                                      >
                                        <span className="material-symbols-outlined text-base">
                                          delete
                                        </span>
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="px-6 py-4 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-on-surface-variant tabular-nums">
                      กำลังแสดงหน้า {safePage} จาก {totalPages} หน้า (รายการที่{' '}
                      {filteredOrchards.length === 0 ? 0 : (safePage - 1) * ADMIN_PAGE_SIZE + 1} -{' '}
                      {Math.min(safePage * ADMIN_PAGE_SIZE, filteredOrchards.length)} จาก{' '}
                      {filteredOrchards.length} แปลง)
                    </span>
                    <div className="flex items-center gap-1 tabular-nums">
                      <button
                        type="button"
                        disabled={safePage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-semibold disabled:opacity-50 cursor-pointer"
                      >
                        ก่อนหน้า
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`w-8 h-8 rounded-lg text-[11px] font-semibold cursor-pointer ${
                            safePage === p
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface hover:bg-surface-container text-on-surface'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={safePage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="px-3 py-1 rounded-lg bg-surface hover:bg-surface-container-high text-on-surface text-[11px] font-semibold disabled:opacity-50 cursor-pointer"
                      >
                        ถัดไป
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Split Section: Mini Geographic Quick Map & Security Access Log Widget */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Mini Geographic Quick Map (Col 7) */}
              <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-[18px] font-semibold text-on-surface">
                      แผนที่กระจายตัวพิกัดสวนและล้ง จ.ยะลา
                    </h2>
                    <p className="text-[11px] text-on-surface-variant">
                      ตรวจสอบจุดที่มีการปักหมุดล่าสุด พร้อมตัวบ่งชี้ระดับความสูงเหนือระดับน้ำทะเล
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed text-primary text-[11px] font-semibold shrink-0">
                    <span className="material-symbols-outlined text-xs">satellite_alt</span>{' '}
                    พิกัดเรียลไทม์
                  </span>
                </div>

                <RealYalaMap
                  orchards={filteredOrchards}
                  onSelectOrchard={(id) => onViewOrchard(id)}
                  heightClass="h-80"
                />
              </div>

              {/* System Security & Access Log Widget (Col 5) */}
              <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xl text-primary">
                        security
                      </span>
                      <h2 className="text-[18px] font-semibold text-on-surface">
                        บันทึกความปลอดภัย &amp; ผู้ดูแลระบบ
                      </h2>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[11px] font-semibold">
                      ปลอดภัย
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mb-4">
                    ประวัติเซสชันและการแก้ไขข้อมูลล่าสุดโดยเจ้าหน้าที่เกษตรประจำศูนย์
                  </p>

                  <div className="flex flex-col gap-2">
                    {securityLogs.slice(0, 3).map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-lg bg-surface-container-low flex items-start gap-2.5"
                      >
                        <span
                          className={`material-symbols-outlined text-lg mt-0.5 ${
                            log.tone === 'primary'
                              ? 'text-primary'
                              : log.tone === 'secondary'
                              ? 'text-secondary'
                              : 'text-tertiary'
                          }`}
                        >
                          {log.icon}
                        </span>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12px] text-on-surface font-semibold truncate">
                              {log.title}
                            </span>
                            <span className="text-[11px] text-on-surface-variant shrink-0 tabular-nums">
                              {log.timestamp}
                            </span>
                          </div>
                          <span className="text-[11px] text-on-surface-variant truncate">
                            {log.actor}
                          </span>
                          <span className="text-[11px] text-secondary font-medium truncate">
                            {log.detail}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 flex items-center justify-between text-on-surface-variant text-[11px] font-semibold">
                  <span>สิทธิ์เข้าถึง: สวพ.8 / เกษตรจังหวัดยะลา</span>
                  <button
                    type="button"
                    onClick={() => setLogsModalOpen(true)}
                    className="text-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>ดูประวัติทั้งหมด</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add / Edit Orchard Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">add_location_alt</span>
                </div>
                <div>
                  <h3 className="text-[18px] font-semibold text-on-surface">
                    {editingOrchard
                      ? `แก้ไขข้อมูล: ${editingOrchard.name}`
                      : 'เพิ่มพิกัดสวนหรือแผงรับซื้อใหม่ (จ.ยะลา)'}
                  </h3>
                  <p className="text-[11px] text-on-surface-variant">
                    กรอกข้อมูลแปลงเพาะปลูกเพื่อลงทะเบียนฐานข้อมูลสารสนเทศเกษตร
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveOrchard} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-on-surface font-semibold">
                    ชื่อสวน / แผงรับซื้อ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="เช่น สวนลุงพัฒน์ สะเด็ดน้ำธารโต"
                    className="px-4 py-2.5 rounded-lg bg-surface text-on-surface text-[12px] outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-on-surface font-semibold">
                    ชื่อเจ้าของ / ผู้ติดต่อประสานงาน *
                  </label>
                  <input
                    type="text"
                    required
                    value={formOwner}
                    onChange={(e) => setFormOwner(e.target.value)}
                    placeholder="เช่น นายพัฒนศักดิ์ บัวแก้ว"
                    className="px-4 py-2.5 rounded-lg bg-surface text-on-surface text-[12px] outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-on-surface font-semibold">ประเภทสถานที่ *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as LocationCategory)}
                    className="px-4 py-2.5 rounded-lg bg-surface text-on-surface text-[12px] outline-none cursor-pointer"
                  >
                    <option value="orchard_tour">สวนท่องเที่ยวเชิงเกษตร (Agritourism)</option>
                    <option value="orchard_farm">สวนผลผลิตทุเรียน (Commercial Farm)</option>
                    <option value="stall_export">แผงรับซื้อส่งออก / ล้ง (Export Stall)</option>
                    <option value="stall_local">จุดรวบรวมกลุ่มวิสาหกิจชุมชน</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-on-surface font-semibold">อำเภอที่ตั้งแปลง *</label>
                  <select
                    value={formDistrict}
                    onChange={(e) => setFormDistrict(e.target.value)}
                    className="px-4 py-2.5 rounded-lg bg-surface text-on-surface text-[12px] outline-none cursor-pointer"
                  >
                    {YALA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-on-surface font-semibold flex items-center justify-between">
                    <span>ละติจูด (Latitude) *</span>
                    <button
                      type="button"
                      onClick={handleLocateCurrentGps}
                      className="text-primary font-normal text-xs hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">my_location</span>{' '}
                      หาพิกัดปัจจุบัน
                    </button>
                  </label>
                  <input
                    type="text"
                    required
                    value={formLat}
                    onChange={(e) => setFormLat(e.target.value)}
                    className="px-4 py-2.5 rounded-lg bg-surface text-on-surface text-[12px] outline-none font-mono focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-on-surface font-semibold">
                    ลองจิจูด (Longitude) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formLng}
                    onChange={(e) => setFormLng(e.target.value)}
                    className="px-4 py-2.5 rounded-lg bg-surface text-on-surface text-[12px] outline-none font-mono focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-2">
                <span className="text-[11px] text-on-surface font-semibold">
                  การรับรองและมาตรฐานคุณภาพ:
                </span>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-on-surface">
                    <input
                      type="checkbox"
                      checked={formGi}
                      onChange={(e) => setFormGi(e.target.checked)}
                      className="rounded text-primary"
                    />
                    <span className="inline-flex items-center gap-1 font-semibold text-primary">
                      <span className="material-symbols-outlined text-sm">verified</span>
                      ได้รับมาตรฐานสิ่งบ่งชี้ทางภูมิศาสตร์ (GI สะเด็ดน้ำยะลา)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-on-surface">
                    <input
                      type="checkbox"
                      checked={formGap}
                      onChange={(e) => setFormGap(e.target.checked)}
                      className="rounded text-primary"
                    />
                    <span>มาตรฐานการปฏิบัติทางการเกษตรที่ดี (GAP)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-on-surface">
                    <input
                      type="checkbox"
                      checked={formZeroChem}
                      onChange={(e) => setFormZeroChem(e.target.checked)}
                      className="rounded text-primary"
                    />
                    <span>ใบรับรองสารเคมีตกค้างเป็นศูนย์</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-on-surface font-semibold">
                    เบอร์โทรศัพท์ติดต่อ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="เช่น 08X-XXX-XXXX"
                    className="px-4 py-2.5 rounded-lg bg-surface text-on-surface text-[12px] outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-on-surface font-semibold">
                    ราคาประเมินหมอนทอง (บ./กก.)
                  </label>
                  <input
                    type="number"
                    min={50}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="px-4 py-2.5 rounded-lg bg-surface text-on-surface text-[12px] outline-none focus:ring-2 focus:ring-primary/20 tabular-nums"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface text-[14px] font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-[14px] font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">check</span>
                  <span>{editingOrchard ? 'บันทึกการแก้ไข' : 'บันทึกพิกัดและส่งอนุมัติ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Daily Market Price Update Modal */}
      {priceModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPriceModalOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">อัปเดตราคากลางทุเรียน จ.ยะลา วันนี้</h3>
              <button
                type="button"
                onClick={() => setPriceModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSavePrice} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  เลือกสายพันธุ์ทุเรียน
                </label>
                <select
                  value={selectedPriceId}
                  onChange={(e) => handleSelectPriceCultivar(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-sm font-semibold outline-none"
                >
                  {dailyPrices.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.cultivar}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    ราคาหน้าสวน GI ต่ำสุด (บ.)
                  </label>
                  <input
                    type="number"
                    value={editGiMin}
                    onChange={(e) => setEditGiMin(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    ราคาหน้าสวน GI สูงสุด (บ.)
                  </label>
                  <input
                    type="number"
                    value={editGiMax}
                    onChange={(e) => setEditGiMax(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    ราคารับซื้อหน้าล้ง ต่ำสุด (บ.)
                  </label>
                  <input
                    type="number"
                    value={editStallMin}
                    onChange={(e) => setEditStallMin(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    ราคารับซื้อหน้าล้ง สูงสุด (บ.)
                  </label>
                  <input
                    type="number"
                    value={editStallMax}
                    onChange={(e) => setEditStallMax(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm tabular-nums"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPriceModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container text-sm font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-secondary text-on-secondary text-sm font-semibold cursor-pointer"
                >
                  ประกาศราคากลาง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-surface-container-lowest rounded-xl shadow-xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-error">ยืนยันการลบข้อมูลทะเบียน</h3>
            <p className="text-sm text-on-surface-variant">
              ต้องการลบข้อมูล <strong className="text-on-surface">{deleteTarget.name}</strong> (
              {deleteTarget.code}) ออกจากฐานข้อมูลหรือไม่?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg bg-surface-container text-sm font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteOrchard(deleteTarget.id);
                  showToast(`ลบ "${deleteTarget.name}" ออกจากระบบแล้ว`);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 rounded-lg bg-error text-on-error text-sm font-semibold cursor-pointer"
              >
                ยืนยันลบข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Security Log Modal */}
      {logsModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLogsModalOpen(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-xl shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary">
                ประวัติกิจกรรมความปลอดภัยทั้งหมด ({securityLogs.length})
              </h3>
              <button
                type="button"
                onClick={() => setLogsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-2">
              {securityLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-surface-container-low flex items-start gap-3"
                >
                  <span className="material-symbols-outlined text-primary text-lg mt-0.5">
                    {log.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2 text-xs font-semibold">
                      <span className="text-on-surface">{log.title}</span>
                      <span className="text-on-surface-variant tabular-nums">{log.timestamp}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant">{log.actor}</p>
                    <p className="text-xs text-secondary">{log.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
