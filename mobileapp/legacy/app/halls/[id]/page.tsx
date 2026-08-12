import { DEMO_HALLS } from "@/data/halls";
import HallDetailClient from "./HallDetailClient";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default async function HallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HallDetailClient id={id} />;
}
