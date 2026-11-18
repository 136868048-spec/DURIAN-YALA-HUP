import React, { useMemo, useState } from 'react';
import { YALA_DISTRICTS } from '../data/mockData';
import { OrchardLocation } from '../types/durian';
import { RealYalaMap } from './RealYalaMap';

interface MapDirectoryViewProps {
  orchards: OrchardLocation[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedDistrict: string;
  onDistrictChange: (value: string) => void;
  onSelectOrchard: (orchardId: string) => void;
}

export const MapDirectoryView: React.FC<MapDirectoryViewProps> = ({
  orchards,
  searchQuery,
  onSearchChange,
  selectedDistrict,
  onDistrictChange,
  onSelectOrchard,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'orchard' | 'stall'>('all');
  const [giOnly, setGiOnly] = useState(false);
  const [activePinId, setActivePinId] = useState<string>(orchards[0]?.id || '');

  const filteredOrchards = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orchards.filter((item) => {
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q) ||
        item.subDistrict.toLowerCase().includes(q) ||
        item.ownerName.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.varieties.some((v) => v.name.toLowerCase().includes(q));
      const matchDistrict = !selectedDistrict || item.district === selectedDistrict;
      const matchCategory =
        categoryFilter === 'all' ||
        (categoryFilter === 'orchard' &&
          (item.category === 'orchard_tour' || item.category === 'orchard_farm')) ||
        (categoryFilter === 'stall' &&
          (item.category === 'stall_export' || item.category === 'stall_local'));
      const matchGi = !giOnly || item.giCertified;
      return matchQuery && matchDistrict && matchCategory && matchGi;
    });
  }, [orchards, searchQuery, selectedDistrict, categoryFilter, giOnly]);

  const activePin =
    filteredOrchards.find((o) => o.id === activePinId) || filteredOrchards[0] || null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header & Filter Bar */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              แผนที่พิกัด GPS จริง · {orchards.length} สวนทุเรียน &amp; แผงรับซื้อ
            </span>
            <h1 className="text-[28px] md:text-[32px] leading-[1.2] font-bold text-primary">
              แผนที่ &amp; นำทางสู่แหล่งทุเรียนสะเด็ดน้ำ จ.ยะลา
            </h1>
            <p className="text-[14px] text-on-surface-variant mt-1">
              คลิกหมุดบนแผนที่หรือรายชื่อด้านขวาเพื่อดูเส้นทางรถยนต์จริงและกดนำทางผ่าน GPS ได้ทันทีใน 8 อำเภอ
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                categoryFilter === 'all'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              ทั้งหมด ({orchards.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('orchard')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                categoryFilter === 'orchard'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              สวนทุเรียน
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('stall')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                categoryFilter === 'stall'
                  ? 'bg-secondary text-on-secondary'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              แผงรับซื้อ (ล้ง)
            </button>
            <button
              type="button"
              onClick={() => setGiOnly((prev) => !prev)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                giOnly
                  ? 'bg-primary-fixed text-on-primary-fixed'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-sm">verified</span>
              <span>เฉพาะสะเด็ดน้ำ GI</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-7 relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาชื่อสวน, ล้ง, ตำบล, อำเภอ, พันธุ์ทุเรียน (หมอนทอง, ก้านยาว, มูซังคิง)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-low text-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="md:col-span-5 flex items-center gap-2">
            <select
              value={selectedDistrict}
              onChange={(e) => onDistrictChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low text-sm font-semibold text-on-surface outline-none cursor-pointer"
            >
              <option value="">ทุกอำเภอในจังหวัดยะลา (8 อำเภอ)</option>
              {YALA_DISTRICTS.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Split Real Interactive Map & Location List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-3 shadow-sm">
          <RealYalaMap
            orchards={filteredOrchards}
            selectedOrchardId={activePin?.id}
            onSelectOrchard={(id) => setActivePinId(id)}
            onOpenDetail={onSelectOrchard}
            heightClass="h-[520px]"
          />
        </div>

        {/* Location List Cards */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant px-1">
            <span>พบทั้งหมด {filteredOrchards.length} แห่งในเขตพื้นที่</span>
            <span>คลิกเพื่อปักหมุดและนำทาง</span>
          </div>

          {filteredOrchards.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center space-y-2 shadow-sm">
              <span className="material-symbols-outlined text-4xl text-outline">location_off</span>
              <p className="text-sm font-semibold text-on-surface">
                ไม่พบสวนหรือแผงรับซื้อที่ตรงกับเงื่อนไข
              </p>
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  onDistrictChange('');
                  setCategoryFilter('all');
                  setGiOnly(false);
                }}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold cursor-pointer"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredOrchards.map((item, idx) => {
                const isSelected = activePin?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActivePinId(item.id)}
                    className={`p-3.5 rounded-xl bg-surface-container-lowest shadow-sm transition-all cursor-pointer flex items-center gap-3.5 ${
                      isSelected ? 'ring-2 ring-primary' : 'hover:bg-surface-container-low'
                    }`}
                  >
                    <img
                      src={item.thumbnailUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-surface-container"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-primary truncate">
                          {idx + 1}. {item.name}
                        </h3>
                        <span className="text-xs font-bold text-secondary shrink-0 tabular-nums">
                          ★ {item.rating.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5 truncate">
                        {item.subDistrict} {item.district} · {item.categoryLabel}
                      </p>
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <span className="text-xs font-semibold text-primary tabular-nums truncate">
                          {item.primaryPriceSummary}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary-container text-on-secondary-container text-[11px] font-bold hover:opacity-90"
                          >
                            <span className="material-symbols-outlined text-xs">near_me</span>
                            <span>นำทาง</span>
                          </a>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectOrchard(item.id);
                            }}
                            className="text-xs font-bold text-primary hover:underline cursor-pointer"
                          >
                            รายละเอียด →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
