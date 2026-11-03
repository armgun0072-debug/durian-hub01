export type RoleType = "SELLER" | "BUYER" | "CUTTER" | "ADMIN";
export type PostType = "SELL" | "BUY" | "CUT_SERVICE";

export type DurianGradeKey = "GRADE_A" | "GRADE_B" | "GRADE_C" | "GRADE_D";

export interface GradePriceItem {
  gradeKey: DurianGradeKey;
  gradeName: string;
  gradeDescription: string;
  buyPrice: number;
  sellPrice: number;
  refPrice: number;
}

export interface VarietyPriceMatrixItem {
  variety: string;
  buyPrice: number;
  sellPrice: number;
  refPrice: number;
  grades: Record<DurianGradeKey, { buyPrice: number; sellPrice: number; refPrice: number }>;
}

export const DURIAN_GRADES_CONFIG: Record<
  DurianGradeKey,
  { key: DurianGradeKey; code: string; name: string; shortName: string; desc: string; badgeColor: string; ratio: number }
> = {
  GRADE_A: {
    key: "GRADE_A",
    code: "A",
    name: "เกรด A (ส่งออก)",
    shortName: "เกรด A",
    desc: "4-5 พูเต็ม รูปทรงสวย น้ำหนัก 2.5 - 4.5 กก. แป้งมาตรฐานส่งออก",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-300",
    ratio: 1.05,
  },
  GRADE_B: {
    key: "GRADE_B",
    code: "B",
    name: "เกรด B (รองส่งออก)",
    shortName: "เกรด B",
    desc: "ทรงสวย 3-4 พู ผิวเรียบ น้ำหนักมาตรฐาน",
    badgeColor: "bg-sky-50 text-sky-800 border-sky-300",
    ratio: 0.92,
  },
  GRADE_C: {
    key: "GRADE_C",
    code: "C",
    name: "เกรด C (ในประเทศ)",
    shortName: "เกรด C",
    desc: "2-3 พู สำหรับตลาดบริโภคในประเทศ รสชาติหวานมันปกติ",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-300",
    ratio: 0.78,
  },
  GRADE_D: {
    key: "GRADE_D",
    code: "D",
    name: "เกรด D (ตกไซซ์ / ผิวลาย)",
    shortName: "เกรด D ตกไซซ์",
    desc: "ลูกเล็กกว่า 2 กก. หรือใหญ่เกินไป หรือผิวลาย แต่เนื้อสุกดี",
    badgeColor: "bg-rose-50 text-rose-800 border-rose-300",
    ratio: 0.58,
  },
};

export function buildGradesForVariety(baseBuy: number, baseSell: number, baseRef: number) {
  return {
    GRADE_A: {
      buyPrice: Math.round(baseBuy * 1.05),
      sellPrice: Math.round(baseSell * 1.05),
      refPrice: Math.round(baseRef * 1.05),
    },
    GRADE_B: {
      buyPrice: Math.round(baseBuy * 0.92),
      sellPrice: Math.round(baseSell * 0.92),
      refPrice: Math.round(baseRef * 0.92),
    },
    GRADE_C: {
      buyPrice: Math.round(baseBuy * 0.78),
      sellPrice: Math.round(baseSell * 0.78),
      refPrice: Math.round(baseRef * 0.78),
    },
    GRADE_D: {
      buyPrice: Math.round(baseBuy * 0.58),
      sellPrice: Math.round(baseSell * 0.58),
      refPrice: Math.round(baseRef * 0.58),
    },
  };
}

export interface RegionalSeasonData {
  id: string;
  regionName: string;
  provinces: string[];
  varieties: string[];
  harvestPeriod: string;
  preSeasonPeriod?: string;
  highlightNote: string;
  colorClass: string;
  dotColor: string;
  avgBuyPrice: number;
  avgSellPrice: number;
  avgCutWage: number;
  activeLotsCount: number;
  priceByVariety: VarietyPriceMatrixItem[];
}

export interface VarietyStripItem {
  id: string;
  nameTh: string;
  nameEn: string;
  badgeText: string;
  avgPrice: number;
  accentColor: string;
}

