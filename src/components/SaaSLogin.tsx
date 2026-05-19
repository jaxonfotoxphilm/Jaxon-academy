import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../utils/supabaseClient';
import { motion } from 'framer-motion';
import { useBrand } from '../contexts/BrandContext';

export const SaaSLogin: React.FC = () => {
  const { brand } = useBrand();

  return (
    <div className="min-h-screen w-full bg-transparent flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] pointer-events-none opacity-20" 
        style={{ backgroundColor: brand.colorPrimary }}
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[hsl(228,40%,6%)] border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8 flex flex-col items-center">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.appName} className="h-16 object-contain mb-4" />
          ) : (
            <div className="text-5xl mb-4 inline-block">🏛️</div>
          )}
          <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {brand.appName}
          </h1>
          <p className="text-slate-400 mt-2">Sign in or create an account to manage your school.</p>
        </div>

        <div className="auth-container">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: brand.colorPrimary,
                    brandAccent: brand.colorPrimary,
                    defaultButtonBackground: 'hsl(228, 40%, 10%)',
                    defaultButtonBackgroundHover: 'hsl(228, 40%, 15%)',
                    inputBackground: 'hsl(228, 40%, 4%)',
                    inputBorder: 'hsl(228, 40%, 15%)',
                    inputBorderHover: 'hsl(228, 40%, 25%)',
                    inputBorderFocus: brand.colorPrimary,
                    inputText: 'white',
                  },
                  radii: {
                    borderRadiusButton: '0.75rem',
                    buttonBorderRadius: '0.75rem',
                    inputBorderRadius: '0.75rem',
                  }
                },
              },
              className: {
                button: 'font-bold transition-all',
                input: 'transition-all',
              }
            }}
            theme="dark"
            providers={['google']} // Optional: add Google OAuth if configured
            redirectTo={window.location.origin}
          />
        </div>
      </motion.div>

      {/* Global styles for Auth UI overrides */}
      <style>{`
        .auth-container * {
            font-family: 'Inter', system-ui, sans-serif !important;
        }
        .auth-container button {
            cursor: pointer;
        }
      `}</style>
    </div>
  );
};
