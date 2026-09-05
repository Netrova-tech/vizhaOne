"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  CalendarCheck,
  Grid3X3,
  Heart,
  LoaderCircle,
  Lock,
  MessageCircle,
  PlaySquare,
  Send,
  Share2,
  UserRound,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import {
  fetchSocial,
  fetchSocialComments,
  publishSocialComment,
  setFollowing,
  setSocialReaction,
  socialItems,
  type SocialComment,
  type SocialItem,
  type SocialKind,
} from "@/lib/social";
import { shareContent } from "@/lib/nativeShare";
import { token } from "@/lib/mobileAuth";

function videoPoster(url: string) {
  if (!url.includes("/video/upload/")) return undefined;
  return url
    .replace("/video/upload/", "/video/upload/so_0,f_jpg,q_auto/")
    .replace(/\.[a-z0-9]+(?=([?#]|$))/i, ".jpg");
}

export default function ReelsPage() {
  const { user, loading } = useAuth();
  const canPublish =
    user?.role === "service_provider" || user?.role === "admin";
  const [items, setItems] = useState<SocialItem[]>([]);
  const [tab, setTab] = useState<SocialKind>("reel");
  const [activeId, setActiveId] = useState("");
  const [pausedId, setPausedId] = useState("");
  const [muted, setMuted] = useState(false);
  const [followingId, setFollowingId] = useState("");
  const [sharingId, setSharingId] = useState("");
  const [commentItem, setCommentItem] = useState<SocialItem | null>(null);
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentPosting, setCommentPosting] = useState(false);
  const [heartBurst, setHeartBurst] = useState("");
  const reelScroller = useRef<HTMLElement>(null);
  const videos = useRef(new Map<string, HTMLVideoElement>());
  const lastTap = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleItems = useMemo(
    () => items.filter((item) => item.kind === tab),
    [items, tab],
  );

  useEffect(() => {
    if (loading) return;
    setItems(socialItems());
    void fetchSocial()
      .then(setItems)
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : "Unable to load posts",
        ),
      );
  }, [loading, user?.id]);

  useEffect(() => {
    if (tab !== "reel") {
      setActiveId("");
      videos.current.forEach((video) => {
        video.pause();
        video.muted = true;
      });
      return;
    }
    const first = visibleItems[0]?.id || "";
    setActiveId((current) =>
      visibleItems.some((item) => item.id === current) ? current : first,
    );
  }, [tab, visibleItems]);

  useEffect(() => {
    const root = reelScroller.current;
    if (!root || tab !== "reel") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = (visible?.target as HTMLElement | undefined)?.dataset
          .socialId;
        if (id && visible.intersectionRatio >= 0.6) setActiveId(id);
      },
      { root, threshold: [0.6, 0.8, 1] },
    );
    root
      .querySelectorAll<HTMLElement>("[data-social-id]")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [tab, visibleItems]);

  useEffect(() => {
    videos.current.forEach((video, id) => {
      const active = tab === "reel" && id === activeId && !commentItem;
      if (!active) {
        video.pause();
        video.muted = true;
        return;
      }
      if (pausedId === id) {
        video.pause();
        return;
      }
      video.muted = muted;
      video.currentTime = Math.max(0, video.currentTime);
      void video.play().catch(() => {
        video.muted = true;
        setMuted(true);
      });
    });
  }, [activeId, commentItem, muted, pausedId, tab]);

  function registerVideo(id: string, video: HTMLVideoElement | null) {
    if (video) videos.current.set(id, video);
    else videos.current.delete(id);
  }
  async function react(
    item: SocialItem,
    reaction: "like" | "save",
    forced?: boolean,
  ) {
    if (!user || !token()) return toast.error("Sign in to continue");
    const current =
      reaction === "like"
        ? Boolean(item.liked ?? item.likes.includes(user.id))
        : Boolean(item.saved ?? item.savedBy.includes(user.id));
    const active = forced ?? !current;
    if (active === current) return;
    setItems((list) =>
      list.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              [reaction === "like" ? "liked" : "saved"]: active,
              ...(reaction === "like"
                ? {
                    likeCount: Math.max(
                      0,
                      Number(entry.likeCount ?? entry.likes.length) +
                        (active ? 1 : -1),
                    ),
                  }
                : {}),
            }
          : entry,
      ),
    );
    try {
      const result = await setSocialReaction(item.id, reaction, active);
      setItems((list) =>
        list.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                [reaction === "like" ? "liked" : "saved"]: result.active,
                ...(reaction === "like" ? { likeCount: result.count } : {}),
              }
            : entry,
        ),
      );
    } catch (error) {
      setItems((list) =>
        list.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                [reaction === "like" ? "liked" : "saved"]: current,
                ...(reaction === "like"
                  ? { likeCount: Number(item.likeCount ?? item.likes.length) }
                  : {}),
              }
            : entry,
        ),
      );
      toast.error(error instanceof Error ? error.message : "Unable to update");
    }
  }
  function mediaTap(item: SocialItem) {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      lastTap.current = 0;
      setHeartBurst(item.id);
      window.setTimeout(
        () => setHeartBurst((id) => (id === item.id ? "" : id)),
        650,
      );
      void react(item, "like", true);
      return;
    }
    lastTap.current = now;
    tapTimer.current = setTimeout(() => {
      lastTap.current = 0;
      if (item.mediaType === "video" && item.id === activeId) {
        const video = videos.current.get(item.id);
        if (!video) return;
        if (video.paused) {
          setPausedId("");
          void video.play().catch(() => undefined);
        } else {
          setPausedId(item.id);
          video.pause();
        }
      }
    }, 280);
  }
  async function openComments(item: SocialItem) {
    setCommentItem(item);
    setComments([]);
    setCommentLoading(true);
    videos.current.get(item.id)?.pause();
    try {
      setComments(await fetchSocialComments(item.id));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load comments",
      );
    } finally {
      setCommentLoading(false);
    }
  }
  async function submitComment() {
    const body = commentText.trim();
    if (!commentItem || !body || commentPosting) return;
    if (!user || !token()) return toast.error("Sign in to comment");
    setCommentPosting(true);
    try {
      const comment = await publishSocialComment(commentItem.id, body);
      setComments((list) => [...list, comment]);
      setCommentText("");
      setItems((list) =>
        list.map((entry) =>
          entry.id === commentItem.id
            ? { ...entry, commentCount: Number(entry.commentCount || 0) + 1 }
            : entry,
        ),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to add comment",
      );
    } finally {
      setCommentPosting(false);
    }
  }
  async function follow(item: SocialItem) {
    if (!user || !token())
      return toast.error("Please sign in again to follow this profile");
    if (followingId) return;
    setFollowingId(item.ownerId);
    try {
      const result = await setFollowing(item.ownerId, !item.isFollowing);
      setItems((current) =>
        current.map((entry) =>
          entry.ownerId === item.ownerId
            ? {
                ...entry,
                isFollowing: result.following,
                followerCount: result.followers,
              }
            : entry,
        ),
      );
      toast.success(
        result.following
          ? `Following ${item.ownerName}`
          : `Unfollowed ${item.ownerName}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update follow",
      );
    } finally {
      setFollowingId("");
    }
  }
  async function share(item: SocialItem) {
    if (sharingId) return;
    setSharingId(item.id);
    try {
      const result = await shareContent({
        title: `${item.ownerName} on VizhaOne`,
        text: `${item.caption}\n${item.service}`,
        url: `https://www.vizhaone.com/reels?${item.kind}=${encodeURIComponent(item.id)}`,
      });
      if (result === "copied") toast.success("Link copied");
    } catch (error) {
      if (error instanceof Error && !/cancel/i.test(error.message))
        toast.error("Unable to share");
    } finally {
      setSharingId("");
    }
  }

  const ownerRow = (item: SocialItem) => (
    <div className="flex items-center gap-2">
      <Link
        to={`/vendor/${item.ownerId}`}
        className="flex min-w-0 items-center gap-2"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white bg-rose-600">
          {item.avatar ? (
            <img
              src={item.avatar}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            item.ownerName[0]
          )}
        </span>
        <strong className="truncate text-sm">{item.ownerName}</strong>
      </Link>
      {user?.id !== item.ownerId && (
        <button
          type="button"
          disabled={Boolean(followingId)}
          onClick={() => void follow(item)}
          className={`inline-flex min-w-16 items-center justify-center rounded-full border px-3 py-1.5 text-[10px] font-black disabled:opacity-60 ${item.isFollowing ? "border-current bg-white/10" : "border-rose-400 bg-rose-600 text-white"}`}
        >
          {followingId === item.ownerId ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : item.isFollowing ? (
            "Following"
          ) : (
            "Follow"
          )}
        </button>
      )}
    </div>
  );

  const actionButtons = (item: SocialItem, dark = true) => (
    <div
      className={`flex items-center ${dark ? "flex-col gap-2 text-white" : "text-gray-700"}`}
    >
      <button
        type="button"
        aria-label={`Like ${item.kind}`}
        onClick={() => void react(item, "like")}
        className="flex items-center gap-1 p-2 text-xs"
      >
        <Heart
          className={`h-6 w-6 ${item.liked || (user && item.likes.includes(user.id)) ? "fill-rose-500 text-rose-500" : ""}`}
        />
        {item.likeCount ?? item.likes.length}
      </button>
      <button
        type="button"
        aria-label={`Comment on ${item.kind}`}
        onClick={() => void openComments(item)}
        className="flex items-center gap-1 p-2 text-xs"
      >
        <MessageCircle className="h-6 w-6" />
        {item.commentCount || 0}
      </button>
      <button
        type="button"
        aria-label={`Save ${item.kind}`}
        onClick={() => void react(item, "save")}
        className="p-2"
      >
        <Bookmark
          className={`h-6 w-6 ${item.saved || (user && item.savedBy.includes(user.id)) ? "fill-current" : ""}`}
        />
      </button>
      <button
        type="button"
        aria-label={`Share ${item.kind}`}
        disabled={sharingId === item.id}
        onClick={() => void share(item)}
        className="p-2"
      >
        {sharingId === item.id ? (
          <LoaderCircle className="h-6 w-6 animate-spin" />
        ) : (
          <Share2 className="h-6 w-6" />
        )}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-20 overflow-hidden bg-black">
      <div className="flex h-[calc(52px+env(safe-area-inset-top,0px))] items-end justify-center gap-8 border-b border-white/10 bg-black pb-1 text-sm font-black text-white">
        {(["reel", "post"] as SocialKind[]).map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => setTab(kind)}
            className={`relative flex h-full items-center gap-2 px-4 capitalize ${tab === kind ? "text-white" : "text-white/50"}`}
          >
            {kind === "reel" ? (
              <PlaySquare className="h-4 w-4" />
            ) : (
              <Grid3X3 className="h-4 w-4" />
            )}
            {kind === "reel" ? "Reels" : "Posts"}
            {tab === kind && (
              <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-rose-500" />
            )}
          </button>
        ))}
      </div>

      {tab === "reel" ? (
        <main
          ref={reelScroller}
          className="h-[calc(100dvh-132px-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] snap-y snap-mandatory overflow-y-auto overscroll-contain"
        >
          {visibleItems.length ? (
            visibleItems.map((item) => (
              <article
                key={item.id}
                data-social-id={item.id}
                className="relative h-full snap-start snap-always overflow-hidden bg-gray-950"
              >
                {item.mediaType === "video" ? (
                  <video
                    ref={(video) => registerVideo(item.id, video)}
                    src={item.media}
                    poster={videoPoster(item.media)}
                    playsInline
                    loop
                    preload={item.id === activeId ? "auto" : "metadata"}
                    onClick={() => mediaTap(item)}
                    className="h-full w-full touch-pan-y object-cover"
                  />
                ) : (
                  <img
                    src={item.media}
                    alt={item.caption}
                    onClick={() => mediaTap(item)}
                    className="h-full w-full touch-pan-y object-cover"
                  />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/10" />
                {heartBurst === item.id && (
                  <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
                    <Heart className="h-24 w-24 animate-ping fill-white text-white drop-shadow-2xl" />
                  </div>
                )}
                {item.mediaType === "video" && pausedId === item.id && (
                  <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-black/55 text-white backdrop-blur">
                      <PlaySquare className="h-8 w-8" />
                    </span>
                  </div>
                )}
                {item.mediaType === "video" && item.id === activeId && (
                  <button
                    type="button"
                    aria-label={muted ? "Turn sound on" : "Mute reel"}
                    onClick={() => setMuted((value) => !value)}
                    className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur"
                  >
                    {muted ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </button>
                )}
                <div className="absolute bottom-5 left-4 right-20 text-white">
                  {ownerRow(item)}
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[9px] font-black uppercase backdrop-blur">
                    {item.visibility === "followers" && (
                      <Lock className="h-3 w-3" />
                    )}
                    Reel
                  </span>
                  <p className="mt-2 line-clamp-3 text-sm leading-5">
                    {item.caption}
                  </p>
                  <p className="mt-2 text-xs font-black text-rose-300">
                    {item.service}
                    {item.price ? ` · ₹${item.price}` : ""}
                  </p>
                </div>
                <div className="absolute bottom-5 right-3 flex flex-col items-center gap-2 text-white">
                  {actionButtons(item)}
                  <Link
                    aria-label={`View ${item.ownerName} profile`}
                    className="p-2"
                    to={`/vendor/${item.ownerId}`}
                  >
                    <UserRound className="h-6 w-6" />
                  </Link>
                  <Link
                    to={`/quote/${item.id}`}
                    aria-label="Get quotation"
                    className="grid h-11 w-11 place-items-center rounded-full bg-rose-600"
                  >
                    <CalendarCheck className="h-5 w-5" />
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <Empty kind="reel" canPublish={canPublish} />
          )}
        </main>
      ) : (
        <main className="h-[calc(100dvh-132px-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] overflow-y-auto bg-[#fff8f9] px-3 py-4">
          {visibleItems.length ? (
            <div className="space-y-4">
              {visibleItems.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-rose-100"
                >
                  <div className="p-4 text-gray-900">{ownerRow(item)}</div>
                  {item.mediaType === "video" ? (
                    <video
                      src={item.media}
                      poster={videoPoster(item.media)}
                      controls
                      playsInline
                      preload="metadata"
                      className="max-h-[65dvh] w-full bg-black object-contain"
                    />
                  ) : (
                    <img
                      src={item.media}
                      alt={item.caption}
                      className="max-h-[65dvh] w-full object-cover"
                    />
                  )}
                  <div className="p-4 text-gray-800">
                    <div className="-ml-2">{actionButtons(item, false)}</div>
                    <p className="text-sm leading-5">
                      <strong>{item.ownerName}</strong> {item.caption}
                    </p>
                    <p className="mt-2 text-xs font-black text-rose-600">
                      {item.service}
                      {item.price ? ` · ₹${item.price}` : ""}
                    </p>
                    {item.visibility === "followers" && (
                      <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-gray-400">
                        <Lock className="h-3 w-3" />
                        Followers only
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Empty kind="post" canPublish={canPublish} />
          )}
        </main>
      )}
      {commentItem && (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/55"
          role="dialog"
          aria-modal="true"
          aria-label="Comments"
        >
          <button
            type="button"
            aria-label="Close comments"
            onClick={() => setCommentItem(null)}
            className="absolute inset-0"
          />
          <section className="relative flex h-[72dvh] w-full max-w-xl flex-col rounded-t-[28px] bg-white pb-[env(safe-area-inset-bottom,0px)] text-gray-900 shadow-2xl">
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-gray-300" />
            <header className="flex h-14 items-center justify-between border-b px-4">
              <strong>Comments</strong>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setCommentItem(null)}
                className="rounded-full p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {commentLoading ? (
                <LoaderCircle className="mx-auto mt-10 h-7 w-7 animate-spin text-rose-600" />
              ) : comments.length ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-rose-100 text-xs font-black">
                        {comment.avatar ? (
                          <img
                            src={comment.avatar}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          comment.userName[0]
                        )}
                      </span>
                      <p className="min-w-0 text-sm leading-5">
                        <strong>{comment.userName}</strong> {comment.body}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-12 text-center text-sm text-gray-400">
                  No comments yet. Start the conversation.
                </p>
              )}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void submitComment();
              }}
              className="flex items-center gap-2 border-t bg-white p-3"
            >
              <input
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                maxLength={500}
                placeholder={user ? "Add a comment..." : "Sign in to comment"}
                disabled={!user || commentPosting}
                className="min-w-0 flex-1 rounded-full bg-gray-100 px-4 py-3 text-sm outline-none ring-rose-500 focus:ring-2 disabled:opacity-60"
              />
              <button
                type="submit"
                aria-label="Post comment"
                disabled={!commentText.trim() || commentPosting || !user}
                className="grid h-11 w-11 place-items-center rounded-full bg-rose-600 text-white disabled:opacity-40"
              >
                {commentPosting ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </form>
          </section>
        </div>
      )}
      <MobileBottomNav />
    </div>
  );
}

function Empty({
  kind,
  canPublish,
}: {
  kind: SocialKind;
  canPublish: boolean;
}) {
  return (
    <section className="grid min-h-full place-items-center px-8 text-center text-gray-400">
      <div>
        {kind === "reel" ? (
          <PlaySquare className="mx-auto h-14 w-14 text-rose-500" />
        ) : (
          <Grid3X3 className="mx-auto h-14 w-14 text-rose-500" />
        )}
        <h1 className="mt-4 text-xl font-black text-current">
          No {kind === "reel" ? "reels" : "posts"} yet
        </h1>
        <p className="mt-2 text-sm leading-6">
          Vendor {kind === "reel" ? "reels" : "posts"} will appear here.
        </p>
        {canPublish && (
          <Link
            to="/profile"
            className="mt-5 inline-flex rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white"
          >
            Upload {kind}
          </Link>
        )}
      </div>
    </section>
  );
}
