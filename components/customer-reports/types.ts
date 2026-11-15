import { mockReportData } from "@/lib/mockData";

export type ReportData = typeof mockReportData;

export type ReportPeriod = "this_month" | "last_3_months" | "this_year" | "all_time";
export type ReportTab = "overview" | "spending" | "campaigns" | "screens" | "reach" | "creatives";

export type ChartMenuAction = "view_larger" | "export_chart" | "download_png" | "add_to_report";
