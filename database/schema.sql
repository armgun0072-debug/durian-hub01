-- ============================================================================
-- LEGACY PostgreSQL design reference. Do not execute against the MySQL app.
-- Current structure: prisma/schema.prisma. Additional MySQL CHECKs: hardening.sql.
-- Durian Hub - SQL Database Schema v2 & Seed Data (PostgreSQL)
-- อัปเดตเพิ่ม:
-- 1. ตารางฤดูกาลทุเรียน 6 ภูมิภาคของไทย (regional_seasons - อ้างอิงรูปที่ 1)
-- 2. ตารางห้องแชทและข้อความสนทนาซื้อขาย (chat_rooms, chat_messages - อ้างอิงรูปที่ 3-5)
-- ============================================================================

-- 1. ตารางข้อมูลฤดูกาลทุเรียน 6 ภูมิภาค (Regional Seasons - อ้างอิงรูปที่ 1)
CREATE TABLE regional_seasons (
    id SERIAL PRIMARY KEY,
    region_code VARCHAR(30) NOT NULL UNIQUE,
    region_name VARCHAR(100) NOT NULL,
    provinces_summary TEXT NOT NULL,
    popular_varieties VARCHAR(255) NOT NULL,
    harvest_period VARCHAR(100) NOT NULL,
    highlight_note TEXT
);

-- 2. ตารางพื้นที่จังหวัดแหล่งปลูกทุเรียน (Locations)
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    province VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    regional_season_id INT REFERENCES regional_seasons(id) ON DELETE SET NULL,
    UNIQUE (province, district)
);

-- 3. ตารางสายพันธุ์ทุเรียน (Durian Varieties)
CREATE TABLE durian_varieties (
    id SERIAL PRIMARY KEY,
    name_th VARCHAR(100) NOT NULL UNIQUE,
    name_en VARCHAR(100) NOT NULL,
    icon_emoji VARCHAR(20),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- 4. ตารางเกรดทุเรียน (Durian Grades)
CREATE TABLE durian_grades (
    id SERIAL PRIMARY KEY,
    grade_code VARCHAR(30) NOT NULL UNIQUE,
    name_th VARCHAR(100) NOT NULL,
    description TEXT
);

-- 5. ตารางผู้ใช้งาน (Users)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    location_id INT REFERENCES locations(id) ON DELETE SET NULL,
    active_role VARCHAR(20) NOT NULL DEFAULT 'SELLER' CHECK (active_role IN ('SELLER', 'BUYER', 'CUTTER', 'ADMIN')),
    is_kyc_verified BOOLEAN DEFAULT FALSE,
    trust_score INT DEFAULT 100,
    rating_avg DECIMAL(3, 2) DEFAULT 5.00,
    rating_count INT DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'BANNED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. ตารางบทบาทของสมาชิก (User Roles - ตอนสมัครมี 1 บทบาทหลัก is_primary_role = TRUE)
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_type VARCHAR(20) NOT NULL CHECK (role_type IN ('SELLER', 'BUYER', 'CUTTER', 'ADMIN')),
    is_primary_role BOOLEAN DEFAULT FALSE,
    business_name VARCHAR(200),
    license_number VARCHAR(100),
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING_APPROVAL', 'REJECTED')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, role_type)
);

-- 7. ตารางยื่นเอกสารขอเพิ่มบทบาทที่ 2 (Role Verification Requests)
CREATE TABLE role_verification_requests (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_role VARCHAR(20) NOT NULL CHECK (requested_role IN ('SELLER', 'BUYER', 'CUTTER')),
    business_name VARCHAR(200) NOT NULL,
    license_number VARCHAR(100),
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('GAP_CERTIFICATE', 'FARMER_BOOK', 'COMMERCIAL_LICENSE', 'CUTTER_CERT_OR_PORT', 'NATIONAL_ID_WITH_PIC')),
    document_url TEXT NOT NULL,
    note TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by_admin_id INT REFERENCES users(id) ON DELETE SET NULL,
    admin_remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

