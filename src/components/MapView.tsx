import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation, Phone, Instagram, ExternalLink, ArrowLeft, Loader2, AlertCircle, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface FanFestPoint {
  id: string;
  nombre_comercial: string;
  direccion_fisica: string;
  telefono: string;
  instagram: string;
  foto_logo: string;
  lat?: number;
  lng?: number;
}

interface MapViewProps {
  onBack: () => void;
}

// Component to center map on user location
function RecenterMap({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, 13);
  }, [coords, map]);
  return null;
}

export const MapView: React.FC<MapViewProps> = ({ onBack }) => {
  const [points, setPoints] = useState<FanFestPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPoints();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (err) => {
          console.error('Error getting location:', err);
          setError('No pudimos obtener tu ubicación. Mostrando puntos generales.');
          // Default to a central location (e.g., Caracas or a general point)
          setUserLocation([10.4806, -66.9036]); 
        }
      );
    } else {
      setError('Tu navegador no soporta geolocalización.');
      setUserLocation([10.4806, -66.9036]);
    }
  };

  const fetchPoints = async () => {
    try {
      // Fetch users with role 'comercio' and authorized
      const { data, error } = await supabase
        .from('perfiles_usuarios')
        .select('id, nombre_comercial, direccion_fisica, telefono, instagram, foto_logo, lat, lng')
        .eq('rol', 'comercio')
        .eq('autorizado', true)
        .eq('quiniela_activa', true)
        .eq('bloqueo_fanfest', false);

      if (error) throw error;

      let pointsWithCoords = data || [];

      // For demo purposes, if DB is empty, add some fake points near Caracas
      if (pointsWithCoords.length === 0) {
        pointsWithCoords = [
          {
            id: 'demo-1',
            nombre_comercial: 'Sport Bar El Estadio',
            direccion_fisica: 'Av. Principal de Las Mercedes, Caracas',
            telefono: '0212-1234567',
            instagram: '@sportbar_estadio',
            foto_logo: 'https://picsum.photos/seed/bar1/100/100',
            lat: 10.4846,
            lng: -66.8636
          },
          {
            id: 'demo-2',
            nombre_comercial: 'Pizza & Goal',
            direccion_fisica: 'Centro Comercial Sambil, Chacao',
            telefono: '0212-7654321',
            instagram: '@pizzagoal',
            foto_logo: 'https://picsum.photos/seed/pizza/100/100',
            lat: 10.4916,
            lng: -66.8536
          }
        ];
      } else {
        // If they have data but no coords, simulate them near the user or Caracas
        pointsWithCoords = pointsWithCoords.map((p: any) => ({
          ...p,
          lat: p.lat || (10.4806 + (Math.random() - 0.5) * 0.05),
          lng: p.lng || (-66.9036 + (Math.random() - 0.5) * 0.05)
        }));
      }

      setPoints(pointsWithCoords);
    } catch (err) {
      console.error('Error fetching points:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-emerald-50">
      {/* Header */}
      <div className="p-4 bg-white border-b border-emerald-100 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-lg font-black text-fifa-blue leading-none uppercase tracking-tight">FanFest Points</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Encuentra tu lugar para ganar</p>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50">
            <Loader2 className="w-10 h-10 text-fifa-blue animate-spin mb-4" />
            <p className="text-sm font-bold text-slate-600">Localizando puntos aliados...</p>
          </div>
        ) : (
          <div className="h-full w-full">
            {userLocation && (
              <MapContainer 
                center={userLocation} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <RecenterMap coords={userLocation} />

                {/* User Marker */}
                <Marker position={userLocation}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-bold text-fifa-blue">Tu ubicación</p>
                    </div>
                  </Popup>
                </Marker>

                {/* FanFest Points Markers */}
                {points.map((point) => (
                  <Marker key={point.id} position={[point.lat!, point.lng!]}>
                    <Popup className="custom-popup">
                      <div className="w-48 p-1">
                        <div className="flex items-center gap-3 mb-2">
                          <img 
                            src={point.foto_logo || "https://picsum.photos/seed/shop/100/100"} 
                            alt={point.nombre_comercial} 
                            className="w-10 h-10 rounded-lg object-cover border border-slate-100"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <h3 className="text-xs font-black text-slate-800 truncate">{point.nombre_comercial}</h3>
                            <span className="text-[8px] font-bold text-emerald-600 uppercase">Punto Autorizado</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-3 line-clamp-2">
                          <MapPin size={10} className="inline mr-1" />
                          {point.direccion_fisica}
                        </p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(point.direccion_fisica)}`, '_blank')}
                            className="flex-1 py-2 bg-fifa-blue text-white text-[9px] font-black rounded-lg flex items-center justify-center gap-1"
                          >
                            <Navigation size={10} />
                            IR AHORA
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
        )}

        {error && (
          <div className="absolute bottom-24 left-4 right-4 z-[1000]">
            <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl flex items-center gap-3 text-amber-700 shadow-lg">
              <AlertCircle size={18} className="shrink-0" />
              <p className="text-[10px] font-bold">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Points List (Drawer-like) */}
      <div className="bg-white rounded-t-[2.5rem] shadow-2xl p-6 max-h-[40%] overflow-y-auto border-t border-emerald-100">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Star size={16} className="text-fifa-gold fill-fifa-gold" />
          Comercios Aliados ({points.length})
        </h3>
        
        <div className="space-y-4">
          {points.length > 0 ? points.map((point) => (
            <div 
              key={point.id}
              className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 hover:bg-emerald-50 transition-colors"
            >
              <img 
                src={point.foto_logo || "https://picsum.photos/seed/shop/100/100"} 
                alt={point.nombre_comercial} 
                className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-slate-800 truncate uppercase tracking-tight">{point.nombre_comercial}</h4>
                <p className="text-[10px] text-slate-500 truncate mb-2">{point.direccion_fisica}</p>
                <div className="flex gap-3">
                  {point.telefono && (
                    <a href={`tel:${point.telefono}`} className="text-fifa-blue hover:scale-110 transition-transform">
                      <Phone size={14} />
                    </a>
                  )}
                  {point.instagram && (
                    <a href={`https://instagram.com/${point.instagram.replace('@', '')}`} target="_blank" className="text-pink-600 hover:scale-110 transition-transform">
                      <Instagram size={14} />
                    </a>
                  )}
                </div>
              </div>
              <button 
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(point.direccion_fisica)}`, '_blank')}
                className="p-3 bg-white text-fifa-blue rounded-xl shadow-sm border border-emerald-100 hover:bg-fifa-blue hover:text-white transition-all"
              >
                <Navigation size={18} />
              </button>
            </div>
          )) : (
            <div className="text-center py-8">
              <p className="text-xs text-slate-400 font-bold uppercase">No hay puntos registrados aún</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
