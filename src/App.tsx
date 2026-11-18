/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AdminLoginView } from './components/AdminLoginView';
import { AdminPortalView } from './components/AdminPortalView';
import { DailyMarketPricesView } from './components/DailyMarketPricesView';
import { DirectoryListView } from './components/DirectoryListView';
import { MapDirectoryView } from './components/MapDirectoryView';
import { OrchardDetailView } from './components/OrchardDetailView';
import { PublicFooter } from './components/PublicFooter';
import { PublicHeader } from './components/PublicHeader';
import { ShareQrModal } from './components/ShareQrModal';
import {
  INITIAL_DAILY_PRICES,
  INITIAL_ORCHARDS,
  INITIAL_SECURITY_LOGS,
} from './data/mockData';
import {
  AppRoute,
  BookingRequest,
  DailyMarketPriceRow,
  OrchardLocation,
  ReviewItem,
  SecurityLogEntry,
} from './types/durian';

const VALID_ROUTES: AppRoute[] = [
  'orchard-detail',
  'map-directory',
  'directory-list',
  'daily-market-prices',
  'admin-portal',
];

function getInitialUrlState(): {
  route: AppRoute;
  orchardId: string;
  district: string;
} {
  if (typeof window === 'undefined') {
    return { route: 'orchard-detail', orchardId: INITIAL_ORCHARDS[0].id, district: '' };
  }
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get('view') as AppRoute | null;
  const idParam = params.get('id');
  const districtParam = params.get('district') || '';

  const matchedOrchard = idParam
    ? INITIAL_ORCHARDS.find((o) => o.id === idParam || o.code === idParam)
    : undefined;

  const route: AppRoute =
    viewParam && VALID_ROUTES.includes(viewParam)
      ? viewParam
      : matchedOrchard
      ? 'orchard-detail'
      : 'orchard-detail';

  return {
    route,
    orchardId: matchedOrchard ? matchedOrchard.id : INITIAL_ORCHARDS[0].id,
    district: districtParam,
  };
}

