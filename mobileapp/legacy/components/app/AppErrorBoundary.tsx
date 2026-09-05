"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export class AppErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{
  state={failed:false};
  static getDerivedStateFromError(){return{failed:true}};
  componentDidCatch(error:Error,info:ErrorInfo){try{localStorage.setItem("vizha_last_ui_error",JSON.stringify({message:error.message,stack:info.componentStack||"",at:new Date().toISOString()}))}catch{void 0}}
  render(){if(!this.state.failed)return this.props.children;return <main className="grid min-h-dvh place-items-center bg-[#fffafb] p-6 text-center"><section className="w-full max-w-sm rounded-[30px] border border-rose-100 bg-white p-7 shadow-2xl"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-600"><AlertTriangle className="h-8 w-8"/></span><h1 className="mt-5 text-xl font-black text-gray-950">Something didn’t load correctly</h1><p className="mt-2 text-sm leading-6 text-gray-500">Your information is safe. Check your connection and retry this screen.</p><button type="button" onClick={()=>window.location.reload()} className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#6e1637] text-sm font-black text-white"><RefreshCw className="h-4 w-4"/>Retry app</button></section></main>}
}
