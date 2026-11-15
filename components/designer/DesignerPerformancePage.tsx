"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Award, CheckCircle2, RotateCcw, Timer } from "lucide-react";

import { designerDefaultId, getDesignerTasks, seedDesignerTasksIfMissing } from "@/components/designer/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { StatCard } from "@/components/ui/StatCard";
import { useToast } from "@/components/ui/Toast";

const donutData = [
  { name: "On Time", value: 94, color: "#10B981" },
  { name: "Late", value: 6, color: "#E2E8F0" },
];

const performanceBars = [
  { month: "Nov", tasks: 2 },
  { month: "Dec", tasks: 3 },
  { month: "Jan", tasks: 4 },
  { month: "Feb", tasks: 3 },
  { month: "Mar", tasks: 5 },
  { month: "Apr", tasks: 5 },
];

const historyRows = [
  { id: "hist-1", campaign: "Cafe Javas Lunch Promo", completed: "06/04/2024", status: "Completed", note: "Delivered ahead of schedule." },
  { id: "hist-2", campaign: "MTN Screen Takeover", completed: "02/04/2024", status: "Completed", note: "Strong animation work and brand consistency." },
  { id: "hist-3", campaign: "Roofings Group Promo", completed: "28/03/2024", status: "Revision", note: "Needed a second pass after client feedback." },
];

export function DesignerPerformancePage() {
  const { showToast } = useToast();
  const [month, setMonth] = React.useState("April 2024");
  const [openHistoryId, setOpenHistoryId] = React.useState<string | null>(null);

  React.useEffect(() => {
    seedDesignerTasksIfMissing();
    getDesignerTasks(designerDefaultId);
  }, []);

  const selectedHistory = historyRows.find((row) => row.id === openHistoryId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[24px] font-semibold text-gray-900">My Performance</div>
          <div className="mt-1 text-sm text-gray-600">
            Productivity snapshot, task history, and skill profile.
          </div>
        </div>

        <select
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option>April 2024</option>
          <option>March 2024</option>
          <option>February 2024</option>
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard icon={CheckCircle2} iconColorClassName="text-success bg-green-100" value={5} label="Completed" trend={{ value: "+10.0%", direction: "up" }} />
        <StatCard icon={Award} iconColorClassName="text-primary bg-blue-100" value={5} label="On Time" trend={{ value: "+8.0%", direction: "up" }} />
        <StatCard icon={Timer} iconColorClassName="text-error bg-red-100" value={0} label="Late" trend={{ value: "-100.0%", direction: "down" }} />
        <StatCard icon={RotateCcw} iconColorClassName="text-warning bg-amber-100" value={2} label="Revisions" trend={{ value: "+2.0%", direction: "up" }} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">On-Time Donut</div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" innerRadius={68} outerRadius={92} paddingAngle={4}>
                  {donutData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="-mt-36 text-center">
            <div className="text-3xl font-bold text-gray-900">94%</div>
            <div className="text-sm text-gray-500">On time</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-[18px] font-semibold text-gray-800">Tasks Trend</div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceBars}>
                <CartesianGrid stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip />
                <Bar dataKey="tasks" fill="#2563EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[18px] font-semibold text-gray-800">Skills</div>
            <div className="mt-1 text-sm text-gray-600">Keep your profile current.</div>
          </div>
          <Button onClick={() => showToast({ type: "success", title: "Request sent", message: "Skill update request for 3D Animation has been sent." })}>
            Request Skill Update
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Motion Graphics", "Video Editing"].map((skill) => (
            <Badge key={skill} variant="info">
              {skill}
            </Badge>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-[18px] font-semibold text-gray-800">Task History</div>
        <div className="mt-6">
          <DataTable
            data={historyRows}
            rowKey={(row) => row.id}
            selectable={false}
            onRowClick={(row) => setOpenHistoryId(row.id)}
            columns={[
              {
                key: "campaign",
                header: "Campaign",
                cell: (row) => (
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{row.campaign}</div>
                    <div className="text-xs text-gray-500">{month}</div>
                  </div>
                ),
              },
              { key: "completed", header: "Completed", cell: (row) => <span className="font-mono">{row.completed}</span> },
              {
                key: "status",
                header: "Status",
                cell: (row) => <Badge variant={row.status === "Completed" ? "success" : "warning"}>{row.status}</Badge>,
              },
            ]}
          />
        </div>
      </Card>

      <Modal open={Boolean(selectedHistory)} onClose={() => setOpenHistoryId(null)} title={selectedHistory?.campaign}>
        <div className="space-y-4">
          <Badge variant={selectedHistory?.status === "Completed" ? "success" : "warning"}>
            {selectedHistory?.status}
          </Badge>
          <div className="text-sm text-gray-700">{selectedHistory?.note}</div>
        </div>
      </Modal>
    </div>
  );
}
