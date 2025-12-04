// Supabase init
const SUPABASE_URL = "https://aiseafkfjhixolxezjjq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mdoTv5Opu_0idPCaV64_6A_nIegPRg1";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// UI refs
const authArea = document.getElementById("auth-area");
const adminArea = document.getElementById("admin-area");
const refreshBtn = document.getElementById("refresh-btn");
const clearBtn = document.getElementById("clear-btn");
const userBadge = document.getElementById("user-badge");
const roleBadge = document.getElementById("role-badge");

const loginForm = document.getElementById("login-form");
const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");
const loginStatusEl = document.getElementById("login-status");
const logoutBtn = document.getElementById("logout-btn");
const appArea = document.getElementById("app-area");

const form = document.getElementById("form");
const nameInput = document.getElementById("name");
const contentInput = document.getElementById("content");
const msgsEl = document.getElementById("msgs");
const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");

// Portfolio navigation refs
const portfolioArea = document.getElementById("portfolio-area");
const openMessages = document.getElementById("open-messages");
const backToPortfolioBtn = document.getElementById("back-to-portfolio");

const minSideBtn = document.getElementById("min-side-btn");
const accountDrawer = document.getElementById("account-drawer");
const accountDrawerOverlay = document.getElementById("account-drawer-overlay");
const closeDrawerBtn = document.getElementById("close-drawer-btn");
const drawerEmail = document.getElementById("drawer-email");
const drawerRole = document.getElementById("drawer-role");
const drawerLogoutBtn = document.getElementById("drawer-logout-btn");

// Add these UI refs near the other refs
const project2Card = document.getElementById("project2");
const project2Area = document.getElementById("project2-area");
const project2BackBtn = document.getElementById("project2-back-btn");
const codePageContent = document.getElementById("code-page-content");
// keep modal refs if you still use the modal elsewhere
const codeModal = document.getElementById("code-modal");
const codeModalOverlay = document.getElementById("code-modal-overlay");
const codeModalClose = document.getElementById("code-modal-close");
const codeModalTitle = document.getElementById("code-modal-title");
const codeModalContent = document.getElementById("code-modal-content");

// State
let currentUser = null;
let displayName = null;
let currentRole = "user";

// Badges
function updateUserBadge() {
  if (!userBadge || !roleBadge) return;

  if (currentUser?.email) {
    const isAdmin = currentRole === "admin";
    userBadge.textContent = currentUser.email;
    userBadge.className = "badge rounded-pill text-bg-secondary";
    roleBadge.textContent = isAdmin ? "Admin" : "Bruker";
    roleBadge.className =
      "badge rounded-pill " +
      (isAdmin ? "text-bg-warning" : "text-bg-secondary");
    roleBadge.classList.remove("d-none");
  } else {
    userBadge.textContent = "Gjest";
    userBadge.className = "badge rounded-pill text-bg-light";
    roleBadge.classList.add("d-none");
  }
}

function updateAccountDrawer() {
  if (!drawerEmail || !drawerRole) return;
  drawerEmail.textContent = currentUser?.email || "Ikke innlogget";
  drawerRole.textContent = currentRole === "admin" ? "Admin" : "Bruker";
  if (drawerLogoutBtn) drawerLogoutBtn.disabled = !currentUser;
  if (minSideBtn) minSideBtn.disabled = !currentUser;
}

function openAccountDrawer() {
  updateAccountDrawer();
  accountDrawer?.classList.add("active");
}

function closeAccountDrawer() {
  accountDrawer?.classList.remove("active");
}

// Utils
function esc(s) {
  return (s || "").replace(
    /[<>&"']/g,
    (c) =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[
        c
      ])
  );
}

function parseRow(r) {
  return {
    name: r.display_name || "Anonym",
    message: r.message || r.content || "",
    created_at: r.created_at,
  };
}

// Data
async function loadMessages() {
  statusEl.textContent = "Laster...";
  const { data, error } = await supabase
    .from("messages")
    .select("id, message, display_name, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    statusEl.textContent = "Feil: " + error.message;
    return;
  }

  countEl.textContent = (data || []).length;

  msgsEl.innerHTML = (data || [])
    .map((r) => {
      const it = parseRow(r);
      const when = new Date(it.created_at).toLocaleString();
      return `
        <div class="border rounded p-2">
          <div class="fw-semibold">${esc(it.name)}</div>
          <div>${esc(it.message)}</div>
          <div class="small text-muted">${when}</div>
        </div>
      `;
    })
    .join("");

  statusEl.textContent = "Klar";
}

