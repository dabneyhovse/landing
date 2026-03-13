import type { Frosh } from "@/lib/api/frotator";

interface Props {
  frosh: Frosh;
  onClick: () => void;
}

export default function FroshCard({ frosh, onClick }: Props) {
  return (
    <div
      className="cursor-pointer overflow-hidden rounded-base border-2 border-border shadow-shadow transition-transform hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
      onClick={onClick}
    >
      <div
        className="aspect-square w-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: frosh.image
            ? `url(${frosh.image})`
            : undefined,
        }}
      >
        {!frosh.image && (
          <div className="flex size-full items-center justify-center bg-secondary-background text-4xl text-foreground/30">
            ?
          </div>
        )}
      </div>
      <div className="bg-secondary-background p-3 text-center">
        <p className="truncate text-sm font-heading">{frosh.displayName}</p>
      </div>
    </div>
  );
}
