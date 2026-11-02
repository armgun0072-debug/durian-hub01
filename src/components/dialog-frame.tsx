"use client";

import { useEffect, useRef, type ReactNode } from "react";

const layers: HTMLDivElement[] = [];
let originalOverflow = "";

export function DialogFrame({ label, onClose, className = "", children }: { label: string; onClose: () => void; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const element = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    if (!layers.length) { originalOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; }
    layers.push(element);
    const focusable = () => [...element.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')].filter(item => item.getClientRects().length);
    const controls = focusable();
    (controls.find(control => control.tagName === "INPUT") || controls[0] || element).focus();
    const keydown = (event: KeyboardEvent) => {
      if (layers[layers.length - 1] !== element) return;
      if (event.key === "Escape") { event.preventDefault(); close.current(); }
      if (event.key === "Tab") {
        const controls = focusable();
        const first = controls[0], last = controls[controls.length - 1];
        if (!first) { event.preventDefault(); element.focus(); return; }
        if (event.shiftKey && (document.activeElement === first || !element.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !element.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      }
    };
    const containFocus = (event: FocusEvent) => {
      if (layers[layers.length - 1] === element && !element.contains(event.target as Node)) (focusable()[0] || element).focus();
    };
    document.addEventListener("keydown", keydown);
    document.addEventListener("focusin", containFocus);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("focusin", containFocus);
      const index = layers.indexOf(element);
      if (index !== -1) layers.splice(index, 1);
      if (!layers.length) document.body.style.overflow = originalOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  return <div ref={ref} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className={`dialog-frame ${className}`}>{children}</div>;
}
