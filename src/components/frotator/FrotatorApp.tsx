import { useState, useEffect } from "react";
import { useFroshStore } from "@/lib/stores/froshStore";
import { Toaster } from "sonner";
import FrotatorHome from "./FrotatorHome";
import FroshListPage from "./FroshListPage";
import FroshDetail from "./FroshDetail";
import FlashcardView from "./FlashcardView";
import BigBadPage from "./BigBadPage";
import SpamPage from "./SpamPage";
import AdminData from "./AdminData";

export type Route =
  | { page: "home" }
  | { page: "frosh-list" }
  | { page: "frosh-detail"; id: number }
  | { page: "flashcards" }
  | { page: "bigbad" }
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
}

export default function FrotatorApp({ user }: Props) {
  const [route, setRoute] = useState<Route>({ page: "home" });
  const [history, setHistory] = useState<Route[]>([]);
  const fetchFrosh = useFroshStore((s) => s.fetchFrosh);
  const search = useFroshStore((s) => s.search);
  const page = useFroshStore((s) => s.page);

  useEffect(() => {
    fetchFrosh(search, page);
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
      <Toaster />
      {route.page === "home" && (
        <FrotatorHome navigate={navigate} user={user} />
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
