import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { FroshComment } from "@/lib/api/frotator";

interface Props {
  comment: FroshComment;
  spam?: boolean;
}

export default function CommentItem({ comment, spam }: Props) {
  return (
    <>
      <div className="flex gap-3 p-4">
        {!spam && (
          <Avatar>
            <AvatarImage src={comment.from.picture} alt="avatar" />
            <AvatarFallback>
              {comment.from.name?.[0]?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
        )}
        <div>
          <p className="mb-1 text-sm font-heading">{comment.from.name}</p>
          {comment.text.split("\n").map((line, i) => (
            <p key={i} className="mb-0 text-sm">
              {line}
            </p>
          ))}
        </div>
      </div>
      <Separator />
    </>
  );
}
