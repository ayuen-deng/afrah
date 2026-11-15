"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";

import { calculatePayrollNet, financeStore } from "@/components/finance/store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { formatUGX } from "@/lib/ugx";

export function PayrollPage() {
  const { showToast } = useToast();
  const [rows, setRows] = React.useState<any[]>([]);
  const [payslip, setPayslip] = React.useState<any | null>(null);

  React.useEffect(() => {
    financeStore.seed();
    const refresh = () => setRows(financeStore.readPayroll());
    refresh();
    window.addEventListener(financeStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(financeStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const nssfTotal = rows.reduce((sum, row) => sum + row.nssf_emp + row.nssf_employer, 0);
  const payeTotal = rows.reduce((sum, row) => sum + row.paye, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        subtitle="Review monthly payroll, preview payslips, and confirm statutory deductions."
        actions={
          <>
            <Button variant="secondary" onClick={() => showToast({ type: "success", title: "Exported", message: "Payroll exported." })}>Export</Button>
            <Button onClick={() => showToast({ type: "success", title: "Confirmed", message: "Payroll confirmed for submission." })}>Confirm</Button>
          </>
        }
      />

      <Card className="p-4">
        <div className="text-sm text-gray-700">Month: April 2024 | Status: Draft</div>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {["Employee", "Basic", "Allowances", "Bonuses", "Deductions", "PAYE", "Net"].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-500">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.emp_id} className="border-t border-slate-100 hover:bg-gray-50" onClick={() => setPayslip(row)}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.name}</td>
                {["basic", "allowances", "bonuses", "deductions", "paye"].map((key) => (
                  <td key={key} className="px-4 py-3 text-sm text-gray-700">
                    <input
                      value={row[key]}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => {
                        const nextRows = rows.map((item) =>
                          item.emp_id === row.emp_id ? { ...item, [key]: Number(event.target.value), net: calculatePayrollNet({ ...item, [key]: Number(event.target.value) }) } : item,
                        );
                        setRows(nextRows);
                        financeStore.writePayroll(nextRows);
                      }}
                      className="h-10 w-28 rounded-lg border border-gray-200 px-3"
                    />
                  </td>
                ))}
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatUGX(row.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">NSSF Summary</div>
          <div className="mt-4 text-sm text-gray-700">Total employee + employer contribution: {formatUGX(nssfTotal)}</div>
        </Card>
        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">PAYE Summary</div>
          <div className="mt-4 text-sm text-gray-700">Total PAYE: {formatUGX(payeTotal)}</div>
        </Card>
      </div>

      <Modal open={Boolean(payslip)} onClose={() => setPayslip(null)} title="Payslip Preview">
        {payslip ? (
          <div className="space-y-3 text-sm text-gray-700">
            <div>Employee: {payslip.name}</div>
            <div>Earnings: {formatUGX(payslip.basic + payslip.allowances + payslip.bonuses)}</div>
            <div>Deductions: {formatUGX(payslip.nssf_emp + payslip.paye + payslip.deductions + payslip.advances_deduction)}</div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-lg font-semibold text-blue-900">NET PAY: {formatUGX(payslip.net)}</div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
