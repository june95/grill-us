/** 금액을 소수점 둘째 자리까지 달러 표기로 바꾼다. */
export function formatPrice(value) {
  const fixed = value.toFixed(2);
  return '$' + fixed;
}
