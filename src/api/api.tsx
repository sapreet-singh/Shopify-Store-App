import axios from "axios";

export const API = axios.create({
  baseURL: "https://shopifyintegrationapi.onrender.com",
  headers: {
    Accept: "*/*",
    "Content-Type": "application/json",
  },
});