// Profile + role
async function ensureDisplayName() {
  if (!currentUser) return;

  let metaName = currentUser.user_metadata?.display_name;
  if (metaName && metaName.trim().length >= 2 && metaName.trim().length <= 30) {
    displayName = metaName.trim();
    nameInput.value = displayName;
    await supabase.from("profiles").upsert(
      [
        {
          id: currentUser.id,
          email: currentUser.email,
          display_name: displayName,
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

    currentUser = data.user;
    displayName = trimmed;
    nameInput.value = displayName;
    break;
  }
}

async function loadProfileRole() {
  if (!currentUser) return;

  // Force admin for your specific User ID
  if (currentUser.id === "81e519d0-8b8c-4190-bdd7-a96bfe09235c") {
    currentRole = "admin";
    updateUserBadge();
    return;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single();
  if (error) {
    console.warn("Kunne ikke hente profilrolle:", error.message);
    currentRole = "user";
    updateUserBadge();
    return;
  }
  currentRole = data?.role || "user";
  updateUserBadge();
}

// Auth UI
function updateAuthUI() {
  console.log("DEBUG user:", currentUser?.email);
  console.log("DEBUG role:", currentRole);
  updateUserBadge();
  updateAccountDrawer();

  if (currentUser) {
    authArea.classList.add("d-none");
    appArea.classList.add("d-none"); // ensure messaging hidden initially
    portfolioArea.classList.remove("d-none");

    if (currentRole === "admin") {
      adminArea.classList.remove("d-none");
    } else {
      adminArea.classList.add("d-none");
    }
  } else {
    authArea.classList.remove("d-none");
    portfolioArea.classList.add("d-none");
    appArea.classList.add("d-none");
    loginForm.classList.remove("d-none");
    logoutBtn.classList.add("d-none");
    loginStatusEl.textContent = "Ikke innlogget.";
    nameInput.value = "";
    displayName = null;
    currentRole = "user";
    adminArea.classList.add("d-none");
    updateUserBadge();
  }
}

// Lifecycle
async function ensureAuthOnLoad() {
  loginStatusEl.textContent = "Sjekker innlogging...";

  const { data } = await supabase.auth.getUser();
  if (data?.user) {
    if (!data.user.confirmed_at) {
      loginStatusEl.textContent =
        "E-posten er ikke bekreftet. Sjekk e-posten din.";
      await supabase.auth.signOut();
      currentUser = null;
      updateAuthUI();
      return;
    }

    currentUser = data.user;
    updateUserBadge();
    await ensureDisplayName();
    await loadProfileRole();
    updateAuthUI();
    await loadMessages();
  } else {
    currentUser = null;
    await supabase.auth.signOut();
    updateAuthUI();
  }
}

supabase.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user ?? null;
  updateUserBadge();
});

// Events
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  let email = loginEmailInput.value.trim().toLowerCase();
  const password = loginPasswordInput.value;

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
          "Feil ved oppretting av bruker: " + signUpError.message;
        return;
      }

      loginStatusEl.textContent =
        "Bruker opprettet! Sjekk e-posten din for en bekreftelseslenke før du kan logge inn.";
      return;
    }

    loginStatusEl.textContent = "Innlogging feilet: " + signInError.message;
    return;
  }

  if (!signInData.user.confirmed_at) {
    loginStatusEl.textContent =
      "E-posten er ikke bekreftet ennå. Sjekk innboksen din og klikk på lenken.";
    await supabase.auth.signOut();
    return;
  }

  currentUser = signInData.user;
  await ensureDisplayName();
  await loadProfileRole();
  updateAuthUI();
  await loadMessages();
});

async function handleLogout() {
  await supabase.auth.signOut();
  currentUser = null;
  updateAuthUI();
  statusEl.textContent = "Du er logget ut.";
  closeAccountDrawer();
}

logoutBtn.addEventListener("click", handleLogout);
drawerLogoutBtn?.addEventListener("click", handleLogout);

// --- NY KODE START ---
clearBtn?.addEventListener("click", async () => {
  if (currentRole !== "admin") {
    alert("Kunne ikke tømme: Du er ikke admin.");
    return;
  }

  if (!confirm("Er du sikker på at du vil slette ALLE meldinger?")) {
    return;
  }

  statusEl.textContent = "Sletter alle meldinger...";

  // Sletter alle rader der ID ikke er null (altså alle)
  const { error } = await supabase
    .from("messages")
    .delete()
    .not("id", "is", null);

  if (error) {
    statusEl.textContent = "Feil ved sletting: " + error.message;
    alert("Feil: " + error.message);
  } else {
    statusEl.textContent = "Alle meldinger er slettet.";
    await loadMessages();
  }
});

refreshBtn?.addEventListener("click", async () => {
  await loadMessages();
});
// --- NY KODE SLUTT ---

minSideBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  if (!currentUser) return;
  openAccountDrawer();
});
closeDrawerBtn?.addEventListener("click", closeAccountDrawer);
accountDrawerOverlay?.addEventListener("click", closeAccountDrawer);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAccountDrawer();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  form.classList.add("was-validated");
  if (!form.checkValidity()) return;

  if (!currentUser || !currentUser.email) {
    statusEl.textContent = "Du må være logget inn for å sende meldinger.";
    return;
  }

  if (!displayName) {
    await ensureDisplayName();
    if (!displayName) {
      statusEl.textContent = "Kunne ikke hente navnet ditt.";
      return;
    }
  }

  const msg = contentInput.value.trim();
  if (!msg) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  statusEl.textContent = "Lagrer...";

  const { error } = await supabase
    .from("messages")
    .insert({ message: msg, display_name: displayName });

  if (error) {
    statusEl.textContent = "Kunne ikke lagre: " + error.message;
  } else {
    contentInput.value = "";
    form.classList.remove("was-validated");
    statusEl.textContent = "Melding sendt!";
    await loadMessages();
  }

  submitBtn.disabled = false;
});

openMessages?.addEventListener("click", (e) => {
  e.preventDefault();
  if (!currentUser) {
    statusEl.textContent = "Logg inn først.";
    return;
  }
  portfolioArea.classList.add("d-none");
  appArea.classList.remove("d-none");
});

backToPortfolioBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  appArea.classList.add("d-none");
  portfolioArea.classList.remove("d-none");
});

// Insert this code among your other event listeners (near minSideBtn / backToPortfolioBtn)
const pythonCode = `import random

alle_dager = []

def registrer_vaner(dagens_vaner):
    antall_vaner = int(input("Hvor mange vaner vil du skrive inn i dag? "))
    i = 0
    while i < antall_vaner: 
        vane_navn = input("Skriv inn navnet på vanen: ")
        dagens_vaner.append({"navn": vane_navn, "fullført": False})
        i = i + 1 

def marker_fullførte_vaner(dagens_vaner):
    index = 0
    while index < len(dagens_vaner):
        svar = input("Har du gjort '{}' i dag? Skriv ja eller nei: ".format(dagens_vaner[index]["navn"]))
        if svar == "ja":
            dagens_vaner[index]["fullført"] = True
        else:
            dagens_vaner[index]["fullført"] = False
        index += 1

def vis_status(dagens_vaner):
    fullførte = 0
    for vane in dagens_vaner:
        if vane["fullført"] == True: 
            fullførte += 1
    totalt = len(dagens_vaner)
    print("I dag har du klart {} av {} vaner".format(fullførte, totalt))

def gi_motivasjon(antall=1):
    sitater = [
        "Små steg hver dag gir store resultater",
        "Det du gjør teller, fortsett så godt du kan",
        "Selv små seire er viktige",
        "Tro på deg selv, du klarer mer enn du tror"
    ]
    i = 0
    while i < antall: 
        tilfeldig_index = random.randint(0, len(sitater)-1)
        print("Motivasjon {}: {}".format(i+1, sitater[tilfeldig_index]))
        i += 1

fortsett_program = True

while fortsett_program == True: 
    dagens_vaner = []
    dag_navn = input("Hva heter dagen i dag? ")
    alle_dager.append({"dag": dag_navn, "vaner": dagens_vaner})
    
    registrer_vaner(dagens_vaner)
    marker_fullførte_vaner(dagens_vaner)
    vis_status(dagens_vaner)
    
    gi_motivasjon(1)
    
    svar = input("Vil du skrive inn flere vaner senere? ja/nei: ")
    if svar != "ja":
        fortsett_program = False
        print("Programmet avsluttes for i dag")

print("\\nHer er historikken din over alle dager:")
for dag in alle_dager:
    fullførte = 0
    totalt = len(dag["vaner"])
    for vane in dag["vaner"]:
        if vane["fullført"] == True:
            fullførte += 1
    print("{}: {}/{} vaner fullført".format(dag["dag"], fullførte, totalt))
`;

// Open modal when clicking Project 2
project2Card?.addEventListener("click", (e) => {
  e.preventDefault();
  // open a dedicated page-like view (hide portfolio/messages)
  portfolioArea.classList.add("d-none");
  appArea.classList.add("d-none");
  project2Area?.classList.remove("d-none");
  if (codePageContent) codePageContent.textContent = pythonCode;
  window.scrollTo(0, 0);
});

// Back button to return to portfolio (like Meldinger -> Portfolio)
project2BackBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  project2Area?.classList.add("d-none");
  portfolioArea.classList.remove("d-none");
  window.scrollTo(0, 0);
});

// Close handlers
function closeCodeModal() {
  if (!codeModal) return;
  codeModal.classList.add("d-none");
  document.body.style.overflow = "";
  // keep content if you want; clear to free memory:
  codeModalContent.textContent = "";
}
codeModalClose?.addEventListener("click", closeCodeModal);
codeModalOverlay?.addEventListener("click", closeCodeModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCodeModal();
});

// Start the app by checking for an existing session
ensureAuthOnLoad();
//# sourceMappingURL=app.js.map
