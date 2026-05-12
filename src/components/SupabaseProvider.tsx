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
      if (!active) return;
      setSession(data.session);

      try {
        if (data.session?.user) {
          const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('id', data.session.user.id)
            .single();

          if (profileError) {
            console.warn("Profile lookup failed", profileError);
          }

          if (!profile) {
            console.debug("Creating missing profile for user", data.session.user.id);
            const { error: insertError } = await (supabaseClient as any)
              .from('profiles')
              .insert({
                id: data.session.user.id,
                email: data.session.user.email!,
                username:
                  data.session.user.user_metadata?.full_name ||
                  data.session.user.user_metadata?.username ||
                  data.session.user.email!.split('@')[0],
              });

            if (insertError) {
              console.error("Failed to create user profile", insertError);
            }
          }
        }
      } catch (error) {
        console.error("Error initializing session profile", error);
      }
    }).catch((error) => {
      console.error("Failed to get Supabase session", error);
      setSession(null);
    });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user && _event === 'SIGNED_IN') {
        try {
          const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.warn("Profile lookup failed on sign-in", profileError);
          }

          if (!profile) {
            console.debug("Creating profile after sign-in", session.user.id);
            const { error: insertError } = await (supabaseClient as any)
              .from('profiles')
              .insert({
                id: session.user.id,
                email: session.user.email!,
                username:
                  session.user.user_metadata?.full_name ||
                  session.user.user_metadata?.username ||
                  session.user.email!.split('@')[0],
              });

            if (insertError) {
              console.error("Failed to create profile after sign-in", insertError);
            }
          }
        } catch (error) {
          console.error("Auth state change profile initialization failed", error);
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
