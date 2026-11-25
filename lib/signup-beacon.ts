// Set by auth.ts when a Google sign-in creates a new account, read once by
// components/SignupBeacon.tsx. Holds only the method ('google'), nothing about
// the person, and lasts ten minutes.
export const NEW_SIGNUP_COOKIE = 'et_new_signup';
