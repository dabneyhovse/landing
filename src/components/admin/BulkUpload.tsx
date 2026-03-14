import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadUsersCsv, type CreateUserResult } from "@/lib/api/admin";
import ResultsTable from "./ResultsTable";

export default function BulkUpload() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<CreateUserResult[] | null>(null);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setResults(null);

    try {
      const data = await uploadUsersCsv(file);
      setResults(data.results);

      const succeeded = data.results.filter((r) => r.success).length;
      const failed = data.results.filter((r) => !r.success).length;

      if (failed === 0) {
        toast.success(`All ${succeeded} users created successfully`);
      } else {
        toast.warning(`${succeeded} created, ${failed} failed`);
      }

      if (fileRef.current) fileRef.current.value = "";
    } catch {
      toast.error("Failed to process CSV");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="py-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="size-5" /> Bulk Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm opacity-70">
            Upload a CSV with columns: <code>username</code>, <code>first_name</code>,{" "}
            <code>last_name</code>, <code>email</code>, <code>membership</code> (social or full)
          </p>
          <Input ref={fileRef} type="file" accept=".csv" />
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload & Create Users"}
          </Button>
        </CardContent>
      </Card>

      {results && <ResultsTable results={results} />}
    </div>
  );
}
