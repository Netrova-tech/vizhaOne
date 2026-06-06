import { useParams } from "react-router-dom";
import PackageDetailClient from "@/app/packages/[id]/PackageDetailClient";

export function PackageDetailRoute() {
  const { id = "_" } = useParams();
  return <PackageDetailClient id={id} />;
}
