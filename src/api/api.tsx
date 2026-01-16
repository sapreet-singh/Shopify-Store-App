import axios from "axios";

export const API = axios.create({
  //baseURL: "https://shopifyintegrationapi.onrender.com",
  //baseURL: "http://34.239.131.219:8080",
  baseURL: "https://sapreetsingh.shop",
  //baseURL: "https://cd38a03503fb.ngrok-free.app",
  headers: {
    Accept: "*/*",
    "Content-Type": "application/json",
  },
});
