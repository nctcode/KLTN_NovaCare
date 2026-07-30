'use client';

import React, { useState } from 'react';
import { Camera, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploaderProps {
  onImagesChanged: (files: File[]) => void;
}

export function ImageUploader({ onImagesChanged }: ImageUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const updatedFiles = [...selectedFiles, ...newFiles].slice(0, 5); // Max 5 images

    setSelectedFiles(updatedFiles);
    onImagesChanged(updatedFiles);

    const newPreviews = updatedFiles.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const removeImage = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    onImagesChanged(updatedFiles);

    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
  };

  return (
    <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-extrabold flex items-center gap-2 text-slate-800 dark:text-slate-200">
          <Camera className="w-4 h-4 text-emerald-600" />
          Tải ảnh chụp tổn thương (Mẩn da, mắt, họng, vết thương)
        </label>
        <span className="text-[11px] font-semibold text-slate-500">Tối đa 5 ảnh</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {previews.map((src, index) => (
          <div key={index} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700">
            <img src={src} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5 hover:bg-rose-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {selectedFiles.length < 5 && (
          <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-emerald-600 transition">
            <ImageIcon className="w-5 h-5" />
            <span className="text-[9px] font-bold mt-1">+ Thêm ảnh</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}
