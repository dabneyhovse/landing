import { useEffect, useState, useCallback } from "react";
import { useFroshStore } from "@/lib/stores/froshStore";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Shuffle, ArrowLeft } from "lucide-react";
import type { Route } from "./FrotatorApp";

interface Props {
  navigate: (route: Route) => void;
}

const DINNER_GROUPS = [
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

export default function FlashcardView({ navigate }: Props) {
  const { cards, fetchCards } = useFroshStore();
  const filteredCards = cards.filter((f) => f.image?.trim());

  const [dinnerGroup, setDinnerGroup] = useState("any");
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const doFetch = useCallback(
    (dg: string) => {
      fetchCards({ dinnerGroup: dg, sort: "6" });
      setCurrent(0);
      setFlipped(false);
    },
    [fetchCards],
  );

  useEffect(() => {
    doFetch(dinnerGroup);
  }, []);

  const goPrev = () => {
    setFlipped(false);
    setCurrent((c) => (c <= 0 ? filteredCards.length - 1 : c - 1));
  };

  const goNext = () => {
    setFlipped(false);
    setCurrent((c) => (c >= filteredCards.length - 1 ? 0 : c + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goPrev();
    else if (e.key === "ArrowRight") goNext();
    else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      setFlipped((f) => !f);
    }
  };

  const frosh = filteredCards[current];

  return (
    <div
      className="outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <Button
        variant="outline"
        size="sm"
        className="mb-4"
        onClick={() => navigate({ page: "home" })}
      >
        <ArrowLeft className="size-4" /> Back
      </Button>

      <div className="mb-4 flex items-center justify-center gap-3">
        <Select
          value={dinnerGroup}
          onValueChange={(v) => {
            setDinnerGroup(v);
            doFetch(v);
          }}
        >
          <SelectTrigger className="w-40 border-current bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DINNER_GROUPS.map((g) => (
              <SelectItem key={g.value} value={g.value}>
                {g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => doFetch(dinnerGroup)}
        >
          <Shuffle className="size-4" /> Reshuffle
        </Button>
      </div>

      {frosh ? (
        <div
          className="mx-auto mb-4 w-full max-w-xl cursor-pointer"
          style={{ perspective: "1000px" }}
          onClick={() => setFlipped((f) => !f)}
        >
          <div
            className="relative transition-transform duration-500"
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front */}
            <div
              className="rounded-base border-4 border-border shadow-shadow"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div
                className="aspect-square w-full rounded-base bg-cover bg-center"
                style={{ backgroundImage: `url(${frosh.image})` }}
              />
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-base border-4 border-border bg-secondary-background p-6 shadow-shadow"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              {flipped && (
                <>
                  <p className="text-3xl font-heading">{frosh.displayName}</p>
                  <p className="mt-1 text-sm">{frosh.pronouns}</p>
                  <p className="mt-3 text-center text-sm italic">
                    "{frosh.bio.funfact}"
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="py-12 text-center text-sm">No flashcards available.</p>
      )}

      <div className="flex justify-center gap-3">
        <Button variant="outline" className="w-28" onClick={goPrev}>
          <ChevronLeft className="size-4" /> Previous
        </Button>
        <Button variant="outline" className="w-28" onClick={goNext}>
          Next <ChevronRight className="size-4" />
        </Button>
      </div>

      {filteredCards.length > 0 && (
        <p className="mt-2 text-center text-xs text-foreground/60">
          {current + 1} / {filteredCards.length}
        </p>
      )}
    </div>
  );
}
