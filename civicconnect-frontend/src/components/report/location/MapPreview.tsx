import React, { useEffect, useRef, useState } from "react";
import { MapsService } from "../../../services/mapsService";
import { MapPin } from "lucide-react";

interface MapPreviewProps {
  lat: number;
  lng: number;
  onMarkerPositionChanged: (lat: number, lng: number) => void;
}

export const MapPreview: React.FC<MapPreviewProps> = ({
  lat,
  lng,
  onMarkerPositionChanged,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    let active = true;

    const initMap = async () => {
      try {
        const google = await MapsService.loadMapsAPI();
        if (!active || !mapRef.current) return;

        const mapOptions = {
          center: { lat, lng },
          zoom: 15,
          styles: MapsService.getDarkMapStyles(),
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        };

        mapInstanceRef.current = new google.maps.Map(mapRef.current, mapOptions);

        markerInstanceRef.current = new google.maps.Marker({
          position: { lat, lng },
          map: mapInstanceRef.current,
          draggable: true,
          animation: google.maps.Animation.DROP,
        });

        // Event listener for map clicks (manual pin placement)
        mapInstanceRef.current.addListener("click", (event: any) => {
          const clickedLat = event.latLng.lat();
          const clickedLng = event.latLng.lng();
          markerInstanceRef.current.setPosition({ lat: clickedLat, lng: clickedLng });
          onMarkerPositionChanged(clickedLat, clickedLng);
        });

        // Event listener for marker dragging
        markerInstanceRef.current.addListener("dragend", () => {
          const finalPos = markerInstanceRef.current.getPosition();
          if (finalPos) {
            onMarkerPositionChanged(finalPos.lat(), finalPos.lng());
          }
        });
      } catch (err) {
        console.warn("Could not load dynamic Google Map:", err);
        setMapError(true);
      }
    };

    initMap();

    return () => {
      active = false;
      if (mapInstanceRef.current && (window as any).google) {
        (window as any).google.maps.event.clearInstanceListeners(mapInstanceRef.current);
      }
      if (markerInstanceRef.current && (window as any).google) {
        (window as any).google.maps.event.clearInstanceListeners(markerInstanceRef.current);
      }
    };
  }, [onMarkerPositionChanged]);

  // Sync marker position if updated outside map drag (e.g., via Search or GPS button)
  useEffect(() => {
    if (mapInstanceRef.current && markerInstanceRef.current) {
      const pos = { lat, lng };
      mapInstanceRef.current.panTo(pos);
      markerInstanceRef.current.setPosition(pos);
    }
  }, [lat, lng]);

  if (mapError) {
    return (
      <div className="flex flex-col items-center justify-center h-60 bg-gray-900 text-gray-400 rounded-xl border border-gray-800 p-4 text-center">
        <MapPin className="w-8 h-8 mb-2 text-civic-blue animate-pulse" />
        <h4 className="font-semibold text-white">Dynamic Map Off</h4>
        <p className="text-xs max-w-xs mt-1 text-gray-500">
          Showing coordinates instead. Drag pin manually on dynamic map disabled.
        </p>
        <div className="mt-4 flex gap-4 text-xs font-mono bg-gray-950 p-2 rounded">
          <span>Lat: {lat.toFixed(6)}</span>
          <span>Lng: {lng.toFixed(6)}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-60 rounded-xl border border-gray-200 shadow-inner overflow-hidden"
    />
  );
};
export default MapPreview;
