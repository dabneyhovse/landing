import type { Frosh } from "@/lib/api/frotator";
import FroshCard from "./FroshCard";
import type { Route } from "./FrotatorApp";

interface Props {
  frosh: Frosh[];
  navigate: (route: Route) => void;
  onAdd?: (frosh: Frosh) => void;
}

export default function FroshGrid({ frosh, navigate, onAdd }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {frosh.map((f) => (
        <FroshCard
          key={f.id}
          frosh={f}
          onClick={() => {
            if (onAdd) {
              onAdd(f);
            } else {
              navigate({ page: "frosh-detail", id: f.id });
            }
          }}
        />
      ))}
    </div>
  );
}
