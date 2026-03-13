import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { uploadCsv, deleteFrosh } from "@/lib/api/frotator";
import { toast } from "sonner";
import { ArrowLeft, Upload, Trash2 } from "lucide-react";
import type { Route } from "./FrotatorApp";

interface Props {
  navigate: (route: Route) => void;
}

export default function AdminData({ navigate }: Props) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const updateRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (method: "POST" | "PUT", ref: React.RefObject<HTMLInputElement | null>) => {
    const file = ref.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadCsv(file, method);
      toast.success(
        method === "POST"
          ? "CSV uploaded successfully"
          : "CSV updated successfully",
      );
      if (ref.current) ref.current.value = "";
    } catch {
      toast.error("There was an error uploading the CSV");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteFrosh();
      toast.success("All frosh deleted");
    } catch {
      toast.error("There was an error deleting frosh");
    }
  };

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        className="mb-4"
        onClick={() => navigate({ page: "home" })}
      >
        <ArrowLeft className="size-4" /> Back
      </Button>

      <h1 className="mb-6 text-3xl font-heading">Admin - Data Management</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="size-5" /> Upload CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">Upload a new CSV file of frosh data.</p>
            <Input ref={uploadRef} type="file" accept=".csv" />
            <Button
              onClick={() => handleUpload("POST", uploadRef)}
              disabled={uploading}
            >
              Upload
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="size-5" /> Update CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              Update existing frosh data with a new CSV.
            </p>
            <Input ref={updateRef} type="file" accept=".csv" />
            <Button
              onClick={() => handleUpload("PUT", updateRef)}
              disabled={uploading}
            >
              Update
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="size-5" /> Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm">
            Delete all frosh data. This action cannot be undone.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">Delete All Frosh</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogDescription>
                  This will permanently delete all frosh data. This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="destructive" onClick={handleDelete}>
                    Delete All
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
