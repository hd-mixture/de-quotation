"use client";

import Link from 'next/link';
import { FileText, Plus, Trash2 } from 'lucide-react';
import type { QuotationWithId } from '@/types';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface QuotationSidebarProps {
  quotations: QuotationWithId[];
  activeId: string | null;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export default function QuotationSidebar({ quotations, activeId, onDelete, isLoading }: QuotationSidebarProps) {
  const isMobile = useIsMobile();
  const { setOpenMobile, state } = useSidebar();
  
  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      onDelete(id);
  }

  const newQuotationButton = (
      <Button asChild className="w-full group-data-[state=collapsed]:w-auto group-data-[state=collapsed]:p-2">
          <Link href="/" onClick={() => isMobile && setOpenMobile(false)}>
              <Plus className="mr-2 h-4 w-4 group-data-[state=collapsed]:mr-0" />
              <span className="group-data-[state=collapsed]:hidden">New Quotation</span>
          </Link>
      </Button>
  );


  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex items-center justify-between p-3 border-b border-sidebar-border">
        <h2 className="text-lg font-semibold text-sidebar-primary group-data-[state=collapsed]:hidden">DE Quotations</h2>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent>
        <div className="p-2 flex justify-center">
            <Tooltip>
                <TooltipTrigger asChild>
                    {newQuotationButton}
                </TooltipTrigger>
                {state === 'collapsed' && (
                <TooltipContent side="right" align="center">
                    New Quotation
                </TooltipContent>
                )}
            </Tooltip>
        </div>
        <SidebarMenu>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <SidebarMenuSkeleton key={i} showIcon />)
          ) : (
            quotations.map((quote) => (
              <SidebarMenuItem key={quote.id}>
                <SidebarMenuButton
                  asChild
                  isActive={activeId === quote.id}
                  tooltip={quote.quoteName || "Untitled Quotation"}
                  className="justify-start"
                >
                  <Link href={`/?id=${quote.id}`} onClick={() => isMobile && setOpenMobile(false)}>
                    <FileText className="h-4 w-4" />
                    <span className="truncate ml-2">{quote.quoteName || "Untitled Quotation"}</span>
                  </Link>
                </SidebarMenuButton>
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 focus:opacity-100 group-data-[state=collapsed]:hidden md:opacity-0 md:group-hover:opacity-100"
                    onClick={(e) => handleDeleteClick(e, quote.id)}
                 >
                    <Trash2 className="h-4 w-4 text-destructive" />
                 </Button>
              </SidebarMenuItem>
            ))
          )}
        </SidebarMenu>
        <style>{`.nextra-sidebar-container .nextra-sidebar-footer { display: none !important; } .nextra-sidebar-container .nextra-sidebar-logo { display: none !important; }`}</style>
      </SidebarContent>
    </Sidebar>
  );
}
