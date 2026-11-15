import { mockNotifications } from "@/lib/mockData";
import {
  getNotificationsForRole,
  getTypeFiltersForRole,
  roleNotificationTypes,
  type NotificationRecord,
  type NotificationRoleKey,
  typeLabels,
} from "@/lib/notifications";

export {
  getNotificationsForRole,
  getTypeFiltersForRole,
  roleNotificationTypes,
  typeLabels,
};

export function getRoleNotifications(role: NotificationRoleKey) {
  return getNotificationsForRole(mockNotifications[role] ?? [], role) as NotificationRecord[];
}
