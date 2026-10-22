export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  department?: string;
  company?: string;
  avatarColor: string;
  isFavorite: boolean;
  notes?: string;
}
