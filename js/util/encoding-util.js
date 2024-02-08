/**
 * 숫자를 일정한 길이의 영문 문자열로 인코딩 (:Number To Alphabets) 
 */
function ntoa(n) {
  const chars = (reversebit(BigInt(n)) ^ 123789456n).toString();
  let encoded = '';
  for(let i = 0, len = chars.length; i < len; i++) {
	const c = chars[i].charCodeAt();
    encoded = encoded.concat(String.fromCodePoint(c + (c % 2 == 0 ? 49 : 32)));
  }
  return encoded;
}

/**
 * 주어진 숫자(64bit long)의 bit순서를 역전하여 반환
 */
function reversebit(x) {
  x = (x & 0x5555555555555555n) << 1n | (x & ~0x5555555555555555n) >> 1n;
  x = (x & 0x3333333333333333n) << 2n | (x & ~0x3333333333333333n) >> 2n;
  x = (x & 0x0F0F0F0F0F0F0F0Fn) << 4n | (x & ~0x0F0F0F0F0F0F0F0Fn) >> 4n;
  x = (x & 0x00FF00FF00FF00FFn) << 8n | (x & ~0x00FF00FF00FF00FFn) >> 8n;
  x = (x & 0x0000FFFF0000FFFFn) << 16n | (x & ~0x0000FFFF0000FFFFn) >> 16n;
  x = (x & 0x00000000FFFFFFFFn) << 32n | (x & ~0x00000000FFFFFFFFn) >> 32n;

  return BigInt.asIntN(64, x);
}
