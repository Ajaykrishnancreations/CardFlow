-- ==============================================================================
-- 002_seed_data.sql: Seed Data for Categories, Dev Test Users & Multi-Business Listings
-- ==============================================================================

-- 1. Seed Categories (Top 20 Categories from PRD Appendix B)
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
('00000000-0000-0000-0000-0000000000c1', 'Manufacturing', 'manufacturing', 'Factory', 1),
('00000000-0000-0000-0000-0000000000c2', 'IT & Software', 'it-software', 'Code', 2),
('00000000-0000-0000-0000-0000000000c3', 'Textiles & Garments', 'textiles', 'Shirt', 3),
('00000000-0000-0000-0000-0000000000c4', 'Hardware & Building Materials', 'hardware', 'Wrench', 4),
('00000000-0000-0000-0000-0000000000c5', 'Electrical & Automation', 'electrical', 'Zap', 5),
('00000000-0000-0000-0000-0000000000c6', 'Construction & Civil', 'construction', 'Building2', 6),
('00000000-0000-0000-0000-0000000000c7', 'Plumbing & Sanitation', 'plumbing', 'Droplet', 7),
('00000000-0000-0000-0000-0000000000c8', 'Logistics & Transport', 'logistics', 'Truck', 8),
('00000000-0000-0000-0000-0000000000c9', 'Consultants (CA/Legal/HR)', 'consultants', 'Briefcase', 9),
('00000000-0000-0000-0000-0000000000ca', 'Printing & Packaging', 'printing', 'Printer', 10),
('00000000-0000-0000-0000-0000000000cb', 'Interiors & Furniture', 'interiors', 'Armchair', 11),
('00000000-0000-0000-0000-0000000000cc', 'Auto (Sales & Service)', 'auto', 'Car', 12),
('00000000-0000-0000-0000-0000000000cd', 'Health & Clinics', 'health', 'Stethoscope', 13),
('00000000-0000-0000-0000-0000000000ce', 'Education & Training', 'education', 'GraduationCap', 14),
('00000000-0000-0000-0000-0000000000cf', 'Food & Catering', 'food', 'Utensils', 15),
('00000000-0000-0000-0000-0000000000d0', 'Events & Photography', 'events', 'Camera', 16),
('00000000-0000-0000-0000-0000000000d1', 'Real Estate', 'real-estate', 'Home', 17),
('00000000-0000-0000-0000-0000000000d2', 'Security & CCTV', 'security', 'Shield', 18),
('00000000-0000-0000-0000-0000000000d3', 'Cleaning & Pest Control', 'cleaning', 'Sparkles', 19),
('00000000-0000-0000-0000-0000000000d4', 'Repairs & AMC', 'repairs', 'Tool', 20)
ON CONFLICT (slug) DO NOTHING;

-- ==============================================================================
-- 2. Seed Users & Admins
-- ==============================================================================

-- ADMIN: Ajay (6382124970)
INSERT INTO users (id, phone, name, email, city, state, country, role, plan, status, free_scans_remaining)
VALUES (
    '00000000-0000-0000-0000-0000000000a1',
    '+916382124970',
    'Ajay',
    'ajay@cardflow.app',
    'Coimbatore',
    'Tamil Nadu',
    'IN',
    'admin',
    'premium',
    'active',
    9999
) ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, role = 'admin', plan = 'premium';

-- (Removed former admin Govardhan +919008722766 — Ajay is the only admin)

-- DEMO USER: Admin Supervisor was removed; only Ajay remains admin.
-- Seed a normal demo user slot instead of an extra admin.
INSERT INTO users (id, phone, name, email, city, state, country, role, plan, status, free_scans_remaining)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    '+919999988888',
    'Demo Supervisor',
    'demo@cardflow.app',
    'Coimbatore',
    'Tamil Nadu',
    'IN',
    'user',
    'free',
    'active',
    30
) ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, role = 'user', plan = 'free';

-- BUSINESS OWNER: Raj (7094310122)
INSERT INTO users (id, phone, name, email, city, state, country, role, plan, status, free_scans_remaining)
VALUES (
    '00000000-0000-0000-0000-0000000000b3',
    '+917094310122',
    'Raj',
    'raj@rajenterprises.com',
    'Coimbatore',
    'Tamil Nadu',
    'IN',
    'user',
    'premium',
    'active',
    500
) ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, plan = EXCLUDED.plan;

-- BUSINESS OWNER: Rashiq (9042938108)
INSERT INTO users (id, phone, name, email, city, state, country, role, plan, status, free_scans_remaining)
VALUES (
    '00000000-0000-0000-0000-0000000000b4',
    '+919042938108',
    'Rashiq',
    'rashiq@rashiqtrading.com',
    'Coimbatore',
    'Tamil Nadu',
    'IN',
    'user',
    'plus',
    'active',
    150
) ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, plan = EXCLUDED.plan;

