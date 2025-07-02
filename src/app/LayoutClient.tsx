"use client";
import Loader from "@/components/Loader";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/next";
import QuotationLayout from "@/components/quotation-layout";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading && <Loader />}
      <QuotationLayout isLoading={isLoading} setIsLoading={setIsLoading} />
      <Toaster />
      <Analytics />
    </>
  );
} 