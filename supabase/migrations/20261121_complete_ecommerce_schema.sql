-- ==============================================================================
-- INDIA'S GOT LATENT - COMPLETE FULL-STACK DATABASE SCHEMA & RLS MIGRATION
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Custom ENUM Types
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('customer', 'admin', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status_type AS ENUM ('pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_type AS ENUM ('captured', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- TABLES DEFINITION
-- ==============================================================================

-- 1. PROFILES (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. USER ROLES (RBAC: customer, admin, staff)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role_type DEFAULT 'customer' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    name TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    handle TEXT UNIQUE NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    original_price NUMERIC(10, 2) NOT NULL CHECK (original_price >= price),
    description TEXT NOT NULL,
    images TEXT[] NOT NULL DEFAULT '{}',
    tags TEXT[] NOT NULL DEFAULT '{}',
    video_url TEXT,
    is_featured BOOLEAN DEFAULT false NOT NULL,
    is_new BOOLEAN DEFAULT false NOT NULL,
    is_archived BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. PRODUCT VARIANTS (Sizes, SKUs, Stock)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    price_override NUMERIC(10, 2),
    stock_quantity INT DEFAULT 50 NOT NULL CHECK (stock_quantity >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_product_size UNIQUE (product_id, size)
);

-- 6. INVENTORY LOGS (Track every addition/deduction for audit)
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    change_amount INT NOT NULL,
    reason TEXT NOT NULL, -- 'purchase', 'restock', 'return', 'adjustment'
    reference_id TEXT, -- e.g. order_id
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. CARTS (Persistent server cart)
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT, -- for guest carts
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_cart UNIQUE (user_id)
);

-- 8. CART ITEMS
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    size TEXT NOT NULL,
    quantity INT DEFAULT 1 NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_cart_item UNIQUE (cart_id, product_id, size)
);

-- 9. SHIPPING ADDRESSES
CREATE TABLE IF NOT EXISTS public.shipping_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT DEFAULT 'India' NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    shipping_address JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    discount_amount NUMERIC(10, 2) DEFAULT 0 NOT NULL CHECK (discount_amount >= 0),
    coupon_code TEXT,
    shipping_fee NUMERIC(10, 2) DEFAULT 0 NOT NULL CHECK (shipping_fee >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status order_status_type DEFAULT 'pending' NOT NULL,
    tracking_carrier TEXT,
    tracking_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_handle TEXT NOT NULL,
    size TEXT NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    product_image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    razorpay_order_id TEXT NOT NULL,
    razorpay_payment_id TEXT UNIQUE NOT NULL,
    razorpay_signature TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT DEFAULT 'INR' NOT NULL,
    status payment_status_type DEFAULT 'captured' NOT NULL,
    method TEXT,
    error_code TEXT,
    error_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 13. COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_type coupon_type DEFAULT 'percentage' NOT NULL,
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    min_order_amount NUMERIC(10, 2) DEFAULT 0 NOT NULL,
    max_discount_amount NUMERIC(10, 2),
    usage_limit INT,
    times_used INT DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 14. CONTACT MESSAGES
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    order_id TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- INDEXES FOR HIGH-PERFORMANCE QUERIES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_handle ON public.products(handle);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS
-- ==============================================================================

-- Helper function: Check if current authenticated user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Automatically create public.profile and customer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');

    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'customer');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger: Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) ACROSS ALL TABLES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. User Roles Policies
CREATE POLICY "Users can read their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Only admins can manage roles" ON public.user_roles FOR ALL USING (public.is_admin());

-- 3. Categories Policies
CREATE POLICY "Categories viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.is_admin());

-- 4. Products & Variants Policies
CREATE POLICY "Published products viewable by everyone" ON public.products FOR SELECT USING (is_archived = false OR public.is_admin());
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.is_admin());
CREATE POLICY "Variants viewable by everyone" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admins can manage variants" ON public.product_variants FOR ALL USING (public.is_admin());

-- 5. Inventory Policies
CREATE POLICY "Admins can read and manage inventory" ON public.inventory FOR ALL USING (public.is_admin());

-- 6. Carts & Items Policies
CREATE POLICY "Users can manage their own carts" ON public.carts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own cart items" ON public.cart_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid())
);

-- 7. Shipping Addresses Policies
CREATE POLICY "Users can manage their own addresses" ON public.shipping_addresses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all addresses" ON public.shipping_addresses FOR SELECT USING (public.is_admin());

-- 8. Orders & Order Items Policies
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR customer_email = auth.jwt()->>'email');
CREATE POLICY "Server and users can insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view and update all orders" ON public.orders FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view their order items" ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_admin()))
);
CREATE POLICY "Order items insertable on order creation" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage order items" ON public.order_items FOR ALL USING (public.is_admin());

-- 9. Payments Policies
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = payments.order_id AND (orders.user_id = auth.uid() OR public.is_admin()))
);
CREATE POLICY "Payments insertable on verification" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all payments" ON public.payments FOR ALL USING (public.is_admin());

-- 10. Coupons Policies
CREATE POLICY "Active coupons viewable by everyone" ON public.coupons FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL USING (public.is_admin());

-- 11. Contact Messages Policies
CREATE POLICY "Anyone can submit contact message" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view and update contact messages" ON public.contact_messages FOR ALL USING (public.is_admin());

-- ==============================================================================
-- INITIAL SEED DATA (CATEGORIES, PRODUCTS, VARIANTS, COUPONS)
-- ==============================================================================

-- Seed Categories
INSERT INTO public.categories (slug, name, description)
VALUES 
    ('tees', 'Tees & Tops', 'Heavyweight graphic oversized streetwear tees and tank tops'),
    ('bags', 'Totes & Bags', 'Durable canvas totes and upcycled sling bags'),
    ('headwear', 'Caps & Masks', 'Embroidered caps and custom balaclavas'),
    ('accessories', 'Talisman & Accessories', 'Keychains, bobble heads and cult collectibles')
ON CONFLICT (slug) DO NOTHING;

