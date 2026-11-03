/** 할인율(percent, 0~100)을 적용한 뒤의 가격을 반환한다. */
export function applyDiscount(price, percent) {
  return price * (100 - percent) / 100;
}
