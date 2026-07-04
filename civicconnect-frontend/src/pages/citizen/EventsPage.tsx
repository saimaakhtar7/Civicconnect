import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../stores/authStore";
import { useNotificationStore } from "../../stores/notificationStore";
import { db } from "../../config/firebase";
import { collection, query, getDocs, doc, addDoc, updateDoc, Timestamp } from "firebase/firestore";
import { EventsService } from "../../services/eventsService";
import { 
  Calendar, MapPin, Users, Award, Plus, 
  CheckCircle2, User, Download, Clock, XCircle 
} from "lucide-react";
import { Button } from "../../components/ui/button";

interface EventItem {
  id: string;
  title: string;
  description: string;
  date: any;
  locationName: string;
  location: { lat: number; lng: number };
  status: "upcoming" | "completed" | "cancelled";
  registeredVolunteerIds: string[];
  volunteerCount: number;
  organizer: string;
  hoursReward?: number;
}

export const EventsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Registration checks
  const [registrations, setRegistrations] = useState<Record<string, "attendee" | "volunteer" | null>>({});

  // Official form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newLocName, setNewLocName] = useState("");
  const [newHours, setNewHours] = useState(2);
  const [savingEvent, setSavingEvent] = useState(false);

  // Participant list view (Officials only)
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState<EventItem | null>(null);

  const isOfficial = user?.role === "official" || user?.role === "admin";

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "events"));
      const snap = await getDocs(q);
      let list = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date)
        };
      }) as EventItem[];

      // Seed fallback mock events if empty
      if (list.length === 0) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const mockList: Omit<EventItem, "id">[] = [
          {
            title: "Clover Park Solid Waste Cleanup",
            description: "Join your neighbors to pick litter, clear plastics, and clean the sidewalks near Clover Park.",
            date: tomorrow,
            locationName: "Clover Park, Viman Nagar",
            location: { lat: 18.5679, lng: 73.9143 },
            status: "upcoming",
            registeredVolunteerIds: [],
            volunteerCount: 0,
            organizer: "official_uid",
            hoursReward: 3
          },
          {
            title: "Kalyani Nagar Sanitation Seminar",
            description: "Safety guidelines, composting strategies, and waste segregation seminar.",
            date: yesterday,
            locationName: "Kalyani Nagar Ward Office",
            location: { lat: 18.5562, lng: 73.9038 },
            status: "completed",
            registeredVolunteerIds: ["demo_citizen"],
            volunteerCount: 1,
            organizer: "official_uid",
            hoursReward: 2
          }
        ];

        list = [];
        for (const item of mockList) {
          const docRef = await addDoc(collection(db, "events"), {
            ...item,
            date: Timestamp.fromDate(item.date)
          });
          list.push({ id: docRef.id, ...item });
        }
      }

      setEvents(list);

      // Check current user registrations
      if (user) {
        const regs: Record<string, "attendee" | "volunteer" | null> = {};
        for (const ev of list) {
          const isReg = await EventsService.isUserRegistered(ev.id, user.uid);
          if (isReg) {
            regs[ev.id] = "volunteer"; // default mapping
          }
        }
        setRegistrations(regs);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  // Citizen Registration Trigger
  const handleRegister = async (eventId: string, role: "attendee" | "volunteer") => {
    if (!user) return;
    try {
      await EventsService.registerVolunteer(eventId, user.uid, role);
      setRegistrations((prev) => ({ ...prev, [eventId]: role }));
      
      // Update local event count
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, volunteerCount: e.volunteerCount + 1, registeredVolunteerIds: [...e.registeredVolunteerIds, user.uid] }
            : e
        )
      );

      addNotification({
        type: "success",
        title: "Registration Success",
        message: `Registered successfully as ${role === "volunteer" ? "Volunteer" : "Attendee"}!`
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelRegistration = async (eventId: string) => {
    if (!user) return;
    try {
      await EventsService.unregisterVolunteer(eventId, user.uid);
      setRegistrations((prev) => ({ ...prev, [eventId]: null }));
      
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, volunteerCount: Math.max(0, e.volunteerCount - 1), registeredVolunteerIds: e.registeredVolunteerIds.filter((id) => id !== user.uid) }
            : e
        )
      );

      addNotification({
        type: "info",
        title: "Registration Cancelled",
        message: "Your registration has been removed."
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadCertificate = (event: EventItem) => {
    if (!user) return;
    const dateStr = event.date.toLocaleDateString();
    const htmlContent = EventsService.generateCertificateHTML(
      event.title,
      user.displayName || "Citizen Volunteer",
      dateStr,
      event.hoursReward || 2
    );

    // Open printing window
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  // Official: Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingEvent(true);
    try {
      const eventDate = new Date(newDate);
      const newEventData = {
        title: newTitle,
        description: newDesc,
        date: Timestamp.fromDate(eventDate),
        locationName: newLocName,
        location: { lat: 18.55, lng: 73.90 },
        status: "upcoming" as const,
        organizer: user.uid,
        hoursReward: newHours
      };

      const docId = await EventsService.createEvent(newEventData as any);
      setEvents((prev) => [{ id: docId, ...newEventData, date: eventDate, registeredVolunteerIds: [], volunteerCount: 0 } as EventItem, ...prev]);
      
      // Reset Form
      setNewTitle("");
      setNewDesc("");
      setNewDate("");
      setNewLocName("");
      setNewHours(2);
      setShowCreateModal(false);

      addNotification({
        type: "success",
        title: "Event Created",
        message: "New civic event published on citizen timelines."
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEvent(false);
    }
  };

  // Official: Cancel Event
  const handleCancelEvent = async (eventId: string) => {
    try {
      await updateDoc(doc(db, "events", eventId), { status: "cancelled" });
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: "cancelled" } : e))
      );
      addNotification({
        type: "warning",
        title: "Event Cancelled",
        message: "Community event marked as cancelled."
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-28 text-left select-none">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Events Console</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Community Events</h1>
          <p className="text-xs text-[#9AA3B8] mt-0.5">
            Participate in cleanliness drives, seminars, and download certificates.
          </p>
        </div>

        {isOfficial && (
          <Button onClick={() => setShowCreateModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Create Event
          </Button>
        )}
      </div>

      {/* Volunteer Hours Summary for Citizen */}
      {!isOfficial && (
        <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 p-4.5 rounded-2xl flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] font-black text-[#9AA3B8] uppercase tracking-wider block">Your Contributions</span>
              <span className="text-sm font-bold text-white block">Cumulative Volunteer Hours: {user?.volunteerHours || 0} Hours</span>
            </div>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 leading-none">
            +{ (user?.volunteerHours || 0) * 15 } Reputation XP
          </span>
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <div className="text-center py-12 text-[#9AA3B8] font-bold">Querying civic event catalog...</div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const isCompleted = event.status === "completed" || event.date < new Date();
            const isCancelled = event.status === "cancelled";
            const regRole = registrations[event.id];

            return (
              <div key={event.id} className="bg-[#1E293B] border border-white/5 p-5 rounded-2xl shadow-md space-y-3.5 relative overflow-hidden text-left">
                {/* Cancelled watermark */}
                {isCancelled && (
                  <div className="absolute top-2.5 right-4 flex items-center gap-1 text-[9px] font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full uppercase">
                    <XCircle className="w-2.5 h-2.5" /> Event Cancelled
                  </div>
                )}
                {isCompleted && !isCancelled && (
                  <div className="absolute top-2.5 right-4 flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full uppercase">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Event Completed
                  </div>
                )}

                {/* Info block */}
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white leading-tight">{event.title}</h3>
                  <p className="text-xs text-[#9AA3B8] leading-relaxed font-medium">{event.description}</p>
                </div>

                {/* Details layout */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs text-[#9AA3B8] border-t border-white/5 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-400" />
                    {event.date.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    {event.locationName}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-400" />
                    {event.volunteerCount} Volunteers Joined
                  </span>
                </div>

                {/* Button actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
                  <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                    +{event.hoursReward || 2} Volunteer Hours Reward
                  </span>

                  <div className="flex gap-2">
                    {isCancelled ? (
                      <span className="text-xs font-bold text-red-500">Event Cancelled</span>
                    ) : isCompleted ? (
                      /* Completed actions: download certificate if registered */
                      regRole ? (
                        <Button onClick={() => handleDownloadCertificate(event)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3 h-auto">
                          <Download className="w-3.5 h-3.5 mr-1" /> Get Certificate
                        </Button>
                      ) : (
                        <span className="text-xs font-bold text-[#6B7280]">Registration Closed</span>
                      )
                    ) : (
                      /* Upcoming actions: registration toggles */
                      !isOfficial && (
                        regRole ? (
                          <Button onClick={() => handleCancelRegistration(event.id)} className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 text-xs font-bold py-1.5 px-3 h-auto">
                            Cancel Registry
                          </Button>
                        ) : (
                          <div className="flex gap-1.5">
                            <Button onClick={() => handleRegister(event.id, "attendee")} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold py-1.5 px-3 h-auto">
                              Join Attendee
                            </Button>
                            <Button onClick={() => handleRegister(event.id, "volunteer")} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3 h-auto">
                              Join Volunteer
                            </Button>
                          </div>
                        )
                      )
                    )}

                    {isOfficial && !isCompleted && !isCancelled && (
                      <Button onClick={() => handleCancelEvent(event.id)} className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 text-xs font-bold py-1.5 px-3 h-auto">
                        Cancel Event
                      </Button>
                    )}

                    {isOfficial && (
                      <Button onClick={() => setSelectedEventForParticipants(event)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 h-auto">
                        Participants List
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Participants Drawer/Modal (Officials only) */}
      {selectedEventForParticipants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1E293B] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Event Participants</h3>
              <button onClick={() => setSelectedEventForParticipants(null)} className="text-[#9AA3B8] hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="max-h-[30vh] overflow-y-auto space-y-2 text-xs text-[#9AA3B8]">
              {selectedEventForParticipants.registeredVolunteerIds.length === 0 ? (
                <p className="text-center py-4">No citizens registered yet.</p>
              ) : (
                selectedEventForParticipants.registeredVolunteerIds.map((uid, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-[#0F172A] border border-white/5 rounded-xl">
                    <User className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-white font-bold block">Citizen ID: {uid.slice(0, 8)}</span>
                      <span className="text-[10px] text-[#6B7280] font-bold">Role: Registered Volunteer</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Button onClick={() => setSelectedEventForParticipants(null)} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold text-xs py-2.5">
              Close List
            </Button>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateEvent} className="bg-[#1E293B] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Create Community Event</h3>

            <div className="space-y-3.5 text-xs text-[#9AA3B8]">
              <div className="space-y-1">
                <label className="font-semibold block text-[#F3F4F6]">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kalyani Nagar Sanitation Drive"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold block text-[#F3F4F6]">Description</label>
                <textarea
                  required
                  placeholder="Tell citizens about requirements, cleanups, composting details..."
                  value={newDesc}
                  rows={2}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold block text-[#F3F4F6]">Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block text-[#F3F4F6]">Volunteer Hours Reward</label>
                  <input
                    type="number"
                    required
                    value={newHours}
                    onChange={(e) => setNewHours(parseInt(e.target.value))}
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold block text-[#F3F4F6]">Location Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clover Park, Kalyani Nagar"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={savingEvent} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5">
                {savingEvent ? "Publishing..." : "Publish Event"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="border-white/10 text-white hover:bg-white/5">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
