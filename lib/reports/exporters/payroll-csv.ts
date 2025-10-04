// ==============================================
// lib/reports/exporters/payroll-csv.ts - Payroll CSV Export Utility
// ==============================================

import type {
  PayrollReport,
  PayrollCSVOptions,
  PayrollReportByPerson,
  PayrollReportByProject,
  PayrollReportByCostCode,
  OvertimeSummary,
  DetailedPayrollEntry,
  TotalHoursSummary,
} from '@/types/reports'

// ==============================================
// CSV HELPER FUNCTIONS
// ==============================================

/**
 * Escape CSV field (handles commas, quotes, newlines)
 */
function escapeCSV(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = String(value)
  
  // If contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  
  return stringValue
}

/**
 * Convert array to CSV row
 */
function arrayToCSVRow(arr: any[]): string {
  return arr.map(escapeCSV).join(',')
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`
}

/**
 * Format hours
 */
function formatHours(hours: number): string {
  return hours.toFixed(2)
}

/**
 * Format percentage
 */
function formatPercent(percent: number): string {
  return `${percent.toFixed(2)}%`
}

// ==============================================
// SECTION 1: TIME BY PERSON
// ==============================================
function generateByPersonCSV(data: PayrollReportByPerson[]): string {
  const lines: string[] = []
  
  // Section header
  lines.push('TIME BY PERSON - EMPLOYEE BREAKDOWN')
  lines.push('')
  
  // Column headers
  lines.push(arrayToCSVRow([
    'Employee Name',
    'Email',
    'Trade/Specialty',
    'Regular Hours',
    'Overtime Hours',
    'Double Time Hours',
    'Total Hours',
    'Regular Pay',
    'Overtime Pay',
    'Double Time Pay',
    'Total Pay',
    'Entries Count',
    'Projects Worked',
    'Project Names',
    'Avg Regular Rate',
    'Avg Overtime Rate',
    'Avg Double Time Rate'
  ]))
  
  // Data rows
  for (const person of data) {
    lines.push(arrayToCSVRow([
      person.userName,
      person.userEmail,
      person.tradeSpecialty || 'N/A',
      formatHours(person.regularHours),
      formatHours(person.overtimeHours),
      formatHours(person.doubleTimeHours),
      formatHours(person.totalHours),
      formatCurrency(person.regularPay),
      formatCurrency(person.overtimePay),
      formatCurrency(person.doubleTimePay),
      formatCurrency(person.totalPay),
      person.totalEntries,
      person.projectsWorked,
      person.projectNames.join('; '),
      formatCurrency(person.avgRegularRate),
      formatCurrency(person.avgOvertimeRate),
      formatCurrency(person.avgDoubleTimeRate)
    ]))
  }
  
  // Totals row
  const totalHours = data.reduce((sum, p) => sum + p.totalHours, 0)
  const totalPay = data.reduce((sum, p) => sum + p.totalPay, 0)
  lines.push('')
  lines.push(arrayToCSVRow([
    'TOTAL',
    '',
    '',
    '',
    '',
    '',
    formatHours(totalHours),
    '',
    '',
    '',
    formatCurrency(totalPay),
    '',
    '',
    '',
    '',
    '',
    ''
  ]))
  
  return lines.join('\n')
}

// ==============================================
// SECTION 2: TIME BY PROJECT
// ==============================================
function generateByProjectCSV(data: PayrollReportByProject[]): string {
  const lines: string[] = []
  
  // Section header
  lines.push('')
  lines.push('')
  lines.push('TIME BY PROJECT - PROJECT BREAKDOWN')
  lines.push('')
  
  // Column headers
  lines.push(arrayToCSVRow([
    'Project Name',
    'Project Number',
    'Status',
    'Total Hours',
    'Regular Hours',
    'Overtime Hours',
    'Double Time Hours',
    'Total Cost',
    'Workers Count',
    'Worker Names',
    'Avg Hours/Worker',
    'Avg Cost/Hour',
    'Entries Count'
  ]))
  
  // Data rows
  for (const project of data) {
    lines.push(arrayToCSVRow([
      project.projectName,
      project.projectNumber || 'N/A',
      project.projectStatus,
      formatHours(project.totalHours),
      formatHours(project.regularHours),
      formatHours(project.overtimeHours),
      formatHours(project.doubleTimeHours),
      formatCurrency(project.totalCost),
      project.workersCount,
      project.workerNames.join('; '),
      formatHours(project.avgHoursPerWorker),
      formatCurrency(project.avgCostPerHour),
      project.totalEntries
    ]))
  }
  
  // Totals row
  const totalHours = data.reduce((sum, p) => sum + p.totalHours, 0)
  const totalCost = data.reduce((sum, p) => sum + p.totalCost, 0)
  lines.push('')
  lines.push(arrayToCSVRow([
    'TOTAL',
    '',
    '',
    formatHours(totalHours),
    '',
    '',
    '',
    formatCurrency(totalCost),
    '',
    '',
    '',
    '',
    ''
  ]))
  
  return lines.join('\n')
}

// ==============================================
// SECTION 3: TIME BY COST CODE
// ==============================================
function generateByCostCodeCSV(data: PayrollReportByCostCode[]): string {
  const lines: string[] = []
  
  // Section header
  lines.push('')
  lines.push('')
  lines.push('TIME BY COST CODE - TRADE/WORK TYPE BREAKDOWN')
  lines.push('')
  
  // Column headers
  lines.push(arrayToCSVRow([
    'Cost Code',
    'Type',
    'Total Hours',
    'Regular Hours',
    'Overtime Hours',
    'Double Time Hours',
    'Total Cost',
    '% of Total Hours',
    'Workers Count',
    'Projects Count',
    'Entries Count',
    'Avg Cost/Hour'
  ]))
  
  // Data rows
  for (const code of data) {
    lines.push(arrayToCSVRow([
      code.costCodeLabel,
      code.costCodeType === 'trade' ? 'Trade' : 'Work Type',
      formatHours(code.totalHours),
      formatHours(code.regularHours),
      formatHours(code.overtimeHours),
      formatHours(code.doubleTimeHours),
      formatCurrency(code.totalCost),
      formatPercent(code.percentOfTotal),
      code.workersCount,
      code.projectsCount,
      code.entriesCount,
      formatCurrency(code.avgCostPerHour)
    ]))
  }
  
  // Totals row
  const totalHours = data.reduce((sum, c) => sum + c.totalHours, 0)
  const totalCost = data.reduce((sum, c) => sum + c.totalCost, 0)
  lines.push('')
  lines.push(arrayToCSVRow([
    'TOTAL',
    '',
    formatHours(totalHours),
    '',
    '',
    '',
    formatCurrency(totalCost),
    '100.00%',
    '',
    '',
    '',
    ''
  ]))
  
  return lines.join('\n')
}

// ==============================================
// SECTION 4: OVERTIME SUMMARY
// ==============================================
function generateOvertimeCSV(data: OvertimeSummary[]): string {
  const lines: string[] = []
  
  // Section header
  lines.push('')
  lines.push('')
  lines.push('OVERTIME SUMMARY')
  lines.push('')
  
  // Column headers
  lines.push(arrayToCSVRow([
    'Employee Name',
    'Email',
    'Overtime Hours',
    'Double Time Hours',
    'Total OT Hours',
    'Overtime Pay',
    'Double Time Pay',
    'Total OT Pay',
    '% OT',
    'Days with OT',
    'Projects with OT'
  ]))
  
  // Data rows
  for (const ot of data) {
    lines.push(arrayToCSVRow([
      ot.userName,
      ot.userEmail,
      formatHours(ot.overtimeHours),
      formatHours(ot.doubleTimeHours),
      formatHours(ot.totalOTHours),
      formatCurrency(ot.overtimePay),
      formatCurrency(ot.doubleTimePay),
      formatCurrency(ot.totalOTPay),
      formatPercent(ot.percentOT),
      ot.daysWithOT,
      ot.projectsWithOT.join('; ')
    ]))
  }
  
  // Totals row
  const totalOTHours = data.reduce((sum, ot) => sum + ot.totalOTHours, 0)
  const totalOTPay = data.reduce((sum, ot) => sum + ot.totalOTPay, 0)
  lines.push('')
  lines.push(arrayToCSVRow([
    'TOTAL',
    '',
    '',
    '',
    formatHours(totalOTHours),
    '',
    '',
    formatCurrency(totalOTPay),
    '',
    '',
    ''
  ]))
  
  return lines.join('\n')
}

// ==============================================
// SECTION 5: DETAILED ENTRIES (WITH NOTES)
// ==============================================
function generateDetailedEntriesCSV(data: DetailedPayrollEntry[]): string {
  const lines: string[] = []
  
  // Section header
  lines.push('')
  lines.push('')
  lines.push('DETAILED TIME ENTRIES - WITH NOTES')
  lines.push('')
  
  // Column headers
  lines.push(arrayToCSVRow([
    'Date',
    'Employee Name',
    'Email',
    'Project Name',
    'Project Number',
    'Schedule Item',
    'Trade',
    'Work Type',
    'Start Time',
    'End Time',
    'Break (mins)',
    'Regular Hours',
    'Overtime Hours',
    'Double Time Hours',
    'Total Hours',
    'Regular Rate',
    'Overtime Rate',
    'Double Time Rate',
    'Regular Pay',
    'Overtime Pay',
    'Double Time Pay',
    'Total Pay',
    'Status',
    'Description',
    'Work Completed',
    'Issues Encountered',
    'Approved By',
    'Approved At'
  ]))
  
  // Data rows
  for (const entry of data) {
    lines.push(arrayToCSVRow([
      entry.date,
      entry.userName,
      entry.userEmail,
      entry.projectName,
      entry.projectNumber || 'N/A',
      entry.scheduleProjectTitle || 'N/A',
      entry.trade || 'N/A',
      entry.workType || 'N/A',
      entry.startTime,
      entry.endTime || 'N/A',
      entry.breakMinutes,
      formatHours(entry.regularHours),
      formatHours(entry.overtimeHours),
      formatHours(entry.doubleTimeHours),
      formatHours(entry.totalHours),
      formatCurrency(entry.regularRate),
      formatCurrency(entry.overtimeRate),
      formatCurrency(entry.doubleTimeRate),
      formatCurrency(entry.regularPay),
      formatCurrency(entry.overtimePay),
      formatCurrency(entry.doubleTimePay),
      formatCurrency(entry.totalPay),
      entry.status,
      entry.description || '',
      entry.workCompleted || '',
      entry.issuesEncountered || '',
      entry.approvedBy || 'N/A',
      entry.approvedAt || 'N/A'
    ]))
  }
  
  // Totals row
  const totalHours = data.reduce((sum, e) => sum + e.totalHours, 0)
  const totalPay = data.reduce((sum, e) => sum + e.totalPay, 0)
  lines.push('')
  lines.push(arrayToCSVRow([
    'TOTAL',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    formatHours(totalHours),
    '',
    '',
    '',
    '',
    '',
    '',
    formatCurrency(totalPay),
    '',
    '',
    '',
    '',
    '',
    ''
  ]))
  
  return lines.join('\n')
}

// ==============================================
// SECTION 6: SUMMARY TOTALS
// ==============================================
function generateSummaryCSV(summary: TotalHoursSummary): string {
  const lines: string[] = []
  
  // Section header
  lines.push('')
  lines.push('')
  lines.push('PAYROLL SUMMARY - OVERALL TOTALS')
  lines.push('')
  
  // Report period
  lines.push(arrayToCSVRow(['Report Period', `${summary.startDate} to ${summary.endDate}`]))
  lines.push(arrayToCSVRow(['Total Days', summary.totalDays]))
  lines.push('')
  
  // Counts
  lines.push('COUNTS')
  lines.push(arrayToCSVRow(['Total Entries', summary.totalEntries]))
  lines.push(arrayToCSVRow(['Total Workers', summary.totalWorkers]))
  lines.push(arrayToCSVRow(['Total Projects', summary.totalProjects]))
  lines.push('')
  
  // Hours breakdown
  lines.push('HOURS BREAKDOWN')
  lines.push(arrayToCSVRow(['Regular Hours', formatHours(summary.totalRegularHours)]))
  lines.push(arrayToCSVRow(['Overtime Hours', formatHours(summary.totalOvertimeHours)]))
  lines.push(arrayToCSVRow(['Double Time Hours', formatHours(summary.totalDoubleTimeHours)]))
  lines.push(arrayToCSVRow(['Grand Total Hours', formatHours(summary.grandTotalHours)]))
  lines.push('')
  
  // Hours percentages
  lines.push('HOURS PERCENTAGES')
  lines.push(arrayToCSVRow(['Regular %', formatPercent(summary.percentRegularHours)]))
  lines.push(arrayToCSVRow(['Overtime %', formatPercent(summary.percentOvertimeHours)]))
  lines.push(arrayToCSVRow(['Double Time %', formatPercent(summary.percentDoubleTimeHours)]))
  lines.push('')
  
  // Cost breakdown
  lines.push('COST BREAKDOWN')
  lines.push(arrayToCSVRow(['Regular Cost', formatCurrency(summary.totalRegularCost)]))
  lines.push(arrayToCSVRow(['Overtime Cost', formatCurrency(summary.totalOvertimeCost)]))
  lines.push(arrayToCSVRow(['Double Time Cost', formatCurrency(summary.totalDoubleTimeCost)]))
  lines.push(arrayToCSVRow(['Grand Total Cost', formatCurrency(summary.grandTotalCost)]))
  lines.push('')
  
  // Averages
  lines.push('AVERAGES')
  lines.push(arrayToCSVRow(['Avg Hours per Worker', formatHours(summary.avgHoursPerWorker)]))
  lines.push(arrayToCSVRow(['Avg Hours per Entry', formatHours(summary.avgHoursPerEntry)]))
  lines.push(arrayToCSVRow(['Avg Cost per Hour', formatCurrency(summary.avgCostPerHour)]))
  lines.push(arrayToCSVRow(['Avg Cost per Worker', formatCurrency(summary.avgCostPerWorker)]))
  lines.push('')
  
  // Status breakdown
  lines.push('STATUS BREAKDOWN')
  lines.push(arrayToCSVRow(['Pending Entries', summary.pendingEntries]))
  lines.push(arrayToCSVRow(['Approved Entries', summary.approvedEntries]))
  lines.push(arrayToCSVRow(['Pending Cost', formatCurrency(summary.pendingCost)]))
  lines.push(arrayToCSVRow(['Approved Cost', formatCurrency(summary.approvedCost)]))
  
  return lines.join('\n')
}

// ==============================================
// MAIN EXPORT FUNCTION
// ==============================================
export function generatePayrollCSV(
  report: PayrollReport,
  options: PayrollCSVOptions
): string {
  const sections: string[] = []
  
  // Add title and metadata
  sections.push('PAYROLL REPORT')
  sections.push(`Generated: ${new Date(report.generatedAt).toLocaleString()}`)
  sections.push(`Period: ${report.filters.startDate} to ${report.filters.endDate}`)
  sections.push('')
  sections.push('=' .repeat(80))
  sections.push('')
  
  // Section 1: Summary (always first)
  sections.push(generateSummaryCSV(report.summary))
  
  // Section 2: Time by Person
  if (report.byPerson.length > 0) {
    sections.push('')
    sections.push('=' .repeat(80))
    sections.push(generateByPersonCSV(report.byPerson))
  }
  
  // Section 3: Time by Project
  if (report.byProject.length > 0) {
    sections.push('')
    sections.push('=' .repeat(80))
    sections.push(generateByProjectCSV(report.byProject))
  }
  
  // Section 4: Time by Cost Code
  if (report.byCostCode.length > 0) {
    sections.push('')
    sections.push('=' .repeat(80))
    sections.push(generateByCostCodeCSV(report.byCostCode))
  }
  
  // Section 5: Overtime Summary
  if (report.overtimeSummary.length > 0) {
    sections.push('')
    sections.push('=' .repeat(80))
    sections.push(generateOvertimeCSV(report.overtimeSummary))
  }
  
  // Section 6: Detailed Entries (if requested and available)
  if (options.includeDetailedEntries && report.detailedEntries && report.detailedEntries.length > 0) {
    sections.push('')
    sections.push('=' .repeat(80))
    sections.push(generateDetailedEntriesCSV(report.detailedEntries))
  }
  
  // Footer
  sections.push('')
  sections.push('')
  sections.push('=' .repeat(80))
  sections.push('END OF REPORT')
  sections.push(`Total Entries: ${report.summary.totalEntries}`)
  sections.push(`Total Hours: ${formatHours(report.summary.grandTotalHours)}`)
  sections.push(`Total Cost: ${formatCurrency(report.summary.grandTotalCost)}`)
  
  return sections.join('\n')
}

// ==============================================
// EXPORT DEFAULT
// ==============================================
export default generatePayrollCSV