"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabaseClient";
import type { Database } from "@/types/supabase";

type SupabaseContextValue = {
  supabase: SupabaseClient<Database>;
  session: Session | null | undefined;
  user: User | null | undefined;
};

type ProfileMetadata = {
  full_name?: string;
  name?: string;
};

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

async function ensureProfileExists(supabase: SupabaseClient<Database>, user: User) {
  if (!user.email) return;

  const metadata = user.user_metadata as ProfileMetadata;
  const fullName = metadata.full_name || metadata.name || user.email.split("@")[0];
  const profile: Database["public"]["Tables"]["profiles"]["Insert"] = {
    id: user.id,
    email: user.email,
    full_name: fullName,
  };

  await supabase
    .from("profiles")
    // @ts-expect-error The generated Supabase overload resolves profiles upsert to never[] locally.
    .upsert([profile], { onConflict: "id" });
}

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const ensuredProfiles = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;

    const syncProfile = async (nextSession: Session | null) => {
      const user = nextSession?.user;
      if (!user || ensuredProfiles.current.has(user.id)) return;

      ensuredProfiles.current.add(user.id);
      await ensureProfileExists(supabase, user).catch(() => {
        ensuredProfiles.current.delete(user.id);
      });
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      void syncProfile(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;

      setSession(nextSession);

      if (event === "SIGNED_OUT") {
        ensuredProfiles.current.clear();
        return;
      }

      void syncProfile(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo(
    () => ({
      supabase,
      session,
      user: session?.user ?? null,
    }),
    [session, supabase]
  );

  return (
    <SupabaseContext.Provider value={value}>
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
