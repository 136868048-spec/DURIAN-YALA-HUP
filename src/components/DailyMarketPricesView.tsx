import React, { useState } from 'react';
import { DailyMarketPriceRow, OrchardLocation } from '../types/durian';

interface DailyMarketPricesViewProps {
  prices: DailyMarketPriceRow[];
  orchards: OrchardLocation[];
  onSelectOrchard: (orchardId: string) => void;
}

export const DailyMarketPricesView: React.FC<DailyMarketPricesViewProps> = ({
  prices,
  orchards,
  onSelectOrchard,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selectedRow = prices[selectedIdx] || prices[0];

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
            รายงานราคาอ้างอิง สำนักงานพาณิชย์ &amp; เกษตรจังหวัดยะลา
          </span>
          <h1 className="text-[28px] md:text-[32px] font-bold text-primary">
            ดูราคาทุเรียนสะเด็ดน้ำยะลาประจำวัน
          </h1>
          <p className="text-sm text-on-surface-variant">
            คลิกเลือกสายพันธุ์ด้านล่างเพื่อดูราคาจำหน่ายหน้าสวน GI และราคารับซื้อหน้าแผงส่งออก (ล้ง)
          </p>
        </div>
        <div className="text-xs font-semibold text-on-surface-variant bg-surface-container-low px-4 py-2.5 rounded-xl tabular-nums">
          อัปเดตราคาล่าสุดวันนี้: <strong className="text-primary">{selectedRow?.updatedAt || '07:45 น.'}</strong>
        </div>
      </div>

      {/* Single Interactive Cultivar Price Selector Card */}
      {selectedRow && (
        <div className="rounded-2xl bg-primary text-on-primary shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-primary-container/70 flex flex-wrap items-center gap-2">
            {prices.map((row, idx) => {
              const active = idx === selectedIdx;
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-secondary-container text-on-secondary-container shadow-sm'
                      : 'bg-on-primary/10 text-on-primary/90 hover:bg-on-primary/20'
                  }`}
                >
                  {row.cultivar.split('(')[0].trim()}
                </button>
              );
            })}
          </div>

          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-on-primary">{selectedRow.cultivar}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold">
                  ความต้องการ: {selectedRow.demandLevel}
                </span>
              </div>
              <p className="text-sm text-on-primary/80">{selectedRow.grade}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 shrink-0 tabular-nums">
              <div className="bg-on-primary/10 px-5 py-3.5 rounded-xl text-right">
                <span className="text-[11px] text-secondary-fixed font-semibold block">
                  ราคาหน้าสวน GI
                </span>
                <span className="text-2xl md:text-3xl font-bold text-secondary-container">
                  {selectedRow.giPriceMin} - {selectedRow.giPriceMax}
                </span>
                <span className="text-xs text-on-primary/85 ml-1">บ./กก.</span>
              </div>
              <div className="bg-on-primary/10 px-5 py-3.5 rounded-xl text-right">
                <span className="text-[11px] text-on-primary/75 font-semibold block">
                  ราคารับซื้อหน้าล้ง
                </span>
                <span className="text-2xl md:text-3xl font-bold text-on-primary">
                  {selectedRow.stallPriceMin} - {selectedRow.stallPriceMax}
                </span>
                <span className="text-xs text-on-primary/85 ml-1">บ./กก.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Price Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                <th className="py-3.5 px-6">สายพันธุ์ทุเรียน</th>
                <th className="py-3.5 px-6">เกรด / ลักษณะ</th>
                <th className="py-3.5 px-6 text-right">ราคาหน้าสวน GI (บ./กก.)</th>
                <th className="py-3.5 px-6 text-right">ราคารับซื้อหน้าล้ง (บ./กก.)</th>
                <th className="py-3.5 px-6 text-right">เปลี่ยนแปลง</th>
                <th className="py-3.5 px-6">ความต้องการตลาด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-sm tabular-nums">
              {prices.map((row) => (
                <tr key={row.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-4 px-6 font-bold text-primary">{row.cultivar}</td>
                  <td className="py-4 px-6 text-on-surface-variant">{row.grade}</td>
                  <td className="py-4 px-6 text-right font-bold text-secondary">
                    {row.giPriceMin} - {row.giPriceMax}
                  </td>
                  <td className="py-4 px-6 text-right font-semibold text-on-surface">
                    {row.stallPriceMin} - {row.stallPriceMax}
                  </td>
                  <td className="py-4 px-6 text-right font-semibold">
                    {row.changeDelta > 0 ? (
                      <span className="text-primary">+{row.changeDelta.toFixed(2)} บ.</span>
                    ) : row.changeDelta < 0 ? (
                      <span className="text-error">{row.changeDelta.toFixed(2)} บ.</span>
                    ) : (
                      <span className="text-outline">คงที่</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-xs font-semibold text-primary">
                      {row.demandLevel} · อัปเดต {row.updatedAt}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Featured Orchards Buying/Selling Today */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-primary">
          สวนและแผงรับซื้อที่เปิดให้บริการตามราคากลางวันนี้
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {orchards
            .filter((o) => o.status !== 'พักช่วงนอกฤดู')
            .slice(0, 3)
            .map((o) => (
              <div
                key={o.id}
                onClick={() => onSelectOrchard(o.id)}
                className="bg-surface-container-lowest p-4 rounded-xl shadow-sm hover:bg-surface-container-low transition-colors cursor-pointer flex items-center gap-3"
              >
                <img
                  src={o.thumbnailUrl}
                  alt={o.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-primary truncate">{o.name}</h3>
                  <p className="text-xs text-on-surface-variant">{o.district}</p>
                  <p className="text-xs font-semibold text-secondary mt-1 tabular-nums">
                    {o.primaryPriceSummary}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