export interface MarketplacePostItem {
  id: number;
  userId?: number;
  authorName: string;
  businessName: string;
  authorRole: RoleType;
  isKycVerified: boolean;
  rating: number;
  reviewCount: number;
  trustScore: number;
  postType: PostType;
  variety: string;
  grade: string;
  regionTag: string;
  province: string;
  district: string;
  title: string;
  content: string;
  itemDetailSummary: string;
  pricePerKg: number;
  priceUnitLabel: string;
  quantityKg: number;
  dryMatterPct?: number;
  availableDate: string;
  isPriceOutlier: boolean;
  reportCount: number;
  createdAt: string;
  contactNote: string;
  status?: string;
}

export interface ChatMessageItem {
  id: number;
  sender: "ME" | "PARTNER";
  text: string;
  time: string;
  isProductCard?: boolean;
  isRead?: boolean;
  status?: "SENDING" | "SENT" | "READ";
}

export interface ChatRoomItem {
  closedAt?: string | null;
  readOnlyAt?: string | null;
  isHistory?: boolean;
  deal?: { id: number; agreedPrice: string; agreedPricePerKg?: string; agreedQuantityKg?: string; cutDate?: string | null; note?: string | null } | null;
  id: number;
  postId?: number;
  partnerId?: number;
  post: MarketplacePostItem;
  partnerName: string;
  partnerBusiness: string;
  partnerRating?: number;
  partnerRatingCount?: number;
  partnerTrustScore?: number;
  hasReviewedByMe?: boolean;
  lastActive: string;
  lastMessage: string;
  lastTime: string;
  unreadCount?: number;
  messages: ChatMessageItem[];
  status?: "ACTIVE" | "DEAL_CLOSED" | "ARCHIVED";
}

