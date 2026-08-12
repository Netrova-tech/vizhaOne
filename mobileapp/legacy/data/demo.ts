// Demo seed data for VizhaOne — Tamil Nadu event marketplace
// Used for initial display before Supabase is connected

export const DEMO_CATEGORIES = [
  { id: "1", category_name: "Catering", icon: "UtensilsCrossed", description: "Professional catering" },
  { id: "2", category_name: "Tea Stall", icon: "Coffee", description: "Traditional tea" },
  { id: "3", category_name: "Ice Cream", icon: "Cone", description: "Ice cream counters" },
  { id: "4", category_name: "Popcorn", icon: "Popcorn", description: "Popcorn stalls" },
  { id: "5", category_name: "Sandai Melam", icon: "Music", description: "Traditional music" },
  { id: "6", category_name: "Stage Decoration", icon: "Sparkles", description: "Stage setups" },
  { id: "7", category_name: "Flower Decoration", icon: "Flower2", description: "Flower arrangements" },
  { id: "8", category_name: "Photography", icon: "Camera", description: "Event photography" },
  { id: "9", category_name: "DJ Sound", icon: "Music2", description: "DJ & sound system" },
  { id: "10", category_name: "Dancers", icon: "Users", description: "Dance performances" },
  { id: "11", category_name: "Chairs & Tables", icon: "TableProperties", description: "Furniture rental" },
  { id: "14", category_name: "Balloon Decoration", icon: "Balloon", description: "Balloon arrangements" },
  { id: "15", category_name: "Return Gifts", icon: "Gift", description: "Return gift packages" },
  { id: "16", category_name: "Parking", icon: "ParkingCircle", description: "Parking management" },
  { id: "17", category_name: "Makeup Artist", icon: "Wand2", description: "Bridal makeup" },
  { id: "18", category_name: "Mehendi", icon: "Leaf", description: "Mehendi designs" },
  { id: "19", category_name: "Event Lighting", icon: "Lightbulb", description: "Lighting setups" },
];

export const DEMO_SERVICES = [];

export const DEMO_PACKAGES: {
  id: string; name: string; package_type: string; description: string;
  total_price: number; image_url: string; services: string[]; features: string[]; is_active: boolean;
}[] = [];

export const TESTIMONIALS: {
  id: number; name: string; location: string; text: string; rating: number; avatar: string;
}[] = [];
