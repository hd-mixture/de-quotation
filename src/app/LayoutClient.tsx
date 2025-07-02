"use client";
import Loader from "@/components/Loader";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/next";
import QuotationLayout from "@/components/quotation-layout";

export default function LayoutClient() {
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