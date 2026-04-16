/**
 * Client-side validation for the /profile API.
 * Mirrors the server-side zod schema so users get instant feedback,
 * but server errors still override via `applyServerErrors`.
 */

import type {
  Address,
  CreateEmergencyContactRequest,
  ProfileFieldError,
  UpdateEmergencyContactRequest,
} from '@/types/profile';

const PHONE_RE = /^\+?[0-9][0-9\s\-]{6,19}$/;

export type FieldErrors = Record<string, string | undefined>;

export function validateEmergencyContact(
  data: CreateEmergencyContactRequest | UpdateEmergencyContactRequest,
): FieldErrors {
  const errors: FieldErrors = {};

  if ('name' in data) {
    const name = data.name?.trim() ?? '';
    if (!name) errors.name = 'Name is required';
    else if (name.length > 100) errors.name = 'Name must be 100 characters or fewer';
  }

  if ('phone' in data) {
    const phone = data.phone?.trim() ?? '';
    if (!phone) errors.phone = 'Phone is required';
    else if (!PHONE_RE.test(phone))
      errors.phone = 'Enter a valid phone (7–20 digits, spaces/dashes allowed)';
  }

  if ('relation' in data && data.relation) {
    if (data.relation.length > 50)
      errors.relation = 'Relation must be 50 characters or fewer';
  }

  return errors;
}

export function validateAddress(address: Address): FieldErrors {
  const errors: FieldErrors = {};
  const check = (field: keyof Address, max: number) => {
    const v = address[field];
    if (v && v.length > max) {
      errors[field] = `Max ${max} characters`;
    }
  };
  check('line1', 200);
  check('line2', 200);
  check('city', 100);
  check('state', 100);
  check('country', 100);
  check('postalCode', 20);
  return errors;
}

/**
 * Merge server-returned field errors (from zod) into a local error map,
 * so users see the authoritative server message under the right field.
 */
export function applyServerErrors(
  local: FieldErrors,
  serverErrors: ProfileFieldError[] | undefined,
): FieldErrors {
  if (!serverErrors?.length) return local;
  const merged = { ...local };
  for (const e of serverErrors) {
    // Server uses dot-paths like "address.line1" or "emergencyContacts.0.phone".
    // Strip any prefix and take the last segment to match our local field names.
    const key = e.field.split('.').pop() ?? e.field;
    merged[key] = e.message;
  }
  return merged;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}
