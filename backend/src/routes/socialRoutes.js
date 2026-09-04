const express = require("express");
const { query } = require("../db/pool");
const { mobileSession } = require("../services/authService");

let schemaReady;
function ensureSocialSchema() {
  if (!schemaReady) schemaReady = query(`
    ALTER TABLE reels ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';
    CREATE TABLE IF NOT EXISTS social_follows (
      follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      following_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY(follower_id, following_id), CHECK(follower_id <> following_id)
    );
    CREATE INDEX IF NOT EXISTS social_follows_following_idx ON social_follows(following_id);
    CREATE TABLE IF NOT EXISTS social_reactions (
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reel_id uuid NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
      reaction text NOT NULL CHECK(reaction IN ('like','save')),
      created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,reel_id,reaction)
    );
    CREATE INDEX IF NOT EXISTS social_reactions_reel_idx ON social_reactions(reel_id,reaction);
    CREATE TABLE IF NOT EXISTS social_comments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reel_id uuid NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body text NOT NULL CHECK(char_length(body) BETWEEN 1 AND 500), created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS social_comments_reel_idx ON social_comments(reel_id,created_at DESC);
  `).catch((error) => { schemaReady = undefined; throw error; });
  return schemaReady;
}

function clientItem(row) {
  return {
    id: row.id, ownerId: row.owner_id || row.vendor_user_id || row.vendor_id,
    ownerName: row.owner_name || row.business_name || "VizhaOne User", ownerRole: row.owner_role || "customer",
    avatar: row.avatar_url || "", kind: row.kind === "post" ? "post" : "reel",
    visibility: row.visibility === "followers" ? "followers" : "public",
    media: row.media_url, mediaType: row.media_type === "video" ? "video" : "image",
    caption: row.caption || "", service: row.service_name || row.service_title || "Celebration moment",
    price: row.price == null ? "" : String(row.price).replace(/\.00$/, ""), createdAt: row.created_at,
    isFollowing: Boolean(row.is_following), followerCount: Number(row.follower_count || 0),
    liked: Boolean(row.liked), saved: Boolean(row.saved), likeCount: Number(row.like_count || 0),
    commentCount: Number(row.comment_count || 0), likes: row.liked && row.viewer_id ? [row.viewer_id] : [],
    savedBy: row.saved && row.viewer_id ? [row.viewer_id] : [],
  };
}

async function canViewSocialItem(id, viewerId) {
  const result = await query(`SELECT 1 FROM reels r LEFT JOIN vendors v ON v.id=r.vendor_id
    WHERE r.id=$1 AND r.published=true AND (
      r.visibility='public' OR COALESCE(r.owner_id,v.user_id)=$2 OR EXISTS(
        SELECT 1 FROM social_follows f WHERE f.follower_id=$2 AND f.following_id=COALESCE(r.owner_id,v.user_id)
      )
    )`, [id, viewerId || null]);
  return result.rowCount > 0;
}

