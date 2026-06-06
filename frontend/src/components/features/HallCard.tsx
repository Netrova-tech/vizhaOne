"use client";

import { ExternalImg } from "@/components/ui/ExternalImg";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Users, Car, Snowflake, Heart, Edit, Trash2, Share2 } from "lucide-react";
import type { Hall } from "@/types";

import { useLang } from "@/context/LanguageContext";
import { useState } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { formatPriceOrQuote, hasVisiblePrice } from "@/lib/utils";

interface HallCardProps {
  hall: Hall;
  onSelect?: (hall: Hall) => void;
  isSelected?: boolean;
  onEdit?: (hall: Hall) => void;
  onDelete?: (hall: Hall) => void;
}

export function HallCard({ hall, onSelect, isSelected, onEdit, onDelete }: HallCardProps) {
  const { t } = useLang();
  const { isFavorite, toggle } = useFavorites();
  const liked = isFavorite(hall.id);
  const [imgError, setImgError] = useState(false);
  const displayPrice = hall.price_per_day || hall.price_morning || hall.price_evening || 0;

  function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    toggle({ id: hall.id, type: "hall", title: hall.name, price: 0, image_url: hall.image_url, location: hall.location });
    toast(liked ? "Removed from saved" : "❤️ Saved to favorites");
  }

  function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    const url = `${window.location.origin}/halls/${hall.id}`;
    if (navigator.share) {
      navigator.share({
        title: hall.name,
        text: `Check out ${hall.name} on VizhaOne!`,
        url: url,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`card-premium overflow-hidden group ${isSelected ? "ring-2 ring-[#e11d48]" : ""}`}
    >
      {/* Image */}
      <Link to={`/halls/${hall.id}`} className="block relative h-52 overflow-hidden bg-gradient-to-br from-[#fff1f2] to-[#fff1f2]">
        {hall.image_url && !imgError ? (
          <ExternalImg
            src={hall.image_url}
            alt={hall.name}
            fill
            className="transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-5xl">🏛️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          {hall.has_ac && (
            <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full">
              <Snowflake className="h-3 w-3" /> AC
            </span>
          )}
          {hall.has_parking && (
            <span className="flex items-center gap-1 px-2 py-1 bg-gray-700/90 backdrop-blur-sm text-white text-xs font-bold rounded-full">
              <Car className="h-3 w-3" /> Parking
            </span>
          )}
        </div>

        <button
          onClick={handleShare}
          className="absolute top-3 right-14 h-9 w-9 rounded-full bg-white/90 flex items-center justify-center shadow-md transition-transform active:scale-90"
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
              <button onClick={(e) => { e.preventDefault(); onEdit(hall); }}
                className="h-8 w-8 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white shadow-lg transition-colors">
                <Edit className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button onClick={(e) => { e.preventDefault(); onDelete(hall); }}
                className="h-8 w-8 rounded-xl bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

      </Link>

      {/* Content */}
      <div className="p-4 sm:p-4">
        <Link to={`/halls/${hall.id}`} className="hover:text-[#e11d48] transition-colors">
          <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-1">{hall.name}</h3>
        </Link>

        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <MapPin className="h-3 w-3 text-[#e11d48] flex-shrink-0" />
          <span className="line-clamp-1">{hall.address}</span>
        </div>

        {hall.description && (
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-3">
            {hall.description}
          </p>
        )}

        {/* Capacity row */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-gray-600 bg-[#fff1f2] px-2 py-1 rounded-full">
            <Users className="h-3 w-3 text-[#e11d48]" />
            <span className="font-semibold">{hall.capacity}</span> {t("guests")}
          </div>
          {hall.rooms && (
            <div className="flex items-center gap-1 text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded-full">
              🚪 <span className="font-semibold">{hall.rooms}</span> rooms
            </div>
          )}
        </div>

        <div className="mb-3 rounded-2xl bg-gray-50 px-3 py-2 border border-gray-100">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Price</p>
          <p className={`text-sm font-bold ${hasVisiblePrice(displayPrice) ? "text-[#be123c]" : "text-gray-500"}`}>
            {formatPriceOrQuote(displayPrice)}
          </p>
          {!hasVisiblePrice(displayPrice) && (
            <p className="text-[10px] font-medium text-gray-400 mt-0.5">Final price confirmed by owner</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Link to={`/halls/${hall.id}`}
            className="w-full flex items-center justify-center py-2.5 bg-[#e11d48] hover:bg-[#be123c] text-white rounded-xl text-xs font-bold transition-colors">
            {t("viewDetails")}
          </Link>
        </div>

        {onSelect && (
          <button
            onClick={() => onSelect(hall)}
            className={`w-full mt-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isSelected
                ? "bg-[#be123c] text-white"
                : "border-2 border-[#e11d48] text-[#be123c] hover:bg-[#fff1f2]"
            }`}
          >
            {isSelected ? "✓ Selected for Planning" : `+ ${t("selectHall")}`}
          </button>
        )}
      </div>
    </motion.div>
  );
}
