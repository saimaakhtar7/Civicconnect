import React from "react";
import { Button } from "../../ui/button";
import { Navigation, Loader2 } from "lucide-react";

interface CurrentLocationButtonProps {
  onClick: () => void;
  loading: boolean;
}

export const CurrentLocationButton: React.FC<CurrentLocationButtonProps> = ({ onClick, loading }) => {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center border-gray-300 shadow-sm"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin text-civic-blue" />
      ) : (
        <Navigation className="w-4 h-4 mr-2 text-civic-blue fill-civic-blue/20" />
      )}
      <span>Use Current GPS Location</span>
    </Button>
  );
};
export default CurrentLocationButton;
