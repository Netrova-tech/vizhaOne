import { useEffect } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { VizhaOneAssistant } from "@/components/app/VizhaOneAssistant";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    __vizha_translate?: (targetLang: string) => void;
    google?: {
      translate?: {
        TranslateElement?: new (
          options: Record<string, unknown>,
          elementId: string
        ) => unknown;
      };
    };
  }
}

function GoogleTranslateBridge() {
  useEffect(() => {
    // Guard: only load once, even with StrictMode double-invoke
    if (document.getElementById("google-translate-script")) return;

    window.googleTranslateElementInit = () => {
      const TranslateElement = window.google?.translate?.TranslateElement;
      if (!TranslateElement) return;
      // Only init if container exists and is empty
      const container = document.getElementById("google_translate_element");
      if (!container || container.childNodes.length > 0) return;

      new TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,ta,hi,ml,kn,te",
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };

    window.__vizha_translate = (targetLang: string) => {
      if (targetLang === "en") {
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${location.hostname}`;
      } else {
        const value = `/en/${targetLang}`;
        document.cookie = `googtrans=${value}; path=/`;
        document.cookie = `googtrans=${value}; path=/; domain=${location.hostname}`;
      }

      const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
      if (combo) {
        combo.value = targetLang;
        combo.dispatchEvent(new Event("change"));
      } else {
        location.reload();
      }
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

    // Intentionally no cleanup — Google Translate doesn't support teardown
    // and removing the script causes re-init loops in React StrictMode
  }, []);

  return <div id="google_translate_element" className="hidden" />;
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
        <GoogleTranslateBridge />
        <DiagnosticsBridge />
        {children}
        <VizhaOneAssistant />
        <Toaster richColors position="top-center" toastOptions={{ duration: 3000 }} />
      </LanguageProvider>
    </AuthProvider>
  );
}
