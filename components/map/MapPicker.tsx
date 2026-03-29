'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Loader2, Navigation, Save, CheckCircle2, Search, X } from 'lucide-react';

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function DraggableMarker({ position, setPosition }: { position: L.LatLng, setPosition: (p: L.LatLng) => void }) {
  const map = useMap();
  const markerRef = useRef<L.Marker>(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const newPos = marker.getLatLng();
        setPosition(newPos);
      }
    },
  };

  return position === null ? null : (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={eventHandlers}
      ref={markerRef}
    />
  );
}

function ChangeView({ center }: { center: L.LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
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

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition(new L.LatLng(initialLat, initialLng));
    }
  }, [initialLat, initialLng]);

  // Debounced search using Nominatim
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=th`,
          { headers: { 'Accept-Language': 'th' } }
        );
        const data: SearchResult[] = await res.json();
        setSearchResults(data);
        setShowResults(true);
      } catch (err) {
        console.error('Geocoding error:', err);
      } finally {
        setSearching(false);
      }
    }, 800); // 800ms debounce to respect Nominatim rate limit
  };

  const selectSearchResult = (result: SearchResult) => {
    const newPos = new L.LatLng(parseFloat(result.lat), parseFloat(result.lon));
    setPosition(newPos);
    setSearchQuery(result.display_name.split(',')[0]); // Show short name
    setShowResults(false);
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
          setPosition(newPos);
        },
        () => {
          alert('ไม่สามารถเข้าถึงตำแหน่งได้ กรุณาอนุญาตในเบราว์เซอร์');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
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
      {/* Search Bar */}
      <div className="relative z-[1001]">
        <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-lg px-4 py-3">
          <Search size={18} className="text-neutral-400 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="ค้นหาสถานที่... (เช่น ปากชม, เลย)"
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-neutral-800 dark:text-neutral-200 placeholder-neutral-400"
          />
          {searching && <Loader2 size={16} className="animate-spin text-emerald-500" />}
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setShowResults(false); setSearchResults([]); }} className="text-neutral-400 hover:text-neutral-600">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                onClick={() => selectSearchResult(result)}
                className="w-full text-left px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors border-b border-neutral-100 dark:border-neutral-700/50 last:border-b-0"
              >
                <span className="line-clamp-2">{result.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
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
          <DraggableMarker position={position} setPosition={setPosition} />
          <ChangeView center={position} />
        </MapContainer>

        {/* Floating Geolocation Button */}
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

      {/* Coordinates Display + Save */}
      <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-3xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-3">
        <div className="flex justify-between items-center text-xs text-neutral-500 font-bold uppercase tracking-wider">
          <span>พิกัดสวนของคุณ</span>
          <span className="text-emerald-500 font-mono tracking-tight">{position.lat.toFixed(4)}, {position.lng.toFixed(4)}</span>
        </div>
        
        <p className="text-xs text-neutral-400 leading-relaxed">
          💡 แตะแผนที่หรือลากหมุดเพื่อเลือกตำแหน่ง หรือใช้ช่องค้นหาด้านบน
        </p>
        
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
