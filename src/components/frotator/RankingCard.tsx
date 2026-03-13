import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, X } from "lucide-react";
import { useRankingStore } from "@/lib/stores/rankingStore";
import type { Frosh } from "@/lib/api/frotator";
import type { Route } from "./FrotatorApp";

interface Props {
  frosh: Frosh;
  rank: number;
  navigate: (route: Route) => void;
}

export default function RankingCard({ frosh, rank, navigate }: Props) {
  const update = useRankingStore((s) => s.update);

  return (
    <div className="flex items-center gap-4 rounded-base border-2 border-border bg-secondary-background p-3 shadow-shadow">
      <div
        className="size-20 shrink-0 cursor-pointer rounded-base bg-cover bg-center"
        style={{
          backgroundImage: frosh.image
            ? `url(${frosh.image})`
            : undefined,
        }}
        onClick={() => navigate({ page: "frosh-detail", id: frosh.id })}
      >
        {!frosh.image && (
          <div className="flex size-full items-center justify-center text-2xl text-foreground/30">
            ?
          </div>
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-heading">{frosh.displayName}</h4>
        <p className="text-xs text-foreground/60">#{rank}</p>
        {frosh.anagram && (
          <p className="text-sm italic">{frosh.anagram}</p>
        )}
      </div>
      <div className="flex gap-1">
        <Button
          size="icon-sm"
          variant="outline"
          onClick={() => update(frosh.id, (frosh.rank ?? 0) + 1)}
        >
          <ArrowUp className="size-4" />
        </Button>
        <Button
          size="icon-sm"
          variant="outline"
          onClick={() => update(frosh.id, (frosh.rank ?? 0) - 1)}
        >
          <ArrowDown className="size-4" />
        </Button>
        <Button
          size="icon-sm"
          variant="destructive"
          onClick={() => update(frosh.id, -1 - (frosh.rank ?? 0))}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
