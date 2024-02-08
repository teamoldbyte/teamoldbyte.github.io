/**
 * 숫자를 일정한 길이의 영문 문자열로 인코딩 (:Numbers To Alphabets) 
 */
function ntoa(n) {
	const chars = (reversebit(BigInt(n)) ^ 123789456n).toString();
	let encoded = '';
	for (let i = 0, len = chars.length; i < len; i++) {
		const c = chars.charCodeAt(i);
		encoded += String.fromCodePoint(c + (c & 1 ? 32 : 49));
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

/**
 * deflate(byte[]화) 및 inflate(문자열화) 실행
 * ex) 
 * 		callPakoFunc(() => pako.inflate(byte[],{to:'string'}));
 * 		callPakoFunc(() => pako.delfate(str));
 */
async function callPakoFunc(func) {
	const modulesToTry = [
		'pako',
		'https://cdn.jsdelivr.net/npm/pako/dist/pako.min.js',
		'https://static.findsvoc.com/js/public/pako.min.js'
	];

	let pakoModule = null;

	for (const module of modulesToTry) {
		try {
			pakoModule = await import(module);
			break;
		} catch (error) { }
	}

	return pakoModule ? func.call(this, pakoModule) : console.error('Failed to load pako module.');
}

/**
public static String shitfDecode(String encoded) {
	  char[] encBytes = encoded.toCharArray();
	  byte[] pBytes = new byte[encBytes.length];
	  int i = encBytes.length;
	  int shift = 0;
	  for (char c : encBytes) {
		 shift = (c - 17) >= 0 ? (c - 17) : (c - 17) + 127;
		 pBytes[i - 1] = (byte) shift;
		 i--;
	  }
	  return new String(pBytes);
   }
 */
/**
 * 아스키코드문자열을 숫자문자열로 디코딩 (:ASCII To Numbers) 
 * (ntoa와 대치되지 않음.)
 */
async function aton(a) {
	return await callPakoFunc(() => {
		const pBytes = new Uint8Array(new ArrayBuffer(a.length * 1));
		for (let i = 0; i < a.length; i++) {
			const c = a.charCodeAt(i);
			let shift = c >= 17 ? (c - 17) : (c - 17 + 127);
			pBytes[a.length - i - 1] = shift;
		}
		const inflated = String.fromCharCode.apply(null, pBytes);
		return inflated;
	});
}
