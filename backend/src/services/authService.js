const { recordUserActivity } = require("./userActivityService");
const crypto = require("node:crypto");
const { getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { query, transaction } = require("../db/pool");
const { adminJwtSecret, adminPin, adminPinSecret, mobileJwtSecret } = require("../config/env");

const DEMO_OTP = "123456";
const ADMIN_MOBILE = "9999999999";
const ADMIN_PIN_KEY = "primary";
const ADMIN_COOKIE_NAME = "vizha_admin_token";
const JWT_TTL_SECONDS = 7 * 24 * 60 * 60;

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlJson(value) {
  return base64UrlEncode(JSON.stringify(value));
}

function signJwt(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + JWT_TTL_SECONDS };
  const unsigned = `${base64UrlJson(header)}.${base64UrlJson(body)}`;
  const signature = crypto.createHmac("sha256", adminJwtSecret).update(unsigned).digest("base64url");

  return `${unsigned}.${signature}`;
}

function signMobileJwt(user) {
  if (!mobileJwtSecret || mobileJwtSecret.length < 24) throw new Error("MOBILE_JWT_SECRET must be at least 24 characters");
  const now=Math.floor(Date.now()/1000),body={sub:user.id,role:user.role,iat:now,exp:now+30*24*60*60};
  const unsigned=`${base64UrlJson({alg:"HS256",typ:"JWT"})}.${base64UrlJson(body)}`;
  return `${unsigned}.${crypto.createHmac("sha256",mobileJwtSecret).update(unsigned).digest("base64url")}`;
}
function verifyMobileJwt(token){try{const[h,p,s]=String(token||"").split("."),unsigned=`${h}.${p}`,expected=crypto.createHmac("sha256",mobileJwtSecret).update(unsigned).digest("base64url");if(!s||s.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(expected)))return null;const data=JSON.parse(Buffer.from(p,"base64url").toString("utf8"));return data.exp>Math.floor(Date.now()/1000)?data:null;}catch{return null;}}
const publicMobileUser=(u)=>u&&({id:u.id,role:u.role,name:u.name,mobile:u.mobile,phone:u.mobile,email:u.email,location:u.location||"",provider:u.provider||"email",avatar_url:u.avatar_url||"",created_at:u.created_at});
const passwordDigest=(password,salt)=>crypto.scryptSync(password,salt,64).toString("hex");
function passwordMatches(password,salt,digest){const a=Buffer.from(passwordDigest(password,salt),"hex"),b=Buffer.from(digest||"","hex");return a.length===b.length&&crypto.timingSafeEqual(a,b);}
async function registerMobileAccount(payload={}){const name=String(payload.name||"").trim(),email=String(payload.email||"").trim().toLowerCase(),mobile=String(payload.mobile||payload.phone||"").trim(),password=String(payload.password||""),location=String(payload.location||"").trim(),role=payload.role==="service_provider"?"service_provider":"customer";if(name.length<3||!/^\S+@\S+\.\S+$/.test(email)||password.length<8||!mobile||!location){const e=new Error("Valid name, email, 8-character password, phone and location are required");e.status=400;throw e;}const salt=crypto.randomBytes(16).toString("hex"),hash=`${salt}:${passwordDigest(password,salt)}`;try{const u=(await query(`INSERT INTO users(role,name,email,mobile,password_hash,location,provider) VALUES($1,$2,$3,$4,$5,$6,'email') RETURNING *`,[role,name,email,mobile,hash,location])).rows[0],user=publicMobileUser(u);await recordUserActivity(user);return{success:true,token:signMobileJwt(user),user};}catch(error){if(error.code==="23505"){const e=new Error("This email already has an account");e.status=409;throw e;}throw error;}}
async function loginMobileAccount(payload={}){const email=String(payload.email||"").trim().toLowerCase(),u=(await query("SELECT * FROM users WHERE email=$1",[email])).rows[0],[salt,digest]=String(u?.password_hash||"").split(":");if(!u||!salt||!passwordMatches(String(payload.password||""),salt,digest)){const e=new Error("Invalid email or password");e.status=401;throw e;}const user=publicMobileUser(u);await recordUserActivity(user);return{success:true,token:signMobileJwt(user),user};}
function firebaseAuth(){
  if(!getApps().length) initializeApp({projectId:process.env.FIREBASE_PROJECT_ID||"vizhaone"});
  return getAuth();
}
async function loginGoogleAccount(payload={}){
  const idToken=String(payload.idToken||"");
  if(!idToken){const e=new Error("Google sign-in token is required");e.status=400;throw e;}
  let decoded;
  try{decoded=await firebaseAuth().verifyIdToken(idToken);}catch{const e=new Error("Google sign-in could not be verified");e.status=401;throw e;}
  const email=String(decoded.email||"").trim().toLowerCase();
  if(!email||decoded.email_verified!==true){const e=new Error("Use a verified Google email address");e.status=400;throw e;}
  let row=(await query("SELECT * FROM users WHERE external_id=$1 OR email=$2 ORDER BY external_id=$1 DESC LIMIT 1",[`firebase:${decoded.uid}`,email])).rows[0];
  if(row){
    row=(await query("UPDATE users SET external_id=$1,provider='google',avatar_url=COALESCE(NULLIF(avatar_url,''),$2) WHERE id=$3 RETURNING *",[`firebase:${decoded.uid}`,String(decoded.picture||""),row.id])).rows[0];
    const user=publicMobileUser(row);await recordUserActivity(user);return{success:true,needsProfile:false,token:signMobileJwt(user),user};
  }
  const name=String(payload.name||decoded.name||"").trim(),mobile=String(payload.mobile||payload.phone||"").trim(),location=String(payload.location||"").trim(),role=payload.role==="service_provider"?"service_provider":"customer";
  if(name.length<3||!mobile||!location)return{success:true,needsProfile:true,profile:{name:name||String(decoded.name||""),email,avatar_url:String(decoded.picture||"")}};
  row=(await query("INSERT INTO users(external_id,role,name,email,mobile,location,provider,avatar_url) VALUES($1,$2,$3,$4,$5,$6,'google',$7) RETURNING *",[`firebase:${decoded.uid}`,role,name,email,mobile,location,String(decoded.picture||"")])).rows[0];
  const user=publicMobileUser(row);await recordUserActivity(user);return{success:true,needsProfile:false,token:signMobileJwt(user),user};
}
function mobileSession(req){const h=req.headers.authorization||"";return h.startsWith("Bearer ")?verifyMobileJwt(h.slice(7)):null;}
async function getMobileAccount(req){const s=mobileSession(req);const user=s?publicMobileUser((await query("SELECT * FROM users WHERE id=$1",[s.sub])).rows[0]):null;await recordUserActivity(user);return user;}
async function updateMobileAccount(req,payload={}){const s=mobileSession(req);if(!s)return null;const name=String(payload.name||"").trim(),mobile=String(payload.mobile||"").trim(),location=String(payload.location||"").trim(),avatarUrl=payload.avatar_url===undefined?undefined:String(payload.avatar_url||"").trim();if(name.length<3||!mobile||!location){const e=new Error("Name, phone and location are required");e.status=400;throw e;}return publicMobileUser((await query("UPDATE users SET name=$1,mobile=$2,location=$3,avatar_url=COALESCE($4,avatar_url) WHERE id=$5 RETURNING *",[name,mobile,location,avatarUrl,s.sub])).rows[0]);}
async function deleteMobileAccount(req){const s=mobileSession(req);if(!s)return false;return (await query("DELETE FROM users WHERE id=$1",[s.sub])).rowCount>0;}

