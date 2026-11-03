"use client";
import { SupportCenter } from "@/components/support-center";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { PageHeading } from "@/components/ui";
import { DialogFrame } from "@/components/dialog-frame";
import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  FileCheck,
  FileText,
  AlertTriangle,
  Package,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Lock,
  LogOut,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserX,
  PlusCircle,
  Clock,
  Sparkles,
} from "lucide-react";

interface UserSummary {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  activeRole: string;
  trustScore: number;
  ratingAvg?: number | string;
  ratingCount?: number;
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  suspendedUntil?: string | null;
  suspensionReason?: string | null;
  location?: { province: string };
  roles: { id: number; roleType: string; status: string; businessName?: string; isVerified: boolean }[];
  _count?: { posts: number; roleRequests: number; reportsMade: number };
}

interface RoleRequestItem {
  id: number;
  userId: number;
  requestedRole: "SELLER" | "BUYER" | "CUTTER";
  businessName: string;
  licenseNumber?: string;
  documentType: string;
  documentUrl: string;
  note?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminRemark?: string;
  createdAt: string;
  reviewedAt?: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    avatarUrl?: string;
    trustScore: number;
    activeRole: string;
  };
  reviewedByAdmin?: { id: number; fullName: string };
}

interface PostReportItem {
  id: number;
  postId: number;
  reporterId: number;
  reason: "FAKE_PRICE" | "SPAM" | "SCAM" | "WRONG_INFO";
  detail?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  post: {
    id: number;
    title: string;
    postType: string;
    price: number;
    pricePerKg?: number;
    priceUnit: string;
    status: string;
    variety?: { nameTh: string };
    grade?: { nameTh: string };
    location?: { province: string };
    user: { id: number; fullName: string; phone: string; email: string; trustScore?: number };
  };
  reporter: { id: number; fullName: string; email: string; phone: string };
}

interface PostItem {
  id: number;
  title: string;
  postType: string;
  price: number;
  pricePerKg?: number;
  priceUnit: string;
  isPriceOutlier: boolean;
  status: "OPEN" | "CLOSED" | "HIDDEN_BY_ADMIN";
  createdAt: string;
  variety?: { nameTh: string };
  grade?: { nameTh: string };
  location?: { province: string };
  user: { id: number; fullName: string; phone: string; email: string; trustScore: number };
  reports?: { id: number; reason: string; status: string }[];
}

