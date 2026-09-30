CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile VARCHAR(20) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  mobile_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked','deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'admin',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(120) NOT NULL UNIQUE, slug VARCHAR(140) NOT NULL UNIQUE,
  description TEXT, image_url TEXT, is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(220) NOT NULL, slug VARCHAR(240) UNIQUE NOT NULL, description TEXT, brand VARCHAR(120),
  price NUMERIC(12,2) NOT NULL CHECK(price >= 0), compare_at_price NUMERIC(12,2),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK(status IN ('draft','active','archived')),
  featured BOOLEAN NOT NULL DEFAULT FALSE, rating NUMERIC(3,2) NOT NULL DEFAULT 0, review_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL, alt_text VARCHAR(255), sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE NOT NULL, size VARCHAR(40), color VARCHAR(60), stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
  price NUMERIC(12,2), is_active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(30) DEFAULT 'Home', recipient_name VARCHAR(120) NOT NULL, mobile VARCHAR(20) NOT NULL,
  line1 VARCHAR(255) NOT NULL, line2 VARCHAR(255), city VARCHAR(100) NOT NULL, state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL, country VARCHAR(80) NOT NULL DEFAULT 'India', is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(user_id, product_id)
);
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE, variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(cart_id, product_id, variant_id)
);
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code VARCHAR(40) UNIQUE NOT NULL, description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK(discount_type IN ('percentage','fixed')), discount_value NUMERIC(12,2) NOT NULL,
  min_order_value NUMERIC(12,2) NOT NULL DEFAULT 0, max_discount NUMERIC(12,2), usage_limit INTEGER, used_count INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), expires_at TIMESTAMPTZ, is_active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_number VARCHAR(40) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id), address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  subtotal NUMERIC(12,2) NOT NULL, discount NUMERIC(12,2) NOT NULL DEFAULT 0, shipping_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0, total NUMERIC(12,2) NOT NULL, coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','returned')),
  payment_status VARCHAR(30) NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id), variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name VARCHAR(220) NOT NULL, sku VARCHAR(100), size VARCHAR(40), color VARCHAR(60), quantity INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL, total_price NUMERIC(12,2) NOT NULL
);
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider VARCHAR(30) NOT NULL DEFAULT 'cod', provider_order_id VARCHAR(150), provider_payment_id VARCHAR(150),
  amount NUMERIC(12,2) NOT NULL, currency VARCHAR(10) NOT NULL DEFAULT 'INR', status VARCHAR(30) NOT NULL DEFAULT 'pending',
  method VARCHAR(50), metadata JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  tracking_number VARCHAR(100) UNIQUE, carrier VARCHAR(100), status VARCHAR(40) NOT NULL DEFAULT 'order_placed', estimated_delivery DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  status VARCHAR(40) NOT NULL, message VARCHAR(255) NOT NULL, location VARCHAR(160), event_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE, rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  title VARCHAR(160), body TEXT, status VARCHAR(20) NOT NULL DEFAULT 'published', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(user_id, product_id)
);
CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), mobile VARCHAR(20) NOT NULL, purpose VARCHAR(30) NOT NULL,
  otp_hash TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, expires_at TIMESTAMPTZ NOT NULL, verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title VARCHAR(180) NOT NULL, subtitle VARCHAR(255), image_url TEXT,
  cta_label VARCHAR(80), cta_url VARCHAR(255), is_active BOOLEAN NOT NULL DEFAULT TRUE, sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE CASCADE, title VARCHAR(180) NOT NULL,
  body TEXT NOT NULL, type VARCHAR(40) DEFAULT 'general', is_read BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), admin_id UUID REFERENCES admins(id) ON DELETE SET NULL, action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80), entity_id UUID, details JSONB, ip_address INET, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_otp_mobile ON otp_verifications(mobile, purpose, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking ON shipments(tracking_number);
