import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthContext';

interface BrandConfig {
  appName: string;
  logoUrl: string | null;
  colorPrimary: string;
}

const DEFAULT_BRAND: BrandConfig = {
  appName: 'Jaxon Academy',
  logoUrl: null,
  colorPrimary: 'hsl(224, 76%, 58%)',
};

interface BrandContextType {
  brand: BrandConfig;
  isLoadingBrand: boolean;
  setBrand: (brand: BrandConfig) => void;
}

const BrandContext = createContext<BrandContextType>({
  brand: DEFAULT_BRAND,
  isLoadingBrand: true,
  setBrand: () => {},
});

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brand, setBrand] = useState<BrandConfig>(DEFAULT_BRAND);
  const [isLoadingBrand, setIsLoadingBrand] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const hostname = window.location.hostname;
        
        // 1. Try to load branding by custom domain (for true white-labeling)
        // Skip for localhost or the default vercel domain
        if (hostname !== 'localhost' && !hostname.includes('vercel.app')) {
          const { data } = await supabase
            .from('accounts')
            .select('app_name, logo_url, brand_color_primary')
            .eq('custom_domain', hostname)
            .maybeSingle();

          if (data) {
            setBrand({
              appName: data.app_name || DEFAULT_BRAND.appName,
              logoUrl: data.logo_url || null,
              colorPrimary: data.brand_color_primary || DEFAULT_BRAND.colorPrimary,
            });
            return; // Found domain branding, exit
          }
        }

        // 2. If logged in, load branding specific to this user's account
        if (session?.user) {
          const { data } = await supabase
            .from('accounts')
            .select('app_name, logo_url, brand_color_primary')
            .eq('id', session.user.id)
            .maybeSingle();

          if (data) {
             setBrand({
              appName: data.app_name || DEFAULT_BRAND.appName,
              logoUrl: data.logo_url || null,
              colorPrimary: data.brand_color_primary || DEFAULT_BRAND.colorPrimary,
            });
            return;
          }
        }

        // Fallback to default
        setBrand(DEFAULT_BRAND);
      } catch (err) {
        console.error('Error fetching brand:', err);
      } finally {
        setIsLoadingBrand(false);
      }
    };

    fetchBrand();
  }, [session?.user?.id]); // Re-run if user logs in/out

  useEffect(() => {
    if (brand.appName) {
      document.title = brand.appName;
    }
  }, [brand.appName]);

  return (
    <BrandContext.Provider value={{ brand, isLoadingBrand, setBrand }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => useContext(BrandContext);
