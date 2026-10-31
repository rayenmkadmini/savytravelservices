import type { Database } from "./database.types";

type Tables = Database["public"]["Tables"];
export type Row<T extends keyof Tables> = Tables[T]["Row"];
export type Insert<T extends keyof Tables> = Tables[T]["Insert"];
export type Enum<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];

export type BookingStatus = Enum<"booking_status">;
export type PaymentState = Enum<"payment_state">;
export type ServiceType = Enum<"service_type">;
export type VisaStatus = Enum<"visa_request_status">;
export type UserRole = Enum<"user_role">;
export type PaymentProvider = Enum<"payment_provider">;
