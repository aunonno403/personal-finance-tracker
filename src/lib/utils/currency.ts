const bdtFormatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

export function formatBDT(value: number): string {
  return bdtFormatter.format(value);
}
