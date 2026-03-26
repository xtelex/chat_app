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
  Users,
  Lock,
  UserPlus,
  Loader2,
  Check,
  ArrowLeft,
  Send,
  Pencil
} from "lucide-react";

import { isSupabaseConfigured, supabase } from "../services/supabaseClient.js";

export default function ChatPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const lastContactAddedToMeAtRef = useRef(0);
  const lastOutgoingDecisionAtRef = useRef(0);
  const lastIncomingRequestAtRef = useRef(0);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
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
  const dmFileInputRef = useRef(null);
  const recordingRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const [recording, setRecording] = useState(false);

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
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const nextSession = data.session ?? null;
      if (!nextSession) {
        navigate("/login", { replace: true });
        setLoading(false);
        return;
      }
      setSession(nextSession);
      setUser(nextSession.user);
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const s = nextSession ?? null;
      setSession(s);
      setUser(s?.user ?? null);
      if (!s) {
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
          setDmMessages(messages);
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
        .select("id, created_at, sender_id, recipient_id, text, media_path, media_type, media_mime")
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${contactId}),and(sender_id.eq.${contactId},recipient_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true })
        .limit(200);

      if (!error && Array.isArray(data)) {
        setDmMessages(data);
        setDmError(null);
        setDmLoading(false);
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

  const handleSaveNickname = async () => {
    if (!dmTargetId) return;
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

  useEffect(() => {
    if (!dmTargetId) return;
    loadDirectMessages(dmTargetId);
  }, [dmTargetId]);

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
      fetch(`${apiBaseUrl}/api/users/search?q=${encodeURIComponent(q)}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        signal: controller.signal
      })
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

          // If the backend isn't reachable, fall back to querying Supabase directly.
          if (/failed to fetch|networkerror/i.test(rawMessage) && supabase) {
            const { data, error } = await supabase
              .from("profiles")
              .select("id, display_name, avatar_url")
              .ilike("display_name", `%${q}%`)
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
          if (/failed to fetch|networkerror/i.test(rawMessage)) {
            setSearchError(
              `Can't reach the API at ${apiBaseUrl}. Start the backend server on that URL/port, then try again.`
            );
            return;
          }

          setSearchError(rawMessage || "Search failed.");
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
      const res = await fetch(`${apiBaseUrl}/api/users/contact-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ recipientId: contact.id })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Send request failed (${res.status})`);
      }

      setOutgoingRequests((prev) => {
        if (prev.some((r) => r.recipient_id === contact.id && r.status === "pending")) return prev;
        return [
          ...prev,
          {
            requester_id: user?.id,
            recipient_id: contact.id,
            status: "pending",
            created_at: new Date().toISOString(),
            recipient: { id: contact.id, name: contact.name, avatar_url: contact.avatar_url || "" }
          }
        ];
      });
      toast.success("Request sent");
    } catch (err) {
      const rawMessage = String(err?.message || "");
      if (/failed to fetch|networkerror/i.test(rawMessage)) {
        // Fallback: create request directly in Supabase.
        if (supabase && user?.id) {
          const { error } = await supabase.from("contact_requests").insert({
            requester_id: user.id,
            recipient_id: contact.id,
            status: "pending"
          });

          if (!error || error.code === "23505") {
            setOutgoingRequests((prev) => {
              if (prev.some((r) => r.recipient_id === contact.id && r.status === "pending")) return prev;
              return [
                ...prev,
                {
                  requester_id: user.id,
                  recipient_id: contact.id,
                  status: "pending",
                  created_at: new Date().toISOString(),
                  recipient: { id: contact.id, name: contact.name, avatar_url: contact.avatar_url || "" }
                }
              ];
            });
            setSearchError(null);
            toast.success("Request sent");
            return;
          }

          const msg = String(error.message || "");
          if (/duplicate key value|contact_requests_pkey/i.test(msg)) {
            toast.message("Request already sent");
            return;
          }
          if (/could not find the table|schema cache|does not exist/i.test(msg)) {
            setSearchError(
              [
                "Contact requests table is missing (or PostgREST schema cache is stale).",
                "",
                "In Supabase Dashboard -> SQL Editor run:",
                "1) Run `supabase/migrations/20260326170000_add_contact_requests.sql`",
                "2) Then run: select pg_notify('pgrst', 'reload schema');",
                "3) Wait ~10 seconds and refresh this page."
              ].join("\n")
            );
            return;
          }

          setSearchError(`Backend is offline and request insert failed: ${msg}`);
          return;
        }

        setSearchError(
          `Can't reach the API at ${apiBaseUrl}. Start the backend server on that URL/port, then try again.`
        );
      } else {
        setSearchError(rawMessage || "Failed to send request.");
      }
    } finally {
      clearPendingAction(contact.id);
    }
  };

  const handleRespondToRequest = async (requesterId, status) => {
    if (!requesterId) return;
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
              toast.success(
                nextStatus === "accepted" ? `${name} accepted your request` : `${name} declined your request`
              );
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
    <div className="relative isolate flex h-dvh bg-gradient-to-b from-slate-950 to-black">
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
      <div className="w-[280px] border-r border-white/10 bg-black/40 backdrop-blur-xl flex flex-col">
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
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full hover:bg-white/10 transition text-white/70 hover:text-white"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        <div className="flex border-b border-white/10 px-4">
          <button className="px-3 py-3 text-xs font-semibold text-white border-b-2 border-pink-500">
            ACTIVE NOW
          </button>
          <button className="px-3 py-3 text-xs font-semibold text-white/60 hover:text-white">
            FAVOURITE
          </button>
          <button className="px-3 py-3 text-xs font-semibold text-white/60 hover:text-white">
            ALL
          </button>
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

                  const buttonDisabled = alreadyAdded || outgoingPending || isPending;
                  const buttonLabel = isPending
                    ? pendingAction === "add"
                      ? "Sending…"
                      : "Updating…"
                    : alreadyAdded
                    ? "Added"
                    : outgoingPending
                      ? "Requested"
                      : incomingPending
                        ? "Accept"
                        : "Add";
                  const handleClick = async () => {
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
                        className="inline-flex items-center gap-2 rounded-lg bg-pink-500/15 px-3 py-2 text-xs font-semibold text-pink-300 hover:bg-pink-500/25 disabled:cursor-not-allowed disabled:opacity-60 transition"
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
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                <Plus className="h-8 w-8 text-white/50" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                No conversations yet
              </h3>
              <p className="text-sm text-white/60 mb-6">
                Search for users above to start chatting
              </p>
              <button
                type="button"
                onClick={() => setCurrentSection("chats")}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 px-6 py-2.5 text-sm font-semibold text-white transition"
              >
                <Plus className="h-4 w-4" />
                Add your contacts
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {currentSection === "chats" && (
          <>
            <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl px-8 py-4">
              <h2 className="text-xl font-bold text-white">Chats</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {selectedChat ? (
                <div className="flex h-full flex-col">
                  <div className="border-b border-white/10 bg-black/10 px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <button
                        type="button"
                        onClick={handleCloseDm}
                        className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </button>

                      <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
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

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{dmDisplayName}</p>
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
                        onClick={() => toast.info("Calling is coming soon.")}
                        className="inline-flex items-center justify-center rounded-xl bg-white/5 p-2.5 text-white/80 hover:bg-white/10 hover:text-white transition"
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

                  <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3">
                    {dmLoading ? (
                      <div className="text-sm text-white/60">Loading messages…</div>
                    ) : dmError ? (
                      <div className="text-sm text-red-200/80 whitespace-pre-line">{dmError}</div>
                    ) : dmMessages.length === 0 ? (
                      <div className="text-sm text-white/60">No messages yet. Say hi!</div>
                    ) : (
                      dmMessages.map((m) => {
                        const mine = m.sender_id === user?.id;
                        const mediaUrl = m.media_path ? dmMediaUrls[m.media_path] : null;
                        if (m.media_path && !mediaUrl) {
                          // Fire-and-forget signed URL resolution (renders once ready).
                          resolveMediaUrl(m.media_path).catch(() => {});
                        }

                        return (
                          <div
                            key={m.id}
                            className={`flex ${mine ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                mine
                                  ? "bg-pink-500/20 text-white"
                                  : "bg-white/5 text-white/90 border border-white/10"
                              }`}
                            >
                              {m.text ? <div className="whitespace-pre-wrap">{m.text}</div> : null}

                              {m.media_path ? (
                                <div className={m.text ? "mt-3" : ""}>
                                  {m.media_type === "image" ? (
                                    mediaUrl ? (
                                      <img
                                        src={mediaUrl}
                                        alt=""
                                        className="max-h-64 w-auto rounded-xl border border-white/10"
                                      />
                                    ) : (
                                      <div className="text-xs text-white/60">Loading image…</div>
                                    )
                                  ) : m.media_type === "video" ? (
                                    mediaUrl ? (
                                      <video
                                        src={mediaUrl}
                                        controls
                                        className="max-h-64 w-auto rounded-xl border border-white/10"
                                      />
                                    ) : (
                                      <div className="text-xs text-white/60">Loading video…</div>
                                    )
                                  ) : (
                                    <>
                                      {mediaUrl ? (
                                        <audio src={mediaUrl} controls className="w-full" />
                                      ) : (
                                        <div className="text-xs text-white/60">Loading audio…</div>
                                      )}
                                    </>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t border-white/10 bg-black/20 px-6 py-4">
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

                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <textarea
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder={recording ? "Recording voice…" : "Message"}
                          rows={1}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendDirectText();
                            }
                          }}
                          className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:bg-white/10 focus:border-white/20"
                        />
                      </div>

                      <motion.button
                        type="button"
                        onClick={() => dmFileInputRef.current?.click()}
                        disabled={pendingActionByUserId[dmTargetId] === "media"}
                        whileTap={{ scale: 0.96 }}
                        className="inline-flex items-center justify-center rounded-2xl bg-white/5 p-3 text-white/70 hover:bg-white/10 hover:text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                        title="Attach"
                      >
                        <Paperclip className="h-5 w-5" />
                      </motion.button>

                      <motion.button
                        type="button"
                        onClick={handleToggleRecording}
                        whileTap={{ scale: 0.96 }}
                        className={`inline-flex items-center justify-center rounded-2xl p-3 transition ${
                          recording
                            ? "bg-red-500/20 text-red-200 hover:bg-red-500/30"
                            : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
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
                        className="inline-flex items-center justify-center rounded-2xl bg-pink-500/20 p-3 text-pink-200 hover:bg-pink-500/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        title="Send"
                      >
                        <Send className="h-5 w-5" />
                      </motion.button>
                    </div>
                  </div>
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

                          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/60">
                            Pending
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {addedContacts.length > 0 ? (
                <div>
                  <div className="px-8 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Added Contacts ({addedContacts.length})
                  </div>
                  {addedContacts.map((contact) => (
                    <div key={contact.id} className="border-b border-white/10 px-8 py-4 hover:bg-white/5 cursor-pointer transition flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center overflow-hidden text-white text-sm font-semibold">
                          {contact.avatar_url ? (
                            <img
                              src={contact.avatar_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            getNameInitials(contact.name)
                          )}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{contact.name}</h3>
                          <p className="text-xs text-white/60 truncate">Say hi</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenDm(contact)}
                        className="px-4 py-2 bg-pink-500/20 text-pink-400 rounded text-xs font-semibold hover:bg-pink-500/30 transition"
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
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                  <div>
                    <p className="text-white font-semibold">John Doe</p>
                    <p className="text-xs text-white/60">Incoming • 2:45 PM</p>
                  </div>
                  <Phone className="h-5 w-5 text-pink-500" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                  <div>
                    <p className="text-white font-semibold">Jane Smith</p>
                    <p className="text-xs text-white/60">Outgoing • 1:20 PM</p>
                  </div>
                  <Phone className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </div>
          </>
        )}

        {currentSection === "contacts" && (
          <>
            <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl px-8 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Contacts</h2>
              <button className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-semibold transition">
                Import
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
                          <p className="text-xs text-white/60 truncate">Say hi</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenDm(contact)}
                        className="px-3 py-2 bg-pink-500/20 text-pink-200 rounded-lg text-xs font-semibold hover:bg-pink-500/30 transition"
                      >
                        Message
                      </button>
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
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              <div className="border-b border-white/10 pb-6">
                <h3 className="text-white font-semibold mb-3">Blocked Accounts</h3>
                <p className="text-white/60 text-sm">No blocked accounts</p>
              </div>
              <div className="border-b border-white/10 pb-6">
                <h3 className="text-white font-semibold mb-3">Restricted</h3>
                <p className="text-white/60 text-sm">No restricted accounts</p>
              </div>
              <div className="border-b border-white/10 pb-6">
                <h3 className="text-white font-semibold mb-3">Archived Chats</h3>
                <p className="text-white/60 text-sm">No archived chats</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3">Hide Your Status</h3>
                <button className="w-full px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg transition text-sm">
                  Status: Visible
                </button>
              </div>
            </div>
          </>
        )}

        {currentSection === "settings" && (
          <>
            <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl px-8 py-4">
              <h2 className="text-xl font-bold text-white">Settings</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
              <button className="w-full text-left p-4 rounded-lg hover:bg-white/5 transition">
                <p className="text-white font-semibold">Notifications</p>
                <p className="text-xs text-white/60">Manage notification settings</p>
              </button>
              <button className="w-full text-left p-4 rounded-lg hover:bg-white/5 transition">
                <p className="text-white font-semibold">Theme</p>
                <p className="text-xs text-white/60">Dark • Light • Auto</p>
              </button>
              <button className="w-full text-left p-4 rounded-lg hover:bg-white/5 transition">
                <p className="text-white font-semibold">Storage</p>
                <p className="text-xs text-white/60">Manage storage and cache</p>
              </button>
              <button className="w-full text-left p-4 rounded-lg hover:bg-white/5 transition">
                <p className="text-white font-semibold">About</p>
                <p className="text-xs text-white/60">App version and info</p>
              </button>
              <button onClick={() => navigate("/account")} className="w-full text-left p-4 rounded-lg hover:bg-white/5 transition">
                <p className="text-white font-semibold">Account</p>
                <p className="text-xs text-white/60">Manage your account</p>
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
    </div>
  );
}
