"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabaseClient";
import type { Database } from "@/types/supabase";

type SupabaseContextValue = {
  supabase: SupabaseClient<Database>;
  session: Session | null | undefined;
};

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

/**
 * Helper function to create or update user profile
 * Uses select-then-insert/update to handle RLS policies properly
 */
async function ensureProfileExists(
  supabase: SupabaseClient<Database>,
  userId: string,
  email: string | undefined,
  metadata: any
) {
  console.log("[SupabaseProvider] ensureProfileExists called with:", {
    userId,
    email,
    metadata,
    hasSupabase: !!supabase,
  });

  if (!userId || !email) {
    console.warn("[SupabaseProvider] Cannot create profile: missing userId or email", { userId, email });
    return false;
  }

  try {
    // Log the current auth state
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
    console.log("[SupabaseProvider] Current auth state:", {
      currentUser: currentUser ? { id: currentUser.id, email: currentUser.email } : null,
      authError: authError ? { message: authError.message, status: authError.status } : null,
    });

    // Generate a full_name from metadata or email
    let full_name = metadata?.full_name || metadata?.username || email.split('@')[0];

    console.log("[SupabaseProvider] Generated full_name:", full_name);

    console.debug("[SupabaseProvider] Ensuring profile exists for user", userId, { full_name });

    // Try upsert approach first - this should work with RLS if the user is authenticated
    console.log("[SupabaseProvider] Attempting upsert for user", userId);
    const upsertPayload = {
      id: userId,
      email: email,
      full_name: full_name,
    };
    console.log("[SupabaseProvider] Upsert payload:", upsertPayload);

    const { error: upsertError } = await (supabase as any)
      .from('profiles')
      .upsert(upsertPayload, { onConflict: 'id' });

    if (upsertError) {
      console.error("[SupabaseProvider] Upsert failed, trying select-then-insert/update - COMPLETE ERROR DETAILS:", {
        userId,
        upsertPayload,
        error: upsertError.message,
        code: upsertError.code,
        details: upsertError.details,
        hint: upsertError.hint,
        status: upsertError.status,
        fullError: upsertError,
      });

      // Fallback to select-then-insert/update approach
      // First, try to select the existing profile
      const { data: existingProfile, error: selectError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        // PGRST116 is "not found", which is expected for new profiles
        console.error("[SupabaseProvider] Error checking existing profile - COMPLETE ERROR DETAILS:", {
          userId,
          error: selectError.message,
          code: selectError.code,
          details: selectError.details,
          hint: selectError.hint,
          fullError: selectError,
        });
        return false;
      }

      if (existingProfile) {
        // Profile exists, update it with latest info
        console.debug("[SupabaseProvider] Profile exists, updating", userId);
        const updatePayload = {
          email: email,
          full_name: full_name,
        };
        console.log("[SupabaseProvider] Update payload:", updatePayload);

        const { error: updateError } = await (supabase as any)
          .from('profiles')
          .update(updatePayload)
          .eq('id', userId);

        if (updateError) {
          console.error("[SupabaseProvider] Failed to update existing profile - COMPLETE ERROR DETAILS:", {
            userId,
            updatePayload,
            error: updateError.message,
            code: updateError.code,
            details: updateError.details,
            hint: updateError.hint,
            status: updateError.status,
            fullError: updateError,
          });
          return false;
        }
      } else {
        // Profile doesn't exist, insert it
        console.debug("[SupabaseProvider] Profile doesn't exist, creating", userId);
        const insertPayload = {
          id: userId,
          email: email,
          full_name: full_name,
        };
        console.log("[SupabaseProvider] Insert payload:", insertPayload);

        const { error: insertError } = await (supabase as any)
          .from('profiles')
          .insert(insertPayload);

        if (insertError) {
          console.error("[SupabaseProvider] Failed to create new profile - COMPLETE ERROR DETAILS:", {
            userId,
            insertPayload,
            error: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
            status: insertError.status,
            fullError: insertError,
          });
          return false;
        }
      }
    } else {
      console.debug("[SupabaseProvider] Upsert succeeded for user", userId);
    }

    console.debug("[SupabaseProvider] Profile ensured successfully for user", userId);
    return true;
  } catch (error) {
    // Catch any unexpected errors but don't crash the app
    console.error("[SupabaseProvider] Unexpected error ensuring profile exists - COMPLETE ERROR DETAILS:", {
      userId,
      error: error instanceof Error ? error.message : String(error),
      fullError: error,
    });
    return false;
  }
}

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supabaseClient] = useState(() => createBrowserClient());
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  
  // Track which users we've already attempted profile creation for
  // This prevents repeated attempts in useEffect loops
  const profileCreationAttempted = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;

    // Get initial session and ensure profile exists
    supabaseClient.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (!active) return;

      if (sessionError) {
        console.error("[SupabaseProvider] Failed to get initial session", sessionError);
        setSession(null);
        return;
      }

      setSession(data.session);

      // Ensure profile exists if user is authenticated
      if (data.session?.user) {
        const userId = data.session.user.id;
        
        // Skip if we've already attempted this user's profile creation
        if (!profileCreationAttempted.current.has(userId)) {
          profileCreationAttempted.current.add(userId);
          await ensureProfileExists(
            supabaseClient,
            userId,
            data.session.user.email,
            data.session.user.user_metadata
          );
        }
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (_event, newSession) => {
      if (!active) return;

      setSession(newSession);

      // Ensure profile exists when user signs in
      if (newSession?.user && (_event === 'SIGNED_IN' || _event === 'USER_UPDATED')) {
        const userId = newSession.user.id;
        
        // Skip if we've already attempted this user's profile creation
        if (!profileCreationAttempted.current.has(userId)) {
          profileCreationAttempted.current.add(userId);
          await ensureProfileExists(
            supabaseClient,
            userId,
            newSession.user.email,
            newSession.user.user_metadata
          );
        }
      }

      // Clear profile creation tracking when user signs out
      if (_event === 'SIGNED_OUT' && newSession === null) {
        profileCreationAttempted.current.clear();
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
