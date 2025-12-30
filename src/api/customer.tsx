import { API } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export const registerCustomer = async ( email: string, password: string, 
  firstName: string, lastName: string = "" ) => {
  try { console.log("registerCustomer", { email, firstName, lastName }); } catch {}
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
  try { console.log("loginCustomer", { email }); } catch {}
  return API.post("/api/storefront/customer/login", null, {
    params: {
      email,
      password
    }
  });
};

export const getCustomer = async (accessToken: string) => {
    try { console.log("getCustomer", { accessToken }); } catch {}
    return API.get("/api/storefront/customer", {
        params: { accessToken }
    });
}

export interface AddAddressRequest {
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  country: string;
  zip: string;
  phone?: string;
}

export interface UpdateAddressRequest extends AddAddressRequest {
  id: string;
}

export interface SetDefaultAddressRequest {
  id: string;
}

export const getCustomerProfile = async (accessToken: string) => {
  try { console.log("getCustomerProfile", { accessToken }); } catch {}
  return API.get("/api/customer/profile", {
    params: { accessToken },
  });
};

export const addAddress = async (request: AddAddressRequest) => {
  try { console.log("addAddress", request); } catch {}
  const token = await AsyncStorage.getItem("accessToken");
  const payload = {
    accessToken: token || undefined,
    address: {
      address1: request.address1,
      city: request.city,
      province: request.province,
      country: request.country,
      zip: request.zip,
    },
  };
  return API.post("/api/customer/address", payload);
};

export const updateAddress = async (request: UpdateAddressRequest) => {
  try { console.log("updateAddress", request); } catch {}
  const token = await AsyncStorage.getItem("accessToken");
  const payload = {
    accessToken: token || undefined,
    id: request.id,
    address: {
      address1: request.address1,
      city: request.city,
      province: request.province,
      country: request.country,
      zip: request.zip,
    },
  };
  return API.put("/api/customer/address", payload);
};

export const deleteAddress = async (id: string, accessToken?: string) => {
  try { console.log("deleteAddress", { id, accessToken }); } catch {}
  return API.delete(`/api/customer/address/${encodeURIComponent(id)}`, {
    params: { accessToken },
  });
};

export const setDefaultAddress = async (request: SetDefaultAddressRequest) => {
  try { console.log("setDefaultAddress", request); } catch {}
  const token = await AsyncStorage.getItem("accessToken");
  const payload = {
    accessToken: token || undefined,
    id: request.id,
  };
  return API.put("/api/customer/address/default", payload);
};
