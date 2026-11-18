import React, { useEffect, useMemo, useState } from 'react';
import { YALA_DISTRICTS } from '../data/mockData';
import { OrchardLocation } from '../types/durian';

interface DirectoryListViewProps {
  orchards: OrchardLocation[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedDistrict: string;
  onDistrictChange: (value: string) => void;
  onSelectOrchard: (orchardId: string) => void;
}

const PAGE_SIZE = 12;

export const DirectoryListView: React.FC<DirectoryListViewProps> = ({
  orchards,
  searchQuery,
  onSearchChange,
  selectedDistrict,
  onDistrictChange,
  onSelectOrchard,
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | 'orchard' | 'stall' | 'gi'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orchards.filter((o) => {
      const matchQuery =
        !q ||
        o.name.toLowerCase().includes(q) ||
        o.ownerName.toLowerCase().includes(q) ||
        o.district.toLowerCase().includes(q) ||
        o.subDistrict.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q);
      const matchDistrict = !selectedDistrict || o.district === selectedDistrict;
      const matchType =
        typeFilter === 'all' ||
        (typeFilter === 'orchard' &&
          (o.category === 'orchard_tour' || o.category === 'orchard_farm')) ||
        (typeFilter === 'stall' &&
          (o.category === 'stall_export' || o.category === 'stall_local')) ||
        (typeFilter === 'gi' && o.giCertified);
      return matchQuery && matchDistrict && matchType;
    });
  }, [orchards, searchQuery, selectedDistrict, typeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDistrict, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              ทำเนียบเกษตรกรและจุดรับซื้อจังหวัดยะลา ({orchards.length} รายชื่อจริง)
            </span>
            <h1 className="text-[28px] md:text-[32px] font-bold text-primary">
              รายชื่อสวนทุเรียน &amp; แผงรับซื้อ (ล้ง)
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              ครบทั้ง 8 อำเภอในจังหวัดยะลา พร้อมพิกัด GPS จริงและปุ่มนำทางไปยังสถานที่ปลายทาง
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: `ทั้งหมด (${orchards.length})` },
              { id: 'gi', label: 'รับรอง GI สะเด็ดน้ำ' },
              { id: 'orchard', label: 'สวนเกษตร & ท่องเที่ยว' },
              { id: 'stall', label: 'แผงรับซื้อ (ล้ง)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id as typeof typeFilter)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  typeFilter === tab.id
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาชื่อสวน ชื่อเจ้าของ รหัสแปลง ตำบล หรืออำเภอ..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-low text-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="md:col-span-4">
            <select
              value={selectedDistrict}
              onChange={(e) => onDistrictChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low text-sm font-semibold text-on-surface outline-none cursor-pointer"
            >
              <option value="">ทุกอำเภอ จ.ยะลา (8 อำเภอ)</option>
              {YALA_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-on-surface-variant pt-1">
          <span className="tabular-nums">
            พบทั้งหมด <strong className="text-primary">{filtered.length}</strong> จาก{' '}
            {orchards.length} รายชื่อ (หน้า {safePage} / {totalPages})
          </span>
          {(searchQuery || selectedDistrict || typeFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                onDistrictChange('');
                setTypeFilter('all');
              }}
              className="text-primary hover:underline cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      {paginatedItems.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-10 text-center space-y-2 shadow-sm">
          <span className="material-symbols-outlined text-4xl text-outline">search_off</span>
          <p className="text-sm font-semibold text-on-surface">ไม่พบรายชื่อที่ตรงกับเงื่อนไขการค้นหา</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedItems.map((item, idx) => {
            const globalNumber = (safePage - 1) * PAGE_SIZE + idx + 1;
            return (
              <article
                key={item.id}
                className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div
                    onClick={() => onSelectOrchard(item.id)}
                    className="relative h-48 bg-surface-container overflow-hidden cursor-pointer group"
                  >
                    <img
                      src={item.thumbnailUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-surface/90 text-primary text-[11px] font-bold tabular-nums shadow-sm">
                      #{globalNumber} · {item.code}
                    </span>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <span className="text-xs font-semibold truncate">
                        {item.subDistrict} {item.district} · {item.elevationMeters} ม.
                      </span>
                      <span className="text-xs font-bold text-secondary-fixed tabular-nums shrink-0">
                        ★ {item.rating.toFixed(1)} ({item.reviewCount})
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <div className="text-xs text-on-surface-variant flex items-center gap-1.5 flex-wrap">
                      <span>{item.categoryLabel}</span>
                      <span>·</span>
                      <span className="font-semibold text-primary">
                        {item.giCertified ? 'GI สะเด็ดน้ำยะลา' : item.standards[0]}
                      </span>
                    </div>
                    <h2
                      onClick={() => onSelectOrchard(item.id)}
                      className="text-lg font-bold text-primary hover:underline cursor-pointer leading-snug"
                    >
                      {item.name}
                    </h2>
                    <p className="text-xs text-on-surface-variant font-mono tabular-nums">
                      พิกัด GPS: {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                    </p>
                    <p className="text-xs leading-[18px] text-on-surface-variant line-clamp-2">
                      {item.story}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-outline-variant/20 space-y-3">
                  <div className="flex items-center justify-between gap-2 tabular-nums">
                    <div>
                      <span className="text-[11px] text-on-surface-variant block">ราคาเริ่มต้น</span>
                      <span className="text-base font-bold text-secondary">
                        {item.primaryPriceSummary}
                      </span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant">{item.phone}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl bg-secondary-container text-on-secondary-container text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-sm">near_me</span>
                      <span>นำทางจริง</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => onSelectOrchard(item.id)}
                      className="py-2 px-3 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors cursor-pointer whitespace-nowrap"
                    >
                      ดูแผนที่ &amp; จองคิว
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 tabular-nums">
          <span className="text-xs font-semibold text-on-surface-variant">
            แสดงรายการที่ {(safePage - 1) * PAGE_SIZE + 1} -{' '}
            {Math.min(safePage * PAGE_SIZE, filtered.length)} จากทั้งหมด {filtered.length} รายชื่อ
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-surface-container text-xs font-semibold disabled:opacity-40 cursor-pointer"
            >
              ก่อนหน้า
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-lg text-xs font-bold cursor-pointer ${
                  safePage === pageNum
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg bg-surface-container text-xs font-semibold disabled:opacity-40 cursor-pointer"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
