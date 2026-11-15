"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DndContext, type DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Plus, Search, Star } from "lucide-react";
import { eachDayOfInterval, format, isValid, parse } from "date-fns";

import {
  calculateNetPay,
  makeId,
  operationsStore,
  salaryPreview,
  type AttendanceEntry,
  type EngagementAlert,
  type LeaveRequest,
  type ReviewItem,
  type SalaryAdvance,
  type SalaryHistory,
  type TrainingRequest,
} from "@/components/operations/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { BookingCalendar } from "@/components/ui/BookingCalendar";
import { formatUGX } from "@/lib/ugx";

type PeopleTab =
  | "employees"
  | "recruitment"
  | "onboarding"
  | "performance"
  | "leave"
  | "payroll"
  | "training"
  | "engagement"
  | "attendance"
  | "offboarding";

const peopleTabs: Array<{ id: PeopleTab; label: string }> = [
  { id: "employees", label: "Employees" },
  { id: "recruitment", label: "Recruitment" },
  { id: "onboarding", label: "Onboarding" },
  { id: "performance", label: "Performance" },
  { id: "leave", label: "Leave" },
  { id: "payroll", label: "Payroll & Compensation" },
  { id: "training", label: "Training" },
  { id: "engagement", label: "Engagement" },
  { id: "attendance", label: "Attendance" },
  { id: "offboarding", label: "Offboarding" },
];

function parseUgDate(value?: string) {
  if (!value) return null;
  const parsed = parse(value, "dd/MM/yyyy", new Date());
  return isValid(parsed) ? parsed : null;
}

