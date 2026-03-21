export type AnnouncementType = 'info' | 'warning' | 'closure';

export interface AdminAnnouncement {
  id: string;
  title: string;
  body: string;
  type: AnnouncementType;
  created_at: string;
  isImportant: boolean;
  starts_at?: string;
  expires_at?: string;
}

const KEY = 'mtk_admin_announcements_v1';

export function loadAnnouncements(): AdminAnnouncement[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AdminAnnouncement[];
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed
      .filter((a) => {
        const startsAt = a.starts_at ? new Date(a.starts_at).getTime() : null;
        const expiresAt = a.expires_at ? new Date(a.expires_at).getTime() : null;
        if (startsAt !== null && now < startsAt) return false;
        if (expiresAt !== null && now > expiresAt) return false;
        return true;
      })
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  } catch {
    return [];
  }
}

export function saveAnnouncements(items: AdminAnnouncement[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addAnnouncement(item: AdminAnnouncement): AdminAnnouncement[] {
  const next = [item, ...loadAnnouncements()];
  saveAnnouncements(next);
  return next;
}

export function removeAnnouncement(id: string): AdminAnnouncement[] {
  const next = loadAnnouncements().filter((a) => a.id !== id);
  saveAnnouncements(next);
  return next;
}
