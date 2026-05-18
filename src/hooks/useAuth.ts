import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../lib/stores/auth.store";
import { toast } from "sonner";

export function useAuth() {
  const {
    user,
    profile,
    isLoading,
    error,
    setUser,
    setProfile,
    setLoading,
    setError,
    clearAuth,
  } = useAuthStore();

  useEffect(() => {
    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        } else {
          clearAuth();
        }
      }
    );

    // Initial session load
    async function initSession() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadUserProfile(session.user.id);
      } else {
        clearAuth();
      }
      setLoading(false);
    }

    initSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadUserProfile(userId: string) {
    let { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profErr || !prof) {
      // Trigger fallback auto-creation check / wait
      await new Promise((r) => setTimeout(r, 1000));
      const retry = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (!retry.error && retry.data) {
        prof = retry.data;
      } else {
        prof = {
          username: user?.email?.split("@")[0] || "streamer",
          display_name: user?.email?.split("@")[0] || "Streamer",
          avatar_url: null,
          bio: "",
          plan: "free",
        };
      }
    }
    setProfile(prof);
  }

  async function login(email: string, pass: string) {
    setError(null);
    setLoading(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (signInErr) throw signInErr;
    } catch (e: any) {
      const msg = e.message || "Erro ao fazer login.";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function signup(email: string, pass: string, name: string) {
    setError(null);
    setLoading(true);
    try {
      const { error: signUpErr } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            username: name.trim().toLowerCase().replace(/\s+/g, "_"),
            full_name: name,
          },
        },
      });
      if (signUpErr) throw signUpErr;
    } catch (e: any) {
      const msg = e.message || "Erro ao criar conta.";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      clearAuth();
      toast.success("Desconectado com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao desconectar.");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(displayName: string, bio: string, plan: string) {
    if (!user) return;
    setLoading(true);
    try {
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          bio: bio,
          plan: plan,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateErr) throw updateErr;

      setProfile({
        ...profile,
        display_name: displayName,
        bio,
        plan,
      });
      toast.success("Perfil e configurações salvos com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao salvar perfil: " + e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return {
    user,
    profile,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    saveProfile,
    loadUserProfile,
  };
}
