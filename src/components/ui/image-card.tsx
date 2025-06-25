import { cn } from "@/lib/utils";

type Props = {
  imageUrl: string;
  className?: string;
  children: React.ReactNode;
};

export default function ImageCard({ imageUrl, className, children }: Props) {
  return (
    <figure
      className={cn(
        "w-[250px] overflow-hidden rounded-base border-2 border-border bg-main font-base shadow-shadow",
        className
      )}
    >
      <img className="w-full aspect-4/3" src={imageUrl} alt="image" />
      <figcaption className="border-t-2 text-main-foreground border-border p-4">
        {children}
      </figcaption>
    </figure>
  );
}
