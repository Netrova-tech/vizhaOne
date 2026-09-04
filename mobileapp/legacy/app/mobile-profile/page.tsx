"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Bookmark,
  Check,
  ChevronRight,
  CircleHelp,
  Gift,
  Globe2,
  Grid3X3,
  ImagePlus,
  Lock,
  LogOut,
  MapPin,
  Pencil,
  Phone,
  PlaySquare,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  UserRound,
  Users,
  WandSparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import {
  fetchSocial,
  fetchSocialProfile,
  publishSocial,
  socialItems,
  type SocialItem,
  type SocialKind,
  type SocialVisibility,
} from "@/lib/social";
import {
  clearMobileSession,
  deleteAccount,
  startSession,
  token,
  updateAccount,
} from "@/lib/mobileAuth";
import { apiUrl } from "@/lib/utils";
import { getBookingsWithFallback } from "@/lib/api";

const menu = [
  {
    label: "Referral rewards",
    hint: "Invite friends and earn",
    href: "/referrals",
    icon: Gift,
  },
  {
    label: "Celebration tools",
    hint: "Invites, hashtags and more",
    href: "/create",
    icon: WandSparkles,
  },
  {
    label: "Notifications",
    hint: "Booking and offer updates",
    href: "/bookings",
    icon: Bell,
  },
  {
    label: "Saved",
    hint: "Your favourite vendors",
    href: "/saved",
    icon: Bookmark,
  },
  {
    label: "Language",
    hint: "English, Tamil and more",
    href: "/",
    icon: Globe2,
  },
  {
    label: "Help & support",
    hint: "FAQ and contact options",
    href: "/faq",
    icon: CircleHelp,
  },
  {
    label: "Privacy & security",
    hint: "Your data and account",
    href: "/privacy",
    icon: ShieldCheck,
  },
];

