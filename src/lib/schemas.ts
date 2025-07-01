import { z } from 'zod';

export const lineItemSchema = z.object({
  description: z.string().min(1, { message: 'Description is required.' }),
  quantity: z.coerce.number().min(0.01, { message: 'Must be > 0.' }),
  unit: z.string().default(''),
  rate: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.coerce.number().min(0, { message: 'Rate must be a positive number.' }).optional()
  ),
});

export const quotationSchema = z.object({
  companyName: z.string().min(1, { message: 'Your company name is required.' }),
  companyAddress: z.string().min(1, { message: 'Your company address is required.' }),
  companyEmail: z.string().email({ message: 'Invalid email address.' }).optional().or(z.literal('')),
  companyPhone: z.string().optional(),
  headerImage: z.string().nullable().optional(),
  
  customerName: z.string().min(1, { message: 'Customer name is required.' }),
  customerAddress: z.string().min(1, { message: 'Customer address is required.' }),
  kindAttention: z.string().optional(),

  quoteName: z.string().min(1, { message: 'Quotation name is required.' }),
  quoteDate: z.date({ required_error: 'A quotation date is required.' }),
  subject: z.string().min(1, { message: 'Subject is required.' }),

  lineItems: z.array(lineItemSchema).min(1, { message: 'At least one line item is required.' }),
  
  terms: z.string().min(1, { message: 'Terms and conditions are required.' }),

  authorisedSignatory: z.string().min(1, { message: 'Signatory name is required.' }),
});