function Tabs({ active, onChange }: { active: PeopleTab; onChange: (tab: PeopleTab) => void }) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap gap-2">
        {peopleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={[
              "rounded-lg px-4 py-2 text-sm font-medium",
              active === tab.id ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </Card>
  );
}

function DroppableStage({
  id,
  title,
  count,
  children,
}: {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className="min-w-[240px]">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        <Badge variant="neutral">{count}</Badge>
      </div>
      <div ref={setNodeRef} className={`mt-3 min-h-[200px] rounded-2xl border border-gray-200 bg-white p-3 ${isOver ? "ring-2 ring-primary/30" : ""}`}>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}

function DraggableCard({
  id,
  children,
  onClick,
}: {
  id: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  return (
    <button
      ref={setNodeRef}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      type="button"
      onClick={onClick}
      {...attributes}
      {...listeners}
      className="w-full rounded-2xl border border-gray-200 bg-slate-50 p-4 text-left"
    >
      {children}
    </button>
  );
}

export function PeoplePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const initialTab = (searchParams.get("tab") as PeopleTab | null) ?? "employees";
  const [activeTab, setActiveTab] = React.useState<PeopleTab>(
    peopleTabs.some((tab) => tab.id === initialTab) ? initialTab : "employees",
  );

  const [employees, setEmployees] = React.useState<any[]>([]);
  const [jobPositions, setJobPositions] = React.useState<any[]>([]);
  const [onboarding, setOnboarding] = React.useState<any[]>([]);
  const [reviews, setReviews] = React.useState<ReviewItem[]>([]);
  const [payroll, setPayroll] = React.useState<any[]>([]);
  const [advances, setAdvances] = React.useState<SalaryAdvance[]>([]);
  const [salaryHistory, setSalaryHistory] = React.useState<SalaryHistory[]>([]);
  const [trainingPrograms, setTrainingPrograms] = React.useState<any[]>([]);
  const [trainingRequests, setTrainingRequests] = React.useState<TrainingRequest[]>([]);
  const [leaveRequests, setLeaveRequests] = React.useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = React.useState<AttendanceEntry[]>([]);
  const [offboarding, setOffboarding] = React.useState<any[]>([]);
  const [engagementAlerts, setEngagementAlerts] = React.useState<EngagementAlert[]>([]);
  const [leavePolicy, setLeavePolicy] = React.useState({ annual: 21, sick: 10, emergency: 3 });

  const [search, setSearch] = React.useState("");
  const [employeeStatus, setEmployeeStatus] = React.useState("active");
  const [selectedJobId, setSelectedJobId] = React.useState("job-001");
  const [recruitmentView, setRecruitmentView] = React.useState<"kanban" | "table">("kanban");
  const [applicantModal, setApplicantModal] = React.useState<any | null>(null);
  const [applicantTab, setApplicantTab] = React.useState<"profile" | "interview" | "feedback">("profile");
  const [addEmployeeOpen, setAddEmployeeOpen] = React.useState(false);
  const [reviewModal, setReviewModal] = React.useState<ReviewItem | null>(null);
  const [reviewMode, setReviewMode] = React.useState<"start" | "view">("start");
  const [payslipModal, setPayslipModal] = React.useState<any | null>(null);
  const [advanceModal, setAdvanceModal] = React.useState<SalaryAdvance | null>(null);
  const [newAdvanceOpen, setNewAdvanceOpen] = React.useState(false);
  const [salaryHistoryOpen, setSalaryHistoryOpen] = React.useState(false);
  const [trainingModal, setTrainingModal] = React.useState<any | null>(null);
  const [createTrainingOpen, setCreateTrainingOpen] = React.useState(false);
  const [surveyResultsOpen, setSurveyResultsOpen] = React.useState(false);
  const [sendSurveyOpen, setSendSurveyOpen] = React.useState(false);
  const [nominateOpen, setNominateOpen] = React.useState(false);
  const [leaveRejecting, setLeaveRejecting] = React.useState<LeaveRequest | null>(null);
  const [attendanceModal, setAttendanceModal] = React.useState<AttendanceEntry | null>(null);
  const [manualLogOpen, setManualLogOpen] = React.useState(false);
  const [startOffboardingOpen, setStartOffboardingOpen] = React.useState(false);
  const [leaveSelectedDate, setLeaveSelectedDate] = React.useState<Date | null>(null);
  const [attendanceSelectedDate, setAttendanceSelectedDate] = React.useState<Date | null>(null);

  React.useEffect(() => {
    operationsStore.seed();
    const refresh = () => {
      setEmployees(operationsStore.readEmployees());
      setJobPositions(operationsStore.readJobPositions());
      setOnboarding(operationsStore.readOnboarding());
      setReviews(operationsStore.readReviews());
      setPayroll(operationsStore.readPayroll());
      setAdvances(operationsStore.readAdvances());
      setSalaryHistory(operationsStore.readSalaryHistory());
      setTrainingPrograms(operationsStore.readTrainingPrograms());
      setTrainingRequests(operationsStore.readTrainingRequests());
      setLeaveRequests(operationsStore.readLeaveRequests());
      setAttendance(operationsStore.readAttendance());
      setOffboarding(operationsStore.readOffboarding());
      setEngagementAlerts(operationsStore.readEngagementAlerts());
      setLeavePolicy(operationsStore.readLeavePolicy());
    };
    refresh();
    window.addEventListener(operationsStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(operationsStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  React.useEffect(() => {
    const next = (searchParams.get("tab") as PeopleTab | null) ?? "employees";
    if (peopleTabs.some((tab) => tab.id === next)) {
      setActiveTab(next);
    }
  }, [searchParams]);

  const filteredEmployees = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesStatus = employee.status === employeeStatus;
      const matchesQuery =
        !query ||
        employee.name.toLowerCase().includes(query) ||
        employee.email.toLowerCase().includes(query) ||
        employee.dept.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [employeeStatus, employees, search]);

  const selectedPosition = jobPositions.find((position) => position.id === selectedJobId) ?? jobPositions[0];
  const recruitmentStages = ["applied", "shortlisted", "interviewed", "hired", "rejected"];
  const selectedApplications = (selectedPosition?.applications ?? []) as any[];

  function handleTab(tab: PeopleTab) {
    setActiveTab(tab);
    router.push(`/people?tab=${tab}`);
  }

  function updateJobApplications(nextPositions: any[]) {
    operationsStore.writeJobPositions(nextPositions);
  }

  function onRecruitmentDragEnd(event: DragEndEvent) {
    const over = event.over?.id;
    const active = String(event.active.id);
    if (!over || !active.includes(":")) return;
    const [positionId, applicationId] = active.split(":");
    const next = jobPositions.map((position) => {
      if (position.id !== positionId) return position;
      return {
        ...position,
        applications: position.applications.map((application: any) =>
          application.id === applicationId ? { ...application, stage: String(over) } : application,
        ),
      };
    });
    updateJobApplications(next);
    showToast({ type: "success", title: "Stage updated", message: "Applicant moved to the new stage." });
  }

  const leaveApprovalChart = [
    { name: "Requested", value: leaveRequests.length, color: "#6366F1" },
    { name: "Approved", value: leaveRequests.filter((request) => request.status === "approved").length, color: "#10B981" },
    { name: "Pending", value: leaveRequests.filter((request) => request.status === "pending").length, color: "#F59E0B" },
    { name: "Rejected", value: leaveRequests.filter((request) => request.status === "rejected").length, color: "#EF4444" },
  ];

  const leaveTypeChart = [
    { name: "Annual", value: leaveRequests.filter((request) => request.type === "Annual").length, color: "#6366F1" },
    { name: "Sick", value: leaveRequests.filter((request) => request.type === "Sick").length, color: "#10B981" },
    { name: "Emergency", value: leaveRequests.filter((request) => request.type === "Emergency").length, color: "#F59E0B" },
  ];

  const leaveCalendarDates = React.useMemo(() => {
    const days: Date[] = [];
    leaveRequests.forEach((request) => {
      const start = parseUgDate(request.start);
      const end = parseUgDate(request.end) ?? start;
      if (!start || !end) return;
      const range = end.getTime() >= start.getTime() ? eachDayOfInterval({ start, end }) : [start];
      days.push(...range);
    });
    return days;
  }, [leaveRequests]);

  const leaveLabelsByDate = React.useMemo(() => {
    const labels: Record<string, string> = {};
    leaveRequests.forEach((request) => {
      const start = parseUgDate(request.start);
      if (!start) return;
      labels[format(start, "yyyy-MM-dd")] = request.type;
    });
    return labels;
  }, [leaveRequests]);

  const attendanceStatusByDate = React.useMemo(() => {
    const status: Record<string, "present" | "late" | "absent" | "leave"> = {};
    attendance.forEach((entry) => {
      const parsed = parseUgDate(entry.date);
      if (!parsed) return;
      const key = format(parsed, "yyyy-MM-dd");
      const normalized = String(entry.status ?? "").toLowerCase();
      if (normalized.includes("leave")) {
        status[key] = "leave";
      } else if (normalized.includes("late")) {
        status[key] = "late";
      } else if (normalized.includes("absent")) {
        status[key] = "absent";
      } else {
        status[key] = "present";
      }
    });
    return status;
  }, [attendance]);

  const attendanceLabelsByDate = React.useMemo(() => {
    const labels: Record<string, string> = {};
    attendance.forEach((entry) => {
      const parsed = parseUgDate(entry.date);
      if (!parsed) return;
      labels[format(parsed, "yyyy-MM-dd")] = entry.status;
    });
    return labels;
  }, [attendance]);

  const filteredAttendance = React.useMemo(() => {
    if (!attendanceSelectedDate) return attendance;
    const selected = format(attendanceSelectedDate, "dd/MM/yyyy");
    return attendance.filter((entry) => entry.date === selected);
  }, [attendance, attendanceSelectedDate]);

  const attendanceSelectedLabel = attendanceSelectedDate
    ? format(attendanceSelectedDate, "dd/MM/yyyy")
    : "04/04/2024";

  return (
    <div className="space-y-6">
      <PageHeader
        title="People"
        subtitle="HR lifecycle, payroll coordination, engagement, and workforce operations."
        actions={
          activeTab === "employees" ? (
            <Button onClick={() => setAddEmployeeOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          ) : activeTab === "recruitment" ? (
            <Button onClick={() => setApplicantModal({ createPosition: true })}>
              <Plus className="h-4 w-4" />
              Create Position
            </Button>
          ) : activeTab === "offboarding" ? (
            <Button onClick={() => setStartOffboardingOpen(true)}>
              <Plus className="h-4 w-4" />
              Start Offboarding
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => showToast({ type: "success", title: "Export ready", message: "Export prepared successfully." })}>
              Export
            </Button>
          )
        }
      />

      <Tabs active={activeTab} onChange={handleTab} />

      {activeTab === "employees" ? (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {[
                  ["active", "Active"],
                  ["onboarding", "Onboarding"],
                  ["on_leave", "On Leave"],
                  ["dismissed", "Dismissed"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setEmployeeStatus(value)}
                    className={[
                      "rounded-lg px-4 py-2 text-sm font-medium",
                      employeeStatus === value ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="relative w-full max-w-xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search employees..."
                  className="w-full rounded-xl border border-gray-200 px-10 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </Card>

          <DataTable
            data={filteredEmployees}
            rowKey={(row) => row.id}
            onRowClick={(row) => router.push(`/people/employees/${row.id}`)}
            columns={[
              {
                key: "employee",
                header: "Employee",
                cell: (row) => (
                  <div className="flex items-center gap-3">
                    <img src={row.photo} alt={row.name} className="h-10 w-10 rounded-full object-cover" />
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{row.name}</div>
                      <div className="text-xs text-gray-500">{row.email}</div>
                    </div>
                  </div>
                ),
                className: "min-w-[260px]",
              },
              { key: "dept", header: "Dept", cell: (row) => row.dept },
              { key: "position", header: "Position", cell: (row) => row.position },
              { key: "contract", header: "Contract", cell: (row) => row.contract },
              {
                key: "status",
                header: "Status",
                cell: (row) => (
                  <Badge variant={row.status === "active" ? "success" : row.status === "on_leave" ? "warning" : row.status === "onboarding" ? "info" : "error"} dot>
                    {row.status.replaceAll("_", " ")}
                  </Badge>
                ),
              },
            ]}
            rowActions={(row) => [
              { label: "View Profile", onClick: () => router.push(`/people/employees/${row.id}`) },
              { label: "Edit", onClick: () => showToast({ type: "info", title: "Inline edit", message: `${row.name} can be edited in profile view.` }) },
              { label: "Deactivate", onClick: () => showToast({ type: "info", title: "Confirmation", message: "Use the profile page to deactivate staff." }) },
              { label: "Start Offboarding", onClick: () => setStartOffboardingOpen(true) },
            ]}
          />
        </div>
      ) : null}

      {activeTab === "recruitment" ? (
        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <Card className="p-6">
            <div className="text-[18px] font-semibold text-gray-800">Job Board</div>
            <div className="mt-4 space-y-3">
              {jobPositions.map((position) => (
                <button
                  key={position.id}
                  type="button"
                  onClick={() => setSelectedJobId(position.id)}
                  className={`w-full rounded-2xl border p-4 text-left ${selectedJobId === position.id ? "border-primary bg-blue-50" : "border-gray-200 bg-white"}`}
                >
                  <div className="text-sm font-semibold text-gray-900">{position.title}</div>
                  <div className="mt-1 text-sm text-gray-600">{position.dept}</div>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>{position.applicants} applicants</span>
                    <Badge variant="info">{position.status}</Badge>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[18px] font-semibold text-gray-800">Applications</div>
                  <div className="mt-1 text-sm text-gray-600">{selectedPosition?.title}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant={recruitmentView === "kanban" ? "primary" : "secondary"} onClick={() => setRecruitmentView("kanban")}>
                    Board
                  </Button>
                  <Button variant={recruitmentView === "table" ? "primary" : "secondary"} onClick={() => setRecruitmentView("table")}>
                    Table
                  </Button>
                </div>
              </div>
            </Card>

            {recruitmentView === "kanban" ? (
              <DndContext onDragEnd={onRecruitmentDragEnd}>
                <div className="overflow-x-auto">
                  <div className="flex gap-4 pb-2">
                    {recruitmentStages.map((stage) => {
                      const apps = selectedPosition?.applications.filter((application: any) => application.stage === stage) ?? [];
                      return (
                        <DroppableStage key={stage} id={stage} title={stage.replaceAll("_", " ")} count={apps.length}>
                          {apps.map((application: any) => (
                            <DraggableCard key={application.id} id={`${selectedPosition.id}:${application.id}`} onClick={() => setApplicantModal(application)}>
                              <div className="text-sm font-semibold text-gray-900">{application.name}</div>
                              <div className="mt-1 text-xs text-gray-500">{application.applied_date}</div>
                              <div className="mt-3 flex items-center justify-between">
                                <Badge variant={stage === "hired" ? "info" : stage === "rejected" ? "error" : stage === "interviewed" ? "success" : "warning"}>
                                  {stage}
                                </Badge>
                                <Badge variant="neutral">Design</Badge>
                              </div>
                            </DraggableCard>
                          ))}
                        </DroppableStage>
                      );
                    })}
                  </div>
                </div>
              </DndContext>
            ) : (
              <DataTable<any>
                data={selectedApplications}
                rowKey={(row) => row.id}
                onRowClick={(row) => setApplicantModal(row)}
                columns={[
                  {
                    key: "name",
                    header: "Applicant",
                    cell: (row) => (
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{row.name}</div>
                        <div className="text-xs text-gray-500">{row.email}</div>
                      </div>
                    ),
                  },
                  { key: "phone", header: "Phone", cell: (row) => row.phone },
                  { key: "interview", header: "Interview Date", cell: (row) => row.interview_date ?? "-" },
                  { key: "assigned", header: "Assigned To", cell: (row) => row.assigned_to ?? "-" },
                  { key: "type", header: "Interview Type", cell: (row) => row.interview_type ?? "-" },
                  {
                    key: "status",
                    header: "Status",
                    cell: (row) => <Badge variant={row.stage === "hired" ? "info" : row.stage === "rejected" ? "error" : row.stage === "interviewed" ? "success" : "warning"}>{row.stage}</Badge>,
                  },
                ]}
              />
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "onboarding" ? (
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[18px] font-semibold text-gray-800">Onboarding Board</div>
              <div className="mt-1 text-sm text-gray-600">HRMS-inspired kanban for new joiners.</div>
            </div>
            <Button variant="secondary" onClick={() => showToast({ type: "info", title: "Workflow", message: "Workflow view is available in the detail page." })}>
              Workflow View
            </Button>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {["New Recruit", "Account Setup", "Documents", "Training"].map((column) => (
              <div key={column} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">{column}</div>
                  <Badge variant="neutral">{column === "Account Setup" ? 1 : 0}</Badge>
                </div>
                {column === "Account Setup" ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/people/onboarding/${onboarding[0].id}`)}
                    className="mt-4 w-full rounded-2xl border border-gray-200 bg-slate-50 p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <img src={onboarding[0].photo} alt={onboarding[0].employee} className="h-10 w-10 rounded-full object-cover" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{onboarding[0].employee}</div>
                        <div className="text-xs text-gray-500">{onboarding[0].dept}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant="info">{onboarding[0].progress}% progress</Badge>
                      <span className="text-xs text-gray-500">Open</span>
                    </div>
                  </button>
                ) : (
                  <div className="mt-4 text-sm text-gray-400">No cards</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {activeTab === "performance" ? (
        <div className="space-y-6">
          <DataTable
            data={reviews}
            rowKey={(row) => row.id}
            columns={[
              { key: "employee", header: "Employee", cell: (row) => row.employee },
              { key: "type", header: "Review", cell: (row) => row.type },
              { key: "period", header: "Period", cell: (row) => row.period },
              {
                key: "status",
                header: "Status",
                cell: (row) => <Badge variant={row.status === "completed" ? "success" : row.status === "overdue" ? "error" : "warning"}>{row.status.replaceAll("_", " ")}</Badge>,
              },
            ]}
            rowActions={(row) => [
              {
                label: row.status === "completed" ? "View Review" : "Start Review",
                onClick: () => {
                  setReviewMode(row.status === "completed" ? "view" : "start");
                  setReviewModal(row);
                },
              },
            ]}
          />

          <Card className="p-6">
            <div className="text-[18px] font-semibold text-gray-800">Team Performance Summary</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {employees.filter((employee) => employee.performance_rating).map((employee) => (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => router.push(`/people/employees/${employee.id}`)}
                  className="rounded-2xl border border-gray-200 bg-white p-4 text-left"
                >
                  <div className="text-sm font-semibold text-gray-900">{employee.name}</div>
                  <div className="mt-1 text-xs text-gray-500">{employee.position}</div>
                  <div className="mt-4 inline-flex rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                    {employee.performance_rating}/5
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "payroll" ? (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[18px] font-semibold text-gray-800">Monthly Payroll</div>
                <div className="mt-1 text-sm text-gray-600">Draft for April 2024</div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setSalaryHistoryOpen(true)}>NSSF Summary</Button>
                <Button variant="secondary" onClick={() => setSalaryHistoryOpen(true)}>PAYE Summary</Button>
                <Button onClick={() => showToast({ type: "success", title: "Submitted", message: "Payroll submitted to Finance." })}>Submit to Finance</Button>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {["Employee", "Basic", "Allowances", "Bonus", "Deductions", "Advance Repay", "Net"].map((header) => (
                      <th key={header} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payroll.map((row) => (
                    <tr key={row.emp_id} className="border-b border-slate-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setPayslipModal(row)} className="text-left text-sm font-semibold text-gray-900">
                          {row.name}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          value={row.basic}
                          onChange={(event) => {
                            const next = payroll.map((item) =>
                              item.emp_id === row.emp_id
                                ? {
                                    ...item,
                                    basic: Number(event.target.value || 0),
                                    nssf_emp: Math.round(Number(event.target.value || 0) * 0.05),
                                    nssf_employer: Math.round(Number(event.target.value || 0) * 0.1),
                                  }
                                : item,
                            );
                            setPayroll(next);
                            operationsStore.writePayroll(next.map((item) => ({ ...item, net: calculateNetPay(item) })));
                          }}
                          className="w-28 rounded-lg border border-gray-200 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">{formatUGX(row.allowances)}</td>
                      <td className="px-4 py-3">{formatUGX(row.bonuses)}</td>
                      <td className="px-4 py-3">{formatUGX(row.deductions)}</td>
                      <td className="px-4 py-3">{formatUGX(row.advances_deduction)}</td>
                      <td className="px-4 py-3 font-semibold text-primary">{formatUGX(calculateNetPay(row))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[18px] font-semibold text-gray-800">Salary Advances</div>
                  <div className="mt-1 text-sm text-gray-600">Approval flow and repayment schedule.</div>
                </div>
                <Button onClick={() => setNewAdvanceOpen(true)}>New Advance Request</Button>
              </div>
              <div className="mt-5 space-y-3">
                {advances.map((advance) => (
                  <button key={advance.id} type="button" onClick={() => setAdvanceModal(advance)} className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900">{advance.employee}</div>
                      <Badge variant="warning">{advance.status}</Badge>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {formatUGX(advance.amount)} | Remaining {formatUGX(advance.remaining)}
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[18px] font-semibold text-gray-800">Salary History</div>
                  <div className="mt-1 text-sm text-gray-600">Track salary changes and approvals.</div>
                </div>
                <Button onClick={() => setSalaryHistoryOpen(true)}>Record Salary Change</Button>
              </div>
              <div className="mt-5 space-y-3">
                {salaryHistory.length ? salaryHistory.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="text-sm font-semibold text-gray-900">{item.employee}</div>
                    <div className="mt-2 text-sm text-gray-600">
                      {formatUGX(item.previous_salary)} to {formatUGX(item.new_salary)} | {item.reason}
                    </div>
                  </div>
                )) : <EmptyState title="No salary history yet" description="Record a salary change to populate this log." />}
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {activeTab === "training" ? (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[18px] font-semibold text-gray-800">Training Calendar</div>
                <div className="mt-1 text-sm text-gray-600">Upcoming and completed learning sessions.</div>
              </div>
              <Button onClick={() => setCreateTrainingOpen(true)}>Create Training Program</Button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {trainingPrograms.map((program) => (
                <button key={program.id} type="button" onClick={() => setTrainingModal(program)} className="rounded-2xl border border-gray-200 bg-white p-4 text-left">
                  <div className="text-sm font-semibold text-gray-900">{program.title}</div>
                  <div className="mt-1 text-sm text-gray-600">{program.date}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant={program.status === "completed" ? "success" : "info"}>{program.status}</Badge>
                    <span className="text-xs text-gray-500">{program.dept}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-[18px] font-semibold text-gray-800">Training Requests</div>
            <div className="mt-4 space-y-3">
              {trainingRequests.map((request) => (
                <div key={request.id} className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{request.employee}</div>
                    <div className="mt-1 text-sm text-gray-600">{request.title}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        const nextRequests: TrainingRequest[] = trainingRequests.map((item) =>
                          item.id === request.id ? { ...item, status: "approved" as const } : item,
                        );
                        operationsStore.writeTrainingRequests(nextRequests);
                        operationsStore.writeTrainingPrograms([
                          ...trainingPrograms,
                          {
                            id: makeId("program"),
                            title: request.title,
                            type: "External Course",
                            dept: "Design",
                            trainer: "Partner Academy",
                            date: "25/04/2024",
                            duration: "1 day",
                            cost: 250000,
                            attendees: [request.employee_id],
                            status: "upcoming",
                          },
                        ]);
                        showToast({ type: "success", title: "Approved", message: "Training request approved and program created." });
                      }}
                    >
                      Approve
                    </Button>
                    <Button variant="secondary" onClick={() => showToast({ type: "info", title: "Queued", message: "Request kept pending." })}>
                      Hold
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-[18px] font-semibold text-gray-800">Skills Matrix</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {employees.filter((employee) => employee.dept === "Design").map((employee) => (
                <div key={employee.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-sm font-semibold text-gray-900">{employee.name}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Motion Graphics", "Video Editing", "3D Animation"].map((skill) => {
                      const hasSkill = employee.skills?.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => !hasSkill && setCreateTrainingOpen(true)}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${hasSkill ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                        >
                          {hasSkill ? `OK ${skill}` : `Gap ${skill}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "engagement" ? (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[18px] font-semibold text-gray-800">Pulse Surveys</div>
                <div className="mt-1 text-sm text-gray-600">Team pulse and satisfaction trends.</div>
              </div>
              <Button onClick={() => setSendSurveyOpen(true)}>Send Survey</Button>
            </div>
            <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{operationsStore.pulseSurvey.title}</div>
                  <div className="mt-1 text-sm text-gray-600">{operationsStore.pulseSurvey.responses}/{operationsStore.pulseSurvey.total_staff} responses</div>
                </div>
                <Button variant="secondary" onClick={() => setSurveyResultsOpen(true)}>View Results</Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[18px] font-semibold text-gray-800">Employee of the Month</div>
                <div className="mt-1 text-sm text-gray-600">Recognition and nomination history.</div>
              </div>
              <Button onClick={() => setNominateOpen(true)}>Nominate for April</Button>
            </div>
            <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
              <div className="text-lg font-semibold text-gray-900">{operationsStore.recognition.employee}</div>
              <div className="mt-2 text-sm text-gray-600">{operationsStore.recognition.reason}</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-[18px] font-semibold text-gray-800">Engagement Alerts</div>
            <div className="mt-5 space-y-3">
              {engagementAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div>
                    <div className="text-sm font-semibold text-amber-900">{alert.employee}</div>
                    <div className="mt-1 text-sm text-amber-800">{alert.text}</div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const next = engagementAlerts.filter((item) => item.id !== alert.id);
                      operationsStore.writeEngagementAlerts(next);
                      showToast({ type: "success", title: "Reviewed", message: "Engagement alert dismissed." });
                    }}
                  >
                    Mark as Reviewed
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "leave" ? (
        <div className="space-y-6">
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
            {[leaveApprovalChart, leaveTypeChart].map((chart, index) => (
              <Card key={index} className="p-6">
                <div className="text-[18px] font-semibold text-gray-800">{index === 0 ? "Approval Status" : "Leave Type"}</div>
                <div className="mt-4 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chart} dataKey="value" innerRadius={50} outerRadius={80}>
                        {chart.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            ))}
            <Card className="p-6">
              <div className="text-[18px] font-semibold text-gray-800">Who is Off Today</div>
              <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold text-gray-900">Diana Auma</div>
                <div className="mt-1 text-sm text-gray-600">Sick leave | Returns 06/04</div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[18px] font-semibold text-gray-800">Leave Calendar</div>
                <div className="mt-1 text-sm text-gray-600">Leave days are highlighted with booked date styling.</div>
              </div>
              <Button
                variant="secondary"
                onClick={() => setLeaveSelectedDate(null)}
                autoLoadOnClick={false}
              >
                Clear Selection
              </Button>
            </div>
            <div className="mt-5">
              <BookingCalendar
                bookedDates={leaveCalendarDates}
                activeDates={[]}
                selectedDate={leaveSelectedDate}
                onDateSelect={setLeaveSelectedDate}
                labelsByDate={leaveLabelsByDate}
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-[18px] font-semibold text-gray-800">Employee Leave List</div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => showToast({ type: "success", title: "Exported", message: "Leave report exported." })}>Export</Button>
                <Button
                  onClick={() => {
                    const next = leaveRequests.map((request) => ({ ...request, status: "approved" as const }));
                    operationsStore.writeLeaveRequests(next);
                    showToast({ type: "success", title: "Approved", message: "All leave requests approved." });
                  }}
                >
                  Approve All
                </Button>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {leaveRequests.map((request) => (
                <div key={request.id} className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <button type="button" onClick={() => router.push(`/people/employees/${request.employee_id}`)} className="text-left text-sm font-semibold text-gray-900">
                      {request.employee}
                    </button>
                    <div className="mt-1 text-sm text-gray-600">
                      {request.type} | {request.start} to {request.end} | {request.days} days
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={request.status === "approved" ? "success" : request.status === "rejected" ? "error" : "warning"}>
                      {request.status}
                    </Badge>
                    {request.status === "pending" ? (
                      <>
                        <Button
                          onClick={() => {
                            const next = leaveRequests.map((item) => item.id === request.id ? { ...item, status: "approved" as const } : item);
                            operationsStore.writeLeaveRequests(next);
                            showToast({ type: "success", title: "Approved", message: `Leave approved. ${request.employee} notified.` });
                          }}
                        >
                          Approve
                        </Button>
                        <Button variant="danger" onClick={() => setLeaveRejecting(request)}>
                          x
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-[18px] font-semibold text-gray-800">Leave Balances</div>
            <div className="mt-5 space-y-4">
              {employees.filter((employee) => employee.leave_balance).map((employee) => (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => router.push(`/people/employees/${employee.id}`)}
                  className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left"
                >
                  <div className="text-sm font-semibold text-gray-900">{employee.name}</div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {Object.entries(employee.leave_balance).map(([label, value]: any) => {
                      const percent = Math.round((value.used / value.total) * 100);
                      return (
                        <div key={label}>
                          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-500">
                            <span>{label}</span>
                            <span>{value.total - value.used}/{value.total}</span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-gray-100">
                            <div className="h-2 rounded-full bg-primary" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[18px] font-semibold text-gray-800">Leave Policies</div>
                <div className="mt-1 text-sm text-gray-600">Editable policy settings.</div>
              </div>
              <Button
                onClick={() => {
                  operationsStore.writeLeavePolicy(leavePolicy);
                  showToast({ type: "success", title: "Saved", message: "Leave policies updated." });
                }}
              >
                Save Policies
              </Button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {(["annual", "sick", "emergency"] as const).map((key) => (
                <label key={key} className="space-y-2 text-sm font-medium text-gray-700">
                  <span className="capitalize">{key}</span>
                  <input
                    type="number"
                    value={leavePolicy[key]}
                    onChange={(event) => setLeavePolicy((current) => ({ ...current, [key]: Number(event.target.value || 0) }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2"
                  />
                </label>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "attendance" ? (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[18px] font-semibold text-gray-800">Attendance</div>
                <div className="mt-1 text-sm text-gray-600">{attendanceSelectedLabel} workforce check-ins.</div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => showToast({ type: "info", title: "Previous day", message: "Showing 03/04/2024 data." })}>
                  Previous Day
                </Button>
                <Button variant="secondary" onClick={() => setManualLogOpen(true)}>
                  Manual Log
                </Button>
                <Button variant="secondary" onClick={() => showToast({ type: "success", title: "Exported", message: "Attendance exported." })}>
                  Export
                </Button>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[18px] font-semibold text-gray-800">Attendance Calendar</div>
                <div className="mt-1 text-sm text-gray-600">Present (green), Late (amber), Absent (red), Leave (blue).</div>
              </div>
              <Button variant="secondary" autoLoadOnClick={false} onClick={() => setAttendanceSelectedDate(null)}>
                Clear Selection
              </Button>
            </div>
            <div className="mt-5">
              <BookingCalendar
                bookedDates={[]}
                activeDates={[]}
                selectedDate={attendanceSelectedDate}
                onDateSelect={setAttendanceSelectedDate}
                statusByDate={attendanceStatusByDate}
                labelsByDate={attendanceLabelsByDate}
              />
            </div>
          </Card>
          <DataTable
            data={filteredAttendance}
            rowKey={(row) => row.id}
            onRowClick={(row) => setAttendanceModal(row)}
            columns={[
              { key: "employee", header: "Employee", cell: (row) => row.employee },
              { key: "checkIn", header: "Check In", cell: (row) => row.check_in ?? "-" },
              { key: "checkOut", header: "Check Out", cell: (row) => row.check_out ?? "-" },
              { key: "hours", header: "Hours", cell: (row) => row.hours },
              {
                key: "status",
                header: "Status",
                cell: (row) => <Badge variant={row.status === "Present" || row.status === "Early" ? "success" : row.status === "Late" ? "warning" : row.status === "On Leave" ? "info" : "neutral"}>{row.status}</Badge>,
              },
            ]}
          />
        </div>
      ) : null}

      {activeTab === "offboarding" ? (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="text-[18px] font-semibold text-gray-800">Active Offboarding</div>
            <div className="mt-5 space-y-4">
              {offboarding.map((item) => (
                <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{item.employee}</div>
                      <div className="mt-1 text-sm text-gray-600">
                        {item.reason} | Last Day: {item.last_day} | {item.progress}% progress
                      </div>
                    </div>
                    <Button onClick={() => router.push(`/people/offboarding/${item.id}`)}>Open Checklist</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-[18px] font-semibold text-gray-800">Offboarding History</div>
            <div className="mt-4 text-sm text-gray-600">Past records appear here once processes are completed.</div>
          </Card>
        </div>
      ) : null}

      <Modal open={addEmployeeOpen} onClose={() => setAddEmployeeOpen(false)} title="Add Employee">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="text-sm font-semibold text-gray-900">Section 1 - Personal</div>
            <div className="mt-2 text-sm text-gray-600">Five-section form simulated for employee onboarding.</div>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            CEO approval required when salary is above UGX 500,000.
          </div>
        </div>
        <div className="mt-4">
          <Button
            onClick={() => {
              showToast({ type: "success", title: "Submitted", message: "Employee request submitted for CEO approval." });
              setAddEmployeeOpen(false);
            }}
          >
            Add Employee
          </Button>
        </div>
      </Modal>

      <Modal open={Boolean(applicantModal)} onClose={() => setApplicantModal(null)} title={applicantModal?.createPosition ? "Create Position" : applicantModal?.name ?? "Applicant"}>
        {applicantModal?.createPosition ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input className="rounded-xl border border-gray-200 px-3 py-2" placeholder="Title" />
              <input className="rounded-xl border border-gray-200 px-3 py-2" placeholder="Dept" />
              <textarea className="md:col-span-2 rounded-xl border border-gray-200 px-3 py-2" placeholder="Description and requirements" />
            </div>
            <Button
              onClick={() => {
                operationsStore.writeJobPositions([
                  ...jobPositions,
                  { id: makeId("job"), title: "Content Strategist", dept: "Marketing", status: "open", posted: "04/04/2024", applicants: 0, salary_range: "UGX 1,000,000 - 1,400,000", applications: [] },
                ]);
                setApplicantModal(null);
                showToast({ type: "success", title: "Created", message: "Position added to the job board." });
              }}
            >
              Create Position
            </Button>
          </div>
        ) : applicantModal ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              {(["profile", "interview", "feedback"] as const).map((tab) => (
                <button key={tab} type="button" onClick={() => setApplicantTab(tab)} className={`rounded-lg px-4 py-2 text-sm font-medium ${applicantTab === tab ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                  {tab}
                </button>
              ))}
            </div>
            {applicantTab === "profile" ? (
              <div className="space-y-3 text-sm text-gray-700">
                <div>{applicantModal.email}</div>
                <div>{applicantModal.phone}</div>
                <div>Applied: {applicantModal.applied_date}</div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => showToast({ type: "info", title: "Preview", message: "CV preview opened." })}>View CV</Button>
                  <Button variant="secondary" onClick={() => showToast({ type: "success", title: "Downloaded", message: "CV download started." })}>Download CV</Button>
                </div>
              </div>
            ) : null}
            {applicantTab === "interview" ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-700">
                  {applicantModal.interview_date
                    ? `Scheduled: ${applicantModal.interview_date}, ${applicantModal.interview_type}, Assigned to ${applicantModal.assigned_to ?? "Amara Nantongo"}`
                    : "No interview scheduled yet."}
                </div>
                <Button
                  onClick={() => {
                    const next = jobPositions.map((position) =>
                      position.id !== selectedPosition.id
                        ? position
                        : {
                            ...position,
                            applications: position.applications.map((application: any) =>
                              application.id === applicantModal.id
                                ? { ...application, interview_date: "12/04/2024 10:00", interview_type: "In Person", assigned_to: "Amara Nantongo" }
                                : application,
                            ),
                          },
                    );
                    operationsStore.writeJobPositions(next);
                    showToast({ type: "success", title: "Interview scheduled", message: `Interview scheduled for ${applicantModal.name}.` });
                  }}
                >
                  {applicantModal.interview_date ? "Reschedule" : "Schedule Interview"}
                </Button>
              </div>
            ) : null}
            {applicantTab === "feedback" ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="flex gap-2">
                  {["Hire", "Maybe", "Do Not Hire"].map((label) => (
                    <Badge key={label} variant={label === "Do Not Hire" ? "error" : label === "Maybe" ? "warning" : "success"}>{label}</Badge>
                  ))}
                </div>
                <Button onClick={() => showToast({ type: "success", title: "Saved", message: "Feedback saved." })}>Save Feedback</Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal open={Boolean(reviewModal)} onClose={() => setReviewModal(null)} title={reviewMode === "view" ? "View Review" : `Start Review - ${reviewModal?.employee ?? ""}`}>
        {reviewModal ? (
          <div className="space-y-4">
            {reviewMode === "start" ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {["Technical", "Communication", "Collaboration", "Initiative", "Attitude"].map((label) => (
                    <div key={label} className="rounded-2xl border border-gray-200 p-3 text-center text-sm">
                      <div>{label}</div>
                      <div className="mt-2 flex justify-center gap-1">{Array.from({ length: 4 }).map((_, index) => <Star key={index} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => {
                    const next = reviews.map((item) => item.id === reviewModal.id ? { ...item, status: "completed" as const, rating: 3.4, recommendation: "Meets Expectations" } : item);
                    operationsStore.writeReviews(next);
                    setReviewModal(null);
                    showToast({ type: "success", title: "Submitted", message: "Review completed." });
                  }}
                >
                  Submit Review
                </Button>
              </>
            ) : (
              <div className="space-y-3 text-sm text-gray-700">
                <Badge variant="success">{reviewModal.recommendation ?? "Meets Expectations"}</Badge>
                <div>Overall rating: {reviewModal.rating}/5</div>
                <div>{reviewModal.wins}</div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal open={Boolean(payslipModal)} onClose={() => setPayslipModal(null)} title="Payslip Preview">
        {payslipModal ? (
          <div className="space-y-4 text-sm text-gray-700">
            <div>Earnings: {formatUGX(payslipModal.basic)} + {formatUGX(payslipModal.allowances)} + {formatUGX(payslipModal.bonuses)}</div>
            <div>Deductions: {formatUGX(payslipModal.nssf_emp + payslipModal.paye + payslipModal.deductions + payslipModal.advances_deduction)}</div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-lg font-semibold text-blue-900">
              {salaryPreview(payslipModal).summary}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={Boolean(advanceModal)} onClose={() => setAdvanceModal(null)} title="Advance Detail">
        {advanceModal ? (
          <div className="space-y-3">
            {advanceModal.schedule.map((line) => (
              <div key={line.month} className="flex items-center justify-between rounded-xl border border-gray-200 p-3 text-sm">
                <span>{line.month}</span>
                <span>{formatUGX(line.amount)}</span>
                <Badge variant={line.status === "paid" ? "success" : "warning"}>{line.status}</Badge>
              </div>
            ))}
          </div>
        ) : null}
      </Modal>

      <Modal open={newAdvanceOpen} onClose={() => setNewAdvanceOpen(false)} title="New Advance Request">
        <Button
          onClick={() => {
            operationsStore.writeAdvances([
              ...advances,
              {
                id: makeId("adv"),
                employee_id: "emp-005",
                employee: "Diana Auma",
                amount: 200000,
                repaid: 0,
                remaining: 200000,
                reason: "Medical",
                status: "pending",
                schedule: [
                  { month: "May", amount: 100000, status: "pending" },
                  { month: "June", amount: 100000, status: "pending" },
                ],
              },
            ]);
            setNewAdvanceOpen(false);
            showToast({ type: "success", title: "Submitted", message: "Advance request created." });
          }}
        >
          Submit
        </Button>
      </Modal>

      <Modal open={salaryHistoryOpen} onClose={() => setSalaryHistoryOpen(false)} title="Salary Change">
        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">CEO approval required only for increases above 20%.</div>
          <Button
            onClick={() => {
              operationsStore.writeSalaryHistory([
                ...salaryHistory,
                {
                  id: makeId("salary"),
                  employee_id: "emp-001",
                  employee: "Brian Kato",
                  previous_salary: 1500000,
                  new_salary: 1600000,
                  reason: "Annual Review",
                  date: "04/04/2024",
                },
              ]);
              setSalaryHistoryOpen(false);
              showToast({ type: "success", title: "Saved", message: "Salary change recorded." });
            }}
          >
            Save Change
          </Button>
        </div>
      </Modal>

      <Modal open={Boolean(trainingModal)} onClose={() => setTrainingModal(null)} title={trainingModal?.title}>
        {trainingModal ? (
          <div className="space-y-4 text-sm text-gray-700">
            <div>{trainingModal.date} | {trainingModal.duration}</div>
            <div>Attendees: {(trainingModal.attendees ?? []).length}</div>
            <Button onClick={() => showToast({ type: "success", title: "Uploaded", message: "Certificate uploaded." })}>Upload Certificate</Button>
          </div>
        ) : null}
      </Modal>

      <Modal open={createTrainingOpen} onClose={() => setCreateTrainingOpen(false)} title="Create Training Program">
        <Button
          onClick={() => {
            operationsStore.writeTrainingPrograms([
              ...trainingPrograms,
              {
                id: makeId("training"),
                title: "Adobe Premiere Pro Basics",
                type: "Internal Workshop",
                dept: "Design",
                trainer: "Brian Kato",
                date: "25/04/2024",
                duration: "4 hours",
                cost: 0,
                attendees: ["emp-002"],
                status: "upcoming",
              },
            ]);
            setCreateTrainingOpen(false);
            showToast({ type: "success", title: "Created", message: "Training program added." });
          }}
        >
          Create Program
        </Button>
      </Modal>

      <Modal open={surveyResultsOpen} onClose={() => setSurveyResultsOpen(false)} title="Survey Results">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">4.1</div>
            <div className="text-sm text-gray-500">Average rating</div>
          </div>
          <div className="rounded-2xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">75%</div>
            <div className="text-sm text-gray-500">Recognition yes</div>
          </div>
          <div className="rounded-2xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">7.8</div>
            <div className="text-sm text-gray-500">NPS</div>
          </div>
        </div>
      </Modal>

      <Modal open={sendSurveyOpen} onClose={() => setSendSurveyOpen(false)} title="Send Survey">
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 p-4 text-sm text-gray-700">Pre-set questions loaded. Add question row included.</div>
          <Button onClick={() => { setSendSurveyOpen(false); showToast({ type: "success", title: "Sent", message: "Survey sent to 5 employees." }); }}>
            Send Survey
          </Button>
        </div>
      </Modal>

      <Modal open={nominateOpen} onClose={() => setNominateOpen(false)} title="Nominate Employee of the Month">
        <Button onClick={() => { setNominateOpen(false); showToast({ type: "success", title: "Updated", message: "Employee of the month updated." }); }}>
          Nominate Fatuma Namutebi
        </Button>
      </Modal>

      <Modal open={Boolean(leaveRejecting)} onClose={() => setLeaveRejecting(null)} title="Reject Leave Request">
        {leaveRejecting ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-700">Reason: Month-end payroll period, cannot approve.</div>
            <Button
              variant="danger"
              onClick={() => {
                const next = leaveRequests.map((request) =>
                  request.id === leaveRejecting.id
                    ? { ...request, status: "rejected" as const, rejection_reason: "Month-end payroll period, cannot approve" }
                    : request,
                );
                operationsStore.writeLeaveRequests(next);
                setLeaveRejecting(null);
                showToast({ type: "success", title: "Rejected", message: "Leave request rejected." });
              }}
            >
              Reject
            </Button>
          </div>
        ) : null}
      </Modal>

      <Modal open={Boolean(attendanceModal)} onClose={() => setAttendanceModal(null)} title={`Attendance - ${attendanceModal?.employee ?? ""}`}>
        {attendanceModal ? (
          <div className="space-y-3 text-sm text-gray-700">
            <div>Clock In: {attendanceModal.check_in ?? "-"}</div>
            <div>Clock Out: {attendanceModal.check_out ?? "-"}</div>
            <div>Hours: {attendanceModal.hours}</div>
            <div>Overtime: {attendanceModal.overtime ?? "-"}</div>
            <Button variant="secondary" onClick={() => showToast({ type: "info", title: "Edit enabled", message: "Attendance entry is editable." })}>
              Edit Entry
            </Button>
          </div>
        ) : null}
      </Modal>

      <Modal open={manualLogOpen} onClose={() => setManualLogOpen(false)} title="Manual Log">
        <Button
          onClick={() => {
            operationsStore.writeAttendance([
              ...attendance,
              {
                id: makeId("att"),
                employee_id: "emp-006",
                employee: "Joseph Okello",
                date: "04/04/2024",
                check_in: "08:30",
                check_out: "17:00",
                hours: "8h 30m",
                status: "Present",
                notes: "First day - orientation",
              },
            ]);
            setManualLogOpen(false);
            showToast({ type: "success", title: "Saved", message: "Attendance entry added." });
          }}
        >
          Save Entry
        </Button>
      </Modal>

      <Modal open={startOffboardingOpen} onClose={() => setStartOffboardingOpen(false)} title="Start Offboarding">
        <Button
          onClick={() => {
            operationsStore.writeOffboarding([
              ...offboarding,
              {
                id: makeId("off"),
                employee_id: "emp-005",
                employee: "Diana Auma",
                dept: "Customer Service",
                photo: "https://picsum.photos/seed/emp5/100/100",
                initials: "DA",
                color: "bg-pink-500",
                reason: "Resignation",
                notice_date: "15/04/2024",
                last_day: "15/05/2024",
                progress: 0,
                exit_interview_done: false,
                tasks: [],
              },
            ]);
            setStartOffboardingOpen(false);
            showToast({ type: "success", title: "Started", message: "Offboarding process created." });
          }}
        >
          Start Offboarding Process
        </Button>
      </Modal>
    </div>
  );
}
