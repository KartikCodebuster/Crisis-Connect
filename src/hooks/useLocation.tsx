import { useState, useEffect } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        setLocation(prev => {
          // If we have previous coordinates, check if the change is significant (e.g. > 5 meters)
          if (prev.latitude && prev.longitude) {
            const R = 6371e3; // metres
            const φ1 = (prev.latitude * Math.PI) / 180;
            const φ2 = (latitude * Math.PI) / 180;
            const Δφ = ((latitude - prev.latitude) * Math.PI) / 180;
            const Δλ = ((longitude - prev.longitude) * Math.PI) / 180;

            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                      Math.cos(φ1) * Math.cos(φ2) *
                      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            // Only update if moved more than 5 meters or if it's the first fix
            if (distance < 5) return prev;
          }

          return {
            latitude,
            longitude,
            error: null,
          };
        });
      },
      (error) => {
        setLocation(prev => ({ ...prev, error: error.message }));
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return location;
}
