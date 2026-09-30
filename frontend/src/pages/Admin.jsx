import './Admin.css';
import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Package,
  Tags,
  Users,
  ShoppingCart,
  CreditCard,
  Ticket,
  Star,
  Boxes,
  Image as ImageIcon,
  ShieldCheck,
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  RefreshCw,
  Menu,
  LogOut,
  TrendingUp,
  IndianRupee,
  UserPlus,
  ShoppingBag,
  CalendarDays,
  ChevronRight,
  Upload,
  Eye
} from 'lucide-react';

import { api, money } from '../services/api';


// ============================================================
// HELPERS
// ============================================================

const emptyCategory = {
  name: '',
  slug: '',
  is_active: true
};

const emptyProduct = {
  name: '',
  slug: '',
  brand: '',
  categoryId: '',
  price: '',
  compareAtPrice: '',
  stock: '',
  imageUrl: '',
  description: '',
  variants: [
    { size: 'S', stock: 0 },
    { size: 'M', stock: 0 },
    { size: 'L', stock: 0 },
    { size: 'XL', stock: 0 },
    { size: 'XXL', stock: 0 }
  ]
};


// ============================================================
// MAIN ADMIN COMPONENT
// ============================================================

export default function Admin() {

  // ----------------------------------------------------------
  // Navigation
  // ----------------------------------------------------------

  const [activeSection, setActiveSection] = useState('overview');
  const [mobileMenu, setMobileMenu] = useState(false);

  // ----------------------------------------------------------
  // General
  // ----------------------------------------------------------

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // ----------------------------------------------------------
  // Dashboard
  // ----------------------------------------------------------

  const [dashboard, setDashboard] = useState(null);

  // ----------------------------------------------------------
  // Analytics
  // ----------------------------------------------------------

  const [analytics, setAnalytics] = useState(null);
  const [analyticsFrom, setAnalyticsFrom] = useState('');
  const [analyticsTo, setAnalyticsTo] = useState('');

  // ----------------------------------------------------------
  // Categories
  // ----------------------------------------------------------

  const [categories, setCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryImage, setCategoryImage] = useState(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState('');

  // ----------------------------------------------------------
  // Products
  // ----------------------------------------------------------

  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');

  const [showProductModal, setShowProductModal] = useState(false);
  const [productSaving, setProductSaving] = useState(false);

  const [productForm, setProductForm] = useState(emptyProduct);
  const [productImages, setProductImages] = useState([]);

  // ----------------------------------------------------------
  // Generic sections
  // ----------------------------------------------------------

  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);

  // Order fulfilment
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderActionLoading, setOrderActionLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [coupons, setCoupons] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [banners, setBanners] = useState([]);
  const [admins, setAdmins] = useState([]);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadSection(activeSection);
  }, [activeSection]);


  // ==========================================================
  // LOAD SECTION
  // ==========================================================

  async function loadSection(section) {

    setLoading(true);
    setError('');

    try {

      if (section === 'overview') {
        await loadDashboard();
      }

      if (section === 'analytics') {
        await loadAnalytics();
      }

      if (section === 'products') {
        await loadProducts();
      }

      if (section === 'categories') {
        await loadCategories();
      }

      if (section === 'customers') {
        await loadCustomers();
      }

      if (section === 'orders') {
        await loadOrders();
      }

      if (section === 'payments') {
        await loadPayments();
      }

      if (section === 'coupons') {
        await loadCoupons();
      }

      if (section === 'reviews') {
        await loadReviews();
      }

      if (section === 'inventory') {
        await loadInventory();
      }

      if (section === 'banners') {
        await loadBanners();
      }

      if (section === 'admins') {
        await loadAdmins();
      }

    } catch (err) {

      console.error(err);

      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load data'
      );

    } finally {

      setLoading(false);

    }
  }


  // ==========================================================
  // DASHBOARD
  // ==========================================================

  async function loadDashboard() {

    /*
     * Overview needs today's and current-year statistics.
     * /admin/analytics returns the exact values used by
     * the Overview cards:
     *
     *   usersToday
     *   ordersToday
     *   todayRevenue
     *   annualRevenue
     *
     * This keeps the Overview connected to the live
     * PostgreSQL order data.
     */

    const response =
      await api.get('/admin/analytics');

    const data =
      response.data || {};

    const summary =
      data.summary || {};

    setDashboard({

      ...summary,

      usersToday:
        Number(summary.usersToday) || 0,

      ordersToday:
        Number(summary.ordersToday) || 0,

      todayRevenue:
        Number(summary.todayRevenue) || 0,

      annualRevenue:
        Number(summary.annualRevenue) || 0,

      totalUsers:
        Number(summary.totalUsers) || 0,

      trend:
        Array.isArray(data.trend)
          ? data.trend
          : []

    });
  }


  // ==========================================================
  // ANALYTICS
  // ==========================================================

  async function loadAnalytics() {

    /*
     * IMPORTANT:
     * The backend returns:
     *
     * {
     *   range: { from, to },
     *   summary: {
     *     usersToday,
     *     ordersToday,
     *     todayRevenue,
     *     annualRevenue,
     *     totalUsers
     *   },
     *   trend: [...]
     * }
     *
     * Keep that structure intact and expose the summary
     * values at the root for the Analytics UI.
     */

    const params = {};

    if (analyticsFrom) {
      params.from = analyticsFrom;
    }

    if (analyticsTo) {
      params.to = analyticsTo;
    }

    const response =
      await api.get(
        '/admin/analytics',
        { params }
      );

    /*
     * Axios normally gives us response.data.
     * This normalization also handles an accidental
     * { data: {...} } wrapper without losing the trend.
     */
    const body =
      response?.data || {};

    const payload =
      body?.data &&
      (
        body.data.range ||
        body.data.summary ||
        Array.isArray(body.data.trend)
      )
        ? body.data
        : body;

    const range =
      payload?.range || {};

    const backendSummary =
      payload?.summary || {};

    const trend =
      Array.isArray(payload?.trend)
        ? payload.trend
        : [];

    const normalizedTrend =
      trend.map((item, index) => ({
        date:
          normalizeAnalyticsDate(
            item?.date ??
            item?.day
          ),
        orders:
          Number(
            item?.orders ??
            item?.order_count ??
            item?.count ??
            0
          ) || 0,
        revenue:
          Number(
            item?.revenue ??
            item?.totalRevenue ??
            item?.total_revenue ??
            0
          ) || 0,
        _index: index
      }));

    /*
     * The backend generates one row for every day in the
     * requested range, including days with zero orders.
     * Therefore a valid analytics response should always
     * produce a trend array.
     *
     * If an old backend returns no trend, create the date
     * range in the frontend so the graphs still render.
     */
    let finalTrend =
      normalizedTrend.filter(
        item => item.date
      );

    if (
      finalTrend.length === 0 &&
      range.from &&
      range.to
    ) {

      finalTrend =
        buildEmptyAnalyticsTrend(
          range.from,
          range.to
        );
    }

    /*
     * Remove the internal index before storing state.
     */
    finalTrend =
      finalTrend.map(
        ({ _index, ...item }) =>
          item
      );

    const finalData = {

      range: {
        from:
          range.from ||
          analyticsFrom ||
          '',
        to:
          range.to ||
          analyticsTo ||
          ''
      },

      usersToday:
        Number(
          backendSummary.usersToday ??
          payload.usersToday ??
          0
        ) || 0,

      ordersToday:
        Number(
          backendSummary.ordersToday ??
          payload.ordersToday ??
          0
        ) || 0,

      todayRevenue:
        Number(
          backendSummary.todayRevenue ??
          payload.todayRevenue ??
          0
        ) || 0,

      annualRevenue:
        Number(
          backendSummary.annualRevenue ??
          payload.annualRevenue ??
          0
        ) || 0,

      totalUsers:
        Number(
          backendSummary.totalUsers ??
          payload.totalUsers ??
          0
        ) || 0,

      trend:
        finalTrend
    };

    /*
     * Set the date inputs from the backend response.
     * This fixes the blank From/To fields.
     */
    if (finalData.range.from) {
      setAnalyticsFrom(
        finalData.range.from
      );
    }

    if (finalData.range.to) {
      setAnalyticsTo(
        finalData.range.to
      );
    }

    setAnalytics(finalData);
  }


  // ==========================================================
  // CATEGORIES
  // ==========================================================

  async function loadCategories() {

    const response = await api.get(
      '/admin/categories'
    );

    setCategories(
      Array.isArray(response.data)
        ? response.data
        : response.data?.categories || []
    );
  }


  // ==========================================================
  // OPEN ADD CATEGORY
  // ==========================================================

  function openAddCategory() {

    setEditingCategory(null);

    setCategoryForm({
      ...emptyCategory
    });

    setCategoryImage(null);
    setCategoryImagePreview('');

    setShowCategoryModal(true);

    setMessage('');
    setError('');
  }


  // ==========================================================
  // OPEN EDIT CATEGORY
  // ==========================================================

  function openEditCategory(category) {

    setEditingCategory(category);

    setCategoryForm({
      name: category.name || '',
      slug: category.slug || '',
      is_active:
        category.is_active !== undefined
          ? category.is_active
          : true
    });

    setCategoryImage(null);
    setCategoryImagePreview(
      category.image_url || ''
    );

    setShowCategoryModal(true);

    setMessage('');
    setError('');
  }


  // ==========================================================
  // CLOSE CATEGORY MODAL
  // ==========================================================

  function closeCategoryModal() {

    if (categorySaving) {
      return;
    }

    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryForm({
      ...emptyCategory
    });

    setCategoryImage(null);
    setCategoryImagePreview('');
  }


  // ==========================================================
  // CATEGORY IMAGE CHANGE
  // ==========================================================

  function handleCategoryImageChange(event) {

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        'Only JPG, PNG and WEBP images are allowed.'
      );
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        'Category image must be smaller than 5MB.'
      );
      event.target.value = '';
      return;
    }

    setError('');
    setCategoryImage(file);

    const previewUrl =
      URL.createObjectURL(file);

    setCategoryImagePreview(previewUrl);
  }


  // ==========================================================
  // CATEGORY NAME CHANGE
  // ==========================================================

  function handleCategoryNameChange(value) {

    setCategoryForm(prev => {

      const next = {
        ...prev,
        name: value
      };

      // Automatically generate slug when creating.
      if (!editingCategory) {

        next.slug = value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

      }

      return next;
    });
  }


  // ==========================================================
  // SAVE CATEGORY
  // ==========================================================

  async function saveCategory(event) {

    event.preventDefault();

    if (!categoryForm.name.trim()) {

      setError(
        'Category name is required.'
      );

      return;
    }

    if (!categoryForm.slug.trim()) {

      setError(
        'Category slug is required.'
      );

      return;
    }

    setCategorySaving(true);
    setError('');
    setMessage('');

    try {

      const formData = new FormData();

      formData.append(
        'name',
        categoryForm.name.trim()
      );

      formData.append(
        'slug',
        categoryForm.slug.trim()
      );

      formData.append(
        'is_active',
        String(categoryForm.is_active)
      );

      // Send the camelCase field as well for backend compatibility.
      formData.append(
        'isActive',
        String(categoryForm.is_active)
      );

      if (categoryImage) {
        formData.append(
          'image',
          categoryImage
        );
      }

      if (editingCategory) {

        await api.patch(
          `/admin/categories/${editingCategory.id}`,
          formData
        );

        setMessage(
          'Category updated successfully.'
        );

      } else {

        await api.post(
          '/admin/categories',
          formData
        );

        setMessage(
          'Category created successfully.'
        );
      }

      closeCategoryModal();

      await loadCategories();

    } catch (err) {

      console.error(err);

      setError(
        err?.response?.data?.message ||
        'Unable to save category.'
      );

    } finally {

      setCategorySaving(false);
    }
  }


  // ==========================================================
  // DELETE CATEGORY
  // ==========================================================

  async function deleteCategory(category) {

    const confirmed = window.confirm(
      `Delete category "${category.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setError('');
    setMessage('');

    try {

      await api.delete(
        `/admin/categories/${category.id}`
      );

      setMessage(
        'Category deleted successfully.'
      );

      await loadCategories();

    } catch (err) {

      console.error(err);

      setError(
        err?.response?.data?.message ||
        'Unable to delete category.'
      );
    }
  }


  // ==========================================================
  // FILTERED CATEGORIES
  // ==========================================================

  const filteredCategories = useMemo(() => {

    const search =
      categorySearch
        .toLowerCase()
        .trim();

    if (!search) {
      return categories;
    }

    return categories.filter(category => {

      return (
        category.name
          ?.toLowerCase()
          .includes(search) ||

        category.slug
          ?.toLowerCase()
          .includes(search)
      );

    });

  }, [
    categories,
    categorySearch
  ]);


  // ==========================================================
  // PRODUCTS
  // ==========================================================

  async function loadProducts() {

    const response = await api.get(
      '/admin/products'
    );

    setProducts(
      Array.isArray(response.data)
        ? response.data
        : response.data?.products || []
    );
  }


  // ==========================================================
  // OPEN ADD PRODUCT
  // ==========================================================

  function openAddProduct() {

    setProductForm({
      ...emptyProduct,
      variants: [
        { size: 'S', stock: 0 },
        { size: 'M', stock: 0 },
        { size: 'L', stock: 0 },
        { size: 'XL', stock: 0 },
        { size: 'XXL', stock: 0 }
      ]
    });

    setProductImages([]);

    setShowProductModal(true);

    setMessage('');
    setError('');
  }


  // ==========================================================
  // PRODUCT INPUT
  // ==========================================================

  function updateProductField(
    field,
    value
  ) {

    setProductForm(prev => ({
      ...prev,
      [field]: value
    }));
  }


  // ==========================================================
  // PRODUCT NAME
  // ==========================================================

  function handleProductNameChange(value) {

    setProductForm(prev => {

      const next = {
        ...prev,
        name: value
      };

      if (!prev.slug) {

        next.slug = value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

      }

      return next;
    });
  }


  // ==========================================================
  // PRODUCT VARIANT
  // ==========================================================

  function updateVariant(
    index,
    field,
    value
  ) {

    setProductForm(prev => {

      const variants = [
        ...prev.variants
      ];

      variants[index] = {
        ...variants[index],
        [field]:
          field === 'stock'
            ? Number(value)
            : value
      };

      return {
        ...prev,
        variants
      };
    });
  }


  // ==========================================================
  // ADD SIZE
  // ==========================================================

  function addVariant() {

    setProductForm(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          size: '',
          stock: 0
        }
      ]
    }));
  }


  // ==========================================================
  // REMOVE SIZE
  // ==========================================================

  function removeVariant(index) {

    setProductForm(prev => ({
      ...prev,
      variants: prev.variants.filter(
        (_, i) => i !== index
      )
    }));
  }


  // ==========================================================
  // PRODUCT IMAGE FILES
  // ==========================================================

  function handleProductImages(event) {

    const files = Array.from(
      event.target.files || []
    );

    setProductImages(files);
  }


  // ==========================================================
  // SAVE PRODUCT
  // ==========================================================

  async function saveProduct(event) {

    event.preventDefault();

    if (!productForm.name.trim()) {

      setError(
        'Product name is required.'
      );

      return;
    }

    if (!productForm.categoryId) {

      setError(
        'Please select a category.'
      );

      return;
    }

    if (!productForm.price) {

      setError(
        'Product price is required.'
      );

      return;
    }

    setProductSaving(true);
    setError('');
    setMessage('');

    try {

      const formData = new FormData();

      formData.append(
        'name',
        productForm.name.trim()
      );

      formData.append(
        'slug',
        productForm.slug.trim()
      );

      formData.append(
        'brand',
        productForm.brand.trim()
      );

      formData.append(
        'categoryId',
        productForm.categoryId
      );

      formData.append(
        'price',
        productForm.price
      );

      if (productForm.compareAtPrice) {

        formData.append(
          'compareAtPrice',
          productForm.compareAtPrice
        );

      }

      formData.append(
        'stock',
        productForm.stock || 0
      );

      formData.append(
        'description',
        productForm.description || ''
      );

      if (productForm.imageUrl) {

        formData.append(
          'imageUrl',
          productForm.imageUrl
        );

      }

      const validVariants =
        productForm.variants
          .filter(v => v.size?.trim())
          .map(v => ({
            size: v.size.trim(),
            stock: Number(v.stock) || 0
          }));

      formData.append(
        'variants',
        JSON.stringify(validVariants)
      );

      productImages.forEach(file => {

        formData.append(
          'images',
          file
        );

      });

      await api.post(
        '/admin/products',
        formData
      );

      setMessage(
        'Product created successfully.'
      );

      setShowProductModal(false);

      await loadProducts();

    } catch (err) {

      console.error(err);

      setError(
        err?.response?.data?.message ||
        'Unable to create product.'
      );

    } finally {

      setProductSaving(false);
    }
  }


  // ==========================================================
  // FILTER PRODUCTS
  // ==========================================================

  const filteredProducts = useMemo(() => {

    const search =
      productSearch
        .toLowerCase()
        .trim();

    if (!search) {
      return products;
    }

    return products.filter(product => {

      return (
        product.name
          ?.toLowerCase()
          .includes(search) ||

        product.brand
          ?.toLowerCase()
          .includes(search) ||

        product.category_name
          ?.toLowerCase()
          .includes(search)
      );

    });

  }, [
    products,
    productSearch
  ]);


  // ==========================================================
  // OTHER ADMIN DATA
  // ==========================================================

  async function loadCustomers() {

    const response = await api.get(
      '/admin/customers'
    );

    setCustomers(
      Array.isArray(response.data)
        ? response.data
        : response.data?.customers || []
    );
  }


  async function loadOrders() {

    const response = await api.get(
      '/admin/orders'
    );

    const rows =
      Array.isArray(response.data)
        ? response.data
        : response.data?.orders || [];

    setOrders(rows);

    // Keep the currently open order in sync after status updates.
    if (selectedOrder?.id) {
      const fresh = rows.find(
        order => String(order.id) === String(selectedOrder.id)
      );

      if (fresh) {
        setSelectedOrder(prev => ({
          ...prev,
          ...fresh
        }));
      }
    }
  }


  async function openOrder(order) {

    if (!order?.id) {
      return;
    }

    setOrderLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.get(
        `/admin/orders/${order.id}`
      );

      const payload = response?.data || {};
      const detail = payload.order || payload;

      setSelectedOrder({
        ...order,
        ...detail,
        items: Array.isArray(detail?.items)
          ? detail.items
          : Array.isArray(order?.items)
            ? order.items
            : []
      });
    } catch (err) {
      console.error('Unable to load order details:', err);

      // The list endpoint is still useful if an older backend does not
      // have the detail route yet. Open the order rather than showing a
      // blank screen, while clearly indicating that detail data is absent.
      setSelectedOrder({
        ...order,
        items: Array.isArray(order?.items)
          ? order.items
          : []
      });

      setError(
        err?.response?.data?.message ||
        'Order details could not be loaded. The order list is shown with the available information.'
      );
    } finally {
      setOrderLoading(false);
    }
  }


  function closeOrder() {
    if (orderActionLoading) {
      return;
    }

    setSelectedOrder(null);
    setError('');
    setMessage('');
  }


  async function updateOrderStatus(
    status,
    extra = {}
  ) {

    if (!selectedOrder?.id) {
      return;
    }

    setOrderActionLoading(true);
    setError('');
    setMessage('');

    try {
      await api.patch(
        `/admin/orders/${selectedOrder.id}/status`,
        {
          status,
          ...extra
        }
      );

      setMessage(
        `Order status updated to ${formatOrderStatus(status)}.`
      );

      await loadOrders();

      // Reload the full order detail when possible.
      try {
        const response = await api.get(
          `/admin/orders/${selectedOrder.id}`
        );

        const payload = response?.data || {};
        const detail = payload.order || payload;

        setSelectedOrder(prev => ({
          ...prev,
          ...detail,
          items: Array.isArray(detail?.items)
            ? detail.items
            : Array.isArray(prev?.items)
              ? prev.items
              : []
        }));
      } catch (detailError) {
        setSelectedOrder(prev => ({
          ...prev,
          status
        }));
      }
    } catch (err) {
      console.error('Order status update error:', err);
      setError(
        err?.response?.data?.message ||
        'Unable to update order status.'
      );
    } finally {
      setOrderActionLoading(false);
    }
  }


  const filteredOrders = useMemo(() => {

    const search =
      orderSearch.trim().toLowerCase();

    return orders.filter(order => {

      const status =
        String(order?.status || '')
          .toLowerCase();

      const orderNumber =
        getOrderNumber(order)
          .toLowerCase();

      const customer =
        String(
          order?.customer_name ||
          order?.name ||
          ''
        ).toLowerCase();

      const mobile =
        String(
          order?.mobile ||
          order?.customer_mobile ||
          ''
        ).toLowerCase();

      const matchesSearch =
        !search ||
        orderNumber.includes(search) ||
        customer.includes(search) ||
        mobile.includes(search) ||
        String(order?.id || '')
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        orderStatusFilter === 'all' ||
        status === orderStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    orders,
    orderSearch,
    orderStatusFilter
  ]);


  async function loadPayments() {

    const response = await api.get(
      '/admin/payments'
    );

    const rows =
      Array.isArray(response.data)
        ? response.data
        : response.data?.payments || [];

    setPayments(rows);

    if (selectedPayment?.id) {
      const fresh = rows.find(
        payment =>
          String(payment.id) ===
          String(selectedPayment.id)
      );

      if (fresh) {
        setSelectedPayment(prev => ({
          ...prev,
          ...fresh
        }));
      }
    }
  }


  async function openPayment(payment) {

    if (!payment?.id) {
      return;
    }

    setPaymentLoading(true);
    setError('');
    setMessage('');

    try {

      /*
       * The detail endpoint is supported by the updated admin
       * backend. If an older backend does not have it yet, the
       * selected row is still opened so the admin can inspect
       * all fields returned by /admin/payments.
       */
      const response = await api.get(
        `/admin/payments/${payment.id}`
      );

      const payload =
        response?.data || {};

      const detail =
        payload.payment ||
        payload.data ||
        payload;

      setSelectedPayment({
        ...payment,
        ...(detail || {})
      });

    } catch (err) {

      console.warn(
        'Payment detail endpoint unavailable; showing payment row:',
        err
      );

      setSelectedPayment(payment);

    } finally {

      setPaymentLoading(false);

    }
  }


  function closePayment() {

    if (paymentLoading) {
      return;
    }

    setSelectedPayment(null);
    setError('');
    setMessage('');

  }


  async function loadCoupons() {

    const response = await api.get(
      '/admin/coupons'
    );

    setCoupons(
      Array.isArray(response.data)
        ? response.data
        : response.data?.coupons || []
    );
  }


  async function loadReviews() {

    const response = await api.get(
      '/admin/reviews'
    );

    setReviews(
      Array.isArray(response.data)
        ? response.data
        : response.data?.reviews || []
    );
  }


  async function loadInventory() {

    const response = await api.get(
      '/admin/inventory'
    );

    setInventory(
      Array.isArray(response.data)
        ? response.data
        : response.data?.inventory || []
    );
  }


  async function loadBanners() {

    const response = await api.get(
      '/admin/banners'
    );

    setBanners(
      Array.isArray(response.data)
        ? response.data
        : response.data?.banners || []
    );
  }


  async function loadAdmins() {

    const response = await api.get(
      '/admin/admins'
    );

    setAdmins(
      Array.isArray(response.data)
        ? response.data
        : response.data?.admins || []
    );
  }


  // ==========================================================
  // LOGOUT
  // ==========================================================

  function logout() {

    localStorage.removeItem('ft_token');
    localStorage.removeItem('ft_admin');

    window.location.href =
      '/admin/login';
  }


  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigation = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: Tags
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingCart
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard
    },
    {
      id: 'coupons',
      label: 'Coupons',
      icon: Ticket
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: Star
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Boxes
    },
    {
      id: 'banners',
      label: 'Banners',
      icon: ImageIcon
    },
    {
      id: 'admins',
      label: 'Admin users',
      icon: ShieldCheck
    }
  ];


  // ==========================================================
  // TITLE
  // ==========================================================

  const currentTitle =
    navigation.find(
      item => item.id === activeSection
    )?.label || 'Overview';


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="admin-layout">

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {mobileMenu && (
        <div
          className="admin-mobile-overlay"
          onClick={() => setMobileMenu(false)}
        />
      )}


      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={
          `admin-sidebar ${
            mobileMenu
              ? 'mobile-open'
              : ''
          }`
        }
      >

        <div className="admin-brand">

          <div className="admin-brand-logo">
            FT
          </div>

          <div>
            <strong>
              FASHION TRENDS
            </strong>

            <small>
              CONTROL CENTER
            </small>
          </div>

        </div>


        <nav className="admin-navigation">

          {navigation.map(item => {

            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                className={
                  activeSection === item.id
                    ? 'active'
                    : ''
                }
                onClick={() => {

                  setActiveSection(
                    item.id
                  );

                  setMobileMenu(
                    false
                  );

                  setMessage('');
                  setError('');
                }}
              >

                <Icon size={21} />

                <span>
                  {item.label}
                </span>

              </button>
            );

          })}

        </nav>


        <div className="admin-sidebar-bottom">

          <button
            type="button"
            onClick={logout}
          >
            <LogOut size={20} />
            <span>
              Logout
            </span>
          </button>

        </div>

      </aside>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="admin-main">

        {/* ===================================================
            TOP BAR
        =================================================== */}

        <header className="admin-topbar">

          <button
            type="button"
            className="admin-mobile-menu"
            onClick={() =>
              setMobileMenu(true)
            }
          >
            <Menu size={23} />
          </button>


          <div>

            <h1>
              {currentTitle}
            </h1>

            <p>
              Fashion Trends Admin Control Center
            </p>

          </div>


          <button
            type="button"
            className="admin-refresh"
            onClick={() =>
              loadSection(activeSection)
            }
            title="Refresh"
          >
            <RefreshCw size={19} />
          </button>

        </header>


        {/* ===================================================
            NOTIFICATIONS
        =================================================== */}

        {message && (
          <div className="admin-success-message">
            {message}
          </div>
        )}


        {error && (
          <div className="admin-error-message">
            {error}
          </div>
        )}


        {/* ===================================================
            CONTENT
        =================================================== */}

        <div className="admin-content">

          {loading && (
            <div className="admin-loading">
              Loading...
            </div>
          )}


          {/* =================================================
              OVERVIEW
          ================================================= */}

          {!loading &&
            activeSection === 'overview' && (

            <Overview
              dashboard={dashboard}
              onProducts={() =>
                setActiveSection(
                  'products'
                )
              }
              onOrders={() =>
                setActiveSection(
                  'orders'
                )
              }
              onCustomers={() =>
                setActiveSection(
                  'customers'
                )
              }
            />

          )}


          {/* =================================================
              ANALYTICS
          ================================================= */}

          {!loading &&
            activeSection === 'analytics' && (

            <AnalyticsSection
              analytics={analytics}
              from={analyticsFrom}
              to={analyticsTo}
              setFrom={setAnalyticsFrom}
              setTo={setAnalyticsTo}
              onApply={loadAnalytics}
            />

          )}


          {/* =================================================
              PRODUCTS
          ================================================= */}

          {!loading &&
            activeSection === 'products' && (

            <section className="admin-section">

              <div className="section-toolbar">

                <div className="search-box">

                  <Search size={20} />

                  <input
                    value={productSearch}
                    onChange={e =>
                      setProductSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search products..."
                  />

                </div>


                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={openAddProduct}
                >
                  <Plus size={18} />
                  Add Product
                </button>

              </div>


              <div className="admin-card">

                <div className="card-heading">

                  <div>

                    <h2>
                      Products
                    </h2>

                    <span>
                      {filteredProducts.length} records
                    </span>

                  </div>

                </div>


                {filteredProducts.length === 0 ? (

                  <EmptyTable
                    message="No products found."
                  />

                ) : (

                  <div className="admin-table-wrapper">

                    <table className="admin-table">

                      <thead>

                        <tr>
                          <th>Product</th>
                          <th>Brand</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Status</th>
                        </tr>

                      </thead>

                      <tbody>

                        {filteredProducts.map(
                          product => (

                            <tr
                              key={
                                product.id
                              }
                            >

                              <td>
                                <div className="product-table-name">

                                  {product.image_url ? (
                                    <img
                                      src={
                                        product.image_url
                                      }
                                      alt={
                                        product.name
                                      }
                                    />
                                  ) : (
                                    <div className="product-placeholder">
                                      <Package
                                        size={20}
                                      />
                                    </div>
                                  )}

                                  <strong>
                                    {product.name}
                                  </strong>

                                </div>
                              </td>

                              <td>
                                {product.brand ||
                                  '—'}
                              </td>

                              <td>
                                {product.category_name ||
                                  '—'}
                              </td>

                              <td>
                                {money(
                                  product.price
                                )}
                              </td>

                              <td>
                                <span className="status-active">
                                  {product.status ||
                                    'active'}
                                </span>
                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                )}

              </div>

            </section>

          )}


          {/* =================================================
              CATEGORIES
          ================================================= */}

          {!loading &&
            activeSection === 'categories' && (

            <section className="admin-section">

              <div className="section-toolbar">

                <div className="search-box">

                  <Search size={20} />

                  <input
                    value={categorySearch}
                    onChange={e =>
                      setCategorySearch(
                        e.target.value
                      )
                    }
                    placeholder="Search categories..."
                  />

                </div>


                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={openAddCategory}
                >
                  <Plus size={18} />
                  Add
                </button>

              </div>


              <div className="admin-card">

                <div className="card-heading">

                  <div>

                    <h2>
                      Categories
                    </h2>

                    <span>
                      {filteredCategories.length} records
                    </span>

                  </div>

                </div>


                {filteredCategories.length === 0 ? (

                  <EmptyTable
                    message="No categories found."
                  />

                ) : (

                  <div className="admin-table-wrapper">

                    <table className="admin-table category-table">

                      <thead>

                        <tr>

                          <th>
                            NAME
                          </th>

                          <th>
                            SLUG
                          </th>

                          <th>
                            IMAGE
                          </th>

                          <th>
                            ACTIVE
                          </th>

                          <th>
                            ACTIONS
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        {filteredCategories.map(
                          category => (

                            <tr
                              key={
                                category.id
                              }
                              className="clickable-row"
                              onClick={() =>
                                openEditCategory(
                                  category
                                )
                              }
                            >

                              <td>

                                <button
                                  type="button"
                                  className="category-name-button"
                                  onClick={event => {

                                    event.stopPropagation();

                                    openEditCategory(
                                      category
                                    );

                                  }}
                                >

                                  {category.name}

                                </button>

                              </td>


                              <td>
                                {category.slug}
                              </td>


                              <td>
                                {category.image_url ? (
                                  <img
                                    src={category.image_url}
                                    alt={category.name}
                                    className="category-table-image"
                                    style={{
                                      width: '64px',
                                      height: '64px',
                                      objectFit: 'cover',
                                      borderRadius: '10px',
                                      display: 'block',
                                      background: '#f3f4f6'
                                    }}
                                    loading="lazy"
                                    onError={event => {
                                      event.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="category-image-placeholder"
                                    style={{
                                      width: '64px',
                                      height: '64px',
                                      borderRadius: '10px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      background: '#f3f4f6'
                                    }}
                                  >
                                    <ImageIcon size={18} />
                                  </div>
                                )}
                              </td>


                              <td>

                                <span
                                  className={
                                    category.is_active
                                      ? 'status-active'
                                      : 'status-inactive'
                                  }
                                >
                                  {category.is_active
                                    ? 'Active'
                                    : 'Inactive'}
                                </span>

                              </td>


                              <td>

                                <div
                                  className="row-actions"
                                  onClick={event =>
                                    event.stopPropagation()
                                  }
                                >

                                  <button
                                    type="button"
                                    className="icon-button"
                                    title="Edit category"
                                    onClick={() =>
                                      openEditCategory(
                                        category
                                      )
                                    }
                                  >
                                    <Edit3
                                      size={17}
                                    />
                                  </button>


                                  <button
                                    type="button"
                                    className="icon-button danger"
                                    title="Delete category"
                                    onClick={() =>
                                      deleteCategory(
                                        category
                                      )
                                    }
                                  >
                                    <Trash2
                                      size={17}
                                    />
                                  </button>

                                </div>

                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                )}

              </div>

            </section>

          )}


          {/* =================================================
              CUSTOMERS
          ================================================= */}

          {!loading &&
            activeSection === 'customers' && (

            <SimpleDataSection
              title="Customers"
              count={customers.length}
              data={customers}
              columns={[
                ['name', 'Name'],
                ['email', 'Email'],
                ['mobile', 'Mobile']
              ]}
            />

          )}


          {/* =================================================
              ORDERS
          ================================================= */}

          {!loading &&
            activeSection === 'orders' && (

            selectedOrder ? (
              <OrderFulfilment
                order={selectedOrder}
                loading={orderLoading}
                actionLoading={orderActionLoading}
                onBack={closeOrder}
                onStatusChange={updateOrderStatus}
              />
            ) : (
              <OrderList
                orders={filteredOrders}
                totalCount={orders.length}
                search={orderSearch}
                setSearch={setOrderSearch}
                statusFilter={orderStatusFilter}
                setStatusFilter={setOrderStatusFilter}
                onOpenOrder={openOrder}
              />
            )

          )}


          {/* =================================================
              PAYMENTS
          ================================================= */}

          {!loading &&
            activeSection === 'payments' && (

            selectedPayment ? (

              <PaymentDetails
                payment={selectedPayment}
                loading={paymentLoading}
                onBack={closePayment}
              />

            ) : (

              <PaymentSection
                payments={payments}
                search={paymentSearch}
                setSearch={setPaymentSearch}
                onOpenPayment={openPayment}
              />

            )

          )}


          {/* =================================================
              COUPONS
          ================================================= */}

          {!loading &&
            activeSection === 'coupons' && (

            <SimpleDataSection
              title="Coupons"
              count={coupons.length}
              data={coupons}
              columns={[
                ['code', 'Code'],
                ['discount', 'Discount'],
                ['is_active', 'Active']
              ]}
            />

          )}


          {/* =================================================
              REVIEWS
          ================================================= */}

          {!loading &&
            activeSection === 'reviews' && (

            <SimpleDataSection
              title="Reviews"
              count={reviews.length}
              data={reviews}
              columns={[
                ['rating', 'Rating'],
                ['comment', 'Comment'],
                ['status', 'Status']
              ]}
            />

          )}


          {/* =================================================
              INVENTORY
          ================================================= */}

          {!loading &&
            activeSection === 'inventory' && (

            <SimpleDataSection
              title="Inventory"
              count={inventory.length}
              data={inventory}
              columns={[
                ['product_name', 'Product'],
                ['size', 'Size'],
                ['stock', 'Stock']
              ]}
            />

          )}


          {/* =================================================
              BANNERS
          ================================================= */}

          {!loading &&
            activeSection === 'banners' && (

            <SimpleDataSection
              title="Banners"
              count={banners.length}
              data={banners}
              columns={[
                ['title', 'Title'],
                ['image_url', 'Image'],
                ['is_active', 'Active']
              ]}
            />

          )}


          {/* =================================================
              ADMINS
          ================================================= */}

          {!loading &&
            activeSection === 'admins' && (

            <SimpleDataSection
              title="Admin Users"
              count={admins.length}
              data={admins}
              columns={[
                ['name', 'Name'],
                ['mobile', 'Mobile'],
                ['role', 'Role']
              ]}
            />

          )}

        </div>

      </main>


      {/* =====================================================
          CATEGORY MODAL
      ===================================================== */}

      {showCategoryModal && (

        <div
          className="modal-overlay"
          onMouseDown={closeCategoryModal}
        >

          <div
            className="admin-modal"
            onMouseDown={e =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  {editingCategory
                    ? 'Edit Category'
                    : 'Add Category'}
                </h2>

                <p>
                  Manage category information.
                </p>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={
                  closeCategoryModal
                }
              >
                <X size={21} />
              </button>

            </div>


            <form
              onSubmit={saveCategory}
              className="admin-form"
            >

              <div className="form-group">

                <label>
                  Category Name
                </label>

                <input
                  type="text"
                  value={
                    categoryForm.name
                  }
                  onChange={e =>
                    handleCategoryNameChange(
                      e.target.value
                    )
                  }
                  placeholder="Example: Men"
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Slug
                </label>

                <input
                  type="text"
                  value={
                    categoryForm.slug
                  }
                  onChange={e =>
                    setCategoryForm(
                      prev => ({
                        ...prev,
                        slug:
                          e.target.value
                      })
                    )
                  }
                  placeholder="men"
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Status
                </label>

                <select
                  value={
                    categoryForm.is_active
                      ? 'active'
                      : 'inactive'
                  }
                  onChange={e =>
                    setCategoryForm(
                      prev => ({
                        ...prev,
                        is_active:
                          e.target.value ===
                          'active'
                      })
                    )
                  }
                >

                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>

                </select>

              </div>


              {/* CATEGORY IMAGE UPLOAD */}

              <div className="form-group">

                <label>
                  Category Image
                </label>

                <div className="category-image-upload">

                  <input
                    id="category-image-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={
                      handleCategoryImageChange
                    }
                    disabled={
                      categorySaving
                    }
                  />

                  <label
                    htmlFor="category-image-input"
                    className="category-upload-label"
                  >

                    <Upload size={25} />

                    <strong>
                      Upload Category Image
                    </strong>

                    <span>
                      Click to choose an image
                    </span>

                    <small>
                      JPG, PNG or WEBP • Maximum 5MB
                    </small>

                  </label>

                </div>


                {categoryImagePreview && (

                  <div className="category-image-preview">

                    <img
                      src={
                        categoryImagePreview
                      }
                      alt="Category preview"
                    />

                    <div>

                      <strong>
                        {categoryImage?.name ||
                          'Current category image'}
                      </strong>

                      <span>
                        Image selected
                      </span>

                    </div>

                  </div>

                )}

              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={
                    closeCategoryModal
                  }
                  disabled={
                    categorySaving
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="admin-primary-button"
                  disabled={
                    categorySaving
                  }
                >

                  {categorySaving ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Save Category
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          PRODUCT MODAL
      ===================================================== */}

      {showProductModal && (

        <div
          className="modal-overlay"
          onMouseDown={() =>
            !productSaving &&
            setShowProductModal(false)
          }
        >

          <div
            className="admin-modal product-modal"
            onMouseDown={e =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  Add Product
                </h2>

                <p>
                  Create a new Fashion Trends product.
                </p>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  !productSaving &&
                  setShowProductModal(
                    false
                  )
                }
              >
                <X size={21} />
              </button>

            </div>


            <form
              onSubmit={saveProduct}
              className="admin-form"
            >

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Product Name
                  </label>

                  <input
                    type="text"
                    value={
                      productForm.name
                    }
                    onChange={e =>
                      handleProductNameChange(
                        e.target.value
                      )
                    }
                    placeholder="T-Shirt"
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Slug
                  </label>

                  <input
                    type="text"
                    value={
                      productForm.slug
                    }
                    onChange={e =>
                      updateProductField(
                        'slug',
                        e.target.value
                      )
                    }
                    placeholder="t-shirt"
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Brand
                  </label>

                  <input
                    type="text"
                    value={
                      productForm.brand
                    }
                    onChange={e =>
                      updateProductField(
                        'brand',
                        e.target.value
                      )
                    }
                    placeholder="Puma"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Category
                  </label>

                  <select
                    value={
                      productForm.categoryId
                    }
                    onChange={e =>
                      updateProductField(
                        'categoryId',
                        e.target.value
                      )
                    }
                    required
                  >

                    <option value="">
                      Select category
                    </option>

                    {categories.map(
                      category => (

                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {category.name}
                        </option>

                      )
                    )}

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      productForm.price
                    }
                    onChange={e =>
                      updateProductField(
                        'price',
                        e.target.value
                      )
                    }
                    placeholder="999"
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Compare At Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      productForm.compareAtPrice
                    }
                    onChange={e =>
                      updateProductField(
                        'compareAtPrice',
                        e.target.value
                      )
                    }
                    placeholder="1499"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Initial Stock
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      productForm.stock
                    }
                    onChange={e =>
                      updateProductField(
                        'stock',
                        e.target.value
                      )
                    }
                    placeholder="50"
                  />

                </div>

              </div>


              {/* IMAGE URL */}

              <div className="form-group">

                <label>
                  Image URL
                </label>

                <input
                  type="url"
                  value={
                    productForm.imageUrl
                  }
                  onChange={e =>
                    updateProductField(
                      'imageUrl',
                      e.target.value
                    )
                  }
                  placeholder="https://example.com/product.jpg"
                />

              </div>


              {/* IMAGE UPLOAD */}

              <div className="form-group">

                <label>
                  Upload Product Images
                </label>

                <div className="upload-box">

                  <Upload size={24} />

                  <span>
                    Select up to 10 images
                  </span>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    onChange={
                      handleProductImages
                    }
                  />

                </div>


                {productImages.length >
                  0 && (

                  <div className="selected-files">

                    {productImages.map(
                      file => (

                        <div
                          key={
                            file.name +
                            file.lastModified
                          }
                        >

                          <ImageIcon
                            size={15}
                          />

                          <span>
                            {file.name}
                          </span>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>


              {/* DESCRIPTION */}

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  rows="4"
                  value={
                    productForm.description
                  }
                  onChange={e =>
                    updateProductField(
                      'description',
                      e.target.value
                    )
                  }
                  placeholder="Describe the product..."
                />

              </div>


              {/* SIZE VARIANTS */}

              <div className="variant-section">

                <div className="variant-heading">

                  <div>

                    <h3>
                      Size & Stock
                    </h3>

                    <p>
                      Set stock separately for each size.
                    </p>

                  </div>


                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={
                      addVariant
                    }
                  >
                    <Plus size={16} />
                    Add Size
                  </button>

                </div>


                <div className="variant-list">

                  {productForm.variants.map(
                    (variant, index) => (

                      <div
                        className="variant-row"
                        key={index}
                      >

                        <input
                          type="text"
                          value={
                            variant.size
                          }
                          onChange={e =>
                            updateVariant(
                              index,
                              'size',
                              e.target.value
                            )
                          }
                          placeholder="Size"
                        />

                        <input
                          type="number"
                          min="0"
                          value={
                            variant.stock
                          }
                          onChange={e =>
                            updateVariant(
                              index,
                              'stock',
                              e.target.value
                            )
                          }
                          placeholder="Stock"
                        />

                        <button
                          type="button"
                          className="icon-button danger"
                          onClick={() =>
                            removeVariant(
                              index
                            )
                          }
                        >
                          <Trash2
                            size={17}
                          />
                        </button>

                      </div>

                    )
                  )}

                </div>

              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  className="admin-secondary-button"
                  disabled={
                    productSaving
                  }
                  onClick={() =>
                    setShowProductModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="admin-primary-button"
                  disabled={
                    productSaving
                  }
                >

                  {productSaving ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="spin"
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Create Product
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}


// ============================================================
// OVERVIEW
// ============================================================

function Overview({
  dashboard,
  onProducts,
  onOrders,
  onCustomers
}) {

  const data =
    dashboard || {};

  return (
    <section className="admin-section">

      <div className="stats-grid">

        <StatCard
          title="Users Today"
          value={
            Number(data.usersToday) || 0
          }
          icon={UserPlus}
        />

        <StatCard
          title="Orders Today"
          value={
            Number(data.ordersToday) || 0
          }
          icon={ShoppingBag}
        />

        <StatCard
          title="Today's Revenue"
          value={money(
            Number(data.todayRevenue) || 0
          )}
          icon={IndianRupee}
        />

        <StatCard
          title="Annual Revenue"
          value={money(
            Number(data.annualRevenue) || 0
          )}
          icon={TrendingUp}
        />

      </div>


      <div className="quick-actions">

        <button
          type="button"
          onClick={onProducts}
        >
          <Package size={19} />
          Manage Products
          <ChevronRight size={17} />
        </button>

        <button
          type="button"
          onClick={onOrders}
        >
          <ShoppingCart size={19} />
          Manage Orders
          <ChevronRight size={17} />
        </button>

        <button
          type="button"
          onClick={onCustomers}
        >
          <Users size={19} />
          View Customers
          <ChevronRight size={17} />
        </button>

      </div>

    </section>
  );
}


// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  title,
  value,
  icon: Icon
}) {

  return (
    <div className="stat-card">

      <div className="stat-icon">
        <Icon size={22} />
      </div>

      <div>

        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
}


// ============================================================
// ANALYTICS
// ============================================================

function AnalyticsSection({
  analytics,
  from,
  to,
  setFrom,
  setTo,
  onApply
}) {

  const data =
    analytics || {};

  const trend =
    Array.isArray(data.trend)
      ? data.trend
      : [];

  const chartData =
    trend.map(item => ({
      date:
        formatAnalyticsDate(
          item?.date
        ),
      orders:
        Number(item?.orders) || 0,
      revenue:
        Number(item?.revenue) || 0
    }));

  const totalOrders =
    chartData.reduce(
      (sum, item) =>
        sum + item.orders,
      0
    );

  const totalRevenue =
    chartData.reduce(
      (sum, item) =>
        sum + item.revenue,
      0
    );

  return (
    <section className="admin-section">

      <div className="analytics-filter">

        <div className="form-group">

          <label>
            From
          </label>

          <input
            type="date"
            value={from}
            onChange={e =>
              setFrom(e.target.value)
            }
          />

        </div>


        <div className="form-group">

          <label>
            To
          </label>

          <input
            type="date"
            value={to}
            onChange={e =>
              setTo(e.target.value)
            }
          />

        </div>


        <button
          type="button"
          className="admin-primary-button"
          onClick={onApply}
        >
          <CalendarDays size={17} />
          Apply
        </button>

      </div>


      <div className="stats-grid">

        <StatCard
          title="Users Today"
          value={
            Number(
              data.usersToday ??
              data.summary?.usersToday ??
              0
            ) || 0
          }
          icon={UserPlus}
        />

        <StatCard
          title="Orders Today"
          value={
            Number(
              data.ordersToday ??
              data.summary?.ordersToday ??
              0
            ) || 0
          }
          icon={ShoppingCart}
        />

        <StatCard
          title="Today's Revenue"
          value={money(
            Number(
              data.todayRevenue ??
              data.summary?.todayRevenue ??
              0
            ) || 0
          )}
          icon={IndianRupee}
        />

        <StatCard
          title="Annual Revenue"
          value={money(
            Number(
              data.annualRevenue ??
              data.summary?.annualRevenue ??
              0
            ) || 0
          )}
          icon={TrendingUp}
        />

      </div>


      <div
        className="analytics-summary-grid"
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(2, minmax(0, 1fr))',
          gap: '20px',
          marginTop: '20px',
          marginBottom: '20px'
        }}
      >

        <div
          className="analytics-summary-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            padding: '20px 24px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            boxSizing: 'border-box'
          }}
        >

          <span
            style={{
              fontSize: '15px',
              color: '#64748b'
            }}
          >
            Selected Period Orders
          </span>

          <strong
            style={{
              fontSize: '24px',
              color: '#0f172a'
            }}
          >
            {totalOrders}
          </strong>

        </div>

        <div
          className="analytics-summary-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            padding: '20px 24px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            boxSizing: 'border-box'
          }}
        >

          <span
            style={{
              fontSize: '15px',
              color: '#64748b'
            }}
          >
            Selected Period Revenue
          </span>

          <strong
            style={{
              fontSize: '24px',
              color: '#0f172a'
            }}
          >
            {money(totalRevenue)}
          </strong>

        </div>

      </div>


      <div
        className="analytics-charts-grid"
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(2, minmax(0, 1fr))',
          gap: '20px',
          marginBottom: '20px'
        }}
      >

        <div className="admin-card analytics-chart-card">

          <div className="card-heading">

            <div>

              <h2>
                Revenue Trend
              </h2>

              <span>
                Revenue by date
              </span>

            </div>

          </div>

          {chartData.length > 0 ? (
            <RevenueLineChart
              data={chartData}
            />
          ) : (
            <EmptyTable
              message="No revenue data available for the selected dates."
            />
          )}

        </div>


        <div className="admin-card analytics-chart-card">

          <div className="card-heading">

            <div>

              <h2>
                Orders Trend
              </h2>

              <span>
                Orders by date
              </span>

            </div>

          </div>

          {chartData.length > 0 ? (
            <OrdersBarChart
              data={chartData}
            />
          ) : (
            <EmptyTable
              message="No order data available for the selected dates."
            />
          )}

        </div>

      </div>


      <div className="admin-card">

        <div className="card-heading">

          <div>

            <h2>
              Revenue & Orders
            </h2>

            <span>
              Date-wise performance
            </span>

          </div>

        </div>


        {chartData.length === 0 ? (

          <EmptyTable
            message="No analytics data available for the selected dates."
          />

        ) : (

          <div className="analytics-list">

            {chartData.map(
              (item, index) => (

                <div
                  className="analytics-row"
                  key={
                    item.date ||
                    index
                  }
                >

                  <span>
                    {item.date || '—'}
                  </span>

                  <strong>
                    {money(
                      item.revenue
                    )}
                  </strong>

                  <span>
                    Orders:{' '}
                    {item.orders}
                  </span>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </section>
  );
}


// ============================================================
// ANALYTICS DATA HELPERS
// ============================================================

function normalizeAnalyticsDate(value) {

  if (!value) {
    return '';
  }

  const text =
    String(value).trim();

  /*
   * PostgreSQL DATE normally arrives as YYYY-MM-DD.
   * PostgreSQL TIMESTAMP may arrive as an ISO string.
   */
  const match =
    text.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  const parsed =
    new Date(text);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return '';
  }

  const year =
    parsed.getFullYear();

  const month =
    String(
      parsed.getMonth() + 1
    ).padStart(2, '0');

  const day =
    String(
      parsed.getDate()
    ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


function buildEmptyAnalyticsTrend(
  from,
  to
) {

  const startText =
    normalizeAnalyticsDate(from);

  const endText =
    normalizeAnalyticsDate(to);

  if (
    !startText ||
    !endText
  ) {
    return [];
  }

  const start =
    new Date(
      `${startText}T00:00:00`
    );

  const end =
    new Date(
      `${endText}T00:00:00`
    );

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start > end
  ) {
    return [];
  }

  const result = [];

  const cursor =
    new Date(start);

  let safety = 0;

  while (
    cursor <= end &&
    safety < 366
  ) {

    result.push({
      date:
        normalizeAnalyticsDate(
          cursor
        ),
      orders: 0,
      revenue: 0
    });

    cursor.setDate(
      cursor.getDate() + 1
    );

    safety += 1;
  }

  return result;
}


// ============================================================
// ANALYTICS DATE FORMATTER
// ============================================================

function formatAnalyticsDate(value) {

  if (!value) {
    return '—';
  }

  const text =
    String(value);

  const match =
    text.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

  if (!match) {
    return text;
  }

  const [, year, month, day] =
    match;

  return `${day}-${month}-${year}`;
}


// ============================================================
// REVENUE LINE CHART
// ============================================================

function RevenueLineChart({
  data
}) {

  const width = 760;
  const height = 300;

  const padding = {
    top: 25,
    right: 25,
    bottom: 55,
    left: 70
  };

  const innerWidth =
    width -
    padding.left -
    padding.right;

  const innerHeight =
    height -
    padding.top -
    padding.bottom;

  const values =
    data.map(item =>
      Number(item.revenue) || 0
    );

  const maxValue =
    Math.max(
      ...values,
      0
    );

  const chartMax =
    maxValue > 0
      ? maxValue * 1.15
      : 1;

  const points =
    data.map(
      (item, index) => {

        const x =
          data.length === 1
            ? padding.left +
              innerWidth / 2
            : padding.left +
              (
                index /
                (data.length - 1)
              ) *
              innerWidth;

        const value =
          Number(
            item.revenue
          ) || 0;

        const y =
          padding.top +
          innerHeight -
          (
            value /
            chartMax
          ) *
          innerHeight;

        return {
          ...item,
          x,
          y,
          value
        };
      }
    );

  const path =
    points.length > 0
      ? points
          .map(
            (point, index) =>
              `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
          )
          .join(' ')
      : '';

  const labelIndexes =
    getChartLabelIndexes(
      data.length
    );

  return (
    <div
      className="analytics-svg-wrapper"
      style={{
        width: '100%',
        minHeight: '320px',
        padding: '10px 20px 20px',
        boxSizing: 'border-box'
      }}
    >

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="analytics-svg"
        role="img"
        aria-label="Revenue trend line chart"
      >

        {Array.from(
          { length: 5 },
          (_, index) => {

            const y =
              padding.top +
              (
                index / 4
              ) *
              innerHeight;

            const value =
              chartMax *
              (
                1 -
                index / 4
              );

            return (
              <g
                key={`grid-${index}`}
              >

                <line
                  x1={padding.left}
                  x2={
                    width -
                    padding.right
                  }
                  y1={y}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />

                <text
                  x={
                    padding.left -
                    10
                  }
                  y={y + 4}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="11"
                >
                  {formatCompactNumber(
                    value
                  )}
                </text>

              </g>
            );
          }
        )}

        <line
          x1={padding.left}
          x2={padding.left}
          y1={padding.top}
          y2={
            height -
            padding.bottom
          }
          stroke="#94a3b8"
          strokeWidth="1"
        />

        <line
          x1={padding.left}
          x2={
            width -
            padding.right
          }
          y1={
            height -
            padding.bottom
          }
          y2={
            height -
            padding.bottom
          }
          stroke="#94a3b8"
          strokeWidth="1"
        />

        {path && (
          <path
            d={path}
            fill="none"
            stroke="#111827"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {points.map(
          (point, index) => (
            <circle
              key={`point-${index}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#111827"
              stroke="#ffffff"
              strokeWidth="2"
            />
          )
        )}

        {labelIndexes.map(
          index => {

            const point =
              points[index];

            if (!point) {
              return null;
            }

            return (
              <text
                key={`label-${index}`}
                x={point.x}
                y={
                  height -
                  padding.bottom +
                  25
                }
                textAnchor="middle"
                className="analytics-axis-text"
              >
                {point.date}
              </text>
            );
          }
        )}

      </svg>

    </div>
  );
}


// ============================================================
// ORDERS BAR CHART
// ============================================================

function OrdersBarChart({
  data
}) {

  const width = 760;
  const height = 300;

  const padding = {
    top: 25,
    right: 25,
    bottom: 55,
    left: 55
  };

  const innerWidth =
    width -
    padding.left -
    padding.right;

  const innerHeight =
    height -
    padding.top -
    padding.bottom;

  const values =
    data.map(item =>
      Number(item.orders) || 0
    );

  const maxValue =
    Math.max(
      ...values,
      0
    );

  const chartMax =
    maxValue > 0
      ? Math.max(
          maxValue,
          1
        )
      : 1;

  const slotWidth =
    data.length > 0
      ? innerWidth /
        data.length
      : innerWidth;

  const barWidth =
    Math.max(
      3,
      Math.min(
        28,
        slotWidth * 0.65
      )
    );

  const labelIndexes =
    getChartLabelIndexes(
      data.length
    );

  return (
    <div
      className="analytics-svg-wrapper"
      style={{
        width: '100%',
        minHeight: '320px',
        padding: '10px 20px 20px',
        boxSizing: 'border-box'
      }}
    >

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="analytics-svg"
        role="img"
        aria-label="Orders trend bar chart"
      >

        {Array.from(
          { length: 5 },
          (_, index) => {

            const y =
              padding.top +
              (
                index / 4
              ) *
              innerHeight;

            const value =
              Math.round(
                chartMax *
                (
                  1 -
                  index / 4
                )
              );

            return (
              <g
                key={`bar-grid-${index}`}
              >

                <line
                  x1={padding.left}
                  x2={
                    width -
                    padding.right
                  }
                  y1={y}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />

                <text
                  x={
                    padding.left -
                    10
                  }
                  y={y + 4}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="11"
                >
                  {value}
                </text>

              </g>
            );
          }
        )}

        <line
          x1={padding.left}
          x2={padding.left}
          y1={padding.top}
          y2={
            height -
            padding.bottom
          }
          stroke="#94a3b8"
          strokeWidth="1"
        />

        <line
          x1={padding.left}
          x2={
            width -
            padding.right
          }
          y1={
            height -
            padding.bottom
          }
          y2={
            height -
            padding.bottom
          }
          stroke="#94a3b8"
          strokeWidth="1"
        />

        {data.map(
          (item, index) => {

            const value =
              Number(
                item.orders
              ) || 0;

            const barHeight =
              (
                value /
                chartMax
              ) *
              innerHeight;

            const x =
              padding.left +
              index *
              slotWidth +
              (
                slotWidth -
                barWidth
              ) /
              2;

            const y =
              padding.top +
              innerHeight -
              barHeight;

            return (
              <rect
                key={`bar-${index}`}
                x={x}
                y={y}
                width={barWidth}
                height={
                  Math.max(
                    barHeight,
                    value > 0
                      ? 2
                      : 0
                  )
                }
                rx="3"
                fill="#111827"
              />
            );
          }
        )}

        {labelIndexes.map(
          index => {

            const item =
              data[index];

            if (!item) {
              return null;
            }

            const x =
              padding.left +
              index *
              slotWidth +
              slotWidth / 2;

            return (
              <text
                key={`bar-label-${index}`}
                x={x}
                y={
                  height -
                  padding.bottom +
                  25
                }
                textAnchor="middle"
                className="analytics-axis-text"
              >
                {item.date}
              </text>
            );
          }
        )}

      </svg>

    </div>
  );
}


// ============================================================
// CHART LABEL INDEXES
// ============================================================

function getChartLabelIndexes(
  length
) {

  if (length <= 1) {
    return length === 1
      ? [0]
      : [];
  }

  if (length <= 7) {
    return Array.from(
      { length },
      (_, index) => index
    );
  }

  const indexes = [
    0,
    Math.floor(
      (length - 1) / 3
    ),
    Math.floor(
      2 * (length - 1) / 3
    ),
    length - 1
  ];

  return [
    ...new Set(indexes)
  ];
}


// ============================================================
// COMPACT NUMBER
// ============================================================

function formatCompactNumber(
  value
) {

  const number =
    Number(value) || 0;

  if (
    Math.abs(number) >=
    10000000
  ) {
    return `${(
      number / 10000000
    ).toFixed(1)}Cr`;
  }

  if (
    Math.abs(number) >=
    100000
  ) {
    return `${(
      number / 100000
    ).toFixed(1)}L`;
  }

  if (
    Math.abs(number) >=
    1000
  ) {
    return `${(
      number / 1000
    ).toFixed(1)}K`;
  }

  return Math.round(
    number
  ).toString();
}


// ============================================================
// ORDER HELPERS
// ============================================================

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'delivered',
  'cancelled'
];


function getOrderNumber(order) {

  if (order?.order_number) {
    return String(order.order_number);
  }

  if (order?.orderNumber) {
    return String(order.orderNumber);
  }

  if (order?.id) {
    const raw = String(order.id).replace(/-/g, '');
    return `FT-${raw.slice(0, 8).toUpperCase()}`;
  }

  return '—';
}


function formatOrderStatus(status) {

  if (!status) {
    return 'Pending';
  }

  return String(status)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}


function getOrderStatusClass(status) {

  const value = String(status || 'pending').toLowerCase();

  if (value === 'delivered') {
    return 'status-active';
  }

  if (value === 'cancelled') {
    return 'status-inactive';
  }

  return 'status-active';
}


function getOrderItems(order) {

  if (Array.isArray(order?.items)) {
    return order.items;
  }

  if (Array.isArray(order?.order_items)) {
    return order.order_items;
  }

  if (Array.isArray(order?.preview_items)) {
    return order.preview_items;
  }

  return [];
}


function getItemName(item) {
  return (
    item?.product_name ||
    item?.name ||
    item?.productName ||
    'Product'
  );
}


function getItemImage(item) {
  return (
    item?.image_url ||
    item?.imageUrl ||
    item?.product_image ||
    ''
  );
}


function getItemQuantity(item) {
  return Number(
    item?.quantity ??
    item?.qty ??
    1
  ) || 1;
}


function getOrderTotal(order) {
  return Number(
    order?.grand_total ??
    order?.total ??
    order?.total_amount ??
    order?.amount ??
    0
  ) || 0;
}


function parseAddress(address) {

  if (!address) {
    return {};
  }

  if (typeof address === 'object') {
    return address;
  }

  if (typeof address === 'string') {
    try {
      const parsed = JSON.parse(address);
      return parsed && typeof parsed === 'object'
        ? parsed
        : { address_line_1: address };
    } catch {
      return { address_line_1: address };
    }
  }

  return {};
}


function formatAddress(address) {

  const value = parseAddress(address);

  const parts = [
    value.full_name || value.name,
    value.address_line_1 || value.addressLine1,
    value.address_line_2 || value.addressLine2,
    value.landmark,
    [
      value.city,
      value.state,
      value.postal_code || value.postalCode
    ].filter(Boolean).join(', '),
    value.country
  ].filter(Boolean);

  return parts;
}


function OrderList({
  orders,
  totalCount,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  onOpenOrder
}) {

  return (
    <section className="admin-section">

      <div className="section-toolbar">

        <div className="search-box">
          <Search size={20} />
          <input
            value={search}
            onChange={event =>
              setSearch(event.target.value)
            }
            placeholder="Search order, customer or mobile..."
          />
        </div>

        <select
          value={statusFilter}
          onChange={event =>
            setStatusFilter(event.target.value)
          }
          style={{
            minWidth: '170px',
            minHeight: '44px',
            padding: '0 12px',
            border: '1px solid #d1d5db',
            borderRadius: '10px',
            background: '#fff',
            fontSize: '14px'
          }}
        >
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map(status => (
            <option key={status} value={status}>
              {formatOrderStatus(status)}
            </option>
          ))}
        </select>

      </div>

      <div className="admin-card">

        <div className="card-heading">
          <div>
            <h2>Orders</h2>
            <span>
              Showing {orders.length} of {totalCount} records
            </span>
          </div>
        </div>

        {orders.length === 0 ? (
          <EmptyTable message="No orders found." />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ORDER</th>
                  <th>CUSTOMER</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                  <th>PAYMENT</th>
                  <th>TOTAL</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {orders.map(order => {
                  const paymentStatus =
                    order?.payment_status ||
                    order?.paymentStatus ||
                    '—';

                  return (
                    <tr key={order.id}>
                      <td>
                        <strong>
                          {getOrderNumber(order)}
                        </strong>
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#94a3b8',
                            marginTop: '3px'
                          }}
                        >
                          {String(order.id || '').slice(0, 18)}
                        </div>
                      </td>

                      <td>
                        <strong>
                          {order.customer_name ||
                            order.customerName ||
                            order.name ||
                            'Customer'}
                        </strong>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#64748b',
                            marginTop: '3px'
                          }}
                        >
                          {order.mobile ||
                            order.customer_mobile ||
                            '—'}
                        </div>
                      </td>

                      <td>
                        {order.created_at
                          ? new Date(order.created_at).toLocaleString('en-IN')
                          : '—'}
                      </td>

                      <td>
                        <span className={getOrderStatusClass(order.status)}>
                          {formatOrderStatus(order.status)}
                        </span>
                      </td>

                      <td>
                        <div>
                          {formatOrderStatus(paymentStatus)}
                        </div>
                        {order.payment_method && (
                          <small
                            style={{
                              color: '#64748b'
                            }}
                          >
                            {String(order.payment_method).toUpperCase()}
                          </small>
                        )}
                      </td>

                      <td>
                        <strong>
                          {money(getOrderTotal(order))}
                        </strong>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="icon-button"
                          title="View order and pack"
                          onClick={() => onOpenOrder(order)}
                        >
                          <Eye size={17} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </section>
  );
}


function OrderFulfilment({
  order,
  actionLoading,
  onBack,
  onStatusChange
}) {

  const items = getOrderItems(order);
  const address = parseAddress(
    order.shipping_address ||
    order.shippingAddress ||
    order.delivery_address
  );

  const [carrier, setCarrier] = useState(
    order.carrier || ''
  );

  const [trackingNumber, setTrackingNumber] = useState(
    order.tracking_number ||
    order.trackingNumber ||
    ''
  );

  const currentStatus =
    String(order.status || 'pending').toLowerCase();

  const statusIndex =
    ORDER_STATUSES.indexOf(currentStatus);

  const canMark = status => {
    if (status === 'cancelled') {
      return currentStatus !== 'delivered';
    }

    const targetIndex =
      ORDER_STATUSES.indexOf(status);

    return (
      targetIndex >= 0 &&
      (statusIndex < targetIndex || currentStatus === status)
    );
  };

  function printPackingSlip() {

    const addressLines = formatAddress(address);

    const itemRows = items.length
      ? items.map(item => `
        <tr>
          <td>${escapeHtml(getItemName(item))}</td>
          <td>${escapeHtml(item?.sku || '—')}</td>
          <td>${escapeHtml(item?.size || item?.variant_label || '—')}</td>
          <td>${escapeHtml(item?.color || '—')}</td>
          <td>${getItemQuantity(item)}</td>
          <td>${escapeHtml(money(Number(item?.selling_price ?? item?.price ?? 0) || 0))}</td>
        </tr>
      `).join('')
      : `
        <tr>
          <td colspan="6">Item details are not available in the order response.</td>
        </tr>
      `;

    const printWindow = window.open('', '_blank', 'width=900,height=700');

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Packing Slip - ${escapeHtml(getOrderNumber(order))}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
            h1 { margin: 0 0 6px; font-size: 24px; }
            h2 { margin: 28px 0 10px; font-size: 17px; }
            .muted { color: #64748b; }
            .box { border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin-top: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 9px; text-align: left; font-size: 13px; }
            th { background: #f8fafc; }
            .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 18px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>FASHION TRENDS</h1>
          <div class="muted">Packing Slip</div>

          <div class="box">
            <strong>Order:</strong> ${escapeHtml(getOrderNumber(order))}<br />
            <strong>Order ID:</strong> ${escapeHtml(String(order.id || '—'))}<br />
            <strong>Status:</strong> ${escapeHtml(formatOrderStatus(order.status))}<br />
            <strong>Payment:</strong> ${escapeHtml(formatOrderStatus(order.payment_status || '—'))}
          </div>

          <h2>Ship To</h2>
          <div class="box">
            ${addressLines.length ? addressLines.map(escapeHtml).join('<br />') : 'Shipping address is not available.'}
            ${address.mobile || address.phone ? `<br /><strong>Mobile:</strong> ${escapeHtml(address.mobile || address.phone)}` : ''}
          </div>

          <h2>Items</h2>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Size</th>
                <th>Color</th>
                <th>Qty</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <div class="total">Total: ${escapeHtml(money(getOrderTotal(order)))}</div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <section className="admin-section">

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '18px',
          flexWrap: 'wrap'
        }}
      >
        <button
          type="button"
          className="admin-secondary-button"
          onClick={onBack}
          disabled={actionLoading}
        >
          ← Back to Orders
        </button>

        <button
          type="button"
          className="admin-secondary-button"
          onClick={printPackingSlip}
        >
          Print Packing Slip
        </button>
      </div>

      <div className="admin-card">

        <div className="card-heading">
          <div>
            <h2>
              {getOrderNumber(order)}
            </h2>
            <span>
              Order fulfilment and packing
            </span>
          </div>

          <span className={getOrderStatusClass(currentStatus)}>
            {formatOrderStatus(currentStatus)}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginTop: '18px'
          }}
        >
          <InfoBox
            title="Customer"
            value={
              order.customer_name ||
              order.customerName ||
              order.name ||
              '—'
            }
            secondary={
              order.customer_mobile ||
              order.mobile ||
              order.customer_email ||
              order.email ||
              '—'
            }
          />

          <InfoBox
            title="Payment"
            value={formatOrderStatus(order.payment_status || '—')}
            secondary={
              order.payment_method ||
              'Payment method not available'
            }
          />

          <InfoBox
            title="Order Total"
            value={money(getOrderTotal(order))}
            secondary={
              order.created_at
                ? new Date(order.created_at).toLocaleString('en-IN')
                : '—'
            }
          />
        </div>

      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 0.9fr)',
          gap: '20px',
          marginTop: '20px'
        }}
      >

        <div className="admin-card">
          <div className="card-heading">
            <div>
              <h2>Items to Pack</h2>
              <span>
                {items.reduce(
                  (sum, item) => sum + getItemQuantity(item),
                  0
                )} units
              </span>
            </div>
          </div>

          {items.length === 0 ? (
            <div
              style={{
                padding: '24px 0',
                color: '#64748b'
              }}
            >
              No item details were returned for this order. The backend order-details endpoint must return an <code>items</code> array for packing information to appear here.
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>PRODUCT</th>
                    <th>SKU</th>
                    <th>SIZE</th>
                    <th>COLOR</th>
                    <th>QTY</th>
                    <th>PRICE</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            minWidth: '180px'
                          }}
                        >
                          {getItemImage(item) ? (
                            <img
                              src={getItemImage(item)}
                              alt={getItemName(item)}
                              style={{
                                width: '52px',
                                height: '64px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                background: '#f1f5f9'
                              }}
                              onError={event => {
                                event.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '52px',
                                height: '64px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '8px',
                                background: '#f1f5f9'
                              }}
                            >
                              <Package size={18} />
                            </div>
                          )}

                          <div>
                            <strong>
                              {getItemName(item)}
                            </strong>
                            {item.brand_name && (
                              <div
                                style={{
                                  fontSize: '12px',
                                  color: '#64748b',
                                  marginTop: '3px'
                                }}
                              >
                                {item.brand_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{item.sku || '—'}</td>
                      <td>{item.size || item.variant_label || '—'}</td>
                      <td>{item.color || '—'}</td>
                      <td>
                        <strong>
                          {getItemQuantity(item)}
                        </strong>
                      </td>
                      <td>
                        {money(
                          Number(
                            item.selling_price ??
                            item.price ??
                            0
                          ) || 0
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <div className="admin-card">
            <div className="card-heading">
              <div>
                <h2>Shipping Address</h2>
              </div>
            </div>

            <div style={{ lineHeight: 1.7, color: '#334155' }}>
              {formatAddress(address).length ? (
                formatAddress(address).map((line, index) => (
                  <div key={`${line}-${index}`}>
                    {line}
                  </div>
                ))
              ) : (
                <span style={{ color: '#64748b' }}>
                  Shipping address is not available.
                </span>
              )}

              {(address.mobile || address.phone) && (
                <div style={{ marginTop: '8px' }}>
                  <strong>Mobile:</strong>{' '}
                  {address.mobile || address.phone}
                </div>
              )}
            </div>
          </div>

          <div className="admin-card" style={{ marginTop: '20px' }}>
            <div className="card-heading">
              <div>
                <h2>Shipment</h2>
                <span>Courier and tracking information</span>
              </div>
            </div>

            <div className="admin-form" style={{ marginTop: '12px' }}>
              <div className="form-group">
                <label>Courier / Carrier</label>
                <input
                  type="text"
                  value={carrier}
                  onChange={event =>
                    setCarrier(event.target.value)
                  }
                  placeholder="Example: Delhivery"
                  disabled={actionLoading}
                />
              </div>

              <div className="form-group">
                <label>Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={event =>
                    setTrackingNumber(event.target.value)
                  }
                  placeholder="Enter tracking number"
                  disabled={actionLoading}
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="admin-card" style={{ marginTop: '20px' }}>
        <div className="card-heading">
          <div>
            <h2>Fulfilment Actions</h2>
            <span>
              Move the order through the packing and delivery process.
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginTop: '18px'
          }}
        >
          <button
            type="button"
            className="admin-secondary-button"
            disabled={actionLoading || !canMark('confirmed')}
            onClick={() =>
              onStatusChange('confirmed')
            }
          >
            Confirm Order
          </button>

          <button
            type="button"
            className="admin-secondary-button"
            disabled={actionLoading || !canMark('processing')}
            onClick={() =>
              onStatusChange('processing')
            }
          >
            Start Processing
          </button>

          <button
            type="button"
            className="admin-primary-button"
            disabled={actionLoading || !canMark('packed')}
            onClick={() =>
              onStatusChange('packed')
            }
          >
            <Package size={17} />
            Mark as Packed
          </button>

          <button
            type="button"
            className="admin-primary-button"
            disabled={
              actionLoading ||
              !canMark('shipped') ||
              !trackingNumber.trim()
            }
            title={
              !trackingNumber.trim()
                ? 'Enter a tracking number before shipping.'
                : 'Mark order as shipped'
            }
            onClick={() =>
              onStatusChange('shipped', {
                carrier: carrier.trim() || null,
                trackingNumber: trackingNumber.trim() || null
              })
            }
          >
            Ship Order
          </button>

          <button
            type="button"
            className="admin-primary-button"
            disabled={actionLoading || !canMark('delivered')}
            onClick={() =>
              onStatusChange('delivered')
            }
          >
            Mark as Delivered
          </button>

          <button
            type="button"
            className="admin-secondary-button"
            disabled={actionLoading || currentStatus === 'delivered' || currentStatus === 'cancelled'}
            onClick={() =>
              onStatusChange('cancelled')
            }
          >
            Cancel Order
          </button>
        </div>

        {actionLoading && (
          <div
            style={{
              marginTop: '14px',
              color: '#64748b',
              fontSize: '14px'
            }}
          >
            Updating order…
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: '20px',
          padding: '16px 18px',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          background: '#f8fafc',
          color: '#475569',
          fontSize: '14px',
          lineHeight: 1.6
        }}
      >
        <strong>Packing process:</strong>{' '}
        Confirm the order → start processing → pick the products and verify size/color/quantity → pack the items → enter courier and tracking details → ship the package → mark delivered after delivery confirmation.
      </div>

    </section>
  );
}


function InfoBox({
  title,
  value,
  secondary
}) {

  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px',
        background: '#f8fafc'
      }}
    >
      <div
        style={{
          fontSize: '12px',
          color: '#64748b',
          marginBottom: '6px'
        }}
      >
        {title}
      </div>
      <strong
        style={{
          display: 'block',
          color: '#0f172a'
        }}
      >
        {value}
      </strong>
      <span
        style={{
          display: 'block',
          marginTop: '5px',
          color: '#64748b',
          fontSize: '13px'
        }}
      >
        {secondary}
      </span>
    </div>
  );
}


function escapeHtml(value) {

  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


// ============================================================
// SIMPLE DATA SECTION
// ============================================================


function getPaymentId(payment) {

  return (
    payment?.payment_id ||
    payment?.paymentId ||
    payment?.id ||
    '—'
  );

}


function getPaymentOrderNumber(payment) {

  return (
    payment?.order_number ||
    payment?.orderNumber ||
    payment?.order_id ||
    payment?.orderId ||
    payment?.order?.order_number ||
    payment?.order?.id ||
    '—'
  );

}


function getPaymentCustomerName(payment) {

  return (
    payment?.customer_name ||
    payment?.customerName ||
    payment?.customer?.name ||
    payment?.user_name ||
    payment?.name ||
    '—'
  );

}


function getPaymentCustomerMobile(payment) {

  return (
    payment?.customer_mobile ||
    payment?.customerMobile ||
    payment?.customer?.mobile ||
    payment?.mobile ||
    '—'
  );

}


function getPaymentMethod(payment) {

  return (
    payment?.payment_method ||
    payment?.paymentMethod ||
    payment?.method ||
    payment?.gateway ||
    '—'
  );

}


function getPaymentStatus(payment) {

  return (
    payment?.payment_status ||
    payment?.paymentStatus ||
    payment?.status ||
    'pending'
  );

}


function getPaymentAmount(payment) {

  return Number(
    payment?.amount ??
    payment?.paid_amount ??
    payment?.paidAmount ??
    payment?.total ??
    payment?.grand_total ??
    0
  ) || 0;

}


function getPaymentTransactionId(payment) {

  return (
    payment?.transaction_id ||
    payment?.transactionId ||
    payment?.razorpay_payment_id ||
    payment?.razorpayPaymentId ||
    payment?.gateway_payment_id ||
    payment?.gatewayPaymentId ||
    payment?.payment_reference ||
    payment?.reference ||
    '—'
  );

}


function getPaymentDate(payment) {

  return (
    payment?.paid_at ||
    payment?.paidAt ||
    payment?.created_at ||
    payment?.createdAt ||
    payment?.updated_at ||
    payment?.updatedAt ||
    ''
  );

}


function formatPaymentDate(value) {

  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

}


function getPaymentStatusClass(status) {

  const value =
    String(status || '')
      .toLowerCase();

  if (
    value === 'paid' ||
    value === 'success' ||
    value === 'successful' ||
    value === 'captured' ||
    value === 'completed' ||
    value === 'refunded'
  ) {
    return 'status-active';
  }

  if (
    value === 'failed' ||
    value === 'cancelled' ||
    value === 'canceled' ||
    value === 'rejected'
  ) {
    return 'status-inactive';
  }

  return 'status-active';

}


function getPaymentAddress(payment, type) {

  const value =
    type === 'billing'
      ? (
          payment?.billing_address ||
          payment?.billingAddress ||
          payment?.order?.billing_address ||
          payment?.order?.billingAddress
        )
      : (
          payment?.shipping_address ||
          payment?.shippingAddress ||
          payment?.delivery_address ||
          payment?.order?.shipping_address ||
          payment?.order?.shippingAddress
        );

  return parseAddress(value);

}


function PaymentSection({
  payments,
  search,
  setSearch,
  onOpenPayment
}) {

  const filteredPayments =
    useMemo(() => {

      const value =
        String(search || '')
          .trim()
          .toLowerCase();

      if (!value) {
        return payments;
      }

      return payments.filter(payment => {

        const searchable = [
          getPaymentId(payment),
          getPaymentOrderNumber(payment),
          getPaymentCustomerName(payment),
          getPaymentCustomerMobile(payment),
          getPaymentMethod(payment),
          getPaymentStatus(payment),
          getPaymentTransactionId(payment)
        ]
          .map(item => String(item || '').toLowerCase())
          .join(' ');

        return searchable.includes(value);

      });

    }, [payments, search]);


  return (

    <section className="admin-section">

      <div className="section-toolbar">

        <div className="search-box">

          <Search size={20} />

          <input
            type="text"
            value={search}
            onChange={event =>
              setSearch(event.target.value)
            }
            placeholder="Search payment, order, customer or transaction..."
          />

        </div>

      </div>


      <div className="admin-card">

        <div className="card-heading">

          <div>

            <h2>
              Payments
            </h2>

            <span>
              {filteredPayments.length} of {payments.length} records
            </span>

          </div>

        </div>


        {filteredPayments.length === 0 ? (

          <EmptyTable
            message={
              payments.length === 0
                ? 'No payments found.'
                : 'No payments match your search.'
            }
          />

        ) : (

          <div className="admin-table-wrapper">

            <table className="admin-table">

              <thead>

                <tr>
                  <th>Payment ID</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>

              </thead>


              <tbody>

                {filteredPayments.map(
                  (payment, index) => {

                    const status =
                      getPaymentStatus(payment);

                    return (

                      <tr
                        key={
                          payment?.id ||
                          payment?.payment_id ||
                          index
                        }
                      >

                        <td>
                          <strong>
                            {getPaymentId(payment)}
                          </strong>
                        </td>

                        <td>
                          {getPaymentOrderNumber(payment)}
                        </td>

                        <td>
                          <div>
                            <strong>
                              {getPaymentCustomerName(payment)}
                            </strong>

                            {getPaymentCustomerMobile(payment) !== '—' && (
                              <small
                                style={{
                                  display: 'block',
                                  marginTop: '3px',
                                  color: '#64748b'
                                }}
                              >
                                {getPaymentCustomerMobile(payment)}
                              </small>
                            )}
                          </div>
                        </td>

                        <td>
                          {getPaymentMethod(payment)}
                        </td>

                        <td>
                          <span
                            className={
                              getPaymentStatusClass(status)
                            }
                          >
                            {formatOrderStatus(status)}
                          </span>
                        </td>

                        <td>
                          {money(
                            getPaymentAmount(payment)
                          )}
                        </td>

                        <td>
                          {formatPaymentDate(
                            getPaymentDate(payment)
                          )}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="icon-button"
                            title="View payment details"
                            onClick={() =>
                              onOpenPayment(payment)
                            }
                          >
                            <Eye size={17} />
                          </button>
                        </td>

                      </tr>

                    );

                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </section>

  );

}


function PaymentDetails({
  payment,
  loading,
  onBack
}) {

  const status =
    getPaymentStatus(payment);

  const shippingAddress =
    getPaymentAddress(
      payment,
      'shipping'
    );

  const billingAddress =
    getPaymentAddress(
      payment,
      'billing'
    );

  const customer =
    payment?.customer || {};


  const addressText = address => {

    return formatAddress(address)
      .filter(Boolean)
      .join(', ');

  };


  return (

    <section className="admin-section">

      <div className="section-toolbar">

        <button
          type="button"
          className="admin-secondary-button"
          onClick={onBack}
          disabled={loading}
        >
          ← Back to Payments
        </button>

      </div>


      <div className="admin-card">

        <div className="card-heading">

          <div>

            <h2>
              Payment Details
            </h2>

            <span>
              {getPaymentId(payment)}
            </span>

          </div>

          <span
            className={
              getPaymentStatusClass(status)
            }
          >
            {formatOrderStatus(status)}
          </span>

        </div>


        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '14px',
            marginTop: '18px'
          }}
        >

          <InfoBox
            title="Payment ID"
            value={getPaymentId(payment)}
            secondary="Payment record"
          />

          <InfoBox
            title="Order"
            value={getPaymentOrderNumber(payment)}
            secondary="Related order"
          />

          <InfoBox
            title="Amount"
            value={money(getPaymentAmount(payment))}
            secondary={
              payment?.currency ||
              'INR'
            }
          />

          <InfoBox
            title="Payment Method"
            value={getPaymentMethod(payment)}
            secondary="Gateway / method"
          />

          <InfoBox
            title="Transaction ID"
            value={getPaymentTransactionId(payment)}
            secondary="Gateway reference"
          />

          <InfoBox
            title="Payment Date"
            value={
              formatPaymentDate(
                getPaymentDate(payment)
              )
            }
            secondary="Created / paid time"
          />

        </div>

      </div>


      <div
        className="admin-card"
        style={{
          marginTop: '20px'
        }}
      >

        <div className="card-heading">

          <div>

            <h2>
              Customer
            </h2>

            <span>
              Customer information linked to this payment
            </span>

          </div>

        </div>


        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
            marginTop: '18px'
          }}
        >

          <InfoBox
            title="Name"
            value={
              getPaymentCustomerName(payment)
            }
            secondary="Customer"
          />

          <InfoBox
            title="Mobile"
            value={
              getPaymentCustomerMobile(payment)
            }
            secondary="Contact number"
          />

          <InfoBox
            title="Email"
            value={
              payment?.customer_email ||
              payment?.customerEmail ||
              customer?.email ||
              payment?.email ||
              '—'
            }
            secondary="Email address"
          />

        </div>

      </div>


      <div
        className="admin-card"
        style={{
          marginTop: '20px'
        }}
      >

        <div className="card-heading">

          <div>

            <h2>
              Addresses
            </h2>

            <span>
              Shipping and billing information available on the payment/order record
            </span>

          </div>

        </div>


        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginTop: '18px'
          }}
        >

          <div
            style={{
              padding: '16px',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              background: '#f8fafc'
            }}
          >
            <strong>
              Shipping Address
            </strong>

            <p
              style={{
                marginTop: '8px',
                color: '#475569',
                lineHeight: 1.6
              }}
            >
              {addressText(shippingAddress) || '—'}
            </p>
          </div>


          <div
            style={{
              padding: '16px',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              background: '#f8fafc'
            }}
          >
            <strong>
              Billing Address
            </strong>

            <p
              style={{
                marginTop: '8px',
                color: '#475569',
                lineHeight: 1.6
              }}
            >
              {addressText(billingAddress) || '—'}
            </p>
          </div>

        </div>

      </div>


      <div
        style={{
          marginTop: '20px',
          padding: '16px 18px',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          background: '#f8fafc',
          color: '#475569',
          fontSize: '14px',
          lineHeight: 1.6
        }}
      >
        <strong>
          Payment information:
        </strong>{' '}
        This page displays the payment information actually
        returned by the admin API. If a field is not present
        in the API response, it is shown as “—” rather than
        being invented.
      </div>

    </section>

  );

}


function SimpleDataSection({
  title,
  count,
  data,
  columns
}) {

  return (
    <section className="admin-section">

      <div className="admin-card">

        <div className="card-heading">

          <div>

            <h2>
              {title}
            </h2>

            <span>
              {count} records
            </span>

          </div>

        </div>


        {data.length === 0 ? (

          <EmptyTable
            message={`No ${title.toLowerCase()} found.`}
          />

        ) : (

          <div className="admin-table-wrapper">

            <table className="admin-table">

              <thead>

                <tr>

                  {columns.map(
                    ([, label]) => (

                      <th key={label}>
                        {label}
                      </th>

                    )
                  )}

                </tr>

              </thead>


              <tbody>

                {data.map(
                  (item, index) => (

                    <tr
                      key={
                        item.id ||
                        index
                      }
                    >

                      {columns.map(
                        ([field]) => (

                          <td
                            key={field}
                          >
                            {formatCell(
                              item[field]
                            )}
                          </td>

                        )
                      )}

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </section>
  );
}


// ============================================================
// FORMAT CELL
// ============================================================

function formatCell(value) {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  if (
    typeof value === 'boolean'
  ) {
    return value
      ? 'Yes'
      : 'No';
  }

  return String(value);
}


// ============================================================
// EMPTY TABLE
// ============================================================

function EmptyTable({
  message
}) {

  return (
    <div className="empty-table">

      <Package size={30} />

      <span>
        {message}
      </span>

    </div>
  );
}