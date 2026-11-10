const express = require("express");
const { query } = require("../db/pool");
const { mobileSession } = require("../services/authService");

function clientItem(row) {
  return { id:row.id, ownerId:row.owner_id||row.vendor_user_id||row.vendor_id,
    ownerName:row.owner_name||row.business_name||"VizhaOne Partner", avatar:row.avatar_url||"",
    kind:row.kind==="post"?"post":"reel", media:row.media_url,
    mediaType:row.media_type==="video"?"video":"image", caption:row.caption||"",
    service:row.service_name||row.service_title||"Event service",
    price:row.price==null?"":String(row.price).replace(/\.00$/, ""), createdAt:row.created_at,
    likes:[], savedBy:[] };
}

function createSocialRouter() {
  const router=express.Router();
  router.get("/",async(req,res)=>{try{const ownerId=String(req.query.ownerId||"").trim(),values=[];
    const filter=ownerId?` AND COALESCE(r.owner_id,v.user_id)=$${values.push(ownerId)}`:"";
    const result=await query(`SELECT r.*,u.name AS owner_name,u.avatar_url,v.user_id AS vendor_user_id,
      v.business_name,s.title AS service_title FROM reels r LEFT JOIN vendors v ON v.id=r.vendor_id
      LEFT JOIN users u ON u.id=COALESCE(r.owner_id,v.user_id) LEFT JOIN services s ON s.id=r.service_id
      WHERE r.published=true${filter} ORDER BY r.created_at DESC LIMIT 200`,values);
    return res.json({items:result.rows.map(clientItem)});}catch(error){return res.status(500).json({error:error.message||"Unable to load public feed"});}});
  router.post("/",async(req,res)=>{try{const session=mobileSession(req);if(!session)return res.status(401).json({error:"Sign in to publish"});
    const user=(await query("SELECT id,role FROM users WHERE id=$1",[session.sub])).rows[0];
    if(!user||user.role!=="service_provider")return res.status(403).json({error:"Only service providers can publish"});
    const mediaUrl=String(req.body.media||req.body.media_url||"").trim(),mediaType=req.body.mediaType==="video"||req.body.media_type==="video"?"video":"image";
    const kind=req.body.kind==="post"?"post":"reel",caption=String(req.body.caption||"").trim(),serviceName=String(req.body.service||req.body.service_name||"").trim();
    const price=String(req.body.price||"").replace(/[^\d.]/g,"")||null;if(!mediaUrl||!caption||!serviceName)return res.status(400).json({error:"Media, caption and service are required"});
    const row=(await query(`INSERT INTO reels(owner_id,media_url,media_type,caption,service_name,kind,price,published)
      VALUES($1,$2,$3,$4,$5,$6,$7,true) RETURNING *`,[user.id,mediaUrl,mediaType,caption,serviceName,kind,price])).rows[0];
    const full=(await query("SELECT r.*,u.name AS owner_name,u.avatar_url FROM reels r JOIN users u ON u.id=r.owner_id WHERE r.id=$1",[row.id])).rows[0];
    return res.status(201).json({item:clientItem(full)});}catch(error){return res.status(500).json({error:error.message||"Unable to publish"});}});
  return router;
}
module.exports={createSocialRouter};
