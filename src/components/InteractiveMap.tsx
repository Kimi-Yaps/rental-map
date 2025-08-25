import React, { useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLng } from '../services/GeoapifyService';

interface MapProps {
  position: LatLng;
  onLocationChange: (location: LatLng) => void;
  config: {
    mapZoom: number;
    mapTileUrl: string;
    mapAttribution: string;
  };
  shouldZoom: boolean;
}

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const InteractiveMap: React.FC<MapProps> = ({ position, onLocationChange, config, shouldZoom }) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize map
    if (containerRef.current && !mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView([position.lat, position.lng], config.mapZoom);
      
      L.tileLayer(config.mapTileUrl, {
        attribution: config.mapAttribution,
        maxZoom: 18
      }).addTo(mapRef.current);

      markerRef.current = L.marker([position.lat, position.lng], { draggable: true })
        .addTo(mapRef.current);

      // Set up map click handler
      mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
        const latLng = { lat: e.latlng.lat, lng: e.latlng.lng };
        onLocationChange(latLng);
        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
        }
      });

      // Set up marker drag handler
      markerRef.current.on('dragend', () => {
        const marker = markerRef.current;
        if (marker) {
          const newPos = marker.getLatLng();
          onLocationChange({ lat: newPos.lat, lng: newPos.lng });
        }
      });
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []); // Empty dependency array since we only want to initialize once

  // Update marker position when it changes
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([position.lat, position.lng]);
    }
  }, [position.lat, position.lng]);

  // Handle zoom changes
  useEffect(() => {
    if (mapRef.current && shouldZoom) {
      mapRef.current.flyTo([position.lat, position.lng], config.mapZoom, {
        animate: true,
        duration: 1.5
      });
    }
  }, [position.lat, position.lng, shouldZoom, config.mapZoom]);

  // Force map resize when container changes
  useEffect(() => {
    const resizeMap = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };

    const observer = new ResizeObserver(resizeMap);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Initial resize after a short delay
    const timer = setTimeout(resizeMap, 100);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        height: '100%', 
        width: '100%', 
        minHeight: '400px',
        backgroundColor: 'var(--ion-color-light-shade)' 
      }} 
    />
  );
};

export default InteractiveMap;
