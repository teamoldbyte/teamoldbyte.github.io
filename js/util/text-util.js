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
const invalidEnglishRegex = /[^(\u0020-\u007F|\u000A|\u000C|\u000D|\u0085|\u00A0|\u2028|\u2029|\u2018-\u201A|\u201C-\u201D)]/gi;
const invalidEnglishString = "[^(\u0020-\u007F|\u000A|\u000C|\u000D|\u0085|\u00A0|\u2028|\u2029|\u2018-\u201A|\u201C-\u201D)]";
// String 타입에 빌더형으로 사용가능한 함수 정의
(function(str) {
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
	str.shrinkSpaces = function() {
	  return this.replace(/\s+/g, ' ');
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
}(String.prototype));
