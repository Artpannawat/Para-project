'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Loader2, Navigation, Save, CheckCircle2 } from 'lucide-react';

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ position, setPosition }: { position: L.LatLng, setPosition: (p: L.LatLng) => void }) {
  const map = useMap();
  
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

// Helper to center map if position changes from outside
function ChangeView({ center }: { center: L.LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function MapPicker({ 
  initialLat = 17.89, 
  initialLng = 101.88,
  onSave 
}: { 
  initialLat?: number, 
  initialLng?: number,
  onSave: (lat: number, lng: number) => Promise<void>
}) {
  const [position, setPosition] = useState<L.LatLng>(new L.LatLng(initialLat, initialLng));
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Re-center if initial values change
  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition(new L.LatLng(initialLat, initialLng));
    }
  }, [initialLat, initialLng]);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const newPos = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
        setPosition(newPos);
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(position.lat, position.lng);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 relative">
      <div className="rounded-3xl overflow-hidden border-2 border-neutral-100 dark:border-neutral-800 shadow-inner relative z-10 min-h-[450px] bg-neutral-100 dark:bg-neutral-800">
        <MapContainer 
          center={position} 
          zoom={13} 
          style={{ height: '450px', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
          <ChangeView center={position} />
        </MapContainer>

        {/* Floating Controls */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          <button 
            type="button"
            onClick={handleGetCurrentLocation}
            className="p-3 bg-white dark:bg-neutral-900 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 active:scale-95 transition-all text-emerald-600 focus:outline-none"
            title="ตำแหน่งปัจจุบัน"
          >
            <Navigation size={20} />
          </button>
        </div>
      </div>

      <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-3xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-3">
        <div className="flex justify-between items-center text-xs text-neutral-500 font-bold uppercase tracking-wider">
          <span>พิกัดสวนของคุณ</span>
          <span className="text-emerald-500 font-mono tracking-tight">{position.lat.toFixed(4)}, {position.lng.toFixed(4)}</span>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={loading}
          className={`
            w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95
            ${saved 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
            }
          `}
        >
          {loading ? <Loader2 className="animate-spin" /> : saved ? <CheckCircle2 /> : <Save />}
          {loading ? 'กำลังบันทึก...' : saved ? 'บันทึกสำเร็จ!' : 'บันทึกตำแหน่งสวน'}
        </button>
      </div>
    </div>
  );
}
