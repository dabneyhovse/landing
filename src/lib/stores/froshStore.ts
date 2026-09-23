import { create } from "zustand";
import {
  fetchFroshList,
  fetchFroshCards,
  fetchSingleFrosh,
  postComment,
  toggleFavorite,
  type Frosh,
  type FroshComment,
  type SearchParams,
} from "@/lib/api/frotator";
import { toast } from "sonner";

interface FroshState {
  list: Frosh[];
  cards: Frosh[];
  page: number;
  count: number;
  search: SearchParams;
  selectedFrosh: Frosh | null;
  selectedFroshIdx: number;
  loading: boolean;

  fetchFrosh: (search: SearchParams, pageNum: number) => Promise<void>;
  fetchCards: (search: Partial<SearchParams>) => Promise<void>;
  fetchSingle: (id: number) => Promise<void>;
  addComment: (comment: {
    froshId: number;
    text: string;
    anon: boolean;
    userId: string;
  }) => Promise<void>;
  toggleFav: (froshId: number, favorite: boolean) => Promise<void>;
  setSearch: (search: SearchParams) => void;
  setPage: (page: number) => void;
}

export const useFroshStore = create<FroshState>((set, get) => ({
  list: [],
  cards: [],
  page: 1,
  count: 1,
  search: {
    dinnerGroup: "any",
    name: "",
    anagram: "",
    sort: "alphabetical",
  },
  selectedFrosh: null,
  selectedFroshIdx: 0,
  loading: false,

  fetchFrosh: async (search, pageNum) => {
    try {
      set({ loading: true });
      const data = await fetchFroshList(search, pageNum);
      set({ list: data.rows, count: data.count, loading: false });
    } catch {
      toast.error("There was an error fetching the frosh");
      set({ loading: false });
    }
  },

  fetchCards: async (search) => {
    try {
      const data = await fetchFroshCards(search);
      set({ cards: data.rows });
    } catch {
      toast.error("There was an error fetching flashcards");
    }
  },

  fetchSingle: async (id) => {
    try {
      set({ loading: true });
      const frosh = await fetchSingleFrosh(id);
      const idx = get().list.findIndex((f) => f.id === frosh.id);
      set({ selectedFrosh: frosh, selectedFroshIdx: idx, loading: false });
    } catch {
      toast.error("There was an error fetching this frosh.");
      set({ loading: false });
    }
  },

  addComment: async (comment) => {
    try {
      const newComment = await postComment(comment);
      const current = get().selectedFrosh;
      if (current) {
        set({
          selectedFrosh: {
            ...current,
            "frotator-comments": [
              ...current["frotator-comments"],
              newComment,
            ],
          },
        });
      }
    } catch {
      toast.error("There was an error posting your comment");
    }
  },

  toggleFav: async (froshId, favorite) => {
    try {
      await toggleFavorite(froshId, favorite);
      const current = get().selectedFrosh;
      if (current) {
        set({ selectedFrosh: { ...current, favorite } });
      }
    } catch {
      toast.error("There was an error favoriting this frosh");
    }
  },

  setSearch: (search) => set({ search }),
  setPage: (page) => set({ page }),
}));
