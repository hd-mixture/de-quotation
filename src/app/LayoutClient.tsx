"use client";
import Loader from "@/components/Loader";
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/next";
import QuotationLayout from "@/components/quotation-layout";
import { usePathname } from "next/navigation";

export default function LayoutClient() {
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  // Don't render QuotationLayout on the not-found page
  if (pathname === "/404" || pathname === "/_not-found") {
    return (
      <>
        <Toaster />
        <Analytics />
      </>
    );
  }

  return (
    <>
      {isLoading && <Loader />}
      <QuotationLayout isLoading={isLoading} setIsLoading={setIsLoading} />
      <Toaster />
      <Analytics />
    </>
  );
} 