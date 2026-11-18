import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { OrchardLocation } from '../types/durian';

interface RealYalaMapProps {
  orchards: OrchardLocation[];
  selectedOrchardId?: string;
  onSelectOrchard?: (orchardId: string) => void;
  onOpenDetail?: (orchardId: string) => void;
  heightClass?: string;
  singleFocusMode?: boolean;
}

interface RouteStats {
  distanceKm: number;
  durationMin: number;
  fromLabel: string;
  isRoadRoute: boolean;
}

const YALA_CENTER_ORIGIN = {
  lat: 6.5401,
  lng: 101.2804,
  label: 'ศาลากลางจังหวัดยะลา (อ.เมือง)',
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const RealYalaMap: React.FC<RealYalaMapProps> = ({
  orchards,
  selectedOrchardId,
  onSelectOrchard,
  onOpenDetail,
  heightClass = 'h-[460px]',
  singleFocusMode = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const streetTileRef = useRef<L.TileLayer | null>(null);
  const satelliteTileRef = useRef<L.TileLayer | null>(null);

  const [layerMode, setLayerMode] = useState<'street' | 'satellite'>('street');
  const [origin, setOrigin] = useState<{ lat: number; lng: number; label: string }>(
    YALA_CENTER_ORIGIN
  );
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  const activeOrchard =
    orchards.find((o) => o.id === selectedOrchardId) || orchards[0] || null;

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter: [number, number] = activeOrchard
      ? [activeOrchard.lat, activeOrchard.lng]
      : [6.22, 101.18];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: singleFocusMode ? 13 : 10,
      zoomControl: false,
    });

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    });

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Esri World Imagery',
        maxZoom: 18,
      }
    );

    streetLayer.addTo(map);
    streetTileRef.current = streetLayer;
    satelliteTileRef.current = satelliteLayer;

    markersLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      routeLayerRef.current = null;
    };
  }, []);

  // Switch between street and satellite tiles
  useEffect(() => {
    const map = mapInstanceRef.current;
    const street = streetTileRef.current;
    const satellite = satelliteTileRef.current;
    if (!map || !street || !satellite) return;

    if (layerMode === 'satellite') {
      if (map.hasLayer(street)) map.removeLayer(street);
      if (!map.hasLayer(satellite)) satellite.addTo(map);
    } else {
      if (map.hasLayer(satellite)) map.removeLayer(satellite);
      if (!map.hasLayer(street)) street.addTo(map);
    }
  }, [layerMode]);

  // Render markers for all orchards
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    orchards.forEach((item) => {
      const isSelected = activeOrchard?.id === item.id;
      const isStall = item.category === 'stall_export' || item.category === 'stall_local';

      const bgColor = isStall
        ? '#7e5700'
        : item.giCertified
        ? '#003629'
        : '#1b4d3e';
      const ringColor = isSelected ? '#fdbe50' : '#ffffff';
      const size = isSelected ? 34 : 26;

      const icon = L.divIcon({
        className: 'custom-yala-pin',
        html: `
          <div style="
            width:${size}px;
            height:${size}px;
            border-radius:9999px;
            background:${bgColor};
            border:${isSelected ? '3px' : '2px'} solid ${ringColor};
            box-shadow:0 4px 10px rgba(0,0,0,0.28);
            display:flex;
            align-items:center;
            justify-content:center;
            color:#ffffff;
            font-size:${isSelected ? '15px' : '12px'};
            font-weight:700;
            cursor:pointer;
          ">
            ${isStall ? 'ล' : item.giCertified ? 'GI' : 'ส'}
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([item.lat, item.lng], { icon });

      marker.bindTooltip(
        `<div style="font-family:sans-serif;font-size:12px;font-weight:600;">${item.name}<br/><span style="color:#555;font-weight:400;">${item.district} · ${item.primaryPriceSummary}</span></div>`,
        { direction: 'top', offset: [0, -12] }
      );

      marker.on('click', () => {
        if (onSelectOrchard) {
          onSelectOrchard(item.id);
        }
      });

      marker.addTo(layer);
    });
  }, [orchards, activeOrchard?.id, onSelectOrchard]);

  // Pan/fly smoothly when selectedOrchardId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeOrchard) return;
    map.flyTo([activeOrchard.lat, activeOrchard.lng], singleFocusMode ? 14 : 12, {
      duration: 0.65,
    });
    setRouteStats(null);
    routeLayerRef.current?.clearLayers();
  }, [activeOrchard?.id, singleFocusMode]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoMessage('เบราว์เซอร์ไม่รองรับ GPS ใช้พิกัดศาลากลาง จ.ยะลา แทน');
      return;
    }
    setGeoMessage('กำลังค้นหาตำแหน่ง GPS ของคุณ...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'ตำแหน่งปัจจุบันของคุณ (GPS)',
        };
        setOrigin(coords);
        setGeoMessage('ระบุตำแหน่งปัจจุบันสำเร็จ');
        if (activeOrchard) {
          void handleDrawRoute(coords, activeOrchard);
        }
      },
      () => {
        setOrigin(YALA_CENTER_ORIGIN);
        setGeoMessage('ไม่สามารถเข้าถึง GPS ใช้จุดเริ่มต้นศาลากลาง จ.ยะลา');
        if (activeOrchard) {
          void handleDrawRoute(YALA_CENTER_ORIGIN, activeOrchard);
        }
      },
      { timeout: 6000 }
    );
  };

  const handleDrawRoute = async (
    customOrigin = origin,
    destination: OrchardLocation | null = activeOrchard
  ) => {
    const map = mapInstanceRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !routeLayer || !destination) return;

    setRoutingLoading(true);
    routeLayer.clearLayers();

    // Origin marker
    const originIcon = L.divIcon({
      className: 'custom-origin-pin',
      html: `<div style="width:16px;height:16px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    L.marker([customOrigin.lat, customOrigin.lng], { icon: originIcon })
      .bindTooltip(customOrigin.label)
      .addTo(routeLayer);

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${customOrigin.lng},${customOrigin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const route = data?.routes?.[0];
        if (route?.geometry?.coordinates) {
          const latLngs: [number, number][] = route.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          );
          const poly = L.polyline(latLngs, {
            color: '#003629',
            weight: 5,
            opacity: 0.9,
          }).addTo(routeLayer);
          map.fitBounds(poly.getBounds(), { padding: [48, 48] });
          setRouteStats({
            distanceKm: Number((route.distance / 1000).toFixed(1)),
            durationMin: Math.max(1, Math.round(route.duration / 60)),
            fromLabel: customOrigin.label,
            isRoadRoute: true,
          });
          setRoutingLoading(false);
          return;
        }
      }
    } catch {
      // Fallback to direct geographic line if OSRM is unreachable
    }

    const fallbackLine = L.polyline(
      [
        [customOrigin.lat, customOrigin.lng],
        [destination.lat, destination.lng],
      ],
      {
        color: '#7e5700',
        weight: 4,
        dashArray: '8 8',
      }
    ).addTo(routeLayer);
    map.fitBounds(fallbackLine.getBounds(), { padding: [48, 48] });
    const dist = haversineKm(
      customOrigin.lat,
      customOrigin.lng,
      destination.lat,
      destination.lng
    );
    setRouteStats({
      distanceKm: Number((dist * 1.25).toFixed(1)),
      durationMin: Math.max(2, Math.round((dist * 1.25 * 60) / 45)),
      fromLabel: customOrigin.label,
      isRoadRoute: false,
    });
    setRoutingLoading(false);
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-inner bg-surface-container">
      <div ref={mapContainerRef} className={`w-full ${heightClass} z-0`} />

      {/* Top-Left Legend / Counter */}
      <div className="absolute top-3 left-3 z-[500] flex flex-wrap items-center gap-1.5 pointer-events-none">
        <div className="bg-surface/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow text-[11px] font-semibold text-on-surface flex items-center gap-2 pointer-events-auto">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> สวน GI/ทั่วไป
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block" /> แผงรับซื้อ (ล้ง)
          </span>
          <span className="text-primary font-bold tabular-nums">({orchards.length} จุด)</span>
        </div>
        {geoMessage && (
          <div className="bg-primary text-on-primary px-2.5 py-1 rounded-lg shadow text-[11px] font-semibold pointer-events-auto">
            {geoMessage}
          </div>
        )}
      </div>

      {/* Top-Right Map Controls */}
      <div className="absolute top-3 right-3 z-[500] flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="w-9 h-9 rounded-lg bg-surface text-on-surface shadow flex items-center justify-center hover:bg-surface-container transition-colors cursor-pointer"
          title="ขยายแผนที่"
        >
          <span className="material-symbols-outlined text-base">zoom_in</span>
        </button>
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="w-9 h-9 rounded-lg bg-surface text-on-surface shadow flex items-center justify-center hover:bg-surface-container transition-colors cursor-pointer"
          title="ย่อแผนที่"
        >
          <span className="material-symbols-outlined text-base">zoom_out</span>
        </button>
        <button
          type="button"
          onClick={() =>
            setLayerMode((prev) => (prev === 'street' ? 'satellite' : 'street'))
          }
          className="w-9 h-9 rounded-lg bg-surface text-on-surface shadow flex items-center justify-center hover:bg-surface-container transition-colors cursor-pointer"
          title={layerMode === 'street' ? 'สลับเป็นแผนที่ดาวเทียม' : 'สลับเป็นแผนที่ถนน'}
        >
          <span className="material-symbols-outlined text-base">
            {layerMode === 'street' ? 'satellite_alt' : 'map'}
          </span>
        </button>
        <button
          type="button"
          onClick={handleUseMyLocation}
          className="w-9 h-9 rounded-lg bg-surface text-primary shadow flex items-center justify-center hover:bg-surface-container transition-colors cursor-pointer"
          title="ใช้ตำแหน่ง GPS ปัจจุบันของฉัน"
        >
          <span className="material-symbols-outlined text-base">my_location</span>
        </button>
      </div>

      {/* Bottom Active Destination & Real Navigation Card */}
      {activeOrchard && (
        <div className="absolute bottom-3 left-3 right-3 z-[500] bg-surface/95 backdrop-blur-md p-3.5 rounded-xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={activeOrchard.thumbnailUrl}
              alt={activeOrchard.name}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-lg object-cover shrink-0 bg-surface-container"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-sm font-bold text-primary truncate">
                  {activeOrchard.name}
                </h4>
                <span className="text-[11px] font-mono text-on-surface-variant tabular-nums">
                  ({activeOrchard.lat.toFixed(4)}, {activeOrchard.lng.toFixed(4)})
                </span>
              </div>
              <p className="text-xs text-on-surface-variant truncate">
                {activeOrchard.district} · {activeOrchard.addressLabel}
              </p>
              {routeStats && (
                <p className="text-xs font-bold text-secondary mt-0.5 tabular-nums">
                  {routeStats.isRoadRoute ? 'เส้นทางรถยนต์จริง' : 'ระยะทางโดยประมาณ'} จาก{' '}
                  {routeStats.fromLabel}: {routeStats.distanceKm} กม. (~{routeStats.durationMin}{' '}
                  นาที)
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void handleDrawRoute()}
              disabled={routingLoading}
              className="px-3 py-2 rounded-lg bg-surface-container text-primary hover:bg-surface-container-high text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-sm">alt_route</span>
              <span>{routingLoading ? 'กำลังคำนวณ...' : 'ดูเส้นทางบนแผนที่'}</span>
            </button>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${activeOrchard.lat},${activeOrchard.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-lg bg-secondary-container text-on-secondary-container hover:opacity-90 text-xs font-bold flex items-center gap-1 transition-opacity whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-sm">near_me</span>
              <span>นำทางจริง (Google Maps)</span>
            </a>

            {onOpenDetail && (
              <button
                type="button"
                onClick={() => onOpenDetail(activeOrchard.id)}
                className="px-3.5 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                รายละเอียดสวน
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
