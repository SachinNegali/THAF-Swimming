/**
 * User Profile types (blood group, address, emergency contacts).
 * Matches the `/profile` API surface.
 */

export type BloodGroup =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-';

export const BLOOD_GROUPS: BloodGroup[] = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
];

export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface EmergencyContact {
  _id: string;
  name: string;
  phone: string;
  relation?: string;
}

export interface Profile {
  user: string;
  bloodGroup: BloodGroup | null;
  address: Address | null;
  emergencyContacts: EmergencyContact[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  bloodGroup?: BloodGroup | null;
  address?: Address | null;
  emergencyContacts?: EmergencyContact[];
}

export interface CreateEmergencyContactRequest {
  name: string;
  phone: string;
  relation?: string;
}

export interface UpdateEmergencyContactRequest {
  name?: string;
  phone?: string;
  relation?: string;
}

/** Field-level validation error from zod. */
export interface ProfileFieldError {
  field: string;
  message: string;
}

/** Max emergency contacts per user, enforced by the backend with 409. */
export const EMERGENCY_CONTACT_LIMIT = 10;
