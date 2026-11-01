export type FoodCategory = 
  | 'Burgers'
  | 'Pizza'
  | 'Shawarma'
  | 'Fried chicken'
  | 'French fries'
  | 'Sandwiches'
  | 'Snacks'
  | 'Soft drinks';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in NGN (₦)
  category: FoodCategory;
  image_url: string;
  is_available: boolean;
  is_featured: boolean;
  preparation_time_minutes?: number;
  dietary_tags?: string[]; // e.g. 'Chef Special', 'Spicy', 'Best Seller'
  is_sample?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  special_instructions?: string;
  selected_extras?: { name: string; price: number }[];
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'completed' | 'cancelled';

export type PaymentStatus = 'payment_pending' | 'payment_verified' | 'payment_failed';

export type PaymentMethod = 'bank_transfer' | 'whatsapp' | 'pay_on_delivery' | 'transfer_on_pickup';

export interface OrderItem {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  total: number;
  extras?: string[];
  instructions?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_type: 'delivery' | 'pickup';
  delivery_address: string;
  delivery_notes?: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  order_channel: 'whatsapp' | 'website_direct';
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  bank_payment_details?: {
    bank_name: string;
    account_name: string;
    account_number: string;
  };
  status: OrderStatus;
  items: OrderItem[];
  created_at: string;
  updated_at?: string;
}

export interface RestaurantSettings {
  restaurant_name: string;
  phone_number: string;
  whatsapp_number: string; // international format e.g. '2349024971419'
  display_whatsapp: string; // e.g. '09024971419'
  address: string;
  opening_hours: string;
  delivery_fee: number;
  currency_symbol: string;
  announcement: string;
  is_accepting_orders: boolean;
  // Bank Transfer Payment Details
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_transfer_enabled: boolean;
  bank_transfer_instructions: string;
}

export interface SupabaseConfig {
  url: string;
  anon_key: string;
  is_connected: boolean;
  last_tested?: string;
  error_message?: string;
}
