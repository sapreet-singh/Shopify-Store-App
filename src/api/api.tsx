import axios from "axios";

export const API = axios.create({
   baseURL: "https://b3ea68d89ef4.ngrok-free.app",
  headers: {
    Accept: "*/*",
    "Content-Type": "application/json",
  },
});
