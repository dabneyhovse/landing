import { create } from "zustand";
import {
  fetchRanking,
  updateRanking,
  type Frosh,
} from "@/lib/api/frotator";
import { toast } from "sonner";

interface RankingState {
  list: Frosh[];
  loading: boolean;
  fetch: () => Promise<void>;
  update: (froshId: number, rank: number) => Promise<void>;
}

export const useRankingStore = create<RankingState>((set) => ({
  list: [],
  loading: false,

  fetch: async () => {
    try {
      set({ loading: true });
      const data = await fetchRanking();
      set({ list: data, loading: false });
    } catch {
      toast.error("There was an error fetching the frosh rankings");
      set({ loading: false });
    }
  },

  update: async (froshId, rank) => {
    try {
      const data = await updateRanking(froshId, rank);
      set({ list: data });
    } catch {
      toast.error("There was an error updating the ranking");
    }
  },
}));
