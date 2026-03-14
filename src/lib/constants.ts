export const DEFAULT_PROFILE_IMAGE = "/images/defaultProfile.png";

export const SORT = {
  alphabetical: "alphabetical",
  mostComments: "most-comments",
  leastComments: "least-comments",
  mostFavorites: "most-favorites",
  leastFavorites: "least-favorites",
  random: "random",
} as const;

export type SortOption = (typeof SORT)[keyof typeof SORT];

export const SORT_LABELS: Record<SortOption, string> = {
  [SORT.alphabetical]: "Alphabetical",
  [SORT.mostComments]: "Most Comments",
  [SORT.leastComments]: "Least Comments",
  [SORT.mostFavorites]: "Most Favorites",
  [SORT.leastFavorites]: "Least Favorites",
  [SORT.random]: "Random",
};

export const DINNER_GROUPS = [
  { value: "any", label: "Any Dinner" },
  { value: "A", label: "Dinner A" },
  { value: "B", label: "Dinner B" },
  { value: "C", label: "Dinner C" },
  { value: "D", label: "Dinner D" },
  { value: "E", label: "Dinner E" },
  { value: "F", label: "Dinner F" },
  { value: "G", label: "Dinner G" },
  { value: "H", label: "Dinner H" },
];
