const { test } = require("node:test");
const assert = require("node:assert/strict");
const { getAppScrollTop, scrollAppTo } = require("../legacy/lib/appScroll.ts");

function withViewport(t, overflowY, rootTop, windowTop) {
  const previous = { document: globalThis.document, window: globalThis.window };
  const root = { scrollTop: rootTop, scrollTo({ top, behavior }) {
    assert.equal(behavior, "instant");
    this.scrollTop = top;
  } };
  globalThis.document = { querySelector: () => root };
  globalThis.window = {
    scrollY: windowTop,
    getComputedStyle: () => ({ overflowY }),
    scrollTo({ top, behavior }) {
      assert.equal(behavior, "instant");
      this.scrollY = top;
    },
  };
  t.after(() => {
    if (previous.document === undefined) delete globalThis.document;
    else globalThis.document = previous.document;
    if (previous.window === undefined) delete globalThis.window;
    else globalThis.window = previous.window;
  });
  return root;
}

test("native Explore returns to its container position while window scroll stays zero", t => {
  const root = withViewport(t, "scroll", 1260, 0);
  const savedPosition = getAppScrollTop();
  assert.equal(savedPosition, 1260);
  scrollAppTo(0); // Opening a service starts that page at the top.
  assert.equal(root.scrollTop, 0);
  root.scrollTop = 400; // Browsing the service must not replace the saved position.
  scrollAppTo(savedPosition);
  assert.equal(root.scrollTop, 1260);
  assert.equal(window.scrollY, 0);
});

test("browser Explore uses document scrolling when its wrapper is not scrollable", t => {
  const root = withViewport(t, "visible", 0, 945);
  const savedPosition = getAppScrollTop();
  assert.equal(savedPosition, 945);
  scrollAppTo(0);
  assert.equal(window.scrollY, 0);
  scrollAppTo(savedPosition);
  assert.equal(window.scrollY, 945);
  assert.equal(root.scrollTop, 0);
});

test("auto-scrolling app wrappers restore using the wrapper", t => {
  const root = withViewport(t, "auto", 700, 0);
  assert.equal(getAppScrollTop(), 700);
  scrollAppTo(300);
  assert.equal(root.scrollTop, 300);
});

test("pages without an app wrapper retain browser scrolling", t => {
  withViewport(t, "visible", 0, 250);
  document.querySelector = () => null;
  assert.equal(getAppScrollTop(), 250);
  scrollAppTo(100);
  assert.equal(window.scrollY, 100);
});
