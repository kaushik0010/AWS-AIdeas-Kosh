'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

interface GroupsList {
  _id: string;
  groupId: {
    _id: string;
    groupName: string;
  }
}

const JoinedGroups = ({ initialGroups }: { initialGroups: GroupsList[] }) => {
  const [groups, setGroups] = useState<GroupsList[]>(initialGroups);
  const router = useRouter();

  return (
    <Card className="h-auto">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl flex items-center gap-2">
          <Users className="h-5 w-5" />
          Joined Savings Groups
        </CardTitle>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-4 min-h-[150px] text-center">
            <p className="text-muted-foreground">
              You haven't joined any savings groups yet
            </p>
            <Button asChild size="sm">
              <Link href="/groups">
                Browse Groups
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <div 
                key={group._id} 
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <span className="font-medium">{group.groupId.groupName}</span>
                <Button 
                  size="sm"
                  className='cursor-pointer'
                  onClick={() => router.push(`/groups/${group.groupId._id}`)}
                >
                  View
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default JoinedGroups
