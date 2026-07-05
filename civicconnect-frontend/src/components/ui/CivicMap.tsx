import React, { useEffect } from "react";
import {
  MapContainer, TileLayer, Marker, Popup,
  LayersControl, Circle, ZoomControl, ScaleControl,
  LayerGroup, useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ── Leaflet default-icon fix ────────────────────────────────────────────── */
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: "data:,", iconRetinaUrl: "data:,", shadowUrl: "data:," });

/* ── Types ───────────────────────────────────────────────────────────────── */
type IssueType = "road" | "water" | "power" | "waste";

interface Incident {
  id: string; lat: number; lng: number; type: IssueType;
  label: string; priority: "Critical" | "High" | "Medium" | "Low";
  dept: string; status: string; ward: string; time: string;
}

/* ── Incidents data (Pune) ───────────────────────────────────────────────── */
const INCIDENTS: Incident[] = [
  { id:"INC-901", lat:18.5204, lng:73.8567, type:"road",  label:"Pothole — FC Road",            priority:"Critical", dept:"Public Works Dept",   status:"In Progress",    ward:"Ward 12", time:"14 min ago" },
  { id:"INC-902", lat:18.5314, lng:73.8446, type:"water", label:"Water Leak — Aundh Road",       priority:"High",     dept:"Water Supply Board",  status:"Assigned",       ward:"Ward 7",  time:"22 min ago" },
  { id:"INC-903", lat:18.5424, lng:73.8560, type:"power", label:"Streetlights Out — Baner",      priority:"Medium",   dept:"MSEDCL",              status:"Resolved",       ward:"Ward 9",  time:"1 hr ago"   },
  { id:"INC-904", lat:18.5120, lng:73.8706, type:"waste", label:"Bin Overflow — Bibwewadi",      priority:"Medium",   dept:"Solid Waste Dept",    status:"In Progress",    ward:"Ward 18", time:"35 min ago" },
  { id:"INC-905", lat:18.5480, lng:73.8680, type:"road",  label:"Open Manhole — Wakad",          priority:"Critical", dept:"Public Works Dept",   status:"Critical Alert", ward:"Ward 3",  time:"8 min ago"  },
  { id:"INC-906", lat:18.5050, lng:73.8600, type:"water", label:"Sewage Overflow — Katraj",      priority:"High",     dept:"Water Supply Board",  status:"Under Review",   ward:"Ward 24", time:"45 min ago" },
  { id:"INC-907", lat:18.5280, lng:73.8500, type:"road",  label:"Broken Footpath — Karve Rd",   priority:"Low",      dept:"Public Works Dept",   status:"Resolved",       ward:"Ward 15", time:"2 hr ago"   },
  { id:"INC-908", lat:18.5350, lng:73.8750, type:"power", label:"Transformer Fault — Kothrud",  priority:"High",     dept:"MSEDCL",              status:"Critical Alert", ward:"Ward 14", time:"18 min ago" },
  { id:"INC-909", lat:18.5100, lng:73.8450, type:"waste", label:"Garbage Dump — Swargate",      priority:"Medium",   dept:"Solid Waste Dept",    status:"Assigned",       ward:"Ward 21", time:"1.5 hr ago" },
  { id:"INC-910", lat:18.5460, lng:73.8400, type:"road",  label:"Tree Fallen — Hinjewadi",      priority:"Critical", dept:"Parks & Gardens",     status:"In Progress",    ward:"Ward 6",  time:"5 min ago"  },
  { id:"INC-911", lat:18.5180, lng:73.8800, type:"water", label:"Low Pressure — Hadapsar",      priority:"Medium",   dept:"Water Supply Board",  status:"Under Review",   ward:"Ward 28", time:"3 hr ago"   },
  { id:"INC-912", lat:18.5380, lng:73.8620, type:"power", label:"Hanging Wires — Shivajinagar", priority:"Critical", dept:"MSEDCL",              status:"Critical Alert", ward:"Ward 11", time:"3 min ago"  },
];

const TYPE_COLOR: Record<IssueType, string> = {
  road: "#F97316", water: "#3B82F6", power: "#EAB308", waste: "#22C55E",
};

const PRIORITY_COLOR: Record<string, string> = {
  Critical: "#EF4444", High: "#F97316", Medium: "#EAB308", Low: "#22C55E",
};

const STATUS_COLOR: Record<string, string> = {
  "Resolved": "#10B981", "In Progress": "#3B82F6", "Assigned": "#A78BFA",
  "Under Review": "#F59E0B", "Critical Alert": "#EF4444",
};

