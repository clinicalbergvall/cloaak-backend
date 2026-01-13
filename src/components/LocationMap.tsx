import { useEffect, useRef, useState } from 'react';
import { Card } from './ui'

// Declare global google object
declare global {
  interface Window {
    google: any;
  }
}

interface LocationMapProps {
  location: {
    address?: string
    manualAddress?: string
    coordinates?: [number, number]
  }
  title?: string
  height?: string
  draggable?: boolean
  onLocationChange?: (lat: number, lng: number) => void
  showMap?: boolean
}

export default function LocationMap({
  location,
  title = "Client Location",
  height = "300px",
  draggable = false,
  onLocationChange,
  showMap = true
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayAddress = location.manualAddress || location.address || "Unknown location";

  // Default to Nairobi center if no coordinates (approximate)
  const defaultCenter: [number, number] = [-1.2921, 36.8219];

  // Validate coordinates before using them
  const position: [number, number] = location.coordinates && 
    Array.isArray(location.coordinates) && 
    location.coordinates.length === 2 &&
    typeof location.coordinates[0] === 'number' &&
    typeof location.coordinates[1] === 'number' &&
    !isNaN(location.coordinates[0]) &&
    !isNaN(location.coordinates[1]) &&
    isFinite(location.coordinates[0]) &&
    isFinite(location.coordinates[1])
    ? [location.coordinates[0], location.coordinates[1]]
    : defaultCenter;

  // Check if coordinates are valid before rendering
  const hasValidCoordinates = location.coordinates &&
    Array.isArray(location.coordinates) &&
    location.coordinates.length === 2 &&
    typeof location.coordinates[0] === 'number' &&
    typeof location.coordinates[1] === 'number' &&
    !isNaN(location.coordinates[0]) &&
    !isNaN(location.coordinates[1]) &&
    isFinite(location.coordinates[0]) &&
    isFinite(location.coordinates[1]);

  useEffect(() => {
    if (!mapRef.current || !import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      setError('Google Maps API key is not configured');
      return;
    }

    const initMap = async () => {
      try {
        // Load Google Maps script dynamically
        if (!window.google) {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
          script.async = true;
          script.defer = true;
          
          script.onerror = () => {
            setError('Failed to load Google Maps');
          };
          
          document.head.appendChild(script);
          
          script.onload = () => {
            loadMap();
          };
        } else {
          loadMap();
        }

        function loadMap() {
          let lat = position[0];
          let lng = position[1];
          let zoom = 15;

          if (location.coordinates) {
            // Use provided coordinates
            [lat, lng] = location.coordinates;
          } else if (location.address || location.manualAddress) {
            // Geocode address to get coordinates
            const geocoder = new window.google.maps.Geocoder();
            const address = location.manualAddress || location.address || '';

            geocoder.geocode({ address }, (results: any, status: any) => {
              if (status === 'OK' && results[0]) {
                const coords = results[0].geometry.location;
                lat = coords.lat();
                lng = coords.lng();
                
                const map = new window.google.maps.Map(mapRef.current!, {
                  center: { lat, lng },
                  zoom: zoom,
                });

                const marker = new window.google.maps.Marker({
                  position: { lat, lng },
                  map,
                  title: title,
                  draggable: draggable,
                });
                
                if (draggable && onLocationChange) {
                  marker.addListener('dragend', (e: any) => {
                    onLocationChange(e.latLng.lat(), e.latLng.lng());
                  });
                }
                
                setMapLoaded(true);
              } else {
                setError('Unable to geocode the address');
                console.error('Geocoding failed:', status);
              }
            });
            return;
          }

          // Create map with default or provided coordinates
          const map = new window.google.maps.Map(mapRef.current!, {
            center: { lat, lng },
            zoom: zoom,
          });

          // Add marker if coordinates are available
          const marker = new window.google.maps.Marker({
            position: { lat: position[0], lng: position[1] },
            map,
            title: title,
            draggable: draggable,
          });

          if (draggable && onLocationChange) {
            marker.addListener('dragend', (e: any) => {
              onLocationChange(e.latLng.lat(), e.latLng.lng());
            });
          }

          setMapLoaded(true);
        }
      } catch (err) {
        setError('Error initializing map');
        console.error('Map initialization error:', err);
      }
    };

    initMap();
  }, [location, title, draggable, onLocationChange]);

  if (!hasValidCoordinates && !location.manualAddress && !location.address) {
    if (showMap) {  // Only show the fallback UI if showMap is true
      return (
        <Card className="p-4">
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">No location data available</p>
          </div>
          <div className="rounded-lg overflow-hidden bg-gray-100 z-0 relative" style={{ height: height }}>
            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-500">
              <p>No location to display</p>
            </div>
          </div>
        </Card>
      );
    } else {
      // If showMap is false and no location data, just show the title and message
      return (
        <Card className="p-4">
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">No location data available</p>
          </div>
        </Card>
      );
    }
  }

  return (
    <Card className="p4">
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{displayAddress}</p>
      </div>

      {/* Conditionally render the map only if showMap prop is true */}
      {showMap && (
        <div
          className="rounded-lg overflow-hidden bg-gray-100 z-0 relative"
          style={{ height: height }}
        >
          <div 
            ref={mapRef} 
            className="w-full h-full"
            style={{ minHeight: height }}
          >
            {!mapLoaded && !error && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        </div>
      )}

      {hasValidCoordinates && (
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            {location.coordinates![0].toFixed(6)}, {location.coordinates![1].toFixed(6)}
          </p>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${location.coordinates![0]},${location.coordinates![1]}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
          >
            <span>🧭</span> Get Directions
          </a>
        </div>
      )}
    </Card>
  )
}
