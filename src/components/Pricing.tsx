import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export const Pricing: React.FC = () => {
  const { session, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!session) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        headers: {
            Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error starting checkout:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(228,80%,3%)] text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Unlock Your Child's Future</h1>
        <p className="text-xl text-slate-400">Join Jaxon Academy today to get full access to our premium curriculum, progress tracking, and interactive lessons.</p>
      </div>

      <div className="bg-[hsl(228,40%,6%)] border border-blue-500/30 rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden shadow-[0_0_50px_rgba(37,99,235,0.15)]">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-blue-500/10 blur-[50px] pointer-events-none" />
        
        <h2 className="text-2xl font-bold text-blue-400 mb-2">Premium Family Plan</h2>
        <div className="text-5xl font-black mb-6">$19<span className="text-xl text-slate-500 font-normal">/mo</span></div>
        
        <ul className="text-left space-y-4 mb-8 text-slate-300">
          <li className="flex items-center gap-3">✅ <span>Unlimited Student Profiles</span></li>
          <li className="flex items-center gap-3">✅ <span>Full Pre-K to 8th Grade Curriculum</span></li>
          <li className="flex items-center gap-3">✅ <span>Automated Report Cards</span></li>
          <li className="flex items-center gap-3">✅ <span>Professor Grace AI Tutor</span></li>
        </ul>

        <button 
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50"
        >
          {loading ? 'Preparing Checkout...' : 'Subscribe Now'}
        </button>
        
        <button onClick={signOut} className="mt-4 text-sm text-slate-500 hover:text-white transition-colors">
            Sign out
        </button>
      </div>
    </div>
  );
};
