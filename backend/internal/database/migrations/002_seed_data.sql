-- ==============================================================================
-- 002_seed_data.sql: Seed Data for Categories, Dev Test Users & Multi-Business Listings
-- ==============================================================================

-- 1. Seed Categories (Top 20 Categories from PRD Appendix B)
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
('c0000000-0000-0000-0000-000000000001', 'Manufacturing', 'manufacturing', 'Factory', 1),
('c0000000-0000-0000-0000-000000000002', 'IT & Software', 'it-software', 'Code', 2),
('c0000000-0000-0000-0000-000000000003', 'Textiles & Garments', 'textiles', 'Shirt', 3),
('c0000000-0000-0000-0000-000000000004', 'Hardware & Building Materials', 'hardware', 'Wrench', 4),
('c0000000-0000-0000-0000-000000000005', 'Electrical & Automation', 'electrical', 'Zap', 5),
('c0000000-0000-0000-0000-000000000006', 'Construction & Civil', 'construction', 'Building2', 6),
('c0000000-0000-0000-0000-000000000007', 'Plumbing & Sanitation', 'plumbing', 'Droplet', 7),
('c0000000-0000-0000-0000-000000000008', 'Logistics & Transport', 'logistics', 'Truck', 8),
('c0000000-0000-0000-0000-000000000009', 'Consultants (CA/Legal/HR)', 'consultants', 'Briefcase', 9),
('c0000000-0000-0000-0000-000000000010', 'Printing & Packaging', 'printing', 'Printer', 10),
('c0000000-0000-0000-0000-000000000011', 'Interiors & Furniture', 'interiors', 'Armchair', 11),
('c0000000-0000-0000-0000-000000000012', 'Auto (Sales & Service)', 'auto', 'Car', 12),
('c0000000-0000-0000-0000-000000000013', 'Health & Clinics', 'health', 'Stethoscope', 13),
('c0000000-0000-0000-0000-000000000014', 'Education & Training', 'education', 'GraduationCap', 14),
('c0000000-0000-0000-0000-000000000015', 'Food & Catering', 'food', 'Utensils', 15),
('c0000000-0000-0000-0000-000000000016', 'Events & Photography', 'events', 'Camera', 16),
('c0000000-0000-0000-0000-000000000017', 'Real Estate', 'real-estate', 'Home', 17),
('c0000000-0000-0000-0000-000000000018', 'Security & CCTV', 'security', 'Shield', 18),
('c0000000-0000-0000-0000-000000000019', 'Cleaning & Pest Control', 'cleaning', 'Sparkles', 19),
('c0000000-0000-0000-0000-000000000020', 'Repairs & AMC', 'repairs', 'Tool', 20)
ON CONFLICT (slug) DO NOTHING;

-- 2. Seed DEV Test Users (Strictly for development)
-- Normal User: 1234567890
INSERT INTO users (id, phone, name, email, city, state, country, role, plan, status, free_scans_remaining)
VALUES (
    'u0000000-0000-0000-0000-000000000001',
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
) ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;

-- Business Owner: 9876543210
INSERT INTO users (id, phone, name, email, city, state, country, role, plan, status, free_scans_remaining)
VALUES (
    'u0000000-0000-0000-0000-000000000002',
    '+919876543210',
    'Suresh Natarajan',
    'suresh@kovaiprecision.com',
    'Coimbatore',
    'Tamil Nadu',
    'IN',
    'user',
    'plus',
    'active',
    30
) ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, plan = EXCLUDED.plan;

-- Admin: 9999988888
INSERT INTO users (id, phone, name, email, city, state, country, role, plan, status, free_scans_remaining)
VALUES (
    'u0000000-0000-0000-0000-000000000003',
    '+919999988888',
    'Admin Supervisor',
    'admin@cardflow.app',
    'Coimbatore',
    'Tamil Nadu',
    'IN',
    'admin',
    'premium',
    'active',
    999
) ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, role = 'admin', plan = 'premium';

-- 3. Seed KYC for Business Owner (L1 completed once per account)
INSERT INTO user_kyc (user_id, aadhaar_status, aadhaar_last4, pan_masked, pan_status, registry_name, name_match_score, provider, verified_at)
VALUES (
    'u0000000-0000-0000-0000-000000000002',
    'verified',
    '8842',
    'ABCDE****F',
    'verified',
    'SURESH NATARAJAN',
    98.5,
    'sandbox',
    NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- 4. Seed 2 Businesses for Business Owner (u0000000-0000-0000-0000-000000000002)
-- Business 1: Kovai Precision Tools (Manufacturing)
INSERT INTO businesses (
    id, owner_user_id, name, slug, description, primary_category_id,
    address_line1, locality, city, district, state, pincode, country,
    location, website, email, gstin, legal_name, trade_name,
    status, verification, listing, phone_verified, completeness, year_established
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'u0000000-0000-0000-0000-000000000002',
    'Kovai Precision Tools',
    'kovai-precision-tools',
    'Leading manufacturers of CNC machined precision components, hydraulic valves, and automotive fittings.',
    'c0000000-0000-0000-0000-000000000001',
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

-- Digital Card for Business 1
INSERT INTO digital_cards (id, business_id, template, brand_color, qr_slug)
VALUES (
    'dc000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'bold',
    '#2563EB',
    'kovai-precision-tools'
) ON CONFLICT (business_id) DO NOTHING;

-- Services for Business 1
INSERT INTO business_services (business_id, name) VALUES
('b0000000-0000-0000-0000-000000000001', 'CNC Milling'),
('b0000000-0000-0000-0000-000000000001', 'Hydraulic Valves'),
('b0000000-0000-0000-0000-000000000001', 'Lathe Machining'),
('b0000000-0000-0000-0000-000000000001', 'Custom Tooling');

-- Phones for Business 1
INSERT INTO business_phones (business_id, phone, label, is_whatsapp, otp_verified) VALUES
('b0000000-0000-0000-0000-000000000001', '+919443012345', 'Sales', TRUE, TRUE);

-- Business 2 for the SAME owner: Apex Infotech Solutions (IT & Software)
INSERT INTO businesses (
    id, owner_user_id, name, slug, description, primary_category_id,
    address_line1, locality, city, district, state, pincode, country,
    location, website, email, gstin, legal_name, trade_name,
    status, verification, listing, phone_verified, completeness, year_established
) VALUES (
    'b0000000-0000-0000-0000-000000000002',
    'u0000000-0000-0000-0000-000000000002',
    'Apex Infotech Solutions',
    'apex-infotech-solutions',
    'Enterprise ERP, Cloud Migration, and Custom Web & Mobile Application Development for MSMEs.',
    'c0000000-0000-0000-0000-000000000002',
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

-- Digital Card for Business 2
INSERT INTO digital_cards (id, business_id, template, brand_color, qr_slug)
VALUES (
    'dc000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002',
    'clean',
    '#4F46E5',
    'apex-infotech-solutions'
) ON CONFLICT (business_id) DO NOTHING;

-- Services for Business 2
INSERT INTO business_services (business_id, name) VALUES
('b0000000-0000-0000-0000-000000000002', 'Cloud ERP'),
('b0000000-0000-0000-0000-000000000002', 'React Native Apps'),
('b0000000-0000-0000-0000-000000000002', 'SaaS Development'),
('b0000000-0000-0000-0000-000000000002', 'AI Integrations');

-- Phones for Business 2
INSERT INTO business_phones (business_id, phone, label, is_whatsapp, otp_verified) VALUES
('b0000000-0000-0000-0000-000000000002', '+919842155678', 'Main', TRUE, TRUE);
