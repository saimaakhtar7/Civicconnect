export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface LocationData {
  address: string;
  ward: string;
  city: string;
  nearbyLandmarks?: string[];
}

export type WardId = string;
