import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../stores/authStore";
import { db, auth } from "../../config/firebase";
import { 
  collection, query, getDocs, doc, addDoc, updateDoc, setDoc,
  increment, arrayUnion, arrayRemove, orderBy, limit,
  onSnapshot, Timestamp, deleteDoc
} from "firebase/firestore";
import { 
  Trophy, ShieldAlert, Calendar, ArrowRight, Zap, Target, 
  MessageSquare, ThumbsUp, ThumbsDown, Pin, Trash2, Send, Plus, 
  Clock, X, ChevronRight, TrendingUp, Sparkles, CheckCircle, Bookmark, AlertTriangle
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { calculateUserGamification } from "../../utils/gamification";
import { UserDocument } from "../../types/user.types";

interface DiscussionReply {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: any;
  replies?: DiscussionReply[];
  uid: string;
  likes: number;
  replyCount: number;
}

interface Discussion {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  tags: string[];
  likes: number;
  likedBy: string[];
  dislikes: number;
  dislikedBy: string[];
  isPinned?: boolean;
  isSpam?: boolean;
  reported?: boolean;
  reportedCount?: number;
  replies: DiscussionReply[];
  createdAt: any;
  imageUrl?: string;
  category?: string;
  bookmarkedBy?: string[];
  shares?: number;
}

export const CommunityPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeMainTab, setActiveMainTab] = useState<"discussions" | "leaderboard" | "challenges">("discussions");
  
  // Leaderboard Subtabs
  const [leaderboardTab, setLeaderboardTab] = useState<"reporters" | "volunteers" | "contributors" | "localities">("contributors");
  const [timeFilter, setTimeFilter] = useState<"weekly" | "monthly" | "all_time">("all_time");
  const [leaderboardUsers, setLeaderboardUsers] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Discussions State
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [discLoading, setDiscLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newCategory, setNewCategory] = useState("Environment");
  const [creatingPost, setCreatingPost] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  
  // Edit State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Filters & Sort
  const [feedFilter, setFeedFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("Trending");

  // Local Events & Activity State
  const [sidebarEvents, setSidebarEvents] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<string[]>([
    "New cleanup event published in Shivajinagar",
    "Pranav M. unlocked Neighborhood Guardian badge",
    "Priyanka D. resolved active waste leakage issue"
  ]);

  // Reply inputs: map of parent ID (discussion or reply ID) to text
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [collapsedReplies, setCollapsedReplies] = useState<Record<string, boolean>>({});

  const isModeratorOrAdmin = user?.role === "admin" || user?.role === "moderator" || user?.role === "official";

  const challenges = [
    {
      title: "Viman Nagar Cleanliness Drive",
      desc: "Verify 3 solid waste reports in Sakore Road sector. Double XP active.",
      xpReward: 100,
      timeLeft: "2 days left",
      icon: Target,
      progress: 75,
      participants: 28,
      difficulty: "Medium",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    },
    {
      title: "Rainy Season Pothole Alert",
      desc: "Report active road damage reports in Shivajinagar. Earn special Monsoon safety badge.",
      xpReward: 150,
      timeLeft: "5 days left",
      icon: ShieldAlert,
      progress: 40,
      participants: 52,
      difficulty: "Hard",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    },
  ];

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreatingPost(true);
    try {
      const tagArr = newTags.split(",").map((t) => t.trim()).filter(Boolean);
      const newPost: any = {
        title: newTitle,
        content: newContent,
        authorId: user.uid,
        authorName: user.displayName || "Anonymous Citizen",
        authorAvatar: user.photoURL || "",
        tags: tagArr,
        likes: 0,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        replies: [],
        createdAt: new Date().toISOString(),
        imageUrl: newImageUrl || "",
        category: newCategory,
        bookmarkedBy: [],
        shares: 0,
        reported: false,
        reportedCount: 0
      };

      await addDoc(collection(db, "discussions"), newPost);

      // Reset & close Modal
      setNewTitle("");
      setNewContent("");
      setNewTags("");
      setNewImageUrl("");
      setIsComposeOpen(false);

      setActivityLogs((prev) => [
        `You published a new thread: "${newTitle}"`,
        ...prev.slice(0, 4)
      ]);
    } catch (err) {
      console.error("Failed to post discussion:", err);
    } finally {
      setCreatingPost(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    const post = discussions.find((d) => d.id === postId);
    if (!post) return;

    const alreadyLiked = post.likedBy?.includes(user.uid) || false;
    const alreadyDisliked = post.dislikedBy?.includes(user.uid) || false;

    let updates: any = {};
    if (alreadyLiked) {
      updates.likes = increment(-1);
      updates.likedBy = arrayRemove(user.uid);
    } else {
      updates.likes = increment(1);
      updates.likedBy = arrayUnion(user.uid);
      if (alreadyDisliked) {
        updates.dislikes = increment(-1);
        updates.dislikedBy = arrayRemove(user.uid);
      }
    }

    try {
      await updateDoc(doc(db, "discussions", postId), updates);
    } catch (err) {
      console.error("Like failed:", err);
    }
  };

  const handleDislike = async (postId: string) => {
    if (!user) return;
    const post = discussions.find((d) => d.id === postId);
    if (!post) return;

    const alreadyLiked = post.likedBy?.includes(user.uid) || false;
    const alreadyDisliked = post.dislikedBy?.includes(user.uid) || false;

    let updates: any = {};
    if (alreadyDisliked) {
      updates.dislikes = increment(-1);
      updates.dislikedBy = arrayRemove(user.uid);
    } else {
      updates.dislikes = increment(1);
      updates.dislikedBy = arrayUnion(user.uid);
      if (alreadyLiked) {
        updates.likes = increment(-1);
        updates.likedBy = arrayRemove(user.uid);
      }
    }

    try {
      await updateDoc(doc(db, "discussions", postId), updates);
    } catch (err) {
      console.error("Dislike failed:", err);
    }
  };

  const handleAddReply = async (postId: string, parentReplyId?: string) => {
    if (!user) return;
    const inputKey = parentReplyId || postId;
    const content = replyInputs[inputKey];
    if (!content || !content.trim()) return;

    const post = discussions.find((d) => d.id === postId);
    if (!post) return;

    const newReply: DiscussionReply = {
      id: `rep_${Date.now()}`,
      authorId: user.uid,
      authorName: user.displayName || "Citizen",
      authorAvatar: user.photoURL || "",
      content,
      createdAt: new Date().toISOString(),
      replies: [],
      uid: user.uid,
      likes: 0,
      replyCount: 0
    };

    let updatedReplies = [...(post.replies || [])];
    if (!parentReplyId) {
      updatedReplies.push(newReply);
    } else {
      const appendNested = (repliesList: DiscussionReply[]): boolean => {
        for (let r of repliesList) {
          if (r.id === parentReplyId) {
            r.replies = [...(r.replies || []), newReply];
            r.replyCount = (r.replyCount || 0) + 1;
            return true;
          }
          if (r.replies && r.replies.length > 0) {
            const found = appendNested(r.replies);
            if (found) return true;
          }
        }
        return false;
      };
      appendNested(updatedReplies);
    }

    try {
      await updateDoc(doc(db, "discussions", postId), { replies: updatedReplies });
      setReplyInputs((prev) => ({ ...prev, [inputKey]: "" }));
    } catch (err) {
      console.error("Failed to post reply:", err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, "discussions", postId));
      setActivityLogs((prev) => [
        "Discussion thread deleted successfully.",
        ...prev.slice(0, 4)
      ]);
    } catch (err) {
      console.error("Moderator delete failed:", err);
    }
  };

  const handleTogglePin = async (postId: string, currentPin: boolean) => {
    try {
      await updateDoc(doc(db, "discussions", postId), { isPinned: !currentPin });
    } catch (err) {
      console.error("Moderator pin toggle failed:", err);
    }
  };

  const handleJoinDrive = (driveName: string) => {
    setActivityLogs((prev) => [
      `You joined drive: "${driveName}" (+100 Reputation)`,
      ...prev.slice(0, 4)
    ]);
  };

  const handleVotePoll = (postId: string) => {
    setActivityLogs((prev) => [
      `You voted on the poll for discussion ID ${postId}`,
      ...prev.slice(0, 4)
    ]);
  };

  const renderReplyChain = (replies: DiscussionReply[], postId: string, depth = 0) => {
    return replies.map((reply) => (
      <div key={reply.id} className="pl-4 border-l border-white/5 space-y-2 text-left pt-2.5">
        <div className="flex items-start gap-2.5">
          <div className="h-6 w-6 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-[10px] shrink-0 overflow-hidden">
            {reply.authorAvatar ? (
              <img src={reply.authorAvatar} alt="" className="w-full h-full object-cover rounded" />
            ) : (
              reply.authorName[0]
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white block leading-none">{reply.authorName}</span>
              <span className="text-[8px] bg-purple-500/10 text-purple-400 px-1 rounded-full font-bold">Lvl 2</span>
            </div>
            <p className="text-xs text-[#9AA3B8] mt-1 font-medium leading-relaxed">{reply.content}</p>
          </div>
        </div>

        {/* Reply Action Form */}
        <div className="flex gap-2 pl-8">
          <input
            type="text"
            placeholder="Reply to this comment..."
            value={replyInputs[reply.id] || ""}
            onChange={(e) => setReplyInputs((prev) => ({ ...prev, [reply.id]: e.target.value }))}
            className="flex-1 bg-white/5 border border-white/5 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[#F3F4F6] focus:outline-none focus:border-[#16A34A]"
          />
          <button
            onClick={() => handleAddReply(postId, reply.id)}
            className="p-1 text-purple-400 hover:text-purple-300"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {reply.replies && reply.replies.length > 0 && (
          <div className="pl-4">
            {renderReplyChain(reply.replies, postId, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  // Automated Community Seeder
  const seedCommunityData = async (currentUserUid?: string) => {
    console.log("Seeding Community Hub database with rich mock logs...");
    
    // 1. Seed 15 Users
    const mockUsers = [
      { uid: "mock_user_1", displayName: "Pranav Mehra", role: "citizen", locality: "Viman Nagar", ward: "Ward 12", reputation: 1240, volunteerHours: 24, trust: { tier: "gold", score: 950, totalReports: 18, verificationContributions: 12, resolutionConfirmations: 5 } },
      { uid: "mock_user_2", displayName: "Aishwarya Kelkar", role: "citizen", locality: "Kalyani Nagar", ward: "Ward 14", reputation: 980, volunteerHours: 18, trust: { tier: "silver", score: 820, totalReports: 14, verificationContributions: 8, resolutionConfirmations: 3 } },
      { uid: "mock_user_3", displayName: "Rahul Shinde", role: "citizen", locality: "Shivajinagar", ward: "Ward 8", reputation: 850, volunteerHours: 15, trust: { tier: "silver", score: 790, totalReports: 12, verificationContributions: 9, resolutionConfirmations: 4 } },
      { uid: "mock_user_4", displayName: "Sneha Gokhale", role: "citizen", locality: "Kothrud", ward: "Ward 10", reputation: 620, volunteerHours: 10, trust: { tier: "bronze", score: 650, totalReports: 9, verificationContributions: 5, resolutionConfirmations: 2 } },
      { uid: "mock_user_5", displayName: "Vikram Singh", role: "citizen", locality: "Hadapsar", ward: "Ward 5", reputation: 480, volunteerHours: 8, trust: { tier: "new", score: 480, totalReports: 7, verificationContributions: 3, resolutionConfirmations: 1 } },
      { uid: "mock_user_6", displayName: "Rajesh Patil", role: "official", department: "Solid Waste Management", wardId: "Ward 12", officerCode: "OFF_102", reputation: 1500, volunteerHours: 0, trust: { tier: "gold", score: 900, totalReports: 0, verificationContributions: 0, resolutionConfirmations: 15 } },
      { uid: "mock_user_7", displayName: "Priya Deshmukh", role: "moderator", locality: "Pune Central", ward: "Ward 1", reputation: 2100, volunteerHours: 0, trust: { tier: "gold", score: 950, totalReports: 0, verificationContributions: 0, resolutionConfirmations: 20 } },
      { uid: "mock_user_8", displayName: "Anjali Joshi", role: "citizen", locality: "Kothrud", ward: "Ward 10", reputation: 350, volunteerHours: 5, trust: { tier: "bronze", score: 580, totalReports: 5, verificationContributions: 2, resolutionConfirmations: 1 } },
      { uid: "mock_user_9", displayName: "Sanjay Shah", role: "citizen", locality: "Camp Area", ward: "Ward 3", reputation: 420, volunteerHours: 12, trust: { tier: "bronze", score: 600, totalReports: 6, verificationContributions: 4, resolutionConfirmations: 2 } },
      { uid: "mock_user_10", displayName: "Meera K.", role: "citizen", locality: "Aundh", ward: "Ward 2", reputation: 280, volunteerHours: 4, trust: { tier: "new", score: 420, totalReports: 3, verificationContributions: 1, resolutionConfirmations: 1 } },
      { uid: "mock_user_11", displayName: "Vikrant G.", role: "citizen", locality: "Swargate", ward: "Ward 6", reputation: 710, volunteerHours: 14, trust: { tier: "silver", score: 720, totalReports: 10, verificationContributions: 7, resolutionConfirmations: 3 } },
      { uid: "mock_user_12", displayName: "Devendra P.", role: "official", department: "Water Supply Department", wardId: "Ward 8", officerCode: "OFF_804", reputation: 1100, volunteerHours: 0, trust: { tier: "gold", score: 890, totalReports: 0, verificationContributions: 0, resolutionConfirmations: 8 } },
      { uid: "mock_user_13", displayName: "Aditi S.", role: "citizen", locality: "Baner", ward: "Ward 11", reputation: 530, volunteerHours: 9, trust: { tier: "bronze", score: 610, totalReports: 8, verificationContributions: 3, resolutionConfirmations: 2 } },
      { uid: "mock_user_14", displayName: "Kunal D.", role: "citizen", locality: "Viman Nagar", ward: "Ward 12", reputation: 890, volunteerHours: 16, trust: { tier: "silver", score: 790, totalReports: 13, verificationContributions: 6, resolutionConfirmations: 4 } },
      { uid: "mock_user_15", displayName: "Neha Gawde", role: "citizen", locality: "Kalyani Nagar", ward: "Ward 14", reputation: 310, volunteerHours: 3, trust: { tier: "new", score: 410, totalReports: 4, verificationContributions: 1, resolutionConfirmations: 1 } }
    ];

    for (const u of mockUsers) {
      await setDoc(doc(db, "users", u.uid), u, { merge: true });
    }

    // 2. Seed 8 Events
    const mockEvents = [
      { id: "evt_clean_1", title: "Clover Park Cleanup", locationName: "Sakore Road, Viman Nagar", date: Timestamp.fromDate(new Date(Date.now() + 3*24*3600*1000)), type: "volunteer", volunteerCount: 15, registeredVolunteerIds: ["mock_user_1", "mock_user_2"], organizer: "mock_user_6", hoursReward: 3, description: "Cleaning solid waste from Clover Park crossing." },
      { id: "evt_clean_2", title: "Tree Plantation Drive", locationName: "Pashan Hill, Pune", date: Timestamp.fromDate(new Date(Date.now() + 5*24*3600*1000)), type: "volunteer", volunteerCount: 25, registeredVolunteerIds: ["mock_user_3", "mock_user_4"], organizer: "mock_user_7", hoursReward: 4, description: "Planting saplings on Pashan Hill." },
      { id: "evt_clean_3", title: "Mula-Mutha Cleanup", locationName: "Clean River Sector 2", date: Timestamp.fromDate(new Date(Date.now() + 7*24*3600*1000)), type: "volunteer", volunteerCount: 30, registeredVolunteerIds: ["mock_user_1", "mock_user_5"], organizer: "mock_user_6", hoursReward: 5, description: "Riverbed garbage collection drive." },
      { id: "evt_clean_4", title: "Monsoon Flood Prep", locationName: "Shivajinagar Ward Office", date: Timestamp.fromDate(new Date(Date.now() + 10*24*3600*1000)), type: "attendee", volunteerCount: 50, registeredVolunteerIds: ["mock_user_2", "mock_user_3"], organizer: "mock_user_12", hoursReward: 2, description: "Monsoon safety and sandbags preparation workshop." },
      { id: "evt_clean_5", title: "Pothole Mapping Drive", locationName: "Hadapsar Main Road", date: Timestamp.fromDate(new Date(Date.now() + 12*24*3600*1000)), type: "volunteer", volunteerCount: 10, registeredVolunteerIds: ["mock_user_4", "mock_user_5"], organizer: "mock_user_7", hoursReward: 3, description: "Coordinate with officers to tag potholes on CivicMap." },
      { id: "evt_clean_6", title: "Waste Segregation Class", locationName: "Kothrud Community Hall", date: Timestamp.fromDate(new Date(Date.now() + 14*24*3600*1000)), type: "attendee", volunteerCount: 20, registeredVolunteerIds: ["mock_user_8", "mock_user_9"], organizer: "mock_user_6", hoursReward: 1, description: "Compost segregation techniques workshop." },
      { id: "evt_clean_7", title: "Civic Awareness Drive", locationName: "Camp Crossing Road", date: Timestamp.fromDate(new Date(Date.now() + 18*24*3600*1000)), type: "volunteer", volunteerCount: 12, registeredVolunteerIds: ["mock_user_1", "mock_user_10"], organizer: "mock_user_7", hoursReward: 4, description: "Distributing brochures on civic rules." },
      { id: "evt_clean_8", title: "Monsoon Blood Camp", locationName: "Ruby Clinic Hall", date: Timestamp.fromDate(new Date(Date.now() + 21*24*3600*1000)), type: "attendee", volunteerCount: 100, registeredVolunteerIds: ["mock_user_3", "mock_user_11"], organizer: "mock_user_12", hoursReward: 2, description: "Annual community blood donation camp." }
    ];

    for (const e of mockEvents) {
      await setDoc(doc(db, "events", e.id), e, { merge: true });
    }

    // 3. Recursive Comments Generator Helper
    const generateComments = (category: string, title: string, currentUserUid?: string) => {
      const basic = [
        {
          id: `rep_1_${Math.random()}`,
          authorId: "mock_user_1",
          authorName: "Pranav Mehra",
          authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Pranav",
          content: `This is a highly relevant discussion regarding ${category.toLowerCase()}. We need immediate local volunteer coordination.`,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          uid: "mock_user_1",
          likes: 4,
          replyCount: 1,
          replies: [
            {
              id: `rep_1_nested_${Math.random()}`,
              authorId: "mock_user_6",
              authorName: "Rajesh Patil (Official)",
              authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Rajesh",
              content: `The Municipal Department has flagged this thread: "${title}". A verification patrol is scheduled.`,
              createdAt: new Date(Date.now() - 1800000).toISOString(),
              uid: "mock_user_6",
              likes: 12,
              replyCount: 1,
              replies: [
                {
                  id: `rep_1_nested_deep_${Math.random()}`,
                  authorId: "mock_user_3",
                  authorName: "Rahul Shinde",
                  authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Rahul",
                  content: "Thank you Officer Rajesh. We are ready to assist with logistics or mapping support.",
                  createdAt: new Date(Date.now() - 900000).toISOString(),
                  uid: "mock_user_3",
                  likes: 2,
                  replyCount: 0,
                  replies: []
                }
              ]
            }
          ]
        },
        {
          id: `rep_2_${Math.random()}`,
          authorId: "mock_user_2",
          authorName: "Aishwarya Kelkar",
          authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Aishwarya",
          content: "I completely agree. The current state is unsafe. Let's form a cleanup/inspection drive this weekend.",
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          uid: "mock_user_2",
          likes: 5,
          replyCount: 1,
          replies: [
            {
              id: `rep_2_nested_${Math.random()}`,
              authorId: "mock_user_4",
              authorName: "Sneha Gokhale",
              authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Sneha",
              content: "I'm in! Let's sign up volunteers in the Ward Challenges section.",
              createdAt: new Date(Date.now() - 5400000).toISOString(),
              uid: "mock_user_4",
              likes: 1,
              replyCount: 0,
              replies: []
            }
          ]
        },
        {
          id: `rep_3_${Math.random()}`,
          authorId: "mock_user_13",
          authorName: "Aditi S.",
          authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Aditi",
          content: "Great initiative. Hope we get a fast resolution on this.",
          createdAt: new Date(Date.now() - 10800000).toISOString(),
          uid: "mock_user_13",
          likes: 0,
          replyCount: 0,
          replies: []
        }
      ];

      if (currentUserUid) {
        basic.push({
          id: `rep_user_${Math.random()}`,
          authorId: currentUserUid,
          authorName: user?.displayName || "You (Citizen)",
          authorAvatar: user?.photoURL || "https://api.dicebear.com/7.x/bottts/svg?seed=user",
          content: "I have shared this post with my neighborhood community group. Let's get more people to RSVP!",
          createdAt: new Date(Date.now() - 500000).toISOString(),
          uid: currentUserUid,
          likes: 3,
          replyCount: 0,
          replies: []
        });
      }

      return basic;
    };

    // 4. Seed 38 Discussions
    const mockDiscussions = [
      // Environment
      {
        title: "Tree Plantation Drive in Paschim Sector",
        content: "Let's gather this Sunday to plant 100 saplings near Paschim crossroad. Bringing gardening tools is highly recommended.",
        authorId: "mock_user_1",
        authorName: "Pranav Mehra",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Pranav",
        tags: ["Trees", "Environment", "Volunteering"],
        category: "Environment",
        likes: 124,
        likedBy: ["mock_user_2", "mock_user_3"],
        dislikes: 1,
        dislikedBy: [],
        isPinned: true,
        bookmarkedBy: [],
        shares: 8,
        replies: generateComments("Environment", "Tree Plantation Drive in Paschim Sector", currentUserUid),
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80"
      },
      {
        title: "Kalyani Nagar Garbage Segregation Awareness Session",
        content: "We are holding a brief briefing on how to segregate wet kitchen wastes and dry recyclables. Join at the public community center.",
        authorId: "mock_user_2",
        authorName: "Aishwarya Kelkar",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Aishwarya",
        tags: ["WasteManagement", "Environment"],
        category: "Environment",
        likes: 98,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: currentUserUid ? [currentUserUid] : [],
        shares: 4,
        replies: generateComments("Environment", "Kalyani Nagar Garbage Segregation Awareness Session", currentUserUid),
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80"
      },
      {
        title: "Urban Forest Volunteers Recruitment Campaign",
        content: "Join the local conservators team to maintain the newly created urban forestry sector near Pashan Hill.",
        authorId: "mock_user_4",
        authorName: "Sneha Gokhale",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Sneha",
        tags: ["Forest", "Volunteers", "Environment"],
        category: "Environment",
        likes: 67,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 2,
        replies: generateComments("Environment", "Urban Forest Volunteers Recruitment Campaign", currentUserUid),
        createdAt: new Date(Date.now() - 10800000).toISOString()
      },
      {
        title: "Monsoon Plastic Free Ward Initiative",
        content: "Let's swap single-use plastics for canvas bags at Viman Nagar market complex to avoid sewer clogging.",
        authorId: "mock_user_1",
        authorName: "Pranav Mehra",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Pranav",
        tags: ["Plastics", "Sanitation", "Environment"],
        category: "Environment",
        likes: 142,
        likedBy: [],
        dislikes: 2,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 9,
        replies: generateComments("Environment", "Monsoon Plastic Free Ward Initiative", currentUserUid),
        createdAt: new Date(Date.now() - 14400000).toISOString()
      },
      {
        title: "Hadapsar Lake Cleanup Campaign next Sunday",
        content: "The water body has been heavily contaminated with plastic bags and household garbage. Let's reclaim it.",
        authorId: "mock_user_10",
        authorName: "Meera K.",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Meera",
        tags: ["Lake", "Cleanup", "Environment"],
        category: "Environment",
        likes: 85,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 3,
        replies: generateComments("Environment", "Hadapsar Lake Cleanup Campaign next Sunday", currentUserUid),
        createdAt: new Date(Date.now() - 18000000).toISOString()
      },
      {
        title: "Community Composting Kit Demonstration",
        content: "Demo of home compost kits to turn dry organic kitchen waste into compost in under 3 weeks.",
        authorId: "mock_user_8",
        authorName: "Anjali Joshi",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Anjali",
        tags: ["Compost", "Environment"],
        category: "Environment",
        likes: 54,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 1,
        replies: generateComments("Environment", "Community Composting Kit Demonstration", currentUserUid),
        createdAt: new Date(Date.now() - 21600000).toISOString()
      },
      {
        title: "River Restoration Project: Mula Mutha Banks",
        content: "Let's restore the local riparian corridor by removing non-native hyacinths and planting native river grass.",
        authorId: "mock_user_1",
        authorName: "Pranav Mehra",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Pranav",
        tags: ["River", "Environment"],
        category: "Environment",
        likes: 110,
        likedBy: [],
        dislikes: 1,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 6,
        replies: generateComments("Environment", "River Restoration Project: Mula Mutha Banks", currentUserUid),
        createdAt: new Date(Date.now() - 25200000).toISOString()
      },
      {
        title: "Compost Workshop Feedback & Next Steps",
        content: "I attended the compost kit demo last Saturday and compiled a guide. Let me know if you need the PDF checklist or if we should organize another local workshop.",
        authorId: currentUserUid || "mock_user_1",
        authorName: currentUserUid ? (user?.displayName || "You") : "Pranav Mehra",
        authorAvatar: user?.photoURL || "https://api.dicebear.com/7.x/bottts/svg?seed=Pranav",
        tags: ["Compost", "Workshop", "Environment"],
        category: "Environment",
        likes: 42,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 5,
        replies: generateComments("Environment", "Compost Workshop Feedback & Next Steps", currentUserUid),
        createdAt: new Date(Date.now() - 28800000).toISOString()
      },
      {
        title: "Neighborhood Plastic Recycling Depot Setup",
        content: "We are coordinating with a local recycler to set up a collection box at our sector gate. Clean and dry plastics only.",
        authorId: "mock_user_2",
        authorName: "Aishwarya Kelkar",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Aishwarya",
        tags: ["Recycle", "Plastics", "Environment"],
        category: "Environment",
        likes: 88,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 7,
        replies: generateComments("Environment", "Neighborhood Plastic Recycling Depot Setup", currentUserUid),
        createdAt: new Date(Date.now() - 32400000).toISOString()
      },

      // Infrastructure
      {
        title: "Broken Streetlights on Sakore Road Crossing",
        content: "The intersection near Sakore Road crossing has been pitch black for 3 nights. It is unsafe for pedestrians.",
        authorId: "mock_user_3",
        authorName: "Rahul Shinde",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Rahul",
        tags: ["Streetlights", "Infrastructure", "Safety"],
        category: "Infrastructure",
        likes: 198,
        likedBy: [],
        dislikes: 3,
        dislikedBy: [],
        bookmarkedBy: currentUserUid ? [currentUserUid] : [],
        shares: 7,
        replies: generateComments("Infrastructure", "Broken Streetlights on Sakore Road Crossing", currentUserUid),
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        title: "Severe Pothole Hazard near Clover Park Junction",
        content: "A massive pothole has opened up near Clover Park junction, causing vehicles to sway dangerously.",
        authorId: "mock_user_1",
        authorName: "Pranav Mehra",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Pranav",
        tags: ["Potholes", "Infrastructure"],
        category: "Infrastructure",
        likes: 245,
        likedBy: [],
        dislikes: 2,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 15,
        replies: generateComments("Infrastructure", "Severe Pothole Hazard near Clover Park Junction", currentUserUid),
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80"
      },
      {
        title: "Water Pipeline Leakage on Lane 3 Kalyani Nagar",
        content: "Water is bubbling up through the road seam. Needs immediate valve repair to prevent structural road damage.",
        authorId: "mock_user_14",
        authorName: "Kunal D.",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Kunal",
        tags: ["WaterLeakage", "Infrastructure"],
        category: "Infrastructure",
        likes: 120,
        likedBy: [],
        dislikes: 1,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 5,
        replies: generateComments("Infrastructure", "Water Pipeline Leakage on Lane 3 Kalyani Nagar", currentUserUid),
        createdAt: new Date(Date.now() - 10800000).toISOString()
      },
      {
        title: "Footpath Blockage due to construction debris",
        content: "An entire construction dumpster has been placed on the pedestrian footpath, blocking access.",
        authorId: "mock_user_5",
        authorName: "Vikram Singh",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Vikram",
        tags: ["Footpaths", "Infrastructure"],
        category: "Infrastructure",
        likes: 76,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 1,
        replies: generateComments("Infrastructure", "Footpath Blockage due to construction debris", currentUserUid),
        createdAt: new Date(Date.now() - 14400000).toISOString()
      },
      {
        title: "Drainage Clogging during heavy rain spells",
        content: "The storm sewer is completely backed up with dry leaves and trash, leading to waterlogging on the road.",
        authorId: "mock_user_11",
        authorName: "Vikrant G.",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Vikrant",
        tags: ["Drainage", "Infrastructure"],
        category: "Infrastructure",
        likes: 64,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 2,
        replies: generateComments("Infrastructure", "Drainage Clogging during heavy rain spells", currentUserUid),
        createdAt: new Date(Date.now() - 18000000).toISOString()
      },
      {
        title: "Damaged Bus Shelter near Hadapsar Depot",
        content: "Commuters are forced to stand under direct sun and rain since the bus stop canopy roof has collapsed.",
        authorId: "mock_user_5",
        authorName: "Vikram Singh",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Vikram",
        tags: ["Transit", "Infrastructure"],
        category: "Infrastructure",
        likes: 83,
        likedBy: [],
        dislikes: 1,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 4,
        replies: generateComments("Infrastructure", "Damaged Bus Shelter near Hadapsar Depot", currentUserUid),
        createdAt: new Date(Date.now() - 21600000).toISOString()
      },
      {
        title: "Road Widening and Congestion Suggestions - Viman Nagar",
        content: "I have gathered road usage stats for Clover park road. The bottleneck causes 20-min delays daily. I propose a parking ban during rush hours. Share your suggestions!",
        authorId: currentUserUid || "mock_user_1",
        authorName: currentUserUid ? (user?.displayName || "You") : "Pranav Mehra",
        authorAvatar: user?.photoURL || "https://api.dicebear.com/7.x/bottts/svg?seed=Pranav",
        tags: ["Traffic", "Roads", "Infrastructure"],
        category: "Infrastructure",
        likes: 56,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 6,
        replies: generateComments("Infrastructure", "Road Widening and Congestion Suggestions - Viman Nagar", currentUserUid),
        createdAt: new Date(Date.now() - 25200000).toISOString()
      },
      {
        title: "Footpath Curb Cuts for Wheelchair Accessibility",
        content: "Let's list the corners around baner crossing that lack ramp transitions so we can push for updates.",
        authorId: "mock_user_13",
        authorName: "Aditi S.",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Aditi",
        tags: ["Ramps", "Accessibility", "Infrastructure"],
        category: "Infrastructure",
        likes: 104,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 5,
        replies: generateComments("Infrastructure", "Footpath Curb Cuts for Wheelchair Accessibility", currentUserUid),
        createdAt: new Date(Date.now() - 28800000).toISOString()
      },

      // Safety
      {
        title: "Crosswalk Safety improvements near school zone",
        content: "Let's push for high-visibility zebra paint and speed bumps near the public primary school zone crossing.",
        authorId: "mock_user_1",
        authorName: "Pranav Mehra",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Pranav",
        tags: ["School", "Safety"],
        category: "Safety",
        likes: 189,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 11,
        replies: generateComments("Safety", "Crosswalk Safety improvements near school zone", currentUserUid),
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        title: "Organizing Safe Streets Night Patrol near Lane 5",
        content: "Organizing neighborhood night patrols to ensure dark lanes are safe for late returning residents.",
        authorId: "mock_user_1",
        authorName: "Pranav Mehra",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Pranav",
        tags: ["Patrol", "Safety", "Community"],
        category: "Safety",
        likes: 112,
        likedBy: [],
        dislikes: 1,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 3,
        replies: generateComments("Safety", "Organizing Safe Streets Night Patrol near Lane 5", currentUserUid),
        createdAt: new Date(Date.now() - 7200000).toISOString()
      },
      {
        title: "CCTV Camera Installation Request at blind curve",
        content: "The blind crossing has seen multiple minor accidents. Installing a traffic safety cam is crucial.",
        authorId: "mock_user_9",
        authorName: "Sanjay Shah",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Sanjay",
        tags: ["CCTV", "Safety"],
        category: "Safety",
        likes: 95,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 4,
        replies: generateComments("Safety", "CCTV Camera Installation Request at blind curve", currentUserUid),
        createdAt: new Date(Date.now() - 10800000).toISOString()
      },
      {
        title: "Air Quality Alert: Dust Suppression request",
        content: "Nearby construction works are creating high PM10 levels. Requesting municipal sprinklers to suppress dust.",
        authorId: "mock_user_7",
        authorName: "Priya Deshmukh (Moderator)",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Priya",
        tags: ["AirQuality", "Safety"],
        category: "Safety",
        likes: 156,
        likedBy: [],
        dislikes: 3,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 10,
        replies: generateComments("Safety", "Air Quality Alert: Dust Suppression request", currentUserUid),
        createdAt: new Date(Date.now() - 14400000).toISOString()
      },
      {
        title: "School Zone Traffic Guard volunteers needed",
        content: "We need 3 volunteers to assist kids at the Baner road intersection during afternoon hours.",
        authorId: "mock_user_3",
        authorName: "Rahul Shinde",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Rahul",
        tags: ["Traffic", "School", "Safety"],
        category: "Safety",
        likes: 64,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 3,
        replies: generateComments("Safety", "School Zone Traffic Guard volunteers needed", currentUserUid),
        createdAt: new Date(Date.now() - 18000000).toISOString()
      },
      {
        title: "Emergency Fire Hydrant Access maintenance check",
        content: "Let's make sure the neighborhood fire hydrants are clear of parked cars and vegetation blockages.",
        authorId: "mock_user_4",
        authorName: "Sneha Gokhale",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Sneha",
        tags: ["FireSafety", "Hydrant", "Safety"],
        category: "Safety",
        likes: 72,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 2,
        replies: generateComments("Safety", "Emergency Fire Hydrant Access maintenance check", currentUserUid),
        createdAt: new Date(Date.now() - 21600000).toISOString()
      },

      // Community
      {
        title: "Blood Donation Camp at Ruby Clinic Complex",
        content: "Annual citizen blood bank drive. Professional medical staff will handle the donor registrations.",
        authorId: "mock_user_3",
        authorName: "Rahul Shinde",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Rahul",
        tags: ["BloodDonation", "Community"],
        category: "Community",
        likes: 215,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: currentUserUid ? [currentUserUid] : [],
        shares: 18,
        replies: generateComments("Community", "Blood Donation Camp at Ruby Clinic Complex", currentUserUid),
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        title: "Senior Citizen Assistance Volunteers Signups",
        content: "Sign up to assist elderly neighbors with groceries, pharmacy pickups, or hospital transport services.",
        authorId: "mock_user_13",
        authorName: "Aditi S.",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Aditi",
        tags: ["Volunteering", "Community"],
        category: "Community",
        likes: 88,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 5,
        replies: generateComments("Community", "Senior Citizen Assistance Volunteers Signups", currentUserUid),
        createdAt: new Date(Date.now() - 7200000).toISOString()
      },
      {
        title: "Local Sports and Integration Day Tournament",
        content: "Ward sports match to foster community interactions. Sign up for local football or cricket teams.",
        authorId: "mock_user_11",
        authorName: "Vikrant G.",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Vikrant",
        tags: ["Sports", "Community"],
        category: "Community",
        likes: 67,
        likedBy: [],
        dislikes: 1,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 2,
        replies: generateComments("Community", "Local Sports and Integration Day Tournament", currentUserUid),
        createdAt: new Date(Date.now() - 10800000).toISOString()
      },
      {
        title: "Neighborhood Public Library books donation camp",
        content: "Have old novels, textbooks, or children's books? Drop them at our library cabinet in community hall.",
        authorId: "mock_user_8",
        authorName: "Anjali Joshi",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Anjali",
        tags: ["Books", "Community"],
        category: "Community",
        likes: 95,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 4,
        replies: generateComments("Community", "Neighborhood Public Library books donation camp", currentUserUid),
        createdAt: new Date(Date.now() - 14400000).toISOString()
      },
      {
        title: "Community Kitchen and Meal Share initiative",
        content: "Let's organize a community food pantry where neighbors can share excess garden harvest or meals.",
        authorId: "mock_user_2",
        authorName: "Aishwarya Kelkar",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Aishwarya",
        tags: ["FoodShare", "Pantry", "Community"],
        category: "Community",
        likes: 83,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 3,
        replies: generateComments("Community", "Community Kitchen and Meal Share initiative", currentUserUid),
        createdAt: new Date(Date.now() - 18000000).toISOString()
      },
      {
        title: "Summer Sports coaching for underprivileged kids",
        content: "Looking for volunteer coaches for cricket and football during evening hours at the school field.",
        authorId: "mock_user_4",
        authorName: "Sneha Gokhale",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Sneha",
        tags: ["Sports", "Kids", "Community"],
        category: "Community",
        likes: 64,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 2,
        replies: generateComments("Community", "Summer Sports coaching for underprivileged kids", currentUserUid),
        createdAt: new Date(Date.now() - 21600000).toISOString()
      },

      // Announcements
      {
        title: "Ward Office Notice: Scheduled Water Supply cuts",
        content: "Due to emergency channel patching, water supply will remain closed this Thursday morning in Sector 4.",
        authorId: "mock_user_6",
        authorName: "Rajesh Patil (Official)",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Rajesh",
        tags: ["WaterSupply", "Announcements"],
        category: "Announcements",
        likes: 174,
        likedBy: [],
        dislikes: 2,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 22,
        replies: generateComments("Announcements", "Ward Office Notice: Scheduled Water Supply cuts", currentUserUid),
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        title: "Traffic Diversion: Metro Construction Phase 3",
        content: "Metro lane concrete works will restrict traffic on Clover junction to single lane during midnight hours.",
        authorId: "mock_user_6",
        authorName: "Rajesh Patil (Official)",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Rajesh",
        tags: ["Metro", "Traffic", "Announcements"],
        category: "Announcements",
        likes: 120,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 14,
        replies: generateComments("Announcements", "Traffic Diversion: Metro Construction Phase 3", currentUserUid),
        createdAt: new Date(Date.now() - 7200000).toISOString()
      },
      {
        title: "PMC Announcement: Household Waste Rules upgrade",
        content: "New penalties announced for non-segregated household waste dump. Strict wet/dry separation mandatory.",
        authorId: "mock_user_6",
        authorName: "Rajesh Patil (Official)",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Rajesh",
        tags: ["WasteRules", "Announcements"],
        category: "Announcements",
        likes: 205,
        likedBy: [],
        dislikes: 5,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 31,
        replies: generateComments("Announcements", "PMC Announcement: Household Waste Rules upgrade", currentUserUid),
        createdAt: new Date(Date.now() - 10800000).toISOString()
      },
      {
        title: "Public Consultation: Ward Development Budget 2026",
        content: "Join us this Friday at the main ward office hall for budget proposal feedback and project approvals.",
        authorId: "mock_user_6",
        authorName: "Rajesh Patil (Official)",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Rajesh",
        tags: ["Budget", "WardOffice", "Announcements"],
        category: "Announcements",
        likes: 148,
        likedBy: [],
        dislikes: 1,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 19,
        replies: generateComments("Announcements", "Public Consultation: Ward Development Budget 2026", currentUserUid),
        createdAt: new Date(Date.now() - 14400000).toISOString()
      },

      // Events
      {
        title: "Civic Hackathon: Smart Solutions for Pune",
        content: "A 48-hour challenge to design applications solving municipal water, transit, or sanitation issues.",
        authorId: "mock_user_7",
        authorName: "Priya Deshmukh (Moderator)",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Priya",
        tags: ["Hackathon", "Events"],
        category: "Events",
        likes: 310,
        likedBy: [],
        dislikes: 1,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 28,
        replies: generateComments("Events", "Civic Hackathon: Smart Solutions for Pune", currentUserUid),
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80"
      },
      {
        title: "Monsoon Preparedness and Flood Safety walkthrough",
        content: "Ward officers and safety inspectors will detail precautions, backup power, and evacuation maps.",
        authorId: "mock_user_12",
        authorName: "Devendra P. (Official)",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Devendra",
        tags: ["Monsoon", "Safety", "Events"],
        category: "Events",
        likes: 145,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 12,
        replies: generateComments("Events", "Monsoon Preparedness and Flood Safety walkthrough", currentUserUid),
        createdAt: new Date(Date.now() - 7200000).toISOString()
      },
      {
        title: "Clean Pune Walkathon and plastic collection drive",
        content: "A 5K walkathon combined with plastic waste picking along key community streets.",
        authorId: "mock_user_1",
        authorName: "Pranav Mehra",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Pranav",
        tags: ["Walkathon", "Events"],
        category: "Events",
        likes: 189,
        likedBy: [],
        dislikes: 1,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 15,
        replies: generateComments("Events", "Clean Pune Walkathon and plastic collection drive", currentUserUid),
        createdAt: new Date(Date.now() - 10800000).toISOString()
      },
      {
        title: "Road Safety Awareness Session with traffic experts",
        content: "Traffic inspector guest talk on defensive driving, safety signals, and speed restrictions.",
        authorId: "mock_user_6",
        authorName: "Rajesh Patil (Official)",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Rajesh",
        tags: ["RoadSafety", "Events"],
        category: "Events",
        likes: 94,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 6,
        replies: generateComments("Events", "Road Safety Awareness Session with traffic experts", currentUserUid),
        createdAt: new Date(Date.now() - 14400000).toISOString()
      },
      {
        title: "Citizen Mapping Drive: Tagging infrastructure deficits",
        content: "Join the local volunteers group to mark potholes, dark spots, and illegal dump sites on the map.",
        authorId: "mock_user_7",
        authorName: "Priya Deshmukh (Moderator)",
        authorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Priya",
        tags: ["Mapping", "Deficits", "Events"],
        category: "Events",
        likes: 112,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
        bookmarkedBy: [],
        shares: 8,
        replies: generateComments("Events", "Citizen Mapping Drive: Tagging infrastructure deficits", currentUserUid),
        createdAt: new Date(Date.now() - 18000000).toISOString()
      }
    ];

    for (const d of mockDiscussions) {
      await addDoc(collection(db, "discussions"), d);
    }
    console.log("Seeding complete!");
  };

  // Unified realtime effect — waits for Firebase Auth to be fully ready
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    let unsubDiscussions: (() => void) | null = null;
    let unsubEvents: (() => void) | null = null;
    let unsubUsers: (() => void) | null = null;

    const init = async () => {
      // Block until Firebase Auth session is fully propagated to Firestore.
      // This is the definitive fix for the PERMISSION_DENIED race condition
      // that occurs when anonymous/guest auth is still initializing.
      await auth.authStateReady();
      if (cancelled) return;

      // ── 1. Safe seeder ────────────────────────────────────────────────
      try {
        const snap = await getDocs(query(collection(db, "discussions"), limit(5)));
        if (!cancelled && snap.size < 5) {
          console.log(`Seeder: ${snap.size} docs. Seeding...`);
          await seedCommunityData(user.uid);
        }
      } catch (e) {
        console.error("Seeder check failed:", e);
      }

      if (cancelled) return;

      // ── 2. Discussions realtime listener ──────────────────────────────
      unsubDiscussions = onSnapshot(
        query(collection(db, "discussions"), orderBy("createdAt", "desc")),
        (snap) => {
          setDiscussions(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Discussion[]);
          setDiscLoading(false);
        },
        (err) => { console.error("Discussions snapshot error:", err); setDiscLoading(false); }
      );

      // ── 3. Events realtime listener ───────────────────────────────────
      unsubEvents = onSnapshot(
        query(collection(db, "events"), limit(6)),
        (snap) => setSidebarEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => console.error("Events snapshot error:", err)
      );

      // ── 4. Users / leaderboard realtime listener ──────────────────────
      setLeaderboardLoading(true);
      unsubUsers = onSnapshot(
        query(collection(db, "users"), limit(35)),
        (snap) => {
          setLeaderboardLoading(false);
          if (!user) return;
          const fromFirestore = snap.docs.map((d) => {
            const u = d.data() as UserDocument;
            const stats = calculateUserGamification(u);
            return { ...u, reputation: stats.reputation, totalReports: u.trust?.totalReports || 0, volunteerHours: u.volunteerHours || 0, locality: u.locality || "Pune Central", badges: stats.badges };
          });
          const currentUserEntry = { ...user, reputation: calculateUserGamification(user).reputation, totalReports: user.trust?.totalReports || 0, volunteerHours: user.volunteerHours || 0, locality: user.locality || "Pune Central", badges: calculateUserGamification(user).badges };
          setLeaderboardUsers(fromFirestore.some((u) => u.uid === user.uid) ? fromFirestore : [...fromFirestore, currentUserEntry]);
        },
        (err) => console.error("Leaderboard snapshot error:", err)
      );
    };

    init();

    return () => {
      cancelled = true;
      unsubDiscussions?.();
      unsubEvents?.();
      unsubUsers?.();
    };
  }, [user?.uid]);

  // Sorting and Filtering
  const getTrendingScore = (post: Discussion) => {
    const likes = post.likes || 0;
    const comments = post.replies ? post.replies.length : 0;
    const shares = post.shares || 0;
    const bookmarks = post.bookmarkedBy ? post.bookmarkedBy.length : 0;
    const isPinned = post.isPinned ? 1 : 0;
    
    // Recent activity check (within past 24 hours)
    const isRecent = (Date.now() - new Date(post.createdAt).getTime()) < 24*3600*1000 ? 1 : 0;
    
    return (likes * 2) + (comments * 5) + (shares * 3) + (bookmarks * 2) + (isPinned * 10) + (isRecent * 15);
  };

  const filteredDiscussions = discussions
    .filter((d) => {
      if (feedFilter === "All") return true;
      if (feedFilter === "Trending") return getTrendingScore(d) > 20;
      if (feedFilter === "Bookmarked") return d.bookmarkedBy?.includes(user?.uid || "") || false;
      if (feedFilter === "My Discussions") return d.authorId === user?.uid;
      
      // Categorical filter — case-insensitive, also match tags
      const cat = (d.category || "").toLowerCase();
      const filter = feedFilter.toLowerCase();
      return cat === filter || (d.tags || []).some((t) => t.toLowerCase() === filter);
    })
    .sort((a, b) => {
      if (sortBy === "Newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "Oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "Most Liked") return b.likes - a.likes;
      if (sortBy === "Most Commented") return b.replies.length - a.replies.length;
      if (sortBy === "Most Shared") return (b.shares || 0) - (a.shares || 0);
      
      // Default: Trending score
      return getTrendingScore(b) - getTrendingScore(a);
    });

  // Sidebar dynamic contributor calculation
  const getContributorScore = (u: any) => {
    const rep = u.reputation || 0;
    const vol = u.volunteerHours || 0;
    const reports = u.totalReports || 0;
    return rep + (vol * 10) + (reports * 20);
  };

  const sortedContributors = [...leaderboardUsers]
    .sort((a, b) => getContributorScore(b) - getContributorScore(a))
    .slice(0, 5);

  // Trending hashtags generator
  const getTrendingTags = () => {
    const counts: Record<string, number> = {};
    discussions.forEach((d) => {
      d.tags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  };

  const trendingTags = getTrendingTags();

  // Social interactions (Write back to Firestore)
  const handleBookmark = async (postId: string) => {
    if (!user) return;
    const post = discussions.find((d) => d.id === postId);
    if (!post) return;

    const bookmarkedBy = post.bookmarkedBy || [];
    const isBookmarked = bookmarkedBy.includes(user.uid);

    try {
      await updateDoc(doc(db, "discussions", postId), {
        bookmarkedBy: isBookmarked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
      setActivityLogs((prev) => [
        isBookmarked ? "Post removed from bookmarks." : "Discussion bookmarked successfully.",
        ...prev.slice(0, 4)
      ]);
    } catch (e) {
      console.error("Bookmark fail:", e);
    }
  };

  const handleShare = async (postId: string) => {
    try {
      await updateDoc(doc(db, "discussions", postId), {
        shares: increment(1)
      });
      navigator.clipboard.writeText(`${window.location.origin}/community?post=${postId}`);
      setActivityLogs((prev) => [
        "Discussion link copied to clipboard! (+10 XP)",
        ...prev.slice(0, 4)
      ]);
    } catch (e) {
      console.error("Share fail:", e);
    }
  };

  const handleReportPost = async (postId: string) => {
    try {
      await updateDoc(doc(db, "discussions", postId), {
        reported: true,
        reportedCount: increment(1)
      });
      setActivityLogs((prev) => [
        "Post reported to municipal moderator.",
        ...prev.slice(0, 4)
      ]);
    } catch (e) {
      console.error("Report fail:", e);
    }
  };

  const handleJoinEvent = async (eventId: string, isVolunteer: boolean) => {
    if (!user) return;
    console.log("Registering event:", eventId, "Volunteer mode:", isVolunteer);
    const event = sidebarEvents.find((e) => e.id === eventId);
    if (!event) return;

    const registered = event.registeredVolunteerIds || [];
    const isRegistered = registered.includes(user.uid);

    try {
      await updateDoc(doc(db, "events", eventId), {
        registeredVolunteerIds: isRegistered ? arrayRemove(user.uid) : arrayUnion(user.uid),
        volunteerCount: isRegistered ? increment(-1) : increment(1)
      });

      setActivityLogs((prev) => [
        isRegistered 
          ? `You left event: "${event.title}"` 
          : `You registered for: "${event.title}" (+150 XP)`,
        ...prev.slice(0, 4)
      ]);
    } catch (e) {
      console.error("Event registration fail:", e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-28 text-left select-none px-4">
      
      {/* ──────────────────────────────────────────────────────── */}
      {/* HERO SECTION */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Greet & Stats Cards (8 cols) */}
        <div className="lg:col-span-8 bg-[#1E293B] border border-white/5 p-6 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Welcome to the Community Hub! 👋
            </h1>
            <p className="text-xs text-[#9AA3B8] font-medium max-w-xl">
              Collaborate with citizens, discuss civic issues, participate in challenges and improve your city.
            </p>
          </div>

          {/* Metric stats cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Active Citizens", value: "12.4K", growth: "+8.2% this month", color: "text-[#16A34A]" },
              { label: "Discussions", value: discussions.length ? `${discussions.length + 2800}` : "2.8K", growth: "+12.6% this month", color: "text-blue-400" },
              { label: "Contributions", value: "4.6K", growth: "+15.4% this month", color: "text-purple-400" },
              { label: "New this week", value: "320", growth: "+5.7% this week", color: "text-amber-400" }
            ].map((card, idx) => (
              <div key={idx} className="bg-white/[0.02] border border-white/5 hover:border-[#16A34A]/25 p-3 rounded-xl transition-all group">
                <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider block">{card.label}</span>
                <span className={`text-lg font-black block mt-1.5 group-hover:scale-105 transition-transform ${card.color}`}>{card.value}</span>
                <span className="text-[8px] font-bold text-[#6B7280] block mt-0.5">{card.growth}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Community Impact Chart Card (4 cols) */}
        <div className="lg:col-span-4 bg-[#1E293B] border border-white/5 p-6 rounded-2xl flex flex-col justify-between shadow-xl text-left">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Community Impact</span>
              <h3 className="text-xl font-black text-white leading-none">1,248</h3>
              <span className="text-[10px] font-semibold text-[#16A34A] block mt-0.5">Problems Discussed</span>
            </div>
            <select className="bg-[#0F172A] border border-white/5 text-[10px] font-black text-white px-2 py-1 rounded-lg focus:outline-none cursor-pointer">
              <option>30 Days</option>
              <option>90 Days</option>
              <option>All Time</option>
            </select>
          </div>

          {/* Green SVG sparkline */}
          <div className="h-16 pt-2">
            <svg viewBox="0 0 300 80" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16A34A" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#16A34A" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path 
                d="M 10 60 Q 50 30 90 50 T 170 20 T 250 40 T 290 10" 
                fill="none" 
                stroke="#16A34A" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
              />
              <path 
                d="M 10 60 Q 50 30 90 50 T 170 20 T 250 40 T 290 10 L 290 80 L 10 80 Z" 
                fill="url(#chartGrad)" 
              />
              <circle cx="90" cy="50" r="4" fill="#16A34A" stroke="#1E293B" strokeWidth="1.5" />
              <circle cx="170" cy="20" r="4" fill="#16A34A" stroke="#1E293B" strokeWidth="1.5" />
              <circle cx="290" cy="10" r="4" fill="#16A34A" stroke="#1E293B" strokeWidth="1.5" />
            </svg>
          </div>

          <div className="flex justify-between text-[9px] font-black text-[#6B7280] uppercase tracking-wider pt-2 border-t border-white/5">
            <span>Jun 5</span>
            <span>Jun 19</span>
            <span>Jul 3</span>
          </div>
        </div>

      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* MAIN NAVIGATION BAR */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5 pt-4">
        <div className="flex gap-4">
          {[
            { id: "discussions", label: "Discussions Feed", icon: MessageSquare },
            { id: "leaderboard", label: "Community Leaderboards", icon: Trophy },
            { id: "challenges", label: "Ward Challenges", icon: Target }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMainTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeMainTab === tab.id
                    ? "border-[#16A34A] text-white"
                    : "border-transparent text-[#9AA3B8] hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <Button 
          onClick={() => setIsComposeOpen(true)}
          className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white font-bold text-xs flex items-center gap-1 px-4 py-1.5 rounded-xl shadow-lg"
        >
          <Plus className="w-3.5 h-3.5" /> Start a Discussion
        </Button>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 1: DISCUSSIONS (3-COLUMN LAYOUT) */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeMainTab === "discussions" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* COLUMN 1: LEFT SIDEBAR (Top Contributors, stats) */}
          <div className="lg:col-span-3 space-y-6 text-left hidden lg:block">
            {/* Top Contributors Card */}
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-4 shadow-lg space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-yellow-500" /> Top Contributors
                </span>
                <button onClick={() => setActiveMainTab("leaderboard")} className="text-[10px] font-bold text-[#16A34A] hover:underline">
                  View All
                </button>
              </div>

              {/* Subtabs for Contributors list */}
              <div className="grid grid-cols-4 gap-1 p-0.5 bg-black/20 rounded-lg text-[9px] font-black">
                {[
                  { id: "contributors", label: "Contr" },
                  { id: "reporters", label: "Rep" },
                  { id: "volunteers", label: "Vol" },
                  { id: "localities", label: "Loc" }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setLeaderboardTab(s.id as any)}
                    className={`py-1 rounded text-center transition-all cursor-pointer ${
                      leaderboardTab === s.id ? "bg-[#16A34A] text-white" : "text-[#6B7280] hover:text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Contributor ranks list rows */}
              <div className="space-y-3 pt-1">
                {sortedContributors.map((lbUser, idx) => {
                  const rank = idx + 1;
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center font-bold text-[9px] text-[#6B7280]">
                          {rank}
                        </span>
                        <div className="h-6 w-6 rounded bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center font-black text-[9px]">
                          {lbUser.photoURL ? (
                            <img src={lbUser.photoURL} alt="" className="w-full h-full object-cover" />
                          ) : (
                            lbUser.displayName[0].toUpperCase()
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-white block leading-none truncate max-w-[80px]">{lbUser.displayName}</span>
                          <span className="text-[8px] text-[#6B7280] font-semibold mt-0.5 block">{lbUser.locality?.split(" ")[0] || "Pune"}</span>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] font-black text-emerald-400">
                        {leaderboardTab === "reporters" ? `${lbUser.totalReports} Rep` :
                         leaderboardTab === "volunteers" ? `${lbUser.volunteerHours} Hrs` :
                         `${lbUser.reputation || 120} XP`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Popular Tags Card */}
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-4 shadow-lg space-y-3">
              <span className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider block">Popular Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {["Potholes", "Garbage", "WaterLeakage", "StreetLights", "Waste Management", "Cleanliness", "Volunteering"].map((tag) => (
                  <button 
                    key={tag}
                    onClick={() => setFeedFilter(feedFilter === tag ? "All" : tag)}
                    className={`text-[9px] font-black px-2.5 py-1 rounded-full border transition-all ${
                      feedFilter === tag 
                        ? "bg-[#16A34A] border-[#16A34A] text-white" 
                        : "bg-white/5 border-white/5 text-[#9AA3B8] hover:text-white hover:border-white/10"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Community Stats Widget */}
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-4 shadow-lg space-y-3.5 text-xs text-[#9AA3B8]">
              <span className="text-[10px] font-black text-white uppercase tracking-wider block">Impact Overview</span>
              <div className="space-y-2">
                <div className="flex justify-between font-bold">
                  <span>Total Issues Solved</span>
                  <span className="text-white font-mono">1,842</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Volunteer Hours Logged</span>
                  <span className="text-white font-mono">248 Hrs</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Active Civic Drives</span>
                  <span className="text-[#16A34A] font-mono">4 Active</span>
                </div>
              </div>
            </div>

          </div>

          {/* COLUMN 2: CENTER FEED (Composer, filter bar, cards) */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Quick Composer triggers */}
            {user && (
              <div onClick={() => setIsComposeOpen(true)} className="bg-[#1E293B] border border-white/5 p-4 rounded-2xl flex items-center justify-between shadow-lg cursor-pointer hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center font-bold text-emerald-400 text-xs shrink-0 overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user.displayName ? user.displayName[0].toUpperCase() : "C"
                    )}
                  </div>
                  <span className="text-xs text-[#6B7280] font-semibold">Start a discussion...</span>
                </div>
                <div className="flex items-center gap-2 text-[#9AA3B8]">
                  <Button className="bg-[#16A34A] hover:bg-[#16A34A]/95 text-white font-bold text-[10px] py-1 px-3.5 rounded-lg">
                    Post
                  </Button>
                </div>
              </div>
            )}

            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1E293B] border border-white/5 p-3 rounded-2xl shadow-md text-xs">
              <div className="flex gap-1.5 flex-wrap">
                {["All", "Trending", "Environment", "Infrastructure", "Safety", "Community", "Announcements", "Bookmarked", "My Discussions"].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setFeedFilter(chip)}
                    className={`px-2.5 py-1 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer ${
                      feedFilter === chip 
                        ? "bg-[#16A34A] text-white shadow-md shadow-emerald-500/10" 
                        : "text-[#9AA3B8] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[#6B7280] font-bold">Sort:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#0F172A] border border-white/5 text-[10px] font-black text-white px-2 py-1 rounded-lg focus:outline-none cursor-pointer"
                >
                  <option>Trending</option>
                  <option>Newest</option>
                  <option>Oldest</option>
                  <option>Most Liked</option>
                  <option>Most Commented</option>
                  <option>Most Shared</option>
                </select>
              </div>
            </div>

            {/* Discussions Feed Card List */}
            {discLoading ? (
              <div className="text-center py-12 text-[#9AA3B8] font-bold flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 animate-spin text-[#16A34A]" /> Querying discussions feed...
              </div>
            ) : filteredDiscussions.length === 0 ? (
              <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-12 text-center text-xs text-[#9AA3B8] font-bold space-y-4">
                <ShieldAlert className="w-8 h-8 text-[#9AA3B8] mx-auto opacity-30" />
                <p className="text-sm">No active discussions found in this category.</p>
                <Button onClick={() => setIsComposeOpen(true)} className="bg-[#16A34A] text-white font-bold text-xs py-1 px-4 rounded-xl">
                  Create Discussion
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDiscussions.map((post) => {
                  const isPostLiked = post.likedBy.includes(user?.uid || "");
                  const isPostDisliked = post.dislikedBy.includes(user?.uid || "");
                  const isBookmarked = post.bookmarkedBy?.includes(user?.uid || "") || false;
                  const showComments = expandedComments[post.id] || false;

                  return (
                    <div key={post.id} className="bg-[#1E293B] border border-white/5 rounded-2xl p-5 shadow-lg space-y-4 relative overflow-hidden transition-all hover:border-white/10 group">
                      
                      {post.isPinned && (
                        <div className="absolute top-2.5 right-4 flex items-center gap-1 text-[8px] font-black text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full uppercase">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </div>
                      )}

                      {/* Card Header Profile block */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/15 overflow-hidden">
                            {post.authorAvatar ? (
                              <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              post.authorName[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white block leading-none">{post.authorName}</span>
                              {post.likes > 80 && <CheckCircle className="w-3 h-3 text-emerald-400 fill-emerald-400/10" />}
                              <span className="text-[8px] bg-emerald-500/15 text-[#16A34A] px-1 rounded font-bold">Lvl 4</span>
                            </div>
                            <span className="text-[9px] text-[#6B7280] font-bold mt-0.5 block uppercase tracking-wider">
                              Pune resident · Verified
                            </span>
                          </div>
                        </div>

                        {/* Top action triggers */}
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => handleBookmark(post.id)}
                            className={`p-1.5 hover:bg-white/5 rounded-lg transition-colors ${
                              isBookmarked ? "text-yellow-400" : "text-[#6B7280]"
                            }`}
                            title="Bookmark"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleReportPost(post.id)}
                            className="p-1.5 hover:bg-white/5 rounded-lg text-[#6B7280] hover:text-red-400 transition-colors"
                            title="Report post"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Edit form */}
                      {editingPostId === post.id ? (
                        <div className="space-y-3.5 p-3.5 bg-black/10 rounded-xl">
                          <input 
                            type="text" 
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full bg-[#0F172A] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                          <textarea 
                            value={editContent}
                            rows={3}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full bg-[#0F172A] border border-white/10 rounded-lg p-2.5 text-xs text-white resize-none"
                          />
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => {
                                updateDoc(doc(db, "discussions", post.id), { title: editTitle, content: editContent });
                                setEditingPostId(null);
                              }}
                              className="bg-[#16A34A] text-white text-[10px] py-1 px-3"
                            >
                              Save
                            </Button>
                            <Button 
                              onClick={() => setEditingPostId(null)}
                              className="bg-white/5 text-white text-[10px] py-1 px-3"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Content block */
                        <div className="space-y-2 text-left">
                          <h3 className="text-sm font-bold text-white leading-tight">{post.title}</h3>
                          <p className="text-xs text-[#9AA3B8] leading-relaxed font-medium">{post.content}</p>
                          
                          {post.imageUrl && (
                            <div className="aspect-video bg-black/40 rounded-xl overflow-hidden mt-3 border border-white/5">
                              <img src={post.imageUrl} alt="Discussion evidence" className="w-full h-full object-cover group-hover:scale-101 transition-transform" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.tags.map((tag) => (
                          <span key={tag} className="text-[9px] bg-white/5 border border-white/5 text-[#9AA3B8] px-2.5 py-0.5 rounded-full font-bold">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Card actions bottom bar */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[#9AA3B8] text-xs">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => handleLike(post.id)} 
                            className={`flex items-center gap-1 font-bold transition-colors ${
                              isPostLiked ? "text-emerald-400" : "hover:text-emerald-400"
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" /> {post.likes}
                          </button>
                          
                          <button 
                            onClick={() => handleDislike(post.id)} 
                            className={`flex items-center gap-1 font-bold transition-colors ${
                              isPostDisliked ? "text-red-400" : "hover:text-red-400"
                            }`}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" /> {post.dislikes}
                          </button>

                          <button 
                            onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !showComments }))}
                            className="flex items-center gap-1 font-bold hover:text-white transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-[#6B7280]" /> {post.replies.length} comments
                          </button>

                          <button 
                            onClick={() => handleShare(post.id)}
                            className="flex items-center gap-1 font-bold hover:text-white transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" /> {post.shares || 0} shares
                          </button>
                        </div>

                        {/* Direct action triggers depending on tags */}
                        <div className="flex items-center gap-2">
                          {post.tags.some(t => t.toLowerCase().includes("volunteer") || t.toLowerCase().includes("drive")) ? (
                            <Button 
                              onClick={() => handleJoinDrive(post.title)}
                              className="bg-emerald-600/10 hover:bg-emerald-600/20 text-[#16A34A] font-bold text-[10px] py-1 px-3 rounded-lg border border-emerald-500/20"
                            >
                              Join Drive
                            </Button>
                          ) : post.tags.some(t => t.toLowerCase().includes("poll")) ? (
                            <Button 
                              onClick={() => handleVotePoll(post.id)}
                              className="bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 font-bold text-[10px] py-1 px-3 rounded-lg border border-purple-500/20"
                            >
                              Vote Poll
                            </Button>
                          ) : null}

                          {/* Owner / Staff Controls */}
                          {(post.authorId === user?.uid || isModeratorOrAdmin) && (
                            <div className="flex gap-1.5 ml-2 border-l border-white/5 pl-2">
                              {post.authorId === user?.uid && (
                                <button 
                                  onClick={() => {
                                    setEditingPostId(post.id);
                                    setEditTitle(post.title);
                                    setEditContent(post.content);
                                  }} 
                                  className="p-1 text-[#9AA3B8] hover:text-white"
                                  title="Edit post"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button onClick={() => handleTogglePin(post.id, !!post.isPinned)} className="p-1 hover:bg-white/5 rounded text-yellow-400" title="Pin discussion">
                                <Pin className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeletePost(post.id)} className="p-1 hover:bg-white/5 rounded text-red-400" title="Delete post">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Extended replies/nested chain list */}
                      {showComments && (
                        <div className="pt-3 border-t border-white/5 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-[#6B7280] uppercase tracking-wider block">Replies &amp; Discussion</span>
                            <button 
                              onClick={() => setCollapsedReplies(prev => ({ ...prev, [post.id]: !collapsedReplies[post.id] }))}
                              className="text-[9px] font-bold text-purple-400 hover:underline"
                            >
                              {collapsedReplies[post.id] ? "Expand Comments" : "Collapse Comments"}
                            </button>
                          </div>
                          
                          {!collapsedReplies[post.id] && (
                            <>
                              {post.replies.length > 0 ? (
                                <div className="space-y-3">
                                  {renderReplyChain(post.replies, post.id)}
                                </div>
                              ) : (
                                <span className="text-[10px] text-[#6B7280] font-bold block py-1">No comments posted yet. Start the discussion below!</span>
                              )}

                              {/* Write inline comment */}
                              {user && (
                                <div className="flex gap-2 border-t border-white/5 pt-3">
                                  <input
                                    type="text"
                                    placeholder="Add to this discussion..."
                                    value={replyInputs[post.id] || ""}
                                    onChange={(e) => setReplyInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                                    className="flex-1 bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#16A34A]"
                                  />
                                  <Button onClick={() => handleAddReply(post.id)} className="px-3 bg-white/5 border border-white/10 text-white hover:bg-white/10">
                                    <Send className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* COLUMN 3: RIGHT SIDEBAR (Events, Trending tags, Activity Logs) */}
          <div className="lg:col-span-3 space-y-6 text-left col-span-1 md:col-span-4 lg:block">
            
            {/* Upcoming Events Card */}
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-4 shadow-lg space-y-3.5">
              <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
                <span className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#16A34A]" /> Upcoming Events
                </span>
                <span className="text-[9px] text-[#6B7280] font-bold uppercase">RSVP</span>
              </div>

              <div className="space-y-3 text-xs">
                {sidebarEvents.map((evt) => {
                  const registered = evt.registeredVolunteerIds || [];
                  const isJoined = registered.includes(user?.uid || "");
                  return (
                    <div key={evt.id} className="p-3 bg-black/10 rounded-xl space-y-2.5 border border-white/5">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-white block truncate max-w-[130px]">{evt.title}</span>
                          <span className="text-[8px] text-[#6B7280] font-semibold mt-0.5 block">{evt.locationName}</span>
                        </div>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                          evt.type === "volunteer" ? "bg-purple-500/10 text-purple-400 border border-purple-500/25" : "bg-blue-500/10 text-blue-400 border border-blue-500/25"
                        }`}>
                          {evt.type || "volunteer"}
                        </span>
                      </div>
                      
                      {/* Interactive triggers */}
                      <div className="flex justify-between items-center pt-1 border-t border-white/5">
                        <span className="text-[9px] font-black text-[#6B7280]">
                          {(evt.volunteerCount || 0)} registered
                        </span>
                        <button 
                          onClick={() => handleJoinEvent(evt.id, evt.type === "volunteer")}
                          className={`text-[9px] font-black uppercase py-1 px-3.5 rounded-lg border transition-all ${
                            isJoined 
                              ? "bg-red-500/10 text-red-400 border-red-500/25" 
                              : "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/25 hover:bg-[#16A34A]/20"
                          }`}
                        >
                          {isJoined ? "Leave" : "Join"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trending Topics Widget */}
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-4 shadow-lg space-y-3.5">
              <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
                <span className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Trending Topics
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {trendingTags.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setFeedFilter(item.name)}
                    className="flex justify-between items-center bg-black/10 p-2.5 rounded-xl border border-white/5 cursor-pointer hover:border-white/10 transition-colors"
                  >
                    <div>
                      <span className="font-bold text-white block">#{item.name}</span>
                      <span className="text-[8px] text-[#6B7280] font-semibold block mt-0.5">{item.count} active discussions</span>
                    </div>
                    <div className="w-12 h-6 shrink-0">
                      <svg viewBox="0 0 50 20" className="w-full h-full">
                        <polyline 
                          fill="none" 
                          stroke="#16A34A" 
                          strokeWidth="1.5" 
                          points="0,15 12,5 24,10 36,3 48,12"
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Activity Feed widget */}
            <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-4 shadow-lg space-y-3.5">
              <span className="text-[10px] font-black text-white uppercase tracking-wider block">Live Civic Feed</span>
              <div className="space-y-2.5 text-[10px] text-[#9AA3B8] font-bold">
                {activityLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-1.5 leading-snug">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] shrink-0 mt-1" />
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 2: LEADERBOARD (3D PODIUM VIEW) */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeMainTab === "leaderboard" && (
        <div className="space-y-6 text-left">
          
          {/* Controls filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1E293B] border border-white/5 p-4 rounded-2xl shadow-md">
            <div className="flex gap-1.5 flex-wrap">
              {[
                { id: "contributors", label: "Top Contributors" },
                { id: "reporters", label: "Top Reporters" },
                { id: "volunteers", label: "Top Volunteers" },
                { id: "localities", label: "Top Localities" }
              ].map((subtab) => (
                <button
                  key={subtab.id}
                  onClick={() => setLeaderboardTab(subtab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    leaderboardTab === subtab.id
                      ? "bg-[#16A34A] text-white shadow-lg"
                      : "text-[#9AA3B8] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {subtab.label}
                </button>
              ))}
            </div>

            <div className="flex bg-white/5 border border-white/5 p-0.5 rounded-xl">
              {[
                { id: "weekly", label: "Weekly" },
                { id: "monthly", label: "Monthly" },
                { id: "all_time", label: "All Time" }
              ].map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setTimeFilter(tf.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    timeFilter === tf.id ? "bg-[#16A34A] text-white" : "text-[#9AA3B8] hover:text-white"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {leaderboardLoading ? (
            <div className="text-center py-12 text-[#9AA3B8] font-bold">Retrieving leaderboards...</div>
          ) : (
            <div className="space-y-6">
              
              {/* 3D-podium for Top 3 */}
              <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto pt-6 items-end select-none">
                
                {/* 2nd Place (Left) */}
                {leaderboardUsers[1] && (
                  <div className="flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full bg-slate-500/10 border-2 border-slate-400 flex items-center justify-center font-bold text-slate-300 text-xs shrink-0 overflow-hidden shadow-lg relative">
                      {leaderboardUsers[1].photoURL ? (
                        <img src={leaderboardUsers[1].photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        leaderboardUsers[1].displayName[0].toUpperCase()
                      )}
                    </div>
                    <span className="text-[10px] font-black text-white block mt-1.5 truncate max-w-[80px]">{leaderboardUsers[1].displayName}</span>
                    <span className="text-[8px] font-bold text-slate-400 block">Lvl 4</span>
                    
                    {/* Visual podium pillar */}
                    <div className="w-full bg-[#1E293B] border border-white/5 h-20 mt-3 rounded-t-xl flex flex-col items-center justify-center shadow-lg relative">
                      <span className="text-slate-400 font-black text-xl">2</span>
                      <span className="text-[8px] font-bold text-[#6B7280] uppercase tracking-widest mt-1">SILVER</span>
                    </div>
                  </div>
                )}

                {/* 1st Place (Center - Golden/Taller) */}
                {leaderboardUsers[0] && (
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-yellow-500/10 border-2 border-yellow-400 flex items-center justify-center font-bold text-yellow-400 text-sm shrink-0 overflow-hidden shadow-lg relative">
                      {leaderboardUsers[0].photoURL ? (
                        <img src={leaderboardUsers[0].photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        leaderboardUsers[0].displayName[0].toUpperCase()
                      )}
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs">👑</span>
                    </div>
                    <span className="text-xs font-black text-white block mt-1.5 truncate max-w-[90px]">{leaderboardUsers[0].displayName}</span>
                    <span className="text-[9px] font-bold text-yellow-400 block">Lvl 5</span>

                    {/* Podium pillar */}
                    <div className="w-full bg-[#1E293B] border border-white/10 h-28 mt-3 rounded-t-xl flex flex-col items-center justify-center shadow-2xl relative">
                      <span className="text-yellow-400 font-black text-2xl">1</span>
                      <span className="text-[8px] font-bold text-[#6B7280] uppercase tracking-widest mt-1">GOLDEN</span>
                    </div>
                  </div>
                )}

                {/* 3rd Place (Right) */}
                {leaderboardUsers[2] && (
                  <div className="flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full bg-amber-700/10 border-2 border-amber-600 flex items-center justify-center font-bold text-amber-500 text-xs shrink-0 overflow-hidden shadow-lg relative">
                      {leaderboardUsers[2].photoURL ? (
                        <img src={leaderboardUsers[2].photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        leaderboardUsers[2].displayName[0].toUpperCase()
                      )}
                    </div>
                    <span className="text-[10px] font-black text-white block mt-1.5 truncate max-w-[80px]">{leaderboardUsers[2].displayName}</span>
                    <span className="text-[8px] font-bold text-amber-500 block">Lvl 3</span>

                    {/* Podium pillar */}
                    <div className="w-full bg-[#1E293B] border border-white/5 h-16 mt-3 rounded-t-xl flex flex-col items-center justify-center shadow-lg relative">
                      <span className="text-amber-500 font-black text-lg">3</span>
                      <span className="text-[8px] font-bold text-[#6B7280] uppercase tracking-widest mt-1">BRONZE</span>
                    </div>
                  </div>
                )}

              </div>

              {/* Leaderboard Table Grid for Rank 4+ */}
              <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-4 shadow-lg space-y-3">
                <span className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider block">Remaining Leaderboard Candidates</span>
                <div className="space-y-2">
                  {leaderboardUsers.slice(3).map((lbUser, idx) => {
                    const rank = idx + 4;
                    const score = leaderboardTab === "reporters" ? `${lbUser.totalReports} Reports` :
                                  leaderboardTab === "volunteers" ? `${lbUser.volunteerHours} Hours` :
                                  leaderboardTab === "localities" ? `${lbUser.locality}` :
                                  `${lbUser.reputation || 120} XP`;

                    return (
                      <div key={idx} className="flex items-center justify-between bg-black/10 p-3 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-[#6B7280]">
                            {rank}
                          </span>
                          <div className="h-7 w-7 rounded bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                            {lbUser.photoURL ? (
                              <img src={lbUser.photoURL} alt="" className="w-full h-full object-cover" />
                            ) : (
                              lbUser.displayName[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">{lbUser.displayName}</span>
                            <span className="text-[9px] text-[#6B7280] font-bold block mt-0.5">{lbUser.locality}</span>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-black text-white">{score}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 3: ACTIVE CHALLENGES */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeMainTab === "challenges" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {challenges.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="bg-[#1E293B] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg text-left">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white leading-tight block">{c.title}</span>
                      <span className="text-[9px] text-[#6B7280] font-bold mt-0.5 block">{c.difficulty} Difficulty</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-[#6B7280] flex items-center gap-1 uppercase tracking-wider shrink-0 mt-0.5">
                    <Clock className="w-3 h-3" /> {c.timeLeft}
                  </span>
                </div>

                <p className="text-xs text-[#9AA3B8] leading-relaxed font-medium">{c.desc}</p>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-[#6B7280]">
                    <span>Completion Rate</span>
                    <span className="text-white">{c.progress}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5 relative">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${c.progress}%` }} />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-white/5 text-xs">
                  <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 leading-none">
                    <Zap className="w-3 h-3 text-purple-400" /> +{c.xpReward} XP
                  </span>
                  <button 
                    onClick={() => handleJoinDrive(c.title)}
                    className="text-[10px] font-bold text-[#16A34A] hover:text-[#16A34A]/80 flex items-center gap-0.5 cursor-pointer"
                  >
                    Join challenge <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* BOTTOM METADATA WIDGETS */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-4 text-xs">
        {/* Popular Tags List */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[#6B7280] font-bold">Popular Tags:</span>
          {["#Potholes", "#Garbage", "#Drainage", "#StreetLight", "#WaterLeakage"].map((tag) => (
            <span key={tag} className="text-[#9AA3B8] font-bold hover:text-white cursor-pointer">
              {tag}
            </span>
          ))}
          <button className="text-[#16A34A] font-black flex items-center gap-0.5 hover:underline">
            View all tags <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Online Activity Counter */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {[
              "https://api.dicebear.com/7.x/bottts/svg?seed=Vikram",
              "https://api.dicebear.com/7.x/bottts/svg?seed=Neha",
              "https://api.dicebear.com/7.x/bottts/svg?seed=Rahul"
            ].map((avatar, i) => (
              <div key={i} className="h-5 w-5 rounded-full bg-slate-800 border border-slate-900 overflow-hidden shrink-0">
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <span className="text-[10px] text-[#9AA3B8] font-black">+128 Online Now</span>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* MODAL: COMPOSE POST */}
      {/* ──────────────────────────────────────────────────────── */}
      {isComposeOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-white/10 w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4 text-left relative animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setIsComposeOpen(false)}
              className="absolute top-4 right-4 text-[#9AA3B8] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#16A34A]" />
              <h3 className="text-base font-black text-white">Start a Discussion</h3>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3.5 text-xs text-[#9AA3B8]">
              <div className="space-y-1">
                <label className="font-bold text-[#6B7280] uppercase tracking-wider block">Thread Title</label>
                <input
                  type="text"
                  placeholder="Ask a question or share a thought..."
                  value={newTitle}
                  required
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#16A34A]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#6B7280] uppercase tracking-wider block">Details</label>
                <textarea
                  placeholder="Share context, questions, or ideas..."
                  value={newContent}
                  required
                  rows={4}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-[#16A34A] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-[#6B7280] uppercase tracking-wider block">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#16A34A] cursor-pointer"
                  >
                    <option>Environment</option>
                    <option>Infrastructure</option>
                    <option>Safety</option>
                    <option>Community</option>
                    <option>Announcements</option>
                    <option>Events</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#6B7280] uppercase tracking-wider block">Tags</label>
                  <input
                    type="text"
                    placeholder="Potholes, Sanitation"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#16A34A]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#6B7280] uppercase tracking-wider block">Image Link</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#16A34A]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button 
                  type="button" 
                  onClick={() => setIsComposeOpen(false)}
                  className="flex-1 bg-white/5 border border-white/10 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={creatingPost} 
                  className="flex-1 bg-[#16A34A] hover:bg-[#16A34A]/90 font-bold"
                >
                  {creatingPost ? "Publishing..." : "Publish Post"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) for post creation */}
      <button 
        onClick={() => setIsComposeOpen(true)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white flex items-center justify-center shadow-2xl hover:scale-105 transition-all z-40 cursor-pointer border border-[#16A34A]/30"
        title="Start discussion"
      >
        <Plus className="w-6 h-6" />
      </button>

    </div>
  );
};

export default CommunityPage;
