// Native builds scroll this container; browser builds scroll the document.
function appScrollContainer() {
  const root = document.querySelector<HTMLElement>(".app-scroll-root");
  if (root && /^(auto|scroll)$/.test(window.getComputedStyle(root).overflowY)) {
    return root;
  }
  return null;
}

export function getAppScrollTop(): number {
  return appScrollContainer()?.scrollTop ?? window.scrollY;
}

export function scrollAppTo(top: number) {
  const target = appScrollContainer();
  if (target) target.scrollTo({ top, behavior: "instant" });
  else window.scrollTo({ top, behavior: "instant" });
}