-- Seed Coupons
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, is_active)
VALUES 
    ('LATENT10', 'percentage', 10.00, 499.00, true),
    ('RHINO20', 'percentage', 20.00, 999.00, true),
    ('SUPREMELEADER', 'percentage', 15.00, 799.00, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'Nimbu Mirchi | Key Chain',
    'Nimbu Mirchi',
    'Key Chain',
    'nimbu-mirchi-key-chain',
    499,
    674,
    'ANTI NAZAR NAZAR CLUB. From the iconic moment that marked the beginning of India’s Got Latent S2 comes the Nimbu-Mirchi Keychain. Add to your home keys, car keys, office keys and more. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Nimbumirchi_keychain_front.png?v=1794046048', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Keychain_lifestyle_tightcrop.png?v=1794046054', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Keychain_lifestyle_wide.png?v=1794046054', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Keychain_lifestyle_tightcrop_02.png?v=1794046056'],
    ARRAY[],
    NULL,
    true,
    true
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for nimbu-mirchi-key-chain

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'ONE SIZE', 'NIMBU-MIRCHI-KEY-CHAIN-ONE SIZE', 50
FROM public.products WHERE handle = 'nimbu-mirchi-key-chain'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'I hate mens | Tote Bag',
    'I hate mens',
    'Tote Bag',
    'i-hate-mens-tote-bag',
    699,
    944,
    'RIP Male Ego. Sakshi Jha’s 3 golden words. Now on a tote bag. Carry it to the market. Somebody will take it personally. Available in Black &amp; White *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_tote_front_13053fb3-8d50-456a-9814-38bb5114213c.png?v=1794128651', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_tote_back_2d44747e-a28f-4a4f-9ff0-15b93848cf10.png?v=1794128650', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_Lifestyle_model_ae7d2871-5e09-4cea-9974-6123f619e0f6.png?v=1794128656', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_Lifestyle_tote_f694fc29-a0e4-488e-a3b9-a91392c5c961.png?v=1794128654'],
    ARRAY[],
    NULL,
    true,
    false
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for i-hate-mens-tote-bag

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'ONE SIZE', 'I-HATE-MENS-TOTE-BAG-ONE SIZE', 50
FROM public.products WHERE handle = 'i-hate-mens-tote-bag'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'UPCYCLED DENIM | PANT BAG',
    'UPCYCLED DENIM',
    'PANT BAG',
    'upcycled-pant-bag-sling-bag',
    599,
    809,
    'Is it a Pant? Is it a bag? It''s the Pant Bag. Made from comfortable upcycled material that actually carries your stuff instead of your legs. Underwear not included. PS: It comes in a different shade of blue every time. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/2.png?v=1794745814', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/1.png?v=1794745815', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/3.png?v=1794745819', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/4.png?v=1794745821', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/5.png?v=1794745819'],
    ARRAY[],
    NULL,
    false,
    false
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for upcycled-pant-bag-sling-bag

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'ONE SIZE', 'UPCYCLED-PANT-BAG-SLING-BAG-ONE SIZE', 50
FROM public.products WHERE handle = 'upcycled-pant-bag-sling-bag'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'MERE KO NAHI PASAND DIKHNA | BALACLAVA MASK',
    'MERE KO NAHI PASAND DIKHNA',
    'BALACLAVA MASK',
    'mereko-dikhna-nahi-pasand-balaclava-face-mask',
    499,
    674,
    'Incognito mode: ON Follow the teachings of MC Stan himself and slip on this comfy balaclava for when you wanna dip. Available in Black. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Balaclava_front.png?v=1793883612', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Balaclava_back.png?v=1793883612', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Balaclava_lifestyle_wide.png?v=1793883614', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Balaclava_lifestyle_tightcrop_02.png?v=1793883614'],
    ARRAY[],
    NULL,
    false,
    false
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for mereko-dikhna-nahi-pasand-balaclava-face-mask

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'ONE SIZE', 'MEREKO-DIKHNA-NAHI-PASAND-BALACLAVA-FACE-MASK-ONE SIZE', 50
FROM public.products WHERE handle = 'mereko-dikhna-nahi-pasand-balaclava-face-mask'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'Samay Rhino | Bobble Head',
    'Samay Rhino',
    'Bobble Head',
    'samay-rhino-bobble-head',
    399,
    539,
    'Samay meets Trump. Samay Rhino is born. Thick skin. Thicker head. Nods at everything you say. Test your dumb jokes to see how he responds. Put it on your desk or pair it with the Nimbu-Mirchi keychain. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Samayrhino_front_4fba5bea-1cc7-4e31-a88f-d3eaa8a5ad33.png?v=1794034102', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Samayrhino_front2.png?v=1794128007', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Samayrhino_back_d1d341fc-091e-480f-86e5-fe4be1322752.png?v=1794034102', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Smayrhino_lifestyle_02.png?v=1794034106'],
    ARRAY[],
    NULL,
    true,
    true
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for samay-rhino-bobble-head

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'ONE SIZE', 'SAMAY-RHINO-BOBBLE-HEAD-ONE SIZE', 50
FROM public.products WHERE handle = 'samay-rhino-bobble-head'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'I love latent | Cap',
    'I love latent',
    'Cap',
    'i-love-latent-cap',
    699,
    944,
    'Jab pyaar kiya toh darna kya? Wear your love and let the world know. Available in White. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Cap_front_4360dcbf-28b5-4582-bef1-77379daab7a4.png?v=1794036864', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Cap_back_1d58f375-b49d-492b-8f86-0e1f1b6e2af2.png?v=1794036864', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Cap_Lifestyle_female.png?v=1794036869', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Cap_Lifestyle_male.png?v=1794036869', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Cap_Lifestyle_04d77a6b-648c-4a57-a268-dd920972057f.png?v=1794036869'],
    ARRAY[],
    NULL,
    false,
    false
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for i-love-latent-cap

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'ONE SIZE', 'I-LOVE-LATENT-CAP-ONE SIZE', 50
FROM public.products WHERE handle = 'i-love-latent-cap'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    '7.5 Aesthetic Number | Tote bag',
    '7.5 Aesthetic Number',
    'Tote bag',
    '7-5-aesthetic-number-tote-bag',
    699,
    944,
    'The most aesthetic score in the room. Jenny may have lost that day, but she left with the most aesthetic number. Get the sturdy and roomy tote bag that holds your stuff, and looks better than you do. Available in Off-White. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/7.5_Tote_White_front.png?v=1794128181', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/7.5_Tote_White_back.png?v=1794128182', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_lifestyle_tightcrop.png?v=1794035200', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_lifestyle_tote.png?v=1793870542'],
    ARRAY[],
    NULL,
    false,
    false
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for 7-5-aesthetic-number-tote-bag

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'ONE SIZE', '7-5-AESTHETIC-NUMBER-TOTE-BAG-ONE SIZE', 50
FROM public.products WHERE handle = '7-5-aesthetic-number-tote-bag'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'I hate mens | Tote Bag',
    'I hate mens',
    'Tote Bag',
    'i-hate-men-black-tote-bag',
    699,
    944,
    'RIP Male Ego. Sakshi Jha’s 3 golden words. Now on a tote bag. Carry it to the market. Somebody will take it personally. Available in Black &amp; White *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Black_tote_front_2fbddbac-9ea8-4b59-9582-dd254a0c18da.png?v=1794128523', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Black_tote_back_983064d1-44c8-495d-a5c0-75cb02503aa6.png?v=1794128524', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Black_lifestyle_model_tightcrop_513abd7b-1634-4dbb-af54-1583d281f959.png?v=1794128525', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Black_lifestyle_tote_8080c9c4-7717-4b6f-9d44-f039bdd059a2.png?v=1794128527'],
    ARRAY[],
    'https://merch.samayraina.co/cdn/shop/videos/c/vp/80a373819b7e47fd84e997e1922b8d06/80a373819b7e47fd84e997e1922b8d06.HD-1080p-7.2Mbps-100146523.mp4?v=0',
    false,
    true
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for i-hate-men-black-tote-bag

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'ONE SIZE', 'I-HATE-MEN-BLACK-TOTE-BAG-ONE SIZE', 50
FROM public.products WHERE handle = 'i-hate-men-black-tote-bag'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'Shoutout to God | Oversized T-shirt',
    'Shoutout to God',
    'Oversized T-shirt',
    'shout-out-to-god-black-oversized-t-shirt',
    999,
    1349,
    'It''s raining shoutouts. But the biggest one goes to our homie in the sky, the OG, the A1 since Day1, the all seeing-ever-knowing mighty: G.O.D. Flaunt your homie on the tee. Available in Black. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Tshirt_front_7777d42d-b871-4b91-a7d1-c2c20c9ce834.png?v=1794033809', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Tshirt_back_1590ceb2-3bfd-499d-85c7-cb7c279b17a3.png?v=1794033808', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Tshirt_lifestyle_model_male_female_c5458c9e-486e-4c18-91e7-1f6c94f1d69e.png?v=1794033809', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Tshirt_lifestyle_61953c6f-007f-4f5e-aa9c-fce5bc78048a.png?v=1794033811'],
    ARRAY[],
    NULL,
    false,
    true
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for shout-out-to-god-black-oversized-t-shirt

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XS', 'SHOUT-OUT-TO-GOD-BLACK-OVERSIZED-T-SHIRT-XS', 50
FROM public.products WHERE handle = 'shout-out-to-god-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'S', 'SHOUT-OUT-TO-GOD-BLACK-OVERSIZED-T-SHIRT-S', 50
FROM public.products WHERE handle = 'shout-out-to-god-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'M', 'SHOUT-OUT-TO-GOD-BLACK-OVERSIZED-T-SHIRT-M', 50
FROM public.products WHERE handle = 'shout-out-to-god-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'L', 'SHOUT-OUT-TO-GOD-BLACK-OVERSIZED-T-SHIRT-L', 50
FROM public.products WHERE handle = 'shout-out-to-god-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XL', 'SHOUT-OUT-TO-GOD-BLACK-OVERSIZED-T-SHIRT-XL', 50
FROM public.products WHERE handle = 'shout-out-to-god-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, '2XL', 'SHOUT-OUT-TO-GOD-BLACK-OVERSIZED-T-SHIRT-2XL', 50
FROM public.products WHERE handle = 'shout-out-to-god-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'How can you hate Mens? | Oversized T-shirt',
    'How can you hate Mens?',
    'Oversized T-shirt',
    'how-can-you-hate-men-white-oversized-t-shirt',
    999,
    1349,
    'From mens, with love. When Sakshi Jha said "I hate mens", Samay asked how? Fair question. If you''re still trying to find the answer, get this tee. Available in Black and White. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/white_front_1.png?v=1793966554', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/white_back_1.png?v=1793966553', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_lifestyle_model_tightcrop_88ec408f-d3b2-4768-94a8-c52b7172f5d4.png?v=1793870034', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_lifestyle_tshirt_e8be80bd-56d3-4fdd-ba4c-239e9244a1db.png?v=1793870035'],
    ARRAY[],
    NULL,
    false,
    true
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for how-can-you-hate-men-white-oversized-t-shirt

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XS', 'HOW-CAN-YOU-HATE-MEN-WHITE-OVERSIZED-T-SHIRT-XS', 50
FROM public.products WHERE handle = 'how-can-you-hate-men-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'S', 'HOW-CAN-YOU-HATE-MEN-WHITE-OVERSIZED-T-SHIRT-S', 50
FROM public.products WHERE handle = 'how-can-you-hate-men-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'M', 'HOW-CAN-YOU-HATE-MEN-WHITE-OVERSIZED-T-SHIRT-M', 50
FROM public.products WHERE handle = 'how-can-you-hate-men-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'L', 'HOW-CAN-YOU-HATE-MEN-WHITE-OVERSIZED-T-SHIRT-L', 50
FROM public.products WHERE handle = 'how-can-you-hate-men-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XL', 'HOW-CAN-YOU-HATE-MEN-WHITE-OVERSIZED-T-SHIRT-XL', 50
FROM public.products WHERE handle = 'how-can-you-hate-men-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, '2XL', 'HOW-CAN-YOU-HATE-MEN-WHITE-OVERSIZED-T-SHIRT-2XL', 50
FROM public.products WHERE handle = 'how-can-you-hate-men-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'How can you hate Mens? | Oversized T-shirt',
    'How can you hate Mens?',
    'Oversized T-shirt',
    'how-can-you-hate-men-black-oversized-t-shirt',
    999,
    1349,
    'From mens, with love. When Sakshi Jha said "I hate mens", Samay asked how? Fair question. If you''re still trying to find the answer, get this tee. Available in Black and White.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Black_front_1ac398c7-00d3-4ca7-9fcc-6f21972f6ff4.png?v=1793869791', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Black_back_13a277a6-0fe6-4cab-9f74-64e048dfaa1e.png?v=1793869790', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Black_Lifestyle_model_male_tightcrop.png?v=1793869792', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Black_Lifestyle_tshirt_cc062361-c5ca-4876-b3d1-c1227da45984.png?v=1793869793'],
    ARRAY[],
    NULL,
    false,
    true
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for how-can-you-hate-men-black-oversized-t-shirt

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XS', 'HOW-CAN-YOU-HATE-MEN-BLACK-OVERSIZED-T-SHIRT-XS', 50
FROM public.products WHERE handle = 'how-can-you-hate-men-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'S', 'HOW-CAN-YOU-HATE-MEN-BLACK-OVERSIZED-T-SHIRT-S', 50
FROM public.products WHERE handle = 'how-can-you-hate-men-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'M', 'HOW-CAN-YOU-HATE-MEN-BLACK-OVERSIZED-T-SHIRT-M', 50
FROM public.products WHERE handle = 'how-can-you-hate-men-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'L', 'HOW-CAN-YOU-HATE-MEN-BLACK-OVERSIZED-T-SHIRT-L', 50
FROM public.products WHERE handle = 'how-can-you-hate-men-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XL', 'HOW-CAN-YOU-HATE-MEN-BLACK-OVERSIZED-T-SHIRT-XL', 50
FROM public.products WHERE handle = 'how-can-you-hate-men-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, '2XL', 'HOW-CAN-YOU-HATE-MEN-BLACK-OVERSIZED-T-SHIRT-2XL', 50
FROM public.products WHERE handle = 'how-can-you-hate-men-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'I Hate Mens | Oversized T-shirt',
    'I Hate Mens',
    'Oversized T-shirt',
    'how-can-you-hate-mens-white-oversized-t-shirt',
    999,
    1349,
    'RIP Male Ego Sakshi Jha’s 3 golden words. Now on a tee. Get it in Black or White. Somebody will take it personally. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Black_front_aa882ba8-f744-493c-a06e-3c4f64cf22bd.png?v=1793869277', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/black_back_01403277-10cc-47dd-a39e-17df18bc98f9.png?v=1793869277', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Black_lifestyle_model_female_tightcrop.png?v=1793869279', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Black_lifestyle_tshirt_12ea5294-7669-424e-abcd-8da6bf0a5573.png?v=1793869279'],
    ARRAY[],
    NULL,
    false,
    false
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for how-can-you-hate-mens-white-oversized-t-shirt

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XS', 'HOW-CAN-YOU-HATE-MENS-WHITE-OVERSIZED-T-SHIRT-XS', 50
FROM public.products WHERE handle = 'how-can-you-hate-mens-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'S', 'HOW-CAN-YOU-HATE-MENS-WHITE-OVERSIZED-T-SHIRT-S', 50
FROM public.products WHERE handle = 'how-can-you-hate-mens-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'M', 'HOW-CAN-YOU-HATE-MENS-WHITE-OVERSIZED-T-SHIRT-M', 50
FROM public.products WHERE handle = 'how-can-you-hate-mens-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'L', 'HOW-CAN-YOU-HATE-MENS-WHITE-OVERSIZED-T-SHIRT-L', 50
FROM public.products WHERE handle = 'how-can-you-hate-mens-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XL', 'HOW-CAN-YOU-HATE-MENS-WHITE-OVERSIZED-T-SHIRT-XL', 50
FROM public.products WHERE handle = 'how-can-you-hate-mens-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, '2XL', 'HOW-CAN-YOU-HATE-MENS-WHITE-OVERSIZED-T-SHIRT-2XL', 50
FROM public.products WHERE handle = 'how-can-you-hate-mens-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'I Hate Mens | Oversized T-shirt',
    'I Hate Mens',
    'Oversized T-shirt',
    'how-can-you-hate-mens-black-oversized-t-shirt',
    999,
    1349,
    'RIP Male Ego Sakshi Jha’s 3 golden words. Now on a tee. Get it in Black or White. Somebody will take it personally. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_front_2_990798b4-7238-4294-b5f0-f70c7071d754.png?v=1793970283', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_back_2_16e0bc60-52cc-4582-beda-5df2f0334f46.png?v=1793970283', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_lifestyle_model.png?v=1793869572', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_lifestyle_tshirt_949ad32a-d4b5-4d9c-ada1-4d962b65d350.png?v=1793869576'],
    ARRAY[],
    NULL,
    false,
    false
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for how-can-you-hate-mens-black-oversized-t-shirt

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XS', 'HOW-CAN-YOU-HATE-MENS-BLACK-OVERSIZED-T-SHIRT-XS', 50
FROM public.products WHERE handle = 'how-can-you-hate-mens-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'S', 'HOW-CAN-YOU-HATE-MENS-BLACK-OVERSIZED-T-SHIRT-S', 50
FROM public.products WHERE handle = 'how-can-you-hate-mens-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'M', 'HOW-CAN-YOU-HATE-MENS-BLACK-OVERSIZED-T-SHIRT-M', 50
FROM public.products WHERE handle = 'how-can-you-hate-mens-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'L', 'HOW-CAN-YOU-HATE-MENS-BLACK-OVERSIZED-T-SHIRT-L', 50
FROM public.products WHERE handle = 'how-can-you-hate-mens-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XL', 'HOW-CAN-YOU-HATE-MENS-BLACK-OVERSIZED-T-SHIRT-XL', 50
FROM public.products WHERE handle = 'how-can-you-hate-mens-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, '2XL', 'HOW-CAN-YOU-HATE-MENS-BLACK-OVERSIZED-T-SHIRT-2XL', 50
FROM public.products WHERE handle = 'how-can-you-hate-mens-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'I love Latent | Oversized T-Shirt',
    'I love Latent',
    'Oversized T-Shirt',
    'i-love-latent-oversized-t-shirt',
    999,
    1349,
    'Jab pyaar kiya toh darna kya? Wear your love and let the world know. Available in White. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_front_3_42677be4-90ab-43d4-a158-07ee47804440.png?v=1793969195', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/white_back_2_8f466149-8e93-4d08-b4de-28c1ff479204.png?v=1793969195', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_lifestyle_model_male_ca81c65f-fb36-484b-b8eb-f081d83d20d2.png?v=1793868953', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_lifestyle_tshirt_81565725-2f3c-4520-b4d8-c434ffc90dd0.png?v=1793868953'],
    ARRAY[],
    NULL,
    false,
    false
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for i-love-latent-oversized-t-shirt

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XS', 'I-LOVE-LATENT-OVERSIZED-T-SHIRT-XS', 50
FROM public.products WHERE handle = 'i-love-latent-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'S', 'I-LOVE-LATENT-OVERSIZED-T-SHIRT-S', 50
FROM public.products WHERE handle = 'i-love-latent-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'M', 'I-LOVE-LATENT-OVERSIZED-T-SHIRT-M', 50
FROM public.products WHERE handle = 'i-love-latent-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'L', 'I-LOVE-LATENT-OVERSIZED-T-SHIRT-L', 50
FROM public.products WHERE handle = 'i-love-latent-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XL', 'I-LOVE-LATENT-OVERSIZED-T-SHIRT-XL', 50
FROM public.products WHERE handle = 'i-love-latent-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, '2XL', 'I-LOVE-LATENT-OVERSIZED-T-SHIRT-2XL', 50
FROM public.products WHERE handle = 'i-love-latent-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'Nasha <> Naashta | Oversized T-Shirt',
    'Nasha <> Naashta',
    'Oversized T-Shirt',
    'nasha-naashta-white-oversized-t-shirt',
    999,
    1349,
    'Acceptance is the first step. Only Orry can make breakfast sound like a rehab case. So, if you or your loved one is struggling with daily Nashta habits, get this t-shirt to find some direction. Available in Yellow and White. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_front_4.png?v=1793966555', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/white_back_4.png?v=1793966553', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_lifestyle_model_female_cab37bf3-2e57-4d77-9157-38e446b839a8.png?v=1793867608', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_lifestyle_tshirt_8a98aaf6-df8b-48bf-b5d4-ee59668daf6e.png?v=1793867609'],
    ARRAY['Tee'],
    NULL,
    false,
    false
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for nasha-naashta-white-oversized-t-shirt

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XS', 'NASHA-NAASHTA-WHITE-OVERSIZED-T-SHIRT-XS', 50
FROM public.products WHERE handle = 'nasha-naashta-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'S', 'NASHA-NAASHTA-WHITE-OVERSIZED-T-SHIRT-S', 50
FROM public.products WHERE handle = 'nasha-naashta-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'M', 'NASHA-NAASHTA-WHITE-OVERSIZED-T-SHIRT-M', 50
FROM public.products WHERE handle = 'nasha-naashta-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'L', 'NASHA-NAASHTA-WHITE-OVERSIZED-T-SHIRT-L', 50
FROM public.products WHERE handle = 'nasha-naashta-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XL', 'NASHA-NAASHTA-WHITE-OVERSIZED-T-SHIRT-XL', 50
FROM public.products WHERE handle = 'nasha-naashta-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, '2XL', 'NASHA-NAASHTA-WHITE-OVERSIZED-T-SHIRT-2XL', 50
FROM public.products WHERE handle = 'nasha-naashta-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'Oye Hoye Kya Scene Hai | Oversized T-Shirt',
    'Oye Hoye Kya Scene Hai',
    'Oversized T-Shirt',
    'oye-hoye-kya-scene-hai-black-oversized-t-shirt',
    999,
    1349,
    '*Mic check* Please stand up for the Latent Anthem. Ab baith jaa, it’s just a tee. Visit your nearest chai ki tapri and wear it out loud. Available in Black and White. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/black_front_abd45c94-7094-49bb-a296-9f03ba8a7384.png?v=1793866141', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/black_back_af64bedf-fc7b-4183-a3ba-52953c90ead0.png?v=1793866141', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Models_lifestyle_female.png?v=1793867306', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/tshirt_lifestyle_black.png?v=1793866142'],
    ARRAY['Tee'],
    NULL,
    false,
    false
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for oye-hoye-kya-scene-hai-black-oversized-t-shirt

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XS', 'OYE-HOYE-KYA-SCENE-HAI-BLACK-OVERSIZED-T-SHIRT-XS', 50
FROM public.products WHERE handle = 'oye-hoye-kya-scene-hai-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'S', 'OYE-HOYE-KYA-SCENE-HAI-BLACK-OVERSIZED-T-SHIRT-S', 50
FROM public.products WHERE handle = 'oye-hoye-kya-scene-hai-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'M', 'OYE-HOYE-KYA-SCENE-HAI-BLACK-OVERSIZED-T-SHIRT-M', 50
FROM public.products WHERE handle = 'oye-hoye-kya-scene-hai-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'L', 'OYE-HOYE-KYA-SCENE-HAI-BLACK-OVERSIZED-T-SHIRT-L', 50
FROM public.products WHERE handle = 'oye-hoye-kya-scene-hai-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XL', 'OYE-HOYE-KYA-SCENE-HAI-BLACK-OVERSIZED-T-SHIRT-XL', 50
FROM public.products WHERE handle = 'oye-hoye-kya-scene-hai-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, '2XL', 'OYE-HOYE-KYA-SCENE-HAI-BLACK-OVERSIZED-T-SHIRT-2XL', 50
FROM public.products WHERE handle = 'oye-hoye-kya-scene-hai-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'I Don''t Drugz | Oversized T-Shirt',
    'I Don''t Drugz',
    'Oversized T-Shirt',
    'i-dont-drugz-brown-oversized-t-shirt',
    999,
    1349,
    'Poochne se pehle hi jawaab ready. Tanmay Bhat asked: “Is your supplier a man or a woman?” She responded: “I don’t drugz.” Wear one and let the world know. Maal available in Black, Indigo Blue and Green. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Green_front.png?v=1793866921', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Green_back.png?v=1793866921', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Green_lifestyle_male_female.png?v=1793866922', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Green_lifestyle_tshirt.png?v=1793866922'],
    ARRAY['Tee'],
    NULL,
    false,
    false
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for i-dont-drugz-brown-oversized-t-shirt

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XS', 'I-DONT-DRUGZ-BROWN-OVERSIZED-T-SHIRT-XS', 50
FROM public.products WHERE handle = 'i-dont-drugz-brown-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'S', 'I-DONT-DRUGZ-BROWN-OVERSIZED-T-SHIRT-S', 50
FROM public.products WHERE handle = 'i-dont-drugz-brown-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'M', 'I-DONT-DRUGZ-BROWN-OVERSIZED-T-SHIRT-M', 50
FROM public.products WHERE handle = 'i-dont-drugz-brown-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'L', 'I-DONT-DRUGZ-BROWN-OVERSIZED-T-SHIRT-L', 50
FROM public.products WHERE handle = 'i-dont-drugz-brown-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XL', 'I-DONT-DRUGZ-BROWN-OVERSIZED-T-SHIRT-XL', 50
FROM public.products WHERE handle = 'i-dont-drugz-brown-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, '2XL', 'I-DONT-DRUGZ-BROWN-OVERSIZED-T-SHIRT-2XL', 50
FROM public.products WHERE handle = 'i-dont-drugz-brown-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'I Don''t Drugz | Oversized T-Shirt',
    'I Don''t Drugz',
    'Oversized T-Shirt',
    'i-dont-drugz-black-oversized-t-shirt',
    999,
    1349,
    'Poochne se pehle hi jawaab ready. Tanmay Bhat asked: “Is your supplier a man or a woman?” She responded: “I don’t drugz.” Wear one and let the world know. Maal available in Black, Indigo Blue and Green. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Black_front_efd092f7-0e19-49a2-8623-7d739672e898.png?v=1793867030', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/black_back_e44cf336-5061-4d9b-9753-ab5b5ea12db1.png?v=1793867030', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Black_lifestyle_model_female_468d6142-0975-46a1-9158-975bb7bc590c.png?v=1793867034', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Black_lifestyle_tshirt_947151a5-e2f7-4463-b6d8-7f54d43270b7.png?v=1793867034'],
    ARRAY['Tee'],
    'https://merch.samayraina.co/cdn/shop/videos/c/vp/b55a6fd779ce4d4cb3293b4b95cf7b4b/b55a6fd779ce4d4cb3293b4b95cf7b4b.HD-1080p-7.2Mbps-100146107.mp4?v=0',
    true,
    true
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for i-dont-drugz-black-oversized-t-shirt

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XS', 'I-DONT-DRUGZ-BLACK-OVERSIZED-T-SHIRT-XS', 50
FROM public.products WHERE handle = 'i-dont-drugz-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'S', 'I-DONT-DRUGZ-BLACK-OVERSIZED-T-SHIRT-S', 50
FROM public.products WHERE handle = 'i-dont-drugz-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'M', 'I-DONT-DRUGZ-BLACK-OVERSIZED-T-SHIRT-M', 50
FROM public.products WHERE handle = 'i-dont-drugz-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'L', 'I-DONT-DRUGZ-BLACK-OVERSIZED-T-SHIRT-L', 50
FROM public.products WHERE handle = 'i-dont-drugz-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XL', 'I-DONT-DRUGZ-BLACK-OVERSIZED-T-SHIRT-XL', 50
FROM public.products WHERE handle = 'i-dont-drugz-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, '2XL', 'I-DONT-DRUGZ-BLACK-OVERSIZED-T-SHIRT-2XL', 50
FROM public.products WHERE handle = 'i-dont-drugz-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'Nazar Naa Lage | Oversized T-Shirt',
    'Nazar Naa Lage',
    'Oversized T-Shirt',
    'nazar-na-lage-loud-black-oversized-t-shirt',
    999,
    1349,
    'Buri Nazar Waale Tera Merch Kaala. From the iconic moment that marked the beginning of India’s Got Latent S2, comes the Nimbu-Mirchi Tee in Black and Almond. Soft, comfortable and nazar-free. We put one on stage. Now you put one on your torso. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/black_front_c8bd821e-4dd0-47d4-92e5-39f7ba2d813d.png?v=1793865627', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/black_back_7cd6ff8a-8bc8-4bfa-acf5-40a5eb8333d9.png?v=1793865627', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Black_lifestyle_model_female.png?v=1793866723', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Black_lifestyle_tshirt_dbf71289-4243-4323-a0ae-5b7f04957bd3.png?v=1793865629'],
    ARRAY['Tee'],
    'https://merch.samayraina.co/cdn/shop/videos/c/vp/639750eabc054473828ee1bc04e62c79/639750eabc054473828ee1bc04e62c79.HD-1080p-4.8Mbps-100156013.mp4?v=0',
    true,
    false
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for nazar-na-lage-loud-black-oversized-t-shirt

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XS', 'NAZAR-NA-LAGE-LOUD-BLACK-OVERSIZED-T-SHIRT-XS', 50
FROM public.products WHERE handle = 'nazar-na-lage-loud-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'S', 'NAZAR-NA-LAGE-LOUD-BLACK-OVERSIZED-T-SHIRT-S', 50
FROM public.products WHERE handle = 'nazar-na-lage-loud-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'M', 'NAZAR-NA-LAGE-LOUD-BLACK-OVERSIZED-T-SHIRT-M', 50
FROM public.products WHERE handle = 'nazar-na-lage-loud-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'L', 'NAZAR-NA-LAGE-LOUD-BLACK-OVERSIZED-T-SHIRT-L', 50
FROM public.products WHERE handle = 'nazar-na-lage-loud-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XL', 'NAZAR-NA-LAGE-LOUD-BLACK-OVERSIZED-T-SHIRT-XL', 50
FROM public.products WHERE handle = 'nazar-na-lage-loud-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, '2XL', 'NAZAR-NA-LAGE-LOUD-BLACK-OVERSIZED-T-SHIRT-2XL', 50
FROM public.products WHERE handle = 'nazar-na-lage-loud-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'Gorakhpur the Spain | Oversized T-Shirt',
    'Gorakhpur the Spain',
    'Oversized T-Shirt',
    'gorakhpur-the-spain-white-oversized-t-shirt',
    999,
    1349,
    'Buy it Jaldi: The late. Born from the moment when Ravi Kishan’s clone announced the new location for shooting ZNMD 2. So add the S in pain and visit Gorakhpur: the new Spain. Available in Black and White. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/wefkwre02.png?v=1793966342', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/wefkwre01.png?v=1793966342', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_lifestyle_model_male_83008ee6-7b01-4cf9-aa65-701e305b5483.png?v=1794046231', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_lifestyle_tshirt_bd7e8746-ee2a-45ea-a0b4-f85e6f30927a.png?v=1793864717'],
    ARRAY['Tee'],
    NULL,
    false,
    true
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for gorakhpur-the-spain-white-oversized-t-shirt

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XS', 'GORAKHPUR-THE-SPAIN-WHITE-OVERSIZED-T-SHIRT-XS', 50
FROM public.products WHERE handle = 'gorakhpur-the-spain-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'S', 'GORAKHPUR-THE-SPAIN-WHITE-OVERSIZED-T-SHIRT-S', 50
FROM public.products WHERE handle = 'gorakhpur-the-spain-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'M', 'GORAKHPUR-THE-SPAIN-WHITE-OVERSIZED-T-SHIRT-M', 50
FROM public.products WHERE handle = 'gorakhpur-the-spain-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'L', 'GORAKHPUR-THE-SPAIN-WHITE-OVERSIZED-T-SHIRT-L', 50
FROM public.products WHERE handle = 'gorakhpur-the-spain-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XL', 'GORAKHPUR-THE-SPAIN-WHITE-OVERSIZED-T-SHIRT-XL', 50
FROM public.products WHERE handle = 'gorakhpur-the-spain-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, '2XL', 'GORAKHPUR-THE-SPAIN-WHITE-OVERSIZED-T-SHIRT-2XL', 50
FROM public.products WHERE handle = 'gorakhpur-the-spain-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'Nasha <> Naashta | Oversized T-Shirt',
    'Nasha <> Naashta',
    'Oversized T-Shirt',
    'nasha-naashta-yellow-oversized-t-shirt',
    999,
    1349,
    'Acceptance is the first step. Only Orry can make breakfast sound like a rehab case. So, if you or your loved one is struggling with daily Nashta habits, get this t-shirt to find some direction. Available in Yellow and White. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/yellow_front_22f49c09-0b0e-4023-b5a1-d1828b112758.png?v=1793867530', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/yellow_back_dafcf1d6-73ca-4ac8-a7af-1e2e7a929ca9.png?v=1793867528', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Yellow_lifestyle_model_male_adc8c576-c88d-485f-b99c-c270aefb74de.png?v=1793867532', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Yellow_lifestyle_tshirt_d3928736-82ba-4bc1-8858-1279df3be04c.png?v=1793867533'],
    ARRAY['Tee'],
    'https://merch.samayraina.co/cdn/shop/videos/c/vp/65af7f2431f145cb82b8ec08a09e6c8c/65af7f2431f145cb82b8ec08a09e6c8c.HD-1080p-4.8Mbps-100155544.mp4?v=0',
    false,
    true
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for nasha-naashta-yellow-oversized-t-shirt

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XS', 'NASHA-NAASHTA-YELLOW-OVERSIZED-T-SHIRT-XS', 50
FROM public.products WHERE handle = 'nasha-naashta-yellow-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'S', 'NASHA-NAASHTA-YELLOW-OVERSIZED-T-SHIRT-S', 50
FROM public.products WHERE handle = 'nasha-naashta-yellow-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'M', 'NASHA-NAASHTA-YELLOW-OVERSIZED-T-SHIRT-M', 50
FROM public.products WHERE handle = 'nasha-naashta-yellow-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'L', 'NASHA-NAASHTA-YELLOW-OVERSIZED-T-SHIRT-L', 50
FROM public.products WHERE handle = 'nasha-naashta-yellow-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XL', 'NASHA-NAASHTA-YELLOW-OVERSIZED-T-SHIRT-XL', 50
FROM public.products WHERE handle = 'nasha-naashta-yellow-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, '2XL', 'NASHA-NAASHTA-YELLOW-OVERSIZED-T-SHIRT-2XL', 50
FROM public.products WHERE handle = 'nasha-naashta-yellow-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'Gorakhpur the Spain | Oversized T-Shirt',
    'Gorakhpur the Spain',
    'Oversized T-Shirt',
    'gorakhpur-the-spain-black-oversized-t-shirt',
    999,
    1349,
    'Buy it Jaldi: The late. Born from the moment when Ravi Kishan’s clone announced the new location for shooting ZNMD 2. So add the S in pain and visit Gorakhpur: the new Spain. Available in Black and White. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Black_front.png?v=1793772341', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/black_back.png?v=1793772341', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Black_lifestyle_model_male_female.png?v=1793772354', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Black_lifestyle_tshirt.png?v=1793772354'],
    ARRAY['Tee'],
    NULL,
    false,
    true
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for gorakhpur-the-spain-black-oversized-t-shirt

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XS', 'GORAKHPUR-THE-SPAIN-BLACK-OVERSIZED-T-SHIRT-XS', 50
FROM public.products WHERE handle = 'gorakhpur-the-spain-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'S', 'GORAKHPUR-THE-SPAIN-BLACK-OVERSIZED-T-SHIRT-S', 50
FROM public.products WHERE handle = 'gorakhpur-the-spain-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'M', 'GORAKHPUR-THE-SPAIN-BLACK-OVERSIZED-T-SHIRT-M', 50
FROM public.products WHERE handle = 'gorakhpur-the-spain-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'L', 'GORAKHPUR-THE-SPAIN-BLACK-OVERSIZED-T-SHIRT-L', 50
FROM public.products WHERE handle = 'gorakhpur-the-spain-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XL', 'GORAKHPUR-THE-SPAIN-BLACK-OVERSIZED-T-SHIRT-XL', 50
FROM public.products WHERE handle = 'gorakhpur-the-spain-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, '2XL', 'GORAKHPUR-THE-SPAIN-BLACK-OVERSIZED-T-SHIRT-2XL', 50
FROM public.products WHERE handle = 'gorakhpur-the-spain-black-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'Nazar Naa Lage | Oversized T-Shirt',
    'Nazar Naa Lage',
    'Oversized T-Shirt',
    'nazar-na-lage-loud-off-white-oversized-t-shirt',
    999,
    1349,
    'Buri Nazar Waale Tera Merch Kaala. From the iconic moment that marked the beginning of India’s Got Latent S2, comes the Nimbu-Mirchi Tee in Black and Almond. Soft, comfortable and nazar-free. We put one on stage. Now you put one on your torso. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Almond_tshirt_front.png?v=1793941035', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Almond_tshirt_back.png?v=1793941035', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Almond_lifestyle_male_female.png?v=1793941040', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/IGL_Geenia_Gemini_3_Nano_Banana_Pro__2026-11-05_14-45-27.png?v=1793941040'],
    ARRAY['Tee'],
    NULL,
    false,
    false
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for nazar-na-lage-loud-off-white-oversized-t-shirt

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XS', 'NAZAR-NA-LAGE-LOUD-OFF-WHITE-OVERSIZED-T-SHIRT-XS', 50
FROM public.products WHERE handle = 'nazar-na-lage-loud-off-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'S', 'NAZAR-NA-LAGE-LOUD-OFF-WHITE-OVERSIZED-T-SHIRT-S', 50
FROM public.products WHERE handle = 'nazar-na-lage-loud-off-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'M', 'NAZAR-NA-LAGE-LOUD-OFF-WHITE-OVERSIZED-T-SHIRT-M', 50
FROM public.products WHERE handle = 'nazar-na-lage-loud-off-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'L', 'NAZAR-NA-LAGE-LOUD-OFF-WHITE-OVERSIZED-T-SHIRT-L', 50
FROM public.products WHERE handle = 'nazar-na-lage-loud-off-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XL', 'NAZAR-NA-LAGE-LOUD-OFF-WHITE-OVERSIZED-T-SHIRT-XL', 50
FROM public.products WHERE handle = 'nazar-na-lage-loud-off-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, '2XL', 'NAZAR-NA-LAGE-LOUD-OFF-WHITE-OVERSIZED-T-SHIRT-2XL', 50
FROM public.products WHERE handle = 'nazar-na-lage-loud-off-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'I Don''t Drugz | Bag Tag',
    'I Don''t Drugz',
    'Bag Tag',
    'i-dont-drugz-bagtag',
    299,
    404,
    'Poochne se pehle hi jawaab ready. Tanmay Bhat asked: “Is your supplier a man or a woman?” She responded: “I don’t drugz.” Put one on your bag. Airport security will stop doubting you. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Bagcharm_front_df897ed4-3666-479b-a89d-a0dffdfd847c.png?v=1794128948', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Bagcharm_lifestyle_model_03_d54e1293-20c4-4f3e-9156-ee4f75e15736.png?v=1794128950', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Bagcharm_lifestyle_model_02_57d68628-da29-400e-96e6-2e3460e58d74.png?v=1794128953', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Bagcharm_Lifestyle_tightcrop_7ed2e10b-d72d-425a-8423-6c1cf5d4ba7b.png?v=1794128951'],
    ARRAY[],
    NULL,
    false,
    false
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for i-dont-drugz-bagtag

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'ONE SIZE', 'I-DONT-DRUGZ-BAGTAG-ONE SIZE', 50
FROM public.products WHERE handle = 'i-dont-drugz-bagtag'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'KAMZORIYAAAAN | Tank Top',
    'KAMZORIYAAAAN',
    'Tank Top',
    'kamzoriyan-black-regular-tank-top',
    799,
    1079,
    'Taango mein hai... Kamzoriyaaaan. The Khamoshiyan parody we deserve, but didn’t need. Finish your protein intake, manage your constipation and flex in the gym mirror with this tank top. Available in Black. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/black_front_729f6e9c-6d55-4938-9874-0438f59cc286.png?v=1793863985', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/black_back_e09579d9-77ad-45e9-a3d6-91dc3f931df1.png?v=1793863985', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Black_lifestyle_image_male_female.png?v=1793863989', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Black_lifestyle_tee.png?v=1793863986'],
    ARRAY['tank-top'],
    'https://merch.samayraina.co/cdn/shop/videos/c/vp/3c41321520b2420a8954ebb87decc8a3/3c41321520b2420a8954ebb87decc8a3.HD-1080p-7.2Mbps-100155739.mp4?v=0',
    false,
    false
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for kamzoriyan-black-regular-tank-top

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XS', 'KAMZORIYAN-BLACK-REGULAR-TANK-TOP-XS', 50
FROM public.products WHERE handle = 'kamzoriyan-black-regular-tank-top'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'S', 'KAMZORIYAN-BLACK-REGULAR-TANK-TOP-S', 50
FROM public.products WHERE handle = 'kamzoriyan-black-regular-tank-top'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'M', 'KAMZORIYAN-BLACK-REGULAR-TANK-TOP-M', 50
FROM public.products WHERE handle = 'kamzoriyan-black-regular-tank-top'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'L', 'KAMZORIYAN-BLACK-REGULAR-TANK-TOP-L', 50
FROM public.products WHERE handle = 'kamzoriyan-black-regular-tank-top'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XL', 'KAMZORIYAN-BLACK-REGULAR-TANK-TOP-XL', 50
FROM public.products WHERE handle = 'kamzoriyan-black-regular-tank-top'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, '2XL', 'KAMZORIYAN-BLACK-REGULAR-TANK-TOP-2XL', 50
FROM public.products WHERE handle = 'kamzoriyan-black-regular-tank-top'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'I Don''t Drugz | Oversized T-Shirt',
    'I Don''t Drugz',
    'Oversized T-Shirt',
    'i-dont-drugz-indigo-blue-oversized-t-shirt',
    999,
    1349,
    'Poochne se pehle hi jawaab ready. Tanmay Bhat asked: “Is your supplier a man or a woman?” She responded: “I don’t drugz.” Wear one and let the world know. Maal available in Black, Indigo Blue and Green. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/blue_front.png?v=1793866863', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/blue_back.png?v=1793866863', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Blue_Lifestyle_model_male.png?v=1793866867', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/Blue_lifestyle_tshirt.png?v=1793866868'],
    ARRAY['Tee'],
    NULL,
    false,
    false
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for i-dont-drugz-indigo-blue-oversized-t-shirt

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XS', 'I-DONT-DRUGZ-INDIGO-BLUE-OVERSIZED-T-SHIRT-XS', 50
FROM public.products WHERE handle = 'i-dont-drugz-indigo-blue-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'S', 'I-DONT-DRUGZ-INDIGO-BLUE-OVERSIZED-T-SHIRT-S', 50
FROM public.products WHERE handle = 'i-dont-drugz-indigo-blue-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'M', 'I-DONT-DRUGZ-INDIGO-BLUE-OVERSIZED-T-SHIRT-M', 50
FROM public.products WHERE handle = 'i-dont-drugz-indigo-blue-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'L', 'I-DONT-DRUGZ-INDIGO-BLUE-OVERSIZED-T-SHIRT-L', 50
FROM public.products WHERE handle = 'i-dont-drugz-indigo-blue-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XL', 'I-DONT-DRUGZ-INDIGO-BLUE-OVERSIZED-T-SHIRT-XL', 50
FROM public.products WHERE handle = 'i-dont-drugz-indigo-blue-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, '2XL', 'I-DONT-DRUGZ-INDIGO-BLUE-OVERSIZED-T-SHIRT-2XL', 50
FROM public.products WHERE handle = 'i-dont-drugz-indigo-blue-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;


