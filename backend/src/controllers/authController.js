const {
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
} = require("../services/authService");
const { superAdminEmail } = require("../config/env");

const authFailure=(res,error)=>res.status(error.status||500).json({error:error.message||"Authentication failed"});
async function registerController(req,res){try{return res.status(201).json(await registerMobileAccount(req.body||{}));}catch(error){return authFailure(res,error);}}
async function loginController(req,res){try{return res.json(await loginMobileAccount(req.body||{}));}catch(error){return authFailure(res,error);}}
async function googleLoginController(req,res){try{return res.json(await loginGoogleAccount(req.body||{}));}catch(error){return authFailure(res,error);}}
async function mobileMeController(req,res){try{const user=await getMobileAccount(req);return user?res.json({user}):res.status(401).json({error:"Session expired"});}catch(error){return authFailure(res,error);}}
async function mobileProfileController(req,res){try{const user=await updateMobileAccount(req,req.body||{});return user?res.json({success:true,user}):res.status(401).json({error:"Session expired"});}catch(error){return authFailure(res,error);}}
async function deleteMobileAccountController(req,res){try{const deleted=await deleteMobileAccount(req);return deleted?res.json({success:true}):res.status(401).json({error:"Session expired"});}catch(error){return authFailure(res,error);}}

function getAdminCookieOptions(maxAge) {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/",
    maxAge: maxAge ? maxAge * 1000 : undefined,
  };
}

async function requestOtpController(req, res, store) {
  const { mobile } = req.body || {};
  if (!mobile) {
    return res.status(400).json({ error: "mobile required" });
  }

  return res.json(requestOtp(store, mobile));
}

async function verifyOtpController(req, res, store) {
  const { mobile, otp } = req.body || {};
  if (!mobile || !otp) {
    return res.status(400).json({ error: "mobile and otp required" });
  }

  const result = await verifyOtp(store, mobile, otp);
  if (result.error) {
    return res.status(result.status || 400).json({ error: result.error });
  }

  if (result.user && result.user.role === "admin") {
    const tokenResult = createAdminToken(result.user);
    if (!tokenResult.error) {
      res.cookie(ADMIN_COOKIE_NAME, tokenResult.token, getAdminCookieOptions(tokenResult.maxAge));
    }
  }

  return res.json(result);
}

async function verifyAdminPinController(req, res, store) {
  const { pin } = req.body || {};
  if (!pin) {
    return res.status(400).json({ error: "pin required" });
  }

  const result = await verifyAdminPin(store, String(pin));
  if (result.error) {
    return res.status(result.status || 400).json({ error: result.error });
  }

  const tokenResult = createAdminToken(result.user);
  if (tokenResult.error) {
    return res.status(tokenResult.status || 500).json({ error: tokenResult.error });
  }

  res.cookie(ADMIN_COOKIE_NAME, tokenResult.token, getAdminCookieOptions(tokenResult.maxAge));
  return res.json(result);
}

async function superAdminLoginController(req, res, store) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  if (String(email).trim().toLowerCase() !== superAdminEmail.trim().toLowerCase()) {
    return res.status(401).json({ error: "Invalid Super Admin email or password" });
  }
  const result = await verifyAdminPin(store, String(password));
  if (result.error) return res.status(result.status || 401).json({ error: "Invalid Super Admin email or password" });
  const tokenResult = createAdminToken(result.user);
  if (tokenResult.error) return res.status(tokenResult.status || 500).json({ error: tokenResult.error });
  res.cookie(ADMIN_COOKIE_NAME, tokenResult.token, getAdminCookieOptions(tokenResult.maxAge));
  return res.json(result);
}

async function getSessionController(req, res) {
  const user = await getAdminUserFromRequest(req);
  return res.json({ user });
}

async function logoutController(_req, res) {
  res.clearCookie(ADMIN_COOKIE_NAME, getAdminCookieOptions());
  return res.json({ success: true });
}

async function updateAdminProfileController(req, res) {
  const adminUser = await getAdminUserFromRequest(req);
  if (!adminUser) {
    return res.status(401).json({ error: "Admin session required" });
  }

  const { name, mobile } = req.body || {};
  const result = await saveAdminUserProfile({ name, mobile });

  if (result.error) {
    return res.status(result.status || 400).json({ error: result.error });
  }

  return res.json(result);
}

module.exports = {
  getSessionController,
  logoutController,
  requestOtpController,
  updateAdminProfileController,
  verifyAdminPinController,
  superAdminLoginController,
  verifyOtpController,
  registerController,
  loginController,
  googleLoginController,
  mobileMeController,
  mobileProfileController,
  deleteMobileAccountController,
};