-- BUSINESS OWNER: Suresh Natarajan (9876543210)
INSERT INTO users (id, phone, name, email, city, state, country, role, plan, status, free_scans_remaining)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '+919876543210',
    'Suresh Natarajan',
    'suresh@kovaiprecision.com',
    'Coimbatore',
    'Tamil Nadu',
    'IN',
    'user',
    'plus',
    'active',
    150
) ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, plan = EXCLUDED.plan;

-- NORMAL USER: Dharani (9677840181)
INSERT INTO users (id, phone, name, email, city, state, country, role, plan, status, free_scans_remaining)
VALUES (
    '00000000-0000-0000-0000-0000000000u4',
    '+919677840181',
    'Dharani',
    'dharani@gmail.com',
    'Coimbatore',
    'Tamil Nadu',
    'IN',
    'user',
    'free',
    'active',
    30
) ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, role = 'user';

-- NORMAL USER: Ravi Kumar (1234567890)
INSERT INTO users (id, phone, name, email, city, state, country, role, plan, status, free_scans_remaining)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '+911234567890',
    'Ravi Kumar',
    'ravi.kumar@example.com',
    'Coimbatore',
    'Tamil Nadu',
    'IN',
    'user',
    'free',
    'active',
    30
) ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, role = 'user';

-- ==============================================================================
-- 3. Seed KYC
-- ==============================================================================
INSERT INTO user_kyc (user_id, aadhaar_status, aadhaar_last4, pan_masked, pan_status, registry_name, name_match_score, provider, verified_at)
VALUES 
('00000000-0000-0000-0000-0000000000a1', 'verified', '9912', 'ABCDE1234F', 'verified', 'AJAY', 100.0, 'sandbox', NOW()),
('00000000-0000-0000-0000-0000000000a2', 'verified', '7721', 'FGHIJ5678K', 'verified', 'GOVARDHAN', 100.0, 'sandbox', NOW()),
('00000000-0000-0000-0000-0000000000b3', 'verified', '4419', 'KLMNO9012P', 'verified', 'RAJ', 99.0, 'sandbox', NOW()),
('00000000-0000-0000-0000-0000000000b4', 'verified', '3391', 'PQRST3456U', 'verified', 'RASHIQ', 98.0, 'sandbox', NOW()),
('00000000-0000-0000-0000-000000000002', 'verified', '8842', 'ABCDE****F', 'verified', 'SURESH NATARAJAN', 98.5, 'sandbox', NOW())
ON CONFLICT (user_id) DO NOTHING;

-- ==============================================================================
-- 4. Seed Businesses
-- ==============================================================================

-- Business 1: Kovai Precision Tools (Owner: Suresh)
INSERT INTO businesses (
    id, owner_user_id, name, slug, description, primary_category_id,
    address_line1, locality, city, district, state, pincode, country,
    location, website, email, gstin, legal_name, trade_name,
    status, verification, listing, phone_verified, completeness, year_established
) VALUES (
    '00000000-0000-0000-0000-0000000000b1',
    '00000000-0000-0000-0000-000000000002',
    'Kovai Precision Tools',
    'kovai-precision-tools',
    'Leading manufacturers of CNC machined precision components, hydraulic valves, and automotive fittings.',
    '00000000-0000-0000-0000-0000000000c1',
    '42, SIDCO Industrial Estate',
    'Peelamedu',
    'Coimbatore',
    'Coimbatore',
    'Tamil Nadu',
    '641004',
    'IN',
    ST_SetSRID(ST_MakePoint(76.9958, 11.0268), 4326)::geography,
    'https://kovaiprecision.com',
    'contact@kovaiprecision.com',
    '33AAAAA0000A1Z5',
    'KOVAI PRECISION TOOLS PRIVATE LIMITED',
    'Kovai Precision Tools',
    'live',
    'gst',
    'listed',
    TRUE,
    95,
    2012
) ON CONFLICT (slug) DO NOTHING;

-- Business 2: Apex Infotech Solutions (Owner: Suresh)
INSERT INTO businesses (
    id, owner_user_id, name, slug, description, primary_category_id,
    address_line1, locality, city, district, state, pincode, country,
    location, website, email, gstin, legal_name, trade_name,
    status, verification, listing, phone_verified, completeness, year_established
) VALUES (
    '00000000-0000-0000-0000-0000000000b2',
    '00000000-0000-0000-0000-000000000002',
    'Apex Infotech Solutions',
    'apex-infotech-solutions',
    'Enterprise ERP, Cloud Migration, and Custom Web & Mobile Application Development for MSMEs.',
    '00000000-0000-0000-0000-0000000000c2',
    '105, Cross Cut Road',
    'Gandhipuram',
    'Coimbatore',
    'Coimbatore',
    'Tamil Nadu',
    '641018',
    'IN',
    ST_SetSRID(ST_MakePoint(76.9658, 11.0168), 4326)::geography,
    'https://apexinfotech.in',
    'hello@apexinfotech.in',
    '33BBBBB1111B2Z6',
    'APEX INFOTECH SOLUTIONS LLP',
    'Apex Infotech Solutions',
    'live',
    'gst',
    'listed',
    TRUE,
    90,
    2018
) ON CONFLICT (slug) DO NOTHING;

