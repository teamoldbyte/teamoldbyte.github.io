/** /workbook/edit_passage.html
@author LGM
 */
function pageinit(sentenceList, memberId) {
	$(window).on('unload', () => $('#loadingModal').modal('hide'));
	const passageId = Number(sessionStorage.getItem('editingPassageId')||sessionStorage.getItem('passageId'));
	let workbookId56;
	if(document.referrer) {
		workbookId56 = new URL(document.referrer).pathname?.match(/(\/mybook\/edit\/|\/workbook\/study\/overview\/|\/workbook\/passage\/)(\w+)/)?.[2];
	}
	const LIST_SENTENCE_SELECTOR = '.list-sentence-section',
		ONE_SENTENCE_SELECTOR = '.one-sentence-unit-section';
	const MAX_SENTENCE_LENGTH = 500;
	const oneSentenceJSON = {
		"el": "div", "class": "one-sentence-unit-section p-2 p-lg-4 mb-2 border-0",
		"data-ordernum": "0", "data-sid": "0", "children": [
			{ "el": "div", "class": "origin-sentence-section my-auto", "children": [
				// 문장 메뉴(데스크탑)
				{ "el": "div", "class": "d-none d-md-block edit-btn-section", "children": [
					{ "el": "span", "role": "button", "class": "js-move-sentence btn edit-btn ui-sortable-handle", "data-toggle": "tooltip", "title": "위치 이동", "children": [
						{ "el": "span", "class": "fas fa-arrows-alt" }
					]},
					{ "el": "button", "type": "button", "class": "js-del-sentence btn edit-btn", "data-toggle": "tooltip", "title": "문장 삭제", "children": [
						{ "el": "span", "class": "fas fa-trash-alt" }
					]},
					{ "el": "button", "type": "button", "class": "edit-icon-section btn edit-btn", "data-toggle": "collapse", "children": [
						{ "el": "span", "class": "edit-icon fas fa-pen" }
					]}
				]},
				// 문장 메뉴(모바일)
				{ "el": "div", "class": "d-block d-md-none float-end border rounded-3 px-1", "children": [
					{ "el": "span", "role": "button", "class": "js-move-sentence d-block btn p-1 ui-sortable-handle", "data-toggle": "tooltip", "title": "위치 이동", "children": [
						{ "el": "span", "class": "fas fa-arrows-alt" }
					]},
					{ "el": "button", "type": "button", "class": "js-del-sentence d-block btn p-1 mx-auto", "data-toggle": "tooltip", "title": "문장 삭제", "children": [
						{ "el": "span", "class": "fas fa-trash-alt" }
					]},
					{ "el": "button", "type": "button", "class": "edit-icon-section d-block btn p-1", "data-toggle": "collapse", "children": [
						{ "el": "span", "class": "edit-icon fas fa-pen" }
					]}
				]},
				// 원문 표시
				{ "el": "div", "class": "origin-sentence", "role": "button", "data-toggle": "collapse", "children": [
					{ "el": "span", "class": "numbering-text", "textContent": "3" },
					{ "el": "span", "class": "sentence-text", "textContent": "" }
				]},
				// 문장 수정 영역
				{ "el": "div", "class": "edit-section collapse mt-2", "children": [
					{ "el": "textarea", "class": "form-control mb-2", "rows": "5", "textContent": "" },
					{ "el": "button", "type": "button", "class": "btn btn-outline-fico", "data-toggle": "collapse", "textContent": "취소" },
					{ "el": "button", "type": "button", "class": "js-edit btn btn-fico", "disabled": true, "textContent": "수정" },
					{ "el": "span", "class": "invalid-text text-danger", "style": "display: none;", "textContent": "영문이 아니거나 글자수가 너무 많습니다." }
				]}
			]}
		]};

// --------------------------- 사용량 측정 Start --------------------------------

	const MAX_SENTENCE_LENGTH_PER_DAY = 5000, 
		STR_MSLPD = MAX_SENTENCE_LENGTH_PER_DAY.toLocaleString();
	
	const TODAY_DATE = new Date().format('yyyy-MM-dd');
	/**
	myFicoUsage = date : today's date, length: total sentences length of today, confirmed: whether alert modal popped ever.
	 */
	const MY_FICO_USAGES_KEY = 'MFUSG';

	const encodedData = localStorage.getItem(MY_FICO_USAGES_KEY);
	
	let myFicoUsages = encodedData ? JSON.parse(atob(encodedData)) : {};
	if (myFicoUsages.user !== ntoa(memberId) || myFicoUsages.date !== TODAY_DATE) {
		// 사용량 정보 객체의 사용자가 불일치하거나 날짜정보가 다르다면 서버로부터 사용량 조회하여 세팅.
		myFicoUsages = { user: ntoa(memberId), date: TODAY_DATE, length: 0};
		$.getJSON('/workbook/passage/usage')
			.done(length => Object.assign(myFicoUsages, { length }))
			.always(() => _verifyUsageLimit());
	} else {
		_verifyUsageLimit();
	}
	
	/**
	 * 현재 문장 분석량 확인. 초과시 경고 메세지 표시
	 */
	function _verifyUsageLimit(callback) {
		if(myFicoUsages.length >= MAX_SENTENCE_LENGTH_PER_DAY) {
			$('.js-open-add-sentence,.edit-icon-section').attr('data-toggle','tooltip').attr('title', '일일 사용량을 초과하여 문장의 추가 및 수정이 불가합니다.').prop('disabled', true);
			$('.origin-sentence').removeAttr('data-toggle');
			oneSentenceJSON.children[0].children[0].children[2]['disabled'] = true;
			oneSentenceJSON.children[0].children[1].children[2]['disabled'] = true;
			delete oneSentenceJSON.children[0].children[2]["data-toggle"];
			alertModal(`일일 분석량<span class="text-red-700">(${STR_MSLPD}자)</span>을 모두 <span class="text-red-700">소진</span>하여\n문장의 <span class="text-red-700">추가 및 수정</span>이 불가합니다.\n문장의 <span class="text-blue-600">순서 이동 및 삭제</span>는 가능합니다.`, () => callback&&callback());
			localStorage.setItem(MY_FICO_USAGES_KEY, btoa(JSON.stringify(myFicoUsages)));
		}else {
			localStorage.setItem(MY_FICO_USAGES_KEY, btoa(JSON.stringify(myFicoUsages)));
			if(callback) callback();
		}
	}	

// ----------------------사용량 측정 End ------------------------------------
	
	sentenceList.sort((a, b) => a.orderNum - b.orderNum).forEach((sentence, i) => {
		const sentenceBlock = createElement(oneSentenceJSON);
		sentenceBlock.dataset.ordernum = sentence.orderNum;
		sentenceBlock.dataset.sid = sentence.sentenceId;
		sentenceBlock.querySelector('.numbering-text').textContent = i + 1;
		sentenceBlock.querySelector('.sentence-text').textContent = sentence.eng;
		sentenceBlock.querySelector('.edit-section textarea').textContent = sentence.eng;
		
		document.querySelector(LIST_SENTENCE_SELECTOR).appendChild(sentenceBlock);
	});

	calcParaLengthToggleAddBtn();

	// [지문 추가하기로 이동]
	$('#addPassageBtn').click(() =>
		location.assign(`/workbook/passage/add/${workbookId56}`)
	);
	// [지문 상세보기로 이동]
	$('#viewPassageBtn').click(() =>
		location.assign(`/workbook/passage/${workbookId56}/${ntoa(passageId)}`)
	);
	// [워크북 편집 홈으로 이동]
	$('#editWorkbookBtn').click(() =>
		location.assign(`/workbook/mybook/edit/${workbookId56}`)
	);

	// [문장 순서 이동]------------------------------------------------------------
	$(LIST_SENTENCE_SELECTOR)
		.sortable({
			containment: 'parent',
			axis: 'y',
			items: `>${ONE_SENTENCE_SELECTOR}`,
			handle: '.js-move-sentence',
			classes: {
				"ui-sortable-helper": "shadow-lg"
			},
			cursor: 'move',
			update: (_event, ui) => {
				if (confirm('문장을 여기로 이동하겠습니까?')) {
					let $prev = ui.item.prev(ONE_SENTENCE_SELECTOR),
						$next = ui.item.next(ONE_SENTENCE_SELECTOR);
					// 다음 문장이 없으면 이전문장의 ordernum + 1000
					if ($next.length == 0) {
						ui.item[0].dataset.ordernum = Number($prev[0].dataset.ordernum) + 1000;
					}
					// 이전 문장이 없으면 다음 문장의 ordernum / 2
					else if ($prev.length == 0) {
						const nextOrder = Number($next[0].dataset.ordernum),
							newOrder = Math.round(nextOrder / 2);
						if (newOrder == nextOrder) {
							alertModal('더이상 이동할 수 없습니다.');
							$(LIST_SENTENCE_SELECTOR).sortable('cancel');
							return;
						}
						else ui.item[0].dataset.ordernum = newOrder;
					}
					// 그 외엔 이전 문장과 다음 문장의 ordernum 사잇값
					else {
						const prevOrder = Number($prev[0].dataset.ordernum),
							nextOrder = Number($next[0].dataset.ordernum),
							newOrder = Math.round((prevOrder + nextOrder) / 2);
						if ([prevOrder, nextOrder].indexOf(newOrder) > -1) {
							alertModal('더이상 이동할 수 없습니다.');
							$(LIST_SENTENCE_SELECTOR).sortable('cancel');
							return;
						}
						else ui.item[0].dataset.ordernum = newOrder;
					}

					// 전송 내용 생성.
					const command = {
						sentenceId: Number(ui.item.data('sid')), sameText: true,
						passageId: passageId, eng: ui.item.find('.sentence-text').text(),
						orderNum: Number(ui.item[0].dataset.ordernum)
					};

					// 지문 문장 수정(ajax)----------------------
					editPassageSentece(command, arrangeSentences);
					//----------------------------------------

				} else {
					$(LIST_SENTENCE_SELECTOR).sortable('cancel');
				}
			}
		});

	// [문장 추가 블록 toggle]-----------------------------------------------------
	$('.js-open-add-sentence').click(function() {
		$(this).add($('.add-section')).slideToggle(100, () => $('.add-section textarea').focus());
	});
	// [문장 추가 취소]------------------------------------------------------------
	$('.js-cancel-add').click(function() {
		$('.add-section textarea').val('').trigger('input');
		$('.add-section,.js-open-add-sentence').slideToggle(100);
	});

	// [문장 수정 블록 toggle]-----------------------------------------------------
	$(document).on('click', `${ONE_SENTENCE_SELECTOR} [data-toggle="collapse"]`, function() {
		$(this.closest(ONE_SENTENCE_SELECTOR)).find('.collapse').collapse('toggle');
	});

	// [문장 입력 시 제한사항 적용]---------------------------------------------------
	$(document).on('input', '.edit-section textarea,.add-section textarea', function() {
		// Get necessary DOM elements
		const section = this.closest('.edit-section, .add-section');
		const submitBtn = section.querySelector('.js-edit, .js-add');
		const invalidText = section.querySelector('.invalid-text');

		// Extract necessary information from input
		const { input, inputCursor } = extractHighlightInfo(this.value, this.selectionStart);

		// Validate input
		let isInvalid = false;
		if (input.length === 0) {
			isInvalid = true;
		} else {
			const sentences = tokenizer.sentences(input);
			const isSentenceTooLong = sentences.some(sentence => sentence.length > MAX_SENTENCE_LENGTH);
			if (isSentenceTooLong) {
				const index = sentences.findIndex(sentence => sentence.length > MAX_SENTENCE_LENGTH) + 1;
				invalidText.textContent = `${index}번째 문장의 글자수가 너무 많습니다.`;
				isInvalid = true;
			} else if (input.includes('×')) {
				invalidText.textContent = '영문장에 부적절한 문자가 포함되어 × 기호로 치환됐습니다.';
				isInvalid = true;
			}
		}

		// Update DOM based on input validation result
		invalidText.style.display = isInvalid ? 'block' : 'none';
		submitBtn.disabled = isInvalid;

		// Highlight input if necessary
		if (input.includes('×')) {
			this.value = input;
			$(this).highlightWithinTextarea({
				highlight: [{ className: 'bg-fc-yellow', highlight: ['×'] }]
			});
			this.setSelectionRange(inputCursor, inputCursor);
			this.focus();
		}
	})

	// [문장 추가 등록]------------------------------------------------------------
	$('.js-add').on('click', function() {
		const sentences = tokenizer.sentences($('.add-section textarea').val());
		const orderNum = Number($(`${ONE_SENTENCE_SELECTOR}:last`)[0]?.dataset?.ordernum || 0) + 1000;

		// 문장 검사
		const filteredSentences = sentences.map(sentence => {
			// 아래와 같은 경우 번호 삭제
			// 426. I was
			// was bored." 427.
			const trimmedSentence = sentence.trim();
			const match = trimmedSentence.match(/^['"]?[^a-zA-Z]+\. (['"]?[A-Z])/);
			const sentenceWithoutNumber = match ? match[1] : trimmedSentence;
			return sentenceWithoutNumber.replace(/(['"])\s+\d+[?!.]$/, '$1');
		}).filter(sentence => {
			return /[a-zA-Z\s]/.test(sentence);
		});

		if (filteredSentences.length === 0) {
			return;
		}
		const total = filteredSentences.join(' ').capitalize1st();
		const textarea = $('.add-section textarea').get(0);
		textarea.value = total;
		let checkingPos = 0;
		// 입력된 문장들 각각을 검사.
		for (let i = 0, len = filteredSentences.length; i < len; i++) {
			const tempSentence = filteredSentences[i];
			const alertAndFocusWrongSentence = (msg) => {
				alertModal(`${i + 1}번째 ${msg}\n문장 내용은 아래와 같습니다.\n${tempSentence}`, () => {
					textarea.focus();
					textarea.setSelectionRange(checkingPos, checkingPos + tempSentence.length);
				})
			}
			if (tempSentence.length > MAX_SENTENCE_LENGTH) {
				alertAndFocusWrongSentence(`문장의 길이가 너무 길어 AI가 더욱 힘들어 합니다.`);
				return;
			}
			else if (!/^["'(]?[A-Z0-9]/.test(tempSentence)) {
				alertAndFocusWrongSentence(`문장의 시작이 영문대문자나 숫자 혹은 따옴표(" ')가 아닙니다.`);
				return;
			}
			else if (!new RegExp('[\.\?\!]["\']?$').test(tempSentence)) {
				alertAndFocusWrongSentence(`문장의 끝이 구두점(. ? !)이나 따옴표(" ')가 아닙니다.`);
				return;
			}
			checkingPos += tempSentence.length + (i < len - 1 ? 1 : 0);
		}

		// 일일 사용량이 넘어가는 순간 더이상 문장 추가/수정 불가.
		myFicoUsages.length += total.length;
		// 전송 내용 생성.
		const command = { sentenceId: 0, passageId: passageId, eng: total, orderNum };

		$('#loadingModal').modal('show');
		// 지문 문장 수정(ajax)-----------------------------
		editPassageSentece(command, successAdd, failAdd);
		//-----------------------------------------------

		function successAdd(sentences) {
			const $loadingModal = $('#loadingModal');
			$loadingModal.modal('hide');

			if (sentences.length === 0) {
				return;
			}

			const sentenceListSection = document.querySelector(LIST_SENTENCE_SELECTOR);
			const anims = [];
			let alertMsg = `아래와 같은 ${sentences.length}개의 문장이 추가되었습니다.`;

			$('.js-cancel-add').trigger('click');

			for (let i = 0; i < sentences.length; i++) {
				const sentenceUnit = sentences[i];
				const sentenceBlock = createElement(oneSentenceJSON);
				sentenceBlock.querySelector('.sentence-text').textContent = sentenceUnit.eng;
				sentenceBlock.querySelector('.edit-section textarea').textContent = sentenceUnit.eng;
				sentenceBlock.dataset.sid = sentenceUnit.sentenceId;
				sentenceBlock.dataset.ordernum = sentenceUnit.orderNum;
				sentenceListSection.appendChild(sentenceBlock);
				alertMsg += `\n[${i + 1}] ${sentenceUnit.eng}`;
				anims.push(sentenceBlock);
			}

			arrangeSentences();
			calcParaLengthToggleAddBtn();
			alertModal(alertMsg, () => {
				_verifyUsageLimit(() => focusEffectSentence(anims));
			});
		}

		function failAdd() {
			const $loadingModal = $('#loadingModal');
			alertModal('등록에 실패했습니다.');
			$loadingModal.modal('hide');
		}
	});

	// [문장 수정]----------------------------------------------------------------
	$(document).on('click', '.js-edit', function() {
		const $sentenceSection = $(this.closest(ONE_SENTENCE_SELECTOR));
		let origin = $sentenceSection.find('.sentence-text').text();
		const sentences = tokenizer.sentences($sentenceSection.find('.edit-section textarea').val());


		// 문장 검사
		const total = Array.from(sentences, sentence => {
			// 아래와 같은 경우 번호 삭제
			// 426. I was
			// was bored." 427.
			return sentence.replace(/^['"]?[^a-zA-Z]+\. (['"]?[A-Z])/, '$1')
						.replace(/(['"])\s+\d+[?!.]$/, '$1')
		}).filter(sentence => {
			return /[a-zA-Z\s]/.test(sentence);
		});
		let text = total.join(' ').capitalize1st();
		const textarea = $sentenceSection.find('.edit-section textarea').get(0);
		textarea.value = text;
		
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
			if(tempSentence.length > MAX_SENTENCE_LENGTH) {
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
			checkingPos += tempSentence.length + (i < len - 1 ? 1 : 0);
		}
		


		// 수정 전과 동일하면 취소
		if (text == origin) {
			$sentenceSection.find('.collapse').collapse('toggle');
			return;
		}
		// 전송 내용 생성.
		const command = {
			sentenceId: Number($sentenceSection[0].dataset.sid),
			passageId: passageId, eng: text, sameText: false,
			orderNum: Number($sentenceSection[0].dataset.ordernum)
		};
		
		myFicoUsages.length += text.length;

		// 기존 문장과 동일한 지 검사
		command['sameTextSeq'] = (origin.toLowerCase() === text.toLowerCase());

		$('#loadingModal').modal('show');
		// 지문 문장 수정(ajax)-------------------------------
		editPassageSentece(command, successEdit, failEdit);
		//-------------------------------------------------

		function successEdit(sentences) {
			$('#loadingModal').modal('hide');
			const len = sentences.length;
			if (len > 1) {
				let alertMsg = `문장이 아래와 같이 ${len}개로 나뉘었습니다.`;
				$sentenceSection.find('.edit-section').one('hidden.bs.collapse', function() {
					$sentenceSection.hide(() => {
						const anims = new Array(len);
						for (let i = 0; i < len; i++) {
							const sentenceUnit = sentences[i];
							const $sentenceBlock = $sentenceSection.clone();
							$sentenceBlock.find('.sentence-text, textarea')
								.text(sentenceUnit.eng);
							$sentenceBlock[0].dataset.sid = sentenceUnit.sentenceId;
							$sentenceBlock[0].dataset.ordernum = sentenceUnit.orderNum;
							$sentenceSection.before($sentenceBlock);
							alertMsg += `\n[${(i + 1)}] ${sentenceUnit.eng}`;
							anims[i] = $sentenceBlock[0];
						}
						$sentenceSection.remove();
						$(ONE_SENTENCE_SELECTOR).slideDown();
						arrangeSentences();
						calcParaLengthToggleAddBtn();
						alertModal(alertMsg, () => {
							_verifyUsageLimit(() => focusEffectSentence(anims));
						});
					});
				}).collapse('hide');
			} else if (len === 1) {
				const sentenceUnit = sentences[0];
				const $sentenceSectionEdit = $sentenceSection.find('.edit-section');
				alertModal('수정되었습니다.', () => {
					_verifyUsageLimit(() => {
						$sentenceSection.find('.sentence-text').text(sentenceUnit.eng);
						$sentenceSection[0].dataset.sid = sentenceUnit.sentenceId;
						$sentenceSectionEdit.find('textarea').val(sentenceUnit.eng).end().collapse('hide');
						focusEffectSentence($sentenceSection[0]);
					})
				});
			}
		}

		function failEdit() {
			alertModal('수정에 실패했습니다.');
			$('#loadingModal').modal('hide');
		}
	})
	// [문장을 지문에서 삭제]--------------------------------------------------------
	.on('click', '.js-del-sentence', function() {

		if (!confirm('문장을 삭제하시겠습니까?')) return;
		const $sentenceSection = $(this.closest(ONE_SENTENCE_SELECTOR));
		// 문장 삭제(ajax)------------------------
		delPassageSentence({ passageId: passageId, sentenceId: Number($sentenceSection[0].dataset.sid) }, successDel);
		//--------------------------------------

		function successDel() {
			alertModal('문장이 삭제되었습니다.');
			$sentenceSection.slideUp(function() {
				$(this).remove();
				arrangeSentences();
				calcParaLengthToggleAddBtn();
			})
		}
	});

	// - - - - - - - - - - - Embeded functions - - - - - - - - - - - - - - - - -
	// 문장섹션을 잠깐 강조 효과 적용
	function focusEffectSentence(targets) {
		anime({ targets, duration: 1000, easing: 'linear', direction: 'alternate', backgroundColor: '#ffc107'});
	}

	// 전체 문장을 orderNum을 기준으로 재정렬
	function arrangeSentences() {
		$(LIST_SENTENCE_SELECTOR).html(
			$(ONE_SENTENCE_SELECTOR)
				.sort((a, b) => a.dataset.ordernum - b.dataset.ordernum)
				.each((i, el) => $(el).find('.numbering-text').text(i + 1))
		);
	}

	/** 전체 문장의 길이 계산하여 문장 추가 버튼과 지문 추가 버튼 토글하기
	 */
	function calcParaLengthToggleAddBtn() {
		const overflow = Array.from($(`${ONE_SENTENCE_SELECTOR} .sentence-text`).get(), sentence => sentence.textContent).join('').length >= 1500;

		$('.exceed-max-notice')[overflow ? 'slideDown' : 'slideUp'](100);
		$('.js-open-add-sentence')[overflow ? 'slideUp' : 'slideDown'](100);
	}

}
