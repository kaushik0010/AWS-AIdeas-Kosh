'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Mail, User, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";

const UserInfo = ({user}: {user: any}) => {
  const router = useRouter();

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
              <p className="font-semibold">${user.walletBalance.toFixed(2)}</p>
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