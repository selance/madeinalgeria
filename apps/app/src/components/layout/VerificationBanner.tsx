"use client";
import { useAuth } from "@/hooks/useAuth";
import React from "react";

const VerificationBanner = () => {
  const { user } = useAuth();
  if (!user || user.emailVerified) return null;

  return (
    <div className="p-2">
      <div className="bg-linear-to-b from-warning-50/50 via-warning-50/50 to-warning-100/50 rounded-card border-warning-200 border-b p-3 text-center">
        <p className="text-warning-700">
          يرجى تفعيل حسابك. تحقق من البريد الإلكتروني أو مجلد الرسائل غير المرغوب فيها.
        </p>
      </div>
    </div>
  );
};

export default VerificationBanner;
