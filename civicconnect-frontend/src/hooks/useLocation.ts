import { useState, useCallback } from "react";
import { LocationService } from "../services/locationService";
import { LocationSelection } from "../types/report.types";

export const useLocation = () => {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [addressInfo, setAddressInfo] = useState<LocationSelection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureGPS = useCallback(async (): Promise<LocationSelection | null> => {
    setLoading(true);
    setError(null);
    try {
      const position = await LocationService.getCurrentGPSLocation();
      setCoords(position);
      
      const selection = await LocationService.reverseGeocode(position.lat, position.lng);
      setAddressInfo(selection);
      setLoading(false);
      return selection;
    } catch (err: any) {
      setError(err.message || "Could not acquire GPS lock.");
      setLoading(false);
      return null;
    }
  }, []);

  const selectManualCoords = useCallback(async (lat: number, lng: number, address?: string): Promise<LocationSelection> => {
    setLoading(true);
    setError(null);
    setCoords({ lat, lng });

    if (address) {
      const selection: LocationSelection = {
        lat,
        lng,
        address,
        ward: "Unknown Ward",
        city: "Pune",
      };
      setAddressInfo(selection);
      setLoading(false);
      return selection;
    }

    try {
      const selection = await LocationService.reverseGeocode(lat, lng);
      setAddressInfo(selection);
      setLoading(false);
      return selection;
    } catch (err: any) {
      const fallback: LocationSelection = {
        lat,
        lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        ward: "Unknown Ward",
        city: "Pune",
      };
      setAddressInfo(fallback);
      setLoading(false);
      return fallback;
    }
  }, []);

  return {
    coords,
    addressInfo,
    loading,
    error,
    captureGPS,
    selectManualCoords,
  };
};
