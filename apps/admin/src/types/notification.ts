// Mirrors the API's notification shape (apps/api/src/modules/notifications/notifications.service.ts).

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  relatedId: string | null;
  isRead: boolean;
  createdAt: string;
}
