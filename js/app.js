import {
  supabase,
  ensureAuthOnLoad,
  ensureDisplayName,
  loadProfileRole,
  handleLogout,
} from "./modules/auth.js";
import {
  getCurrentUser,
  getDisplayName,
  getCurrentRole,
} from "./modules/state.js";
import {
  updateAuthUI,
  openAccountDrawer,
  closeAccountDrawer,
} from "./modules/ui.js";
import {
  loadMessages,
  sendMessage,
  clearAllMessages,
} from "./modules/messages.js";
import {
  project1Code,
  pythonCode,
  project3Text,
} from "./content/projectContent.js";

// Event: Login form
document.getElementById("login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  let email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  const loginStatusEl = document.getElementById("login-status");

  if (!email || !password) {
    loginStatusEl.textContent = "Skriv inn både e-post og passord.";
    return;
  }

  loginStatusEl.textContent = "Logger inn...";

  let { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    if (signInError.message.includes("Invalid login credentials")) {
      loginStatusEl.textContent =
        "Bruker finnes ikke – oppretter ny og sender verifisering...";

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.href },
        });

      if (signUpError) {
        loginStatusEl.textContent =
          "Feil ved oppretting: " + signUpError.message;
        return;
      }

      loginStatusEl.textContent =
        "Bruker opprettet! Sjekk e-posten din for en bekreftelseslenke.";
      return;
    }

    loginStatusEl.textContent = "Innlogging feilet: " + signInError.message;
    return;
  }

  if (!signInData.user.confirmed_at) {
    loginStatusEl.textContent =
      "E-posten er ikke bekreftet ennå. Sjekk innboksen din.";
    await supabase.auth.signOut();
    return;
  }

  await ensureDisplayName();
  await loadProfileRole();
  updateAuthUI();
  await loadMessages();
});

// Logout buttons
document.getElementById("logout-btn")?.addEventListener("click", async () => {
  await handleLogout();
  updateAuthUI();
});

document
  .getElementById("drawer-logout-btn")
  ?.addEventListener("click", async () => {
    await handleLogout();
    updateAuthUI();
  });

// Messages
document.getElementById("form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  form.classList.add("was-validated");
  if (!form.checkValidity()) return;

  const msg = document.getElementById("content").value;
  await sendMessage(msg);
});

document.getElementById("refresh-btn")?.addEventListener("click", async () => {
  await loadMessages();
});

document.getElementById("clear-btn")?.addEventListener("click", async () => {
  await clearAllMessages();
});

// Navigation
document.getElementById("open-messages")?.addEventListener("click", (e) => {
  e.preventDefault();
  if (!getCurrentUser()) {
    document.getElementById("status").textContent = "Logg inn først.";
    return;
  }
  document.getElementById("portfolio-area")?.classList.add("d-none");
  document.getElementById("app-area")?.classList.remove("d-none");
});

document.getElementById("back-to-portfolio")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("app-area")?.classList.add("d-none");
  document.getElementById("portfolio-area")?.classList.remove("d-none");
});

// Account drawer
document.getElementById("min-side-btn")?.addEventListener("click", (e) => {
  e.preventDefault();
  if (!getCurrentUser()) return;
  openAccountDrawer();
});

document
  .getElementById("close-drawer-btn")
  ?.addEventListener("click", closeAccountDrawer);
document
  .getElementById("account-drawer-overlay")
  ?.addEventListener("click", closeAccountDrawer);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAccountDrawer();
});

// Initialize
ensureAuthOnLoad().then(() => {
  updateAuthUI();
  loadMessages();
});

// Project 1
document.getElementById("project1")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("portfolio-area")?.classList.add("d-none");
  document.getElementById("app-area")?.classList.add("d-none");
  document.getElementById("project2-area")?.classList.add("d-none");
  document.getElementById("project3-area")?.classList.add("d-none");
  document.getElementById("project4-area")?.classList.add("d-none");
  document.getElementById("project5-area")?.classList.add("d-none");
  document.getElementById("project1-area")?.classList.remove("d-none");
  const project1Content = document.getElementById("project1-content");
  if (project1Content) project1Content.textContent = project1Code;
  window.scrollTo(0, 0);
});

