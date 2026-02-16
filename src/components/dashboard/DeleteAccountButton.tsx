'use client'

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ApiResponse } from "@/src/features/auth/types/apiResponse";
import axios, { AxiosError } from "axios";
import { Loader2, TrashIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

const DeleteAccountButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);
      const res = await axios.delete('/api/user/delete');
      toast.success(res.data.message || "Account deleted successfully");
      signOut({ callbackUrl: "/register", redirect: true });

    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      let errorMessage = axiosError.response?.data.message || 'Failed to delete account. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
    }
  }

  return (
    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="destructive" 
          className="gap-2 cursor-pointer"
          size="sm"
        >
          <TrashIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Delete Account</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription className="pt-2">
            This action cannot be undone. This will permanently delete your account and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-4">
          <DialogClose asChild>
            <Button variant="default" disabled={isLoading} className="flex-1">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={isLoading}
            onClick={handleDeleteAccount}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Yes, Delete Account"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteAccountButton