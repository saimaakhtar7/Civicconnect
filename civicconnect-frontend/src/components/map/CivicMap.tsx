import React, { useEffect, useRef, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { MapsService } from "../../services/mapsService";
import { IssueService } from "../../services/issueService";
import { IssueDocument } from "../../types/issue.types";
import { createMarkerElement } from "./IssueMarker";
import { IssuePopup } from "./IssuePopup";
import { useNavigate } from "react-router-dom";
import { Navigation, AlertCircle, Sparkles, ShieldAlert, Calendar, Eye, Activity } from "lucide-react";

const DEFAULT_CENTER = { lat: 18.5204, lng: 73.8567 }; // Pune, India

interface MarkerEntry {
  marker: any;
  issue: IssueDocument;
  popupContainer: HTMLElement | null;
  popupRoot: ReturnType<typeof createRoot> | null;
}

// Local ward score structures
const PUNE_WARDS = [
  { name: "Koregaon Park", center: { lat: 18.5362, lng: 73.8930 }, rating: "Excellent", color: "#10b981" },
  { name: "Shivajinagar", center: { lat: 18.5314, lng: 73.8446 }, rating: "Moderate", color: "#f59e0b" },
  { name: "Kothrud", center: { lat: 18.5074, lng: 73.8077 }, rating: "Excellent", color: "#10b981" },
  { name: "Viman Nagar", center: { lat: 18.5679, lng: 73.9143 }, rating: "Critical", color: "#ef4444" },
];

// Predictive Hotspots
const PREDICTIVE_HOTSPOTS = [
  { id: "pred_1", subcategory: "Future Pothole Cluster Forecast", lat: 18.5420, lng: 73.8820, reason: "High traffic density + surface moisture anomaly" },
  { id: "pred_2", subcategory: "Water Leakage Burst Forecast", lat: 18.5250, lng: 73.8320, reason: "Pressure telemetry spike in local pipe sector" },
  { id: "pred_3", subcategory: "Garbage Accumulation Forecast", lat: 18.5520, lng: 73.9220, reason: "Historical disposal frequency patterns in ward" },
];

export const CivicMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map());
  const predictionMarkersRef = useRef<any[]>([]);
  const wardCirclesRef = useRef<any[]>([]);
  const heatmapLayerRef = useRef<any>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const navigate = useNavigate();

  // Control panel states
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [mapErrorMessage, setMapErrorMessage] = useState<string | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);
  const [issuesData, setIssuesData] = useState<IssueDocument[]>([]);
  const [issueCount, setIssueCount] = useState(0);

  // Layers Toggles
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showHealthLayer, setShowHealthLayer] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);

  // Playback States
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "yesterday" | "week" | "month">("all");

  // Close all popups
  const closeAllPopups = useCallback(() => {
    markersRef.current.forEach((entry) => {
      if (entry.popupContainer && entry.popupContainer.parentNode) {
        entry.popupContainer.parentNode.removeChild(entry.popupContainer);
        entry.popupContainer = null;
      }
    });
  }, []);

  // Render React popup overlay anchored to marker
  const showPopup = useCallback(
    (issue: IssueDocument, markerElement: HTMLElement) => {
      closeAllPopups();

      const container = document.createElement("div");
      container.style.cssText = "position:absolute;z-index:9999;transform:translate(-50%,-105%);pointer-events:all;";

      const entry = markersRef.current.get(issue.id);
      if (entry) {
        entry.popupContainer = container;
        const root = createRoot(container);
        entry.popupRoot = root;
        root.render(
          <IssuePopup
            issue={issue}
            onClose={closeAllPopups}
            onViewDetail={(id) => navigate(`/issues/${id}`)}
          />
        );
      }

      markerElement.style.position = "relative";
      markerElement.appendChild(container);
    },
    [closeAllPopups, navigate]
  );

  // Add or update markers
  const upsertMarker = useCallback(
    (issue: IssueDocument, google: any, map: any) => {
      if (!issue.location?.lat || !issue.location?.lng) return;

      const existing = markersRef.current.get(issue.id);
      if (existing) {
        existing.marker.position = { lat: issue.location.lat, lng: issue.location.lng };
        existing.issue = issue;
        return;
      }

      const markerEl = createMarkerElement(
        issue.aiAnalysis?.severity || "medium",
        issue.aiAnalysis?.category || "other",
        issue.status
      );

      let advancedMarker: any;
      try {
        advancedMarker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: issue.location.lat, lng: issue.location.lng },
          content: markerEl,
          title: issue.aiAnalysis?.subcategory || "Issue",
          gmpClickable: true,
        });
      } catch {
        advancedMarker = new google.maps.Marker({
          map,
          position: { lat: issue.location.lat, lng: issue.location.lng },
          title: issue.aiAnalysis?.subcategory || "Issue",
          animation: google.maps.Animation.DROP,
        });
      }

      advancedMarker.addListener("click", () => {
        showPopup(issue, markerEl);
      });

      markersRef.current.set(issue.id, {
        marker: advancedMarker,
        issue,
        popupContainer: null,
        popupRoot: null,
      });
    },
    [showPopup]
  );

  // Filter markers visibility based on playback slider
  const filterMarkersByTimeline = useCallback((filter: typeof timeFilter) => {
    const now = Date.now();
    let threshold = 0;

    if (filter === "today") threshold = now - 24 * 3600 * 1000;
    else if (filter === "yesterday") threshold = now - 48 * 3600 * 1000;
    else if (filter === "week") threshold = now - 7 * 24 * 3600 * 1000;
    else if (filter === "month") threshold = now - 30 * 24 * 3600 * 1000;

    let visibleCount = 0;
    markersRef.current.forEach((entry) => {
      const issueTime = entry.issue.createdAt
        ? new Date((entry.issue.createdAt as any).toDate ? (entry.issue.createdAt as any).toDate() : entry.issue.createdAt).getTime()
        : now;

      const isVisible = filter === "all" || issueTime >= threshold;
      entry.marker.map = isVisible ? mapInstanceRef.current : null;
      if (isVisible) visibleCount++;
    });

    setIssueCount(visibleCount);
  }, []);

  // Sync / render heatmaps
  const syncHeatmapOverlay = useCallback(async (active: boolean, google: any, map: any) => {
    if (heatmapLayerRef.current) {
      heatmapLayerRef.current.setMap(null);
      heatmapLayerRef.current = null;
    }
    if (!active) return;

    try {
      const { HeatmapLayer } = await google.maps.importLibrary("visualization");
      const points = issuesData
        .filter((i) => i.location?.lat && i.location?.lng)
        .map((i) => new google.maps.LatLng(i.location.lat, i.location.lng));

      heatmapLayerRef.current = new HeatmapLayer({
        data: points,
        map,
        radius: 30,
      });
    } catch (err) {
      console.warn("Failed to construct HeatmapLayer:", err);
    }
  }, [issuesData]);

  // Sync / render city health polygons
  const syncHealthOverlay = useCallback((active: boolean, google: any, map: any) => {
    wardCirclesRef.current.forEach((c) => c.setMap(null));
    wardCirclesRef.current = [];

    if (!active) return;

    PUNE_WARDS.forEach((ward) => {
      const circle = new google.maps.Circle({
        strokeColor: ward.color,
        strokeOpacity: 0.8,
        strokeWeight: 1.5,
        fillColor: ward.color,
        fillOpacity: 0.15,
        map,
        center: ward.center,
        radius: 900, // 900 meters radius
      });

      // Bind basic info popup on hover
      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="color:#111;font-size:11px;padding:4px;"><strong>${ward.name} Ward</strong><br/>Health Score: <strong>${ward.rating}</strong></div>`,
      });

      circle.addListener("click", (e: any) => {
        infoWindow.setPosition(e.latLng);
        infoWindow.open(map);
      });

      wardCirclesRef.current.push(circle);
    });
  }, []);

  // Sync / render prediction markers
  const syncPredictionOverlay = useCallback((active: boolean, google: any, map: any) => {
    predictionMarkersRef.current.forEach((m) => {
      m.map = null;
    });
    predictionMarkersRef.current = [];

    if (!active) return;

    PREDICTIVE_HOTSPOTS.forEach((p) => {
      const div = document.createElement("div");
      div.className = "civic-map-marker";
      div.innerHTML = `<span class="marker-pulse" style="background:#7e3af2;animation-duration:1.8s;"></span><span class="marker-dot" style="background:#7e3af2;"></span>`;

      let advancedMarker: any;
      try {
        advancedMarker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: p.lat, lng: p.lng },
          content: div,
          title: p.subcategory,
          gmpClickable: true,
        });
      } catch {
        advancedMarker = new google.maps.Marker({
          map,
          position: { lat: p.lat, lng: p.lng },
          title: p.subcategory,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#7e3af2",
            fillOpacity: 0.9,
            strokeWeight: 1.5,
            strokeColor: "#fff",
          },
        });
      }

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="color:#111;font-size:11px;padding:4px;max-width:180px;"><strong>🔮 AI Prediction Spot</strong><br/>${p.subcategory}<br/><span style="color:#666;">${p.reason}</span></div>`,
      });

      advancedMarker.addListener("click", () => {
        infoWindow.open(map, advancedMarker);
      });

      predictionMarkersRef.current.push(advancedMarker);
    });
  }, []);

  // Remove stale markers
  const removeStaleMarkers = useCallback((currentIds: Set<string>) => {
    markersRef.current.forEach((entry, id) => {
      if (!currentIds.has(id)) {
        entry.marker.map = null;
        if (entry.popupRoot) entry.popupRoot.unmount();
        markersRef.current.delete(id);
      }
    });
  }, []);

  // Initialize Map Page
  useEffect(() => {
    let active = true;

    const initMap = async () => {
      try {
        const google = await MapsService.loadMapsAPI();
        if (!active || !mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: DEFAULT_CENTER,
          zoom: 13,
          styles: MapsService.getDarkMapStyles(),
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM,
          },
        });

        mapInstanceRef.current = map;
        setMapLoaded(true);
        setMapError(false);
        setMapErrorMessage(null);

        map.addListener("click", closeAllPopups);

        // Load & Subscribe issues
        unsubscribeRef.current = IssueService.subscribeToIssues((issues) => {
          setIssuesData(issues);
          setIssueCount(issues.length);
          const currentIds = new Set(issues.map((i) => i.id));
          removeStaleMarkers(currentIds);
          issues.forEach((issue) => upsertMarker(issue, google, map));
        });
      } catch (err: any) {
        console.warn("Map load failed:", err);
        setMapError(true);
        setMapErrorMessage(err?.message || "Unable to initialize Google Maps.");
      }
    };

    initMap();

    return () => {
      active = false;
      if (unsubscribeRef.current) unsubscribeRef.current();
      markersRef.current.forEach((entry) => {
        if (entry.popupRoot) entry.popupRoot.unmount();
      });
      markersRef.current.clear();
      wardCirclesRef.current.forEach((c) => c.setMap(null));
      predictionMarkersRef.current.forEach((m) => { m.map = null; });
      if (heatmapLayerRef.current) heatmapLayerRef.current.setMap(null);
    };
  }, [closeAllPopups, upsertMarker, removeStaleMarkers, reloadCounter]);

  // Effect triggers when layer toggles change
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    MapsService.loadMapsAPI().then((google) => {
      syncHeatmapOverlay(showHeatmap, google, mapInstanceRef.current);
      syncHealthOverlay(showHealthLayer, google, mapInstanceRef.current);
      syncPredictionOverlay(showPredictions, google, mapInstanceRef.current);
    });
  }, [showHeatmap, showHealthLayer, showPredictions, mapLoaded, syncHeatmapOverlay, syncHealthOverlay, syncPredictionOverlay]);

  // Trigger timeline updates
  useEffect(() => {
    filterMarkersByTimeline(timeFilter);
  }, [timeFilter, filterMarkersByTimeline, issuesData]);

  const panToCurrentLocation = () => {
    if (!mapInstanceRef.current) return;
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        mapInstanceRef.current.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        mapInstanceRef.current.setZoom(15);
      },
      (err) => {
        console.warn("Geolocation failed:", err);
        setMapError(true);
        setMapErrorMessage("Location access denied or unavailable.");
      }
    );
  };

  if (mapError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-gray-400 p-8 text-center min-h-[500px]">
        <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
        <h3 className="text-white font-bold text-lg">Map Initialization Failed</h3>
        <p className="text-sm mt-2 text-gray-500 max-w-xs">
          {mapErrorMessage || "Google Maps failed to load. Please check your API key and network connection."}
        </p>
        <button
          onClick={() => {
            setMapError(false);
            setMapErrorMessage(null);
            setReloadCounter((count) => count + 1);
          }}
          className="mt-6 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
        >
          Retry Map Load
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[85vh] rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
      <div ref={mapRef} className="w-full h-full" />

      {/* Map Control Settings Overlay Drawer */}
      <div className="absolute top-4 left-4 z-10 w-64 bg-gray-900/90 backdrop-blur border border-gray-800 text-white rounded-2xl p-4 space-y-3.5 shadow-2xl">
        <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Digital Twin Layers</span>
        </div>

        {/* Heatmap Layer Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-semibold">Incident Heatmap</span>
          </div>
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={(e) => setShowHeatmap(e.target.checked)}
            className="w-8 h-4 bg-gray-700 rounded-full appearance-none checked:bg-purple-600 cursor-pointer relative before:content-[''] before:absolute before:h-3 before:w-3 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-4 transition-all"
          />
        </div>

        {/* City Health Layer Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-semibold">Ward Health overlays</span>
          </div>
          <input
            type="checkbox"
            checked={showHealthLayer}
            onChange={(e) => setShowHealthLayer(e.target.checked)}
            className="w-8 h-4 bg-gray-700 rounded-full appearance-none checked:bg-purple-600 cursor-pointer relative before:content-[''] before:absolute before:h-3 before:w-3 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-4 transition-all"
          />
        </div>

        {/* Predictive hotspots Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-semibold">AI Future Forecasts</span>
          </div>
          <input
            type="checkbox"
            checked={showPredictions}
            onChange={(e) => setShowPredictions(e.target.checked)}
            className="w-8 h-4 bg-gray-700 rounded-full appearance-none checked:bg-purple-600 cursor-pointer relative before:content-[''] before:absolute before:h-3 before:w-3 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-4 transition-all"
          />
        </div>
      </div>

      {/* GPS Location Button */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={panToCurrentLocation}
          className="p-2.5 bg-white rounded-xl shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
          title="Go to My Location"
        >
          <Navigation className="w-4 h-4 text-civic-blue" />
        </button>
      </div>

      {/* Timeline Playback Slider centered at bottom */}
      <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 z-10 w-full max-w-sm mx-auto bg-gray-900/90 backdrop-blur border border-gray-800 text-white rounded-2xl p-4 shadow-2xl flex flex-col gap-2">
        <div className="flex items-center gap-1.5 border-b border-gray-800 pb-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Timeline Playback History</span>
        </div>
        <div className="flex justify-between items-center gap-1 bg-gray-950/50 p-1.5 rounded-xl">
          {[
            { id: "all", label: "All" },
            { id: "today", label: "Today" },
            { id: "yesterday", label: "48h" },
            { id: "week", label: "1w" },
            { id: "month", label: "1m" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeFilter(t.id as any)}
              className={`flex-1 py-1 rounded-lg text-[9px] font-bold uppercase transition-all text-center ${
                timeFilter === t.id
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="text-[10px] text-gray-400 flex items-center justify-between mt-1 px-1">
          <span>Active Markers: <strong>{issueCount}</strong></span>
          <span>Pune Twin View</span>
        </div>
      </div>

      {/* Loading overlay */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-20">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-civic-blue border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-white text-sm font-semibold">Loading Live Digital Twin City Map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CivicMap;
