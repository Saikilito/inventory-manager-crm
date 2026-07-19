export function getErrorMessage(
  err: unknown,
  fallback = "An unexpected error occurred",
): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (err && typeof err === "object" && "message" in err) {
    return String((err as Error).message || err);
  }
  if (typeof err === "string" && err.trim() !== "") {
    return err;
  }
  return fallback;
}
