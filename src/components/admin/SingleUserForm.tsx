import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { createUsers, type CreateUserResult } from "@/lib/api/admin";
import ResultsTable from "./ResultsTable";

export default function SingleUserForm() {
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [membership, setMembership] = useState<"social" | "full">("social");
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<CreateUserResult[] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResults(null);

    try {
      const data = await createUsers([
        { username, firstName, lastName, email, membership },
      ]);
      setResults(data.results);

      if (data.results.every((r) => r.success)) {
        toast.success(`User ${username} created successfully`);
        setUsername("");
        setFirstName("");
        setLastName("");
        setEmail("");
        setMembership("social");
      } else {
        toast.error(`Failed to create ${username}`);
      }
    } catch {
      toast.error("Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="py-4">
        <CardHeader>
          <CardTitle>Add New User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="jsmith"
                  required
                  pattern="[a-zA-Z][a-zA-Z0-9._-]{0,31}"
                  title="Letters, numbers, dots, hyphens, underscores. Must start with a letter."
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jsmith@caltech.edu"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">First Name</label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Smith"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Membership</label>
              <Select
                value={membership}
                onValueChange={(v) => setMembership(v as "social" | "full")}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create User"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results && <ResultsTable results={results} />}
    </div>
  );
}
