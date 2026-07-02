const mongoose = require("mongoose");
const crypto = require("node:crypto");
const AdminPin = require("../models/AdminPin");
const User = require("../models/User");
const { adminJwtSecret, adminPin, adminPinSecret } = require("../config/env");

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

function hashLegacyPin(pin, salt) {
  return crypto.pbkdf2Sync(pin, salt, 120000, 64, "sha512").toString("hex");
}

function verifyPin(pin, salt, hash) {
  const entered = Buffer.from(hashPin(pin, salt), "hex");
  const stored = Buffer.from(hash, "hex");

  return entered.length === stored.length && crypto.timingSafeEqual(entered, stored);
}

function verifyLegacyPin(pin, salt, hash) {
  const entered = Buffer.from(hashLegacyPin(pin, salt), "hex");
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
  if (mongoose.connection.readyState !== 1) {
    return { error: "Database is not connected", status: 503 };
  }

  const user = {
    ...createAdminUser(),
    name: profile.name?.trim() || "Admin User",
    mobile: profile.mobile?.trim() || `+91${ADMIN_MOBILE}`,
  };

  await User.findOneAndUpdate(
    { externalId: user.id },
    {
      externalId: user.id,
      role: user.role,
      mobile: user.mobile,
      name: user.name,
    },
    { upsert: true, new: true }
  );

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

  if (mongoose.connection.readyState !== 1) {
    return createAdminUser();
  }

  const existingUser = await User.findOne({ externalId: payload.sub });
  if (!existingUser) return createAdminUser();

  return {
    id: existingUser.externalId,
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

  const role = mobile === ADMIN_MOBILE ? "admin" : "user";
  const user = {
    id: `demo-${mobile}`,
    role,
    mobile: `+91${mobile}`,
    name: role === "admin" ? "Admin User" : "Demo User",
  };

  if (mongoose.connection.readyState === 1) {
    await User.findOneAndUpdate(
      { externalId: user.id },
      {
        externalId: user.id,
        role: user.role,
        mobile: user.mobile,
        name: user.name,
      },
      { upsert: true, new: true }
    );
  } else {
    const users = store.get("users");
    if (!users.find((entry) => entry.id === user.id)) {
      store.push("users", user);
    }
  }

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

  if (mongoose.connection.readyState !== 1) {
    return { error: "Database is not connected", status: 503 };
  }

  const existingPin = await AdminPin.findOne({ key: ADMIN_PIN_KEY });

  if (!existingPin) {
    const salt = crypto.randomBytes(16).toString("hex");

    await AdminPin.create({
      key: ADMIN_PIN_KEY,
      salt,
      pinHash: hashPin(trimmedPin, salt),
    });
  } else if (!verifyPin(trimmedPin, existingPin.salt, existingPin.pinHash)) {
    existingPin.pinHash = hashPin(trimmedPin, existingPin.salt);
    await existingPin.save();
  }

  const existingUser = await User.findOne({ externalId: user.id });
  const adminUser = {
    ...user,
    name: existingUser?.name || user.name,
    mobile: existingUser?.mobile || user.mobile,
  };

  await User.findOneAndUpdate(
    { externalId: user.id },
    {
      externalId: adminUser.id,
      role: adminUser.role,
      mobile: adminUser.mobile,
      name: adminUser.name,
    },
    { upsert: true, new: true }
  );

  if (!store.get("users").find((entry) => entry.id === adminUser.id)) {
    store.push("users", adminUser);
  }

  return { success: true, user: adminUser, initialized: !existingPin };
}

module.exports = {
  ADMIN_COOKIE_NAME,
  createAdminToken,
  getAdminUserFromRequest,
  requestOtp,
  saveAdminUserProfile,
  verifyAdminPin,
  verifyOtp,
};
