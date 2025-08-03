
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as AuthUser } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

export type UserProfile = Database["public"]["Tables"]["users"]["Row"];

export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setAuthState({
          user: session.user,
          profile: profile || null,
          loading: false,
        });
      } else {
        setAuthState({
          user: null,
          profile: null,
          loading: false,
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          setAuthState({
            user: session.user,
            profile: profile || null,
            loading: false,
          });
        } else {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData: { 
    first_name: string; 
    last_name: string; 
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!authState.user) return { error: new Error("No user logged in") };

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", authState.user.id)
      .select()
      .single();

    if (!error && data) {
      setAuthState(prev => ({
        ...prev,
        profile: data,
      }));
    }

    return { data, error };
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };
};
