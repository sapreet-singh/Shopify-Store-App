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

export const getCustomerAddresses = async (accessToken?: string) => {
  try { console.log("getCustomerAddresses", { accessToken }); } catch {}
  return API.get("/api/customer/address", {
    params: { accessToken },
  });
};

export const addAddress = async (request: AddAddressRequest) => {
  try { console.log("addAddress", request); } catch {}
  const token = await AsyncStorage.getItem("accessToken");
  const payload = {
    AccessToken: token || undefined,
    Address: {
      Address1: request.address1,
      Address2: request.address2,
      City: request.city,
      Province: request.province,
      Country: request.country,
      Zip: request.zip,
      Phone: request.phone,
    },
  };
  return API.post("/api/customer/address", payload);
};

export const updateAddress = async (request: UpdateAddressRequest) => {
  try { console.log("updateAddress", request); } catch {}
  const token = await AsyncStorage.getItem("accessToken");
  const payload = {
    AccessToken: token || undefined,
    AddressId: request.id,
    Address: {
      Address1: request.address1,
      Address2: request.address2,
      City: request.city,
      Province: request.province,
      Country: request.country,
      Zip: request.zip,
      Phone: request.phone,
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
    AccessToken: token || undefined,
    AddressId: request.id,
  };
  return API.put("/api/customer/address/default", payload);
};
