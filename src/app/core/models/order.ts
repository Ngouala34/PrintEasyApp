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
  id: string;
  order_number: string;
  user: OrderUser;
  document_type: string;
  price: string;
  document_url: string ;
  note: string | null;
  quantity: number;
  number_of_pages: number;
  options: OrderOptions;
  delivery_city: string | null;
  delivery_neighborhood: string | null;
  delivery_address: string | null;
  delivery_phone: string | null;
  unit_price: string;
  total_price: string;
  status: 'pending' | 'cancelled' | 'in_progress' | 'printed' | 'delivered' ;
  created_at: Date; // ou Date si tu préfères le convertir
  updated_at: Date; // idem
  priority: 'normal' | 'urgent' | 'rush';
}

export interface OrderUser {
  id: number;
  full_name: string;
  email: string;
}

export interface OrderOptions {
  option_binding?: string;
  option_color?: string;
  option_delivery?: string;
  option_format?: string;
  option_paper?: string;
  option_sides?: string;
}






export interface OrderSummary {
  id: string;
  orderNumber: string;
  date: Date;
  status: 'pending'| 'cancelled' | 'in_progress' | 'printed' | 'delivered' ;

  service: string;
  quantity: number;
  total: number;
  documentType: string;
  documentUrl: string;
  options: OrderOptions;
  deliveryInfo: {
    city: string | null;
    neighborhood: string | null;
    address: string | null;
    phone: string | null;
  };
  note?: string;
  numberOfPages: number;
  unitPrice: string;
  user: OrderUser;
  createdAt: Date;
  updatedAt: Date;
}


export interface INotification {
  id: number;
  title: string;
  message: string;
  notif_type: 'order' | 'system' | 'promotion' | 'support';
  is_read: boolean;
  created_at: string;
  user: number;
}