INSERT INTO public.products (title, name, subtitle, handle, price, original_price, description, images, tags, video_url, is_featured, is_new)
VALUES (
    'Oye Hoye Kya Scene Hai | Oversized T-Shirt',
    'Oye Hoye Kya Scene Hai',
    'Oversized T-Shirt',
    'oye-hoye-kya-scene-hai-white-oversized-t-shirt',
    999,
    1349,
    '*Mic check* Please stand up for the Latent Anthem. Ab baith jaa, it’s just a tee. Visit your nearest chai ki tapri and wear it out loud. Available in Black and White. *Please review T&amp;Cs before ordering.',
    ARRAY['https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_front_3.png?v=1793966472', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_back_3.png?v=1793966473', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_lifestyle_model_male_6d7260ed-2bab-463a-b854-ee161e7c767e.png?v=1793867216', 'https://cdn.shopify.com/s/files/1/0842/5973/3613/files/White_lifestyle_tshirt_89ac68bf-6b5b-44a9-834a-66f9c63f09eb.png?v=1793866372'],
    ARRAY['Tee'],
    'https://merch.samayraina.co/cdn/shop/videos/c/vp/8d040c87a6c1466689e6579afff01bcb/8d040c87a6c1466689e6579afff01bcb.HD-1080p-7.2Mbps-100156605.mp4?v=0',
    true,
    true
)
ON CONFLICT (handle) DO UPDATE SET 
    price = EXCLUDED.price,
    images = EXCLUDED.images,
    video_url = EXCLUDED.video_url;

