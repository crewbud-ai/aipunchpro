"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building2, Menu, X } from "lucide-react"

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMenuOpen(false)
  }

  return (
    <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white sticky top-0 z-50">
      <Link className="flex items-center justify-center" href="/">
        <Building2 className="h-8 w-8 text-orange-600" />
        <span className="ml-2 text-2xl font-bold text-gray-900">CrewBudAI</span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="ml-auto hidden md:flex gap-6">
        <button
          onClick={() => scrollToSection("features")}
          className="text-sm font-medium hover:text-orange-600 transition-colors"
        >
          Features
        </button>
        <button
          onClick={() => scrollToSection("pricing")}
          className="text-sm font-medium hover:text-orange-600 transition-colors"
        >
          Pricing
        </button>
        <button
          onClick={() => scrollToSection("testimonials")}
          className="text-sm font-medium hover:text-orange-600 transition-colors"
        >
          Reviews
        </button>
        <button
          onClick={() => scrollToSection("contact")}
          className="text-sm font-medium hover:text-orange-600 transition-colors"
        >
          Contact
        </button>
      </nav>

      <div className="ml-4 flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </Link>
        <Link href="/signup">
          <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
            Get Started
          </Button>
        </Link>
      </div>

      {/* Mobile Menu Button */}
      <Button variant="ghost" size="icon" className="ml-2 md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b shadow-lg md:hidden">
          <nav className="flex flex-col p-4 space-y-2">
            <button
              onClick={() => scrollToSection("features")}
              className="text-left py-2 text-sm font-medium hover:text-orange-600 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="text-left py-2 text-sm font-medium hover:text-orange-600 transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection("testimonials")}
              className="text-left py-2 text-sm font-medium hover:text-orange-600 transition-colors"
            >
              Reviews
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-left py-2 text-sm font-medium hover:text-orange-600 transition-colors"
            >
              Contact
            </button>
            <div className="pt-2 border-t">
              <Link href="/login" className="block py-2">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup" className="block py-2">
                <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
