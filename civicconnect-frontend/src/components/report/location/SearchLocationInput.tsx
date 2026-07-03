import React, { useEffect, useRef } from "react";
import { Input } from "../../ui/input";
import { Search } from "lucide-react";

interface SearchLocationInputProps {
  onLocationSelected: (lat: number, lng: number, address: string) => void;
  placeholder?: string;
}

export const SearchLocationInput: React.FC<SearchLocationInputProps> = ({
  onLocationSelected,
  placeholder = "Search address or neighborhood...",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    // Check if google maps places is loaded
    if (
      typeof window !== "undefined" &&
      (window as any).google &&
      (window as any).google.maps &&
      (window as any).google.maps.places &&
      inputRef.current
    ) {
      autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
        types: ["geocode", "establishment"],
        componentRestrictions: { country: "in" }, // Restrict to India for Pune ward demo
      });

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || place.name || "";
          onLocationSelected(lat, lng, address);
        }
      });
    }

    return () => {
      if (autocompleteRef.current && (window as any).google) {
        (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onLocationSelected]);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
        <Search className="h-4 w-4" />
      </div>
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className="pl-9 bg-white border-gray-300 shadow-sm"
      />
    </div>
  );
};
export default SearchLocationInput;
