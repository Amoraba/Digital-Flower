import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  Music,
  Mic,
  Square,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  Copy,
  Share2,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  CreditCard,
  Gift as GiftIcon,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  MessageSquare,
  User,
  Calendar,
  Layers,
  Palette,
  Phone,
  QrCode,
  ArrowRight,
  ExternalLink,
  Shield,
} from "lucide-react";
import {
  type OccasionType,
  type FlowerType,
  type ColorType,
  type Gift,
  MUSIC_LIBRARY,
  OCCASIONS,
  FLOWERS,
  COLORS,
  FLOWER_COLORS,
} from "./types";
import FlowerRenderer from "./components/FlowerRenderer";
import { globalSynthesizer } from "./lib/WebSynthesizer";

const base64ToBlobUrl = (base64DataUrl: string): string => {
  try {
    const parts = base64DataUrl.split(";base64,");
    if (parts.length < 2) return base64DataUrl;
    const contentType = parts[0].split(":")[1] || "audio/webm";
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    const blob = new Blob([uInt8Array], { type: contentType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error converting base64 to Blob URL:", error);
    return base64DataUrl;
  }
};

export default function App() {
  // Navigation & View States
  // 'intro' | 'create' | 'preview' | 'share' | 'recipient'
  const [view, setView] = useState<"intro" | "create" | "preview" | "share" | "recipient">("intro");
  const [giftId, setGiftId] = useState<string>("");
  const [recipientGift, setRecipientGift] = useState<Gift | null>(null);
  const [isLoadingGift, setIsLoadingGift] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);

  const showNotification = (message: string, type: "error" | "success" | "info" = "error") => {
    setNotification({ message, type });
    const timer = setTimeout(() => {
      setNotification((curr) => curr?.message === message ? null : curr);
    }, 4500);
  };

  const [shortUrlStyle, setShortUrlStyle] = useState<boolean>(true);
  const [customShareMsg, setCustomShareMsg] = useState<string>("");

  // Form Creation States
  const [occasion, setOccasion] = useState<OccasionType>("Love");
  const [flowerType, setFlowerType] = useState<FlowerType>("Rose");
  const [flowerColor, setFlowerColor] = useState<ColorType>("Red");
  const [recipientName, setRecipientName] = useState<string>("");
  const [senderName, setSenderName] = useState<string>("");
  const [personalMessage, setPersonalMessage] = useState<string>("");
  const [musicCategory, setMusicCategory] = useState<string>("Perfect");
  const [musicTrack, setMusicTrack] = useState<string>("perfect_sine");

  // Audio Previews & Synthesis
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);

  // Voice Note Recording
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [voiceBase64, setVoiceBase64] = useState<string | undefined>(undefined);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isVoicePlaying, setIsVoicePlaying] = useState<boolean>(false);
  const [voicePlaybackProgress, setVoicePlaybackProgress] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const voicePlayerRef = useRef<HTMLAudioElement | null>(null);

  // General Notification / Actions
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);

  // Detect Recipient Flow on load
  useEffect(() => {
    const handleRouting = async () => {
      // Check for path e.g. /gift/123xyz
      const path = window.location.pathname;
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);

      let targetId = "";

      if (path.startsWith("/gift/")) {
        targetId = path.split("/gift/")[1]?.trim();
      } else if (path.startsWith("/g/")) {
        targetId = path.split("/g/")[1]?.trim();
      } else if (hash.startsWith("#/gift/")) {
        targetId = hash.split("#/gift/")[1]?.trim();
      } else if (hash.startsWith("#/g/")) {
        targetId = hash.split("#/g/")[1]?.trim();
      } else if (params.get("giftId")) {
        targetId = params.get("giftId") || "";
      } else if (params.get("gift")) {
        targetId = params.get("gift") || "";
      } else if (params.get("g")) {
        targetId = params.get("g") || "";
      }

      if (targetId) {
        setGiftId(targetId);
        setIsLoadingGift(true);
        try {
          const res = await fetch(`/api/gifts/${targetId}`);
          if (res.ok) {
            const data = await res.json();
            setRecipientGift(data);
            setView("recipient");
            // Automatically select correct track but don't autoplay until user clicks to prevent browser blocks
            setMusicCategory(data.musicCategory);
            setMusicTrack(data.musicTrack);
          } else {
            setErrorMessage("This digital flower gift could not be found. Please check your link or send a new one.");
          }
        } catch (err) {
          setErrorMessage("Network error trying to look up the gift.");
        } finally {
          setIsLoadingGift(false);
        }
      }
    };

    handleRouting();
    window.addEventListener("popstate", handleRouting);
    return () => window.removeEventListener("popstate", handleRouting);
  }, []);

  // Music tracking category switcher helper
  useEffect(() => {
    // Pick the first default track of the category if category shifts
    const categoryObj = MUSIC_LIBRARY.find((c) => c.id === musicCategory);
    if (categoryObj && categoryObj.tracks.length > 0) {
      const match = categoryObj.tracks.find((t) => t.id === musicTrack);
      if (!match) {
        setMusicTrack(categoryObj.tracks[0].id);
      }
    }
  }, [musicCategory]);

  // Synchronize custom sharing message when names or link style change
  useEffect(() => {
    if (giftId) {
      const link = shortUrlStyle
        ? `${window.location.origin}/g/${giftId}`
        : `${window.location.origin}/gift/${giftId}`;
      const nameTag = senderName ? `from ${senderName}` : "from a special friend";
      const defaultText = `🌸 Hey ${recipientName || 'there'}! You've received a virtual flower gift ${nameTag}! Note: This card is active and can only be opened within a limited time window, so check it out before it expires: ${link}`;
      setCustomShareMsg(defaultText);
    }
  }, [giftId, recipientName, senderName, shortUrlStyle]);

  // Sync music state
  useEffect(() => {
    if (isMusicPlaying) {
      globalSynthesizer.play(musicCategory, musicTrack);
    } else {
      globalSynthesizer.stop();
    }
    return () => {
      globalSynthesizer.stop();
    };
  }, [isMusicPlaying, musicCategory, musicTrack]);

  // Voice player progress interval
  useEffect(() => {
    let interval: any;
    if (isVoicePlaying && voicePlayerRef.current) {
      interval = setInterval(() => {
        if (voicePlayerRef.current) {
          const current = voicePlayerRef.current.currentTime;
          const duration = voicePlayerRef.current.duration || 60;
          setVoicePlaybackProgress((current / duration) * 100);
          if (voicePlayerRef.current.ended) {
            setIsVoicePlaying(false);
            setVoicePlaybackProgress(0);
          }
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isVoicePlaying]);

  // Voice note recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
    return () => clearInterval(recordingTimerRef.current);
  }, [isRecording]);

  // MediaRecorder audio capture
  const startRecording = async () => {
    try {
      setVoiceBase64(undefined);
      setAudioUrl(null);
      setRecordingDuration(0);
      audioChunksRef.current = [];

      // Dynamic check for best supported mimeType
      let selectedMimeType = "";
      const mimeTypesToTry = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
        "audio/aac",
        "audio/wav"
      ];
      
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported) {
        for (const mime of mimeTypesToTry) {
          if (MediaRecorder.isTypeSupported(mime)) {
            selectedMimeType = mime;
            break;
          }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = selectedMimeType ? { mimeType: selectedMimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Convert to Base64 to send to back-end
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setVoiceBase64(base64data);
        };

        // Turn off microphone streams
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start with timeslices of 250ms for highly responsive mobile browsers
      mediaRecorder.start(250);
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to access microphone", err);
      showNotification("Microphone permission was denied or is not supported/allowed on this browser.", "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playVoiceNote = () => {
    let playUrl = audioUrl;
    
    if (!playUrl && recipientGift?.voiceNoteBase64) {
      // Decode base64 to Blob URL to play safely on iOS/mobile browsers
      playUrl = base64ToBlobUrl(recipientGift.voiceNoteBase64);
    }

    if (playUrl) {
      if (!voicePlayerRef.current || voicePlayerRef.current.src !== playUrl) {
        if (voicePlayerRef.current) {
          voicePlayerRef.current.pause();
        }
        voicePlayerRef.current = new Audio(playUrl);
        
        // Add solid state event listeners
        voicePlayerRef.current.addEventListener("ended", () => {
          setIsVoicePlaying(false);
          setVoicePlaybackProgress(0);
        });
        voicePlayerRef.current.addEventListener("pause", () => {
          setIsVoicePlaying(false);
        });
        voicePlayerRef.current.addEventListener("play", () => {
          setIsVoicePlaying(true);
        });
      }

      if (isVoicePlaying) {
        voicePlayerRef.current.pause();
      } else {
        voicePlayerRef.current.play().catch((err) => {
          console.error("Playback failed or blocked on mobile device:", err);
          setIsVoicePlaying(false);
        });
      }
    }
  };

  const deleteVoiceNote = () => {
    if (voicePlayerRef.current) {
      voicePlayerRef.current.pause();
      voicePlayerRef.current = null;
    }
    setVoiceBase64(undefined);
    setAudioUrl(null);
    setRecordingDuration(0);
    setIsVoicePlaying(false);
    setVoicePlaybackProgress(0);
  };

  // Submit flow: Create pending gift
  const handleProceedToPreview = () => {
    if (!recipientName.trim()) {
      showNotification("Please provide the Recipient's Name.", "error");
      return;
    }
    if (!personalMessage.trim()) {
      showNotification("Please write a meaningful Personal Message.", "error");
      return;
    }
    setView("preview");
  };

  const handleCreateGiftDatabase = async () => {
    try {
      const giftPayload: Gift = {
        occasion,
        flowerType,
        flowerColor,
        recipientName,
        senderName: senderName || "Someone Special",
        personalMessage,
        voiceNoteBase64: voiceBase64,
        musicCategory,
        musicTrack,
      };

      const res = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(giftPayload),
      });

      if (res.ok) {
        const result = await res.json();
        setGiftId(result.id);
        setView("share");
        showNotification("Gift bouquet created successfully!", "success");
      } else {
        const err = await res.json();
        showNotification(err.error || "Unable to save gift. Please try again.", "error");
      }
    } catch (error) {
      showNotification("Error sending gift payload to server.", "error");
    }
  };

  const startNewGiftCreator = () => {
    globalSynthesizer.stop();
    window.location.hash = "";
    window.history.pushState({}, "", "/");
    
    // Reset recipient view states
    setRecipientGift(null);
    setGiftId("");
    
    // Clear creator state so they start clean
    setOccasion("Love");
    setFlowerType("Rose");
    setFlowerColor("Red");
    setRecipientName("");
    setSenderName("");
    setPersonalMessage("");
    setVoiceBase64(undefined);
    setAudioUrl(null);
    setRecordingDuration(0);
    setIsMusicPlaying(false);
    setIsVoicePlaying(false);
    setVoicePlaybackProgress(0);
    
    // Transition to the creation view
    setView("create");
  };

  // Copy share link helper
  const getGiftLink = () => {
    if (shortUrlStyle) {
      return `${window.location.origin}/g/${giftId}`;
    }
    return `${window.location.origin}/gift/${giftId}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getGiftLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyFullMessage = () => {
    navigator.clipboard.writeText(customShareMsg);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleShare = (medium: "whatsapp" | "messenger" | "email" | "sms") => {
    const link = getGiftLink();
    const textMsg = encodeURIComponent(customShareMsg || `🎁 I sent you a personalized interactive Digital Flower gift! Open it here to feel the breeze: ${link}`);
    const shareUrl = encodeURIComponent(link);

    let finalUrl = "";
    switch (medium) {
      case "whatsapp":
        finalUrl = `https://api.whatsapp.com/send?text=${textMsg}`;
        break;
      case "messenger":
        finalUrl = `fb-messenger://share/?link=${shareUrl}`;
        break;
      case "email":
        const emailSubject = encodeURIComponent(senderName ? `${senderName} sent you a beautiful Digital Flower!` : "A personalized flower gift for you");
        finalUrl = `mailto:?subject=${emailSubject}&body=${textMsg}`;
        break;
      case "sms":
        finalUrl = `sms:?&body=${textMsg}`;
        break;
    }

    window.open(finalUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-rose-100 selection:text-rose-950">
      {/* Decorative top romantic flow banner */}
      <div className="h-1.5 w-full bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 pointer-events-none" />

      {/* Main Sticky Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-rose-50 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {view !== "intro" && (
              <button
                onClick={() => {
                  if (view === "create") {
                    setView("intro");
                  } else if (view === "preview") {
                    setView("create");
                  } else if (view === "share") {
                    setView("preview");
                  } else if (view === "recipient") {
                    globalSynthesizer.stop();
                    setRecipientGift(null);
                    setGiftId("");
                    window.location.hash = "";
                    window.history.pushState({}, "", "/");
                    setView("intro");
                  }
                }}
                className="flex items-center space-x-1 text-slate-600 hover:text-rose-600 transition-colors font-semibold text-xs bg-slate-100 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-200 cursor-pointer shadow-sm"
                id="global-header-back-btn"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={() => {
                if (view === "intro") return;
                setView("intro");
              }}
              className="flex items-center space-x-2 text-rose-600 hover:text-rose-700 font-bold transition-all"
              id="header-home-btn"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center p-1 shadow-md shadow-rose-300">
                <Sparkles className="text-white w-4 h-4 animate-pulse" />
              </div>
              <span className="tracking-tight text-lg font-serif">Digital Flowers</span>
              <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-sans font-medium uppercase tracking-widest scale-90">MVP</span>
            </button>
          </div>

          {/* Music Controller in Header when applicable */}
          {view !== "share" && view !== "payment" && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMusicPlaying(!isMusicPlaying)}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full font-medium text-xs transition-all ${
                isMusicPlaying
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-transparent"
              }`}
              id="top-music-btn"
            >
              {isMusicPlaying ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
                  <span className="hidden sm:inline">Playing Preview</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Preview Music</span>
                </>
              )}
            </motion.button>
          )}
        </div>
      </header>

      {/* Primary body view content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-center">
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-md mx-auto my-12" id="error-screen">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto mb-4">
              <GiftIcon className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Flower Gift Unavailable</h2>
            <p className="text-slate-600 text-sm mb-6">{errorMessage}</p>
            <button
              onClick={() => {
                setErrorMessage(null);
                setView("create");
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-xl text-sm transition-all shadow-sm"
            >
              Send a New Flower Gift
            </button>
          </div>
        )}

        {isLoadingGift && (
          <div className="text-center py-20" id="loading-screen">
            <div className="inline-block relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-rose-200 rounded-full animate-ping" />
              <div className="absolute inset-2 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="mt-6 text-slate-500 text-sm font-medium animate-pulse">Unfolding digital bouquet details...</p>
          </div>
        )}

        {!isLoadingGift && !errorMessage && (
          <AnimatePresence mode="wait">
            {/* INTRO LANDING MODULE */}
            {view === "intro" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-2xl mx-auto my-6 sm:my-10 space-y-10 text-center py-6 px-4 sm:px-6"
                id="intro-container"
              >
                {/* Visual Premium Flower Miniature Showcase */}
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-rose-200 rounded-full blur-3xl opacity-40 scale-150 animate-pulse pointer-events-none" />
                  <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-rose-100/40 to-pink-50/40 border-2 border-rose-100/50 flex items-center justify-center mx-auto shadow-sm p-4 backdrop-blur-sm">
                    <FlowerRenderer flowerType="Rose" colorName="Red" isBlooming={true} />
                  </div>
                </div>

                {/* Taglines and Description */}
                <div className="space-y-4">
                  <span className="text-rose-500 text-xs sm:text-sm font-extrabold uppercase tracking-widest font-sans inline-block bg-rose-50/80 px-4 py-1.5 rounded-full border border-rose-100">
                    Virtual Flower Cards
                  </span>
                  <h1 className="text-4xl sm:text-5xl font-serif text-slate-900 tracking-tight leading-tight font-medium max-w-lg mx-auto">
                    Send a little love, instantly.
                  </h1>
                  <p className="text-slate-600 text-xs sm:text-base max-w-lg mx-auto leading-relaxed">
                    Create a beautiful digital flower card for someone special. Add a personal message, record your voice, and choose the perfect melody to create a gift they'll never forget.
                  </p>
                </div>

                {/* Call To Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto">
                  <button
                    onClick={() => setView("create")}
                    className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-serif font-bold px-8 py-4 rounded-2xl shadow-md shadow-rose-200 hover:shadow-lg transition-all flex items-center justify-center space-x-2 text-base active:scale-[0.98] cursor-pointer"
                    id="intro-start-btn"
                  >
                    <span>Create a Flower Card</span>
                    <ArrowRight className="w-5 h-5 pointer-events-none" />
                  </button>
                </div>

                {/* Core Minimal Qualities Grid - 4 Columns/Grid items for requested sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-slate-100 max-w-2xl mx-auto text-left">
                  <div className="p-4 bg-white/50 rounded-2xl border border-rose-50/50 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shadow-inner text-lg">
                      🌹
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-serif font-bold text-slate-800">Choose Your Blooms</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">Pick from a collection of beautifully illustrated flowers including Roses, Tulips, Orchids, Lotuses, Daisies, and Sunflowers.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white/50 rounded-2xl border border-rose-50/50 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shadow-inner text-lg">
                      🎙️
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-serif font-bold text-slate-800">Add Your Voice</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">Record a heartfelt message directly from your browser and make your gift feel truly personal.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white/50 rounded-2xl border border-rose-50/50 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shadow-inner text-lg">
                      🎵
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-serif font-bold text-slate-800">Set the Mood</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">Select a cozy soundtrack that plays when your flower card is opened, creating a magical moment for your recipient.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white/50 rounded-2xl border border-rose-50/50 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shadow-inner text-lg">
                      ✨
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-serif font-bold text-slate-800">Made for Meaningful Moments</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">Birthdays, anniversaries, celebrations, apologies, or just because—send a thoughtful surprise in seconds, anywhere in the world.</p>
                    </div>
                  </div>
                </div>

                {/* Footer Section exactly matches prompt layout spec */}
                <div className="pt-10 border-t border-slate-100 max-w-md mx-auto space-y-3">
                  <div className="h-px bg-slate-100 w-16 mx-auto" />
                  <p className="text-xs font-semibold text-slate-400 font-sans tracking-wide uppercase">Digital Flowers Portal &copy; 2026</p>
                  <p className="text-xs text-slate-400 italic">Helping people share love, gratitude, and beautiful moments&mdash;one digital flower at a time.</p>
                </div>
              </motion.div>
            )}

            {/* 1. SENDER EXPERIENCE - CREATE MODULE */}
            {view === "create" && (
              <motion.div
                key="create"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-4"
                id="create-container"
              >
                {/* Left side: Pure interactive premium live canvas */}
                <div className="lg:col-span-5 bg-white border border-rose-100 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-between relative order-last lg:order-first">
                  <div className="absolute top-4 left-4 z-20 bg-rose-50 px-3 py-1 rounded-full text-xs font-semibold text-rose-700 border border-rose-100 animate-pulse">
                    Live Bouquet Canvas
                  </div>

                  <div className="w-full py-8">
                    <FlowerRenderer flowerType={flowerType} colorName={flowerColor} isBlooming={true} />
                  </div>

                  <div className="w-full space-y-2 text-center mt-4">
                    <h3 className="font-serif font-semibold text-lg text-slate-900">
                      {flowerColor} {flowerType === "Mixed Bouquet" ? "Bouquet" : flowerType}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      {flowerType === "Rose" && "A timeless symbol of love, romance, and beautiful appreciation."}
                      {flowerType === "Tulip" && "Represents deep, perfect, and elegant loving memories."}
                      {flowerType === "Sunflower" && "Gradients of warmth, bright sunshine, adoration, and longevity."}
                      {flowerType === "Orchid" && "Exquisite style, luxury, pure wisdom, and unique strength."}
                      {flowerType === "Daisy" && "Cheerful simplicity, new beginnings, and loyal, honest friendship."}
                      {flowerType === "Lotus" && "Exemplifies rising above difficulties, purity, and peaceful rebirth."}
                      {flowerType === "Cherry Blossom" && "Captures the delicate bloom of transient moments and beauty."}
                      {flowerType === "Mixed Bouquet" && "A splendid blend of premium seasonal colors and textures."}
                    </p>
                  </div>
                </div>

                {/* Right side: Tailored Gift Creator Panel */}
                <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex flex-col space-y-3">
                    <button
                      onClick={() => {
                        setView("intro");
                      }}
                      className="inline-flex items-center space-x-1 text-slate-400 hover:text-rose-600 font-semibold text-xs self-start transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back to Welcome</span>
                    </button>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-serif text-slate-900 tracking-tight font-medium">
                        Send Elegant Flowers
                      </h1>
                      <p className="text-slate-500 text-xs sm:text-sm mt-1">
                        Customize a premium virtual flower card, attach a genuine voice note, and loop soft synthesizer background melodies to warm someone's day.
                      </p>
                    </div>
                  </div>

                  {/* STEP A: Select Occasions, Flowers & Colors */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5 mb-2">
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span>1. Select Occasion</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {OCCASIONS.map((occ) => (
                          <button
                            key={occ}
                            onClick={() => setOccasion(occ)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                              occasion === occ
                                ? "bg-rose-500 text-white font-bold"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            }`}
                          >
                            {occ}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5 mb-2">
                          <Layers className="w-3.5 h-3.5 text-rose-500" />
                          <span>2. Flower Breed</span>
                        </label>
                        <select
                          value={flowerType}
                          onChange={(e) => setFlowerType(e.target.value as FlowerType)}
                          className="w-full bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
                          id="flower-select"
                        >
                          {FLOWERS.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5 mb-2">
                          <Palette className="w-3.5 h-3.5 text-rose-500" />
                          <span>3. Flower Color</span>
                        </label>
                        <select
                          value={flowerColor}
                          onChange={(e) => setFlowerColor(e.target.value as ColorType)}
                          className="w-full bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
                          id="color-select"
                        >
                          {COLORS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* STEP B: Recipient and Message details */}
                  <div className="space-y-4 border-t border-slate-100 pt-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center mb-1.5 space-x-1">
                          <User className="w-3.5 h-3.5" />
                          <span>Recipient Name *</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Grandma, My Love"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none"
                          maxLength={50}
                          id="recipient-name-input"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center mb-1.5 space-x-1">
                          <span>Sender Name (Optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Alex, Anonymous"
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none"
                          maxLength={50}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Personal Message * (Limit 500 chars)</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">{personalMessage.length}/500</span>
                      </div>
                      <textarea
                        required
                        rows={3}
                        placeholder="Write something cozy, emotional, or encouraging here..."
                        value={personalMessage}
                        onChange={(e) => setPersonalMessage(e.target.value.substring(0, 500))}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-3 py-2 text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none resize-none leading-relaxed"
                        id="personal-message-input"
                      />
                    </div>
                  </div>

                  {/* STEP C: Record Voice Annotation (Optional) */}
                  <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Mic className="w-4 h-4 text-rose-600 animate-pulse" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Optional: Voice Memo Note</h4>
                      </div>
                      {recordingDuration > 0 && (
                        <span className="text-xs font-mono font-bold text-rose-600">
                          {recordingDuration}s / 60s
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Express your affection in your own words. Record up to 60 seconds of gentle sounds, music, or poetry.
                    </p>

                    <div className="flex items-center space-x-3">
                      {!isRecording && !voiceBase64 && (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-md shadow-rose-200 transition-all"
                          id="record-btn"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>Record Voice Memo</span>
                        </button>
                      )}

                      {isRecording && (
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 animate-pulse text-white font-medium text-xs transition-all"
                          id="stop-record-btn"
                        >
                          <Square className="w-3.5 h-3.5" />
                          <span>Stop Recording</span>
                        </button>
                      )}

                      {voiceBase64 && (
                        <div className="w-full flex items-center justify-between bg-white border border-rose-100 rounded-xl p-2">
                          <button
                            type="button"
                            onClick={playVoiceNote}
                            className="w-8 h-8 rounded-full bg-rose-100 hover:bg-rose-200 flex items-center justify-center text-rose-700 transition-all"
                            id="play-memo-btn"
                          >
                            {isVoicePlaying ? <Pause className="w-4.5 h-4.5" /> : <Play className="w-4.5 h-4.5 pl-0.5" />}
                          </button>

                          <div className="flex-1 mx-3 h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
                            <div
                              className="absolute left-0 top-0 h-full bg-rose-500 transition-all duration-100"
                              style={{ width: `${voicePlaybackProgress}%` }}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={deleteVoiceNote}
                            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all"
                            id="delete-memo-btn"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* STEP D: Loop beautiful song tracks */}
                  <div className="space-y-3.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                      <Music className="w-3.5 h-3.5 text-rose-500" />
                      <span>4. Select a Cozy Instrumental Cover</span>
                    </label>
                    <p className="text-xs text-slate-400 -mt-1 leading-relaxed">
                      Choose a soft music-box song cover to play in the background when your receiver opens the card.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {MUSIC_LIBRARY.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            setMusicCategory(category.id);
                            // Auto select first track of newly selected song category
                            const trackingId = category.tracks[0]?.id || "";
                            setMusicTrack(trackingId);
                            setIsMusicPlaying(true);
                          }}
                          className={`p-3 rounded-2xl border text-left transition-all relative flex items-center justify-between ${
                            musicCategory === category.id
                              ? "bg-rose-50 border-rose-300 ring-1 ring-rose-400"
                              : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                          }`}
                        >
                          <div className="space-y-0.5 pr-2">
                            <div className="text-xs font-bold text-slate-800">{category.name}</div>
                            <div className="text-[10px] text-slate-400 italic font-medium">Ambient instrument style</div>
                          </div>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors shadow-inner ${
                            musicCategory === category.id ? "bg-rose-500 text-white" : "bg-slate-200 text-slate-400"
                          }`}>
                            🎵
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-slate-700 block">Fine-tune acoustic instrument timbre:</span>
                        <span className="text-[10px] text-slate-400 block">Choose between warm dream acoustics or vintage retro synthesizers.</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        {MUSIC_LIBRARY.find((c) => c.id === musicCategory)?.tracks.map((track) => (
                          <button
                            key={track.id}
                            onClick={() => {
                              setMusicTrack(track.id);
                              setIsMusicPlaying(true);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                              musicTrack === track.id
                                ? "bg-slate-950 text-white shadow-sm"
                                : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {track.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* PROCEED TRIGGER */}
                  <button
                    onClick={handleProceedToPreview}
                    className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-rose-200 flex items-center justify-center space-x-2 transition-all group font-serif text-base"
                    id="preview-btn"
                  >
                    <span>Preview Live Flower Gift</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* 2. RECIPIENT LAYOUT EXACT PREVIEW (SENDER REVIEW STATE) */}
            {view === "preview" && (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-xl mx-auto my-6 space-y-4"
                id="preview-container"
              >
                <div className="flex items-center justify-between px-2">
                  <button
                    onClick={() => {
                      globalSynthesizer.stop();
                      setView("create");
                    }}
                    className="inline-flex items-center space-x-1 text-slate-500 hover:text-rose-600 font-semibold text-xs transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Back to Editing Bouquet</span>
                  </button>
                </div>

                <div className="bg-slate-900/5 hover:bg-slate-900/10 transition-all border border-rose-200 text-amber-900 px-4 py-3 rounded-2xl text-xs flex items-center justify-between font-serif">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                    <span>You are enjoying a **Sender Preview** exactly as they will open it!</span>
                  </div>
                  <button onClick={() => setView("create")} className="text-rose-600 font-bold hover:underline">
                    Edit Bouquet
                  </button>
                </div>

                {/* Recipient Experience Container */}
                <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-[40px] shadow-2xl overflow-hidden border border-slate-800 p-6 sm:p-10 text-white relative">
                  <div className="absolute top-6 left-6 z-20 text-[10px] text-slate-400 font-bold tracking-widest uppercase bg-white/5 border border-white/10 px-2.5 py-1 rounded-full flex items-center space-x-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active Envelope</span>
                  </div>

                  {/* Static dynamic bloom visual */}
                  <div className="py-6 flex justify-center">
                    <FlowerRenderer flowerType={flowerType} colorName={flowerColor} isBlooming={true} />
                  </div>

                  {/* Letter Envelope Frame */}
                  <div className="bg-white text-slate-800 mt-6 rounded-3xl p-6 shadow-xl space-y-5 border border-amber-50 relative overflow-hidden">
                    {/* Retro floral pattern header decoration */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 via-rose-300 to-indigo-300 absolute top-0 left-0" />

                    <div className="space-y-1.5">
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black flex items-center space-x-1 justify-between">
                        <span>Sentiment Card</span>
                        <span>{new Date().toLocaleDateString(undefined, { dateStyle: "long" })}</span>
                      </div>
                      <h2 className="text-2xl font-serif text-slate-900">
                        Dear {recipientName || "Beloved"},
                      </h2>
                    </div>

                    <p className="text-sm text-slate-700 italic font-medium leading-relaxed font-serif tracking-wide border-l-2 border-rose-300 pl-4">
                      "{personalMessage || "Your customized text note will appear right here."}"
                    </p>

                    {/* Show voice Memo player only if created */}
                    {voiceBase64 && (
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center space-x-4">
                        <button
                          onClick={playVoiceNote}
                          className="w-11 h-11 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-100 transition-all"
                        >
                          {isVoicePlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 pl-0.5" />}
                        </button>
                        <div className="flex-1 space-y-1">
                          <span className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                            <Mic className="w-3 h-3 text-red-500 animate-pulse" />
                            <span>Play Sender's Voice Memo</span>
                          </span>
                          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden relative">
                            <div
                              className="absolute left-0 top-0 h-full bg-rose-500 transition-all"
                              style={{ width: `${voicePlaybackProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-right text-xs pt-4 border-t border-slate-100">
                      <span className="text-slate-400">With beautiful blessings from: </span>
                      <span className="font-serif font-bold text-slate-800 text-sm">
                        {senderName || "Unknown Special Friend"}
                      </span>
                    </div>
                  </div>

                  {/* Floating ambient theme prompt */}
                  <div className="mt-8 text-center text-xs text-slate-400 italic">
                    ♬ Cozy Soundtrack Playing: "{MUSIC_LIBRARY.find((c) => c.id === musicCategory)?.name || musicCategory} • {MUSIC_LIBRARY.find((c) => c.id === musicCategory)?.tracks.find((t) => t.id === musicTrack)?.title || musicTrack}"
                  </div>
                </div>

                {/* SENDER STAGE ACTIONS */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      globalSynthesizer.stop();
                      setView("create");
                    }}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium py-3 rounded-2xl transition-all flex items-center justify-center space-x-1"
                    id="back-create-btn"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to Editing</span>
                  </button>

                  <button
                    onClick={handleCreateGiftDatabase}
                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-serif font-bold py-3 rounded-2xl shadow-md space-x-1.5 flex items-center justify-center transition-all animate-pulse"
                    id="generate-link-btn"
                  >
                    <Send className="w-4 h-4" />
                    <span>Generate Shareable Link</span>
                  </button>
                </div>
              </motion.div>
            )}



            {/* 4. SHAREABLE LINK CREATION PANEL */}
            {view === "share" && (
              <motion.div
                key="share"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-lg mx-auto my-8 bg-white border border-rose-100 rounded-[32px] p-6 sm:p-8 shadow-xl space-y-6"
                id="share-panel"
              >
                <button
                  onClick={() => setView("preview")}
                  className="inline-flex items-center space-x-1 text-slate-500 hover:text-rose-600 font-semibold text-xs transition-colors self-start pb-2"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back to Preview</span>
                </button>

                <div className="text-center space-y-2 justify-center flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner shadow-rose-200">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-serif text-slate-900 font-bold">Your Flower Gift is Ready!</h2>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Set up your message flow below. We have automatically crafted a safe invite stating your name so they can open your gift securely.
                  </p>
                </div>

                {/* Short URL Customize Switch */}
                <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-slate-800 block">Use Short/Compact Link Format</label>
                    <span className="text-[10px] text-slate-400 block font-normal leading-tight"> Removes deep nested paths to keep links clean </span>
                  </div>
                  <button 
                    onClick={() => setShortUrlStyle(!shortUrlStyle)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 outline-none flex items-center ${shortUrlStyle ? 'bg-rose-500' : 'bg-slate-300'}`}
                  >
                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-200 ease-out ${shortUrlStyle ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Customizable Message Composer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">Compose Greeting Card Invite:</label>
                    <span className="text-[10px] font-mono text-slate-400">{customShareMsg.length} characters</span>
                  </div>
                  <textarea
                    value={customShareMsg}
                    onChange={(e) => setCustomShareMsg(e.target.value)}
                    rows={4}
                    className="w-full text-xs font-serif bg-slate-50 hover:bg-slate-50/70 focus:bg-white border focus:border-rose-400 border-slate-200 rounded-2xl p-4 text-slate-700 leading-relaxed focus:outline-none focus:ring-1 focus:ring-rose-200 resize-none transition-all shadow-inner"
                    placeholder="Write a custom share greeting card message..."
                  />
                </div>

                {/* Copy Utilities Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleCopyFullMessage}
                    className={`flex items-center justify-center space-x-1.5 py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                      copiedMessage
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-rose-500 hover:bg-rose-600 border-rose-400 text-white"
                    }`}
                  >
                    {copiedMessage ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Copied Message & Link!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Message & Link</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className={`flex items-center justify-center space-x-1.5 py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                      copied
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-slate-900 hover:bg-slate-800 border-slate-950 text-white"
                    }`}
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Copied Link!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Just Link</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Instant Social Sharing Buttons */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
                    Instant Social Delivery
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleShare("whatsapp")}
                      className="flex items-center justify-center space-x-1.5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-serif font-bold text-xs shadow-md transition-all"
                      id="share-whatsapp"
                    >
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={() => handleShare("messenger")}
                      className="flex items-center justify-center space-x-1.5 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-serif font-bold text-xs shadow-md transition-all"
                      id="share-messenger"
                    >
                      <span>Messenger</span>
                    </button>
                    <button
                      onClick={() => handleShare("email")}
                      className="flex items-center justify-center space-x-1.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-serif font-bold text-xs shadow-md transition-all"
                      id="share-email"
                    >
                      <span>Email Delivery</span>
                    </button>
                    <button
                      onClick={() => handleShare("sms")}
                      className="flex items-center justify-center space-x-1.5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-serif font-bold text-xs shadow-md transition-all"
                      id="share-sms"
                    >
                      <span>SMS / Text</span>
                    </button>
                  </div>
                </div>

                {/* Informative Security Notice Area */}
                <div className="bg-amber-50/60 border border-amber-200/40 rounded-2xl p-4 space-y-1.5 text-amber-950">
                  <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
                    <Shield className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                    <span>Security & Access Advice</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    <strong>Why does the link sometimes request authentication?</strong> Because this is your secure, private sandboxed development staging domain. To share your interactive flower gift publicly with anyone on any machine with <strong>zero authentication barriers</strong>, simply click <strong>Publish/Deploy</strong> on the AI Studio platform to obtain a standard public production link!
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Curious what it looks like?</span>
                  <a
                    href={getGiftLink()}
                    target="_blank"
                    rel="noreferrer"
                    className="text-rose-600 hover:text-rose-700 font-bold hover:underline inline-flex items-center space-x-1"
                  >
                    <span>Open recipient view</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <button
                  onClick={startNewGiftCreator}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs py-3 rounded-xl font-medium cursor-pointer"
                >
                  Send another bouquet gift
                </button>
              </motion.div>
            )}

            {/* 5. RECIPIENT IMMERSIVE LANDING EXPERIENCE */}
            {view === "recipient" && recipientGift && (
              <motion.div
                key="recipient"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-xl mx-auto my-4 space-y-4"
                id="recipient-container"
              >
                <div className="flex items-center justify-between px-2">
                  <button
                    onClick={startNewGiftCreator}
                    className="inline-flex items-center space-x-1 text-slate-400 hover:text-rose-600 transition-colors font-semibold text-xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Back to Home Portal</span>
                  </button>
                </div>

                {/* Immersive Mobile-Handheld container */}
                <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-[44px] shadow-2xl overflow-hidden border border-slate-800 p-6 sm:p-10 relative text-white">
                  
                  {/* Music play notice button overlay banner */}
                  {!isMusicPlaying && (
                    <motion.div
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-8 text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6 animate-pulse">
                        <GiftIcon className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-serif font-bold text-white mb-2">
                        You've received a flower gift!
                      </h3>
                      <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-8">
                        {recipientGift.senderName} sent you a beautiful personalized dynamic flower with soothing audio loops. Click to enjoy.
                      </p>
                      
                      <button
                        onClick={() => {
                          setIsMusicPlaying(true);
                        }}
                        className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-serif font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-rose-500/20 text-base flex items-center space-x-2 transition-all hover:scale-[1.03]"
                        id="open-gift-btn"
                      >
                        <Sparkles className="w-5 h-5" />
                        <span>Unfold Flower Gift</span>
                      </button>
                    </motion.div>
                  )}

                  {/* Header metadata */}
                  <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase tracking-widest font-bold border-b border-white/5 pb-4 mb-4">
                    <span>Digital Flower Bouquet</span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {recipientGift.createdAt
                          ? new Date(recipientGift.createdAt).toLocaleDateString(undefined, { dateStyle: "long" })
                          : new Date().toLocaleDateString(undefined, { dateStyle: "long" })}
                      </span>
                    </span>
                  </div>

                  {/* Blooming interactive Flower in selected style and color! */}
                  <div className="py-6 flex justify-center">
                    <FlowerRenderer
                      flowerType={recipientGift.flowerType}
                      colorName={recipientGift.flowerColor}
                      isBlooming={isMusicPlaying}
                    />
                  </div>

                  {/* Intimate greeting Note envelope letter card */}
                  <div className="bg-white text-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-50/50 space-y-6 relative overflow-hidden">
                    <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-rose-300 to-indigo-300 absolute top-0 left-0" />

                    <div className="space-y-1">
                      <span className="text-[10px] text-rose-500 font-extrabold uppercase tracking-widest">
                        Sent on Occasion of {recipientGift.occasion}
                      </span>
                      <h2 className="text-3xl font-serif text-slate-900 tracking-tight leading-none font-bold">
                        Dear {recipientGift.recipientName},
                      </h2>
                    </div>

                    <p className="text-base sm:text-lg text-slate-700 font-medium font-serif leading-relaxed italic border-l-3 border-rose-400 pl-4">
                      "{recipientGift.personalMessage}"
                    </p>

                    {/* Integrated audio player structure if voiceMemo exists */}
                    {recipientGift.voiceNoteBase64 && (
                      <div className="bg-rose-50/80 rounded-2xl p-4 border border-rose-100/50 flex items-center space-x-4">
                        <button
                          onClick={playVoiceNote}
                          className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-200 transition-all focus:outline-none"
                          id="play-recipient-memo-btn"
                        >
                          {isVoicePlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 pl-0.5" />}
                        </button>
                        <div className="flex-1 space-y-1">
                          <span className="text-xs font-black text-rose-950 uppercase tracking-wider flex items-center space-x-1.5">
                            <Mic className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                            <span>Play Sender's Recorded Voice</span>
                          </span>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden relative">
                            <div
                              className="absolute left-0 top-0 h-full bg-rose-600 transition-all duration-100"
                              style={{ width: `${voicePlaybackProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-right text-xs pt-5 border-t border-slate-100">
                      <span className="text-slate-400 font-serif italic">Filled with warm affection by:</span>
                      <div className="text-base font-bold text-slate-900 font-serif mt-0.5">
                        {recipientGift.senderName || "Unknown Special Friend"}
                      </div>
                    </div>
                  </div>

                  {/* Ambient Music controller for the recipient with gorgeous volume visual */}
                  <div className="mt-8 flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-xs text-slate-300">
                    <div className="flex items-center space-x-2.5">
                      <Music className="w-4 h-4 text-rose-400 animate-spin" />
                      <div>
                        <div className="font-semibold text-[11px]">Cozy Music Box Instrument</div>
                        <div className="text-[10px] text-slate-400 italic font-mono">
                          {MUSIC_LIBRARY.find((c) => c.id === recipientGift.musicCategory)?.name || recipientGift.musicCategory} ({MUSIC_LIBRARY.find((c) => c.id === recipientGift.musicCategory)?.tracks.find((t) => t.id === recipientGift.musicTrack)?.title || recipientGift.musicTrack})
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all ${
                        isMusicPlaying
                          ? "bg-rose-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {isMusicPlaying ? (
                        <>
                          <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                          <span>Mute loop</span>
                        </>
                      ) : (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Unmute loop</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Keep the loop going card */}
                <div className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/20 rounded-[32px] p-6 text-center space-y-3 mt-4 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
                    <GiftIcon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-serif font-bold text-white">Create a Gift for Someone New</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Keep the loop going! Design an elegant virtual flower card matching beautiful ambient melodies with a personal voice note to surprise someone special.
                  </p>
                  <button
                    onClick={startNewGiftCreator}
                    className="mt-2 inline-flex items-center space-x-1.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-serif font-bold px-6 py-2.5 rounded-xl text-xs transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-rose-950/20 cursor-pointer"
                  >
                    <span>Send Flowers & Music</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Dynamic and humble Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Digital Flowers Portal. Sending warm affection instantly worldwide.</p>
          <div className="flex space-x-4">
            <span className="text-[10px] select-all font-mono">Egypt Delivery channels online</span>
          </div>
        </div>
      </footer>

      {/* Floating Modern Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl shadow-xl border px-4.5 py-4 flex items-center justify-between space-x-4 backdrop-blur-md ${
              notification.type === "error"
                ? "bg-slate-900 border-rose-500/20 text-white"
                : notification.type === "success"
                ? "bg-slate-900 border-emerald-500/20 text-white"
                : "bg-slate-900 border-slate-800 text-white"
            }`}
          >
            <div className="flex items-center space-x-3">
              {notification.type === "error" ? (
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              )}
              <span className="text-xs font-semibold mr-2">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white transition-colors text-xs font-bold font-mono px-1"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
