const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const ts = require("typescript");

async function renderDashboard(request) {
  const states = [], effects = [], listeners = {}, module = { exports: {} };
  let cursor = 0, mounted = false;
  const element = (type, props) => ({ type, props });
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../legacy/app/provider-dashboard/page.tsx"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, {
    module, exports: module.exports, Error,
    window: { addEventListener: (name, fn) => { listeners[name] = fn; }, removeEventListener() {} },
    require(name) {
      if (name === "react") return {
        useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = typeof value === "function" ? value(states[i]) : value; }]; },
        useEffect(fn) { if (!mounted) effects.push(fn); },
      };
      if (name === "react/jsx-runtime") return { jsx: element, jsxs: element };
      if (name === "react-router-dom") return { Link: "a", useSearchParams: () => [new URLSearchParams()] };
      if (name === "@/context/AuthContext") return { useAuth: () => ({ user: { id: "vendor-1", name: "Studio" } }) };
      if (name === "@/lib/providerApi") return { providerRequest: request };
      if (name === "sonner") return { toast: {} };
      return {};
    }, URLSearchParams,
  });
  const render = () => { cursor = 0; return module.exports.default(); };
  render(); mounted = true;
  effects.forEach(fn => fn());
  await new Promise(resolve => setImmediate(resolve));
  return { render, listeners };
}

test("services remain visible when bookings fail and refresh when returning to the app", async () => {
  let services = [{ id: "service-1", title: "Wedding photography", location: "Chennai", availability_status: true, verified: false }];
  const app = await renderDashboard(async path => {
    if (path === "/bookings") throw new Error("Bookings unavailable");
    return { services };
  });
  assert.match(JSON.stringify(app.render()), /Wedding photography/);
  services = [...services, { ...services[0], id: "service-2", title: "New catering service" }];
  app.listeners.focus();
  await new Promise(resolve => setImmediate(resolve));
  assert.match(JSON.stringify(app.render()), /New catering service/);
});
