'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Activity, Edit, HelpCircle, Lock, Mail, User, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";

const UserInfo = ({user}: {user: any}) => {
  const router = useRouter();

  // Determine health score color
  const healthScore = user.healthScore || 100;
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 border-emerald-500 bg-emerald-50';
    if (score >= 50) return 'text-amber-500 border-amber-500 bg-amber-50';
    return 'text-red-500 border-red-500 bg-red-50';
  };

  if (!user) return (
    <Card>
      <CardHeader>
        <CardTitle>User Information</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Failed to load user data</p>
      </CardContent>
    </Card>
  )

  return (
     <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl flex items-center gap-2">
          <User className="w-5 h-5" />
          User Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex flex-col h-full">
        <div className="flex-grow space-y-4">
          <div className="flex items-center gap-3 p-2">
            <Mail className="w-5 h-5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="font-semibold truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <User className="w-5 h-5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="font-semibold truncate">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <Wallet className="w-5 h-5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">Wallet Balance</p>
              <p className="font-semibold">₹{user.walletBalance.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <Lock className="w-5 h-5 flex-shrink-0 text-orange-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted-foreground">Tax Vault (Locked)</p>
              <p className="font-semibold text-orange-600">₹{user.taxVault?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <Activity className="w-5 h-5 flex-shrink-0" />
            <div className="min-w-0 flex-1 flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Health Score</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-[200px]">
                          Your score tracks saving consistency and spending habits
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border mt-1 ${getHealthScoreColor(healthScore)}`}>
                  <span className="font-semibold text-sm">{healthScore}/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={() => router.push('/profile')} 
          className="w-full gap-2 cursor-pointer"
          size="sm"
        >
          <Edit className="w-4 h-4" />
          Edit Profile
        </Button>
      </CardContent>
    </Card>
  )
}

export default UserInfo