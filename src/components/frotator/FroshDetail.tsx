import { useEffect, useState } from "react";
import { useFroshStore } from "@/lib/stores/froshStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Heart, ChevronLeft, ChevronRight, ArrowLeft, List } from "lucide-react";
import CommentItem from "./CommentItem";
import type { Route } from "./FrotatorApp";

interface Props {
  froshId: number;
  navigate: (route: Route) => void;
  goBack: () => void;
  user: {
    sub: string;
    name: string;
    picture?: string;
  };
}

export default function FroshDetail({ froshId, navigate, goBack, user }: Props) {
  const {
    selectedFrosh: frosh,
    selectedFroshIdx,
    list,
    fetchSingle,
    addComment,
    toggleFav,
    loading,
  } = useFroshStore();

  const [newComment, setNewComment] = useState({ text: "", anon: true });

  useEffect(() => {
    fetchSingle(froshId);
  }, [froshId]);

  if (loading || !frosh || !frosh.bio) {
    return <div className="py-12 text-center text-sm">Loading...</div>;
  }

  const handleShift = (amount: number) => {
    if (list.length === 0) return;
    let idx = selectedFroshIdx + amount;
    if (selectedFroshIdx === -1) idx = 0;
    else if (idx < 0) idx = list.length - 1;
    else if (idx >= list.length) idx = 0;
    navigate({ page: "frosh-detail", id: list[idx].id });
  };

  const handlePost = () => {
    if (!newComment.text.trim()) return;
    addComment({
      froshId,
      text: newComment.text,
      anon: newComment.anon,
      userId: user.sub,
    });
    setNewComment({ text: "", anon: true });
  };

  const bioFields = [
    { label: "Hometown", value: frosh.bio.hometown },
    { label: "Intended major", value: frosh.bio.major },
    { label: "Hobbies", value: frosh.bio.hobbies },
    { label: "Clubs they might join", value: frosh.bio.clubs },
    { label: "Funfact", value: frosh.bio.funfact },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={goBack}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ page: "frosh-list" })}
        >
          <List className="size-4" /> Frosh List
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleShift(-1)}>
          <ChevronLeft className="size-4" /> Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleShift(1)}>
          Next <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        {/* Profile card */}
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6">
            {frosh.image ? (
              <img
                src={frosh.image}
                alt={frosh.displayName}
                className="w-48 rounded-base border-2 border-border"
              />
            ) : (
              <div className="flex size-48 items-center justify-center rounded-base border-2 border-border bg-secondary-background text-5xl text-foreground/30">
                ?
              </div>
            )}
            <div className="text-center">
              <h2 className="text-2xl font-heading">{frosh.displayName}</h2>
              {frosh.anagram && (
                <p className="text-sm italic">"{frosh.anagram}"</p>
              )}
              <Separator className="my-2" />
              <p className="text-sm">{frosh.pronouns}</p>
              <p className="text-sm">Dinner Group {frosh.dinnerGroup}</p>
            </div>
            <Button
              variant={frosh.favorite ? "default" : "outline"}
              onClick={() => toggleFav(froshId, !frosh.favorite)}
            >
              <Heart
                className={`size-4 ${frosh.favorite ? "fill-current" : ""}`}
              />
              {frosh.favorite ? "Unfavorite" : "Favorite"} this prefr*sh
            </Button>
          </CardContent>
        </Card>

        {/* Bio card */}
        <Card>
          <CardHeader>
            <CardTitle>Prefr*sh Bio</CardTitle>
          </CardHeader>
          <CardContent>
            {bioFields.map((field, i) => (
              <div key={field.label}>
                {i > 0 && <Separator className="my-3" />}
                <div className="grid grid-cols-[120px_1fr] gap-2 sm:grid-cols-[160px_1fr]">
                  <span className="text-sm font-medium">{field.label}</span>
                  <span className="text-sm">
                    {field.value || "no information"}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Comments */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            Comments ({frosh["frotator-comments"].length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-3xl">
            {frosh["frotator-comments"].map((c) => (
              <CommentItem key={c.id} comment={c} />
            ))}

            <div className="mt-4 flex gap-3">
              <Avatar>
                <AvatarImage
                  src={user.picture || "/resources/images/defaultProfile.png"}
                  alt="avatar"
                />
                <AvatarFallback>
                  {user.name?.[0]?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Write a comment..."
                  rows={3}
                  value={newComment.text}
                  onChange={(e) =>
                    setNewComment((s) => ({ ...s, text: e.target.value }))
                  }
                />
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="anon-check"
                      checked={newComment.anon}
                      onCheckedChange={(v) =>
                        setNewComment((s) => ({ ...s, anon: !!v }))
                      }
                    />
                    <label htmlFor="anon-check" className="text-sm">
                      Anonymous
                    </label>
                  </div>
                  <Button size="sm" onClick={handlePost}>
                    Post comment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
