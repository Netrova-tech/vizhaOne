const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), os = require("node:os"), crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

test("CI packages a signed update into the backend without including the signing key", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vizhaone-release-"));
  try {
    for (const name of ["scripts", "out", "android/app"]) fs.mkdirSync(path.join(dir, name), { recursive: true });
    fs.copyFileSync(path.join(__dirname, "../scripts/web-release.cjs"), path.join(dir, "scripts/web-release.cjs"));
    fs.writeFileSync(path.join(dir, "out/index.html"), "<html>Updated application</html>");
    fs.writeFileSync(path.join(dir, "android/app/build.gradle"), "versionCode 23");
    const keys = crypto.generateKeyPairSync("rsa", { modulusLength: 2048, publicKeyEncoding: { type: "spki", format: "pem" }, privateKeyEncoding: { type: "pkcs8", format: "pem" } });
    fs.writeFileSync(path.join(dir, "web-update-public.pem"), keys.publicKey);
    const output = path.join(dir, "backend/src/web-updates");
    const env = { ...process.env, NODE_PATH: path.join(__dirname, "../node_modules"), WEB_UPDATE_SIGNING_KEY: keys.privateKey, WEB_UPDATE_OUTPUT_DIR: output };
    const run = () => spawnSync(process.execPath, [path.join(dir, "scripts/web-release.cjs"), "https://api.example/api/web-updates/"], { env, encoding: "utf8" });
    const result = run();
    assert.equal(result.status, 0, result.stderr);
    const manifest = JSON.parse(fs.readFileSync(path.join(output, "23/latest.json")));
    const zip = fs.readFileSync(path.join(output, "23", `${manifest.bundleId}.zip`));
    assert.equal(manifest.nativeBuild, "23");
    assert.equal(manifest.url, `https://api.example/api/web-updates/23/${manifest.bundleId}.zip`);
    assert.equal(manifest.checksum, crypto.createHash("sha256").update(zip).digest("base64"));
    assert.ok(crypto.verify("sha256", zip, keys.publicKey, Buffer.from(manifest.signature, "base64")));
    const files = require("fflate").unzipSync(zip);
    assert.deepEqual(Object.keys(files), ["index.html"]);
    assert.ok(!result.stdout.includes(keys.privateKey));
    env.WEB_UPDATE_SIGNING_KEY = crypto.generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } }).privateKey;
    const invalid = run();
    assert.notEqual(invalid.status, 0);
    assert.match(invalid.stderr, /Private key does not match/);
  } finally {
    const relative = path.relative(os.tmpdir(), dir);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Refusing to remove a directory outside the temporary workspace");
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
