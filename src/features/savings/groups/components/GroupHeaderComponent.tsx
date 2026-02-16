'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiResponse } from "@/src/features/auth/types/apiResponse";
import axios, { AxiosError } from "axios";
import { Check, Loader2, LogOutIcon, Menu, PencilIcon, TrashIcon, X } from "lucide-react";
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";


const GroupHeaderComponent = ({data, onToggleSidebar}: { data: GroupPageData; onToggleSidebar: () => void }) => {
  const { data: session } = useSession();
  const [showMore, setShowMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const { group, userRole, userMembershipStatus } = data

  const isPublic = group.groupType === "public";

  const [editMode, setEditMode] = useState(false);
  const [editGroup, setEditGroup] = useState<EditableGroupFields>({
    groupName: group.groupName,
    description: group.description,
    groupType: group.groupType,
    maxGroupSize: group.maxGroupSize,
    criteria: {
      minimumWalletBalance: group.criteria?.minimumWalletBalance ?? 0
    },
  });

  const handleJoinGroup = async (groupId: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`/api/savings/group/${groupId}/join`);
      router.refresh();
      await new Promise(resolve => setTimeout(resolve, 300));
      toast.success(response.data.message || "Successfully joined the group");
    } catch (error: any) {
      const axiosError = error as AxiosError<ApiResponse>;
      let errorMessage = axiosError.response?.data.message || 'Failed to join group';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const handleLeaveGroup = async (groupId: string) => {
    try {
      setIsLoading(true);
      const response = await axios.patch(`/api/savings/group/${groupId}/leave`)
      toast.success(response.data.message || "Successfully exited group");
      router.replace('/groups');
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      let errorMessage = axiosError.response?.data.message || 'Failed to leave group. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    try {
      setIsLoading(true);
      const response = await axios.delete(`/api/savings/group/${groupId}/delete`);
      toast.success(response.data.message || "Group deleted successfully");
      router.replace('/groups');
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      let errorMessage = axiosError.response?.data.message || 'Failed to delete group. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  // start editing
  const handleEditClick = () => {
    setEditGroup({
      groupName: group.groupName,
      description: group.description,
      groupType: group.groupType,
      maxGroupSize: group.maxGroupSize,
      criteria: group.criteria ?? {}
    })
    setEditMode(true);
  }

  const handleCancelEdit = () => {
    setEditMode(false);
  }

  // input changes handler
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const {name, value} = e.target;
    setEditGroup((prev) => ({
      ...prev,
      [name]: name === "maxGroupSize" || name === "criteria" ? Number(value) : value,
    }) );
  }


  // save changes
  const handleSaveChanges = async (groupId: string) => {
    try {
      setIsSaving(true);
      const response = await axios.patch(`/api/savings/group/${groupId}/update`, editGroup);
      toast.success(response.data.message || "Group updated successfully");
      setEditMode(false);
      router.refresh();

    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      let errorMessage = axiosError.response?.data.message || 'Failed to update group';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }

  const isAdmin = userRole === 'admin';
  const isMember = userRole === 'admin' || userRole === 'member';

  return (
    <div className="p-4 border-b bg-white sticky top-0 z-10 px-3 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={onToggleSidebar}
            className="md:hidden p-1 rounded-md hover:bg-gray-100 cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>

          {editMode ? (
            <Input
            type="text"
            name="groupName"
            value={editGroup.groupName}
            onChange={handleInputChange}
            className="text-xl font-semibold border rounded px-2 py-1"
            />
          ) : (
            <h1 className="text-xl font-semibold">{group.groupName}</h1>
          )}
        </div>
        
        <div className="flex gap-2">

          {/* join group button */}
          {!isMember && (
            <Button
              onClick={() => {
                if(!group._id) {
                  console.error("Group id is undefined:", group);
                  toast.error("Wait until group data loads");
                  return;
                }
                handleJoinGroup(group._id)}} 
              disabled={isLoading || !group._id}
              className="cursor-pointer text-xs sm:text-sm py-1 px-3 sm:py-2 sm:px-4" 
              variant="default"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span>{isPublic ? "Joining..." : "Sending Request"}</span>
                </div>
              ) : (
                <span className="font-medium">{isPublic ? "Join Group" : "Send Request"}</span>
              )}
            </Button>
          )}

          {isMember && (
            <>

            {/* edit group details button */}
            {isAdmin && (
              <>
                {editMode ? (
                  <>
                    <Button 
                      onClick={() => handleSaveChanges(group._id)} 
                      className="cursor-pointer" disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      ) : (
                        <span className="hidden sm:inline"><Check /></span>
                      )}
                    </Button>

                    <Button
                    onClick={handleCancelEdit} 
                    className="cursor-pointer" 
                    variant="ghost" disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      ) : (
                        <span className="hidden sm:inline"><X /></span>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button disabled={isSaving}
                  onClick={handleEditClick}
                  className="cursor-pointer"
                  >
                    <PencilIcon className="h-4 w-4 sm:hidden mr-1" />
                    <span className="font-medium hidden sm:inline">Edit Group</span>
                  </Button>
                )}
              </>
            )}


            {/* leave / delete button */}
            <Button
              onClick={() => isAdmin ? handleDeleteGroup(group._id) : handleLeaveGroup(group._id)} 
              disabled={isLoading || !group._id}
              variant="destructive" 
              className="cursor-pointer text-xs sm:text-sm py-1 px-3 sm:py-2 sm:px-4"
            >
              {
                isLoading ? (
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span className="hidden sm:inline">{isAdmin ? "Deleting...": "Leaving..."}</span>
                  </div>
                ) : (
                <>
                {isAdmin ? (
                  <TrashIcon className="h-4 w-4 sm:hidden" />
                ) : (
                  <LogOutIcon className="h-4 w-4 sm:hidden" />
                )}
                <span className="font-medium hidden sm:inline">{isAdmin ? "Delete Group" : "Leave Group"}</span>
                </>
              )}
            </Button>
            </>
          )}
          
        </div>
      </div>


      {/* other group fields */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 mt-5 text-sm">
        <div className="bg-gray-50 p-2 rounded">
          <p className="text-gray-500">Type</p>
          {editMode ? (
            <select
            name="groupType"
            value={editGroup.groupType}
            onChange={handleInputChange}
            className="w-full text-sm"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          ) : (
            <p className="capitalize">{group.groupType}</p>
          )}
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <p className="text-gray-500">Max Size</p>
          {editMode ? (
            <Input
            type="number"
            name="maxGroupSize"
            value={editGroup.maxGroupSize}
            onChange={handleInputChange}
            className="w-full text-sm"
            />
          ) : (
            <p>{group.maxGroupSize}</p>
          )}
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <p className="text-gray-500">Remaining</p>
          <p>{data.remainingSeats}</p>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <p className="text-gray-500">Min. Wallet Balance</p>
          {editMode ? (
            <Input
            type="number"
            name="criteria"
            value={editGroup.criteria?.minimumWalletBalance}
            onChange={(e) => 
              setEditGroup((prev) => ({
                ...prev,
                criteria: {
                  ...prev.criteria,
                  minimumWalletBalance: Number(e.target.value)
                }
              }))
            }
            className="w-full text-sm"
            />
          ) : (
            <p>{group.criteria?.minimumWalletBalance}</p>
          )}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-sm">Description:</p>
        {editMode ? (
          <Textarea
          name="description"
          value={editGroup.description}
          onChange={handleInputChange}
          rows={3}
          className="w-full text-sm border rounded px-2 py-1"
          />
        ) : (
        <p className="text-sm text-gray-700">
          {showMore || group.description.length <= 200
            ? group.description 
            : group.description.slice(0, 100) + '...'
          }
          {group.description.length > 200 && (
            <button
              onClick={() => setShowMore(!showMore)}
              className="text-blue-500 ml-2 text-sm font-medium cursor-pointer"
            >
              {showMore ? "Show less" : "Show more"}
            </button>
          )}
        </p>
        )}
      </div>
    </div>
  )
}

export default GroupHeaderComponent
