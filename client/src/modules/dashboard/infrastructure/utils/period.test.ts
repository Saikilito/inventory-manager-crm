import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { parsePeriodToDateRange } from "./period";

describe("parsePeriodToDateRange", () => {
  beforeEach(() => {
    // Lock system date to 2026-07-09T12:00:00Z (Thursday)
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-09T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should calculate DAILY bounds correctly", () => {
    const { startDate, endDate } = parsePeriodToDateRange("DAILY");
    const start = new Date(startDate);
    const end = new Date(endDate);

    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(6); // July (0-based)
    expect(start.getDate()).toBe(9);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);

    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(6);
    expect(end.getDate()).toBe(9);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
  });

  it("should calculate WEEKLY bounds starting on Monday", () => {
    const { startDate, endDate } = parsePeriodToDateRange("WEEKLY");
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 2026-07-09 is Thursday. Monday of this week is 2026-07-06.
    expect(start.getDate()).toBe(6);
    expect(start.getMonth()).toBe(6);
    expect(end.getDate()).toBe(12); // Sunday is 2026-07-12
  });

  it("should calculate MONTHLY bounds correctly", () => {
    const { startDate, endDate } = parsePeriodToDateRange("MONTHLY");
    const start = new Date(startDate);
    const end = new Date(endDate);

    expect(start.getDate()).toBe(1);
    expect(start.getMonth()).toBe(6);
    expect(end.getDate()).toBe(31); // July has 31 days
  });

  it("should calculate QUARTERLY bounds correctly", () => {
    const { startDate, endDate } = parsePeriodToDateRange("QUARTERLY");
    const start = new Date(startDate);
    const end = new Date(endDate);

    // July is in Q3 (Months: July, August, September)
    expect(start.getMonth()).toBe(6); // July (0-based: 6)
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(8); // September (0-based: 8)
    expect(end.getDate()).toBe(30);
  });

  it("should default to MONTHLY when null or invalid is provided", () => {
    const { startDate, endDate } = parsePeriodToDateRange(null);
    const start = new Date(startDate);
    const end = new Date(endDate);

    expect(start.getDate()).toBe(1);
    expect(start.getMonth()).toBe(6);
    expect(end.getDate()).toBe(31);
  });
});
