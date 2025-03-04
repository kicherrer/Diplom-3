export interface User {
  id: string;
  username: string;
  is_admin: boolean;
}

export interface MediaItem {
  id: string;
  title: string;
  type: string;
}

export interface Person {
  id: string;
  name: string;
  photo_url?: string;
  created_at: string;
}

export interface MediaPerson {
  id: string;
  media_id: string;
  person_id: string;
  role: 'actor' | 'director';
  character_name?: string;
  created_at: string;
}
