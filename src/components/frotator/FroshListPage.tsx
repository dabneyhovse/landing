import { useState, type FormEvent } from "react";
import { useFroshStore } from "@/lib/stores/froshStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ArrowLeft } from "lucide-react";
import FroshGrid from "./FroshGrid";
import type { Route } from "./FrotatorApp";
import type { SearchParams } from "@/lib/api/frotator";

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

interface Props {
  navigate: (route: Route) => void;
  user: { roles: string[] };
}

export default function FroshListPage({ navigate, user }: Props) {
  const {
    list,
    page,
    count,
    search,
    fetchFrosh,
    setSearch,
    setPage,
  } = useFroshStore();

  const [sheetOpen, setSheetOpen] = useState(false);
  const hasAdvSort = user.roles.includes("frotator-adv-sort");

  const updateField = (name: string, value: string | boolean) => {
    setSearch({ ...search, [name]: value } as SearchParams);
  };

  const doSearch = (e?: FormEvent) => {
    e?.preventDefault();
    setSheetOpen(false);
    setPage(1);
    fetchFrosh(search, 1);
  };

  const goToPage = (p: number) => {
    setPage(p);
    fetchFrosh(search, p);
  };

  return (
    <div>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Advanced Search Options</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 p-4">
            <FieldGroup label="Name">
              <Input
                value={search.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Enter Name"
              />
            </FieldGroup>
            <FieldGroup label="Anagram">
              <Input
                value={search.anagram}
                onChange={(e) => updateField("anagram", e.target.value)}
                placeholder="Enter Anagram"
              />
            </FieldGroup>
            <DinnerGroupSelect
              value={search.dinnerGroup}
              onChange={(v) => updateField("dinnerGroup", v)}
            />
            <SortSelect
              value={search.sort}
              onChange={(v) => updateField("sort", v)}
              showAdvanced={hasAdvSort}
            />
            <Card className="py-4 gap-2">
              <CardHeader>
                <CardTitle className="text-sm">Prefr*sh Bio Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(
                  [
                    ["bio-hometown", "Hometown"],
                    ["bio-major", "Major"],
                    ["bio-hobbies", "Hobbies"],
                    ["bio-clubs", "Clubs"],
                    ["bio-funfact", "Funfact"],
                  ] as const
                ).map(([field, label]) => (
                  <FieldGroup key={field} label={label}>
                    <Input
                      value={
                        (search as unknown as Record<string, string>)[field] ?? ""
                      }
                      onChange={(e) => updateField(field, e.target.value)}
                      placeholder={`Enter ${label}`}
                    />
                  </FieldGroup>
                ))}
              </CardContent>
            </Card>
            <Button onClick={() => doSearch()}>Search</Button>
          </div>
        </SheetContent>
      </Sheet>

      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate({ page: "home" })}
        className="mb-4"
      >
        <ArrowLeft className="size-4" /> Back
      </Button>
      <h1 className="mb-4 text-3xl font-heading">Prefr*sh List</h1>

      <Accordion type="single" collapsible className="mb-6">
        <AccordionItem value="search">
          <AccordionTrigger>Search Options</AccordionTrigger>
          <AccordionContent>
            <form onSubmit={doSearch} className="space-y-4">
              <FieldGroup label="Name">
                <Input
                  value={search.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Enter Name"
                />
              </FieldGroup>
              <DinnerGroupSelect
                value={search.dinnerGroup}
                onChange={(v) => updateField("dinnerGroup", v)}
              />
              <SortSelect
                value={search.sort}
                onChange={(v) => updateField("sort", v)}
                showAdvanced={hasAdvSort}
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="favorites-only"
                  checked={search.only_my_favorites ?? false}
                  onCheckedChange={(checked) =>
                    updateField("only_my_favorites", !!checked)
                  }
                />
                <label htmlFor="favorites-only" className="text-sm">
                  Show only my favorites
                </label>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Search</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSheetOpen(true)}
                >
                  Advanced Search
                </Button>
              </div>
            </form>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <FroshGrid frosh={list} navigate={navigate} />

      {count > 0 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => page > 1 && goToPage(page - 1)}
                className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {page > 1 && (
              <PaginationItem>
                <PaginationLink onClick={() => goToPage(page - 1)} className="cursor-pointer">
                  {page - 1}
                </PaginationLink>
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink isActive>{page}</PaginationLink>
            </PaginationItem>
            {page < count && (
              <PaginationItem>
                <PaginationLink onClick={() => goToPage(page + 1)} className="cursor-pointer">
                  {page + 1}
                </PaginationLink>
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() => page < count && goToPage(page + 1)}
                className={page >= count ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function DinnerGroupSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <FieldGroup label="Dinner Group">
      <Select value={value} onValueChange={onChange}>
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
    </FieldGroup>
  );
}

function SortSelect({
  value,
  onChange,
  showAdvanced,
}: {
  value: string;
  onChange: (v: string) => void;
  showAdvanced: boolean;
}) {
  return (
    <FieldGroup label="Sort">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Default</SelectItem>
          <SelectItem value="1">Alphabetical</SelectItem>
          {showAdvanced && (
            <>
              <SelectItem value="2">Most Comments</SelectItem>
              <SelectItem value="3">Least Comments</SelectItem>
              <SelectItem value="4">Most Favorites</SelectItem>
              <SelectItem value="5">Least Favorites</SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
    </FieldGroup>
  );
}
