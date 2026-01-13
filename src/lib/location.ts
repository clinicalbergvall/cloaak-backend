import type { Location } from './types'


const getCapacitor = async () => {
  try {
    const capacitorModule = await import('@capacitor/core')
    return capacitorModule.Capacitor
  } catch (err) {
    console.warn('Capacitor not available in this environment:', err)

    return {
      isNativePlatform: () => false,
    }
  }
}

const getGeolocation = async () => {
  try {
    const geolocationModule = await import('@capacitor/geolocation')
    return geolocationModule.Geolocation
  } catch (err) {
    console.warn('Geolocation not available in this environment:', err)
    return null
  }
}

export async function getCurrentLocation(): Promise<Location | null> {
  try {
    const Capacitor = await getCapacitor();
    if (Capacitor.isNativePlatform()) {
      try {
        const Geolocation = await getGeolocation();
        if (Geolocation) {
          // First check if we already have permission
          const permissionStatus = await (Geolocation as any).checkPermissions();
          let permission = permissionStatus.location || permissionStatus.coarseLocation;
          
          if (permission !== 'granted') {
            // Request permission if not granted
            const newPermission = await (Geolocation as any).requestPermissions();
            permission = newPermission.location || newPermission.coarseLocation;
          }
          
          if (permission === 'granted') {
            const { coords } = await (Geolocation as any).getCurrentPosition({
              enableHighAccuracy: true,
              timeout: 15000,
            });

            const location: Location = {
              latitude: coords.latitude,
              longitude: coords.longitude,
              coordinates: [coords.latitude, coords.longitude],
            };

            try {
              const address = await reverseGeocode(location.latitude, location.longitude);
              location.address = address;
            } catch { }

            return location;
          } else {
            console.warn('Location permission not granted');
          }
        }
      } catch (error) {
        console.warn('Error using Capacitor geolocation:', error);
        // Fallback to browser geolocation
      }
    }

    // Fallback to browser geolocation
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            coordinates: [position.coords.latitude, position.coords.longitude],
          }

          try {
            const address = await reverseGeocode(location.latitude, location.longitude)
            location.address = address
          } catch { }

          resolve(location)
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      )
    })
  } catch {
    return null
  }
}

export async function getLocationPermissionStatus(): Promise<string> {
  try {
    const Capacitor = await getCapacitor();
    if (Capacitor.isNativePlatform()) {
      try {
        const Geolocation = await getGeolocation();
        if (Geolocation) {
          const status = await (Geolocation as any).checkPermissions();
          console.log('Geolocation permission status:', status);
          const fine = (status as any)?.location || (status as any)?.coarseLocation;
          return String(fine || 'prompt');
        }
      } catch (error) {
        console.warn('Error checking geolocation permissions:', error);
        return 'denied';
      }
    }
    return 'browser';
  } catch {
    return 'unknown';
  }
}

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const Capacitor = await getCapacitor();
    if (Capacitor.isNativePlatform()) {
      try {
        const Geolocation = await getGeolocation();
        if (Geolocation) {
          const result = await (Geolocation as any).requestPermissions();
          console.log('Location permission request result:', result);
          const fine = (result as any)?.location || (result as any)?.coarseLocation;
          return fine === 'granted';
        }
      } catch (error) {
        console.warn('Error requesting geolocation permissions:', error);
        return false;
      }
    }
    // For browser environments, we can't programmatically request permission
    // We can only prompt the user when getCurrentPosition is called
    return true;
  } catch {
    return false;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    // Use Google Maps Geocoding API instead of OpenStreetMap to avoid CORS issues
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not found');
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&result_type=street_address`
    );
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } else {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  } catch (error) {
    console.warn('Geocoding failed:', error);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

export function formatLocation(location: Location): string {
  if (location.manualAddress) {
    return location.manualAddress
  }
  if (location.address) {
    return location.address
  }
  return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
}

export async function watchLocation(callback: (location: Location) => void): Promise<{ remove: () => void } | null> {
  try {
    const Capacitor = await getCapacitor();
    if (Capacitor.isNativePlatform()) {
      const Geolocation = await getGeolocation();
      if (Geolocation) {
        // First check if we have permission
        const permissionStatus = await (Geolocation as any).checkPermissions();
        let permission = permissionStatus.location || permissionStatus.coarseLocation;
        
        if (permission !== 'granted') {
          // Request permission if not granted
          const newPermission = await (Geolocation as any).requestPermissions();
          permission = newPermission.location || newPermission.coarseLocation;
          
          if (permission !== 'granted') {
            console.warn('Location permission not granted for watch');
            return null;
          }
        }
        
        const watchIdObject = await (Geolocation as any).watchPosition(
          async (position: any) => {
            if (position) {
              const location: Location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                coordinates: [position.coords.latitude, position.coords.longitude],
              };
              
              try {
                const address = await reverseGeocode(location.latitude, location.longitude);
                location.address = address;
              } catch (geocodeError) {
                console.warn('Geocoding failed for watched location:', geocodeError);
              }
              
              callback(location);
            }
          }
        );
        
        const watchId = typeof watchIdObject === 'object' && 'watchId' in watchIdObject ? watchIdObject.watchId : watchIdObject;
        
        console.log('Location watching started with Capacitor');
        return { remove: async () => {
          console.log('Stopping location watch');
          await (Geolocation as any).clearWatch({ id: watchId });
        }};
      }
    }

    // Fallback to browser geolocation
    if (!navigator.geolocation) {
      console.warn('Browser geolocation not available');
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          coordinates: [position.coords.latitude, position.coords.longitude],
        };
        
        reverseGeocode(location.latitude, location.longitude)
          .then(address => {
            location.address = address;
            callback(location);
          })
          .catch(geocodeError => {
            console.warn('Geocoding failed for watched location:', geocodeError);
            callback(location);
          });
      },
      (error) => {
        console.warn('Browser geolocation watch error:', error.message);
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 }
    );

    console.log('Location watching started with browser API');
    return { remove: () => {
      console.log('Stopping browser location watch');
      navigator.geolocation.clearWatch(watchId);
    }};
  } catch (error) {
    console.warn('Error starting location watch:', error);
    return null;
  }
}