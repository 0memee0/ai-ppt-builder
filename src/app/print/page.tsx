import type { Metadata } from "next";
import { PrintPageClient } from "@/components/print/PrintPageClient";

export const metadata: Metadata = { title: "Print · Presentation Builder" };

export default function PrintPage() {
  return <PrintPageClient />;
}
