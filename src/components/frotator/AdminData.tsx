import { useRef, useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { uploadCsv, deleteFrosh, fetchFrotatorConfig, updateFrotatorConfig } from "@/lib/api/frotator";
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
  const [frotatorEnabled, setFrotatorEnabled] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    fetchFrotatorConfig()
      .then((config) => setFrotatorEnabled(config.enabled))
      .catch(() => {})
      .finally(() => setConfigLoading(false));
  }, []);

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

      <Card className="mb-6 py-4">
        <CardContent className="flex items-center justify-between">
          <div>
            <label htmlFor="frotator-toggle" className="text-lg font-medium">
              Enable Frotator
            </label>
            <p className="text-sm text-muted-foreground">
              When disabled, only admins can access Frotator.
            </p>
          </div>
          <Switch
            id="frotator-toggle"
            className="!h-8 !w-14 [&_[data-slot=switch-thumb]]:!size-7 data-[state=unchecked]:bg-muted-foreground/30"
            checked={frotatorEnabled}
            disabled={configLoading}
            onCheckedChange={(on) => {
              setFrotatorEnabled(on);
              updateFrotatorConfig(on).catch(() => {
                setFrotatorEnabled(!on);
                toast.error("Failed to update Frotator status");
              });
            }}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="py-4">
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

        <Card className="py-4">
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

      <Card className="mt-6 py-4 gap-2 border-destructive">
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
