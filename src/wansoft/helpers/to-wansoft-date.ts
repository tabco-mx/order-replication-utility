// Format an ISO OperationDate (e.g. "2026-05-26T00:00:00") to the date Wansoft expects
// for getorderdetail: "yyyy-M-d" with no leading zeros on month/day, e.g. "2026-5-26".
export function toWansoftDate(operationDate: string): string {
  const [year, month, day] = operationDate.slice(0, 10).split("-");
  return `${year}-${Number(month)}-${Number(day)}`;
}
