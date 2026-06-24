import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useUserRecord, useUpdateUserRecord } from '../hooks/useUser';

const Settings: React.FC = () => {
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
    // Only update if the value changed and is valid
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
      <div className="p-6 md:p-10 flex justify-center items-center">
        <Loader2 className="animate-spin text-brand-orange" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-10 text-red-400">
        Failed to load settings.
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 pb-24 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="bg-brand-dark rounded-2xl border border-gray-800 p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-brand-orange">Salary Cycle Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Pay Frequency</label>
              <select 
                value={payFrequency}
                onChange={handleFrequencyChange}
                disabled={updateUser.isPending}
                className="w-full bg-transparent text-white font-medium outline-none"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Base Salary / Cycle</label>
              <div className="flex items-center">
                <span className="text-gray-400 mr-2">₹</span>
                <input 
                  type="text" 
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  onBlur={handleSalarySave}
                  disabled={updateUser.isPending}
                  className="w-full bg-transparent text-white font-medium outline-none focus:text-brand-orange transition-colors" 
                />
              </div>
              {updateUser.isPending && <span className="text-xs text-brand-orange mt-2 block">Saving...</span>}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-800">
          <h3 className="text-lg font-semibold mb-4 text-brand-orange">Account</h3>
          <div className="flex items-center justify-between bg-gray-800/50 p-4 rounded-xl border border-gray-700">
            <div>
              <p className="font-medium text-white">{userRecord?.first_name || 'SmartSpend User'}</p>
              <p className="text-sm text-gray-400">{userRecord?.email}</p>
            </div>
            <button 
              onClick={handleSignOut}
              className="text-red-400 text-sm font-medium hover:text-red-300"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
