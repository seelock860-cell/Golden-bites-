import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

const STORAGE_KEY_CONFIG = 'goldenbite_supabase_config';

export const DEFAULT_SUPABASE_URL = 'https://xbxzevrtqawqiyvyrnvn.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_uCDaO_OgkH12dNcZ-i1BUww_5rAmClwO';

/**
 * Normalizes user-input Supabase URLs by removing trailing slashes,
 * stripping '/rest/v1' path if pasted from REST settings, and ensuring https protocol.
 */
export function normalizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/rest\/v1\/?$/i, '');
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, '');
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anon_key) {
        return {
          ...parsed,
          url: normalizeSupabaseUrl(parsed.url),
          anon_key: parsed.anon_key.trim(),
        };
      }
    }
  } catch (err) {
    console.error('Failed to read Supabase config from storage', err);
  }

  // Fallback to environment variables or project defaults provided
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  return {
    url: normalizeSupabaseUrl(envUrl || DEFAULT_SUPABASE_URL),
    anon_key: (envKey || DEFAULT_SUPABASE_ANON_KEY).trim(),
    is_connected: true,
  };
}

export function saveStoredSupabaseConfig(config: SupabaseConfig): void {
  try {
    const sanitized: SupabaseConfig = {
      ...config,
      url: normalizeSupabaseUrl(config.url),
      anon_key: config.anon_key.trim(),
    };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(sanitized));
  } catch (err) {
    console.error('Failed to save Supabase config to storage', err);
  }
}

let activeClient: SupabaseClient | null = null;

export function getSupabaseClient(config?: SupabaseConfig): SupabaseClient | null {
  const currentConfig = config || getStoredSupabaseConfig();
  const cleanUrl = normalizeSupabaseUrl(currentConfig.url);
  const cleanKey = currentConfig.anon_key?.trim();

  if (!cleanUrl || !cleanKey) {
    return null;
  }
  
  if (!activeClient) {
    try {
      activeClient = createClient(cleanUrl, cleanKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.error('Error creating Supabase client:', err);
      return null;
    }
  }
  return activeClient;
}

export function resetSupabaseClient(): void {
  activeClient = null;
}

/**
 * Uploads a food photo/file directly to Supabase Storage ('menu-images' bucket).
 * If the storage bucket is not configured yet in Supabase, falls back to a clean
 * Base64 image data string so file upload always succeeds without failing.
 */
export async function uploadImageToSupabase(
  file: File,
  folder: string = 'dishes'
): Promise<{ url: string; error?: string }> {
  const supabase = getSupabaseClient();
  const cleanExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const safeName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;

  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from('menu-images')
        .upload(safeName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data) {
        const { data: pubData } = supabase.storage
          .from('menu-images')
          .getPublicUrl(safeName);
        if (pubData?.publicUrl) {
          return { url: pubData.publicUrl };
        }
      }
    } catch (err) {
      console.warn('Supabase storage upload attempt encountered an issue, using data URL fallback:', err);
    }
  }

  // Data URL fallback: guarantees image file is instantly viewable & saveable in products table
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ url: reader.result as string });
    };
    reader.onerror = () => {
      resolve({ url: '', error: 'Could not read image file.' });
    };
    reader.readAsDataURL(file);
  });
}

export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string; details?: string }> {
  const cleanUrl = normalizeSupabaseUrl(url);
  const cleanKey = anonKey.trim();

  // 1. Basic formatting checks
  if (!cleanUrl || !cleanUrl.startsWith('https://') || !cleanUrl.includes('.supabase.co')) {
    return {
      success: false,
      message: 'Invalid Supabase Project URL. It should look like: https://xbxzevrtqawqiyvyrnvn.supabase.co',
    };
  }
  if (!cleanKey || cleanKey.length < 20) {
    return {
      success: false,
      message: 'Invalid API key. Please check your Supabase publishable key or anon key.',
    };
  }

  try {
    const client = createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: false,
      },
    });

    // Attempt to query products or restaurant_settings table
    const { data: testData, error: queryError } = await client
      .from('restaurant_settings')
      .select('restaurant_name')
      .limit(1);

    if (queryError) {
      // Check if it's because table hasn't been created yet vs invalid API credentials
      if (
        queryError.code === '42P01' || // relation does not exist
        queryError.message?.toLowerCase().includes('relation') ||
        queryError.message?.toLowerCase().includes('does not exist')
      ) {
        return {
          success: true,
          message: 'Connection to Supabase verified! Note: The database tables have not been created yet. Please run the SQL schema below in your Supabase SQL Editor.',
          details: 'Connected to Supabase endpoint, but tables (products, orders, restaurant_settings) need to be created using the SQL below.',
        };
      }

      // If auth or API key error
      if (
        queryError.code === 'PGRST301' ||
        queryError.message?.toLowerCase().includes('invalid api key') ||
        queryError.message?.includes('JWT') ||
        queryError.message?.includes('apikey')
      ) {
        return {
          success: false,
          message: 'Supabase rejected the API key: Invalid API Key. If your project uses the legacy JWT key format, copy the anon public key (starts with "eyJhbGciOi...") from Supabase Dashboard > Project Settings > API.',
          details: queryError.message,
        };
      }

      return {
        success: false,
        message: `Database query error: ${queryError.message}`,
        details: queryError.hint || queryError.details,
      };
    }

    return {
      success: true,
      message: 'Connected successfully to Supabase backend! Live database sync is active.',
      details: testData ? `Connected to live restaurant_settings table.` : undefined,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to establish network connection to Supabase.',
    };
  }
}

