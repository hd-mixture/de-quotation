"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download, PlusCircle, Trash2, Upload, XCircle, Save } from "lucide-react";
import type { Quotation, QuotationWithId } from "@/types";
import { quotationSchema } from "@/lib/schemas";
import { generatePdf } from "@/lib/pdf-generator";
import { cn } from "@/lib/utils";
import { defaultHeaderImage } from '@/lib/default-header-image';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface QuoteGeneratorProps {
  initialData: Quotation | QuotationWithId;
  onSave: (data: Quotation) => void;
  isSaving: boolean;
}

export default function QuoteGenerator({ initialData, onSave, isSaving }: QuoteGeneratorProps) {
  const { toast } = useToast();

  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const form = useForm<Quotation>({
    resolver: zodResolver(quotationSchema),
    defaultValues: initialData,
  });
  
  useEffect(() => {
    form.reset(initialData);
    // if it's a new quote (no id), reset the date on the client to avoid hydration error
    if (!('id' in initialData)) {
      form.setValue('quoteDate', new Date());
    }
  }, [initialData, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });
  
  const watchedItems = form.watch("lineItems");
  const watchedHeaderImage = form.watch("headerImage");
  const headerImageToUse = watchedHeaderImage || defaultHeaderImage;
  const totalAmount = watchedItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.rate || 0), 0);

  const handleHeaderImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          variant: "destructive",
          title: "Image too large",
          description: "Please upload an image smaller than 2MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("headerImage", reader.result as string, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const onGeneratePdf = async () => {
    const data = form.getValues();
    const validation = quotationSchema.safeParse(data);
    if (!validation.success) {
        toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Please fill all required fields before generating the PDF.",
        });
        form.trigger();
        return;
    }

    // If the form is dirty (unsaved changes), save first
    if (form.formState.isDirty) {
      await onSave(validation.data);
      // Optionally, you can reset the form's dirty state here if needed
    }

    await generatePdf(validation.data, validation.data.headerImage ? validation.data.headerImage : null);
     toast({
        title: "PDF Generated!",
        description: `${validation.data.quoteName}.pdf has been downloaded.`,
        className: "bg-accent text-accent-foreground",
    });
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-8">
          <div className="flex justify-end gap-4">
              <Button type="button" size="lg" variant="outline" onClick={onGeneratePdf}>
                  <Download className="mr-2 h-5 w-5" />
                  Download PDF
              </Button>
              <Button type="submit" size="lg" disabled={isSaving || !form.formState.isDirty}>
                  <Save className="mr-2 h-5 w-5" />
                  {isSaving ? "Saving..." : "Save Quotation"}
              </Button>
          </div>
          
          <Card>
              <CardHeader>
                  <CardTitle>Company Details & Header</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6 items-start">
                    <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Company Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your Company LLC" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    <div className="space-y-2">
                        <Label>Header Image (Optional Letterhead)</Label>
                        <div className="flex items-center gap-4">
                            {watchedHeaderImage ? (
                            <div className="relative w-48 h-24 border rounded-md overflow-hidden bg-muted/50">
                              <Image src={watchedHeaderImage} alt="Header Preview" fill style={{ objectFit: "contain" }} data-ai-hint="company logo" />
                              <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6 bg-background/50" onClick={() => form.setValue('headerImage', undefined, { shouldDirty: true })}><XCircle className="h-4 w-4 text-destructive" /></Button>
                            </div>
                            ) : (
                            <div className="relative w-48 h-24 border rounded-md overflow-hidden bg-muted/50">
                              <Image src="/header.png" alt="Default Header Preview" fill style={{ objectFit: "contain" }} data-ai-hint="company logo" />
                            </div>
                            )}
                            <Button asChild variant="outline">
                                <label htmlFor="header-upload" className="cursor-pointer">
                                    <Upload className="mr-2 h-4 w-4"/> Upload
                                    <input id="header-upload" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleHeaderImageUpload}/>
                                </label>
                            </Button>
                        </div>
                    </div>
                  </div>
                  <FormField
                      control={form.control}
                      name="companyAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="123 Business Rd, Suite 100, Biz Town" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="companyEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Email</FormLabel>
                            <FormControl>
                              <Input placeholder="contact@company.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="companyPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="(123) 456-7890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>
              </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
              <Card>
                  <CardHeader><CardTitle>Customer Details</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                      <FormField control={form.control} name="customerName" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Customer Name</FormLabel>
                              <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                              <FormMessage />
                          </FormItem>
                      )} />
                      <FormField control={form.control} name="customerAddress" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Customer Address</FormLabel>
                              <FormControl><Textarea placeholder="123 Main St, Anytown, USA" {...field} /></FormControl>
                              <FormMessage />
                          </FormItem>
                      )} />
                      <FormField control={form.control} name="kindAttention" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Kind Attention (Optional)</FormLabel>
                              <FormControl><Input placeholder="Mr. Smith" {...field} /></FormControl>
                              <FormMessage />
                          </FormItem>
                      )} />
                  </CardContent>
              </Card>
              <Card>
                  <CardHeader><CardTitle>Quotation Details</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                      <FormField control={form.control} name="quoteName" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Quotation Name</FormLabel>
                              <FormControl><Input placeholder="e.g. Project-XYZ-Phase1" {...field} /></FormControl>
                              <FormMessage />
                          </FormItem>
                      )} />
                      <FormField control={form.control} name="quoteDate" render={({ field }) => (
                          <FormItem className="flex flex-col">
                              <FormLabel>Quotation Date</FormLabel>
                              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                                  <PopoverTrigger asChild>
                                      <FormControl>
                                          <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                              {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                          </Button>
                                      </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                          mode="single"
                                          selected={field.value ? new Date(field.value) : undefined}
                                          onSelect={(date) => {
                                              field.onChange(date);
                                              setDatePickerOpen(false);
                                          }}
                                          initialFocus
                                      />
                                  </PopoverContent>
                              </Popover>
                              <FormMessage />
                          </FormItem>
                      )} />
                      <FormField control={form.control} name="subject" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Subject</FormLabel>
                              <FormControl><Textarea placeholder="Quotation for Web Development Services" {...field} /></FormControl>
                              <FormMessage />
                          </FormItem>
                      )} />
                  </CardContent>
              </Card>
          </div>

          <Card>
              <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      {fields.map((field, index) => (
                          <div key={field.id} className="flex flex-wrap items-start gap-4 p-4 border rounded-lg relative">
                              <div className="font-bold text-lg text-muted-foreground pt-8">{index + 1}</div>
                              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                                  <FormField control={form.control} name={`lineItems.${index}.description`} render={({ field }) => (
                                      <FormItem className="md:col-span-2">
                                          <FormLabel>Description</FormLabel>
                                          <FormControl><Input placeholder="e.g. Providing and Fixing top cover of Tarpaulin shed." {...field} /></FormControl>
                                          <FormMessage />
                                      </FormItem>
                                  )} />
                                  <FormField control={form.control} name={`lineItems.${index}.quantity`} render={({ field }) => (
                                      <FormItem>
                                          <FormLabel>Quantity</FormLabel>
                                          <FormControl><Input type="number" placeholder="1" {...field} /></FormControl>
                                          <FormMessage />
                                      </FormItem>
                                  )} />
                                  <FormField control={form.control} name={`lineItems.${index}.unit`} render={({ field }) => (
                                      <FormItem>
                                          <FormLabel>Unit</FormLabel>
                                          <FormControl><Input placeholder="pcs" {...field} /></FormControl>
                                          <FormMessage />
                                      </FormItem>
                                  )} />
                                  <FormField control={form.control} name={`lineItems.${index}.rate`} render={({ field }) => (
                                      <FormItem>
                                          <FormLabel>Rate</FormLabel>
                                          <FormControl><Input type="number" placeholder="100.00" {...field} value={field.value ?? ''} /></FormControl>
                                          <FormMessage />
                                      </FormItem>
                                  )} />
                                  <div className="font-medium">
                                      <Label>Amount</Label>
                                      <div className="p-2 h-10 flex items-center">{
                                        ((Number(watchedItems[index]?.quantity) || 0) * (Number(watchedItems[index]?.rate) || 0)).toFixed(2)
                                      }</div>
                                  </div>
                              </div>
                              <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => remove(index)}>
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                          </div>
                      ))}
                  </div>
                  <Button type="button" variant="outline" onClick={() => append({ description: "", quantity: 1, unit: "pcs", rate: undefined })} className="mt-4">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Line Item
                  </Button>
              </CardContent>
              <CardFooter className="flex flex-col items-end space-y-2 bg-muted/50 p-6 rounded-b-lg">
                  <div className="flex justify-between w-64 border-t pt-2 mt-2 border-foreground/20">
                      <span className="font-bold text-lg">Total</span>
                      <span className="font-bold text-lg">{totalAmount.toFixed(2)}</span>
                  </div>
              </CardFooter>
          </Card>
          
          <div className="grid md:grid-cols-2 gap-8">
              <Card>
                  <CardHeader><CardTitle>Authorised Signatory</CardTitle></CardHeader>
                  <CardContent>
                      <FormField control={form.control} name="authorisedSignatory" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Signatory Name</FormLabel>
                              <FormControl><Input placeholder="e.g. Jane Smith" {...field} /></FormControl>
                              <FormMessage />
                          </FormItem>
                      )} />
                  </CardContent>
              </Card>
              <Card>
                  <CardHeader><CardTitle>Terms & Conditions</CardTitle></CardHeader>
                  <CardContent>
                      <FormField control={form.control} name="terms" render={({ field }) => (
                          <FormItem>
                              <FormControl><Textarea className="min-h-[120px]" {...field} /></FormControl>
                              <FormMessage />
                          </FormItem>
                      )} />
                  </CardContent>
              </Card>
          </div>
        </form>
      </Form>
    </>
  );
}
