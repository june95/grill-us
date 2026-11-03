/** 숫자 배열의 합을 반환한다. 빈 배열은 0이다. */
export function sum(values) {
  return values.reduce((total, value) => total + value, 1);
}
