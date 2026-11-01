import React, { useState, useEffect } from 'react';
import {
  Product,
  Order,
  RestaurantSettings,
  FoodCategory,
  OrderStatus,
  PaymentStatus,
  SupabaseConfig,
} from '../types';
import {
  formatNaira,
  saveProduct,
  deleteProduct,
  updateOrderStatus,
  updatePaymentStatus,
  saveRestaurantSettings,
  setAdminCredentials,
  getAdminCredentials,
  openWhatsAppCheckout,
} from '../services/store';
import {
  testSupabaseConnection,
  saveStoredSupabaseConfig,
  getStoredSupabaseConfig,
  SUPABASE_SQL_SCHEMA,
  resetSupabaseClient,
  uploadImageToSupabase,
} from '../services/supabase';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Database,
  Settings,
  Shield,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  LogOut,
  Copy,
  Check,
  AlertTriangle,
  Flame,
  Phone,
  MapPin,
  RefreshCw,
  Eye,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Menu as MenuIcon,
  Grid,
  List,
  Sparkles,
  TrendingUp,
  X,
  Building2,
  CreditCard,
  ShieldCheck,
  CheckCheck,
  Upload,
} from 'lucide-react';

interface AdminDashboardProps {
  onClose: () => void;
  onLogout: () => void;
  products: Product[];
  orders: Order[];
  settings: RestaurantSettings;
  onRefreshData: () => void;
}

type AdminTab = 'overview' | 'menu' | 'orders' | 'bank_payments' | 'supabase' | 'settings' | 'security';

const PRESET_IMAGES = [
  { label: 'Double Beef Smash Burger', url: '/src/assets/images/hero_burger_feast_1793008742785.jpg' },
  { label: 'Wood-Fired Truffle Pizza', url: '/src/assets/images/category_pizza_truffle_1793008743551.jpg' },
  { label: 'Golden Crunch Fried Chicken', url: '/src/assets/images/category_fried_chicken_1793008743791.jpg' },
  { label: 'Artisanal Shawarma Wrap', url: '/src/assets/images/category_shawarma_wrap_1793008744646.jpg' },
  { label: 'Loaded Paprika Fries', url: '/src/assets/images/category_fries_loaded_1793008743969.jpg' },
];

