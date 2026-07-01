export const currency = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  minimumFractionDigits: 2,
});

export const formatCurrency = (value: number) => currency.format(value || 0);

export const formatDateTime = (iso: string | Date) => {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const formatPaymentMethod = (method: string) => {
  switch (method) {
    case "cash":
      return "Cash";
    case "mobile-money":
      return "Mobile Money";
    case "card":
      return "Card";
    case "bank-transfer":
      return "Bank Transfer";
    default:
      return method;
  }
};