export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- GOLDEN BITE RESTAURANT - DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    category TEXT NOT NULL CHECK (category IN (
        'Burgers', 'Pizza', 'Shawarma', 'Fried chicken', 
        'French fries', 'Sandwiches', 'Snacks', 'Soft drinks'
    )),
    image_url TEXT NOT NULL,
    is_available BOOLEAN DEFAULT true NOT NULL,
    is_featured BOOLEAN DEFAULT false NOT NULL,
    preparation_time_minutes INTEGER DEFAULT 15,
    dietary_tags TEXT[] DEFAULT '{}',
    is_sample BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_type TEXT NOT NULL CHECK (delivery_type IN ('delivery', 'pickup')),
    delivery_address TEXT NOT NULL,
    delivery_notes TEXT,
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    delivery_fee NUMERIC(10, 2) NOT NULL CHECK (delivery_fee >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    order_channel TEXT NOT NULL CHECK (order_channel IN ('whatsapp', 'website_direct')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'whatsapp', 'pay_on_delivery', 'transfer_on_pickup')),
    payment_status TEXT NOT NULL DEFAULT 'payment_pending' CHECK (payment_status IN ('payment_pending', 'payment_verified', 'payment_failed')),
    bank_payment_details JSONB,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'preparing', 'out_for_delivery', 'completed', 'cancelled'
    )),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total NUMERIC(10, 2) NOT NULL,
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Restaurant Settings Table
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
    id TEXT PRIMARY KEY DEFAULT 'main_settings',
    restaurant_name TEXT NOT NULL DEFAULT 'GOLDEN BITE RESTAURANT',
    phone_number TEXT NOT NULL DEFAULT '+234 902 497 1419',
    whatsapp_number TEXT NOT NULL DEFAULT '2349024971419',
    display_whatsapp TEXT NOT NULL DEFAULT '09024971419',
    address TEXT NOT NULL DEFAULT '14 Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
    opening_hours TEXT NOT NULL DEFAULT 'Monday - Sunday: 10:00 AM – 11:30 PM',
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 1500,
    currency_symbol TEXT NOT NULL DEFAULT '₦',
    announcement TEXT DEFAULT 'Taste the Extraordinary. Free delivery on orders over ₦25,000!',
    is_accepting_orders BOOLEAN NOT NULL DEFAULT true,
    bank_name TEXT NOT NULL DEFAULT 'OPay',
    bank_account_name TEXT NOT NULL DEFAULT 'JOSHUA PASCHAL',
    bank_account_number TEXT NOT NULL DEFAULT '9160722818',
    bank_transfer_enabled BOOLEAN NOT NULL DEFAULT true,
    bank_transfer_instructions TEXT DEFAULT 'Please transfer the exact amount to the account above. Your order will be processed after we verify your payment.',
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert Default Restaurant Settings
INSERT INTO public.restaurant_settings (id, restaurant_name, phone_number, whatsapp_number, display_whatsapp, address, opening_hours, delivery_fee, currency_symbol, announcement, is_accepting_orders, bank_name, bank_account_name, bank_account_number, bank_transfer_enabled, bank_transfer_instructions)
VALUES ('main_settings', 'GOLDEN BITE RESTAURANT', '+234 902 497 1419', '2349024971419', '09024971419', '14 Admiralty Way, Lekki Phase 1, Lagos, Nigeria', 'Monday - Sunday: 10:00 AM – 11:30 PM', 1500, '₦', 'Taste the Extraordinary. Free delivery on orders over ₦25,000!', true, 'OPay', 'JOSHUA PASCHAL', '9160722818', true, 'Please transfer the exact amount to the account above. Your order will be processed after we verify your payment.')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Security: Only authenticated admins can modify menu items and view sensitive orders.
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- PRODUCTS:
-- Public can read active available products
CREATE POLICY "Public can view available products" 
ON public.products FOR SELECT 
USING (is_available = true OR auth.role() = 'authenticated');

-- Authenticated Admin can perform all product management
CREATE POLICY "Admin full access to products" 
ON public.products FOR ALL 
USING (auth.role() = 'authenticated');

-- RESTAURANT SETTINGS:
-- Public can read restaurant settings
CREATE POLICY "Public can read restaurant settings" 
ON public.restaurant_settings FOR SELECT 
USING (true);

-- Authenticated Admin can update restaurant settings
CREATE POLICY "Admin can update restaurant settings" 
ON public.restaurant_settings FOR ALL 
USING (auth.role() = 'authenticated');

-- ORDERS:
-- Public can submit new orders (INSERT only)
CREATE POLICY "Public can insert orders" 
ON public.orders FOR INSERT 
WITH CHECK (true);

-- Only authenticated staff/admin can view or modify customer orders
CREATE POLICY "Staff can view and manage orders" 
ON public.orders FOR ALL 
USING (auth.role() = 'authenticated');

-- ORDER ITEMS:
-- Public can insert order items alongside an order
CREATE POLICY "Public can insert order items" 
ON public.order_items FOR INSERT 
WITH CHECK (true);

-- Only authenticated staff/admin can view or manage order items
CREATE POLICY "Staff can view and manage order items" 
ON public.order_items FOR ALL 
USING (auth.role() = 'authenticated');

-- Create Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 6. Storage Bucket for Food Photographs & Files
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Menu Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

CREATE POLICY "Public & Staff Upload Menu Images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'menu-images');
`;
