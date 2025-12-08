import { getCurrentUser, getCurrentRole } from "./state.js";

export function updateUserBadge() {
  const userBadge = document.getElementById("user-badge");
  const roleBadge = document.getElementById("role-badge");
  const currentUser = getCurrentUser();
  const currentRole = getCurrentRole();

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

export function updateAccountDrawer() {
  const drawerEmail = document.getElementById("drawer-email");
  const drawerRole = document.getElementById("drawer-role");
  const drawerLogoutBtn = document.getElementById("drawer-logout-btn");
  const minSideBtn = document.getElementById("min-side-btn");
  const currentUser = getCurrentUser();
  const currentRole = getCurrentRole();

  if (!drawerEmail || !drawerRole) return;
  drawerEmail.textContent = currentUser?.email || "Ikke innlogget";
  drawerRole.textContent = currentRole === "admin" ? "Admin" : "Bruker";
  if (drawerLogoutBtn) drawerLogoutBtn.disabled = !currentUser;
  if (minSideBtn) minSideBtn.disabled = !currentUser;
}

export function updateAuthUI() {
  const authArea = document.getElementById("auth-area");
  const adminArea = document.getElementById("admin-area");
  const portfolioArea = document.getElementById("portfolio-area");
  const appArea = document.getElementById("app-area");
  const currentUser = getCurrentUser();
  const currentRole = getCurrentRole();

  console.log("DEBUG user:", currentUser?.email);
  console.log("DEBUG role:", currentRole);
  updateUserBadge();
  updateAccountDrawer();

  if (currentUser) {
    authArea.classList.add("d-none");
    appArea.classList.add("d-none");
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
    document.getElementById("login-status").textContent = "Ikke innlogget.";
    document.getElementById("name").value = "";
    adminArea.classList.add("d-none");
    updateUserBadge();
  }
}

export function openAccountDrawer() {
  updateAccountDrawer();
  document.getElementById("account-drawer")?.classList.add("active");
}

export function closeAccountDrawer() {
  document.getElementById("account-drawer")?.classList.remove("active");
}