export interface RoleVerificationItem {
  id: number;
  userName: string;
  currentPrimaryRole: RoleType;
  requestedRole: RoleType;
  businessName: string;
  licenseNumber: string;
  documentType: string;
  documentName: string;
  note: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

// ============================================================================
// 1. ข้อมูลแดชบอร์ดทุเรียนไทย 6 ภูมิภาค (อ้างอิงตามรูปที่ 1 ทุกจุด)
// ============================================================================
export const REGIONAL_SEASONS_DATA: RegionalSeasonData[] = [
  {
    id: "EAST",
    regionName: "ภาคตะวันออก",
    provinces: [
      "จันทบุรี",
      "ระยอง",
      "ตราด",
      "ฉะเชิงเทรา",
      "ชลบุรี",
      "นครนายก",
      "ปราจีนบุรี",
      "สระแก้ว",
    ],
    varieties: ["หมอนทอง", "ชะนี", "ก้านยาว", "กระดุม", "พวงมณี"],
    preSeasonPeriod: "ก.พ. – เม.ย. (ผลผลิตก่อนฤดูกาล)",
    harvestPeriod: "พ.ค. – มิ.ย. (ผลผลิตตามฤดูกาล)",
    highlightNote:
      "แหล่งผลิตและส่งออกทุเรียนขนาดใหญ่ที่สุดของไทย ล้งรับซื้อและทีมตัดหนาแน่นที่สุด",
    colorClass: "bg-teal-50 border-teal-200 text-teal-900",
    dotColor: "#0d9488",
    avgBuyPrice: 170,
    avgSellPrice: 178,
    avgCutWage: 5.0,
    activeLotsCount: 64,
    priceByVariety: [
      { variety: "หมอนทอง", buyPrice: 170, sellPrice: 178, refPrice: 168, grades: buildGradesForVariety(170, 178, 168) },
      { variety: "ชะนี", buyPrice: 128, sellPrice: 135, refPrice: 125, grades: buildGradesForVariety(128, 135, 125) },
      { variety: "ก้านยาว", buyPrice: 220, sellPrice: 235, refPrice: 215, grades: buildGradesForVariety(220, 235, 215) },
      { variety: "กระดุม", buyPrice: 118, sellPrice: 125, refPrice: 115, grades: buildGradesForVariety(118, 125, 115) },
    ],
  },
  {
    id: "NORTH",
    regionName: "ภาคเหนือ",
    provinces: [
      "เชียงใหม่",
      "เชียงราย",
      "กำแพงเพชร",
      "ลำปาง",
      "ลำพูน",
      "แม่ฮ่องสอน",
      "นครสวรรค์",
      "น่าน",
      "พะเยา",
      "เพชรบูรณ์",
      "พิจิตร",
      "พิษณุโลก",
      "แพร่",
      "สุโขทัย",
      "ตาก",
      "อุทัยธานี",
      "อุตรดิตถ์",
    ],
    varieties: ["หมอนทอง", "ชะนี", "ก้านยาว", "กระดุม"],
    harvestPeriod: "เม.ย. – พ.ค.",
    highlightNote:
      "ผลผลิตออกช่วงเมษายน-พฤษภาคม โดดเด่นด้วยทุเรียนภูเขาอุตรดิตถ์และแหล่งปลูกใหม่ในเพชรบูรณ์-กำแพงเพชร",
    colorClass: "bg-amber-50 border-amber-200 text-amber-900",
    dotColor: "#eab308",
    avgBuyPrice: 162,
    avgSellPrice: 170,
    avgCutWage: 5.5,
    activeLotsCount: 28,
    priceByVariety: [
      { variety: "หมอนทอง", buyPrice: 162, sellPrice: 170, refPrice: 160, grades: buildGradesForVariety(162, 170, 160) },
      { variety: "ชะนี", buyPrice: 122, sellPrice: 130, refPrice: 120, grades: buildGradesForVariety(122, 130, 120) },
      { variety: "ก้านยาว", buyPrice: 205, sellPrice: 220, refPrice: 200, grades: buildGradesForVariety(205, 220, 200) },
      { variety: "กระดุม", buyPrice: 112, sellPrice: 120, refPrice: 110, grades: buildGradesForVariety(112, 120, 110) },
    ],
  },
  {
    id: "CENTRAL",
    regionName: "ภาคกลาง",
    provinces: [
      "กรุงเทพมหานคร",
      "นนทบุรี",
      "ปทุมธานี",
      "นครปฐม",
      "สมุทรปราการ",
      "สมุทรสาคร",
      "สมุทรสงคราม",
      "อยุธยา",
      "อ่างทอง",
      "ชัยนาท",
      "สิงห์บุรี",
      "ลพบุรี",
      "สระบุรี",
      "สุพรรณบุรี",
      "กาญจนบุรี",
      "ราชบุรี",
      "เพชรบุรี",
      "ประจวบคีรีขันธ์",
    ],
    varieties: ["หมอนทอง", "ชะนี", "ก้านยาว", "กระดุม", "ทุเรียนนนท์"],
    harvestPeriod: "พ.ค. – มิ.ย.",
    highlightNote:
      "ทุเรียนนนท์ อร่อยหากินยาก ความเจริญทำให้พื้นที่ปลูกทุเรียนเหลือน้อย มูลค่าสูงระดับพรีเมียม",
    colorClass: "bg-indigo-50 border-indigo-200 text-indigo-900",
    dotColor: "#6366f1",
    avgBuyPrice: 185,
    avgSellPrice: 198,
    avgCutWage: 6.0,
    activeLotsCount: 19,
    priceByVariety: [
      { variety: "หมอนทอง", buyPrice: 172, sellPrice: 182, refPrice: 170, grades: buildGradesForVariety(172, 182, 170) },
      { variety: "ชะนี", buyPrice: 132, sellPrice: 140, refPrice: 130, grades: buildGradesForVariety(132, 140, 130) },
      { variety: "ก้านยาว", buyPrice: 245, sellPrice: 265, refPrice: 240, grades: buildGradesForVariety(245, 265, 240) },
      { variety: "ทุเรียนนนท์", buyPrice: 450, sellPrice: 520, refPrice: 450, grades: buildGradesForVariety(450, 520, 450) },
    ],
  },
  {
    id: "ISAN",
    regionName: "ภาคอีสาน",
    provinces: [
      "ศรีสะเกษ",
      "นครราชสีมา",
      "ชัยภูมิ",
      "บุรีรัมย์",
      "สุรินทร์",
      "อุบลราชธานี",
      "ขอนแก่น",
      "อุดรธานี",
      "เลย",
      "หนองคาย",
      "หนองบัวลำภู",
      "บึงกาฬ",
      "สกลนคร",
      "นครพนม",
      "มุกดาหาร",
      "ยโสธร",
      "อำนาจเจริญ",
      "ร้อยเอ็ด",
      "กาฬสินธุ์",
      "มหาสารคาม",
    ],
    varieties: ["ทุเรียนโอโซน", "ทุเรียนภูเขาไฟ", "หมอนทอง"],
    harvestPeriod: "มิ.ย. – ก.ค.",
    highlightNote:
      "ชัยภูมิโดดเด่นเรื่องทุเรียนโอโซน และศรีสะเกษขึ้นชื่อเรื่องทุเรียนภูเขาไฟ เปลือกบาง เนื้อแห้งเนียน",
    colorClass: "bg-sky-50 border-sky-200 text-sky-900",
    dotColor: "#0284c7",
    avgBuyPrice: 178,
    avgSellPrice: 190,
    avgCutWage: 5.5,
    activeLotsCount: 24,
    priceByVariety: [
      { variety: "ทุเรียนภูเขาไฟ", buyPrice: 185, sellPrice: 200, refPrice: 180, grades: buildGradesForVariety(185, 200, 180) },
      { variety: "ทุเรียนโอโซน", buyPrice: 175, sellPrice: 188, refPrice: 172, grades: buildGradesForVariety(175, 188, 172) },
      { variety: "หมอนทอง", buyPrice: 168, sellPrice: 176, refPrice: 165, grades: buildGradesForVariety(168, 176, 165) },
    ],
  },
  {
    id: "SOUTH",
    regionName: "ภาคใต้",
    provinces: [
      "ชุมพร",
      "สุราษฎร์ธานี",
      "นครศรีธรรมราช",
      "ระนอง",
      "พังงา",
      "กระบี่",
      "ภูเก็ต",
      "ตรัง",
      "พัทลุง",
      "สงขลา",
      "สตูล",
    ],
    varieties: ["สายพันธุ์พื้นบ้าน", "หมอนทอง", "ชะนี", "ก้านยาว", "กระดุม"],
    harvestPeriod: "ก.ย. – ต.ค.",
    highlightNote:
      "ตลาดใหญ่ช่วงครึ่งปีหลัง (ก.ย.-ต.ค.) ศูนย์กลางล้งรับซื้อส่งออกอยู่ที่ชุมพรและสุราษฎร์ธานี",
    colorClass: "bg-emerald-50 border-emerald-200 text-emerald-900",
    dotColor: "#16a34a",
    avgBuyPrice: 168,
    avgSellPrice: 175,
    avgCutWage: 5.0,
    activeLotsCount: 47,
    priceByVariety: [
      { variety: "หมอนทอง", buyPrice: 168, sellPrice: 175, refPrice: 165, grades: buildGradesForVariety(168, 175, 165) },
      { variety: "ชะนี", buyPrice: 125, sellPrice: 132, refPrice: 122, grades: buildGradesForVariety(125, 132, 122) },
      { variety: "ก้านยาว", buyPrice: 210, sellPrice: 225, refPrice: 205, grades: buildGradesForVariety(210, 225, 205) },
      { variety: "สายพันธุ์พื้นบ้าน", buyPrice: 95, sellPrice: 110, refPrice: 95, grades: buildGradesForVariety(95, 110, 95) },
    ],
  },
  {
    id: "DEEP_SOUTH",
    regionName: "3 จังหวัดชายแดนใต้",
    provinces: ["ยะลา", "ปัตตานี", "นราธิวาส"],
    varieties: ["ทุเรียนบาตามัส", "หมอนทอง", "มูซังคิงเบตง"],
    harvestPeriod: "ส.ค. – ต.ค.",
    highlightNote:
      "เอกลักษณ์ทุเรียนบาตามัส เนื้อสีเหลืองเข้ม รสหวานมัน และทุเรียนคุณภาพสูงจากพื้นที่ยะลา-เบตง",
    colorClass: "bg-cyan-50 border-cyan-200 text-cyan-900",
    dotColor: "#0891b2",
    avgBuyPrice: 165,
    avgSellPrice: 176,
    avgCutWage: 5.5,
    activeLotsCount: 15,
    priceByVariety: [
      { variety: "ทุเรียนบาตามัส", buyPrice: 160, sellPrice: 175, refPrice: 158, grades: buildGradesForVariety(160, 175, 158) },
      { variety: "หมอนทอง", buyPrice: 165, sellPrice: 174, refPrice: 162, grades: buildGradesForVariety(165, 174, 162) },
      { variety: "มูซังคิงเบตง", buyPrice: 280, sellPrice: 310, refPrice: 275, grades: buildGradesForVariety(280, 310, 275) },
    ],
  },
];

// ============================================================================
// 2. แถบสายพันธุ์ทุเรียนด้านบนหน้าตลาดกลาง (อ้างอิงแถบไอเทมรูปที่ 2)
// ============================================================================
export const VARIETY_STRIP_ITEMS: VarietyStripItem[] = [
  {
    id: "ALL",
    nameTh: "ทุกสายพันธุ์",
    nameEn: "All Varieties",
    badgeText: "ทั้งหมด",
    avgPrice: 170,
    accentColor: "from-emerald-500 to-teal-600",
  },
  {
    id: "หมอนทอง",
    nameTh: "หมอนทอง",
    nameEn: "Monthong",
    badgeText: "ยอดนิยม",
    avgPrice: 172,
    accentColor: "from-amber-400 to-amber-600",
  },
  {
    id: "ก้านยาว",
    nameTh: "ก้านยาว",
    nameEn: "Kanyao",
    badgeText: "พรีเมียม",
    avgPrice: 228,
    accentColor: "from-emerald-600 to-green-700",
  },
  {
    id: "ชะนี",
    nameTh: "ชะนี",
    nameEn: "Chanee",
    badgeText: "หวานหอม",
    avgPrice: 132,
    accentColor: "from-yellow-500 to-orange-500",
  },
  {
    id: "กระดุม",
    nameTh: "กระดุม",
    nameEn: "Kradum",
    badgeText: "พันธุ์เบา",
    avgPrice: 122,
    accentColor: "from-lime-500 to-emerald-600",
  },
  {
    id: "ทุเรียนภูเขาไฟ",
    nameTh: "ทุเรียนภูเขาไฟ",
    nameEn: "Sisaket GI",
    badgeText: "ภาคอีสาน",
    avgPrice: 195,
    accentColor: "from-rose-500 to-orange-600",
  },
  {
    id: "ทุเรียนนนท์",
    nameTh: "ทุเรียนนนท์",
    nameEn: "Nonthaburi",
    badgeText: "หายาก",
    avgPrice: 480,
    accentColor: "from-indigo-500 to-purple-600",
  },
  {
    id: "ทุเรียนบาตามัส",
    nameTh: "บาตามัส",
    nameEn: "Batamas",
    badgeText: "ชายแดนใต้",
    avgPrice: 175,
    accentColor: "from-cyan-500 to-teal-600",
  },
];

// ============================================================================
// 3. รายการโพสต์ตลาดกลาง 3 คอลัมน์ (Sell Orders | Buy Orders | Cut Orders)
// ============================================================================
export const INITIAL_POSTS: MarketplacePostItem[] = [
  // --- SELL ORDERS (ชาวสวนต้องการขาย) ---
  {
    id: 101,
    authorName: "PanupongCharoensuk",
    businessName: "สวนภาณุพงศ์ จันทบุรี (GAP Certified)",
    authorRole: "SELLER",
    isKycVerified: true,
    rating: 5.0,
    reviewCount: 32,
    trustScore: 100,
    postType: "SELL",
    variety: "หมอนทอง",
    grade: "AB ส่งออก",
    regionTag: "ภาคตะวันออก",
    province: "จันทบุรี",
    district: "ท่าใหม่",
    title: "หมอนทองคัดเกรดส่งออก AB (8 ตัน)",
    content:
      "ทุเรียนหมอนทองแท้ดูแลตามมาตรฐาน GAP ตรวจเปอร์เซ็นต์แป้งแล้วอยู่ที่ 34% ทรงสวย พูเต็ม หนามเขียวสด พร้อมเปิดสวนให้ล้งและทีมตัดเข้าดูหน้างานจริง",
    itemDetailSummary:
      "สามารถนัดเข้าดูสวนและตรวจวัดเปอร์เซ็นต์แป้งหน้าสวนได้ทุกวัน พื้นที่ อ.ท่าใหม่ จ.จันทบุรี (มีใบรับรอง GAP ครบถ้วน)",
    pricePerKg: 172,
    priceUnitLabel: "ต่อกิโลกรัม",
    quantityKg: 8000,
    dryMatterPct: 34.0,
    availableDate: "28/10/2026",
    isPriceOutlier: false,
    reportCount: 0,
    createdAt: "24 ต.ค. • 17:32 น.",
    contactNote: "ทักแชทในระบบได้ตลอด 24 ชม. ตอบไวครับ",
  },
  {
    id: 102,
    authorName: "SomchaiGarden",
    businessName: "สวนลุงสมชาย แกลง-ระยอง",
    authorRole: "SELLER",
    isKycVerified: true,
    rating: 4.9,
    reviewCount: 19,
    trustScore: 100,
    postType: "SELL",
    variety: "ก้านยาว",
    grade: "AB พรีเมียม",
    regionTag: "ภาคตะวันออก",
    province: "ระยอง",
    district: "แกลง",
    title: "ก้านยาวระยองแท้ เนื้อเนียน 3.5 ตัน",
    content:
      "ก้านยาวต้นอายุ 18 ปี ลูกทรงกลมสวย หนามเล็กสม่ำเสมอ เปอร์เซ็นต์แป้งผ่านเกณฑ์พร้อมตัดส่งตลาดพรีเมียม",
    itemDetailSummary:
      "ผลผลิตพร้อมตัดล็อตแรก 3.5 ตัน พิกัด อ.แกลง จ.ระยอง รถหกล้อเข้าถึงหน้าสวนสะดวก",
    pricePerKg: 228,
    priceUnitLabel: "ต่อกิโลกรัม",
    quantityKg: 3500,
    dryMatterPct: 33.5,
    availableDate: "30/10/2026",
    isPriceOutlier: false,
    reportCount: 0,
    createdAt: "25 ต.ค. • 09:15 น.",
    contactNote: "เน้นขายยกสวนหรือแบ่งตัดตามเกรดตกลงกันได้",
  },
  {
    id: 103,
    authorName: "SisaketVolcano",
    businessName: "สวนทุเรียนภูเขาไฟ กันทรลักษ์",
    authorRole: "SELLER",
    isKycVerified: true,
    rating: 5.0,
    reviewCount: 27,
    trustScore: 100,
    postType: "SELL",
    variety: "ทุเรียนภูเขาไฟ",
    grade: "AB คัดพิเศษ",
    regionTag: "ภาคอีสาน",
    province: "ศรีสะเกษ",
    district: "กันทรลักษ์",
    title: "ทุเรียนภูเขาไฟแท้ GI ศรีสะเกษ (4 ตัน)",
    content:
      "ปลูกบนดินภูเขาไฟโบราณ เปลือกบาง เมล็ดลีบ เนื้อแห้งเนียนละเอียด กลิ่นหอมละมุน มีสติกเกอร์ QR Code ยืนยันแหล่งปลูก",
    itemDetailSummary:
      "เหมาะสำหรับพ่อค้าส่งห้างพรีเมียมและตลาดออนไลน์เกรดคัดพิเศษ พิกัด อ.กันทรลักษ์ จ.ศรีสะเกษ",
    pricePerKg: 195,
    priceUnitLabel: "ต่อกิโลกรัม",
    quantityKg: 4000,
    dryMatterPct: 35.0,
    availableDate: "02/11/2026",
    isPriceOutlier: false,
    reportCount: 0,
    createdAt: "วันนี้ • 08:40 น.",
    contactNote: "มีใบรับรอง GI ศรีสะเกษแท้ 100%",
  },

  // --- BUY ORDERS (ล้ง/ผู้ซื้อต้องการรับซื้อ) ---
  {
    id: 201,
    authorName: "SavitarInterTrade",
    businessName: "ล้งสาวิตา อินเตอร์เทรด (ชุมพร-จันทบุรี)",
    authorRole: "BUYER",
    isKycVerified: true,
    rating: 4.9,
    reviewCount: 45,
    trustScore: 100,
    postType: "BUY",
    variety: "หมอนทอง",
    grade: "AB ส่งออก",
    regionTag: "ภาคใต้",
    province: "ชุมพร",
    district: "หลังสวน",
    title: "รับซื้อหมอนทองเกรดส่งออก AB วันนี้ (รับ 30 ตัน)",
    content:
      "ล้งเปิดรับซื้อหน้าล้งและรับเหมาหน้าสวน น้ำหนักลูก 2.0 - 4.5 กก. ทรงสวย 3.5 พูขึ้นไป แป้งไม่ต่ำกว่า 32% จ่ายสด/โอนทันทีหน้าตาชั่ง",
    itemDetailSummary:
      "รับซื้อต่อเนื่องทุกวันเพื่อขึ้นตู้คอนเทนเนอร์ส่งออก มีทีมคัดเกรดมาตรฐานชัดเจน ไม่กดราคาชาวสวน",
    pricePerKg: 170,
    priceUnitLabel: "ต่อกิโลกรัม",
    quantityKg: 30000,
    dryMatterPct: 32.0,
    availableDate: "28/10/2026",
    isPriceOutlier: false,
    reportCount: 0,
    createdAt: "วันนี้ • 07:29 น.",
    contactNote: "ส่งรูปตัวอย่างผลผลิตในแชทเพื่อประเมินคิวเข้าตัดได้เลย",
  },
  {
    id: 202,
    authorName: "HorizonFruitExport",
    businessName: "บริษัท ฮอไรซอน ฟรุ๊ต เอ็กซ์พอร์ต จำกัด",
    authorRole: "BUYER",
    isKycVerified: true,
    rating: 5.0,
    reviewCount: 64,
    trustScore: 100,
    postType: "BUY",
    variety: "ชะนี",
    grade: "AB / C",
    regionTag: "ภาคตะวันออก",
    province: "จันทบุรี",
    district: "ขลุง",
    title: "รับซื้อทุเรียนชะนี & พวงมณี จำนวนมาก เข้าโรงงานและส่งออก",
    content:
      "รับซื้อทั้งเกรด AB ลูกสวยส่งออก และเกรดรอง C มีทีมรถรับถึงหน้าสวนสำหรับสวนที่มีปริมาณ 2 ตันขึ้นไป",
    itemDetailSummary:
      "จุดรับซื้อหลัก อ.ขลุง จ.จันทบุรี มีหนังสือสัญญาซื้อขายชัดเจน โอนเงินไว",
    pricePerKg: 130,
    priceUnitLabel: "ต่อกิโลกรัม",
    quantityKg: 15000,
    availableDate: "29/10/2026",
    isPriceOutlier: false,
    reportCount: 0,
    createdAt: "เมื่อวาน • 12:17 น.",
    contactNote: "รับซื้อจริง มีทะเบียนพาณิชย์และทะเบียนล้งถูกต้อง",
  },

  // --- CUT_SERVICE ORDERS (ทีมรับตัดทุเรียน) ---
  {
    id: 301,
    authorName: "ArielCutterTeam",
    businessName: "ทีมช่างเอก มือตัดสายตะวันออก-ใต้ (ทีม 8 คน)",
    authorRole: "CUTTER",
    isKycVerified: true,
    rating: 5.0,
    reviewCount: 51,
    trustScore: 100,
    postType: "CUT_SERVICE",
    variety: "หมอนทอง",
    grade: "ทุกเกรดส่งออก",
    regionTag: "ภาคตะวันออก",
    province: "ระยอง",
    district: "แกลง",
    title: "ทีมตัดมืออาชีพ 8 คน พร้อมเครื่องวัดแป้งดิจิทัล",
    content:
      "รับจ้างตัดทุเรียนโซนจันทบุรี ระยอง ตราด และวิ่งงานชุมพร มือตัดผ่านการอบรมกรมวิชาการเกษตร ไม่ตัดทุเรียนอ่อน รับประกันความเสียหาย",
    itemDetailSummary:
      "อุปกรณ์ครบ: รถกระบะลำเลียง 2 คัน เข่งมาตรฐาน มีดคัดเกรด และเครื่องวัดเปอร์เซ็นต์แป้ง",
    pricePerKg: 5,
    priceUnitLabel: "ต่อกิโลกรัม (ค่าแรงตัด)",
    quantityKg: 12000,
    availableDate: "01/11/2026",
    isPriceOutlier: false,
    reportCount: 0,
    createdAt: "เมื่อวาน • 21:01 น.",
    contactNote: "ทักแชทเพื่อนัดจองคิวตัดล่วงหน้าได้เลยครับ",
  },
  {
    id: 302,
    authorName: "Z3RODA7_Cutter",
    businessName: "ทีมตัดทุเรียนหนุ่มชุมพร (สายใต้-ชายแดนใต้)",
    authorRole: "CUTTER",
    isKycVerified: true,
    rating: 4.8,
    reviewCount: 23,
    trustScore: 100,
    postType: "CUT_SERVICE",
    variety: "ทุเรียนบาตามัส",
    grade: "AB / พื้นบ้าน",
    regionTag: "ภาคใต้",
    province: "ชุมพร",
    district: "หลังสวน",
    title: "รับเหมาตัดทุเรียนต้นสูง & ทุเรียนสวนผสม ทีมงาน 6 คน",
    content:
      "ชำนาญการขึ้นต้นสูงทั้งหมอนทอง ชะนี และทุเรียนพื้นบ้านภาคใต้ คัดความแก่แม่นยำ ส่งงานตรงเวลา",
    itemDetailSummary:
      "รับงานตั้งแต่ชุมพร สุราษฎร์ธานี นครศรีฯ ลงไปถึงยะลา-ปัตตานี คิดเรทตามน้ำหนักจริงหน้าล้ง",
    pricePerKg: 5.5,
    priceUnitLabel: "ต่อกิโลกรัม (ค่าแรงตัด)",
    quantityKg: 10000,
    availableDate: "03/11/2026",
    isPriceOutlier: false,
    reportCount: 0,
    createdAt: "25 ต.ค. • 14:20 น.",
    contactNote: "คิวว่างช่วงต้นเดือนพฤศจิกายน ทักจองคิวได้ครับ",
  },
];

// ============================================================================
// 4. ข้อความด่วนในห้องแชท (Quick Reply Chips - อ้างอิงแถบด้านล่างรูปที่ 5)
// ============================================================================
export const QUICK_REPLY_CHIPS: string[] = [
  "👋 สวัสดีครับ",
  "✨ สนใจรายการนี้",
  "🌱 ทุเรียนยังอยู่ไหม/พร้อมตัดวันไหน?",
  "💰 ต่อรองราคาได้ไหมครับ?",
  "🙏 ขอบคุณครับ",
  "🧪 ตรวจเปอร์เซ็นต์แป้งหรือยัง?",
  "✅ พร้อมนัดดูสวน/เข้าล้ง",
  "⏳ รอสักครู่ครับ",
];

export const INITIAL_ROLE_REQUESTS: RoleVerificationItem[] = [
  {
    id: 1,
    userName: "คุณสมชาย ชาวสวนจันท์",
    currentPrimaryRole: "SELLER",
    requestedRole: "CUTTER",
    businessName: "ทีมรับตัดทุเรียนสมชายบริการ (ทีม 6 คน)",
    licenseNumber: "CERT-DOA-2569-104",
    documentType: "ใบผ่านการอบรมนักตัดทุเรียนมืออาชีพ (กรมวิชาการเกษตร)",
    documentName: "หนังสือรับรองนักตัดทุเรียนคุณภาพ_สมชาย.pdf",
    note: "สมัครตอนแรกเป็นชาวสวนผู้ขาย ตอนนี้ต้องการเปิดรับจ้างตัดทุเรียนให้สวนข้างเคียงด้วย จึงส่งใบรับรองมาให้คัดกรองครับ",
    status: "PENDING",
    createdAt: "27/10/2026 14:30",
  },
];
