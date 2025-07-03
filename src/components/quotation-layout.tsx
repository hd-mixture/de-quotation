"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Quotation, QuotationWithId } from '@/types';

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import QuotationSidebar from '@/components/quotation-sidebar';
import QuoteGenerator from '@/components/quote-generator';
import { useToast } from '@/hooks/use-toast';
import Loader from "@/components/Loader";

const defaultQuotationValues: Quotation = {
  companyName: "DARSHAN ENTERPRISES",
  companyAddress: "A-29, Radhey Krishna Recidency Nr. Glorious School, Valia Road GIDC Ankleshwar, Dist- Bharuch (Guj) 393001",
  companyEmail: "cheharmata@rediffmail.com",
  companyPhone: "9998016708",
  customerName: "",
  customerAddress: "",
  kindAttention: "",
  quoteName: "",
  quoteDate: new Date(),
  subject: "",
  lineItems: [{ description: "", quantity: 1, unit: "Sqft", rate: undefined }],
  terms: `1. Subject to be Ankleshwar Juriduction.\n2. Payment 50% Advance and 50% After work Completed.\n3. Work started with in 4 days after receiving of work order.\n4. GST Extra 18% (24BCVPP7836H1ZW).\n5. Without Advance I am not agree for Work.`,
  authorisedSignatory: "Mata Prasad Prajapati",
  headerImage: undefined,
};

export default function QuotationLayout({ isLoading, setIsLoading }: { isLoading: boolean, setIsLoading: (v: boolean) => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [quotations, setQuotations] = useState<QuotationWithId[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  const activeId = searchParams.get('id');

  useEffect(() => {
    const q = query(collection(db, 'quotations'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const quotesData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          quoteDate: data.quoteDate?.toDate(), // Convert Firestore Timestamp to Date
        } as QuotationWithId;
      });
      setQuotations(quotesData);
      setIsLoading(false); // Set global loading to false when data is loaded
    }, (error) => {
      console.error("Error fetching quotations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch quotations from the database.",
      });
      setIsLoading(false); // Set global loading to false on error
    });

    return () => unsubscribe();
  }, [toast, setIsLoading]);

  useEffect(() => {
    setLocalLoading(true);
    const timer = setTimeout(() => setLocalLoading(false), 400);
    return () => clearTimeout(timer);
  }, [activeId]);

  const activeQuotation = useMemo(() => {
    if (!activeId) return defaultQuotationValues;
    const found = quotations.find(q => q.id === activeId);
    return found ? { ...found } : defaultQuotationValues;
  }, [activeId, quotations]);

  const handleSave = async (data: Quotation) => {
    setIsSaving(true);
    try {
      const dataToSave = {
        ...data,
        quoteDate: data.quoteDate, // Keep as Date object, Firestore will convert it
        headerImage: data.headerImage === undefined ? null : data.headerImage,
      };

      if (activeId) {
        // Update existing quotation
        const quoteRef = doc(db, 'quotations', activeId);
        await updateDoc(quoteRef, {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Success", description: "Quotation updated successfully." });
      } else {
        // Create new quotation
        const docRef = await addDoc(collection(db, 'quotations'), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Success", description: "Quotation saved successfully." });
        router.push(`/?id=${docRef.id}`);
      }
    } catch (error) {
      console.error("Error saving quotation: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save quotation.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this quotation?")) return;

    try {
      await deleteDoc(doc(db, 'quotations', id));
      toast({ title: "Deleted", description: "Quotation has been deleted." });
      if (activeId === id) {
        router.push('/');
      }
    } catch (error) {
      console.error("Error deleting document: ", error);
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete quotation.",
      });
    }
  };

  return (
    <>
      {localLoading && <Loader visible={localLoading} />}
      <SidebarProvider>
        <QuotationSidebar
          quotations={quotations}
          activeId={activeId}
          onDelete={handleDelete}
          isLoading={isLoading}
        />
        <SidebarInset>
          <div className="flex flex-col h-svh">
              <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
                  <SidebarTrigger className="md:hidden"/>
                  <div className="flex-1">
                      <h1 className="text-xl md:text-2xl font-semibold">
                          DE Quotation Generator
                      </h1>
                  </div>
              </header>
              <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                  <div className="max-w-screen-2xl mx-auto">
                      <p className="text-muted-foreground mb-8 max-w-3xl">
                          Create, edit, and manage professional quotations. Your changes are saved when you click the download button.
                      </p>
                      <QuoteGenerator
                          key={activeId || 'new'}
                          initialData={activeQuotation}
                          onSave={handleSave}
                          isSaving={isSaving}
                      />
                  </div>
              </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
