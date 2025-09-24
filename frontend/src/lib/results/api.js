import { API_URL } from "../../config";

const jsonHeaders = {
  "Content-Type": "application/json",
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload.message || "Une erreur est survenue";
    throw new Error(message);
  }
  return response.json();
};

export async function fetchSummary(token, { from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  const url = `${API_URL}/api/metrics/summary${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url, {
    headers: {
      ...jsonHeaders,
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}

export async function searchStudents(token, query) {
  const params = new URLSearchParams();
  if (query) params.append("query", query);
  const url = `${API_URL}/api/students${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url, {
    headers: {
      ...jsonHeaders,
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}

export async function fetchStudentSeries(token, id) {
  const response = await fetch(`${API_URL}/api/students/${id}/series`, {
    headers: {
      ...jsonHeaders,
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}

export async function deleteData(token, payload) {
  const response = await fetch(`${API_URL}/api/data`, {
    method: "DELETE",
    headers: {
      ...jsonHeaders,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

