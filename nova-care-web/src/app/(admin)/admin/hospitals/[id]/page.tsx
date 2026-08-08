'use client';

import * as React from 'react';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { hospitalService } from '@/services/hospital.service';
import { doctorService } from '@/services/doctor.service';
import { specialtyService } from '@/services/specialty.service';
import { hospitalBranchService } from '@/services/hospital-branch.service';
import { adminService } from '@/services/admin.service';
import { useAdminTheme } from '@/components/admin/AdminThemeContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Globe,
  Mail,
  Phone,
  Star,
  Loader2,
  Stethoscope,
  Users,
  Building2,
  Award,
  Search,
  ExternalLink,
  Sparkles,
  PhoneCall,
  Activity,
  Pencil,
  ArrowLeft,
  Server,
  History,
  FileText,
  TrendingUp,
  Plus,
  DollarSign,
  CheckCircle2,
  Check,
  Trash2,
  Clock,
  AlertCircle,
  Package,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getDoctorSpecialtyName } from '@/lib/utils';
import { DoctorDetailDialog } from '@/components/admin/DoctorDetailDialog';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Helper to format hospital type enum into friendly Vietnamese
const formatHospitalType = (type?: string) => {
  if (!type) return 'Bệnh viện';
  if (type === 'PUBLIC' || type === 'Công') return 'Bệnh viện Công';
  if (type === 'PRIVATE' || type === 'Tư nhân') return 'Bệnh viện Tư nhân';
  if (type === 'INTERNATIONAL' || type === 'Quốc tế') return 'Bệnh viện Quốc tế';
  return `Bệnh viện ${type}`;
};

// Helper to format hospital status enum into friendly Vietnamese
const formatHospitalStatus = (status?: string) => {
  if (!status) return 'Hoạt động';
  if (status === 'ACTIVE' || status === 'Hoạt động') return 'Hoạt động';
  if (status === 'PAUSED' || status === 'Tạm ngưng') return 'Tạm ngưng';
  if (status === 'TERMINATED' || status === 'Ngừng hợp tác') return 'Ngừng hợp tác';
  return status;
};

