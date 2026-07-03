import { create } from "zustand";

interface MapViewport {
  lat: number;
  lng: number;
  zoom: number;
}

interface MapFilters {
  categories: string[];
  severities: string[];
  days: number; // e.g. 7, 30, 90
}

interface MapStore {
  viewport: MapViewport;
  activeLayers: string[]; // e.g., ["issues", "heatmap"]
  filters: MapFilters;
  selectedIssueId: string | null;
  setViewport: (viewport: MapViewport) => void;
  toggleLayer: (layer: string) => void;
  setFilters: (filters: Partial<MapFilters>) => void;
  setSelectedIssueId: (id: string | null) => void;
  resetFilters: () => void;
}

const defaultViewport: MapViewport = {
  lat: 18.5204, // Default Pune lat
  lng: 73.8567, // Default Pune lng
  zoom: 13,
};

const defaultFilters: MapFilters = {
  categories: [],
  severities: [],
  days: 30,
};

export const useMapStore = create<MapStore>((set) => ({
  viewport: defaultViewport,
  activeLayers: ["issues"],
  filters: defaultFilters,
  selectedIssueId: null,
  setViewport: (viewport) => set({ viewport }),
  toggleLayer: (layer) =>
    set((state) => ({
      activeLayers: state.activeLayers.includes(layer)
        ? state.activeLayers.filter((l) => l !== layer)
        : [...state.activeLayers, layer],
    })),
  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  setSelectedIssueId: (selectedIssueId) => set({ selectedIssueId }),
  resetFilters: () => set({ filters: defaultFilters }),
}));
