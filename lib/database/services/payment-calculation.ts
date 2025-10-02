// ==============================================
// lib/database/services/payment-calculation.ts - Payment Calculation Service
// ==============================================

// ==============================================
// INTERFACES & TYPES
// ==============================================

/**
 * Input for payment calculation
 */
export interface PaymentCalculationInput {
  totalHours: number
  regularRate: number
  overtimeRate: number
  doubleTimeRate?: number
  regularHoursThreshold?: number // Default: 8 hours
  overtimeHoursThreshold?: number // Default: 12 hours (for double time)
}

/**
 * Detailed payment breakdown result
 */
export interface PaymentBreakdown {
  // Hours breakdown
  regularHours: number
  overtimeHours: number
  doubleTimeHours: number
  totalHours: number

  // Rates used
  regularRate: number
  overtimeRate: number
  doubleTimeRate: number

  // Payment breakdown
  regularPay: number
  overtimePay: number
  doubleTimePay: number
  totalPay: number

  // Metadata
  hasOvertime: boolean
  hasDoubleTime: boolean
}

// ==============================================
// PAYMENT CALCULATION SERVICE CLASS
// ==============================================

/**
 * Service for calculating worker payments based on hours and rates
 * Handles regular pay, overtime, and double time calculations
 */
export class PaymentCalculationService {
  private enableLogging: boolean

  constructor(enableLogging = false) {
    this.enableLogging = enableLogging
  }

  // ==============================================
  // LOGGING HELPER
  // ==============================================
  private log(message: string, data?: any) {
    if (this.enableLogging) {
      console.log(`[PaymentCalculationService] ${message}`, data || '')
    }
  }

  // ==============================================
  // MAIN CALCULATION METHOD
  // ==============================================

  /**
   * Calculate complete payment breakdown
   * 
   * Rules:
   * - 0-8 hours: Regular rate
   * - 8-12 hours: Overtime rate (1.5x)
   * - 12+ hours: Double time rate (2x) - optional
   * 
   * @param input Payment calculation parameters
   * @returns Complete payment breakdown
   */
  calculatePayment(input: PaymentCalculationInput): PaymentBreakdown {
    this.log('Calculating payment', input)

    // Set defaults
    const regularHoursThreshold = input.regularHoursThreshold ?? 8
    const overtimeHoursThreshold = input.overtimeHoursThreshold ?? 12
    const doubleTimeRate = input.doubleTimeRate ?? (input.regularRate * 2)

    // Ensure non-negative hours
    const totalHours = Math.max(0, input.totalHours)

    // Calculate hours breakdown
    let regularHours = 0
    let overtimeHours = 0
    let doubleTimeHours = 0

    if (totalHours <= regularHoursThreshold) {
      // All hours are regular
      regularHours = totalHours
    } else if (totalHours <= overtimeHoursThreshold) {
      // Regular + Overtime
      regularHours = regularHoursThreshold
      overtimeHours = totalHours - regularHoursThreshold
    } else {
      // Regular + Overtime + Double Time
      regularHours = regularHoursThreshold
      overtimeHours = overtimeHoursThreshold - regularHoursThreshold
      doubleTimeHours = totalHours - overtimeHoursThreshold
    }

    // Calculate payments
    const regularPay = this.roundMoney(regularHours * input.regularRate)
    const overtimePay = this.roundMoney(overtimeHours * input.overtimeRate)
    const doubleTimePay = this.roundMoney(doubleTimeHours * doubleTimeRate)
    const totalPay = this.roundMoney(regularPay + overtimePay + doubleTimePay)

    // Create breakdown result
    const breakdown: PaymentBreakdown = {
      // Hours
      regularHours: this.roundHours(regularHours),
      overtimeHours: this.roundHours(overtimeHours),
      doubleTimeHours: this.roundHours(doubleTimeHours),
      totalHours: this.roundHours(totalHours),

      // Rates
      regularRate: input.regularRate,
      overtimeRate: input.overtimeRate,
      doubleTimeRate: doubleTimeRate,

      // Payments
      regularPay,
      overtimePay,
      doubleTimePay,
      totalPay,

      // Metadata
      hasOvertime: overtimeHours > 0 || doubleTimeHours > 0,
      hasDoubleTime: doubleTimeHours > 0,
    }

    this.log('Payment calculation complete', breakdown)
    return breakdown
  }

