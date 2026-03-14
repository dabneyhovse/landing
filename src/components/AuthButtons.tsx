import { useEffect, useState } from "react";

interface User {
  sub: string;
  name: string;
  preferred_username: string;
  roles: string[];
  picture?: string;
}

export default function AuthButtons() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  if (!user) {
    return (
      <a href="/api/auth/login?returnTo=/">
        <button className="bg-darb-900 px-3 py-2 rounded-full w-full hover:bg-darb-800 transition hover:cursor-pointer">
          Log In
        </button>
      </a>
    );
  }

  return (
    <>
      {user.roles?.includes("frotator-access") && (
        <a href="/frotator">
          <button className="bg-darb-900 px-3 py-2 rounded-full w-full hover:bg-darb-800 transition hover:cursor-pointer">
            Frotator
          </button>
        </a>
      )}
      {(user.roles?.includes("website-manage-users") ||
        user.roles?.includes("backbone-admin")) && (
        <a href="/admin">
          <button className="bg-darb-900 px-3 py-2 rounded-full w-full hover:bg-darb-800 transition hover:cursor-pointer">
            Admin
          </button>
        </a>
      )}
      <a href="/api/auth/logout">
        <button className="bg-darb-900 px-3 py-2 rounded-full w-full hover:bg-darb-800 transition hover:cursor-pointer">
          Log Out
        </button>
      </a>
    </>
  );
}
