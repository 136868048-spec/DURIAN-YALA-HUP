import React, { useState } from 'react';
import { ASSETS, YALA_DISTRICTS } from '../data/mockData';
import { AppRoute } from '../types/durian';

interface PublicHeaderProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedDistrict: string;
  onDistrictChange: (district: string) => void;
  onOpenShareModal: () => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  currentRoute,
  onNavigate,
  searchQuery,
  onSearchChange,
  selectedDistrict,
  onDistrictChange,
  onOpenShareModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { route: AppRoute; label: string; icon: string }[] = [
    { route: 'map-directory', label: 'แผนที่ & ค้นหา', icon: 'map' },
    { route: 'directory-list', label: 'รายชื่อสวน & แผง', icon: 'park' },
    { route: 'daily-market-prices', label: 'ดูราคาทุเรียน', icon: 'payments' },
    { route: 'admin-portal', label: 'ผู้ดูแลระบบ (Admin)', icon: 'admin_panel_settings' },
  ];

  const isDirectoryActive =
    currentRoute === 'directory-list' || currentRoute === 'orchard-detail';

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentRoute === 'orchard-detail') {
      onNavigate('directory-list');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md shadow-[0_2px_12px_rgba(27,77,62,0.06)]">
      <div className="h-20 w-full px-6 flex items-center justify-between gap-4">
        {/* Brand */}
        <button
          type="button"
          onClick={() => onNavigate('orchard-detail')}
          className="flex items-center gap-4 shrink-0 text-left focus-visible:outline-2 focus-visible:outline-primary rounded-lg"
        >
          <img
            alt="Yala Durian Hub Logo"
            className="h-8 w-auto object-contain"
            src={ASSETS.logo}
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <span className="text-[18px] leading-[22px] font-semibold text-primary tracking-tight whitespace-nowrap">
              ยะลา ทุเรียนฮับ
            </span>
            <span className="text-[11px] leading-[14px] font-semibold text-on-surface-variant whitespace-nowrap">
              แผนที่สวน &amp; แผงทุเรียน จ.ยะลา
            </span>
          </div>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const active =
              item.route === 'directory-list'
                ? isDirectoryActive
                : currentRoute === item.route;

            return (
              <button
                key={item.route}
                type="button"
                onClick={() => onNavigate(item.route)}
                aria-current={active ? 'page' : undefined}
                className={`px-3 py-2 text-[13px] leading-[20px] font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? 'bg-primary-container text-on-primary'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center bg-surface-container-low rounded-lg px-2 py-1.5 focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary/20 transition-colors">
            <span className="material-symbols-outlined text-outline text-lg mr-1">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="ค้นหาพันธุ์, พิกัด, แผงรับซื้อ..."
              className="bg-transparent text-on-surface text-[12px] leading-[18px] outline-none w-36 lg:w-44 placeholder:text-outline"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-outline hover:text-on-surface ml-1"
                aria-label="ล้างคำค้นหา"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center bg-surface-container-low rounded-lg px-2 py-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-base mr-1 text-outline">
              location_on
            </span>
            <select
              value={selectedDistrict}
              onChange={(e) => {
                onDistrictChange(e.target.value);
                if (currentRoute === 'orchard-detail' && e.target.value) {
                  onNavigate('directory-list');
                }
              }}
              aria-label="เลือกอำเภอในจังหวัดยะลา"
              className="bg-transparent font-semibold text-[11px] text-on-surface outline-none cursor-pointer pr-1"
            >
              <option value="">ทุกอำเภอ จ.ยะลา</option>
              {YALA_DISTRICTS.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('daily-market-prices')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-[12px] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              currentRoute === 'daily-market-prices'
                ? 'bg-primary text-on-primary'
                : 'bg-secondary-container text-on-secondary-container hover:opacity-90'
            }`}
          >
            <span className="material-symbols-outlined text-base">sell</span>
            <span>ดูราคา</span>
          </button>

          <button
            type="button"
            onClick={onOpenShareModal}
            title="แชร์ลิงก์และสร้าง QR Code เว็บไซต์"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors font-semibold text-[12px] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">qr_code_2</span>
            <span className="hidden sm:inline">ลิงก์ &amp; QR</span>
          </button>

          <a
            href="tel:073212870"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-semibold text-[11px] whitespace-nowrap shrink-0"
          >
            <span className="material-symbols-outlined text-base text-secondary">
              support_agent
            </span>
            <span className="hidden xl:inline">สายด่วนเกษตร</span>
          </a>

          <button
            type="button"
            onClick={() => onNavigate('admin-portal')}
            title="เข้าสู่ระบบจัดการหลังบ้าน"
            className="flex items-center gap-1.5 pl-1 rounded-full hover:opacity-90 transition-opacity cursor-pointer"
          >
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover bg-surface-container"
              src={ASSETS.avatarPublicHeader}
              referrerPolicy="no-referrer"
            />
            <div className="hidden 2xl:flex flex-col text-left">
              <span className="text-[11px] text-on-surface font-bold leading-tight">
                ผู้ดูแลระบบ
              </span>
              <span className="text-[10px] text-on-surface-variant leading-none">
                yru136868@gmail.com
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container"
            aria-label="เปิดเมนูนำทาง"
          >
            <span className="material-symbols-outlined">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Nav Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-surface-container-lowest border-t border-outline-variant/20 px-6 py-4 space-y-2 shadow-lg">
          <div className="flex md:hidden items-center bg-surface-container-low rounded-lg px-3 py-2 mb-2">
            <span className="material-symbols-outlined text-outline text-lg mr-2">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาพันธุ์, พิกัด, แผงรับซื้อ..."
              className="bg-transparent text-on-surface text-sm outline-none w-full"
            />
          </div>
          {navItems.map((item) => {
            const active =
              item.route === 'directory-list'
                ? isDirectoryActive
                : currentRoute === item.route;
            return (
              <button
                key={item.route}
                type="button"
                onClick={() => {
                  onNavigate(item.route);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-primary-container text-on-primary'
                    : 'text-on-surface hover:bg-surface-container'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              onOpenShareModal();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary-fixed text-on-primary-fixed flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">qr_code_2</span>
            <span>แชร์ลิงก์ &amp; QR Code เว็บไซต์</span>
          </button>
        </div>
      )}
    </header>
  );
};
