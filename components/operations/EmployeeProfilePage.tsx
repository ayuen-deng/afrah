"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { operationsStore } from "@/components/operations/store";
import { BackButton } from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatUGX } from "@/lib/ugx";

const profileTabs = ["overview", "leave", "attendance", "assets", "performance", "training", "disciplinary"] as const;

export function EmployeeProfilePage({ employeeId }: { employeeId: string }) {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [employee, setEmployee] = React.useState<any | null>(null);
  const [attendanceModal, setAttendanceModal] = React.useState<any | null>(null);
  const [reviewModal, setReviewModal] = React.useState<any | null>(null);
  const [recordOpen, setRecordOpen] = React.useState(false);
  const [tab, setTab] = React.useState<string>(searchParams.get("tab") ?? "overview");

  React.useEffect(() => {
    operationsStore.seed();
    const refresh = () => {
      setEmployee(operationsStore.readEmployees().find((item) => item.id === employeeId) ?? null);
    };
    refresh();
    window.addEventListener(operationsStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(operationsStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [employeeId]);

  if (!employee) {
    return <Card className="p-6">Employee not found.</Card>;
  }

  const attendance = operationsStore.readAttendance().filter((entry) => entry.employee_id === employeeId);
  const reviews = operationsStore.readReviews().filter((review) => review.employee_id === employeeId);
  const assets = operationsStore.readAssets().filter((asset) => asset.assigned_id === employeeId);
  const training = operationsStore.readTrainingPrograms().filter((program: any) => (program.attendees ?? []).includes(employeeId));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-3">
              <BackButton />
              <div className="flex items-center gap-4">
                <img src={employee.photo} alt={employee.name} className="h-24 w-24 rounded-full object-cover" />
                <div>
                  <div className="text-[24px] font-semibold text-gray-900">{employee.name}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="info">{employee.employee_id}</Badge>
                    <Badge variant="success">{employee.position}</Badge>
                    <Badge variant={employee.status === "active" ? "success" : employee.status === "onboarding" ? "info" : "warning"}>{employee.status}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ["Present", "58"],
            ["Absent", "2"],
            ["Leave", "3"],
            ["Salary", formatUGX(employee.salary)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-gray-200 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
              <div className="mt-2 text-lg font-semibold text-gray-900">{value}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {profileTabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === item ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </Card>

      {tab === "overview" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center justify-between"><div className="text-[18px] font-semibold text-gray-800">Personal Information</div><Button variant="secondary" onClick={() => showToast({ type: "success", title: "Editable", message: "Fields can be edited inline." })}>Edit Details</Button></div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-gray-700">
              <div>First Name: {employee.first ?? employee.name.split(" ")[0]}</div>
              <div>Last Name: {employee.last ?? employee.name.split(" ").slice(1).join(" ")}</div>
              <div>Email: {employee.email}</div>
              <div>Phone: {employee.phone}</div>
              <div>National ID: {employee.national_id ?? "-"}</div>
              <div>DOB: {employee.dob ?? "-"}</div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between"><div className="text-[18px] font-semibold text-gray-800">HR Information</div><Button variant="secondary" onClick={() => showToast({ type: "success", title: "Editable", message: "HR fields can be edited inline." })}>Edit Details</Button></div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm text-gray-700">
              <div>Employee ID: {employee.employee_id}</div>
              <div>Start Date: {employee.start_date}</div>
              <div>Contract: {employee.contract}</div>
              <div>Department: {employee.dept}</div>
              <div>Salary: {formatUGX(employee.salary)}</div>
              <div>NSSF: {employee.nssf ?? "-"}</div>
              <div>TIN: {employee.tin ?? "-"}</div>
              <div>Probation: {employee.probation_end ?? "-"}</div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between"><div className="text-[18px] font-semibold text-gray-800">Address</div><Button variant="secondary" onClick={() => showToast({ type: "success", title: "Editable", message: "Address fields can be edited inline." })}>Edit Details</Button></div>
            <div className="mt-4 text-sm text-gray-700">{employee.address ?? "-"}</div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between"><div className="text-[18px] font-semibold text-gray-800">Emergency Contact</div><Button variant="secondary" onClick={() => showToast({ type: "success", title: "Editable", message: "Emergency contact fields can be edited inline." })}>Edit Details</Button></div>
            <div className="mt-4 text-sm text-gray-700">
              {employee.emergency_name ?? "Janet Kato"} | {employee.emergency_rel ?? "Spouse"} | {employee.emergency_phone ?? "0772000001"}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "leave" ? (
        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">Leave Balances</div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {Object.entries(employee.leave_balance ?? {}).map(([label, value]: any) => (
              <div key={label} className="rounded-2xl border border-gray-200 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
                <div className="mt-2 text-sm font-semibold text-gray-900">{value.total - value.used}/{value.total} remaining</div>
                <div className="mt-3 h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.round((value.used / value.total) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {tab === "attendance" ? (
        <DataTable
          data={attendance}
          rowKey={(row) => row.id}
          selectable={false}
          onRowClick={(row) => setAttendanceModal(row)}
          columns={[
            { key: "date", header: "Date", cell: (row) => row.date },
            { key: "checkIn", header: "Check In", cell: (row) => row.check_in ?? "-" },
            { key: "checkOut", header: "Check Out", cell: (row) => row.check_out ?? "-" },
            { key: "hours", header: "Hours", cell: (row) => row.hours },
            { key: "status", header: "Status", cell: (row) => <Badge variant={row.status === "Late" ? "warning" : "success"}>{row.status}</Badge> },
          ]}
        />
      ) : null}

      {tab === "assets" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <Link key={asset.id} href={`/assets/${asset.id}`} className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-sm font-semibold text-gray-900">{asset.name}</div>
              <div className="mt-1 text-sm text-gray-600">{asset.serial}</div>
              <div className="mt-3"><Badge variant="neutral">{asset.condition}</Badge></div>
            </Link>
          ))}
        </div>
      ) : null}

      {tab === "performance" ? (
        <DataTable
          data={reviews}
          rowKey={(row) => row.id}
          selectable={false}
          onRowClick={(row) => setReviewModal(row)}
          columns={[
            { key: "period", header: "Period", cell: (row) => row.period },
            { key: "type", header: "Type", cell: (row) => row.type },
            { key: "rating", header: "Rating", cell: (row) => row.rating ?? "-" },
            { key: "status", header: "Status", cell: (row) => <Badge variant={row.status === "completed" ? "success" : "warning"}>{row.status}</Badge> },
          ]}
        />
      ) : null}

      {tab === "training" ? (
        <div className="space-y-3">
          {training.map((program: any) => (
            <div key={program.id} className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
              {program.title} | {program.date}
            </div>
          ))}
        </div>
      ) : null}

      {tab === "disciplinary" ? (
        <Card className="p-6">
          <div className="text-sm text-gray-500">(Private - visible to HR and CEO only)</div>
          <div className="mt-4"><Button onClick={() => setRecordOpen(true)}>Add Record</Button></div>
        </Card>
      ) : null}

      <Modal open={Boolean(attendanceModal)} onClose={() => setAttendanceModal(null)} title={`Attendance - ${attendanceModal?.date ?? ""}`}>
        {attendanceModal ? (
          <div className="space-y-2 text-sm text-gray-700">
            <div>Clock In: {attendanceModal.check_in}</div>
            <div>Clock Out: {attendanceModal.check_out}</div>
            <div>Hours: {attendanceModal.hours}</div>
            <div>Overtime: {attendanceModal.overtime ?? "-"}</div>
          </div>
        ) : null}
      </Modal>

      <Modal open={Boolean(reviewModal)} onClose={() => setReviewModal(null)} title="Review Detail">
        {reviewModal ? (
          <div className="space-y-2 text-sm text-gray-700">
            <div>Rating: {reviewModal.rating ?? "-"}</div>
            <div>{reviewModal.recommendation ?? "Meets Expectations"}</div>
          </div>
        ) : null}
      </Modal>

      <Modal open={recordOpen} onClose={() => setRecordOpen(false)} title="Add Disciplinary Record">
        <Button onClick={() => { setRecordOpen(false); showToast({ type: "success", title: "Saved", message: "Record added." }); }}>Save Record</Button>
      </Modal>
    </div>
  );
}
