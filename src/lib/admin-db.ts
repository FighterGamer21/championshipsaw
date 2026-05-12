export function requireRow<T>(data: T | null, action: string): T {
  if (!data) {
    throw new Error(`${action} did not change any rows. Check that the latest Supabase migration is applied.`);
  }
  return data;
}

export function requireRows<T>(data: T[] | null, action: string): T[] {
  if (!data || data.length === 0) {
    throw new Error(`${action} did not change any rows. Check that the latest Supabase migration is applied.`);
  }
  return data;
}

export function adminErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Admin action failed.";
}
