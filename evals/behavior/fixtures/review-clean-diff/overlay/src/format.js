const CURRENCY_SYMBOL = '$';

/** 금액을 소수점 둘째 자리까지 달러 표기로 바꾼다. */
export function formatPrice(value) {
  return CURRENCY_SYMBOL + value.toFixed(2);
}