function createSocialRouter() {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      await ensureSocialSchema();
      const session = mobileSession(req), viewerId = session?.sub || null;
      const ownerId = String(req.query.ownerId || "").trim(), values = [viewerId];
      const ownerFilter = ownerId ? ` AND COALESCE(r.owner_id,v.user_id)=$${values.push(ownerId)}` : "";
      const result = await query(`SELECT r.*,u.name AS owner_name,u.role AS owner_role,u.avatar_url,
        v.user_id AS vendor_user_id,v.business_name,s.title AS service_title,
        EXISTS(SELECT 1 FROM social_follows sf WHERE sf.follower_id=$1 AND sf.following_id=u.id) AS is_following,
        (SELECT COUNT(*) FROM social_follows sf WHERE sf.following_id=u.id) AS follower_count,
        EXISTS(SELECT 1 FROM social_reactions sr WHERE sr.user_id=$1 AND sr.reel_id=r.id AND sr.reaction='like') AS liked,
        EXISTS(SELECT 1 FROM social_reactions sr WHERE sr.user_id=$1 AND sr.reel_id=r.id AND sr.reaction='save') AS saved,
        (SELECT COUNT(*) FROM social_reactions sr WHERE sr.reel_id=r.id AND sr.reaction='like') AS like_count,
        (SELECT COUNT(*) FROM social_comments sc WHERE sc.reel_id=r.id) AS comment_count, $1::uuid AS viewer_id
        FROM reels r LEFT JOIN vendors v ON v.id=r.vendor_id
        LEFT JOIN users u ON u.id=COALESCE(r.owner_id,v.user_id) LEFT JOIN services s ON s.id=r.service_id
        WHERE r.published=true${ownerFilter}
          AND (r.visibility='public' OR u.id=$1 OR EXISTS(
            SELECT 1 FROM social_follows access WHERE access.follower_id=$1 AND access.following_id=u.id))
        ORDER BY r.created_at DESC LIMIT 200`, values);
      return res.json({ items: result.rows.map(clientItem) });
    } catch (error) { return res.status(500).json({ error: error.message || "Unable to load social feed" }); }
  });

  router.get("/profile/:id", async (req, res) => {
    try {
      await ensureSocialSchema();
      const session = mobileSession(req), id = String(req.params.id || "");
      const row = (await query(`SELECT u.id,u.name,u.role,u.location,u.avatar_url,
        (SELECT COUNT(*) FROM reels r WHERE r.owner_id=u.id AND r.published=true) AS post_count,
        (SELECT COUNT(*) FROM social_follows f WHERE f.following_id=u.id) AS follower_count,
        (SELECT COUNT(*) FROM social_follows f WHERE f.follower_id=u.id) AS following_count,
        EXISTS(SELECT 1 FROM social_follows f WHERE f.follower_id=$2 AND f.following_id=u.id) AS is_following
        FROM users u WHERE u.id=$1`, [id, session?.sub || null])).rows[0];
      if (!row) return res.status(404).json({ error: "Profile not found" });
      return res.json({ profile: { id: row.id, name: row.name, role: row.role, location: row.location || "",
        avatar: row.avatar_url || "", posts: Number(row.post_count), followers: Number(row.follower_count),
        following: Number(row.following_count), isFollowing: Boolean(row.is_following), isOwn: session?.sub === row.id } });
    } catch (error) { return res.status(500).json({ error: error.message || "Unable to load profile" }); }
  });

  router.put("/follow/:id", async (req, res) => {
    try {
      await ensureSocialSchema();
      const session = mobileSession(req);
      if (!session) return res.status(401).json({ error: "Sign in to follow profiles" });
      const target = String(req.params.id || "");
      if (target === session.sub) return res.status(400).json({ error: "You cannot follow your own profile" });
      if (!(await query("SELECT 1 FROM users WHERE id=$1", [target])).rowCount) return res.status(404).json({ error: "Profile not found" });
      const following = req.body.following !== false;
      if (following) await query("INSERT INTO social_follows(follower_id,following_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [session.sub, target]);
      else await query("DELETE FROM social_follows WHERE follower_id=$1 AND following_id=$2", [session.sub, target]);
      const count = (await query("SELECT COUNT(*) AS followers FROM social_follows WHERE following_id=$1", [target])).rows[0];
      return res.json({ following, followers: Number(count.followers) });
    } catch (error) { return res.status(500).json({ error: error.message || "Unable to update follow" }); }
  });

  router.put("/reaction/:id", async (req, res) => {
    try {
      await ensureSocialSchema();
      const session = mobileSession(req);
      if (!session) return res.status(401).json({ error: "Sign in to react" });
      const id = String(req.params.id || ""), reaction = req.body.reaction === "save" ? "save" : "like";
      if (!(await canViewSocialItem(id, session.sub))) return res.status(404).json({ error: "Post not found" });
      const active = req.body.active !== false;
      if (active) await query("INSERT INTO social_reactions(user_id,reel_id,reaction) VALUES($1,$2,$3) ON CONFLICT DO NOTHING", [session.sub, id, reaction]);
      else await query("DELETE FROM social_reactions WHERE user_id=$1 AND reel_id=$2 AND reaction=$3", [session.sub, id, reaction]);
      const count = (await query("SELECT COUNT(*) AS count FROM social_reactions WHERE reel_id=$1 AND reaction=$2", [id, reaction])).rows[0];
      return res.json({ active, count: Number(count.count) });
    } catch (error) { return res.status(500).json({ error: error.message || "Unable to update reaction" }); }
  });

  router.get("/comments/:id", async (req, res) => {
    try {
      await ensureSocialSchema();
      const session = mobileSession(req), id = String(req.params.id || "");
      if (!(await canViewSocialItem(id, session?.sub))) return res.status(404).json({ error: "Post not found" });
      const result = await query(`SELECT c.id,c.body,c.created_at,u.id AS user_id,u.name,u.avatar_url
        FROM social_comments c JOIN users u ON u.id=c.user_id WHERE c.reel_id=$1 ORDER BY c.created_at ASC LIMIT 200`, [id]);
      return res.json({ comments: result.rows.map((row) => ({ id: row.id, body: row.body, createdAt: row.created_at, userId: row.user_id, userName: row.name, avatar: row.avatar_url || "" })) });
    } catch (error) { return res.status(500).json({ error: error.message || "Unable to load comments" }); }
  });

  router.post("/comments/:id", async (req, res) => {
    try {
      await ensureSocialSchema();
      const session = mobileSession(req);
      if (!session) return res.status(401).json({ error: "Sign in to comment" });
      const id = String(req.params.id || ""), body = String(req.body.body || "").trim();
      if (!(await canViewSocialItem(id, session.sub))) return res.status(404).json({ error: "Post not found" });
      if (!body || body.length > 500) return res.status(400).json({ error: "Comment must be between 1 and 500 characters" });
      const row = (await query(`INSERT INTO social_comments(reel_id,user_id,body) VALUES($1,$2,$3) RETURNING id,body,created_at`, [id, session.sub, body])).rows[0];
      const owner = (await query("SELECT name,avatar_url FROM users WHERE id=$1", [session.sub])).rows[0];
      return res.status(201).json({ comment: { id: row.id, body: row.body, createdAt: row.created_at, userId: session.sub, userName: owner?.name || "VizhaOne User", avatar: owner?.avatar_url || "" } });
    } catch (error) { return res.status(500).json({ error: error.message || "Unable to add comment" }); }
  });

  router.post("/", async (req, res) => {
    try {
      await ensureSocialSchema();
      const session = mobileSession(req);
      if (!session) return res.status(401).json({ error: "Sign in to publish" });
      const user = (await query("SELECT id,role FROM users WHERE id=$1", [session.sub])).rows[0];
      if (!user) return res.status(401).json({ error: "Account not found" });
      const mediaUrl = String(req.body.media || req.body.media_url || "").trim();
      const mediaType = req.body.mediaType === "video" || req.body.media_type === "video" ? "video" : "image";
      const kind = req.body.kind === "post" ? "post" : "reel";
      const visibility = req.body.visibility === "followers" ? "followers" : "public";
      const caption = String(req.body.caption || "").trim();
      const serviceName = String(req.body.service || req.body.service_name || "Celebration moment").trim();
      const price = String(req.body.price || "").replace(/[^\d.]/g, "") || null;
      if (!mediaUrl || !caption) return res.status(400).json({ error: "Media and caption are required" });
      const row = (await query(`INSERT INTO reels(owner_id,media_url,media_type,caption,service_name,kind,price,visibility,published)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,true) RETURNING *`, [user.id, mediaUrl, mediaType, caption, serviceName, kind, price, visibility])).rows[0];
      const full = (await query("SELECT r.*,u.name AS owner_name,u.role AS owner_role,u.avatar_url FROM reels r JOIN users u ON u.id=r.owner_id WHERE r.id=$1", [row.id])).rows[0];
      return res.status(201).json({ item: clientItem(full) });
    } catch (error) { return res.status(500).json({ error: error.message || "Unable to publish" }); }
  });
  return router;
}
module.exports = { createSocialRouter };
