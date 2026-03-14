import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Users, Layers, MessageSquare, HelpCircle, ListOrdered, Settings, ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api/frotator";
import type { Route } from "./FrotatorApp";
import type { KeyboardEvent } from "react";

interface Props {
  navigate: (route: Route) => void;
  user: { roles: string[] };
}

function handleCardKeyDown(e: KeyboardEvent, action: () => void) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    action();
  }
}

const NAV_CARDS = [
  {
    title: "Prefrosh List",
    description: "A simple list of all the prefrosh",
    icon: Users,
    route: { page: "frosh-list" } as Route,
  },
  {
    title: "Frosh Flashcards",
    description:
      "Are you a tormented Dabney secretary? Review the frosh with these flashcards.",
    icon: Layers,
    route: { page: "flashcards" } as Route,
  },
  {
    title: "Frosh Quiz",
    description:
      "Prove your frosh comprehension skills. One attempt only!",
    icon: HelpCircle,
    route: { page: "quiz" } as Route,
  },
  {
    title: "Spam",
    description: "Want to spam {secretary} during meetings? You're in luck!",
    icon: MessageSquare,
    route: { page: "spam" } as Route,
  },
];

export default function FrotatorHome({ navigate, user }: Props) {
  const [secretaryName, setSecretaryName] = useState("the secretary");

  useEffect(() => {
    apiFetch<{ name: string | null }>("/secretary")
      .then((data) => {
        if (data.name) setSecretaryName(data.name);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <a
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to Dabney
      </a>
      <h2 className="mb-1 text-3xl font-heading">Welcome to Frotator</h2>
      <p className="mb-1 text-sm italic">"A slight improvement over Froshulator"</p>
      <p className="mb-6 text-sm">
        Remember that only darbs rotating with Dabney should be accessing this
        information. The Honor Code applies.
      </p>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        {NAV_CARDS.map((card) => (
          <Card
            key={card.title}
            role="button"
            tabIndex={card.route ? 0 : undefined}
            aria-disabled={!card.route || undefined}
            className={
              card.route
                ? "cursor-pointer py-4 transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none hover:brightness-110"
                : "py-4 opacity-60"
            }
            onClick={() => card.route && navigate(card.route)}
            onKeyDown={(e) =>
              card.route && handleCardKeyDown(e, () => navigate(card.route!))
            }
          >
            <CardHeader className="my-auto">
              <div className="flex items-center gap-3">
                <card.icon className="size-6 shrink-0" />
                <div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {card.description.replace("{secretary}", secretaryName)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {(user.roles.includes("frotator-bigbad") ||
        user.roles.includes("frotator-admin")) && (
        <div className="mt-4 grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          {user.roles.includes("frotator-bigbad") && (
            <Card
              role="button"
              tabIndex={0}
              className={`cursor-pointer py-4 transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none hover:brightness-110${!user.roles.includes("frotator-admin") ? " md:col-start-1 md:col-end-3 md:mx-auto md:w-full md:max-w-sm" : ""}`}
              onClick={() => navigate({ page: "bigbad" })}
              onKeyDown={(e) =>
                handleCardKeyDown(e, () => navigate({ page: "bigbad" }))
              }
            >
              <CardHeader className="my-auto">
                <div className="flex items-center gap-3">
                  <ListOrdered className="size-6 shrink-0" />
                  <div>
                    <CardTitle className="text-lg">Big Bad List</CardTitle>
                    <CardDescription className="mt-1">Rank your favorite frosh</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}
          {user.roles.includes("frotator-admin") && (
            <Card
              role="button"
              tabIndex={0}
              className={`cursor-pointer py-4 transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none hover:brightness-110${!user.roles.includes("frotator-bigbad") ? " md:col-start-1 md:col-end-3 md:mx-auto md:w-full md:max-w-sm" : ""}`}
              onClick={() => navigate({ page: "admin" })}
              onKeyDown={(e) =>
                handleCardKeyDown(e, () => navigate({ page: "admin" }))
              }
            >
              <CardHeader className="my-auto">
                <div className="flex items-center gap-3">
                  <Settings className="size-6 shrink-0" />
                  <div>
                    <CardTitle className="text-lg">Admin</CardTitle>
                    <CardDescription className="mt-1">Upload/manage frosh data</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