-- 8. ตารางประกาศตลาดกลาง 3 คอลัมน์ (Marketplace Posts - ขาย / รับซื้อ / รับตัด)
CREATE TABLE marketplace_posts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_type VARCHAR(20) NOT NULL CHECK (post_type IN ('SELL', 'BUY', 'CUT_SERVICE')),
    variety_id INT REFERENCES durian_varieties(id) ON DELETE SET NULL,
    grade_id INT REFERENCES durian_grades(id) ON DELETE SET NULL,
    location_id INT NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    price_per_kg DECIMAL(10, 2) NOT NULL,
    price_unit VARCHAR(20) NOT NULL DEFAULT 'PER_KG' CHECK (price_unit IN ('PER_KG', 'PER_TON', 'LUMP_SUM')),
    quantity_kg DECIMAL(12, 2),
    dry_matter_pct DECIMAL(4, 1),
    available_date DATE NOT NULL,
    is_price_outlier BOOLEAN DEFAULT FALSE,
    report_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'HIDDEN_BY_ADMIN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. ตารางรูปภาพประกอบโพสต์ (Post Images)
CREATE TABLE post_images (
    id SERIAL PRIMARY KEY,
    post_id INT NOT NULL REFERENCES marketplace_posts(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. ตารางห้องแชทซื้อขายอ้างอิงโพสต์ (Chat Rooms - อ้างอิงรูปที่ 4 และ 5)
CREATE TABLE chat_rooms (
    id SERIAL PRIMARY KEY,
    post_id INT NOT NULL REFERENCES marketplace_posts(id) ON DELETE CASCADE,
    initiator_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DEAL_CLOSED', 'ARCHIVED')),
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (post_id, initiator_id)
);

-- 11. ตารางข้อความในห้องแชท (Chat Messages - รองรับการ์ดสินค้าและปุ่มข้อความด่วน)
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    room_id INT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'PRODUCT_CARD', 'QUICK_REPLY', 'IMAGE')),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. ตารางสรุปราคากลางรายวันสำหรับกราฟแดชบอร์ด (Daily Market Stats)
CREATE TABLE daily_market_stats (
    id SERIAL PRIMARY KEY,
    stat_date DATE NOT NULL,
    variety_id INT NOT NULL REFERENCES durian_varieties(id) ON DELETE CASCADE,
    grade_id INT NOT NULL REFERENCES durian_grades(id) ON DELETE CASCADE,
    location_id INT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    avg_buy_price DECIMAL(10, 2),
    avg_sell_price DECIMAL(10, 2),
    min_price DECIMAL(10, 2),
    max_price DECIMAL(10, 2),
    avg_cut_wage_per_kg DECIMAL(10, 2),
    official_ref_price DECIMAL(10, 2),
    total_buy_volume_kg DECIMAL(14, 2) DEFAULT 0,
    total_sell_volume_kg DECIMAL(14, 2) DEFAULT 0,
    sample_post_count INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (stat_date, variety_id, grade_id, location_id)
);

