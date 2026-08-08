'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PatientProfileForm } from '@/components/forms/PatientProfileForm';
import { UserPlus, Sparkles } from 'lucide-react';

interface NewProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewProfileModal({ isOpen, onClose, onSuccess }: NewProfileModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0c4b39] bg-emerald-50 px-3 py-1 rounded-full w-fit border border-emerald-200/60">
            <UserPlus className="w-3.5 h-3.5 text-[#0c4b39]" />
            <span>Thêm Hồ Sơ Bệnh Nhân</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Thêm Hồ Sơ Người Thân / Bản Thân
          </DialogTitle>
          <p className="text-xs text-slate-500 font-medium">
            Nhập thông tin bệnh nhân chính xác để cơ sở y tế đối chiếu khi làm thủ tục khám bệnh
          </p>
        </DialogHeader>

        <div className="pt-2">
          <PatientProfileForm
            onSuccess={() => {
              onSuccess();
              onClose();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