-- Business 3: Raj Engineering Works (Owner: Raj - 7094310122)
INSERT INTO businesses (
    id, owner_user_id, name, slug, description, primary_category_id,
    address_line1, locality, city, district, state, pincode, country,
    location, website, email, gstin, legal_name, trade_name,
    status, verification, listing, phone_verified, completeness, year_established
) VALUES (
    '00000000-0000-0000-0000-0000000000b5',
    '00000000-0000-0000-0000-0000000000b3',
    'Raj Engineering Works',
    'raj-engineering-works',
    'Specialists in lathe turning, heavy industrial fabrication, laser sheet metal cutting, and sheet bending.',
    '00000000-0000-0000-0000-0000000000c1',
    '18/A, Ganapathy Industrial Estate',
    'Ganapathy',
    'Coimbatore',
    'Coimbatore',
    'Tamil Nadu',
    '641006',
    'IN',
    ST_SetSRID(ST_MakePoint(76.9858, 11.0428), 4326)::geography,
    'https://rajengineering.in',
    'sales@rajengineering.in',
    '33CCCCC2222C3Z7',
    'RAJ ENGINEERING WORKS',
    'Raj Engineering',
    'live',
    'gst',
    'listed',
    TRUE,
    95,
    2015
) ON CONFLICT (slug) DO NOTHING;

-- Business 4: Rashiq Trading & Logistics (Owner: Rashiq - 9042938108)
INSERT INTO businesses (
    id, owner_user_id, name, slug, description, primary_category_id,
    address_line1, locality, city, district, state, pincode, country,
    location, website, email, gstin, legal_name, trade_name,
    status, verification, listing, phone_verified, completeness, year_established
) VALUES (
    '00000000-0000-0000-0000-0000000000b6',
    '00000000-0000-0000-0000-0000000000b4',
    'Rashiq Trading & Logistics',
    'rashiq-trading-logistics',
    'All-India heavy freight transport, industrial raw material distribution, and container trucking services.',
    '00000000-0000-0000-0000-0000000000c8',
    '55, Mettupalayam Road',
    'R.S. Puram',
    'Coimbatore',
    'Coimbatore',
    'Tamil Nadu',
    '641002',
    'IN',
    ST_SetSRID(ST_MakePoint(76.9520, 11.0180), 4326)::geography,
    'https://rashiqlogistics.com',
    'info@rashiqlogistics.com',
    '33DDDDD3333D4Z8',
    'RASHIQ TRADING AND LOGISTICS LLP',
    'Rashiq Logistics',
    'live',
    'gst',
    'listed',
    TRUE,
    92,
    2019
) ON CONFLICT (slug) DO NOTHING;

-- Digital Cards
INSERT INTO digital_cards (id, business_id, template, brand_color, qr_slug) VALUES
('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000b1', 'bold', '#2563EB', 'kovai-precision-tools'),
('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000b2', 'clean', '#4F46E5', 'apex-infotech-solutions'),
('00000000-0000-0000-0000-0000000000d5', '00000000-0000-0000-0000-0000000000b5', 'bold', '#D97706', 'raj-engineering-works'),
('00000000-0000-0000-0000-0000000000d6', '00000000-0000-0000-0000-0000000000b6', 'modern', '#059669', 'rashiq-trading-logistics')
ON CONFLICT (business_id) DO NOTHING;

-- Services
INSERT INTO business_services (business_id, name) VALUES
('00000000-0000-0000-0000-0000000000b1', 'CNC Milling'),
('00000000-0000-0000-0000-0000000000b1', 'Hydraulic Valves'),
('00000000-0000-0000-0000-0000000000b2', 'Cloud ERP'),
('00000000-0000-0000-0000-0000000000b2', 'React Native Apps'),
('00000000-0000-0000-0000-0000000000b5', 'Lathe Turning & Milling'),
('00000000-0000-0000-0000-0000000000b5', 'Laser Sheet Metal Cutting'),
('00000000-0000-0000-0000-0000000000b5', 'Industrial Fabrication'),
('00000000-0000-0000-0000-0000000000b6', 'Heavy Freight Transport'),
('00000000-0000-0000-0000-0000000000b6', 'Container Trucking'),
('00000000-0000-0000-0000-0000000000b6', 'Raw Material Logistics');

-- Phones
INSERT INTO business_phones (business_id, phone, label, is_whatsapp, otp_verified) VALUES
('00000000-0000-0000-0000-0000000000b1', '+919443012345', 'Sales', TRUE, TRUE),
('00000000-0000-0000-0000-0000000000b2', '+919842155678', 'Main', TRUE, TRUE),
('00000000-0000-0000-0000-0000000000b5', '+917094310122', 'Direct Raj', TRUE, TRUE),
('00000000-0000-0000-0000-0000000000b6', '+919042938108', 'Direct Rashiq', TRUE, TRUE);
