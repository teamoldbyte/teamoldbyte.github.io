/** /workbook/add_sentence.html
@author LGM
 */
function pageinit(memberId, isSsam) {
	$(window).on('unload', () => $('#loadingModal').modal('hide'));
	
	const masonryOptsForPassages = { itemSelector: '.passage', columnWidth: '.passage',
			gutter: 10, percentPosition: true, transitionDuration: '0.8s'
		};
	const MAX_SENTENCE_LENGTH = 500,
		MAX_SENTENCE_LENGTH_PER_DAY = 5000, 
		MAX_SENTENCE_LENGTH_PER_DAY_STR = MAX_SENTENCE_LENGTH_PER_DAY.toLocaleString();
	
	const TODAY_DATE = new Date().format('yyyy-MM-dd');
	/**
	myFicoUsage = date : today's date, length: total sentences length of today
	 */
	const MY_FICO_USAGES_KEY = 'MFUSG';

	const encodedData = localStorage.getItem(MY_FICO_USAGES_KEY);
	
	let myFicoUsages = encodedData ? JSON.parse(atob(encodedData)) : {};
	if (myFicoUsages.user == ntoa(memberId) && myFicoUsages.date == TODAY_DATE) {
		_verifyUsageLimit();
	} else {
		// 사용량 정보 객체의 사용자가 불일치하거나 날짜정보가 다르다면 서버로부터 사용량 조회하여 세팅.
		myFicoUsages = { user: ntoa(memberId), date: TODAY_DATE, length: 0};
		$.getJSON('/workbook/passage/usage')
			.done(length => Object.assign(myFicoUsages, { length }))
			.always(() => _verifyUsageLimit());
	}
	
	function _verifyUsageLimit() {
		if(!isSsam && memberId != 15000550 && memberId != 15000590 && myFicoUsages.length >= MAX_SENTENCE_LENGTH_PER_DAY) {
			$('#inputComplete, .ocr-btn').prop('disabled', true);
			$('#newPassageText').prop('disabled', true).addClass('form-control').attr('placeholder', `일일 분석량(${MAX_SENTENCE_LENGTH_PER_DAY_STR}자)을 모두 소진했습니다. 내일 다시 찾아와 주세요.`);
			alertModal(`일일 분석량<span class="text-red-700">(${MAX_SENTENCE_LENGTH_PER_DAY_STR}자)</span>을 모두 <span class="text-red-700">소진</span>했습니다.\n내일 다시 찾아와 주세요.`);
		}
		localStorage.setItem(MY_FICO_USAGES_KEY, btoa(JSON.stringify(myFicoUsages)));
	}
	
	
	// [각 단계별 이동]
	$('[class^=step-] .title-section').on('click', function() {
		$('[class^=step-] .collapse').not($(this).closest('[class^=step-]')
			.find('.collapse').collapse('show')).collapse('hide');
	});
	
	// [문장 자동 완성 / 지문 자동 검색]
	let searchSentence = '', searchingSentenceDone = false, cachedCompletes = {};
	const autocompleteInstance = $('#newPassageText').autocomplete({
		position: {my: 'left+10 top-10'},
    	delay: 300,
    	search: function() {
			const text = this.value.sentenceNormalize(), textLen = text.length;
			// 입력어가 5자 미만 혹은 최대길이를 초과하거나,
			// 특수문자를 포함, 혹은 이전 검색어(입력란의 첫번째 문장)와 차이가 없으면 검색 X
			return !(textLen < 5 || textLen > maxChars
			|| text.match(invalidEnglishRegex)
			|| searchSentence == tokenizer.sentences(text)[0]);
		},
    	source: (request, response) => {
			searchSentence = tokenizer.sentences(request.term.sentenceNormalize())[0];
			if(searchSentence in cachedCompletes) {
				response(cachedCompletes[searchSentence]);
				return;
			}
			$.getJSON('/sentence/search',{eng: searchSentence}, list => {
				searchingSentenceDone = list.length > 0;
				const completes = Array.from(list, sentence => sentence.eng);
				cachedCompletes[searchSentence] = completes;
				response(completes);
			}).fail(() => {
				searchingSentenceDone = false;
				cachedCompletes[searchSentence] = [];
				response([]);
			});
		},
		focus: () => {return false},// 포커싱됐을 때 자동입력 방지
		close: function() { // 자동완성 목록이 닫힐 때 현재 입력 글자 수 카운트
			const textLen = this.value.trim().length;
			$('.demo-counter').text(textLen + '/' + maxChars); // 글자수 표시
			$('.reset-textarea').toggle(textLen > 0); // 지우기 버튼 표시/미표시
		},
		change: function(_event, ui) { // 유효한 선택지를 선택하면 자동입력
		},
		select: function(_event, ui) {
			confirmModal('선택한 문장으로 지문을 검색하시겠습니까?', () =>
				$('#searchBtn').trigger('click', ui.item.value)
			);
			return false;
		}
	}).autocomplete('instance');
	autocompleteInstance._renderItem = function( ul, item ) {
	  const $li = $( "<li>" );
	  if(item.disabled) $li.addClass("ui-state-disabled");
	  $li.append(('<div>'+item.label+'</div>')
	  			.replace(searchSentence, '<span class="bg-fc-yellow">$&</span>'));
	 
	  return $li.appendTo( ul );
	}
	autocompleteInstance._resizeMenu = function() {
		this.menu.element.outerWidth($('#newPassageText').innerWidth());
	};
	
	// [신규 지문 입력 시 비활성화된 등록 버튼 활성화]
	let maxChars = 1000; // default 1000, 피코 추가소모로 500 늘릴 수 있음.
	let textTooltip;
	$(document).on('input', '#newPassageText', function() {
		const validateResult = replaceAndHighlights();
		const text = this.value.trim().quoteNormalize(), textLen = text.length;
		$('.demo-counter').text(textLen + '/' + maxChars);
		$('.reset-textarea').toggle(textLen > 0); // 지우기 버튼 표시/미표시
		$('.invalid-input-warning').toggle(validateResult[0]);
		$('.corrected-input-info').toggle(validateResult[1]);
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
		if(isSsam || (textLen < maxChars && !validateResult[0])) {
			// 입력어가 없으면 검색버튼 비활성화
			$('#inputComplete').attr("disabled", (textLen == 0));
			textTooltip?.hide();
			textTooltip?.disable();
			$(this).trigger('keydown');
		} else {
			(textTooltip || (textTooltip = new bootstrap.Tooltip(this, {
				title: `영어 문장을 ${maxChars}자 이내로 입력하세요.`,
				trigger: 'manual', customClass: 'text-invalid',
				offset: ({placement}) => {
					if(placement == 'top') return [100,0];
					else return [0,0];
				}}))).enable();		
			textTooltip.show();	
			$('#inputComplete').attr("disabled", true);
		}
	});
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
		$('#newPassageText').trigger('focus')[0].setSelectionRange(result.inputCursor, result.inputCursor);
		return [ result.input.includes('×'), result.arr.length > 0 ];
	}
	// 문장 입력 제한 해제
	$('.text-input-container').on('click', function(e) {
		if(e.offsetX < 10) {
			myFicoUsages.length = 0;
			$('.ocr-btn').prop('disabled', false);
			$(this).find('textarea')
				.removeClass('form-control')
				.prop('disabled', false)
				.attr('placeholder', '분석할 영어 문장/지문을 입력하세요.')
				.trigger('input');
			localStorage.setItem(MY_FICO_USAGES_KEY, btoa(JSON.stringify(myFicoUsages)));
			anime({
				targets: $('#newPassageText')[0],
				borderColor: ['#ff0','#585174'],
				duration: 5000
			})
		}
	});	
	
	const ocr = new FicoOCR();
	// 사진파일 입력시 ocr 동작.
	$('#ocrFile').on('input', function() {
		const file = this.files[0];
		if(file == null || file.size == 0) {
			alertModal('선택된 사진이 없습니다.\n앨범에서 사진을 선택해 주세요.');
			return false;
		}
		// OCR 실행
		ocr.readAsPreview(file, text => {
			const textarea = document.getElementById('newPassageText');
			textarea.value = text;
			textarea.scrollTop = 0;
			textarea.setSelectionRange(0,0);
			textarea.focus();
			$(textarea).trigger('input');	
		}, () => alertModal('이미지 인식에 실패했습니다. 입력창에 문장 수동 입력을 해주세요.'));
		
		// 파일 초기화
		this.value = '';
	});

	// [지문 입력 글자 수 증가(TBD:피코 소모를 통해 해제)]
	$('.demo-counter').one('click', function() {
		maxChars += 500;
		textTooltip?.disable();
		textTooltip = null;
		$('#newPassageText').trigger('input');
	})
	
	// [지문 입력 완료]------------------------------------------------------------
	$('#inputComplete').on('click', async function() {
		const textarea = document.getElementById('newPassageText');
		const sentences = tokenizer.sentences(textarea.value.sentenceNormalize());
		if(sentences.length == 1) {
			if($('#askMoreSentenceModal').length == 0) {
				document.body.appendChild(createElement(
					{ "el":"div","id":"askMoreSentenceModal","class":"warning-modal modal fade","children":[
						{"el":"div","class":"modal-dialog modal-md modal-dialog-centered","children":[
							{"el":"div","class":"modal-content","children":[
								{"el":"div","class":"modal-header text-center bg-fc-purple mx-auto w-100","children":[
									{"el":"span", className: 'text-white d-block w-100',"children":[
										"여러 문장을 등록하여 ",
										{"el":"b","class":"text-fc-yellow","textContent":"지문을 관리"},
										"해 보세요."
									]}
								]},
								{"el":"div","class":"modal-body row g-0","children":[
									{"el":"div","class":"logo-section col-6 col-md-3 m-auto pe-md-2 text-center","children":[
										{"el":"img","class":"logo","alt":"logo","src":"https://static.findsvoc.com/images/logo/main_logo_character_anim.svg"}
									]},
									{"el":"div","class":"text-section my-auto pt-2 pt-md-0 ps-md-2 col-md-9","children":[
										{el: 'p', className: 'mb-2', children: [
											"워크북은 사용자에게 학습 응집성을 제공하기 위해 문장을 ",
											{"el":"b","class":"text-fc-red","textContent":"지문단위로 관리"},
											"합니다."
										]},
										{el: 'p', className: 'mb-2', children: [
											"학습목적이나 주제에 맞는 문장들을 미리 준비하여 ",
											{"el":"b","class":"text-fc-red","textContent":"한번에 등록"},
											"하는 것을 추천드립니다."
										]},
										{el: 'p', className: 'mb-2', children: [
											"워크북을 자신의 ",
											{"el":"b","class":"text-fc-red","textContent":"학습 자산"},
											"으로 만들어 보세요."
										]},
										{el: 'p', className: 'mb-4', children: [
											{"el":"span","class":"app-name-text","textContent":"fico"},
											"가 그 가치를 성장시켜 드리겠습니다."
										]},
										{"el": "span", className: 'text-sm text-bluegray-400', textContent: '관리가 불필요한 한 두문장 등록은 헬로북에서도 가능합니다.'}
									]}
								]},
								{ el: 'div', className: 'modal-footer py-0', children: [
									{ el: 'div', className: 'text-center w-100', children: [
										{ el: 'button', type: 'button', className: 'btn btn-fico me-0 w-50', 'data-bs-dismiss': 'modal', textContent: '예(문장 추가 입력)'},
										{ el: 'button', type: 'button', id: 'goOnSearch', className: 'btn btn-outline-fico w-50', 'data-bs-dismiss': 'modal', textContent: '아니오(그대로 분석)', onclick: () => $('#beforeSubmitModal').modal('show')}
									]}
								]}
							]}
						]}
					]}
				));
			}
			$('#askMoreSentenceModal').modal('show');
		}else $('#beforeSubmitModal').modal('show');
	});
	// [(공통)단위 문장 수정]
	$(document).on('input', '.divided-sentence :text', function() {
		const text = this.value.trim().quoteNormalize();
		if(/^["']?[A-Z0-9]+/.test(text) != true) {
			$(this).siblings('.invalid-tooltip').text('문장의 시작은 영문대문자, 숫자 혹은 따옴표(" \')여야 합니다.');
			$(this).addClass('is-invalid');
		}else if(!new RegExp('[\.\?\!]["\']?$').test(text)) {
			$(this).siblings('.invalid-tooltip').text('문장의 끝은 구두점(. ? !) 혹은 따옴표(" \')여야 합니다.');
			$(this).addClass('is-invalid');
		}else $(this).removeClass('is-invalid');
		$('#addBtn').prop('disabled', $('#passageForm .is-invalid').length > 0);
	})
	// [(공통)단위 문장 삭제]
	.on('click', '.js-delete-sentence-btn', function() {
		if($('.edit-passage .divided-sentence').length < 2) {
			alertModal('최소 한 문장은 필요합니다. 처음부터 입력하고 싶으시다면 \'입력 초기화\'를 눌러 주세요');
			return;
		}
		confirmModal('삭제하시겠습니까?', () => {
			$(this).closest('.divided-sentence').fadeOut(function() {
				const $lastInput = $(this).siblings('.divided-sentence').last();
				$(this).remove();
				$lastInput.find(':text').trigger('input')[0].focus();
			});
		});
	})
	// [(공통)단위 문장 추가]
	.on('click', '.js-insert-sentence-btn', async function() {
		const $new = $('#hiddenDivs .divided-sentence').clone();
		$(this).closest('.divided-sentence').after($new);
		await sleep(100);
		$new.fadeIn().find(':text').trigger('input')[0].focus();
	});
	// [지문 검색 버튼 클릭]
	$('#searchBtn').on('click', async function(_e, paramKeyword) {
		const textarea = document.getElementById('newPassageText');
		const sentences = tokenizer.sentences(textarea.value.sentenceNormalize());	
			
			const total = Array.from(sentences, sentence => {
				// 아래와 같은 경우 번호 삭제
				// 426. I was
				// was bored." 427.
				return sentence.replace(/^['"]?[^a-zA-Z]+\. (['"]?[A-Z])/, '$1')
							.replace(/(['"])\s+\d+[?!.]$/, '$1')
			}).filter(sentence => {
				return /[a-zA-Z\s]/.test(sentence);
			});
			let eng = total[0];
			textarea.value = total.join(' ');
			
			// 직접 검색 키워드 넘겨질 경우
			if(paramKeyword != null) {
				eng = paramKeyword;
			}
			else {
				let checkingPos = 0;
				// 입력된 문장들 각각을 검사.
				for(let i = 0, len = total.length; i < len; i++) {
					const tempSentence = total[i];
					const alertAndFocusWrongSentence = (msg) => {
						alertModal(`${i + 1}번째 ${msg}\n문장 내용은 아래와 같습니다.\n${tempSentence}`, () => {
							textarea.focus();
							textarea.setSelectionRange(checkingPos, checkingPos + tempSentence.length);
						})
					}
					if(!isSsam && tempSentence.length > MAX_SENTENCE_LENGTH) {
						alertAndFocusWrongSentence(`문장의 길이가 너무 길어 AI가 더욱 힘들어 합니다.`);
						return;					
					}
					else if(!/^["'(]?[A-Z0-9]/.test(tempSentence)) {
						alertAndFocusWrongSentence(`문장의 시작이 영문대문자나 숫자 혹은 따옴표(" ')가 아닙니다.`);
						return;					
					}
					else if(!new RegExp('[\.\?\!]["\']?$').test(tempSentence)) {
						alertAndFocusWrongSentence(`문장의 끝이 구두점(. ? !)이나 따옴표(" ')가 아닙니다.`);
						return;
					}
					// 가장 긴 문장을 검색문자열로 사용(검색 정확도를 높이기 위함)
					eng = (tempSentence.length > eng.length) ? tempSentence : eng;
					checkingPos += tempSentence.length + (i<len-1?1:0);
				}
				// 유효한 제시어를 무시한 경우 3단계로 이동
				if(searchingSentenceDone) {
					$('#text').val(textarea.value);
					$('.search-result-section .list-group-item').removeClass('active');
					$('.step-2').addClass('opacity-50 pe-none');
					$('.step-3').removeClass('opacity-50 pe-none');
					$('.step-1 .collapse,.step-3 .collapse').collapse('toggle');
					//$('#editPassage, .edit-passage').hide();
					//$('.final-pssage').show();
					displaySentences(Array.from(total, s => {return {eng: s}}))	
					return;		
				}
			}
			$('.search-sentence').text(eng);
			// 지문 검색(ajax)--------------------------------------------
			$.getJSON('/workbook/passage/search', {eng}, displayDtoList)
			.fail(() => alertModal('검색을 할 수 없습니다. 페이지 새로고침 후 다시 시도해 주세요.'));
			//----------------------------------------------------------
				
			
			function displayDtoList(searchResult){
				//$('#inputComplete').prop('disabled', true);
				const passageDtoList = searchResult.passageDtoList,
					sentenceDtoList = searchResult.sentenceDtoList;
				
				// 지문 검색결과 출력
				const $passageList = $('.passage-result').empty();
				if($passageList.data('masonry')) $passageList.masonry('destroy');
				for(let i = 0, len = passageDtoList.length; i < len; i++){
					const $item = $('#hiddenDivs .list-group-item').clone();
					const searchedSentence = passageDtoList[i];
					$item.data('passageId', passageDtoList[i].passageId)
						 .html(searchedSentence.text.replaceAll(new RegExp(total.join('|').replaceAll(/[\(\)\{\}\[\]]/gm,'\\$&'),'gm'),
											'<span class="bg-fc-yellow">$&</span>'));
					$passageList.append($item);
				}
				// 한 문장만 입력했을 경우 문장 검색결과도 출력)
				if(total.length == 1) {
					for(let i = 0, len = sentenceDtoList.length; i < len; i++){
						const $item = $('#hiddenDivs .list-group-item').clone();
		
						$item.data('sentenceId', sentenceDtoList[i].sentenceId)
							 .html(sentenceDtoList[i].eng.replace(total, 
									`<span class="bg-fc-yellow">${total}</span>`));
						$passageList.append($item);
					}
				}
				if((total.length > 1 && passageDtoList.length == 0)
				|| (total.length == 1 && sentenceDtoList.length == 0)) {
					$passageList.append('<li class="list-group-item pe-none">검색 결과가 없습니다.</li>');
				}else {
					$passageList.append($('#jumpTo3').clone(true, true));
				}
				
				// $('#newPassageText').prop('disabled', true);
				$('.step-2').removeClass('opacity-50 pe-none');
				$('.step-2 .collapse').one('shown.bs.collapse', function() {
					if((total.length > 1 && passageDtoList.length == 0)
					|| (total.length == 1 && sentenceDtoList.length == 0)) {
						$('#jumpTo3').trigger('click');
					} else {
						$passageList.masonry(masonryOptsForPassages);
					}
				});
				$('.step-1 .collapse, .step-2 .collapse').collapse('toggle');
				
			}			
	});
	
	// [입력 초기화]---------------------------------------------------------------
	$('#passageForm').on('reset', function() {
		$('#inputComplete').prop('disabled', true);

		$('.step-2 .collapse,.step-3 .collapse').collapse('hide');
		$('.step-1 .collapse').collapse('show');
		$('.step-1').removeClass('opacity-50 pe-none');
		$('.step-2, .step-3').addClass('opacity-50 pe-none');
		$('#newPassageText').val('').prop('disabled', false).trigger('input').trigger('focus');
	});
	// [(워크북)검색결과 건너뛰기]----------------------------------------------------------
	$('#jumpTo3').on('click', function() {
		$('#text').val($('#newPassageText').val());
		$('.search-result-section .list-group-item').removeClass('active');
		$('.step-2,.step-3').removeClass('opacity-50 pe-none');
		$('.step-2 .collapse,.step-3 .collapse').collapse('toggle');
		displaySentences(
			Array.from(
				tokenizer.sentences(
					$('#newPassageText').val().trim()).filter(s => /[a-zA-Z]/.test(s))
					, s => { return {eng: s.sentenceNormalize()}}));
		//$('#editPassage, .edit-passage').hide();
		$('.final-pssage').show();
	});
	$('.step-2 .collapse:eq(0)').on('shown.bs.collapse hidden.bs.collapse', function() {
		$('#jumpTo3').fadeToggle();
	});
	// [(워크북)검색결과 선택]-------------------------------------------------------------
	$(document).on('click', '.search-result-section .list-group-item', function() {
		$('.search-result-section .list-group-item').not(this).removeClass('active');
		$(this).addClass('active');
		$('#text').val($(this).text());
		
		$('.step-2,.step-3').removeClass('opacity-50 pe-none');
		$('.step-2 .collapse,.step-3 .collapse').collapse('toggle');
		
		const $selected = $(this);
		if($selected.data('passageId')) {
			const passageId = $selected.data('passageId');
			// 지문 편집용 문장 호출(ajax)
			$.getJSON('/workbook/passage/sentences/edit/' + passageId, displaySentences)
			.fail(() => alertModal('지문을 편집할 수 없습니다.'));
		} else if($selected.data('sentenceId')){
			const sentenceId = $selected.data('sentenceId');
			
			displaySentences([{eng: $selected.text(), sentenceId}]);
		}		
		
		//$('#editPassage, .final-passage').show();
		//$('.edit-passage').hide();
	});
	
	// [(워크북)최종 분석 문장/지문 표시]
	$('.step-3 .collapse:eq(0)').on('shown.bs.collapse', async function() {
		searchingSentenceDone = false;
		/*let height = 0;
		while(height != $('#text')[0].scrollHeight) {
			height = $('#text')[0].scrollHeight;
			await sleep(50);
			$('#text').css('height', height + 'px');
		}*/
	});
	
	// [(워크북)선택지문 편집 요청]
	/*$('#editPassage').on('click', function() {
		const $selected = $('.search-result-section .list-group-item.active');
		if($selected.data('passageId')) {
			const passageId = $selected.data('passageId');
			// 지문 편집용 문장 호출(ajax)
			$.getJSON('/workbook/passage/sentences/edit/' + passageId, displaySentences)
			.fail(() => alertModal('지문을 편집할 수 없습니다.'));
		} else if($selected.data('sentenceId')){
			const sentenceId = $selected.data('sentenceId');
			
			displaySentences([{eng: $selected.text(), sentenceId}]);
		}
		
	});*/
	async function displaySentences(sentenceDtoList) {
		$('.final-passage').hide();
		const $result = $('.edit-passage').show().find('.sentence-list').empty();
		for(let i = 0, len = sentenceDtoList.length; i < len; i++) {
			const $sentence = $('#hiddenDivs .divided-sentence').clone();
			$sentence.appendTo($result);
			await sleep(100);
			
			$sentence.data('sentenceId', sentenceDtoList[i].sentenceId||0)
				.data('orgData', sentenceDtoList[i].eng)
				.fadeIn().find(':text').val(sentenceDtoList[i].eng).trigger('input');
		}
	}
	// [(워크북)선택지문 편집 취소]
	$('#cancelEdit').on('click', function() {
		$('.final-passage, .edit-passage').toggle();
	});	

	
	// [지문 등록 버튼 클릭 ]
	$('#addBtn').on('click', function() {
		const $form = $('#passageForm');
		
		let sentencesLength = 0;
			let dirty = false;
			const $selectedPassage = $('.search-result-section .list-group-item.active');
			if($selectedPassage.length > 0) {
				const passageId = $selectedPassage.data('passageId');
				const sentenceId = $selectedPassage.data('sentenceId');
				// 편집을 한 경우
				if($('.edit-passage').is(':visible')) {
					const $sentences = $('.edit-passage .divided-sentence');
					const $differs = $sentences.filter(function() {
						return ($(this).data('orgData') != $(this).find(':text').val().trim().sentenceNormalize());
					});
					let finalSentences = [];
					$sentences.each(function() {
						finalSentences.push($(this).find(':text').val().trim());
					});
					// 선택한 지문과 다른 경우(문장 삭제 혹은 수정) 수정사항이 확인되는 것과 안되는 것을 구분
					// (수정 안함: sentenceId 입력, 수정함: eng 입력)
					if($selectedPassage.text() != finalSentences.join(' ')) {
						$sentences.each(function(i, el) {
							if($(el).is($differs)) {
								const normalizedText = $(el).find(':text').val().trim().sentenceNormalize();
								sentencesLength += normalizedText.length;
								createHidden($form, `existingSentenceList[${i}].eng`, normalizedText);
							} else {
								createHidden($form, `existingSentenceList[${i}].sentenceId`, $(el).data('sentenceId'));
							}
						});
						dirty = true;
					} else {
						$form.find('#text').prop('disabled', true);
						if(passageId != null) {
							createHidden($form, 'existingPassageId', passageId);
						} else {
							createHidden($form, 'existingSentenceList[0].sentenceId', sentenceId);
						}
					}
				}
				// 편집을 안한 경우 
				else if(passageId != null) {
					createHidden($form, 'existingPassageId', passageId);
					$form.find('#text').prop('disabled', true);
				} else if(sentenceId != null){
					createHidden($form, 'existingSentenceList[0].sentenceId', sentenceId);
					$form.find('#text').prop('disabled', true);
				}
				createHidden($form, 'dirty', dirty);
				
			}else {
				let sentences;
				if($('.edit-passage').is(':visible')) {
					const $sentences = $('.edit-passage .divided-sentence');
					sentences = Array.from($sentences.get(), el => $(el).find(':text').val().trim().sentenceNormalize());
					$form.find('#text').prop('disabled', true);
					createHidden($form, 'text', sentences.join(' '));
				}else {
					sentences = tokenizer.sentences($form.find('#text').val().trim().sentenceNormalize());
				}
				sentences.forEach(sentence => {
					sentencesLength += sentence.length;
				})
			}	
		myFicoUsages.length += sentencesLength;
		localStorage.setItem(MY_FICO_USAGES_KEY, btoa(JSON.stringify(myFicoUsages)));
		$form.trigger('submit');
	});
	$('#passageForm').on('submit', function() {
		$('#loadingModal').modal('show');
	});
}
