import { create } from "zustand";
import { IssueDraft, MediaUpload, LocationSelection } from "../types/report.types";
import { AIAnalysisResult } from "../ai/models/types";

interface ReportStore {
  draft: IssueDraft;
  setDraftMedia: (media: MediaUpload | null) => void;
  setDraftLocation: (location: LocationSelection | null) => void;
  setDraftAIAnalysis: (analysis: AIAnalysisResult | null) => void;
  updateAIField: <K extends keyof AIAnalysisResult>(key: K, value: AIAnalysisResult[K]) => void;
  setDraftDetails: (details: { userDescription: string; isAnonymous: boolean; incidentTime: string; tags: string[] }) => void;
  resetDraft: () => void;
}

const initialDraft: IssueDraft = {
  media: null,
  location: null,
  aiAnalysis: null,
  userDescription: "",
  isAnonymous: false,
  incidentTime: new Date().toISOString(),
  tags: [],
};

export const useReportStore = create<ReportStore>((set) => ({
  draft: initialDraft,
  setDraftMedia: (media) =>
    set((state) => ({ draft: { ...state.draft, media } })),
  setDraftLocation: (location) =>
    set((state) => ({ draft: { ...state.draft, location } })),
  setDraftAIAnalysis: (aiAnalysis) =>
    set((state) => ({ draft: { ...state.draft, aiAnalysis } })),
  updateAIField: (key, value) =>
    set((state) => {
      if (!state.draft.aiAnalysis) return state;
      return {
        draft: {
          ...state.draft,
          aiAnalysis: {
            ...state.draft.aiAnalysis,
            [key]: value,
          },
        },
      };
    }),
  setDraftDetails: (details) =>
    set((state) => ({
      draft: {
        ...state.draft,
        ...details,
      },
    })),
  resetDraft: () => set({ draft: initialDraft }),
}));
