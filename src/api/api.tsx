import axios from "axios";

export const API = axios.create({
   baseURL: "https://0bde4872ce2e.ngrok-free.app",
  headers: {
    Accept: "*/*",
    "Content-Type": "application/json",
  },
});