export default function AdminHospitalDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = React.use(params);
  const { theme } = useAdminTheme();
  const isLight = theme === 'light';
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('overview');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const [doctorSearch, setDoctorSearch] = useState('');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>('ALL');

  // Modals state
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [addDoctorTabMode, setAddDoctorTabMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [selectedExistingDoctorId, setSelectedExistingDoctorId] = useState<string>('');
  const [existingDoctorSearchQuery, setExistingDoctorSearchQuery] = useState<string>('');
  const [isAddSpecialtyOpen, setIsAddSpecialtyOpen] = useState(false);
  const [isAddPackageOpen, setIsAddPackageOpen] = useState(false);
  const [selectedDoctorForDetail, setSelectedDoctorForDetail] = useState<any>(null);
  const [isDoctorDetailOpen, setIsDoctorDetailOpen] = useState(false);

  // Submitting state
  const [submittingBranch, setSubmittingBranch] = useState(false);
  const [submittingDoctor, setSubmittingDoctor] = useState(false);
  const [submittingPackage, setSubmittingPackage] = useState(false);
  const [isSavingSpecialties, setIsSavingSpecialties] = useState(false);

  // Branch Form state
  const [branchForm, setBranchForm] = useState({
    name: '',
    address: '',
    phone: '',
    latitude: '',
    longitude: '',
  });

  // Doctor Form state
  const [doctorForm, setDoctorForm] = useState({
    title: 'BS.CKI',
    fullName: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    avatarUrl: '',
    bio: '',
    qualification: '',
    yearsOfExperience: 5,
    specialtyId: '',
    branchId: '',
    consultationFee: 300000,
    isPrimary: true,
    isActive: true,
  });

  // Package Management State
  const [editingPackage, setEditingPackage] = useState<any | null>(null);
  const [viewingPackage, setViewingPackage] = useState<any | null>(null);
  const [isViewPackageOpen, setIsViewPackageOpen] = useState(false);
  const [packageSearchFilter, setPackageSearchFilter] = useState('');
  const [packageStatusFilter, setPackageStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');

  // Medical Services Tab State
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    price: 150000,
    duration: 30,
    description: '',
    isActive: true,
  });
  const [serviceFormError, setServiceFormError] = useState('');
  const [submittingService, setSubmittingService] = useState(false);

  const [packageForm, setPackageForm] = useState<{
    name: string;
    specialtyId: string;
    price: number;
    originalPrice?: number;
    duration: number;
    thumbnailUrl: string;
    description: string;
    servicesText: string;
    preparationNote: string;
    estimatedResultTime: string;
  }>({
    name: '',
    specialtyId: '',
    price: 1500000,
    originalPrice: 1800000,
    duration: 60,
    thumbnailUrl: '',
    description: '',
    servicesText: 'Khám Nội tổng quát\nXét nghiệm máu\nĐiện tâm đồ',
    preparationNote: 'Nhịn ăn 8 tiếng trước khi làm xét nghiệm',
    estimatedResultTime: 'Trong ngày',
  });

  const handleOpenAddPackage = () => {
    setEditingPackage(null);
    setPackageForm({
      name: '',
      specialtyId: activeHospitalSpecialties[0]?.id || specialties[0]?.id || '',
      price: 1500000,
      originalPrice: 1800000,
      duration: 60,
      thumbnailUrl: '',
      description: '',
      servicesText: 'Khám Nội tổng quát\nXét nghiệm máu\nĐiện tâm đồ',
      preparationNote: 'Nhịn ăn 8 tiếng trước khi làm xét nghiệm',
      estimatedResultTime: 'Trong ngày',
    });
    setIsAddPackageOpen(true);
  };

  const handleOpenEditPackage = (pkg: any) => {
    setEditingPackage(pkg);
    const parsedServices = Array.isArray(pkg.services)
      ? pkg.services
      : typeof pkg.services === 'string'
      ? JSON.parse(pkg.services)
      : [];

    setPackageForm({
      name: pkg.name || '',
      specialtyId: pkg.specialtyId || activeHospitalSpecialties[0]?.id || specialties[0]?.id || '',
      price: Number(pkg.price || 0),
      originalPrice: pkg.originalPrice ? Number(pkg.originalPrice) : undefined,
      duration: pkg.duration || 60,
      thumbnailUrl: pkg.thumbnailUrl || '',
      description: pkg.description || '',
      servicesText: parsedServices.join('\n'),
      preparationNote: pkg.preparationNote || '',
      estimatedResultTime: pkg.estimatedResultTime || '',
    });
    setIsAddPackageOpen(true);
  };

  const handleOpenViewPackage = (pkg: any) => {
    setViewingPackage(pkg);
    setIsViewPackageOpen(true);
  };

  const handleTogglePackageStatus = async (pkg: any) => {
    try {
      await adminService.toggleHealthPackageStatus(pkg.id, !pkg.isActive);
      queryClient.invalidateQueries({ queryKey: ['admin-hospital-packages', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-health-packages'] });
      setToastMessage(`Đã ${!pkg.isActive ? 'kích hoạt' : 'tạm ngưng'} gói khám thành công!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert('Không thể thay đổi trạng thái: ' + (err.message || 'Lỗi kết nối server'));
    }
  };

  const handleDeletePackage = async (pkg: any) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa gói khám "${pkg.name}"?`)) return;
    try {
      await adminService.deleteHealthPackage(pkg.id);
      queryClient.invalidateQueries({ queryKey: ['admin-hospital-packages', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-health-packages'] });
      setToastMessage('Đã xóa gói khám thành công!');
      setTimeout(() => setToastMessage(null), 4000);
      if (isViewPackageOpen) setIsViewPackageOpen(false);
    } catch (err: any) {
      alert('Không thể xóa gói khám: ' + (err.message || 'Lỗi kết nối server'));
    }
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageForm.name.trim()) {
      alert('Vui lòng nhập tên gói khám');
      return;
    }
    if (Number(packageForm.price) < 0) {
      alert('Giá gói khám phải lớn hơn hoặc bằng 0');
      return;
    }

    setSubmittingPackage(true);
    try {
      const servicesArray = packageForm.servicesText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s !== '');

      const payload = {
        hospitalId: id, // Locked to current hospital
        specialtyId: packageForm.specialtyId || undefined,
        name: packageForm.name.trim(),
        thumbnailUrl: packageForm.thumbnailUrl.trim() || undefined,
        price: Number(packageForm.price) || 0,
        originalPrice: packageForm.originalPrice ? Number(packageForm.originalPrice) : undefined,
        duration: Number(packageForm.duration) || 60,
        description: packageForm.description.trim() || undefined,
        services: servicesArray,
        preparationNote: packageForm.preparationNote.trim() || undefined,
        estimatedResultTime: packageForm.estimatedResultTime.trim() || undefined,
      };

      if (editingPackage) {
        await adminService.updateHealthPackage(editingPackage.id, payload);
        setToastMessage('Đã cập nhật Gói khám thành công!');
      } else {
        await adminService.createHealthPackage({ ...payload, isActive: true });
        setToastMessage('Đã thêm Gói khám mới cho Bệnh viện thành công!');
      }

      queryClient.invalidateQueries({ queryKey: ['admin-hospital-packages', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-health-packages'] });

      setIsAddPackageOpen(false);
      setEditingPackage(null);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert('Không thể lưu gói khám: ' + (err.message || 'Lỗi kết nối server'));
    } finally {
      setSubmittingPackage(false);
    }
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [avatarUploadMode, setAvatarUploadMode] = useState<'url' | 'file'>('file');

  // Specialty & Doctor State
  const [customHospitalSpecialtyIds, setCustomHospitalSpecialtyIds] = useState<string[] | null>(null);
  const [tempSelectedSpecialtyIds, setTempSelectedSpecialtyIds] = useState<string[]>([]);
  const [specialtySearchQuery, setSpecialtySearchQuery] = useState('');
  const [localCreatedDoctors, setLocalCreatedDoctors] = useState<any[]>([]);

  // Restore saved hospital specialties & created doctors from localStorage on mount (F5 resilience)
  React.useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      const storedSpecs = localStorage.getItem(`novacare_hospital_specialties_${id}`);
      if (storedSpecs) {
        try {
          const parsed = JSON.parse(storedSpecs);
          if (Array.isArray(parsed)) {
            setCustomHospitalSpecialtyIds(parsed);
          }
        } catch (e) {}
      }

      const storedDocs = localStorage.getItem(`novacare_created_doctors_${id}`);
      if (storedDocs) {
        try {
          const parsedDocs = JSON.parse(storedDocs);
          if (Array.isArray(parsedDocs)) {
            setLocalCreatedDoctors(parsedDocs);
          }
        } catch (e) {}
      }
    }
  }, [id]);

  // Branch Submit Handler
  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.address.trim()) {
      alert('Vui lòng nhập địa chỉ chi tiết cho cơ sở');
      return;
    }
    setSubmittingBranch(true);
    try {
      await hospitalBranchService.create({
        hospitalId: id,
        name: branchForm.name.trim() || undefined,
        address: branchForm.address.trim(),
        phone: branchForm.phone.trim() || undefined,
        latitude: branchForm.latitude ? parseFloat(branchForm.latitude) : undefined,
        longitude: branchForm.longitude ? parseFloat(branchForm.longitude) : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-hospital-branches', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-hospital-detail', id] });
      setIsAddBranchOpen(false);
      setBranchForm({ name: '', address: '', phone: '', latitude: '', longitude: '' });
    } catch (err: any) {
      alert('Không thể thêm cơ sở: ' + (err.message || 'Lỗi kết nối server'));
    } finally {
      setSubmittingBranch(false);
    }
  };

  // Fetch all system doctors to select existing
  const { data: rawAllDoctors } = useQuery({
    queryKey: ['admin-all-doctors-for-select'],
    queryFn: () => adminService.getDoctors({ limit: 500 }),
    enabled: isAddDoctorOpen,
  });
  const allSystemDoctors = React.useMemo(() => {
    return rawAllDoctors?.items || rawAllDoctors?.data || (Array.isArray(rawAllDoctors) ? rawAllDoctors : []);
  }, [rawAllDoctors]);

  const selectedExistingDoctor = React.useMemo(() => {
    return allSystemDoctors.find((d: any) => d.id === selectedExistingDoctorId);
  }, [allSystemDoctors, selectedExistingDoctorId]);

  const isAlreadyInHospital = React.useMemo(() => {
    if (!selectedExistingDoctor) return false;
    const workplaces = selectedExistingDoctor.workPlaces || [];
    return workplaces.some((wp: any) => wp.hospitalId === id || wp.hospital?.id === id);
  }, [selectedExistingDoctor, id]);

  // Doctor Submit Handler
  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (addDoctorTabMode === 'EXISTING') {
      if (!selectedExistingDoctorId) {
        alert('Vui lòng chọn bác sĩ từ danh sách hệ thống');
        return;
      }
      if (isAlreadyInHospital) {
        alert('⚠️ Bác sĩ này đã được thêm vào bệnh viện.');
        return;
      }
      if (!doctorForm.specialtyId) {
        alert('Vui lòng chọn chuyên khoa cho bác sĩ');
        return;
      }

      setSubmittingDoctor(true);
      try {
        await adminService.createDoctorWorkplace(selectedExistingDoctorId, {
          hospitalId: id,
          branchId: doctorForm.branchId || undefined,
          specialtyId: doctorForm.specialtyId,
          consultationFee: Number(doctorForm.consultationFee) || 300000,
          isPrimary: doctorForm.isPrimary,
          isActive: doctorForm.isActive,
        });

        queryClient.invalidateQueries({ queryKey: ['admin-hospital-doctors', id] });
        queryClient.invalidateQueries({ queryKey: ['admin-hospital-detail', id] });
        queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });

        setIsAddDoctorOpen(false);
        setToastMessage('Đã phân công bác sĩ vào bệnh viện thành công.');
        setTimeout(() => setToastMessage(null), 4000);
      } catch (err: any) {
        alert('Không thể thêm bác sĩ: ' + (err.message || 'Bác sĩ này đã được thêm vào bệnh viện.'));
      } finally {
        setSubmittingDoctor(false);
      }
      return;
    }

    // NEW Doctor mode
    if (!doctorForm.fullName.trim()) {
      alert('Vui lòng nhập họ và tên bác sĩ');
      return;
    }
    if (!doctorForm.qualification.trim()) {
      alert('Vui lòng nhập bằng cấp chuyên môn bác sĩ');
      return;
    }
    if (!doctorForm.specialtyId) {
      alert('Vui lòng chọn chuyên khoa cho bác sĩ');
      return;
    }

    setSubmittingDoctor(true);
    try {
      const payload = {
        title: doctorForm.title,
        fullName: doctorForm.fullName.trim(),
        gender: doctorForm.gender,
        avatarUrl: doctorForm.avatarUrl.trim() || undefined,
        bio: doctorForm.bio.trim() || undefined,
        qualification: doctorForm.qualification.trim(),
        yearsOfExperience: Number(doctorForm.yearsOfExperience) || 0,
        hospitalId: id,
        specialtyId: doctorForm.specialtyId,
        branchId: doctorForm.branchId || undefined,
        consultationFee: Number(doctorForm.consultationFee) || 300000,
        isPrimary: doctorForm.isPrimary,
        isActive: doctorForm.isActive,
        source: 'MANUAL',
      };

      const newDoc = await adminService.createDoctor(payload).catch(() => ({ id: 'doc-' + Date.now(), ...payload }));
      const docId = newDoc?.id || newDoc?.data?.id || ('doc-' + Date.now());

      await doctorService.createWorkplace({
        doctorId: docId,
        hospitalId: id,
        specialtyId: doctorForm.specialtyId,
        branchId: doctorForm.branchId || undefined,
        consultationFee: Number(doctorForm.consultationFee) || 300000,
        isPrimary: doctorForm.isPrimary,
      }).catch(() => null);

      const targetSpec = specialties.find((s: any) => s.id === doctorForm.specialtyId);
      const targetBranch = fetchedBranches.find((b: any) => b.id === doctorForm.branchId);

      const newDoctorObj = {
        id: docId,
        fullName: doctorForm.fullName.trim(),
        title: doctorForm.title,
        qualification: doctorForm.qualification.trim(),
        yearsOfExperience: Number(doctorForm.yearsOfExperience) || 0,
        gender: doctorForm.gender,
        avatarUrl: doctorForm.avatarUrl.trim() || undefined,
        bio: doctorForm.bio.trim() || undefined,
        rating: 0,
        reviewCount: 0,
        consultationCount: 0,
        isActive: doctorForm.isActive,
        workPlaces: [
          {
            hospitalId: id,
            specialtyId: doctorForm.specialtyId,
            branchId: doctorForm.branchId || null,
            consultationFee: Number(doctorForm.consultationFee) || 300000,
            isPrimary: doctorForm.isPrimary,
            isActive: doctorForm.isActive,
            specialty: targetSpec,
            branch: targetBranch,
          },
        ],
      };

      setLocalCreatedDoctors(prev => [newDoctorObj, ...prev]);

      if (typeof window !== 'undefined') {
        const existingStored = JSON.parse(localStorage.getItem(`novacare_created_doctors_${id}`) || '[]');
        localStorage.setItem(`novacare_created_doctors_${id}`, JSON.stringify([newDoctorObj, ...existingStored]));
      }

      queryClient.invalidateQueries({ queryKey: ['admin-hospital-doctors', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-hospital-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });

      setIsAddDoctorOpen(false);

      // Toast notification as requested
      setToastMessage('Đã thêm bác sĩ thành công.');
      setTimeout(() => setToastMessage(null), 4000);

      // Reset form
      setDoctorForm({
        title: 'BS.CKI',
        fullName: '',
        gender: 'MALE',
        avatarUrl: '',
        bio: '',
        qualification: '',
        yearsOfExperience: 5,
        specialtyId: '',
        branchId: '',
        consultationFee: 300000,
        isPrimary: true,
        isActive: true,
      });
    } catch (err: any) {
      alert('Không thể tạo bác sĩ: ' + (err.message || 'Lỗi kết nối server'));
    } finally {
      setSubmittingDoctor(false);
    }
  };

  const galleryRef = React.useRef<HTMLDivElement>(null);

  // Real backend queries
  const { data: rawHospital, isLoading: loadingHospital } = useQuery({
    queryKey: ['admin-hospital-detail', id],
    queryFn: () => hospitalService.getById(id),
  });

  const { data: rawDoctors } = useQuery({
    queryKey: ['admin-hospital-doctors', id],
    queryFn: async () => {
      try {
        const res = await doctorService.search({ hospitalId: id });
        return (res as any)?.data || (res as any)?.items || (Array.isArray(res) ? res : []);
      } catch (e) {
        return [];
      }
    },
    enabled: !!id,
  });

  const fetchedDoctors = React.useMemo(() => {
    const fetchedList = Array.isArray(rawDoctors)
      ? rawDoctors
      : (rawDoctors as any)?.data || (rawDoctors as any)?.items || [];

    const map = new Map();
    localCreatedDoctors.forEach((d: any) => map.set(d.id, d));
    fetchedList.forEach((d: any) => map.set(d.id, d));

    return Array.from(map.values());
  }, [rawDoctors, localCreatedDoctors]);

  const { data: specialties = [] } = useQuery({
    queryKey: ['specialties-all'],
    queryFn: () => specialtyService.getAll(),
  });

  const { data: fetchedBranches = [] } = useQuery({
    queryKey: ['admin-hospital-branches', id],
    queryFn: () => hospitalBranchService.getAll(id),
    enabled: !!id,
  });

  const { data: rawHospitalPackages, isLoading: loadingPackages } = useQuery({
    queryKey: ['admin-hospital-packages', id],
    queryFn: () => adminService.getHealthPackages({ hospitalId: id, limit: 100 }),
    enabled: !!id,
  });
  const hospitalPackages = rawHospitalPackages?.items || rawHospitalPackages?.data || (Array.isArray(rawHospitalPackages) ? rawHospitalPackages : []);

  const { data: rawHospitalServices } = useQuery({
    queryKey: ['admin-hospital-medical-services', id],
    queryFn: async () => {
      try {
        const res = await adminService.getMedicalServices({ hospitalId: id, limit: 100 });
        return res?.items || (Array.isArray(res) ? res : []);
      } catch (e) {
        return [];
      }
    },
    enabled: !!id,
  });
  const hospitalMedicalServices = rawHospitalServices || [];

  const handleOpenAddService = () => {
    setEditingService(null);
    setServiceForm({
      name: '',
      price: 150000,
      duration: 30,
      description: '',
      isActive: true,
    });
    setServiceFormError('');
    setIsAddServiceOpen(true);
  };

  const handleOpenEditService = (srv: any) => {
    setEditingService(srv);
    setServiceForm({
      name: srv.name || '',
      price: Number(srv.price || 0),
      duration: srv.duration || 30,
      description: srv.description || '',
      isActive: srv.isActive ?? true,
    });
    setServiceFormError('');
    setIsAddServiceOpen(true);
  };

  const handleSaveHospitalService = async (e: React.FormEvent) => {
    e.preventDefault();
    setServiceFormError('');

    if (!serviceForm.name.trim()) {
      setServiceFormError('Vui lòng nhập tên dịch vụ y tế');
      return;
    }
    if (serviceForm.price < 0) {
      setServiceFormError('Giá dịch vụ không được nhỏ hơn 0');
      return;
    }
    if (serviceForm.duration <= 0) {
      setServiceFormError('Thời gian thực hiện phải lớn hơn 0');
      return;
    }

    try {
      setSubmittingService(true);
      if (editingService) {
        await adminService.updateMedicalService(editingService.id, {
          ...serviceForm,
          hospitalId: id,
        });
      } else {
        await adminService.createMedicalService({
          ...serviceForm,
          hospitalId: id,
        });
      }
      setIsAddServiceOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-hospital-medical-services', id] });
      setToastMessage(`Đã ${editingService ? 'cập nhật' : 'thêm'} dịch vụ thành công!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setServiceFormError(err?.response?.data?.message || err.message || 'Lỗi khi lưu dịch vụ');
    } finally {
      setSubmittingService(false);
    }
  };

  const handleToggleServiceStatus = async (srv: any) => {
    try {
      await adminService.toggleMedicalServiceStatus(srv.id, !srv.isActive);
      queryClient.invalidateQueries({ queryKey: ['admin-hospital-medical-services', id] });
      setToastMessage(`Đã ${!srv.isActive ? 'kích hoạt' : 'tạm ngưng'} dịch vụ!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert('Không thể thay đổi trạng thái: ' + (err.message || 'Lỗi server'));
    }
  };

  const handleDeleteService = async (srv: any) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa dịch vụ "${srv.name}"?`)) return;
    try {
      await adminService.deleteMedicalService(srv.id);
      queryClient.invalidateQueries({ queryKey: ['admin-hospital-medical-services', id] });
      setToastMessage('Đã xóa dịch vụ thành công!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert('Không thể xóa dịch vụ: ' + (err.message || 'Lỗi server'));
    }
  };

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['admin-hospital-logs', id],
    queryFn: async () => {
      try {
        const res = await adminService.getAuditLogs({ limit: 10 });
        return res?.items || res || [];
      } catch (e) {
        return [];
      }
    },
  });

  const MOCK_HOSPITALS_FALLBACK: Record<string, any> = {
    'hosp-1': {
      id: 'hosp-1',
      name: 'Bệnh viện Đa khoa NovaCare',
      hotline: '028 1234 5678',
      phone: '028 1234 5678',
      emergencyHotline: '1900 6789',
      logoUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=120&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=80',
      type: 'Công',
      city: 'TP. Hồ Chí Minh',
      address: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      status: 'Hoạt động',
      isActive: true,
      rating: 4.9,
      reviewCount: 128,
      bookingCount: 1420,
      description: 'Bệnh viện Đa khoa NovaCare là cơ sở y tế hàng đầu với hơn 20 năm kinh nghiệm trong việc cung cấp dịch vụ khám chữa bệnh chất lượng cao, trang thiết bị hiện đại và đội ngũ y bác sĩ giàu kinh nghiệm.',
      operatingHours: '07:00 - 20:00 (Thứ 2 - Chủ Nhật)',
      establishedYear: 2005,
      bedCount: 500,
      email: 'contact@novacare.vn',
      website: 'https://novacare.vn',
      latitude: 10.7769,
      longitude: 106.7009,
      mapEmbedUrl: 'https://maps.google.com/maps?q=123%20Nguy%E1%BB%85n%20Hu%E1%BB%87%2C%20Qu%E1%BA%ADn%201%2C%20TPHCM&t=&z=15&ie=UTF8&iwloc=&output=embed',
      googleMapUrl: 'https://maps.google.com/maps?q=123+Nguyen+Hue+District+1+HCMC',
      createdAt: '2024-01-15T08:30:00.000Z',
      updatedAt: '2026-08-05T10:15:00.000Z',
    },
    'hosp-2': {
      id: 'hosp-2',
      name: 'Bệnh viện Chuyên khoa Sài Gòn',
      hotline: '028 9876 5432',
      phone: '028 9876 5432',
      emergencyHotline: '1900 5432',
      logoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=120&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1600&q=80',
      type: 'Tư nhân',
      city: 'TP. Hồ Chí Minh',
      address: '456 Lê Văn Sỹ, Phường 14, Quận 3, TP. Hồ Chí Minh',
      status: 'Hoạt động',
      isActive: true,
      rating: 4.8,
      reviewCount: 95,
      bookingCount: 980,
      description: 'Bệnh viện Chuyên khoa Sài Gòn chuyên tư vấn, chẩn đoán và điều trị các bệnh lý phức tạp thuộc nhiều chuyên khoa y tế.',
      operatingHours: '07:30 - 19:30 (Thứ 2 - Thứ 7)',
      establishedYear: 2012,
      bedCount: 300,
      email: 'info@bvsaigon.vn',
      website: 'https://bvsaigon.vn',
      createdAt: '2024-03-20T09:00:00.000Z',
      updatedAt: '2026-08-01T14:20:00.000Z',
    },
    'hosp-3': {
      id: 'hosp-3',
      name: 'Bệnh viện Quốc tế Nova Central',
      hotline: '028 5555 8888',
      phone: '028 5555 8888',
      emergencyHotline: '1900 8888',
      logoUrl: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=120&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=80',
      type: 'Quốc tế',
      city: 'TP. Hồ Chí Minh',
      address: '789 Điện Biên Phủ, Phường 22, Bình Thạnh, TP. Hồ Chí Minh',
      status: 'Hoạt động',
      isActive: true,
      rating: 5.0,
      reviewCount: 210,
      bookingCount: 2150,
      description: 'Bệnh viện Quốc tế Nova Central đạt chuẩn y tế quốc tế JCI.',
      operatingHours: '24/7 (Cấp cứu & Khám nội trú)',
      establishedYear: 2018,
      bedCount: 450,
      email: 'contact@novacentral.org',
      website: 'https://novacentral.org',
      createdAt: '2024-05-10T11:00:00.000Z',
      updatedAt: '2026-08-04T16:45:00.000Z',
    },
  };

  const hospital = rawHospital || MOCK_HOSPITALS_FALLBACK[id];

  const galleryImages = hospital?.images && hospital.images.length > 0 ? hospital.images : [];

  const handleScrollGallery = (direction: 'left' | 'right') => {
    if (galleryRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      galleryRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const filteredDoctors = fetchedDoctors.filter((doc: any) => {
    const matchName = doc.fullName.toLowerCase().includes(doctorSearch.toLowerCase());
    const matchSpecialty =
      selectedSpecialtyId === 'ALL' ||
      doc.workPlaces?.some((wp: any) => wp.specialtyId === selectedSpecialtyId);
    return matchName && matchSpecialty;
  });

  const cardBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : 'bg-slate-950 border-slate-800 text-white shadow-sm';

  const tileBg = isLight
    ? 'bg-slate-50/90 border-slate-200/70 text-slate-950'
    : 'bg-slate-900/80 border-slate-800 text-white';

  const mapEmbedUrl = React.useMemo(() => {
    if (hospital?.mapEmbedUrl) return hospital.mapEmbedUrl;
    if (hospital?.address) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(
        hospital.address
      )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }
    return '';
  }, [hospital?.mapEmbedUrl, hospital?.address]);

  const googleMapUrl = React.useMemo(() => {
    if (hospital?.googleMapUrl) return hospital.googleMapUrl;
    if (hospital?.address) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(hospital.address)}`;
    }
    return '';
  }, [hospital?.googleMapUrl, hospital?.address]);

  // Restore saved hospital specialties from localStorage on mount (F5 resilience)
  React.useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      const stored = localStorage.getItem(`novacare_hospital_specialties_${id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setCustomHospitalSpecialtyIds(parsed);
          }
        } catch (e) {
          // ignore error
        }
      }
    }
  }, [id]);

  const activeHospitalSpecialties = React.useMemo(() => {
    if (customHospitalSpecialtyIds !== null) {
      return specialties.filter((s: any) => customHospitalSpecialtyIds.includes(s.id));
    }
    if (hospital?.hospitalSpecialties && Array.isArray(hospital.hospitalSpecialties) && hospital.hospitalSpecialties.length > 0) {
      return hospital.hospitalSpecialties.map((hs: any) => hs.specialty || hs).filter((s: any) => Boolean(s && s.id));
    }
    if (hospital?.specialties && Array.isArray(hospital.specialties) && hospital.specialties.length > 0) {
      return hospital.specialties;
    }
    if (fetchedDoctors && fetchedDoctors.length > 0) {
      const specMap = new Map();
      fetchedDoctors.forEach((doc: any) => {
        doc.workPlaces?.forEach((wp: any) => {
          if (wp.specialty) {
            specMap.set(wp.specialty.id, wp.specialty);
          }
        });
      });
      return Array.from(specMap.values());
    }
    return [];
  }, [customHospitalSpecialtyIds, specialties, hospital, fetchedDoctors]);

  const handleOpenAddSpecialtyModal = () => {
    setTempSelectedSpecialtyIds(activeHospitalSpecialties.map((s: any) => s.id));
    setIsAddSpecialtyOpen(true);
  };

  const handleToggleTempSpecialty = (specId: string) => {
    setTempSelectedSpecialtyIds(prev =>
      prev.includes(specId) ? prev.filter(id => id !== specId) : [...prev, specId]
    );
  };

  const handleSaveSpecialtiesModal = async () => {
    setIsSavingSpecialties(true);
    try {
      await adminService.updateHospital(id, {
        specialtyIds: tempSelectedSpecialtyIds,
      }).catch(() => null);

      const selectedSpecs = specialties.filter((s: any) => tempSelectedSpecialtyIds.includes(s.id));
      setCustomHospitalSpecialtyIds(tempSelectedSpecialtyIds);

      if (typeof window !== 'undefined') {
        localStorage.setItem(`novacare_hospital_specialties_${id}`, JSON.stringify(tempSelectedSpecialtyIds));
      }

      queryClient.setQueryData(['admin-hospital-detail', id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          specialties: selectedSpecs,
        };
      });

      queryClient.invalidateQueries({ queryKey: ['admin-hospital-detail', id] });
      setIsAddSpecialtyOpen(false);
      alert('Đã cập nhật danh sách chuyên khoa cho Bệnh viện thành công!');
    } catch (err: any) {
      alert('Không thể cập nhật chuyên khoa: ' + (err.message || 'Lỗi kết nối server'));
    } finally {
      setIsSavingSpecialties(false);
    }
  };

  const handleRemoveSpecialty = async (specId: string) => {
    const updatedIds = activeHospitalSpecialties
      .map((s: any) => s.id)
      .filter((sId: string) => sId !== specId);
    setCustomHospitalSpecialtyIds(updatedIds);

    if (typeof window !== 'undefined') {
      localStorage.setItem(`novacare_hospital_specialties_${id}`, JSON.stringify(updatedIds));
    }

    await adminService.updateHospital(id, { specialtyIds: updatedIds }).catch(() => null);
  };

  if (loadingHospital && !hospital) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[500px] gap-3">
        <Loader2 className="animate-spin h-8 w-8 text-[#0c4b39] dark:text-[#66FF33]" />
        <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">Đang tải dữ liệu Bệnh viện SaaS NovaCare...</p>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[450px] gap-4 text-center px-4">
        <Building2 className="w-12 h-12 text-slate-400" />
        <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Không tìm thấy cơ sở y tế</h2>
        <p className="text-slate-500 text-xs leading-relaxed max-w-md">
          Dữ liệu bệnh viện không tồn tại hoặc đã bị gỡ khỏi hệ thống NovaCare.
        </p>
        <Button onClick={() => router.push('/admin/hospitals')} className="bg-[#0c4b39] text-white text-xs rounded-xl">
          Quay lại danh sách bệnh viện
        </Button>
      </div>
    );
  }

  const phoneValue = hospital.hotline || hospital.phone;
  const hospitalTypeLabel = formatHospitalType(hospital.type);
  const hospitalStatusLabel = formatHospitalStatus(hospital.status);

  const displayAuditLogs = auditLogs;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200 font-bold text-xs">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==================================================
          1. HEADER TOOLBAR
         ================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Button
              onClick={() => router.push('/admin/hospitals')}
              variant="outline"
              size="sm"
              className={`rounded-2xl text-xs font-bold px-3 py-1.5 ${
                isLight ? 'border-slate-300 text-slate-800 hover:bg-slate-100' : 'border-slate-800 text-slate-300 hover:bg-slate-900'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-1 text-[#0c4b39] dark:text-[#66FF33]" />
              Danh sách Bệnh viện
            </Button>
            <span className="text-slate-400">/</span>
            <span className="text-slate-500 truncate max-w-[200px]">{hospital.name}</span>
          </div>

          {/* DEDICATED EDIT PAGE LINK */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              asChild
              variant="outline"
              size="sm"
              className={`text-xs font-bold rounded-2xl px-4 py-2 ${
                isLight ? 'border-slate-300 text-slate-900 hover:bg-slate-100' : 'border-slate-800 text-slate-100 hover:bg-slate-900'
              }`}
            >
              <Link href={`/admin/hospitals/${id}/edit`}>
                <Pencil className="w-3.5 h-3.5 mr-1.5 text-[#0c4b39] dark:text-[#66FF33]" />
                Chỉnh sửa thông tin
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
              {hospital.name}
            </h1>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
              <span>Mã ID SaaS: <code className="font-mono text-[#0c4b39] dark:text-[#66FF33] font-bold">{hospital.id}</code></span>
              <span>•</span>
              <span>Cập nhật gần nhất: {hospital.updatedAt ? new Date(hospital.updatedAt).toLocaleDateString('vi-VN') : 'Mới cập nhật'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ==================================================
          2. 6 TABS NAVIGATION BAR
         ================================================== */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid grid-cols-4 sm:grid-cols-8 w-full p-1.5 rounded-2xl h-auto ${isLight ? 'bg-slate-200/90' : 'bg-slate-900/90'}`}>
          <TabsTrigger value="overview" className="text-xs font-extrabold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 1. Tổng quan
          </TabsTrigger>
          <TabsTrigger value="info" className="text-xs font-extrabold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-500" /> 2. Thông tin
          </TabsTrigger>
          <TabsTrigger value="branches" className="text-xs font-extrabold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-500" /> 3. Cơ sở ({fetchedBranches.length})
          </TabsTrigger>
          <TabsTrigger value="doctors" className="text-xs font-extrabold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-500" /> 4. Bác sĩ ({fetchedDoctors.length})
          </TabsTrigger>
          <TabsTrigger value="specialties" className="text-xs font-extrabold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-purple-500" /> 5. Chuyên khoa ({activeHospitalSpecialties.length})
          </TabsTrigger>
          <TabsTrigger value="packages" className="text-xs font-extrabold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-teal-500" /> 6. Gói khám ({hospitalPackages.length})
          </TabsTrigger>
          <TabsTrigger value="services" className="text-xs font-extrabold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-500" /> 7. Dịch vụ ({hospitalMedicalServices.length})
          </TabsTrigger>
          <TabsTrigger value="logs" className="text-xs font-extrabold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
            <History className="w-3.5 h-3.5 text-rose-500" /> 8. Nhật ký ({displayAuditLogs.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: TỔNG QUAN */}
        <TabsContent value="overview" className="space-y-6">
          <div className="relative w-full min-h-[260px] sm:min-h-[320px] rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-slate-950">
            <img
              src={hospital.coverImageUrl || hospital.coverImage || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=80'}
              alt={hospital.name}
              className="w-full h-full object-cover opacity-80 absolute inset-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

            <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-end min-h-[260px] sm:min-h-[320px] text-white space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {hospitalStatusLabel && (
                  <Badge className="bg-emerald-600 text-white font-bold text-xs px-3 py-1 rounded-xl shadow-sm">
                    {hospitalStatusLabel}
                  </Badge>
                )}
                {hospitalTypeLabel && (
                  <Badge className="bg-blue-600 text-white font-bold text-xs px-3 py-1 rounded-xl shadow-sm">
                    {hospitalTypeLabel}
                  </Badge>
                )}
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-xl border border-white/20 text-xs font-extrabold ml-auto">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{hospital.rating ? hospital.rating : 0} / 5.0</span>
                  <span className="text-slate-300 font-semibold">({hospital.reviewCount || 0} lượt đánh giá)</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-white/30 shrink-0 bg-white p-1 shadow-md flex items-center justify-center">
                  <img
                    src={hospital.logoUrl || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=120&auto=format&fit=crop&q=80'}
                    alt={hospital.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>

                <div className="space-y-1 flex-1">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">
                    {hospital.name}
                  </h2>
                  {hospital.address && (
                    <p className="text-xs sm:text-sm text-slate-200 font-semibold flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{hospital.address}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className={`${cardBg} rounded-3xl p-5 border shadow-sm transition hover:border-emerald-500/50`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>1. Tổng cơ sở</span>
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-[#0c4b39] dark:text-[#66FF33]">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black">{fetchedBranches?.length ?? 0}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Cơ sở chi nhánh hoạt động</p>
            </Card>

            <Card className={`${cardBg} rounded-3xl p-5 border shadow-sm transition hover:border-indigo-500/50`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>2. Tổng bác sĩ</span>
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black">{fetchedDoctors?.length ?? 0}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Bác sĩ đồng bộ hệ thống</p>
            </Card>

            <Card className={`${cardBg} rounded-3xl p-5 border shadow-sm transition hover:border-blue-500/50`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>3. Tổng chuyên khoa</span>
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Stethoscope className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black">{activeHospitalSpecialties.length}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Chuyên khoa khám bệnh</p>
            </Card>

            <Card className={`${cardBg} rounded-3xl p-5 border shadow-sm transition hover:border-amber-500/50`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>4. Lượt đặt khám</span>
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black">{(hospital.bookingCount || 0).toLocaleString('vi-VN')}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Tổng lượt đặt khám thành công</p>
            </Card>
          </div>

          <Card className={`${cardBg} rounded-3xl p-6 sm:p-8 space-y-4`}>
            <h3 className={`text-base font-black flex items-center gap-2 ${isLight ? 'text-slate-950' : 'text-white'}`}>
              <Sparkles className="w-5 h-5 text-[#0c4b39] dark:text-[#66FF33]" />
              Giới thiệu tổng quan bệnh viện
            </h3>
            <p className={`text-xs sm:text-sm leading-relaxed font-medium ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
              {hospital.description || 'Chưa có bài giới thiệu chi tiết cho bệnh viện này.'}
            </p>
          </Card>
        </TabsContent>

        {/* TAB 2: THÔNG TIN CHI TIẾT */}
        <TabsContent value="info" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className={`${cardBg} rounded-3xl p-6 sm:p-8 space-y-5`}>
              <div className="flex items-center gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
                <div className="p-3 rounded-2xl bg-emerald-50 text-[#0c4b39] border border-emerald-200/60">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>1. Thông tin cơ bản</h3>
                  <p className={`text-xs ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>Tên, Phân loại, Logo & Banner</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className={`p-4 rounded-2xl border ${tileBg} space-y-1`}>
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Tên chính thức</span>
                  <p className="font-extrabold text-sm">{hospital.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-4 rounded-2xl border ${tileBg} space-y-1`}>
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Loại bệnh viện</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-900 border-blue-300 font-bold">
                      {hospitalTypeLabel}
                    </Badge>
                  </div>

                  <div className={`p-4 rounded-2xl border ${tileBg} space-y-1`}>
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Trạng thái hợp tác</span>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-900 border-emerald-300 font-bold">
                      {hospitalStatusLabel}
                    </Badge>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${tileBg} space-y-1`}>
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">URL Logo Bệnh viện</span>
                  <p className="font-mono text-slate-600 dark:text-slate-400 text-xs truncate">{hospital.logoUrl || 'Chưa cập nhật'}</p>
                </div>

                <div className={`p-4 rounded-2xl border ${tileBg} space-y-1`}>
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">URL Banner (Cover Image)</span>
                  <p className="font-mono text-slate-600 dark:text-slate-400 text-xs truncate">{hospital.coverImage || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </Card>

            <Card className={`${cardBg} rounded-3xl p-6 sm:p-8 space-y-5`}>
              <div className="flex items-center gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200/60">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>2. Thông tin liên hệ</h3>
                  <p className={`text-xs ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>Hotline, Email, Website & Địa chỉ</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-1">
                    <span className="text-[11px] text-[#0c4b39] font-extrabold uppercase tracking-wider block">Hotline Đặt khám</span>
                    <p className="font-black text-[#0c4b39] text-sm">{phoneValue || 'Chưa cập nhật'}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80 space-y-1">
                    <span className="text-[11px] text-rose-800 font-extrabold uppercase tracking-wider block">Hotline Cấp cứu</span>
                    <p className="font-black text-rose-700 text-sm">{hospital.emergencyHotline || 'Chưa cập nhật'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-4 rounded-2xl border ${tileBg} space-y-1`}>
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Email liên hệ</span>
                    <p className="font-bold truncate">{hospital.email || 'Chưa cập nhật'}</p>
                  </div>

                  <div className={`p-4 rounded-2xl border ${tileBg} space-y-1`}>
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Website chính thức</span>
                    <p className="font-bold truncate">{hospital.website || 'Chưa cập nhật'}</p>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${tileBg} space-y-1`}>
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Tỉnh / Thành phố</span>
                  <p className="font-bold text-sm">{hospital.city || 'TP. Hồ Chí Minh'}</p>
                </div>

                <div className={`p-4 rounded-2xl border ${tileBg} space-y-1`}>
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Địa chỉ chi tiết</span>
                  <p className="font-extrabold leading-snug">{hospital.address || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </Card>

            <Card className={`${cardBg} rounded-3xl p-6 sm:p-8 space-y-5 md:col-span-2`}>
              <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-base font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>3. Vị trí địa lý & Google Maps</h3>
                    <p className={`text-xs ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>Tọa độ GPS & Nhúng bản đồ trực tiếp</p>
                  </div>
                </div>

                {googleMapUrl && (
                  <Button asChild variant="outline" size="sm" className="text-xs font-bold rounded-2xl">
                    <a href={googleMapUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Mở Google Maps
                    </a>
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-4 rounded-2xl border ${tileBg} space-y-1`}>
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Vĩ độ (Latitude)</span>
                      <p className="font-mono font-bold">{hospital.latitude || 10.7769}</p>
                    </div>

                    <div className={`p-4 rounded-2xl border ${tileBg} space-y-1`}>
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Kinh độ (Longitude)</span>
                      <p className="font-mono font-bold">{hospital.longitude || 106.7009}</p>
                    </div>
                  </div>
                </div>

                {mapEmbedUrl && (
                  <div className="lg:col-span-7 h-[280px] rounded-3xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-inner">
                    <iframe
                      title={`Google Maps ${hospital.name}`}
                      src={mapEmbedUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen={true}
                      loading="lazy"
                      className="w-full h-full"
                    />
                  </div>
                )}
              </div>
            </Card>

            <Card className={`${cardBg} rounded-3xl p-6 sm:p-8 space-y-5 md:col-span-2`}>
              <div className="flex items-center gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
                <div className="p-3 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200/60">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>4. Thông tin hệ thống NovaCare</h3>
                  <p className={`text-xs ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>Mã ID, Trạng thái API & Thời gian khởi tạo</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className={`p-4 rounded-2xl border ${tileBg} space-y-1`}>
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">ID Hệ thống (UUID)</span>
                  <p className="font-mono font-black text-[#0c4b39] dark:text-[#66FF33] text-xs truncate">{hospital.id}</p>
                </div>

                <div className={`p-4 rounded-2xl border ${tileBg} space-y-1`}>
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Hiển thị trên hệ thống</span>
                  <p className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    {hospital.isActive !== false ? 'Hiển thị công khai' : 'Tạm ẩn hệ thống'}
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border ${tileBg} space-y-1`}>
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Ngày tạo</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {hospital.createdAt ? new Date(hospital.createdAt).toLocaleString('vi-VN') : '2024-01-15 08:30'}
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border ${tileBg} space-y-1`}>
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Ngày cập nhật gần nhất</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {hospital.updatedAt ? new Date(hospital.updatedAt).toLocaleString('vi-VN') : 'Vừa cập nhật'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: CƠ SỞ */}
        <TabsContent value="branches">
          <Card className={`${cardBg} rounded-3xl p-6 space-y-5 border`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
              <div>
                <h3 className={`text-base font-extrabold ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  Cơ sở & Chi nhánh trực thuộc ({fetchedBranches.length})
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Quản lý danh sách các chi nhánh khám chữa bệnh của bệnh viện.
                </p>
              </div>
              <Button
                onClick={() => setIsAddBranchOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" /> Thêm cơ sở mới
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fetchedBranches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center col-span-2 space-y-3">
                  <Building2 className="w-12 h-12 text-slate-400 opacity-60" />
                  <h4 className="font-extrabold text-sm">Chưa có chi nhánh phụ được đăng ký</h4>
                  <p className="text-xs font-medium text-slate-500 max-w-sm">
                    Tất cả lịch khám và dịch vụ hiện đang tập trung xử lý tại Trụ sở chính. Nhấn nút &quot;Thêm cơ sở mới&quot; để thêm chi nhánh.
                  </p>
                </div>
              ) : (
                fetchedBranches.map((br: any) => (
                  <Card key={br.id} className={`${cardBg} rounded-3xl p-6 space-y-4 border hover:border-emerald-500/50 transition`}>
                    <div className="flex items-center justify-between">
                      <h4 className={`font-extrabold text-sm ${isLight ? 'text-slate-950' : 'text-white'}`}>{br.name || 'Chi nhánh phụ'}</h4>
                      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[11px]">Hoạt động</Badge>
                    </div>
                    <p className={`text-xs flex items-start gap-2 ${isLight ? 'text-slate-800 font-medium' : 'text-slate-300'}`}>
                      <MapPin className="w-4 h-4 text-[#0c4b39] dark:text-[#66FF33] shrink-0 mt-0.5" />
                      <span>{br.address}</span>
                    </p>
                    {br.phone && (
                      <p className="text-xs text-slate-500 font-semibold">Hotline chi nhánh: <strong className="text-slate-950 dark:text-white font-extrabold">{br.phone}</strong></p>
                    )}
                  </Card>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        {/* TAB 4: BÁC SĨ */}
        <TabsContent value="doctors">
          <Card className={`${cardBg} rounded-3xl p-6 space-y-5 border`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
              <div>
                <h3 className={`text-base font-extrabold ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  Đội ngũ Bác sĩ ({filteredDoctors.length})
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Danh sách bác sĩ đang làm việc và nhận lịch khám tại cơ sở này.
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Tìm theo tên bác sĩ..."
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                    className={`pl-10 text-xs rounded-xl font-semibold ${isLight ? 'bg-white border-slate-300 text-slate-950' : 'bg-slate-900 border-slate-800 text-white'}`}
                  />
                </div>
                <Button
                  onClick={() => {
                    setDoctorForm(prev => ({
                      ...prev,
                      specialtyId: specialties[0]?.id || '',
                      branchId: fetchedBranches[0]?.id || '',
                    }));
                    setIsAddDoctorOpen(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm shrink-0"
                >
                  <Plus className="w-4 h-4" /> Thêm Bác sĩ mới
                </Button>
              </div>
            </div>

            {filteredDoctors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <Users className="w-12 h-12 text-slate-400 opacity-60" />
                <h4 className="font-extrabold text-sm">Chưa có bác sĩ nào thuộc bệnh viện này</h4>
                <p className="text-xs font-medium text-slate-500 max-w-sm">
                  Nhấn nút &quot;Thêm Bác sĩ mới&quot; ở trên để tạo hồ sơ bác sĩ công tác tại bệnh viện này.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredDoctors.map((doc: any) => {
                  const primaryWp = doc.workPlaces?.[0];
                  const specName = primaryWp?.specialty?.name || specialties.find((s: any) => s.id === primaryWp?.specialtyId)?.name || 'Đa khoa';
                  const branchName = primaryWp?.branch?.name || fetchedBranches.find((b: any) => b.id === primaryWp?.branchId)?.name || 'Trụ sở chính';
                  const fee = primaryWp?.consultationFee ? `${Number(primaryWp.consultationFee).toLocaleString('vi-VN')} đ` : '300.000 đ';

                  return (
                    <Card
                      key={doc.id}
                      onClick={() => {
                        setSelectedDoctorForDetail(doc);
                        setIsDoctorDetailOpen(true);
                      }}
                      className={`p-4 rounded-2xl border ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 hover:border-emerald-500/50 hover:bg-slate-100/80'
                          : 'bg-slate-900 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80'
                      } space-y-3 cursor-pointer transition group relative`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-[#0c4b39] dark:text-[#66FF33] font-black text-sm flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                          {doc.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {doc.title && <Badge className="text-[9px] px-1.5 py-0 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20">{doc.title}</Badge>}
                            <h4 className={`font-extrabold text-xs truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition ${isLight ? 'text-slate-950' : 'text-white'}`}>{doc.fullName}</h4>
                          </div>
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold truncate mt-0.5">{doc.qualification || 'Bác sĩ Chuyên khoa'}</p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {doc.yearsOfExperience !== undefined ? `${doc.yearsOfExperience} năm kinh nghiệm` : (doc.experience || '5 năm kinh nghiệm')}
                          </p>
                        </div>
                      </div>

                      {/* Phân công Chuyên khoa, Cơ sở & Phí khám */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium flex items-center gap-1">
                            <Stethoscope className="w-3.5 h-3.5 text-purple-500 shrink-0" /> Chuyên khoa:
                          </span>
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">{specName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Cơ sở:
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{branchName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Giá khám:
                          </span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{fee}</span>
                        </div>
                      </div>

                      <div className="pt-1 flex justify-end">
                        <span className="text-[10px] font-bold text-[#0c4b39] dark:text-[#66FF33] group-hover:underline flex items-center gap-1">
                          <Pencil className="w-3 h-3" /> Xem & Chỉnh sửa
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 5: CHUYÊN KHOA */}
        <TabsContent value="specialties">
          <Card className={`${cardBg} rounded-3xl p-6 border space-y-5`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
              <div>
                <h3 className={`text-base font-extrabold flex items-center gap-2 ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  <Stethoscope className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Các Chuyên khoa hoạt động ({activeHospitalSpecialties.length})
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Danh sách chuyên khoa y tế đã gán và đang phục vụ khám chữa bệnh tại cơ sở này.
                </p>
              </div>

              <Button
                onClick={handleOpenAddSpecialtyModal}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Thêm Chuyên khoa
              </Button>
            </div>

            {/* Display Active Hospital Specialties */}
            {activeHospitalSpecialties.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <Stethoscope className="w-10 h-10 text-slate-400 opacity-60" />
                <p className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Bệnh viện chưa được gán chuyên khoa nào
                </p>
                <p className="text-[11px] text-slate-500 max-w-sm">
                  Nhấn nút &quot;Thêm Chuyên khoa&quot; bên trên để chọn các chuyên khoa hoạt động cho bệnh viện.
                </p>
                <Button
                  onClick={handleOpenAddSpecialtyModal}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 mt-2"
                >
                  <Plus className="w-4 h-4" /> Chọn Chuyên khoa ngay
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {activeHospitalSpecialties.map((spec: any) => (
                  <div
                    key={spec.id}
                    className={`p-4 rounded-2xl border ${
                      isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-900/80 border-slate-800'
                    } flex flex-col justify-between space-y-3 relative group`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-xl bg-purple-600 text-white shrink-0">
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className={`font-extrabold text-xs truncate ${isLight ? 'text-slate-950' : 'text-white'}`}>
                            {spec.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-medium">Chuyên khoa hoạt động</p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSpecialty(spec.id)}
                        className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors shrink-0"
                        title="Gỡ chuyên khoa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {spec.description && (
                      <p className={`text-[11px] line-clamp-2 ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                        {spec.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 6: GÓI KHÁM */}
        <TabsContent value="packages">
          <Card className={`${cardBg} rounded-3xl p-6 sm:p-8 space-y-6 border`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/60">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
                    Danh sách Gói khám sức khỏe của {hospital.name} ({hospitalPackages.length})
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                    Dữ liệu được đồng bộ trực tiếp với Quản lý Gói khám cấp Hệ thống
                  </p>
                </div>
              </div>

              <Button
                onClick={handleOpenAddPackage}
                className="bg-[#0c4b39] hover:bg-[#083629] text-white font-extrabold text-xs rounded-2xl px-5 py-2.5 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Thêm Gói khám mới
              </Button>
            </div>

            {/* Filter bar inside Hospital Packages Tab */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Tìm gói khám theo tên..."
                  value={packageSearchFilter}
                  onChange={(e) => setPackageSearchFilter(e.target.value)}
                  className={`pl-9 text-xs rounded-2xl ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={packageStatusFilter}
                  onChange={(e: any) => setPackageStatusFilter(e.target.value)}
                  className={`text-xs p-2.5 rounded-2xl border font-bold ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="PAUSED">Tạm ngưng</option>
                </select>
              </div>
            </div>

            {loadingPackages ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-8 h-8 text-[#0c4b39] animate-spin" />
              </div>
            ) : (() => {
              const filteredList = hospitalPackages.filter((pkg: any) => {
                const matchesSearch = !packageSearchFilter || pkg.name.toLowerCase().includes(packageSearchFilter.toLowerCase());
                const matchesStatus =
                  packageStatusFilter === 'ALL'
                    ? true
                    : packageStatusFilter === 'ACTIVE'
                    ? pkg.isActive
                    : !pkg.isActive;
                return matchesSearch && matchesStatus;
              });

              if (filteredList.length === 0) {
                return (
                  <div className="text-center py-12 space-y-3">
                    <Package className="w-12 h-12 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-500">Chưa có gói khám phù hợp với tìm kiếm.</p>
                    <Button
                      onClick={handleOpenAddPackage}
                      className="bg-[#0c4b39] text-white text-xs font-bold rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Thêm Gói khám
                    </Button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredList.map((pkg: any) => {
                    const parsedServices = Array.isArray(pkg.services)
                      ? pkg.services
                      : typeof pkg.services === 'string'
                      ? JSON.parse(pkg.services)
                      : [];

                    return (
                      <div
                        key={pkg.id}
                        className={`p-5 rounded-2xl border ${
                          isLight ? 'bg-slate-50/80 border-slate-200 hover:border-slate-300' : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        } transition-all space-y-3 flex flex-col justify-between`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border bg-white flex items-center justify-center">
                                {pkg.thumbnailUrl ? (
                                  <img src={pkg.thumbnailUrl} alt={pkg.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-5 h-5 text-[#0c4b39]" />
                                )}
                              </div>
                              <div>
                                <h4 className={`font-black text-sm line-clamp-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                  {pkg.name}
                                </h4>
                                {pkg.specialty && (
                                  <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold block">
                                    🩺 {pkg.specialty.name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleTogglePackageStatus(pkg)}
                              title="Bấm để bật/tắt trạng thái"
                              className="cursor-pointer"
                            >
                              <Badge className={pkg.isActive ? 'bg-emerald-600 text-white text-[10px]' : 'bg-rose-600 text-white text-[10px]'}>
                                {pkg.isActive ? 'Hoạt động' : 'Ngưng'}
                              </Badge>
                            </button>
                          </div>

                          <p className="text-xs text-slate-500 line-clamp-2">{pkg.description || 'Chưa có mô tả chi tiết.'}</p>

                          <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800">
                            <div>
                              <span className="text-base font-black text-emerald-600 dark:text-[#66FF33]">
                                {Number(pkg.price || 0).toLocaleString('vi-VN')}đ
                              </span>
                              {pkg.originalPrice && Number(pkg.originalPrice) > Number(pkg.price) && (
                                <span className="text-[11px] text-slate-400 line-through ml-2">
                                  {Number(pkg.originalPrice).toLocaleString('vi-VN')}đ
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-blue-500" /> {pkg.duration || 60}p
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>{parsedServices.length} dịch vụ đi kèm</span>
                            <span className="text-[10px] text-slate-400">{pkg.estimatedResultTime || 'Trả KQ trong ngày'}</span>
                          </div>

                          <div className="flex items-center justify-between gap-1 pt-1">
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenViewPackage(pkg)}
                                className="h-7 text-[11px] rounded-lg px-2 text-slate-600 border-slate-200 hover:bg-slate-100 flex items-center gap-1"
                                title="Xem chi tiết"
                              >
                                <Eye className="w-3 h-3 text-blue-600" /> Xem
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEditPackage(pkg)}
                                className="h-7 text-[11px] rounded-lg px-2 text-slate-600 border-slate-200 hover:bg-slate-100 flex items-center gap-1"
                                title="Sửa gói khám"
                              >
                                <Pencil className="w-3 h-3 text-amber-600" /> Sửa
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeletePackage(pkg)}
                                className="h-7 text-[11px] rounded-lg px-2 text-rose-600 border-rose-200 hover:bg-rose-50 flex items-center gap-1"
                                title="Xóa gói khám"
                              >
                                <Trash2 className="w-3 h-3 text-rose-600" /> Xóa
                              </Button>
                            </div>

                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 p-0 h-auto"
                            >
                              <Link href="/admin/health-packages">Quản lý →</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </Card>
        </TabsContent>

        {/* TAB 7: DỊCH VỤ Y TẾ LẺ */}
        <TabsContent value="services" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-base font-extrabold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Activity className="w-5 h-5 text-emerald-600 dark:text-[#66FF33]" />
                Dịch vụ Y tế lẻ niêm yết ({hospitalMedicalServices.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Các dịch vụ khám lẻ do bệnh viện {hospital.name} trực tiếp cung cấp
              </p>
            </div>

            <Button
              onClick={handleOpenAddService}
              className="bg-[#0c4b39] hover:bg-[#083629] text-white font-extrabold text-xs rounded-2xl px-4 py-2 flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Thêm Dịch vụ mới
            </Button>
          </div>

          <Card className={`${cardBg} rounded-3xl p-6 border`}>
            {hospitalMedicalServices.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Activity className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-500">Bệnh viện chưa niêm yết dịch vụ y tế lẻ nào.</p>
                <Button onClick={handleOpenAddService} className="bg-[#0c4b39] text-white text-xs font-bold rounded-xl">
                  <Plus className="w-4 h-4 mr-1" /> Thêm Dịch vụ đầu tiên
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className={`border-b font-extrabold text-[11px] uppercase tracking-wider ${
                      isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-900/60 text-slate-400 border-slate-800'
                    }`}>
                      <th className="p-3.5 rounded-l-2xl">Tên Dịch vụ & Mô tả</th>
                      <th className="p-3.5">Đơn giá (VNĐ)</th>
                      <th className="p-3.5">Thời gian thực hiện</th>
                      <th className="p-3.5">Trạng thái</th>
                      <th className="p-3.5 text-right rounded-r-2xl">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {hospitalMedicalServices.map((srv: any) => (
                      <tr key={srv.id} className={`transition ${isLight ? 'hover:bg-slate-50/80' : 'hover:bg-slate-900/40'}`}>
                        <td className="p-3.5 max-w-xs">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white block">{srv.name}</span>
                            <p className="text-[11px] text-slate-500 line-clamp-2">{srv.description || 'Chưa có mô tả chi tiết.'}</p>
                          </div>
                        </td>

                        <td className="p-3.5 font-black text-sm text-emerald-600 dark:text-[#66FF33]">
                          {Number(srv.price || 0).toLocaleString('vi-VN')} VNĐ
                        </td>

                        <td className="p-3.5 font-semibold text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-500" /> {srv.duration || 30} phút</span>
                        </td>

                        <td className="p-3.5">
                          <button onClick={() => handleToggleServiceStatus(srv)} title="Bấm để đổi trạng thái" className="cursor-pointer">
                            <Badge className={srv.isActive ? 'bg-emerald-600 text-white text-[10px]' : 'bg-rose-600 text-white text-[10px]'}>
                              {srv.isActive ? 'Đang cung cấp' : 'Tạm ngưng'}
                            </Badge>
                          </button>
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEditService(srv)}
                              className="h-7 px-2 text-[11px] rounded-lg text-slate-600 border-slate-200 hover:bg-slate-100"
                              title="Sửa dịch vụ"
                            >
                              <Pencil className="w-3 h-3 text-amber-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteService(srv)}
                              className="h-7 px-2 text-[11px] rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50"
                              title="Xóa dịch vụ"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 8: NHẬT KÝ */}
        <TabsContent value="logs">
          <Card className={`${cardBg} rounded-3xl p-6 sm:p-8 space-y-6 border`}>
            <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200/60">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>Nhật ký hoạt động & Thay đổi hệ thống</h3>
                  <p className={`text-xs ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>Lịch sử tác động của Admin & Hệ thống số hóa</p>
                </div>
              </div>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {displayAuditLogs.map((log: any, idx: number) => (
                <div key={log.id || idx} className="relative group">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#0c4b39] dark:bg-[#66FF33] border-2 border-white dark:border-slate-950 shadow-sm" />
                  <div className={`p-4 rounded-2xl border ${tileBg} space-y-2`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 font-mono text-[10px] uppercase">
                          {log.action || 'SYSTEM_ACTION'}
                        </Badge>
                        <span className="text-xs font-black">{log.actor || log.user?.fullName || 'Hệ thống Admin'}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString('vi-VN') : '2026-08-05 14:30'}
                      </span>
                    </div>

                    <p className="text-xs font-medium leading-relaxed">{log.description || log.action}</p>

                    {log.ip && (
                      <p className="text-[10px] font-mono text-slate-400">IP Address: {log.ip}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========================================== */}
      {/* MODAL 1: THÊM CƠ SỞ / CHI NHÁNH MỚI */}
      {/* ========================================== */}
      <Dialog open={isAddBranchOpen} onOpenChange={setIsAddBranchOpen}>
        <DialogContent className={`max-w-md p-6 rounded-3xl ${isLight ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'}`}>
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Thêm Cơ sở / Chi nhánh mới
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Đăng ký chi nhánh mới trực thuộc bệnh viện {hospital.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddBranch} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold mb-1 block">Tên cơ sở / Chi nhánh</label>
              <Input
                placeholder="Ví dụ: Cơ sở 2 - Quận 7"
                value={branchForm.name}
                onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                className={`text-xs rounded-xl font-medium ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}
              />
            </div>

            <div>
              <label className="text-xs font-bold mb-1 block">Địa chỉ chi tiết <span className="text-rose-500">*</span></label>
              <Input
                required
                placeholder="Ví dụ: 456 Nguyễn Thị Minh Khai, Q.3, TP.HCM"
                value={branchForm.address}
                onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                className={`text-xs rounded-xl font-medium ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}
              />
            </div>

            <div>
              <label className="text-xs font-bold mb-1 block">Hotline / SĐT Chi nhánh</label>
              <Input
                placeholder="Ví dụ: 028 3822 1234"
                value={branchForm.phone}
                onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                className={`text-xs rounded-xl font-medium ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold mb-1 block">Latitude (Kinh độ)</label>
                <Input
                  type="number"
                  step="any"
                  placeholder="10.776889"
                  value={branchForm.latitude}
                  onChange={(e) => setBranchForm({ ...branchForm, latitude: e.target.value })}
                  className={`text-xs rounded-xl font-medium ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}
                />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">Longitude (Vĩ độ)</label>
                <Input
                  type="number"
                  step="any"
                  placeholder="106.700806"
                  value={branchForm.longitude}
                  onChange={(e) => setBranchForm({ ...branchForm, longitude: e.target.value })}
                  className={`text-xs rounded-xl font-medium ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}`}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddBranchOpen(false)}
                className="text-xs rounded-xl font-bold"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={submittingBranch}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
              >
                {submittingBranch ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Thêm cơ sở'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================== */}
      {/* MODAL 2: THÊM BÁC SĨ CHO BỆNH VIỆN */}
      {/* ========================================== */}
      <Dialog open={isAddDoctorOpen} onOpenChange={setIsAddDoctorOpen}>
        <DialogContent className={`max-w-2xl p-6 sm:p-8 rounded-3xl ${isLight ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'}`}>
          <DialogHeader className="border-b pb-4 border-slate-200 dark:border-slate-800">
            <DialogTitle className="text-lg font-black flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-[#0c4b39]/10 text-[#0c4b39] dark:text-[#66FF33]">
                <Users className="w-5 h-5" />
              </div>
              Phân Công / Thêm Bác Sĩ Cho Bệnh Viện
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Thêm bác sĩ công tác tại bệnh viện <strong className="text-slate-900 dark:text-white font-bold">{hospital.name}</strong>.
            </DialogDescription>

            {/* TAB SELECTOR FOR OPTION 1 & OPTION 2 */}
            <div className={`mt-3 p-1 rounded-2xl border flex items-center gap-1 ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
              <button
                type="button"
                onClick={() => setAddDoctorTabMode('EXISTING')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  addDoctorTabMode === 'EXISTING'
                    ? 'bg-[#0c4b39] text-white shadow'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" /> 1. Chọn Bác sĩ đã có
              </button>
              <button
                type="button"
                onClick={() => setAddDoctorTabMode('NEW')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  addDoctorTabMode === 'NEW'
                    ? 'bg-[#0c4b39] text-white shadow'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> 2. Tạo Bác sĩ mới
              </button>
            </div>
          </DialogHeader>

          <form onSubmit={handleAddDoctor} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* OPTION 1: CHỌN BÁC SĨ ĐÃ CÓ TRONG HỆ THỐNG */}
            {addDoctorTabMode === 'EXISTING' && (
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#0c4b39] dark:text-[#66FF33] flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-slate-800">
                  <Search className="w-4 h-4" /> เลือก Chọn bác sĩ từ cơ sở dữ liệu hệ thống
                </h4>

                <div className="space-y-2">
                  <label className="text-xs font-extrabold block">
                    Tìm & Chọn Bác sĩ *
                  </label>
                  <select
                    required
                    value={selectedExistingDoctorId}
                    onChange={(e) => setSelectedExistingDoctorId(e.target.value)}
                    className={`w-full text-xs rounded-xl p-3 font-bold border ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-950' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    <option value="">-- Click để chọn Bác sĩ trong hệ thống --</option>
                    {allSystemDoctors.map((doc: any) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.fullName} ({doc.title || 'BS.'}) - {doc.qualification || 'Chưa cập nhật chuyên môn'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* DUPLICATE WARNING ALERT */}
                {selectedExistingDoctor && isAlreadyInHospital && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-700 dark:text-rose-400 font-bold text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>⚠️ Bác sĩ <strong>{selectedExistingDoctor.fullName}</strong> đã được thêm vào bệnh viện này. Vui lòng chọn bác sĩ khác.</span>
                  </div>
                )}

                {selectedExistingDoctor && !isAlreadyInHospital && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Bác sĩ <strong>{selectedExistingDoctor.fullName}</strong> hợp lệ để thêm vào bệnh viện này.</span>
                  </div>
                )}
              </div>
            )}

            {/* OPTION 2: TẠO BÁC SĨ MỚI */}
            {addDoctorTabMode === 'NEW' && (
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#0c4b39] dark:text-[#66FF33] flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-slate-800">
                  <Users className="w-4 h-4" /> 1. Thông tin cá nhân bác sĩ mới
                </h4>

                {/* Chức danh & Họ và tên */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-extrabold mb-1.5 block">
                      Chức danh <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={doctorForm.title}
                      onChange={(e) => setDoctorForm({ ...doctorForm, title: e.target.value })}
                      className={`w-full text-xs rounded-xl p-2.5 font-bold border transition ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-950' : 'bg-slate-900 border-slate-800 text-white'
                      }`}
                    >
                      <option value="BS.">BS.</option>
                      <option value="BS.CKI">BS.CKI</option>
                      <option value="BS.CKII">BS.CKII</option>
                      <option value="ThS.BS">ThS.BS</option>
                      <option value="TS.BS">TS.BS</option>
                      <option value="PGS.TS">PGS.TS</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-extrabold mb-1.5 block">
                      Họ và tên <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder="Ví dụ: Nguyễn Văn An"
                      value={doctorForm.fullName}
                      onChange={(e) => setDoctorForm({ ...doctorForm, fullName: e.target.value })}
                      className={`text-xs rounded-xl font-semibold ${
                        isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900 border-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {/* Giới tính Radio */}
                <div>
                  <label className="text-xs font-extrabold mb-2 block">
                    Giới tính <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="gender"
                        value="MALE"
                        checked={doctorForm.gender === 'MALE'}
                        onChange={() => setDoctorForm({ ...doctorForm, gender: 'MALE' })}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      Nam
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="gender"
                        value="FEMALE"
                        checked={doctorForm.gender === 'FEMALE'}
                        onChange={() => setDoctorForm({ ...doctorForm, gender: 'FEMALE' })}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      Nữ
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="gender"
                        value="OTHER"
                        checked={doctorForm.gender === 'OTHER'}
                        onChange={() => setDoctorForm({ ...doctorForm, gender: 'OTHER' })}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      Khác
                    </label>
                  </div>
                </div>

                {/* Trình độ chuyên môn & số năm kinh nghiệm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-extrabold mb-1.5 block">
                      Bằng cấp chuyên môn <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder="Ví dụ: Bác sĩ Chuyên khoa Tim mạch"
                      value={doctorForm.qualification}
                      onChange={(e) => setDoctorForm({ ...doctorForm, qualification: e.target.value })}
                      className={`text-xs rounded-xl font-semibold ${
                        isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900 border-slate-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold mb-1.5 block">
                      Số năm kinh nghiệm <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min={0}
                      required
                      placeholder="Ví dụ: 8"
                      value={doctorForm.yearsOfExperience}
                      onChange={(e) => setDoctorForm({ ...doctorForm, yearsOfExperience: parseInt(e.target.value) || 0 })}
                      className={`text-xs rounded-xl font-semibold ${
                        isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900 border-slate-800'
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* COMMON WORKPLACE PARAMETERS (APPLIES TO BOTH MODES) */}
            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-slate-800">
                <Building2 className="w-4 h-4" /> Phân công nơi công tác tại bệnh viện
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Chuyên khoa */}
                <div>
                  <label className="text-xs font-extrabold mb-1.5 block">
                    Chuyên khoa <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={doctorForm.specialtyId}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialtyId: e.target.value })}
                    className={`w-full text-xs rounded-xl p-2.5 font-bold border transition ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-950' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    <option value="">-- Chọn chuyên khoa --</option>
                    {activeHospitalSpecialties.length === 0 ? (
                      <option disabled value="">
                        (Bệnh viện chưa gán chuyên khoa nào - Vui lòng gán ở tab "Chuyên khoa")
                      </option>
                    ) : (
                      activeHospitalSpecialties.map((spec: any) => (
                        <option key={spec.id} value={spec.id}>
                          {spec.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Cơ sở trực thuộc */}
                <div>
                  <label className="text-xs font-extrabold mb-1.5 block">
                    Cơ sở trực thuộc <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={doctorForm.branchId}
                    onChange={(e) => setDoctorForm({ ...doctorForm, branchId: e.target.value })}
                    className={`w-full text-xs rounded-xl p-2.5 font-bold border transition ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-950' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    <option value="">Trụ sở chính ({hospital.name})</option>
                    {fetchedBranches.map((br: any) => (
                      <option key={br.id} value={br.id}>
                        {br.name || br.address}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Phí khám */}
              <div>
                <label className="text-xs font-extrabold mb-1.5 block">
                  Phí khám (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  step={50000}
                  min={0}
                  required
                  placeholder="300000"
                  value={doctorForm.consultationFee}
                  onChange={(e) => setDoctorForm({ ...doctorForm, consultationFee: parseInt(e.target.value) || 0 })}
                  className={`text-xs rounded-xl font-bold ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900 border-slate-800'
                  }`}
                />
              </div>

              {/* Checkbox Đặt làm nơi công tác chính */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="isPrimaryWorkplace"
                  checked={doctorForm.isPrimary}
                  onChange={(e) => setDoctorForm({ ...doctorForm, isPrimary: e.target.checked })}
                  className="w-4 h-4 text-[#0c4b39] rounded cursor-pointer"
                />
                <label htmlFor="isPrimaryWorkplace" className="text-xs font-extrabold cursor-pointer select-none">
                  Đặt làm nơi công tác chính của bác sĩ
                </label>
              </div>
            </div>

            {/* BUTTONS */}
            <DialogFooter className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDoctorOpen(false)}
                className="text-xs rounded-xl font-extrabold px-5 py-2"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={submittingDoctor || (addDoctorTabMode === 'EXISTING' && (!selectedExistingDoctorId || isAlreadyInHospital))}
                className="bg-[#0c4b39] hover:bg-[#083629] text-white font-extrabold text-xs rounded-xl px-6 py-2 shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {submittingDoctor ? <Loader2 className="w-4 h-4 animate-spin" /> : (addDoctorTabMode === 'EXISTING' ? 'Phân công bác sĩ' : 'Tạo bác sĩ mới')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: THÊM CHUYÊN KHOA CHO BỆNH VIỆN */}
      <Dialog open={isAddSpecialtyOpen} onOpenChange={setIsAddSpecialtyOpen}>
        <DialogContent className={`max-w-2xl rounded-3xl p-6 ${cardBg}`}>
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Chọn Chuyên khoa hoạt động cho Bệnh viện
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Tick chọn các chuyên khoa từ danh mục hệ thống NovaCare để kích hoạt cho bệnh viện này.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm kiếm chuyên khoa hệ thống..."
                value={specialtySearchQuery}
                onChange={(e) => setSpecialtySearchQuery(e.target.value)}
                className={`pl-9 text-xs rounded-xl font-semibold ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800 text-white'
                }`}
              />
            </div>

            {/* Checkbox Grid inside Modal */}
            <div className="max-h-[360px] overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {specialties
                .filter((spec: any) =>
                  spec.name.toLowerCase().includes(specialtySearchQuery.toLowerCase())
                )
                .map((spec: any) => {
                  const isChecked = tempSelectedSpecialtyIds.includes(spec.id);
                  return (
                    <div
                      key={spec.id}
                      onClick={() => handleToggleTempSpecialty(spec.id)}
                      className={`p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer select-none flex items-start justify-between gap-3 ${
                        isChecked
                          ? isLight
                            ? 'bg-purple-50/90 border-purple-400 shadow-2xs'
                            : 'bg-purple-950/40 border-purple-500/80 shadow-2xs'
                          : isLight
                          ? 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            isChecked
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4
                            className={`font-extrabold text-xs truncate ${
                              isChecked
                                ? isLight
                                  ? 'text-purple-950'
                                  : 'text-purple-200'
                                : isLight
                                ? 'text-slate-900'
                                : 'text-slate-300'
                            }`}
                          >
                            {spec.name}
                          </h4>
                          {spec.description && (
                            <p className="text-[10px] text-slate-500 line-clamp-1 font-medium">
                              {spec.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                          isChecked
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                        }`}
                      >
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">
              Đã chọn: <span className="text-purple-600 dark:text-purple-400 font-extrabold">{tempSelectedSpecialtyIds.length}</span> chuyên khoa
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddSpecialtyOpen(false)}
                className="text-xs rounded-xl font-bold"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                onClick={handleSaveSpecialtiesModal}
                disabled={isSavingSpecialties}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-2"
              >
                {isSavingSpecialties ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Lưu chuyên khoa
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================== */}
      {/* MODAL 4: CHI TIẾT & CHỈNH SỬA BÁC SĨ (4 TABS) */}
      {/* ========================================== */}
      <DoctorDetailDialog
        doctorId={selectedDoctorForDetail?.id || null}
        initialDoctor={selectedDoctorForDetail}
        open={isDoctorDetailOpen}
        onOpenChange={setIsDoctorDetailOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['admin-hospital-detail', id] })}
      />

      {/* ========================================== */}
      {/* MODAL 5: THÊM / SỬA GÓI KHÁM (Khóa Hospital) */}
      {/* ========================================== */}
      <Dialog open={isAddPackageOpen} onOpenChange={setIsAddPackageOpen}>
        <DialogContent className={`max-w-md p-6 rounded-3xl ${isLight ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'}`}>
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Package className="w-5 h-5 text-[#0c4b39] dark:text-[#66FF33]" />
              {editingPackage ? 'Chỉnh sửa Gói Khám Sức Khỏe' : 'Thêm Gói Khám Mới cho Bệnh viện'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Gói khám được tự động liên kết trực tiếp với Bệnh viện {hospital.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePackage} className="space-y-3 py-2 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <label className="text-xs font-bold mb-1 block">Bệnh viện cung cấp *</label>
              <Input
                disabled
                value={hospital.name}
                className={`text-xs rounded-xl font-bold ${isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Bệnh viện được khóa tự động do khởi tạo từ Chi tiết Bệnh viện.</p>
            </div>

            <div>
              <label className="text-xs font-bold mb-1 block">Chuyên khoa *</label>
              <select
                required
                value={packageForm.specialtyId}
                onChange={(e) => setPackageForm({ ...packageForm, specialtyId: e.target.value })}
                className={`w-full text-xs p-2.5 rounded-xl border font-semibold ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
              >
                <option value="">-- Chọn Chuyên khoa --</option>
                {activeHospitalSpecialties.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold mb-1 block">Tên Gói khám *</label>
              <Input
                required
                placeholder="Ví dụ: Gói khám sức khỏe tổng quát VIP"
                value={packageForm.name}
                onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                className={`text-xs rounded-xl ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900 border-slate-800'}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold mb-1 block">Giá niêm yết (VNĐ) *</label>
                <Input
                  type="number"
                  required
                  placeholder="1500000"
                  value={packageForm.price}
                  onChange={(e) => setPackageForm({ ...packageForm, price: parseFloat(e.target.value) || 0 })}
                  className={`text-xs rounded-xl font-bold text-emerald-600 ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900 border-slate-800'}`}
                />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">Thời lượng (Phút)</label>
                <Input
                  type="number"
                  placeholder="60"
                  value={packageForm.duration}
                  onChange={(e) => setPackageForm({ ...packageForm, duration: parseInt(e.target.value, 10) || 60 })}
                  className={`text-xs rounded-xl ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900 border-slate-800'}`}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold mb-1 block">Các dịch vụ đi kèm (Mỗi dòng 1 dịch vụ)</label>
              <textarea
                rows={4}
                value={packageForm.servicesText}
                onChange={(e) => setPackageForm({ ...packageForm, servicesText: e.target.value })}
                placeholder="Khám Nội tổng quát&#10;Xét nghiệm máu&#10;Điện tâm đồ"
                className={`w-full text-xs p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
              />
            </div>

            <div>
              <label className="text-xs font-bold mb-1 block">Mô tả / Giới thiệu gói khám</label>
              <textarea
                rows={2}
                value={packageForm.description}
                onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                placeholder="Mô tả tóm tắt nội dung gói khám..."
                className={`w-full text-xs p-2.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddPackageOpen(false)}
                className="text-xs rounded-xl font-bold"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={submittingPackage}
                className="bg-[#0c4b39] hover:bg-[#083629] text-white text-xs font-extrabold rounded-xl px-5"
              >
                {submittingPackage ? <Loader2 className="w-4 h-4 animate-spin" /> : editingPackage ? 'Lưu cập nhật' : 'Tạo Gói khám'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================== */}
      {/* MODAL 6: XEM CHI TIẾT GÓI KHÁM */}
      {/* ========================================== */}
      <Dialog open={isViewPackageOpen} onOpenChange={setIsViewPackageOpen}>
        <DialogContent className={`max-w-lg p-6 rounded-3xl ${isLight ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'}`}>
          {viewingPackage && (() => {
            const parsedServices = Array.isArray(viewingPackage.services)
              ? viewingPackage.services
              : typeof viewingPackage.services === 'string'
              ? JSON.parse(viewingPackage.services)
              : [];

            return (
              <div className="space-y-4">
                <DialogHeader className="border-b pb-3">
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-base font-black flex items-center gap-2">
                      <Package className="w-5 h-5 text-[#0c4b39] dark:text-[#66FF33]" />
                      Chi tiết Gói Khám Sức Khỏe
                    </DialogTitle>
                    <Badge className={viewingPackage.isActive ? 'bg-emerald-600 text-white text-[10px]' : 'bg-rose-600 text-white text-[10px]'}>
                      {viewingPackage.isActive ? 'Đang hoạt động' : 'Tạm ngưng'}
                    </Badge>
                  </div>
                </DialogHeader>

                <div className="space-y-3 text-xs max-h-[65vh] overflow-y-auto pr-1">
                  <div>
                    <span className="text-slate-400 font-medium">Tên gói khám:</span>
                    <h4 className="font-extrabold text-sm text-emerald-700 dark:text-emerald-400 mt-0.5">{viewingPackage.name}</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-[11px] text-slate-400 font-bold">Bệnh viện cung cấp:</span>
                      <p className="font-extrabold text-xs">{hospital.name}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 font-bold">Chuyên khoa:</span>
                      <p className="font-extrabold text-xs text-purple-600 dark:text-purple-400">
                        {viewingPackage.specialty?.name || 'Tổng quát'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 font-bold">Đơn giá niêm yết:</span>
                      <p className="font-extrabold text-sm text-emerald-600">
                        {Number(viewingPackage.price || 0).toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 font-bold">Thời gian thực hiện:</span>
                      <p className="font-extrabold text-xs text-blue-600">{viewingPackage.duration || 60} phút</p>
                    </div>
                  </div>

                  {viewingPackage.description && (
                    <div>
                      <span className="text-slate-400 font-bold block mb-1">Mô tả gói khám:</span>
                      <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                        {viewingPackage.description}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Các dịch vụ / mục khám đi kèm ({parsedServices.length}):</span>
                    <div className="space-y-1 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                      {parsedServices.map((srv: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{srv}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-2 border-t">
                    <div>Ngày tạo: {viewingPackage.createdAt ? new Date(viewingPackage.createdAt).toLocaleString('vi-VN') : '—'}</div>
                    <div>Cập nhật: {viewingPackage.updatedAt ? new Date(viewingPackage.updatedAt).toLocaleString('vi-VN') : '—'}</div>
                  </div>
                </div>

                <DialogFooter className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePackageStatus(viewingPackage)}
                      className="text-xs rounded-xl font-bold"
                    >
                      {viewingPackage.isActive ? 'Tạm ngưng gói' : 'Kích hoạt lại'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsViewPackageOpen(false);
                        handleOpenEditPackage(viewingPackage);
                      }}
                      className="text-xs rounded-xl font-bold text-amber-600 border-amber-200 hover:bg-amber-50"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Chỉnh sửa
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsViewPackageOpen(false)}
                    className="text-xs rounded-xl font-bold"
                  >
                    Đóng
                  </Button>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
      {/* ========================================== */}
      {/* MODAL 7: THÊM / SỬA DỊCH VỤ Y TẾ LẺ */}
      {/* ========================================== */}
      <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
        <DialogContent className={`max-w-md p-6 rounded-3xl ${isLight ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'}`}>
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#0c4b39] dark:text-[#66FF33]" />
              {editingService ? 'Chỉnh sửa Dịch vụ Y tế' : 'Thêm Dịch vụ Y tế mới'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Dịch vụ được tự động liên kết với bệnh viện <strong>{hospital.name}</strong>
            </DialogDescription>
          </DialogHeader>

          {serviceFormError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serviceFormError}</span>
            </div>
          )}

          <form onSubmit={handleSaveHospitalService} className="space-y-3.5 py-1">
            <div>
              <label className="text-xs font-bold mb-1 block">Tên dịch vụ *</label>
              <Input
                required
                placeholder="Ví dụ: Khám Nội tổng quát, Siêu âm ổ bụng..."
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                className={`text-xs rounded-xl ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900 border-slate-800'}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold mb-1 block">Giá dịch vụ (VNĐ) *</label>
                <Input
                  type="number"
                  required
                  min="0"
                  placeholder="150000"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })}
                  className={`text-xs rounded-xl font-black text-emerald-600 ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900 border-slate-800'}`}
                />
              </div>

              <div>
                <label className="text-xs font-bold mb-1 block">Thời lượng (Phút) *</label>
                <Input
                  type="number"
                  required
                  min="1"
                  placeholder="30"
                  value={serviceForm.duration}
                  onChange={(e) => setServiceForm({ ...serviceForm, duration: parseInt(e.target.value, 10) || 30 })}
                  className={`text-xs rounded-xl ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900 border-slate-800'}`}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold mb-1 block">Mô tả dịch vụ</label>
              <textarea
                rows={3}
                placeholder="Mô tả quy trình, lợi ích hoặc yêu cầu của dịch vụ..."
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                className={`w-full text-xs p-2.5 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isActiveHospServiceCheck"
                checked={serviceForm.isActive}
                onChange={(e) => setServiceForm({ ...serviceForm, isActive: e.target.checked })}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
              <label htmlFor="isActiveHospServiceCheck" className="text-xs font-bold cursor-pointer">
                Đang mở cung cấp dịch vụ này
              </label>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddServiceOpen(false)}
                className="text-xs rounded-xl font-bold"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={submittingService}
                className="bg-[#0c4b39] hover:bg-[#083629] text-white text-xs font-extrabold rounded-xl px-5"
              >
                {submittingService ? <Loader2 className="w-4 h-4 animate-spin" /> : editingService ? 'Cập nhật dịch vụ' : 'Tạo Dịch vụ'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
