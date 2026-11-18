import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { AppRoute, OrchardLocation } from '../types/durian';
import { buildShareUrl } from '../utils/shareLinks';

interface ShareQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoute: AppRoute;
  activeOrchard?: OrchardLocation;
  orchards: OrchardLocation[];
}

type ShareTargetKey =
  | 'home'
  | 'map-directory'
  | 'directory-list'
  | 'daily-market-prices'
  | 'specific-orchard';

export const ShareQrModal: React.FC<ShareQrModalProps> = ({
  isOpen,
  onClose,
  currentRoute,
  activeOrchard,
  orchards,
}) => {
  const [targetType, setTargetType] = useState<ShareTargetKey>('home');
  const [selectedOrchardId, setSelectedOrchardId] = useState<string>(
    activeOrchard?.id || orchards[0]?.id || ''
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [posterDataUrl, setPosterDataUrl] = useState<string>('');
  const [previewMode, setPreviewMode] = useState<'poster' | 'qr'>('poster');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCopied(false);
    if (activeOrchard?.id) {
      setSelectedOrchardId(activeOrchard.id);
    }
    if (currentRoute === 'map-directory') {
      setTargetType('map-directory');
    } else if (currentRoute === 'directory-list') {
      setTargetType('directory-list');
    } else if (currentRoute === 'daily-market-prices') {
      setTargetType('daily-market-prices');
    } else if (currentRoute === 'orchard-detail' && activeOrchard) {
      setTargetType('specific-orchard');
    } else {
      setTargetType('home');
    }
  }, [isOpen, currentRoute, activeOrchard?.id]);

  const targetOrchard = useMemo(
    () => orchards.find((o) => o.id === selectedOrchardId) || activeOrchard || orchards[0],
    [orchards, selectedOrchardId, activeOrchard]
  );

  const shareInfo = useMemo(() => {
    if (targetType === 'map-directory') {
      return {
        title: 'แผนที่ 50 สวนทุเรียน & ล้งรับซื้อ จ.ยะลา',
        subtitle: 'เปิดดูพิกัด GPS จริงและนำทางไปยังสวนทั้ง 8 อำเภอ',
        url: buildShareUrl('map-directory'),
      };
    }
    if (targetType === 'directory-list') {
      return {
        title: 'รายชื่อ 50 สวนทุเรียน & แผงรับซื้อ จ.ยะลา',
        subtitle: 'ค้นหาตามอำเภอ ดูเบอร์โทร ราคา และกดนำทาง',
        url: buildShareUrl('directory-list'),
      };
    }
    if (targetType === 'daily-market-prices') {
      return {
        title: 'ราคาทุเรียนสะเด็ดน้ำยะลาประจำวัน',
        subtitle: 'เปรียบเทียบราคาหน้าสวน GI และราคารับซื้อหน้าล้งทุกสายพันธุ์',
        url: buildShareUrl('daily-market-prices'),
      };
    }
    if (targetType === 'specific-orchard' && targetOrchard) {
      return {
        title: targetOrchard.name,
        subtitle: `${targetOrchard.district} · ${targetOrchard.primaryPriceSummary} · นำทาง & จองคิว`,
        url: buildShareUrl('orchard-detail', targetOrchard.id),
      };
    }
    return {
      title: 'ยะลา ทุเรียนฮับ (Yala Durian Hub)',
      subtitle: 'ศูนย์รวมข้อมูล 50 สวนทุเรียนสะเด็ดน้ำ ราคาวันนี้ และแผนที่นำทาง จ.ยะลา',
      url: buildShareUrl('orchard-detail'),
    };
  }, [targetType, targetOrchard]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    QRCode.toDataURL(shareInfo.url, {
      width: 600,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#003629',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (cancelled) return;
        setQrDataUrl(url);

        const canvas = document.createElement('canvas');
        canvas.width = 720;
        canvas.height = 920;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#faf9f5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#003629';
        ctx.fillRect(0, 0, canvas.width, 148);

        ctx.fillStyle = '#fdbe50';
        ctx.font = 'bold 22px "Noto Sans Thai", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ยะลา ทุเรียนฮับ · YALA DURIAN HUB', canvas.width / 2, 56);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px "Noto Sans Thai", sans-serif';
        const titleText =
          shareInfo.title.length > 34 ? `${shareInfo.title.slice(0, 34)}...` : shareInfo.title;
        ctx.fillText(titleText, canvas.width / 2, 108);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(110, 195, 500, 500);
        ctx.strokeStyle = '#d8dfd9';
        ctx.lineWidth = 3;
        ctx.strokeRect(110, 195, 500, 500);

        const img = new Image();
        img.onload = () => {
          if (cancelled) return;
          ctx.drawImage(img, 140, 225, 440, 440);

          ctx.fillStyle = '#1b4d3e';
          ctx.font = 'bold 22px "Noto Sans Thai", sans-serif';
          ctx.fillText('สแกนคิวอาร์โค้ดเพื่อเข้าใช้งานเว็บไซต์', canvas.width / 2, 755);

          ctx.fillStyle = '#4b5563';
          ctx.font = '16px sans-serif';
          const displayUrl =
            shareInfo.url.length > 56 ? `${shareInfo.url.slice(0, 56)}...` : shareInfo.url;
          ctx.fillText(displayUrl, canvas.width / 2, 795);

          ctx.fillStyle = '#7e5700';
          ctx.font = 'bold 18px "Noto Sans Thai", sans-serif';
          ctx.fillText('เปิดใช้งานได้ทุกคน · ไม่ต้องเข้าสู่ระบบ', canvas.width / 2, 850);

          setPosterDataUrl(canvas.toDataURL('image/png'));
        };
        img.src = url;
      })
      .catch(() => {
        if (!cancelled) {
          setQrDataUrl('');
          setPosterDataUrl('');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, shareInfo.url, shareInfo.title]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareInfo.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = shareInfo.url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadImage = (mode: 'poster' | 'qr') => {
    const href = mode === 'poster' ? posterDataUrl || qrDataUrl : qrDataUrl;
    if (!href) return;
    const link = document.createElement('a');
    link.download =
      mode === 'poster' ? `yala-durian-poster-${targetType}.png` : `yala-durian-qr-${targetType}.png`;
    link.href = href;
    link.click();
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareInfo.title,
          text: shareInfo.subtitle,
          url: shareInfo.url,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await handleCopyLink();
    }
  };

  const displayedImage = previewMode === 'poster' ? posterDataUrl || qrDataUrl : qrDataUrl;

  return (
    <div
      className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-primary text-on-primary flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined">qr_code_2</span>
            </div>
            <div>
              <h3 className="text-base font-bold">ภาพคิวอาร์โค้ด (QR Code) &amp; ลิงก์เข้าเว็บ</h3>
              <p className="text-[11px] text-on-primary/80">
                คลิกขวา/กดค้างที่ภาพเพื่อบันทึก หรือกดปุ่มดาวน์โหลดเป็นไฟล์ PNG ได้ทันที
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-on-primary/15 text-on-primary cursor-pointer"
            aria-label="ปิดหน้าต่างแชร์"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Destination Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-on-surface-variant block">
              เลือกหน้าที่ต้องการสร้างภาพ QR Code
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'home', label: 'หน้าหลักเว็บไซต์' },
                { key: 'map-directory', label: 'แผนที่ 50 สวน' },
                { key: 'daily-market-prices', label: 'ราคาทุเรียนวันนี้' },
                { key: 'directory-list', label: 'รายชื่อทั้งหมด 50 แห่ง' },
                { key: 'specific-orchard', label: 'ลิงก์เฉพาะสวน/แผง' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTargetType(opt.key as ShareTargetKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    targetType === opt.key
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {targetType === 'specific-orchard' && (
              <select
                value={selectedOrchardId}
                onChange={(e) => setSelectedOrchardId(e.target.value)}
                className="w-full mt-2 px-3 py-2 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface outline-none cursor-pointer"
              >
                {orchards.map((o, idx) => (
                  <option key={o.id} value={o.id}>
                    {idx + 1}. {o.name} ({o.district})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* QR Code Showcase */}
          <div className="bg-surface-container-low rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5">
            <div className="bg-white p-2 rounded-2xl shadow-sm shrink-0">
              {displayedImage ? (
                <img
                  src={displayedImage}
                  alt={`QR Code สำหรับ ${shareInfo.title}`}
                  className={
                    previewMode === 'poster'
                      ? 'w-44 h-56 object-contain rounded-xl'
                      : 'w-44 h-44 object-contain'
                  }
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-xs text-outline">
                  กำลังสร้างภาพ QR...
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2.5 text-center sm:text-left">
              <div className="inline-flex rounded-lg bg-surface-container p-0.5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setPreviewMode('poster')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer ${
                    previewMode === 'poster'
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant'
                  }`}
                >
                  ภาพป้ายพร้อมข้อความ
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('qr')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer ${
                    previewMode === 'qr'
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant'
                  }`}
                >
                  เฉพาะคิวอาร์ล้วน
                </button>
              </div>
              <h4 className="text-base font-bold text-primary leading-snug">{shareInfo.title}</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {shareInfo.subtitle}
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadImage('poster')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary-container text-on-secondary-container text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>ดาวน์โหลดป้าย QR (PNG)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadImage('qr')}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-surface-container text-primary text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  <span>เฉพาะคิวอาร์ (PNG)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Copyable Direct Link Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant block">
              ลิงก์เข้าใช้งานเว็บไซต์
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareInfo.url}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-container-low text-xs font-mono text-primary outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                  copied
                    ? 'bg-primary-fixed text-on-primary-fixed'
                    : 'bg-primary text-on-primary hover:bg-primary-container'
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}</span>
              </button>
            </div>
          </div>

          {/* Share Social / Mobile Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/20">
            <span className="text-[11px] text-on-surface-variant">
              ใช้สำหรับสแกนหน้าร้าน ป้ายสวน หรือส่งเข้ากลุ่ม LINE / Facebook ได้เลย
            </span>
            <div className="flex items-center gap-2">
              <a
                href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
                  shareInfo.url
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-[#06C755] text-white text-xs font-bold inline-flex items-center gap-1.5 hover:opacity-90"
              >
                <span className="material-symbols-outlined text-sm">chat</span>
                <span>แชร์ผ่าน LINE</span>
              </a>
              <button
                type="button"
                onClick={handleNativeShare}
                className="px-3.5 py-2 rounded-xl bg-surface-container text-primary text-xs font-semibold hover:bg-surface-container-high inline-flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">share</span>
                <span>แชร์</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
