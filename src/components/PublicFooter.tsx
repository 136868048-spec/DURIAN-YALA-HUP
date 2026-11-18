import React from 'react';
import { ASSETS } from '../data/mockData';
import { AppRoute } from '../types/durian';

interface PublicFooterProps {
  onNavigate: (route: AppRoute) => void;
  onOpenShareModal: () => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  onNavigate,
  onOpenShareModal,
}) => {
  return (
    <footer className="w-full bg-surface-container-lowest text-on-surface mt-10">
      <div className="w-full px-6 py-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <img
                alt="Yala Durian Hub Logo"
                className="h-8 w-auto object-contain"
                src={ASSETS.logo}
                referrerPolicy="no-referrer"
              />
              <span className="text-[18px] leading-[26px] font-semibold text-primary">
                ยะลา ทุเรียนฮับ
              </span>
            </div>
            <p className="text-[12px] leading-[18px] text-on-surface-variant">
              ศูนย์กลางฐานข้อมูลสวนทุเรียน แผงรับซื้อ และระบบตรวจสอบย้อนกลับมาตรฐานสิ่งบ่งชี้ทางภูมิศาสตร์
              (GI) จังหวัดยะลา
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[14px] leading-[20px] font-semibold text-primary mb-1">
              สิ่งบ่งชี้ทางภูมิศาสตร์ (GI)
            </span>
            <div className="flex items-center gap-1 text-on-tertiary-fixed-variant">
              <span className="material-symbols-outlined text-base text-primary-container">
                verified
              </span>
              <span className="text-[11px] font-semibold">
                ทุเรียนสะเด็ดน้ำยะลา (GI Certified)
              </span>
            </div>
            <p className="text-[12px] leading-[18px] text-on-surface-variant">
              เนื้อแห้ง หวานมัน กลิ่นไม่ฉุน ปลูกบนเทือกเขาสูงระบายน้ำธรรมชาติในหุบเขายะลา
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[14px] leading-[20px] font-semibold text-primary mb-1">
              สำนักงานเกษตรจังหวัดยะลา
            </span>
            <p className="text-[12px] leading-[18px] text-on-surface-variant">
              ถนนสุขยางค์ ต.สะเตง อ.เมือง จ.ยะลา 95000
            </p>
            <p className="text-[12px] leading-[18px] text-on-surface-variant tabular-nums">
              โทรศัพท์: 073-212870 | โทรสาร: 073-212871
            </p>
            <p className="text-[12px] leading-[18px] text-on-surface-variant tabular-nums">
              สายด่วนเตือนภัยโรคและแมลง: 1170
            </p>
          </div>

          <div className="flex flex-col gap-1.5 items-start">
            <span className="text-[14px] leading-[20px] font-semibold text-primary mb-1">
              บริการด่วน &amp; คิวอาร์เข้าเว็บ
            </span>
            <div className="flex items-center gap-3 bg-surface-container-low p-2.5 rounded-xl w-full">
              <img
                src="/yala-durian-qr.png"
                alt="QR Code เข้าใช้งาน ยะลา ทุเรียนฮับ"
                className="w-16 h-16 rounded-lg bg-white p-1 object-contain shrink-0"
              />
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-[11px] font-bold text-primary">
                  สแกนเพื่อเข้าใช้งานเว็บ
                </span>
                <button
                  type="button"
                  onClick={onOpenShareModal}
                  className="text-[11px] text-secondary font-bold hover:underline text-left cursor-pointer"
                >
                  ขยาย QR / คัดลอกลิงก์ →
                </button>
                <a
                  href="/yala-durian-qr.png"
                  download="yala-durian-hub-qr.png"
                  className="text-[11px] text-on-surface-variant hover:text-primary font-semibold"
                >
                  ดาวน์โหลดรูป QR (PNG)
                </a>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('daily-market-prices')}
              className="text-[12px] leading-[18px] text-on-surface-variant hover:text-primary transition-colors text-left cursor-pointer mt-1"
            >
              รายงานผลผลิตรายสัปดาห์
            </button>
            <button
              type="button"
              onClick={() => onNavigate('directory-list')}
              className="text-[12px] leading-[18px] text-on-surface-variant hover:text-primary transition-colors text-left cursor-pointer"
            >
              ทะเบียนแปลงปลูก GAP / GI
            </button>
            <button
              type="button"
              onClick={() => onNavigate('admin-portal')}
              className="text-[12px] leading-[18px] text-on-surface-variant hover:text-primary transition-colors text-left cursor-pointer"
            >
              เข้าสู่ระบบเจ้าหน้าที่ &amp; รับรองแปลง
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant/20 flex flex-col md:flex-row items-center justify-between text-on-surface-variant text-[12px] gap-2">
          <p>
            © 2025 ยะลา ทุเรียนฮับ (Yala Durian Hub). สนับสนุนโดย สำนักงานเกษตรจังหวัดยะลา.
            สงวนลิขสิทธิ์ทุกประการ.
          </p>
          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <span>ระบบตรวจสอบย้อนกลับแปลง GI</span>
            <span>ฐานข้อมูลผลผลิตภาคใต้ตอนล่าง</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
