/**
 * HTML5 기능인 canvas.measureText를 사용하여 주어진 텍스트의 가로길이(px단위)를 계산하여 반환
 * (예: 글자수에 따른 단어 선택지 크기를 계산하여 표시할 갯수 지정.)
 * 
 * @param {String} text 화면에 표시할 텍스트 내용
 * @param {String} font 텍스트에 지정된 폰트 css (e.g. "19px Nunito Sans").
 * 
 * @see http://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
 * test?
 */
window.getTextWidth = function(text, font) {
    // getTextWidth.canvas가 없으면 생성, 있으면 재사용
    const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    context.font = font;
    return context.measureText(text).width;
};

/**
 * 문자열의 내용 중 [‘],[’],[‚],[“],[”]와 같이 특수한 유니코드값을 ASCII 문자로 대체하여 반환
 * (추가: [ ],[&nbsp;])
 * 
 * 1. 큰따옴표 
 * '\u201c'[“] '\u201f'[‟]  '\u201d'[”] '\u201e'[„]
 * '\u2033'[″] '\u2036'[‶]  '\u275d'[❝] '\u275e'[❞]
 * '\u301d'[〝] '\u301e'[〞] '\uff02'[＂]
 * 
 * 2. 작은따옴표 
 * '\u2018'[‘] '\u2019'[’]  '\u201b'[‛]
 * '\u2032'[′] '\u2035'[‵]  '\u275b'[❛] '\u275c'[❜]
 * 
 * 3. 쉼표 
 * '\u201A'[‚] '\u060C'[،]  '\uFE50'[﹐] '\uFE51'[﹑]
 * '\uFF0C'[，] '\uFF64'[､]
 * 
 * 4. 공백 
 * '\u00A0' '&nbsp'
 * 
 * @author 강한별 
 */
window.replaceQuotes = function(content) {
	return content.replace(/“|‟|”|„|″|‶|❝|❞|〝|〞|＂/gi, "\"")
				.replace(/‘|’|‛|′|‵|❛|❜/gi, "'")
				.replace(/‚|،|﹐|﹑|，|､/gi, ",")
				.replace(/\u00A0/gi, " ");
}
