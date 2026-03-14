import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CreateUserResult } from "@/lib/api/admin";

interface Props {
  results: CreateUserResult[];
}

export default function ResultsTable({ results }: Props) {
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return (
    <Card className="py-4">
      <CardHeader>
        <CardTitle>
          Results — {succeeded} succeeded, {failed} failed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4 font-medium">Username</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-mono text-xs">{r.username}</td>
                  <td className="py-2 pr-4">
                    <Badge variant={r.success ? "default" : "destructive"}>
                      {r.success ? "OK" : "Failed"}
                    </Badge>
                  </td>
                  <td className="py-2 text-xs opacity-70">{r.error ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
