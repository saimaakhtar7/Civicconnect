import React, { useEffect } from "react";
import { useLocation } from "../../../hooks/useLocation";
import SearchLocationInput from "./SearchLocationInput";
import CurrentLocationButton from "./CurrentLocationButton";
import MapPreview from "./MapPreview";
import { LocationSelection } from "../../../types/report.types";
import { MapPin, Globe, Compass, CheckCircle2 } from "lucide-react";

interface LocationPickerProps {
  onLocationVerified: (selection: LocationSelection) => void;
  initialSelection: LocationSelection | null;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationVerified,
  initialSelection,
}) => {
  const { coords, addressInfo, loading, captureGPS, selectManualCoords } = useLocation();

  // Default coordinate Pune central seed if none provided
  const currentLat = coords?.lat || initialSelection?.lat || 18.5204;
  const currentLng = coords?.lng || initialSelection?.lng || 73.8567;

  const hasLocation = !!(coords || initialSelection);

  useEffect(() => {
    if (addressInfo) {
      onLocationVerified(addressInfo);
    }
  }, [addressInfo, onLocationVerified]);

  // Capture GPS automatically on load if no previous selection
  useEffect(() => {
    if (!initialSelection && !coords) {
      captureGPS();
    }
  }, []);

  const handleSearchSelection = (lat: number, lng: number, address: string) => {
    selectManualCoords(lat, lng, address);
  };

  const handleMarkerChange = (lat: number, lng: number) => {
    selectManualCoords(lat, lng);
  };

  const selectedAddress = addressInfo?.address || initialSelection?.address || "Detecting address…";
  const selectedWard    = addressInfo?.ward    || initialSelection?.ward    || "—";

  return (
    <div className="space-y-4">
      {/* Search + GPS row */}
      <div className="grid grid-cols-1 gap-3">
        <SearchLocationInput onLocationSelected={handleSearchSelection} />
        <CurrentLocationButton onClick={captureGPS} loading={loading} />
      </div>

      {/* Map visualization */}
      <MapPreview
        lat={currentLat}
        lng={currentLng}
        onMarkerPositionChanged={handleMarkerChange}
      />

      {/* Location Details Card */}
      <div className={`
        relative rounded-2xl border p-4 space-y-3 overflow-hidden
        transition-all duration-300
        ${hasLocation
          ? "bg-emerald-500/5 border-emerald-500/20"
          : "bg-gray-50/60 border-gray-200/60"
        }
      `}>
        {/* Subtle green glow when location locked */}
        {hasLocation && (
          <span className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
        )}

        {/* Address row */}
        <div className="flex items-start gap-3">
          <span className={`
            flex items-center justify-center w-9 h-9 rounded-xl shrink-0 mt-0.5
            ${hasLocation ? "bg-emerald-500/15 text-emerald-500" : "bg-gray-200/60 text-gray-400"}
            transition-colors duration-300
          `}>
            <MapPin className="w-4 h-4" />
          </span>

          <div className="flex-1 min-w-0 space-y-0.5">
            <span className="block text-[10px] uppercase font-black tracking-widest text-gray-400">
              Detected Address
            </span>
            <span className="block text-sm font-semibold text-gray-800 leading-snug truncate">
              {selectedAddress}
            </span>
            <span className="block text-[10px] text-gray-400">
              Reverse-geocoded from your GPS or pin location
            </span>
          </div>

          {hasLocation && (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
          )}
        </div>

        {/* Coordinates row */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200/60">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-50 shrink-0">
              <Compass className="w-3.5 h-3.5 text-blue-400" />
            </span>
            <div className="min-w-0">
              <span className="block text-[9px] uppercase tracking-wider font-bold text-gray-400">Ward</span>
              <span className="block text-xs font-semibold text-gray-700 truncate">{selectedWard}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-purple-50 shrink-0">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
            </span>
            <div className="min-w-0">
              <span className="block text-[9px] uppercase tracking-wider font-bold text-gray-400">Coordinates</span>
              <span className="block text-[11px] font-mono font-semibold text-gray-700 truncate">
                {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
