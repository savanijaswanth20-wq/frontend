/**
 * JobNex Authentication & User State (Plain JavaScript)
 * Manages demo login state, current role, and Supabase CDN integration.
 */

const DEFAULT_USER = {
  id: "u-1",
  name: "Sandeep Kumar",
  email: "sandeep@jobnex.ai",
  phone: "+91 98765 43210",
  role: "JOB_SEEKER",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80",
  headline: "Full-Stack Engineer | React, Next.js, Node.js & Cloud",
  currentCompany: "Infosys Ltd."
};

const Auth = {
  getUser() {
    try {
      const stored = localStorage.getItem("jobnex_user");
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return DEFAULT_USER;
  },

  setUser(user) {
    try {
      localStorage.setItem("jobnex_user", JSON.stringify(user));
      localStorage.setItem("jobnex_is_logged_in", "true");
    } catch (e) {}
  },

  isLoggedIn() {
    try {
      return localStorage.getItem("jobnex_is_logged_in") !== "false";
    } catch (e) {
      return true;
    }
  },

  login(email, role = "JOB_SEEKER") {
    const user = {
      ...DEFAULT_USER,
      email: email || "sandeep@jobnex.ai",
      name: role === "RECRUITER" ? "Sarah Jenkins" : (email.split("@")[0] || "Sandeep Kumar"),
      role: role
    };
    this.setUser(user);
    if (typeof updateNavbarUser === "function") {
      updateNavbarUser();
    }
  },

  logout() {
    try {
      localStorage.setItem("jobnex_is_logged_in", "false");
    } catch (e) {}
    if (typeof updateNavbarUser === "function") {
      updateNavbarUser();
    }
    showToast("Signed out successfully.");
  },

  // Initialize optional Supabase CDN client
  getSupabase() {
    if (window.supabaseClient) return window.supabaseClient;
    if (typeof supabase !== "undefined" && supabase.createClient) {
      const url = "https://mock.supabase.co";
      const key = "sb_publishable_mock_local_client_key";
      window.supabaseClient = supabase.createClient(url, key);
      return window.supabaseClient;
    }
    return null;
  }
};

window.JobNexAuth = Auth;
