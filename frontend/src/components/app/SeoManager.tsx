import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE="https://www.vizhaone.com";
const defaults={title:"VizhaOne — Find & Book Event Venues and Vendors Across India",description:"Discover verified event venues and vendors across India. Compare options, request quotes and plan every celebration with VizhaOne."};
const pages:Record<string,{title:string;description:string}>={
  "/":defaults,
  "/services":{title:"Event Vendors & Services Across India | VizhaOne",description:"Find caterers, decorators, photographers, makeup artists and event professionals. Compare services, prices and request quotes on VizhaOne."},
  "/halls":{title:"Wedding Halls & Event Venues Across India | VizhaOne",description:"Discover marriage halls and event venues, compare capacity, facilities and prices, and send booking requests with VizhaOne."},
  "/calculator":{title:"Free Event Budget Planner | VizhaOne",description:"Plan your wedding or celebration budget, estimate category costs and stay on track with VizhaOne's event budget planner."},
  "/invitations":{title:"Create Digital Event Invitations | VizhaOne",description:"Create and share elegant digital invitations for weddings, birthdays and celebrations with VizhaOne."},
  "/about":{title:"About VizhaOne | India's Celebration Marketplace",description:"Learn how VizhaOne helps families across India discover trusted event professionals and manage celebrations in one place."},
  "/vendor-onboarding":{title:"List Your Event Service on VizhaOne",description:"Grow your event business across India. Create your VizhaOne vendor listing and connect with customers planning celebrations."},
};

function setMeta(name:string,content:string){let element=document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);if(!element){element=document.createElement("meta");element.name=name;document.head.appendChild(element)}element.content=content}
const words=(value:string)=>decodeURIComponent(value).replace(/-/g," ").replace(/\b\w/g,letter=>letter.toUpperCase());
export function SeoManager(){const {pathname}=useLocation();useEffect(()=>{const vendorMatch=pathname.match(/^\/vendors\/([^/]+)\/([^/]+)$/);const page=vendorMatch?{title:`${words(vendorMatch[1])} in ${words(vendorMatch[2])} | VizhaOne`,description:`Discover ${words(vendorMatch[1]).toLowerCase()} in ${words(vendorMatch[2])}. Compare verified event professionals, prices and services on VizhaOne.`}:pages[pathname]||defaults;document.title=page.title;setMeta("description",page.description);let canonical=document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');if(!canonical){canonical=document.createElement("link");canonical.rel="canonical";document.head.appendChild(canonical)}canonical.href=`${SITE}${pathname==="/"?"/":pathname}`;},[pathname]);return null}
