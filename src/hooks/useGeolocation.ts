import { useState, useEffect, useRef } from 'react';

export interface GeolocationState {
  coords: {
    lat: number;
    lng: number;
    speed: number | null;
    heading: number | null;
  } | null;
  error: string | null;
  timestamp: number | null;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  throttleMs?: number;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true, // need high accuracy for delivery
    timeout = 10000,
    maximumAge = 0, // don't use cached positions
    throttleMs = 2000, // wait at least this long between updates
  } = options;

  const [state, setState] = useState<GeolocationState>({
    coords: null,
    error: null,
    timestamp: null,
  });

  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser.',
      }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastUpdateRef.current < throttleMs) {
          // Throttled
          return;
        }

        lastUpdateRef.current = now;

        setState({
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            speed: position.coords.speed,
            heading: position.coords.heading,
          },
          error: null,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        setState((prev) => ({ ...prev, error: error.message }));
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enableHighAccuracy, timeout, maximumAge, throttleMs]);

  return state;
}
