import { useEffect } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { VizhaOneAssistant } from "@/components/app/VizhaOneAssistant";

declare global {
  interface Window {
    google?: { translate?: { TranslateElement: new (options: object, elementId: string) => void } };
    googleTranslateElementInit?: () => void;
    __vizha_translate?: (language: string) => void;
  }
}

function GoogleTranslationBridge() {
  useEffect(() => {
    let requestedLanguage = localStorage.getItem("vizha_lang") || "en";
    let retryTimer = 0;
    const suppressGoogleChrome = () => {
      document.documentElement.style.setProperty("top", "0px", "important");
      document.body.style.setProperty("top", "0px", "important");
      document.body.style.setProperty("margin-top", "0px", "important");
      document.querySelectorAll<HTMLElement>(
        ".goog-te-banner-frame, iframe.skiptranslate, .VIpgJd-ZVi9od-ORHb-OEVmcd, .VIpgJd-ZVi9od-aZ2wEe-wOHMyf, .VIpgJd-ZVi9od-aZ2wEe-OiiCO, #goog-gt-vt, #goog-gt-tt"
      ).forEach((element) => {
        element.style.setProperty("display", "none", "important");
        element.style.setProperty("visibility", "hidden", "important");
      });
    };
    const applyLanguage = (language: string) => {
      requestedLanguage = language;
      const combo = document.querySelector<HTMLSelectElement>("#google_translate_element .goog-te-combo");
      if (!combo) {
        window.clearTimeout(retryTimer);
        retryTimer = window.setTimeout(() => applyLanguage(requestedLanguage), 250);
        return;
      }
      combo.value = language;
      combo.dispatchEvent(new Event("change", { bubbles: true }));
      window.setTimeout(suppressGoogleChrome, 50);
      window.setTimeout(suppressGoogleChrome, 400);
    };
    window.__vizha_translate = applyLanguage;
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate || document.querySelector("#google_translate_element select")) return;
      new window.google.translate.TranslateElement({ pageLanguage: "en", includedLanguages: "en,ta,hi,ml,te", autoDisplay: false }, "google_translate_element");
      window.setTimeout(() => applyLanguage(requestedLanguage), 250);
    };
    if (window.google?.translate) window.googleTranslateElementInit();
    else if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.async = true;
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.head.appendChild(script);
    }
    suppressGoogleChrome();
    const observer = new MutationObserver(suppressGoogleChrome);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return () => { window.clearTimeout(retryTimer); observer.disconnect(); delete window.__vizha_translate; };
  }, []);
  return <div id="google_translate_element" aria-hidden="true" />;
}

function DiagnosticsBridge(){
  useEffect(()=>{
    const endpoint=process.env.NEXT_PUBLIC_MONITORING_URL||"";
    const report=(kind:string,message:string,stack?:string)=>{
      if(localStorage.getItem("vizha_analytics_consent")!=="granted")return;
      const event={kind,message:message.slice(0,500),stack:(stack||"").slice(0,1500),route:location.hash||location.pathname,app:"android",at:new Date().toISOString()};
      try{const recent=JSON.parse(localStorage.getItem("vizha_diagnostics")||"[]");localStorage.setItem("vizha_diagnostics",JSON.stringify([event,...recent].slice(0,20)))}catch{void 0}
      if(endpoint)void fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(event),keepalive:true}).catch(()=>undefined);
    };
    const error=(event:ErrorEvent)=>report("error",event.message,event.error?.stack);
    const rejection=(event:PromiseRejectionEvent)=>report("unhandled-rejection",event.reason instanceof Error?event.reason.message:String(event.reason),event.reason?.stack);
    window.addEventListener("error",error);window.addEventListener("unhandledrejection",rejection);
    return()=>{window.removeEventListener("error",error);window.removeEventListener("unhandledrejection",rejection)};
  },[]);
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <GoogleTranslationBridge />
        <DiagnosticsBridge />
        {children}
        <VizhaOneAssistant />
        <Toaster richColors position="top-center" toastOptions={{ duration: 3000 }} />
      </LanguageProvider>
    </AuthProvider>
  );
}
