"use client";

import { mockBookings, mockScreens, mockTasks } from "@/lib/mockData";

export type DesignerTaskStatus =
  | "to_do"
  | "in_progress"
  | "internal_review"
  | "sent_to_client"
  | "revision_requested"
  | "done";

export type DesignerTask = Omit<(typeof mockTasks)[number], "status"> & {
  status: DesignerTaskStatus;
  revision_count?: number;
  client_notes?: string;
};

const TASKS_KEY = "afrah_hod_tasks";
const TASKS_EVENT = "afrah_hod_tasks_updated";
const DEFAULT_DESIGNER_ID = "emp-001";

function buildSeedTasks(): DesignerTask[] {
  const [taskA, taskB] = mockTasks;
  return [
    {
      ...taskA,
      status: "in_progress",
      revision_count: 0,
    },
    {
      ...taskB,
      status: "done",
      revision_count: 1,
    },
    {
      ...taskA,
      id: "task-003",
      campaign: "MTN Screen Takeover",
      customer: "James Mwesigwa",
      company: "MTN Uganda",
      complexity: "high",
      deadline: "08/04/2024",
      status: "internal_review",
      revision_count: 0,
    },
    {
      ...taskB,
      id: "task-004",
      campaign: "Roofings Group Promo",
      customer: "Moses Kato",
      company: "Roofings Group",
      complexity: "low",
      deadline: "06/04/2024",
      status: "revision_requested",
      revision_count: 2,
      client_notes: "Please increase logo size and reduce the text.",
    },
    {
      ...taskA,
      id: "task-005",
      campaign: "Garden City Retail Loop",
      customer: "Grace Atuhaire",
      company: "Cafe Javas",
      complexity: "low",
      deadline: "10/04/2024",
      designer: {
        ...taskA.designer,
        id: "emp-002",
        name: "Alex Mugisha",
        initials: "AM",
        color: "bg-purple-500",
      },
      status: "to_do",
      revision_count: 0,
    },
  ];
}

export function readDesignerTasks(): DesignerTask[] {
  try {
    const raw = window.localStorage.getItem(TASKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DesignerTask[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeDesignerTasks(next: DesignerTask[]) {
  window.localStorage.setItem(TASKS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(TASKS_EVENT));
}

export function seedDesignerTasksIfMissing() {
  if (readDesignerTasks().length) return;
  writeDesignerTasks(buildSeedTasks());
}

export function getDesignerTasks(designerId = DEFAULT_DESIGNER_ID) {
  return readDesignerTasks().filter((task) => task.designer?.id === designerId);
}

export function getDesignerTask(taskId: string, designerId = DEFAULT_DESIGNER_ID) {
  return getDesignerTasks(designerId).find((task) => task.id === taskId) ?? null;
}

export function updateDesignerTask(taskId: string, updater: (task: DesignerTask) => DesignerTask) {
  const next = readDesignerTasks().map((task) => (task.id === taskId ? updater(task) : task));
  writeDesignerTasks(next);
  return next.find((task) => task.id === taskId) ?? null;
}

export function addDesignerMessage(taskId: string, text: string) {
  return updateDesignerTask(taskId, (task) => ({
    ...task,
    messages: [
      ...(task.messages ?? []),
      {
        sender: "Brian Kato",
        initials: "BK",
        color: "bg-blue-500",
        side: "right",
        text,
        time: "04/04/2024 11:35",
      },
    ],
  }));
}

export function submitDesignerRevision(taskId: string, note: string) {
  return updateDesignerTask(taskId, (task) => {
    const latestVersion = Math.max(0, ...(task.files ?? []).map((file) => file.version ?? 0));
    return {
      ...task,
      status: "done",
      revision_count: (task.revision_count ?? 0) + 1,
      files: [
        ...(task.files ?? []),
        {
          name: `${task.campaign.toLowerCase().replaceAll(" ", "_")}_v${latestVersion + 1}.mp4`,
          size: "44MB",
          date: "04/04/2024 11:10",
          version: latestVersion + 1,
          preview: task.files?.[0]?.preview ?? "https://picsum.photos/seed/designer-file/400/225",
        },
      ],
      messages: [
        ...(task.messages ?? []),
        {
          sender: "Brian Kato",
          initials: "BK",
          color: "bg-blue-500",
          side: "right",
          text: note,
          time: "04/04/2024 11:12",
        },
      ],
    };
  });
}

export function updateDesignerTaskStatus(taskId: string, status: DesignerTaskStatus) {
  return updateDesignerTask(taskId, (task) => ({ ...task, status }));
}

export function getDesignerScreen(screenName: string) {
  return mockScreens.find((screen) => screen.name === screenName) ?? mockScreens[0];
}

export function getTaskBooking(task: DesignerTask) {
  return (
    mockBookings.find((booking) => booking.company === task.company) ??
    mockBookings.find((booking) => booking.screen === task.screen) ??
    null
  );
}

export function getDesignerStats(designerId = DEFAULT_DESIGNER_ID) {
  const tasks = getDesignerTasks(designerId);
  return {
    todo: tasks.filter((task) => task.status === "to_do").length,
    dueToday: tasks.filter((task) => task.deadline === "04/04/2024").length,
    inProgress: tasks.filter((task) => task.status === "in_progress").length,
    done: 2,
    onTimeRate: 94,
  };
}

export const designerTaskEventName = TASKS_EVENT;
export const designerDefaultId = DEFAULT_DESIGNER_ID;
