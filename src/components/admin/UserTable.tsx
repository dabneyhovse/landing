import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";
import { fetchUsers, updateUserGroup, type AdminUser } from "@/lib/api/admin";

const PAGE_SIZE = 20;

export default function UserTable() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const loadUsers = useCallback(async (query: string, pageNum: number) => {
    setLoading(true);
    try {
      const data = await fetchUsers(query, pageNum * PAGE_SIZE, PAGE_SIZE);
      setUsers(data.users);
      setHasMore(data.users.length === PAGE_SIZE);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      loadUsers(search, 0);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, loadUsers]);

  useEffect(() => {
    loadUsers(search, page);
  }, [page]);

  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());

  const handleMembershipChange = async (
    user: AdminUser,
    newValue: "social" | "full" | "none",
  ) => {
    const oldMembership = user.membership;
    setUpdatingUsers((prev) => new Set(prev).add(user.id));
    // Optimistically update
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, membership: newValue } : u)),
    );

    try {
      // Remove old group
      if (oldMembership === "social") {
        await updateUserGroup(user.id, "darbs", "remove");
      } else if (oldMembership === "full") {
        await updateUserGroup(user.id, "full-darbs", "remove");
        await updateUserGroup(user.id, "darbs", "remove");
      }

      // Add new group
      if (newValue === "social") {
        await updateUserGroup(user.id, "darbs", "add");
      } else if (newValue === "full") {
        await updateUserGroup(user.id, "darbs", "add");
        await updateUserGroup(user.id, "full-darbs", "add");
      }

      toast.success(`Updated ${user.username} to ${newValue}`);
    } catch {
      // Revert on error
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, membership: oldMembership } : u,
        ),
      );
      toast.error(`Failed to update ${user.username}`);
    } finally {
      setUpdatingUsers((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  };

  return (
    <Card className="py-4">
      <CardContent className="space-y-4">
        <Input
          placeholder="Search by username, name, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4 font-medium">Username</th>
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Email</th>
                <th className="pb-2 font-medium">Membership</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center opacity-50">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center opacity-50">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs">
                      {user.username}
                    </td>
                    <td className="py-2 pr-4">
                      {[user.firstName, user.lastName]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </td>
                    <td className="py-2 pr-4">{user.email || "—"}</td>
                    <td className="py-2">
                      <Select
                        value={user.membership}
                        disabled={updatingUsers.has(user.id)}
                        onValueChange={(v) =>
                          handleMembershipChange(
                            user,
                            v as "social" | "full" | "none",
                          )
                        }
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                          <SelectItem value="full">Full</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm opacity-60">Page {page + 1}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