document.getElementById("project1-back-btn")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("project1-area")?.classList.add("d-none");
  document.getElementById("portfolio-area")?.classList.remove("d-none");
  window.scrollTo(0, 0);
});

// Project 2
document.getElementById("project2")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("portfolio-area")?.classList.add("d-none");
  document.getElementById("app-area")?.classList.add("d-none");
  document.getElementById("project3-area")?.classList.add("d-none");
  document.getElementById("project4-area")?.classList.add("d-none");
  document.getElementById("project2-area")?.classList.remove("d-none");
  const codePageContent = document.getElementById("code-page-content");
  if (codePageContent) codePageContent.textContent = pythonCode;
  window.scrollTo(0, 0);
});

document.getElementById("project2-back-btn")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("project2-area")?.classList.add("d-none");
  document.getElementById("portfolio-area")?.classList.remove("d-none");
  window.scrollTo(0, 0);
});

// Project 3
document.getElementById("project3")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("portfolio-area")?.classList.add("d-none");
  document.getElementById("app-area")?.classList.add("d-none");
  document.getElementById("project2-area")?.classList.add("d-none");
  document.getElementById("project4-area")?.classList.add("d-none");
  document.getElementById("project3-area")?.classList.remove("d-none");
  const project3Content = document.getElementById("project3-content");
  if (project3Content) {
    if (typeof marked !== "undefined") {
      project3Content.innerHTML = marked.parse(project3Text);
    } else {
      project3Content.innerHTML = `<pre>${project3Text}</pre>`;
    }
  }
  window.scrollTo(0, 0);
});

document.getElementById("project3-back-btn")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("project3-area")?.classList.add("d-none");
  document.getElementById("portfolio-area")?.classList.remove("d-none");
  window.scrollTo(0, 0);
});

// Project 3 Kompetanse
document
  .getElementById("project3-kompetanse")
  ?.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("portfolio-area")?.classList.add("d-none");
    document.getElementById("app-area")?.classList.add("d-none");
    document.getElementById("project2-area")?.classList.add("d-none");
    document.getElementById("project3-area")?.classList.add("d-none");
    document.getElementById("project4-area")?.classList.add("d-none");
    document.getElementById("project5-area")?.classList.add("d-none");
    document
      .getElementById("project3-kompetanse-area")
      ?.classList.remove("d-none");
    window.scrollTo(0, 0);
  });

document
  .getElementById("project3-kompetanse-back-btn")
  ?.addEventListener("click", (e) => {
    e.preventDefault();
    document
      .getElementById("project3-kompetanse-area")
      ?.classList.add("d-none");
    document.getElementById("portfolio-area")?.classList.remove("d-none");
    window.scrollTo(0, 0);
  });

// Project 4
document.getElementById("project4")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("portfolio-area")?.classList.add("d-none");
  document.getElementById("app-area")?.classList.add("d-none");
  document.getElementById("project2-area")?.classList.add("d-none");
  document.getElementById("project3-area")?.classList.add("d-none");
  document.getElementById("project4-area")?.classList.remove("d-none");
  window.scrollTo(0, 0);
});

document.getElementById("project4-back-btn")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("project4-area")?.classList.add("d-none");
  document.getElementById("portfolio-area")?.classList.remove("d-none");
  window.scrollTo(0, 0);
});

// Project 5
document.getElementById("project5")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("portfolio-area")?.classList.add("d-none");
  document.getElementById("app-area")?.classList.add("d-none");
  document.getElementById("project2-area")?.classList.add("d-none");
  document.getElementById("project3-area")?.classList.add("d-none");
  document.getElementById("project4-area")?.classList.add("d-none");
  document.getElementById("project5-area")?.classList.remove("d-none");
  window.scrollTo(0, 0);
});

document.getElementById("project5-back-btn")?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("project5-area")?.classList.add("d-none");
  document.getElementById("portfolio-area")?.classList.remove("d-none");
  window.scrollTo(0, 0);
});
