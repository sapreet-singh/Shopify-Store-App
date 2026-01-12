import axios from "axios";

export const API = axios.create({
  //baseURL: "https://shopifyintegrationapi.onrender.com",
  baseURL: "http://34.239.131.219:8080",
  //  baseURL: "https://d8851db27089.ngrok-free.app",
  timeout: 10000,
  headers: {
    Accept: "*/*",
    "Content-Type": "application/json",
  },
});
