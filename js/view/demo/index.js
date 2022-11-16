/** /demo/index.html
 * @author LGM
 */
function pageinit(){
	
	// [분석 횟수를 확인 후 분석 실행 가능여부 판단]
	const reqCount = parseInt(Cookies.get('BRLT') || 0);
	const fullCount = 300;
	const maxChars = fullCount - reqCount;
	
	if( maxChars <= 0) {
		$('#text').prop('placeholder', '금일 사용량을 모두 소진했습니다. 내일 다시 찾아와 주세요.')
				  .prop('disabled', true)
				  .addClass('disabled-textarea');
				  
	}else {
		$('.demo-counter').text(`0/${maxChars}`)
		$('#text').attr('maxlength', maxChars).prop('placeholder', `하루에 300자까지 분석할 수 있습니다. (금일 사용량 ${reqCount}/${fullCount}자)`);
	}
	
	// [예문 자동 교체]
	const $examples = $('.input-example-section .example-unit');
	let exampleNum = Math.floor(Math.random() * 5.99);
	function changeExample() {
	   let $example = $examples.eq(exampleNum);
	   $example.css('z-index', 1).css('opacity','0').fadeTo(200, 1, () => {
	      setTimeout(() => {
	         $example.fadeTo(0, 0, () => {
	            $example.css('z-index','auto');
	            exampleNum = (exampleNum + 1) % 6;
	            changeExample();
	         });
	      }, 8000);
	   });
	}
	changeExample();
	if(maxChars <= 0) return; // 이하 함수 정의 무시
/*∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨∨*/
	
	//[분석 아이콘 클릭 - 실행]
	$('.input-form-section .search-btn').click(function(){
		const $textarea = $('#text');
		if(parseInt(Cookies.get('BRLT') || 0) >= fullCount) {
			this.classList.add('disabled');
			$textarea.val(null)
					 .prop('placeholder', '금일 사용량을 모두 소진했습니다. 내일 다시 찾아와 주세요.')
					 .prop('disabled', true)
					 .addClass('disabled-textarea');
			return;
		}
		const text = $textarea.val().trim().quoteNormalize().replace(/[A-Za-z0-9]/, l => l.toUpperCase());
		
		$textarea.val(text);
		/*if(!(/^["']?[A-Z0-9]+/.test(text) && new RegExp('[\.\?\!]["\']?$').test(text))) {
			alert('대/소문자, 구두점 등을 확인해 주세요.');
			return;
		}*/
		$('#beforeSubmitModal').modal('show');
	}); 
	$('.js-submit-btn').click(function() {
		const $textarea = $('#text');
		// 공백 줄이고, 구두점으로 끝나는지 검사
		const text = $textarea.val().trim().quoteNormalize().shrinkSpaces().capitalize1st();
		$('#hiddenText').val(text);
		$textarea.val(null);
		$('.addForm').submit();
	});
	
	// [샘플 문장 클릭 시 입력폼에 자동 입력]
	$('.example-unit').click(function() {
		const sentence = this.querySelector('.sentence').innerText;
		$('#text').val(sentence).trigger('input');
	});
	
	// [입력폼 글자수 카운트]
	let textTooltip; // 입력 힌트
	$('#text').on('input', function() {
		const validateResult = replaceAndHighlights();
		
		const text = this.value.trim().quoteNormalize(), textLen = text.length;
		
		$('.demo-counter').text(`${textLen}/${maxChars}`); // 글자수 표시
		$('.reset-textarea').toggle(textLen > 0); // 지우기 버튼 표시/미표시
		
		const invalid = validateResult[0] || textLen == 0;
		$('.invalid-input-warning').toggle(validateResult[0]); // 비 영문자 안내
		$('.corrected-input-info').toggle(validateResult[1]); // 교정 안내
		$('.input-form-section .search-btn').toggleClass('disabled', invalid); // 실행 버튼 활성/비활성화
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
		if(invalid) {
			(textTooltip || (textTooltip = new bootstrap.Tooltip(this, {
				title: `영어 문장을 ${maxChars}자 이내로 입력하세요.`,
				customClass: 'demo-text-invalid',
				offset: ({placement}) => {
					if(placement == 'top') {return [100,0];}
					else {return [0,0];}
				}}))).enable();
			textTooltip.show();
		} else {
			if(textTooltip != null) {
				textTooltip.hide();
				textTooltip.disable();
			}
		}
	})// [붙여넣기로 입력 시]
	.on('paste', function(e) {
	    const clipboardData = e.originalEvent.clipboardData || window.clipboardData;
	    const pastedLength = (clipboardData.getData('Text') || '').length;
	    
	    /* 최종길이(입력된 문장 총 길이 - 블록지정된 문자열 길이 + 붙여넣으려는 문자열 길이)가 최대길이를 넘는지 검사 */
	    if(this.value.length - getSelection().toString().length + pastedLength > maxChars) {
			$('#warnLength').modal('show');
	    }
	});
	
	function replaceAndHighlights() {
		let input = $('#text').val();
		let selectionStart = $('#text')[0].selectionStart;
		//---------------------------------------------------------
		const result = extractHighlightInfo(input, selectionStart);
		//---------------------------------------------------------
		$('#text').val(result.input);
		$('#text').highlightWithinTextarea({highlight: [
			{className: 'bg-fc-yellow', highlight: ['×']},
			{className: 'bg-fc-purple corrected', highlight: result.arr}]})
		$('#text').focus()[0].setSelectionRange(result.inputCursor, result.inputCursor);
		return [ result.input.includes('×'), result.arr.length > 0 ];
	}
	$('.addForm').on('reset', function() {
		$('.demo-counter').text(`0/${maxChars}`);
		if(textTooltip != null) {
			textTooltip.hide(); // 입력 힌트 숨김
			textTooltip.disable();
		}
		$('#text').focus();
		$('.reset-textarea').hide(); // 지우기 버튼 숨김
		$('.input-form-section .search-btn').addClass('disabled'); // 실행 버튼 비활성화
	})
	
	// [분석 실행시 로딩 이미지]
	$('.addForm').on('submit', function() {
		$('lottie-player:visible').each((_i,el) => {
			el.stop();
		});
		$('#loadingModal').modal('show');
	})
	
}
