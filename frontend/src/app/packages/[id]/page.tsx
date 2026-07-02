import { DEMO_PACKAGES } from "@/data/demo";
import PackageDetailClient from "./PackageDetailClient";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PackageDetailClient id={id} />;
}
