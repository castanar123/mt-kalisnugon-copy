export type AppRole = 'admin' | 'ranger' | 'hiker';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  emergency_contact: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface TrailZone {
  id: string;
  name: string;
  description: string;
  coordinates_json: { lat: number; lng: number }[];
  status: string;
  max_capacity: number;
  difficulty: string;
  elevation_meters: number;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  booking_date: string;
  group_size: number;
  status: string;
  qr_code_data: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  notes: string;
  created_at: string;
}

export interface HikerSession {
  id: string;
  user_id: string;
  booking_id: string | null;
  trail_zone_id: string | null;
  start_time: string;
  end_time: string | null;
  status: string;
  total_distance_km: number;
  created_at: string;
}

export interface HikerLocation {
  id: string;
  session_id: string;
  latitude: number;
  longitude: number;
  altitude: number;
  timestamp: string;
}

export interface TrailReport {
  id: string;
  ranger_id: string;
  zone_id: string;
  condition: string;
  description: string;
  created_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DailyCapacity {
  id: string;
  date: string;
  max_capacity: number;
  current_count: number;
}
