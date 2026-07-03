/**
 * Returns a colored CSS class string for a severity level.
 * Used for dynamic marker HTML element class generation.
 */
export function getSeverityMarkerClass(severity: string): string {
  switch (severity) {
    case "critical":
      return "marker-critical";
    case "high":
      return "marker-high";
    case "medium":
      return "marker-medium";
    case "low":
      return "marker-low";
    default:
      return "marker-medium";
  }
}

/**
 * Creates the HTML element used as the content of a Google Maps AdvancedMarkerElement.
 */
export function createMarkerElement(severity: string, category: string, status?: string): HTMLElement {
  const div = document.createElement("div");
  
  let modifierClass = "";
  if (status === "resolved") modifierClass = "marker-resolved";
  else if (status === "closed") modifierClass = "marker-closed";

  div.className = `civic-map-marker ${getSeverityMarkerClass(severity)} ${modifierClass}`;

  // Add pulsing ring for active critical issues
  if (severity === "critical" && status !== "resolved" && status !== "closed") {
    div.innerHTML = `<div class="marker-pulse"></div><span class="marker-dot"></span>`;
  } else {
    div.innerHTML = `<span class="marker-dot"></span>`;
  }

  div.title = `${category} — ${severity} priority (${status || "active"})`;
  return div;
}
