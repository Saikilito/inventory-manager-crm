export const formatCurrency = (value: number | string): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
};

export const formatDate = (date?: string | number | Date | null): string => {
  if (!date) return "";
  let d: Date;
  if (typeof date === "string" || typeof date === "number") {
    const timestamp = Number(date);
    d = isNaN(timestamp) ? new Date(date) : new Date(timestamp);
  } else {
    d = date;
  }
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTimeToAmPm = (timeStr: string): string => {
  if (!timeStr) return "-";
  // Check if it already contains AM/PM
  if (timeStr.toUpperCase().includes("AM") || timeStr.toUpperCase().includes("PM")) {
    return timeStr;
  }
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  return `${hours}:${minutes} ${ampm}`;
};

export const getFullName = (client: any, fallback: string = "Unknown Client"): string => {
  if (!client) return fallback;
  const firstName = client.firstName || client.name || "";
  const lastName = client.lastName || client.surname || "";
  const full = `${firstName} ${lastName}`.trim();
  return full || fallback;
};