export default function App() {
  const initialUrlState = getInitialUrlState();
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(initialUrlState.route);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [orchards, setOrchards] = useState<OrchardLocation[]>(INITIAL_ORCHARDS);
  const [selectedOrchardId, setSelectedOrchardId] = useState<string>(initialUrlState.orchardId);
  const [dailyPrices, setDailyPrices] = useState<DailyMarketPriceRow[]>(INITIAL_DAILY_PRICES);
  const [securityLogs, setSecurityLogs] = useState<SecurityLogEntry[]>(INITIAL_SECURITY_LOGS);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState(initialUrlState.district);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [currentRoute, selectedOrchardId, adminEmail]);

  useEffect(() => {
    if (typeof window === 'undefined' || currentRoute === 'admin-portal') return;
    const params = new URLSearchParams();
    if (currentRoute === 'orchard-detail') {
      if (selectedOrchardId && selectedOrchardId !== INITIAL_ORCHARDS[0].id) {
        params.set('view', 'orchard-detail');
        params.set('id', selectedOrchardId);
      }
    } else {
      params.set('view', currentRoute);
    }
    if (selectedDistrict) {
      params.set('district', selectedDistrict);
    }
    const queryStr = params.toString();
    const nextUrl = queryStr
      ? `${window.location.pathname}?${queryStr}`
      : window.location.pathname;
    window.history.replaceState(null, '', nextUrl);
  }, [currentRoute, selectedOrchardId, selectedDistrict]);

  const activeOrchard =
    orchards.find((o) => o.id === selectedOrchardId) || orchards[0];

  const appendLog = (entry: Omit<SecurityLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: SecurityLogEntry = {
      ...entry,
      id: `log-${Date.now()}`,
      timestamp: 'เมื่อสักครู่',
    };
    setSecurityLogs((prev) => [newEntry, ...prev]);
  };

  const handleAdminLoginSuccess = (email: string) => {
    setAdminEmail(email);
    appendLog({
      title: 'เข้าสู่ระบบสำเร็จ (Super Admin)',
      actor: `บัญชี: ${email}`,
      detail: 'ยืนยันตัวตนด้วยอีเมลและรหัสผ่านเรียบร้อย',
      icon: 'login',
      tone: 'primary',
    });
  };

  const handleAdminLogout = () => {
    if (adminEmail) {
      appendLog({
        title: 'ออกจากระบบผู้ดูแลระบบ',
        actor: `บัญชี: ${adminEmail}`,
        detail: 'ปิดเซสชันการทำงานเรียบร้อย',
        icon: 'logout',
        tone: 'tertiary',
      });
    }
    setAdminEmail(null);
  };

  const handleSelectOrchard = (orchardId: string) => {
    setSelectedOrchardId(orchardId);
    setCurrentRoute('orchard-detail');
  };

  const handleSubmitBooking = (
    payload: Omit<BookingRequest, 'id' | 'createdAt'>
  ): BookingRequest => {
    const created: BookingRequest = {
      ...payload,
      id: `YLA-${Math.floor(10000 + Math.random() * 90000)}`,
      createdAt: new Date().toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setBookings((prev) => [created, ...prev]);
    appendLog({
      title: `คำขอจองคิวใหม่ [${created.id}]`,
      actor: `ผู้ติดต่อ: ${created.contactName} (${created.phone})`,
      detail: `${created.orchardName} · ${created.quantity} หน่วย`,
      icon: 'event_available',
      tone: 'secondary',
    });
    return created;
  };

  const handleAddReview = (orchardId: string, review: Omit<ReviewItem, 'id'>) => {
    const newReview: ReviewItem = {
      ...review,
      id: `rev-${Date.now()}`,
    };
    setOrchards((prev) =>
      prev.map((o) => {
        if (o.id !== orchardId) return o;
        const updatedReviews = [newReview, ...o.reviews];
        const nextCount = o.reviewCount + 1;
        const avg =
          (o.rating * o.reviewCount + review.rating) / Math.max(1, nextCount);
        return {
          ...o,
          reviews: updatedReviews,
          reviewCount: nextCount,
          rating: Number(avg.toFixed(1)),
        };
      })
    );
  };

  const handleAddOrchard = (newOrchard: OrchardLocation) => {
    setOrchards((prev) => [newOrchard, ...prev]);
    appendLog({
      title: `ลงทะเบียนพิกัดใหม่ [${newOrchard.code}]`,
      actor: `ดำเนินการโดย: เจ้าหน้าที่ ID: 136868000`,
      detail: `${newOrchard.name} (${newOrchard.district})`,
      icon: 'add_location_alt',
      tone: 'primary',
    });
  };

  const handleUpdateOrchard = (updated: OrchardLocation) => {
    setOrchards((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    appendLog({
      title: `แก้ไขข้อมูลพิกัด [${updated.code}]`,
      actor: `ดำเนินการโดย: เจ้าหน้าที่ ID: 136868000`,
      detail: `อัปเดต ${updated.name} · หมอนทอง ${updated.monthongPrice} บ./กก.`,
      icon: 'edit_location',
      tone: 'secondary',
    });
  };

  const handleDeleteOrchard = (orchardId: string) => {
    const target = orchards.find((o) => o.id === orchardId);
    setOrchards((prev) => prev.filter((o) => o.id !== orchardId));
    if (selectedOrchardId === orchardId && orchards.length > 1) {
      const next = orchards.find((o) => o.id !== orchardId);
      if (next) setSelectedOrchardId(next.id);
    }
    if (target) {
      appendLog({
        title: `ลบทะเบียนพิกัด [${target.code}]`,
        actor: `ดำเนินการโดย: เจ้าหน้าที่ ID: 136868000`,
        detail: `นำ ${target.name} ออกจากฐานข้อมูล`,
        icon: 'delete',
        tone: 'tertiary',
      });
    }
  };

  const handleApproveOrchard = (orchardId: string) => {
    const target = orchards.find((o) => o.id === orchardId);
    setOrchards((prev) =>
      prev.map((o) => {
        if (o.id !== orchardId) return o;
        return {
          ...o,
          status: 'เปิดบริการปกติ',
          giCertified: true,
          giRegistrationNo: o.giRegistrationNo || 'GI 62100256',
          standards: ['GI สะเด็ดน้ำ', 'GAP รับรองแล้ว'],
        };
      })
    );
    if (target) {
      appendLog({
        title: `อนุมัติรับรอง GI [${target.code}]`,
        actor: `ดำเนินการโดย: เจ้าหน้าที่ ID: 136868000`,
        detail: `${target.name} ผ่านการตรวจพิกัดแปลงเรียบร้อย`,
        icon: 'verified',
        tone: 'primary',
      });
    }
  };

  const handleUpdatePriceRow = (updatedRow: DailyMarketPriceRow) => {
    setDailyPrices((prev) => prev.map((p) => (p.id === updatedRow.id ? updatedRow : p)));
    appendLog({
      title: `ปรับปรุงราคากลาง: ${updatedRow.cultivar}`,
      actor: `ดำเนินการโดย: เจ้าหน้าที่ ID: 136868000`,
      detail: `หน้าสวน ${updatedRow.giPriceMin}-${updatedRow.giPriceMax} บ. / หน้าล้ง ${updatedRow.stallPriceMin}-${updatedRow.stallPriceMax} บ.`,
      icon: 'price_check',
      tone: 'tertiary',
    });
  };

  if (currentRoute === 'admin-portal') {
    if (!adminEmail) {
      return (
        <AdminLoginView
          onLoginSuccess={handleAdminLoginSuccess}
          onNavigate={setCurrentRoute}
        />
      );
    }

    return (
      <AdminPortalView
        adminEmail={adminEmail}
        orchards={orchards}
        dailyPrices={dailyPrices}
        securityLogs={securityLogs}
        bookings={bookings}
        onNavigate={setCurrentRoute}
        onLogout={handleAdminLogout}
        onViewOrchard={handleSelectOrchard}
        onAddOrchard={handleAddOrchard}
        onUpdateOrchard={handleUpdateOrchard}
        onDeleteOrchard={handleDeleteOrchard}
        onApproveOrchard={handleApproveOrchard}
        onUpdatePriceRow={handleUpdatePriceRow}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <PublicHeader
        currentRoute={currentRoute}
        onNavigate={setCurrentRoute}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDistrict={selectedDistrict}
        onDistrictChange={setSelectedDistrict}
        onOpenShareModal={() => setShareModalOpen(true)}
      />

      <main className="w-full pt-20 bg-background flex-1">
        {currentRoute === 'orchard-detail' && activeOrchard && (
          <OrchardDetailView
            orchard={activeOrchard}
            dailyPrices={dailyPrices}
            onNavigate={setCurrentRoute}
            onFilterByDistrict={setSelectedDistrict}
            onSubmitBooking={handleSubmitBooking}
            onAddReview={handleAddReview}
            onOpenShareModal={() => setShareModalOpen(true)}
          />
        )}

        {currentRoute === 'map-directory' && (
          <MapDirectoryView
            orchards={orchards}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedDistrict={selectedDistrict}
            onDistrictChange={setSelectedDistrict}
            onSelectOrchard={handleSelectOrchard}
          />
        )}

        {currentRoute === 'directory-list' && (
          <DirectoryListView
            orchards={orchards}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedDistrict={selectedDistrict}
            onDistrictChange={setSelectedDistrict}
            onSelectOrchard={handleSelectOrchard}
          />
        )}

        {currentRoute === 'daily-market-prices' && (
          <DailyMarketPricesView
            prices={dailyPrices}
            orchards={orchards}
            onSelectOrchard={handleSelectOrchard}
          />
        )}
      </main>

      <PublicFooter
        onNavigate={setCurrentRoute}
        onOpenShareModal={() => setShareModalOpen(true)}
      />

      <ShareQrModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        currentRoute={currentRoute}
        activeOrchard={activeOrchard}
        orchards={orchards}
      />
    </div>
  );
}
