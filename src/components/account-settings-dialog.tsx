"use client";
import { ReviewSummary } from "./review-summary";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { X, User, Store, LockKeyhole, Settings, Upload, Trash2 } from "lucide-react";
import { DialogFrame } from "./dialog-frame";
import { Button } from "./ui";
import { ThemeSwitcher } from "./theme-switcher";
import type { RoleType } from "@/data/mockData";

type Business = { roleType: RoleType; businessName: string; description: string; status: string; isVerified: boolean };
export type AccountProfile = {
  id: number; fullName: string; avatarUrl: string | null; email: string; phone: string;
  isEmailVerified: boolean; activeRole: RoleType; province: string; businessName: string;
  rating: number; ratingCount: number; trustScore: number; roles: Business[];
};
type RoleRequest = { id: number; requestedRole: RoleType; status: string; adminRemark: string | null };
const controls = "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-foreground disabled:opacity-60";
const panels = ["personal", "business", "security", "preferences"] as const;
type Panel = typeof panels[number];

export function AccountSettingsDialog({ userId, lang, onLanguageChange, onClose, onUpdate, onPasswordChanged, onRequestRole }: {
  userId: number; lang: "TH" | "EN"; onLanguageChange: (lang: "TH" | "EN") => void;
  onClose: () => void; onUpdate: (user: AccountProfile) => void; onPasswordChanged: () => void; onRequestRole: () => void;
}) {
  const th = lang === "TH";
  const words = (thai: string, english: string) => th ? thai : english;
  const roleName = (role: string) => ({ SELLER: words("ชาวสวน", "Grower"), BUYER: words("ล้งรับซื้อ", "Buyer"), CUTTER: words("ทีมตัด", "Cutting crew"), ADMIN: words("ผู้ดูแล", "Admin") }[role] || role);
  const statusName = (status: string) => ({ ACTIVE: words("อนุมัติแล้ว", "Approved"), APPROVED: words("อนุมัติแล้ว", "Approved"), PENDING: words("รอตรวจสอบ", "Pending"), PENDING_APPROVAL: words("รอตรวจสอบ", "Pending"), REJECTED: words("ไม่ผ่านการอนุมัติ", "Rejected") }[status] || status);
  const [panel, setPanel] = useState<Panel>("personal");
  const [account, setAccount] = useState<AccountProfile | null>(null);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [fullName, setFullName] = useState("");
  const [province, setProvince] = useState("");
  const [role, setRole] = useState<RoleType | "">("");
  const [drafts, setDrafts] = useState<Record<string, { businessName: string; description: string }>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const alive = useRef(true);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChanged, setPasswordChanged] = useState(false);

  useEffect(() => {
    alive.current = true;
    const controller = new AbortController();
    setLoading(true); setLoadError(false);
    fetch("/api/user/profile", { cache: "no-store", signal: controller.signal })
      .then(async res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => {
        if (controller.signal.aborted) return;
        if (data.user.id !== userId) throw new Error();
        const user: AccountProfile = data.user;
        setAccount(user); setFullName(user.fullName); setProvince(user.province);
        setProvinces(data.provinces); setRequests(data.requests);
        setDrafts(Object.fromEntries(user.roles.map(r => [r.roleType, { businessName: r.businessName, description: r.description }])));
        setRole(user.roles.find(r => r.roleType === user.activeRole && r.status === "ACTIVE")?.roleType || user.roles.find(r => r.status === "ACTIVE")?.roleType || "");
      }).catch(() => { if (!controller.signal.aborted) setLoadError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { alive.current = false; controller.abort(); };
  }, [userId, retry]);

  const close = () => { if (!pending.current) { if (passwordChanged) onPasswordChanged(); else onClose(); } };
  async function mutate(url: string, options: RequestInit, success: (data: { user?: AccountProfile; avatarUrl?: string | null }) => void) {
    if (pending.current) return;
    pending.current = true; setBusy(true); setNotice(null);
    try {
      const res = await fetch(url, options);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || words("ทำรายการไม่สำเร็จ", "Request failed"));
      if (!alive.current) return;
      success(data);
      setNotice({ error: false, text: words("บันทึกเรียบร้อยแล้ว", "Changes saved") });
    } catch (error) {
      if (alive.current) setNotice({ error: true, text: error instanceof Error ? error.message : words("เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่", "Connection failed. Please retry.") });
    } finally { pending.current = false; if (alive.current) setBusy(false); }
  }
  function apply(user: AccountProfile) { setAccount(user); onUpdate(user); }
  function savePersonal(event: FormEvent) {
    event.preventDefault();
    void mutate("/api/user/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section: "personal", fullName, province }) }, data => {
      apply(data.user!); setFullName(data.user!.fullName); setProvince(data.user!.province);
    });
  }
  function saveBusiness(event: FormEvent) {
    event.preventDefault();
    void mutate("/api/user/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section: "business", roleType: role, ...drafts[role] }) }, data => {
      apply(data.user!);
      const saved = data.user!.roles.find(r => r.roleType === role)!;
      setDrafts(previous => ({ ...previous, [role]: { businessName: saved.businessName, description: saved.description } }));
    });
  }
  function changePassword(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) { setNotice({ error: true, text: words("รหัสผ่านใหม่ไม่ตรงกัน", "New passwords do not match") }); return; }
    void mutate("/api/user/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) }, () => {
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setPasswordChanged(true);
    });
  }
  function avatar(file?: File) {
    if (!account) return;
    if (file && (!file.size || file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      setNotice({ error: true, text: words("ใช้รูป JPG, PNG หรือ WebP ขนาดไม่เกิน 5MB", "Use a JPG, PNG or WebP image up to 5MB") }); return;
    }
    const form = new FormData(); if (file) form.append("file", file);
    void mutate("/api/user/avatar", file ? { method: "POST", body: form } : { method: "DELETE" }, data => apply({ ...account, avatarUrl: data.avatarUrl ?? null }));
  }
  const labels = [words("ข้อมูลส่วนตัว", "Personal"), words("กิจการและบทบาท", "Business & roles"), words("ความปลอดภัย", "Security"), words("การตั้งค่า", "Preferences")];
  const icons = [User, Store, LockKeyhole, Settings];
  const business = account?.roles.find(r => r.roleType === role);
  const submit = <Button type="submit" disabled={busy}>{busy ? words("กำลังบันทึก…", "Saving…") : words("บันทึกการเปลี่ยนแปลง", "Save changes")}</Button>;
  return <DialogFrame label={words("จัดการบัญชี", "Account settings")} onClose={close} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-6">
    <div className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-surface text-foreground shadow-panel">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line p-5">
        <div><h2 className="text-xl font-semibold">{words("จัดการบัญชี", "Account settings")}</h2><p className="mt-1 text-xs text-muted-foreground">{words("ข้อมูลส่วนตัว กิจการ และความปลอดภัยของคุณ", "Manage your profile, businesses and account security")}</p></div>
        <Button variant="ghost" disabled={busy} onClick={close} aria-label={words("ปิดจัดการบัญชี", "Close account settings")}><X className="h-5 w-5" /></Button>
      </header>
      {!passwordChanged && <nav className="grid shrink-0 grid-cols-2 gap-2 border-b border-line p-3 sm:grid-cols-4" aria-label={words("หมวดจัดการบัญชี", "Account sections")}>
        {panels.map((value, i) => { const Icon = icons[i]; return <button type="button" key={value} aria-pressed={panel === value} disabled={busy} onClick={() => { setPanel(value); setNotice(null); }} className={`flex items-center justify-center gap-2 rounded-lg px-2 py-3 text-xs font-semibold ${panel === value ? "bg-brand-soft text-brand-ink ring-1 ring-brand-line" : "text-secondary hover:bg-hover"}`}><Icon className="h-4 w-4 shrink-0" />{labels[i]}</button>; })}
      </nav>}
      <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6" aria-busy={loading || busy}>
        {passwordChanged ? <div className="space-y-4" role="status"><h3 className="font-semibold">{words("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว", "Password changed")}</h3><p className="text-sm text-secondary">{words("กรุณาเข้าสู่ระบบอีกครั้งบนเบราว์เซอร์นี้ด้วยรหัสผ่านใหม่", "Please sign in again in this browser using your new password.")}</p><Button onClick={onPasswordChanged}>{words("ไปเข้าสู่ระบบ", "Go to sign in")}</Button></div> : loading ? <p role="status">{words("กำลังโหลดข้อมูลบัญชี…", "Loading your account…")}</p> : loadError ? <div role="alert" className="space-y-3"><p>{words("โหลดข้อมูลไม่สำเร็จ", "Could not load your account")}</p><Button onClick={() => setRetry(n => n + 1)}>{words("ลองอีกครั้ง", "Retry")}</Button></div> : account && <>
          {notice && <p role={notice.error ? "alert" : "status"} className={`mb-4 rounded-lg border p-3 text-sm ${notice.error ? "border-danger-line bg-danger-soft text-danger-ink" : "border-brand-line bg-brand-soft text-brand-ink"}`}>{notice.text}</p>}
          {panel === "personal" && <div className="space-y-6">
            <section className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-subtle p-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-700 text-3xl font-semibold text-white">{account.avatarUrl ? <img src={account.avatarUrl} alt={words("รูปโปรไฟล์ของคุณ", "Your profile picture")} className="h-full w-full object-cover" /> : account.fullName.slice(0, 1)}</div>
              <div className="min-w-0 flex-1 space-y-2"><label className="block text-sm font-semibold" htmlFor="account-avatar">{words("รูปโปรไฟล์", "Profile picture")}</label><p className="text-xs text-muted-foreground">{words("รูปและชื่อของคุณแสดงให้คู่ค้าเห็น · JPG, PNG, WebP ไม่เกิน 5MB", "Your name and picture are visible to partners · JPG, PNG, WebP up to 5MB")}</p><div className="flex flex-wrap gap-2"><label className="ui-button ui-button-secondary cursor-pointer"><Upload className="h-4 w-4" />{words("อัปโหลดรูป", "Upload image")}<input id="account-avatar" type="file" disabled={busy} accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e => { const file = e.target.files?.[0]; if (file) avatar(file); e.target.value = ""; }} /></label><Button variant="ghost" disabled={busy || !account.avatarUrl} onClick={() => avatar()}><Trash2 className="h-4 w-4" />{words("ลบรูป", "Remove picture")}</Button></div></div>
            </section>
            <form onSubmit={savePersonal} className="space-y-4">
              <label className="block space-y-2 text-sm" htmlFor="account-name"><span>{words("ชื่อ–นามสกุล / ชื่อที่แสดง", "Full name / display name")}</span><input id="account-name" autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} required maxLength={100} disabled={busy} className={controls} /></label>
              <label className="block space-y-2 text-sm" htmlFor="account-province"><span>{words("จังหวัดระดับบัญชี (ใช้ร่วมกันทุกบทบาท)", "Account province (shared across all roles)")}</span><select id="account-province" value={province} disabled={busy} onChange={e => setProvince(e.target.value)} className={controls}><option value="">{words("ยังไม่ระบุ", "Not specified")}</option>{[...new Set([...provinces, account.province].filter(Boolean))].map(p => <option key={p} value={p}>{p}</option>)}</select></label>
              <div className="grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-2">
                <div className="min-w-0"><p className="text-xs text-muted-foreground">{words("อีเมลเข้าสู่ระบบ", "Sign-in email")}</p><p className="mt-1 break-words text-sm">{account.email}</p><p className="mt-1 text-xs text-brand-ink">{account.isEmailVerified ? words("ยืนยันอีเมลแล้ว", "Email verified") : words("ยังไม่ยืนยันอีเมล", "Email not verified")}</p></div>
                <div><p className="text-xs text-muted-foreground">{words("เบอร์เข้าสู่ระบบ / ติดต่อ", "Sign-in / contact phone")}</p><p className="mt-1 text-sm">{account.phone}</p><p className="mt-1 text-xs text-muted-foreground">{words("ยังไม่มีสถานะยืนยันเบอร์โทรในระบบ", "Phone verification is not available")}</p></div>
                <p className="text-xs text-muted-foreground sm:col-span-2">{words("อีเมลและเบอร์โทรเป็นข้อมูลเข้าสู่ระบบ จึงแก้ไขผ่านหน้านี้ไม่ได้", "Email and phone are sign-in details and cannot be changed on this screen.")}</p>
              </div><div className="flex justify-end">{submit}</div>
            </form>
          </div>}
          {panel === "business" && <div className="space-y-5">
            <p className="text-sm text-secondary">{words("เลือกกิจการที่ต้องการแก้ไข โดยไม่เปลี่ยนบทบาทที่กำลังใช้งาน", "Edit a business without changing your active role.")}</p>
            <label className="block space-y-2 text-sm" htmlFor="account-business-role"><span>{words("กิจการของบทบาท", "Business role")}</span><select id="account-business-role" value={role} disabled={busy} onChange={e => setRole(e.target.value as RoleType)} className={controls}>{!role && <option value="">{words("ยังไม่มีบทบาทที่อนุมัติ", "No approved roles")}</option>}{account.roles.filter(r => r.status === "ACTIVE").map(r => <option key={r.roleType} value={r.roleType}>{roleName(r.roleType)}</option>)}</select></label>
            {business && drafts[role] && <form onSubmit={saveBusiness} className="space-y-4"><div className="rounded-lg bg-brand-soft p-3 text-sm text-brand-ink">{words("กำลังแก้ไขข้อมูล: ", "Editing: ")}{roleName(role)} · {business.isVerified ? words("ยืนยันเอกสารแล้ว", "Documents verified") : words("ยังไม่ยืนยันเอกสาร", "Documents not verified")}</div>
              <label className="block space-y-2 text-sm" htmlFor="account-business-name"><span>{words("ชื่อสวน / ล้ง / ทีมตัด", "Orchard / buying yard / crew name")}</span><input id="account-business-name" value={drafts[role].businessName} onChange={e => setDrafts(previous => ({ ...previous, [role]: { ...previous[role], businessName: e.target.value } }))} required maxLength={200} disabled={busy} className={controls} /></label>
              <label className="block space-y-2 text-sm" htmlFor="account-business-description"><span>{words("รายละเอียดกิจการ", "Business description")}</span><textarea id="account-business-description" rows={4} value={drafts[role].description} onChange={e => setDrafts(previous => ({ ...previous, [role]: { ...previous[role], description: e.target.value } }))} maxLength={2000} disabled={busy} className={controls} /></label><p className="text-xs text-muted-foreground">{words("ชื่อกิจการจะแสดงบนประกาศของบทบาทนี้ ส่วนที่ตั้งยังใช้จังหวัดระดับบัญชีร่วมกัน", "The business name appears on listings for this role. Location uses the shared account province.")}</p><div className="flex justify-end">{submit}</div>
            </form>}
            <section className="space-y-3 border-t border-line pt-4"><h3 className="font-semibold">{words("บทบาทและคำขอของคุณ", "Your roles and requests")}</h3>{account.roles.map(r => <p key={r.roleType} className="flex justify-between gap-3 text-sm"><span>{roleName(r.roleType)}</span><span className="text-muted-foreground">{statusName(r.status)}</span></p>)}{requests.map(r => <div key={r.id} className="rounded-lg border border-line p-3 text-sm"><p>{roleName(r.requestedRole)} · {statusName(r.status)}</p>{r.adminRemark && <p className="mt-1 break-words text-muted-foreground">{r.adminRemark}</p>}</div>)}<Button variant="secondary" disabled={busy} onClick={onRequestRole}>{words("ขอเพิ่มบทบาท / จัดการคำขอ", "Request a role / manage requests")}</Button></section>
            <section className="rounded-xl border border-line bg-subtle p-4"><h3 className="mb-2 font-semibold">{words("ความน่าเชื่อถือของบัญชี", "Account reputation")}</h3><p className="text-sm text-secondary"><ReviewSummary average={account.rating} count={account.ratingCount} language={lang} /></p><p className="mt-1 text-sm text-secondary">{words("คะแนนความประพฤติ", "Trust score")} {account.trustScore}/100</p></section>
          </div>}
          {panel === "security" && <form onSubmit={changePassword} className="space-y-4"><h3 className="font-semibold">{words("เปลี่ยนรหัสผ่าน", "Change password")}</h3><p className="text-sm text-muted-foreground">{words("ใช้รหัสผ่านเดิมยืนยันตัวตน หลังเปลี่ยนสำเร็จจะต้องเข้าสู่ระบบใหม่บนเบราว์เซอร์นี้", "Confirm your current password. After saving, sign in again in this browser.")}</p>
            <label className="block space-y-2 text-sm" htmlFor="account-current-password"><span>{words("รหัสผ่านปัจจุบัน", "Current password")}</span><input id="account-current-password" type="password" autoComplete="current-password" required maxLength={1024} value={currentPassword} disabled={busy} onChange={e => setCurrentPassword(e.target.value)} className={controls} /></label>
            <label className="block space-y-2 text-sm" htmlFor="account-new-password"><span>{words("รหัสผ่านใหม่", "New password")}</span><input id="account-new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={newPassword} disabled={busy} onChange={e => setNewPassword(e.target.value)} className={controls} /></label>
            <p className="text-xs text-muted-foreground">{words("อย่างน้อย 8 ตัวอักษร และไม่เกิน 72 ไบต์ (ภาษาไทยอาจใช้หลายไบต์ต่ออักษร)", "At least 8 characters, up to 72 UTF-8 bytes; some characters use multiple bytes.")}</p>
            <label className="block space-y-2 text-sm" htmlFor="account-confirm-password"><span>{words("ยืนยันรหัสผ่านใหม่", "Confirm new password")}</span><input id="account-confirm-password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={confirmPassword} disabled={busy} onChange={e => setConfirmPassword(e.target.value)} className={controls} /></label><div className="flex justify-end">{submit}</div>
          </form>}
          {panel === "preferences" && <div className="space-y-6"><label className="block space-y-2 text-sm" htmlFor="account-language"><span>{words("ภาษา", "Language")}</span><select id="account-language" value={lang} onChange={e => onLanguageChange(e.target.value as "TH" | "EN")} className={controls}><option value="TH">ไทย</option><option value="EN">English</option></select></label><section className="space-y-3"><h3 className="text-sm">{words("รูปแบบการแสดงผล", "Appearance")}</h3><ThemeSwitcher language={lang} /></section><p className="text-xs text-muted-foreground">{words("ภาษาและธีมบันทึกไว้บนเบราว์เซอร์นี้และเปลี่ยนทันที", "Language and theme apply immediately and are saved in this browser.")}</p></div>}
        </>}
      </div>
    </div>
  </DialogFrame>;
}
