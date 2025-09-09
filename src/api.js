const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function buildUrl(path) {
  if (!BASE_URL) {
    console.warn("VITE_API_BASE_URL is not set. Using relative requests.");
    return path;
  }
  return `${String(BASE_URL).replace(/\/$/, "")}${
    path.startsWith("/") ? path : `/${path}`
  }`;
}

function buildQuery(path, params) {
  const url = new URL(buildUrl(path), window.location.origin);
  if (params && typeof params === "object") {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  return url.pathname + (url.search ? url.search : "");
}

async function httpGet(path, params) {
  const finalPath = params ? buildQuery(path, params) : path;
  const res = await fetch(buildUrl(finalPath), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    // credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET ${finalPath} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function getHome(id) {
  return httpGet("/", { endpoint: "home", id });
}

export async function getPipeline(id) {
  return httpGet("/", { endpoint: "pipeline", id });
}

export async function getEarnings(id) {
  return httpGet("/", { endpoint: "earnings", id });
}

export async function getGoals(id) {
  return httpGet("/", { endpoint: "goals", id });
}

export async function getReports(id) {
  return httpGet("/", { endpoint: "reports", id });
}

export async function getTasks(id) {
  return httpGet("/", { endpoint: "tasks", id });
}

export async function getCalls(id) {
  return httpGet("/", { endpoint: "calls", id });
}

export async function getLeads(id) {
  return httpGet("/", { endpoint: "leads", id });
}
