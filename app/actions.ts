"use server"

import { redirect } from "next/navigation"
import { supabase } from "@/lib/database"
import { sendContactNotification, sendNewsletterConfirmation } from "@/lib/email"

export async function subscribeToNewsletter(prevState: any, formData: FormData) {
  const email = formData.get("email") as string

  if (!email) {
    return { success: false, message: "Email is required" }
  }

  try {
    // Check if already subscribed
    const { data: existing } = await supabase.from("newsletter_subscribers").select("email").eq("email", email).single()

    if (existing) {
      return { success: true, message: "You're already subscribed! Check your email for next steps." }
    }

    // Add to newsletter
    const { error } = await supabase.from("newsletter_subscribers").insert([{ email, source: "landing_page" }])

    if (error) {
      console.error("Database error:", error)
      return { success: false, message: "Something went wrong. Please try again." }
    }

    // Send confirmation email
    await sendNewsletterConfirmation(email)

    return {
      success: true,
      message: "Thanks for subscribing! Check your email for next steps.",
    }
  } catch (error) {
    console.error("Newsletter subscription error:", error)
    return { success: false, message: "Something went wrong. Please try again." }
  }
}

export async function contactSales(prevState: any, formData: FormData) {
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const email = formData.get("email") as string
  const company = formData.get("company") as string
  const phone = formData.get("phone") as string
  const message = formData.get("message") as string

  if (!firstName || !lastName || !email) {
    return { success: false, message: "Please fill in all required fields." }
  }

  try {
    // Save to database
    const { error } = await supabase.from("contact_submissions").insert([
      {
        first_name: firstName,
        last_name: lastName,
        email,
        company,
        phone,
        message,
        status: "new",
      },
    ])

    if (error) {
      console.error("Database error:", error)
      return { success: false, message: "Something went wrong. Please try again." }
    }

    // Send email notifications
    await sendContactNotification({
      firstName,
      lastName,
      email,
      company,
      phone,
      message,
    })

    return {
      success: true,
      message: "Thanks for your interest! Our sales team will contact you within 24 hours.",
    }
  } catch (error) {
    console.error("Contact form error:", error)
    return { success: false, message: "Something went wrong. Please try again." }
  }
}

export async function startFreeTrial(formData: FormData) {
  const email = formData.get("email") as string

  if (!email) {
    return { success: false, message: "Email is required" }
  }

  // For now, just redirect to signup with email pre-filled
  // In the future, this will connect to your MVP app
  redirect("/signup?email=" + encodeURIComponent(email))
}
