'use client';

import { SessionProvider } from 'next-auth/react';
import { SWRConfig } from 'swr';

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig 
      value={{
        revalidateOnFocus: false,
        dedupingInterval: 10000,
        revalidateIfStale: false,
      }}
    >
      <SessionProvider>{children}</SessionProvider>
    </SWRConfig>
  );
}
