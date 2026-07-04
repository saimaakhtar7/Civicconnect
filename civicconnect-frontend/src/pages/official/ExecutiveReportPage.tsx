import React, { useState } from "react";
import { 
  FileText, Download, Printer, BarChart2, 
  FileSpreadsheet, RefreshCw 
} from "lucide-react";

interface ReportFile {
  id: string;
  title: string;
  type: "Operational" | "Incident" | "Department" | "Monthly Summary";
  date: string;
  size: string;
  downloads: number;
}

export const ExecutiveReportPage: React.FC = () => {
  const [loadingReportId, setLoadingReportId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const reportsList: ReportFile[] = [
    { id: "REP-202607-001", title: "Monthly Infrastructure Summary (Pune Central)", type: "Monthly Summary", date: "Jul 1, 2026", size: "2.4 MB", downloads: 142 },
    { id: "REP-202607-002", title: "Q2 Roads Department SLA Compliance Audit", type: "Department", date: "Jun 30, 2026", size: "4.8 MB", downloads: 88 },
    { id: "REP-202607-003", title: "Water Line rupture & Valve Anomaly Log", type: "Incident", date: "Jul 3, 2026", size: "1.2 MB", downloads: 201 },
    { id: "REP-202607-004", title: "Solid Waste Management Capacity Review", type: "Operational", date: "Jul 2, 2026", size: "1.8 MB", downloads: 55 }
  ];

  const downloadPDF = (report: ReportFile) => {
    const content = `
=====================================================
            MUNICIPAL GOVERNMENT OF PUNE
             OFFICIAL COMPLIANCE REPORT
=====================================================
Report ID: ${report.id}
Title: ${report.title}
Classification: ${report.type}
Published Date: ${report.date}
File Size: ${report.size}
Audit Version: v1.0.4

This document represents an official compliance record generated on the CivicConnect Smart City Command Center.

-----------------------------------------------------
DEPARTMENT OPERATIONAL METRICS:
- SLA Hit Ratio: 96.4%
- Critical Severity Load Share: 32%
- High Priority Load Share: 48%
- Medium & Low Share: 20%
- Current Status: ACTIVE COMPLIANT
-----------------------------------------------------

Issued by: Pune Municipal IT Deliberation Council
Locked Time: July 4, 2026, 09:42 AM IST
    `.trim();

    const blob = new Blob([content], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.id}_Official_Report.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadExcel = (report: ReportFile) => {
    const csvContent = [
      ["MUNICIPAL GOVERNMENT OF PUNE - COMPLIANCE AUDIT LOG"],
      ["Report ID", "Title", "Classification", "Published Date", "File Size", "Total Downloads"],
      [report.id, report.title, report.type, report.date, report.size, report.downloads],
      [],
      ["METRICS AUDIT SUMMARY"],
      ["Metric Name", "Value"],
      ["SLA Compliance hit ratio", "96.4%"],
      ["Critical Priority (P0)", "32%"],
      ["High Priority (P1)", "48%"],
      ["Medium & Low (P2/P3)", "20%"],
      ["Audit Status", "COMPLIANT"],
      ["Report Generation Time", "2026-07-04 09:42:00 IST"]
    ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.id}_Official_Log.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const triggerDownload = (reportId: string, format: "PDF" | "Excel") => {
    setLoadingReportId(`${reportId}-${format}`);
    setSuccessMessage(null);
    const report = reportsList.find(r => r.id === reportId);
    
    setTimeout(() => {
      setLoadingReportId(null);
      if (report) {
        if (format === "PDF") {
          downloadPDF(report);
        } else {
          downloadExcel(report);
        }
        setSuccessMessage(`✓ Report ${reportId} successfully compiled and downloaded as ${format}!`);
      } else {
        setSuccessMessage(`✓ Report ${reportId} successfully downloaded!`);
      }
      setTimeout(() => setSuccessMessage(null), 4000);
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-12 select-none text-left">
      
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#16A34A]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A]">Governance Reports</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Municipal Reporting &amp; Audits</h1>
        <p className="text-sm text-[#9CA3AF] font-medium leading-none">
          Generate, compile, and download infrastructure compliance logs and department SLA summaries.
        </p>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-3 bg-[#16A34A]/10 border border-[#16A34A]/25 text-[#16A34A] text-xs font-bold rounded-xl flex items-center justify-between select-none">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-[#16A34A] hover:opacity-80 font-bold ml-2 cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Grid of Actionable Reports Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* Left: Interactive Reports Files (6/10 Width) */}
        <div className="lg:col-span-6 bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-[#273244]/55">
            <h3 className="text-[15px] font-semibold text-[#F3F4F6] flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-[#9CA3AF]" /> Compiled Report Archive
            </h3>
            <span className="text-[10px] font-bold text-[#6B7280] font-mono">PDF &amp; EXCEL ARCHIVE</span>
          </div>

          <div className="space-y-3">
            {reportsList.map((rep) => (
              <div key={rep.id} className="p-3.5 bg-[#1A2332]/45 border border-[#273244] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs hover:bg-[#1A2332] transition-colors text-left">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold font-mono text-[#6B7280]">{rep.id}</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-[#9CA3AF] font-bold uppercase">{rep.type}</span>
                  </div>
                  <h4 className="font-bold text-[#F3F4F6] text-xs">{rep.title}</h4>
                  <span className="block text-[10px] text-[#6B7280] font-semibold">Published: {rep.date} · File size: {rep.size} · Downloads: {rep.downloads}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Download PDF button */}
                  <button
                    onClick={() => triggerDownload(rep.id, "PDF")}
                    disabled={loadingReportId != null}
                    className="p-2 bg-white/5 border border-[#273244] hover:border-[#16A34A]/25 text-[#9CA3AF] hover:text-[#16A34A] rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-bold text-[10px]"
                  >
                    {loadingReportId === `${rep.id}-PDF` ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    PDF
                  </button>

                  {/* Excel compilation button */}
                  <button
                    onClick={() => triggerDownload(rep.id, "Excel")}
                    disabled={loadingReportId != null}
                    className="p-2 bg-white/5 border border-[#273244] hover:border-[#2563EB]/25 text-[#9CA3AF] hover:text-[#2563EB] rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-bold text-[10px]"
                  >
                    {loadingReportId === `${rep.id}-Excel` ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    )}
                    Excel
                  </button>

                  {/* Print preview option */}
                  <button
                    onClick={() => window.print()}
                    className="p-2 bg-white/5 border border-[#273244] hover:bg-white/10 text-[#9CA3AF] rounded-lg transition-colors cursor-pointer"
                    title="Print Document"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Reports Visual Breakdown Charts (4/10 Width) */}
        <div className="lg:col-span-4 bg-[#111827] border border-[#273244] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-[#273244]/55">
            <h3 className="text-[15px] font-semibold text-[#F3F4F6] flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-[#9CA3AF]" /> Severity &amp; Department Performance
            </h3>
            <span className="text-[10px] font-bold text-[#6B7280] font-mono">AUDIT CHARTS</span>
          </div>

          <div className="space-y-4 text-xs text-[#9CA3AF]">
            {/* Severity Share bars */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Severity Load Share</span>
              {[
                { label: "Critical Priority (P0)", val: 32, color: "bg-[#DC2626]" },
                { label: "High Priority (P1)", val: 48, color: "bg-[#F59E0B]" },
                { label: "Medium & Low (P2/P3)", val: 20, color: "bg-[#16A34A]" }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>{item.label}</span>
                    <span className="font-mono text-[#F3F4F6]">{item.val}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.val}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* SLA Breach Audit status */}
            <div className="border-t border-[#273244]/65 pt-4 space-y-2 text-left">
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Compliance Performance Rating</span>
              <div className="grid grid-cols-2 gap-2 font-bold text-center">
                <div className="p-3 bg-[#1A2332]/45 border border-[#273244] rounded-xl">
                  <span className="block text-xl font-bold text-[#16A34A] font-mono">96.4%</span>
                  <span className="text-[9px] text-[#6B7280] uppercase mt-0.5 block">SLA Hit Ratio</span>
                </div>
                <div className="p-3 bg-[#1A2332]/45 border border-[#273244] rounded-xl">
                  <span className="block text-xl font-bold text-[#DC2626] font-mono">3.6%</span>
                  <span className="text-[9px] text-[#6B7280] uppercase mt-0.5 block">Breached SLA</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ExecutiveReportPage;
