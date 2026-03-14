import { useEffect, useState, type FormEvent } from "react";
import { useRankingStore } from "@/lib/stores/rankingStore";
import { useFroshStore } from "@/lib/stores/froshStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import RankingCard from "./RankingCard";
import FroshCard from "./FroshCard";
import { ArrowLeft } from "lucide-react";
import type { Route } from "./FrotatorApp";
import type { SearchParams } from "@/lib/api/frotator";
import { DINNER_GROUPS, SORT_LABELS, type SortOption } from "@/lib/constants";

interface Props {
  navigate: (route: Route) => void;
  user: { roles: string[] };
}

export default function BigBadPage({ navigate, user }: Props) {
  const { list: rankingList, fetch: fetchRankingList } = useRankingStore();
  const {
    list: froshList,
    page,
    count,
    search,
    fetchFrosh,
    setSearch,
    setPage,
  } = useFroshStore();

  const [sheetOpen, setSheetOpen] = useState(false);

  const rankingUpdate = useRankingStore((s) => s.update);

  useEffect(() => {
    fetchRankingList();
    fetchFrosh(search, 1);
  }, []);

  const updateField = (name: string, value: string) => {
    setSearch({ ...search, [name]: value } as SearchParams);
  };

  const doSearch = (e?: FormEvent) => {
    e?.preventDefault();
    setPage(1);
    fetchFrosh(search, 1);
  };

  const goToPage = (p: number) => {
    setPage(p);
    fetchFrosh(search, p);
  };

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        className="mb-4"
        onClick={() => navigate({ page: "home" })}
      >
        <ArrowLeft className="size-4" /> Back
      </Button>

      <h1 className="mb-4 text-3xl font-heading">Big Bad List</h1>

      <Button className="mb-4" onClick={() => setSheetOpen(true)}>
        Prefrosh List
      </Button>

      <div className="space-y-3">
        {rankingList.map((frosh, i) => (
          <RankingCard
            key={frosh.id}
            frosh={frosh}
            rank={i + 1}
            navigate={navigate}
          />
        ))}
        {rankingList.length === 0 && (
          <p className="py-8 text-center text-sm text-foreground/60">
            No frosh ranked yet. Open the Prefrosh List to add some.
          </p>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Prefrosh List</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <Accordion type="single" collapsible className="mb-4">
              <AccordionItem value="search">
                <AccordionTrigger>Search Options</AccordionTrigger>
                <AccordionContent>
                  <form onSubmit={doSearch} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        value={search.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        placeholder="Enter Name"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">
                        Dinner Group
                      </label>
                      <Select
                        value={search.dinnerGroup}
                        onValueChange={(v) => updateField("dinnerGroup", v)}
                      >
                        <SelectTrigger className="w-full">
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
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Sort</label>
                      <Select
                        value={search.sort}
                        onValueChange={(v) => updateField("sort", v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" size="sm">
                      Search
                    </Button>
                  </form>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="divide-y divide-border/50">
              {froshList.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 py-2.5"
                >
                  <div
                    className="size-12 shrink-0 rounded bg-cover bg-center"
                    style={{
                      backgroundImage: f.image
                        ? `url(${f.image})`
                        : undefined,
                    }}
                  >
                    {!f.image && (
                      <div className="flex size-full items-center justify-center text-lg text-foreground/30">
                        ?
                      </div>
                    )}
                  </div>
                  <span className="flex-1 truncate text-sm font-medium">
                    {f.displayName}
                  </span>
                  <Button
                    size="xs"
                    onClick={() => rankingUpdate(f.id, 0)}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>

            {count > 0 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => page > 1 && goToPage(page - 1)}
                      className={
                        page <= 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink isActive>{page}</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        page < count && goToPage(page + 1)
                      }
                      className={
                        page >= count
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
