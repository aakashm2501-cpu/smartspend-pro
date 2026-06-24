import React, { useState, useEffect } from 'react';
import { Loader2, LogOut, ChevronRight, ShieldCheck, Wallet, RefreshCw, History } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useUserRecord, useUpdateUserRecord } from '../hooks/useUser';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { data: userRecord, isLoading, error } = useUserRecord();
  const updateUser = useUpdateUserRecord();
  
  const [baseSalary, setBaseSalary] = useState('');
  const [payFrequency, setPayFrequency] = useState('monthly');

  useEffect(() => {
    if (userRecord) {
      setBaseSalary(userRecord.base_salary.toString());
      setPayFrequency(userRecord.pay_frequency);
    }
  }, [userRecord]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSalarySave = () => {
    if (baseSalary === userRecord?.base_salary?.toString()) return;
    const num = parseFloat(baseSalary.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num >= 0) {
      updateUser.mutate({ base_salary: num });
    }
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const freq = e.target.value as 'weekly' | 'biweekly' | 'monthly';
    setPayFrequency(freq);
    updateUser.mutate({ pay_frequency: freq });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center pt-20 bg-[#000000]">
        <Loader2 className="animate-spin text-emerald-400" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-10 text-rose-500 bg-[#000000] min-h-screen">
        Failed to load settings.
      </div>
    );
  }

  const displayName = userRecord?.first_name || 'SmartSpend User';
  const displayEmail = userRecord?.email || '';
  const initials = displayName.substring(0, 2).toUpperCase();

  // Using success state for avatar border glow (health metric)
  const healthGlow = "shadow-[0_0_30px_rgba(52,211,153,0.3)] border-emerald-500/50";

  return (
    <div className="p-6 pt-16 pb-32 max-w-3xl mx-auto bg-[#000000] min-h-screen text-white font-sans">
      
      {/* Hero Avatar Section */}
      <div className="flex flex-col items-center justify-center mb-16">
        <div className={`w-32 h-32 rounded-full bg-[#18181B] border-2 flex items-center justify-center mb-6 relative ${healthGlow}`}>
          <span className="text-4xl font-outfit font-black tracking-tighter text-white">{initials}</span>
          <div className="absolute -bottom-2 -right-2 bg-[#09090B] p-1.5 rounded-full border border-[#18181B]">
            <ShieldCheck size={20} className="text-emerald-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
        <p className="text-gray-500 font-medium mt-1">{displayEmail}</p>
      </div>

      {/* Settings Groups */}
      <div className="space-y-10">
        
        {/* Cycle Preferences Group */}
        <section>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4 pl-4">Cycle Configuration</p>
          <div className="bg-[#09090B] rounded-3xl overflow-hidden border border-white/5">
            
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#18181B] rounded-2xl text-blue-400"><RefreshCw size={24} /></div>
                <div>
                  <p className="font-semibold text-lg text-white">Pay Frequency</p>
                  <p className="text-sm text-gray-500">How often you receive income</p>
                </div>
              </div>
              <select 
                value={payFrequency}
                onChange={handleFrequencyChange}
                disabled={updateUser.isPending}
                className="bg-transparent text-white font-bold text-lg text-right outline-none appearance-none pr-4 cursor-pointer"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#18181B] rounded-2xl text-emerald-400"><Wallet size={24} /></div>
                <div>
                  <p className="font-semibold text-lg text-white">Base Salary</p>
                  <p className="text-sm text-gray-500">Your regular expected income</p>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <span className="text-white/40 font-light text-xl mr-1">₹</span>
                <input 
                  type="text" 
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  onBlur={handleSalarySave}
                  disabled={updateUser.isPending}
                  className="bg-transparent text-white font-outfit font-bold text-2xl w-32 text-right outline-none focus:text-emerald-400 transition-colors" 
                />
              </div>
            </div>

          </div>
        </section>

        {/* Account Group */}
        <section>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4 pl-4">Account</p>
          <div className="bg-[#09090B] rounded-3xl overflow-hidden border border-white/5">
            <button 
              onClick={() => navigate('/cycles')}
              className="w-full flex items-center justify-between p-6 hover:bg-[#18181B] transition-colors active:bg-[#27272A] border-b border-white/5"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400"><History size={24} /></div>
                <p className="font-semibold text-lg text-white">Manage Cycles</p>
              </div>
              <ChevronRight size={20} className="text-gray-600" />
            </button>

            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-between p-6 hover:bg-[#18181B] transition-colors active:bg-[#27272A]"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500"><LogOut size={24} /></div>
                <p className="font-semibold text-lg text-rose-500">Disconnect Account</p>
              </div>
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Settings;
