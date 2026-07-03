import React, { useEffect } from "react";
import { useLocation } from "../../../hooks/useLocation";
import SearchLocationInput from "./SearchLocationInput";
import CurrentLocationButton from "./CurrentLocationButton";
import MapPreview from "./MapPreview";
import { LocationSelection } from "../../../types/report.types";
import { MapPin, Globe, Compass } from "lucide-react";

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

  const selectedAddress = addressInfo?.address || initialSelection?.address || "Detecting address...";
  const selectedWard = addressInfo?.ward || initialSelection?.ward || "Detecting ward...";

  return (
    <div className="space-y-4">
      {/* Search inputs */}
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
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
        <div className="flex items-start space-x-3 text-sm text-gray-700">
          <MapPin className="w-5 h-5 text-civic-blue shrink-0 mt-0.5" />
          <div className="space-y-1">
          <span className="block text-[10px] uppercase font-bold tracking-wider text-gray-400">Current Address</span>
          <span className="block font-medium text-gray-900 leading-tight">{selectedAddress}</span>
          <span className="block text-[10px] text-gray-500">Reverse-geocoded from your GPS or pin location.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-gray-200/60 pt-3">
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <Compass className="w-4 h-4 text-gray-400" />
            <span>Ward: <span className="font-semibold text-gray-900">{selectedWard}</span></span>
          </div>

          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <Globe className="w-4 h-4 text-gray-400" />
            <span>GPS: <span className="font-mono text-gray-900">{currentLat.toFixed(4)}, {currentLng.toFixed(4)}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LocationPicker;
