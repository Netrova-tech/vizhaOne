const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { zipSync } = require("fflate");
const root = path.resolve(__dirname, "..");
const keyPath = path.join(root, ".web-update-keys/private.pem");
const publicPath = path.join(root, "web-update-public.pem");

if (process.argv[2] === "init") {
  if (fs.existsSync(keyPath) || fs.existsSync(publicPath)) throw new Error("Signing keys already exist. Do not replace keys used by installed apps.");
  const keys = crypto.generateKeyPairSync("rsa", {
    modulusLength: 3072,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  fs.mkdirSync(path.dirname(keyPath), { recursive: true });
  fs.writeFileSync(keyPath, keys.privateKey, { flag: "wx", mode: 0o600 });
  fs.writeFileSync(publicPath, keys.publicKey, { flag: "wx" });
  console.log("Created web update signing keys. Back up .web-update-keys/private.pem securely; never upload it.");
} else {
  const base = new URL(process.argv[2]);
  if (base.protocol !== "https:" || base.search || base.hash) throw new Error("Provide an HTTPS hosting directory URL without query or fragment.");
  const version = fs.readFileSync(path.join(root, "android/app/build.gradle"), "utf8").match(/versionCode\s+(\d+)/)[1];
  const files = {};
  function collect(dir, prefix = "") {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const name = prefix + entry.name;
      if (entry.isDirectory()) collect(path.join(dir, entry.name), name + "/");
      else if (entry.isFile()) files[name] = fs.readFileSync(path.join(dir, entry.name));
      else throw new Error("Symlinks are not allowed in web releases");
    }
  }
  collect(path.join(root, "out"));
  if (!files["index.html"]) throw new Error("Run npm run build first");
  const zip = Buffer.from(zipSync(files, { level: 6 }));
  const hash = crypto.createHash("sha256").update(zip).digest();
  const bundleId = `android-${version}-${hash.toString("hex").slice(0, 24)}`;
  const privateKey = fs.readFileSync(process.env.WEB_UPDATE_PRIVATE_KEY || keyPath);
  const signature = crypto.sign("sha256", zip, privateKey).toString("base64");
  if (!crypto.verify("sha256", zip, fs.readFileSync(publicPath), Buffer.from(signature, "base64"))) throw new Error("Private key does not match this app's public key");
  const output = path.join(root, "web-releases", version);
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, `${bundleId}.zip`), zip);
  const manifest = { nativeBuild: version, bundleId, url: new URL(`${version}/${bundleId}.zip`, base.href.replace(/\/?$/, "/")).href, checksum: hash.toString("base64"), signature };
  fs.writeFileSync(path.join(output, "latest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Signed release written to web-releases/${version}. Upload the ZIP first, then latest.json.`);
}
