"use client";

import { MessageCircle } from "lucide-react";

export function FloatingContact() {
  return (
    <div className="fixed bottom-24 right-5 md:bottom-8 md:right-8 flex flex-col gap-3 z-50">

      
      <a
        href="https://wa.me/918190094755"
        target="_blank"
        rel="noopener noreferrer"
        className="h-14 w-14 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-[20px] flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="WhatsApp Us"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
}