/* ── Custom icon factory ─────────────────────────────────────────────────── */
function makeIcon(type: IssueType, priority: string) {
  const color = priority === "Critical" ? "#EF4444" : TYPE_COLOR[type] || "#9AA3B8";
  const s     = priority === "Critical" ? 16 : 12;
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:${s}px;height:${s}px;">
      <div style="position:absolute;inset:-5px;border-radius:50%;background:${color};opacity:0.22;animation:cmPulse 2s ease-out infinite;"></div>
      <div style="position:absolute;inset:0;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.9);box-shadow:0 0 8px ${color}88;"></div>
    </div>`,
    iconSize: [s, s], iconAnchor: [s / 2, s / 2], popupAnchor: [0, -(s + 4)],
  });
}

/* ── Dark-theme CSS injector ─────────────────────────────────────────────── */
function MapStyler() {
  useEffect(() => {
    const ID = "civic-map-style";
    if (document.getElementById(ID)) return;
    const el = document.createElement("style");
    el.id = ID;
    el.textContent = `
      @keyframes cmPulse{0%{transform:scale(1);opacity:.28}70%{transform:scale(2.8);opacity:0}100%{transform:scale(1);opacity:0}}
      .leaflet-popup-content-wrapper{background:#0E1726!important;border:1px solid rgba(255,255,255,.1)!important;border-radius:12px!important;box-shadow:0 24px 60px rgba(0,0,0,.6)!important;color:#fff!important;padding:0!important}
      .leaflet-popup-tip{background:#0E1726!important}
      .leaflet-popup-content{margin:0!important;padding:0!important}
      .leaflet-popup-close-button{color:#6B7280!important;top:8px!important;right:8px!important}
      .leaflet-control-layers{background:#0E1726!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:10px!important;padding:8px 12px!important}
      .leaflet-control-layers label{color:#9AA3B8!important;font-size:11px!important;font-weight:600!important}
      .leaflet-control-layers-separator{border-color:rgba(255,255,255,.08)!important}
      .leaflet-bar a{background:#0E1726!important;color:#F5F7FA!important;border-color:rgba(255,255,255,.1)!important;font-weight:700!important}
      .leaflet-bar a:hover{background:#1E293B!important}
      .leaflet-control-attribution{background:rgba(8,17,31,.75)!important;color:#4B5563!important;font-size:9px!important}
      .leaflet-control-attribution a{color:#10D977!important}
      .leaflet-control-scale-line{background:rgba(8,17,31,.8)!important;border-color:rgba(255,255,255,.15)!important;color:#6B7280!important}
    `;
    document.head.appendChild(el);
    return () => { document.getElementById(ID)?.remove(); };
  }, []);
  return null;
}

/* ── Locate button (uses useMap hook) ───────────────────────────────────── */
function LocateBtn() {
  const map = useMap();
  return (
    <div className="leaflet-bottom leaflet-left" style={{ marginLeft: 10, marginBottom: 36 }}>
      <div className="leaflet-control leaflet-bar">
        <button
          title="My location"
          onClick={() => map.locate({ setView: true, maxZoom: 14 })}
          style={{ background: "#0E1726", border: "none", width: 30, height: 30, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10D977"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
            <circle cx="12" cy="12" r="8" strokeOpacity=".3"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ── Popup card ──────────────────────────────────────────────────────────── */
function IncidentPopup({ inc }: { inc: Incident }) {
  const rows: [string, string, string][] = [
    ["Status",     inc.status, STATUS_COLOR[inc.status] || "#9AA3B8"],
    ["Department", inc.dept,   "#9AA3B8"],
    ["Ward",       inc.ward,   "#9AA3B8"],
    ["Reported",   inc.time,   "#10D977"],
  ];
  return (
    <div style={{ padding: "14px 16px", minWidth: 210, fontFamily: "inherit" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 900, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>{inc.id}</span>
        <span style={{ fontSize: 9, fontWeight: 800, color: PRIORITY_COLOR[inc.priority],
          background: PRIORITY_COLOR[inc.priority] + "22", padding: "2px 7px", borderRadius: 4 }}>
          {inc.priority}
        </span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#F5F7FA", margin: "0 0 10px", lineHeight: 1.3 }}>{inc.label}</p>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "5px 14px", fontSize: 10 }}>
        {rows.map(([k, v, c]) => (
          <React.Fragment key={k}>
            <span style={{ color: "#4B5563", fontWeight: 600 }}>{k}</span>
            <span style={{ color: c, fontWeight: 700 }}>{v}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ── Tile URLs ───────────────────────────────────────────────────────────── */
const DARK   = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const STREET = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

/* ── Main export ─────────────────────────────────────────────────────────── */
export const CivicMap: React.FC<{ height?: number }> = ({ height = 300 }) => {
  const by = (t: IssueType) => INCIDENTS.filter(i => i.type === t);

  const LAYERS: [IssueType, string][] = [
    ["road",  "🟠 Road Issues"],
    ["water", "🔵 Water Issues"],
    ["power", "🟡 Power / Electrical"],
    ["waste", "🟢 Solid Waste"],
  ];

  return (
    <div style={{ height, borderRadius: 16, overflow: "hidden" }}>
      <MapContainer
        center={[18.5204, 73.8567]} zoom={12}
        style={{ height: "100%", width: "100%", background: "#06101C" }}
        zoomControl={false} scrollWheelZoom={false}
      >
        <MapStyler />

        <LayersControl position="topright">
          {/* Base layers */}
          <LayersControl.BaseLayer checked name="Dark (GIS)">
            <TileLayer url={DARK} maxZoom={19}
              attribution='&copy; <a href="https://carto.com">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>'
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Street Map">
            <TileLayer url={STREET} attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>' />
          </LayersControl.BaseLayer>

          {/* Issue-type overlays */}
          {LAYERS.map(([type, name]) => (
            <LayersControl.Overlay key={type} checked name={name}>
              <LayerGroup>
                {by(type).map(inc => (
                  <Marker key={inc.id} position={[inc.lat, inc.lng]} icon={makeIcon(inc.type, inc.priority)}>
                    <Popup maxWidth={240}><IncidentPopup inc={inc} /></Popup>
                  </Marker>
                ))}
              </LayerGroup>
            </LayersControl.Overlay>
          ))}

          {/* Density heatmap */}
          <LayersControl.Overlay name="🌡️ Density Heatmap">
            <LayerGroup>
              {INCIDENTS.map(inc => (
                <Circle key={`h-${inc.id}`} center={[inc.lat, inc.lng]} radius={380}
                  pathOptions={{
                    color: "transparent",
                    fillColor: inc.priority === "Critical" ? "#EF4444" : TYPE_COLOR[inc.type],
                    fillOpacity: 0.15,
                  }}
                />
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
        </LayersControl>

        <ZoomControl position="bottomright" />
        <ScaleControl position="bottomleft" imperial={false} />
        <LocateBtn />
      </MapContainer>
    </div>
  );
};

export default CivicMap;
