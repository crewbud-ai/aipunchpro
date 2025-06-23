// ==============================================
// src/components/ui/phone-input.tsx - Simple US Phone Input Component (No External Library)
// ==============================================

"use client"

import React, { useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface PhoneInputProps {
  value?: string
  onChange?: (value: string | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  error?: boolean
  id?: string
}

// Format phone number as (555) 123-4567
const formatPhoneNumber = (value: string): string => {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '')
  
  // Limit to 10 digits (US phone number)
  const limited = numbers.slice(0, 10)
  
  // Format based on length
  if (limited.length <= 3) {
    return limited
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
  } else {
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
  }
}

// Extract raw numbers from formatted phone
const getRawPhoneNumber = (formatted: string): string => {
  return formatted.replace(/\D/g, '')
}

export const PhoneInputComponent = React.forwardRef<
  HTMLInputElement,
  PhoneInputProps
>(({ value, onChange, placeholder = "(555) 123-4567", className, disabled, error, id, ...props }, ref) => {
  const [displayValue, setDisplayValue] = useState(() => {
    if (value) {
      // Remove +1 country code for display if present
      const displayNumber = value.startsWith('+1') ? value.slice(2) : value
      return formatPhoneNumber(displayNumber)
    }
    return ''
  })

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const formatted = formatPhoneNumber(inputValue)
    const rawNumber = getRawPhoneNumber(formatted)
    
    setDisplayValue(formatted)
    
    // Call onChange with the +1 country code for US numbers
    if (rawNumber) {
      onChange?.(`+1${rawNumber}`)
    } else {
      onChange?.(undefined)
    }
  }, [onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Allow: home, end, left, right
        (e.keyCode >= 35 && e.keyCode <= 39)) {
      return
    }
    
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault()
    }
  }, [])

  // Update display value when prop value changes
  React.useEffect(() => {
    if (value !== undefined) {
      // Remove +1 country code for display if present
      const displayNumber = value.startsWith('+1') ? value.slice(2) : value
      const formatted = formatPhoneNumber(displayNumber)
      setDisplayValue(formatted)
    }
  }, [value])

  return (
    <div className="relative">
      {/* US Flag */}
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2 pointer-events-none z-10">
        <div className="w-5 h-3 rounded-sm overflow-hidden border border-gray-300">
          <svg viewBox="0 0 60 30" className="w-full h-full">
            {/* US Flag SVG */}
            <rect width="60" height="30" fill="#B22234"/>
            <rect width="60" height="2.31" y="2.31" fill="#FFFFFF"/>
            <rect width="60" height="2.31" y="6.92" fill="#FFFFFF"/>
            <rect width="60" height="2.31" y="11.54" fill="#FFFFFF"/>
            <rect width="60" height="2.31" y="16.15" fill="#FFFFFF"/>
            <rect width="60" height="2.31" y="20.77" fill="#FFFFFF"/>
            <rect width="60" height="2.31" y="25.38" fill="#FFFFFF"/>
            <rect width="24" height="15.38" fill="#3C3B6E"/>
          </svg>
        </div>
        <span className="text-sm text-muted-foreground">+1</span>
      </div>
      
      <Input
        {...props}
        ref={ref}
        id={id}
        type="tel"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "pl-16", // Make room for flag and +1
          error && "border-red-500 focus-visible:ring-red-500",
          className
        )}
        maxLength={14} // (555) 123-4567 = 14 characters
      />
    </div>
  )
})

PhoneInputComponent.displayName = "PhoneInput"

// ==============================================
// CSS Overrides for react-phone-number-input
// Add this to your global CSS file or create a separate CSS file
// ==============================================

/*
.PhoneInput {
  display: flex;
  align-items: center;
}

.PhoneInputCountry {
  margin-right: 8px;
  display: flex;
  align-items: center;
}

.PhoneInputCountryIcon {
  width: 20px;
  height: 15px;
  border-radius: 2px;
  overflow: hidden;
}

.PhoneInputCountryIcon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.PhoneInputCountrySelect {
  background: transparent;
  border: none;
  outline: none;
  font-size: 14px;
  cursor: pointer;
  margin-left: 4px;
}

.PhoneInputInput {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 14px;
}

.PhoneInput--focus {
  outline: none;
}
*/