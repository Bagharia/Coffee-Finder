import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { cafesAPI } from '../services/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function AutoCenter({ cafes }) {
  const map = useMap();
  useEffect(() => {
    if (cafes.length > 0) {
      const bounds = L.latLngBounds(cafes.map(c => [parseFloat(c.latitude), parseFloat(c.longitude)]));
      map.fitBounds(bounds, { padding: [40, 40] });
    } else {
      map.setView([48.8566, 2.3522], 12);
    }
  }, [cafes, map]);
  return null;
}

const SPECIALITES = ['Café', 'Matcha', 'Bubble Tea', 'Thé'];

const BADGE = {
  Matcha:       'bg-[rgba(90,122,74,0.12)] text-[#4A6B40]',
  'Bubble Tea': 'bg-[rgba(139,92,246,0.10)] text-[#7C3AED]',
  Café:         'bg-[rgba(146,64,14,0.10)] text-[#92400E]',
  Thé:          'bg-[rgba(180,83,9,0.10)] text-[#B45309]',
};

export default function Map() {
  const [allCafes, setAllCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ specialite: '', wifi: false, arrondissement: '' });

  useEffect(() => {
    cafesAPI.getAll()
      .then(data => setAllCafes(data))
      .catch(() => setError('Erreur lors du chargement des cafés'))
      .finally(() => setLoading(false));
  }, []);

  const matchesFilters = (c) => {
    if (filters.specialite && !c.specialite?.split(',').map(s => s.trim()).includes(filters.specialite)) return false;
    if (filters.wifi && c.wifi !== 1) return false;
    if (filters.arrondissement && c.arrondissement !== filters.arrondissement) return false;
    return true;
  };

  // Cafés visibles sur la carte (ont des coords ET matchent les filtres)
  const cafes = allCafes.filter(c => c.latitude && c.longitude && matchesFilters(c));
  // Compteur total (matchent les filtres, avec ou sans coords)
  const totalFiltered = allCafes.filter(matchesFilters).length;

  const defaultCenter = [48.8566, 2.3522];

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-(--bg-section) rounded-2xl">
        <p className="text-(--text-secondary)">Chargement de la carte...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-(--bg-section) rounded-2xl">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 p-3 bg-white border-b border-(--border) shrink-0">
        {/* Spécialité pills */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilters(f => ({ ...f, specialite: '' }))}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              !filters.specialite
                ? 'bg-(--accent) text-white'
                : 'bg-(--bg-section) text-(--text-secondary) hover:bg-(--bg-muted)'
            }`}
          >
            Tous
          </button>
          {SPECIALITES.map(s => (
            <button
              key={s}
              onClick={() => setFilters(f => ({ ...f, specialite: f.specialite === s ? '' : s }))}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filters.specialite === s
                  ? 'bg-(--accent) text-white'
                  : `${BADGE[s] || 'bg-(--bg-section) text-(--text-secondary)'} hover:opacity-80`
              }`}
            >
              {s === 'Café' ? '☕' : s === 'Matcha' ? '🍵' : s === 'Bubble Tea' ? '🧋' : '🫖'} {s}
            </button>
          ))}
        </div>

        {/* Séparateur */}
        <div className="w-px bg-(--border) mx-1 hidden sm:block" />

        {/* Arrondissement */}
        <select
          value={filters.arrondissement}
          onChange={e => setFilters(f => ({ ...f, arrondissement: e.target.value }))}
          className="text-xs border border-(--border) rounded-lg px-2 py-1 bg-white text-(--text-primary) outline-none focus:border-(--accent)"
        >
          <option value="">Tous arrondissements</option>
          {Array.from({ length: 20 }, (_, i) => {
            const n = i + 1;
            const label = n === 1 ? '1er' : `${n}e`;
            return <option key={label} value={label}>{label}</option>;
          })}
        </select>

        {/* WiFi toggle */}
        <button
          onClick={() => setFilters(f => ({ ...f, wifi: !f.wifi }))}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
            filters.wifi
              ? 'bg-(--accent) text-white'
              : 'bg-(--bg-section) text-(--text-secondary) hover:bg-(--bg-muted)'
          }`}
        >
          📶 WiFi
        </button>

        {/* Compteur */}
        <span className="ml-auto text-xs text-(--text-muted) self-center shrink-0">
          {totalFiltered} café{totalFiltered > 1 ? 's' : ''}
        </span>
      </div>

      {/* Map */}
      <div className="flex-1 min-h-0">
        <MapContainer
          center={defaultCenter}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <AutoCenter cafes={cafes} />

          {cafes.map(cafe => (
            <Marker key={cafe.id} position={[parseFloat(cafe.latitude), parseFloat(cafe.longitude)]}>
              <Popup>
                <div style={{ minWidth: '160px' }}>
                  <p style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>{cafe.nom}</p>
                  {cafe.arrondissement && (
                    <p style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '2px' }}>📍 {cafe.arrondissement}</p>
                  )}
                  {cafe.specialite && (
                    <p style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '6px' }}>{cafe.specialite}</p>
                  )}
                  {cafe.wifi === 1 && (
                    <span style={{ fontSize: '11px', background: 'rgba(107,143,94,0.12)', color: '#4A6B40', padding: '2px 8px', borderRadius: '999px', marginBottom: '6px', display: 'inline-block' }}>
                      📶 WiFi
                    </span>
                  )}
                  <br />
                  <a
                    href={`/cafe/${cafe.id}`}
                    style={{ display: 'inline-block', marginTop: '6px', fontSize: '12px', fontWeight: '600', color: '#6B8F5E', textDecoration: 'none' }}
                  >
                    Voir le café →
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
