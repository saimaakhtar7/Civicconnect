import React, { useCallback } from "react";
import { useReportStore } from "../../../stores/reportStore";
import LocationPicker from "../location/LocationPicker";
import { LocationSelection } from "../../../types/report.types";
import { Button } from "../../ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Step3LocationProps {
  onNext: () => void;
  onBack: () => void;
}

export const Step3Location: React.FC<Step3LocationProps> = ({ onNext, onBack }) => {
  const { draft, setDraftLocation } = useReportStore();

  const handleLocationVerified = useCallback(
    (selection: LocationSelection) => {
      setDraftLocation(selection);
    },
    [setDraftLocation]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Pin the Location</h2>
        <p className="text-sm text-gray-500 mt-1">
          Use GPS, search an address, or drag the pin on the map to mark the exact issue location.
        </p>
      </div>

      <LocationPicker
        onLocationVerified={handleLocationVerified}
        initialSelection={draft.location}
      />

      <div className="flex justify-between pt-4 border-t border-gray-100">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!draft.location} className="px-6">
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
export default Step3Location;
