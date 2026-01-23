/**
 * 日期工具函数
 */

/**
 * 格式化日期为 YYYY-MM-DD 格式（使用本地时间）
 */
export const formatDateString = (year: number, month: number, day: number): string => {
  const y = year;
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * 获取今天的日期字符串（YYYY-MM-DD格式）
 */
export const getTodayString = (): string => {
  const today = new Date();
  return formatDateString(today.getFullYear(), today.getMonth(), today.getDate());
};

