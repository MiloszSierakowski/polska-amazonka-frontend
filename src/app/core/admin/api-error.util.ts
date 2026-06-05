import { HttpErrorResponse } from '@angular/common/http';

export type ParsedApiErrorType = 'error' | 'warning';

export interface ParsedApiError {
  message: string;
  type: ParsedApiErrorType;
}

interface ApiErrorBody {
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  fieldErrors?: Record<string, string>;
}

export function parseApiError(error: HttpErrorResponse): ParsedApiError {
  const body = (error.error ?? {}) as ApiErrorBody;
  const fieldMessage = formatFieldErrors(body.fieldErrors);
  const message = pickMessage(body, fieldMessage, error.status);
  const type = resolveType(error.status, body.fieldErrors, fieldMessage);
  return { message, type };
}

function pickMessage(body: ApiErrorBody, fieldMessage: string, status: number): string {
  if (fieldMessage) {
    return fieldMessage;
  }
  if (body.message && String(body.message).trim()) {
    return String(body.message).trim();
  }
  if (body.error && String(body.error).trim()) {
    return String(body.error).trim();
  }
  return defaultStatusMessage(status);
}

function formatFieldErrors(fieldErrors: Record<string, string> | undefined): string {
  if (!fieldErrors) {
    return '';
  }
  const values = Object.values(fieldErrors)
    .map((value) => value?.trim())
    .filter((value): value is string => !!value);
  return values.join(' ');
}

function resolveType(
  status: number,
  fieldErrors: Record<string, string> | undefined,
  fieldMessage: string
): ParsedApiErrorType {
  if (fieldMessage || fieldErrors) {
    return 'warning';
  }
  if (status === 400 || status === 409 || status === 422) {
    return 'warning';
  }
  return 'error';
}

function defaultStatusMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Żądanie zawiera nieprawidłowe dane.';
    case 401:
      return 'Brak autoryzacji lub nieprawidłowe dane logowania.';
    case 403:
      return 'Brak uprawnień do wykonania tej operacji.';
    case 404:
      return 'Nie znaleziono żądanego zasobu.';
    case 409:
      return 'Operacja koliduje z istniejącymi danymi.';
    case 500:
      return 'Wystąpił nieoczekiwany błąd serwera.';
    default:
      return 'Operacja nie powiodła się.';
  }
}
