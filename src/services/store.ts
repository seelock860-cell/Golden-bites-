import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_SETTINGS } from '../data/initialMenu';
import { Product, Order, RestaurantSettings, CartItem, OrderStatus, SupabaseConfig } from '../types';
import { getSupabaseClient, getStoredSupabaseConfig } from './supabase';

const STORAGE_KEY_PRODUCTS = 'goldenbite_products_v1';
const STORAGE_KEY_ORDERS = 'goldenbite_orders_v1';
const STORAGE_KEY_SETTINGS = 'goldenbite_settings_v1';
const STORAGE_KEY_CART = 'goldenbite_cart_v1';
const STORAGE_KEY_ADMIN_AUTH = 'goldenbite_admin_auth_v1';
const STORAGE_KEY_ADMIN_CRED = 'goldenbite_admin_cred_v1';

// Price Formatter in Nigerian Naira (₦)
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('NGN', '₦');
}

// WhatsApp Message Generator
export function generateWhatsAppOrderMessage(
  order: Omit<Order, 'id' | 'order_number' | 'created_at'> & { order_number?: string },
  restaurantName: string = 'GOLDEN BITE RESTAURANT'
): string {
  const orderNum = order.order_number || `GB-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let itemsList = '';
  order.items.forEach((item, index) => {
    itemsList += `${index + 1}. *${item.product_name}*\n   Qty: ${item.quantity} × ${formatNaira(item.price)} = ${formatNaira(item.total)}\n`;
    if (item.instructions) {
      itemsList += `   _Note: ${item.instructions}_\n`;
    }
  });

  const deliveryInfo = order.delivery_type === 'delivery'
    ? `🛵 *Delivery Address:*\n${order.delivery_address}\n${order.delivery_notes ? `_Note: ${order.delivery_notes}_\n` : ''}`
    : `📍 *Pickup Location:*\nIn-store Counter (Golden Bite Restaurant, 14 Admiralty Way, Lekki)`;

  const message = `✨ *NEW ORDER: ${restaurantName}* ✨
Order Ref: *#${orderNum}*
Date: ${dateStr}
------------------------------------------
👤 *Customer Name:* ${order.customer_name}
📞 *Phone Number:* ${order.customer_phone}
📦 *Order Type:* ${order.delivery_type === 'delivery' ? 'Home / Office Delivery' : 'In-Store Pickup'}

${deliveryInfo}

🍽️ *SELECTED FOOD ITEMS:*
${itemsList}
------------------------------------------
💵 *Subtotal:* ${formatNaira(order.subtotal)}
🛵 *Delivery Fee:* ${order.delivery_fee > 0 ? formatNaira(order.delivery_fee) : 'FREE'}
💰 *TOTAL AMOUNT:* ${formatNaira(order.total_amount)}
💳 *Payment:* Cash / Transfer upon ${order.delivery_type === 'delivery' ? 'Delivery' : 'Pickup'}
------------------------------------------
Please confirm receipt and estimated preparation time. Thank you!`;

  return message;
}

export function openWhatsAppCheckout(
  phone: string, // international format e.g. 2349024971419
  message: string
): void {
  const cleanPhone = phone.replace(/\D/g, '');
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

// --- ADMIN CREDENTIALS & AUTH ---
export interface AdminAuth {
  isAuthenticated: boolean;
  token: string | null;
  username: string | null;
  isTemporaryPassword?: boolean;
}

export function getAdminCredentials(): { user: string; passHash: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_CRED);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  // Default credentials: username 'god', password 'god123'
  return { user: 'god', passHash: 'god123' };
}

export function setAdminCredentials(username: string, newPassword: string): void {
  localStorage.setItem(STORAGE_KEY_ADMIN_CRED, JSON.stringify({
    user: username,
    passHash: newPassword,
  }));
}

export function getAdminSession(): AdminAuth {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_AUTH);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.token && data.expiresAt > Date.now()) {
        const creds = getAdminCredentials();
        return {
          isAuthenticated: true,
          token: data.token,
          username: data.username,
          isTemporaryPassword: creds.passHash === 'god123',
        };
      }
    }
  } catch (e) {
    console.error(e);
  }
  return { isAuthenticated: false, token: null, username: null };
}

export function loginAdmin(username: string, password: string): { success: boolean; error?: string } {
  const creds = getAdminCredentials();
  if (username.trim() === creds.user && password === creds.passHash) {
    const session = {
      token: 'admin_tok_' + Math.random().toString(36).substring(2) + Date.now(),
      username: creds.user,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24, // 24 hours
    };
    localStorage.setItem(STORAGE_KEY_ADMIN_AUTH, JSON.stringify(session));
    return { success: true };
  }
  return { success: false, error: 'Invalid username or password' };
}

export function logoutAdmin(): void {
  localStorage.removeItem(STORAGE_KEY_ADMIN_AUTH);
}

// --- PRODUCTS MANAGEMENT ---
export async function loadProducts(): Promise<Product[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // sync to local cache
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(data));
        return data as Product[];
      }

      // If connected and products table is empty (0 rows), automatically seed initial products!
      if (!error && data && data.length === 0) {
        try {
          const rows = INITIAL_PRODUCTS.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            category: p.category,
            image_url: p.image_url,
            is_available: p.is_available,
            is_featured: p.is_featured,
            preparation_time_minutes: p.preparation_time_minutes || 15,
            dietary_tags: p.dietary_tags || [],
            is_sample: p.is_sample || false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));
          await supabase.from('products').insert(rows);
        } catch (seedErr) {
          console.warn('Initial product seed attempt:', seedErr);
        }
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
        return INITIAL_PRODUCTS;
      }
    } catch (err) {
      console.warn('Supabase product fetch failed, using local cache:', err);
    }
  }

  // Fallback to local storage
  try {
    const cached = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error(e);
  }

  // Initialize with initial products
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  return INITIAL_PRODUCTS;
}

export async function saveProduct(product: Product): Promise<{ success: boolean; error?: string }> {
  const current = await loadProducts();
  const existingIdx = current.findIndex(p => p.id === product.id);
  let updatedList: Product[];

  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = { ...product, updated_at: new Date().toISOString() };
  } else {
    updatedList = [
      { ...product, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ...current,
    ];
  }

  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updatedList));

  // Sync to Supabase if available
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('products')
        .upsert({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          image_url: product.image_url,
          is_available: product.is_available,
          is_featured: product.is_featured,
          preparation_time_minutes: product.preparation_time_minutes || 15,
          dietary_tags: product.dietary_tags || [],
          is_sample: product.is_sample || false,
          updated_at: new Date().toISOString(),
        });
      if (error) {
        console.warn('Supabase product upsert failed:', error);
      }
    } catch (err) {
      console.warn('Supabase product sync error:', err);
    }
  }

  return { success: true };
}

export async function deleteProduct(productId: string): Promise<{ success: boolean; error?: string }> {
  const current = await loadProducts();
  const filtered = current.filter(p => p.id !== productId);
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(filtered));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('products').delete().eq('id', productId);
    } catch (err) {
      console.warn('Supabase delete error:', err);
    }
  }
  return { success: true };
}

// --- ORDERS MANAGEMENT ---
export async function loadOrders(): Promise<Order[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: Order[] = data.map((ord: any) => ({
          id: ord.id,
          order_number: ord.order_number,
          customer_name: ord.customer_name,
          customer_phone: ord.customer_phone,
          delivery_type: ord.delivery_type,
          delivery_address: ord.delivery_address,
          delivery_notes: ord.delivery_notes,
          subtotal: Number(ord.subtotal),
          delivery_fee: Number(ord.delivery_fee),
          total_amount: Number(ord.total_amount),
          order_channel: ord.order_channel,
          payment_method: ord.payment_method || 'pay_on_delivery',
          payment_status: ord.payment_status || 'payment_pending',
          bank_payment_details: ord.bank_payment_details,
          status: ord.status,
          created_at: ord.created_at,
          items: ord.order_items?.map((it: any) => ({
            product_id: it.product_id,
            product_name: it.product_name,
            price: Number(it.price),
            quantity: it.quantity,
            total: Number(it.total),
            instructions: it.instructions,
          })) || [],
        }));
        localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase orders fetch error:', err);
    }
  }

  // Fallback to local storage
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (raw) {
      const parsed: Order[] = JSON.parse(raw);
      // Ensure all loaded orders have payment_status
      return parsed.map(o => ({
        ...o,
        payment_status: o.payment_status || 'payment_pending',
      }));
    }
  } catch (e) {
    console.error(e);
  }

  localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(INITIAL_ORDERS));
  return INITIAL_ORDERS;
}

export async function createOrder(
  newOrder: Omit<Order, 'id' | 'order_number' | 'created_at'>
): Promise<{ success: boolean; order?: Order; error?: string }> {
  const id = 'ord-' + Math.random().toString(36).substring(2, 9);
  const orderNumber = `GB-${Math.floor(1000 + Math.random() * 9000)}`;
  const order: Order = {
    ...newOrder,
    id,
    order_number: orderNumber,
    payment_status: newOrder.payment_status || 'payment_pending',
    created_at: new Date().toISOString(),
  };

  // 1. Update local storage immediately
  const existing = await loadOrders();
  const updated = [order, ...existing];
  localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updated));

  // 2. Sync to Supabase if configured
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error: orderError } = await supabase.from('orders').insert({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        delivery_type: order.delivery_type,
        delivery_address: order.delivery_address,
        delivery_notes: order.delivery_notes,
        subtotal: order.subtotal,
        delivery_fee: order.delivery_fee,
        total_amount: order.total_amount,
        order_channel: order.order_channel,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        bank_payment_details: order.bank_payment_details || null,
        status: order.status,
        created_at: order.created_at,
      });

      if (!orderError) {
        const itemRows = order.items.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          price: item.price,
          quantity: item.quantity,
          total: item.total,
          instructions: item.instructions || null,
        }));
        await supabase.from('order_items').insert(itemRows);
      } else {
        console.warn('Supabase order insert error:', orderError);
      }
    } catch (err) {
      console.warn('Supabase sync order exception:', err);
    }
  }

  return { success: true, order };
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  const orders = await loadOrders();
  const updated = orders.map(ord => ord.id === orderId ? { ...ord, status: newStatus, updated_at: new Date().toISOString() } : ord);
  localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updated));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);
    } catch (err) {
      console.warn('Supabase order status update error:', err);
    }
  }
  return { success: true };
}

export async function updatePaymentStatus(
  orderId: string,
  newPaymentStatus: import('../types').PaymentStatus,
  alsoConfirmOrder: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const orders = await loadOrders();
  const updated = orders.map(ord => {
    if (ord.id === orderId) {
      const newStatus = alsoConfirmOrder && ord.status === 'pending' ? 'confirmed' : ord.status;
      return {
        ...ord,
        payment_status: newPaymentStatus,
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
    }
    return ord;
  });
  localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updated));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const updatePayload: Record<string, any> = {
        payment_status: newPaymentStatus,
        updated_at: new Date().toISOString(),
      };
      if (alsoConfirmOrder) {
        updatePayload.status = 'confirmed';
      }
      await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId);
    } catch (err) {
      console.warn('Supabase payment status update error:', err);
    }
  }
  return { success: true };
}

// --- SETTINGS MANAGEMENT ---
export async function loadRestaurantSettings(): Promise<RestaurantSettings> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('*')
        .eq('id', 'main_settings')
        .maybeSingle();

      if (!error && data) {
        const merged: RestaurantSettings = {
          ...INITIAL_SETTINGS,
          ...data,
          bank_name: data.bank_name || INITIAL_SETTINGS.bank_name,
          bank_account_name: data.bank_account_name || INITIAL_SETTINGS.bank_account_name,
          bank_account_number: data.bank_account_number || INITIAL_SETTINGS.bank_account_number,
          bank_transfer_enabled: data.bank_transfer_enabled !== undefined ? data.bank_transfer_enabled : true,
          bank_transfer_instructions: data.bank_transfer_instructions || INITIAL_SETTINGS.bank_transfer_instructions,
        };
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(merged));
        return merged;
      }

      // If settings table exists but has no main_settings row, seed default settings
      if (!error && !data) {
        try {
          await supabase.from('restaurant_settings').insert({
            id: 'main_settings',
            ...INITIAL_SETTINGS,
            updated_at: new Date().toISOString(),
          });
        } catch (seedErr) {
          console.warn('Initial settings seed attempt:', seedErr);
        }
      }
    } catch (e) {
      console.warn('Supabase settings load error:', e);
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      const merged: RestaurantSettings = {
        ...INITIAL_SETTINGS,
        ...parsed,
        bank_name: parsed.bank_name || INITIAL_SETTINGS.bank_name,
        bank_account_name: parsed.bank_account_name || INITIAL_SETTINGS.bank_account_name,
        bank_account_number: parsed.bank_account_number || INITIAL_SETTINGS.bank_account_number,
        bank_transfer_enabled: parsed.bank_transfer_enabled !== undefined ? parsed.bank_transfer_enabled : true,
        bank_transfer_instructions: parsed.bank_transfer_instructions || INITIAL_SETTINGS.bank_transfer_instructions,
      };
      return merged;
    }
  } catch (e) {
    console.error(e);
  }

  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(INITIAL_SETTINGS));
  return INITIAL_SETTINGS;
}

export async function saveRestaurantSettings(settings: RestaurantSettings): Promise<{ success: boolean }> {
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('restaurant_settings').upsert({
        id: 'main_settings',
        ...settings,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Supabase settings save error:', e);
    }
  }
  return { success: true };
}

// --- CART LOCAL STORAGE HELPERS ---
export function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CART);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveCart(items: CartItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(items));
  } catch (e) {
    console.error(e);
  }
}