const CATEGORIES: FoodCategory[] = [
  'Burgers',
  'Pizza',
  'Shawarma',
  'Fried chicken',
  'French fries',
  'Sandwiches',
  'Snacks',
  'Soft drinks',
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onClose,
  onLogout,
  products,
  orders,
  settings,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Full Screen & Sidebar layout state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // View mode toggles
  const [menuViewMode, setMenuViewMode] = useState<'table' | 'grid'>('table');
  const [ordersViewMode, setOrdersViewMode] = useState<'cards' | 'table'>('cards');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // --- MENU MANAGEMENT STATE ---
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>('All');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Form fields for product add/edit
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<FoodCategory>('Burgers');
  const [prodPrice, setProdPrice] = useState<number>(5000);
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState(PRESET_IMAGES[0].url);
  const [prodPrepTime, setProdPrepTime] = useState(15);
  const [prodIsAvailable, setProdIsAvailable] = useState(true);
  const [prodIsFeatured, setProdIsFeatured] = useState(false);
  const [prodTags, setProdTags] = useState('Best Seller');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // --- ORDERS MANAGEMENT STATE ---
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<string>('All');
  const [orderChannelFilter, setOrderChannelFilter] = useState<string>('All');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // --- BANK PAYMENT SETTINGS STATE ---
  const [bankName, setBankName] = useState(settings.bank_name || 'OPay');
  const [bankAccountName, setBankAccountName] = useState(settings.bank_account_name || 'JOSHUA PASCHAL');
  const [bankAccountNumber, setBankAccountNumber] = useState(settings.bank_account_number || '9160722818');
  const [bankTransferEnabled, setBankTransferEnabled] = useState(settings.bank_transfer_enabled !== false);
  const [bankInstructions, setBankInstructions] = useState(
    settings.bank_transfer_instructions ||
      'Please transfer the exact amount to the account above. Your order will be processed after we verify your payment.'
  );
  const [copiedBankTest, setCopiedBankTest] = useState(false);

  // Sync settings whenever parent updates
  useEffect(() => {
    setSettingsForm(settings);
    setBankName(settings.bank_name || 'OPay');
    setBankAccountName(settings.bank_account_name || 'JOSHUA PASCHAL');
    setBankAccountNumber(settings.bank_account_number || '9160722818');
    setBankTransferEnabled(settings.bank_transfer_enabled !== false);
    setBankInstructions(
      settings.bank_transfer_instructions ||
        'Please transfer the exact amount to the account above. Your order will be processed after we verify your payment.'
    );
  }, [settings]);

  // --- SUPABASE CONFIG STATE ---
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig());
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showAnonKey, setShowAnonKey] = useState(false);

  // --- SETTINGS FORM STATE ---
  const [settingsForm, setSettingsForm] = useState<RestaurantSettings>(settings);

  // --- SECURITY / PASSWORD STATE ---
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Handle open Product Modal
  const openNewProductModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory('Burgers');
    setProdPrice(5000);
    setProdDesc('');
    setProdImage(PRESET_IMAGES[0].url);
    setProdPrepTime(15);
    setProdIsAvailable(true);
    setProdIsFeatured(false);
    setProdTags('Popular');
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdCategory(prod.category);
    setProdPrice(prod.price);
    setProdDesc(prod.description);
    setProdImage(prod.image_url);
    setProdPrepTime(prod.preparation_time_minutes || 15);
    setProdIsAvailable(prod.is_available);
    setProdIsFeatured(prod.is_featured);
    setProdTags(prod.dietary_tags ? prod.dietary_tags.join(', ') : '');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    const tagsArray = prodTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const productPayload: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: prodName.trim(),
      category: prodCategory,
      price: Number(prodPrice),
      description: prodDesc.trim(),
      image_url: prodImage.trim() || PRESET_IMAGES[0].url,
      is_available: prodIsAvailable,
      is_featured: prodIsFeatured,
      preparation_time_minutes: Number(prodPrepTime),
      dietary_tags: tagsArray,
      is_sample: false,
    };

    await saveProduct(productPayload);
    setIsProductModalOpen(false);
    onRefreshData();
    showToast(editingProduct ? 'Food item updated successfully' : 'New food item added to menu');
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file exceeds 5MB limit. Please select a smaller file.');
      return;
    }

    setIsUploadingImage(true);
    try {
      const result = await uploadImageToSupabase(file, 'dishes');
      if (result.url) {
        setProdImage(result.url);
        showToast('Food photograph uploaded & attached to item!');
      } else {
        showToast(result.error || 'Failed to upload photo.');
      }
    } catch (err) {
      showToast('Error uploading image file.');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    await deleteProduct(productToDelete.id);
    setProductToDelete(null);
    onRefreshData();
    showToast('Food item deleted from menu');
  };

  const handleToggleAvailability = async (prod: Product) => {
    await saveProduct({ ...prod, is_available: !prod.is_available });
    onRefreshData();
    showToast(`${prod.name} marked as ${!prod.is_available ? 'Available' : 'Sold Out'}`);
  };

  const handleToggleFeatured = async (prod: Product) => {
    await saveProduct({ ...prod, is_featured: !prod.is_featured });
    onRefreshData();
    showToast(`${prod.name} ${!prod.is_featured ? 'added to' : 'removed from'} Featured Specials`);
  };

  // Orders update
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    await updateOrderStatus(orderId, newStatus);
    onRefreshData();
    if (viewingOrder && viewingOrder.id === orderId) {
      setViewingOrder({ ...viewingOrder, status: newStatus });
    }
    showToast(`Order status updated to ${newStatus}`);
  };

  // Payment status update (authenticated administrator action)
  const handleUpdatePaymentStatus = async (
    orderId: string,
    newPaymentStatus: PaymentStatus,
    alsoConfirm: boolean = false
  ) => {
    await updatePaymentStatus(orderId, newPaymentStatus, alsoConfirm);
    onRefreshData();
    if (viewingOrder && viewingOrder.id === orderId) {
      setViewingOrder({
        ...viewingOrder,
        payment_status: newPaymentStatus,
        status: alsoConfirm && viewingOrder.status === 'pending' ? 'confirmed' : viewingOrder.status,
      });
    }
    const statusLabels: Record<PaymentStatus, string> = {
      payment_verified: 'Payment Verified',
      payment_pending: 'Payment Pending',
      payment_failed: 'Payment Failed',
    };
    showToast(`Order marked as: ${statusLabels[newPaymentStatus]}`);
  };

  // Save Bank Payment Settings
  const handleSaveBankSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: RestaurantSettings = {
      ...settingsForm,
      bank_name: bankName.trim(),
      bank_account_name: bankAccountName.trim(),
      bank_account_number: bankAccountNumber.trim(),
      bank_transfer_enabled: bankTransferEnabled,
      bank_transfer_instructions: bankInstructions.trim(),
    };
    await saveRestaurantSettings(updatedSettings);
    setSettingsForm(updatedSettings);
    onRefreshData();
    showToast('Bank Payment Details saved & active for customer checkout!');
  };

  // Test Supabase Connection
  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    resetSupabaseClient();
    const result = await testSupabaseConnection(supabaseConfig.url, supabaseConfig.anon_key);
    setIsTestingSupabase(false);

    const updatedConfig: SupabaseConfig = {
      ...supabaseConfig,
      is_connected: result.success,
      last_tested: new Date().toISOString(),
      error_message: result.success ? undefined : result.message,
    };

    setSupabaseConfig(updatedConfig);
    saveStoredSupabaseConfig(updatedConfig);

    if (result.success) {
      showToast(result.message);
      onRefreshData();
    } else {
      showToast(`Connection error: ${result.message}`);
    }
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
    showToast('SQL Schema copied to clipboard!');
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveRestaurantSettings(settingsForm);
    onRefreshData();
    showToast('Restaurant settings updated successfully');
  };

  // Change Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    const creds = getAdminCredentials();
    if (oldPassword !== creds.passHash) {
      setPasswordError('Current password does not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password confirmation does not match.');
      return;
    }

    setAdminCredentials(creds.user, newPassword);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Administrator password updated successfully!');
  };

  // Basic Stats Calculation
  const totalRevenue = orders.reduce((sum, ord) => sum + ord.total_amount, 0);
  const totalOrderCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending' || o.status === 'preparing').length;
  const availableItemsCount = products.filter((p) => p.is_available).length;
  const averageOrderValue = totalOrderCount > 0 ? Math.round(totalRevenue / totalOrderCount) : 0;
  const pendingPaymentOrdersCount = orders.filter((o) => o.payment_status === 'payment_pending').length;
  const verifiedPaymentOrdersCount = orders.filter((o) => o.payment_status === 'payment_verified').length;
  const failedPaymentOrdersCount = orders.filter((o) => o.payment_status === 'payment_failed').length;

  // Filtered menu
  const filteredProducts = products.filter((p) => {
    const matchesCategory = menuCategoryFilter === 'All' || p.category === menuCategoryFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(menuSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderStatusFilter === 'All' || o.status === orderStatusFilter;
    const matchesPayment = orderPaymentFilter === 'All' || o.payment_status === orderPaymentFilter;
    const matchesChannel = orderChannelFilter === 'All' || o.order_channel === orderChannelFilter;
    const matchesSearch =
      o.order_number.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.customer_phone.includes(orderSearchQuery) ||
      o.delivery_address.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      (o.bank_payment_details?.account_number && o.bank_payment_details.account_number.includes(orderSearchQuery));
    return matchesStatus && matchesPayment && matchesChannel && matchesSearch;
  });

  const NAV_ITEMS = [
    { id: 'overview', label: 'Overview & Stats', icon: LayoutDashboard },
    { id: 'menu', label: 'Menu Management', icon: UtensilsCrossed, count: products.length },
    {
      id: 'orders',
      label: 'Customer Orders',
      icon: ShoppingBag,
      count: orders.length,
      badge: pendingPaymentOrdersCount > 0 ? `${pendingPaymentOrdersCount} pending` : undefined,
    },
    { id: 'bank_payments', label: 'Bank Payment Settings', icon: Building2 },
    { id: 'supabase', label: 'Supabase Database', icon: Database },
    { id: 'settings', label: 'Restaurant Settings', icon: Settings },
    { id: 'security', label: 'Admin Security', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#070709] text-slate-100 flex flex-col font-sans w-screen h-screen">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[80] px-4 py-2.5 rounded-xl bg-[#1d1910] border border-[#d4af37] text-[#F5D77F] text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="h-16 border-b border-[#241e13] bg-[#0c0b10] px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg bg-[#141219]"
          >
            <MenuIcon className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex p-1.5 text-slate-400 hover:text-white rounded-lg bg-[#141219] hover:bg-[#1f1b26] border border-[#2b2518] transition-colors"
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar for Full Width'}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#805915] p-[1.5px]">
            <div className="w-full h-full bg-black rounded-[7px] flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-[#d4af37]" />
            </div>
          </div>
          <div>
            <h1 className="font-serif-luxury text-sm sm:text-base font-bold text-white tracking-wide">
              GOLDEN BITE <span className="gold-gradient-text">ADMIN CONSOLE</span>
            </h1>
            <span className="text-[10px] text-slate-400 block -mt-0.5">
              Full Management Dashboard & Real-Time Kitchen Dispatch
            </span>
          </div>
        </div>

        {/* Database & Top Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Supabase Status Pill */}
          <button
            onClick={() => setActiveTab('supabase')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
              supabaseConfig.is_connected
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                supabaseConfig.is_connected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="hidden sm:inline">
              {supabaseConfig.is_connected ? 'Supabase Connected' : 'Local Storage Mode'}
            </span>
            <span className="sm:hidden">
              {supabaseConfig.is_connected ? 'Supabase' : 'Local'}
            </span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-[#16141c] hover:bg-[#201d28] text-slate-300 hover:text-white border border-[#2b2518] transition-colors cursor-pointer hidden sm:flex"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onRefreshData}
            className="p-2 rounded-lg bg-[#16141c] hover:bg-[#201d28] text-slate-300 hover:text-white border border-[#2b2518] transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-[#3b3117] text-xs font-semibold text-slate-200 hover:bg-[#1a1712] hover:text-white transition-colors cursor-pointer"
          >
            Storefront
          </button>

          <button
            onClick={onLogout}
            className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/50 transition-colors cursor-pointer"
            title="Log Out Staff"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Full-Width Body */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Desktop Sidebar (Collapsible for maximum full screen space) */}
        <aside
          className={`hidden md:flex flex-col border-r border-[#221c12] bg-[#0a090e] transition-all duration-300 shrink-0 select-none ${
            isSidebarCollapsed ? 'w-16 p-2' : 'w-60 p-3'
          }`}
        >
          <div className="space-y-1.5 flex-1 overflow-y-auto scrollbar-none">
            {NAV_ITEMS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  title={tab.label}
                  className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSidebarCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'bg-[#211a10] border border-[#d4af37]/60 text-[#F5D77F] shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#131118]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#d4af37]' : 'text-slate-500'}`} />
                    {!isSidebarCollapsed && <span>{tab.label}</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex items-center gap-1.5">
                      {tab.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300">
                          {tab.badge}
                        </span>
                      )}
                      {tab.count !== undefined && !tab.badge && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-slate-400">
                          {tab.count}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {!isSidebarCollapsed && (
            <div className="pt-3 border-t border-[#1e1a12] text-[11px] text-slate-400 text-center">
              <span>Admin: </span>
              <strong className="text-[#F5D77F] font-mono">god</strong>
            </div>
          )}
        </aside>

        {/* Mobile Slide-Over Sidebar */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative w-64 bg-[#0a090e] border-r border-[#221c12] p-4 flex flex-col z-10 space-y-2">
              <div className="flex items-center justify-between pb-3 border-b border-[#221c12]">
                <span className="font-serif-luxury font-bold text-white text-sm">Navigation</span>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1 flex-1 overflow-y-auto">
                {NAV_ITEMS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as AdminTab);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#211a10] border border-[#d4af37]/60 text-[#F5D77F]'
                          : 'text-slate-400 hover:text-white hover:bg-[#131118]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#d4af37]' : 'text-slate-500'}`} />
                        <span>{tab.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {tab.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300">
                            {tab.badge}
                          </span>
                        )}
                        {tab.count !== undefined && !tab.badge && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-slate-400">
                            {tab.count}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Expansive Full Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#07070a] w-full">
          
          {/* TAB 1: OVERVIEW & STATS (FULL VIEW) */}
          {activeTab === 'overview' && (
            <div className="space-y-6 w-full">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white">
                    Kitchen & Business Performance
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Full overview of real-time sales revenue, kitchen activity, order distribution, and catalog health.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={openNewProductModal}
                    className="px-4 py-2 rounded-xl gold-gradient-bg text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:brightness-110 shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Food Item</span>
                  </button>
                </div>
              </div>

              {/* 5-Column Full Metrics Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-5 rounded-2xl bg-[#0e0d13] border border-[#2b2518] shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Total Revenue</span>
                    <TrendingUp className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <span className="text-2xl font-bold text-[#F5D77F] font-mono tabular-nums block mt-2">
                    {formatNaira(totalRevenue)}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">From all submitted orders</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0e0d13] border border-[#2b2518] shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Total Orders</span>
                    <ShoppingBag className="w-4 h-4 text-slate-400" />
                  </div>
                  <span className="text-2xl font-bold text-white font-mono tabular-nums block mt-2">
                    {totalOrderCount}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">WhatsApp & Web checkouts</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0e0d13] border border-[#2b2518] shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Active Kitchen Orders</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-2xl font-bold text-amber-400 font-mono tabular-nums block mt-2">
                    {pendingOrdersCount}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">Pending & Preparing</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0e0d13] border border-[#2b2518] shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Available Food Items</span>
                    <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-2xl font-bold text-emerald-400 font-mono tabular-nums block mt-2">
                    {availableItemsCount} <span className="text-xs text-slate-400 font-normal">/ {products.length}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">In stock & orderable</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0e0d13] border border-[#2b2518] shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Average Order</span>
                    <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <span className="text-2xl font-bold text-white font-mono tabular-nums block mt-2">
                    {formatNaira(averageOrderValue)}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">Ticket size per customer</span>
                </div>
              </div>

              {/* Category Breakdown Full Strip */}
              <div className="p-5 rounded-2xl bg-[#0e0d13] border border-[#262116]">
                <h3 className="font-bold text-white text-sm mb-3">
                  Menu Items by Category ({products.length} total dishes)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                  {CATEGORIES.map((cat) => {
                    const count = products.filter((p) => p.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setMenuCategoryFilter(cat);
                          setActiveTab('menu');
                        }}
                        className="p-3 rounded-xl bg-[#141219] hover:bg-[#1f1b26] border border-[#282216] text-left transition-colors cursor-pointer group"
                      >
                        <span className="text-[11px] text-slate-400 group-hover:text-white block truncate">
                          {cat}
                        </span>
                        <span className="text-base font-bold text-[#F5D77F] font-mono tabular-nums block mt-1">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Real-Time Live Orders Feed (Showing ALL orders, full table) */}
              <div className="rounded-2xl bg-[#0e0d13] border border-[#262116] p-5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="font-bold text-white text-base">
                      Submitted Customer Orders ({orders.length})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Live dispatch stream: click any order to inspect customer items or change status.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-[#d4af37] font-semibold hover:underline"
                  >
                    Open Orders Workspace &rarr;
                  </button>
                </div>

                {orders.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">No customer orders placed yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#121118] border-b border-[#231e13] text-slate-400 font-semibold">
                        <tr>
                          <th className="py-3 px-4">Order Ref</th>
                          <th className="py-3 px-4">Customer Name & Phone</th>
                          <th className="py-3 px-4">Type & Channel</th>
                          <th className="py-3 px-4">Address / Notes</th>
                          <th className="py-3 px-4">Items</th>
                          <th className="py-3 px-4">Total (₦)</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e1a12]">
                        {orders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-[#141219] transition-colors">
                            <td className="py-3 px-4 font-mono text-[#F5D77F] font-bold">
                              #{ord.order_number}
                              <span className="block text-[10px] text-slate-400 font-sans">
                                {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-white block">{ord.customer_name}</span>
                              <a
                                href={`https://wa.me/${ord.customer_phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-emerald-400 font-mono hover:underline flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{ord.customer_phone}</span>
                              </a>
                            </td>
                            <td className="py-3 px-4">
                              <span className="capitalize font-medium text-slate-200 block">
                                {ord.delivery_type === 'delivery' ? '🛵 Delivery' : '📍 Pickup'}
                              </span>
                              <span className="text-[10px] text-slate-400 uppercase">
                                {ord.order_channel === 'whatsapp' ? 'WhatsApp' : 'Website Direct'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                              <span>{ord.delivery_address}</span>
                              {ord.delivery_notes && (
                                <span className="text-amber-300/80 block text-[10px] italic">
                                  {ord.delivery_notes}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-200">
                              <span>{ord.items.reduce((s, i) => s + i.quantity, 0)} items</span>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-white text-xs">
                              {formatNaira(ord.total_amount)}
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={ord.status}
                                onChange={(e) => handleUpdateStatus(ord.id, e.target.value as OrderStatus)}
                                className="bg-[#191722] border border-[#3b321a] text-[#F5D77F] text-xs font-semibold rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="preparing">Preparing</option>
                                <option value="out_for_delivery">Out for Delivery</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setViewingOrder(ord)}
                                className="px-2.5 py-1 rounded bg-[#1e1c25] hover:bg-[#282532] text-slate-200 text-xs font-medium cursor-pointer"
                              >
                                Full Receipt
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: MENU MANAGEMENT (FULL VIEW WITH TABLE / GRID TOGGLE) */}
          {activeTab === 'menu' && (
            <div className="space-y-6 w-full">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white">
                    Food Menu Catalog ({products.length} Dishes)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Manage food names, descriptions, prices in ₦, photos, categories, and instant availability.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-[#141219] p-1 rounded-xl border border-[#2b2518]">
                    <button
                      onClick={() => setMenuViewMode('table')}
                      className={`p-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                        menuViewMode === 'table' ? 'bg-[#252014] text-[#d4af37]' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Table View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setMenuViewMode('grid')}
                      className={`p-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                        menuViewMode === 'grid' ? 'bg-[#252014] text-[#d4af37]' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Grid Cards View"
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={openNewProductModal}
                    className="px-4 py-2.5 rounded-xl gold-gradient-bg text-black text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md hover:brightness-110"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Food Item</span>
                  </button>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#0e0d13] p-3 rounded-2xl border border-[#262116]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search dishes or ingredients..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="w-full bg-[#121118] border border-[#2b2518] focus:border-[#d4af37] text-white pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                  {['All', ...CATEGORIES].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setMenuCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        menuCategoryFilter === cat
                          ? 'bg-[#d4af37] text-black font-bold'
                          : 'bg-[#141219] text-slate-400 hover:text-white border border-[#292318]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Render: Table or Grid View */}
              {menuViewMode === 'table' ? (
                /* FULL TABLE VIEW */
                <div className="rounded-2xl bg-[#0e0d13] border border-[#262116] overflow-hidden shadow-lg w-full">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#121118] border-b border-[#231e13] text-slate-400 font-semibold">
                        <tr>
                          <th className="py-3 px-4">Photo</th>
                          <th className="py-3 px-4">Food Name & Description</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Price (₦)</th>
                          <th className="py-3 px-4">Prep Time</th>
                          <th className="py-3 px-4">Availability</th>
                          <th className="py-3 px-4">Featured</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e1a12]">
                        {filteredProducts.map((prod) => (
                          <tr key={prod.id} className="hover:bg-[#141219] transition-colors">
                            <td className="py-3 px-4">
                              <img
                                src={prod.image_url}
                                alt={prod.name}
                                referrerPolicy="no-referrer"
                                className="w-14 h-14 rounded-lg object-cover bg-black shrink-0 border border-white/5"
                              />
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-bold text-white text-xs block">{prod.name}</span>
                              <span className="text-[11px] text-slate-400 line-clamp-1 max-w-md">
                                {prod.description}
                              </span>
                              {prod.is_sample && (
                                <span className="text-[9px] text-amber-300 bg-amber-950/40 px-1 rounded">
                                  Sample Item
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <span className="text-[11px] font-medium text-slate-300 bg-[#17151e] px-2.5 py-1 rounded border border-[#2b2518]">
                                {prod.category}
                              </span>
                            </td>

                            <td className="py-3 px-4 font-mono font-bold text-[#F5D77F] text-xs">
                              {formatNaira(prod.price)}
                            </td>

                            <td className="py-3 px-4 text-slate-300 font-mono">
                              {prod.preparation_time_minutes || 15} mins
                            </td>

                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleToggleAvailability(prod)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors cursor-pointer flex items-center gap-1 ${
                                  prod.is_available
                                    ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-400'
                                    : 'bg-rose-950/70 border border-rose-500/40 text-rose-400'
                                }`}
                              >
                                {prod.is_available ? <Check className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                                <span>{prod.is_available ? 'Available' : 'Sold Out'}</span>
                              </button>
                            </td>

                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleToggleFeatured(prod)}
                                className={`px-2.5 py-1 rounded-md text-[11px] transition-colors cursor-pointer ${
                                  prod.is_featured
                                    ? 'text-[#F5D77F] bg-[#221c10] border border-[#d4af37]/40'
                                    : 'text-slate-400 hover:text-slate-300'
                                }`}
                              >
                                <Flame className="w-3.5 h-3.5 inline mr-1" />
                                <span>{prod.is_featured ? 'Featured' : 'Standard'}</span>
                              </button>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openEditProductModal(prod)}
                                  className="p-1.5 rounded-lg bg-[#18161f] text-slate-300 hover:text-white hover:bg-[#25222f] transition-colors cursor-pointer"
                                  title="Edit Item"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setProductToDelete(prod)}
                                  className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:text-rose-200 hover:bg-rose-900/50 transition-colors cursor-pointer"
                                  title="Delete Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* FULL VISUAL GRID VIEW */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="rounded-2xl bg-[#0e0d13] border border-[#262116] overflow-hidden flex flex-col justify-between shadow-md"
                    >
                      <div className="relative h-44 w-full">
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 text-[10px] font-semibold bg-black/75 px-2 py-0.5 rounded text-[#F5D77F]">
                          {prod.category}
                        </span>
                        <span className="absolute top-2 right-2 text-[10px] font-bold font-mono bg-black/80 px-2 py-0.5 rounded text-white">
                          {formatNaira(prod.price)}
                        </span>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-white text-sm line-clamp-1">{prod.name}</h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{prod.description}</p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-[#231e13] flex items-center justify-between">
                          <button
                            onClick={() => handleToggleAvailability(prod)}
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                              prod.is_available ? 'text-emerald-400 bg-emerald-950/40' : 'text-rose-400 bg-rose-950/40'
                            }`}
                          >
                            {prod.is_available ? 'Available' : 'Sold Out'}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditProductModal(prod)}
                              className="p-1.5 rounded-lg bg-[#18161f] text-slate-300 hover:text-white"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setProductToDelete(prod)}
                              className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:text-rose-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: CUSTOMER ORDERS (FULL EXPANSIVE VIEW WITH PAYMENT VERIFICATION) */}
          {activeTab === 'orders' && (
            <div className="space-y-6 w-full">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white">
                    Order Fulfillment & Delivery Desk ({orders.length} Total Orders)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Track orders, verify OPay bank transfers, contact customers via WhatsApp, and manage kitchen status.
                  </p>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-[#141219] p-1 rounded-xl border border-[#2b2518]">
                  <button
                    onClick={() => setOrdersViewMode('cards')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      ordersViewMode === 'cards' ? 'bg-[#252014] text-[#d4af37]' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Card Stream
                  </button>
                  <button
                    onClick={() => setOrdersViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      ordersViewMode === 'table' ? 'bg-[#252014] text-[#d4af37]' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Data Table
                  </button>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="space-y-3 bg-[#0e0d13] p-4 rounded-2xl border border-[#262116]">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by customer name, phone, order number, or address..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full bg-[#121118] border border-[#2b2518] focus:border-[#d4af37] text-white pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  {/* Order Kitchen Status Filter */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-medium mr-1 hidden sm:inline">Status:</span>
                    {['All', 'pending', 'preparing', 'out_for_delivery', 'completed', 'cancelled'].map(
                      (st) => (
                        <button
                          key={st}
                          onClick={() => setOrderStatusFilter(st)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap cursor-pointer transition-colors ${
                            orderStatusFilter === st
                              ? 'gold-gradient-bg text-black'
                              : 'bg-[#141219] text-slate-400 hover:text-white border border-[#262116]'
                          }`}
                        >
                          {st.replace('_', ' ')}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Payment Status Filter Strip */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1c1822]">
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mr-1">
                    <CreditCard className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Payment Status:</span>
                  </span>
                  
                  <button
                    onClick={() => setOrderPaymentFilter('All')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      orderPaymentFilter === 'All'
                        ? 'bg-[#2b2416] text-[#F5D77F] border border-[#d4af37]/60'
                        : 'bg-[#141219] text-slate-400 hover:text-white border border-[#262116]'
                    }`}
                  >
                    All ({orders.length})
                  </button>

                  <button
                    onClick={() => setOrderPaymentFilter('payment_pending')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      orderPaymentFilter === 'payment_pending'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-500'
                        : 'bg-[#141219] text-amber-400/80 hover:text-amber-300 border border-amber-950/60'
                    }`}
                  >
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>Payment Pending</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-900/60 text-[10px] font-mono font-bold text-amber-300">
                      {pendingPaymentOrdersCount}
                    </span>
                  </button>

                  <button
                    onClick={() => setOrderPaymentFilter('payment_verified')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      orderPaymentFilter === 'payment_verified'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500'
                        : 'bg-[#141219] text-emerald-400/80 hover:text-emerald-300 border border-emerald-950/60'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Payment Verified</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-900/60 text-[10px] font-mono font-bold text-emerald-300">
                      {verifiedPaymentOrdersCount}
                    </span>
                  </button>

                  <button
                    onClick={() => setOrderPaymentFilter('payment_failed')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      orderPaymentFilter === 'payment_failed'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-500'
                        : 'bg-[#141219] text-rose-400/80 hover:text-rose-300 border border-rose-950/60'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>Payment Failed</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-900/60 text-[10px] font-mono font-bold text-rose-300">
                      {failedPaymentOrdersCount}
                    </span>
                  </button>
                </div>
              </div>

              {/* Orders Render: Cards or Table */}
              {ordersViewMode === 'cards' ? (
                /* FULL EXPANSIVE ORDER CARDS */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredOrders.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-[#0e0d13] rounded-2xl border border-[#262116]">
                      No orders match your filter criteria.
                    </div>
                  ) : (
                    filteredOrders.map((ord) => {
                      const isPending = ord.payment_status === 'payment_pending';
                      const isVerified = ord.payment_status === 'payment_verified';
                      const isFailed = ord.payment_status === 'payment_failed';
                      const isBankTransfer = ord.payment_method === 'bank_transfer';

                      return (
                        <div
                          key={ord.id}
                          className={`rounded-2xl bg-[#0e0d13] border p-5 flex flex-col justify-between shadow-lg space-y-4 transition-all ${
                            isPending && isBankTransfer
                              ? 'border-amber-500/40 hover:border-amber-500/70'
                              : 'border-[#262116] hover:border-[#3b321a]'
                          }`}
                        >
                          {/* Top Bar: Order Number, Date, Channel */}
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-base font-bold text-[#F5D77F]">
                                  #{ord.order_number}
                                </span>
                              </div>
                              <span className="block text-[11px] text-slate-400 mt-0.5">
                                {new Date(ord.created_at).toLocaleString()}
                              </span>
                            </div>

                            <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-md bg-[#1a1722] text-slate-300 border border-[#2e263a]">
                              {ord.order_channel === 'whatsapp' ? 'WhatsApp Order' : 'Website Direct'}
                            </span>
                          </div>

                          {/* PAYMENT STATUS & METHOD BANNER */}
                          <div className={`p-3 rounded-xl border space-y-2.5 ${
                            isVerified
                              ? 'bg-emerald-950/20 border-emerald-500/30'
                              : isFailed
                              ? 'bg-rose-950/20 border-rose-500/30'
                              : 'bg-amber-950/25 border-amber-500/40'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-[#d4af37]" />
                                <span className="text-xs font-semibold text-slate-200">
                                  {isBankTransfer
                                    ? 'OPay Bank Transfer'
                                    : ord.payment_method === 'whatsapp'
                                    ? 'WhatsApp Checkout'
                                    : 'Pay on Delivery'}
                                </span>
                              </div>

                              {/* Payment status badge */}
                              {isVerified ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/60 text-emerald-300">
                                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                  <span>Payment Verified</span>
                                </span>
                              ) : isFailed ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-500/60 text-rose-300">
                                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                                  <span>Payment Failed</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/60 text-amber-300 animate-pulse">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  <span>Payment Pending</span>
                                </span>
                              )}
                            </div>

                            {/* Bank details note if applicable */}
                            {isBankTransfer && (
                              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-white/5">
                                <span>Target: <strong>OPay (9160722818)</strong></span>
                                <span className="text-slate-500 font-mono">JOSHUA PASCHAL</span>
                              </div>
                            )}

                            {/* ADMIN PAYMENT VERIFICATION CONTROLS */}
                            <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                              <span className="text-[10px] text-slate-400 font-medium">
                                Admin Verification:
                              </span>

                              <div className="flex items-center gap-1.5">
                                {isPending ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdatePaymentStatus(ord.id, 'payment_verified', true)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                                      title="Confirm you have verified customer transfer in your OPay app"
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      <span>Verify Payment</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdatePaymentStatus(ord.id, 'payment_failed')}
                                      className="px-2 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 font-semibold text-[11px] transition-colors cursor-pointer"
                                      title="Mark payment as failed"
                                    >
                                      Fail
                                    </button>
                                  </>
                                ) : (
                                  <select
                                    value={ord.payment_status}
                                    onChange={(e) => handleUpdatePaymentStatus(ord.id, e.target.value as PaymentStatus)}
                                    className="bg-[#121118] border border-[#3b321a] text-slate-200 font-medium text-[11px] rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                                  >
                                    <option value="payment_pending">Payment Pending</option>
                                    <option value="payment_verified">Payment Verified</option>
                                    <option value="payment_failed">Payment Failed</option>
                                  </select>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Customer & Address */}
                          <div className="p-3.5 rounded-xl bg-[#141219] border border-[#2b2518] space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-sm">{ord.customer_name}</span>
                              <span className="capitalize text-slate-300 font-medium">
                                {ord.delivery_type === 'delivery' ? '🛵 Delivery' : '📍 Pickup'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-white/5">
                              <a
                                href={`https://wa.me/${ord.customer_phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-400 font-mono flex items-center gap-1.5 hover:underline"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>{ord.customer_phone}</span>
                              </a>
                              <span className="text-[10px] text-slate-400">Click to chat</span>
                            </div>

                            <div className="pt-1 text-slate-300 flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#d4af37] shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{ord.delivery_address}</span>
                            </div>

                            {ord.delivery_notes && (
                              <p className="text-[11px] text-amber-300/80 italic">
                                "{ord.delivery_notes}"
                              </p>
                            )}
                          </div>

                          {/* Items ordered breakdown */}
                          <div className="space-y-1.5 text-xs">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                              Ordered Dishes ({ord.items.reduce((s, i) => s + i.quantity, 0)} items):
                            </span>
                            <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                              {ord.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between text-slate-300 py-0.5">
                                  <span className="truncate max-w-[200px]">
                                    {it.quantity}× {it.product_name}
                                  </span>
                                  <span className="font-mono text-white tabular-nums">
                                    {formatNaira(it.total)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Total Due & Kitchen Status Selector */}
                          <div className="pt-3 border-t border-[#231e13] flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Total Due</span>
                              <span className="text-base font-bold text-[#F5D77F] font-mono tabular-nums">
                                {formatNaira(ord.total_amount)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                value={ord.status}
                                onChange={(e) => handleUpdateStatus(ord.id, e.target.value as OrderStatus)}
                                className="bg-[#1e1c25] border border-[#3b321a] text-[#F5D77F] font-semibold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="preparing">Preparing</option>
                                <option value="out_for_delivery">Out for Delivery</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>

                              <button
                                onClick={() => setViewingOrder(ord)}
                                className="p-1.5 rounded-lg bg-[#18161f] text-slate-300 hover:text-white cursor-pointer"
                                title="Inspect Full Receipt"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                /* DATA TABLE VIEW */
                <div className="rounded-2xl bg-[#0e0d13] border border-[#262116] overflow-hidden shadow-lg w-full">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#121118] border-b border-[#231e13] text-slate-400 font-semibold">
                        <tr>
                          <th className="py-3 px-4">Ref #</th>
                          <th className="py-3 px-4">Customer Details</th>
                          <th className="py-3 px-4">Type & Address</th>
                          <th className="py-3 px-4">Items</th>
                          <th className="py-3 px-4">Total (₦)</th>
                          <th className="py-3 px-4">Payment Method & Status</th>
                          <th className="py-3 px-4">Kitchen Status</th>
                          <th className="py-3 px-4 text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e1a12]">
                        {filteredOrders.map((ord) => {
                          const isPending = ord.payment_status === 'payment_pending';
                          const isVerified = ord.payment_status === 'payment_verified';
                          const isFailed = ord.payment_status === 'payment_failed';

                          return (
                            <tr key={ord.id} className="hover:bg-[#141219]">
                              <td className="py-3.5 px-4 font-mono font-bold text-[#F5D77F]">
                                #{ord.order_number}
                                <span className="block text-[10px] text-slate-400 font-sans">
                                  {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-bold text-white block">{ord.customer_name}</span>
                                <span className="text-slate-400 font-mono text-[11px] block">{ord.customer_phone}</span>
                              </td>
                              <td className="py-3.5 px-4 max-w-xs truncate">
                                <span className="capitalize font-medium text-slate-200 block">
                                  {ord.delivery_type === 'delivery' ? '🛵 Delivery' : '📍 Pickup'}
                                </span>
                                <span className="text-slate-400 text-[11px] block truncate">
                                  {ord.delivery_address}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-300">
                                <span>{ord.items.reduce((s, i) => s + i.quantity, 0)} items</span>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-white text-xs">
                                {formatNaira(ord.total_amount)}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="space-y-1">
                                  <span className="text-[11px] text-slate-300 font-medium block">
                                    {ord.payment_method === 'bank_transfer'
                                      ? 'OPay Bank Transfer'
                                      : ord.payment_method === 'whatsapp'
                                      ? 'WhatsApp'
                                      : 'Pay on Delivery'}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    {isVerified ? (
                                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/40">
                                        Verified
                                      </span>
                                    ) : isFailed ? (
                                      <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/40">
                                        Failed
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/40 animate-pulse">
                                        Pending
                                      </span>
                                    )}

                                    {isPending && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdatePaymentStatus(ord.id, 'payment_verified', true)}
                                        className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded cursor-pointer"
                                        title="Verify Transfer"
                                      >
                                        Verify
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <select
                                  value={ord.status}
                                  onChange={(e) => handleUpdateStatus(ord.id, e.target.value as OrderStatus)}
                                  className="bg-[#191722] border border-[#3b321a] text-[#F5D77F] text-xs font-semibold rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="preparing">Preparing</option>
                                  <option value="out_for_delivery">Out for Delivery</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => setViewingOrder(ord)}
                                  className="px-2.5 py-1 rounded bg-[#18161f] hover:bg-[#25222f] text-slate-200 cursor-pointer"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB: BANK PAYMENT SETTINGS (OPay Configuration) */}
          {activeTab === 'bank_payments' && (
            <div className="space-y-6 w-full">
              
              {/* Header */}
              <div>
                <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
                  <Building2 className="w-7 h-7 text-[#d4af37]" />
                  <span>Bank Payment Settings (OPay Transfer)</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
                  Configure the bank account details displayed to customers at checkout. When customers place a bank transfer order, their payment is recorded as <strong>Payment Pending</strong> until an authorized administrator verifies receipt of funds.
                </p>
              </div>

              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-[#0f0e15] border border-[#2e2617] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-[#F5D77F]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      Current Bank: {bankName} &bull; {bankAccountNumber}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Account Name: <strong className="text-slate-200">{bankAccountName}</strong> &bull; Status: {bankTransferEnabled ? (
                        <span className="text-emerald-400 font-semibold">Active at Checkout</span>
                      ) : (
                        <span className="text-rose-400 font-semibold">Disabled</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">
                    Pending Verification: <strong className="text-amber-300">{pendingPaymentOrdersCount}</strong>
                  </span>
                </div>
              </div>

              {/* 2-Column Responsive Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Form to update bank details */}
                <form
                  onSubmit={handleSaveBankSettings}
                  className="rounded-2xl bg-[#0e0d13] border border-[#262116] p-6 space-y-5"
                >
                  <div className="border-b border-[#231e13] pb-3">
                    <h3 className="font-bold text-white text-base">Update Bank Account Details</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Changes take effect immediately across all customer checkout sessions.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Bank Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. OPay"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Account Holder Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. JOSHUA PASCHAL"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none uppercase tracking-wide font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Account Number (NUBAN) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      placeholder="e.g. 9160722818"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none font-mono tracking-wider font-bold"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Standard 10-digit Nigerian NUBAN account number.
                    </span>
                  </div>

                  {/* Toggle Enable Bank Transfer */}
                  <div className="pt-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-[#131218] border border-[#2b2518] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bankTransferEnabled}
                        onChange={(e) => setBankTransferEnabled(e.target.checked)}
                        className="w-4 h-4 rounded text-[#d4af37] focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Enable Bank Transfer as Payment Option
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          When checked, customers can select Bank Transfer at checkout.
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Instructions */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Customer Transfer Instructions
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={bankInstructions}
                      onChange={(e) => setBankInstructions(e.target.value)}
                      className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white p-3 rounded-xl text-xs focus:outline-none leading-relaxed"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Displayed on the checkout screen right below the bank details.
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl gold-gradient-bg text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-lg transition-transform active:scale-[0.99]"
                    >
                      Save Bank Payment Settings
                    </button>
                  </div>
                </form>

                {/* Right: Live Preview Card & Administrative Verification Guide */}
                <div className="space-y-6">
                  
                  {/* Live Checkout Preview */}
                  <div className="rounded-2xl bg-[#0e0d13] border border-[#262116] p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#231e13] pb-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#d4af37] block">
                          Customer View Mockup
                        </span>
                        <h4 className="font-bold text-white text-sm">
                          Live Checkout Payment Box Preview
                        </h4>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                        Live Preview
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#141219] border border-[#d4af37]/40 space-y-3.5 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#d4af37]" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Direct Bank Transfer Details
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1e1910] text-[#F5D77F] border border-[#d4af37]/30">
                          {bankName}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs bg-[#0b0a0e] p-3 rounded-lg border border-white/5 font-sans">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Bank Name:</span>
                          <span className="font-bold text-white">{bankName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Account Name:</span>
                          <span className="font-bold text-white uppercase tracking-wide">{bankAccountName}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-white/5">
                          <span className="text-slate-400">Account Number:</span>
                          <span className="font-mono font-bold text-base text-[#F5D77F] tracking-widest">
                            {bankAccountNumber}
                          </span>
                        </div>
                      </div>

                      {/* Test copy button */}
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(bankAccountNumber);
                          setCopiedBankTest(true);
                          setTimeout(() => setCopiedBankTest(false), 2000);
                        }}
                        className="w-full py-2.5 rounded-lg border border-[#d4af37]/60 text-xs font-semibold text-[#F5D77F] hover:bg-[#1f1910] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        {copiedBankTest ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Account Number Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Test Copy Account Number</span>
                          </>
                        )}
                      </button>

                      <p className="text-[11px] text-amber-200/90 italic bg-amber-950/30 p-2.5 rounded-lg border border-amber-500/20 leading-relaxed">
                        "{bankInstructions}"
                      </p>
                    </div>
                  </div>

                  {/* Security & Verification Protocol */}
                  <div className="rounded-2xl bg-[#0e0d13] border border-[#262116] p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <h4 className="font-bold text-white text-sm">
                        Bank Transfer Security Protocol
                      </h4>
                    </div>

                    <div className="space-y-2.5 text-xs text-slate-300">
                      <div className="p-3 rounded-xl bg-[#141219] border border-white/5 flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-[#d4af37] font-bold flex items-center justify-center shrink-0 text-[11px]">
                          1
                        </span>
                        <div>
                          <strong className="text-white block">Orders are Never Auto-Verified</strong>
                          <span className="text-slate-400 text-[11px]">
                            A customer clicking "I have made the transfer" does NOT mark the order as paid. It always enters the dashboard as <strong>Payment Pending</strong>.
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[#141219] border border-white/5 flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-[#d4af37] font-bold flex items-center justify-center shrink-0 text-[11px]">
                          2
                        </span>
                        <div>
                          <strong className="text-white block">Manual Bank App Verification</strong>
                          <span className="text-slate-400 text-[11px]">
                            Check your OPay mobile app to verify that the transfer of the exact order total has credited into <strong>{bankAccountName} ({bankAccountNumber})</strong>.
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[#141219] border border-white/5 flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-[#d4af37] font-bold flex items-center justify-center shrink-0 text-[11px]">
                          3
                        </span>
                        <div>
                          <strong className="text-white block">One-Click Staff Verification</strong>
                          <span className="text-slate-400 text-[11px]">
                            Only authenticated administrators can click <strong>Verify Payment</strong> to set the status to <strong>Payment Verified</strong> and dispatch the ticket to the kitchen.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 4: SUPABASE INTEGRATION (FULL EXPANSIVE VIEW) */}
          {activeTab === 'supabase' && (
            <div className="space-y-6 w-full">
              <div>
                <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white">
                  Supabase PostgreSQL Cloud Integration
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Connect your live Supabase cloud database to persist products, customer orders, and settings.
                </p>
              </div>

              {/* Status Banner */}
              <div
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  supabaseConfig.is_connected
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <Database
                    className={`w-7 h-7 shrink-0 mt-0.5 ${
                      supabaseConfig.is_connected ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  />
                  <div>
                    <h3 className="font-bold text-base text-white">
                      {supabaseConfig.is_connected
                        ? 'Supabase Cloud Database Connected & Active'
                        : 'Currently Operating in Local Storage Mode'}
                    </h3>
                    <p className="text-xs mt-1 leading-relaxed max-w-2xl">
                      {supabaseConfig.is_connected
                        ? 'All products and orders are syncing in real time with your remote Supabase PostgreSQL database.'
                        : 'The app currently saves all menu additions, order submissions, and settings into browser storage. Enter your Supabase credentials to sync live with your cloud database.'}
                    </p>
                    {supabaseConfig.error_message && (
                      <p className="text-xs text-rose-400 mt-2 font-mono">
                        Error Details: {supabaseConfig.error_message}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestSupabase}
                  disabled={isTestingSupabase || !supabaseConfig.url}
                  className="px-5 py-2.5 rounded-xl bg-[#221c10] border border-[#d4af37] text-[#F5D77F] text-xs font-bold whitespace-nowrap hover:bg-[#2d2516] transition-colors cursor-pointer shrink-0"
                >
                  {isTestingSupabase ? 'Testing Connection...' : 'Test Connection'}
                </button>
              </div>

              {/* 2-Column Responsive Layout for Credentials & Security */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left: Credentials form */}
                <div className="rounded-2xl bg-[#0e0d13] border border-[#262116] p-6 space-y-4">
                  <h3 className="font-bold text-white text-sm">Supabase API Credentials</h3>
                  <p className="text-xs text-slate-400">
                    Located in your Supabase dashboard at: <strong>Project Settings &gt; API</strong>.
                  </p>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      1. Supabase Project URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://yourproject.supabase.co"
                      value={supabaseConfig.url}
                      onChange={(e) =>
                        setSupabaseConfig({ ...supabaseConfig, url: e.target.value.trim() })
                      }
                      className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-slate-300">
                        2. Supabase Publishable / Anon API Key
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAnonKey(!showAnonKey)}
                        className="text-[11px] text-[#F5D77F] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{showAnonKey ? 'Hide Key' : 'Reveal Key'}</span>
                      </button>
                    </div>
                    <input
                      type={showAnonKey ? 'text' : 'password'}
                      placeholder="sb_publishable_... or eyJhbGciOi..."
                      value={supabaseConfig.anon_key}
                      onChange={(e) =>
                        setSupabaseConfig({ ...supabaseConfig, anon_key: e.target.value.trim() })
                      }
                      className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none font-mono"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Supports both the newer <code>sb_publishable_...</code> key and the legacy public <code>anon</code> JWT key.
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleTestSupabase}
                      disabled={isTestingSupabase}
                      className="w-full py-3 rounded-xl gold-gradient-bg text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-md"
                    >
                      {isTestingSupabase ? 'Connecting...' : 'Connect & Test Database'}
                    </button>
                  </div>
                </div>

                {/* Right: Security & Instructions */}
                <div className="rounded-2xl bg-[#0e0d13] border border-[#262116] p-6 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">Row Level Security (RLS) Guidelines</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Our schema includes enterprise RLS policies to safeguard customer private information.
                    </p>

                    <ul className="space-y-2 mt-4 text-xs text-slate-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Products Table:</strong> Public visitors can view available menu items; only authenticated administrators can create, edit, or delete items.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Orders & Order Items:</strong> Public visitors can INSERT orders; customer phone numbers and home addresses are never accessible by unauthorized public queries.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Settings Table:</strong> Public visitors can read hours & delivery fees; only authenticated staff can modify parameters.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#141219] border border-[#2b2518] text-xs text-slate-400">
                    <strong className="text-white block">Step-by-Step Setup:</strong>
                    <span>1. Copy the SQL schema below &rarr; 2. Paste in Supabase SQL Editor &rarr; 3. Click Run &rarr; 4. Test connection.</span>
                  </div>
                </div>

              </div>

              {/* Full Width SQL Schema Viewer */}
              <div className="rounded-2xl bg-[#0e0d13] border border-[#262116] p-6 space-y-4 w-full">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      Automatic Database Schema & RLS Policies (Full SQL)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ready to execute in your Supabase SQL Editor.
                    </p>
                  </div>

                  <button
                    onClick={copySqlToClipboard}
                    className="px-4 py-2 rounded-xl border border-[#3b3117] text-xs font-semibold text-[#F5D77F] hover:bg-[#1a1712] flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
                  </button>
                </div>

                <div className="rounded-xl bg-[#060608] border border-white/5 p-4 text-[11px] font-mono text-slate-300 max-h-80 overflow-y-auto leading-relaxed select-all">
                  <pre>{SUPABASE_SQL_SCHEMA}</pre>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: RESTAURANT SETTINGS (FULL EXPANSIVE VIEW) */}
          {activeTab === 'settings' && (
            <div className="space-y-6 w-full">
              <div>
                <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white">
                  Restaurant Profile & Configuration
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Manage physical store details, WhatsApp routing number, delivery fee, and customer announcements.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="rounded-2xl bg-[#0e0d13] border border-[#262116] p-6 sm:p-8 space-y-6 w-full">
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Restaurant Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.restaurant_name}
                      onChange={(e) => setSettingsForm({ ...settingsForm, restaurant_name: e.target.value })}
                      className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Direct Telephone Line
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.phone_number}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone_number: e.target.value })}
                      className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Standard Delivery Fee (₦)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={settingsForm.delivery_fee}
                      onChange={(e) => setSettingsForm({ ...settingsForm, delivery_fee: Number(e.target.value) })}
                      className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      International WhatsApp (Digits only, e.g. 2349024971419)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="2349024971419"
                      value={settingsForm.whatsapp_number}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value.replace(/\D/g, '') })}
                      className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Display WhatsApp Number (e.g. 09024971419)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="09024971419"
                      value={settingsForm.display_whatsapp}
                      onChange={(e) => setSettingsForm({ ...settingsForm, display_whatsapp: e.target.value })}
                      className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Physical Restaurant Address
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.address}
                      onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                      className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Opening & Delivery Hours
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.opening_hours}
                      onChange={(e) => setSettingsForm({ ...settingsForm, opening_hours: e.target.value })}
                      className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Storefront Announcement Banner
                  </label>
                  <input
                    type="text"
                    value={settingsForm.announcement}
                    onChange={(e) => setSettingsForm({ ...settingsForm, announcement: e.target.value })}
                    className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="py-3.5 px-7 rounded-xl gold-gradient-bg text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-lg"
                  >
                    Save All Restaurant Settings
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* TAB 6: ADMIN SECURITY (FULL EXPANSIVE VIEW) */}
          {activeTab === 'security' && (
            <div className="space-y-6 w-full">
              <div>
                <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white">
                  Administrator Credentials & Staff Authentication
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Replace temporary development credentials with a strong password before production deployment.
                </p>
              </div>

              {/* Temporary password warning banner */}
              <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span>Security Advisory: Temporary Password Active</span>
                </div>
                <p className="text-xs leading-relaxed max-w-2xl">
                  The initial credentials: username <code className="font-mono bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-bold">god</code> and temporary password <code className="font-mono bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-bold">god123</code> should be updated immediately to a unique, secure password.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Change Password Form */}
                <form onSubmit={handleChangePassword} className="rounded-2xl bg-[#0e0d13] border border-[#262116] p-6 sm:p-8 space-y-4">
                  <h3 className="font-bold text-white text-sm">Change Staff Password</h3>

                  {passwordError && (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300">
                      {passwordError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter current password (e.g. god123)"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      New Secure Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl gold-gradient-bg text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-md"
                    >
                      Update Administrator Password
                    </button>
                  </div>
                </form>

                {/* Audit & Session Info */}
                <div className="rounded-2xl bg-[#0e0d13] border border-[#262116] p-6 sm:p-8 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">Session & Access Control</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Administrative actions (menu updates, status changes, settings) are authorized through staff session tokens.
                    </p>

                    <div className="mt-4 p-4 rounded-xl bg-[#141219] border border-[#282216] space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Current User:</span>
                        <span className="text-white font-mono font-bold">god</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Access Level:</span>
                        <span className="text-[#F5D77F] font-semibold">Super Administrator</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Session Validity:</span>
                        <span className="text-slate-200">24 Hours (Active)</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onLogout}
                    className="w-full py-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/50 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    Terminate Staff Session & Logout
                  </button>
                </div>

              </div>

            </div>
          )}

        </main>
      </div>

      {/* --- MODAL: ADD / EDIT PRODUCT --- */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-[#0e0d13] border border-[#30291a] rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <div className="p-5 border-b border-[#231e13] flex items-center justify-between bg-[#121118]">
              <h3 className="font-serif-luxury text-lg font-bold text-white">
                {editingProduct ? 'Edit Food Item' : 'Add New Food Item'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#18161f] text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Food Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Royal Double Cheese Burger"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3 py-2 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value as FoodCategory)}
                    className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3 py-2 rounded-xl text-xs focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Price in Nigerian Naira (₦) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={100}
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3 py-2 rounded-xl text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ingredients, preparation method, taste notes..."
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white p-3 rounded-xl text-xs focus:outline-none"
                />
              </div>

              {/* Photo Selector & File Uploader */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Food Photograph <span className="text-rose-400">*</span>
                  </label>
                  <label className="text-[11px] font-semibold text-[#F5D77F] hover:underline flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingImage ? 'Uploading file...' : 'Upload Image File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      disabled={isUploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Active Image Preview Card with File Upload Option */}
                <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-[#141219] border border-[#2b2518]">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-[#d4af37]/60 shrink-0 bg-black">
                    <img
                      src={prodImage}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Selected Photo
                    </span>
                    <p className="text-xs text-white truncate font-mono mt-0.5">
                      {prodImage.startsWith('data:') ? 'Uploaded Image File (Base64 / Storage)' : prodImage}
                    </p>
                    <label className="inline-flex items-center gap-1.5 mt-1 text-xs text-[#F5D77F] font-semibold cursor-pointer hover:underline">
                      <Upload className="w-3 h-3" />
                      <span>{isUploadingImage ? 'Processing photo...' : 'Choose new photo from phone or computer'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400 block mb-2">
                  Or select from kitchen photography presets:
                </span>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {PRESET_IMAGES.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setProdImage(img.url)}
                      className={`relative rounded-lg overflow-hidden border-2 h-14 ${
                        prodImage === img.url ? 'border-[#d4af37]' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.label}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Or enter custom image URL"
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3 py-2 rounded-xl text-xs focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Preparation Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={prodPrepTime}
                    onChange={(e) => setProdPrepTime(Number(e.target.value))}
                    className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3 py-2 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Dietary Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Chef Special, Spicy, Halal"
                    value={prodTags}
                    onChange={(e) => setProdTags(e.target.value)}
                    className="w-full bg-[#131218] border border-[#2b2518] focus:border-[#d4af37] text-white px-3 py-2 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={prodIsAvailable}
                    onChange={(e) => setProdIsAvailable(e.target.checked)}
                    className="rounded text-[#d4af37] focus:ring-0"
                  />
                  <span>Mark as Available for Order</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={prodIsFeatured}
                    onChange={(e) => setProdIsFeatured(e.target.checked)}
                    className="rounded text-[#d4af37] focus:ring-0"
                  />
                  <span>Feature on Homepage Specials</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-[#231e13]">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#3b3117] text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl gold-gradient-bg text-black text-xs font-bold uppercase tracking-wider hover:brightness-110"
                >
                  {editingProduct ? 'Save Changes' : 'Create Food Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE MODAL --- */}
      {productToDelete && (
        <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0f0e14] border border-rose-500/40 p-6 space-y-4 text-center">
            <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="font-bold text-white text-base">Delete Food Item?</h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently remove <strong>"{productToDelete.name}"</strong> from Golden Bite's food menu?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="w-1/2 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="w-1/2 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- VIEW ORDER DETAILS MODAL --- */}
      {viewingOrder && (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0e0d13] border border-[#30291a] overflow-hidden shadow-2xl animate-in fade-in">
            <div className="p-5 border-b border-[#231e13] flex items-center justify-between bg-[#121118]">
              <div>
                <h3 className="font-serif-luxury text-base font-bold text-white">
                  Order #{viewingOrder.order_number}
                </h3>
                <span className="text-[11px] text-slate-400">
                  Received {new Date(viewingOrder.created_at).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="p-1.5 rounded-lg bg-[#18161f] text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              
              {/* Customer */}
              <div className="p-3.5 rounded-xl bg-[#141219] border border-[#2b2518] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer:</span>
                  <span className="font-bold text-white">{viewingOrder.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <a
                    href={`https://wa.me/${viewingOrder.customer_phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{viewingOrder.customer_phone}</span>
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="capitalize text-white font-medium">
                    {viewingOrder.delivery_type === 'delivery' ? 'Home Delivery' : 'Pickup at Counter'}
                  </span>
                </div>
                <div className="pt-1 border-t border-white/5">
                  <span className="text-slate-400 block">Address:</span>
                  <span className="text-white block mt-0.5">{viewingOrder.delivery_address}</span>
                </div>
                {viewingOrder.delivery_notes && (
                  <div className="pt-1 text-amber-300/90 italic">
                    Note: {viewingOrder.delivery_notes}
                  </div>
                )}
              </div>

              {/* PAYMENT DETAILS & VERIFICATION ACTIONS */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                viewingOrder.payment_status === 'payment_verified'
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : viewingOrder.payment_status === 'payment_failed'
                  ? 'bg-rose-950/20 border-rose-500/40'
                  : 'bg-amber-950/25 border-amber-500/40'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#d4af37]" />
                    <span className="font-bold text-white uppercase text-[11px] tracking-wider">
                      Payment Verification Details
                    </span>
                  </div>

                  {viewingOrder.payment_status === 'payment_verified' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500 text-emerald-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Payment Verified</span>
                    </span>
                  ) : viewingOrder.payment_status === 'payment_failed' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-500 text-rose-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Payment Failed</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500 text-amber-300 animate-pulse">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Payment Pending</span>
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs bg-[#0b0a0e] p-3 rounded-lg border border-white/5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Method:</span>
                    <span className="text-white font-medium">
                      {viewingOrder.payment_method === 'bank_transfer'
                        ? 'OPay Direct Bank Transfer'
                        : viewingOrder.payment_method === 'whatsapp'
                        ? 'WhatsApp Checkout'
                        : 'Cash / Card on Delivery'}
                    </span>
                  </div>

                  {viewingOrder.bank_payment_details ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Target Bank:</span>
                        <span className="text-[#F5D77F] font-bold">{viewingOrder.bank_payment_details.bank_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Account Name:</span>
                        <span className="text-white font-medium">{viewingOrder.bank_payment_details.account_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Account Number:</span>
                        <span className="text-white font-mono font-bold">{viewingOrder.bank_payment_details.account_number}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bank Config:</span>
                      <span className="text-slate-300 font-mono">OPay (9160722818)</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-1 border-t border-white/5">
                    <span className="text-slate-400">Amount Expected:</span>
                    <span className="text-base font-bold text-[#F5D77F] font-mono">
                      {formatNaira(viewingOrder.total_amount)}
                    </span>
                  </div>
                </div>

                {/* Staff Actions */}
                <div className="pt-2 border-t border-white/5">
                  <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                    Administrator Action (Confirm funds received in your bank app):
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdatePaymentStatus(viewingOrder.id, 'payment_verified', true)}
                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify Payment</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdatePaymentStatus(viewingOrder.id, 'payment_failed')}
                      className="py-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/50 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Mark Failed</span>
                    </button>
                  </div>

                  {viewingOrder.payment_status !== 'payment_pending' && (
                    <button
                      type="button"
                      onClick={() => handleUpdatePaymentStatus(viewingOrder.id, 'payment_pending')}
                      className="w-full mt-2 py-1.5 rounded-lg border border-slate-700 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer text-center"
                    >
                      Reset to Payment Pending
                    </button>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-bold text-white mb-2 uppercase text-[10px] tracking-wider text-[#d4af37]">
                  Items Ordered
                </h4>
                <div className="space-y-2">
                  {viewingOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between p-2 rounded-lg bg-[#141218]">
                      <div>
                        <span className="font-bold text-white block">{it.quantity}× {it.product_name}</span>
                        {it.instructions && (
                          <span className="text-[10px] text-slate-400 italic block">
                            Note: {it.instructions}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[#F5D77F] tabular-nums font-bold">
                        {formatNaira(it.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="pt-3 border-t border-[#231e13] space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-white tabular-nums">{formatNaira(viewingOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Delivery Fee:</span>
                  <span className="font-mono text-white tabular-nums">
                    {viewingOrder.delivery_fee === 0 ? 'FREE' : formatNaira(viewingOrder.delivery_fee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-[#231e13]">
                  <span>Total Amount:</span>
                  <span className="font-mono text-[#F5D77F] tabular-nums">{formatNaira(viewingOrder.total_amount)}</span>
                </div>
              </div>

              {/* Kitchen Status Update */}
              <div className="pt-3 border-t border-[#231e13] flex items-center justify-between">
                <span className="text-slate-300 font-medium">Update Kitchen Status:</span>
                <select
                  value={viewingOrder.status}
                  onChange={(e) => handleUpdateStatus(viewingOrder.id, e.target.value as OrderStatus)}
                  className="bg-[#1e1c25] border border-[#3b321a] text-[#F5D77F] font-semibold text-xs rounded-lg px-3 py-1.5 focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing in Kitchen</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
