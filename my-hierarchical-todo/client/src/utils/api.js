/**
 * api.js
 * ------
 * Centralizes all API calls to the Flask backend.
 * Includes auth calls (register, login) and list/item CRUD calls.
 */
const API_BASE = "http://127.0.0.1:5000/api";

// Get userId from localStorage to pass as a header
function getHeaders() {
  const userId = localStorage.getItem("userId") || "";
  return {
    "Content-Type": "application/json",
    "X-User-Id": userId
  };
}

/* ---------------------------
   AUTH
---------------------------- */
export async function registerUser(email, password) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

/* ---------------------------
   LISTS
---------------------------- */
export async function fetchLists() {
  const response = await fetch(`${API_BASE}/lists`, {
    headers: getHeaders()
  });
  return response.json();
}

export async function createList(title) {
  const response = await fetch(`${API_BASE}/lists`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ title })
  });
  return response.json();
}

export async function updateList(listId, title) {
  const response = await fetch(`${API_BASE}/lists/${listId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ title })
  });
  return response.json();
}

export async function deleteList(listId) {
  return await fetch(`${API_BASE}/lists/${listId}`, {
    method: "DELETE",
    headers: getHeaders()
  });
}

/* ---------------------------
   ITEMS
---------------------------- */
export async function createItem(parentType, parentId, content) {
  const response = await fetch(`${API_BASE}/items`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ parentType, parentId, content })
  });
  return response.json();
}

export async function updateItem(itemId, data) {
  const response = await fetch(`${API_BASE}/items/${itemId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function deleteItem(itemId) {
  return await fetch(`${API_BASE}/items/${itemId}`, {
    method: "DELETE",
    headers: getHeaders()
  });
}

export async function moveItem(itemId, targetParentType, targetParentId, targetIndex) {
  const response = await fetch(`${API_BASE}/items/move`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ itemId, targetParentType, targetParentId, targetIndex })
  });
  return response.json();
}
