"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("https://formspree.io/f/mjkrwadl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, formType: "newsletter" }),
      })

      if (response.ok) {
        setIsSubmitted(true)
        setEmail("")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="w-full max-w-sm space-y-2">
        <p className="text-white font-medium">Thanks for subscribing! We'll be in touch soon.</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your work email"
          className="max-w-lg flex-1 bg-white"
          required
        />
        <Button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Start Free Trial"}
        </Button>
      </form>
      <p className="text-xs text-orange-100">14-day free trial. No credit card required.</p>
    </div>
  )
}
