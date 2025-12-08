import {
  setCurrentUser,
  setDisplayName,
  setCurrentRole,
  getCurrentUser,
  getDisplayName,
  getCurrentRole,
} from "./state.js";

export const SUPABASE_URL = "https://aiseafkfjhixolxezjjq.supabase.co";
export const SUPABASE_ANON_KEY =
  "sb_publishable_mdoTv5Opu_0idPCaV64_6A_nIegPRg1";
export const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

export async function ensureAuthOnLoad() {
  const loginStatusEl = document.getElementById("login-status");
  loginStatusEl.textContent = "Sjekker innlogging...";

  const { data } = await supabase.auth.getUser();
  if (data?.user) {
    if (!data.user.confirmed_at) {
      loginStatusEl.textContent =
        "E-posten er ikke bekreftet. Sjekk e-posten din.";
      await supabase.auth.signOut();
      setCurrentUser(null);
      return;
    }

    setCurrentUser(data.user);
    await ensureDisplayName();
    await loadProfileRole();
  } else {
    setCurrentUser(null);
    await supabase.auth.signOut();
  }
}

export async function ensureDisplayName() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  let metaName = currentUser.user_metadata?.display_name;
  if (metaName && metaName.trim().length >= 2 && metaName.trim().length <= 30) {
    setDisplayName(metaName.trim());
    document.getElementById("name").value = getDisplayName();
    await supabase.from("profiles").upsert(
      [
        {
          id: currentUser.id,
          email: currentUser.email,
          display_name: getDisplayName(),
        },
      ],
      { onConflict: "id" }
    );
    return;
  }

  while (true) {
    const input = prompt(
      "Hva vil du hete når du sender meldinger? (2–30 tegn)"
    );
    if (!input) {
      alert("Du må velge et navn for å bruke tjenesten.");
      continue;
    }
    const trimmed = input.trim();
    if (trimmed.length < 2 || trimmed.length > 30) {
      alert("Navnet må være mellom 2 og 30 tegn.");
      continue;
    }

    const { data, error } = await supabase.auth.updateUser({
      data: { display_name: trimmed },
    });
    if (error) {
      alert("Kunne ikke lagre navnet: " + error.message);
      return;
    }

    const { error: pErr } = await supabase.from("profiles").upsert(
      [
        {
          id: currentUser.id,
          email: currentUser.email,
          display_name: trimmed,
        },
      ],
      { onConflict: "id" }
    );
    if (pErr) {
      alert("Kunne ikke lagre navnet i profiles: " + pErr.message);
      return;
    }

    setCurrentUser(data.user);
    setDisplayName(trimmed);
    document.getElementById("name").value = getDisplayName();
    break;
  }
}

export async function loadProfileRole() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  if (currentUser.id === "81e519d0-8b8c-4190-bdd7-a96bfe09235c") {
    setCurrentRole("admin");
    return;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single();
  if (error) {
    console.warn("Kunne ikke hente profilrolle:", error.message);
    setCurrentRole("user");
    return;
  }
  setCurrentRole(data?.role || "user");
}

export async function handleLogout() {
  await supabase.auth.signOut();
  setCurrentUser(null);
  setDisplayName(null);
  setCurrentRole("user");
  document.getElementById("account-drawer")?.classList.remove("active");
}

supabase.auth.onAuthStateChange((_event, session) => {
  setCurrentUser(session?.user ?? null);
});
