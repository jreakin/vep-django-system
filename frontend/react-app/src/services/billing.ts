import { api } from './api'

export interface Invoice {
  id: string
  invoice_number: string
  amount: number
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  due_date: string
  created_at: string
  user: {
    id: string
    email: string
    organization?: string
  }
  line_items: Array<{
    description: string
    quantity: number
    unit_price: number
    total: number
  }>
}

export interface PaymentMethod {
  id: string
  brand: string
  last4: string
  exp_month: number
  exp_year: number
  is_default: boolean
}

export interface UsageMetrics {
  period: string
  total_api_calls: number
  total_storage_gb: number
  total_users: number
  billing_amount: number
  breakdown: {
    api_calls: number
    storage: number
    users: number
  }
}

export interface CreatePaymentData {
  invoice_id: string
  payment_method_id?: string
  amount: number
}

export interface AdminInvoice extends Invoice {
  user: {
    id: string
    email: string
    organization?: string
    first_name: string
    last_name: string
  }
}

export interface AdminInvoiceFilters {
  page?: number
  page_size?: number
  search?: string
  status?: string
  date_from?: string
  date_to?: string
  user_id?: string
  min_amount?: string
  max_amount?: string
}

export interface AdminInvoiceResponse {
  count: number
  next: string | null
  previous: string | null
  results: AdminInvoice[]
}

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel'
  type: 'invoices' | 'payments' | 'usage_reports' | 'billing_summary'
  start_date: string
  end_date: string
  include_line_items: boolean
  include_payment_details: boolean
  filter_status?: string
}

// Invoice management
export const getInvoices = async (): Promise<Invoice[]> => {
  const response = await api.get('/billing/invoices/')
  return response.data
}

export const getInvoice = async (id: string): Promise<Invoice> => {
  const response = await api.get(`/billing/invoices/${id}/`)
  return response.data
}

export const createInvoice = async (data: Partial<Invoice>): Promise<Invoice> => {
  const response = await api.post('/billing/invoices/create/', data)
  return response.data
}

// Payment processing
export const createPayment = async (data: CreatePaymentData) => {
  const response = await api.post('/billing/payments/create/', data)
  return response.data
}

export const getPaymentStatus = async (invoiceId: string) => {
  const response = await api.get(`/billing/payments/status/${invoiceId}/`)
  return response.data
}

// Payment methods
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const response = await api.get('/billing/payment-methods/')
  return response.data
}

export const addPaymentMethod = async (paymentMethodId: string): Promise<PaymentMethod> => {
  const response = await api.post('/billing/payment-methods/', {
    payment_method_id: paymentMethodId
  })
  return response.data
}

export const deletePaymentMethod = async (id: string): Promise<void> => {
  await api.delete(`/billing/payment-methods/${id}/`)
}

export const setDefaultPaymentMethod = async (id: string): Promise<void> => {
  await api.patch(`/billing/payment-methods/${id}/`, { is_default: true })
}

// Usage metrics
export const getUsageMetrics = async (period?: string): Promise<UsageMetrics> => {
  const params = period ? { period } : {}
  const response = await api.get('/billing/usage/', { params })
  return response.data
}

export const getOverdueInvoices = async (): Promise<Invoice[]> => {
  const response = await api.get('/billing/invoices/overdue/')
  return response.data
}

// Admin functions
export const getAdminInvoices = async (filters: AdminInvoiceFilters): Promise<AdminInvoiceResponse> => {
  const params = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, value.toString())
    }
  })
  
  const response = await api.get(`/admin/billing/invoices/?${params.toString()}`)
  return response.data
}

export const sendInvoiceReminder = async (invoiceId: string): Promise<void> => {
  await api.post(`/admin/billing/invoices/${invoiceId}/send-reminder/`)
}

export const exportBillingData = async (options: ExportOptions): Promise<Blob> => {
  const response = await api.post('/admin/billing/export/', options, {
    responseType: 'blob'
  })
  return response.data
}

// Enhanced payment error handling
export const retryPayment = async (invoiceId: string, paymentMethodId?: string): Promise<any> => {
  const response = await api.post(`/billing/payments/${invoiceId}/retry/`, {
    payment_method_id: paymentMethodId
  })
  return response.data
}

export const handlePaymentDispute = async (paymentId: string, reason: string): Promise<void> => {
  await api.post(`/billing/payments/${paymentId}/dispute/`, { reason })
}

export const updatePaymentMethod = async (id: string, data: Partial<PaymentMethod>): Promise<PaymentMethod> => {
  const response = await api.patch(`/billing/payment-methods/${id}/`, data)
  return response.data
}