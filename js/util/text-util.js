/**
 * HTML5 기능인 canvas.measureText를 사용하여 주어진 텍스트의 가로길이(px단위)를 계산하여 반환
 * (예: 글자수에 따른 단어 선택지 크기를 계산하여 표시할 갯수 지정.)
 * 
 * @param {String} text 화면에 표시할 텍스트 내용
 * @param {String} font 텍스트에 지정된 폰트 css (e.g. "19px Nunito Sans").
 * 
 * @see http://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
 */
function getTextWidth(text, font) {
	// getTextWidth.canvas가 없으면 생성, 있으면 재사용
	const context = (getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas")))
		.getContext("2d");
	context.font = font;
	return context.measureText(text).width;
}
/*
U+		0	1	2	3	4	5	6	7	8	9	A	B	C	D	E	F
---------------------------------------------------------------------
0000										\t	\n	\v	\f	\r
0020		!	"	#	$	%	&	'	(	)	*	+	,	-	.	/
0030	0	1	2	3	4	5	6	7	8	9	:	;	<	=	>	?
0040	@	A	B	C	D	E	F	G	H	I	J	K	L	M	N	O
0050	P	Q	R	S	T	U	V	W	X	Y	Z	[	\	]	^	_
0060	`	a	b	c	d	e	f	g	h	i	j	k	l	m	n	o
0070	p	q	r	s	t	u	v	w	x	y	z	{	|	}	~
0080						nel
00A0	nbsp

00B0	°	±	²	³	´	µ	¶	·	¸	¹	º	»	¼	½	¾	¿

00C0	À	Á	Â	Ã	Ä	Å	Æ	Ç	È	É	Ê	Ë	Ì	Í	Î	Ï
00D0	Ð	Ñ	Ò	Ó	Ô	Õ	Ö	×	Ø	Ù	Ú	Û	Ü	Ý	Þ	ß
00E0	à	á	â	ã	ä	å	æ	ç	è	é	ê	ë	ì	í	î	ï
00F0	ð	ñ	ò	ó	ô	õ	ö	÷	ø	ù	ú	û	ü	ý	þ	ÿ
0100	Ā	ā	Ă	ă	Ą	ą	Ć	ć	Ĉ	ĉ	Ċ	ċ	Č	č	Ď	ď
0110	Đ	đ	Ē	ē	Ĕ	ĕ	Ė	ė	Ę	ę	Ě	ě	Ĝ	ĝ	Ğ	ğ
0120	Ġ	ġ	Ģ	ģ	Ĥ	ĥ	Ħ	ħ	Ĩ	ĩ	Ī	ī	Ĭ	ĭ	Į	į
0130	İ	ı	Ĳ	ĳ	Ĵ	ĵ	Ķ	ķ	ĸ	Ĺ	ĺ	Ļ	ļ	Ľ	ľ	Ŀ
0140	ŀ	Ł	ł	Ń	ń	Ņ	ņ	Ň	ň	ŉ	Ŋ	ŋ	Ō	ō	Ŏ	ŏ
0150	Ő	ő	Œ	œ	Ŕ	ŕ	Ŗ	ŗ	Ř	ř	Ś	ś	Ŝ	ŝ	Ş	ş
0160	Š	š	Ţ	ţ	Ť	ť	Ŧ	ŧ	Ũ	ũ	Ū	ū	Ŭ	ŭ	Ů	ů
0170	Ű	ű	Ų	ų	Ŵ	ŵ	Ŷ	ŷ	Ÿ	Ź	ź	Ż	ż	Ž	ž

2010	‐	‑	‒	–	—	―			‘	’	‚	‛	“	”
2020									ls	ps

2070	⁰	ⁱ			⁴	⁵	⁶	⁷	⁸	⁹	⁺	⁻	⁼	⁽	⁾	ⁿ
2080	₀	₁	₂	₃	₄	₅	₆	₇	₈	₉	₊	₋	₌	₍	₎	 
2090	ₐ	ₑ	ₒ	ₓ	ₔ	ₕ	ₖ	ₗ	ₘ	ₙ	ₚ	ₛ	ₜ

2100	℀	℁	ℂ	℃	℄	℅	℆	ℇ	℈	℉	ℊ	ℋ	ℌ	ℍ	ℎ	ℏ

2160	Ⅰ	Ⅱ	Ⅲ	Ⅳ	Ⅴ	Ⅵ	Ⅶ	Ⅷ	Ⅸ	Ⅹ	Ⅺ	Ⅻ	Ⅼ	Ⅽ	Ⅾ	Ⅿ
2170	ⅰ	ⅱ	ⅲ	ⅳ	ⅴ	ⅵ	ⅶ	ⅷ	ⅸ	ⅹ	ⅺ	ⅻ	ⅼ	ⅽ	ⅾ	ⅿ

*/
const invalidEnglishRegex = /[^\u0021-\u007E\s\u00C0-\u017E\u2010-\u2015\u2018-\u201A\u201C-\u201D\u2070-\u209C\u2160-\u217F°℃℉]/gi;
const invalidEnglishString = "[^\\u0021-\\u007E\\s\\u00C0-\\u017E\\u2010-\\u2015\\u2018-\\u201A\\u201C-\\u201D\\u2070-\\u209C\\u2160-\\u217F°℃℉]";
// String 타입에 빌더형으로 사용가능한 함수 정의
(function(window, str) {
	window.REGEX_VALID_SENTENCE_START = /^(["'(]|("'))?[A-Z0-9]/;
	window.REGEX_STR_VALID_SENTENCE_END = '("?[.?!](\'|\'")?|\'?[.?!]("|"\')?)$';

	const REGEX_FIX_COMMAS = /\s*([‚،﹐﹑，､])/,
		REGEX_FIX_QUOTES = /([“‟”„″‶❝❞〝〞＂]|'')/,
		REGEX_FIX_APOSTROPHES = /([´＇｀`‘’‛′‵❛❜])/,
		REGEX_FIX_HYPHENS = /([−–‒­])/,
		REGEX_FIX_DASHES = /([─―])/,
		REGEX_FIX_BEFORE_PUNCTUATION = /\s+([,.!?:;]+)/,
		REGEX_FIX_AFTER_PUNCTUATION = /((?:\w[!?;]\w+|[A-z][:,]\w+|[0-9][:,][A-z]+)|(?:(?:\w[!?;]\w+|[A-z][:,]\w+|[0-9][:,][A-z]+)|(?:[A-z]\.(?:[A-Z][A-z]{1,}|\d+|I'[a-z]+))|\d\.[A-Z][A-z]*) )/,
		REGEX_FIX_CONTRACTIONS = /(?:('\s+|\s+')((?:s|re|m|d|t|ll|ve)\s))/;		
		
	const REGEX_FIX_TOTAL = new RegExp([REGEX_FIX_COMMAS,REGEX_FIX_QUOTES,REGEX_FIX_APOSTROPHES,REGEX_FIX_HYPHENS,REGEX_FIX_DASHES,REGEX_FIX_BEFORE_PUNCTUATION,REGEX_FIX_AFTER_PUNCTUATION,REGEX_FIX_CONTRACTIONS].map(part => part.source).join('|'));
	/**
	 * 문자열의 내용 중 [‘],[’],[‚],[“],[”]와 같이 특수한 유니코드값을 ASCII 문자로 대체하여 반환
	 * (추가: [ ],[&nbsp;])
	 * 
	 * @author 강한별 
	 * @version 2.0 by LGM
	 */
	str.quoteNormalize = function() {
		return this.replace(new RegExp(REGEX_FIX_QUOTES, 'g'), "\"") // 큰따옴표
			.replace(new RegExp(REGEX_FIX_APOSTROPHES, 'g'), "'") // 작은따옴표
			.replace(new RegExp(REGEX_FIX_COMMAS, 'g'), ",") // 쉼표
			.replace(/[\u00A0\u2000-\u200B\u202F\u205F]/gi, " ") // 공백
			.replace(new RegExp(REGEX_FIX_HYPHENS, 'g'), '-') // 하이픈 및 en dash
			.replace(new RegExp(REGEX_FIX_DASHES, 'g'), '—'); // 표 그리기 기호(─) 및 수평바(―)를 em dash(—)로
	};

	// 첫 글자를 대문자로
	str.capitalize1st = function() {
		return this.charAt(0).toUpperCase() + this.slice(1);
	};

	/** 문자열을 정규화된 영어 문장 배열로 반환
	 @deprecated sbd 라이브러리 사용
	*/
	str.parseToSentences = function() {
		return this.quoteNormalize().concatLines().insertSpace().shrinkSpaces().splitSentences();
	};
	// 줄바꿈은 이어붙임
	// 2022.1.1 지시: 엔터키는 띄어쓰기로 치환
	str.concatLines = function() {
		return this.replace(/[\r\n]/g, ' ').trim();
	};
	// 문장의 끝으로 보이는 단어에 뒤이어 대문자로 시작하면 ' '을 사이에 추가
	str.insertSpace = function() {
		return this.replace(/(\b[a-z]\w*\W)([A-Z]\w*)/g, '$1 $2')
	};
	// 1개 이상의 연속된 공백문자는 하나의 ' '으로
	// 2022.6.3 : 구두점 앞의 공백은 없애기
	str.shrinkSpaces = function() {
		return this.replace(/\s+/g, ' ').replace(new RegExp(REGEX_FIX_BEFORE_PUNCTUATION, 'g'), '$1');
	};
	// 하나의 정규화된 영어 문장으로 반환
	str.sentenceNormalize = function() {
		return this.quoteNormalize().concatLines().shrinkSpaces().capitalize1st();
	}

	const REGEX_LF = /(?<!\r)\n/mg;
	/**
	 * @description	\n문자가 서버를 통해 MySQL 레코드로 등록되는 과정에 \r\n으로 바뀌는 것을 염두하여
	 * 				미리 \r\n으로 바뀌었을 때의 문자열 길이를 파악하기 위한 함수
	 * @author LGM
	 */
	str.lf2crlf = function() {
		return this.replace(REGEX_LF, '\r\n');
	}
	
	window.wrapQuotes = function(sentences) {
		const fullText = sentences.join(' ');
		// 시작하는 따옴표 모음(인용문, 대화, 축약어, 강조 등 모두 포함)
		const quoteOpenings = Array.from(fullText.matchAll(/((?<![^\s"])(?<="?)'(?=[^'\s\t\b]+))|((?<![^\s'])(?<='?)"(?=[^"\s\t\b]+))/gm)).map(matched => ({type: 'open', text: matched[0], index: matched.index}));
		// 끝나는 따옴표 모음(인용문, 대화, 축약어, 강조 등 모두 포함)
		const quoteClosings = Array.from(fullText.matchAll(/(?<=[^"'\s\t\b]"?)'(?!\w)|(?<=[^"'\s\t\b]'?)"(?!\w)/gm)).map(matched => ({type: 'close', text: matched[0], index: matched.index}));
		
		const totalQuotes = quoteOpenings.concat(quoteClosings);
		// 위치 기준으로 정렬
		totalQuotes.sort((a, b) => a.index - b.index);
		// 시작 따옴표 없이 바로 끝 따옴표가 나오면 제외
		while(totalQuotes.length > 0 && totalQuotes[0].type == 'close') totalQuotes.shift();
		// 최소 한 쌍(2개)의 따옴표가 없으면 입력문장 그대로 반환 
		if(totalQuotes.length < 2) return sentences;
		
		const quoteStack = [];
		if(totalQuotes[0].type == 'open') quoteStack.push(totalQuotes.shift());
		
		const wrappedSentences = [];
		let index = 0;
		sentences.forEach(sentence => {
			let wrappedSentence = '';
			
			// 따옴표쌍 속에서 다시 시작 따옴표가 발견될 때 quoteStack에 담기
			// (따옴표쌍이 최대 이중으로 겹친다고 가정)
			if(totalQuotes.length > 0 && totalQuotes[0].type == 'open' && totalQuotes[0].index < index + sentence.length) {
				quoteStack.push(totalQuotes.shift());
			}
			// 한 문장 안에서 따옴표 쌍이 온전히 존재할 경우 통과 
			while(quoteStack.length > 0 && totalQuotes.length > 0 && totalQuotes[0].type == 'close' 
			&& quoteStack.slice(-1)[0].text == totalQuotes[0].text 
			&& index <= quoteStack.slice(-1)[0].index && totalQuotes[0].index <= index + sentence.length) {
				quoteStack.pop();
				totalQuotes.shift();
				while(totalQuotes.length > 0 && totalQuotes[0].type == 'open') {
					quoteStack.push(totalQuotes.shift());
				}
			}
			// 이 문장이 따옴표쌍의 밖에 있거나 따옴표쌍이 없을 경우 문장 그대로.
			if(quoteStack.length == 0 || totalQuotes.length  == 0 
			|| quoteStack.slice(-1)[0].index > index + sentence.length
			|| totalQuotes[0].index < index) {
				wrappedSentences.push(sentence);
			}
			else {
				// 이 문장이 포함되는 따옴표쌍의 시작점이 문장 이전에 나왔을 경우 이 문장의 시작에도 따옴표를 추가
				if(quoteStack.slice(-1)[0].index < index && totalQuotes.length > 0) {
					wrappedSentence += quoteStack.slice(-1)[0].text;
				}
				// 문장의 내용 추가
				wrappedSentence += sentence;
				
				// 이 문장이 포함되는 따옴표쌍의 끝점이 문장 이후에 있을 경우 이 문장의 끝에도 따옴표를 추가
				if(quoteStack.slice(-1)[0].index< index + sentence.length && totalQuotes.length > 0
				&& index + sentence.length < totalQuotes[0].index) {
					wrappedSentence += quoteStack.slice(-1)[0].text;
				}
				
				// 따옴표쌍의 끝점이 발견되면 따옴표쌍을 통과 처리
				while(totalQuotes.length > 0 && totalQuotes[0].type == 'close'
				// 따옴표쌍 끝점이 문장의 내에 존재	
				&& totalQuotes[0].index < index + sentence.length) {
					// 따옴표쌍의 끝점이 시작점과 동일한 따옴표
					if(totalQuotes[0].text == quoteStack.slice(-1)[0].text) {
						quoteStack.pop();
						totalQuotes.shift();
					}
					// 축약 등의 역할을 하는 '아포스트로피'로 취급 -> 통과하고 넘어가기
					else {
						totalQuotes.shift();
					}
					while(totalQuotes.length > 0 && totalQuotes[0].type == 'open')
						quoteStack.push(totalQuotes.shift());
				}
				wrappedSentences.push(wrappedSentence);
			}
			
			index += 1 + sentence.length;
		});
		
		return wrappedSentences;
	}

	/** 입력란에 교정을 적용하고, 변경된 부분을 강조 표시
	@param input 입력 문자열
	@param inputCursor 텍스트 커서 위치
	@returns input, inputCursor, arr 변경된 문자열 및 커서 위치, 강조표시(highlight)에 인자로 적용할 배열(Array<{highlight:Array<Number>}>)
	 */
	window.extractHighlightInfo = function(input, inputCursor) {
		let i = 0, // 8개 패턴 iterator 
			arr = [], // 강조표시 배열
			match; // 매칭결과(재사용)
		// 1. 공백과 구두점, 따옴표 교정
		// 정규식에 걸리지 않을 때까지 재검사
		
		while ((match = REGEX_FIX_TOTAL.exec(input)) != null) {
			for (i = 1; i < 9; i++) {
				if (match[i] != null) {
					switch (i) {
						case 1: // 비정규화된 콤마를 ASCII 콤마로
							if (inputCursor >= match.index) inputCursor -= (match[0].length - 1);
							arr.push({ highlight: [match.index, match.index + 1] });
							input = input.replace(REGEX_FIX_COMMAS, ',');
							break;
						case 2: // 비정규화된 쌍따옴표를 ASCII 쌍따옴표로
							arr.push({ highlight: [match.index, match.index + 1] });
							input = input.replace(REGEX_FIX_QUOTES, '"');
							break;
						case 3: // 비정규화된 홑따옴표를 ASCII 홑따옴표로
							arr.push({ highlight: [match.index, match.index + 1] });
							input = input.replace(REGEX_FIX_APOSTROPHES, '\'');
							break;
						case 4:	// 비정규화된 (짧은) 대쉬를 ASCII 하이픈으로
							arr.push({ highlight: [match.index, match.index + 1] });
							input = input.replace(REGEX_FIX_HYPHENS, '-');
							break;
						case 5: // 수평바 기호 '―' 및 문장에서 등장할 일이 없는 표 그리기 기호 '─'는 em dash '—'로
							arr.push({ highlight: [match.index, match.index + 1] });
							input = input.replace(REGEX_FIX_DASHES, '—');
							break;
						case 6: // 구두점 앞의 하나 이상의 공백은 생략
							if (inputCursor >= match.index) inputCursor -= (match[0].length - 1);
							arr.push({ highlight: [match.index, match.index + 2] });
							input = input.replace(REGEX_FIX_BEFORE_PUNCTUATION, match[i]);
							break;
						case 7: // 구두점 뒤의 영문자(숫자 및 알파벳)가 오면 반드시 구두점 뒤에서 한 칸 띄우도록 (p.m. 형태나 1970.1.1 형태는 무시)
							if (inputCursor >= match.index + 1) inputCursor += 1;
							arr.push({ highlight: [match.index + 2, match.index + 3] });
							input = input.replace(REGEX_FIX_AFTER_PUNCTUATION, `${match[i].substring(0, 2)} ${match[i].substring(2)}`)
							break;
						case 8: // 아포스트로피 역할의 홑따옴표와 앞뒤문자 사이에는 공백 생략
							if (inputCursor >= match.index) inputCursor -= (match[0].length - 1 - match[i].length);
							arr.push({ highlight: [match.index, match.index + match[i].length] });
							input = input.replace(REGEX_FIX_CONTRACTIONS, '\'$2');
							break;
					}
					break;
				}
			}
		}
		// 3. 비정규 문자들(보이지 않는 문자 포함)을 × 문자로 치환
		input = input.replaceAll(invalidEnglishRegex, '×');
		return { input, inputCursor, arr };
	}

	/**
	 * 두 문장 간의 유사도 계산. (일부 단어들의 순서만 뒤바뀐 경우 1이 나오기도 함)
	 */
	window.sentenceSimilarity = function(sentence1, sentence2) {
		function textToVector(text) {
			const words = text.match(/\b\w+\b/g); // 여기에서 split을 match로 교체
			const frequencyMap = {};
			words.forEach(word => {
				if (!frequencyMap[word]) {
					frequencyMap[word] = 0;
				}
				frequencyMap[word]++;
			});
			return frequencyMap;
		}

		function dotProduct(vec1, vec2) {
			let product = 0;
			for (const key in vec1) {
				if (vec1.hasOwnProperty(key) && vec2.hasOwnProperty(key)) {
					product += vec1[key] * vec2[key];
				}
			}
			return product;
		}

		function magnitude(vec) {
			let sum = 0;
			for (const key in vec) {
				if (vec.hasOwnProperty(key)) {
					sum += vec[key] * vec[key];
				}
			}
			return Math.sqrt(sum);
		}

		function cosineSimilarity(vec1, vec2) {
			return dotProduct(vec1, vec2) / (magnitude(vec1) * magnitude(vec2));
		}

		const vec1 = textToVector(sentence1);
		const vec2 = textToVector(sentence2);
		return cosineSimilarity(vec1, vec2);
	};


	function moveOffsetsInArray(arr, until, compareIndex, offset) {
		arr.forEach((v, i, array) => {
			if (i >= until) return;
			if (v.highlight[0] >= compareIndex) v.highlight[0] += offset;
			if (v.highlight[1] >= compareIndex) v.highlight[1] += offset;
			arr[i] = v;
		});
	}
}(this, String.prototype));
