'use client'

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApiResponse } from "@/src/features/auth/types/apiResponse";
import axios, { AxiosError } from "axios";
import { Check, Loader2, UserIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";


const GroupSidebarComponent = ({ data, isOpen, onClose }: { data: GroupPageData; isOpen: boolean; onClose: () => void; }) => {

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { group, members, pendingMembers, userRole } = data;
  const isAdmin = userRole === 'admin';
  const router = useRouter();

  const handleApproveReq = async (groupId: string, userId: string, action: 'approve' | 'reject') => {
    try {
      setLoadingId(userId);
      setIsLoading(true);
      const response = await axios.patch(`/api/savings/group/${groupId}/approve-member`, {
        userId,
        action
      })
      toast.success(response.data.message || "User has approved");
      router.refresh();
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      let errorMessage = axiosError.response?.data.message || 'Failed to approve request';
      toast.error(errorMessage);
    } finally {
      setLoadingId(null);
      setIsLoading(false);
    }
  }

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={onClose}
        />
      )}

      <aside 
        className={`fixed md:sticky px-1 sm:px-3.5 top-0 left-0 z-20 w-64 h-screen bg-white border-r transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 mt-14' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Members ({members.length})</h2>
            <button 
              onClick={onClose}
              className="md:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <ScrollArea className="flex-1 pr-1">
            {members.map((member, index) => (
              <div key={member._id}> 
                {index > 0 && <hr className="my-2 border-gray-300" />}
                <div className="flex items-center gap-3 mb-3 p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                    <UserIcon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                  </div>
                </div>
              </div>
            ))}
            

            {isAdmin && (
              <div>
              <div className="flex justify-between items-center mb-4 mt-20">
                <h2 className="text-lg sm:text-lg font-semibold">Pending Requests ({pendingMembers.length})</h2>
              </div>
              {pendingMembers.map((member, index) => (
                <div key={member._id}> 
                  {index > 0 && <hr className="my-2 border-gray-300" />}
                  <div className="flex items-center gap-3 mb-3 p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                      <UserIcon className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                    </div>
                    <div className="flex items-center gap-2">

                      {/* approve button */}
                      <Button 
                      disabled={isLoading}
                      onClick={() => handleApproveReq(group._id, member._id, "approve")}
                      className="cursor-pointer h-6 w-6 sm:h-8 sm:w-8 bg-green-500 hover:bg-green-600 text-white"
                      >
                        {loadingId === member._id ? (
                          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      
                      {/* reject button */}
                      <Button 
                      disabled={isLoading}
                      onClick={() => handleApproveReq(group._id, member._id, "reject")}
                      variant="destructive" 
                      className="cursor-pointer h-6 w-6 sm:h-8 sm:w-8"
                      >
                        {loadingId === member._id ? (
                          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>

                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </aside>
    </>
  )
}

export default GroupSidebarComponent
