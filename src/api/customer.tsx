import { API } from "./api";

export interface CustomerAccessToken {
  accessToken: string;
  expiresAt: string;
}

let currentAccessToken: string | null = null;

export const loginCustomer = async (email: string, password: string): Promise<CustomerAccessToken> => {
  // Note: The API expects email and password as query parameters even for a POST request
  const res = await API.post("/api/storefront/customer/login", null, {
    params: {
      email,
      password,
    },
  });
  
  if (res.data && res.data.accessToken) {
    currentAccessToken = res.data.accessToken;
  }
  
  return res.data;
};

export const getAccessToken = () => currentAccessToken;

export const setAccessToken = (token: string | null) => {
  currentAccessToken = token;
};