export default function MobileProfilePage() {
  const { user, loading, signOut } = useAuth();
  const provider = user?.role === "service_provider";
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    mobile: "",
    location: "",
    bio: "",
    interests: "",
  });
  const [profileTab, setProfileTab] = useState<
    "posts" | "saved" | "bookings" | "reviews"
  >("posts");
  const [socialStats, setSocialStats] = useState({
    followers: 0,
    following: 0,
  });
  const [savedCount, setSavedCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [uploads, setUploads] = useState<SocialItem[]>([]);
  const [kind, setKind] = useState<SocialKind>("reel");
  const [visibility, setVisibility] = useState<SocialVisibility>("public");
  const [media, setMedia] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [caption, setCaption] = useState("");
  const [service, setService] = useState("");
  const [price, setPrice] = useState("");
  const [posting, setPosting] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("vizha_analytics_consent") === "granted",
  );

  useEffect(() => {
    if (!user) return;
    setUploads(socialItems().filter((x) => x.ownerId === user.id));
    void fetchSocial(user.id)
      .then(setUploads)
      .catch(() => undefined);
    void fetchSocialProfile(user.id)
      .then((data) =>
        setSocialStats({
          followers: data.followers,
          following: data.following,
        }),
      )
      .catch(() => undefined);
    if (user.mobile)
      void getBookingsWithFallback(user.mobile)
        .then((result) => setBookingCount(result.bookings.length))
        .catch(() => undefined);
    try {
      const meta = JSON.parse(
        localStorage.getItem(`vizha_profile_meta_${user.id}`) || "{}",
      );
      setProfile({
        name: user.name || "",
        mobile: user.mobile || "",
        location: user.location || "",
        bio: meta.bio || "Celebrating every moment beautifully ✨",
        interests: meta.interests || "Weddings · Birthdays · Special Events",
      });
    } catch {
      setProfile({
        name: user.name || "",
        mobile: user.mobile || "",
        location: user.location || "",
        bio: "Celebrating every moment beautifully ✨",
        interests: "Weddings · Birthdays · Special Events",
      });
    }
    try {
      setSavedCount(
        JSON.parse(localStorage.getItem("vizha_favorites") || "[]").length,
      );
    } catch {
      setSavedCount(0);
    }
    try {
      setBookingCount(
        JSON.parse(localStorage.getItem("vizha_local_bookings") || "[]").length,
      );
    } catch {
      setBookingCount(0);
    }
  }, [user]);

  if (loading)
    return (
      <div className="grid min-h-dvh place-items-center bg-rose-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-200 border-t-rose-600" />
      </div>
    );

  async function chooseAvatar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return toast.error("Choose an image file");
    if (file.size > 5_000_000)
      return toast.error("Profile image must be below 5 MB");
    setUploadingAvatar(true);
    try {
      const body = new FormData();
      body.append("images", file);
      const upload = await fetch(apiUrl("/api/uploads/cloudinary"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body,
      });
      const payload = await upload.json().catch(() => null);
      if (!upload.ok || !payload?.images?.[0]?.url)
        throw new Error(payload?.error || "Image upload failed");
      const result = await updateAccount({
        ...profile,
        name: profile.name || user?.name || "",
        mobile: profile.mobile || user?.mobile || "",
        location: profile.location || user?.location || "",
        avatar_url: payload.images[0].url,
      });
      startSession(result.user);
      toast.success("Profile picture updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  }
  async function removeAvatar() {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const result = await updateAccount({
        ...profile,
        name: profile.name || user.name || "",
        mobile: profile.mobile || user.mobile || "",
        location: profile.location || user.location || "",
        avatar_url: "",
      });
      startSession(result.user);
      toast.success("Profile picture removed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to remove picture",
      );
    } finally {
      setUploadingAvatar(false);
    }
  }
  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (!profile.name.trim()) return toast.error("Name is required");
    try {
      const result = await updateAccount({
        name: profile.name.trim(),
        mobile: profile.mobile.trim(),
        location: profile.location.trim(),
      });
      startSession(result.user);
      if (user)
        localStorage.setItem(
          `vizha_profile_meta_${user.id}`,
          JSON.stringify({
            bio: profile.bio.trim(),
            interests: profile.interests.trim(),
            ...socialStats,
          }),
        );
      setEditing(false);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Profile update failed");
    }
  }
  async function chooseMedia(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/"))
      return toast.error("Choose an image or video");
    if (file.size > 25 * 1024 * 1024)
      return toast.error("Media must be below 25 MB");
    setUploadingMedia(true);
    try {
      const body = new FormData();
      body.append("media", file);
      const response = await fetch(apiUrl("/api/uploads/media"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.media?.url)
        throw new Error(payload?.error || "Media upload failed");
      setMedia(payload.media.url);
      setMediaType(file.type.startsWith("video") ? "video" : "image");
      toast.success("Media uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingMedia(false);
      e.target.value = "";
    }
  }
  async function publish(e: FormEvent) {
    e.preventDefault();
    if (!user || !media || !caption.trim())
      return toast.error("Media and caption are required");
    setPosting(true);
    try {
      await publishSocial({
        id: `social-${Date.now()}`,
        ownerId: user.id,
        ownerName: user.name || "VizhaOne User",
        ownerRole:
          user.role === "service_provider"
            ? "service_provider"
            : user.role === "customer"
              ? "customer"
              : "user",
        avatar: user.avatar_url,
        kind,
        visibility,
        media,
        mediaType,
        caption: caption.trim(),
        service: service.trim() || "Celebration moment",
        price: price.trim(),
        createdAt: new Date().toISOString(),
        likes: [],
        savedBy: [],
      });
      setMedia("");
      setCaption("");
      setService("");
      setPrice("");
      setUploads(await fetchSocial(user.id));
      toast.success(
        `${kind === "reel" ? "Reel" : "Post"} shared with ${visibility === "public" ? "everyone" : "followers"}`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to publish");
    } finally {
      setPosting(false);
    }
  }
  async function removeAccount() {
    setDeleting(true);
    try {
      await deleteAccount();
      clearMobileSession();
      localStorage.removeItem("vizha_favorites");
      localStorage.removeItem("vizha_cart");
      toast.success("Your account and personal data were deleted");
      window.location.hash = "#/sign-in";
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Account deletion failed",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#fffafb] pb-24">
      <MobilePageHeader
        title={provider ? "Business profile" : "My profile"}
        subtitle={
          provider ? "Create, post and grow" : "Account and preferences"
        }
      />
      <main className="px-4 py-5">
        <section className="overflow-hidden rounded-[30px] border border-rose-100 bg-white shadow-[0_20px_55px_rgba(91,19,52,.14)]">
          <div className="relative h-32 overflow-hidden bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,.3),transparent_30%),linear-gradient(125deg,#35091f,#7c1749_48%,#ec617b)]">
            <div className="absolute -bottom-20 -left-12 h-32 w-64 rotate-6 rounded-[50%] bg-white" />
            <div className="absolute -bottom-20 left-28 h-32 w-72 -rotate-6 rounded-[50%] bg-white" />
            <button
              onClick={() => setEditing(true)}
              className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/35 bg-black/15 text-white backdrop-blur"
              aria-label="Edit profile"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
          <div className="relative px-5 pb-5">
            <div className="-mt-14 flex items-end justify-between gap-2">
              <label
                className={`relative grid h-28 w-28 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border-[5px] border-white bg-gradient-to-br from-rose-500 to-purple-900 text-white shadow-xl ${uploadingAvatar ? "pointer-events-none opacity-60" : ""}`}
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound className="h-12 w-12" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={chooseAvatar}
                  className="hidden"
                />
                <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1.5 text-center text-[8px] font-black">
                  {uploadingAvatar ? "UPLOADING..." : "EDIT PHOTO"}
                </span>
              </label>
              <div className="mb-2 grid flex-1 grid-cols-3 text-center">
                <div>
                  <strong className="block text-lg font-black">
                    {uploads.length}
                  </strong>
                  <span className="text-[9px] font-bold text-gray-500">
                    Posts
                  </span>
                </div>
                <div>
                  <strong className="block text-lg font-black">
                    {socialStats.followers}
                  </strong>
                  <span className="text-[9px] font-bold text-gray-500">
                    Followers
                  </span>
                </div>
                <div>
                  <strong className="block text-lg font-black">
                    {socialStats.following}
                  </strong>
                  <span className="text-[9px] font-bold text-gray-500">
                    Following
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-black text-gray-950">
                  {user?.name || "VizhaOne User"}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-black text-amber-700">
                  <Star className="h-3 w-3 fill-amber-400" />
                  {provider ? "Verified Provider" : "Event Enthusiast"}
                </span>
              </div>
              <p className="mt-2 text-xs font-medium leading-5 text-gray-700">
                {profile.bio}
              </p>
              <p className="text-[11px] font-semibold text-gray-500">
                {profile.interests}
              </p>
              <p className="mt-2 flex items-center gap-1 text-[10px] font-bold text-gray-500">
                <MapPin className="h-3.5 w-3.5 text-rose-500" />
                {user?.location || "Add your location"}
              </p>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="mt-4 w-full rounded-xl border border-gray-200 py-2.5 text-xs font-black text-gray-800"
            >
              Edit Profile
            </button>
            {user?.avatar_url && (
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => void removeAvatar()}
                className="mt-2 w-full text-[9px] font-bold text-gray-400"
              >
                Remove profile photo
              </button>
            )}
          </div>
        </section>

        {editing && (
          <div className="fixed inset-0 z-[120] flex items-end bg-black/50 p-3 backdrop-blur-sm">
            <form
              onSubmit={saveProfile}
              className="max-h-[88dvh] w-full overflow-y-auto rounded-[28px] bg-white p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black">Edit profile</h2>
                  <p className="text-xs text-gray-500">
                    Make your VizhaOne profile yours
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="grid h-10 w-10 place-items-center rounded-full bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-5 space-y-3">
                <label className="block text-[10px] font-bold text-gray-500">
                  FULL NAME
                  <input
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm outline-none focus:border-rose-500"
                  />
                </label>
                <label className="block text-[10px] font-bold text-gray-500">
                  PHONE NUMBER{" "}
                  <span className="font-medium text-gray-400">(private)</span>
                  <div className="mt-1 flex items-center rounded-2xl border border-gray-200 px-4">
                    <Phone className="h-4 w-4 text-rose-500" />
                    <input
                      value={profile.mobile}
                      inputMode="tel"
                      onChange={(e) =>
                        setProfile({ ...profile, mobile: e.target.value })
                      }
                      className="w-full px-3 py-3.5 text-sm outline-none"
                    />
                  </div>
                </label>
                <label className="block text-[10px] font-bold text-gray-500">
                  LOCATION
                  <div className="mt-1 flex items-center rounded-2xl border border-gray-200 px-4">
                    <MapPin className="h-4 w-4 text-rose-500" />
                    <input
                      value={profile.location}
                      onChange={(e) =>
                        setProfile({ ...profile, location: e.target.value })
                      }
                      className="w-full px-3 py-3.5 text-sm outline-none"
                    />
                  </div>
                </label>
                <label className="block text-[10px] font-bold text-gray-500">
                  BIO
                  <textarea
                    maxLength={120}
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile({ ...profile, bio: e.target.value })
                    }
                    className="mt-1 min-h-20 w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-rose-500"
                  />
                  <span className="mt-1 block text-right text-[9px] text-gray-400">
                    {profile.bio.length}/120
                  </span>
                </label>
                <label className="block text-[10px] font-bold text-gray-500">
                  CELEBRATION INTERESTS
                  <input
                    maxLength={100}
                    value={profile.interests}
                    onChange={(e) =>
                      setProfile({ ...profile, interests: e.target.value })
                    }
                    placeholder="Weddings · Birthdays · Corporate Events"
                    className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm outline-none focus:border-rose-500"
                  />
                </label>
              </div>
              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7c1749] to-rose-500 py-4 text-sm font-black text-white">
                <Check className="h-4 w-4" />
                Save changes
              </button>
            </form>
          </div>
        )}

        <section className="mt-5 rounded-3xl border border-rose-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black">Create & share</h2>
              <p className="text-[10px] text-gray-500">
                Post your celebration or upload a reel
              </p>
            </div>
            <Upload className="h-5 w-5 text-rose-500" />
          </div>
          <div className="mt-4 flex gap-2">
            {(["reel", "post"] as SocialKind[]).map((x) => (
              <button
                type="button"
                key={x}
                onClick={() => setKind(x)}
                className={`flex-1 rounded-xl py-3 text-xs font-black capitalize ${kind === x ? "bg-rose-600 text-white" : "bg-gray-100 text-gray-500"}`}
              >
                {x}
              </button>
            ))}
          </div>
          <form onSubmit={publish} className="mt-4 space-y-3">
            <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/50">
              {media ? (
                mediaType === "image" ? (
                  <img
                    src={media}
                    alt="Upload preview"
                    className="max-h-56 w-full object-cover"
                  />
                ) : (
                  <video src={media} controls className="max-h-56 w-full" />
                )
              ) : (
                <>
                  <ImagePlus className="h-8 w-8 text-rose-500" />
                  <strong className="mt-2 text-xs">
                    Choose photo or video
                  </strong>
                  <span className="mt-1 text-[9px] text-gray-400">
                    Images or videos up to 25 MB
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*,video/*"
                onChange={chooseMedia}
                className="hidden"
              />
            </label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              className="w-full rounded-2xl border px-4 py-3 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder={provider ? "Service name" : "Celebration type"}
                className="min-w-0 rounded-2xl border px-3 py-3 text-xs"
              />
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="numeric"
                placeholder={provider ? "Starting price" : "Optional budget"}
                className="min-w-0 rounded-2xl border px-3 py-3 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-50 p-1.5">
              {(["public", "followers"] as SocialVisibility[]).map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => setVisibility(option)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[10px] font-black ${visibility === option ? "bg-white text-rose-600 shadow-sm" : "text-gray-400"}`}
                >
                  {option === "public" ? (
                    <Globe2 className="h-3.5 w-3.5" />
                  ) : (
                    <Users className="h-3.5 w-3.5" />
                  )}
                  {option === "public" ? "Public" : "Followers only"}
                </button>
              ))}
            </div>
            <p className="flex items-center gap-1 text-[9px] text-gray-400">
              {visibility === "public" ? (
                <Globe2 className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              {visibility === "public"
                ? "Everyone on VizhaOne can see this"
                : "Only people following you can see this"}
            </p>
            <button
              disabled={posting || uploadingMedia}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-950 py-3.5 text-xs font-black text-white disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {posting ? "Publishing..." : `Publish ${kind}`}
            </button>
          </form>
        </section>
        {provider && (
          <section className="mt-5">
            <div className="flex justify-between">
              <h2 className="font-black">Your content</h2>
              <span className="text-xs text-gray-400">
                {uploads.length} uploads
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1">
              {uploads.map((item) => (
                <Link
                  to={`/vendor/${user?.id}`}
                  key={item.id}
                  className="relative aspect-square overflow-hidden rounded-md bg-gray-900"
                >
                  {item.mediaType === "image" ? (
                    <img
                      src={item.media}
                      alt={item.caption}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      src={item.media}
                      className="h-full w-full object-cover"
                    />
                  )}
                  <span className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white">
                    {item.visibility === "followers" ? (
                      <Lock className="h-3 w-3" />
                    ) : item.kind === "reel" ? (
                      <PlaySquare className="h-3 w-3" />
                    ) : (
                      <Grid3X3 className="h-3 w-3" />
                    )}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
        {!provider && (
          <section className="mt-5 overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm">
            <div className="grid grid-cols-4 border-b border-gray-100">
              {(
                [
                  ["posts", Grid3X3, "My Posts"],
                  ["saved", Bookmark, "Saved"],
                  ["bookings", Bell, "Bookings"],
                  ["reviews", Star, "Reviews"],
                ] as const
              ).map(([tab, Icon, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setProfileTab(tab)}
                  className={`relative flex min-w-0 flex-col items-center gap-1 px-1 py-3 text-[8px] font-black ${profileTab === tab ? "text-rose-600" : "text-gray-400"}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="truncate">{label}</span>
                  {profileTab === tab && (
                    <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-rose-600" />
                  )}
                </button>
              ))}
            </div>
            {profileTab === "posts" && (
              <div className="p-2">
                {uploads.length ? (
                  <div className="grid grid-cols-3 gap-1">
                    {uploads.map((item) => (
                      <Link
                        to={`/vendor/${user?.id}`}
                        key={item.id}
                        className="relative aspect-square overflow-hidden rounded-lg bg-gray-900"
                      >
                        {item.mediaType === "image" ? (
                          <img
                            src={item.media}
                            alt={item.caption}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <video
                            src={item.media}
                            className="h-full w-full object-cover"
                          />
                        )}
                        <span className="absolute right-1 top-1 rounded-full bg-black/45 p-1 text-white">
                          {item.visibility === "followers" ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : item.kind === "reel" ? (
                            <PlaySquare className="h-3.5 w-3.5" />
                          ) : (
                            <Grid3X3 className="h-3.5 w-3.5" />
                          )}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-10 text-center">
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-50 text-rose-500">
                      <Grid3X3 className="h-6 w-6" />
                    </span>
                    <h3 className="mt-3 text-sm font-black">
                      Your celebration story starts here
                    </h3>
                    <p className="mt-1 text-[10px] leading-4 text-gray-500">
                      Upload a public post or share only with your followers.
                    </p>
                  </div>
                )}
              </div>
            )}
            {profileTab === "saved" && (
              <div className="p-5 text-center">
                <Bookmark className="mx-auto h-7 w-7 text-rose-500" />
                <strong className="mt-2 block text-2xl font-black">
                  {savedCount}
                </strong>
                <p className="text-[10px] text-gray-500">
                  Saved vendors and services
                </p>
                <Link
                  to="/saved"
                  className="mt-4 inline-flex rounded-xl bg-gray-950 px-5 py-3 text-xs font-black text-white"
                >
                  View saved
                </Link>
              </div>
            )}
            {profileTab === "bookings" && (
              <div className="p-5 text-center">
                <Bell className="mx-auto h-7 w-7 text-rose-500" />
                <strong className="mt-2 block text-2xl font-black">
                  {bookingCount}
                </strong>
                <p className="text-[10px] text-gray-500">
                  Bookings and requests
                </p>
                <Link
                  to="/bookings"
                  className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-[#7c1749] to-rose-500 px-5 py-3 text-xs font-black text-white"
                >
                  Track bookings
                </Link>
              </div>
            )}
            {profileTab === "reviews" && (
              <div className="p-5 text-center">
                <Star className="mx-auto h-7 w-7 text-amber-500" />
                <h3 className="mt-2 text-sm font-black">Your reviews</h3>
                <p className="mt-1 text-[10px] leading-4 text-gray-500">
                  Completed booking reviews will be collected here.
                </p>
                <Link
                  to="/bookings"
                  className="mt-4 inline-flex rounded-xl border border-rose-200 px-5 py-3 text-xs font-black text-rose-600"
                >
                  Review a booking
                </Link>
              </div>
            )}
          </section>
        )}
        <section className="mt-5 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          {menu.map(({ label, hint, href, icon: Icon }, i) => (
            <Link
              key={label}
              to={href}
              className={`flex items-center gap-3 px-4 py-4 ${i ? "border-t border-gray-100" : ""}`}
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-50 text-rose-600">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm">{label}</strong>
                <small className="block truncate text-[10px] text-gray-400">
                  {hint}
                </small>
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
          ))}
        </section>
        <label className="mt-4 flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4">
          <input
            type="checkbox"
            checked={analyticsConsent}
            onChange={(event) => {
              const value = event.target.checked;
              setAnalyticsConsent(value);
              localStorage.setItem(
                "vizha_analytics_consent",
                value ? "granted" : "denied",
              );
            }}
            className="h-5 w-5 accent-rose-600"
          />
          <span>
            <strong className="block text-xs">Share diagnostics</strong>
            <small className="text-[10px] text-gray-500">
              Help improve crashes and performance. Optional.
            </small>
          </span>
        </label>
        <button
          onClick={() => void signOut()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white py-4 text-sm font-black text-rose-600"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
        <button
          onClick={() => setDeleteOpen(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-red-600"
        >
          <Trash2 className="h-4 w-4" />
          Delete my account
        </button>
        {deleteOpen && (
          <div className="fixed inset-0 z-[140] grid place-items-center bg-black/55 p-5">
            <section className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
              <h2 className="text-xl font-black">
                Delete account permanently?
              </h2>
              <p className="mt-2 text-xs leading-5 text-gray-500">
                Your profile and linked personal data will be deleted. This
                action cannot be undone.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  disabled={deleting}
                  onClick={() => setDeleteOpen(false)}
                  className="rounded-2xl bg-gray-100 py-3 text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  disabled={deleting}
                  onClick={() => void removeAccount()}
                  className="rounded-2xl bg-red-600 py-3 text-sm font-black text-white disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete permanently"}
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
      <MobileBottomNav />
    </div>
  );
}
