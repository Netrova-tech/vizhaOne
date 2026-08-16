import { useEffect } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { VizhaOneAssistant } from "@/components/app/VizhaOneAssistant";

function TranslationCleanup() {
  useEffect(() => {
    // Google Translate's legacy widget injects an uncontrollable browser toolbar.
    // VizhaOne now uses its own language dictionary, so remove old widget state/UI.
    const expired = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax";
    document.cookie = expired;
    if (location.hostname) document.cookie = `${expired}; domain=${location.hostname}`;
    const removeLegacyUi = () => {
      document.querySelectorAll(
        '#google-translate-script, .goog-te-banner-frame, .goog-te-menu-frame, .goog-te-balloon-frame, #goog-gt-tt, iframe[src*="translate.google"]'
      ).forEach((node) => node.remove());
      document.documentElement.classList.remove("translated-ltr", "translated-rtl");
      document.body.style.setProperty("top", "0px", "important");
    };
    removeLegacyUi();
    const observer = new MutationObserver(removeLegacyUi);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return () => observer.disconnect();

  }, []);

  return null;
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
        <TranslationCleanup />
        <DiagnosticsBridge />
        {children}
        <VizhaOneAssistant />
        <Toaster richColors position="top-center" toastOptions={{ duration: 3000 }} />
      </LanguageProvider>
    </AuthProvider>
  );
}
