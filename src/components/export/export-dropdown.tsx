"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ExportService } from "@/lib/export"
import { Download, FileText, Table, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"
import type { ComprehensiveReport } from "@/lib/reports"

interface ExportDropdownProps {
  report: ComprehensiveReport
  disabled?: boolean
}

export default function ExportDropdown({ report, disabled = false }: ExportDropdownProps) {
  const [exporting, setExporting] = useState<string | null>(null)

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    setExporting(format)
    
    try {
      ExportService.exportReport(report, format)
      toast.success(`Report exported as ${format.toUpperCase()} successfully`)
    } catch (error) {
      console.error(`Error exporting ${format}:`, error)
      toast.error(`Failed to export report as ${format.toUpperCase()}`)
    } finally {
      setExporting(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleExport('pdf')}
          disabled={exporting === 'pdf'}
        >
          <FileText className="mr-2 h-4 w-4" />
          {exporting === 'pdf' ? 'Exporting PDF...' : 'Export as PDF'}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('excel')}
          disabled={exporting === 'excel'}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          {exporting === 'excel' ? 'Exporting Excel...' : 'Export as Excel'}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('csv')}
          disabled={exporting === 'csv'}
        >
          <Table className="mr-2 h-4 w-4" />
          {exporting === 'csv' ? 'Exporting CSV...' : 'Export as CSV'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}