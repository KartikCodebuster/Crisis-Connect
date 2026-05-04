import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { EmergencyRequest, EmergencyStatus } from '../services/dbService';
import { ShieldAlert, User, MapPin } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix for default leaflet icons in React
const createIcon = (color: string, icon: React.ReactNode) => {
  return L.divIcon({
    html: renderToStaticMarkup(
      <div className={`p-2 rounded-full border-2 border-white shadow-lg`} style={{ backgroundColor: color }}>
        {icon}
      </div>
    ),
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

const SOS_ICON = createIcon('#dc2626', <ShieldAlert className="w-5 h-5 text-white" />);
const GUARDIAN_ICON = createIcon('#000000', <ShieldAlert className="w-5 h-5 text-red-500" />);
const USER_ICON = createIcon('#3b82f6', <User className="w-5 h-5 text-white" />);

interface EmergencyMapProps {
  center: { lat: number; lng: number };
  emergencies: EmergencyRequest[];
  onAccept: (id: string) => void;
  myCircleIds?: string[];
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 14);
  return null;
}

export function EmergencyMap({ center, emergencies, onAccept, myCircleIds = [] }: EmergencyMapProps) {
  return (
    <div className="h-[500px] w-full rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-inner z-0">
      <MapContainer 
        center={[center.lat, center.lng]} 
        zoom={14} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ChangeView center={[center.lat, center.lng]} />

        <Marker position={[center.lat, center.lng]} icon={USER_ICON}>
          <Popup>
            <p className="font-bold">Your Location</p>
          </Popup>
        </Marker>

        {emergencies.map((e) => {
          const isCircleMember = e.circleIds?.some(id => myCircleIds.includes(id));
          return (
            <Marker 
              key={e.id} 
              position={[e.location.lat, e.location.lng]} 
              icon={isCircleMember ? GUARDIAN_ICON : SOS_ICON}
            >
              <Popup className="emergency-popup">
                <div className="p-2 space-y-2 min-w-[150px]">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm uppercase tracking-tight">{e.requesterName}</p>
                    {isCircleMember && <ShieldAlert className="w-3 h-3 text-red-600" />}
                  </div>
                  {isCircleMember && (
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-none">Guardian Alert</p>
                  )}
                  <p className="text-xs text-gray-500 italic">"{e.description}"</p>
                  {e.status === EmergencyStatus.PENDING && (
                    <button 
                      onClick={() => onAccept(e.id)}
                      className="w-full bg-red-600 text-white text-[10px] font-black py-2 rounded-lg uppercase tracking-widest mt-2"
                    >
                      Respond Now
                    </button>
                  )}
                  {e.status === EmergencyStatus.ACCEPTED && (
                    <p className="text-[10px] font-black text-blue-600 uppercase">Being Helped</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
