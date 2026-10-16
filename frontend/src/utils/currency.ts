
export type Currency = "RWF" | "USD" | "EUR";

export function getSavedCurrency(): Currency {
  const savedCurrency = localStorage.getItem("retain-currency");

  if (
    savedCurrency === "RWF" ||
    savedCurrency === "USD" ||
    savedCurrency === "EUR"
  ) {
    return savedCurrency;
  }

  return "RWF";
}

export function formatCurrency(amount: number): string {
  const currency = getSavedCurrency();

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "RWF" ? 0 : 2,
    maximumFractionDigits: currency === "RWF" ? 0 : 2,
  }).format(amount);
}
