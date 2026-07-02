"use client";

import { ExternalImg } from "@/components/ui/ExternalImg";
import { Link } from "react-router-dom";
import { MapPin, Star, Phone, MessageCircle, Heart, ShoppingCart, Edit, Trash2, Check, Share2 } from "lucide-react";
import type { Service } from "@/types";

import { Badge } from "@/components/ui/Badge";
import { memo, useState } from "react";
import { toast } from "sonner";
import { CategoryIcon } from "@/lib/iconMap";
import { formatServicePrice, hasVisiblePrice } from "@/lib/utils";

interface ServiceCardProps {
  service: Service;
  onAddToCart?: (service: Service) => void;
  isInCart?: boolean;
  onEdit?: (service: Service) => void;
  onDelete?: (service: Service) => void;
}

function loadFavoriteIds(): Set<string> {
  try {
    const raw = localStorage.getItem("vizha_favorites");
    const items = raw ? JSON.parse(raw) as { id: string }[] : [];
    return new Set(items.map((i) => i.id));
  } catch {
    return new Set();
  }
}

export const ServiceCard = memo(function ServiceCard({
  service, onAddToCart, isInCart, onEdit, onDelete,
}: ServiceCardProps) {
  const [liked, setLiked] = useState(() =>
    typeof window !== "undefined" ? loadFavoriteIds().has(service.id) : false
  );
  const [imgError, setImgError] = useState(false);
  const hasPrice = hasVisiblePrice(service.price) || hasVisiblePrice(service.price_min) || hasVisiblePrice(service.price_max);

  function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    const ids = loadFavoriteIds();
    const next = !ids.has(service.id);
    setLiked(next);
    try {
      const raw = localStorage.getItem("vizha_favorites");
      const items = raw ? JSON.parse(raw) as { id: string; savedAt?: string }[] : [];
      const updated = next
        ? [{ id: service.id, type: "service", title: service.title, price: service.price, image_url: service.image_url, location: service.location, icon: service.categories?.icon, savedAt: new Date().toISOString() }, ...items.filter((i) => i.id !== service.id)]
        : items.filter((i) => i.id !== service.id);
      localStorage.setItem("vizha_favorites", JSON.stringify(updated));
    } catch { /* ignore */ }
    toast(next ? "❤️ Saved to favorites" : "Removed from saved");
  }

  function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    const url = `${window.location.origin}/services/${service.id}`;
    if (navigator.share) {
      navigator.share({
        title: service.title,
        text: `Check out ${service.title} on VizhaOne!`,
        url: url,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  }

  const whatsappMsg = `Vanakkam! Naan "${service.title}" service book pananum. Please confirm availability.`;

  return (
    <div className={`card-premium overflow-hidden group hover:-translate-y-1 transition-all duration-300 border-2 ${
      isInCart ? "border-[#e11d48] ring-1 ring-[#e11d48]/20" : "border-transparent"
    }`}>
      {/* Image */}
      <Link to={`/services/${service.id}`} className="block relative h-52 overflow-hidden bg-gradient-to-br from-[#fff1f2] to-[#fff1f2]">
        {service.image_url && !imgError ? (
          <ExternalImg
            src={service.image_url}
            alt={service.title}
            fill
            className="transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[#e11d48]">
            {service.categories?.icon ? (
              <CategoryIcon icon={service.categories.icon} image={service.categories.category_image} className="h-16 w-16" />
            ) : (
              <span className="text-5xl">🎊</span>
            )}
          </div>
        )}
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <button
          onClick={handleShare}
          className="absolute top-3 right-14 h-9 w-9 rounded-full bg-white/90 flex items-center justify-center shadow-md transition-transform active:scale-90"
          aria-label="Share"
        >
          <Share2 className="h-4 w-4 text-gray-600 hover:text-[#e11d48]" />
        </button>
        <button
          onClick={handleFavorite}
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 flex items-center justify-center shadow-md transition-transform active:scale-90"
        >
          <Heart className={`h-4 w-4 transition-all ${liked ? "fill-red-500 text-red-500 scale-110" : "text-gray-500 hover:text-[#e11d48]"}`} />
        </button>
        {(onEdit || onDelete) && (
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            {onEdit && (
              <button onClick={(e) => { e.preventDefault(); onEdit(service); }}
                className="h-8 w-8 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white shadow-lg transition-colors">
                <Edit className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button onClick={(e) => { e.preventDefault(); onDelete(service); }}
                className="h-8 w-8 rounded-xl bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge variant={service.availability_status ? "green" : "red"}>
            {service.availability_status ? "Available" : "Booked"}
          </Badge>
        </div>
        {service.categories && (
          <div className="absolute bottom-3 left-3">
            <span className="text-xs bg-black/50 text-white px-2 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5">
              {service.categories.icon ? (
                <CategoryIcon icon={service.categories.icon} image={service.categories.category_image} className="h-3 w-3 text-white" />
              ) : (
                "🎊"
              )}
              {service.categories.category_name}
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <Link to={`/services/${service.id}`} className="hover:text-[#e11d48] transition-colors w-full">
            <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-1">{service.title}</h3>
          </Link>
        </div>

        {service.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{service.description}</p>
        )}

        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <MapPin className="h-3 w-3 text-[#e11d48] flex-shrink-0" />
          <span className="line-clamp-1">{service.location || "Tamil Nadu"}</span>
          {service.vendor_name && (
            <>
              <span className="text-gray-300 mx-1">•</span>
              <span className="line-clamp-1">{service.vendor_name}</span>
            </>
          )}
        </div>

        {/* Price & Actions */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Price</p>
            <p className={`text-sm font-bold ${hasPrice ? "text-[#be123c]" : "text-gray-500"}`}>
              {formatServicePrice(service)}
            </p>
          </div>
          {onAddToCart && (
            <button
              onClick={() => onAddToCart(service)}
              disabled={!service.availability_status}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 ${
                isInCart
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                  : service.availability_status
                  ? "bg-[#e11d48] text-white hover:bg-[#be123c] shadow-lg shadow-[#e11d48]/20"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isInCart ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Added
                </>
              ) : (
                <>
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Add to Plan
                </>
              )}
            </button>
          )}
        </div>

        {/* Contact buttons */}
        <div className="flex gap-2">
          {service.vendor_mobile && (
            <>
              <a
                href={`tel:${service.vendor_mobile}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                Call
              </a>
              <a
                href={`https://wa.me/91${service.vendor_mobile}?text=${encodeURIComponent(whatsappMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#e11d48] hover:bg-[#e11d48] text-white rounded-xl text-xs font-medium transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            </>
          )}
          <Link
            to={`/services/${service.id}`}
            className="flex-1 flex items-center justify-center py-2 border border-[#e11d48]/20 text-[#be123c] hover:bg-[#fff1f2] rounded-xl text-xs font-medium transition-colors"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
});
