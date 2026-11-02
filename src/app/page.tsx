"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { AuthBrandPanel } from "@/components/auth-brand-panel";
import { Button, PageHeading } from "@/components/ui";
import { DialogFrame } from "@/components/dialog-frame";
import { ListingCard } from "@/components/listing-card";
import React, { useState, useMemo, useEffect } from "react";
import {
  ShieldCheck,
  Sprout,
  Store,
  Scissors,
  MapPin,
  Calendar,
  Search,
  MessageSquare,
  Star,
  ArrowLeft,
  ArrowRight,
  Share2,
  Copy,
  AlertTriangle,
  Send,
  Plus,
  CheckCircle2,
  Check,
  CheckCheck,
  LogOut,
  UserCheck,
  FileCheck2,
  BarChart3,
  Layers,
  Sparkles,
  Info,
  Clock,
  ChevronRight,
  Upload,
  X,
  Mail,
  KeyRound,
  RefreshCw,
  ExternalLink,
  Lock,
  Handshake,
  User,
  Package,
  Sliders,
  Gift,
  TrendingUp,
  BookOpen,
  Zap,
  ChevronDown,
  ChevronUp,
  Camera,
  FileText,
  Flag,
} from "lucide-react";
import {
  REGIONAL_SEASONS_DATA,
  VARIETY_STRIP_ITEMS,
  INITIAL_POSTS,
  QUICK_REPLY_CHIPS,
  RoleType,
  PostType,
  MarketplacePostItem,
  ChatRoomItem,
  ChatMessageItem,
  DURIAN_GRADES_CONFIG,
  DurianGradeKey,
  buildGradesForVariety,
} from "@/data/mockData";

const ROLE_CONFIG: Record<
  RoleType,
  {
    title: string;
    shortTitle: string;
    subtitle: string;
    badgeBg: string;
    accentText: string;
    allowedPostType: PostType;
    actionLabel: string;
  }
> = {
  SELLER: {
    title: "ผู้ขายทุเรียน (ชาวสวน)",
    shortTitle: "ชาวสวนผู้ขาย",
    subtitle: "ประกาศขายผลผลิตหน้าสวน ตรวจสอบราคารับซื้อหน้าล้ง และดีลกับล้งโดยตรง",
    badgeBg: "bg-brand-soft text-brand-ink border-brand-line",
    accentText: "text-brand-ink",
    allowedPostType: "SELL",
    actionLabel: "ลงประกาศขายทุเรียนหน้าสวน",
  },
  BUYER: {
    title: "ผู้ซื้อทุเรียน (ล้ง / พ่อค้า)",
    shortTitle: "ล้งรับซื้อ",
    subtitle: "ตั้งราคารับซื้อหน้าล้งประจำวัน ค้นหาสวนพร้อมตัด และเจรจาซื้อขาย",
    badgeBg: "bg-info-soft text-info-ink border-info-line",
    accentText: "text-info-ink",
    allowedPostType: "BUY",
    actionLabel: "ตั้งประกาศรับซื้อทุเรียนหน้าล้ง",
  },
  CUTTER: {
    title: "ผู้รับตัดทุเรียน (ทีมตัด)",
    shortTitle: "ทีมรับตัดทุเรียน",
    subtitle: "ประกาศคิวว่างรับจ้างตัดทุเรียน คัดเปอร์เซ็นต์แป้ง และรับงานจากสวน/ล้ง",
    badgeBg: "bg-warning-soft text-warning-ink border-warning-line",
    accentText: "text-warning-ink",
    allowedPostType: "CUT_SERVICE",
    actionLabel: "ลงประกาศคิวว่างรับตัดทุเรียน",
  },
  ADMIN: {
    title: "ผู้ดูแลระบบ (Admin)",
    shortTitle: "Admin",
    subtitle: "ตรวจสอบเอกสารขอเพิ่มบทบาทที่ 2 และคัดกรองโพสต์ราคาผิดปกติ",
    badgeBg: "bg-accent-soft text-accent-ink border-accent-line",
    accentText: "text-accent-ink",
    allowedPostType: "SELL",
    actionLabel: "จัดการระบบ",
  },
};

// ฟังก์ชันแปลงเวลาแบบ Relative Time (เช่น เมื่อ 5 นาทีที่แล้ว, เมื่อ 1 ชั่วโมงที่แล้ว, เมื่อวานนี้)
function formatRelativeTime(dateString: string | undefined): { text: string; full: string } {
  if (!dateString) return { text: "เมื่อสักครู่", full: "" };

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return { text: dateString, full: dateString };

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const full = date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diffInSeconds < 60) {
    return { text: "เมื่อสักครู่", full };
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return { text: `เมื่อ ${diffInMinutes} นาทีที่แล้ว`, full };
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return { text: `เมื่อ ${diffInHours} ชั่วโมงที่แล้ว`, full };
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return {
      text: `เมื่อวานนี้ ${date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}`,
      full,
    };
  }
  if (diffInDays < 7) {
    return { text: `เมื่อ ${diffInDays} วันที่แล้ว`, full };
  }
  return {
    text: date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
    }),
    full,
  };
}

// Localization dictionary for TH and EN
const I18N_DICT = {
  TH: {
    navRoleHome: "หน้าหลัก",
    navDashboard: "ราคาตลาด",
    navMarket: "ตลาดกลาง",
    navChat: "ข้อความ",
    roleLabel: "บทบาท:",
    addRoleBtn: "+ ขอเพิ่มบทบาท",
    profileMenu: "โปรไฟล์ & รูปภาพ",
    myPostsMenu: "ประวัติการโพสต์ของคุณ",
    settingsMenu: "ตั้งค่าบทบาท / บัญชี",
    statsMenu: "สถิติตลาดกลาง",
    guideMenu: "คู่มือการใช้งาน",
    logoutMenu: "ออกจากระบบ",
    welcome: "สวัสดีครับ,",
    verifiedBadge: "ยืนยันตัวตนแล้ว",
    newPostBtn: "+ ลงประกาศใหม่",
    goToMarketBtn: "ไปที่ตลาดกลาง",
    recentPostsTitle: "ประกาศล่าสุด",
    seeAllInMarket: "ดูทั้งหมดในตลาดกลาง →",
    myPostsModalTitle: "ประวัติการโพสต์ของคุณ",
    myPostsModalSub: "รายการประกาศซื้อ ขาย และรับตัดทุเรียนทั้งหมดที่คุณเคยลงไว้",
    noPostsYet: "คุณยังไม่มีประกาศในตลาดกลาง",
    createFirstPost: "+ เริ่มสร้างประกาศแรกของคุณ",
    editProfileTitle: "จัดการโปรไฟล์ & รูปภาพ",
    editProfileSub: "อัปโหลดรูปโปรไฟล์และแก้ไขข้อมูลส่วนตัวของคุณ",

    // Regional Dashboard
    heroBadge: "แดชบอร์ดทุเรียนรายภูมิภาค & ฤดูกาลผลผลิต",
    heroTitle: "ราคาทุเรียนรายพื้นที่",
    heroSub: "เปรียบเทียบราคาเสนอซื้อ–ขาย สายพันธุ์ และช่วงเก็บเกี่ยวในแต่ละภูมิภาค",
    avgBuyPriceLabel: "รับซื้อเฉลี่ย",
    perKg: "/กก.",
    realPosts: "ประกาศจริง",
    provincesLabel: "พื้นที่จังหวัด:",
    varietiesLabel: "สายพันธุ์:",
    preSeasonLabel: "ก่อนฤดูกาล:",
    peakSeasonLabel: "ผลผลิตออกชุก:",
    inDepthTitle: "เจาะลึกข้อมูลราคารายพื้นที่",
    harvestPeriodLabel: "ช่วงผลผลิตออก",
    avgGardenPrice: "ราคาหน้าสวนเฉลี่ย",
    avgLhongPrice: "ราคารับซื้อหน้าล้งเฉลี่ย",
    avgCutWage: "ค่าจ้างตัดเฉลี่ย",
    liveCalcNotice: "คำนวณสดจากประกาศจริง",
    liveCalcNoticeSub: "อัปเดตราคาซื้อ-ขาย และกราฟแท่งตามข้อมูลจริงในตลาดกลาง",
    gradeFilterTitle: "ตัวกรองเกรดทุเรียน:",
    gradeFilterSub: "คลิกเพื่อดูราคาเจาะจงรายเกรด",
    allGradesTab: "ทุกเกรด (ตารางรวม)",
    gradeAShort: "เกรด A",
    gradeBShort: "เกรด B",
    gradeCShort: "เกรด C",
    gradeDShort: "เกรด D ตกไซซ์",
    matrixTableTitle: "ตารางราคารับซื้อล้ง vs ขายหน้าสวน แยกตามเกรด",
    matrixUnit: "หน่วย: บาท/กก.",
    varietyCol: "สายพันธุ์",
    exportLabel: "(ส่งออก)",
    subExportLabel: "(รองส่งออก)",
    domesticLabel: "(ในประเทศ)",
    underSizeLabel: "(ตกไซซ์)",
    buyPriceLegend: "ราคารับซื้อหน้าล้ง",
    sellPriceLegend: "ราคาขายหน้าสวน",
    singleGradeDesc: "คำอธิบายมาตรฐานเกรด:",
    minDryMatter: "เปอร์เซ็นต์แป้งขั้นต่ำ:",
    gradePriceInRegion: "ราคาทุเรียนในพื้นที่",

    // Role Home
    primaryAreaLabel: "พื้นที่หลักของคุณ:",
    quickAction1Title: "ตรวจราคากลางแยกพื้นที่",
    quickAction1Desc: "ดูกราฟและราคาเฉลี่ยล่าสุดแยกตามภูมิภาค",
    quickAction2Title: "ตลาดกลางทุเรียนสด",
    quickAction2Desc: "ดูรายการประกาศขาย รับซื้อ และทีมตัดทุเรียน",
    quickAction3Title: "ห้องแชท & เจรจาปิดดีล",
    quickAction3Desc: "พูดคุยต่อรองราคาและยืนยันสัญญากับคู่ค้า",
    viewOfferBtn: "ดูข้อเสนอ",

    // Marketplace
    marketTitle: "ตลาดกลางทุเรียน",
    marketSub: "ค้นหาประกาศขาย รับซื้อ และบริการตัด ตามสายพันธุ์และพื้นที่",
    searchPlaceholder: "ค้นหาชื่อสวน, ล้ง, พันธุ์ทุเรียน, จังหวัด...",
    allRegions: "ทุกภูมิภาค",
    allVarieties: "ทุกสายพันธุ์",
    filterRecent7Days: "เฉพาะประกาศสดใหม่ 7 วันล่าสุด",
    freshCountLabel: "รายการสดใหม่",
    colSellTitle: "ประกาศขาย",
    colBuyTitle: "ประกาศรับซื้อ",
    colCutTitle: "บริการตัด",
    statusActive: "กำลังเปิดรับ",
    statusClosed: "ปิดดีลแล้ว",
    chatDealBtn: "แชทเจรจา / ดูข้อเสนอ",
    postCardVariety: "พันธุ์",
    postCardGrade: "เกรด",
    postCardProvince: "จ.",
    postCardQty: "กก.",
    postCardPriceOffer: "ราคาเสนอ",

    // Chat
    chatHeaderTitle: "ห้องแชทเจรจาซื้อขาย & ทำสัญญาปิดดีล",
    chatHeaderSub: "พูดคุยสดกับคู่ค้าและกดทำสัญญาซื้อขายจริงบันทึกลงระบบ",
    dealButton: "ตกลงราคา (ปิดดีล)",
    typeMessagePlaceholder: "พิมพ์ข้อความแชท...",
    sendBtn: "ส่งข้อความ",
    allChatRooms: "ห้องแชททั้งหมด",

    // Auth & Landing
    authBrandSubtitle: "แพลตฟอร์มตลาดกลางทุเรียนไทยครบวงจร เชื่อมโยงชาวสวนผู้ขาย ล้งรับซื้อ และทีมรับตัดทุเรียน พร้อมแดชบอร์ดราคากลางและฤดูกาลทุเรียนทั้ง 6 ภูมิภาค",
    authRoleTitle: "ระบบแยกบทบาทชัดเจน (Role-Based System)",
    authRoleDesc: "ตอนสมัครเลือกได้ 1 บทบาทหลัก หากต้องการเพิ่มบทบาทที่ 2 ต้องส่งเอกสารคัดกรองเพื่อป้องกันการปั่นราคา",
    authDashboardTitle: "แดชบอร์ดราคาและฤดูกาลทุเรียนรายพื้นที่",
    authDashboardDesc: "เช็กช่วงเดือนทุเรียนสุกและเปรียบเทียบราคารับซื้อ-ขายจริงในแต่ละภูมิภาค",
    tabLogin: "เข้าสู่ระบบ",
    tabRegister: "สมัครสมาชิก",
    loginTitle: "ยินดีต้อนรับเข้าสู่ Durian Hub",
    loginSub: "กรุณาเข้าสู่ระบบด้วยอีเมลหรือเบอร์โทรศัพท์ของคุณ",
    identifierLabel: "อีเมล หรือ เบอร์โทรศัพท์",
    identifierPlaceholder: "เช่น seller@durian.com หรือ 089-456-7890",
    passwordLabel: "รหัสผ่าน",
    passwordPlaceholder: "กรอกรหัสผ่านของคุณ",
    forgotPasswordBtn: "ลืมรหัสผ่าน?",
    loginRoleLabel: "เลือกบทบาทที่จะเข้าใช้งาน",
    loginSubmitBtn: "เข้าสู่ระบบ",
    loggingInBtn: "กำลังเข้าสู่ระบบ...",
    demoNotice: "บัญชีทดสอบในระบบ (รหัสผ่านคือ password123):",
    regTitle: "สมัครสมาชิกผู้ใช้งานใหม่",
    regSub: "กรอกข้อมูลเพื่อเริ่มต้นซื้อขายทุเรียนใน Durian Hub",
    regFullNameLabel: "ชื่อ-นามสกุลจริง",
    regFullNamePlaceholder: "เช่น สมชาย มั่นคง",
    regEmailLabel: "อีเมล (ใช้รับรหัส OTP ยืนยันตัวตน)",
    regEmailPlaceholder: "เช่น yourname@gmail.com",
    regPhoneLabel: "เบอร์โทรศัพท์",
    regPhonePlaceholder: "เช่น 089-123-4567",
    regPasswordLabel: "รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)",
    regPasswordPlaceholder: "ตั้งรหัสผ่านสำหรับเข้าสู่ระบบ",
    regBusinessLabel: "ชื่อสวน / ชื่อล้ง / ชื่อทีมตัด",
    regBusinessPlaceholder: "เช่น สวนทุเรียนลุงสมชาย GAP",
    regRegionLabel: "ภูมิภาคหลักของคุณ",
    regProvinceLabel: "จังหวัด",
    regRoleLabel: "เลือกบทบาทหลักของคุณ (เลือกได้ 1 บทบาท)",
    regRoleWarning: "หมายเหตุ: หากต้องการสวมบทบาทที่ 2 เพิ่มเติม จะต้องยื่นเอกสารขออนุมัติจาก Admin หลังเข้าสู่ระบบ เพื่อป้องกันการปั่นราคา",
    regSubmitBtn: "สมัครสมาชิก (รับ OTP ยืนยันอีเมล)",
    registeringBtn: "กำลังส่งข้อมูลสมัคร...",
    otpModalTitle: "ยืนยันรหัส OTP ทางอีเมล",
    otpModalSub: "ระบบได้ส่งรหัส OTP 6 หลักไปยังอีเมล",
    otpCodeLabel: "รหัส OTP 6 หลัก",
    otpVerifyBtn: "ยืนยันรหัส OTP",
    otpVerifyingBtn: "กำลังตรวจสอบรหัส...",
    otpResendBtn: "ส่งรหัสใหม่อีกครั้ง",
    otpMailpitNotice: "สำหรับทดสอบระบบในเครื่อง (Local Dev):",
    otpOpenMailpitBtn: "เปิด Mailpit Web UI (พอร์ต 8025)",
    forgotModalTitle: "รีเซ็ตรหัสผ่านใหม่",
    forgotStep1Sub: "กรอกอีเมลที่ลงทะเบียนไว้เพื่อรับรหัส OTP 6 หลัก",
    forgotStep2Sub: "กรอกรหัส OTP ที่ได้รับทางอีเมล และกำหนดรหัสผ่านใหม่",
    forgotEmailLabel: "อีเมลที่ลงทะเบียนไว้",
    forgotSendOtpBtn: "ส่งรหัส OTP ไปยังอีเมล",
    forgotNewPassLabel: "ตั้งรหัสผ่านใหม่",
    forgotConfirmPassLabel: "ยืนยันรหัสผ่านใหม่อีกครั้ง",
    forgotSaveBtn: "บันทึกรหัสผ่านใหม่",
    forgotSavingBtn: "กำลังบันทึกรหัสผ่าน...",
  },
  EN: {
    navRoleHome: "Home",
    navDashboard: "Market prices",
    navMarket: "Marketplace",
    navChat: "Messages",
    roleLabel: "Role:",
    addRoleBtn: "+ Add Role",
    profileMenu: "Profile & Avatar",
    myPostsMenu: "My Post History",
    settingsMenu: "Role & Account Settings",
    statsMenu: "Market Statistics",
    guideMenu: "User Guide",
    logoutMenu: "Logout",
    welcome: "Welcome,",
    verifiedBadge: "Verified Identity",
    newPostBtn: "+ Create Post",
    goToMarketBtn: "Go to Marketplace",
    recentPostsTitle: "Recent listings",
    seeAllInMarket: "View All in Marketplace →",
    myPostsModalTitle: "My Post History",
    myPostsModalSub: "All your active and closed marketplace listings",
    noPostsYet: "You haven't posted any listings yet",
    createFirstPost: "+ Create Your First Listing",
    editProfileTitle: "Profile & Avatar Settings",
    editProfileSub: "Upload your avatar and manage personal information",

    // Regional Dashboard
    heroBadge: "Regional Durian Seasons & Production Planning",
    heroTitle: "Regional durian prices",
    heroSub: "Compare asking prices, varieties and harvest seasons across Thailand.",
    avgBuyPriceLabel: "Avg Buy Price",
    perKg: "/kg",
    realPosts: "Live Posts",
    provincesLabel: "Key Provinces:",
    varietiesLabel: "Varieties:",
    preSeasonLabel: "Early Season:",
    peakSeasonLabel: "Peak Harvest:",
    inDepthTitle: "Regional Price In-Depth Analysis",
    harvestPeriodLabel: "Harvest Window",
    avgGardenPrice: "Avg Farm-Gate Price",
    avgLhongPrice: "Avg Lhong Buy Price",
    avgCutWage: "Avg Cutting Wage",
    liveCalcNotice: "Calculated live from actual listings",
    liveCalcNoticeSub: "Prices and indicators update dynamically from active market transactions",
    gradeFilterTitle: "Durian Grade Filter:",
    gradeFilterSub: "Click to focus on specific grade pricing",
    allGradesTab: "All Grades (Matrix)",
    gradeAShort: "Grade A",
    gradeBShort: "Grade B",
    gradeCShort: "Grade C",
    gradeDShort: "Grade D Under-size",
    matrixTableTitle: "Price Matrix: Lhong Buy vs Farm-Gate by Grade",
    matrixUnit: "Unit: THB/kg",
    varietyCol: "Variety",
    exportLabel: "(Export)",
    subExportLabel: "(Premium)",
    domesticLabel: "(Domestic)",
    underSizeLabel: "(Under-size)",
    buyPriceLegend: "Lhong Buy Price",
    sellPriceLegend: "Farm-Gate Sell Price",
    singleGradeDesc: "Grade Standard Details:",
    minDryMatter: "Minimum Dry Matter %:",
    gradePriceInRegion: "Durian Prices in",

    // Role Home
    primaryAreaLabel: "Primary Area:",
    quickAction1Title: "Check Regional Prices",
    quickAction1Desc: "View real-time charts and average prices by region",
    quickAction2Title: "Live Durian Marketplace",
    quickAction2Desc: "Browse sell orders, buy orders, and cutting crews",
    quickAction3Title: "Live Chat & Deal Making",
    quickAction3Desc: "Negotiate pricing and confirm digital trading deals",
    viewOfferBtn: "View Offer",

    // Marketplace
    marketTitle: "Durian marketplace",
    marketSub: "Find sellers, buyers and cutting services by variety and region.",
    searchPlaceholder: "Search by garden, lhong, variety, province...",
    allRegions: "All Regions",
    allVarieties: "All Varieties",
    filterRecent7Days: "Fresh listings from past 7 days only",
    freshCountLabel: "Fresh Listings",
    colSellTitle: "For sale",
    colBuyTitle: "Buying",
    colCutTitle: "Cutting services",
    statusActive: "Active",
    statusClosed: "Deal Closed",
    chatDealBtn: "Chat & Negotiate",
    postCardVariety: "Variety: ",
    postCardGrade: "Grade: ",
    postCardProvince: "Prov: ",
    postCardQty: "Qty: ",
    postCardPriceOffer: "Offer Price",

    // Chat
    chatHeaderTitle: "Live Chat & Digital Deal Contract",
    chatHeaderSub: "Real-time chat with trading partners and confirm binding digital deals",
    dealButton: "Confirm Deal (Close Deal)",
    typeMessagePlaceholder: "Type your message...",
    sendBtn: "Send Message",
    allChatRooms: "All Chat Rooms",

    // Auth & Landing
    authBrandSubtitle: "Comprehensive Thailand Durian Marketplace connecting orchard sellers, lhong buyers, and cutting crews with regional benchmark prices and seasonal dashboards.",
    authRoleTitle: "Role-Based Marketplace System",
    authRoleDesc: "Select 1 primary role during registration. Additional roles require verification to prevent market price manipulation.",
    authDashboardTitle: "Regional Price & Season Dashboard",
    authDashboardDesc: "Check harvesting windows and compare live buy-sell prices across 6 regions.",
    tabLogin: "Login",
    tabRegister: "Create Account (1 Role)",
    loginTitle: "Welcome to Durian Hub",
    loginSub: "Please log in with your email or phone number",
    identifierLabel: "Email or Phone Number",
    identifierPlaceholder: "e.g. seller@durian.com or 089-456-7890",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    forgotPasswordBtn: "Forgot Password?",
    loginRoleLabel: "Select Role to enter",
    loginSubmitBtn: "Log In",
    loggingInBtn: "Logging in...",
    demoNotice: "Demo test accounts (Password: password123):",
    regTitle: "Create New Account",
    regSub: "Fill in your details to start trading on Durian Hub",
    regFullNameLabel: "Full Name",
    regFullNamePlaceholder: "e.g. Somchai Mankong",
    regEmailLabel: "Email (Required for OTP verification)",
    regEmailPlaceholder: "e.g. yourname@gmail.com",
    regPhoneLabel: "Phone Number",
    regPhonePlaceholder: "e.g. 089-123-4567",
    regPasswordLabel: "Password (min 6 characters)",
    regPasswordPlaceholder: "Create a secure password",
    regBusinessLabel: "Garden / Warehouse / Team Name",
    regBusinessPlaceholder: "e.g. Somchai GAP Orchard",
    regRegionLabel: "Primary Region",
    regProvinceLabel: "Province",
    regRoleLabel: "Select Primary Role (1 role required)",
    regRoleWarning: "Note: Holding a secondary role requires Admin document verification after login to maintain marketplace integrity.",
    regSubmitBtn: "Create Account (Receive OTP via Email)",
    registeringBtn: "Creating Account...",
    otpModalTitle: "Verify Email with OTP",
    otpModalSub: "A 6-digit OTP code has been sent to your email",
    otpCodeLabel: "6-Digit OTP Code",
    otpVerifyBtn: "Verify OTP Code",
    otpVerifyingBtn: "Verifying...",
    otpResendBtn: "Resend OTP Code",
    otpMailpitNotice: "For local development testing (Mailpit):",
    otpOpenMailpitBtn: "Open Mailpit Web UI (Port 8025)",
    forgotModalTitle: "Reset Password",
    forgotStep1Sub: "Enter your registered email to receive a 6-digit OTP code",
    forgotStep2Sub: "Enter the OTP code received via email and create your new password",
    forgotEmailLabel: "Registered Email",
    forgotSendOtpBtn: "Send OTP to Email",
    forgotNewPassLabel: "New Password",
    forgotConfirmPassLabel: "Confirm New Password",
    forgotSaveBtn: "Save New Password",
    forgotSavingBtn: "Saving New Password...",
  },
};

// 77 Provinces English Mapping directly from E:\Documents\thai-address-2026.10.xlsx
const PROVINCES_EN_MAP: Record<string, string> = {
  "กรุงเทพมหานคร": "Bangkok",
  "สมุทรปราการ": "Samut Prakan",
  "นนทบุรี": "Nonthaburi",
  "ปทุมธานี": "Pathum Thani",
  "พระนครศรีอยุธยา": "Phra Nakhon Si Ayutthaya",
  "อยุธยา": "Phra Nakhon Si Ayutthaya",
  "อ่างทอง": "Ang Thong",
  "ลพบุรี": "Lop Buri",
  "สิงห์บุรี": "Sing Buri",
  "ชัยนาท": "Chai Nat",
  "สระบุรี": "Saraburi",
  "ชลบุรี": "Chon Buri",
  "ระยอง": "Rayong",
  "จันทบุรี": "Chanthaburi",
  "ตราด": "Trat",
  "ฉะเชิงเทรา": "Chachoengsao",
  "ปราจีนบุรี": "Prachin Buri",
  "นครนายก": "Nakhon Nayok",
  "สระแก้ว": "Sa Kaeo",
  "นครราชสีมา": "Nakhon Ratchasima",
  "บุรีรัมย์": "Buri Ram",
  "สุรินทร์": "Surin",
  "ศรีสะเกษ": "Si Sa Ket",
  "อุบลราชธานี": "Ubon Ratchathani",
  "ยโสธร": "Yasothon",
  "ชัยภูมิ": "Chaiyaphum",
  "อำนาจเจริญ": "Amnat Charoen",
  "บึงกาฬ": "Bueng Kan",
  "หนองบัวลำภู": "Nong Bua Lam Phu",
  "ขอนแก่น": "Khon Kaen",
  "อุดรธานี": "Udon Thani",
  "เลย": "Loei",
  "หนองคาย": "Nong Khai",
  "มหาสารคาม": "Maha Sarakham",
  "ร้อยเอ็ด": "Roi Et",
  "กาฬสินธุ์": "Kalasin",
  "สกลนคร": "Sakon Nakhon",
  "นครพนม": "Nakhon Phanom",
  "มุกดาหาร": "Mukdahan",
  "เชียงใหม่": "Chiang Mai",
  "ลำพูน": "Lamphun",
  "ลำปาง": "Lampang",
  "อุตรดิตถ์": "Uttaradit",
  "แพร่": "Phrae",
  "น่าน": "Nan",
  "พะเยา": "Phayao",
  "เชียงราย": "Chiang Rai",
  "แม่ฮ่องสอน": "Mae Hong Son",
  "นครสวรรค์": "Nakhon Sawan",
  "อุทัยธานี": "Uthai Thani",
  "กำแพงเพชร": "Kamphaeng Phet",
  "ตาก": "Tak",
  "สุโขทัย": "Sukhothai",
  "พิษณุโลก": "Phitsanulok",
  "พิจิตร": "Phichit",
  "เพชรบูรณ์": "Phetchabun",
  "ราชบุรี": "Ratchaburi",
  "กาญจนบุรี": "Kanchanaburi",
  "สุพรรณบุรี": "Suphan Buri",
  "นครปฐม": "Nakhon Pathom",
  "สมุทรสาคร": "Samut Sakhon",
  "สมุทรสงคราม": "Samut Songkhram",
  "เพชรบุรี": "Phetchaburi",
  "ประจวบคีรีขันธ์": "Prachuap Khiri Khan",
  "นครศรีธรรมราช": "Nakhon Si Thammarat",
  "กระบี่": "Krabi",
  "พังงา": "Phang-nga",
  "ภูเก็ต": "Phuket",
  "สุราษฎร์ธานี": "Surat Thani",
  "ระนอง": "Ranong",
  "ชุมพร": "Chumphon",
  "สงขลา": "Songkhla",
  "สตูล": "Satun",
  "ตรัง": "Trang",
  "พัทลุง": "Phatthalung",
  "ปัตตานี": "Pattani",
  "ยะลา": "Yala",
  "นราธิวาส": "Narathiwat",
};

