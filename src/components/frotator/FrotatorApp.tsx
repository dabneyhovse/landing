import { useState, useEffect } from "react";
import { useFroshStore } from "@/lib/stores/froshStore";
import { Toaster } from "sonner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Megaphone, Lock } from "lucide-react";
import FrotatorHome from "./FrotatorHome";
import FroshListPage from "./FroshListPage";
import FroshDetail from "./FroshDetail";
import FlashcardView from "./FlashcardView";
import BigBadPage from "./BigBadPage";
import QuizPage from "./QuizPage";
import SpamPage from "./SpamPage";
import SpamListener from "./SpamListener";
import AdminData from "./AdminData";
import { fetchPreferences, updatePreferences } from "@/lib/api/frotator";

export type Route =
  | { page: "home" }
  | { page: "frosh-list" }
  | { page: "frosh-detail"; id: number }
  | { page: "flashcards" }
  | { page: "bigbad" }
  | { page: "quiz" }
  | { page: "spam" }
  | { page: "admin" };

interface Props {
  user: {
    sub: string;
    name: string;
    preferred_username: string;
    roles: string[];
    picture?: string;
  };
  secretaryName: string;
}

export default function FrotatorApp({ user, secretaryName }: Props) {
  const [route, setRoute] = useState<Route>({ page: "home" });
  const [history, setHistory] = useState<Route[]>([]);
  const fetchFrosh = useFroshStore((s) => s.fetchFrosh);
  const search = useFroshStore((s) => s.search);
  const page = useFroshStore((s) => s.page);

  const isSecretary = user.roles.includes("frotator-secretary");
  const [spamEnabled, setSpamEnabled] = useState(isSecretary);

  useEffect(() => {
    fetchFrosh(search, page);
    if (!isSecretary) {
      fetchPreferences()
        .then((prefs) => setSpamEnabled(prefs.spamToasts))
        .catch(() => {});
    }
  }, []);

  const navigate = (next: Route) => {
    setHistory((h) => [...h, route]);
    setRoute(next);
  };

  const goBack = () => {
    const prev = history[history.length - 1];
    if (prev) {
      setHistory((h) => h.slice(0, -1));
      setRoute(prev);
    } else {
      setRoute({ page: "home" });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Toaster position="top-right" />
      {(spamEnabled || isSecretary) && <SpamListener />}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-card border px-3 py-1.5 shadow-sm">
        <Megaphone className={cn("size-4", spamEnabled || isSecretary ? "text-foreground" : "text-muted-foreground/40")} />
        <span className="text-xs font-medium select-none">Spam</span>
        <Switch
          checked={isSecretary || spamEnabled}
          disabled={isSecretary}
          className="data-[state=unchecked]:bg-muted-foreground/30"
          onCheckedChange={(on) => {
            setSpamEnabled(on);
            updatePreferences({ spamToasts: on });
          }}
        >
          {isSecretary && <Lock className="size-2.5 text-muted-foreground" />}
        </Switch>
      </div>
      {route.page === "home" && (
        <FrotatorHome navigate={navigate} user={user} secretaryName={secretaryName} />
      )}
      {route.page === "frosh-list" && (
        <FroshListPage navigate={navigate} user={user} />
      )}
      {route.page === "frosh-detail" && (
        <FroshDetail
          froshId={route.id}
          navigate={navigate}
          goBack={goBack}
          user={user}
        />
      )}
      {route.page === "flashcards" && (
        <FlashcardView navigate={navigate} />
      )}
      {route.page === "quiz" && (
        <QuizPage navigate={navigate} user={user} />
      )}
      {route.page === "bigbad" && (
        <BigBadPage navigate={navigate} user={user} />
      )}
      {route.page === "spam" && (
        <SpamPage navigate={navigate} user={user} />
      )}
      {route.page === "admin" && (
        <AdminData navigate={navigate} />
      )}
    </div>
  );
}
