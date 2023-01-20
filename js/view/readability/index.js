/** redability/index.html
 * @author LGM
 */
(function () {
	// 입력 텍스트 유효성 검사
	let textTooltip;
	$(document).on('input', '#newPassageText', function(e, manual) {
		const validateResult = replaceAndHighlights();
		const text = this.value.trim().quoteNormalize(), textLen = text.length;
		anime({
			targets: '.hwt-backdrop mark.corrected',
			keyframes: [
				{opacity: 0, easing: 'linear'},
				{opacity: 1, easing: 'linear'},
				{opacity: 0, easing: 'linear'},
				{opacity: 1, easing: 'linear'},
				{opacity: 0, duration: 1000, easing: 'cubicBezier(.7, .0, 1.0, 0.3)'},
				{display: 'none', easing: 'steps(1)'}
			],
		})
		// 입력어가 유효한 글자로 제한량 이하일 경우
		if(!validateResult[0]) {
			// 입력어가 없으면 검색버튼 비활성화
			$('#inputComplete').attr("disabled", (textLen == 0));
			textTooltip?.hide();
			textTooltip?.disable();
			$(this).trigger('keydown');
		} else {
			(textTooltip || (textTooltip = new bootstrap.Tooltip(this, {
				title: '영어 문장을 입력하세요.',
				trigger: 'manual', customClass: 'text-invalid',
				offset: ({placement,refer,popper}) => {
					if(placement == 'top') return [100,0];
					else return [0,0];
				}}))).enable();		
			textTooltip.show();	
			$('#inputComplete').attr("disabled", true);
		}
	}).on('click', '#inputComplete', function() {
		const textarea = $('#newPassageText').get(0);
		const sentences = tokenizer.sentences(textarea.value.sentenceNormalize());		
		const total = sentences.join(' ');
		textarea.value = total;
		let checkingPos = 0;
		// 입력된 문장들 각각을 검사.
		for(let i = 0, len = sentences.length; i < len; i++) {
			const tempSentence = sentences[i];
			if(!(/^["']?[A-Z0-9]+/.test(tempSentence))) {
				alertModal(`${i + 1}번째 문장을 다시 확인해 주세요.\n문장의 시작은 영문대문자나 숫자 혹은 따옴표(" ')여야 합니다.\n문장 내용은 아래와 같습니다.\n\n${tempSentence}`, 
					() => textarea.focus());
				textarea.focus();
				textarea.setSelectionRange(checkingPos, checkingPos + tempSentence.length);
				return;					
			}else if(!new RegExp('[\.\?\!]["\']?$').test(tempSentence)) {
				alertModal(`${i + 1}번째 문장을 다시 확인해 주세요.\n문장의 끝은 구두점(. ? !)이나 따옴표(" ')여야 합니다.\n문장 내용은 아래와 같습니다.\n\n${tempSentence}`,
					() => textarea.focus());
				textarea.focus();
				textarea.setSelectionRange(checkingPos, checkingPos + tempSentence.length);
				return;
			}
			checkingPos += tempSentence.length + (i<len-1?1:0);
		}
		confirmModal('입력하신 문장이 다음과 같습니다.\n문장 수가 맞지 않다면 \'취소\'를 누르고 구두점을 추가해 주세요.\n\n'
			.concat(Array.from(sentences, (sentence, i) => `[${i+1}] ${sentence}`).join('\n')),
			() => $('#textForm').submit());
		
	})
	
	function replaceAndHighlights() {
		let input = $('#newPassageText').val();
		let selectionStart = $('#newPassageText')[0].selectionStart;
		//---------------------------------------------------------
		const result = extractHighlightInfo(input, selectionStart);
		//---------------------------------------------------------
		$('#newPassageText').val(result.input);
		$('#newPassageText').highlightWithinTextarea({highlight: [
			{className: 'bg-fc-yellow', highlight: ['×']},
			{className: 'bg-fc-purple corrected', highlight: result.arr}]})
		$('#newPassageText').focus()[0].setSelectionRange(result.inputCursor, result.inputCursor);
		return [ result.input.includes('×'), result.arr.length > 0 ];
	}	
})()
