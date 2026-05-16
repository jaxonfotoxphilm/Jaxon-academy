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
      <div className="max-w-3xl text-center mb-12 mt-12">
        <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">The Ultimate Homeschool Engine</h1>
        <p className="text-xl text-slate-400">
          You are paying for the <strong>Jaxon Academy Platform</strong>—our AI tutor, automated tracking, and daily scheduling. 
          The built-in CoreKnowledge curriculum is entirely free and open-source.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full">
        {/* Main Platform Plan */}
        <div className="bg-[hsl(228,40%,6%)] border border-blue-500/50 rounded-3xl p-8 relative overflow-hidden shadow-[0_0_50px_rgba(37,99,235,0.15)] flex flex-col">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-blue-500/10 blur-[50px] pointer-events-none" />
          
          <h2 className="text-2xl font-bold text-blue-400 mb-2">Platform Access</h2>
          <div className="text-5xl font-black mb-2">$19<span className="text-xl text-slate-500 font-normal">/mo</span></div>
          <p className="text-sm text-slate-400 mb-6 border-b border-slate-800 pb-6">For the whole family. No per-student hidden fees.</p>
          
          <ul className="text-left space-y-4 mb-8 text-slate-300 flex-grow">
            <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">✓</span> 
                <div><strong>Unlimited Students:</strong> Create as many profiles as you need.</div>
            </li>
            <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">✓</span> 
                <div><strong>CoreKnowledge Included:</strong> Pre-K to 8th grade open-source framework mapped automatically.</div>
            </li>
            <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">✓</span> 
                <div><strong>Professor Grace AI:</strong> Interactive grading, writing labs, and anti-skip comprehension checks.</div>
            </li>
            <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">✓</span> 
                <div><strong>Admin Dashboard:</strong> Automated report cards and progress tracking.</div>
            </li>
          </ul>

          <button 
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50"
          >
            {loading ? 'Preparing Checkout...' : 'Start Homeschooling'}
          </button>
        </div>

        {/* Custom Curriculum Option */}
        <div className="bg-[hsl(228,30%,4%)] border border-slate-800 rounded-3xl p-8 relative flex flex-col">
          <h2 className="text-2xl font-bold text-slate-300 mb-2">Custom Curriculum</h2>
          <div className="text-4xl font-black mb-2 mt-2 text-white">Custom Pricing</div>
          <p className="text-sm text-slate-500 mb-6 border-b border-slate-800 pb-6">Don't want to use CoreKnowledge? We've got you covered.</p>
          
          <ul className="text-left space-y-4 mb-8 text-slate-400 flex-grow">
            <li className="flex items-start gap-3">
                <span className="text-slate-600 mt-1">✦</span> 
                <div><strong>Use Your Own Materials:</strong> Abeka, BJU, or your local charter school's requirements.</div>
            </li>
            <li className="flex items-start gap-3">
                <span className="text-slate-600 mt-1">✦</span> 
                <div><strong>AI Ingestion:</strong> We will securely import and map your PDFs and textbooks into our engine.</div>
            </li>
            <li className="flex items-start gap-3">
                <span className="text-slate-600 mt-1">✦</span> 
                <div><strong>Dedicated Support:</strong> Priority onboarding to ensure your custom curriculum flows perfectly into the daily schedule.</div>
            </li>
          </ul>

          <a 
            href="mailto:support@jaxonacademy.com?subject=Custom Curriculum Inquiry"
            className="w-full block text-center py-4 bg-transparent border-2 border-slate-700 hover:border-slate-500 text-white font-bold rounded-xl transition-all"
          >
            Contact Sales
          </a>
        </div>
      </div>

      <button onClick={signOut} className="mt-8 mb-8 text-sm text-slate-500 hover:text-white transition-colors">
          Sign out of account
      </button>
    </div>
  );
};