export default function AdminPortalPage() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<{ id: number; fullName: string; email: string } | null>(null);

  // Login form state
  const [identifier, setIdentifier] = useState("admin@durian.com");
  const [password, setPassword] = useState("password123");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard Data
  const [activeTab, setActiveTab] = useState<"ROLE_REQUESTS" | "REPORTS" | "POSTS" | "USERS" | "SUPPORT">("ROLE_REQUESTS");
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [summary, setSummary] = useState({
    pendingRoleRequestsCount: 0,
    pendingReportsCount: 0,
    totalPostsCount: 0,
    outlierPostsCount: 0,
    hiddenPostsCount: 0,
    totalUsersCount: 0,
    suspendedUsersCount: 0,
  });
  const [roleRequests, setRoleRequests] = useState<RoleRequestItem[]>([]);
  const [postReports, setPostReports] = useState<PostReportItem[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);

  // Filters & Search
  const [userSearch, setUserSearch] = useState("");
  const [postFilter, setPostFilter] = useState<"ALL" | "OUTLIER" | "HIDDEN">("ALL");
  const [requestFilter, setRequestFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");

  // Document Modal Preview
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  // Action Remark Modal
  const [actionModal, setActionModal] = useState<{
    type: "ROLE_REQUEST";
    id: number;
    action: "APPROVE" | "REJECT";
    title: string;
  } | null>(null);
  const [adminRemarkInput, setAdminRemarkInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Direct Role Grant Modal
  const [grantRoleModal, setGrantRoleModal] = useState<{
    userId: number;
    userName: string;
  } | null>(null);
  const [selectedGrantRole, setSelectedGrantRole] = useState<"SELLER" | "BUYER" | "CUTTER">("SELLER");
  const [grantBusinessName, setGrantBusinessName] = useState("");

  // Check current admin session on load
  const checkAdminAuth = async () => {
    try {
      const res = await fetch("/api/admin/overview");
      if (res.ok) {
        const data = await res.json();
        setIsAdminAuthenticated(true);
        setAdminUser(data.admin);
        setSummary(data.summary);
        setRoleRequests(data.roleRequests || []);
        setPostReports(data.postReports || []);
        setPosts(data.posts || []);
        setUsers(data.users || []);
      } else {
        setIsAdminAuthenticated(false);
      }
    } catch {
      setIsAdminAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        setLoginLoading(false);
        return;
      }

      setIsAdminAuthenticated(true);
      setAdminUser(data.user);
      await checkAdminAuth();
    } catch {
      setLoginError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      setIsAdminAuthenticated(false);
      setAdminUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshData = async () => {
    setIsLoadingData(true);
    await checkAdminAuth();
    setIsLoadingData(false);
  };

  // Handle Role Request Approval / Rejection
  const confirmRoleRequestAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/role-requests/${actionModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionModal.action,
          adminRemark: adminRemarkInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "เกิดข้อผิดพลาด");
      } else {
        setActionModal(null);
        setAdminRemarkInput("");
        await refreshData();
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการดำเนินการ");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Post Report Actions
  const [reportDeductMap, setReportDeductMap] = useState<Record<number, number>>({});

  const getDefaultReportDeduction = (reason: string): number => {
    if (reason === "WRONG_INFO") return 10;
    if (reason === "SPAM") return 20;
    if (reason === "FAKE_PRICE") return 30;
    if (reason === "SCAM") return 100;
    return 15;
  };

  const handleReportAction = async (
    reportId: number,
    action: "HIDE_POST_AND_RESOLVE" | "DISMISS",
    defaultReason?: string
  ) => {
    const deductScore =
      reportDeductMap[reportId] ?? getDefaultReportDeduction(defaultReason || "FAKE_PRICE");

    if (
      action === "HIDE_POST_AND_RESOLVE" &&
      !confirm(
        `ยืนยันการซ่อนประกาศนี้ออกจากระบบ และหักคะแนนความประพฤติผู้ลงประกาศ (-${deductScore} คะแนน)?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, deductScore }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "เกิดข้อผิดพลาด");
      } else {
        if (data.message) alert(data.message);
        await refreshData();
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการดำเนินการ");
    }
  };

  const handleAdjustUserTrust = async (userId: number, delta: number, name: string) => {
    const msg =
      delta < 0
        ? `ยืนยันการหักคะแนนความประพฤติของคุณ ${name} จำนวน ${delta} คะแนน?\n(ระบบจะคำนวณวันระงับบัญชีอัตโนมัติตามระดับคะแนนคงเหลือ)`
        : `ยืนยันการเพิ่ม/คืนคะแนนความประพฤติให้คุณ ${name} จำนวน +${delta} คะแนน (สูงสุด 100)?`;
    if (!confirm(msg)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ADJUST_TRUST", delta }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.message) alert(data.message);
        await refreshData();
      } else {
        alert(data.error || "ไม่สามารถปรับคะแนนได้");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการปรับคะแนน");
    }
  };

  const handleResetUserTrust = async (userId: number, name: string) => {
    if (!confirm(`ยืนยันการรีเซ็ตคะแนนความประพฤติของคุณ ${name} กลับเป็น 100/100 และปลดล็อกบัญชี?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET_TRUST" }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.message) alert(data.message);
        await refreshData();
      } else {
        alert(data.error || "ไม่สามารถรีเซ็ตคะแนนได้");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการรีเซ็ตคะแนน");
    }
  };

  // Handle Post Moderation (Hide/Restore/Delete)
  const handlePostAction = async (postId: number, action: "HIDE" | "RESTORE" | "TOGGLE_OUTLIER" | "DELETE") => {
    if (action === "DELETE") {
      if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบประกาศนี้ออกจากระบบอย่างถาวร?")) return;
      try {
        const res = await fetch(`/api/admin/posts/${postId}`, { method: "DELETE" });
        if (res.ok) {
          await refreshData();
        } else {
          alert("ไม่สามารถลบประกาศได้");
        }
      } catch {
        alert("เกิดข้อผิดพลาดในการลบประกาศ");
      }
      return;
    }

    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await refreshData();
      } else {
        alert("ไม่สามารถดำเนินการได้");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการดำเนินการ");
    }
  };

  // Handle User Moderation (Suspend / Activate / Grant Role)
  const handleUserStatusToggle = async (userId: number, currentStatus: string, name: string) => {
    const action = currentStatus === "ACTIVE" ? "SUSPEND" : "ACTIVATE";
    const confirmMsg =
      action === "SUSPEND"
        ? `ยืนยันการระงับการใช้งานบัญชีของคุณ ${name}?`
        : `ยืนยันการปลดระงับและเปิดใช้งานบัญชีของคุณ ${name}?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await refreshData();
      } else {
        alert("ไม่สามารถเปลี่ยนสถานะได้");
      }
    } catch {
      alert("เกิดข้อผิดพลาด");
    }
  };

  const handleGrantRoleSubmit = async () => {
    if (!grantRoleModal) return;
    try {
      const res = await fetch(`/api/admin/users/${grantRoleModal.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "GRANT_ROLE",
          roleType: selectedGrantRole,
          businessName: grantBusinessName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "มอบสิทธิ์สำเร็จ");
        setGrantRoleModal(null);
        setGrantBusinessName("");
        await refreshData();
      } else {
        alert(data.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการมอบบทบาท");
    }
  };

  // Helper translations
  const docTypeLabels: Record<string, string> = {
    GAP_CERTIFICATE: "ใบรับรองมาตรฐาน GAP",
    FARMER_BOOK: "สมุดทะเบียนเกษตรกร (ทบก.)",
    COMMERCIAL_LICENSE: "ทะเบียนพาณิชย์ / ใบอนุญาตล้ง",
    CUTTER_CERT_OR_PORT: "ใบอบรมนักตัดทุเรียน / ผลงาน",
    NATIONAL_ID_WITH_PIC: "รูปคู่บัตรประชาชนและแปลง/ร้าน",
  };

  const roleLabels: Record<string, string> = {
    SELLER: "ชาวสวนผู้ขาย (SELLER)",
    BUYER: "ล้งรับซื้อ (BUYER)",
    CUTTER: "ทีมตัดทุเรียน (CUTTER)",
    ADMIN: "ผู้ดูแลระบบ (ADMIN)",
  };

  const reportReasonLabels: Record<string, string> = {
    FAKE_PRICE: "⚠️ ปั่นราคา / ราคาไม่ตรงจริง",
    SCAM: "🚨 มิจฉาชีพ / พฤติกรรมหลอกลวง",
    SPAM: "📢 สแปม / โพสต์ก่อกวน",
    WRONG_INFO: "❌ ข้อมูลสายพันธุ์หรือพื้นที่ผิด",
  };

  // --------------------------------------------------------------------------
  // SCREEN 1: Admin Security Gate (Login Screen)
  // --------------------------------------------------------------------------
  if (isAdminAuthenticated === null) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-brand-ink animate-spin" />
          <p className="text-muted-foreground text-sm">กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...</p>
        </div>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-center"><ThemeSwitcher /></div>
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-emerald-500/10 border border-brand-line/20 text-brand-ink mb-4 shadow-panel">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">
            เข้าสู่ระบบผู้ดูแล
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            จัดการสมาชิก ประกาศ และคำขอในที่เดียว
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-surface/90 backdrop-blur-xl py-8 px-6 shadow-panel rounded-2xl border border-line sm:px-10">
            {loginError && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-danger-line/20 flex items-start gap-3 text-danger-ink text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label htmlFor="admin-field-1" className="block text-xs font-semibold text-secondary mb-1">
                  อีเมลเจ้าหน้าที่ / บัญชีแอดมิน
                </label>
                <input id="admin-field-1"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@durian.com"
                  className="w-full px-4 py-2.5 bg-canvas/60 border border-line rounded-lg text-foreground text-sm focus:outline-none focus:border-brand-line focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label htmlFor="admin-field-2" className="block text-xs font-semibold text-secondary mb-1">
                  รหัสผ่านแอดมิน
                </label>
                <input id="admin-field-2"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-canvas/60 border border-line rounded-lg text-foreground text-sm focus:outline-none focus:border-brand-line focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-muted-foreground"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full mt-2 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-lg shadow-panel  transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังยืนยันตัวตน...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>เข้าสู่ศูนย์ควบคุมผู้ดูแลระบบ</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-line flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ระบบรักษาความปลอดภัย 256-bit
              </span>
              <Link
                href="/"
                className="text-brand-ink hover:text-brand-ink flex items-center gap-1 transition-colors"
              >
                หน้าตลาดกลาง <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // SCREEN 2: Admin Management Console (Authenticated)
  // --------------------------------------------------------------------------
  const filteredRequests = roleRequests.filter((r) => {
    if (requestFilter === "ALL") return true;
    return r.status === requestFilter;
  });

  const filteredPosts = posts.filter((p) => {
    if (postFilter === "OUTLIER") return p.isPriceOutlier;
    if (postFilter === "HIDDEN") return p.status === "HIDDEN_BY_ADMIN";
    return true;
  });

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      (u.location?.province && u.location.province.includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-canvas text-foreground flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="app-header px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-700   flex items-center justify-center shadow-panel ">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-foreground tracking-wide">
                DURIAN HUB <span className="text-muted-foreground font-normal">/ Admin</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-brand-ink border border-brand-line/30">
                OFFICIAL
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              ศูนย์จัดการระบบ ตรวจสอบคำขอ และดูแลความปลอดภัยตลาดกลาง
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeSwitcher />
          <button
            onClick={refreshData}
            disabled={isLoadingData}
            title="รีเฟรชข้อมูล"
            className="p-2 rounded-lg bg-muted hover:bg-hover text-secondary hover:text-foreground transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingData ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-hover text-secondary hover:text-foreground text-xs font-medium transition-all"
          >
            <span>ดูหน้าตลาดกลาง</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <div className="h-6 w-px bg-muted hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-muted border border-line-strong flex items-center justify-center text-xs font-semibold text-brand-ink">
              AD
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-foreground leading-tight">
                {adminUser?.fullName || "ผู้ดูแลระบบ"}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">Super Admin</p>
            </div>
          </div>

          <button
            onClick={handleAdminLogout}
            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-danger-ink hover:text-danger-ink transition-all border border-danger-line/20"
            title="ออกจากระบบ"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main id="admin-main" className="app-main space-y-6">
        <PageHeading eyebrow="ADMIN WORKSPACE" title="ภาพรวมการดูแลระบบ" description="ตรวจสอบรายการที่รอดำเนินการ และจัดการข้อมูลตลาดกลาง" />
        {/* KPI / Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Pending Role Requests */}
          <div
            onClick={() => setActiveTab("ROLE_REQUESTS")}
            className={`cursor-pointer p-5 rounded-xl border transition-all ${
              activeTab === "ROLE_REQUESTS"
                ? "bg-brand-soft/40 border-brand-line/40 shadow-panel "
                : "bg-surface/60 border-line hover:border-line-strong"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">คำขอเพิ่มบทบาทรอตรวจ</span>
              <FileCheck className="w-5 h-5 text-brand-ink" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-semibold text-foreground">
                {summary.pendingRoleRequestsCount}
              </span>
              <span className="text-xs text-muted-foreground">รายการ</span>
            </div>
            {summary.pendingRoleRequestsCount > 0 && (
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-warning-ink">
                <Clock className="w-3 h-3" /> รอการอนุมัติ
              </span>
            )}
          </div>

          {/* Card 2: User Reports */}
          <div
            onClick={() => setActiveTab("REPORTS")}
            className={`cursor-pointer p-5 rounded-xl border transition-all ${
              activeTab === "REPORTS"
                ? "bg-danger-soft/40 border-danger-line/40 shadow-panel "
                : "bg-surface/60 border-line hover:border-line-strong"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">รายงานปัญหาจากผู้ใช้</span>
              <AlertTriangle className="w-5 h-5 text-danger-ink" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-semibold text-foreground">
                {summary.pendingReportsCount}
              </span>
              <span className="text-xs text-muted-foreground">เรื่องรอตรวจ</span>
            </div>
            {summary.pendingReportsCount > 0 ? (
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-danger-ink animate-pulse">
                <ShieldAlert className="w-3 h-3" /> มีข้อร้องเรียนใหม่
              </span>
            ) : (
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-ink">
                <CheckCircle2 className="w-3 h-3" /> จัดการครบแล้ว
              </span>
            )}
          </div>

          {/* Card 3: Marketplace Posts */}
          <div
            onClick={() => setActiveTab("POSTS")}
            className={`cursor-pointer p-5 rounded-xl border transition-all ${
              activeTab === "POSTS"
                ? "bg-info-soft/40 border-info-line/40 shadow-panel "
                : "bg-surface/60 border-line hover:border-line-strong"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">ประกาศในตลาดกลาง</span>
              <Package className="w-5 h-5 text-info-ink" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-semibold text-foreground">
                {summary.totalPostsCount}
              </span>
              <span className="text-xs text-muted-foreground">โพสต์</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-warning-ink">ราคาโดด: {summary.outlierPostsCount}</span>
              <span>•</span>
              <span className="text-danger-ink">ซ่อน: {summary.hiddenPostsCount}</span>
            </div>
          </div>

          {/* Card 4: Total Users */}
          <div
            onClick={() => setActiveTab("USERS")}
            className={`cursor-pointer p-5 rounded-xl border transition-all ${
              activeTab === "USERS"
                ? "bg-accent-soft/40 border-accent-line/40 shadow-panel "
                : "bg-surface/60 border-line hover:border-line-strong"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">สมาชิกทั้งหมดในระบบ</span>
              <Users className="w-5 h-5 text-accent-ink" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-semibold text-foreground">
                {summary.totalUsersCount}
              </span>
              <span className="text-xs text-muted-foreground">คน</span>
            </div>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              ระงับชั่วคราว: <strong className="text-danger-ink">{summary.suspendedUsersCount}</strong>
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-line flex items-center gap-2 overflow-x-auto pb-1">
          <button className={`px-4 py-2.5 rounded-lg text-sm font-semibold shrink-0 ${activeTab === "SUPPORT" ? "bg-brand-soft text-brand-ink" : "text-muted-foreground"}`} onClick={() => setActiveTab("SUPPORT")}>ศูนย์ช่วยเหลือ · แชตกับผู้ใช้</button>
          <button
            onClick={() => setActiveTab("ROLE_REQUESTS")}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === "ROLE_REQUESTS"
                ? "bg-emerald-500/20 text-brand-ink border border-brand-line/30"
                : "text-muted-foreground hover:text-foreground hover:bg-surface"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>คำขอเพิ่มบทบาท</span>
            {summary.pendingRoleRequestsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500 text-muted-foreground font-semibold">
                {summary.pendingRoleRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("REPORTS")}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === "REPORTS"
                ? "bg-rose-500/20 text-danger-ink border border-danger-line/30"
                : "text-muted-foreground hover:text-foreground hover:bg-surface"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>ศูนย์รับแจ้งปัญหา</span>
            {summary.pendingReportsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-rose-500 text-white font-semibold">
                {summary.pendingReportsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("POSTS")}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === "POSTS"
                ? "bg-cyan-500/20 text-info-ink border border-info-line/30"
                : "text-muted-foreground hover:text-foreground hover:bg-surface"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>จัดการประกาศและตรวจสอบราคา</span>
          </button>

          <button
            onClick={() => setActiveTab("USERS")}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === "USERS"
                ? "bg-purple-500/20 text-accent-ink border border-accent-line/30"
                : "text-muted-foreground hover:text-foreground hover:bg-surface"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>จัดการสมาชิกและช่วยเหลือผู้ใช้</span>
          </button>
        </div>

        {/* ================================================================== */}
        {activeTab === "SUPPORT" && <SupportCenter admin key={adminUser?.id} />}
        {/* TAB 1: ROLE VERIFICATION REQUESTS */}
        {/* ================================================================== */}
        {activeTab === "ROLE_REQUESTS" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface/60 p-4 rounded-xl border border-line">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  คิวตรวจสอบคำขอเพิ่มบทบาท (Role Verification Queue)
                </h2>
                <p className="text-xs text-muted-foreground">
                  ตรวจสอบเอกสารหลักฐาน และกดอนุมัติเพื่อให้ผู้ใช้สลับใช้งานบทบาทใหม่ได้ทันที
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-canvas p-1 rounded-lg border border-line text-xs">
                {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setRequestFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      requestFilter === filter
                        ? "bg-emerald-700 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {filter === "PENDING"
                      ? `รอตรวจ (${summary.pendingRoleRequestsCount})`
                      : filter === "APPROVED"
                      ? "อนุมัติแล้ว"
                      : filter === "REJECTED"
                      ? "ไม่อนุมัติ"
                      : "ทั้งหมด"}
                  </button>
                ))}
              </div>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="text-center py-16 bg-surface/40 rounded-2xl border border-line/80">
                <FileCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-secondary font-semibold text-sm">ไม่มีคำขอในหมวดหมู่นี้</p>
                <p className="text-muted-foreground text-xs mt-1">
                  เมื่อมีผู้ใช้ยื่นเอกสารขอเพิ่มบทบาท รายการจะปรากฏที่นี่แบบ Real-time
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-surface/80 border border-line rounded-xl p-5 hover:border-line-strong transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                  >
                    {/* User & Request Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted border border-line-strong flex items-center justify-center font-semibold text-sm text-brand-ink overflow-hidden shrink-0">
                          {req.user.avatarUrl ? (
                            <img
                              src={req.user.avatarUrl}
                              alt={req.user.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            req.user.fullName.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">{req.user.fullName}</span>
                            <span className="text-xs text-muted-foreground font-mono">({req.user.phone})</span>
                            <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-secondary border border-line-strong">
                              ความน่าเชื่อถือ {req.user.trustScore}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{req.user.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2">
                        <div className="bg-canvas/70 p-2.5 rounded-lg border border-line/80">
                          <span className="text-muted-foreground">บทบาทที่ต้องการขอ:</span>
                          <p className="font-semibold text-brand-ink mt-0.5">
                            {roleLabels[req.requestedRole] || req.requestedRole}
                          </p>
                        </div>

                        <div className="bg-canvas/70 p-2.5 rounded-lg border border-line/80">
                          <span className="text-muted-foreground">ชื่อแปลง / กิจการ:</span>
                          <p className="font-semibold text-foreground mt-0.5">{req.businessName}</p>
                          {req.licenseNumber && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              เลขทะเบียน/GAP: {req.licenseNumber}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
                        <span className="px-2.5 py-1 rounded-lg bg-muted/80 border border-line-strong text-secondary">
                          📄 {docTypeLabels[req.documentType] || req.documentType}
                        </span>
                        <span>•</span>
                        <span>ยื่นเมื่อ: {new Date(req.createdAt).toLocaleString("th-TH")}</span>
                      </div>

                      {req.note && (
                        <p className="text-xs bg-canvas/40 p-2.5 rounded-lg border border-line/60 text-secondary italic">
                          &quot;{req.note}&quot;
                        </p>
                      )}

                      {req.adminRemark && (
                        <div className="text-xs p-2.5 rounded-lg bg-canvas/80 border border-line text-secondary flex items-start gap-2">
                          <Shield className="w-3.5 h-3.5 text-brand-ink shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium text-muted-foreground">บันทึกแอดมิน:</span>{" "}
                            {req.adminRemark}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions & Document Preview */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-line">
                      {/* Document Viewer Button */}
                      <button
                        onClick={() => setPreviewDocUrl(req.documentUrl)}
                        className="px-3.5 py-2 rounded-lg bg-muted hover:bg-hover text-brand-ink hover:text-brand-ink text-xs font-semibold flex items-center gap-1.5 transition-all border border-line-strong"
                      >
                        <Eye className="w-4 h-4" />
                        <span>เปิดดูเอกสาร</span>
                      </button>

                      {/* Status Badges or Action Buttons */}
                      {req.status === "PENDING" ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setActionModal({
                                type: "ROLE_REQUEST",
                                id: req.id,
                                action: "APPROVE",
                                title: `อนุมัติคำขอ ${req.user.fullName} (${req.requestedRole})`,
                              })
                            }
                            className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-panel  transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>อนุมัติ</span>
                          </button>

                          <button
                            onClick={() =>
                              setActionModal({
                                type: "ROLE_REQUEST",
                                id: req.id,
                                action: "REJECT",
                                title: `ปฏิเสธคำขอ ${req.user.fullName} (${req.requestedRole})`,
                              })
                            }
                            className="px-3.5 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-danger-ink text-xs font-semibold flex items-center gap-1.5 border border-danger-line/30 transition-all"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>ไม่อนุมัติ</span>
                          </button>
                        </div>
                      ) : req.status === "APPROVED" ? (
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-brand-ink border border-brand-line/30 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> อนุมัติแล้ว
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/20 text-danger-ink border border-danger-line/30 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" /> ปฏิเสธแล้ว
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 2: USER REPORTS & HELPDESK */}
        {/* ================================================================== */}
        {activeTab === "REPORTS" && (
          <div className="space-y-4">
            <div className="bg-surface/60 p-4 rounded-xl border border-line space-y-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  ศูนย์รับแจ้งปัญหาและข้อร้องเรียนจากผู้ใช้ (Dispute & Report Center)
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ตรวจสอบประกาศที่ถูกรายงานและเลือกหักคะแนนความประพฤติ (เต็ม 100 คะแนน) ระบบจะสั่งระงับบัญชีชั่วคราวถึงถาวรตามเกณฑ์อัตโนมัติ
                </p>
              </div>

              {/* ตารางเกณฑ์บทลงโทษอัตโนมัติ */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-line/80 text-xs">
                <div className="p-2.5 rounded-lg bg-brand-soft/40 border border-brand-line/20">
                  <div className="font-semibold text-brand-ink">🟢 90–100 คะแนน</div>
                  <div className="text-muted-foreground mt-0.5">สถานะปกติ</div>
                </div>
                <div className="p-2.5 rounded-lg bg-warning-soft/30 border border-warning-line/20">
                  <div className="font-semibold text-warning-ink">🟡 80–89 คะแนน</div>
                  <div className="text-muted-foreground mt-0.5">ตักเตือน</div>
                </div>
                <div className="p-2.5 rounded-lg bg-warning-soft/40 border border-warning-line/30">
                  <div className="font-semibold text-warning-ink">🟠 60–79 คะแนน</div>
                  <div className="text-secondary mt-0.5">ระงับไอดี 3 วัน</div>
                </div>
                <div className="p-2.5 rounded-lg bg-warning-soft/60 border border-warning-line/40">
                  <div className="font-semibold text-warning-ink">🟠 40–59 คะแนน</div>
                  <div className="text-secondary mt-0.5">ระงับไอดี 7 วัน</div>
                </div>
                <div className="p-2.5 rounded-lg bg-danger-soft/50 border border-danger-line/30">
                  <div className="font-semibold text-danger-ink">🔴 1–39 คะแนน</div>
                  <div className="text-secondary mt-0.5">ระงับไอดี 30 วัน</div>
                </div>
                <div className="p-2.5 rounded-lg bg-danger-soft/90 border border-danger-line/50">
                  <div className="font-semibold text-danger-ink">⛔ 0 คะแนน</div>
                  <div className="text-danger-ink mt-0.5 font-semibold">แบนถาวร</div>
                </div>
              </div>
            </div>

            {postReports.length === 0 ? (
              <div className="text-center py-16 bg-surface/40 rounded-2xl border border-line/80">
                <CheckCircle2 className="w-12 h-12 text-brand-ink/60 mx-auto mb-3" />
                <p className="text-secondary font-semibold text-sm">ไม่มีข้อร้องเรียนค้างในระบบ</p>
                <p className="text-muted-foreground text-xs mt-1">ตลาดกลางทำงานได้ปกติ ปลอดภัย ไร้มิจฉาชีพ</p>
              </div>
            ) : (
              <div className="space-y-4">
                {postReports.map((rep) => {
                  const selectedDeduct =
                    reportDeductMap[rep.id] ?? getDefaultReportDeduction(rep.reason);

                  return (
                    <div
                      key={rep.id}
                      className="bg-surface/80 border border-line rounded-xl p-5 hover:border-line-strong transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/20 text-danger-ink border border-danger-line/30">
                            {reportReasonLabels[rep.reason] || rep.reason}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            แจ้งเมื่อ: {new Date(rep.createdAt).toLocaleString("th-TH")}
                          </span>
                        </div>

                        <div>
                          {rep.status === "PENDING" ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-warning-ink border border-warning-line/30">
                              รอดำเนินการ
                            </span>
                          ) : rep.status === "APPROVED" ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-brand-ink border border-brand-line/30">
                              ดำเนินการซ่อนโพสต์ & หักคะแนนแล้ว
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-line-strong">
                              ยกเลิกคำร้อง
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Post Details */}
                        <div className="bg-canvas/60 p-4 rounded-lg border border-line/80 space-y-2">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            ประกาศที่ถูกรายงาน (Post ID: #{rep.post.id})
                          </span>
                          <h3 className="text-sm font-semibold text-foreground">{rep.post.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-secondary">
                            <span className="font-semibold text-brand-ink">
                              ฿{rep.post.price} {rep.post.priceUnit === "PER_KG" ? "/กก." : ""}
                            </span>
                            <span>•</span>
                            <span>{rep.post.variety?.nameTh || "ไม่ระบุพันธุ์"}</span>
                            <span>•</span>
                            <span>เกรด {rep.post.grade?.nameTh || "ทั่วไป"}</span>
                            <span>•</span>
                            <span>จ.{rep.post.location?.province || "ไม่ระบุ"}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            เจ้าของโพสต์:{" "}
                            <strong className="text-secondary">{rep.post.user.fullName}</strong>{" "}
                            (โทร {rep.post.user.phone}) •{" "}
                            <span className="text-brand-ink font-semibold">
                              คะแนนปัจจุบัน: {rep.post.user.trustScore ?? 100}/100
                            </span>
                          </p>
                        </div>

                        {/* Reporter Details */}
                        <div className="bg-canvas/60 p-4 rounded-lg border border-line/80 space-y-2">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            ผู้แจ้งปัญหา
                          </span>
                          <p className="text-sm font-semibold text-foreground">{rep.reporter.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            โทร: {rep.reporter.phone} | อีเมล: {rep.reporter.email}
                          </p>
                          {rep.detail ? (
                            <div className="text-xs bg-surface p-2.5 rounded-lg border border-line text-secondary">
                              &quot;{rep.detail}&quot;
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">ไม่ได้ระบุข้อความเพิ่มเติม</p>
                          )}
                        </div>
                      </div>

                      {/* Action Bar */}
                      {rep.status === "PENDING" && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-line/80">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-secondary">
                              เลือกเกณฑ์หักคะแนน:
                            </span>
                            {[
                              { val: 10, label: "-10 (ข้อมูลผิด)" },
                              { val: 20, label: "-20 (สแปม/ก่อกวน)" },
                              { val: 30, label: "-30 (ปั่นราคา/ผิดสัญญา)" },
                              { val: 100, label: "-100 (มิจฉาชีพ/แบนถาวร)" },
                            ].map((opt) => (
                              <button
                                key={opt.val}
                                type="button"
                                onClick={() =>
                                  setReportDeductMap((prev) => ({ ...prev, [rep.id]: opt.val }))
                                }
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                                  selectedDeduct === opt.val
                                    ? "bg-rose-600 text-white border-danger-line shadow-sm"
                                    : "bg-canvas text-muted-foreground border-line hover:border-line-strong"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => handleReportAction(rep.id, "DISMISS")}
                              className="px-4 py-2 rounded-lg bg-muted hover:bg-hover text-secondary text-xs font-semibold transition-all cursor-pointer"
                            >
                              ยกเลิกคำร้อง (ประกาศปกติ)
                            </button>
                            <button
                              onClick={() =>
                                handleReportAction(rep.id, "HIDE_POST_AND_RESOLVE", rep.reason)
                              }
                              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-panel  transition-all cursor-pointer"
                            >
                              <ShieldAlert className="w-4 h-4" />
                              <span>ซ่อนโพสต์ & หัก -{selectedDeduct} คะแนน</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 3: POST & PRICE OUTLIER MODERATION */}
        {/* ================================================================== */}
        {activeTab === "POSTS" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface/60 p-4 rounded-xl border border-line">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  จัดการประกาศและตรวจสอบราคา (Marketplace Moderation)
                </h2>
                <p className="text-xs text-muted-foreground">
                  ตรวจจับโพสต์ที่ตั้งราคาผิดปกติ (Outlier) และควบคุมการแสดงผลในตลาดกลาง
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1.5 bg-canvas p-1 rounded-lg border border-line text-xs">
                {(["ALL", "OUTLIER", "HIDDEN"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setPostFilter(f)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      postFilter === f
                        ? "bg-cyan-700 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f === "ALL"
                      ? `ทั้งหมด (${posts.length})`
                      : f === "OUTLIER"
                      ? `ราคาโดด (${summary.outlierPostsCount})`
                      : `ถูกซ่อน (${summary.hiddenPostsCount})`}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto bg-surface/80 rounded-xl border border-line">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas/80 text-muted-foreground font-semibold border-b border-line">
                  <tr>
                    <th className="py-3 px-4">หัวข้อประกาศ</th>
                    <th className="py-3 px-4">หมวดหมู่</th>
                    <th className="py-3 px-4">ราคา / หน่วย</th>
                    <th className="py-3 px-4">ผู้ลงประกาศ</th>
                    <th className="py-3 px-4">สถานะ</th>
                    <th className="py-3 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-foreground max-w-xs truncate">
                        {post.title}
                        <div className="text-xs text-muted-foreground font-normal">
                          {post.variety?.nameTh} • เกรด {post.grade?.nameTh || "ทั่วไป"} • จ.
                          {post.location?.province}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            post.postType === "SELL"
                              ? "bg-emerald-500/20 text-brand-ink border border-brand-line/30"
                              : post.postType === "BUY"
                              ? "bg-blue-500/20 text-info-ink border border-info-line/30"
                              : "bg-amber-500/20 text-warning-ink border border-warning-line/30"
                          }`}
                        >
                          {post.postType === "SELL"
                            ? "ขายหน้าสวน"
                            : post.postType === "BUY"
                            ? "รับซื้อหน้าล้ง"
                            : "รับตัด"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-foreground text-sm">
                          ฿{post.price}
                        </span>{" "}
                        <span className="text-muted-foreground text-xs">
                          {post.priceUnit === "PER_KG" ? "/กก." : ""}
                        </span>
                        {post.isPriceOutlier && (
                          <span className="block text-xs text-warning-ink font-semibold">
                            ⚠️ ราคาฉีกตลาด
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="text-foreground font-medium">{post.user.fullName}</p>
                        <p className="text-muted-foreground text-xs">โทร {post.user.phone}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        {post.status === "HIDDEN_BY_ADMIN" ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-danger-ink border border-danger-line/30">
                            ถูกซ่อน
                          </span>
                        ) : post.status === "CLOSED" ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-line-strong">
                            ปิดดีลแล้ว
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-brand-ink border border-brand-line/30">
                            เปิดแสดง
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        {post.status === "HIDDEN_BY_ADMIN" ? (
                          <button
                            onClick={() => handlePostAction(post.id, "RESTORE")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-700/20 hover:bg-emerald-700/30 text-brand-ink border border-brand-line/30 text-xs font-medium transition-all"
                          >
                            คืนสถานะ
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePostAction(post.id, "HIDE")}
                            className="px-2.5 py-1 rounded-lg bg-muted hover:bg-hover text-danger-ink text-xs font-medium transition-all"
                          >
                            ซ่อนโพสต์
                          </button>
                        )}

                        <button
                          onClick={() => handlePostAction(post.id, "TOGGLE_OUTLIER")}
                          className="px-2.5 py-1 rounded-lg bg-muted hover:bg-hover text-warning-ink text-xs font-medium transition-all"
                          title="สลับสถานะราคาผิดปกติ"
                        >
                          {post.isPriceOutlier ? "ปลด Outlier" : "มาร์ก Outlier"}
                        </button>

                        <button
                          onClick={() => handlePostAction(post.id, "DELETE")}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-danger-ink text-xs font-medium transition-all"
                          title="ลบถาวร"
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 4: USERS & DIRECT SUPPORT */}
        {/* ================================================================== */}
        {activeTab === "USERS" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface/60 p-4 rounded-xl border border-line">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  จัดการสมาชิกและช่วยเหลือผู้ใช้ (User Management & Support)
                </h2>
                <p className="text-xs text-muted-foreground">
                  ค้นหาสมาชิก มอบสิทธิ์บทบาทให้ผู้ใช้โดยตรง (เช่น ผู้สูงอายุที่ยื่นเอกสารไม่เป็น) หรือระงับบัญชีที่ทำผิดกฎ
                </p>
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
                  className="w-full pl-9 pr-4 py-2 bg-canvas border border-line rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent-line"
                />
              </div>
            </div>

            <div className="overflow-x-auto bg-surface/80 rounded-xl border border-line">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas/80 text-muted-foreground font-semibold border-b border-line">
                  <tr>
                    <th className="py-3 px-4">ผู้ใช้งาน</th>
                    <th className="py-3 px-4">เบอร์โทร & อีเมล</th>
                    <th className="py-3 px-4">จังหวัด</th>
                    <th className="py-3 px-4">บทบาทที่ได้รับอนุมัติ</th>
                    <th className="py-3 px-4">คะแนนความประพฤติ (100) & ดาวรีวิว</th>
                    <th className="py-3 px-4">สถานะ & วันระงับ</th>
                    <th className="py-3 px-4 text-right">ช่วยเหลือ / ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {filteredUsers.map((u) => {
                    const approvedRoleTypes = u.roles
                      .filter((r) => r.status === "ACTIVE")
                      .map((r) => r.roleType);

                    return (
                      <tr key={u.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-foreground">{u.fullName}</p>
                          <span className="text-xs text-muted-foreground">ID: #{u.id}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="text-foreground font-mono">{u.phone}</p>
                          <p className="text-muted-foreground text-xs">{u.email}</p>
                        </td>

                        <td className="py-3.5 px-4 text-secondary">
                          {u.location?.province || "จันทบุรี"}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {approvedRoleTypes.map((r) => (
                              <span
                                key={r}
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  r === "SELLER"
                                    ? "bg-emerald-500/20 text-brand-ink border border-brand-line/30"
                                    : r === "BUYER"
                                    ? "bg-blue-500/20 text-info-ink border border-info-line/30"
                                    : r === "CUTTER"
                                    ? "bg-amber-500/20 text-warning-ink border border-warning-line/30"
                                    : "bg-purple-500/20 text-accent-ink border border-accent-line/30"
                                }`}
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-semibold text-sm ${
                                u.trustScore >= 80
                                  ? "text-brand-ink"
                                  : u.trustScore >= 40
                                  ? "text-warning-ink"
                                  : "text-danger-ink"
                              }`}
                            >
                              🛡️ {u.trustScore}/100
                            </span>
                            <span className="text-warning-ink font-semibold text-xs">
                              ★ {Number(u.ratingAvg ?? 5).toFixed(1)} ({u.ratingCount ?? 0} รีวิว)
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleAdjustUserTrust(u.id, -10, u.fullName)}
                              className="px-1.5 py-0.5 rounded bg-rose-500/15 hover:bg-rose-500/30 text-danger-ink text-xs font-semibold border border-danger-line/20 cursor-pointer"
                              title="หัก 10 คะแนน"
                            >
                              -10
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustUserTrust(u.id, -20, u.fullName)}
                              className="px-1.5 py-0.5 rounded bg-rose-500/15 hover:bg-rose-500/30 text-danger-ink text-xs font-semibold border border-danger-line/20 cursor-pointer"
                              title="หัก 20 คะแนน"
                            >
                              -20
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustUserTrust(u.id, -30, u.fullName)}
                              className="px-1.5 py-0.5 rounded bg-rose-500/15 hover:bg-rose-500/30 text-danger-ink text-xs font-semibold border border-danger-line/20 cursor-pointer"
                              title="หัก 30 คะแนน"
                            >
                              -30
                            </button>
                            {u.trustScore < 100 && (
                              <button
                                type="button"
                                onClick={() => handleResetUserTrust(u.id, u.fullName)}
                                className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-800/30 text-brand-ink text-xs font-semibold border border-brand-line/30 cursor-pointer"
                                title="รีเซ็ตคะแนนกลับเป็น 100/100"
                              >
                                รีเซ็ต 100
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {u.status === "BANNED" ? (
                            <div>
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-600/30 text-danger-ink border border-danger-line/50">
                                ⛔ แบนถาวร (0/100)
                              </span>
                              {u.suspensionReason && (
                                <p className="text-xs text-danger-ink mt-1 max-w-[160px] truncate" title={u.suspensionReason}>
                                  {u.suspensionReason}
                                </p>
                              )}
                            </div>
                          ) : u.status === "SUSPENDED" ? (
                            <div>
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-warning-ink border border-warning-line/40">
                                🟠 ระงับชั่วคราว
                              </span>
                              {u.suspendedUntil && (
                                <p className="text-xs text-warning-ink mt-1">
                                  ถึง: {new Date(u.suspendedUntil).toLocaleDateString("th-TH")}
                                </p>
                              )}
                            </div>
                          ) : u.trustScore <= 89 ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-warning-ink border border-warning-line/30">
                              🟡 ตักเตือน ({u.trustScore}/100)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-brand-ink border border-brand-line/30">
                              🟢 ปกติ
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() =>
                              setGrantRoleModal({
                                userId: u.id,
                                userName: u.fullName,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-emerald-700/20 hover:bg-emerald-700/30 text-brand-ink border border-brand-line/30 text-xs font-medium transition-all"
                            title="มอบสิทธิ์บทบาทช่วยผู้ใช้"
                          >
                            + มอบบทบาท
                          </button>

                          <button
                            onClick={() => handleUserStatusToggle(u.id, u.status, u.fullName)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                              u.status === "ACTIVE"
                                ? "bg-rose-500/10 hover:bg-rose-500/20 text-danger-ink"
                                : "bg-emerald-700/20 hover:bg-emerald-700/30 text-brand-ink"
                            }`}
                          >
                            {u.status === "ACTIVE" ? "ระงับบัญชี" : "ปลดระงับ"}
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
      </main>

      {/* ==================================================================== */}
      {/* MODAL 1: DOCUMENT PREVIEW */}
      {/* ==================================================================== */}
      {previewDocUrl && (
        <DialogFrame label="เอกสารประกอบ" onClose={() => setPreviewDocUrl(null)} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-panel">
            <div className="p-4 border-b border-line flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-ink" />
                ตรวจสอบเอกสารหลักฐาน
              </span>
              <button
                onClick={() => setPreviewDocUrl(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-canvas">
              {previewDocUrl.endsWith(".pdf") ? (
                <iframe
                  src={previewDocUrl}
                  className="w-full h-[650px] rounded-lg border border-line"
                  title="Document Preview"
                />
              ) : (
                <img
                  src={previewDocUrl}
                  alt="Verification Document"
                  className="max-h-[650px] w-auto object-contain rounded-lg shadow-panel border border-line"
                />
              )}
            </div>

            <div className="p-4 border-t border-line flex items-center justify-between text-xs text-muted-foreground">
              <span>ไฟล์เอกสาร: {previewDocUrl}</span>
              <a
                href={previewDocUrl}
                target="_blank"
                rel="noreferrer"
                className="text-brand-ink hover:underline flex items-center gap-1"
              >
                เปิดในแท็บใหม่ <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </DialogFrame>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: ROLE REQUEST REMARK & CONFIRMATION */}
      {/* ==================================================================== */}
      {actionModal && (
        <DialogFrame label="ยืนยันการดำเนินการ" onClose={() => setActionModal(null)} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded-2xl max-w-md w-full p-6 shadow-panel space-y-4">
            <h3 className="text-base font-semibold text-foreground">{actionModal.title}</h3>
            <p className="text-xs text-muted-foreground">
              {actionModal.action === "APPROVE"
                ? "เมื่ออนุมัติ ผู้ใช้จะได้รับบทบาทนี้ทันที และระบบจะเพิ่มคะแนนความน่าเชื่อถือให้อัตโนมัติ"
                : "กรุณาระบุเหตุผลที่ไม่อนุมัติ เพื่อให้ผู้ใช้ทราบและนำไปแก้ไขเอกสาร"}
            </p>

            <div>
              <label htmlFor="admin-field-3" className="block text-xs font-semibold text-secondary mb-1">
                บันทึกหมายเหตุจากแอดมิน (Admin Remark)
              </label>
              <textarea id="admin-field-3"
                rows={3}
                value={adminRemarkInput}
                onChange={(e) => setAdminRemarkInput(e.target.value)}
                placeholder={
                  actionModal.action === "APPROVE"
                    ? "อนุมัติเอกสารถูกต้องเรียบร้อยแล้ว"
                    : "เอกสารไม่ชัดเจน / ขาดตราประทับ / กรุณาแนบใหม่"
                }
                className="w-full p-3 bg-canvas border border-line rounded-lg text-foreground text-xs focus:outline-none focus:border-brand-line placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActionModal(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-muted hover:bg-hover text-secondary text-xs font-semibold transition-all"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmRoleRequestAction}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-lg text-white text-xs font-semibold transition-all shadow-panel flex items-center gap-1.5 ${
                  actionModal.action === "APPROVE"
                    ? "bg-emerald-700 hover:bg-emerald-800 "
                    : "bg-rose-600 hover:bg-rose-500 "
                }`}
              >
                {actionLoading ? "กำลังบันทึก..." : "ยืนยัน"}
              </button>
            </div>
          </div>
        </DialogFrame>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: DIRECT ROLE GRANT */}
      {/* ==================================================================== */}
      {grantRoleModal && (
        <DialogFrame label="เพิ่มบทบาทสมาชิก" onClose={() => setGrantRoleModal(null)} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded-2xl max-w-md w-full p-6 shadow-panel space-y-4">
            <h3 className="text-base font-semibold text-foreground">
              มอบสิทธิ์บทบาทให้แก่: {grantRoleModal.userName}
            </h3>
            <p className="text-xs text-muted-foreground">
              ใช้สำหรับอำนวยความสะดวกให้ผู้ใช้งานที่โทรศัพท์หรือติดต่อแอดมินโดยตรง
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label htmlFor="admin-field-4" className="block font-semibold text-secondary mb-1">
                  เลือกบทบาทที่ต้องการมอบสิทธิ์
                </label>
                <select id="admin-field-4"
                  value={selectedGrantRole}
                  onChange={(e) =>
                    setSelectedGrantRole(e.target.value as "SELLER" | "BUYER" | "CUTTER")
                  }
                  className="w-full p-2.5 bg-canvas border border-line rounded-lg text-foreground text-xs focus:outline-none focus:border-brand-line"
                >
                  <option value="SELLER">ชาวสวนผู้ขาย (SELLER)</option>
                  <option value="BUYER">ล้งรับซื้อ (BUYER)</option>
                  <option value="CUTTER">ทีมตัดทุเรียน (CUTTER)</option>
                </select>
              </div>

              <div>
                <label htmlFor="admin-field-5" className="block font-semibold text-secondary mb-1">
                  ชื่อสวน / ชื่อล้ง / ชื่อทีมตัด (ระบุหรือไม่ก็ได้)
                </label>
                <input id="admin-field-5"
                  type="text"
                  value={grantBusinessName}
                  onChange={(e) => setGrantBusinessName(e.target.value)}
                  placeholder="เช่น สวนลุงสมชาย, ล้งเจริญทรัพย์"
                  className="w-full p-2.5 bg-canvas border border-line rounded-lg text-foreground text-xs focus:outline-none focus:border-brand-line placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setGrantRoleModal(null)}
                className="px-4 py-2 rounded-lg bg-muted hover:bg-hover text-secondary text-xs font-semibold transition-all"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleGrantRoleSubmit}
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-all shadow-panel "
              >
                บันทึกการมอบสิทธิ์
              </button>
            </div>
          </div>
        </DialogFrame>
      )}
    </div>
  );
}

