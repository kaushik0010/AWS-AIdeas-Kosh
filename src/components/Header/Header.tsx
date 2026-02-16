'use client'

import LogoComponent from "./Logo"
import NavigationComponent from "./Navigation"
import AuthButtons from "./AuthButtons"
import { useState } from "react"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X } from "lucide-react"

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur border-b">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 mx-auto">
        {/* Logo - always visible */}
        <LogoComponent />

        {/* Desktop Navigation - center */}
        <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2">
          <NavigationComponent />
        </div>

        {/* Desktop Auth Buttons - right */}
        <div className="hidden md:flex ml-auto">
          <AuthButtons />
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden ml-auto">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger aria-label="Toggle Menu">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-4 space-y-4 bg-white">
              <SheetTitle></SheetTitle>
              <NavigationComponent className="flex-col items-start gap-2" />
              <AuthButtons isMobile className="flex-col items-start gap-2" />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export default Header
