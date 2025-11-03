// src/app/core/models/order.ts
export interface OrderUser {
  id: number;
  full_name: string;
  email: string;
}

export interface OrderOptions {
  option_color?: string;
  option_delivery?: string;
  option_format?: string;
  option_paper?: string;
  option_sides?: string;
  option_finish?: string;
  option_binding?: string;
}

export interface UploadedFile {
  document: File;
  name: string;
  size: string;
  preview?: string;
}

export interface IOrderData {
  note?: string;
  number_of_pages: number;
  document_type_name: string;
  option_format: string;
  option_color: string;
  option_paper: string;
  option_sides: string;
  option_delivery: string;
  option_finish?: string;
  option_binding: string;
  delivery_city?: string;
  delivery_neighborhood?: string;
  delivery_phone?: string;
  customLength?: number;
  customWidth?: number;
  files: UploadedFile[];
  delivery_address?: string;
  totalPrice: number;
  basePrice: number;
  discount: number;
  timestamp: Date;
}

export interface IOrderResponse {
  id: number;
  order_number: string;
  user: OrderUser;
  document_type: string;
  price: string;
  document_url: string;
  note: string | null;
  quantity: number;
  number_of_pages: number;
  options: OrderOptions;
  delivery_city: string;
  delivery_neighborhood: string;
  delivery_address: string;
  delivery_phone: string;
  unit_price: string;
  total_price: string;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  date: Date;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  service: string;
  quantity: number;
  total: number;
  documentType: string;
  documentUrl: string;
  options: OrderOptions;
  deliveryInfo: {
    city: string;
    neighborhood: string;
    address: string;
    phone: string;
  };
  note?: string;
  numberOfPages: number;
  unitPrice: string;
  user: OrderUser;
  createdAt: string;
  updatedAt: string;
}