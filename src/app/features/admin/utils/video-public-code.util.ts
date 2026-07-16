import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const VIDEO_PUBLIC_CODE_MAX_LENGTH = 20;
const VIDEO_PUBLIC_CODE_PATTERN = /^[A-Z]+[0-9]+$/;

export function normalizeVideoPublicCode(raw: string | null | undefined): string | null {
  if (raw == null) {
    return null;
  }
  const withoutSpaces = raw.replace(/\s+/g, '');
  if (!withoutSpaces) {
    return null;
  }
  return withoutSpaces.toUpperCase();
}

export function isValidVideoPublicCode(normalized: string | null | undefined): boolean {
  if (!normalized) {
    return false;
  }
  return (
    normalized.length <= VIDEO_PUBLIC_CODE_MAX_LENGTH &&
    VIDEO_PUBLIC_CODE_PATTERN.test(normalized)
  );
}

export function videoPublicCodeFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value as string | null | undefined;
    if (raw == null || raw === '') {
      return null;
    }
    const normalized = normalizeVideoPublicCode(raw);
    if (!normalized || !isValidVideoPublicCode(normalized)) {
      return { publicCodeFormat: true };
    }
    return null;
  };
}

export function isVideoPublicCodeBackendMessage(message: string): boolean {
  return message.includes('Kod filmu');
}
