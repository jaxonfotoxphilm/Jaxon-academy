export const validatePrincipalPin = (inputPin: string): boolean => {
  const envPin = import.meta.env.VITE_PRINCIPAL_PIN as string | undefined;
  if (!envPin) {
    console.warn('Principal PIN not configured in environment');
    return false;
  }
  return inputPin === envPin;
};

// Placeholder for future email/password auth
export const loginWithEmail = async (_email: string, _password: string) => {
  // TODO: integrate Supabase auth or other backend
  console.warn('Email login not implemented');
  return false;
};
