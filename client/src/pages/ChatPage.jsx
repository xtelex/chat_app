import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Settings,
  LogOut,
  Plus,
  Search,
  Paperclip,
  Mic,
  X,
  Smartphone,
  MessageSquare,
  Phone,
  PhoneOff,
  PhoneCall,
  PhoneIncoming,
  Users,
  Lock,
  UserPlus,
  Loader2,
  Check,
  ArrowLeft,
  Send,
  Pencil,
  Star,
  BookUser,
  Video,
  VideoOff,
  MicOff,
  Smile,
  Bell,
  Palette,
  HardDrive,
  Info,
  UserCog,
  ShieldCheck,
  Archive,
  EyeOff,
  MessageCircle,
  PhoneCall as PhoneCallIcon,
  Sticker
} from "lucide-react";

import { isSupabaseConfigured, supabase } from "../services/supabaseClient.js";
import { getAllStickers } from "../data/stickers.js";

// Helper function to format message preview text
function formatMessagePreview(message, senderName = null) {
  // Handle call_missed type
  if (message.media_type === "call_missed") {
    return "📵 Missed call";
  }
  
  // Handle media types
  if (message.media_type === "image") return "📷 Image";
  if (message.media_type === "video") return "🎥 Video";
  if (message.media_type === "audio") return "🎤 Voice message";
  
  // Handle sticker messages
  if (message.media_type === "sticker" || message.text?.startsWith("[sticker:")) {
    return senderName ? `${senderName} sent a sticker` : "Sent a sticker";
  }
  
  // Regular text message
  return message.text || "";
}

// Component to display sticker messages with proper URL handling
function StickerMessage({ message, supabase, getCustomStickerUrl }) {
  const [stickerUrl, setStickerUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStickerUrl = async () => {
      const pathOrUrl = message.text?.match(/\[sticker:(.*?)\]/)?.[1] || message.text;
      
      // Check if it's a local sticker (starts with /stickers/)
      if (pathOrUrl.startsWith('/stickers/')) {
        setStickerUrl(pathOrUrl);
        setLoading(false);
        return;
      }
      
      // Check if it's already a full URL (old messages)
      if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
        setStickerUrl(pathOrUrl);
        setLoading(false);
        return;
      }
      
      // It's a storage path, get signed URL
      if (supabase && getCustomStickerUrl) {
        const signedUrl = await getCustomStickerUrl(pathOrUrl);
        setStickerUrl(signedUrl);
      }
      setLoading(false);
    };

    loadStickerUrl();
  }, [message.text, supabase, getCustomStickerUrl]);

  if (loading) {
    return (
      <div className="bg-transparent w-32 h-32 flex items-center justify-center">
        <div className="animate-pulse text-4xl">🎨</div>
      </div>
    );
  }

  return (
    <div className="bg-transparent">
      <img 
        src={stickerUrl}
        alt="Sticker"
        className="w-32 h-32 object-contain cursor-pointer hover:scale-110 transition-transform"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = '<div class="text-4xl">🖼️</div>';
        }}
      />
    </div>
  );
}

