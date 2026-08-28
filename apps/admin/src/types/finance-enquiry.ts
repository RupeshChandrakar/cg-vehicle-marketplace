// Mirrors the API's admin finance-enquiry shape
// (apps/api/src/modules/finance-enquiries/finance-enquiries.service.ts).

export type FinanceEnquiryStatus = 'new' | 'contacted' | 'closed';

export interface FinanceEnquiryVehicle {
  id: string;
  publicId: number | null;
  title: string;
}

export interface AdminFinanceEnquiry {
  id: string;
  name: string;
  phone: string;
  message: string | null;
  status: FinanceEnquiryStatus;
  vehicle: FinanceEnquiryVehicle | null;
  createdAt: string;
}
