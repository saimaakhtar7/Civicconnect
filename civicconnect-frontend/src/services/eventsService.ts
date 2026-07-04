import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { EventDocument, VolunteerRegistration } from "../types/event.types";

/**
 * Events Service
 * Handles all event-related operations
 */
export class EventsService {
  private static readonly EVENTS_COLLECTION = "events";

  /**
   * Fetch all upcoming events
   */
  static async getUpcomingEvents(limit_count = 50): Promise<EventDocument[]> {
    try {
      const q = query(
        collection(db, this.EVENTS_COLLECTION),
        where("status", "==", "upcoming"),
        where("date", ">=", new Date()),
        orderBy("date", "asc"),
        limit(limit_count)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EventDocument[];
    } catch (error) {
      console.error("[EventsService] Error fetching upcoming events:", error);
      throw error;
    }
  }

  /**
   * Fetch events by location (geospatial)
   */
  static async getEventsByLocation(
    lat: number,
    lng: number,
    radiusKm = 5
  ): Promise<EventDocument[]> {
    try {
      // Note: Firestore doesn't have native geospatial queries
      // This is a simplified version that requires client-side filtering
      // In production, consider using geo-hashing or a dedicated service like Google Maps Platform

      const q = query(
        collection(db, this.EVENTS_COLLECTION),
        where("status", "in", ["upcoming", "ongoing"]),
        orderBy("date", "asc")
      );

      const snapshot = await getDocs(q);
      const allEvents = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EventDocument[];

      // Client-side distance filter
      return allEvents.filter((event) => {
        const distance = this.calculateDistance(
          lat,
          lng,
          event.location.lat,
          event.location.lng
        );
        return distance <= radiusKm;
      });
    } catch (error) {
      console.error("[EventsService] Error fetching events by location:", error);
      throw error;
    }
  }

  /**
   * Fetch events organized by a specific user
   */
  static async getEventsByOrganizer(organizerId: string): Promise<EventDocument[]> {
    try {
      const q = query(
        collection(db, this.EVENTS_COLLECTION),
        where("organizer", "==", organizerId),
        orderBy("date", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EventDocument[];
    } catch (error) {
      console.error("[EventsService] Error fetching organizer events:", error);
      throw error;
    }
  }

  /**
   * Fetch a single event by ID
   */
  static async getEventById(eventId: string): Promise<EventDocument | null> {
    try {
      const snapshot = await getDocs(query(collection(db, this.EVENTS_COLLECTION)));

      for (const doc of snapshot.docs) {
        if (doc.id === eventId) {
          return { id: doc.id, ...doc.data() } as EventDocument;
        }
      }
      return null;
    } catch (error) {
      console.error("[EventsService] Error fetching event:", error);
      throw error;
    }
  }

  /**
   * Create a new event (officials/admins only)
   */
  static async createEvent(eventData: Omit<EventDocument, "id" | "createdAt" | "updatedAt">): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, this.EVENTS_COLLECTION), {
        ...eventData,
        registeredVolunteerIds: [],
        volunteerCount: 0,
        createdAt: now,
        updatedAt: now,
      });

      return docRef.id;
    } catch (error) {
      console.error("[EventsService] Error creating event:", error);
      throw error;
    }
  }

  /**
   * Update event details
   */
  static async updateEvent(eventId: string, updates: Partial<EventDocument>): Promise<void> {
    try {
      const eventRef = doc(db, this.EVENTS_COLLECTION, eventId);
      await updateDoc(eventRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });

    } catch (error) {
      console.error("[EventsService] Error updating event:", error);
      throw error;
    }
  }

  /**
   * Register volunteer for an event
   */
  static async registerVolunteer(eventId: string, volunteerId: string, role: "attendee" | "volunteer" = "volunteer"): Promise<string> {
    try {
      // Create volunteer registration record
      const registration = {
        eventId,
        volunteerId,
        registeredAt: Timestamp.now(),
        status: "registered",
        role
      };

      const docRef = await addDoc(
        collection(db, this.EVENTS_COLLECTION, eventId, "volunteers"),
        registration
      );

      // Update event volunteer count
      const eventRef = doc(db, this.EVENTS_COLLECTION, eventId);
      await updateDoc(eventRef, {
        volunteerCount: increment(1),
        registeredVolunteerIds: arrayUnion(volunteerId),
      });

      return docRef.id;
    } catch (error) {
      console.error("[EventsService] Error registering volunteer:", error);
      throw error;
    }
  }

  /**
   * Complete Event for User (award hours and XP)
   */
  static async completeEventForUser(userId: string, hours = 2): Promise<void> {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        volunteerHours: increment(hours),
        reputation: increment(hours * 15)
      });
    } catch (error) {
      console.error("[EventsService] Error awarding event hours:", error);
    }
  }

  /**
   * Generate Certificate HTML for window print
   */
  static generateCertificateHTML(eventTitle: string, userName: string, date: string, hours: number): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CivicConnect Certificate</title>
          <style>
            body { font-family: 'Inter', sans-serif; background-color: #090B10; color: #FFF; padding: 50px; text-align: center; }
            .card { border: 4px solid #16A34A; border-radius: 24px; padding: 50px; background: #131924; max-width: 650px; margin: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            h1 { color: #16A34A; font-size: 32px; font-weight: 900; letter-spacing: -0.05em; margin-bottom: 5px; }
            h2 { color: #FFF; font-size: 20px; font-weight: 700; margin-bottom: 30px; letter-spacing: 0.1em; text-transform: uppercase; }
            p { font-size: 15px; line-height: 1.6; color: #9AA3B8; }
            .highlight { color: #16A34A; font-weight: 900; }
            .name { font-size: 24px; color: #FFF; font-weight: 800; border-bottom: 2px solid #334155; display: inline-block; padding: 5px 25px; margin: 15px 0; }
            .footer { margin-top: 50px; border-top: 1px solid #1E293B; padding-top: 20px; font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>CIVIC CONNECT</h1>
            <h2>Certificate of Civic Service</h2>
            <p>This certificate of appreciation is proudly awarded to</p>
            <div class="name">${userName}</div>
            <p>for outstanding dedication and active volunteering during the</p>
            <h3><span class="highlight">${eventTitle}</span></h3>
            <p>held on <span class="highlight">${date}</span>.</p>
            <p>Total Contribution logged: <span class="highlight">${hours} Volunteer Hours</span></p>
            <div class="footer">
              Authorized by the CivicConnect Municipal Coordination Board
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
  }

  /**
   * Unregister volunteer from event
   */
  static async unregisterVolunteer(eventId: string, volunteerId: string): Promise<void> {
    try {
      // Find and delete volunteer registration
      const volunteerDocs = await getDocs(
        query(
          collection(db, this.EVENTS_COLLECTION, eventId, "volunteers"),
          where("volunteerId", "==", volunteerId)
        )
      );

      for (const doc of volunteerDocs.docs) {
        await updateDoc(doc.ref, { status: "cancelled" });
      }

      // Update event volunteer count
      const eventRef = doc(db, this.EVENTS_COLLECTION, eventId);
      await updateDoc(eventRef, {
        volunteerCount: increment(-1),
        registeredVolunteerIds: arrayRemove(volunteerId),
      });

    } catch (error) {
      console.error("[EventsService] Error unregistering volunteer:", error);
      throw error;
    }
  }

  /**
   * Get volunteers for an event
   */
  static async getEventVolunteers(eventId: string): Promise<VolunteerRegistration[]> {
    try {
      const q = query(
        collection(db, this.EVENTS_COLLECTION, eventId, "volunteers"),
        where("status", "==", "registered")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as VolunteerRegistration[];
    } catch (error) {
      console.error("[EventsService] Error fetching volunteers:", error);
      throw error;
    }
  }

  /**
   * Check if user is registered for event
   */
  static async isUserRegistered(eventId: string, userId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.EVENTS_COLLECTION, eventId, "volunteers"),
        where("volunteerId", "==", userId),
        where("status", "==", "registered")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.length > 0;
    } catch (error) {
      console.error("[EventsService] Error checking registration:", error);
      return false;
    }
  }

  /**
   * Calculate distance between two coordinates (km)
   */
  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

// Firebase helper functions
function increment(value = 1) {
  return { increment: value };
}

function arrayUnion(value: any) {
  return { arrayUnion: [value] };
}

function arrayRemove(value: any) {
  return { arrayRemove: [value] };
}
