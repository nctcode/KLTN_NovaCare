'use client';

import Link from 'next/link';
import { Calendar, CalendarCheck } from 'lucide-react';
import { AppointmentTab } from '@/components/admin/schedules/AppointmentTab';
import { Button } from '@/components/ui/button';

export default function AdminAppointmentsPage() {
    return (
        <div className="space-y-6">
            <AppointmentTab />
        </div>
    );
}
