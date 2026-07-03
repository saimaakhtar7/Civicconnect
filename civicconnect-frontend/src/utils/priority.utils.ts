import { PriorityLevel } from "../types/user.types";

export const priorityToColor = (level: PriorityLevel): string => {
  switch (level) {
    case 0:
      return "text-red-700 border-red-700 bg-red-50";
    case 1:
      return "text-orange-700 border-orange-700 bg-orange-50";
    case 2:
      return "text-yellow-700 border-yellow-700 bg-yellow-50";
    case 3:
      return "text-green-700 border-green-700 bg-green-50";
    case 4:
      return "text-blue-700 border-blue-700 bg-blue-50";
    default:
      return "text-gray-700 border-gray-700 bg-gray-50";
  }
};

export const priorityToLabel = (level: PriorityLevel): string => {
  switch (level) {
    case 0:
      return "CRITICAL";
    case 1:
      return "HIGH";
    case 2:
      return "MEDIUM";
    case 3:
      return "LOW";
    case 4:
      return "INFORMATIONAL";
    default:
      return "UNKNOWN";
  }
};