function verifyJwt(token) {
  if (!adminJwtSecret || !token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const unsigned = `${parts[0]}.${parts[1]}`;
  const expected = crypto.createHmac("sha256", adminJwtSecret).update(unsigned).digest("base64url");
  const actual = parts[2];

  if (
    expected.length !== actual.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual))
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function getCookie(req, name) {
  return (req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function hashPin(pin, salt) {
  return crypto
    .pbkdf2Sync(`${adminPinSecret}:${pin}`, salt, 120000, 64, "sha512")
    .toString("hex");
}

function verifyPin(pin, salt, hash) {
  const entered = Buffer.from(hashPin(pin, salt), "hex");
  const stored = Buffer.from(hash, "hex");

  return entered.length === stored.length && crypto.timingSafeEqual(entered, stored);
}

function createAdminUser() {
  return {
    id: `demo-${ADMIN_MOBILE}`,
    role: "admin",
    mobile: `+91${ADMIN_MOBILE}`,
    name: "Admin User",
  };
}

async function saveAdminUserProfile(profile) {
  const user = {
    ...createAdminUser(),
    name: profile.name?.trim() || "Admin User",
    mobile: profile.mobile?.trim() || `+91${ADMIN_MOBILE}`,
  };

  await query(`INSERT INTO users(external_id,role,mobile,name) VALUES($1,$2,$3,$4)
    ON CONFLICT(external_id) DO UPDATE SET role=EXCLUDED.role,mobile=EXCLUDED.mobile,name=EXCLUDED.name`,
  [user.id,user.role,user.mobile,user.name]);

  return { success: true, user };
}

function createAdminToken(user) {
  if (!adminJwtSecret) {
    return { error: "ADMIN_JWT_SECRET is not configured", status: 500 };
  }

  return {
    token: signJwt({ sub: user.id, role: user.role }),
    maxAge: JWT_TTL_SECONDS,
  };
}

async function getAdminUserFromRequest(req) {
  const payload = verifyJwt(getCookie(req, ADMIN_COOKIE_NAME));
  if (!payload || payload.role !== "admin") {
    return null;
  }

  const existingUser = (await query("SELECT * FROM users WHERE external_id=$1", [payload.sub])).rows[0];
  if (!existingUser) return createAdminUser();

  return {
    id: existingUser.external_id,
    role: existingUser.role,
    mobile: existingUser.mobile,
    name: existingUser.name,
  };
}

function requestOtp(store, mobile) {
  store.otpRequests.set(mobile, DEMO_OTP);
  return { success: true, demoOtp: DEMO_OTP };
}

async function verifyOtp(store, mobile, otp) {
  const expectedOtp = store.otpRequests.get(mobile) || DEMO_OTP;
  if (otp !== expectedOtp) {
    return { error: "Invalid OTP", status: 401 };
  }

  const role = mobile === ADMIN_MOBILE ? "admin" : "customer";
  const user = {
    id: `demo-${mobile}`,
    role,
    mobile: `+91${mobile}`,
    name: role === "admin" ? "Admin User" : "Demo User",
  };

  await query(`INSERT INTO users(external_id,role,mobile,name) VALUES($1,$2,$3,$4)
    ON CONFLICT(external_id) DO UPDATE SET role=EXCLUDED.role,mobile=EXCLUDED.mobile,name=EXCLUDED.name`,
  [user.id,user.role,user.mobile,user.name]);

  await recordUserActivity((await query("SELECT * FROM users WHERE external_id=$1", [user.id])).rows[0]);
  return { success: true, user };
}

async function verifyAdminPin(store, pin) {
  const trimmedPin = typeof pin === "string" ? pin.trim() : "";

  if (!adminPinSecret) {
    return { error: "ADMIN_PIN_SECRET is not configured", status: 500 };
  }

  if (!adminPin) {
    return { error: "ADMIN_PIN is not configured", status: 500 };
  }

  if (trimmedPin.length < 4 || trimmedPin.length > 64) {
    return { error: "Enter a valid secret key", status: 400 };
  }

  if (trimmedPin !== adminPin) {
    return { error: "Invalid secret key", status: 401 };
  }

  const user = createAdminUser();
  let adminUser = user;
  let initialized = false;

  await transaction(async (client) => {
    const existingPin = (await client.query("SELECT * FROM admin_pins WHERE key=$1 FOR UPDATE", [ADMIN_PIN_KEY])).rows[0];
    initialized = !existingPin;
    if (!existingPin) { const salt=crypto.randomBytes(16).toString("hex"); await client.query("INSERT INTO admin_pins(key,salt,pin_hash) VALUES($1,$2,$3)",[ADMIN_PIN_KEY,salt,hashPin(trimmedPin,salt)]); }
    else if (!verifyPin(trimmedPin,existingPin.salt,existingPin.pin_hash)) await client.query("UPDATE admin_pins SET pin_hash=$1 WHERE key=$2",[hashPin(trimmedPin,existingPin.salt),ADMIN_PIN_KEY]);
    const existingUser = (await client.query("SELECT * FROM users WHERE external_id=$1",[user.id])).rows[0];
    adminUser = {
      ...user,
      name: existingUser?.name || user.name,
      mobile: existingUser?.mobile || user.mobile,
    };
    await client.query(`INSERT INTO users(external_id,role,mobile,name) VALUES($1,$2,$3,$4)
      ON CONFLICT(external_id) DO UPDATE SET role=EXCLUDED.role,mobile=EXCLUDED.mobile,name=EXCLUDED.name`,[adminUser.id,adminUser.role,adminUser.mobile,adminUser.name]);
  });

  if (!store.get("users").find((entry) => entry.id === adminUser.id)) {
    store.push("users", adminUser);
  }

  return { success: true, user: adminUser, initialized };
}

module.exports = {
  ADMIN_COOKIE_NAME,
  createAdminToken,
  getAdminUserFromRequest,
  requestOtp,
  saveAdminUserProfile,
  verifyAdminPin,
  verifyOtp,
  registerMobileAccount,
  loginMobileAccount,
  loginGoogleAccount,
  getMobileAccount,
  updateMobileAccount,
  deleteMobileAccount,
  mobileSession,
};
