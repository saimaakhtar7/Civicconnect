import { setOptions } from "@googlemaps/js-api-loader";

setOptions({
  key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "mock-maps-key",
  v: "weekly",
});
