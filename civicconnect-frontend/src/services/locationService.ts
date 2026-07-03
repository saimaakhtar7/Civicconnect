import { LocationSelection } from "../types/report.types";

export class LocationService {
  /**
   * Capture user browser GPS coordinates.
   */
  static getCurrentGPSLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(error.message || "Failed to capture location coordinates."));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  /**
   * Reverse geocode coordinate into address and ward.
   */
  static async reverseGeocode(lat: number, lng: number): Promise<LocationSelection> {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&addressdetails=1`;

    try {
      const response = await fetch(nominatimUrl, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      const addressDetails = data.address || {};

      const ward =
        addressDetails.suburb ||
        addressDetails.neighbourhood ||
        addressDetails.city_district ||
        addressDetails.village ||
        addressDetails.hamlet ||
        "Unknown Ward";

      const city =
        addressDetails.city ||
        addressDetails.town ||
        addressDetails.village ||
        addressDetails.county ||
        addressDetails.state ||
        "Unknown City";

      return {
        lat,
        lng,
        address,
        ward,
        city,
      };
    } catch (err: any) {
      console.warn("OpenStreetMap reverse geocoding failed, using fallback:", err);
      return {
        lat,
        lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        ward: "Unknown Ward",
        city: "Unknown City",
      };
    }
  }
}

