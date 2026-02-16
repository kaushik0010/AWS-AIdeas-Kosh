'use client'

import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import {User} from "next-auth"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronDown } from "lucide-react"

const AuthButtons = ({ isMobile=false, className="" }) => {
  const {data: session} = useSession()

  const user:User = session?.user as User

  if (!session) {
    return (
      <div className={`flex ${isMobile ? "flex-col gap-2" : "items-center gap-2 sm:gap-4"} ${className}`}>
        <Button asChild variant="ghost" size="sm" className="text-sm border">
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild size="sm" className="text-sm">
          <Link href="/register">Sign up</Link>
        </Button>
      </div>
    )
  }

  return isMobile ? (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <span className="font-medium">{user.name}</span>
      </div>
      <Button asChild variant="ghost" size="sm" className="text-left justify-start">
        <Link href="/profile">Profile</Link>
      </Button>
      <Button asChild variant="ghost" size="sm" className="text-left justify-start">
        <Link href="/dashboard">Dashboard</Link>
      </Button>
      <Button onClick={() => signOut()} size="sm" className="w-full">
        Logout
      </Button>
    </div>
  ) : (
    <div className={`flex items-center gap-2 sm:gap-4 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 cursor-pointer">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="mr-12">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer"><Link href={'/profile'}>Profile</Link></DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer"><Link href={'/dashboard'}>Dashboard</Link></DropdownMenuItem>
          <Button className="w-full cursor-pointer my-2 text-sm" onClick={() => signOut()}>Logout</Button>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default AuthButtons
