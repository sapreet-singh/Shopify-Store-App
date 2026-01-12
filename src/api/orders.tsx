import { API } from "./api";

export interface OrderItem {
  title: string;
  quantity: number;
  imageUrl?: string;
}

export interface Order {
  orderId: string;
  orderName: string;
  orderNumber: number;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  deliveryStatus: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  trackingCompany: string | null;
  totalAmount: number;
  currency: string;
  items: OrderItem[];
}

export const getCustomerOrders = async (customerAccessToken: string) => {
  try {
    console.log("getCustomerOrders", { customerAccessToken });
  } catch {}
  return API.get<Order[]>("/api/Order/GetCustomerOrders", {
    params: { customerAccessToken },
  });
};