-- Seed Variants for oye-hoye-kya-scene-hai-white-oversized-t-shirt

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XS', 'OYE-HOYE-KYA-SCENE-HAI-WHITE-OVERSIZED-T-SHIRT-XS', 50
FROM public.products WHERE handle = 'oye-hoye-kya-scene-hai-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'S', 'OYE-HOYE-KYA-SCENE-HAI-WHITE-OVERSIZED-T-SHIRT-S', 50
FROM public.products WHERE handle = 'oye-hoye-kya-scene-hai-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'M', 'OYE-HOYE-KYA-SCENE-HAI-WHITE-OVERSIZED-T-SHIRT-M', 50
FROM public.products WHERE handle = 'oye-hoye-kya-scene-hai-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'L', 'OYE-HOYE-KYA-SCENE-HAI-WHITE-OVERSIZED-T-SHIRT-L', 50
FROM public.products WHERE handle = 'oye-hoye-kya-scene-hai-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, 'XL', 'OYE-HOYE-KYA-SCENE-HAI-WHITE-OVERSIZED-T-SHIRT-XL', 50
FROM public.products WHERE handle = 'oye-hoye-kya-scene-hai-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

INSERT INTO public.product_variants (product_id, size, sku, stock_quantity)
SELECT id, '2XL', 'OYE-HOYE-KYA-SCENE-HAI-WHITE-OVERSIZED-T-SHIRT-2XL', 50
FROM public.products WHERE handle = 'oye-hoye-kya-scene-hai-white-oversized-t-shirt'
ON CONFLICT (product_id, size) DO NOTHING;

