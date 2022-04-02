/**
 * Google Cloud Vision API를 이용한 이미지로부터 텍스트 추출
 * @author LGM
 */
 
var imgFile2Text = (() => {
	const apiURL = 'https://vision.googleapis.com/v1/images:annotate',
		apiKey = 'AIzaSyDaB537mMH2usYvkbdWDFqkmVkW8D22yE8'; // this API Key works only on fico
		
	function readOCR(file, successCallback, failCallback) {
		if(file.size == 0 || file.size > 20000000) {
			alert(file.size == 0 ? '파일을 선택해 주세요.':'최대 파일 크기는 20MB입니다.');
			return;
		}
		const reader = new FileReader();
		reader.onloadend = function(e) {
			callVision(removePrefix(e.target.result),successCallback, failCallback);
		}
		reader.readAsDataURL(file);
	}
	
	// Cloud Vision ajax 호출
	function callVision(content, successCallback, failCallback) {
		$.post({
			url: `${apiURL}?key=${apiKey}`,
			data: JSON.stringify({requests: [{image: {content}, features: [{type: 'TEXT_DETECTION'}]}]}), 
			contentType: 'application/json'
		}).done(result => successCallback(joinResults(result)))
		.fail(failCallback);
	}
	function removePrefix(imgUri) {
		return imgUri.replace(/data:image\/.+;base64,/, '');
	}
	function joinResults(data) {
		return Array.from(data.responses,r => r.fullTextAnnotation.text).join('\n');
	} 
	
	return readOCR;
})();