function translateProvinceName(province: string | undefined, lang: "TH" | "EN"): string {
  if (!province) return "";
  if (lang === "TH") return province;
  const trimmed = province.trim();
  return PROVINCES_EN_MAP[trimmed] || province;
}

function translateRegionName(name: string, lang: "TH" | "EN"): string {
  if (lang === "TH") return name;
  const map: Record<string, string> = {
    "ภาคตะวันออก": "Eastern Region",
    "ภาคเหนือ": "Northern Region",
    "ภาคกลาง": "Central Region",
    "ภาคอีสาน": "Northeastern Region",
    "ภาคใต้": "Southern Region",
    "3 จังหวัดชายแดนใต้": "3 Southern Border Provinces",
  };
  return map[name] || name;
}

function translateSeasonText(text: string, lang: "TH" | "EN"): string {
  if (lang === "TH") return text;
  return text
    .replace("ก.พ.", "Feb")
    .replace("มี.ค.", "Mar")
    .replace("เม.ย.", "Apr")
    .replace("พ.ค.", "May")
    .replace("มิ.ย.", "Jun")
    .replace("ก.ค.", "Jul")
    .replace("ส.ค.", "Aug")
    .replace("ก.ย.", "Sep")
    .replace("ต.ค.", "Oct")
    .replace("พ.ย.", "Nov")
    .replace("ธ.ค.", "Dec")
    .replace("ม.ค.", "Jan")
    .replace("ผลผลิตนอกฤดูกาล", "Off-season")
    .replace("ผลผลิตตามฤดูกาล", "In-season")
    .replace("ผลผลิตช่วงปลาย", "Late season");
}

function translateVarietyName(variety: string, lang: "TH" | "EN"): string {
  if (lang === "TH") return variety;
  const map: Record<string, string> = {
    "หมอนทอง": "Monthong",
    "ชะนี": "Chanee",
    "ก้านยาว": "Kanyao",
    "กระดุม": "Kradoom",
    "พวงมณี": "Puangmanee",
    "หลงลับแล": "Long Laplae",
    "หลินลับแล": "Lin Laplae",
    "มูซังคิง": "Musang King",
    "โอวฉี่ (หนามดำ)": "Black Thorn (Ochee)",
    "ทุเรียนพื้นบ้าน": "Native Varieties",
  };
  return map[variety] || variety;
}

