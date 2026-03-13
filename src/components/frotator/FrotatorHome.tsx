import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Users, Layers, MessageSquare, HelpCircle } from "lucide-react";
import type { Route } from "./FrotatorApp";

interface Props {
  navigate: (route: Route) => void;
  user: { roles: string[] };
}

const NAV_CARDS = [
  {
    title: "Prefro*h List",
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
      "Prove your frosh comprehension skills. Will not be available until the end of rotation nears.",
    icon: HelpCircle,
    route: null,
  },
  {
    title: "Spam",
    description: "Want to spam Alanna during meetings? You're in luck!",
    icon: MessageSquare,
    route: { page: "spam" } as Route,
  },
];

export default function FrotatorHome({ navigate, user }: Props) {
  return (
    <div>
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
            className={
              card.route
                ? "cursor-pointer transition-transform hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
                : "opacity-60"
            }
            onClick={() => card.route && navigate(card.route)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <card.icon className="size-6 shrink-0" />
                <div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {card.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {user.roles.includes("frotator-admin") && (
        <div className="mt-6 flex gap-3">
          <Card
            className="cursor-pointer transition-transform hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
            onClick={() => navigate({ page: "bigbad" })}
          >
            <CardHeader>
              <CardTitle className="text-lg">Big Bad List</CardTitle>
              <CardDescription>Rank your favorite frosh</CardDescription>
            </CardHeader>
          </Card>
          <Card
            className="cursor-pointer transition-transform hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
            onClick={() => navigate({ page: "admin" })}
          >
            <CardHeader>
              <CardTitle className="text-lg">Admin</CardTitle>
              <CardDescription>Upload/manage frosh data</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}
