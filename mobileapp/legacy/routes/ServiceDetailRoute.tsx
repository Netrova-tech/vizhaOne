import { useParams } from "react-router-dom";
import ServiceDetailClient from "@/app/services/[id]/ServiceDetailClient";

export function ServiceDetailRoute() {
  const { id = "_" } = useParams();
  return <ServiceDetailClient id={id} />;
}
