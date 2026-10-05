import { useEffect, useState } from 'react';

export const BUILD_YEAR = Number(import.meta.env.VITE_BUILD_YEAR);

// Starts from the build year so hydration matches the prerendered HTML, then follows the
// visitor's clock, so "until now" ranges stay current without a redeploy.
export function useCurrentYear(): number {
  const [year, setYear] = useState(BUILD_YEAR);
  useEffect(() => setYear(new Date().getFullYear()), []);
  return year;
}
