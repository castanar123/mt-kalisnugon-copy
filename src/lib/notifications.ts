const keyFor = (userId: string) => `mtk_seen_notifications_${userId}`;

export function loadSeenNotificationIds(userId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSeenNotificationIds(userId: string, ids: string[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(keyFor(userId), JSON.stringify(ids));
}

export function markNotificationSeen(userId: string, id: string): void {
  const prev = loadSeenNotificationIds(userId);
  if (prev.includes(id)) return;
  saveSeenNotificationIds(userId, [...prev, id]);
}