export default function DurianHubApp() {
  // ==========================================================================
  // 1. AUTHENTICATION STATE (หน้าแรกต้อง Login / สมัครสมาชิกก่อนเสมอ)
  // ==========================================================================
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  // Login / Register Form States
  const [loginEmailOrPhone, setLoginEmailOrPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRoleSelect, setLoginRoleSelect] = useState<RoleType>("SELLER");

  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regBusinessName, setRegBusinessName] = useState("");
  const [regRegion, setRegRegion] = useState("ภาคตะวันออก");
  const [regProvince, setRegProvince] = useState("จันทบุรี");
  const [regPrimaryRole, setRegPrimaryRole] = useState<RoleType>("SELLER"); // บังคับเลือก 1 บทบาทตอนสมัคร

  // OTP Verification Modal States
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);
  const [otpUserId, setOtpUserId] = useState<number | null>(null);
  const [otpEmail, setOtpEmail] = useState<string>("");
  const [otpPurpose, setOtpPurpose] = useState<"VERIFY_EMAIL" | "RESET_PASSWORD">("VERIFY_EMAIL");
  const [otpCodeInput, setOtpCodeInput] = useState<string>("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [isOtpLoading, setIsOtpLoading] = useState<boolean>(false);

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>("");
  const [forgotStep, setForgotStep] = useState<"EMAIL" | "OTP_NEW_PASSWORD">("EMAIL");
  const [forgotNewPassword, setForgotNewPassword] = useState<string>("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState<string>("");
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState<boolean>(false);

  // Logged-in User Profile State
  const [userProfile, setUserProfile] = useState<{
    id?: number;
    fullName: string;
    avatarUrl?: string | null;
    email?: string;
    phone: string;
    businessName: string;
    province: string;
    primaryRole: RoleType;
    approvedRoles: RoleType[];
    activeRole: RoleType;
    trustScore: number;
    rating: number;
    ratingCount?: number;
    isEmailVerified?: boolean;
  }>({
    fullName: "คุณสมชาย ชาวสวนจันท์",
    avatarUrl: null,
    phone: "089-456-7890",
    businessName: "สวนสมชาย จันทบุรี (GAP Certified)",
    province: "จันทบุรี",
    primaryRole: "SELLER",
    approvedRoles: ["SELLER"],
    activeRole: "SELLER",
    trustScore: 100,
    rating: 5.0,
    ratingCount: 0,
  });

  // User Profile Dropdown & Modal States (ถอดแบบจากภาพตัวอย่าง)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showUserGuideModal, setShowUserGuideModal] = useState<boolean>(false);
  const [showMyPostsModal, setShowMyPostsModal] = useState<boolean>(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [avatarUploadSuccess, setAvatarUploadSuccess] = useState<string | null>(null);

  // Profile Edit Form States
  const [editProfileName, setEditProfileName] = useState<string>("");
  const [editBusinessName, setEditBusinessName] = useState<string>("");
  const [editProfilePhone, setEditProfilePhone] = useState<string>("");
  const [editProfileProvince, setEditProfileProvince] = useState<string>("");
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSaveMsg, setProfileSaveMsg] = useState<string | null>(null);

  // Language state (TH | EN สลับภาษาทำงานจริง)
  const [currentLang, setCurrentLang] = useState<"TH" | "EN">("TH");
  const t = I18N_DICT[currentLang];

  // Chat Rooms State (อ้างอิงรูปที่ 5)
  const [chatRooms, setChatRooms] = useState<ChatRoomItem[]>([]);
  const [activeChatRoomId, setActiveChatRoomId] = useState<number>(0);
  const [chatInputText, setChatInputText] = useState<string>("");
  const [chatFilterTab, setChatFilterTab] = useState<"ACTIVE" | "CLOSED" | "ALL">("ACTIVE");

  const filteredChatRooms = useMemo(() => {
    if (chatFilterTab === "ACTIVE") {
      return chatRooms.filter((r) => (r.status || "ACTIVE") === "ACTIVE");
    }
    if (chatFilterTab === "CLOSED") {
      return chatRooms.filter((r) => r.status === "DEAL_CLOSED" || r.status === "ARCHIVED");
    }
    return chatRooms;
  }, [chatRooms, chatFilterTab]);

  const activeRoomsCount = useMemo(() => {
    return chatRooms.filter((r) => (r.status || "ACTIVE") === "ACTIVE").length;
  }, [chatRooms]);

  const closedRoomsCount = useMemo(() => {
    return chatRooms.filter((r) => r.status === "DEAL_CLOSED" || r.status === "ARCHIVED").length;
  }, [chatRooms]);

  // Floating Chat Toast Notification State
  const [chatToast, setChatToast] = useState<{
    roomId: number;
    senderName: string;
    text: string;
  } | null>(null);
  const lastUnreadMapRef = React.useRef<Record<number, number>>({});
  const isFirstLoadRef = React.useRef(true);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll chat messages to bottom
  useEffect(() => {
    if (activeChatRoomId && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeChatRoomId]);

  // Auto-dismiss chat toast after 5 seconds
  useEffect(() => {
    if (!chatToast) return;
    const timer = setTimeout(() => {
      setChatToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [chatToast]);

  const totalUnreadCount = useMemo(() => {
    return chatRooms.reduce((acc, r) => acc + (r.unreadCount || 0), 0);
  }, [chatRooms]);

  // Deal Modal & Negotiation State
  const [showCloseDealModal, setShowCloseDealModal] = useState<boolean>(false);
  const [dealAgreedPrice, setDealAgreedPrice] = useState<string>("");
  const [dealAgreedPricePerKg, setDealAgreedPricePerKg] = useState<string>("");
  const [dealAgreedQty, setDealAgreedQty] = useState<string>("");
  const [dealCutDate, setDealCutDate] = useState<string>("");
  const [dealNote, setDealNote] = useState<string>("");
  const [dealSuccessMsg, setDealSuccessMsg] = useState<string | null>(null);
  const [dealErrorMsg, setDealErrorMsg] = useState<string | null>(null);
  const [isDealLoading, setIsDealLoading] = useState<boolean>(false);

  // Star Rating Review Modal State (ให้คะแนนคู่ค้า 1-5 ดาว หลังปิดดีล)
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [isReviewLoading, setIsReviewLoading] = useState<boolean>(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);
  const [reviewErrorMsg, setReviewErrorMsg] = useState<string | null>(null);

  // Check existing session on load
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUserProfile(data.user);
            setIsAuthenticated(true);
          }
        }
      } catch (err) {
        console.error("Session check error:", err);
      }
    }
    checkSession();
  }, []);

  // ==========================================================================
  // 2. MAIN NAVIGATION & VIEW STATE (หลังจาก Login สำเร็จ)
  // ==========================================================================
  const [currentView, setCurrentView] = useState<
    | "ROLE_HOME"
    | "REGIONAL_DASHBOARD"
    | "MARKETPLACE"
    | "POST_DETAIL"
    | "CHAT_ROOM"
  >("ROLE_HOME");

  // Fetch real posts from API
  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts");
      if (res.ok) {
        const data = await res.json();
        if (data.posts && data.posts.length > 0) {
          setPosts(data.posts);
        }
      }
    } catch (err) {
      console.error("fetch posts error", err);
    }
  };

  // Fetch chat rooms for current user
  const fetchChatRooms = async () => {
    try {
      const res = await fetch("/api/chat/rooms");
      if (res.ok) {
        const data = await res.json();
        if (data.rooms) {
          // Check for new incoming unread messages to trigger toast notification
          data.rooms.forEach((newRoom: ChatRoomItem) => {
            const prevUnread = lastUnreadMapRef.current[newRoom.id] ?? 0;
            const currentUnread = newRoom.unreadCount ?? 0;
            if (
              !isFirstLoadRef.current &&
              currentUnread > prevUnread &&
              !(currentView === "CHAT_ROOM" && activeChatRoomId === newRoom.id)
            ) {
              setChatToast({
                roomId: newRoom.id,
                senderName: newRoom.partnerName,
                text: newRoom.lastMessage,
              });
            }
            lastUnreadMapRef.current[newRoom.id] = currentUnread;
          });
          isFirstLoadRef.current = false;

          setChatRooms((prev) => {
            return data.rooms.map((newRoom: ChatRoomItem) => {
              const existing = prev.find((r) => r.id === newRoom.id);
              // For the currently open room, preserve its messages to avoid flicker between API calls
              const preserveActive =
                existing &&
                existing.messages &&
                existing.messages.length > 0 &&
                newRoom.id === activeChatRoomId;

              return {
                ...newRoom,
                messages: preserveActive ? existing.messages : (newRoom.messages || existing?.messages || []),
              };
            });
          });
          // If activeChatRoomId was set to a room that no longer exists, reset to 0 (no room selected)
          if (activeChatRoomId && !data.rooms.find((r: ChatRoomItem) => r.id === activeChatRoomId)) {
            setActiveChatRoomId(0);
          }
        }
      }
    } catch (err) {
      console.error("fetch chat rooms error", err);
    }
  };

  // Fetch messages for active chat room (markAsRead only when inside chat room view)
  const fetchMessages = async (roomId: number, markAsRead = false) => {
    try {
      const url = markAsRead
        ? `/api/chat/rooms/${roomId}/messages?markRead=true`
        : `/api/chat/rooms/${roomId}/messages`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          setChatRooms((prev) =>
            prev.map((r) =>
              r.id === roomId
                ? {
                    ...r,
                    unreadCount: markAsRead ? 0 : r.unreadCount,
                    messages: data.messages,
                  }
                : r
            )
          );
          if (markAsRead) {
            lastUnreadMapRef.current[roomId] = 0;
          }
        }
      }
    } catch (err) {
      console.error("fetch messages error", err);
    }
  };

  // Real-time polling effect (every 2 seconds) when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchPosts();
    fetchChatRooms();

    const interval = setInterval(() => {
      fetchChatRooms();
      if (activeChatRoomId) {
        // Mark as read ONLY if the user is actively inside the chat room
        fetchMessages(activeChatRoomId, currentView === "CHAT_ROOM");
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAuthenticated, activeChatRoomId, currentView]);

  // When switching active chat room or navigating to CHAT_ROOM, fetch messages immediately
  useEffect(() => {
    if (activeChatRoomId && isAuthenticated) {
      fetchMessages(activeChatRoomId, currentView === "CHAT_ROOM");
    }
  }, [activeChatRoomId, isAuthenticated, currentView]);

  // Regional Dashboard State (อ้างอิงรูปที่ 1)
  const [selectedRegionId, setSelectedRegionId] = useState<string>("EAST");
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<"ALL" | DurianGradeKey>("ALL");
  const [selectedDashboardVariety, setSelectedDashboardVariety] = useState<string>("ALL");

  // Marketplace State (อ้างอิงรูปที่ 2)
  const [posts, setPosts] = useState<MarketplacePostItem[]>(INITIAL_POSTS);
  const [selectedVarietyStrip, setSelectedVarietyStrip] =
    useState<string>("ALL");
  const [selectedRegionFilter, setSelectedRegionFilter] =
    useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showCreatePostModal, setShowCreatePostModal] =
    useState<boolean>(false);
  const [selectedMarketTab, setSelectedMarketTab] = useState<PostType>("SELL");
  const [newPostType, setNewPostType] = useState<PostType>("SELL");

  const handleOpenCreatePostModal = () => {
    const roleType = ROLE_CONFIG[userProfile.activeRole]?.allowedPostType || "SELL";
    setNewPostType(roleType);
    if (roleType === "SELL") setNewPostPrice("172");
    else if (roleType === "BUY") setNewPostPrice("170");
    else if (roleType === "CUT_SERVICE") setNewPostPrice("5.5");

    if (selectedRegionFilter && selectedRegionFilter !== "ALL") {
      setNewPostRegion(selectedRegionFilter);
      const regObj = REGIONAL_SEASONS_DATA.find((r) => r.regionName === selectedRegionFilter);
      if (regObj && regObj.provinces.length > 0) {
        setNewPostProvince(regObj.provinces[0]);
      }
    }
    setShowCreatePostModal(true);
  };

  // Create Post Form State
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostVariety, setNewPostVariety] = useState("หมอนทอง");
  const [newPostGrade, setNewPostGrade] = useState("AB ส่งออก");
  const [newPostProvince, setNewPostProvince] = useState("จันทบุรี");
  const [newPostRegion, setNewPostRegion] = useState("ภาคตะวันออก");
  const [newPostPrice, setNewPostPrice] = useState("172");
  const [newPostQty, setNewPostQty] = useState("5000");
  const [newPostContent, setNewPostContent] = useState("");
  const [postFeedback, setPostFeedback] = useState<string | null>(null);

  // Post Detail & Confirm Modal State (อ้างอิงรูปที่ 3 และ รูปที่ 4)
  const [selectedPost, setSelectedPost] = useState<MarketplacePostItem>(
    INITIAL_POSTS[0]
  );
  const [showChatConfirmModal, setShowChatConfirmModal] =
    useState<boolean>(false);
  const [copiedBanner, setCopiedBanner] = useState<boolean>(false);


  // Role Verification Request State (ขอเพิ่มบทบาทด้วยเอกสารจริง ยืนยันผ่าน MySQL & Admin)
  const [showRoleRequestModal, setShowRoleRequestModal] = useState<boolean>(false);
  const [realRoleRequests, setRealRoleRequests] = useState<Array<{
    id: number;
    requestedRole: RoleType;
    businessName: string;
    licenseNumber?: string | null;
    documentType: string;
    documentUrl: string;
    note?: string | null;
    status: "PENDING" | "APPROVED" | "REJECTED";
    adminRemark?: string | null;
    createdAt: string;
  }>>([]);
  const [reqTargetRole, setReqTargetRole] = useState<RoleType>("CUTTER");
  const [reqBizName, setReqBizName] = useState("");
  const [reqLicenseNo, setReqLicenseNo] = useState("");
  const [reqDocType, setReqDocType] = useState<string>("CUTTER_CERT_OR_PORT");
  const [reqFile, setReqFile] = useState<File | null>(null);
  const [reqNote, setReqNote] = useState("");
  const [isSubmittingRoleReq, setIsSubmittingRoleReq] = useState(false);
  const [reqRoleError, setReqRoleError] = useState<string | null>(null);
  const [reqRoleSuccess, setReqRoleSuccess] = useState<string | null>(null);

  // Post Report State (แจ้งปัญหา / รายงานประกาศต่อ Admin)
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<"FAKE_PRICE" | "SCAM" | "SPAM" | "WRONG_INFO">("FAKE_PRICE");
  const [reportDetail, setReportDetail] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  // 1. Real Login Handler -> ยิง API /api/auth/login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);
    setIsAuthLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginEmailOrPhone,
          password: loginPassword,
          roleSelect: loginRoleSelect,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requireEmailVerification) {
          // อีเมลยังไม่ได้ยืนยัน -> เปิดหน้าต่างกรอก OTP ทันที
          setOtpUserId(data.userId);
          setOtpEmail(data.email);
          setOtpPurpose("VERIFY_EMAIL");
          setOtpError(data.error);
          setShowOtpModal(true);
          return;
        }
        setAuthError(data.error || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
        return;
      }

      setUserProfile(data.user);
      setIsAuthenticated(true);
      setCurrentView("ROLE_HOME");
    } catch {
      setAuthError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // 2. Real Register Handler -> ยิง API /api/auth/register แล้วเปิดหน้าต่าง OTP
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);
    setIsAuthLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: regFullName,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          businessName: regBusinessName,
          region: regRegion,
          province: regProvince,
          primaryRole: regPrimaryRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
        return;
      }

      // สมัครสำเร็จ -> เปิด Modal ให้กรอก OTP 6 หลัก
      setOtpUserId(data.userId);
      setOtpEmail(data.email);
      setOtpPurpose("VERIFY_EMAIL");
      setOtpError(null);
      setOtpSuccess(data.message);
      setOtpCodeInput("");
      setShowOtpModal(true);
    } catch {
      setAuthError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // 3. Verify OTP Handler
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpUserId) return;
    setOtpError(null);
    setOtpSuccess(null);
    setIsOtpLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: otpUserId,
          otpCode: otpCodeInput,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.error || "รหัส OTP ไม่ถูกต้อง");
        return;
      }

      // ยืนยันสำเร็จ -> เข้าระบบอัตโนมัติ
      setUserProfile(data.user);
      setShowOtpModal(false);
      setIsAuthenticated(true);
      setCurrentView("ROLE_HOME");
    } catch {
      setOtpError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่");
    } finally {
      setIsOtpLoading(false);
    }
  };

  // 4. Resend OTP Handler
  const handleResendOtp = async () => {
    if (!otpUserId) return;
    setOtpError(null);
    setOtpSuccess(null);
    setIsOtpLoading(true);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: otpUserId,
          purpose: otpPurpose,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || "ไม่สามารถส่งรหัสใหม่ได้");
      } else {
        setOtpSuccess(data.message || "ส่งรหัสใหม่ไปยังกล่องอีเมลแล้ว");
      }
    } catch {
      setOtpError("เกิดข้อผิดพลาดในการส่งรหัสใหม่");
    } finally {
      setIsOtpLoading(false);
    }
  };

  // 5. Forgot Password: Step 1 (Request OTP via Email)
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);
    setIsForgotLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || "เกิดข้อผิดพลาด");
        return;
      }

      if (data.userId) {
        setOtpUserId(data.userId);
        setOtpEmail(data.email);
        setForgotStep("OTP_NEW_PASSWORD");
        setForgotSuccess(data.message);
      } else {
        setForgotSuccess(data.message);
      }
    } catch {
      setForgotError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsForgotLoading(false);
    }
  };

  // 6. Reset Password: Step 2 (Submit OTP + New Password)
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }
    setForgotError(null);
    setForgotSuccess(null);
    setIsForgotLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: otpUserId,
          otpCode: otpCodeInput,
          newPassword: forgotNewPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
        return;
      }

      // สำเร็จ ปิดหน้าต่างแล้วแจ้งให้ล็อกอินใหม่
      setShowForgotModal(false);
      setForgotStep("EMAIL");
      setForgotEmail("");
      setForgotNewPassword("");
      setForgotConfirmPassword("");
      setOtpCodeInput("");
      setAuthSuccessMsg("ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่");
      setAuthTab("LOGIN");
    } catch {
      setForgotError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsForgotLoading(false);
    }
  };

  // 7. Logout Handler
  const handleLogoutSubmit = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error(err);
    }
    setIsAuthenticated(false);
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#user-profile-menu-container")) {
        setIsProfileDropdownOpen(false);
      }
    };
    if (isProfileDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  // Handle Avatar Image File Upload from Computer
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setAvatarUploadError(null);
    setAvatarUploadSuccess(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setAvatarUploadError(data.error || "ไม่สามารถอัปโหลดรูปภาพได้");
        return;
      }
      setUserProfile((prev) => ({ ...prev, avatarUrl: data.avatarUrl }));
      setAvatarUploadSuccess("🎉 อัปเดตรูปโปรไฟล์สำเร็จแล้ว!");
      setTimeout(() => setAvatarUploadSuccess(null), 3500);
    } catch {
      setAvatarUploadError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle Select Preset Avatar
  const handleSelectPresetAvatar = async (presetUrl: string) => {
    setIsUploadingAvatar(true);
    setAvatarUploadError(null);
    setAvatarUploadSuccess(null);

    const formData = new FormData();
    formData.append("preset", presetUrl);

    try {
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setAvatarUploadError(data.error || "ไม่สามารถเลือกรูปนี้ได้");
        return;
      }
      setUserProfile((prev) => ({ ...prev, avatarUrl: data.avatarUrl }));
      setAvatarUploadSuccess("🎉 เปลี่ยนรูปโปรไฟล์สำเร็จแล้ว!");
      setTimeout(() => setAvatarUploadSuccess(null), 3500);
    } catch {
      setAvatarUploadError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle Save Profile Details (Full Name, Business, Phone, Province)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSaveMsg(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editProfileName,
          businessName: editBusinessName,
          phone: editProfilePhone,
          province: editProfileProvince,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProfileSaveMsg(`❌ ${data.error || "บันทึกข้อมูลไม่สำเร็จ"}`);
        return;
      }

      setUserProfile((prev) => ({
        ...prev,
        fullName: data.user.fullName,
        businessName: data.user.businessName,
        phone: data.user.phone,
        province: data.user.province,
      }));
      setProfileSaveMsg("🎉 บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว!");
      setTimeout(() => {
        setShowProfileModal(false);
        setProfileSaveMsg(null);
      }, 1200);
    } catch {
      setProfileSaveMsg("❌ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 3. Open Post Detail (รูปที่ 3)
  const handleOpenPostDetail = (post: MarketplacePostItem) => {
    setSelectedPost(post);
    setCurrentView("POST_DETAIL");
    // Count explicit detail opens, never list fetches or chat polling.
    void fetch(`/api/posts/${post.id}/view`, { method: "POST" }).catch(() => {});
  };

  // 4. Confirm Chat from Modal -> POST /api/chat/rooms
  const handleConfirmStartChat = async () => {
    setShowChatConfirmModal(false);
    try {
      const res = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: selectedPost.id }),
      });
      const data = await res.json();
      if (res.ok && data.roomId) {
        await fetchChatRooms();
        await fetchMessages(data.roomId);
        setActiveChatRoomId(data.roomId);
        setCurrentView("CHAT_ROOM");
      } else {
        alert(data.error || "ไม่สามารถเปิดห้องแชทได้");
      }
    } catch (err) {
      console.error("Chat start error:", err);
    }
  };

  // 5. Send Chat Message or Quick Reply Chip -> POST /api/chat/rooms/[id]/messages
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !activeChatRoomId) return;
    const currentRoomId = activeChatRoomId;
    setChatInputText("");

    // Optimistic pending message with status: "SENDING"
    const tempId = Date.now();
    const tempMsg: ChatMessageItem = {
      id: tempId,
      sender: "ME",
      text: textToSend,
      time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      isRead: false,
      status: "SENDING",
    };
    setChatRooms((prev) =>
      prev.map((r) =>
        r.id === currentRoomId
          ? { ...r, messages: [...r.messages, tempMsg] }
          : r
      )
    );

    try {
      const res = await fetch(`/api/chat/rooms/${currentRoomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: textToSend }),
      });
      if (res.ok) {
        await fetchMessages(currentRoomId, true);
        fetchChatRooms();
      } else {
        await fetchMessages(currentRoomId, true);
      }
    } catch (err) {
      console.error("send message error:", err);
      await fetchMessages(currentRoomId, true);
    }
  };

  // 6. Close Deal Handler -> POST /api/deals
  const handleCloseDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatRoom) return;
    setIsDealLoading(true);
    setDealErrorMsg(null);
    setDealSuccessMsg(null);

    const priceNum = parseFloat(dealAgreedPrice) || 0;
    const pricePerKgNum = parseFloat(dealAgreedPricePerKg) || 0;
    const qtyNum = parseFloat(dealAgreedQty) || 0;

    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: activeChatRoom.id,
          postId: activeChatRoom.post?.id,
          receiverId: (activeChatRoom as any).partnerId,
          agreedPrice: priceNum || (pricePerKgNum * qtyNum),
          agreedPricePerKg: pricePerKgNum || (qtyNum > 0 ? Math.round(priceNum / qtyNum * 100) / 100 : null),
          agreedQuantityKg: qtyNum || null,
          cutDate: dealCutDate || null,
          note: dealNote || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDealErrorMsg(data.error || "ไม่สามารถทำรายการปิดดีลได้");
        return;
      }

      setDealSuccessMsg("🎉 ตกลงราคาซื้อขายและบันทึกสัญญาดีลสำเร็จแล้ว!");
      await fetchMessages(activeChatRoom.id, true);
      await fetchChatRooms();
      setTimeout(() => {
        setShowCloseDealModal(false);
        setDealSuccessMsg(null);
        setDealAgreedPrice("");
        setDealAgreedPricePerKg("");
        setDealAgreedQty("");
        setDealCutDate("");
        setDealNote("");
      }, 1500);
    } catch {
      setDealErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsDealLoading(false);
    }
  };

  // 7. Submit Partner Star Review (1-5 Stars) -> POST /api/reviews
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatRoom) return;
    setIsReviewLoading(true);
    setReviewErrorMsg(null);
    setReviewSuccessMsg(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: activeChatRoom.id,
          postId: activeChatRoom.post?.id,
          revieweeId: activeChatRoom.partnerId,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReviewErrorMsg(data.error || "ไม่สามารถบันทึกคะแนนรีวิวได้");
        return;
      }

      setReviewSuccessMsg(
        `⭐ บันทึกคะแนนรีวิว ${reviewRating}/5 ดาว สำเร็จ! (ค่าเฉลี่ยใหม่ของคู่ค้า: ★ ${Number(
          data.newRatingAvg
        ).toFixed(1)} จาก ${data.newRatingCount} รีวิว)`
      );
      await fetchMessages(activeChatRoom.id, true);
      await fetchChatRooms();
      await fetchPosts();
      setTimeout(() => {
        setShowReviewModal(false);
        setReviewSuccessMsg(null);
        setReviewComment("");
        setReviewRating(5);
      }, 1500);
    } catch {
      setReviewErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsReviewLoading(false);
    }
  };

  // 7. Create New Marketplace Post -> POST /api/posts
  const handleCreateNewPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(newPostPrice) || 0;
    const qtyNum = parseFloat(newPostQty) || 0;
    // Strict Role-to-PostType Enforcement: โพสต์ได้เฉพาะประเภทของบทบาทปัจจุบันเท่านั้น
    const postType = ROLE_CONFIG[userProfile.activeRole]?.allowedPostType || "SELL";

    // Outlier validation (+/- 30% from reference price)
    const refItem = VARIETY_STRIP_ITEMS.find((v) => v.id === newPostVariety);
    const refPrice = refItem ? refItem.avgPrice : 170;
    const isOutlier =
      postType !== "CUT_SERVICE" &&
      (priceNum > refPrice * 1.3 || priceNum < refPrice * 0.7);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPostTitle || `${newPostVariety} เกรด ${newPostGrade} (${(qtyNum / 1000).toFixed(1)} ตัน)`,
          content: newPostContent || `ประกาศโดย ${userProfile.businessName} พื้นที่ จ.${newPostProvince} (${newPostRegion})`,
          postType,
          varietyName: newPostVariety,
          gradeCode: newPostGrade,
          province: newPostProvince,
          region: newPostRegion,
          price: priceNum,
          pricePerKg: priceNum,
          quantityKg: qtyNum,
          dryMatterPct: 34.0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "ไม่สามารถลงประกาศได้");
        return;
      }

      await fetchPosts();
      setSelectedMarketTab(postType);
      setShowCreatePostModal(false);
      setNewPostTitle("");
      setNewPostContent("");
      const catLabel =
        postType === "SELL"
          ? "โพสต์ขายทุเรียน (Sell Orders)"
          : postType === "BUY"
          ? "โพสต์รับซื้อหน้าล้ง (Buy Orders)"
          : "โพสต์รับตัดทุเรียน (Cut Service)";
      setPostFeedback(
        isOutlier
          ? `⚠️ โพสต์ของคุณถูกบันทึกในหมวด "${catLabel}" แล้ว แต่เนื่องจากราคา (${priceNum} บ.) สูงหรือต่ำกว่าราคากลางเกิน ±30% ระบบจึงไม่นำไปคำนวณในกราฟราคากลางเพื่อป้องกันการปั่นราคา`
          : `✅ ลงประกาศในหมวด "${catLabel}" สำเร็จแล้ว!`
      );
    } catch (err) {
      console.error("create post error:", err);
    }
  };

  // 7. Role Management & Real Verification Handlers
  const fetchMyRoleRequests = async () => {
    try {
      const res = await fetch("/api/user/role-requests");
      if (res.ok) {
        const data = await res.json();
        setRealRoleRequests(data.requests || []);
      }
    } catch (err) {
      console.error("fetchMyRoleRequests error:", err);
    }
  };

  const checkIsMyOwnPost = (post: MarketplacePostItem) => {
    if (!userProfile) return false;
    if (post.userId && userProfile.id && post.userId === userProfile.id) return true;
    if (post.authorName && userProfile.fullName && post.authorName.trim() === userProfile.fullName.trim()) return true;
    if (userProfile.fullName && post.authorName && post.authorName.includes(userProfile.fullName)) return true;
    return false;
  };

  const handleSwitchActiveRole = async (newRole: RoleType) => {
    try {
      const res = await fetch("/api/user/active-role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeRole: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserProfile((prev) => ({
          ...prev,
          activeRole: newRole,
        }));
      } else {
        alert(data.error || "ไม่สามารถสลับบทบาทได้");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการสลับบทบาท");
    }
  };

  const handleSubmitExtraRoleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqRoleError(null);
    setReqRoleSuccess(null);

    if (userProfile.approvedRoles.includes(reqTargetRole)) {
      setReqRoleError("คุณมีบทบาทนี้ที่เปิดใช้งานอยู่แล้ว สามารถสลับบทบาทที่แถบด้านบนได้เลย");
      return;
    }

    if (!reqBizName.trim()) {
      setReqRoleError("กรุณาระบุชื่อแปลงเกษตรกร / ล้งรับซื้อ / ชื่อทีมตัด");
      return;
    }

    if (!reqFile) {
      setReqRoleError("กรุณาเลือกไฟล์รูปภาพหรือเอกสาร PDF เพื่อประกอบการพิจารณา");
      return;
    }

    setIsSubmittingRoleReq(true);
    try {
      const formData = new FormData();
      formData.append("requestedRole", reqTargetRole);
      formData.append("businessName", reqBizName.trim());
      if (reqLicenseNo.trim()) {
        formData.append("licenseNumber", reqLicenseNo.trim());
      }
      formData.append("documentType", reqDocType);
      if (reqNote.trim()) {
        formData.append("note", reqNote.trim());
      }
      formData.append("file", reqFile);

      const res = await fetch("/api/user/role-requests", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setReqRoleError(data.error || "เกิดข้อผิดพลาดในการส่งคำขอ");
      } else {
        setReqRoleSuccess(data.message || "ส่งคำขอเพิ่มบทบาทสำเร็จแล้ว! แอดมินจะตรวจสอบเอกสารให้โดยเร็ว");
        setReqFile(null);
        setReqBizName("");
        setReqLicenseNo("");
        setReqNote("");
        await fetchMyRoleRequests();
      }
    } catch {
      setReqRoleError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSubmittingRoleReq(false);
    }
  };

  const handleSubmitPostReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportError(null);
    setReportSuccess(null);
    setIsSubmittingReport(true);

    try {
      const res = await fetch(`/api/posts/${selectedPost.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reportReason,
          detail: reportDetail,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setReportError(data.error || "เกิดข้อผิดพลาดในการส่งรายงาน");
      } else {
        setReportSuccess(data.message || "แจ้งรายงานปัญหาไปยังผู้ดูแลระบบเรียบร้อยแล้ว");
        setTimeout(() => {
          setShowReportModal(false);
          setReportDetail("");
          setReportSuccess(null);
        }, 2200);
      }
    } catch {
      setReportError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Filtered Posts for Marketplace 3 Columns
  const filteredMarketplacePosts = useMemo(() => {
    return posts.filter((p) => {
      if (
        selectedVarietyStrip !== "ALL" &&
        p.variety !== selectedVarietyStrip
      ) {
        return false;
      }
      const postRegion = p.regionTag || (p as any).region || "";
      if (
        selectedRegionFilter !== "ALL" &&
        postRegion !== selectedRegionFilter
      ) {
        return false;
      }
      if (
        searchQuery.trim() !== "" &&
        !p.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.province.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.authorName.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [posts, selectedVarietyStrip, selectedRegionFilter, searchQuery]);

  const sellOrders = filteredMarketplacePosts.filter(
    (p) => p.postType === "SELL"
  );
  const buyOrders = filteredMarketplacePosts.filter(
    (p) => p.postType === "BUY"
  );
  const cutOrders = filteredMarketplacePosts.filter(
    (p) => p.postType === "CUT_SERVICE"
  );

  // Dynamic Regional Dashboard Data calculated from live posts in DB
  const computedRegionalSeasonsData = useMemo(() => {
    return REGIONAL_SEASONS_DATA.map((reg) => {
      // Find all posts in this region (by regionTag, region, or province matching)
      const regionPosts = posts.filter((p) => {
        const pReg = p.regionTag || (p as any).region || "";
        return (
          pReg === reg.regionName ||
          reg.provinces.some((prov) => p.province && p.province.includes(prov))
        );
      });

      const sellPosts = regionPosts.filter((p) => p.postType === "SELL");
      const buyPosts = regionPosts.filter((p) => p.postType === "BUY");
      const cutPosts = regionPosts.filter((p) => p.postType === "CUT_SERVICE");

      // Dynamic average sell price
      let dynamicAvgSell = reg.avgSellPrice;
      if (sellPosts.length > 0) {
        const total = sellPosts.reduce(
          (acc, cur) => acc + (cur.pricePerKg || 0),
          0
        );
        dynamicAvgSell = Math.round((total / sellPosts.length) * 10) / 10;
      }

      // Dynamic average buy price
      let dynamicAvgBuy = reg.avgBuyPrice;
      if (buyPosts.length > 0) {
        const total = buyPosts.reduce(
          (acc, cur) => acc + (cur.pricePerKg || 0),
          0
        );
        dynamicAvgBuy = Math.round((total / buyPosts.length) * 10) / 10;
      }

      // Dynamic average cut wage
      let dynamicAvgCut = reg.avgCutWage;
      if (cutPosts.length > 0) {
        const total = cutPosts.reduce(
          (acc, cur) => acc + (cur.pricePerKg || 0),
          0
        );
        dynamicAvgCut = Math.round((total / cutPosts.length) * 10) / 10;
      }

      // Dynamic price by variety breakdown
      const dynamicPriceByVariety = reg.priceByVariety.map((pv) => {
        const vSellPosts = sellPosts.filter(
          (p) => p.variety && p.variety.includes(pv.variety)
        );
        const vBuyPosts = buyPosts.filter(
          (p) => p.variety && p.variety.includes(pv.variety)
        );

        let vSellPrice = pv.sellPrice;
        if (vSellPosts.length > 0) {
          const total = vSellPosts.reduce(
            (acc, cur) => acc + (cur.pricePerKg || 0),
            0
          );
          vSellPrice = Math.round(total / vSellPosts.length);
        }

        let vBuyPrice = pv.buyPrice;
        if (vBuyPosts.length > 0) {
          const total = vBuyPosts.reduce(
            (acc, cur) => acc + (cur.pricePerKg || 0),
            0
          );
          vBuyPrice = Math.round(total / vBuyPosts.length);
        }

        const vRefPrice = Math.round((vSellPrice + vBuyPrice) / 2);
        const dynamicGrades = buildGradesForVariety(vBuyPrice, vSellPrice, vRefPrice);

        // If there are real posts specifying grade code, compute grade-specific averages
        (["GRADE_A", "GRADE_B", "GRADE_C", "GRADE_D"] as DurianGradeKey[]).forEach((gKey) => {
          const cfg = DURIAN_GRADES_CONFIG[gKey];
          const gradeMatch = (gradeStr?: string) => {
            if (!gradeStr) return false;
            const upper = gradeStr.toUpperCase();
            if (gKey === "GRADE_A" && (upper.includes("A") || upper.includes("ส่งออก"))) return true;
            if (gKey === "GRADE_B" && upper.includes("B")) return true;
            if (gKey === "GRADE_C" && (upper.includes("C") || upper.includes("ในประเทศ"))) return true;
            if (gKey === "GRADE_D" && (upper.includes("D") || upper.includes("ตกไซซ์") || upper.includes("ลาย"))) return true;
            return false;
          };

          const gSell = vSellPosts.filter((p) => gradeMatch(p.grade));
          if (gSell.length > 0) {
            const tot = gSell.reduce((acc, c) => acc + (c.pricePerKg || 0), 0);
            dynamicGrades[gKey].sellPrice = Math.round(tot / gSell.length);
          }

          const gBuy = vBuyPosts.filter((p) => gradeMatch(p.grade));
          if (gBuy.length > 0) {
            const tot = gBuy.reduce((acc, c) => acc + (c.pricePerKg || 0), 0);
            dynamicGrades[gKey].buyPrice = Math.round(tot / gBuy.length);
          }
          dynamicGrades[gKey].refPrice = Math.round((dynamicGrades[gKey].sellPrice + dynamicGrades[gKey].buyPrice) / 2);
        });

        return {
          ...pv,
          sellPrice: vSellPrice,
          buyPrice: vBuyPrice,
          refPrice: vRefPrice,
          grades: dynamicGrades,
        };
      });

      return {
        ...reg,
        avgSellPrice: dynamicAvgSell,
        avgBuyPrice: dynamicAvgBuy,
        avgCutWage: dynamicAvgCut,
        activeLotsCount:
          regionPosts.length > 0 ? regionPosts.length : reg.activeLotsCount,
        hasLivePosts: regionPosts.length > 0,
        livePostsCount: regionPosts.length,
        priceByVariety: dynamicPriceByVariety,
      };
    });
  }, [posts]);

  const selectedRegionalData =
    computedRegionalSeasonsData.find((r) => r.id === selectedRegionId) ||
    computedRegionalSeasonsData[0];

  const activeChatRoom =
    chatRooms.find((r) => r.id === activeChatRoomId) || null;

  // ==========================================================================
  // VIEW 0: AUTHENTICATION GATE (หน้าแรกบังคับให้ Login หรือ สมัครสมาชิกก่อน)
  // ==========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-5 p-4 sm:p-8">
        <div className="flex w-full max-w-6xl items-center justify-between gap-4"><span className="text-sm font-semibold text-secondary">Durian Hub</span><ThemeSwitcher language={currentLang} /></div>
        <div className="max-w-6xl w-full bg-surface rounded-2xl shadow-panel border border-line overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          <AuthBrandPanel language={currentLang} />

          {/* Right Form Panel (Login / Register) */}
          <div className="lg:col-span-7 p-5 sm:p-10 lg:p-12 flex flex-col justify-center">
            {/* Header: Switch Tabs + Language Switcher */}
            <div className="flex items-center justify-between mb-6 gap-2">
              {/* Switch Tabs */}
              <div className="flex bg-muted p-1 rounded-xl shrink min-w-0">
                <button
                  type="button"
                  onClick={() => setAuthTab("LOGIN")}
                  className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                    authTab === "LOGIN"
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.tabLogin}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab("REGISTER")}
                  className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                    authTab === "REGISTER"
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.tabRegister}
                </button>
              </div>

              {/* Language Pill Switcher: TH | EN ทำงานได้จริงในหน้า Login/สมัครสมาชิก */}
              <div className="shrink-0 bg-muted p-1 rounded-full border border-line flex items-center shadow-inner">
                <button
                  type="button"
                  onClick={() => setCurrentLang("TH")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                    currentLang === "TH"
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="เปลี่ยนเป็นภาษาไทย"
                >
                  TH
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentLang("EN")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                    currentLang === "EN"
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Switch to English"
                >
                  EN
                </button>
              </div>
            </div>

            {/* Alert Messages */}
            {authError && (
              <div className="mb-5 p-3.5 rounded-xl bg-danger-soft border border-danger-line text-danger-ink text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-danger-ink" />
                <span>{authError}</span>
              </div>
            )}
            {authSuccessMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-brand-soft border border-brand-line text-brand-ink text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-brand-ink" />
                <span>{authSuccessMsg}</span>
              </div>
            )}

            {authTab === "LOGIN" ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">
                    {t.loginTitle}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t.loginSub}
                  </p>
                </div>

                <div>
                  <label htmlFor="user-field-1" className="block text-xs font-semibold text-secondary mb-1.5">
                    {t.identifierLabel}
                  </label>
                  <input id="user-field-1"
                    type="text"
                    required
                    placeholder={t.identifierPlaceholder}
                    value={loginEmailOrPhone}
                    onChange={(e) => setLoginEmailOrPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-line bg-subtle/50 text-sm focus:bg-surface focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="user-field-2" className="text-xs font-semibold text-secondary">
                      {t.passwordLabel}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(loginEmailOrPhone.includes("@") ? loginEmailOrPhone : "");
                        setForgotStep("EMAIL");
                        setForgotError(null);
                        setForgotSuccess(null);
                        setShowForgotModal(true);
                      }}
                      className="text-xs font-medium text-brand-ink hover:text-brand-ink hover:underline cursor-pointer"
                    >
                      {t.forgotPasswordBtn}
                    </button>
                  </div>
                  <input id="user-field-2"
                    type="password"
                    required
                    placeholder={t.passwordPlaceholder}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-line bg-subtle/50 text-sm focus:bg-surface focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary mb-2">
                    {t.loginRoleLabel}:
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(["SELLER", "BUYER", "CUTTER"] as RoleType[]).map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => {
                          setLoginRoleSelect(r);
                        }}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          loginRoleSelect === r
                            ? "border-brand-line bg-brand-soft/70 ring-2 ring-emerald-500/20"
                            : "border-line hover:border-line-strong bg-surface"
                        }`}
                      >
                        <div className="text-xs font-semibold text-foreground">
                          {currentLang === "TH"
                            ? ROLE_CONFIG[r].shortTitle
                            : r === "SELLER"
                            ? "Orchard Seller"
                            : r === "BUYER"
                            ? "Lhong Buyer"
                            : "Cutting Crew"}
                        </div>
                        <div className="hidden text-xs text-muted-foreground mt-0.5 line-clamp-1 sm:block">
                          {currentLang === "TH"
                            ? ROLE_CONFIG[r].actionLabel
                            : r === "SELLER"
                            ? "List farm harvest"
                            : r === "BUYER"
                            ? "Offer daily prices"
                            : "Offer cutting queue"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isAuthLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {t.loginSubmitBtn} ({currentLang === "TH" ? ROLE_CONFIG[loginRoleSelect].shortTitle : (loginRoleSelect === "SELLER" ? "Seller" : loginRoleSelect === "BUYER" ? "Buyer" : "Cutter")})
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>


              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {t.regTitle}
                  </h2>
                  <p className="hidden text-xs text-muted-foreground mt-0.5 sm:block">
                    {t.regSub}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="user-field-3" className="block text-xs font-semibold text-secondary mb-1">
                      {t.regFullNameLabel}
                    </label>
                    <input id="user-field-3"
                      type="text"
                      required
                      placeholder={t.regFullNamePlaceholder}
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-line text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="user-field-4" className="block text-xs font-semibold text-secondary mb-1">
                      {t.regEmailLabel} *
                    </label>
                    <input id="user-field-4"
                      type="email"
                      required
                      placeholder={t.regEmailPlaceholder}
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-brand-line bg-brand-soft/20 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="user-field-5" className="block text-xs font-semibold text-secondary mb-1">
                      {t.regPhoneLabel}
                    </label>
                    <input id="user-field-5"
                      type="text"
                      required
                      placeholder={t.regPhonePlaceholder}
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-line text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="user-field-6" className="block text-xs font-semibold text-secondary mb-1">
                      {t.regBusinessLabel}
                    </label>
                    <input id="user-field-6"
                      type="text"
                      required
                      placeholder={t.regBusinessPlaceholder}
                      value={regBusinessName}
                      onChange={(e) => setRegBusinessName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-line text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="user-field-7" className="block text-xs font-semibold text-secondary mb-1">
                      {t.regRegionLabel}
                    </label>
                    <select id="user-field-7"
                      value={regRegion}
                      onChange={(e) => {
                        const newReg = e.target.value;
                        setRegRegion(newReg);
                        const regObj = REGIONAL_SEASONS_DATA.find((r) => r.regionName === newReg);
                        if (regObj && regObj.provinces.length > 0) {
                          setRegProvince(regObj.provinces[0]);
                        }
                      }}
                      className="w-full px-3.5 py-2 rounded-lg border border-line text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    >
                      {REGIONAL_SEASONS_DATA.map((r) => (
                        <option key={r.id} value={r.regionName}>
                          {translateRegionName(r.regionName, currentLang)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="user-field-8" className="block text-xs font-semibold text-secondary mb-1">
                      {t.regProvinceLabel} ({translateRegionName(regRegion, currentLang)})
                    </label>
                    <select id="user-field-8"
                      value={regProvince}
                      onChange={(e) => setRegProvince(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-line text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    >
                      {(
                        REGIONAL_SEASONS_DATA.find((r) => r.regionName === regRegion)?.provinces || [
                          "จันทบุรี",
                          "ระยอง",
                          "ตราด",
                        ]
                      ).map((prov) => (
                        <option key={prov} value={prov}>
                          {currentLang === "TH" ? `จ.${prov}` : translateProvinceName(prov, currentLang)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="user-field-9" className="block text-xs font-semibold text-secondary mb-1">
                    {t.regPasswordLabel}
                  </label>
                  <input id="user-field-9"
                    type="password"
                    required
                    placeholder={t.regPasswordPlaceholder}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-line text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1.5">
                    {t.regRoleLabel}:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(["SELLER", "BUYER", "CUTTER"] as RoleType[]).map((r) => (
                      <label
                        key={r}
                        className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                          regPrimaryRole === r
                            ? "border-brand-line bg-brand-soft/70 ring-2 ring-emerald-500/20"
                            : "border-line hover:border-line-strong"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="regRole"
                            checked={regPrimaryRole === r}
                            onChange={() => setRegPrimaryRole(r)}
                            className="text-brand-ink"
                          />
                          <span className="text-xs font-semibold text-foreground">
                            {currentLang === "TH"
                              ? ROLE_CONFIG[r].shortTitle
                              : r === "SELLER"
                              ? "Orchard Seller"
                              : r === "BUYER"
                              ? "Lhong Buyer"
                              : "Cutting Crew"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {currentLang === "TH"
                            ? ROLE_CONFIG[r].actionLabel
                            : r === "SELLER"
                            ? "List farm harvest"
                            : r === "BUYER"
                            ? "Offer daily prices"
                            : "Offer cutting queue"}
                        </p>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {t.regRoleWarning}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isAuthLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {t.regSubmitBtn}
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ================================================================== */}
        {/* MODAL 1: OTP VERIFICATION DIALOG */}
        {/* ================================================================== */}
        {showOtpModal && (
          <DialogFrame label="ยืนยันอีเมล" onClose={() => setShowOtpModal(false)} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-panel border border-line relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setShowOtpModal(false)}
                className="absolute top-5 right-5 text-muted-foreground hover:text-secondary p-1.5 rounded-full hover:bg-muted transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="w-14 h-14 rounded-xl bg-brand-soft text-brand-ink flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Mail className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {t.otpModalTitle}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {t.otpModalSub}:
                  <br />
                  <strong className="text-brand-ink font-semibold">{otpEmail}</strong>
                </p>
              </div>

              {/* Status Alerts */}
              {otpError && (
                <div className="mt-4 p-3 rounded-lg bg-danger-soft border border-danger-line text-danger-ink text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-danger-ink" />
                  <span>{otpError}</span>
                </div>
              )}
              {otpSuccess && (
                <div className="mt-4 p-3 rounded-lg bg-brand-soft border border-brand-line text-brand-ink text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-brand-ink" />
                  <span>{otpSuccess}</span>
                </div>
              )}

              

              <form onSubmit={handleVerifyOtpSubmit} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="user-field-10" className="block text-xs font-semibold text-secondary mb-1.5 text-center">
                    {t.otpCodeLabel}
                  </label>
                  <input id="user-field-10"
                    type="text"
                    required
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otpCodeInput}
                    onChange={(e) => setOtpCodeInput(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center text-3xl font-semibold tracking-widest py-3 rounded-xl border-2 border-line bg-subtle focus:bg-surface focus:border-brand-line focus:outline-none"
                    autoFocus
                  />
                  <div className="text-xs text-muted-foreground text-center mt-1">
                    {currentLang === "TH" ? "รหัสมีอายุการใช้งาน 10 นาที" : "Code expires in 10 minutes"}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isOtpLoading || otpCodeInput.length !== 6}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isOtpLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    t.otpVerifyBtn
                  )}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  disabled={isOtpLoading}
                  onClick={handleResendOtp}
                  className="text-xs text-muted-foreground hover:text-brand-ink font-semibold transition cursor-pointer"
                >
                  {t.otpResendBtn}
                </button>
              </div>
            </div>
          </DialogFrame>
        )}

        {/* ================================================================== */}
        {/* MODAL 2: FORGOT PASSWORD DIALOG */}
        {/* ================================================================== */}
        {showForgotModal && (
          <DialogFrame label="ตั้งรหัสผ่านใหม่" onClose={() => setShowForgotModal(false)} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-panel border border-line relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setShowForgotModal(false)}
                className="absolute top-5 right-5 text-muted-foreground hover:text-secondary p-1.5 rounded-full hover:bg-muted transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="w-14 h-14 rounded-xl bg-warning-soft text-warning-ink flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <KeyRound className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {t.forgotModalTitle}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {forgotStep === "EMAIL"
                    ? t.forgotStep1Sub
                    : `${t.forgotStep2Sub} (${otpEmail})`}
                </p>
              </div>

              {/* Status Alerts */}
              {forgotError && (
                <div className="mt-4 p-3 rounded-lg bg-danger-soft border border-danger-line text-danger-ink text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-danger-ink" />
                  <span>{forgotError}</span>
                </div>
              )}
              {forgotSuccess && (
                <div className="mt-4 p-3 rounded-lg bg-brand-soft border border-brand-line text-brand-ink text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-brand-ink" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              

              {forgotStep === "EMAIL" ? (
                <form onSubmit={handleForgotPasswordSubmit} className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="user-field-11" className="block text-xs font-semibold text-secondary mb-1.5">
                      {t.forgotEmailLabel}
                    </label>
                    <input id="user-field-11"
                      type="email"
                      required
                      placeholder="เช่น seller@durian.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-line text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isForgotLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      t.forgotSendOtpBtn
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="mt-5 space-y-3.5">
                  <div>
                    <label htmlFor="user-field-12" className="block text-xs font-semibold text-secondary mb-1">
                      {t.otpCodeLabel}
                    </label>
                    <input id="user-field-12"
                      type="text"
                      required
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otpCodeInput}
                      onChange={(e) => setOtpCodeInput(e.target.value.replace(/\D/g, ""))}
                      className="w-full text-center text-2xl font-semibold tracking-widest py-2.5 rounded-lg border-2 border-line bg-subtle focus:bg-surface focus:border-brand-line focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="user-field-13" className="block text-xs font-semibold text-secondary mb-1">
                      {t.forgotNewPassLabel}
                    </label>
                    <input id="user-field-13"
                      type="password"
                      required
                      placeholder={currentLang === "TH" ? "อย่างน้อย 6 ตัวอักษร" : "Min 6 characters"}
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-line text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="user-field-14" className="block text-xs font-semibold text-secondary mb-1">
                      {t.forgotConfirmPassLabel}
                    </label>
                    <input id="user-field-14"
                      type="password"
                      required
                      placeholder={currentLang === "TH" ? "กรอกรหัสผ่านใหม่อีกครั้ง" : "Re-enter new password"}
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-line text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isForgotLoading || otpCodeInput.length !== 6}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition shadow-sm flex items-center justify-center gap-2 mt-2 cursor-pointer"
                  >
                    {isForgotLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      t.forgotSaveBtn
                    )}
                  </button>
                </form>
              )}
            </div>
          </DialogFrame>
        )}
      </div>
    );
  }

  // ==========================================================================
  // AUTHENTICATED LAYOUT (Modern Clean Minimal Navbar + Role Workspace)
  // ==========================================================================
  return (
    <div className="min-h-screen bg-canvas text-foreground flex flex-col">
      {/* Top Clean Modern Navbar */}
      <a className="skip-link" href="#main-content">{currentLang === "TH" ? "ข้ามไปยังเนื้อหา" : "Skip to content"}</a>
      <header className="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-20 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setCurrentView("ROLE_HOME")}
              className="flex items-center gap-2.5 text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-semibold text-lg shadow-sm">
                D
              </div>
              <div className="hidden min-[360px]:block">
                <div className="font-semibold text-foreground text-base leading-none">
                  DURIAN <span className="hidden sm:inline">HUB</span>
                </div>
                <div className="hidden text-xs text-muted-foreground mt-0.5 sm:block">
                  THAILAND MARKETPLACE
                </div>
              </div>
            </button>

            {/* Primary Navigation Links */}
            <nav aria-label={currentLang === "TH" ? "เมนูหลัก" : "Main navigation"} className="hidden xl:flex items-center gap-1">
              <button
                onClick={() => setCurrentView("ROLE_HOME")}
                aria-current={currentView === "ROLE_HOME" ? "page" : undefined}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                  currentView === "ROLE_HOME"
                    ? "bg-brand-soft text-brand-ink font-semibold"
                    : "text-secondary hover:text-foreground hover:bg-muted"
                }`}
              >
                {t.navRoleHome}
              </button>

              <button
                onClick={() => setCurrentView("REGIONAL_DASHBOARD")}
                aria-current={currentView === "REGIONAL_DASHBOARD" ? "page" : undefined}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                  currentView === "REGIONAL_DASHBOARD"
                    ? "bg-brand-soft text-brand-ink font-semibold"
                    : "text-secondary hover:text-foreground hover:bg-muted"
                }`}
              >
                {t.navDashboard}
              </button>

              <button
                onClick={() => setCurrentView("MARKETPLACE")}
                aria-current={currentView === "MARKETPLACE" ? "page" : undefined}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                  currentView === "MARKETPLACE" || currentView === "POST_DETAIL"
                    ? "bg-brand-soft text-brand-ink font-semibold"
                    : "text-secondary hover:text-foreground hover:bg-muted"
                }`}
              >
                {t.navMarket}
              </button>

              <button
                onClick={() => {
                  setActiveChatRoomId(0);
                  setCurrentView("CHAT_ROOM");
                }}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  currentView === "CHAT_ROOM"
                    ? "bg-brand-soft text-brand-ink font-semibold"
                    : "text-secondary hover:text-foreground hover:bg-muted"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t.navChat}</span>
                {totalUnreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs font-semibold leading-none shadow-sm animate-pulse">
                    {totalUnreadCount}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Right User Role Status & Switcher */}
          <div className="flex items-center gap-2">
            <ThemeSwitcher language={currentLang} />
            <div className="hidden 2xl:flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg border border-line/80">
              <span className="text-xs text-muted-foreground">{t.roleLabel}</span>
              <select
                value={userProfile.activeRole}
                onChange={(e) => handleSwitchActiveRole(e.target.value as RoleType)}
                className="text-xs font-semibold text-brand-ink bg-transparent focus:outline-none cursor-pointer"
              >
                {userProfile.approvedRoles.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_CONFIG[r].shortTitle}
                  </option>
                ))}
              </select>
            </div>

            {/* User Profile Trigger & Menu (Clean Light Emerald Theme แมตช์กับเว็บ 100%) */}
            <div id="user-profile-menu-container" className="relative flex items-center gap-2">
              {/* Language Pill Switcher: TH | EN ทำงานได้จริง */}
              <div className="hidden sm:flex bg-muted p-0.5 rounded-full border border-line items-center">
                <button
                  type="button"
                  onClick={() => setCurrentLang("TH")}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                    currentLang === "TH"
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="เปลี่ยนเป็นภาษาไทย"
                >
                  TH
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentLang("EN")}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                    currentLang === "EN"
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Switch to English"
                >
                  EN
                </button>
              </div>

              {/* Avatar Trigger Button (White / Emerald border) */}
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-line hover:border-brand-line hover:shadow-sm transition group cursor-pointer"
                title={t.profileMenu}
                aria-label={t.profileMenu}
                aria-expanded={isProfileDropdownOpen}
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-brand-soft flex items-center justify-center shrink-0 border border-brand-line/80">
                  {userProfile.avatarUrl ? (
                    <img
                      src={userProfile.avatarUrl}
                      alt={userProfile.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-700    text-white font-semibold text-xs flex items-center justify-center">
                      {userProfile.fullName ? userProfile.fullName.slice(0, 1) : "U"}
                    </div>
                  )}
                </div>
                <div className="text-muted-foreground group-hover:text-brand-ink pr-1 transition">
                  {isProfileDropdownOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </div>
              </button>

              {/* Dropdown Menu (Solid Pure White Background, No Transparency Bleed) */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-surface border border-line rounded-2xl shadow-panel p-3.5 text-foreground z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* User Full Name / Username */}
                  <div className="px-2 py-1">
                    <div className="font-semibold text-sm text-foreground truncate">
                      {userProfile.fullName || "USER"}
                    </div>
                    <div className="text-xs text-brand-ink font-semibold truncate mt-0.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      <span>{userProfile.businessName || ROLE_CONFIG[userProfile.activeRole].shortTitle}</span>
                    </div>
                  </div>

                  <div className="border-t border-line my-2" />

                  {/* Menu Items */}
                  <label className="mb-3 flex items-center justify-between gap-3 border-b border-line px-2 pb-3 text-sm text-secondary sm:hidden">
                    {currentLang === "TH" ? "ภาษา" : "Language"}
                    <select aria-label="Language / ภาษา" value={currentLang} onChange={(event) => setCurrentLang(event.target.value as "TH" | "EN")} className="rounded-lg border border-line bg-surface px-3 text-foreground"><option value="TH">ไทย</option><option value="EN">English</option></select>
                  </label>
                  <div className="space-y-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setEditProfileName(userProfile.fullName);
                        setEditBusinessName(userProfile.businessName);
                        setEditProfilePhone(userProfile.phone);
                        setEditProfileProvince(userProfile.province);
                        setShowProfileModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-secondary hover:text-brand-ink hover:bg-brand-soft/80 transition text-left cursor-pointer"
                    >
                      <User className="w-4 h-4 text-brand-ink" />
                      <span>{t.profileMenu}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setShowMyPostsModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-secondary hover:text-brand-ink hover:bg-brand-soft/80 transition text-left cursor-pointer"
                    >
                      <Package className="w-4 h-4 text-brand-ink" />
                      <span>{t.myPostsMenu}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        fetchMyRoleRequests();
                        setShowRoleRequestModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-secondary hover:text-brand-ink hover:bg-brand-soft/80 transition text-left cursor-pointer"
                    >
                      <FileCheck2 className="w-4 h-4 text-brand-ink" />
                      <span>{currentLang === "TH" ? "ขอเพิ่มบทบาทการใช้งาน" : "Request Additional Role"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setCurrentView("REGIONAL_DASHBOARD");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-secondary hover:text-brand-ink hover:bg-brand-soft/80 transition text-left cursor-pointer"
                    >
                      <TrendingUp className="w-4 h-4 text-warning-ink" />
                      <span>{t.statsMenu}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setShowUserGuideModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-secondary hover:text-brand-ink hover:bg-brand-soft/80 transition text-left cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-info-ink" />
                      <span>{t.guideMenu}</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-line my-2" />

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      handleLogoutSubmit();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-danger-ink hover:text-danger-ink hover:bg-danger-soft transition text-left text-xs font-semibold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t.logoutMenu}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="xl:hidden flex overflow-x-auto border-t border-line px-4 py-2 gap-2 bg-surface">
          <button
            onClick={() => setCurrentView("ROLE_HOME")}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold cursor-pointer ${
              currentView === "ROLE_HOME"
                ? "bg-emerald-700 text-white"
                : "bg-muted text-secondary"
            }`}
          >
            {t.navRoleHome}
          </button>
          <button
            onClick={() => setCurrentView("REGIONAL_DASHBOARD")}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold cursor-pointer ${
              currentView === "REGIONAL_DASHBOARD"
                ? "bg-emerald-700 text-white"
                : "bg-muted text-secondary"
            }`}
          >
            {t.navDashboard}
          </button>
          <button
            onClick={() => setCurrentView("MARKETPLACE")}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold cursor-pointer ${
              currentView === "MARKETPLACE"
                ? "bg-emerald-700 text-white"
                : "bg-muted text-secondary"
            }`}
          >
            {t.navMarket}
          </button>
          <button
            onClick={() => {
              setActiveChatRoomId(0);
              setCurrentView("CHAT_ROOM");
            }}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold cursor-pointer flex items-center gap-1.5 ${
              currentView === "CHAT_ROOM"
                ? "bg-emerald-700 text-white"
                : "bg-muted text-secondary"
            }`}
          >
            <span>{t.navChat}</span>
            {totalUnreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-semibold leading-none animate-pulse">
                {totalUnreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main id="main-content" className="app-main">
        {postFeedback && (
          <div className="mb-5 p-4 rounded-xl bg-surface border border-brand-line shadow-sm flex items-center justify-between gap-3 text-sm text-foreground">
            <span>{postFeedback}</span>
            <button
              onClick={() => setPostFeedback(null)}
              className="text-xs text-muted-foreground hover:text-secondary cursor-pointer"
            >
              {currentLang === "TH" ? "ปิด" : "Dismiss"}
            </button>
          </div>
        )}

        {/* ===================================================================
            VIEW 1: ROLE WORKSPACE (เมื่อล็อกอินสำเร็จ จะเข้ามายังบทบาทที่สมัคร)
           =================================================================== */}
        {currentView === "ROLE_HOME" && (
          <div className="space-y-6">
            {/* Welcome Role Banner */}
            <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-line/80 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                      ROLE_CONFIG[userProfile.activeRole].badgeBg
                    }`}
                  >
                    {currentLang === "TH" ? "บทบาทปัจจุบัน:" : "Current Role:"} {ROLE_CONFIG[userProfile.activeRole].title}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-ink bg-brand-soft px-2.5 py-1 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" /> {currentLang === "TH" ? "ความประพฤติ" : "Trust"} {userProfile.trustScore}/100
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning-ink bg-warning-soft border border-warning-line px-2.5 py-1 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-warning-ink" /> {(userProfile.rating ?? 5.0).toFixed(1)} ({userProfile.ratingCount ?? 0} {currentLang === "TH" ? "รีวิว" : "reviews"})
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
                  {t.welcome} {userProfile.fullName} ({userProfile.businessName})
                </h1>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  {ROLE_CONFIG[userProfile.activeRole].subtitle} • {t.primaryAreaLabel}{" "}
                  <strong className="text-secondary">{currentLang === "TH" ? "จ." : "Prov. "}{translateProvinceName(userProfile.province, currentLang)}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleOpenCreatePostModal()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-sm transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {currentLang === "TH" ? ROLE_CONFIG[userProfile.activeRole].actionLabel : t.newPostBtn}
                </button>
                <button
                  onClick={() => setCurrentView("MARKETPLACE")}
                  className="bg-muted hover:bg-hover text-foreground font-semibold text-sm px-5 py-3 rounded-xl transition"
                >
                  {t.goToMarketBtn}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm 2xl:hidden"><label className="flex items-center gap-3 text-secondary">{currentLang === "TH" ? "กำลังใช้งานในบทบาท" : "Active role"}<select aria-label={currentLang === "TH" ? "สลับบทบาท" : "Switch role"} value={userProfile.activeRole} onChange={(event) => handleSwitchActiveRole(event.target.value as RoleType)} className="rounded-lg border border-line bg-surface px-3 text-foreground">{userProfile.approvedRoles.map(role => <option key={role} value={role}>{ROLE_CONFIG[role].shortTitle}</option>)}</select></label></div>
            {/* 3 Quick Action Cards Tailored to User's Role */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setCurrentView("REGIONAL_DASHBOARD"); } }}
                onClick={() => setCurrentView("REGIONAL_DASHBOARD")}
                className="bg-surface p-6 rounded-2xl border border-line/80 shadow-sm hover:border-brand-line transition cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-soft text-brand-ink flex items-center justify-center mb-4 group-hover:bg-emerald-700 group-hover:text-white transition">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base text-foreground">
                  {currentLang === "TH" ? "ราคาทุเรียนรายพื้นที่" : "Regional prices"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {currentLang === "TH"
                    ? "ดูแผนที่ทุเรียนไทยทั้ง 6 ภูมิภาค ช่วงเดือนผลผลิตออก สายพันธุ์เด่น และกราฟเปรียบเทียบราคากลางแต่ละจังหวัด"
                    : "View Thailand 6 regions map, harvest windows, main varieties, and benchmark price charts"}
                </p>
                <div className="mt-4 text-xs font-semibold text-brand-ink flex items-center gap-1">
                  {currentLang === "TH" ? "เปิดดูแดชบอร์ดรายพื้นที่" : "Open Regional Dashboard"} <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setCurrentView("MARKETPLACE"); } }}
                onClick={() => setCurrentView("MARKETPLACE")}
                className="bg-surface p-6 rounded-2xl border border-line/80 shadow-sm hover:border-brand-line transition cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-xl bg-info-soft text-info-ink flex items-center justify-center mb-4 group-hover:bg-sky-700 group-hover:text-white transition">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base text-foreground">
                  {currentLang === "TH" ? "ค้นหาประกาศในตลาดกลาง" : "Explore the marketplace"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {currentLang === "TH"
                    ? "แยกกระดานประกาศขาย (ชาวสวน), ประกาศรับซื้อ (ล้ง), และรับจ้างตัดทุเรียน พร้อมกดดูรายละเอียดและทักแชท"
                    : "Dedicated boards for Sell Orders (Farms), Buy Orders (Lhong), and Cut Services"}
                </p>
                <div className="mt-4 text-xs font-semibold text-info-ink flex items-center gap-1">
                  {currentLang === "TH" ? "เข้าสู่ตลาดกลาง" : "Enter Marketplace"} <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div
                onClick={() => {
                  fetchMyRoleRequests();
                  setShowRoleRequestModal(true);
                }}
                className="bg-surface p-6 rounded-2xl border border-line/80 shadow-sm hover:border-brand-line transition cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-xl bg-warning-soft text-warning-ink flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base text-foreground">
                  {currentLang === "TH" ? "จัดการบทบาทของคุณ" : "Manage your roles"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {currentLang === "TH"
                    ? `ตอนสมัครเลือกได้ 1 บทบาท (${ROLE_CONFIG[userProfile.primaryRole].shortTitle}) หากต้องการเพิ่มอีกบทบาท ต้องส่งเอกสารให้คัดกรองก่อน`
                    : `Currently registered as ${ROLE_CONFIG[userProfile.primaryRole].shortTitle}. Submit verification docs to unlock other roles.`}
                </p>
                <div className="mt-4 text-xs font-semibold text-warning-ink flex items-center gap-1">
                  {currentLang === "TH" ? "ส่งเอกสารขอเพิ่มบทบาท" : "Submit Role Application"} <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Matching Posts Preview for Current Role */}
            <div className="bg-surface rounded-2xl p-6 border border-line/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    {t.recentPostsTitle}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {currentLang === "TH"
                      ? "คลิก \"ดูข้อเสนอ\" เพื่อดูรายละเอียดโพสต์และกดทักแชทพูดคุย"
                      : "Click \"View Offer\" to inspect listings and initiate live chat"}
                  </p>
                </div>
                <button
                  onClick={() => setCurrentView("MARKETPLACE")}
                  className="text-xs font-semibold text-brand-ink hover:underline"
                >
                  {t.seeAllInMarket}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {posts.slice(0, 3).map((post) => (
                  <div
                    key={post.id}
                    className="p-4 rounded-xl border border-line/90 hover:border-brand-line transition bg-subtle/50 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-semibold text-secondary">
                          {post.authorName}
                        </span>
                        <span className="text-warning-ink font-semibold">
                          ★ {post.rating.toFixed(1)}
                        </span>
                      </div>
                      <div className="font-semibold text-sm text-foreground line-clamp-1">
                        {post.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t.postCardVariety}{translateVarietyName(post.variety, currentLang)} • {t.postCardProvince}{translateProvinceName(post.province, currentLang)} ({translateRegionName(post.regionTag, currentLang)})
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-line/70 flex items-center justify-between">
                      <span className="font-semibold text-brand-ink text-sm">
                        ฿{post.pricePerKg} {t.perKg}
                      </span>
                      <button
                        onClick={() => handleOpenPostDetail(post)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface border border-line hover:border-brand-line text-foreground transition"
                      >
                        {t.viewOfferBtn}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            VIEW 2: REGIONAL DURIAN DASHBOARD (อ้างอิงรูปที่ 1: ทุเรียนไทยสุกช่วงไหน + ราคา)
           =================================================================== */}
        {currentView === "REGIONAL_DASHBOARD" && (
          <div className="space-y-6">
            <PageHeading eyebrow={currentLang === "TH" ? "ข้อมูลตลาด" : "Market insights"} title={t.heroTitle} description={t.heroSub} />

            {/* ส่วนที่ 1: แถบเลือก 6 ภูมิภาคด้านบน (Compact Regional Selector Strip - Full Width) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-secondary flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-brand-ink" />
                  {currentLang === "TH" ? "เลือกภูมิภาคเพื่อดูวิเคราะห์ราคากลาง" : "Select Region for In-depth Analytics"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {currentLang === "TH" ? "คลิกเลือกเพื่อเปลี่ยนแดชบอร์ดด้านล่าง" : "Click to switch active dashboard"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {computedRegionalSeasonsData.map((reg) => {
                  const isSelected = reg.id === selectedRegionalData.id;
                  return (
                    <div
                      key={reg.id}
                      onClick={() => setSelectedRegionId(reg.id)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                        isSelected
                          ? "bg-surface border-brand-line ring-2 ring-emerald-500/20 shadow-md"
                          : "bg-surface/80 border-line/80 hover:border-line-strong hover:bg-surface shadow-2xs"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${reg.colorClass}`}
                        >
                          {translateRegionName(reg.regionName, currentLang)}
                        </span>
                        {reg.hasLivePosts && (
                          <span className="text-xs font-semibold text-brand-ink bg-brand-soft/80 px-1.5 py-0.5 rounded-md flex items-center shrink-0">
                            ⚡ {reg.livePostsCount}
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-brand-ink shrink-0" />
                          <span className="font-semibold text-foreground truncate">
                            {translateSeasonText(reg.harvestPeriod, currentLang)}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-brand-ink mt-1">
                          ฿{reg.avgBuyPrice}{t.perKg}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ส่วนที่ 2: แดชบอร์ดเจาะลึกและตารางราคากลางแบบเต็มความกว้าง (Full-Width Main Analytics Dashboard) */}
            <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-line/80 shadow-sm space-y-6">
              {/* แถวบน: ข้อมูลทั่วไปของภูมิภาค + การ์ดราคา 3 ใบขนาดใหญ่ */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6 border-b border-line">
                {/* ฝั่งซ้าย: ชื่อภูมิภาค + ไฮไลท์ + รายชื่อจังหวัด (Tag Pills) */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-brand-ink bg-brand-soft px-3 py-1 rounded-full border border-brand-line/60">
                      {t.inDepthTitle}
                    </span>
                    <span className="text-xs font-semibold text-secondary bg-muted px-3 py-1 rounded-full flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-ink" />
                      {t.harvestPeriodLabel}: {translateSeasonText(selectedRegionalData.harvestPeriod, currentLang)}
                    </span>
                    {selectedRegionalData.preSeasonPeriod && (
                      <span className="text-xs font-semibold text-warning-ink bg-warning-soft px-3 py-1 rounded-full border border-warning-line/60">
                        {t.preSeasonLabel}: {translateSeasonText(selectedRegionalData.preSeasonPeriod, currentLang)}
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                    {translateRegionName(selectedRegionalData.regionName, currentLang)}
                  </h3>

                  <p className="text-xs sm:text-sm text-secondary leading-relaxed bg-subtle p-4 rounded-xl border border-line">
                    {selectedRegionalData.highlightNote}
                  </p>

                  {/* รายชื่อจังหวัดในภูมิภาคนั้น (แสดงเป็น Tag Pills เรียบหรู สะอาดตา) */}
                  <div className="pt-2">
                    <div className="text-xs font-semibold text-secondary mb-2">
                      {t.provincesLabel} ({selectedRegionalData.provinces.length} {currentLang === "TH" ? "จังหวัด" : "provinces"}):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRegionalData.provinces.map((prov) => (
                        <span
                          key={prov}
                          className="text-xs font-medium text-secondary bg-muted/90 hover:bg-brand-soft hover:text-brand-ink hover:border-brand-line px-2.5 py-1 rounded-lg border border-line/70 transition"
                        >
                          {translateProvinceName(prov, currentLang)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* สายพันธุ์หลัก */}
                  <div className="pt-1 flex items-center gap-2 text-xs text-secondary flex-wrap">
                    <strong className="text-foreground">{t.varietiesLabel}:</strong>
                    {selectedRegionalData.varieties.map((v) => (
                      <span
                        key={v}
                        className="font-semibold text-brand-ink bg-brand-soft px-2.5 py-0.5 rounded-lg border border-brand-line"
                      >
                        🍈 {translateVarietyName(v, currentLang)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ฝั่งขวา: การ์ด KPI ราคา 3 ใบขนาดใหญ่ + ลิงก์ไปตลาดกลาง */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-brand-soft/80 border border-brand-line text-center flex flex-col justify-center">
                      <div className="text-xs text-brand-ink font-semibold">
                        {t.avgGardenPrice}
                      </div>
                      <div className="text-2xl font-semibold text-brand-ink mt-1">
                        ฿{selectedRegionalData.avgSellPrice}
                      </div>
                      <div className="text-xs text-brand-ink mt-0.5">{t.perKg}</div>
                    </div>

                    <div className="p-4 rounded-xl bg-info-soft/80 border border-info-line text-center flex flex-col justify-center">
                      <div className="text-xs text-info-ink font-semibold">
                        {t.avgLhongPrice}
                      </div>
                      <div className="text-2xl font-semibold text-info-ink mt-1">
                        ฿{selectedRegionalData.avgBuyPrice}
                      </div>
                      <div className="text-xs text-info-ink mt-0.5">{t.perKg}</div>
                    </div>

                    <div className="p-4 rounded-xl bg-warning-soft/80 border border-warning-line text-center flex flex-col justify-center">
                      <div className="text-xs text-warning-ink font-semibold">
                        {t.avgCutWage}
                      </div>
                      <div className="text-2xl font-semibold text-warning-ink mt-1">
                        ฿{selectedRegionalData.avgCutWage}
                      </div>
                      <div className="text-xs text-warning-ink mt-0.5">{t.perKg}</div>
                    </div>
                  </div>

                  {(selectedRegionalData as any).hasLivePosts && (
                    <div className="text-xs font-semibold text-brand-ink bg-brand-soft px-4 py-3 rounded-xl border border-brand-line flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-brand-ink shrink-0" />
                      <div>
                        <span>
                          {t.liveCalcNotice} {(selectedRegionalData as any).livePostsCount}{" "}
                          {currentLang === "TH"
                            ? `รายการใน${selectedRegionalData.regionName}`
                            : `listings in ${translateRegionName(selectedRegionalData.regionName, currentLang)}`}
                        </span>
                        <span className="text-xs font-normal text-brand-ink block mt-0.5">
                          {t.liveCalcNoticeSub}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedRegionFilter(selectedRegionalData.regionName);
                      setCurrentView("MARKETPLACE");
                    }}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm py-3.5 px-4 rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>
                      {currentLang === "TH"
                        ? `ดูประกาศซื้อ-ขายของ${selectedRegionalData.regionName}ในตลาดกลาง`
                        : `View All Listings in ${translateRegionName(selectedRegionalData.regionName, currentLang)}`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* แถวกลาง: แท็บเลือกเกรด และ ตารางเปรียบเทียบราคาขนาดใหญ่เต็มความกว้าง */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-brand-ink" />
                      {t.gradeFilterTitle}
                    </span>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      {t.gradeFilterSub}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setSelectedGradeFilter("ALL")}
                      className={`text-xs font-semibold px-3.5 py-2 rounded-lg border transition cursor-pointer ${
                        selectedGradeFilter === "ALL"
                          ? "bg-emerald-700 text-white border-line shadow-xs"
                          : "bg-surface text-secondary border-line hover:border-line-strong"
                      }`}
                    >
                      {t.allGradesTab}
                    </button>

                    {(["GRADE_A", "GRADE_B", "GRADE_C", "GRADE_D"] as DurianGradeKey[]).map((gKey) => {
                      const isSel = selectedGradeFilter === gKey;
                      const label =
                        gKey === "GRADE_A"
                          ? t.gradeAShort
                          : gKey === "GRADE_B"
                          ? t.gradeBShort
                          : gKey === "GRADE_C"
                          ? t.gradeCShort
                          : t.gradeDShort;

                      return (
                        <button
                          key={gKey}
                          onClick={() => setSelectedGradeFilter(gKey)}
                          className={`text-xs font-semibold px-3.5 py-2 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
                            isSel
                              ? "bg-emerald-700 text-white border-brand-line shadow-xs"
                              : "bg-surface text-secondary border-line hover:border-line-strong"
                          }`}
                        >
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Matrix View or Single Grade Focus View */}
                {selectedGradeFilter === "ALL" ? (
                  /* VIEW A: MATRIX TABLE แบบกว้างเต็มตา */
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-secondary">
                      <span>{t.matrixTableTitle}</span>
                      <span className="text-xs text-muted-foreground font-normal">{t.matrixUnit}</span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-line shadow-2xs">
                      <table className="w-full text-left text-xs border-collapse bg-surface">
                        <thead>
                          <tr className="bg-subtle/90 text-secondary border-b border-line text-xs">
                            <th className="py-3 px-4 font-semibold text-foreground">{t.varietyCol}</th>
                            <th className="py-3 px-3 text-center font-semibold text-brand-ink bg-brand-soft/50">
                              {t.gradeAShort}<br/><span className="text-xs font-normal text-brand-ink">{t.exportLabel}</span>
                            </th>
                            <th className="py-3 px-3 text-center font-semibold text-info-ink bg-info-soft/50">
                              {t.gradeBShort}<br/><span className="text-xs font-normal text-info-ink">{t.subExportLabel}</span>
                            </th>
                            <th className="py-3 px-3 text-center font-semibold text-warning-ink bg-warning-soft/50">
                              {t.gradeCShort}<br/><span className="text-xs font-normal text-warning-ink">{t.domesticLabel}</span>
                            </th>
                            <th className="py-3 px-3 text-center font-semibold text-danger-ink bg-danger-soft/50">
                              {t.gradeDShort}<br/><span className="text-xs font-normal text-danger-ink">{t.underSizeLabel}</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line text-xs">
                          {selectedRegionalData.priceByVariety.map((pv, idx) => (
                            <tr key={idx} className="hover:bg-subtle/70 transition">
                              <td className="py-3.5 px-4 font-semibold text-foreground whitespace-nowrap text-sm">
                                🍈 {translateVarietyName(pv.variety, currentLang)}
                              </td>
                              {(["GRADE_A", "GRADE_B", "GRADE_C", "GRADE_D"] as DurianGradeKey[]).map((gKey) => {
                                const p = pv.grades[gKey];
                                return (
                                  <td key={gKey} className="py-3 px-3 text-center whitespace-nowrap">
                                    <div className="inline-flex flex-col items-center gap-1">
                                      <div className="text-xs font-semibold text-info-ink bg-info-soft px-2.5 py-0.5 rounded-lg border border-info-line">
                                        ล้ง: ฿{p.buyPrice}
                                      </div>
                                      <div className="text-xs font-semibold text-brand-ink bg-brand-soft px-2.5 py-0.5 rounded-lg border border-brand-line">
                                        สวน: ฿{p.sellPrice}
                                      </div>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-1 gap-2">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-info-ink font-semibold bg-info-soft px-2 py-0.5 rounded-md border border-info-line">
                          ● {currentLang === "TH" ? "สีฟ้า: ราคารับซื้อหน้าล้ง" : "Blue: Lhong Buy Price"}
                        </span>
                        <span className="flex items-center gap-1.5 text-brand-ink font-semibold bg-brand-soft px-2 py-0.5 rounded-md border border-brand-line">
                          ● {currentLang === "TH" ? "สีเขียว: ราคาเสนอขายหน้าสวน" : "Green: Farm-Gate Sell Price"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {currentLang === "TH" ? "*ราคาเฉลี่ยคำนวณตามสถานะตลาดจริงและข้อมูลสถิติของแต่ละพื้นที่" : "*Prices calculated from live market listings and regional statistics"}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* VIEW B: DETAIL FOCUS FOR SELECTED GRADE ในรูปแบบ Grid 2 คอลัมน์กว้างสบายตา */
                  <div className="space-y-4 pt-2">
                    <div className="p-4 rounded-xl bg-brand-soft/80 border border-brand-line flex items-start gap-3 text-xs sm:text-sm">
                      <Info className="w-5 h-5 text-brand-ink shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-brand-ink">
                          {DURIAN_GRADES_CONFIG[selectedGradeFilter].name}:
                        </strong>{" "}
                        <span className="text-brand-ink">
                          {DURIAN_GRADES_CONFIG[selectedGradeFilter].desc}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedRegionalData.priceByVariety.map((pv, i) => {
                        const p = pv.grades[selectedGradeFilter];
                        const maxBar = 500;
                        const buyW = Math.min(100, Math.max(15, Math.round((p.buyPrice / maxBar) * 100)));
                        const sellW = Math.min(100, Math.max(15, Math.round((p.sellPrice / maxBar) * 100)));

                        return (
                          <div
                            key={i}
                            className="p-4 rounded-xl border border-line/80 bg-subtle/60 hover:bg-surface hover:shadow-xs transition space-y-3"
                          >
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="font-semibold text-foreground">
                                🍈 {t.postCardVariety}{translateVarietyName(pv.variety, currentLang)} • {DURIAN_GRADES_CONFIG[selectedGradeFilter].shortName}
                              </span>
                              <span className="text-xs text-muted-foreground font-medium">
                                {currentLang === "TH" ? `อ้างอิงกลาง ฿${p.refPrice}/กก.` : `Benchmark ฿${p.refPrice}/kg`}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="w-24 text-muted-foreground">
                                  {currentLang === "TH" ? "สวนเสนอขาย:" : "Farm Sell:"}
                                </span>
                                <div className="flex-1 h-3 bg-hover/80 rounded-full overflow-hidden">
                                  <div
                                    style={{ width: `${sellW}%` }}
                                    className="h-full bg-emerald-700 rounded-full"
                                  />
                                </div>
                                <span className="w-16 text-right font-semibold text-brand-ink">
                                  ฿{p.sellPrice}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-xs">
                                <span className="w-24 text-muted-foreground">
                                  {currentLang === "TH" ? "ล้งรับซื้อ:" : "Lhong Buy:"}
                                </span>
                                <div className="flex-1 h-3 bg-hover/80 rounded-full overflow-hidden">
                                  <div
                                    style={{ width: `${buyW}%` }}
                                    className="h-full bg-sky-700 rounded-full"
                                  />
                                </div>
                                <span className="w-16 text-right font-semibold text-info-ink">
                                  ฿{p.buyPrice}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ส่วนที่ 3: วิธีดูทุเรียนสุก (อ้างอิงรูปที่ 1) วางเป็น Banner สวยงามด้านล่างสุดของแดชบอร์ด */}
              <div className="mt-6 pt-6 border-t border-line flex items-start gap-4 bg-warning-soft/50 p-4 sm:p-5 rounded-xl border border-warning-line/60">
                <div className="w-10 h-10 rounded-lg bg-warning-soft text-warning-ink flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">
                    {currentLang === "TH"
                      ? "วิธีดูทุเรียนสุก / พร้อมตัดมาตรฐานตลาดกลาง"
                      : "How to Identify Ripe & Ready-to-Harvest Durian Standards"}
                  </h4>
                  <p className="text-xs text-secondary mt-1 leading-relaxed">
                    {currentLang === "TH" ? (
                      <>
                        <strong>ก้านแข็งมีสีเข้ม</strong> • <strong>ผิวเป็นเม็ดทราย</strong> •{" "}
                        <strong>ปลายหนามแห้งสีน้ำตาล เปราะหักง่าย</strong> •{" "}
                        <strong>ร่องพูเป็นรอยแยกเห็นชัด</strong> และควรตรวจวัดเปอร์เซ็นต์แป้งในเนื้อทุเรียนตามเกณฑ์มาตรฐานส่งออก (หมอนทอง &ge; 32%)
                      </>
                    ) : (
                      <>
                        <strong>Stiff & dark stalk</strong> • <strong>Rough sandy skin texture</strong> •{" "}
                        <strong>Dry brownish brittle thorns</strong> •{" "}
                        <strong>Distinctive carpel seam separations</strong>. Dry matter percentage should meet export criteria (Monthong &ge; 32%).
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            VIEW 3: MARKETPLACE 3-COLUMN BOARD (อ้างอิงรูปที่ 2 ในโทนสว่างโมเดิร์น)
           =================================================================== */}
        {currentView === "MARKETPLACE" && (
          <div className="space-y-5">
            {/* Top Banner & Variety Item Strip (เหมือนแถบไอเทมด้านบนในรูปที่ 2) */}
            <div className="bg-surface rounded-2xl p-5 border border-line/80 shadow-sm space-y-4">
              <PageHeading eyebrow={currentLang === "TH" ? "ซื้อขายและบริการ" : "Trade & services"} title={t.marketTitle} description={t.marketSub} action={<Button onClick={handleOpenCreatePostModal}><Plus className="h-4 w-4" />{t.newPostBtn}</Button>} />

              <div className="flex flex-wrap items-center gap-2" role="group" aria-label={currentLang === "TH" ? "กรองสายพันธุ์" : "Filter by variety"}>
                {VARIETY_STRIP_ITEMS.map(item => <button key={item.id} type="button" aria-pressed={selectedVarietyStrip === item.id} onClick={() => setSelectedVarietyStrip(item.id)} className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${selectedVarietyStrip === item.id ? "border-brand-line bg-brand-soft text-brand-ink" : "border-line bg-surface text-secondary hover:bg-subtle"}`}>{item.id === "ALL" ? (currentLang === "TH" ? "ทุกสายพันธุ์" : "All varieties") : translateVarietyName(item.nameTh, currentLang)}</button>)}
              </div>

              {/* Search & Filter Row (อ้างอิงแถบค้นหาและปุ่มขวาในรูปที่ 2) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line">
                <div className="flex flex-wrap items-center gap-2.5 flex-1">
                  <select
                    value={selectedRegionFilter}
                    onChange={(e) => setSelectedRegionFilter(e.target.value)}
                    className="text-xs font-semibold border border-line rounded-lg px-3.5 py-2.5 bg-subtle text-secondary focus:outline-none"
                  >
                    <option value="ALL">{t.allRegions}</option>
                    <option value="ภาคตะวันออก">{translateRegionName("ภาคตะวันออก", currentLang)}</option>
                    <option value="ภาคใต้">{translateRegionName("ภาคใต้", currentLang)}</option>
                    <option value="ภาคเหนือ">{translateRegionName("ภาคเหนือ", currentLang)}</option>
                    <option value="ภาคกลาง">{translateRegionName("ภาคกลาง", currentLang)}</option>
                    <option value="ภาคอีสาน">{translateRegionName("ภาคอีสาน", currentLang)}</option>
                    <option value="3 จังหวัดชายแดนใต้">{translateRegionName("3 จังหวัดชายแดนใต้", currentLang)}</option>
                  </select>

                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-line bg-subtle text-xs focus:bg-surface focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {(selectedVarietyStrip !== "ALL" ||
                    selectedRegionFilter !== "ALL" ||
                    searchQuery !== "") && (
                    <button
                      onClick={() => {
                        setSelectedVarietyStrip("ALL");
                        setSelectedRegionFilter("ALL");
                        setSearchQuery("");
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 cursor-pointer"
                    >
                      {currentLang === "TH" ? "ล้างตัวกรอง" : "Clear Filter"}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-3 py-1.5 rounded-lg bg-muted text-secondary font-medium border border-line flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-ink" />
                    {t.filterRecent7Days}
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-brand-soft text-brand-ink font-semibold border border-brand-line">
                    {t.freshCountLabel} {filteredMarketplacePosts.length} {currentLang === "TH" ? "โพสต์" : "Posts"}
                  </span>
                </div>
              </div>
            </div>

            {/* Category Segmented Tabs (แยกประเภทชัดเจน ไม่รกสายตา) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-2.5 rounded-xl border border-line/90 shadow-sm">
              <div className="market-tabs flex-1" aria-label={currentLang === "TH" ? "ประเภทประกาศ" : "Listing categories"}>
                {/* Tab 1: SELL */}
                <button
                  type="button"
                  onClick={() => setSelectedMarketTab("SELL")}
                  aria-pressed={selectedMarketTab === "SELL"}
                  className={`px-4 py-2.5 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                    selectedMarketTab === "SELL"
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "text-secondary hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>{t.colSellTitle}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      selectedMarketTab === "SELL"
                        ? "bg-emerald-800 text-brand-ink"
                        : "bg-muted text-secondary"
                    }`}
                  >
                    {sellOrders.length}
                  </span>
                </button>

                {/* Tab 2: BUY */}
                <button
                  type="button"
                  onClick={() => setSelectedMarketTab("BUY")}
                  aria-pressed={selectedMarketTab === "BUY"}
                  className={`px-4 py-2.5 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                    selectedMarketTab === "BUY"
                      ? "bg-sky-700 text-white shadow-sm"
                      : "text-secondary hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-300 shrink-0" />
                  <span>{t.colBuyTitle}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      selectedMarketTab === "BUY"
                        ? "bg-sky-700 text-info-ink"
                        : "bg-muted text-secondary"
                    }`}
                  >
                    {buyOrders.length}
                  </span>
                </button>

                {/* Tab 3: CUT_SERVICE */}
                <button
                  type="button"
                  onClick={() => setSelectedMarketTab("CUT_SERVICE")}
                  aria-pressed={selectedMarketTab === "CUT_SERVICE"}
                  className={`px-4 py-2.5 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                    selectedMarketTab === "CUT_SERVICE"
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : "text-secondary hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-warning-soft shrink-0" />
                  <span>{t.colCutTitle}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      selectedMarketTab === "CUT_SERVICE"
                        ? "bg-amber-600 text-warning-ink"
                        : "bg-muted text-secondary"
                    }`}
                  >
                    {cutOrders.length}
                  </span>
                </button>
              </div>

              {/* Quick Posting CTA Button in tab bar matching current active role */}
              <button
                onClick={() => handleOpenCreatePostModal()}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-soft hover:bg-brand-soft text-brand-ink font-semibold text-xs transition border border-brand-line cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-brand-ink" />
                <span>
                  {currentLang === "TH"
                    ? `ลงประกาศในบทบาท: ${ROLE_CONFIG[userProfile.activeRole].shortTitle}`
                    : `Post as: ${ROLE_CONFIG[userProfile.activeRole].shortTitle}`}
                </span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm text-muted-foreground" role="status"><span>{currentLang === "TH" ? `พบ ${selectedMarketTab === "SELL" ? sellOrders.length : selectedMarketTab === "BUY" ? buyOrders.length : cutOrders.length} ประกาศ` : `${selectedMarketTab === "SELL" ? sellOrders.length : selectedMarketTab === "BUY" ? buyOrders.length : cutOrders.length} listings`}</span>{(searchQuery || selectedRegionFilter !== "ALL" || selectedVarietyStrip !== "ALL") && <Button variant="ghost" onClick={() => { setSearchQuery(""); setSelectedRegionFilter("ALL"); setSelectedVarietyStrip("ALL"); }}>{currentLang === "TH" ? "ล้างตัวกรอง" : "Clear filters"}</Button>}</div>

            {/* Selected Category Listing Grid (กว้างขวาง สบายตา ไม่เบียด 3 คอลัมน์) */}
            <div className="listing-grid">
              {/* TAB 1: SELL ORDERS */}
              {selectedMarketTab === "SELL" &&
                (sellOrders.length === 0 ? (
                  <div className="col-span-full bg-surface rounded-2xl border border-line/80 shadow-sm p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-xl bg-brand-soft text-brand-ink flex items-center justify-center mb-3 text-3xl">
                      👑
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                      {currentLang === "TH" ? "ยังไม่มีโพสต์ขายทุเรียนในหมวดนี้" : "No Orchard Sell Orders Found"}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mb-4">
                      {currentLang === "TH"
                        ? "ลองเลือกภูมิภาคอื่น หรือล้างตัวกรองสายพันธุ์ด้านบนเพื่อค้นหาเพิ่มเติม"
                        : "Try selecting another region or clear filters above to view more listings."}
                    </p>
                    {ROLE_CONFIG[userProfile.activeRole].allowedPostType === "SELL" && (
                      <button
                        onClick={() => handleOpenCreatePostModal()}
                        className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        {currentLang === "TH" ? "ลงประกาศขายผลผลิตทันที" : "Create Sell Listing Now"}
                      </button>
                    )}
                  </div>
                ) : (
                  sellOrders.map(post => <ListingCard key={post.id} post={post} own={checkIsMyOwnPost(post)} language={currentLang} time={formatRelativeTime(post.createdAt)} onOpen={() => handleOpenPostDetail(post)} />)
                ))}

              {/* TAB 2: BUY ORDERS */}
              {selectedMarketTab === "BUY" &&
                (buyOrders.length === 0 ? (
                  <div className="col-span-full bg-surface rounded-2xl border border-line/80 shadow-sm p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-xl bg-info-soft text-info-ink flex items-center justify-center mb-3 text-3xl">
                      🏢
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                      {currentLang === "TH" ? "ยังไม่มีโพสต์รับซื้อหน้าล้งในหมวดนี้" : "No Lhong Buy Orders Found"}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mb-4">
                      {currentLang === "TH"
                        ? "ลองเลือกภูมิภาคอื่น หรือล้างตัวกรองสายพันธุ์ด้านบนเพื่อค้นหาเพิ่มเติม"
                        : "Try selecting another region or clear filters above to view more listings."}
                    </p>
                    {ROLE_CONFIG[userProfile.activeRole].allowedPostType === "BUY" && (
                      <button
                        onClick={() => handleOpenCreatePostModal()}
                        className="px-5 py-2.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        {currentLang === "TH" ? "ตั้งประกาศรับซื้อทันที" : "Create Buy Listing Now"}
                      </button>
                    )}
                  </div>
                ) : (
                  buyOrders.map(post => <ListingCard key={post.id} post={post} own={checkIsMyOwnPost(post)} language={currentLang} time={formatRelativeTime(post.createdAt)} onOpen={() => handleOpenPostDetail(post)} />)
                ))}

              {/* TAB 3: CUT SERVICE ORDERS */}
              {selectedMarketTab === "CUT_SERVICE" &&
                (cutOrders.length === 0 ? (
                  <div className="col-span-full bg-surface rounded-2xl border border-line/80 shadow-sm p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-xl bg-warning-soft text-warning-ink flex items-center justify-center mb-3 text-3xl">
                      ✂️
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                      {currentLang === "TH" ? "ยังไม่มีโพสต์รับตัดทุเรียนในหมวดนี้" : "No Cut Service Listings Found"}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mb-4">
                      {currentLang === "TH"
                        ? "ลองเลือกภูมิภาคอื่น หรือล้างตัวกรองสายพันธุ์ด้านบนเพื่อค้นหาเพิ่มเติม"
                        : "Try selecting another region or clear filters above to view more listings."}
                    </p>
                    {ROLE_CONFIG[userProfile.activeRole].allowedPostType === "CUT_SERVICE" && (
                      <button
                        onClick={() => handleOpenCreatePostModal()}
                        className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        {currentLang === "TH" ? "ลงประกาศรับตัดทุเรียนทันที" : "Create Cut Service Listing Now"}
                      </button>
                    )}
                  </div>
                ) : (
                  cutOrders.map(post => <ListingCard key={post.id} post={post} own={checkIsMyOwnPost(post)} language={currentLang} time={formatRelativeTime(post.createdAt)} onOpen={() => handleOpenPostDetail(post)} />)
                ))}
            </div>

            {/* Floating Action Button (+) มุมขวาล่างเหมือนในรูปที่ 2 */}
            <button
              onClick={() => handleOpenCreatePostModal()}
              title={ROLE_CONFIG[userProfile.activeRole].actionLabel}
              className="fixed bottom-6 right-6 z-20 w-14 h-14 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-panel flex items-center justify-center transition hover:scale-105 cursor-pointer"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* ===================================================================
            VIEW 4: POST DETAIL VIEW (อ้างอิงรูปที่ 3: รูปซ้าย + การ์ดราคาและปุ่มทักแชทขวา)
           =================================================================== */}
        {currentView === "POST_DETAIL" && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Back Button */}
            <button
              onClick={() => setCurrentView("MARKETPLACE")}
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground tracking-wide uppercase cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> {currentLang === "TH" ? "BACK กลับสู่หน้าตลาดกลาง" : "BACK to Marketplace"}
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left 6 Columns: Visual Product Showcase + ITEM DETAIL Box (ตามรูปที่ 3) */}
              <div className="lg:col-span-6 space-y-5 flex flex-col items-center">
                <div className="w-full aspect-square max-w-md rounded-2xl bg-emerald-700   to-white border border-line/80 shadow-sm flex flex-col items-center justify-center p-8 relative overflow-hidden">
                  <div className="w-44 h-44 rounded-full bg-warning-soft/40 blur-2xl absolute" />
                  <div className="relative z-10 text-center space-y-3">
                    <div className="text-7xl">
                      {selectedPost.postType === "SELL"
                        ? "👑"
                        : selectedPost.postType === "BUY"
                        ? "🏢"
                        : "✂️"}
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/90 border border-line text-xs font-semibold text-foreground shadow-sm">
                      {currentLang === "TH"
                        ? `พันธุ์${selectedPost.variety} • เกรด ${selectedPost.grade}`
                        : `${translateVarietyName(selectedPost.variety, currentLang)} • Grade ${selectedPost.grade}`}
                    </div>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      {currentLang === "TH"
                        ? `พื้นที่: อ.${selectedPost.district} จ.${selectedPost.province} (${selectedPost.regionTag})`
                        : `Area: ${selectedPost.district}, ${translateProvinceName(selectedPost.province, currentLang)} (${translateRegionName(selectedPost.regionTag, currentLang)})`}
                    </p>
                  </div>
                </div>

                {/* ITEM DETAIL Box ด้านล่างรูป (เหมือนในรูปที่ 3) */}
                <div className="w-full max-w-md bg-surface rounded-xl p-5 border border-line shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-warning-ink uppercase tracking-wider mb-1.5">
                    <Info className="w-4 h-4" /> {currentLang === "TH" ? "DURIAN LOT DETAIL (รายละเอียดผลผลิต)" : "DURIAN LOT DETAIL (Lot Specifications)"}
                  </div>
                  <p className="text-sm text-secondary leading-relaxed">
                    {selectedPost.content}
                  </p>
                  <div className="mt-3 pt-3 border-t border-line text-xs text-muted-foreground">
                    {selectedPost.itemDetailSummary}
                  </div>
                </div>
              </div>

              {/* Right 6 Columns: White Summary Card (ตามรูปที่ 3 ทุกองค์ประกอบ) */}
              <div className="lg:col-span-6 bg-surface rounded-2xl p-6 sm:p-8 border border-line/90 shadow-md space-y-5">
                {/* Top Tags & Date */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                        selectedPost.postType === "SELL"
                          ? "bg-emerald-700 text-white"
                          : selectedPost.postType === "BUY"
                          ? "bg-sky-700 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {selectedPost.postType === "SELL"
                        ? (currentLang === "TH" ? "ขาย" : "SELL")
                        : selectedPost.postType === "BUY"
                        ? (currentLang === "TH" ? "รับซื้อ" : "BUY")
                        : (currentLang === "TH" ? "รับตัด" : "CUT")}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-400 text-slate-950">
                      {currentLang === "TH" ? `เกรด ${selectedPost.grade}` : `Grade ${selectedPost.grade}`}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-sky-700 text-white">
                      {translateRegionName(selectedPost.regionTag, currentLang)}
                    </span>
                  </div>

                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {selectedPost.availableDate}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                  {selectedPost.title}
                </h1>

                {/* Price Grey Box */}
                <div className="bg-muted/80 rounded-xl p-4 border border-line/60">
                  <div className="text-xs text-muted-foreground font-medium">
                    {selectedPost.postType === "SELL"
                      ? (currentLang === "TH" ? "ราคาเสนอขายหน้าสวน" : "Farm-gate Offering Price")
                      : selectedPost.postType === "BUY"
                      ? (currentLang === "TH" ? "ราคารับซื้อหน้าล้ง" : "Lhong Buying Price")
                      : (currentLang === "TH" ? "อัตราค่าจ้างตัดทุเรียน" : "Harvesting Wage")}
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold text-foreground">
                      {selectedPost.pricePerKg} THB
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {selectedPost.priceUnitLabel} ({currentLang === "TH" ? `ปริมาณรวม ${(selectedPost.quantityKg / 1000).toFixed(1)} ตัน` : `Total Qty ${(selectedPost.quantityKg / 1000).toFixed(1)} Tons`})
                    </span>
                  </div>
                </div>

                {/* Seller / Poster Profile Card */}
                <div className="rounded-xl p-4 border border-line space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-800 text-white font-semibold text-lg flex items-center justify-center relative">
                      {selectedPost.authorName.charAt(0)}
                      <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-white absolute bottom-0 right-0" />
                    </div>
                    <div>
                      <div className="font-semibold text-base text-foreground flex items-center gap-1.5">
                        {selectedPost.authorName}
                        {selectedPost.isKycVerified && (
                          <CheckCircle2 className="w-4 h-4 text-brand-ink" />
                        )}
                      </div>
                      <div className="text-xs text-brand-ink font-medium">
                        {selectedPost.businessName} • {selectedPost.contactNote}
                      </div>
                    </div>
                  </div>

                  {/* Stats Pills: Rating | คะแนนเครดิต | ชมร้านค้า */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line text-xs">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-warning-soft text-warning-ink border border-warning-line font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-warning-ink" />
                      {selectedPost.rating.toFixed(1)} ({selectedPost.reviewCount})
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-soft text-brand-ink border border-brand-line font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-ink" />
                      {currentLang === "TH" ? `ความประพฤติ ${selectedPost.trustScore}/100` : `Trust ${selectedPost.trustScore}/100`}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-secondary font-semibold">
                      <Store className="w-3.5 h-3.5" /> {currentLang === "TH" ? `จ.${selectedPost.province}` : translateProvinceName(selectedPost.province, currentLang)}
                    </span>
                  </div>
                </div>

                {/* Main CTA: If own post, show management banner; otherwise show chat & report buttons */}
                {checkIsMyOwnPost(selectedPost) ? (
                  <div className="p-4 sm:p-5 rounded-xl bg-brand-soft/90 border border-brand-line text-center space-y-2.5">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-ink">
                      <User className="w-4 h-4 text-brand-ink" />
                      <span>
                        {currentLang === "TH"
                          ? "นี่คือประกาศของคุณเอง (สร้างไว้ในระบบ)"
                          : "This is your own marketplace listing"}
                      </span>
                    </div>
                    <p className="text-xs text-secondary leading-relaxed max-w-sm mx-auto">
                      {currentLang === "TH"
                        ? `คุณลงประกาศนี้ไว้ในหมวด ${
                            selectedPost.postType === "SELL"
                              ? "ขายหน้าสวน"
                              : selectedPost.postType === "BUY"
                              ? "รับซื้อหน้าล้ง"
                              : "รับจ้างตัดทุเรียน"
                          } ระบบล็อกไม่ให้ทักแชทหาตัวเองเพื่อความปลอดภัย`
                        : "You created this listing. Self-chatting is disabled."}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowMyPostsModal(true)}
                      className="mt-1 px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>
                        {currentLang === "TH"
                          ? "ดูและจัดการใน \"ประวัติการโพสต์ของคุณ\""
                          : "Manage in \"My Posts\""}
                      </span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Main CTA Button: ซื้อสินค้า / ทักแชท (เปิด Modal รูปที่ 4) */}
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowChatConfirmModal(true)}
                        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-4 px-6 rounded-full transition shadow-md flex items-center justify-center gap-2 text-base cursor-pointer"
                      >
                        <MessageSquare className="w-5 h-5" />
                        {selectedPost.postType === "SELL"
                          ? (currentLang === "TH" ? "ซื้อสินค้า / ทักแชทเจรจา" : "Buy Product / Chat & Negotiate")
                          : selectedPost.postType === "BUY"
                          ? (currentLang === "TH" ? "ติดต่อขายให้ล้งนี้ / ทักแชท" : "Sell to Lhong / Chat & Negotiate")
                          : (currentLang === "TH" ? "จองคิวทีมตัด / ทักแชท" : "Book Harvesting Crew / Chat")}
                      </button>
                      <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Authorized Chat Protocol •
                        Secure Data Link Established
                      </div>
                    </div>
                  </>
                )}

                {/* Bottom Share / Copy Buttons (ตามรูปที่ 3) */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCopiedBanner(true);
                      setTimeout(() => setCopiedBanner(false), 2500);
                    }}
                    className="py-2.5 px-4 rounded-lg bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" /> {currentLang === "TH" ? "แชร์ลง Facebook" : "Share to Facebook"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCopiedBanner(true);
                      setTimeout(() => setCopiedBanner(false), 2500);
                    }}
                    className="py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Copy className="w-4 h-4" /> {currentLang === "TH" ? "คัดลอกโพสต์ลงกลุ่ม" : "Copy Listing Details"}
                  </button>
                </div>

                {copiedBanner && (
                  <div className="text-center text-xs text-brand-ink font-semibold bg-brand-soft py-2 rounded-lg">
                    {currentLang === "TH" ? "คัดลอกลิงก์และรายละเอียดประกาศเรียบร้อยแล้ว!" : "Listing details and link copied to clipboard!"}
                  </div>
                )}

                {/* Report Post to Admin (Only visible for other users' posts) */}
                {!checkIsMyOwnPost(selectedPost) && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReportError(null);
                        setReportSuccess(null);
                        setReportDetail("");
                        setShowReportModal(true);
                      }}
                      className="w-full py-2.5 px-4 rounded-lg border border-danger-line bg-danger-soft/70 hover:bg-danger-soft/90 text-danger-ink text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Flag className="w-3.5 h-3.5 text-danger-ink" />
                      <span>
                        {currentLang === "TH"
                          ? "🚩 แจ้งปัญหาประกาศนี้ / รายงานต่อผู้ดูแลระบบ"
                          : "🚩 Report this listing to Admin"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            VIEW 5: CHAT ROOM MESSENGER (อ้างอิงรูปที่ 5: รายชื่อซ้าย + แชท & การ์ดสินค้าขวา + ปุ่มข้อความด่วน)
           =================================================================== */}
        {currentView === "CHAT_ROOM" &&
          (chatRooms.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-line/90 shadow-sm p-12 text-center min-h-[500px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-xl bg-warning-soft border border-warning-line flex items-center justify-center text-warning-ink mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {currentLang === "TH" ? "ยังไม่มีรายการสนทนา" : "No Active Conversations"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                {currentLang === "TH"
                  ? "คุณยังไม่มีประวัติการพูดคุยกับผู้ซื้อหรือผู้ขาย สามารถเลือกดูประกาศในตลาดกลาง แล้วกด \"ติดต่อผู้ขาย / เจรจาซื้อขาย\" เพื่อเริ่มคุยได้ทันที"
                  : "You don't have any chat history yet. Browse the marketplace and click \"View Offer / Chat & Negotiate\" to connect immediately."}
              </p>
              <button
                onClick={() => setCurrentView("MARKETPLACE")}
                className="px-6 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm transition shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Store className="w-4 h-4" /> {t.goToMarketBtn}
              </button>
            </div>
          ) : (
            <div className="bg-surface rounded-2xl border border-line/90 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 h-[calc(100dvh-220px)] min-h-[420px] lg:min-h-[580px] lg:max-h-[850px]">
              {/* Left 4 Columns: Chat List Sidebar */}
              <div className={`${activeChatRoom ? "hidden lg:flex" : "flex"} lg:col-span-4 lg:border-r border-line flex-col bg-subtle h-full min-h-0 overflow-hidden`}>
                <div className="p-4 border-b border-line flex items-center justify-between bg-surface shrink-0">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-base">
                    <MessageSquare className="w-5 h-5 text-warning-ink" />
                    {currentLang === "TH" ? "ข้อความสนทนา" : "Conversations"}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {chatRooms.length} {currentLang === "TH" ? "ห้องแชท" : "Rooms"}
                  </span>
                </div>

                {/* Filter Tabs: กำลังเจรจา | ปิดดีลแล้ว | ทั้งหมด */}
                <div className="px-3 py-2 bg-muted/80 border-b border-line flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setChatFilterTab("ACTIVE")}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      chatFilterTab === "ACTIVE"
                        ? "bg-surface text-brand-ink shadow-xs border border-line/80"
                        : "text-secondary hover:text-foreground hover:bg-surface/60"
                    }`}
                  >
                    <span>💬 {currentLang === "TH" ? "กำลังเจรจา" : "Active"}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-xs font-semibold ${
                        chatFilterTab === "ACTIVE"
                          ? "bg-brand-soft text-brand-ink"
                          : "bg-hover text-secondary"
                      }`}
                    >
                      {activeRoomsCount}
                    </span>
                  </button>

                  <button
                    onClick={() => setChatFilterTab("CLOSED")}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      chatFilterTab === "CLOSED"
                        ? "bg-surface text-brand-ink shadow-xs border border-line/80"
                        : "text-secondary hover:text-foreground hover:bg-surface/60"
                    }`}
                  >
                    <span>🤝 {currentLang === "TH" ? "ปิดดีลแล้ว" : "Closed"}</span>
                    {closedRoomsCount > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-md text-xs font-semibold ${
                          chatFilterTab === "CLOSED"
                            ? "bg-brand-soft text-brand-ink"
                            : "bg-hover text-secondary"
                        }`}
                      >
                        {closedRoomsCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setChatFilterTab("ALL")}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      chatFilterTab === "ALL"
                        ? "bg-surface text-foreground shadow-xs border border-line/80"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
                    }`}
                  >
                    {currentLang === "TH" ? "ทั้งหมด" : "All"}
                  </button>
                </div>

                <div className="divide-y divide-line overflow-y-auto flex-1">
                  {filteredChatRooms.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground space-y-2">
                      <div className="text-2xl">
                        {chatFilterTab === "ACTIVE" ? "💬" : "🤝"}
                      </div>
                      <p className="text-xs">
                        {chatFilterTab === "ACTIVE"
                          ? (currentLang === "TH"
                              ? "ไม่มีแชทที่กำลังเจรจาอยู่ในขณะนี้"
                              : "No active chats at the moment")
                          : (currentLang === "TH"
                              ? "ยังไม่มีแชทที่ปิดดีลหรือสิ้นสุดแล้ว"
                              : "No closed deal chats yet")}
                      </p>
                    </div>
                  ) : (
                    filteredChatRooms.map((room) => {
                      const isSelected = activeChatRoom ? room.id === activeChatRoom.id : false;
                      const isDealClosed = room.status === "DEAL_CLOSED";
                      const isArchived = room.status === "ARCHIVED";

                      return (
                        <button
                          key={room.id}
                          onClick={() => {
                            setActiveChatRoomId(room.id);
                            fetchMessages(room.id, true);
                          }}
                          className={`w-full p-4 text-left flex items-start gap-3 transition cursor-pointer ${
                            isSelected
                              ? "bg-brand-soft/90 border-l-4 border-l-emerald-600"
                              : "hover:bg-surface"
                          }`}
                        >
                          <div
                            className={`w-11 h-11 rounded-full text-white font-semibold flex items-center justify-center shrink-0 relative ${
                              isDealClosed
                                ? "bg-emerald-700 ring-2 ring-emerald-300"
                                : isArchived
                                ? "bg-secondary"
                                : "bg-emerald-800"
                            }`}
                          >
                            {room.partnerName.charAt(0)}
                            {(room.unreadCount || 0) > 0 && (
                              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm text-foreground truncate">
                                {room.partnerName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {room.lastTime}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs font-semibold text-warning-ink truncate">
                                📦 {room.post.title}
                              </span>
                            </div>

                            {/* Status Badges on Room Item */}
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              {isDealClosed && (
                                <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md bg-brand-soft text-brand-ink border border-brand-line">
                                  ✅ {currentLang === "TH" ? "ปิดดีลสำเร็จ" : "Deal Closed"}
                                </span>
                              )}
                              {isArchived && (
                                <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md bg-hover text-secondary border border-line-strong">
                                  🔒 {currentLang === "TH" ? "ปิดการขายแล้ว" : "Sold to other"}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-1 gap-2">
                              <span className="text-xs text-muted-foreground truncate">
                                {room.lastMessage}
                              </span>
                              {(room.unreadCount || 0) > 0 && (
                                <span className="shrink-0 px-2 py-0.5 rounded-full bg-rose-500 text-white font-semibold text-xs shadow-sm animate-pulse">
                                  {room.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right 8 Columns: Active Chat Window or Welcome Empty Dashboard */}
              {activeChatRoom ? (
                <div className="lg:col-span-8 flex flex-col h-full bg-surface overflow-hidden">
                  {/* Chat Header */}
                  <button type="button" onClick={() => setActiveChatRoomId(0)} className="flex min-h-11 items-center gap-2 border-b border-line px-4 text-sm text-secondary lg:hidden"><ArrowLeft className="h-4 w-4" />{currentLang === "TH" ? "กลับไปข้อความทั้งหมด" : "All conversations"}</button>
                  <div className="shrink-0 p-4 border-b border-line flex flex-wrap items-center justify-between gap-3 bg-surface z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-800 text-white font-semibold flex items-center justify-center">
                        {activeChatRoom.partnerName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-foreground flex flex-wrap items-center gap-1.5">
                          <span>{activeChatRoom.partnerName}</span>
                          <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-warning-soft text-warning-ink border border-warning-line">
                            <Star className="w-3 h-3 fill-amber-400 text-warning-ink" />
                            {(activeChatRoom.partnerRating ?? 5.0).toFixed(1)} ({activeChatRoom.partnerRatingCount ?? 0})
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-soft text-brand-ink border border-brand-line">
                            🛡️ {activeChatRoom.partnerTrustScore ?? 100}/100
                          </span>
                          <span className="text-xs font-normal text-muted-foreground">
                            ({activeChatRoom.lastActive})
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-warning-ink">
                          📦 {activeChatRoom.post.title}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeChatRoom.status === "DEAL_CLOSED" ? (
                        <div className="px-3.5 py-1.5 rounded-full bg-brand-soft text-brand-ink border border-brand-line font-semibold text-xs flex items-center gap-1.5 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-ink" />
                          <span>{currentLang === "TH" ? "ปิดดีลสำเร็จแล้ว" : "Deal Closed"}</span>
                        </div>
                      ) : activeChatRoom.status === "ARCHIVED" || activeChatRoom.post?.status === "CLOSED" ? (
                        <div className="px-3.5 py-1.5 rounded-full bg-muted text-secondary border border-line-strong font-semibold text-xs flex items-center gap-1.5 shadow-2xs">
                          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{currentLang === "TH" ? "ปิดการขายแล้ว" : "Listing Closed"}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            const pricePerKg = activeChatRoom.post?.pricePerKg || 170;
                            const qty = activeChatRoom.post?.quantityKg || 5000;
                            setDealAgreedPricePerKg(String(pricePerKg));
                            setDealAgreedQty(String(qty));
                            setDealAgreedPrice(String(pricePerKg * qty));
                            setDealSuccessMsg(null);
                            setDealErrorMsg(null);
                            setShowCloseDealModal(true);
                          }}
                          className="px-3.5 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Handshake className="w-3.5 h-3.5" /> {t.dealButton}
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenPostDetail(activeChatRoom.post)}
                        className="px-3.5 py-1.5 rounded-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <Store className="w-3.5 h-3.5" /> {currentLang === "TH" ? "ดูประกาศสวน/ล้ง" : "View Listing"}
                      </button>

                      {activeChatRoom.hasReviewedByMe ? (
                        <div className="px-3.5 py-1.5 rounded-full bg-info-soft text-info-ink border border-info-line font-semibold text-xs flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-warning-ink" />
                          <span>{currentLang === "TH" ? "รีวิวคู่ค้าแล้ว" : "Reviewed"}</span>
                        </div>
                      ) : activeChatRoom.status === "DEAL_CLOSED" ? (
                        <button
                          onClick={() => {
                            setReviewRating(5);
                            setReviewComment("");
                            setReviewErrorMsg(null);
                            setReviewSuccessMsg(null);
                            setShowReviewModal(true);
                          }}
                          className="px-3.5 py-1.5 rounded-full bg-sky-700 hover:bg-sky-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer animate-pulse"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-300 text-warning-ink" />
                          <span>{currentLang === "TH" ? "ให้คะแนนดาวคู่ค้า (1-5★)" : "Rate Partner (1-5★)"}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              currentLang === "TH"
                                ? "💡 ระบบให้คะแนนดาวคู่ค้า (1–5 ดาว) จะเปิดให้ใช้งานหลังจากกด 'ตกลงราคา (ปิดดีล)' สำเร็จแล้ว เพื่อป้องกันการให้คะแนนเท็จครับ"
                                : "💡 Partner star ratings (1–5 stars) unlock after closing the deal."
                            )
                          }
                          className="px-3.5 py-1.5 rounded-full bg-muted hover:bg-hover text-muted-foreground font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
                          title="เปิดให้รีวิวหลังปิดดีล"
                        >
                          <Star className="w-3.5 h-3.5" />
                          <span>{currentLang === "TH" ? "รีวิวคู่ค้า (หลังปิดดีล)" : "Review (After Deal)"}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Notice Banner in Chat */}
                  {activeChatRoom.status === "DEAL_CLOSED" && (
                    <div className="px-4 py-2.5 bg-brand-soft border-b border-brand-line flex items-center gap-2 text-xs text-brand-ink shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-brand-ink shrink-0" />
                      <span>
                        {currentLang === "TH"
                          ? "🎉 ห้องนี้ได้ตกลงราคาปิดดีลสำเร็จเรียบร้อยแล้ว ท่านสามารถสนทนาเพื่อนัดหมายวันตัด/ส่งมอบผลผลิต และกดปุ่มรีวิวคู่ค้าได้"
                          : "🎉 This deal has been accepted and closed! You may continue chatting to coordinate delivery and leave a review."}
                      </span>
                    </div>
                  )}

                  {(activeChatRoom.status === "ARCHIVED" || activeChatRoom.post?.status === "CLOSED") &&
                    activeChatRoom.status !== "DEAL_CLOSED" && (
                      <div className="px-4 py-2.5 bg-muted border-b border-line flex items-center gap-2 text-xs text-secondary shrink-0">
                        <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span>
                          {currentLang === "TH"
                            ? `🔒 ประกาศ "${activeChatRoom.post.title}" ได้ทำการตกลงซื้อขาย (ปิดดีล) กับคู่ค้ารายอื่นแล้ว (คุณยังสามารถสนทนาเพื่อสอบถามผลผลิตล็อตถัดไปได้)`
                            : `🔒 Listing "${activeChatRoom.post.title}" has been closed with another partner. (You may still chat to inquire about future lots)`}
                        </span>
                      </div>
                    )}

                  {/* Chat Messages Body + Product Reference Card (ตามรูปที่ 5) */}
                  <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-subtle/40">
                    {(activeChatRoom.messages || []).length === 0 && (
                      <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                        <MessageSquare className="w-8 h-8 text-muted-foreground mb-2" />
                        <p className="text-xs">
                          {currentLang === "TH"
                            ? "เริ่มต้นการเจรจา หรือพิมพ์ข้อความพูดคุยได้เลยครับ"
                            : "Start negotiating or send a direct message below."}
                        </p>
                      </div>
                    )}
                    {(activeChatRoom.messages || []).map((msg) => {
                      if (msg.isProductCard) {
                        return (
                          <div key={msg.id} className="flex justify-end">
                            <div className="flex items-end gap-2">
                              <span className="text-xs text-muted-foreground">
                                {currentLang === "TH" ? `ส่งแล้ว ${msg.time}` : `Sent ${msg.time}`}
                              </span>
                              {/* Product Card Bubble inside Chat (ตามรูปที่ 5) */}
                              <div className="w-60 bg-surface rounded-xl border border-line shadow-sm p-3.5 space-y-3">
                                <div className="relative rounded-lg bg-subtle h-32 flex items-center justify-center border border-line">
                                  <span className="absolute top-2 right-2 bg-amber-400 text-slate-950 text-xs font-semibold px-2.5 py-0.5 rounded-md shadow-sm">
                                    {activeChatRoom.post.pricePerKg} THB{t.perKg}
                                  </span>
                                  <span className="text-5xl">👑</span>
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-warning-ink">
                                    {currentLang === "TH" ? "สนใจสินค้า:" : "Interested in:"}
                                  </div>
                                  <div className="font-semibold text-sm text-foreground line-clamp-1">
                                    {activeChatRoom.post.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {currentLang === "TH"
                                      ? `จ.${activeChatRoom.post.province} • ปริมาณ ${(activeChatRoom.post.quantityKg / 1000).toFixed(1)} ตัน`
                                      : `${translateProvinceName(activeChatRoom.post.province, currentLang)} • Qty ${(activeChatRoom.post.quantityKg / 1000).toFixed(1)} Tons`}
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    handleOpenPostDetail(activeChatRoom.post)
                                  }
                                  className="w-full py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition cursor-pointer"
                                >
                                  {currentLang === "TH" ? "ดูรายละเอียด" : "View Details"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.sender === "ME" ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-md px-4 py-2.5 rounded-xl text-sm ${
                              msg.sender === "ME"
                                ? "bg-emerald-700 text-white rounded-br-none"
                                : "bg-surface border border-line text-foreground rounded-bl-none"
                            }`}
                          >
                            <div>{msg.text}</div>
                            {msg.sender === "ME" ? (
                              <div className="text-xs mt-1 text-right text-brand-ink flex items-center justify-end gap-1">
                                {msg.status === "SENDING" ? (
                                  <>
                                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                    <span>{currentLang === "TH" ? "กำลังส่ง..." : "Sending..."}</span>
                                  </>
                                ) : msg.isRead ? (
                                  <>
                                    <CheckCheck className="w-3.5 h-3.5 text-brand-ink" />
                                    <span className="text-brand-ink font-semibold">{currentLang === "TH" ? "อ่านแล้ว" : "Read"}</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3 h-3 text-brand-ink" />
                                    <span className="text-brand-ink/90">{currentLang === "TH" ? "ส่งแล้ว" : "Sent"}</span>
                                  </>
                                )}
                                <span>•</span>
                                <span>{msg.time}</span>
                              </div>
                            ) : (
                              <div className="text-xs mt-1 text-right text-muted-foreground">
                                {msg.time}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Bottom Quick Reply Chips + Input Bar (ตามรูปที่ 5) */}
                  <div className="shrink-0 p-3.5 bg-surface border-t border-line space-y-2.5 z-10">
                    {/* Quick Reply Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {QUICK_REPLY_CHIPS.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(chip)}
                          className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full bg-muted hover:bg-brand-soft hover:text-brand-ink text-secondary border border-line/80 transition cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    {/* Message Input Form */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage(chatInputText);
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={chatInputText}
                        onChange={(e) => setChatInputText(e.target.value)}
                        placeholder={t.typeMessagePlaceholder}
                        className="flex-1 bg-muted border border-line rounded-full px-4 py-2.5 text-sm focus:bg-surface focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="submit"
                        className="w-10 h-10 rounded-full bg-amber-400 hover:bg-amber-500 text-slate-950 flex items-center justify-center shadow-sm transition shrink-0 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                /* Welcome / Empty Chat Dashboard (อ้างอิงตามรูปที่ 4 จาก ARC RAIDERS TH) */
                <div className="hidden lg:flex lg:col-span-8 flex-col items-center justify-center p-8 sm:p-12 text-center bg-subtle/70 h-full overflow-y-auto">
                  <div className="max-w-xl w-full flex flex-col items-center space-y-6">
                    {/* Big Chat Icon */}
                    <div className="w-20 h-20 rounded-2xl bg-warning-soft/90 border border-warning-line/80 flex items-center justify-center text-warning-ink shadow-sm">
                      <MessageSquare className="w-10 h-10 fill-amber-500 text-warning-ink" />
                    </div>

                    {/* Titles */}
                    <div className="space-y-2">
                      <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                        {currentLang === "TH"
                          ? "ระบบแชทเจรจาซื้อขาย DURIAN HUB"
                          : "DURIAN HUB TRADE MESSENGER"}
                      </h2>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                        {currentLang === "TH"
                          ? "ยินดีต้อนรับสู่ระบบเจรจาซื้อขายและสนทนาแบบ Real-time โปรดเลือกห้องแชทด้านซ้ายเพื่อเริ่มการสนทนา"
                          : "Welcome to real-time negotiation and direct trade messaging. Select a conversation from the left to start chatting."}
                      </p>
                    </div>

                    {/* 3 Feature Cards (เหมือนรูปที่ 4) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full text-left">
                      <div className="bg-surface p-4 rounded-xl border border-line/90 shadow-sm flex flex-col items-center text-center space-y-2 hover:border-warning-line transition">
                        <div className="w-10 h-10 rounded-lg bg-warning-soft text-warning-ink flex items-center justify-center">
                          <Zap className="w-5 h-5 text-warning-ink" />
                        </div>
                        <div className="font-semibold text-xs text-foreground">
                          {currentLang === "TH" ? "ตอบด่วนทันใจ" : "Quick Replies"}
                        </div>
                        <div className="text-xs text-muted-foreground leading-normal">
                          {currentLang === "TH"
                            ? "ใช้ข้อความลัดช่วยเจรจา ต่อรองราคา และสอบถามข้อมูล"
                            : "Use instant reply chips to negotiate prices and questions fast."}
                        </div>
                      </div>

                      <div className="bg-surface p-4 rounded-xl border border-line/90 shadow-sm flex flex-col items-center text-center space-y-2 hover:border-brand-line transition">
                        <div className="w-10 h-10 rounded-lg bg-brand-soft text-brand-ink flex items-center justify-center">
                          <Handshake className="w-5 h-5 text-brand-ink" />
                        </div>
                        <div className="font-semibold text-xs text-foreground">
                          {currentLang === "TH" ? "ปิดดีลในแชท" : "Close Trade Deal"}
                        </div>
                        <div className="text-xs text-muted-foreground leading-normal">
                          {currentLang === "TH"
                            ? "สรุปราคา นัดวันตัด/ส่งมอบ พร้อมสัญญาบันทึกตรงเข้าฐานข้อมูล"
                            : "Agree on price, volume & harvest date with logged trade records."}
                        </div>
                      </div>

                      <div className="bg-surface p-4 rounded-xl border border-line/90 shadow-sm flex flex-col items-center text-center space-y-2 hover:border-brand-line transition">
                        <div className="w-10 h-10 rounded-lg bg-brand-soft text-brand-ink flex items-center justify-center">
                          <ShieldCheck className="w-5 h-5 text-brand-ink" />
                        </div>
                        <div className="font-semibold text-xs text-foreground">
                          {currentLang === "TH" ? "คู่ค้าตรวจสอบได้" : "Verified Traders"}
                        </div>
                        <div className="text-xs text-muted-foreground leading-normal">
                          {currentLang === "TH"
                            ? "สมาชิกยืนยันอีเมลและบทบาทจริง มั่นใจทุกการติดต่อ"
                            : "Verified accounts and roles ensure secure trade negotiations."}
                        </div>
                      </div>
                    </div>

                    {/* Secondary Guide Box */}
                    <div className="w-full bg-emerald-950 text-white p-5 rounded-xl shadow-md border border-brand-line text-left flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-emerald-800 text-brand-ink flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-brand-ink flex items-center gap-1.5">
                          {currentLang === "TH" ? "คำแนะนำการใช้งานห้องแชท" : "Chat System Tips"}
                        </div>
                        <p className="text-xs text-brand-ink/80 leading-relaxed">
                          {currentLang === "TH"
                            ? "คลิกเลือกรายชื่อการสนทนาทางด้านซ้ายเพื่อเปิดอ่านข้อความ หรือไปที่ตลาดกลางเพื่อค้นหาประกาศและกด \"ติดต่อผู้ขาย / เจรจาซื้อขาย\" เพื่อเริ่มห้องแชทใหม่"
                            : "Select a conversation from the left list to read messages, or visit Marketplace to open a new negotiation chat."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
      </main>

      {/* =====================================================================
          MODAL 1: SECURE CHANNEL LINK CONFIRMATION (อ้างอิงตามรูปที่ 4 ทุกจุด)
         ===================================================================== */}
      {showChatConfirmModal && (
        <DialogFrame label="เริ่มสนทนา" onClose={() => setShowChatConfirmModal(false)} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-md w-full border border-line shadow-panel overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Top Header */}
            <div className="px-6 py-4 bg-subtle border-b border-line flex items-center gap-2 text-xs font-semibold text-warning-ink uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> SECURE CHANNEL LINK
            </div>

            {/* Body */}
            <div className="p-6 text-center space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {currentLang === "TH"
                    ? "คุณต้องการส่งข้อความหรือไม่?"
                    : "Do you want to send a message?"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentLang === "TH"
                    ? "คุณกำลังจะเปิดห้องแชทเจรจาสำหรับรายการนี้ โปรดตรวจสอบรายละเอียดก่อนยืนยัน"
                    : "You are about to start a live negotiation chat for this listing. Please review before confirming."}
                </p>
              </div>

              {/* Item Preview Box */}
              <div className="p-3.5 rounded-xl bg-subtle border border-line flex items-center gap-3.5 text-left">
                <div className="w-12 h-12 rounded-lg bg-warning-soft border border-warning-line flex items-center justify-center text-2xl shrink-0">
                  👑
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-foreground truncate">
                    {selectedPost.title}
                  </div>
                  <div className="text-sm font-semibold text-warning-ink">
                    {selectedPost.pricePerKg} THB {t.perKg}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    👤 {selectedPost.authorName} ({selectedPost.businessName})
                  </div>
                </div>
              </div>

              {/* Anti-Spam Warning Box */}
              <div className="p-3 rounded-lg bg-warning-soft border border-warning-line/90 text-warning-ink text-xs font-semibold flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning-ink shrink-0" />
                {currentLang === "TH"
                  ? "คำเตือน: การกดก่อกวน ปั่นราคา หรือ Spam อาจทำให้บัญชีถูกระงับ"
                  : "Warning: Spamming, price manipulation or abuse may result in account suspension."}
              </div>
            </div>

            {/* Footer Buttons: ยกเลิก | ยืนยัน > */}
            <div className="grid grid-cols-2 border-t border-line">
              <button
                type="button"
                onClick={() => setShowChatConfirmModal(false)}
                className="py-3.5 text-sm font-semibold text-secondary hover:bg-muted transition cursor-pointer"
              >
                {currentLang === "TH" ? "ยกเลิก" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleConfirmStartChat}
                className="py-3.5 text-sm font-semibold bg-amber-400 hover:bg-amber-500 text-slate-950 transition flex items-center justify-center gap-1 cursor-pointer"
              >
                {currentLang === "TH" ? "ยืนยัน" : "Confirm"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </DialogFrame>
      )}

      {/* =====================================================================
          MODAL 2: CREATE NEW POST MODAL (ตามบทบาทที่ล็อกอิน)
         ===================================================================== */}
      {showCreatePostModal && (
        <DialogFrame label="ลงประกาศใหม่" onClose={() => setShowCreatePostModal(false)} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-lg w-full border border-line shadow-panel overflow-hidden">
            <div className="px-6 py-4 bg-subtle border-b border-line flex items-center justify-between">
              <div>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    ROLE_CONFIG[userProfile.activeRole].badgeBg
                  }`}
                >
                  {currentLang === "TH"
                    ? `ผู้ลงประกาศ: ${ROLE_CONFIG[userProfile.activeRole].shortTitle} (${userProfile.fullName})`
                    : `Poster: ${ROLE_CONFIG[userProfile.activeRole].shortTitle} (${userProfile.fullName})`}
                </span>
                <h3 className="font-semibold text-base text-foreground mt-1">
                  {newPostType === "SELL"
                    ? (currentLang === "TH" ? "ลงประกาศขายทุเรียนหน้าสวน (Sell Orders)" : "New Orchard Sell Listing (Sell Orders)")
                    : newPostType === "BUY"
                    ? (currentLang === "TH" ? "ตั้งประกาศรับซื้อทุเรียนหน้าล้ง (Buy Orders)" : "New Lhong Buy Listing (Buy Orders)")
                    : (currentLang === "TH" ? "ลงประกาศคิวว่างรับตัดทุเรียน (Cut Service)" : "New Harvesting Crew Listing (Cut Service)")}
                </h3>
              </div>
              <button
                onClick={() => setShowCreatePostModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-secondary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewPost} className="p-6 space-y-3.5 text-sm">
              {/* Category / Column Selector - Locked to Active Role */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-secondary">
                    {currentLang === "TH" ? "หมวดหมู่ประกาศ (ล็อกตามบทบาทปัจจุบันของคุณ) *" : "Listing Category (Locked to your active role) *"}
                  </label>
                  <span className="text-xs font-semibold text-brand-ink flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    {ROLE_CONFIG[userProfile.activeRole].shortTitle}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-muted rounded-xl">
                  {/* Button 1: SELL */}
                  <div
                    className={`py-2 px-1 text-center text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 ${
                      newPostType === "SELL"
                        ? "bg-emerald-700 text-white shadow-sm"
                        : "opacity-40 text-muted-foreground bg-hover/50 cursor-not-allowed"
                    }`}
                  >
                    <span>🟢 {currentLang === "TH" ? "ขายหน้าสวน" : "Sell"}</span>
                    {newPostType !== "SELL" && <Lock className="w-3 h-3 ml-0.5" />}
                  </div>

                  {/* Button 2: BUY */}
                  <div
                    className={`py-2 px-1 text-center text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 ${
                      newPostType === "BUY"
                        ? "bg-sky-700 text-white shadow-sm"
                        : "opacity-40 text-muted-foreground bg-hover/50 cursor-not-allowed"
                    }`}
                  >
                    <span>🔵 {currentLang === "TH" ? "รับซื้อหน้าล้ง" : "Buy"}</span>
                    {newPostType !== "BUY" && <Lock className="w-3 h-3 ml-0.5" />}
                  </div>

                  {/* Button 3: CUT_SERVICE */}
                  <div
                    className={`py-2 px-1 text-center text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 ${
                      newPostType === "CUT_SERVICE"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "opacity-40 text-muted-foreground bg-hover/50 cursor-not-allowed"
                    }`}
                  >
                    <span>🟡 {currentLang === "TH" ? "รับตัดทุเรียน" : "Cut"}</span>
                    {newPostType !== "CUT_SERVICE" && <Lock className="w-3 h-3 ml-0.5" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 flex items-start gap-1">
                  <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span>
                    {currentLang === "TH"
                      ? `บัญชีของคุณอยู่ในบทบาท "${ROLE_CONFIG[userProfile.activeRole].title}" สามารถลงประกาศได้เฉพาะหมวดนี้เท่านั้น (หากต้องการลงหมวดอื่น โปรดยื่นขอเพิ่มบทบาทที่ 2 และกดสลับบทบาทที่แถบด้านบน)`
                      : `You are currently in role "${ROLE_CONFIG[userProfile.activeRole].title}". Switch your active role from the navbar to post in other categories.`}
                  </span>
                </p>
              </div>

              <div>
                <label htmlFor="user-field-15" className="block text-xs font-semibold text-secondary mb-1">
                  {currentLang === "TH" ? "หัวข้อประกาศ *" : "Listing Title *"}
                </label>
                <input id="user-field-15"
                  type="text"
                  required
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder={
                    newPostType === "SELL"
                      ? (currentLang === "TH" ? "เช่น หมอนทองเกรดส่งออก AB แป้ง 34% พร้อมตัด 5 ตัน" : "e.g. Export Monthong Grade AB, 34% dry matter, 5 tons")
                      : newPostType === "BUY"
                      ? (currentLang === "TH" ? "เช่น รับซื้อหมอนทองเกรด AB ให้ราคาสูง จ่ายสดหน้าล้ง" : "e.g. Buying Grade AB Monthong, high price, cash on delivery")
                      : (currentLang === "TH" ? "เช่น ทีมตัดช่างเอก ระยอง-จันทบุรี คิวว่างพร้อมตัด" : "e.g. Master Eak Harvesting Team, Rayong-Chanthaburi available")
                  }
                  className="w-full border border-line rounded-lg px-3.5 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="user-field-16" className="block text-xs font-semibold text-secondary mb-1">
                    {currentLang === "TH" ? "สายพันธุ์ทุเรียน" : "Durian Variety"}
                  </label>
                  <select id="user-field-16"
                    value={newPostVariety}
                    onChange={(e) => setNewPostVariety(e.target.value)}
                    className="w-full border border-line rounded-lg px-3 py-2 text-sm bg-surface"
                  >
                    {VARIETY_STRIP_ITEMS.filter((v) => v.id !== "ALL").map(
                      (v) => (
                        <option key={v.id} value={v.id}>
                          {translateVarietyName(v.nameTh, currentLang)}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label htmlFor="user-field-17" className="block text-xs font-semibold text-secondary mb-1">
                    {currentLang === "TH" ? "เกรดทุเรียน" : "Durian Grade"}
                  </label>
                  <select id="user-field-17"
                    value={newPostGrade}
                    onChange={(e) => setNewPostGrade(e.target.value)}
                    className="w-full border border-line rounded-lg px-3 py-2 text-sm bg-surface"
                  >
                    <option value="AB ส่งออก">{currentLang === "TH" ? "AB ส่งออก" : "AB Export"}</option>
                    <option value="C รอง">{currentLang === "TH" ? "เกรด C รอง" : "Grade C Domestic"}</option>
                    <option value="คัดพิเศษ GI">{currentLang === "TH" ? "คัดพิเศษ GI" : "Premium GI"}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="user-field-18" className="block text-xs font-semibold text-secondary mb-1">
                    {currentLang === "TH" ? "ภูมิภาค" : "Region"}
                  </label>
                  <select id="user-field-18"
                    value={newPostRegion}
                    onChange={(e) => {
                      const regName = e.target.value;
                      setNewPostRegion(regName);
                      const regObj = REGIONAL_SEASONS_DATA.find(
                        (r) => r.regionName === regName
                      );
                      if (regObj && regObj.provinces.length > 0) {
                        setNewPostProvince(regObj.provinces[0]);
                      }
                    }}
                    className="w-full border border-line rounded-lg px-3 py-2 text-sm bg-surface"
                  >
                    {REGIONAL_SEASONS_DATA.map((r) => (
                      <option key={r.id} value={r.regionName}>
                        {translateRegionName(r.regionName, currentLang)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="user-field-19" className="block text-xs font-semibold text-secondary mb-1">
                    {currentLang === "TH" ? "จังหวัด" : "Province"}
                  </label>
                  <select id="user-field-19"
                    value={newPostProvince}
                    onChange={(e) => setNewPostProvince(e.target.value)}
                    className="w-full border border-line rounded-lg px-3.5 py-2 text-sm bg-surface"
                  >
                    {(
                      REGIONAL_SEASONS_DATA.find(
                        (r) => r.regionName === newPostRegion
                      )?.provinces || ["จันทบุรี", "ระยอง", "ตราด"]
                    ).map((prov) => (
                      <option key={prov} value={prov}>
                        {currentLang === "TH" ? `จ.${prov}` : translateProvinceName(prov, currentLang)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="user-field-20" className="block text-xs font-semibold text-secondary mb-1">
                    {newPostType === "CUT_SERVICE"
                      ? (currentLang === "TH" ? "ค่าแรงตัด (บาท/กก.) *" : "Cutting Wage (THB/kg) *")
                      : newPostType === "BUY"
                      ? (currentLang === "TH" ? "ราคารับซื้อ (บาท/กก.) *" : "Buy Price (THB/kg) *")
                      : (currentLang === "TH" ? "ราคาขาย (บาท/กก.) *" : "Sell Price (THB/kg) *")}
                  </label>
                  <input id="user-field-20"
                    type="number"
                    step="0.5"
                    required
                    value={newPostPrice}
                    onChange={(e) => setNewPostPrice(e.target.value)}
                    className="w-full border border-line rounded-lg px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="user-field-21" className="block text-xs font-semibold text-secondary mb-1">
                    {newPostType === "BUY"
                      ? (currentLang === "TH" ? "ปริมาณที่ต้องการรับซื้อ (กก.) *" : "Target Quantity (kg) *")
                      : (currentLang === "TH" ? "ปริมาณผลผลิต (กก.) *" : "Production Quantity (kg) *")}
                  </label>
                  <input id="user-field-21"
                    type="number"
                    step="100"
                    required
                    value={newPostQty}
                    onChange={(e) => setNewPostQty(e.target.value)}
                    className="w-full border border-line rounded-lg px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="user-field-22" className="block text-xs font-semibold text-secondary mb-1">
                  {currentLang === "TH" ? "รายละเอียดเพิ่มเติม / ช่องทางติดต่อ" : "Additional Details / Contact Info"}
                </label>
                <textarea id="user-field-22"
                  rows={2}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={
                    currentLang === "TH"
                      ? "เช่น มีใบรับรอง GAP สวนอยู่แถวขลุง พร้อมตัดวันที่ 15 พ.ค. นัดดูสวนได้"
                      : "e.g. Certified GAP orchard, Khlung district, ready to harvest on May 15."
                  }
                  className="w-full border border-line rounded-lg px-3.5 py-2 text-sm"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreatePostModal(false)}
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold text-secondary hover:bg-muted transition cursor-pointer"
                >
                  {currentLang === "TH" ? "ยกเลิก" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition cursor-pointer"
                >
                  {currentLang === "TH" ? "ลงประกาศทันที" : "Publish Listing"}
                </button>
              </div>
            </form>
          </div>
        </DialogFrame>
      )}

      {/* =====================================================================
          MODAL: CLOSE DEAL CONFIRMATION (ตกลงราคา & บันทึกสัญญาปิดดีล)
         ===================================================================== */}
      {showCloseDealModal && activeChatRoom && (
        <DialogFrame label="ยืนยันข้อตกลง" onClose={() => setShowCloseDealModal(false)} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-lg w-full border border-line shadow-panel overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-subtle border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Handshake className="w-5 h-5 text-brand-ink" />
                <h3 className="font-semibold text-base text-foreground">
                  {currentLang === "TH"
                    ? "ตกลงราคาซื้อขาย & บันทึกสัญญา (ปิดดีล)"
                    : "Confirm Trade Agreement (Close Deal)"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCloseDealModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-secondary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseDeal} className="p-6 space-y-4 text-sm">
              <div className="p-3.5 rounded-xl bg-brand-soft/80 border border-brand-line text-xs">
                <div className="font-semibold text-brand-ink">
                  {currentLang === "TH" ? "คู่สัญญาในการซื้อขาย:" : "Contract Trading Partner:"}
                </div>
                <div className="text-brand-ink mt-0.5">
                  👤 {activeChatRoom.partnerName} • 📦 {activeChatRoom.post?.title}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="user-field-23" className="block text-xs font-semibold text-secondary mb-1">
                    {currentLang === "TH" ? "ราคาตกลง (บาท/กก.) *" : "Agreed Price (THB/kg) *"}
                  </label>
                  <input id="user-field-23"
                    type="number"
                    step="0.5"
                    required
                    value={dealAgreedPricePerKg}
                    onChange={(e) => {
                      const p = e.target.value;
                      setDealAgreedPricePerKg(p);
                      const q = parseFloat(dealAgreedQty) || 0;
                      if (q > 0) setDealAgreedPrice(String((parseFloat(p) || 0) * q));
                    }}
                    className="w-full border border-line rounded-lg px-3.5 py-2 text-sm bg-surface"
                  />
                </div>
                <div>
                  <label htmlFor="user-field-24" className="block text-xs font-semibold text-secondary mb-1">
                    {currentLang === "TH" ? "ปริมาณที่ตกลง (กก.) *" : "Agreed Quantity (kg) *"}
                  </label>
                  <input id="user-field-24"
                    type="number"
                    step="100"
                    required
                    value={dealAgreedQty}
                    onChange={(e) => {
                      const q = e.target.value;
                      setDealAgreedQty(q);
                      const p = parseFloat(dealAgreedPricePerKg) || 0;
                      if (p > 0) setDealAgreedPrice(String(p * (parseFloat(q) || 0)));
                    }}
                    className="w-full border border-line rounded-lg px-3.5 py-2 text-sm bg-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="user-field-25" className="block text-xs font-semibold text-secondary mb-1">
                    {currentLang === "TH" ? "ยอดรวมทั้งสัญญา (บาท)" : "Total Contract Value (THB)"}
                  </label>
                  <input id="user-field-25"
                    type="number"
                    value={dealAgreedPrice}
                    onChange={(e) => setDealAgreedPrice(e.target.value)}
                    className="w-full border border-line rounded-lg px-3.5 py-2 text-sm bg-subtle font-semibold text-brand-ink"
                  />
                </div>
                <div>
                  <label htmlFor="user-field-26" className="block text-xs font-semibold text-secondary mb-1">
                    {currentLang === "TH" ? "วันที่นัดตัด / ส่งมอบ" : "Harvest / Delivery Date"}
                  </label>
                  <input id="user-field-26"
                    type="date"
                    value={dealCutDate}
                    onChange={(e) => setDealCutDate(e.target.value)}
                    className="w-full border border-line rounded-lg px-3.5 py-2 text-sm bg-surface"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="user-field-27" className="block text-xs font-semibold text-secondary mb-1">
                  {currentLang === "TH" ? "เงื่อนไขเพิ่มเติม / บันทึกสัญญา" : "Additional Terms / Contract Note"}
                </label>
                <input id="user-field-27"
                  type="text"
                  value={dealNote}
                  onChange={(e) => setDealNote(e.target.value)}
                  placeholder={
                    currentLang === "TH"
                      ? "เช่น มัดจำ 20% หน้าสวน, เหมาจ่ายสดวันตัด"
                      : "e.g. 20% deposit upfront, cash on delivery"
                  }
                  className="w-full border border-line rounded-lg px-3.5 py-2 text-sm bg-surface"
                />
              </div>

              {dealSuccessMsg && (
                <div className="p-3 rounded-lg bg-brand-soft border border-brand-line text-xs font-semibold text-brand-ink text-center">
                  {dealSuccessMsg}
                </div>
              )}
              {dealErrorMsg && (
                <div className="p-3 rounded-lg bg-danger-soft border border-danger-line text-xs font-semibold text-danger-ink text-center">
                  {dealErrorMsg}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCloseDealModal(false)}
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold text-secondary hover:bg-muted transition cursor-pointer"
                >
                  {currentLang === "TH" ? "ยกเลิก" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isDealLoading}
                  className="px-6 py-2.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isDealLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      {currentLang === "TH" ? "กำลังบันทึกดีล..." : "Recording Deal..."}
                    </>
                  ) : (
                    currentLang === "TH" ? "ยืนยันตกลงราคาปิดดีล" : "Confirm & Close Deal"
                  )}
                </button>
              </div>
            </form>
          </div>
        </DialogFrame>
      )}

      {/* =====================================================================
          MODAL: PARTNER STAR RATING REVIEW (ให้คะแนนดาวคู่ค้า 1 - 5 ดาว หลังปิดดีล)
         ===================================================================== */}
      {showReviewModal && activeChatRoom && (
        <DialogFrame label="รีวิวคู่ค้า" onClose={() => setShowReviewModal(false)} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-md w-full border border-line shadow-panel overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-warning-soft border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-400 text-warning-ink" />
                <h3 className="font-semibold text-base text-foreground">
                  {currentLang === "TH"
                    ? "ให้คะแนนดาวรีวิวคู่ค้า (1 - 5 ดาว)"
                    : "Rate Trading Partner (1 - 5 Stars)"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-secondary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-4 text-sm">
              {/* Partner Info Box */}
              <div className="p-3.5 rounded-xl bg-subtle border border-line/80 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-emerald-800 text-white font-semibold flex items-center justify-center text-base shrink-0">
                  {activeChatRoom.partnerName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-foreground truncate">
                    {activeChatRoom.partnerName}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    📦 ดีล: {activeChatRoom.post?.title}
                  </div>
                  <div className="text-xs font-semibold text-warning-ink mt-0.5">
                    ★ ค่าเฉลี่ยปัจจุบัน: {(activeChatRoom.partnerRating ?? 5.0).toFixed(1)} ({activeChatRoom.partnerRatingCount ?? 0} รีวิว)
                  </div>
                </div>
              </div>

              {/* Interactive 1 - 5 Star Selector */}
              <div className="text-center space-y-2 py-2">
                <div className="text-xs font-semibold text-secondary">
                  {currentLang === "TH"
                    ? "คลิกเลือกจำนวนดาวความพึงพอใจในการซื้อขายครั้งนี้"
                    : "Select star rating for this transaction"}
                </div>

                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const active = starVal <= reviewRating;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setReviewRating(starVal)}
                        className="p-1.5 rounded-xl hover:scale-110 transition cursor-pointer"
                      >
                        <Star
                          className={`w-9 h-9 transition ${
                            active
                              ? "fill-amber-400 text-warning-ink drop-shadow-xs"
                              : "text-muted-foreground hover:text-warning-ink"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="text-xs font-semibold text-warning-ink bg-warning-soft inline-block px-3 py-1 rounded-full border border-warning-line">
                  {reviewRating === 5 &&
                    (currentLang === "TH"
                      ? "⭐⭐⭐⭐⭐ (5 ดาว) - ยอดเยี่ยมมาก ซื้อขายซื่อสัตย์ แนะนำอย่างยิ่ง!"
                      : "⭐⭐⭐⭐⭐ (5 Stars) - Excellent & trustworthy partner!")}
                  {reviewRating === 4 &&
                    (currentLang === "TH"
                      ? "⭐⭐⭐⭐ (4 ดาว) - ดีมาก การซื้อขายราบรื่นดี"
                      : "⭐⭐⭐⭐ (4 Stars) - Very good & smooth trade")}
                  {reviewRating === 3 &&
                    (currentLang === "TH"
                      ? "⭐⭐⭐ (3 ดาว) - ปานกลาง พอใช้ได้"
                      : "⭐⭐⭐ (3 Stars) - Average experience")}
                  {reviewRating === 2 &&
                    (currentLang === "TH"
                      ? "⭐⭐ (2 ดาว) - ควรปรับปรุง ล่าช้ากว่ากำหนด"
                      : "⭐⭐ (2 Stars) - Below expectations")}
                  {reviewRating === 1 &&
                    (currentLang === "TH"
                      ? "⭐ (1 ดาว) - แย่มาก ไม่เป็นไปตามข้อตกลง"
                      : "⭐ (1 Star) - Poor experience")}
                </div>
              </div>

              {/* Quick Comment Chips */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  {currentLang === "TH" ? "ข้อความรีวิวแนะนำ (คลิกเพื่อเลือก):" : "Quick Review Tags:"}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "จ่ายเงินสดรวดเร็ว ตรงไปตรงมา",
                    "ทุเรียนคุณภาพดี เกรดสวยตรงปก",
                    "ตราชั่งมาตรฐาน ไม่กดราคา",
                    "พูดจาดี นัดหมายตรงเวลา",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() =>
                        setReviewComment((prev) =>
                          prev ? `${prev} ${chip}` : chip
                        )
                      }
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-muted hover:bg-brand-soft hover:text-brand-ink text-secondary border border-line transition cursor-pointer"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Input */}
              <div>
                <label htmlFor="user-field-28" className="block text-xs font-semibold text-secondary mb-1">
                  {currentLang === "TH"
                    ? "ความคิดเห็นเพิ่มเติมถึงคู่ค้า (จะแสดงในห้องแชทและประวัติร้าน)"
                    : "Review Comment (Optional)"}
                </label>
                <textarea id="user-field-28"
                  rows={2}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={
                    currentLang === "TH"
                      ? "เช่น ซื้อขายจริงใจ จ่ายเงินไว แนะนำคู่ค้ารายนี้เลยครับ..."
                      : "e.g. Great trading experience, highly recommended..."
                  }
                  className="w-full border border-line rounded-lg px-3.5 py-2 text-sm bg-surface"
                />
              </div>

              {reviewSuccessMsg && (
                <div className="p-3 rounded-lg bg-brand-soft border border-brand-line text-xs font-semibold text-brand-ink text-center">
                  {reviewSuccessMsg}
                </div>
              )}
              {reviewErrorMsg && (
                <div className="p-3 rounded-lg bg-danger-soft border border-danger-line text-xs font-semibold text-danger-ink text-center">
                  {reviewErrorMsg}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold text-secondary hover:bg-muted transition cursor-pointer"
                >
                  {currentLang === "TH" ? "ยกเลิก" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isReviewLoading}
                  className="px-6 py-2.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isReviewLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      {currentLang === "TH" ? "กำลังบันทึกดาว..." : "Submitting..."}
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 fill-slate-950" />
                      {currentLang === "TH"
                        ? `ส่งคะแนน ${reviewRating} ดาว`
                        : `Submit ${reviewRating}-Star Review`}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </DialogFrame>
      )}

      {/* ================================================================== */}
      {/* MODAL 1: PROFILE & AVATAR UPLOAD (จัดการโปรไฟล์ & อัปโหลดรูปภาพ - CLEAN LIGHT THEME) */}
      {/* ================================================================== */}
      {showProfileModal && (
        <DialogFrame label="แก้ไขโปรไฟล์" onClose={() => setShowProfileModal(false)} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface text-foreground rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-panel border border-line relative animate-in fade-in zoom-in-95 duration-150 my-8">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand-ink border border-brand-line/80 flex items-center justify-center font-semibold">
                  <User className="w-5 h-5 text-brand-ink" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    {t.editProfileTitle}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t.editProfileSub}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-hover text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Avatar Section */}
            <div className="mt-5 p-5 rounded-xl bg-subtle border border-line/80">
              <label className="block text-xs font-semibold text-secondary tracking-wider mb-3 uppercase">
                {currentLang === "TH" ? "รูปโปรไฟล์ (Profile Avatar)" : "Profile Avatar"}
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Large Avatar Preview */}
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-brand-line bg-surface shadow-md flex items-center justify-center">
                    {userProfile.avatarUrl ? (
                      <img
                        src={userProfile.avatarUrl}
                        alt="Profile Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-emerald-700    text-white font-semibold text-3xl flex items-center justify-center">
                        {userProfile.fullName ? userProfile.fullName.slice(0, 1) : "U"}
                      </div>
                    )}
                  </div>
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-surface/80 rounded-xl flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-brand-ink animate-spin" />
                    </div>
                  )}
                </div>

                {/* Upload Action & File Input */}
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition cursor-pointer">
                    <Camera className="w-4 h-4" />
                    <span>{currentLang === "TH" ? "อัปโหลดรูปภาพใหม่จากคอมพิวเตอร์" : "Upload new image from computer"}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleAvatarFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {currentLang === "TH" ? "รองรับไฟล์ JPG, PNG, WebP ขนาดไม่เกิน 5MB" : "Supports JPG, PNG, WebP up to 5MB"}
                  </p>

                  {avatarUploadSuccess && (
                    <div className="text-xs font-semibold text-brand-ink flex items-center gap-1.5 justify-center sm:justify-start">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-brand-ink" />
                      <span>{avatarUploadSuccess}</span>
                    </div>
                  )}
                  {avatarUploadError && (
                    <div className="text-xs font-semibold text-danger-ink flex items-center gap-1.5 justify-center sm:justify-start">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-danger-ink" />
                      <span>{avatarUploadError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Preset Avatars Selector */}
              <div className="mt-4 pt-4 border-t border-line">
                <span className="text-xs font-medium text-secondary block mb-2.5">
                  {currentLang === "TH" ? "หรือเลือกรูป Avatar ประจำบทบาทสำเร็จรูป:" : "Or select a preset role avatar:"}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    {
                      label: currentLang === "TH" ? "ชาวสวนทุเรียน" : "Durian Farmer",
                      url: "https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=150&auto=format&fit=crop&q=80",
                    },
                    {
                      label: currentLang === "TH" ? "ล้งรับซื้อ" : "Durian Lhong",
                      url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                    },
                    {
                      label: currentLang === "TH" ? "ทีมตัดมืออาชีพ" : "Cutting Crew",
                      url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
                    },
                    {
                      label: currentLang === "TH" ? "ผู้เชี่ยวชาญ" : "Expert",
                      url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
                    },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPresetAvatar(preset.url)}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                        userProfile.avatarUrl === preset.url
                          ? "border-brand-line bg-brand-soft/80 shadow-sm ring-2 ring-emerald-500/20"
                          : "border-line hover:border-line-strong bg-surface"
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-11 h-11 rounded-full object-cover border border-line shadow-sm"
                      />
                      <span className="text-xs text-secondary font-semibold">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Profile Information Edit Form */}
            <form onSubmit={handleSaveProfile} className="mt-5 space-y-3.5">
              <label className="block text-xs font-semibold text-foreground tracking-wider uppercase">
                {currentLang === "TH" ? "ข้อมูลส่วนตัว & ข้อมูลร้านค้า" : "Personal & Business Details"}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="user-field-29" className="block text-xs font-semibold text-secondary mb-1">
                    {currentLang === "TH" ? "ชื่อ-นามสกุลจริง *" : "Full Name *"}
                  </label>
                  <input id="user-field-29"
                    type="text"
                    required
                    value={editProfileName}
                    onChange={(e) => setEditProfileName(e.target.value)}
                    placeholder={currentLang === "TH" ? "เช่น คุณสมชาย ชาวสวนจันท์" : "e.g. John Doe"}
                    className="w-full bg-surface border border-line rounded-lg px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor="user-field-30" className="block text-xs font-semibold text-secondary mb-1">
                    {currentLang === "TH" ? "ชื่อร้านค้า / สวน / ล้ง" : "Store / Orchard / Lhong Name"}
                  </label>
                  <input id="user-field-30"
                    type="text"
                    value={editBusinessName}
                    onChange={(e) => setEditBusinessName(e.target.value)}
                    placeholder={currentLang === "TH" ? "เช่น สวนสมชาย GAP จันทบุรี" : "e.g. Somchai GAP Orchard"}
                    className="w-full bg-surface border border-line rounded-lg px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="user-field-31" className="block text-xs font-semibold text-secondary mb-1">
                    {currentLang === "TH" ? "เบอร์โทรศัพท์ติดต่อ" : "Phone Number"}
                  </label>
                  <input id="user-field-31"
                    type="tel"
                    value={editProfilePhone}
                    onChange={(e) => setEditProfilePhone(e.target.value)}
                    placeholder="เช่น 089-456-7890"
                    className="w-full bg-surface border border-line rounded-lg px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor="user-field-32" className="block text-xs font-semibold text-secondary mb-1">
                    {currentLang === "TH" ? "จังหวัดที่ตั้งผลผลิต" : "Province Location"}
                  </label>
                  <input id="user-field-32"
                    type="text"
                    value={editProfileProvince}
                    onChange={(e) => setEditProfileProvince(e.target.value)}
                    placeholder={currentLang === "TH" ? "เช่น จันทบุรี" : "e.g. Chanthaburi"}
                    className="w-full bg-surface border border-line rounded-lg px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {profileSaveMsg && (
                <div className="p-3 rounded-lg bg-muted border border-line text-xs font-semibold text-center text-foreground">
                  {profileSaveMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold text-secondary hover:bg-muted transition cursor-pointer"
                >
                  {currentLang === "TH" ? "ปิดหน้าต่าง" : "Close"}
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      {currentLang === "TH" ? "กำลังบันทึก..." : "Saving..."}
                    </>
                  ) : (
                    currentLang === "TH" ? "บันทึกข้อมูลโปรไฟล์" : "Save Profile"
                  )}
                </button>
              </div>
            </form>
          </div>
        </DialogFrame>
      )}

      {/* ================================================================== */}
      {/* MODAL 2: ประวัติการโพสต์ของคุณ (MY POST HISTORY - REAL USER POSTS) */}
      {/* ================================================================== */}
      {showMyPostsModal && (
        <DialogFrame label="ประกาศของคุณ" onClose={() => setShowMyPostsModal(false)} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface text-foreground rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-panel border border-line relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand-ink border border-brand-line/80 flex items-center justify-center font-semibold">
                  <Package className="w-5 h-5 text-brand-ink" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    {t.myPostsModalTitle}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t.myPostsModalSub}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMyPostsModal(false)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-hover text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of User's Posts */}
            <div className="flex-1 overflow-y-auto my-4 pr-1 space-y-3">
              {posts.filter((p) => p.authorName === userProfile.fullName || p.authorName.includes(userProfile.fullName)).length > 0 ? (
                posts
                  .filter((p) => p.authorName === userProfile.fullName || p.authorName.includes(userProfile.fullName))
                  .map((p) => {
                    const isClosed = p.status === "CLOSED";
                    const timeInfo = formatRelativeTime(p.createdAt);

                    return (
                      <div
                        key={p.id}
                        className={`p-4 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          isClosed
                            ? "bg-subtle border-line opacity-75"
                            : "bg-surface border-line hover:border-brand-line hover:shadow-sm"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                                p.postType === "SELL"
                                  ? "bg-brand-soft text-brand-ink"
                                  : p.postType === "BUY"
                                  ? "bg-info-soft text-info-ink"
                                  : "bg-warning-soft text-warning-ink"
                              }`}
                            >
                              {p.postType === "SELL"
                                ? (currentLang === "TH" ? "ต้องการขาย" : "Sell")
                                : p.postType === "BUY"
                                ? (currentLang === "TH" ? "ต้องการซื้อ" : "Buy")
                                : (currentLang === "TH" ? "รับตัดทุเรียน" : "Cut Service")}
                            </span>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                isClosed
                                  ? "bg-hover text-secondary"
                                  : "bg-brand-soft text-brand-ink border border-brand-line"
                              }`}
                            >
                              {isClosed ? (currentLang === "TH" ? "ปิดดีลแล้ว" : "Closed") : (currentLang === "TH" ? "กำลังเปิดรับ" : "Active")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {timeInfo.text}
                            </span>
                          </div>

                          <h4 className="font-semibold text-sm text-foreground">
                            {p.title}
                          </h4>
                          <div className="text-xs text-muted-foreground">
                            {currentLang === "TH"
                              ? `พันธุ์${p.variety} • ${p.grade} • จ.${p.province} (${p.quantityKg.toLocaleString()} กก.)`
                              : `${translateVarietyName(p.variety, currentLang)} • ${p.grade} • ${translateProvinceName(p.province, currentLang)} (${p.quantityKg.toLocaleString()} kg)`}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
                          <div className="text-left sm:text-right">
                            <div className="text-xs text-muted-foreground">{currentLang === "TH" ? "ราคาเสนอ" : "Offer Price"}</div>
                            <div className="text-base font-semibold text-brand-ink">
                              ฿{p.pricePerKg} <span className="text-xs font-normal text-muted-foreground">{t.perKg}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setShowMyPostsModal(false);
                              handleOpenPostDetail(p);
                            }}
                            className="px-3.5 py-2 rounded-lg bg-muted hover:bg-brand-soft text-secondary hover:text-brand-ink text-xs font-semibold transition cursor-pointer"
                          >
                            {currentLang === "TH" ? "ดูประกาศ" : "View Post"}
                          </button>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-12 px-4 bg-subtle rounded-2xl border border-dashed border-line">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <div className="text-sm font-semibold text-secondary">
                    {t.noPostsYet}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    {currentLang === "TH"
                      ? "เมื่อคุณลงประกาศขายหรือรับซื้อในตลาดกลาง รายการประกาศทั้งหมดจะถูกบันทึกและแสดงที่นี่"
                      : "When you post sell or buy orders in the marketplace, they will be listed and tracked here."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMyPostsModal(false);
                      handleOpenCreatePostModal();
                    }}
                    className="mt-4 px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.createFirstPost}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-line flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">
                {currentLang === "TH"
                  ? `ทั้งหมด ${posts.filter((p) => p.authorName === userProfile.fullName || p.authorName.includes(userProfile.fullName)).length} รายการ`
                  : `Total ${posts.filter((p) => p.authorName === userProfile.fullName || p.authorName.includes(userProfile.fullName)).length} Listings`}
              </span>
              <button
                type="button"
                onClick={() => setShowMyPostsModal(false)}
                className="px-5 py-2 rounded-lg bg-muted hover:bg-hover text-secondary text-xs font-semibold transition cursor-pointer"
              >
                {currentLang === "TH" ? "ปิดหน้าต่าง" : "Close"}
              </button>
            </div>
          </div>
        </DialogFrame>
      )}

      {/* ================================================================== */}
      {/* MODAL 3: คู่มือการใช้งาน (USER GUIDE - CLEAN LIGHT THEME) */}
      {/* ================================================================== */}
      {showUserGuideModal && (
        <DialogFrame label="คู่มือการใช้งาน" onClose={() => setShowUserGuideModal(false)} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface text-foreground rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-panel border border-line relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-info-soft text-info-ink border border-info-line/80 flex items-center justify-center font-semibold">
                  <BookOpen className="w-5 h-5 text-info-ink" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    {currentLang === "TH" ? "คู่มือการใช้งาน Durian Hub" : "Durian Hub User Guide"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {currentLang === "TH"
                      ? "ขั้นตอนการใช้งานแพลตฟอร์มตลาดกลางทุเรียนไทย"
                      : "Step-by-step trading guide for Thailand's Durian Hub"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUserGuideModal(false)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-hover text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3.5 text-xs text-secondary">
              <div className="p-4 rounded-xl bg-subtle border border-line/80">
                <div className="font-semibold text-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-semibold">
                    1
                  </span>
                  {currentLang === "TH" ? "สำหรับชาวสวน (ผู้ขายทุเรียน)" : "For Durian Farmers (Sellers)"}
                </div>
                <p className="mt-1 text-secondary leading-relaxed">
                  {currentLang === "TH"
                    ? "ไปที่หน้าตลาดกลางแล้วกด \"ลงประกาศใหม่\" เพื่อระบุสายพันธุ์ เกรดผลผลิต (A, B, C, D) ปริมาณ และราคาที่ต้องการขาย หรือเปิดดูโพสต์รับซื้อจากล้ง"
                    : "Go to the marketplace and click \"Create Post\" to specify your variety, grade (A, B, C, D), quantity, and target price, or browse live buy orders from Lhong warehouses."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-subtle border border-line/80">
                <div className="font-semibold text-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-700 text-white flex items-center justify-center text-xs font-semibold">
                    2
                  </span>
                  {currentLang === "TH" ? "สำหรับล้งรับซื้อ (ผู้ซื้อทุเรียน)" : "For Lhong Warehouses (Buyers)"}
                </div>
                <p className="mt-1 text-secondary leading-relaxed">
                  {currentLang === "TH"
                    ? "ตรวจสอบราคาเฉลี่ยได้ที่ \"แดชบอร์ดทุเรียนรายพื้นที่\" และพูดคุยเจรจาผ่านห้องแชทสด พร้อมกดปุ่ม \"ตกลงราคา (ปิดดีล)\" เพื่อทำสัญญารับซื้อ"
                    : "Inspect benchmark prices in the \"Regional Dashboard\", negotiate with farmers via live chat, and click \"Confirm Deal (Close Deal)\" to generate a binding agreement."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-subtle border border-line/80">
                <div className="font-semibold text-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-semibold">
                    3
                  </span>
                  {currentLang === "TH" ? "สำหรับทีมตัดทุเรียน (รับจ้างตัด)" : "For Harvesting Crews (Cut Service)"}
                </div>
                <p className="mt-1 text-secondary leading-relaxed">
                  {currentLang === "TH"
                    ? "ประกาศรับงานตัดทุเรียนตามภูมิภาค พร้อมระบุค่าจ้างต่อกิโลกรัม เพื่อให้ชาวสวนหรือล้งติดต่อจ้างงานได้สะดวก"
                    : "Post your crew availability and coverage region with your cutting wage per kg so orchards and warehouses can book your team seamlessly."}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-line text-right">
              <button
                type="button"
                onClick={() => setShowUserGuideModal(false)}
                className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition cursor-pointer"
              >
                {currentLang === "TH" ? "เข้าใจแล้ว ปิดหน้าต่าง" : "Got it, Close"}
              </button>
            </div>
          </div>
        </DialogFrame>
      )}

      {/* ================================================================== */}
      {/* MODAL 4: ขอเพิ่มบทบาทการใช้งาน (ROLE VERIFICATION REQUEST MODAL) */}
      {/* ================================================================== */}
      {showRoleRequestModal && (
        <DialogFrame label="จัดการบทบาท" onClose={() => setShowRoleRequestModal(false)} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface text-foreground rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-panel border border-line relative my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-line shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning-soft text-warning-ink border border-warning-line/80 flex items-center justify-center font-semibold">
                  <FileCheck2 className="w-5 h-5 text-warning-ink" />
                </div>
                <div>
                  <h3 className="font-semibold text-base sm:text-lg text-foreground">
                    {currentLang === "TH" ? "ยื่นเอกสารขอเพิ่มบทบาทการใช้งาน" : "Request Additional Role Verification"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {currentLang === "TH"
                      ? "ส่งหลักฐานให้ผู้ดูแลระบบตรวจสอบเพื่อปลดล็อกบทบาทใหม่ในบัญชีเดียว"
                      : "Submit verification documents to unlock multiple roles in your account"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRoleRequestModal(false)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-hover text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
              {/* Current Role Status Box */}
              <div className="p-3.5 rounded-xl bg-subtle border border-line/90 text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-muted-foreground">บทบาทที่อนุมัติแล้วของคุณ:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {userProfile.approvedRoles.map((r) => (
                      <span
                        key={r}
                        className="px-2.5 py-0.5 rounded-full font-semibold bg-brand-soft text-brand-ink border border-brand-line"
                      >
                        ✓ {ROLE_CONFIG[r].shortTitle}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">ความประพฤติ & รีวิว:</span>
                  <div className="font-semibold text-brand-ink text-sm">
                    🛡️ {userProfile.trustScore}/100 • ★ {(userProfile.rating ?? 5.0).toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Form Feedback Alerts */}
              {reqRoleError && (
                <div className="p-3.5 rounded-xl bg-danger-soft border border-danger-line text-danger-ink text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-danger-ink" />
                  <span>{reqRoleError}</span>
                </div>
              )}

              {reqRoleSuccess && (
                <div className="p-3.5 rounded-xl bg-brand-soft border border-brand-line text-brand-ink text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-brand-ink" />
                  <span>{reqRoleSuccess}</span>
                </div>
              )}

              {/* Submission Form */}
              <form onSubmit={handleSubmitExtraRoleRequest} className="space-y-4 text-xs">
                {/* 1. Target Role Selection */}
                <div>
                  <label className="block font-semibold text-foreground mb-1.5">
                    1. เลือกบทบาทที่ต้องการขอเพิ่ม
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["SELLER", "BUYER", "CUTTER"] as const).map((r) => {
                      const isAlreadyApproved = userProfile.approvedRoles.includes(r);
                      const isSelected = reqTargetRole === r;

                      return (
                        <button
                          key={r}
                          type="button"
                          disabled={isAlreadyApproved}
                          onClick={() => {
                            setReqTargetRole(r);
                            if (r === "SELLER") setReqDocType("GAP_CERTIFICATE");
                            if (r === "BUYER") setReqDocType("COMMERCIAL_LICENSE");
                            if (r === "CUTTER") setReqDocType("CUTTER_CERT_OR_PORT");
                          }}
                          className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                            isAlreadyApproved
                              ? "bg-muted text-muted-foreground border-line cursor-not-allowed opacity-60"
                              : isSelected
                              ? "bg-brand-soft border-brand-line text-brand-ink font-semibold ring-2 ring-emerald-500/20"
                              : "bg-surface border-line text-secondary hover:border-line-strong"
                          }`}
                        >
                          <span className="text-base">
                            {r === "SELLER" ? "🌱" : r === "BUYER" ? "🏢" : "✂️"}
                          </span>
                          <span className="font-semibold text-xs leading-tight">
                            {ROLE_CONFIG[r].shortTitle}
                          </span>
                          {isAlreadyApproved && (
                            <span className="text-xs text-brand-ink font-semibold">
                              (มีสิทธิ์แล้ว)
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Role Specific Document Guidance */}
                <div className="p-3.5 rounded-xl bg-warning-soft/80 border border-warning-line/90 text-warning-ink text-xs space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-warning-ink">
                    <Info className="w-3.5 h-3.5 text-warning-ink" />
                    <span>คำแนะนำเอกสารสำหรับ {ROLE_CONFIG[reqTargetRole].shortTitle}:</span>
                  </div>
                  <p className="text-secondary leading-relaxed">
                    {reqTargetRole === "SELLER" &&
                      "• แนบสมุดทะเบียนเกษตรกร (ทบก.), ใบรับรองมาตรฐาน GAP สวนทุเรียน หรือรูปถ่ายแปลงทุเรียนคู่บัตรประชาชน"}
                    {reqTargetRole === "BUYER" &&
                      "• แนบหนังสือรับรองนิติบุคคล / ทะเบียนพาณิชย์ หรือใบอนุญาตประกอบกิจการล้งรับซื้อ หรือรูปถ่ายหน้าล้งคู่ป้ายร้าน"}
                    {reqTargetRole === "CUTTER" &&
                      "• แนบใบผ่านการอบรมหลักสูตรนักตัดทุเรียนมืออาชีพ หรือรูปถ่ายผลงาน/รถตัดคู่บัตรประชาชน"}
                  </p>
                </div>

                {/* 2. Business Name & License */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="user-field-33" className="block font-semibold text-secondary mb-1">
                      2. ชื่อแปลง / ชื่อล้ง / ชื่อทีมตัด <span className="text-danger-ink">*</span>
                    </label>
                    <input id="user-field-33"
                      type="text"
                      required
                      value={reqBizName}
                      onChange={(e) => setReqBizName(e.target.value)}
                      placeholder={
                        reqTargetRole === "SELLER"
                          ? "เช่น สวนทุเรียนสมชาย"
                          : reqTargetRole === "BUYER"
                          ? "เช่น ล้งเจริญผลค้าผลไม้"
                          : "เช่น ทีมตัดช่างเอก ระยอง"
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg border border-line text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-line text-xs"
                    />
                  </div>

                  <div>
                    <label htmlFor="user-field-34" className="block font-semibold text-secondary mb-1">
                      3. เลขทะเบียน / เลข GAP (ถ้ามี)
                    </label>
                    <input id="user-field-34"
                      type="text"
                      value={reqLicenseNo}
                      onChange={(e) => setReqLicenseNo(e.target.value)}
                      placeholder="เช่น GAP-22-9901 / ทบก. 12345"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-line text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-line text-xs"
                    />
                  </div>
                </div>

                {/* 3. Document Type */}
                <div>
                  <label htmlFor="user-field-35" className="block font-semibold text-secondary mb-1">
                    4. ประเภทเอกสารที่แนบ <span className="text-danger-ink">*</span>
                  </label>
                  <select id="user-field-35"
                    value={reqDocType}
                    onChange={(e) => setReqDocType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-line text-foreground bg-surface focus:outline-none focus:border-brand-line text-xs cursor-pointer"
                  >
                    {reqTargetRole === "SELLER" && (
                      <>
                        <option value="GAP_CERTIFICATE">ใบรับรองมาตรฐาน GAP สวนทุเรียน</option>
                        <option value="FARMER_BOOK">สมุดทะเบียนเกษตรกร (ทบก.)</option>
                        <option value="NATIONAL_ID_WITH_PIC">รูปถ่ายแปลงทุเรียนจริงคู่กับบัตรประชาชน</option>
                      </>
                    )}
                    {reqTargetRole === "BUYER" && (
                      <>
                        <option value="COMMERCIAL_LICENSE">หนังสือรับรองนิติบุคคล / ทะเบียนพาณิชย์ หรือใบอนุญาตล้ง</option>
                        <option value="NATIONAL_ID_WITH_PIC">รูปถ่ายหน้าโกดัง/ล้งรับซื้อคู่กับป้ายร้าน</option>
                      </>
                    )}
                    {reqTargetRole === "CUTTER" && (
                      <>
                        <option value="CUTTER_CERT_OR_PORT">ใบผ่านการอบรมนักตัดทุเรียน หรือประวัติผลงาน</option>
                        <option value="NATIONAL_ID_WITH_PIC">ภาพถ่ายรถตัด/อุปกรณ์ทีมตัดคู่กับบัตรประชาชน</option>
                      </>
                    )}
                  </select>
                </div>

                {/* 4. Upload File Input */}
                <div>
                  <label className="block font-semibold text-secondary mb-1">
                    5. แนบไฟล์หลักฐาน (รูปถ่าย หรือ PDF ขนาดไม่เกิน 10MB) <span className="text-danger-ink">*</span>
                  </label>
                  <div className="border-2 border-dashed border-line hover:border-brand-line rounded-xl p-4 text-center transition bg-subtle/50">
                    <input
                      type="file"
                      id="role-doc-file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={(e) => setReqFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="role-doc-file"
                      className="cursor-pointer flex flex-col items-center gap-1.5"
                    >
                      <Upload className="w-6 h-6 text-brand-ink" />
                      <span className="font-semibold text-secondary">
                        {reqFile ? reqFile.name : "คลิกเพื่อเลือกไฟล์รูปภาพหรือเอกสาร PDF"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        รองรับ JPEG, PNG, WebP หรือ PDF (สูงสุด 10MB)
                      </span>
                    </label>
                  </div>
                </div>

                {/* 5. Additional Note */}
                <div>
                  <label htmlFor="user-field-36" className="block font-semibold text-secondary mb-1">
                    6. หมายเหตุเพิ่มเติม (ระบุหรือไม่ก็ได้)
                  </label>
                  <textarea id="user-field-36"
                    rows={2}
                    value={reqNote}
                    onChange={(e) => setReqNote(e.target.value)}
                    placeholder="เช่น ขอยื่นเอกสารเพื่อรับซื้อทุเรียนโซนจันทบุรี มีโกดังพร้อมตาชั่งมาตรฐาน"
                    className="w-full px-3.5 py-2 rounded-lg border border-line text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-line text-xs"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmittingRoleReq}
                  className="w-full py-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-md  transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingRoleReq ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>กำลังส่งคำขอและอัปโหลดเอกสาร...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4" />
                      <span>ส่งเอกสารให้แอดมินพิจารณาอนุมัติ</span>
                    </>
                  )}
                </button>
              </form>

              {/* Request History Section */}
              {realRoleRequests.length > 0 && (
                <div className="pt-4 border-t border-line space-y-3">
                  <h4 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>ประวัติการยื่นคำขอของคุณ ({realRoleRequests.length} รายการ)</span>
                  </h4>

                  <div className="space-y-2">
                    {realRoleRequests.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-xl border border-line/90 bg-subtle/70 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">
                            ขอเพิ่ม: {ROLE_CONFIG[r.requestedRole]?.shortTitle || r.requestedRole} ({r.businessName})
                          </span>
                          {r.status === "PENDING" ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-warning-soft text-warning-ink border border-warning-line">
                              🟡 รอแอดมินตรวจสอบ
                            </span>
                          ) : r.status === "APPROVED" ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-soft text-brand-ink border border-brand-line">
                              🟢 อนุมัติแล้ว
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-danger-soft text-danger-ink border border-danger-line">
                              🔴 ไม่อนุมัติ
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>ยื่นเมื่อ: {new Date(r.createdAt).toLocaleDateString("th-TH")}</span>
                          <span>•</span>
                          <a
                            href={r.documentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-ink hover:underline flex items-center gap-0.5"
                          >
                            ดูไฟล์เอกสาร <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        {r.adminRemark && (
                          <div className="p-2 rounded-lg bg-surface border border-line text-secondary text-xs">
                            <strong>บันทึกแอดมิน:</strong> {r.adminRemark}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogFrame>
      )}

      {/* ================================================================== */}
      {/* MODAL 5: แจ้งปัญหา / รายงานประกาศต่อ ADMIN (POST REPORT MODAL) */}
      {/* ================================================================== */}
      {showReportModal && (
        <DialogFrame label="รายงานประกาศ" onClose={() => setShowReportModal(false)} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface text-foreground rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-panel border border-line relative animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-danger-soft text-danger-ink border border-danger-line flex items-center justify-center font-semibold">
                  <Flag className="w-4 h-4 text-danger-ink" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-foreground">
                    {currentLang === "TH" ? "แจ้งปัญหาประกาศต่อแอดมิน" : "Report Listing to Admin"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {currentLang === "TH" ? "ช่วยดูแลความปลอดภัยของตลาดกลาง" : "Help keep the marketplace secure"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-hover text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmitPostReport} className="py-4 space-y-4 text-xs">
              {/* Target Post Info */}
              <div className="p-3 rounded-xl bg-subtle border border-line/80 space-y-1">
                <span className="text-xs uppercase font-semibold text-muted-foreground">ประกาศที่รายงาน:</span>
                <p className="font-semibold text-foreground text-xs line-clamp-1">{selectedPost.title}</p>
                <div className="text-xs text-muted-foreground">
                  ราคา ฿{selectedPost.pricePerKg}/กก. • ผู้ลง: {selectedPost.authorName} ({selectedPost.businessName})
                </div>
              </div>

              {/* Feedback Alerts */}
              {reportError && (
                <div className="p-3 rounded-lg bg-danger-soft border border-danger-line text-danger-ink text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-danger-ink" />
                  <span>{reportError}</span>
                </div>
              )}

              {reportSuccess && (
                <div className="p-3 rounded-lg bg-brand-soft border border-brand-line text-brand-ink text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-brand-ink" />
                  <span>{reportSuccess}</span>
                </div>
              )}

              {/* Reason Selector */}
              <div>
                <label className="block font-semibold text-secondary mb-1.5">
                  ระบุเหตุผลในการรายงาน <span className="text-danger-ink">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: "FAKE_PRICE", label: "⚠️ จงใจปั่นราคา / กรอกราคาไม่ตรงความจริง", desc: "ราคาฉีกตลาดเกินปกติ หรือหลอกดักล้ง/สวน" },
                    { value: "SCAM", label: "🚨 มิจฉาชีพ / พฤติกรรมหลอกลวง", desc: "แอบอ้าง ไม่ส่งสินค้า หรือมีประวัติฉ้อโกง" },
                    { value: "SPAM", label: "📢 โพสต์สแปม / ก่อกวน / โพสต์ซ้ำซ้อน", desc: "ลงประกาศซ้ำๆ หรือข้อความไร้สาระ" },
                    { value: "WRONG_INFO", label: "❌ ข้อมูลสายพันธุ์หรือพื้นที่ไม่ถูกต้อง", desc: "แอบอ้างจังหวัดหรือสายพันธุ์ไม่ตรงจริง" },
                  ].map((item) => (
                    <label
                      key={item.value}
                      className={`p-3 rounded-lg border flex items-start gap-2.5 cursor-pointer transition ${
                        reportReason === item.value
                          ? "bg-danger-soft/70 border-danger-line ring-1 ring-rose-300"
                          : "bg-surface border-line hover:border-line-strong"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={item.value}
                        checked={reportReason === item.value}
                        onChange={(e) => setReportReason(e.target.value as any)}
                        className="mt-0.5 text-danger-ink focus:ring-rose-500 cursor-pointer"
                      />
                      <div>
                        <div className="font-semibold text-foreground">{item.label}</div>
                        <div className="text-xs text-muted-foreground">{item.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Extra Details */}
              <div>
                <label htmlFor="user-field-37" className="block font-semibold text-secondary mb-1">
                  รายละเอียดเพิ่มเติม (ถ้ามี)
                </label>
                <textarea id="user-field-37"
                  rows={2}
                  value={reportDetail}
                  onChange={(e) => setReportDetail(e.target.value)}
                  placeholder="เช่น ทักแชทไปแล้วแจ้งอีกราคา หรือไม่มีทุเรียนจริง..."
                  className="w-full px-3.5 py-2 rounded-lg border border-line text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-danger-line text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-lg bg-muted hover:bg-hover text-secondary font-semibold text-xs transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md  transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReport ? "กำลังส่งรายงาน..." : "ส่งรายงานต่อผู้ดูแลระบบ"}
                </button>
              </div>
            </form>
          </div>
        </DialogFrame>
      )}

      {/* Floating Incoming Message Toast Notification */}
      {chatToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-surface rounded-2xl border border-line/90 shadow-panel p-4 flex items-start gap-3.5 animate-in slide-in- duration-200 ring-2 ring-emerald-500/20">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-semibold flex items-center justify-center shrink-0 text-sm shadow-sm">
            {chatToast.senderName.charAt(0)}
          </div>
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => {
              setActiveChatRoomId(chatToast.roomId);
              setCurrentView("CHAT_ROOM");
              fetchMessages(chatToast.roomId, true);
              setChatToast(null);
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-ink flex items-center gap-1.5 truncate">
                <MessageSquare className="w-3.5 h-3.5 text-brand-ink shrink-0" />
                <span>{currentLang === "TH" ? "ข้อความใหม่จาก" : "New message from"} {chatToast.senderName}</span>
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setChatToast(null);
                }}
                className="text-muted-foreground hover:text-secondary p-0.5 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-secondary line-clamp-2 mt-1 font-medium leading-relaxed">
              {chatToast.text}
            </p>
            <div className="mt-1.5 text-xs text-brand-ink font-semibold hover:underline flex items-center gap-1">
              <span>{currentLang === "TH" ? "คลิกเพื่อเปิดดูห้องแชท" : "Click to view chat"}</span>
              <span>→</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

