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
2010									‘	’	‚	‛	“	”
2020									ls	ps
*/
const invalidEnglishRegex = /[^\u0021-\u007E\s\u2018-\u201A\u201C-\u201D]/gi;
const invalidEnglishString = "[^\u0021-\u007E\s\u2018-\u201A\u201C-\u201D]";
// String 타입에 빌더형으로 사용가능한 함수 정의
(function(window,str) {
	/**
	 * 문자열의 내용 중 [‘],[’],[‚],[“],[”]와 같이 특수한 유니코드값을 ASCII 문자로 대체하여 반환
	 * (추가: [ ],[&nbsp;])
	 * 
	 * @author 강한별 
	 * @version 2.0 by LGM
	 */
	str.quoteNormalize = function() {
	  return this.replace(/[“‟”„″‶❝❞〝〞＂]/gi, "\"") // 큰따옴표
				 .replace(/[´＇｀`‘’‛′‵❛❜]/gi, "'") // 작은따옴표
				 .replace(/[‚،﹐﹑，､]/gi, ",") // 쉼표
				 .replace(/\u00A0/gi, " "); // 공백
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
	  return this.replace(/[\r\n]/g,' ').trim();
	};
	// 문장의 끝으로 보이는 단어에 뒤이어 대문자로 시작하면 ' '을 사이에 추가
	str.insertSpace = function() {
	  return this.replace(/(\b[a-z]\w*\W)([A-Z]\w*)/g,'$1 $2')
	};
	// 1개 이상의 연속된 공백문자는 하나의 ' '으로
	// 2022.6.3 : 구두점 앞의 공백은 없애기
	str.shrinkSpaces = function() {
	  return this.replace(/\s+/g, ' ').replace(/\s+([,.?!;:]+)/g, '$1');
	};
	// 하나의 정규화된 영어 문장으로 반환
	str.sentenceNormalize = function() {
	  return this.quoteNormalize().concatLines().shrinkSpaces().capitalize1st();
	}
	/**
	// 문장 구분 지점을 기준으로 문장 자르기(출처: https://regex101.com/r/nG1gU7/1173)
	// 설명: 공백문자 앞의 글자가 p.m.이나 a.m. 혹은 Mr.나 Dr. 같은 형태가 아닌 구두점(.!?)이면 문장의 끝으로 인식.
	// #이슈: 얼마든지 규격 외의 약자나 호칭 줄임말 등이 있을 수 있다. 
	@deprecated sbd 라이브러리 사용
	 */
	str.splitSentences = function() {
	  try {
		return this.split(new RegExp(`(?<!\\w\\.\\w.)(?<![A-Z][a-z]\\.)(?<! [A-Z]\\.)(?<=[\\.\\!\\?"])\\s`,'gm'));  
	  } catch (e) {
		console.warn('This browser does not support the RegExp "(?<=X)" and "(?<!X)", so it takes longer than other browsers...');
		if(!this.match(/\s/)) return [this];
		const sentences = [];
		let start = 0, ends = this.matchAll(/\s/gm);
		// lookbehind 정규식 동작을 스크립트로 구현
		for(let point of ends) {
		  const prev = this.charAt(point.index - 1);
		  if(/[\.\!\?]/.test(prev) && !(/\w\.\w./.test(prev) || /[A-Z][a-z]\./.test(prev) || / [A-Z]\./.test(prev))) {
			sentences.push(this.substring(start, point.index));
			start = point.index + 1;
		  } else continue;
		}
		if(start <= this.length + 1) {
		  sentences.push(this.substring(start));
		}
		return sentences;
	  }
	};
	// 유효한 하나의 영어 문장인지 검사
	str.isSentence = function() {
	  try {
		return /[A-Z\d'"]/.test(this.charAt()) && (this.match(new RegExp(`(?<!\\w\\.\\w.)(?<![A-Z][a-z]\\.)(?<=[\\.\\!\\?])`,'g'))?.index == this.length);
	  } catch(e) {
		console.warn('This browser does not support the RegExp "(?<=X)" and "(?<!X)", so it takes longer than other browsers...');
		if(/[A-Z\d'"]/.test(this.charAt()) && /[\.\?\!]['"]?$/.test(this)) {
		  const puncts = this.matchAll(/\S+[\.\?\!]['"]?/g);
		  for(let punct of puncts) {
			
			if(!(/\w\.\w.$/.test(punct[0]) || /[A-Z][a-z]\.$/.test(punct[0]))) {
			  return (punct.index + punct[0].length == this.length);
			}
		  }
		  return false;
		} else return false;
	  }
	};
	
	/** 입력란에 교정을 적용하고, 변경된 부분을 강조 표시
	 */
	window.extractHighlightInfo = function(input, inputCursor) {
		let i = 0, arr = [], match;
		// 1. 공백과 구두점, 따옴표 교정
		while((match = /\s*([‚،﹐﹑，､])|([“‟”„″‶❝❞〝〞＂])|([´＇｀`‘’‛′‵❛❜])|(\s{2,})|\s+([,.!?:;])|([,.!?:;]\w)|(?:'\s+((?:s|re|m|d|t|ll|ve)\s))/.exec(input)) != null) {
			for(i = 1; i < 8; i++) {
				if(match[i] != null) {
					switch(i) {
						case 1:
							if(inputCursor >= match.index) inputCursor -= (match[0].length - 1);
							arr.push({highlight: [match.index, match.index + 1]});
							input = input.replace(match[0], ',');
							break;
						case 2:
							arr.push({highlight: [match.index, match.index + 1]});
							input = input.replace(match[0], '"');
							break;
						case 3:
							arr.push({highlight: [match.index, match.index + 1]});
							input = input.replace(match[0], '\'');
							break;
						case 4:
							if(inputCursor >= match.index) inputCursor -= (match[0].length - 1);
							arr.push({highlight: [match.index, match.index + 1]});
							input = input.replace(match[0], ' ');
							break;
						case 5:
							if(inputCursor >= match.index) inputCursor -= (match[0].length - 1);
							arr.push({highlight: [match.index, match.index + 2]});
							input = input.replace(match[0], match[i]);
							break;
						case 6:
							if(inputCursor >= match.index) inputCursor -= (match[0].length - 1 - match[i].length);
							arr.push({highlight: [match.index, match.index + 2]});
							input = input.replace(match[0], `${match[i].substring(0,1)} ${match[i].substring(1)}`)
							break;
						case 7:
							if(inputCursor >= match.index) inputCursor -= (match[0].length - 1 - match[i].length);
							arr.push({highlight: [match.index, match.index + 2]});
							input = input.replace(match[0], `'${match[i]}`);
							break;
					}
					break;
				}
			}
		}
		// 2. 인용구 교정(인용부호가 쌍으로 있을 경우만)
		const prevArrLen = arr.length;
		const quotes = input.matchAll(/(["'])((?:\u0021|[\u0023-\u0026]|[\u0028-\u007E]|\s|(?:'(?:s|re|m|d|t|ll|ve)\s))+)\1(?!(?:(?:s|re|m|d|t|ll|ve) ))/g);
		for(const quote of quotes) {
			let substr = '', content = quote[2], lastIndex = quote.index + quote[0].length;
			if(quote.index != 0 && !/\s/.test(input[quote.index - 1])) {
				arr.forEach((v,index) => {
					if(index >= prevArrLen) return;
					if(v.highlight[0] >= quote.index) v.highlight[0]--;
					if(v.highlight[1] >= quote.index) v.highlight[1]--;
				})
				arr.push({highlight: [quote.index, quote.index + 1]});
				if(inputCursor >= quote.index) inputCursor++;
				substr += ' ';
				lastIndex++;
			}
			while(content.startsWith(' ')) {
				arr.forEach((v,index) => {
					if(index >= prevArrLen) return;
					if(v.highlight[0] >= quote.index) v.highlight[0]--;
					if(v.highlight[1] >= quote.index) v.highlight[1]--;
				})
				if(inputCursor >= quote.index) inputCursor--;
				content = content.substring(1);
				lastIndex--;
			}
			while(content.endsWith(' ')) {
				arr.forEach((v,index) => {
					if(index >= prevArrLen) return;
					if(v.highlight[0] >= quote.index + content.length) v.highlight[0]--;
					if(v.highlight[1] >= quote.index + content.length) v.highlight[1]--;
				})
				if(inputCursor > quote.index + content.length) inputCursor--;
				content = content.slice(0, -1);
				lastIndex--;
			}
			substr += quote[1] + content + quote[1];

			if(input[quote.index + quote[0].length] != null && /\s|[,.!?:;]/.test(input[quote.index + quote[0].length]) == false) {
				arr.forEach((v,index) => {
					if(index >= prevArrLen) return;
					if(v.highlight[0] >= lastIndex + 1) v.highlight[0]++;
					if(v.highlight[1] >= lastIndex + 1) v.highlight[1]++;
				})
				arr.push({highlight: [lastIndex, lastIndex + 1]});
				if(inputCursor >= lastIndex + 1) inputCursor++;
				substr += ' ';
			}
			input = input.replace(quote[0], substr);
		}
		// 3. 비정규 문자들(보이지 않는 문자 포함)을 × 문자로 치환
		input = input.replaceAll(invalidEnglishRegex, '×');
		return {input, inputCursor, arr};
	}
}(this,String.prototype));
