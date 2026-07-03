import { Timestamp } from "firebase/firestore";

export interface EventLocation {
  lat: number;
  lng: number;
  address: string;
  geohash: string;
}

export interface EventDocument {
  id: string;
  
  // Basic info
  title: string;
  description: string;
  category: "cleanup" | "community_meeting" | "awareness" | "repair_support" | "training" | "other";
  
  // Location
  location: EventLocation;
  
  // Timing
  date: Timestamp | Date;
  endDate?: Timestamp | Date;
  time?: string; // e.g., "10:00 AM"
  
  // Organizer info
  organizer: string; // uid of organizer (official or admin)
  organizationName?: string;
  contactEmail?: string;
  contactPhone?: string;
  
  // Participation
  volunteerCount: number;
  maxVolunteers?: number;
  registeredVolunteerIds: string[];
  
  // Linked issues
  linkedIssueIds: string[]; // Issues this event addresses
  
  // Media
  bannerImageUrl?: string;
  
  // Status
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  
  // Metadata
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy: string;
}

export interface VolunteerRegistration {
  id: string;
  eventId: string;
  volunteerId: string; // uid
  registeredAt: Timestamp | Date;
  status: "registered" | "attended" | "cancelled";
  hoursContributed?: number;
  notes?: string;
}

export interface VolunteerProfile {
  userId: string;
  totalHours: number;
  totalEvents: number;
  eventsAttended: number;
  badges: string[]; // e.g., ["first_event", "100_hours", "cleanup_champion"]
  interests: string[]; // Categories of events interested in
}
