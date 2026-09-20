/**
 * 把 URL 上的 ?sort= 值對回目前仍存在的排序選項；對不到就退回預設。
 * #218 拿掉 registrationFlow／creationMethod／daysToComplete 排序後，舊書籤會帶已不存在的值。
 */
export function normalizeSortValue(
  value: string | null | undefined,
  options: ReadonlyArray<{ value: string }>,
  fallback: string,
): string {
  if (!value) return fallback
  return options.some((o) => o.value === value) ? value : fallback
}
