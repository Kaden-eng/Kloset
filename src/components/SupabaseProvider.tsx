"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabaseClient";
import type { Database } from "@/types/supabase";

type SupabaseContextValue = {
  supabase: SupabaseClient<Database>;
  session: Session | null | undefined;
};

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supabaseClient] = useState(() => createBrowserClient());
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let active = true;

    supabaseClient.auth.getSession().then(async ({ data }) => {
      if (active) {
        setSession(data.session);

        // If we have a user but no profile, create one
        if (data.session?.user) {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('id', data.session.user.id)
            .single();

          if (!profile) {
            // Create profile if it doesn't exist
            await (supabaseClient as any)
              .from('profiles')
              .insert({
                id: data.session.user.id,
                email: data.session.user.email!,
                username: data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.username || data.session.user.email!.split('@')[0],
              });
          }
        }
      }
    });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      // If user just signed in and we don't have a profile, create one
      if (session?.user && _event === 'SIGNED_IN') {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();

        if (!profile) {
          await (supabaseClient as any)
            .from('profiles')
            .insert({
              id: session.user.id,
              email: session.user.email!,
              username: session.user.user_metadata?.full_name || session.user.user_metadata?.username || session.user.email!.split('@')[0],
            });
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabaseClient]);

  return (
    <SupabaseContext.Provider value={{ supabase: supabaseClient, session }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error("useSupabase must be used within SupabaseProvider");
  }
  return context;
}
