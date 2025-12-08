export let currentUser = null;
export let displayName = null;
export let currentRole = "user";

export function setCurrentUser(user) {
  currentUser = user;
}

export function setDisplayName(name) {
  displayName = name;
}

export function setCurrentRole(role) {
  currentRole = role;
}

export function getCurrentUser() {
  return currentUser;
}

export function getDisplayName() {
  return displayName;
}

export function getCurrentRole() {
  return currentRole;
}
