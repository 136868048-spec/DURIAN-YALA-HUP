import React, { useState } from 'react';
import { ASSETS } from '../data/mockData';
import { AppRoute } from '../types/durian';

interface AdminLoginViewProps {
  onLoginSuccess: (email: string) => void;
  onNavigate: (route: AppRoute) => void;
}

const VALID_ADMIN_ACCOUNTS: Record<string, string> = {
  'yru136868@gmail.com': 'YalaAdmin@2568',
  '136868048@yru.ac.th': 'YalaAdmin@2568',
  'admin@yaladurian.go.th': 'admin1234',
};

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onLoginSuccess,
  onNavigate,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setErrorMessage('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วนก่อนเข้าสู่ระบบ');
      return;
    }

    const expectedPassword = VALID_ADMIN_ACCOUNTS[normalizedEmail];
    if (!expectedPassword || expectedPassword !== password) {
      setErrorMessage('อีเมลหรือรหัสผ่านผู้ดูแลระบบไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      return;
    }

    onLoginSuccess(normalizedEmail);
  };

  const handleFillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(VALID_ADMIN_ACCOUNTS[demoEmail]);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      {/* Top Minimal Bar */}
      <header className="h-20 px-6 bg-surface/90 backdrop-blur-md shadow-[0_2px_12px_rgba(27,77,62,0.06)] flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate('orchard-detail')}
          className="flex items-center gap-3 text-left cursor-pointer"
        >
          <img
            src={ASSETS.logo}
            alt="Yala Durian Hub Logo"
            referrerPolicy="no-referrer"
            className="h-8 w-auto object-contain"
          />
          <div className="flex flex-col">
            <span className="text-[18px] font-semibold text-primary leading-tight">
              ยะลา ทุเรียนฮับ
            </span>
            <span className="text-[11px] font-semibold text-on-surface-variant">
              ระบบสารสนเทศเกษตรจังหวัดยะลา
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('orchard-detail')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container text-primary text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>กลับสู่หน้าสาธารณะ</span>
        </button>
      </header>

      {/* Main Centered Auth Split Card */}
      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-4xl bg-surface-container-lowest rounded-2xl shadow-md overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Visual / Institutional Info Panel */}
          <div className="lg:col-span-5 relative bg-primary text-on-primary p-8 flex flex-col justify-between overflow-hidden">
            <img
              src={ASSETS.orchardHillside}
              alt="เทือกเขาสันกาลาคีรี จ.ยะลา"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-25"
            />
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/15 text-secondary-fixed text-[11px] font-semibold backdrop-blur-sm">
                <span className="material-symbols-outlined text-sm">shield_person</span>
                <span>Admin Portal จ.ยะลา</span>
              </div>
              <h1 className="text-[26px] leading-[1.25] font-bold">
                ยืนยันตัวตนเจ้าหน้าที่ผู้ดูแลระบบ
              </h1>
              <p className="text-[13px] leading-[20px] text-on-primary/85">
                กรุณาลงชื่อเข้าใช้ด้วยบัญชีเจ้าหน้าที่สำนักงานเกษตรจังหวัดยะลา
                เพื่อจัดการพิกัดสวนทุเรียน แผงรับซื้อ (ล้ง) ราคากลางประจำวัน และการรับรองมาตรฐาน GI
              </p>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-on-primary/15 space-y-2 text-[12px]">
              <div className="flex items-center gap-2 text-secondary-fixed font-semibold">
                <span className="material-symbols-outlined text-base">verified_user</span>
                <span>เขตตรวจราชการที่ 8 จังหวัดยะลา</span>
              </div>
              <p className="text-on-primary/75 text-[11px] leading-[16px]">
                ทุกการเข้าถึงและการแก้ไขข้อมูลพิกัดแปลงจะถูกบันทึกไว้ในระบบตรวจสอบความปลอดภัย
              </p>
            </div>
          </div>

          {/* Right Login Form Panel */}
          <div className="lg:col-span-7 p-8 md:p-10 flex flex-col justify-center space-y-6">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                เข้าสู่ระบบจัดการหลังบ้าน
              </span>
              <h2 className="text-[22px] font-bold text-primary">
                ลงชื่อเข้าใช้ด้วยอีเมลและรหัสผ่าน
              </h2>
              <p className="text-xs text-on-surface-variant">
                สำหรับเจ้าหน้าที่เกษตรและผู้ดูแลระบบทะเบียนสวนทุเรียนสะเด็ดน้ำยะลา
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-start gap-2"
              >
                <span className="material-symbols-outlined text-base shrink-0 mt-0.5">
                  error
                </span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-semibold text-on-surface"
                >
                  อีเมลเจ้าหน้าที่ (Email) *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">
                    mail
                  </span>
                  <input
                    id="admin-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yru136868@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/25 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-semibold text-on-surface"
                >
                  รหัสผ่าน (Password) *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">
                    lock
                  </span>
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านผู้ดูแลระบบ"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/25 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    className="absolute right-3 top-2.5 text-outline hover:text-on-surface cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-primary"
                  />
                  <span>จดจำการเข้าสู่ระบบในอุปกรณ์นี้</span>
                </label>
                <span className="text-primary font-semibold">ติดต่อศูนย์ฯ โทร 073-212870</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">login</span>
                <span>เข้าสู่ระบบผู้ดูแลระบบ</span>
              </button>
            </form>

            {/* Helpful Authorized Credentials Box */}
            <div className="p-4 rounded-xl bg-surface-container-low space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-secondary">key</span>
                  บัญชีเจ้าหน้าที่ที่ได้รับอนุญาต
                </span>
                <span className="text-[11px] text-on-surface-variant">คลิกเพื่อกรอกอัตโนมัติ</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleFillDemoAccount('yru136868@gmail.com')}
                  className="p-2.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-primary">yru136868@gmail.com</div>
                  <div className="text-on-surface-variant font-mono">รหัสผ่าน: YalaAdmin@2568</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleFillDemoAccount('136868048@yru.ac.th')}
                  className="p-2.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-primary">136868048@yru.ac.th</div>
                  <div className="text-on-surface-variant font-mono">รหัสผ่าน: YalaAdmin@2568</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
