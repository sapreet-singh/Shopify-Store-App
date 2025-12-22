import { API } from "./api";

export interface Customer {
  id: string;
  displayName: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  customer?: Customer;
  accessToken?: string;
  token?: string;
  errors?: any;
}

export const registerCustomer = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string = ""
) => {

  return API.post("/api/storefront/customer/create", null, {
    params: {
      email,
      password,
      firstName,
      lastName
    }
  });
};

export const loginCustomer = async (email: string, password: string) => {
  return API.post("/api/storefront/customer/login", null, {
    params: {
      email,
      password
    }
  });
};

export const getCustomer = async (accessToken: string) => {
    return API.get("/api/storefront/customer", {
        params: { accessToken }
    });
}
