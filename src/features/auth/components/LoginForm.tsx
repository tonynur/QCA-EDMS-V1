"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "../hooks/useAuth";

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [clockStr, setClockStr] = useState({ time: "--:--:--", date: "-" });

  const { login, loginDemo, isLoading, error } = useAuth();

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClockStr({
        time: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        date: now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    const ok = await login({ email, password });
    if (ok && onSuccess) {
      onSuccess();
    }
  };

  const handleDemoClick = () => {
    loginDemo();
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white border border-slate-200/90 shadow-xl rounded-[12px] overflow-hidden">
      <CardContent className="p-8 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <Image
            src="/icons/logo.png"
            alt="PT Asuka Engineering Indonesia"
            width={160}
            height={44}
            className="h-11 w-auto max-w-[200px] object-contain mx-auto mb-1"
            priority
          />
          <div className="flex items-center gap-2 justify-center">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
              QC-CMS
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-[4px] bg-amber-50 text-amber-700 border border-amber-300">
              EDMS
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            QA/QC Electronic Document Management System
          </p>
          <div className="text-[11px] font-mono text-slate-400 pt-2 pb-1 border-b border-dashed border-slate-200 w-full text-center">
            <b className="text-slate-700 font-bold tabular-nums">{clockStr.time}</b> · <span>{clockStr.date}</span>
          </div>
        </div>

        {/* Form Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-[4px] bg-rose-50 border border-rose-300 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" strokeWidth={1.8} />
              <div className="space-y-0.5">
                <div className="font-semibold">{error}</div>
                <div className="text-[11px] text-slate-500">
                  Periksa email dan kata sandi Anda, atau gunakan akses masuk cepat di bawah.
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Email</label>
            <div className="relative">
              <input
                type="email"
                placeholder="nama@asuka.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-[6px] text-slate-800 focus:outline-none focus:border-[#163d78] focus:bg-white transition-all font-sans"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" strokeWidth={1.8} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-12 py-2 text-xs bg-slate-50 border border-slate-300 rounded-[6px] text-slate-800 focus:outline-none focus:border-[#163d78] focus:bg-white transition-all font-sans"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" strokeWidth={1.8} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                {showPassword ? "Tutup" : "Lihat"}
              </button>
            </div>
          </div>

          <div className="text-right">
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-[#163d78] font-medium"
            >
              Lupa password?
            </button>
          </div>

          <div className="pt-2 space-y-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-[#163d78] hover:bg-[#112e5a] text-white font-semibold"
              isLoading={isLoading}
            >
              Masuk
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs"
              onClick={handleDemoClick}
              icon={<ArrowRight className="w-4 h-4 text-[#163d78]" />}
            >
              Masuk Cepat: QA/QC Lead (Ahmad Nur Fatony)
            </Button>
          </div>

          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-[10.5px] text-slate-400 font-mono">
              PT Asuka Engineering Indonesia — Sistem Terpadu QC-CMS
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
