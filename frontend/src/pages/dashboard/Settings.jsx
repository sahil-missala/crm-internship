import React, { useState } from 'react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Settings as SettingsIcon, Landmark, BellRing, Shield, CheckCircle } from 'lucide-react';

export default function Settings() {
  const [success, setSuccess] = useState(false);
  const [agencyName, setAgencyName] = useState('Manivtha Tours & Travels');
  const [agencyPhone, setAgencyPhone] = useState('+91 98450 98450');
  const [terms, setTerms] = useState(
    'Payment for rentals is due prior to departure or as partial installments. Returns and cancellations are subject to local tariff rules.'
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto animate-in fade-in duration-200">
      
      {success && (
        <div className="p-3 bg-emerald-50 text-success text-xs font-semibold rounded border border-emerald-200 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>CRM configurations updated successfully.</span>
        </div>
      )}

      {/* Grid Settings */}
      <div className="bg-white border border-borderGray rounded-card shadow-subtle p-6 flex flex-col gap-6">
        <div className="flex items-center gap-2 border-b border-borderGray pb-3 text-primary">
          <SettingsIcon className="h-5 w-5" />
          <h3 className="text-xs font-bold uppercase tracking-wider">
            CRM Profile Configurations
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-xs font-sans text-left">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Agency Brand Name"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              required
            />
            <Input
              label="Agency Contact Hotline"
              value={agencyPhone}
              required
            />
          </div>

          <Input
            label="Default Invoice Billing Terms"
            type="textarea"
            rows={3}
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            required
          />

          <div className="border-t border-borderGray pt-4 flex justify-between items-center gap-3">
            <span className="text-[10px] text-textMuted font-medium">Last updated: June 2026</span>
            <Button type="submit" variant="primary" size="sm">
              Save Configurations
            </Button>
          </div>

        </form>
      </div>

      {/* Secondary Mock Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Notification settings */}
        <div className="bg-white border border-borderGray rounded-card shadow-subtle p-5 flex flex-col gap-3">
          <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 border-b border-borderGray pb-2">
            <BellRing className="h-4.5 w-4.5 text-accent" />
            Alert Systems
          </h4>
          <div className="flex flex-col gap-3 font-sans text-xs">
            <label className="flex items-center gap-2 font-medium text-textMain cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-borderGray text-primary focus:ring-primary h-4 w-4" />
              Telegram dispatch on new enquiries
            </label>
            <label className="flex items-center gap-2 font-medium text-textMain cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-borderGray text-primary focus:ring-primary h-4 w-4" />
              Telegram dispatch on confirmed bookings
            </label>
            <label className="flex items-center gap-2 font-medium text-textMain cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-borderGray text-primary focus:ring-primary h-4 w-4" />
              Console logs checkup on scheduler triggers
            </label>
          </div>
        </div>

        {/* Access controls */}
        <div className="bg-white border border-borderGray rounded-card shadow-subtle p-5 flex flex-col gap-3">
          <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 border-b border-borderGray pb-2">
            <Shield className="h-4.5 w-4.5 text-accent" />
            Security & Roles
          </h4>
          <p className="text-xs text-textMuted leading-relaxed">
            Only system administrators can allocate accounts, update user permissions, or drop transaction history records.
          </p>
          <span className="text-[10px] text-primary font-bold uppercase tracking-wider block mt-1">Role: {localStorage.getItem('manivtha_user') ? JSON.parse(localStorage.getItem('manivtha_user')).role : 'TBA'}</span>
        </div>
      </div>

    </div>
  );
}
