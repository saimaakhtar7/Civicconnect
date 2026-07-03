import React from "react";
import CivicMap from "../../components/map/CivicMap";

export const MapPage: React.FC = () => {
  return (
    <div className="w-full" style={{ height: "calc(100vh - 64px)" }}>
      <CivicMap />
    </div>
  );
};
export default MapPage;