export default function ChatPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const lastContactAddedToMeAtRef = useRef(0);
  const lastOutgoingDecisionAtRef = useRef(0);
  const lastIncomingRequestAtRef = useRef(0);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  // Fetch with a short timeout so localhost calls fail fast on mobile
  const fetchWithTimeout = (url, options = {}, ms = 3000) => {
    const timeoutController = new AbortController();
    const id = setTimeout(() => timeoutController.abort(), ms);
    // If caller passes their own signal, abort on either
    const signal = options.signal
      ? (() => {
          const combined = new AbortController();
          options.signal.addEventListener("abort", () => combined.abort());
          timeoutController.signal.addEventListener("abort", () => combined.abort());
          return combined.signal;
        })()
      : timeoutController.signal;
    return fetch(url, { ...options, signal }).finally(() => clearTimeout(id));
  };
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  // Notifications: { id, type, text, avatar, created_at, read }
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [currentSection, setCurrentSection] = useState("chats");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [addedContacts, setAddedContacts] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [pendingActionByUserId, setPendingActionByUserId] = useState({});
  const [dmMessages, setDmMessages] = useState([]);
  const [dmLoading, setDmLoading] = useState(false);
  const [dmError, setDmError] = useState(null);
  const [dmMediaUrls, setDmMediaUrls] = useState({});
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [showNicknameEditor, setShowNicknameEditor] = useState(false);
  // Profile panel
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const dmFileInputRef = useRef(null);
  const recordingRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const messagesEndRef = useRef(null); // for auto-scroll to bottom
  const [typingUsers, setTypingUsers] = useState({}); // { userId: timestamp }
  const typingTimeoutRef = useRef(null);
  const typingChannelRef = useRef(null);

  // Unread message tracking: { [contactId]: count }
  const [unreadCounts, setUnreadCounts] = useState({});
  // Last message preview per contact: { [contactId]: { text, created_at } }
  const [lastMessages, setLastMessages] = useState({});
  // Call history loaded from DB
  const [callHistory, setCallHistory] = useState([]);
  const [callHistoryLoading, setCallHistoryLoading] = useState(false);

  // Privacy & Settings state
  const [blockedIds, setBlockedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("blocked_contacts") || "[]")); } catch { return new Set(); }
  });
  // IDs of people who have blocked me (loaded from DB)
  const [blockedByIds, setBlockedByIds] = useState(new Set());
  const [mutedIds, setMutedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("muted_contacts") || "[]")); } catch { return new Set(); }
  });
  const [archivedIds, setArchivedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("archived_contacts") || "[]")); } catch { return new Set(); }
  });
  const [hideStatus, setHideStatus] = useState(() => localStorage.getItem("hide_status") === "true");
  const [notifPermission, setNotifPermission] = useState(() => typeof Notification !== "undefined" ? Notification.permission : "default");
  const [theme, setTheme] = useState(() => localStorage.getItem("app_theme") || "dark");
  const [showAbout, setShowAbout] = useState(false);
  const [cacheSize, setCacheSize] = useState(null);
  // Display name editing
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState("");

  // Emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);

  // Sticker picker
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const stickerPickerRef = useRef(null);
  const customStickerInputRef = useRef(null);
  const [customStickers, setCustomStickers] = useState([]);
  const [uploadingSticker, setUploadingSticker] = useState(false);
  const [customStickerUrls, setCustomStickerUrls] = useState({}); // { stickerId: signedUrl }

  // Message reactions: { [messageId]: { [emoji]: [userId, ...] } }
  const [reactions, setReactions] = useState({});
  // Which message has its reaction picker open
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState(null);
  const reactionPickerRef = useRef(null);

  // Active status tracking
  const [activeUserIds, setActiveUserIds] = useState(new Set());
  const presenceChannelRef = useRef(null);

  // Favourites
  const [favouriteIds, setFavouriteIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("fav_contacts") || "[]")); }
    catch { return new Set(); }
  });

  // Sidebar tab
  const [sidebarTab, setSidebarTab] = useState("active");

  // Call state
  const [callState, setCallState] = useState(null); // null | { contact, status: 'calling'|'incoming'|'active', isMuted, isVideoOff }
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const callChannelRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callStateRef = useRef(null); // mirror of callState for use inside closures
  const callStartTimeRef = useRef(null); // when call became active
  const [callDuration, setCallDuration] = useState(0); // seconds, for live timer
  const callTimerRef = useRef(null);

  // Enrich call_missed and call_ended messages with contact info
  const enrichCallMessages = (messages, contactId) =>
    messages.map((m) => {
      if (m.media_type === "call_missed" && !m._missedContact) {
        const contact = addedContacts.find((c) => c.id === contactId) ||
          (selectedChat?.id === contactId ? selectedChat : null) ||
          { id: contactId, name: "Unknown", avatar_url: "" };
        return { ...m, _missedContact: contact };
      }
      if (m.media_type === "call_ended" && !m._callContact) {
        const contact = addedContacts.find((c) => c.id === contactId) ||
          (selectedChat?.id === contactId ? selectedChat : null) ||
          { id: contactId, name: "Unknown", avatar_url: "" };
        return { ...m, _callContact: contact };
      }
      return m;
    });

  const markPendingAction = (userId, action) => {
    if (!userId) return;
    setPendingActionByUserId((prev) => ({ ...prev, [userId]: action }));
  };

  const clearPendingAction = (userId) => {
    if (!userId) return;
    setPendingActionByUserId((prev) => {
      if (!prev[userId]) return prev;
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  const dmTargetId = selectedChat?.id || null;

  const dmDisplayName = useMemo(() => {
    if (!selectedChat) return "";
    return selectedChat.nickname || selectedChat.name || "Chat";
  }, [selectedChat]);

  const currentUserAvatarUrl = useMemo(() => {
    const meta = user?.user_metadata || {};
    return (
      meta.avatar_url ||
      meta.picture ||
      meta.avatarUrl ||
      meta.photoURL ||
      ""
    );
  }, [user]);

  const resolveMediaUrl = async (mediaPath) => {
    if (!supabase) return null;
    if (!mediaPath) return null;
    if (dmMediaUrls[mediaPath]) return dmMediaUrls[mediaPath];

    const { data, error } = await supabase.storage
      .from("chat-media")
      .createSignedUrl(mediaPath, 60 * 60);

    if (error || !data?.signedUrl) return null;

    setDmMediaUrls((prev) => ({ ...prev, [mediaPath]: data.signedUrl }));
    return data.signedUrl;
  };

  useEffect(() => {
    if (demoMode) {
      setSession(null);
      setUser({ email: "demo@local" });
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;
    let sessionLoaded = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const nextSession = data.session ?? null;
      sessionLoaded = true;
      if (!nextSession) {
        navigate("/login", { replace: true });
        setLoading(false);
        return;
      }
      setSession(nextSession);
      // Merge profile data (display_name, avatar_url) from profiles table into user
      setUser(nextSession.user);
      setLoading(false);
      // Load fresh profile data from DB to get latest display_name and avatar_url
      if (supabase && nextSession.user?.id) {
        supabase.from("profiles").select("display_name, avatar_url").eq("id", nextSession.user.id).single()
          .then(({ data: profile }) => {
            if (!profile) return;
            setUser((prev) => prev ? {
              ...prev,
              user_metadata: {
                ...prev.user_metadata,
                full_name: profile.display_name || prev.user_metadata?.full_name,
                avatar_url: profile.avatar_url || prev.user_metadata?.avatar_url,
              }
            } : prev);
          });
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const s = nextSession ?? null;
      setSession(s);
      setUser(s?.user ?? null);
      // Only redirect to login on explicit sign out, not on initial null session
      if (!s && sessionLoaded && _event === "SIGNED_OUT") {
        navigate("/login", { replace: true });
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [demoMode, navigate]);

  useEffect(() => {
    if (demoMode) return;
    if (!session?.access_token) return;
    if (!user?.id) return;

    const controller = new AbortController();
    fetch(`${apiBaseUrl}/api/users/contacts`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      },
      signal: controller.signal
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || `Failed to load contacts (${res.status})`);
        }
        const body = await res.json();
        const contacts = Array.isArray(body.contacts) ? body.contacts : [];
        setAddedContacts(
          contacts.map((c) => ({
            id: c.id,
            name: c.name || "Unknown",
            nickname: c.nickname || null,
            display_name: c.display_name || c.name || "Unknown",
            avatar_url: c.avatar_url || ""
          }))
        );
      })
      .catch(async () => {
        // Fallback: load contacts directly from Supabase (works even if backend is offline).
        if (!supabase) return;

        const { data, error } = await supabase
          .from("contacts")
          .select(
            "contact_id, nickname, contact:profiles!contacts_contact_id_fkey(display_name, avatar_url)"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error || !Array.isArray(data)) return;

        setAddedContacts(
          data
            .map((row) => ({
              id: row.contact_id,
              name: row.nickname || row.contact?.display_name || "Unknown",
              nickname: row.nickname || null,
              display_name: row.contact?.display_name || "Unknown",
              avatar_url: row.contact?.avatar_url || ""
            }))
            .filter((row) => Boolean(row.id))
        );
      });

    return () => controller.abort();
  }, [apiBaseUrl, demoMode, session?.access_token, user?.id]);

  // Load custom stickers on mount
  useEffect(() => {
    if (user?.id) {
      loadCustomStickers();
    }
  }, [user?.id]);

  // Load last message per contact for preview + compute unread counts from DB
  useEffect(() => {
    if (!supabase || !user?.id) return;

    // Read last-seen timestamps from localStorage
    let lastSeen = {};
    try { lastSeen = JSON.parse(localStorage.getItem(`last_seen_${user.id}`) || "{}"); } catch {}

    supabase
      .from("direct_messages")
      .select("id, sender_id, recipient_id, text, media_type, created_at")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(300)
      .then(({ data }) => {
        if (!Array.isArray(data)) return;
        const previewMap = {};
        const unreadMap = {};

        for (const msg of data) {
          const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;

          // Build preview from latest message per contact
          if (!previewMap[otherId]) {
            const preview = formatMessagePreview(msg);
            previewMap[otherId] = { text: preview, created_at: msg.created_at };
          }

          // Count unread: messages sent TO me, newer than last time I opened that chat
          if (msg.recipient_id === user.id) {
            const seenAt = lastSeen[otherId] || 0;
            const msgTime = new Date(msg.created_at).getTime();
            if (msgTime > seenAt && !mutedIds.has(otherId)) {
              unreadMap[otherId] = (unreadMap[otherId] || 0) + 1;
            }
          }
        }

        setLastMessages(previewMap);
        setUnreadCounts(unreadMap);
      });
  }, [user?.id]);

  useEffect(() => {
    if (demoMode) return;
    if (!session?.access_token) return;
    if (!user?.id) return;

    const controller = new AbortController();

    fetch(`${apiBaseUrl}/api/users/contact-requests?status=pending`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      },
      signal: controller.signal
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || `Failed to load requests (${res.status})`);
        }
        return res.json();
      })
      .then((body) => {
        const requests = Array.isArray(body.requests) ? body.requests : [];
        const incoming = requests
          .filter((r) => r.status === "pending" && r.recipient_id === user.id)
          .map((r) => ({
            requester_id: r.requester_id,
            recipient_id: r.recipient_id,
            status: r.status,
            created_at: r.created_at,
            requester: r.requester || null
          }));
        const outgoing = requests
          .filter((r) => r.status === "pending" && r.requester_id === user.id)
          .map((r) => ({
            requester_id: r.requester_id,
            recipient_id: r.recipient_id,
            status: r.status,
            created_at: r.created_at,
            recipient: r.recipient || null
          }));

        setIncomingRequests(incoming);
        setOutgoingRequests(outgoing);
      })
      .catch(async (err) => {
        if (controller.signal.aborted) return;
        if (!supabase) return;

        const rawMessage = String(err?.message || "");
        if (!/failed to fetch|networkerror/i.test(rawMessage)) return;

        const { data, error } = await supabase
          .from("contact_requests")
          .select(
            "requester_id, recipient_id, status, created_at, requester:profiles!contact_requests_requester_id_fkey(id, display_name, avatar_url), recipient:profiles!contact_requests_recipient_id_fkey(id, display_name, avatar_url)"
          )
          .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(50);

        if (error || !Array.isArray(data)) return;

        const incoming = data
          .filter((r) => r.recipient_id === user.id)
          .map((r) => ({
            requester_id: r.requester_id,
            recipient_id: r.recipient_id,
            status: r.status,
            created_at: r.created_at,
            requester: r.requester
              ? {
                  id: r.requester_id,
                  name: r.requester.display_name || "Unknown",
                  avatar_url: r.requester.avatar_url || ""
                }
              : null
          }));

        const outgoing = data
          .filter((r) => r.requester_id === user.id)
          .map((r) => ({
            requester_id: r.requester_id,
            recipient_id: r.recipient_id,
            status: r.status,
            created_at: r.created_at,
            recipient: r.recipient
              ? {
                  id: r.recipient_id,
                  name: r.recipient.display_name || "Unknown",
                  avatar_url: r.recipient.avatar_url || ""
                }
              : null
          }));

        setIncomingRequests(incoming);
        setOutgoingRequests(outgoing);
      });

    return () => controller.abort();
  }, [apiBaseUrl, demoMode, session?.access_token, user?.id]);

  const getUserInitials = (userEmail) => {
    if (!userEmail) return "U";
    const parts = userEmail.split("@")[0].toUpperCase();
    return parts.substring(0, 2);
  };

  const getNameInitials = (name) => {
    if (!name) return "U";
    const cleaned = String(name).trim();
    if (!cleaned) return "U";
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("File selected:", file.name, file.type);
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    console.log("Sending message:", messageText);
    setMessageText("");
  };

  const handleOpenDm = (contact) => {
    if (!contact?.id) return;
    setSelectedChat(contact);
    setCurrentSection("chats");
    setShowNicknameEditor(false);
    setNicknameDraft(contact.nickname || "");
  };

  const handleCloseDm = () => {
    setSelectedChat(null);
    setDmMessages([]);
    setDmError(null);
    setDmLoading(false);
    setShowNicknameEditor(false);
    setNicknameDraft("");
    setShowProfilePanel(false);
  };

  const markMessagesAsReadForContact = async (contactId) => {
    if (!contactId || !user?.id) return;
    if (demoMode) return;

    console.log('[Read Receipts] Marking messages as read for contact:', contactId);
    console.log('[Read Receipts] User ID:', user?.id);
    console.log('[Read Receipts] Session token exists:', !!session?.access_token);
    console.log('[Read Receipts] Supabase exists:', !!supabase);

    // Try backend first
    if (session?.access_token) {
      try {
        console.log('[Read Receipts] Calling backend API...');
        const res = await fetch(`${apiBaseUrl}/api/dm/${encodeURIComponent(contactId)}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const data = await res.json();
        console.log('[Read Receipts] Backend response status:', res.status);
        console.log('[Read Receipts] Backend response:', data);
        
        if (res.ok) {
          console.log('[Read Receipts] ✅ Backend marked', data.markedCount, 'messages as read');
          return;
        } else {
          console.error('[Read Receipts] ❌ Backend failed:', data);
        }
      } catch (err) {
        console.error('[Read Receipts] ❌ Backend error:', err.message);
        // Fall through to Supabase
      }
    }

    // Fallback to direct Supabase update
    if (supabase) {
      console.log('[Read Receipts] Trying direct Supabase update...');
      const { data, error } = await supabase
        .from("direct_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("sender_id", contactId)
        .eq("recipient_id", user.id)
        .is("read_at", null)
        .select("id");
      
      if (error) {
        console.error('[Read Receipts] ❌ Supabase error:', error);
      } else {
        console.log('[Read Receipts] ✅ Supabase marked', data?.length || 0, 'messages as read');
        console.log('[Read Receipts] Updated message IDs:', data?.map(m => m.id));
      }
    } else {
      console.error('[Read Receipts] ❌ No Supabase client available');
    }
  };

  const loadDirectMessages = async (contactId) => {
    if (!contactId) return;
    if (demoMode) return;
    if (!user?.id) return;

    setDmLoading(true);
    setDmError(null);

    let backendFailure = null;

    // Try backend first (nice-to-have). If it's offline, fall back to Supabase.
    if (session?.access_token) {
      try {
        const res = await fetch(`${apiBaseUrl}/api/dm/${encodeURIComponent(contactId)}?limit=80`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });

        if (res.ok) {
          const body = await res.json().catch(() => ({}));
          const messages = Array.isArray(body.messages) ? body.messages : [];
          setDmMessages(enrichCallMessages(messages, contactId));
          setDmError(null);
          setDmLoading(false);
          return;
        }

        const body = await res.json().catch(() => ({}));
        backendFailure = new Error(body.message || `Failed to load messages (${res.status})`);
      } catch (err) {
        backendFailure = err;
      }
    }

    if (!supabase) {
      setDmError(
        backendFailure
          ? String(backendFailure?.message || backendFailure)
          : "Supabase is not configured."
      );
      setDmLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("id, created_at, sender_id, recipient_id, text, media_path, media_type, media_mime, delivered_at, read_at")
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${contactId}),and(sender_id.eq.${contactId},recipient_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true })
        .limit(200);

      if (!error && Array.isArray(data)) {
        setDmMessages(enrichCallMessages(data, contactId));
        setDmError(null);
        setDmLoading(false);
        // Mark messages as read after loading
        markMessagesAsReadForContact(contactId);
        return;
      }

      const msg = String(error?.message || "");
      if (/could not find the table|schema cache|does not exist/i.test(msg)) {
        setDmError(
          [
            "Direct messages table is missing (or PostgREST schema cache is stale).",
            "",
            "In Supabase Dashboard -> SQL Editor run:",
            "1) Run `supabase/migrations/20260326180000_direct_messages_and_nicknames.sql`",
            "2) Then run: select pg_notify('pgrst', 'reload schema');",
            "3) Wait ~10 seconds and refresh this page."
          ].join("\n")
        );
      } else {
        setDmError(msg || "Failed to load messages.");
      }
    } catch (err) {
      setDmError(String(err?.message || backendFailure?.message || "Failed to load messages."));
    } finally {
      setDmLoading(false);
    }
  };

  const handleSendDirectText = async () => {
    if (!dmTargetId) return;
    if (blockedIds.has(dmTargetId) || blockedByIds.has(dmTargetId)) return;
    const trimmed = messageText.trim();
    if (!trimmed) return;
    if (demoMode || !user?.id) return;

    const optimistic = {
      id: `local-${Date.now()}`,
      created_at: new Date().toISOString(),
      sender_id: user.id,
      recipient_id: dmTargetId,
      text: trimmed,
      media_path: null,
      media_type: null,
      media_mime: null
    };

    setMessageText("");
    setDmMessages((prev) => [...prev, optimistic]);

    try {
      let backendError = null;

      if (session?.access_token) {
        try {
          const res = await fetch(`${apiBaseUrl}/api/dm/${encodeURIComponent(dmTargetId)}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ text: trimmed })
          });

          if (res.ok) {
            const body = await res.json().catch(() => ({}));
            const saved = body?.message;
            if (saved?.id) {
              setDmMessages((prev) => prev.map((m) => (m.id === optimistic.id ? saved : m)));
            }
            return;
          }

          const body = await res.json().catch(() => ({}));
          backendError = new Error(body.message || `Failed to send message (${res.status})`);
        } catch (err) {
          backendError = err;
        }
      }

      if (supabase) {
        const { data, error } = await supabase
          .from("direct_messages")
          .insert({ sender_id: user.id, recipient_id: dmTargetId, text: trimmed })
          .select("id, created_at, sender_id, recipient_id, text, media_path, media_type, media_mime")
          .single();

        if (!error && data?.id) {
          setDmMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data : m)));
          return;
        }

        if (error) throw new Error(error.message);
      } else if (backendError) {
        throw backendError;
      }
    } catch (err) {
      setDmMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      toast.error(String(err?.message || "Failed to send message"));
    }
  };

  const handleSendDirectMedia = async (file, overrideType) => {
    if (!dmTargetId) return;
    if (blockedIds.has(dmTargetId) || blockedByIds.has(dmTargetId)) return;
    if (!file) return;
    if (demoMode || !user?.id) return;
    if (!supabase) {
      toast.error("Supabase is not configured.");
      return;
    }

    const inferredType = overrideType
      ? overrideType
      : file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : file.type.startsWith("audio/")
            ? "audio"
            : null;

    if (!inferredType) {
      toast.error("Unsupported file type.");
      return;
    }

    const ext = (file.name?.split(".").pop() || inferredType).toLowerCase();
    const safeExt = ext.length > 8 ? inferredType : ext;
    const path = `dm/${user.id}/${dmTargetId}/${crypto.randomUUID()}.${safeExt}`;

    markPendingAction(dmTargetId, "media");
    try {
      const { error: uploadError } = await supabase.storage.from("chat-media").upload(path, file, {
        contentType: file.type || undefined,
        upsert: false
      });

      if (uploadError) throw new Error(uploadError.message);

      const optimistic = {
        id: `local-${Date.now()}`,
        created_at: new Date().toISOString(),
        sender_id: user.id,
        recipient_id: dmTargetId,
        text: null,
        media_path: path,
        media_type: inferredType,
        media_mime: file.type || null
      };

      setDmMessages((prev) => [...prev, optimistic]);

      const { data, error } = await supabase
        .from("direct_messages")
        .insert({
          sender_id: user.id,
          recipient_id: dmTargetId,
          media_path: path,
          media_type: inferredType,
          media_mime: file.type || null
        })
        .select("id, created_at, sender_id, recipient_id, text, media_path, media_type, media_mime")
        .single();

      if (error) throw new Error(error.message);
      if (data?.id) {
        setDmMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data : m)));
      }
    } catch (err) {
      toast.error(String(err?.message || "Failed to send media"));
    } finally {
      clearPendingAction(dmTargetId);
    }
  };

  const handleSendSticker = async (stickerPathOrUrl) => {
    if (!dmTargetId) return;
    if (blockedIds.has(dmTargetId) || blockedByIds.has(dmTargetId)) return;
    if (demoMode || !user?.id) return;

    // Determine if this is a storage path or a local URL
    // Local stickers start with /stickers/, custom stickers are storage paths
    const isLocalSticker = stickerPathOrUrl.startsWith('/stickers/');
    const stickerIdentifier = isLocalSticker ? stickerPathOrUrl : stickerPathOrUrl;

    const optimistic = {
      id: `local-${Date.now()}`,
      created_at: new Date().toISOString(),
      sender_id: user.id,
      recipient_id: dmTargetId,
      text: `[sticker:${stickerIdentifier}]`,
      media_path: null,
      media_type: "sticker",
      media_mime: null
    };

    setShowStickerPicker(false);
    setDmMessages((prev) => [...prev, optimistic]);

    try {
      let backendError = null;

      if (session?.access_token) {
        try {
          const res = await fetch(`${apiBaseUrl}/api/dm/${encodeURIComponent(dmTargetId)}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ text: `[sticker:${stickerIdentifier}]` })
          });

          if (res.ok) {
            const body = await res.json().catch(() => ({}));
            const saved = body?.message;
            if (saved?.id) {
              setDmMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...saved, media_type: "sticker" } : m)));
            }
            return;
          }

          const body = await res.json().catch(() => ({}));
          backendError = new Error(body.message || `Failed to send sticker (${res.status})`);
        } catch (err) {
          backendError = err;
        }
      }

      if (supabase) {
        const { data, error } = await supabase
          .from("direct_messages")
          .insert({ sender_id: user.id, recipient_id: dmTargetId, text: `[sticker:${stickerIdentifier}]` })
          .select("id, created_at, sender_id, recipient_id, text, media_path, media_type, media_mime")
          .single();

        if (!error && data?.id) {
          setDmMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...data, media_type: "sticker" } : m)));
          return;
        }

        if (error) throw new Error(error.message);
      } else if (backendError) {
        throw backendError;
      }
    } catch (err) {
      setDmMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      toast.error(String(err?.message || "Failed to send sticker"));
    }
  };

  // Load custom stickers from database
  const loadCustomStickers = async () => {
    if (!supabase || !user?.id) return;
    
    const { data, error } = await supabase
      .from("user_stickers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (!error && Array.isArray(data)) {
      setCustomStickers(data);
      
      // Load signed URLs for each sticker
      const urls = {};
      for (const sticker of data) {
        const signedUrl = await getCustomStickerUrl(sticker.storage_path);
        if (signedUrl) {
          urls[sticker.id] = signedUrl;
        }
      }
      setCustomStickerUrls(urls);
    }
  };

  // Upload custom sticker
  const handleUploadCustomSticker = async (file) => {
    if (!file) return;
    if (!supabase || !user?.id) {
      toast.error("Supabase is not configured.");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.");
      return;
    }

    setUploadingSticker(true);
    try {
      // Upload to Supabase Storage
      const ext = file.name.split(".").pop() || "png";
      const path = `user-stickers/${user.id}/${crypto.randomUUID()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from("chat-media")
        .upload(path, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) throw new Error(uploadError.message);

      // Save to database
      const { data, error: dbError } = await supabase
        .from("user_stickers")
        .insert({
          user_id: user.id,
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          storage_path: path,
          emoji_fallback: "🎨"
        })
        .select()
        .single();

      if (dbError) throw new Error(dbError.message);

      // Add to local state
      setCustomStickers((prev) => [data, ...prev]);
      
      // Get signed URL for the new sticker
      const signedUrl = await getCustomStickerUrl(path);
      if (signedUrl) {
        setCustomStickerUrls((prev) => ({ ...prev, [data.id]: signedUrl }));
      }
      
      toast.success("Sticker added!");
    } catch (err) {
      toast.error(String(err?.message || "Failed to upload sticker"));
    } finally {
      setUploadingSticker(false);
    }
  };

  // Delete custom sticker
  const handleDeleteCustomSticker = async (stickerId, storagePath) => {
    if (!supabase || !user?.id) return;

    try {
      // Delete from storage
      await supabase.storage.from("chat-media").remove([storagePath]);

      // Delete from database
      const { error } = await supabase
        .from("user_stickers")
        .delete()
        .eq("id", stickerId)
        .eq("user_id", user.id);

      if (error) throw new Error(error.message);

      // Remove from local state
      setCustomStickers((prev) => prev.filter((s) => s.id !== stickerId));
      setCustomStickerUrls((prev) => {
        const newUrls = { ...prev };
        delete newUrls[stickerId];
        return newUrls;
      });
      toast.success("Sticker deleted");
    } catch (err) {
      toast.error(String(err?.message || "Failed to delete sticker"));
    }
  };

  // Get signed URL for custom sticker
  const getCustomStickerUrl = async (storagePath) => {
    if (!supabase) return null;
    
    const { data, error } = await supabase.storage
      .from("chat-media")
      .createSignedUrl(storagePath, 60 * 60 * 24); // 24 hours

    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  };

  const handleToggleRecording = async () => {
    if (recording) {
      try {
        recordingRef.current?.stop?.();
      } catch {
        // ignore
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recordingRef.current = recorder;
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        setRecording(false);
        stream.getTracks().forEach((t) => t.stop());
        recordingStreamRef.current = null;

        const blob = new Blob(chunks, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        await handleSendDirectMedia(file, "audio");
      };

      setRecording(true);
      recorder.start();
    } catch (err) {
      setRecording(false);
      toast.error("Microphone permission denied.");
    }
  };

  const handleSaveNickname = async () => {    if (!dmTargetId) return;
    if (demoMode || !user?.id) return;

    const nickname = nicknameDraft.trim();
    const nextNickname = nickname ? nickname : null;

    // Optimistic update
    setAddedContacts((prev) =>
      prev.map((c) => (c.id === dmTargetId ? { ...c, nickname: nextNickname, name: nextNickname || c.display_name || c.name } : c))
    );
    setSelectedChat((prev) => (prev ? { ...prev, nickname: nextNickname, name: nextNickname || prev.display_name || prev.name } : prev));
    setShowNicknameEditor(false);

    try {
      let backendError = null;

      if (session?.access_token) {
        try {
          const res = await fetch(`${apiBaseUrl}/api/users/contacts/nickname`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ contactId: dmTargetId, nickname: nextNickname })
          });

          if (res.ok) {
            toast.success("Nickname saved");
            return;
          }

          const body = await res.json().catch(() => ({}));
          backendError = new Error(body.message || `Failed to save nickname (${res.status})`);
        } catch (err) {
          backendError = err;
        }
      }

      if (supabase) {
        const { error } = await supabase
          .from("contacts")
          .update({ nickname: nextNickname })
          .eq("user_id", user.id)
          .eq("contact_id", dmTargetId);

        if (!error) {
          toast.success("Nickname saved");
          return;
        }

        throw new Error(error.message);
      } else if (backendError) {
        throw backendError;
      }
    } catch (err) {
      toast.error(String(err?.message || "Failed to save nickname"));
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // ── Emoji picker close on outside click ──────────────────────────────────────
  useEffect(() => {
    if (!showEmojiPicker && !showStickerPicker && !reactionPickerMsgId && !showNotifications) return;
    const handler = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
      if (stickerPickerRef.current && !stickerPickerRef.current.contains(e.target)) {
        setShowStickerPicker(false);
      }
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(e.target)) {
        setReactionPickerMsgId(null);
      }
      // Close notifications if clicking outside
      if (showNotifications && !e.target.closest("[data-notif-panel]")) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmojiPicker, showStickerPicker, reactionPickerMsgId, showNotifications]);

  // ── Message reactions ────────────────────────────────────────────────────────
  const handleReact = async (messageId, emoji) => {
    if (!user?.id || !messageId) return;

    const isLocal = messageId.startsWith("local-") || messageId.startsWith("missed-");
    const existing = reactions[messageId]?.[emoji] || [];
    const alreadyReacted = existing.includes(user.id);

    // Optimistic update
    setReactions((prev) => {
      const msgReactions = { ...(prev[messageId] || {}) };
      const users = msgReactions[emoji] ? [...msgReactions[emoji]] : [];
      const idx = users.indexOf(user.id);
      if (idx >= 0) users.splice(idx, 1);
      else users.push(user.id);
      if (users.length === 0) delete msgReactions[emoji];
      else msgReactions[emoji] = users;
      return { ...prev, [messageId]: msgReactions };
    });
    setReactionPickerMsgId(null);

    if (!supabase || isLocal) return;

    // Broadcast to other user immediately (works even without DB table)
    const broadcastCh = supabase.channel(`reaction_broadcast:${[user.id, dmTargetId].sort().join("_")}`);
    broadcastCh.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await broadcastCh.send({
          type: "broadcast",
          event: "reaction",
          payload: { messageId, emoji, userId: user.id, action: alreadyReacted ? "remove" : "add" }
        }).catch(() => {});
        supabase.removeChannel(broadcastCh);
      }
    });

    // Persist to DB
    try {
      if (alreadyReacted) {
        await supabase.from("message_reactions").delete()
          .eq("message_id", messageId).eq("user_id", user.id).eq("emoji", emoji);
      } else {
        await supabase.from("message_reactions").upsert(
          { message_id: messageId, user_id: user.id, emoji },
          { onConflict: "message_id,user_id,emoji" }
        );
      }
    } catch {
      // Table may not exist yet — broadcast already sent so other user still sees it live
    }
  };

  // Load reactions for current conversation messages
  useEffect(() => {
    if (!supabase || !dmTargetId || !user?.id) return;
    // Get all message IDs in current conversation first, then load their reactions
    supabase
      .from("message_reactions")
      .select("message_id, user_id, emoji")
      .then(({ data, error }) => {
        if (error || !Array.isArray(data)) return; // table may not exist yet
        const map = {};
        for (const row of data) {
          if (!map[row.message_id]) map[row.message_id] = {};
          if (!map[row.message_id][row.emoji]) map[row.message_id][row.emoji] = [];
          if (!map[row.message_id][row.emoji].includes(row.user_id)) {
            map[row.message_id][row.emoji].push(row.user_id);
          }
        }
        setReactions(map);
      });
  }, [dmTargetId, user?.id]);

  // Listen for broadcast reactions (works even without DB table)
  useEffect(() => {
    if (!supabase || !user?.id || !dmTargetId) return;
    const channelName = `reaction_broadcast:${[user.id, dmTargetId].sort().join("_")}`;
    const channel = supabase.channel(channelName)
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        if (!payload?.messageId || !payload?.userId || !payload?.emoji) return;
        if (payload.userId === user.id) return; // already applied optimistically
        setReactions((prev) => {
          const msgReactions = { ...(prev[payload.messageId] || {}) };
          const users = msgReactions[payload.emoji] ? [...msgReactions[payload.emoji]] : [];
          if (payload.action === "remove") {
            const filtered = users.filter((u) => u !== payload.userId);
            if (filtered.length === 0) delete msgReactions[payload.emoji];
            else msgReactions[payload.emoji] = filtered;
          } else {
            if (!users.includes(payload.userId)) users.push(payload.userId);
            msgReactions[payload.emoji] = users;
          }
          return { ...prev, [payload.messageId]: msgReactions };
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [dmTargetId, user?.id]);

  // Realtime reactions sync via postgres_changes (when table exists)
  useEffect(() => {
    if (!supabase || !user?.id) return;
    const channel = supabase
      .channel(`reactions_db:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "message_reactions" }, ({ new: row }) => {
        if (!row?.message_id || row.user_id === user.id) return; // skip own (already optimistic)
        setReactions((prev) => {
          const msg = { ...(prev[row.message_id] || {}) };
          const users = msg[row.emoji] ? [...msg[row.emoji]] : [];
          if (!users.includes(row.user_id)) users.push(row.user_id);
          return { ...prev, [row.message_id]: { ...msg, [row.emoji]: users } };
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "message_reactions" }, ({ old: row }) => {
        if (!row?.message_id || row.user_id === user.id) return;
        setReactions((prev) => {
          const msg = { ...(prev[row.message_id] || {}) };
          const users = (msg[row.emoji] || []).filter((u) => u !== row.user_id);
          if (users.length === 0) delete msg[row.emoji];
          else msg[row.emoji] = users;
          return { ...prev, [row.message_id]: msg };
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  // ── Favourites ──────────────────────────────────────────────────────────────
  const toggleFavourite = (contactId) => {
    setFavouriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) next.delete(contactId);
      else next.add(contactId);
      try { localStorage.setItem("fav_contacts", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  // ── Privacy & Settings helpers ───────────────────────────────────────────────
  const toggleBlock = (contactId) => {
    setBlockedIds((prev) => {
      const next = new Set(prev);
      const isBlocking = !next.has(contactId);
      if (isBlocking) next.add(contactId); else next.delete(contactId);
      try { localStorage.setItem("blocked_contacts", JSON.stringify([...next])); } catch {}
      if (supabase && user?.id) {
        if (isBlocking) {
          supabase.from("blocks").upsert({ blocker_id: user.id, blocked_id: contactId }, { onConflict: "blocker_id,blocked_id" }).then(() => {}).catch?.(() => {});
        } else {
          supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", contactId).then(() => {}).catch?.(() => {});
        }
      }
      return next;
    });
  };

  // Sync blockedIds from DB on mount to fix stale localStorage
  useEffect(() => {
    if (!supabase || !user?.id) return;
    supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id)
      .then(({ data, error }) => {
        if (error || !Array.isArray(data)) return;
        const dbIds = new Set(data.map((r) => r.blocked_id));
        setBlockedIds(dbIds);
        try { localStorage.setItem("blocked_contacts", JSON.stringify([...dbIds])); } catch {}
      }).catch(() => {});
  }, [user?.id]);

  // Load who has blocked me + realtime updates
  useEffect(() => {
    if (!supabase || !user?.id) return;
    // Initial load
    supabase.from("blocks").select("blocker_id").eq("blocked_id", user.id)
      .then(({ data, error }) => {
        if (error) return; // table may not exist yet — default to empty (no one blocked me)
        if (Array.isArray(data)) setBlockedByIds(new Set(data.map((r) => r.blocker_id)));
      });
    // Realtime: someone blocks or unblocks me
    const channel = supabase.channel(`blocks:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "blocks", filter: `blocked_id=eq.${user.id}` }, ({ new: row }) => {
        if (row?.blocker_id) setBlockedByIds((prev) => new Set([...prev, row.blocker_id]));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "blocks", filter: `blocked_id=eq.${user.id}` }, ({ old: row }) => {
        if (row?.blocker_id) setBlockedByIds((prev) => { const n = new Set(prev); n.delete(row.blocker_id); return n; });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const deleteConversation = async (contactId) => {
    if (!supabase || !user?.id || !contactId) return;
    try {
      await supabase.from("direct_messages")
        .delete()
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${contactId}),and(sender_id.eq.${contactId},recipient_id.eq.${user.id})`);
      setDmMessages([]);
      toast.success("Conversation deleted.");
    } catch { toast.error("Failed to delete conversation."); }
  };

  const toggleContactMute = (contactId) => {    setMutedIds((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) next.delete(contactId); else next.add(contactId);
      try { localStorage.setItem("muted_contacts", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const toggleArchive = (contactId) => {
    setArchivedIds((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) next.delete(contactId); else next.add(contactId);
      try { localStorage.setItem("archived_contacts", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const toggleHideStatus = () => {
    setHideStatus((prev) => {
      const next = !prev;
      localStorage.setItem("hide_status", String(next));
      // Stop/start presence tracking based on status visibility
      if (next && presenceChannelRef.current) {
        // Hide: untrack presence
        presenceChannelRef.current.untrack?.().catch?.(() => {});
      } else if (!next && presenceChannelRef.current) {
        // Show: re-track presence
        presenceChannelRef.current.track?.({ online_at: new Date().toISOString() }).catch?.(() => {});
      }
      toast.success(next ? "Status hidden from contacts" : "Status now visible");
      return next;
    });
  };

  const requestNotifications = async () => {
    if (typeof Notification === "undefined") { toast.error("Notifications not supported in this browser."); return; }
    if (Notification.permission === "granted") {
      toast.info("Notifications already enabled.");
      setNotifPermission("granted");
      return;
    }
    if (Notification.permission === "denied") {
      toast.error("Notifications blocked. Enable them in your browser settings.");
      return;
    }
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    if (result === "granted") {
      toast.success("Notifications enabled.");
      new Notification("My Chat App", { body: "You'll now receive notifications for new messages and calls.", icon: "/favicon.svg" });
    } else {
      toast.error("Notification permission denied.");
    }
  };

  const applyTheme = (t) => {
    setTheme(t);
    localStorage.setItem("app_theme", t);
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = t === "dark" || (t === "auto" && prefersDark);
    root.setAttribute("data-theme", isDark ? "dark" : "light");
    root.classList.toggle("dark", isDark);
    root.classList.toggle("light", !isDark);
    // Apply background color directly so it's visible immediately
    document.body.style.background = isDark ? "" : "#f8fafc";
    toast.success(`Theme set to ${t}`);
  };

  const estimateCacheSize = async () => {
    if (navigator.storage?.estimate) {
      const { usage } = await navigator.storage.estimate();
      setCacheSize(usage ? `${(usage / 1024 / 1024).toFixed(1)} MB` : "< 1 MB");
    } else {
      setCacheSize("Unknown");
    }
  };

  const clearCache = () => {
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("last_seen_") || k === "fav_contacts" || k === "blocked_contacts" || k === "muted_contacts" || k === "archived_contacts");
      keys.forEach((k) => localStorage.removeItem(k));
      setDmMediaUrls({});
      setCacheSize("0 MB");
      toast.success("Cache cleared.");
    } catch { toast.error("Failed to clear cache."); }
  };

  const handleSaveDisplayName = async () => {
    const name = displayNameDraft.trim();
    if (!name) { toast.error("Display name can't be empty."); return; }
    if (!supabase || !user?.id) return;
    try {
      // Update auth metadata
      await supabase.auth.updateUser({ data: { full_name: name } });
      // Update profiles table
      await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);
      // Update local user state
      setUser((prev) => prev ? { ...prev, user_metadata: { ...prev.user_metadata, full_name: name } } : prev);
      setEditingDisplayName(false);
      toast.success("Display name updated.");
    } catch (err) { toast.error(err?.message || "Failed to update display name."); }
  };

  // ── Import device contacts ───────────────────────────────────────────────────
  const handleImportDeviceContacts = async () => {    if (!("contacts" in navigator && "ContactsManager" in window)) {
      toast.info("Your browser doesn't support the Contacts Picker API. Try Chrome on Android.");
      return;
    }
    try {
      const contacts = await navigator.contacts.select(["name", "email"], { multiple: true });
      if (!contacts || contacts.length === 0) return;
      const emails = contacts.flatMap((c) => c.email || []).filter(Boolean);
      if (emails.length === 0) { toast.info("No email addresses found in selected contacts."); return; }
      toast.success(`Found ${emails.length} email(s). Searching for matching users…`);
      if (!session?.access_token) return;
      for (const email of emails.slice(0, 20)) {
        const res = await fetch(`${apiBaseUrl}/api/users/search?q=${encodeURIComponent(email)}`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }).catch(() => null);
        if (!res?.ok) continue;
        const body = await res.json().catch(() => ({}));
        const users = Array.isArray(body.users) ? body.users : [];
        for (const u of users) {
          if (u.id && !addedContacts.some((c) => c.id === u.id)) {
            await handleAddContact({ id: u.id, name: u.name || "Unknown", avatar_url: u.avatar_url || "" });
          }
        }
      }
    } catch (err) {
      if (err?.name !== "AbortError") toast.error("Could not access contacts.");
    }
  };

  // ── Presence / Active Now ────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase || !user?.id) return;
    const channel = supabase.channel("presence:chat", { config: { presence: { key: user.id } } });
    presenceChannelRef.current = channel;
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setActiveUserIds(new Set(Object.keys(state)));
      })
      .on("presence", { event: "join" }, ({ key }) => {
        setActiveUserIds((prev) => new Set([...prev, key]));
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        setActiveUserIds((prev) => { const n = new Set(prev); n.delete(key); return n; });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Only track presence if status is not hidden
          if (!hideStatus) {
            await channel.track({ online_at: new Date().toISOString() });
          }
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  // Apply saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("app_theme") || "dark";
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved === "dark" || (saved === "auto" && prefersDark);
    root.setAttribute("data-theme", isDark ? "dark" : "light");
    root.classList.toggle("dark", isDark);
    root.classList.toggle("light", !isDark);
    document.body.style.background = isDark ? "" : "#f8fafc";
  }, []);

  // Keep callStateRef in sync; start/stop call timer
  useEffect(() => {
    callStateRef.current = callState;
    if (callState?.status === "active") {
      if (!callStartTimeRef.current) callStartTimeRef.current = Date.now();
      if (!callTimerRef.current) {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
        callTimerRef.current = setInterval(() => {
          setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
        }, 1000);
      }
    }
    if (!callState) {
      if (callTimerRef.current) { clearInterval(callTimerRef.current); callTimerRef.current = null; }
      callStartTimeRef.current = null;
      setCallDuration(0);
    }
  }, [callState]);

  // ── WebRTC Calling ───────────────────────────────────────────────────────────

  // Persist a missed-call record for ONE side (the current user's perspective)
  const saveMissedCallToDb = async (callerId, calleeId, contact) => {
    if (!supabase || !user?.id) return null;
    try {
      // Try with call_missed type first (requires migration 20260331100000)
      const { data, error } = await supabase
        .from("direct_messages")
        .insert({ sender_id: callerId, recipient_id: calleeId, media_type: "call_missed", media_mime: callerId === user.id ? "outgoing" : "incoming" })
        .select("id, created_at, sender_id, recipient_id, text, media_path, media_type, media_mime")
        .single();

      if (!error && data?.id) return { ...data, _missedContact: contact };

      // Fallback: store as text if constraint not yet updated
      if (error?.message?.includes("direct_messages_media_type_check") || error?.message?.includes("direct_messages_has_content")) {
        const { data: d2 } = await supabase
          .from("direct_messages")
          .insert({ sender_id: callerId, recipient_id: calleeId, text: callerId === user.id ? `[missed_call_outgoing] ${contact?.name || "They"} didn't answer` : `[missed_call_incoming] You missed a call from ${contact?.name || "them"}` })
          .select("id, created_at, sender_id, recipient_id, text, media_path, media_type, media_mime")
          .single();
        if (d2?.id) return { ...d2, _missedContact: contact };
      }
    } catch { /* non-critical */ }
    return null;
  };

  const injectMissedCallMessage = async (contact, iCalledThem) => {
    if (!contact?.id || !user?.id) return;

    const callerId = iCalledThem ? user.id : contact.id;
    const calleeId = iCalledThem ? contact.id : user.id;

    const localMsg = {
      id: `missed-${Date.now()}`,
      created_at: new Date().toISOString(),
      sender_id: callerId,
      recipient_id: calleeId,
      text: null,
      media_path: null,
      media_type: "call_missed",
      media_mime: iCalledThem ? "outgoing" : "incoming",
      _missedContact: contact,
    };

    // Show immediately in UI
    setDmMessages((prev) => [...prev, localMsg]);

    // Persist to DB
    const saved = await saveMissedCallToDb(callerId, calleeId, contact);
    if (saved?.id) {
      setDmMessages((prev) =>
        prev.map((m) => (m.id === localMsg.id ? saved : m))
      );
    }
  };

  const cleanupCall = (wasMissed = false) => {
    const snapshot = callStateRef.current;
    const wasActive = snapshot?.status === "active";
    // eslint-disable-next-line no-console
    console.log("[cleanupCall] status=", snapshot?.status, "wasActive=", wasActive, "wasMissed=", wasMissed, "startTime=", callStartTimeRef.current);

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    if (callChannelRef.current) {
      if (typeof callChannelRef.current.close === "function") {
        callChannelRef.current.close();
      } else if (supabase) {
        supabase.removeChannel(callChannelRef.current);
      }
      callChannelRef.current = null;
    }
    setCallState(null);

    if (wasActive && snapshot?.contact) {
      const durationSecs = callStartTimeRef.current ? Math.floor((Date.now() - callStartTimeRef.current) / 1000) : 0;
      // eslint-disable-next-line no-console
      console.log("[Call ended] wasActive=true, duration=", durationSecs, "startTime=", callStartTimeRef.current);
      const fmt = durationSecs >= 60
        ? `${Math.floor(durationSecs / 60)} min${Math.floor(durationSecs / 60) > 1 ? "s" : ""}, ${durationSecs % 60} sec`
        : durationSecs > 0 ? `${durationSecs} sec` : "ended";
      const localMsg = {
        id: `call-ended-${Date.now()}`,
        created_at: new Date().toISOString(),
        sender_id: user?.id,
        recipient_id: snapshot.contact.id,
        text: null, media_path: null,
        media_type: "call_ended",
        media_mime: fmt,
        _callContact: snapshot.contact,
      };
      setDmMessages((prev) => [...prev, localMsg]);
      // Persist to DB so it survives navigation
      if (supabase) {
        supabase.from("direct_messages").insert({
          sender_id: user?.id,
          recipient_id: snapshot.contact.id,
          media_type: "call_ended",
          media_mime: fmt,
        }).select("id, created_at, sender_id, recipient_id, text, media_path, media_type, media_mime")
          .single()
          .then(({ data, error }) => {
            if (error) { console.error("[Call ended] DB insert error:", error.message); return; } // eslint-disable-line no-console
            if (data?.id) {
              setDmMessages((prev) => prev.map((m) =>
                m.id === localMsg.id ? { ...data, _callContact: snapshot.contact } : m
              ));
            }
          }).catch?.(() => {});
      }
    } else if (wasMissed && snapshot && !wasActive) {
      const iCalledThem = snapshot.status === "calling";
      const isIncoming = snapshot.status === "incoming";
      if (iCalledThem || isIncoming) {
        injectMissedCallMessage(snapshot.contact, iCalledThem);
      }
    }
  };

  const createPeerConnection = (onIceCandidate) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pc.onicecandidate = (e) => { if (e.candidate) onIceCandidate(e.candidate); };
    return pc;
  };

  // ── DB-only call signaling ───────────────────────────────────────────────────
  const sendSignal = async (toUser, callId, type, payload = {}) => {
    if (!supabase || !user?.id) return;
    const { error } = await supabase.from("call_signals").insert({
      call_id: callId, from_user: user.id, to_user: toUser, type,
      payload: { ...payload, from: user.id, callId }
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[Call] sendSignal error:", type, error.message);
      toast.error(`Call signal failed: ${error.message}`);
    }
  };

  const handleStartCall = async (contact) => {
    if (!supabase || !user?.id || !contact?.id) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      const callId = [user.id, contact.id].sort().join("_") + "_" + Date.now();

      const pc = createPeerConnection(async (candidate) => {
        await sendSignal(contact.id, callId, "ice", { candidate });
      });
      peerConnectionRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      pc.ontrack = (e) => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0]; };

      // Poll DB for answer/ice/decline/hangup from callee
      let callerPollActive = true;
      const callerPoll = async () => {
        if (!callerPollActive) return;
        const { data } = await supabase.from("call_signals").select("*")
          .eq("call_id", callId).eq("to_user", user.id)
          .order("created_at", { ascending: true });
        if (data) {
          for (const row of data) {
            if (row.type === "answer") {
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(row.payload.sdp));
                callStartTimeRef.current = Date.now(); // start timer immediately
                setCallState((p) => p ? { ...p, status: "active" } : p);
              } catch {}
            } else if (row.type === "ice") {
              try { await pc.addIceCandidate(new RTCIceCandidate(row.payload.candidate)); } catch {}
            } else if (row.type === "decline") {
              callerPollActive = false; cleanupCall(true); toast.info(`${contact.name} declined the call.`); return;
            } else if (row.type === "hangup") {
              callerPollActive = false; const s = callStateRef.current; cleanupCall(s?.status === "active" ? false : true); if (s?.status === "active") toast.info("Call ended."); return;
            }
          }
        }
        if (callerPollActive) setTimeout(callerPoll, 2000);
      };
      setTimeout(callerPoll, 2000);
      callChannelRef.current = { close: () => { callerPollActive = false; } };

      // Send offer via DB
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal(contact.id, callId, "offer", {
        sdp: offer,
        callerName: user?.user_metadata?.full_name || user?.email?.split("@")[0],
        callerAvatar: currentUserAvatarUrl
      });

      setCallState({ contact, status: "calling", isMuted: false, isVideoOff: true, _callId: callId });

      // Auto-cancel after 45 seconds if no answer
      setTimeout(() => {
        const snap = callStateRef.current;
        if (snap?.status === "calling" && snap?._callId === callId) {
          // Send hangup signal and cleanup
          sendSignal(contact.id, callId, "hangup", {});
          cleanupCall(true);
        }
      }, 45000);
    } catch (err) {
      toast.error("Could not start call: " + (err?.message || "Permission denied"));
      cleanupCall();
    }
  };

  const handleAnswerCall = async () => {
    if (!callState?.contact || !supabase || !user?.id) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      const callId = callState._callId;
      const callerId = callState.contact.id;

      const pc = createPeerConnection(async (candidate) => {
        await sendSignal(callerId, callId, "ice", { candidate });
      });
      peerConnectionRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      pc.ontrack = (e) => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0]; };

      // Poll DB for ice/hangup from caller
      let calleePollActive = true;
      const calleePoll = async () => {
        if (!calleePollActive) return;
        const { data } = await supabase.from("call_signals").select("*")
          .eq("call_id", callId).eq("to_user", user.id)
          .order("created_at", { ascending: true });
        if (data) {
          for (const row of data) {
            if (row.type === "ice") { try { await pc.addIceCandidate(new RTCIceCandidate(row.payload.candidate)); } catch {} }
            else if (row.type === "hangup") { calleePollActive = false; const s = callStateRef.current; cleanupCall(s?.status === "active" ? false : true); if (s?.status === "active") toast.info("Call ended."); return; }
          }
        }
        if (calleePollActive) setTimeout(calleePoll, 2000);
      };
      setTimeout(calleePoll, 2000);
      callChannelRef.current = { close: () => { calleePollActive = false; } };

      await pc.setRemoteDescription(new RTCSessionDescription(callState._offerSdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendSignal(callerId, callId, "answer", { sdp: answer });
      callStartTimeRef.current = Date.now(); // start timer on callee side too
      setCallState((prev) => prev ? { ...prev, status: "active", isMuted: false } : prev);
    } catch (err) {
      toast.error("Could not answer call: " + (err?.message || "Permission denied"));
      cleanupCall();
    }
  };

  const handleDeclineCall = async () => {
    const snap = callStateRef.current;
    if (snap?.contact?.id && snap?._callId) await sendSignal(snap.contact.id, snap._callId, "decline", {});
    cleanupCall(true);
  };

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setCallState((prev) => prev ? { ...prev, isMuted: !prev.isMuted } : prev);
  };

  const handleHangup = async () => {
    const snap = callStateRef.current;
    const wasActive = snap?.status === "active";
    const wasMissed = !wasActive && (snap?.status === "calling" || snap?.status === "incoming");
    if (snap?.contact?.id && snap?._callId) await sendSignal(snap.contact.id, snap._callId, "hangup", {});
    cleanupCall(wasMissed);
  };

  // Listen for incoming calls — poll every 2 seconds (most reliable approach)
  useEffect(() => {
    if (!supabase || !user?.id) return;
    // Start fresh - only look for calls from now onwards
    let lastChecked = new Date().toISOString();
    let active = true;
    const seenIds = new Set();

    const poll = async () => {
      if (!active) return;
      try {
        const { data, error } = await supabase
          .from("call_signals")
          .select("*")
          .eq("to_user", user.id)
          .eq("type", "offer")
          .gte("created_at", lastChecked)
          .order("created_at", { ascending: true })
          .limit(5);

        if (error) { console.error("[Call poll] error:", error.message); } // eslint-disable-line no-console

        if (data && data.length > 0) {
          for (const row of data) {
            if (seenIds.has(row.id)) continue;
            seenIds.add(row.id);
            lastChecked = row.created_at;
            // Only show if not already in an active/incoming call
            const currentCall = callStateRef.current;
            if (!currentCall || (currentCall.status !== "incoming" && currentCall.status !== "active")) {
              const p = row.payload || {};
              const callerContact = { id: row.from_user, name: p.callerName || "Unknown", avatar_url: p.callerAvatar || "" };
              console.log("[Call poll] incoming call from:", callerContact.name); // eslint-disable-line no-console
              // Mark all rows from this caller as seen to prevent duplicate processing
              data.forEach((r) => { if (r.from_user === row.from_user) seenIds.add(r.id); });
              setCallState({ contact: callerContact, status: "incoming", isMuted: false, isVideoOff: true, _offerSdp: p.sdp, _callId: p.callId });
              if (typeof Notification !== "undefined" && Notification.permission === "granted") {
                new Notification(`📞 Incoming call from ${callerContact.name}`, { body: "Open the app to answer", icon: callerContact.avatar_url || "/src/assets/icon.png" });
              }
              try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const ringInterval = setInterval(() => {
                  if (!callStateRef.current || callStateRef.current.status !== "incoming") { clearInterval(ringInterval); return; }
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  osc.connect(gain); gain.connect(ctx.destination);
                  osc.frequency.value = 440; gain.gain.value = 0.3;
                  osc.start(); osc.stop(ctx.currentTime + 0.3);
                }, 1000);
                setTimeout(() => clearInterval(ringInterval), 45000);
              } catch {}
              toast.info(`📞 Incoming call from ${callerContact.name}`, { duration: 45000 });
              break; // Only process one incoming call at a time
            }
          }
        }
      } catch (e) {
        console.error("[Call poll] exception:", e?.message); // eslint-disable-line no-console
      }
    };
    const interval = setInterval(poll, 2000);
    return () => { active = false; clearInterval(interval); };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!dmTargetId) return;
    loadDirectMessages(dmTargetId);
  }, [dmTargetId]);

  // Realtime: push new DMs (including call_missed) into the conversation live
  useEffect(() => {
    if (!supabase || !user?.id || !dmTargetId) return;
    const channel = supabase
      .channel(`dm_live:${[user.id, dmTargetId].sort().join("_")}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload) => {
          const msg = payload.new;
          if (!msg) return;
          const isRelevant =
            (msg.sender_id === user.id && msg.recipient_id === dmTargetId) ||
            (msg.sender_id === dmTargetId && msg.recipient_id === user.id);
          if (!isRelevant) return;
          setDmMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
            const otherContact = addedContacts.find((c) => c.id === otherId) || selectedChat;
            const enriched = msg.media_type === "call_missed"
              ? { ...msg, _missedContact: otherContact }
              : msg.media_type === "call_ended"
              ? { ...msg, _callContact: otherContact }
              : msg;
            return [...prev, enriched];
          });
          // Auto-mark as read if this is the active chat and message is from the other person
          if (msg.sender_id === dmTargetId && msg.recipient_id === user.id) {
            markMessagesAsReadForContact(dmTargetId);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "direct_messages" },
        (payload) => {
          const msg = payload.new;
          console.log('[Read Receipts] Real-time UPDATE received:', msg);
          if (!msg) return;
          const isRelevant =
            (msg.sender_id === user.id && msg.recipient_id === dmTargetId) ||
            (msg.sender_id === dmTargetId && msg.recipient_id === user.id);
          if (!isRelevant) return;
          console.log('[Read Receipts] Updating message read status:', { id: msg.id, read_at: msg.read_at });
          // Update read status in real-time
          setDmMessages((prev) => 
            prev.map((m) => m.id === msg.id ? { ...m, read_at: msg.read_at, delivered_at: msg.delivered_at } : m)
          );
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dmTargetId, user?.id]);

  // Realtime: track unread counts + last message preview for all contacts
  useEffect(() => {
    if (!supabase || !user?.id) return;
    const channel = supabase
      .channel(`unread:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, (payload) => {
        const msg = payload.new;
        if (!msg || msg.recipient_id !== user.id) return;
        const senderId = msg.sender_id;
        
        // Get sender name for preview
        const sender = addedContacts.find((c) => c.id === senderId);
        const senderName = sender?.name || "Someone";
        
        // Update last message preview
        const preview = formatMessagePreview(msg, senderName);
        setLastMessages((prev) => ({
          ...prev,
          [senderId]: { text: preview, created_at: msg.created_at }
        }));
        // Only increment unread if this chat isn't currently open AND contact isn't muted
        setUnreadCounts((prev) => {
          const currentTarget = dmTargetId;
          if (currentTarget === senderId) return prev;
          if (mutedIds.has(senderId)) return prev; // muted — suppress badge
          return { ...prev, [senderId]: (prev[senderId] || 0) + 1 };
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Load real call history when calls section is opened
  useEffect(() => {
    if (currentSection !== "calls" || !supabase || !user?.id) return;
    setCallHistoryLoading(true);
    supabase
      .from("direct_messages")
      .select("id, sender_id, recipient_id, created_at, media_mime")
      .eq("media_type", "call_missed")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!Array.isArray(data)) { setCallHistoryLoading(false); return; }
        const enriched = data.map((row) => {
          const otherId = row.sender_id === user.id ? row.recipient_id : row.sender_id;
          const contact = addedContacts.find((c) => c.id === otherId) || { id: otherId, name: "Unknown", avatar_url: "" };
          const iOutgoing = row.sender_id === user.id;
          return { ...row, contact, iOutgoing };
        });
        setCallHistory(enriched);
        setCallHistoryLoading(false);
      });
  }, [currentSection, user?.id, addedContacts]);

  // Auto-scroll to bottom when messages load or new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dmMessages]);

  // Typing indicator — subscribe to typing channel when chat opens
  useEffect(() => {
    if (!supabase || !user?.id || !dmTargetId) return;
    const chName = `typing:${[user.id, dmTargetId].sort().join("_")}`;
    const ch = supabase.channel(chName)
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.userId === user.id) return;
        setTypingUsers((prev) => ({ ...prev, [payload.userId]: Date.now() }));
        // Clear after 3 seconds of no typing
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = { ...prev };
            if (next[payload.userId] && Date.now() - next[payload.userId] >= 2800) delete next[payload.userId];
            return next;
          });
        }, 3000);
      })
      .subscribe();
    typingChannelRef.current = ch;
    return () => { supabase.removeChannel(ch); typingChannelRef.current = null; };
  }, [dmTargetId, user?.id]);

  const sendTypingIndicator = () => {
    if (!typingChannelRef.current || !user?.id) return;
    typingChannelRef.current.send({ type: "broadcast", event: "typing", payload: { userId: user.id } });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {}, 2000);
  };

  // Clear unread when opening a chat + save last-seen timestamp + mark messages as read
  useEffect(() => {
    if (!dmTargetId || !user?.id) return;
    
    console.log('[Read Receipts] Chat opened, marking messages as read for:', dmTargetId);
    
    // Clear unread badge
    setUnreadCounts((prev) => {
      if (!prev[dmTargetId]) return prev;
      const next = { ...prev };
      delete next[dmTargetId];
      return next;
    });
    
    // Persist last-seen so unread counts survive page reload
    try {
      const key = `last_seen_${user.id}`;
      const stored = JSON.parse(localStorage.getItem(key) || "{}");
      stored[dmTargetId] = Date.now();
      localStorage.setItem(key, JSON.stringify(stored));
    } catch {}
    
    // Mark messages as read when opening chat
    markMessagesAsReadForContact(dmTargetId);
    
    // Mark messages as read when page becomes visible (user returns to app)
    const handleVisibilityChange = () => {
      if (!document.hidden && dmTargetId) {
        console.log('[Read Receipts] Page became visible, marking messages as read');
        markMessagesAsReadForContact(dmTargetId);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also mark as read on focus (for iOS Safari)
    const handleFocus = () => {
      if (dmTargetId) {
        console.log('[Read Receipts] Window focused, marking messages as read');
        markMessagesAsReadForContact(dmTargetId);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Periodic check to mark messages as read (every 5 seconds while chat is open)
    // This ensures messages get marked even if initial call fails
    const intervalId = setInterval(() => {
      if (!document.hidden && dmTargetId) {
        console.log('[Read Receipts] Periodic check, marking messages as read');
        markMessagesAsReadForContact(dmTargetId);
      }
    }, 5000);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, [dmTargetId, user?.id]);

  useEffect(() => {
    const q = searchQuery.trim();
    setSearchError(null);

    if (!q) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    if (demoMode || !session?.access_token) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError("Sign in to search real users.");
      return;
    }

    const controller = new AbortController();
    const debounce = setTimeout(() => {
      setSearchLoading(true);
      fetchWithTimeout(`${apiBaseUrl}/api/users/search?q=${encodeURIComponent(q)}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        signal: controller.signal
      }, 2000)
        .then(async (res) => {
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message || `Search failed (${res.status})`);
          }
          return res.json();
        })
        .then((body) => {
          const users = Array.isArray(body.users) ? body.users : [];
          setSearchResults(
            users.map((u) => ({
              id: u.id,
              name: u.name || "Unknown",
              avatar_url: u.avatar_url || ""
            }))
          );
        })
        .catch(async (err) => {
          if (controller.signal.aborted) return;
          const rawMessage = String(err?.message || "");

          // Fall back to Supabase on any backend failure (timeout, network error, 401, abort)
          if (supabase) {
            const { data, error } = await supabase
              .from("profiles")
              .select("id, display_name, avatar_url")
              .or(`display_name.ilike.%${q}%`)
              .neq("id", user?.id)
              .limit(15);

            if (!error && Array.isArray(data)) {
              setSearchResults(
                data.map((row) => ({
                  id: row.id,
                  name: row.display_name || "Unknown",
                  avatar_url: row.avatar_url || ""
                }))
              );
              setSearchError(null);
              return;
            }
          }

          setSearchResults([]);
          setSearchError(/failed to fetch|networkerror|abort/i.test(rawMessage) ? null : (rawMessage || "Search failed."));
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearchLoading(false);
        });
    }, 250);

    return () => {
      clearTimeout(debounce);
      controller.abort();
    };
  }, [apiBaseUrl, demoMode, searchQuery, session?.access_token, user?.id]);

  const handleAddContact = async (contact) => {
    if (!contact?.id) return;
    if (addedContacts.find((c) => c.id === contact.id)) return;
    if (outgoingRequests.some((r) => r.recipient_id === contact.id && r.status === "pending")) {
      toast.message("Request already sent");
      return;
    }

    if (demoMode || !session?.access_token) {
      markPendingAction(contact.id, "add");
      setAddedContacts((prev) => [...prev, { ...contact }]);
      window.setTimeout(() => clearPendingAction(contact.id), 550);
      return;
    }

    markPendingAction(contact.id, "add");
    try {
      // Skip backend on mobile (localhost:3001 hangs) — go straight to Supabase
      const isLocalhost = apiBaseUrl.includes("localhost") || apiBaseUrl.includes("127.0.0.1");
      if (!isLocalhost && session?.access_token) {
        const res = await fetchWithTimeout(`${apiBaseUrl}/api/users/contact-requests`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ recipientId: contact.id })
        }, 2000);

        if (res.ok) {
          setOutgoingRequests((prev) => {
            if (prev.some((r) => r.recipient_id === contact.id && r.status === "pending")) return prev;
            return [...prev, { requester_id: user?.id, recipient_id: contact.id, status: "pending", created_at: new Date().toISOString(), recipient: { id: contact.id, name: contact.name, avatar_url: contact.avatar_url || "" } }];
          });
          toast.success("Request sent");
          clearPendingAction(contact.id);
          return;
        }
      }
      // Direct Supabase insert (works on all devices)
      if (supabase && user?.id) {
        const { error } = await supabase.from("contact_requests").insert({
          requester_id: user.id, recipient_id: contact.id, status: "pending"
        });
        if (!error || error.code === "23505") {
          setOutgoingRequests((prev) => {
            if (prev.some((r) => r.recipient_id === contact.id && r.status === "pending")) return prev;
            return [...prev, { requester_id: user.id, recipient_id: contact.id, status: "pending", created_at: new Date().toISOString(), recipient: { id: contact.id, name: contact.name, avatar_url: contact.avatar_url || "" } }];
          });
          setSearchError(null);
          toast.success("Request sent");
        } else {
          const msg = String(error.message || "");
          if (/duplicate key value|contact_requests_pkey/i.test(msg)) { toast.message("Request already sent"); }
          else { toast.error(`Failed: ${msg}`); }
        }
      }
    } catch {
      toast.error("Failed to send request. Please try again.");
    } finally {
      clearPendingAction(contact.id);
    }
  };

  const handleCancelRequest = async (recipientId) => {
    if (!recipientId || !user?.id) return;
    markPendingAction(recipientId, "cancel");
    try {
      // Try backend first
      if (session?.access_token) {
        const res = await fetch(`${apiBaseUrl}/api/users/contact-requests`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ recipientId })
        }).catch(() => null);
        if (res?.ok) {
          setOutgoingRequests((prev) => prev.filter((r) => r.recipient_id !== recipientId));
          toast.success("Request cancelled");
          return;
        }
      }
      // Fallback: delete directly from Supabase
      if (supabase) {
        await supabase.from("contact_requests").delete()
          .eq("requester_id", user.id).eq("recipient_id", recipientId);
        setOutgoingRequests((prev) => prev.filter((r) => r.recipient_id !== recipientId));
        toast.success("Request cancelled");
      }
    } catch { toast.error("Failed to cancel request"); }
    finally { clearPendingAction(recipientId); }
  };

  const handleRespondToRequest = async (requesterId, status) => {    if (!requesterId) return;
    if (!["accepted", "declined"].includes(status)) return;
    if (demoMode || !session?.access_token) return;

    markPendingAction(requesterId, status);
    try {
      const existingRequester =
        incomingRequests.find((r) => r.requester_id === requesterId)?.requester || null;

      const res = await fetch(`${apiBaseUrl}/api/users/contact-requests`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ requesterId, status })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Failed to update request (${res.status})`);
      }

      setIncomingRequests((prev) => prev.filter((r) => r.requester_id !== requesterId));

      if (status === "accepted") {
        if (existingRequester?.id) {
          setAddedContacts((prev) => {
            if (prev.some((c) => c.id === existingRequester.id)) return prev;
            return [
              {
                id: existingRequester.id,
                name: existingRequester.name || "Unknown",
                display_name: existingRequester.name || "Unknown",
                nickname: null,
                avatar_url: existingRequester.avatar_url || ""
              },
              ...prev
            ];
          });
        }

        toast.success("Say hi to your new friend!");
      } else {
        toast.success("Request declined");
      }
      return;
    } catch (err) {
      const rawMessage = String(err?.message || "");
      if (/failed to fetch|networkerror/i.test(rawMessage) && supabase && user?.id) {
        const { error } = await supabase
          .from("contact_requests")
          .update({ status })
          .eq("requester_id", requesterId)
          .eq("recipient_id", user.id);

        if (!error) {
          setIncomingRequests((prev) => prev.filter((r) => r.requester_id !== requesterId));

          if (status === "accepted") {
            const existingRequester =
              incomingRequests.find((r) => r.requester_id === requesterId)?.requester || null;
            if (existingRequester?.id) {
              setAddedContacts((prev) => {
                if (prev.some((c) => c.id === existingRequester.id)) return prev;
                return [
                  {
                    id: existingRequester.id,
                    name: existingRequester.name || "Unknown",
                    display_name: existingRequester.name || "Unknown",
                    nickname: null,
                    avatar_url: existingRequester.avatar_url || ""
                  },
                  ...prev
                ];
              });
            }

            toast.success("Say hi to your new friend!");
          } else {
            toast.success("Request declined");
          }
          return;
        }

        toast.error(error.message || "Failed to update request");
        return;
      }

      toast.error(rawMessage || "Failed to update request");
    } finally {
      clearPendingAction(requesterId);
    }
  };

  useEffect(() => {
    if (demoMode) return;
    if (!supabase) return;
    if (!user?.id) return;

    const channel = supabase
      .channel(`contact_added:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "contacts",
          filter: `contact_id=eq.${user.id}`
        },
        async (payload) => {
          const adderId = payload?.new?.user_id;
          const createdAt = payload?.new?.created_at;
          if (createdAt) {
            const ts = Date.parse(createdAt);
            if (Number.isFinite(ts)) {
              lastContactAddedToMeAtRef.current = Math.max(lastContactAddedToMeAtRef.current, ts);
            }
          }
          if (!adderId) {
            toast.message("Someone added you");
            return;
          }

          const { data } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", adderId)
            .single();

          const name = data?.display_name || "Someone";
          toast.success(`${name} added you`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [demoMode, user?.id]);

  useEffect(() => {
    if (demoMode) return;
    if (!supabase) return;
    if (!user?.id) return;

    const channel = supabase
      .channel(`contact_requests:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "contact_requests",
          filter: `recipient_id=eq.${user.id}`
        },
        async (payload) => {
          const requesterId = payload?.new?.requester_id;
          const createdAt = payload?.new?.created_at;
          if (createdAt) {
            const ts = Date.parse(createdAt);
            if (Number.isFinite(ts)) {
              lastIncomingRequestAtRef.current = Math.max(lastIncomingRequestAtRef.current, ts);
            }
          }
          if (!requesterId) return;
          if (payload?.new?.status !== "pending") return;

          const { data } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", requesterId)
            .single();

          const requester = {
            id: requesterId,
            name: data?.display_name || "Someone",
            avatar_url: data?.avatar_url || ""
          };

          setIncomingRequests((prev) => {
            if (prev.some((r) => r.requester_id === requesterId && r.status === "pending")) return prev;
            return [
              {
                requester_id: requesterId,
                recipient_id: user.id,
                status: "pending",
                created_at: payload?.new?.created_at || new Date().toISOString(),
                requester
              },
              ...prev
            ];
          });

          toast.message(`${requester.name} sent you a contact request`);
          setNotifications((prev) => [{
            id: `req-${requesterId}-${Date.now()}`,
            type: "contact_request",
            text: `${requester.name} sent you a contact request`,
            avatar: requester.avatar_url || "",
            name: requester.name,
            requesterId,
            created_at: new Date().toISOString(),
            read: false
          }, ...prev.slice(0, 49)]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "contact_requests",
          filter: `requester_id=eq.${user.id}`
        },
        async (payload) => {
          const nextStatus = payload?.new?.status;
          const prevStatus = payload?.old?.status;
          if (!nextStatus || nextStatus === prevStatus) return;

          if (nextStatus === "accepted" || nextStatus === "declined") {
            const recipientId = payload?.new?.recipient_id;
            const updatedAt = payload?.new?.updated_at;
            if (updatedAt) {
              const ts = Date.parse(updatedAt);
              if (Number.isFinite(ts)) {
                lastOutgoingDecisionAtRef.current = Math.max(lastOutgoingDecisionAtRef.current, ts);
              }
            }
            setOutgoingRequests((prev) =>
              prev.filter((r) => r.recipient_id !== recipientId || r.status !== "pending")
            );

            if (recipientId) {
              const { data } = await supabase
                .from("profiles")
                .select("display_name")
                .eq("id", recipientId)
                .single();
              const name = data?.display_name || "Someone";
              const notifText = nextStatus === "accepted" ? `${name} accepted your request` : `${name} declined your request`;
              toast.success(notifText);
              setNotifications((prev) => [{
                id: `resp-${recipientId}-${Date.now()}`,
                type: nextStatus === "accepted" ? "request_accepted" : "request_declined",
                text: notifText,
                avatar: "",
                name,
                created_at: new Date().toISOString(),
                read: false
              }, ...prev.slice(0, 49)]);
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "contact_requests",
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          const nextStatus = payload?.new?.status;
          const prevStatus = payload?.old?.status;
          if (!nextStatus || nextStatus === prevStatus) return;
          const requesterId = payload?.new?.requester_id;
          if (!requesterId) return;
          if (nextStatus !== "pending") {
            setIncomingRequests((prev) => prev.filter((r) => r.requester_id !== requesterId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [demoMode, user?.id]);

  useEffect(() => {
    if (demoMode) return;
    if (!supabase) return;
    if (!user?.id) return;

    const channel = supabase
      .channel(`contacts_for_user:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "contacts",
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const contactId = payload?.new?.contact_id;
          if (!contactId) return;

          const { data } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", contactId)
            .single();

          const nextContact = {
            id: contactId,
            name: data?.display_name || "Unknown",
            display_name: data?.display_name || "Unknown",
            nickname: null,
            avatar_url: data?.avatar_url || ""
          };

          setAddedContacts((prev) => {
            if (prev.some((c) => c.id === contactId)) return prev;
            return [nextContact, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [demoMode, user?.id]);

  useEffect(() => {
    if (demoMode) return;
    if (!supabase) return;
    if (!user?.id) return;

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;

      // 1) "Someone added you" notification (contacts where you are the contact)
      const { data: contactsToMe, error: contactsError } = await supabase
        .from("contacts")
        .select("user_id, created_at")
        .eq("contact_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!contactsError && Array.isArray(contactsToMe) && contactsToMe.length > 0) {
        const newest = Date.parse(contactsToMe[0].created_at);
        if (Number.isFinite(newest) && lastContactAddedToMeAtRef.current === 0) {
          lastContactAddedToMeAtRef.current = newest;
        }

        const since = lastContactAddedToMeAtRef.current || 0;
        const newRows = contactsToMe
          .filter((row) => {
            const ts = Date.parse(row.created_at);
            return Number.isFinite(ts) && ts > since;
          })
          .slice()
          .reverse();

        if (newRows.length > 0) {
          const adderIds = Array.from(new Set(newRows.map((r) => r.user_id).filter(Boolean)));
          const { data: adders } = await supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", adderIds);

          const nameById = new Map(
            Array.isArray(adders) ? adders.map((p) => [p.id, p.display_name || "Someone"]) : []
          );

          for (const row of newRows) {
            const name = nameById.get(row.user_id) || "Someone";
            toast.success(`${name} added you`);
            const ts = Date.parse(row.created_at);
            if (Number.isFinite(ts)) {
              lastContactAddedToMeAtRef.current = Math.max(lastContactAddedToMeAtRef.current, ts);
            }
          }
        }
      }

      // 2) "Your request was accepted/declined" notification (outgoing decisions)
      const { data: decided, error: decidedError } = await supabase
        .from("contact_requests")
        .select("recipient_id, status, updated_at")
        .eq("requester_id", user.id)
        .in("status", ["accepted", "declined"])
        .order("updated_at", { ascending: false })
        .limit(10);

      if (!decidedError && Array.isArray(decided) && decided.length > 0) {
        const newest = Date.parse(decided[0].updated_at);
        if (Number.isFinite(newest) && lastOutgoingDecisionAtRef.current === 0) {
          lastOutgoingDecisionAtRef.current = newest;
        }

        const since = lastOutgoingDecisionAtRef.current || 0;
        const newRows = decided
          .filter((row) => {
            const ts = Date.parse(row.updated_at);
            return Number.isFinite(ts) && ts > since;
          })
          .slice()
          .reverse();

        if (newRows.length > 0) {
          const recipientIds = Array.from(new Set(newRows.map((r) => r.recipient_id).filter(Boolean)));
          const { data: recipients } = await supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", recipientIds);

          const nameById = new Map(
            Array.isArray(recipients) ? recipients.map((p) => [p.id, p.display_name || "Someone"]) : []
          );

          for (const row of newRows) {
            const name = nameById.get(row.recipient_id) || "Someone";
            toast.success(
              row.status === "accepted" ? `${name} accepted your request` : `${name} declined your request`
            );
            const ts = Date.parse(row.updated_at);
            if (Number.isFinite(ts)) {
              lastOutgoingDecisionAtRef.current = Math.max(lastOutgoingDecisionAtRef.current, ts);
            }
          }
        }
      }

      // 3) "Someone sent you a request" notification (incoming requests)
      const { data: incoming, error: incomingError } = await supabase
        .from("contact_requests")
        .select("requester_id, created_at")
        .eq("recipient_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!incomingError && Array.isArray(incoming) && incoming.length > 0) {
        const newest = Date.parse(incoming[0].created_at);
        if (Number.isFinite(newest) && lastIncomingRequestAtRef.current === 0) {
          lastIncomingRequestAtRef.current = newest;
        }

        const since = lastIncomingRequestAtRef.current || 0;
        const newRows = incoming
          .filter((row) => {
            const ts = Date.parse(row.created_at);
            return Number.isFinite(ts) && ts > since;
          })
          .slice()
          .reverse();

        if (newRows.length > 0) {
          const requesterIds = Array.from(new Set(newRows.map((r) => r.requester_id).filter(Boolean)));
          const { data: requesters } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url")
            .in("id", requesterIds);

          const requesterById = new Map(
            Array.isArray(requesters)
              ? requesters.map((p) => [
                  p.id,
                  { id: p.id, name: p.display_name || "Someone", avatar_url: p.avatar_url || "" }
                ])
              : []
          );

          for (const row of newRows) {
            const requester = requesterById.get(row.requester_id) || {
              id: row.requester_id,
              name: "Someone",
              avatar_url: ""
            };

            toast.message(`${requester.name} sent you a contact request`);
            setIncomingRequests((prev) => {
              if (prev.some((r) => r.requester_id === row.requester_id && r.status === "pending")) return prev;
              return [
                {
                  requester_id: row.requester_id,
                  recipient_id: user.id,
                  status: "pending",
                  created_at: row.created_at,
                  requester
                },
                ...prev
              ];
            });

            const ts = Date.parse(row.created_at);
            if (Number.isFinite(ts)) {
              lastIncomingRequestAtRef.current = Math.max(lastIncomingRequestAtRef.current, ts);
            }
          }
        }
      }
    };

    poll().catch(() => {});
    const interval = setInterval(() => {
      poll().catch(() => {});
    }, 12_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [demoMode, user?.id]);

  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[920px] items-center px-4 py-16 text-slate-100 sm:px-6 lg:px-10">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <h1 className="text-2xl font-extrabold">Chat</h1>
          <p className="mt-3 text-sm text-white/70">
            Supabase is not configured. Set <code>VITE_SUPABASE_URL</code> and{" "}
            <code>VITE_SUPABASE_ANON_KEY</code> (or{" "}
            <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>) in <code>client/.env</code>,
            then restart the dev server.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Go to login
            </button>
            <button
              type="button"
              onClick={() => setDemoMode(true)}
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-transparent px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/5 hover:text-white"
            >
              Continue in demo mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-slate-950 to-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-slate-950 to-black">
        <div className="text-center px-4">
          <div className="text-white/80">You're not signed in.</div>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Go to login
            </button>
            <button
              type="button"
              onClick={() => setDemoMode(true)}
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-transparent px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/5 hover:text-white"
            >
              Continue in demo mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  const settingsMenuItems = [
    { icon: Smartphone, label: "Explore", section: "explore" },
    { icon: MessageSquare, label: "Chats", section: "chats" },
    { icon: Phone, label: "Calls", section: "calls" },
    { icon: Users, label: "Contact", section: "contacts" },
    { icon: Lock, label: "Privacy", section: "privacy" },
    { icon: Settings, label: "Setting", section: "settings" },
  ];

  return (
    <div className="relative isolate flex h-dvh w-full bg-gradient-to-b from-slate-950 to-black overflow-hidden">
      {/* Hidden audio elements for WebRTC */}
      <audio ref={remoteVideoRef} autoPlay playsInline className="hidden" />

      {/* Call Overlay */}
      <AnimatePresence>
        {callState && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl"
          >
            <div className="flex flex-col items-center gap-6 p-10 rounded-3xl bg-slate-900/90 border border-white/10 min-w-[280px] max-w-sm w-full mx-4">
              <div className="h-24 w-24 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                {callState.contact?.avatar_url ? (
                  <img src={callState.contact.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-white text-3xl font-bold">{getNameInitials(callState.contact?.name)}</span>
                )}
              </div>
              <div className="text-center">
                <p className="text-white text-xl font-semibold">{callState.contact?.name}</p>
                <p className="text-white/60 text-sm mt-1">
                  {callState.status === "calling" ? "Calling…" : callState.status === "incoming" ? "Incoming call" : "Call in progress"}
                </p>
                {callState.status === "active" && (
                  <p className="text-green-400 text-sm mt-1 font-mono">
                    {Math.floor(callDuration / 60).toString().padStart(2, "0")}:{(callDuration % 60).toString().padStart(2, "0")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-6">
                {callState.status === "incoming" && (
                  <>
                    <div className="flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDeclineCall}
                        className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition shadow-lg"
                        title="Decline"
                      >
                        <PhoneOff className="h-7 w-7 text-white" />
                      </button>
                      <span className="text-xs text-white/50">Decline</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAnswerCall}
                        className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition shadow-lg animate-pulse"
                        title="Answer"
                      >
                        <PhoneCall className="h-7 w-7 text-white" />
                      </button>
                      <span className="text-xs text-white/50">Answer</span>
                    </div>
                  </>
                )}
                {callState.status === "calling" && (
                  <div className="flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={handleHangup}
                      className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition shadow-lg"
                      title="Cancel"
                    >
                      <PhoneOff className="h-7 w-7 text-white" />
                    </button>
                    <span className="text-xs text-white/50">Cancel</span>
                  </div>
                )}
                {callState.status === "active" && (
                  <>
                    <div className="flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleMute}
                        className={`h-14 w-14 rounded-full flex items-center justify-center transition ${callState.isMuted ? "bg-red-500/30 text-red-400" : "bg-white/10 text-white hover:bg-white/20"}`}
                        title={callState.isMuted ? "Unmute" : "Mute"}
                      >
                        {callState.isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                      </button>
                      <span className="text-xs text-white/50">{callState.isMuted ? "Unmute" : "Mute"}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={handleHangup}
                        className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition shadow-lg"
                        title="End call"
                      >
                        <PhoneOff className="h-7 w-7 text-white" />
                      </button>
                      <span className="text-xs text-white/50">End</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Settings Sidebar Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex">
            <motion.div 
              className="flex-1 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowSettings(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            
            <motion.div 
              className="w-64 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 flex flex-col"
              initial={{ x: 256, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 256, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <X className="h-5 w-5 text-white/70" />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {currentUserAvatarUrl ? (
                    <img
                      src={currentUserAvatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-white text-sm font-semibold">
                      {getUserInitials(user?.email)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate">
                    {user?.user_metadata?.full_name || user?.email}
                  </h4>
                  <p className="text-xs text-white/60">Active Now</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {settingsMenuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setCurrentSection(item.section);
                      setShowSettings(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                      currentSection === item.section
                        ? "bg-white/10 text-white border-l-2 border-pink-500"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <IconComponent className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-white/10 px-3 py-4">
              <button
                onClick={async () => {
                  if (supabase) {
                    await supabase.auth.signOut();
                    navigate("/");
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-red-500/10 hover:text-red-400 transition"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Sign out</span>
              </button>
            </div>
          </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Sidebar */}
      <div className={`
        ${selectedChat && currentSection === "chats" ? "hidden md:flex" : ""}
        ${currentSection !== "chats" ? "hidden md:flex" : "flex"}
        w-full md:w-[280px] border-r border-white/10 bg-black/40 backdrop-blur-xl flex-col flex-shrink-0 pb-16 md:pb-0
      `}>
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                {currentUserAvatarUrl ? (
                  <img
                    src={currentUserAvatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-white text-sm font-semibold">
                    {getUserInitials(user?.email)}
                  </span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-slate-950 shadow-lg"></div>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
              </h2>
              <p className="text-xs text-white/60">Active Now</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="p-2 rounded-full hover:bg-white/10 transition text-white/70 hover:text-white relative"
              >
                <Bell className="h-4 w-4" />
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </button>
              {showNotifications && (
                <div className="fixed left-0 top-16 z-50 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden ml-2">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <span className="text-sm font-semibold text-white">Notifications</span>
                    {notifications.some((n) => !n.read) && (
                      <button onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))} className="text-xs text-pink-400 hover:text-pink-300 transition">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-white/40">No notifications yet</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`flex items-start gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition cursor-pointer ${!n.read ? "bg-pink-500/5" : ""}`}
                          onClick={() => {
                            setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
                            if (n.type === "contact_request") setCurrentSection("chats");
                            setShowNotifications(false);
                          }}
                        >
                          <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {n.avatar ? <img src={n.avatar} alt="" className="h-full w-full object-cover" /> : <span className="text-white text-xs font-semibold">{getNameInitials(n.name)}</span>}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-white/90 leading-snug">{n.text}</p>
                            <p className="text-xs text-white/40 mt-0.5">{new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                          {!n.read && <div className="h-2 w-2 rounded-full bg-pink-500 flex-shrink-0 mt-1.5" />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full hover:bg-white/10 transition text-white/70 hover:text-white"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-white/10 px-4">
          {[["active", "ACTIVE NOW"], ["favourite", "FAVOURITE"], ["all", "ALL"]].map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setSidebarTab(tab)}
              className={`px-3 py-3 text-xs font-semibold transition ${sidebarTab === tab ? "text-white border-b-2 border-pink-500" : "text-white/60 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="px-4 py-3 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Search contacts"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-white/40 outline-none focus:bg-white/10 focus:border-white/20"
            />
          </div>
        </div>

        {searchQuery.trim() ? (
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-3 text-xs font-semibold text-white/50 uppercase tracking-wider">
              Search results
            </div>

            {searchLoading ? (
              <div className="px-4 py-6 text-sm text-white/60">Searching…</div>
            ) : searchError ? (
              <div className="px-4 py-6 text-sm text-red-200/80 whitespace-pre-line">
                {searchError}
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                {searchResults.map((result) => {
                  const alreadyAdded = addedContacts.some((c) => c.id === result.id);
                  const outgoingPending = outgoingRequests.some(
                    (r) => r.recipient_id === result.id && r.status === "pending"
                  );
                  const incomingPending = incomingRequests.some(
                    (r) => r.requester_id === result.id && r.status === "pending"
                  );
                  const pendingAction = pendingActionByUserId[result.id];
                  const isPending = Boolean(pendingAction);

                  const buttonDisabled = alreadyAdded || isPending;
                  const buttonLabel = isPending
                    ? pendingAction === "add" ? "Sending…" : pendingAction === "cancel" ? "Cancelling…" : "Updating…"
                    : alreadyAdded ? "Added"
                    : outgoingPending ? "Requested"
                    : incomingPending ? "Accept"
                    : "Add";
                  const handleClick = async () => {
                    if (outgoingPending) {
                      await handleCancelRequest(result.id);
                      return;
                    }
                    if (incomingPending) {
                      await handleRespondToRequest(result.id, "accepted");
                      return;
                    }
                    await handleAddContact(result);
                  };
                  return (
                    <div
                      key={result.id}
                      className="border-b border-white/10 px-4 py-3 hover:bg-white/5 transition flex items-center gap-3"
                    >
                      <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {result.avatar_url ? (
                          <img
                            src={result.avatar_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-sm font-semibold">
                            {getNameInitials(result.name)}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">
                          {result.name}
                        </p>
                        <p className="text-xs text-white/50 truncate">Tap to connect</p>
                      </div>

                      <motion.button
                        type="button"
                        onClick={handleClick}
                        disabled={buttonDisabled}
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 transition ${
                          outgoingPending
                            ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            : "bg-pink-500/15 text-pink-300 hover:bg-pink-500/25"
                        }`}
                        whileTap={{ scale: 0.96 }}
                        whileHover={buttonDisabled ? undefined : { scale: 1.02 }}
                        aria-busy={isPending}
                      >
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : alreadyAdded ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                        {buttonLabel}
                      </motion.button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-6 text-sm text-white/60">No users found.</div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {(() => {
              const filtered = addedContacts.filter((c) => {
                if (archivedIds.has(c.id)) return false; // always hide archived from sidebar
                if (sidebarTab === "active") return activeUserIds.has(c.id);
                if (sidebarTab === "favourite") return favouriteIds.has(c.id);
                return true;
              });
              if (filtered.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center h-full px-4 py-10 text-center">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                      <Plus className="h-7 w-7 text-white/50" />
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">
                      {sidebarTab === "active" ? "No one active right now" : sidebarTab === "favourite" ? "No favourites yet" : "No contacts yet"}
                    </p>
                    <p className="text-xs text-white/50 mb-4">
                      {sidebarTab === "all" ? "Search for users above to start chatting" : ""}
                    </p>
                    {sidebarTab === "all" && (
                      <button
                        type="button"
                        onClick={() => setCurrentSection("contacts")}
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 px-5 py-2 text-sm font-semibold text-white transition"
                      >
                        <Plus className="h-4 w-4" />
                        Add your contacts
                      </button>
                    )}
                  </div>
                );
              }
              return filtered.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => handleOpenDm(contact)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition text-left border-b border-white/5 ${unreadCounts[contact.id] ? "bg-white/3" : ""}`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                      {contact.avatar_url ? (
                        <img src={contact.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-white text-sm font-semibold">{getNameInitials(contact.name)}</span>
                      )}
                    </div>
                    {activeUserIds.has(contact.id) && !unreadCounts[contact.id] && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-slate-950" />
                    )}
                    {unreadCounts[contact.id] > 0 && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center border border-slate-950">
                        <span className="text-white text-[9px] font-bold leading-none">{unreadCounts[contact.id] > 9 ? "9+" : unreadCounts[contact.id]}</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm truncate ${unreadCounts[contact.id] ? "font-bold text-white" : "font-semibold text-white"}`}>{contact.name}</p>
                    <p className={`text-xs truncate ${unreadCounts[contact.id] ? "text-white/80 font-medium" : "text-white/50"}`}>
                      {lastMessages[contact.id]?.text || (activeUserIds.has(contact.id) ? "Active now" : "Tap to chat")}
                    </p>
                  </div>
                  {unreadCounts[contact.id] > 0 ? (
                    <div className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
                  ) : favouriteIds.has(contact.id) ? (
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                  ) : null}
                </button>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className={`
        ${currentSection === "chats" && !selectedChat ? "hidden md:flex" : "flex"}
        flex-1 flex-col min-w-0 w-full pb-16 md:pb-0
      `}>
        {/* Mobile: show main content for non-chat sections always */}
        {currentSection === "chats" && (
          <>
            <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl px-8 py-4">
              <h2 className="text-xl font-bold text-white">Chats</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {selectedChat ? (
                <div className="flex h-full w-full">
                  {/* Main chat column */}
                  <div className="flex flex-col flex-1 min-w-0 w-full">
                  {/* Chat header - responsive layout */}
                  <div className="border-b border-white/10 bg-black/10 px-4 md:px-6 py-3 md:py-4">
                    {/* Mobile layout (< 768px) - Two rows */}
                    <div className="md:hidden">
                      {/* Row 1: Back button and action buttons */}
                      <div className="flex items-center justify-between mb-3">
                        <button
                          type="button"
                          onClick={handleCloseDm}
                          className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition active:bg-white/15"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Back
                        </button>
                        
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartCall(selectedChat)}
                            className="inline-flex items-center justify-center rounded-xl bg-white/5 p-2.5 min-w-[40px] min-h-[40px] text-white/80 hover:bg-green-500/20 hover:text-green-400 transition active:bg-green-500/30"
                            title="Call"
                            aria-label="Call"
                          >
                            <Phone className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowNicknameEditor((v) => !v)}
                            className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 min-h-[40px] text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition active:bg-white/15"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="hidden xs:inline">Nickname</span>
                          </button>
                        </div>
                      </div>
                      
                      {/* Row 2: Profile picture and name */}
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowProfilePanel((v) => !v)}>
                        <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-pink-500/50 transition">
                          {selectedChat.avatar_url ? (
                            <img
                              src={selectedChat.avatar_url}
                              alt=""
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-white text-base font-semibold">
                              {getNameInitials(dmDisplayName || selectedChat.display_name || selectedChat.name)}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-white hover:text-pink-300 transition break-words">{dmDisplayName}</p>
                          {selectedChat.nickname ? (
                            <p className="text-xs text-white/50 break-words">{selectedChat.display_name || " "}</p>
                          ) : (
                            <p className="text-xs text-white/50">&nbsp;</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Desktop layout (>= 768px) - Single row */}
                    <div className="hidden md:flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <button
                          type="button"
                          onClick={handleCloseDm}
                          className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Back
                        </button>

                        <div
                          className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-pink-500/50 transition"
                          onClick={() => setShowProfilePanel((v) => !v)}
                        >
                          {selectedChat.avatar_url ? (
                            <img
                              src={selectedChat.avatar_url}
                              alt=""
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-white text-sm font-semibold">
                              {getNameInitials(dmDisplayName || selectedChat.display_name || selectedChat.name)}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setShowProfilePanel((v) => !v)}>
                          <p className="truncate text-sm font-semibold text-white hover:text-pink-300 transition">{dmDisplayName}</p>
                          {selectedChat.nickname ? (
                            <p className="truncate text-xs text-white/50">{selectedChat.display_name || " "}</p>
                          ) : (
                            <p className="truncate text-xs text-white/50">&nbsp;</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartCall(selectedChat)}
                          className="inline-flex items-center justify-center rounded-xl bg-white/5 p-2.5 text-white/80 hover:bg-green-500/20 hover:text-green-400 transition"
                          title="Call"
                          aria-label="Call"
                        >
                          <Phone className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowNicknameEditor((v) => !v)}
                          className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
                        >
                          <Pencil className="h-4 w-4" />
                          Nickname
                        </button>
                      </div>
                    </div>
                  </div>

                  {showNicknameEditor && (
                    <div className="border-b border-white/10 bg-white/5 px-6 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          value={nicknameDraft}
                          onChange={(e) => setNicknameDraft(e.target.value)}
                          placeholder="Set a nickname (optional)"
                          className="flex-1 min-w-[240px] rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-white/20 focus:bg-black/30"
                        />
                        <button
                          type="button"
                          onClick={handleSaveNickname}
                          className="rounded-xl bg-pink-500/20 px-4 py-2.5 text-sm font-semibold text-pink-200 hover:bg-pink-500/30 transition"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNicknameEditor(false);
                            setNicknameDraft(selectedChat.nickname || "");
                          }}
                          className="rounded-xl bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
                    {dmLoading ? (
                      <div className="text-sm text-white/60">Loading messages…</div>                    ) : dmError ? (
                      <div className="text-sm text-red-200/80 whitespace-pre-line">{dmError}</div>
                    ) : dmMessages.length === 0 ? (
                      <div className="text-sm text-white/60">Start the conversation!</div>
                    ) : (
                      dmMessages.map((m) => {
                        const mine = m.sender_id === user?.id;
                        const mediaUrl = m.media_path ? dmMediaUrls[m.media_path] : null;
                        if (m.media_path && !mediaUrl) {
                          // Fire-and-forget signed URL resolution (renders once ready).
                          resolveMediaUrl(m.media_path).catch(() => {});
                        }

                        const msgReactions = reactions[m.id] || {};
                        const hasReactions = Object.keys(msgReactions).length > 0;
                        const QUICK_EMOJIS = ["❤️","😂","😮","😢","👍","🔥"];

                        const ReactionPicker = ({ side }) => (
                          <div className="relative self-end mb-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => setReactionPickerMsgId(reactionPickerMsgId === m.id ? null : m.id)}
                              className="text-white/25 hover:text-white/60 transition p-1"
                              title="React"
                            >
                              <Smile className="h-4 w-4" />
                            </button>
                            {reactionPickerMsgId === m.id && (
                              <div
                                ref={reactionPickerRef}
                                className={`absolute bottom-8 z-20 flex items-center gap-0.5 bg-slate-800 border border-white/10 rounded-full px-2 py-1.5 shadow-xl whitespace-nowrap ${side === "right" ? "right-0" : "left-0"}`}
                              >
                                {QUICK_EMOJIS.map((emoji) => (
                                  <button key={emoji} type="button" onClick={() => handleReact(m.id, emoji)} className="text-lg hover:scale-125 transition-transform px-0.5">
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );

                        return (
                          <div
                            key={m.id}
                            className={`flex items-end gap-1 ${mine ? "justify-end" : "justify-start"}`}
                          >
                            {m.media_type === "call_ended" ? (
                              <div className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
                                <div className="inline-flex flex-col items-start gap-1 rounded-2xl px-4 py-3 bg-white/5 border border-white/10 min-w-[160px]">
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                      <Phone className="h-4 w-4 text-white/60" />
                                    </div>
                                    <div>
                                      <p className="text-white text-sm font-semibold">Voice call</p>
                                      <p className="text-green-400 text-xs">{m.media_mime || "Ended"}</p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleStartCall(m._callContact || selectedChat)}
                                    className="w-full mt-1 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-xs font-semibold transition"
                                  >
                                    {mine ? "Call again" : "Call back"}
                                  </button>
                                </div>
                              </div>
                            ) : m.media_type === "call_missed" || m.text?.startsWith("📵") || m.text?.startsWith("[missed_call_") ? (
                              (() => {
                                const iWasCaller = m.sender_id === user?.id;
                                const otherName = m._missedContact?.name || selectedChat?.name || "them";
                                return (
                                  <div className={`flex flex-col gap-1 ${iWasCaller ? "items-end" : "items-start"}`}>
                                    <div className={`inline-flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm border ${iWasCaller ? "bg-white/5 border-white/10 text-white/60" : "bg-red-500/10 border-red-500/20 text-red-300"}`}>
                                      <PhoneOff className="h-4 w-4 flex-shrink-0" />
                                      <span>{iWasCaller ? `${otherName} didn't answer` : `You missed a call from ${otherName}`}</span>
                                    </div>
                                    <button type="button" onClick={() => handleStartCall(m._missedContact || selectedChat)} className="inline-flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 transition px-2">
                                      <Phone className="h-3.5 w-3.5" />
                                      {iWasCaller ? "Call again" : "Call back"}
                                    </button>
                                  </div>
                                );
                              })()
                            ) : (
                              <>
                                {mine && <ReactionPicker side="right" />}
                                <div className={`flex flex-col max-w-[65%] ${mine ? "items-end" : "items-start"}`}>
                                  {/* Sticker message */}
                                  {(m.media_type === "sticker" || m.text?.startsWith("[sticker:")) ? (
                                    <StickerMessage message={m} supabase={supabase} getCustomStickerUrl={getCustomStickerUrl} />
                                  ) : (
                                    /* Regular text/media message */
                                    <div className={`rounded-2xl overflow-hidden text-sm shadow-sm ${m.media_path && !m.text ? "" : `px-3 py-2 ${mine ? "bg-pink-500/20 text-white" : "bg-white/5 text-white/90 border border-white/10"}`}`}>
                                      {m.text && !m.text.startsWith("[sticker:") ? <div className="whitespace-pre-wrap break-words">{m.text}</div> : null}
                                      {m.media_path ? (
                                        <div className={m.text ? "mt-2" : ""}>
                                          {m.media_type === "image" ? (
                                            mediaUrl ? <img src={mediaUrl} alt="" className="max-w-[260px] max-h-[320px] w-full object-cover block cursor-pointer rounded-2xl" onClick={() => window.open(mediaUrl, "_blank")} /> : <div className="text-xs text-white/60 px-3 py-2">Loading image…</div>
                                          ) : m.media_type === "video" ? (
                                            mediaUrl ? <video src={mediaUrl} controls className="max-w-[260px] max-h-[320px] block rounded-2xl" /> : <div className="text-xs text-white/60 px-3 py-2">Loading video…</div>
                                          ) : (
                                            mediaUrl ? <audio src={mediaUrl} controls className="w-full min-w-[180px] px-3 py-2" /> : <div className="text-xs text-white/60 px-3 py-2">Loading audio…</div>
                                          )}
                                        </div>
                                      ) : null}
                                    </div>
                                  )}
                                  {/* Read receipt indicator for sent messages */}
                                  {mine && (
                                    <div className="flex items-center gap-1.5 mt-1 px-1">
                                      <span className="text-[11px] text-white/50">
                                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      {m.read_at ? (
                                        <div className="flex items-center" title={`Read ${new Date(m.read_at).toLocaleString()}`}>
                                          <Check className="h-3.5 w-3.5 text-blue-400 stroke-[2.5]" />
                                          <Check className="h-3.5 w-3.5 text-blue-400 stroke-[2.5] -ml-2.5" />
                                        </div>
                                      ) : (
                                        <div className="flex items-center" title="Delivered">
                                          <Check className="h-3.5 w-3.5 text-white/50 stroke-[2.5]" />
                                          <Check className="h-3.5 w-3.5 text-white/50 stroke-[2.5] -ml-2.5" />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {hasReactions && (
                                    <div className={`flex flex-wrap gap-1 mt-1 ${mine ? "justify-end" : "justify-start"}`}>
                                      {Object.entries(msgReactions).map(([emoji, users]) => (
                                        <button key={emoji} type="button" onClick={() => handleReact(m.id, emoji)}
                                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition ${users.includes(user?.id) ? "bg-pink-500/20 border-pink-500/40 text-white" : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"}`}>
                                          <span>{emoji}</span><span>{users.length}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {!mine && <ReactionPicker side="left" />}
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="border-t border-white/10 bg-black/20 px-6 py-4">
                    {/* Typing indicator */}
                    {Object.keys(typingUsers).length > 0 && (
                      <div className="flex items-center gap-2 px-1 pb-2">
                        <div className="flex gap-1">
                          <span className="h-2 w-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="h-2 w-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="h-2 w-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span className="text-xs text-white/40">{dmDisplayName} is typing…</span>
                      </div>
                    )}
                    {blockedIds.has(dmTargetId) ? (
                      /* Blocker's view */
                      <div className="flex flex-col items-center gap-3 py-2">
                        <p className="text-sm text-white/60">You blocked <span className="text-white font-semibold">{dmDisplayName}</span></p>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => toggleBlock(dmTargetId)}
                            className="px-4 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-sm font-semibold transition"
                          >
                            Unblock
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteConversation(dmTargetId)}
                            className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 text-sm font-semibold transition"
                          >
                            Delete Messages
                          </button>
                        </div>
                      </div>
                    ) : blockedByIds.has(dmTargetId) ? (
                      /* Blocked person's view */
                      <div className="flex flex-col items-center gap-1 py-3">
                        <p className="text-sm text-white/60 font-semibold">This person is not available</p>
                        <p className="text-xs text-white/35">You can't send messages to this account</p>
                      </div>
                    ) : (
                    <>
                    <input
                      ref={dmFileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) handleSendDirectMedia(file);
                      }}
                    />

                    <div className="flex items-end gap-2 md:gap-3">
                      <div className="flex-1 relative">
                        {/* Hidden file input for custom sticker upload */}
                        <input
                          ref={customStickerInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/gif,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadCustomSticker(file);
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                        {/* Sticker picker */}
                        {showStickerPicker && (
                          <div
                            ref={stickerPickerRef}
                            className="absolute bottom-12 left-0 z-20 bg-slate-800 border border-white/10 rounded-2xl p-4 shadow-xl w-80 max-h-96 overflow-y-auto"
                          >
                            <h3 className="text-sm font-semibold text-white/80 mb-3">Stickers</h3>
                            <div className="grid grid-cols-4 gap-2">
                              {getAllStickers().map((sticker) => (
                                <button
                                  key={sticker.id}
                                  type="button"
                                  onClick={() => handleSendSticker(sticker.url)}
                                  className="aspect-square rounded-xl hover:bg-white/10 transition-all hover:scale-110 p-2 flex items-center justify-center"
                                  title={sticker.name}
                                >
                                  <img 
                                    src={sticker.url} 
                                    alt={sticker.name}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.parentElement.innerHTML = `<span class="text-4xl">${sticker.emoji}</span>`;
                                    }}
                                  />
                                </button>
                              ))}
                              {/* Add custom sticker button */}
                              <button
                                type="button"
                                onClick={() => customStickerInputRef.current?.click()}
                                disabled={uploadingSticker}
                                className="aspect-square rounded-xl border-2 border-dashed border-white/20 hover:border-pink-500/50 hover:bg-pink-500/10 transition-all flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Upload custom sticker"
                              >
                                {uploadingSticker ? (
                                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-pink-500"></div>
                                ) : (
                                  <Plus className="h-8 w-8 text-white/40 group-hover:text-pink-400 transition" />
                                )}
                              </button>
                            </div>
                            
                            {/* Custom stickers section */}
                            {customStickers.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-white/10">
                                <h4 className="text-xs font-semibold text-white/60 mb-2">My Stickers</h4>
                                <div className="grid grid-cols-4 gap-2">
                                  {customStickers.map((sticker) => {
                                    const stickerUrl = customStickerUrls[sticker.id];
                                    return (
                                    <div key={sticker.id} className="relative group aspect-square">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          // Send storage path, not URL
                                          handleSendSticker(sticker.storage_path);
                                        }}
                                        className="w-full h-full rounded-xl hover:bg-white/10 transition-all hover:scale-110 p-2 flex items-center justify-center"
                                        title={sticker.name}
                                      >
                                        {stickerUrl ? (
                                          <img 
                                            src={stickerUrl}
                                            alt={sticker.name}
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                              e.target.style.display = 'none';
                                              e.target.parentElement.innerHTML = `<span class="text-2xl">${sticker.emoji_fallback || '🎨'}</span>`;
                                            }}
                                          />
                                        ) : (
                                          <div className="animate-pulse bg-white/10 w-full h-full rounded-lg flex items-center justify-center">
                                            <span className="text-2xl">{sticker.emoji_fallback || '🎨'}</span>
                                          </div>
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (confirm('Delete this sticker?')) {
                                            handleDeleteCustomSticker(sticker.id, sticker.storage_path);
                                          }
                                        }}
                                        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        title="Delete sticker"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {/* Emoji picker */}
                        {showEmojiPicker && (
                          <div
                            ref={emojiPickerRef}
                            className="absolute bottom-12 left-0 z-20 bg-slate-800 border border-white/10 rounded-2xl p-3 shadow-xl w-72"
                          >
                            <div className="grid grid-cols-8 gap-1">
                              {[
                                "😀","😂","🥹","😍","🥰","😎","🤩","😜",
                                "😅","🤣","😇","🥳","😏","😒","😔","😭",
                                "😤","🤯","🥺","😱","🤔","🤫","🤭","😶",
                                "👍","👎","❤️","🔥","💯","✨","🎉","👏",
                                "🙏","💪","🤝","👀","💀","😈","🤡","👻",
                                "🐶","🐱","🦊","🐻","🐼","🐨","🦁","🐸",
                                "🍕","🍔","🍟","🌮","🍜","🍣","🍩","🎂",
                                "⚽","🏀","🎮","🎵","🎸","🎤","📸","🚀"
                              ].map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => {
                                    setMessageText((prev) => prev + emoji);
                                    setShowEmojiPicker(false);
                                  }}
                                  className="text-xl hover:scale-125 transition-transform p-1 rounded-lg hover:bg-white/10"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="relative">
                          <textarea
                            value={messageText}
                            onChange={(e) => { setMessageText(e.target.value); sendTypingIndicator(); }}
                            placeholder={recording ? "Recording voice…" : "Message"}
                            rows={1}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendDirectText();
                              }
                            }}
                            onFocus={(e) => {
                              // Scroll input into view when keyboard opens (mobile)
                              setTimeout(() => {
                                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 300);
                            }}
                            className="w-full resize-none rounded-2xl border border-white/10 bg-white/10 px-4 py-3 pr-20 text-sm md:text-base text-white placeholder-white/50 outline-none focus:bg-white/15 focus:border-white/30 min-h-[44px]"
                            style={{ fontSize: '16px' }} // Prevents iOS zoom on focus
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setShowStickerPicker((v) => !v);
                                setShowEmojiPicker(false);
                              }}
                              className="p-2 text-white/50 hover:text-white/80 transition rounded-lg hover:bg-white/10 active:bg-white/20"
                              title="Stickers"
                            >
                              <Sticker className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowEmojiPicker((v) => !v);
                                setShowStickerPicker(false);
                              }}
                              className="p-2 text-white/50 hover:text-white/80 transition rounded-lg hover:bg-white/10 active:bg-white/20"
                              title="Emoji"
                            >
                              <Smile className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <motion.button
                        type="button"
                        onClick={() => dmFileInputRef.current?.click()}
                        disabled={pendingActionByUserId[dmTargetId] === "media"}
                        whileTap={{ scale: 0.96 }}
                        className="inline-flex items-center justify-center rounded-2xl bg-white/10 p-3 md:p-3 min-w-[44px] min-h-[44px] text-white/70 hover:bg-white/15 hover:text-white transition disabled:opacity-60 disabled:cursor-not-allowed active:bg-white/20"
                        title="Attach"
                      >
                        <Paperclip className="h-5 w-5" />
                      </motion.button>

                      <motion.button
                        type="button"
                        onClick={handleToggleRecording}
                        whileTap={{ scale: 0.96 }}
                        className={`inline-flex items-center justify-center rounded-2xl p-3 md:p-3 min-w-[44px] min-h-[44px] transition ${
                          recording
                            ? "bg-red-500/30 text-red-200 hover:bg-red-500/40 active:bg-red-500/50"
                            : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white active:bg-white/20"
                        }`}
                        title={recording ? "Stop recording" : "Voice message"}
                      >
                        {recording ? <X className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                      </motion.button>

                      <motion.button
                        type="button"
                        onClick={handleSendDirectText}
                        whileTap={{ scale: 0.96 }}
                        disabled={!messageText.trim()}
                        className="inline-flex items-center justify-center rounded-2xl bg-pink-500/30 p-3 md:p-3 min-w-[44px] min-h-[44px] text-pink-200 hover:bg-pink-500/40 transition disabled:opacity-60 disabled:cursor-not-allowed active:bg-pink-500/50"
                        title="Send"
                      >
                        <Send className="h-5 w-5" />
                      </motion.button>
                    </div>
                    </>
                    )}
                  </div>
                </div>

                  {/* Profile Panel — slides in from right */}
                  <AnimatePresence>
                    {showProfilePanel && (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 300, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="border-l border-white/10 bg-black/30 backdrop-blur-xl flex flex-col overflow-hidden flex-shrink-0"
                      >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                          <span className="text-sm font-semibold text-white">Profile</span>
                          <button onClick={() => setShowProfilePanel(false)} className="text-white/40 hover:text-white transition">
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                          {/* Contact info */}
                          <div className="flex flex-col items-center px-5 py-6 border-b border-white/10">
                            <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center overflow-hidden mb-3">
                              {selectedChat.avatar_url ? (
                                <img src={selectedChat.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="text-white text-2xl font-bold">{getNameInitials(dmDisplayName)}</span>
                              )}
                            </div>
                            <p className="text-white font-semibold text-base">{dmDisplayName}</p>
                            {selectedChat.nickname && (
                              <p className="text-white/50 text-xs mt-0.5">{selectedChat.display_name}</p>
                            )}
                            <div className="flex gap-3 mt-4">
                              <button onClick={() => handleStartCall(selectedChat)} className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition">
                                <Phone className="h-4 w-4 text-green-400" />
                                <span className="text-xs text-white/60">Call</span>
                              </button>
                              <button onClick={() => { setShowProfilePanel(false); setShowNicknameEditor(true); }} className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition">
                                <Pencil className="h-4 w-4 text-white/60" />
                                <span className="text-xs text-white/60">Nickname</span>
                              </button>
                            </div>
                          </div>

                          {/* Shared Media */}
                          <div className="px-5 py-4 border-b border-white/10">
                            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Shared Media</p>
                            {(() => {
                              const mediaMessages = dmMessages.filter((m) => m.media_path && (m.media_type === "image" || m.media_type === "video"));
                              if (mediaMessages.length === 0) return <p className="text-xs text-white/40">No media shared yet</p>;
                              return (
                                <div className="grid grid-cols-3 gap-1">
                                  {mediaMessages.map((m) => {
                                    const url = dmMediaUrls[m.media_path];
                                    if (!url) { resolveMediaUrl(m.media_path).catch(() => {}); }
                                    return (
                                      <div key={m.id} className="aspect-square rounded-lg overflow-hidden bg-white/5">
                                        {m.media_type === "image" ? (
                                          url ? <img src={url} alt="" className="h-full w-full object-cover cursor-pointer" onClick={() => window.open(url, "_blank")} /> : <div className="h-full w-full flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-white/30" /></div>
                                        ) : (
                                          url ? <video src={url} className="h-full w-full object-cover cursor-pointer" onClick={() => window.open(url, "_blank")} /> : <div className="h-full w-full flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-white/30" /></div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Shared Links */}
                          <div className="px-5 py-4">
                            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Shared Links</p>
                            {(() => {
                              const urlRegex = /https?:\/\/[^\s]+/g;
                              const links = dmMessages
                                .filter((m) => m.text)
                                .flatMap((m) => {
                                  const found = m.text.match(urlRegex) || [];
                                  return found.map((url) => ({ url, created_at: m.created_at }));
                                });
                              if (links.length === 0) return <p className="text-xs text-white/40">No links shared yet</p>;
                              return (
                                <div className="space-y-2">
                                  {links.slice(0, 20).map((link, i) => (
                                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                      className="flex items-start gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition group">
                                      <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <MessageCircle className="h-3.5 w-3.5 text-white/40" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs text-pink-400 group-hover:text-pink-300 truncate transition">{link.url}</p>
                                        <p className="text-xs text-white/30 mt-0.5">{new Date(link.created_at).toLocaleDateString()}</p>
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  {incomingRequests.length > 0 && (
                <div className="px-8 pt-6">
                  <div className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Contact Requests ({incomingRequests.length})
                  </div>
                  <div className="mt-3 space-y-3">
                    {incomingRequests.map((req) => {
                      const requester = req.requester || { id: req.requester_id, name: "Someone", avatar_url: "" };
                      const pendingAction = pendingActionByUserId[req.requester_id];
                      const busy = Boolean(pendingAction);
                      return (
                        <div
                          key={req.requester_id}
                          className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {requester.avatar_url ? (
                                <img src={requester.avatar_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-white text-sm font-semibold">
                                  {getNameInitials(requester.name)}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{requester.name}</p>
                              <p className="text-xs text-white/50 truncate">Wants to connect</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <motion.button
                              type="button"
                              onClick={() => handleRespondToRequest(req.requester_id, "declined")}
                              disabled={busy}
                              className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                              whileTap={{ scale: 0.96 }}
                              whileHover={busy ? undefined : { scale: 1.02 }}
                            >
                              {pendingAction === "declined" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : null}
                              Decline
                            </motion.button>
                            <motion.button
                              type="button"
                              onClick={() => handleRespondToRequest(req.requester_id, "accepted")}
                              disabled={busy}
                              className="inline-flex items-center gap-2 rounded-lg bg-pink-500/15 px-3 py-2 text-xs font-semibold text-pink-200 hover:bg-pink-500/25 transition disabled:cursor-not-allowed disabled:opacity-60"
                              whileTap={{ scale: 0.96 }}
                              whileHover={busy ? undefined : { scale: 1.02 }}
                            >
                              {pendingAction === "accepted" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : null}
                              Accept
                            </motion.button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {outgoingRequests.length > 0 && (
                <div className="px-8 pt-6">
                  <div className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Pending Requests ({outgoingRequests.length})
                  </div>
                  <div className="mt-3 space-y-3">
                    {outgoingRequests.map((req) => {
                      const recipient = req.recipient || { id: req.recipient_id, name: "Someone", avatar_url: "" };
                      return (
                        <div
                          key={req.recipient_id}
                          className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {recipient.avatar_url ? (
                                <img src={recipient.avatar_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-white text-sm font-semibold">
                                  {getNameInitials(recipient.name)}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{recipient.name}</p>
                              <p className="text-xs text-white/50 truncate">Request pending</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/50">
                              Pending
                            </span>
                            <motion.button
                              type="button"
                              onClick={() => handleCancelRequest(req.recipient_id)}
                              disabled={Boolean(pendingActionByUserId[req.recipient_id])}
                              className="rounded-full bg-red-500/10 hover:bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-400 transition disabled:opacity-60"
                              whileTap={{ scale: 0.96 }}
                            >
                              {pendingActionByUserId[req.recipient_id] === "cancel" ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : "Cancel"}
                            </motion.button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {addedContacts.length > 0 ? (
                <div>
                  <div className="px-8 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Added Contacts ({addedContacts.filter(c => !archivedIds.has(c.id)).length})
                  </div>
                  {addedContacts.filter(c => !archivedIds.has(c.id)).map((contact) => (
                    <div key={contact.id} className="border-b border-white/10 px-8 py-4 hover:bg-white/5 cursor-pointer transition flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center overflow-hidden text-white text-sm font-semibold">
                            {contact.avatar_url ? (
                              <img src={contact.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              getNameInitials(contact.name)
                            )}
                          </div>
                          {unreadCounts[contact.id] > 0 && (
                            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                              <span className="text-white text-[9px] font-bold">{unreadCounts[contact.id] > 9 ? "9+" : unreadCounts[contact.id]}</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-white font-semibold truncate">{contact.name}</h3>
                          <p className={`text-xs truncate ${unreadCounts[contact.id] > 0 ? "text-white font-medium" : "text-white/50"}`}>
                            {lastMessages[contact.id]?.text || "Tap to start chatting"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenDm(contact)}
                        className="ml-3 flex-shrink-0 px-4 py-2 bg-pink-500/20 text-pink-400 rounded text-xs font-semibold hover:bg-pink-500/30 transition"
                      >
                        Message
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-white/60">No chats yet. Search and add contacts above!</p>
                  </div>
                </div>
              )}
                </>
              )}
            </div>
          </>
        )}

        {currentSection === "calls" && (
          <>
            <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl px-8 py-4">
              <h2 className="text-xl font-bold text-white">Call History</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {callHistoryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-white/40" />
                </div>
              ) : callHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-14 w-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Phone className="h-6 w-6 text-white/30" />
                  </div>
                  <p className="text-white/60 font-semibold">No call history yet</p>
                  <p className="text-sm text-white/40 mt-1">Calls you make or miss will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {callHistory.map((call) => {
                    const time = new Date(call.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    const date = new Date(call.created_at).toLocaleDateString([], { month: "short", day: "numeric" });
                    const isToday = new Date(call.created_at).toDateString() === new Date().toDateString();
                    return (
                      <div key={call.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 transition">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {call.contact.avatar_url ? (
                              <img src={call.contact.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-white text-sm font-semibold">{getNameInitials(call.contact.name)}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-semibold truncate">{call.contact.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {call.iOutgoing ? (
                                <PhoneOff className="h-3 w-3 text-white/40 flex-shrink-0" />
                              ) : (
                                <PhoneOff className="h-3 w-3 text-red-400 flex-shrink-0" />
                              )}
                              <p className={`text-xs ${call.iOutgoing ? "text-white/50" : "text-red-400"}`}>
                                {call.iOutgoing ? "Missed" : "Missed call"} • {isToday ? time : `${date} ${time}`}
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { handleStartCall(call.contact); setCurrentSection("chats"); }}
                          className="flex-shrink-0 h-9 w-9 rounded-full bg-green-500/15 hover:bg-green-500/25 flex items-center justify-center transition"
                          title="Call back"
                        >
                          <Phone className="h-4 w-4 text-green-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {currentSection === "contacts" && (
          <>
            <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl px-8 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Contacts</h2>
              <button
                type="button"
                onClick={handleImportDeviceContacts}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-semibold transition"
              >
                <BookUser className="h-4 w-4" />
                Add from device
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {addedContacts.length > 0 ? (
                <div className="px-8 py-6 space-y-3">
                  {addedContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {contact.avatar_url ? (
                            <img src={contact.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-white text-sm font-semibold">
                              {getNameInitials(contact.name)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate">{contact.name}</p>
                          <p className="text-xs text-white/60 truncate">{lastMessages[contact.id]?.text || "Tap to start chatting"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleFavourite(contact.id)}
                          className={`p-2 rounded-lg transition ${favouriteIds.has(contact.id) ? "text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20" : "text-white/40 bg-white/5 hover:bg-white/10 hover:text-yellow-400"}`}
                          title={favouriteIds.has(contact.id) ? "Remove from favourites" : "Add to favourites"}
                        >
                          <Star className={`h-4 w-4 ${favouriteIds.has(contact.id) ? "fill-yellow-400" : ""}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDm(contact)}
                          className="px-3 py-2 bg-pink-500/20 text-pink-200 rounded-lg text-xs font-semibold hover:bg-pink-500/30 transition"
                        >
                          Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center px-8 py-10">
                  <div className="text-center">
                    <p className="text-white/70 font-semibold">No contacts yet</p>
                    <p className="mt-2 text-sm text-white/50">Search and add people from the sidebar.</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {currentSection === "privacy" && (
          <>
            <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl px-8 py-4">
              <h2 className="text-xl font-bold text-white">Privacy</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-3">

              {/* Hide Your Status */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <EyeOff className="h-4 w-4 text-white/60" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">Hide Your Status</p>
                  <p className="text-xs text-white/50">{hideStatus ? "Hidden from contacts" : "Visible to contacts"}</p>
                </div>
                <button
                  onClick={toggleHideStatus}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hideStatus ? "bg-pink-500" : "bg-white/20"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hideStatus ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              {/* Blocked Accounts */}
              <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="h-4 w-4 text-white/60" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">Blocked Accounts</p>
                    <p className="text-xs text-white/50">{blockedIds.size === 0 ? "No blocked accounts" : `${blockedIds.size} blocked`}</p>
                  </div>
                </div>
                {blockedIds.size > 0 && (
                  <div className="border-t border-white/10 px-4 pb-3 space-y-2 pt-2">
                    {addedContacts.filter((c) => blockedIds.has(c.id)).map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center overflow-hidden text-xs font-semibold text-white">
                            {c.avatar_url ? <img src={c.avatar_url} alt="" className="h-full w-full object-cover" /> : getNameInitials(c.name)}
                          </div>
                          <span className="text-sm text-white/80">{c.name}</span>
                        </div>
                        <button onClick={() => toggleBlock(c.id)} className="text-xs text-pink-400 hover:text-pink-300 transition">Unblock</button>
                      </div>
                    ))}
                  </div>
                )}
                {addedContacts.filter((c) => !blockedIds.has(c.id)).length > 0 && (
                  <div className="border-t border-white/10 px-4 pb-3 pt-2">
                    <p className="text-xs text-white/40 mb-2">Block a contact</p>
                    <div className="space-y-1">
                      {addedContacts.filter((c) => !blockedIds.has(c.id)).map((c) => (
                        <div key={c.id} className="flex items-center justify-between gap-3">
                          <span className="text-sm text-white/70">{c.name}</span>
                          <button onClick={() => toggleBlock(c.id)} className="text-xs text-red-400 hover:text-red-300 transition">Block</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Muted / Restricted */}
              <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Lock className="h-4 w-4 text-white/60" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">Muted Contacts</p>
                    <p className="text-xs text-white/50">{mutedIds.size === 0 ? "No muted contacts" : `${mutedIds.size} muted`}</p>
                  </div>
                </div>
                {addedContacts.length > 0 && (
                  <div className="border-t border-white/10 px-4 pb-3 pt-2 space-y-1">
                    {addedContacts.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-3">
                        <span className="text-sm text-white/70">{c.name}</span>
                        <button
                          onClick={() => toggleContactMute(c.id)}
                          className={`text-xs transition ${mutedIds.has(c.id) ? "text-pink-400 hover:text-pink-300" : "text-white/40 hover:text-white/70"}`}
                        >
                          {mutedIds.has(c.id) ? "Unmute" : "Mute"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Archived Chats */}
              <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Archive className="h-4 w-4 text-white/60" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">Archived Chats</p>
                    <p className="text-xs text-white/50">{archivedIds.size === 0 ? "No archived chats" : `${archivedIds.size} archived`}</p>
                  </div>
                </div>
                {addedContacts.length > 0 && (
                  <div className="border-t border-white/10 px-4 pb-3 pt-2 space-y-1">
                    {addedContacts.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-3">
                        <span className="text-sm text-white/70">{c.name}</span>
                        <button
                          onClick={() => toggleArchive(c.id)}
                          className={`text-xs transition ${archivedIds.has(c.id) ? "text-pink-400 hover:text-pink-300" : "text-white/40 hover:text-white/70"}`}
                        >
                          {archivedIds.has(c.id) ? "Unarchive" : "Archive"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {currentSection === "settings" && (
          <>
            <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl px-8 py-4">
              <h2 className="text-xl font-bold text-white">Settings</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-3">

              {/* Notifications */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Bell className="h-4 w-4 text-white/60" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">Notifications</p>
                  <p className="text-xs text-white/50">
                    {notifPermission === "granted" ? "Enabled" : notifPermission === "denied" ? "Blocked by browser" : "Not enabled"}
                  </p>
                </div>
                {notifPermission !== "granted" && (
                  <button onClick={requestNotifications} className="px-3 py-1.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 rounded-lg text-xs font-semibold transition">
                    Enable
                  </button>
                )}
                {notifPermission === "granted" && (
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                )}
              </div>

              {/* Theme */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Palette className="h-4 w-4 text-white/60" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Theme</p>
                    <p className="text-xs text-white/50 capitalize">{theme}</p>
                  </div>
                </div>
                <div className="flex gap-2 ml-13">
                  {["dark", "light", "auto"].map((t) => (
                    <button
                      key={t}
                      onClick={() => applyTheme(t)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition ${theme === t ? "bg-pink-500/30 text-pink-200 border border-pink-500/40" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Storage */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <HardDrive className="h-4 w-4 text-white/60" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">Storage</p>
                    <p className="text-xs text-white/50">{cacheSize ? `Used: ${cacheSize}` : "Tap to check usage"}</p>
                  </div>
                  <button onClick={estimateCacheSize} className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white/70 rounded-lg text-xs font-semibold transition">
                    Check
                  </button>
                </div>
                <button onClick={clearCache} className="w-full py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition">
                  Clear Cache
                </button>
              </div>

              {/* About */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Info className="h-4 w-4 text-white/60" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">About</p>
                    <p className="text-xs text-white/50">My Chat App • v1.0.0</p>
                  </div>
                  <button onClick={() => setShowAbout((v) => !v)} className="text-xs text-white/40 hover:text-white/70 transition">
                    {showAbout ? "Hide" : "Details"}
                  </button>
                </div>
                {showAbout && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-1 text-xs text-white/50">
                    <p>Built with React 18 + Vite</p>
                    <p>Backend: Node.js + Express</p>
                    <p>Database: Supabase (Postgres)</p>
                    <p>Real-time: Supabase Realtime</p>
                  </div>
                )}
              </div>

              {/* Display Name */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Pencil className="h-4 w-4 text-white/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">Display Name</p>
                    <p className="text-xs text-white/50 truncate">{user?.user_metadata?.full_name || user?.email?.split("@")[0]}</p>
                  </div>
                  <button onClick={() => { setDisplayNameDraft(user?.user_metadata?.full_name || user?.email?.split("@")[0] || ""); setEditingDisplayName((v) => !v); }}
                    className="text-xs text-pink-400 hover:text-pink-300 font-semibold transition">
                    {editingDisplayName ? "Cancel" : "Edit"}
                  </button>
                </div>
                {editingDisplayName && (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={displayNameDraft}
                      onChange={(e) => setDisplayNameDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveDisplayName(); }}
                      placeholder="Enter display name"
                      className="flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-pink-500/50"
                      autoFocus
                    />
                    <button onClick={handleSaveDisplayName}
                      className="px-4 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-sm font-semibold transition">
                      Save
                    </button>
                  </div>
                )}
              </div>

              {/* Account */}
              <button onClick={() => navigate("/account")} className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition text-left">
                <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <UserCog className="h-4 w-4 text-white/60" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Account</p>
                  <p className="text-xs text-white/50">Profile, password, delete account</p>
                </div>
              </button>
            </div>
          </>
        )}

        {currentSection === "explore" && (
          <>
            <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl px-8 py-4">
              <h2 className="text-xl font-bold text-white">Explore</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              <div className="border-b border-white/10 pb-6">
                <h3 className="text-white font-semibold mb-4">Communities</h3>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition">
                    <p className="text-white font-semibold">Tech Enthusiasts</p>
                    <p className="text-xs text-white/60">2.5K members</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition">
                    <p className="text-white font-semibold">Gaming Hub</p>
                    <p className="text-xs text-white/60">5.1K members</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Suggested Friends</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                    <div>
                      <p className="text-white font-semibold">Alex Johnson</p>
                      <p className="text-xs text-white/60">5 mutual friends</p>
                    </div>
                    <button className="px-3 py-1 bg-pink-500 text-white rounded text-xs font-semibold hover:bg-pink-600 transition">
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2 py-2 safe-area-pb">
        {[
          { icon: MessageSquare, label: "Chats", section: "chats" },
          { icon: Phone, label: "Calls", section: "calls" },
          { icon: Users, label: "Contacts", section: "contacts" },
          { icon: Smartphone, label: "Explore", section: "explore" },
          { icon: Settings, label: "Settings", section: "settings" },
        ].map(({ icon: Icon, section, label }) => (
          <button
            key={section}
            type="button"
            onClick={() => { setCurrentSection(section); if (section !== "chats") setSelectedChat(null); }}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition ${currentSection === section ? "text-pink-400" : "text-white/40 hover:text-white/70"}`}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {section === "chats" && Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 0 && (
                <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold leading-none">
                    {Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 9 ? "9+" : Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
                  </span>
                </div>
              )}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