-- 13. ตารางแจ้งรายงานโพสต์ปั่นราคา/มิจฉาชีพ (Post Reports)
CREATE TABLE post_reports (
    id SERIAL PRIMARY KEY,
    post_id INT NOT NULL REFERENCES marketplace_posts(id) ON DELETE CASCADE,
    reporter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(30) NOT NULL CHECK (reason IN ('FAKE_PRICE', 'SPAM', 'SCAM', 'WRONG_INFO')),
    detail TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. ตารางบันทึกข้อตกลงซื้อขาย/จ้างตัด (Deals) และ รีวิว (User Reviews)
CREATE TABLE deals (
    id SERIAL PRIMARY KEY,
    post_id INT NOT NULL REFERENCES marketplace_posts(id) ON DELETE CASCADE,
    initiator_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agreed_price_per_kg DECIMAL(10, 2) NOT NULL,
    agreed_quantity_kg DECIMAL(12, 2),
    cut_date DATE,
    note TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'COMPLETED', 'DISPUTED', 'CANCELLED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_reviews (
    id SERIAL PRIMARY KEY,
    deal_id INT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    reviewer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (deal_id, reviewer_id)
);

-- ============================================================================
-- ข้อมูลตั้งต้น (Initial Seed Data ตามรูปที่ 1)
-- ============================================================================

INSERT INTO regional_seasons (region_code, region_name, provinces_summary, popular_varieties, harvest_period, highlight_note) VALUES
('NORTH', 'ภาคเหนือ', 'กำแพงเพชร, พิจิตร, อุตรดิตถ์, ตาก, สุโขทัย, พิษณุโลก, เพชรบูรณ์', 'หมอนทอง, ชะนี, ก้านยาว, กระดุม, หลง-หลินลับแล', 'เม.ย. – พ.ค.', 'แหล่งทุเรียนภูเขาและพันธุ์พื้นเมืองลับแลขึ้นชื่อ'),
('CENTRAL', 'ภาคกลาง', 'สระบุรี, นครนายก, กาญจนบุรี, อุทัยธานี, นนทบุรี', 'หมอนทอง, ชะนี, ก้านยาว, กระดุม, ทุเรียนนนท์', 'พ.ค. – มิ.ย.', 'ทุเรียนนนท์ อร่อยหากินยาก พื้นที่ปลูกเหลือน้อย มูลค่าสูง'),
('ISAN', 'ภาคอีสาน', 'ชัยภูมิ, ศรีสะเกษ', 'ทุเรียนโอโซน (ชัยภูมิ), ทุเรียนภูเขาไฟ (ศรีสะเกษ)', 'มิ.ย. – ก.ค.', 'ปลูกบนดินภูเขาไฟและพื้นที่โอโซน กรอบนอกนุ่มใน กลิ่นไม่ฉุน'),
('EAST', 'ภาคตะวันออก', 'ระยอง, จันทบุรี, ตราด', 'หมอนทอง, ชะนี, ก้านยาว, กระดุม, พวงมณี', 'ก.พ. – เม.ย. (ก่อนฤดู) / พ.ค. – มิ.ย. (ตามฤดู)', 'ตลาดส่งออกหลักที่ใหญ่ที่สุดของประเทศ ล้งรับซื้อหนาแน่น'),
('SOUTH', 'ภาคใต้', 'ชุมพร, สุราษฎร์ธานี, นครศรีธรรมราช, ระนอง, พังงา, กระบี่, ภูเก็ต, ตรัง', 'สายพันธุ์พื้นบ้าน, หมอนทอง, ชะนี, ก้านยาว, กระดุม', 'ก.ย. – ต.ค.', 'ผลผลิตออกช่วงครึ่งปีหลัง ต่อเนื่องจากภาคตะวันออก'),
('DEEP_SOUTH', '3 จังหวัดชายแดนใต้', 'ยะลา, ปัตตานี, นราธิวาส', 'ทุเรียนบาตามัส, หมอนทอง, มูซังคิงเบตง', 'ส.ค. – ต.ค.', 'โดดเด่นด้วยทุเรียนบาตามัสและทุเรียนเบตงรสชาติเข้มข้น');

INSERT INTO durian_varieties (name_th, name_en, icon_emoji, description) VALUES
('หมอนทอง', 'Monthong', '👑', 'สายพันธุ์ยอดนิยมเพื่อการส่งออกและบริโภคในประเทศ เนื้อหนา เมล็ดลีบ'),
('ชะนี', 'Chanee', '🍯', 'เนื้อละเอียด รสชาติหวานจัด กลิ่นหอมเอกลักษณ์'),
('ก้านยาว', 'Kanyao', '💎', 'ราคาสูง เนื้อเนียนละเอียด รสหวานมันกลมกล่อม'),
('กระดุม', 'Kradum', '🌼', 'ทุเรียนพันธุ์เบา ออกผลผลิตเร็ว เนื้อเนียนสีเหลืองสวย'),
('พวงมณี', 'Puangmanee', '🌟', 'ผลขนาดเล็ก เนื้อสีเหลืองเข้ม รสหวานเข้มข้น'),
('ทุเรียนภูเขาไฟ', 'Volcanic Durian', '🌋', 'เอกลักษณ์ศรีสะเกษ เปลือกบาง เนื้อแห้งเนียน กลิ่นละมุน'),
('ทุเรียนนนท์', 'Nonthaburi GI', '🏆', 'ทุเรียน GI หายาก ราคาสูงระดับพรีเมียม'),
('บาตามัส', 'Batamas', '🌙', 'ทุเรียน 3 จังหวัดชายแดนใต้ รสหวานมันเป็นเอกลักษณ์');
