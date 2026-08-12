import { useParams } from "react-router-dom";
import HallDetailClient from "@/app/halls/[id]/HallDetailClient";

export function HallDetailRoute() {
  const { id = "_" } = useParams();
  return <HallDetailClient id={id} />;
}
