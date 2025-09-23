// Base URL of the backend API
// Uses Vite environment variable if provided, otherwise defaults to local server
export const API_URL =  import.meta.env.VITE_API_URL || 'http://localhost:8000';