  // ==============================================
  // QUICK CALCULATION METHODS
  // ==============================================

  /**
   * Calculate only total pay (no breakdown)
   * Useful for quick calculations
   */
  calculateTotalPay(input: PaymentCalculationInput): number {
    const breakdown = this.calculatePayment(input)
    return breakdown.totalPay
  }

  /**
   * Calculate payment for regular hours only (no overtime)
   */
  calculateRegularPayOnly(hours: number, rate: number): number {
    return this.roundMoney(hours * rate)
  }

  /**
   * Calculate current earnings based on elapsed time
   * Useful for real-time display
   */
  calculateCurrentEarnings(
    startTime: string, // HH:MM format
    regularRate: number,
    overtimeRate: number,
    breakMinutes: number = 0
  ): PaymentBreakdown {
    // Calculate elapsed time
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
    const totalHours = this.calculateHours(startTime, currentTime, breakMinutes)

    // Calculate payment
    return this.calculatePayment({
      totalHours,
      regularRate,
      overtimeRate,
    })
  }

  // ==============================================
  // UTILITY METHODS
  // ==============================================

  /**
   * Calculate hours between two times
   */
  private calculateHours(
    startTime: string,
    endTime: string,
    breakMinutes: number = 0
  ): number {
    const start = new Date(`1970-01-01T${startTime}`)
    const end = new Date(`1970-01-01T${endTime}`)

    const diffMs = end.getTime() - start.getTime()
    const totalMinutes = Math.floor(diffMs / (1000 * 60)) - breakMinutes

    return Math.max(0, totalMinutes / 60) // Convert to hours, ensure non-negative
  }

  /**
   * Round money to 2 decimal places
   */
  private roundMoney(amount: number): number {
    return Math.round(amount * 100) / 100
  }

  /**
   * Round hours to 2 decimal places
   */
  private roundHours(hours: number): number {
    return Math.round(hours * 100) / 100
  }

  // ==============================================
  // VALIDATION METHODS
  // ==============================================

  /**
   * Validate payment calculation input
   */
  validateInput(input: PaymentCalculationInput): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (input.totalHours < 0) {
      errors.push('Total hours cannot be negative')
    }

    if (input.regularRate < 0) {
      errors.push('Regular rate cannot be negative')
    }

    if (input.overtimeRate < 0) {
      errors.push('Overtime rate cannot be negative')
    }

    if (input.doubleTimeRate !== undefined && input.doubleTimeRate < 0) {
      errors.push('Double time rate cannot be negative')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

// ==============================================
// CONVENIENCE FUNCTIONS
// ==============================================

/**
 * Quick function to calculate total pay
 * 
 * @example
 * const totalPay = calculateTotalPay(9.5, 20, 30)
 * console.log(totalPay) // 190.00 (8h * $20 + 1.5h * $30)
 */
export function calculateTotalPay(
  totalHours: number,
  regularRate: number,
  overtimeRate: number
): number {
  const service = new PaymentCalculationService()
  return service.calculateTotalPay({
    totalHours,
    regularRate,
    overtimeRate,
  })
}

/**
 * Quick function to get payment breakdown
 * 
 * @example
 * const breakdown = getPaymentBreakdown(9.5, 20, 30)
 * console.log(breakdown.totalPay) // 190.00
 * console.log(breakdown.regularPay) // 160.00
 * console.log(breakdown.overtimePay) // 30.00
 */
export function getPaymentBreakdown(
  totalHours: number,
  regularRate: number,
  overtimeRate: number
): PaymentBreakdown {
  const service = new PaymentCalculationService()
  return service.calculatePayment({
    totalHours,
    regularRate,
    overtimeRate,
  })
}

// ==============================================
// DEFAULT EXPORT
// ==============================================
export default PaymentCalculationService