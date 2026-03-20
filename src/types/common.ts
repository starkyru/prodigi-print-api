export type ShippingMethod =
  | "Budget"
  | "Standard"
  | "StandardPlus"
  | "Express"
  | "Overnight";

export type Sizing = "fillPrintArea" | "fitPrintArea" | "stretchToPrintArea";

export type OrderStage = "InProgress" | "Complete" | "Cancelled";

export type OrderStatus =
  | "AwaitingPayment"
  | "NotYetDownloaded"
  | "Downloaded"
  | "Printing"
  | "QualityControl"
  | "Dispatched"
  | "WithCarrier"
  | "InTransit"
  | "Delivered"
  | "Cancelled"
  | "OnHold";

export interface Cost {
  amount: string;
  currency: string;
}

export interface Address {
  line1: string;
  line2?: string;
  postalOrZipCode: string;
  countryCode: string;
  townOrCity: string;
  stateOrCounty?: string;
}

export interface Recipient {
  name: string;
  email?: string;
  phoneNumber?: string;
  address: Address;
}
