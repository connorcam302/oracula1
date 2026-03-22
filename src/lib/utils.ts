import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type WithoutChildrenOrChild<T> = Omit<T, "children" | "child">;
export type WithElementRef<T, E extends Element = Element> = T & { ref?: E | null };

const COUNTRY_TO_CODE: Record<string, string> = {
  Bahrain: "BH",
  "Saudi Arabia": "SA",
  Australia: "AU",
  Japan: "JP",
  China: "CN",
  Miami: "US",
  Monaco: "MC",
  Canada: "CA",
  Spain: "ES",
  Austria: "AT",
  "United Kingdom": "GB",
  UK: "GB",
  Britain: "GB",
  Hungary: "HU",
  Netherlands: "NL",
  Italy: "IT",
  Singapore: "SG",
  Azerbaijan: "AZ",
  "United States": "US",
  USA: "US",
  Mexico: "MX",
  Brazil: "BR",
  Qatar: "QA",
  "Abu Dhabi": "AE",
  UAE: "AE",
  France: "FR",
  Germany: "DE",
  Belgium: "BE",
  Russia: "RU",
  Malaysia: "MY",
  Korea: "KR",
  India: "IN",
  Turkey: "TR",
  Switzerland: "CH",
  Sweden: "SE",
  Norway: "NO",
  Finland: "FI",
  Denmark: "DK",
  Poland: "PL",
  Portugal: "PT",
  Argentina: "AR",
  Chile: "CL",
  "South Africa": "ZA",
  Indonesia: "ID",
  Thailand: "TH",
  Vietnam: "VN",
  Philippines: "PH",
  "New Zealand": "NZ",
  Ireland: "IE",
};

export function countryToFlag(country: string | null | undefined): string {
  if (!country) return "";
  const code = COUNTRY_TO_CODE[country];
  if (!code) return country;
  return code
    .split("")
    .map((c) => String.fromCodePoint(c.charCodeAt(0) - 0x41 + 0x1f1e6))
    .join("");
}
