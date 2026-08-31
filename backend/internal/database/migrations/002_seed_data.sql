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

-- 2. Seed DEV Test Users (Strictly for development)
-- Normal User: 1234567890
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
) ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;

-- Business Owner: 9876543210
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
    30
) ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, plan = EXCLUDED.plan;

-- Admin: 9999988888
INSERT INTO users (id, phone, name, email, city, state, country, role, plan, status, free_scans_remaining)
VALUES (
    '00000000-0000-0000-0000-000000000003',
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
    '00000000-0000-0000-0000-000000000002',
    'verified',
    '8842',
    'ABCDE****F',
    'verified',
    'SURESH NATARAJAN',
    98.5,
    'sandbox',
    NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- 4. Seed 2 Businesses for Business Owner (00000000-0000-0000-0000-000000000002)
-- Business 1: Kovai Precision Tools (Manufacturing)
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

-- Digital Card for Business 1
INSERT INTO digital_cards (id, business_id, template, brand_color, qr_slug)
VALUES (
    '00000000-0000-0000-0000-0000000000d1',
    '00000000-0000-0000-0000-0000000000b1',
    'bold',
    '#2563EB',
    'kovai-precision-tools'
) ON CONFLICT (business_id) DO NOTHING;

-- Services for Business 1
INSERT INTO business_services (business_id, name) VALUES
('00000000-0000-0000-0000-0000000000b1', 'CNC Milling'),
('00000000-0000-0000-0000-0000000000b1', 'Hydraulic Valves'),
('00000000-0000-0000-0000-0000000000b1', 'Lathe Machining'),
('00000000-0000-0000-0000-0000000000b1', 'Custom Tooling');

-- Phones for Business 1
INSERT INTO business_phones (business_id, phone, label, is_whatsapp, otp_verified) VALUES
('00000000-0000-0000-0000-0000000000b1', '+919443012345', 'Sales', TRUE, TRUE);

-- Business 2 for the SAME owner: Apex Infotech Solutions (IT & Software)
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

-- Digital Card for Business 2
INSERT INTO digital_cards (id, business_id, template, brand_color, qr_slug)
VALUES (
    '00000000-0000-0000-0000-0000000000d2',
    '00000000-0000-0000-0000-0000000000b2',
    'clean',
    '#4F46E5',
    'apex-infotech-solutions'
) ON CONFLICT (business_id) DO NOTHING;

-- Services for Business 2
INSERT INTO business_services (business_id, name) VALUES
('00000000-0000-0000-0000-0000000000b2', 'Cloud ERP'),
('00000000-0000-0000-0000-0000000000b2', 'React Native Apps'),
('00000000-0000-0000-0000-0000000000b2', 'SaaS Development'),
('00000000-0000-0000-0000-0000000000b2', 'AI Integrations');

-- Phones for Business 2
INSERT INTO business_phones (business_id, phone, label, is_whatsapp, otp_verified) VALUES
('00000000-0000-0000-0000-0000000000b2', '+919842155678', 'Main', TRUE, TRUE);
