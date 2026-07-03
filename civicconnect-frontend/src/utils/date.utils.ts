import { Timestamp } from "firebase/firestore";

export const formatDateTime = (date: Date | Timestamp | string | number | null): string => {
  if (!date) return "N/A";
  let parsedDate: Date;
  if (date instanceof Timestamp) {
    parsedDate = date.toDate();
  } else if (typeof date === "string" || typeof date === "number") {
    parsedDate = new Date(date);
  } else {
    parsedDate = date;
  }
  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getRelativeTime = (date: Date | Timestamp | string | number | null): string => {
  if (!date) return "";
  let parsedDate: Date;
  if (date instanceof Timestamp) {
    parsedDate = date.toDate();
  } else if (typeof date === "string" || typeof date === "number") {
    parsedDate = new Date(date);
  } else {
    parsedDate = date;
  }
  const now = new Date();
  const diffMs = now.getTime() - parsedDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
};

export const getSLARemainingHours = (deadline: Date | Timestamp | null): number => {
  if (!deadline) return 0;
  let parsedDeadline: Date;
  if (deadline instanceof Timestamp) {
    parsedDeadline = deadline.toDate();
  } else if (typeof deadline === "string" || typeof deadline === "number") {
    parsedDeadline = new Date(deadline);
  } else {
    parsedDeadline = deadline;
  }
  const diffMs = parsedDeadline.getTime() - new Date().getTime();
  return diffMs / 3600000;
};
