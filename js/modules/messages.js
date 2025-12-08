import { supabase } from "./auth.js";
import { getCurrentUser, getDisplayName, getCurrentRole } from "./state.js";

export async function loadMessages() {
  const statusEl = document.getElementById("status");
  const msgsEl = document.getElementById("msgs");
  const countEl = document.getElementById("count");

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
      const name = r.display_name || "Anonym";
      const message = r.message || "";
      const when = new Date(r.created_at).toLocaleString();
      return `
        <div class="border rounded p-2">
          <div class="fw-semibold">${esc(name)}</div>
          <div>${esc(message)}</div>
          <div class="small text-muted">${when}</div>
        </div>
      `;
    })
    .join("");

  statusEl.textContent = "Klar";
}

export async function sendMessage(message) {
  const statusEl = document.getElementById("status");
  const contentInput = document.getElementById("content");
  const form = document.getElementById("form");
  const submitBtn = form.querySelector('button[type="submit"]');
  const currentUser = getCurrentUser();
  const displayName = getDisplayName();

  if (!currentUser || !currentUser.email) {
    statusEl.textContent = "Du må være logget inn for å sende meldinger.";
    return;
  }

  if (!displayName) {
    statusEl.textContent = "Kunne ikke hente navnet ditt.";
    return;
  }

  const msg = message.trim();
  if (!msg) return;

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
}

export async function clearAllMessages() {
  const statusEl = document.getElementById("status");
  const currentRole = getCurrentRole();

  if (currentRole !== "admin") {
    alert("Kunne ikke tømme: Du er ikke admin.");
    return;
  }

  if (!confirm("Er du sikker på at du vil slette ALLE meldinger?")) {
    return;
  }

  statusEl.textContent = "Sletter alle meldinger...";

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
}

function esc(s) {
  return (s || "").replace(
    /[<>&"']/g,
    (c) =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[
        c
      ])
  );
}
