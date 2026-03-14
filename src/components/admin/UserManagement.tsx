import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserTable from "./UserTable";
import SingleUserForm from "./SingleUserForm";
import BulkUpload from "./BulkUpload";
import { Toaster } from "sonner";

export default function UserManagement() {
  return (
    <>
      <Toaster richColors position="top-right" />
      <h1 className="mb-6 text-3xl font-heading">User Management</h1>

      <Tabs defaultValue="users">
        <TabsList className="bg-background/80 border border-border">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="add">Add User</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <UserTable />
        </TabsContent>

        <TabsContent value="add" className="mt-4">
          <SingleUserForm />
        </TabsContent>

        <TabsContent value="bulk" className="mt-4">
          <BulkUpload />
        </TabsContent>
      </Tabs>
    </>
  );
}
