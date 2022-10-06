/** /workbook/edit_passage.html
@author LGM
 */
function pageinit(sentenceList) {
	const passageId = Number(sessionStorage.getItem('editingPassageId')),
		workbookId = Number(sessionStorage.getItem('workbookId'));
	const LIST_SENTENCE_SELECTOR = '.list-sentence-section',
		ONE_SENTENCE_SELECTOR = '.one-sentence-unit-section';
	
	const oneSentenceJSON = {
		"el": "div", "class": "one-sentence-unit-section p-2 p-lg-4 mb-2 border-0",
		"data-ordernum": "0", "data-sid": "0", "data-psid": "0", "children": [
			{
				"el": "div", "class": "origin-sentence-section my-auto", "children": [
					{	// 문장 메뉴(데스크탑)
						"el": "div", "class": "d-none d-md-block edit-btn-section", "children": [
							{
								"el": "span", "role": "button", "class": "js-move-sentence btn edit-btn ui-sortable-handle", "data-toggle": "tooltip", "title": "위치 이동", "children": [
									{ "el": "span", "class": "fas fa-arrows-alt" }
								]
							},
							{
								"el": "button", "type": "button", "class": "js-del-sentence btn edit-btn", "data-toggle": "tooltip", "title": "문장 삭제", "children": [
									{ "el": "span", "class": "fas fa-trash-alt" }
								]
							},
							{
								"el": "button", "type": "button", "class": "edit-icon-section btn edit-btn", "data-toggle": "collapse", "children": [
									{ "el": "span", "class": "edit-icon fas fa-pen" }
								]
							}
						]
					},
					{	// 문장 메뉴(모바일)
						"el": "div", "class": "d-block d-md-none float-end border rounded-3 px-1", "children": [
							{
								"el": "span", "role": "button", "class": "js-move-sentence d-block btn p-1 ui-sortable-handle", "data-toggle": "tooltip", "title": "위치 이동", "children": [
									{ "el": "span", "class": "fas fa-arrows-alt" }
								]
							},
							{
								"el": "button", "type": "button", "class": "js-del-sentence d-block btn p-1 mx-auto", "data-toggle": "tooltip", "title": "문장 삭제", "children": [
									{ "el": "span", "class": "fas fa-trash-alt" }
								]
							},
							{
								"el": "button", "type": "button", "class": "edit-icon-section d-block btn p-1", "data-toggle": "collapse", "children": [
									{ "el": "span", "class": "edit-icon fas fa-pen" }
								]
							}
						]
					},
					{	// 원문 표시
						"el": "div", "class": "origin-sentence", "role": "button", "data-toggle": "collapse", "children": [
							{ "el": "span", "class": "numbering-text", "textContent": "3" },
							{ "el": "span", "class": "sentence-text", "textContent": "" }
						]
					},
					{	// 문장 수정 영역
						"el": "div", "class": "edit-section collapse mt-2", "children": [
							{ "el": "textarea", "class": "form-control mb-2", "textContent": "" },
							{ "el": "button", "type": "button", "class": "btn btn-outline-fico", "data-toggle": "collapse", "textContent": "취소" },
							{ "el": "button", "type": "button", "class": "js-edit btn btn-fico", "disabled": true, "textContent": "수정" },
							{ "el": "span", "class": "invalid-text text-danger", "style": "display: none;", "textContent": "영문이 아니거나 글자수가 너무 많습니다." }
						]
					}
				]
			}
		]
	};

	
	sentenceList.sort((a, b) => a.orderNum - b.orderNum).forEach((sentence, i) => {
		const sentenceBlock = createElement(oneSentenceJSON);
		sentenceBlock.dataset.ordernum = sentence.orderNum;
		sentenceBlock.dataset.sid = sentence.sentenceId;
		sentenceBlock.dataset.psid = sentence.passageSentenceId;
		sentenceBlock.querySelector('.numbering-text').textContent = i + 1;
		sentenceBlock.querySelector('.sentence-text').textContent = sentence.eng;
		sentenceBlock.querySelector('.edit-section textarea').textContent = sentence.eng;
		
		document.querySelector(LIST_SENTENCE_SELECTOR).appendChild(sentenceBlock);
	});

	calcParaLengthToggleAddBtn();

	// [지문 추가하기로 이동]
	$('#addPassageBtn').click(() =>
		location.assign(`/workbook/passage/add/${ntoa(workbookId)}`)
	);
	// [지문 상세보기로 이동]
	$('#viewPassageBtn').click(() =>
		location.assign(`/workbook/passage/${ntoa(workbookId)}/${ntoa(passageId)}`)
	);
	// [워크북 편집 홈으로 이동]
	$('#editWorkbookBtn').click(() =>
		location.assign(`/workbook/mybook/edit/${ntoa(workbookId)}`)
	);

	// [문장 순서 이동]------------------------------------------------------------
	$(LIST_SENTENCE_SELECTOR)
		.sortable({
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
							alert('더이상 이동할 수 없습니다.');
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
							alert('더이상 이동할 수 없습니다.');
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
	const maxChars = 500;
	$(document).on('input', '.edit-section textarea,.add-section textarea', function() {
		const $section = $(this.closest('.edit-section,.add-section')),
			$submitBtn = $section.find('.js-edit,.js-add'),
			$invalid = $section.find('.invalid-text');
		let edited = $(this).val().parseToSentences().join(' ').capitalize1st();

		// 길이가 0이거나 영문자 외에 입력값이 있는지 검사
		if (edited.length == 0) {
			$invalid.hide();
			$submitBtn.prop('disabled', true);
		} else if (edited.length == 0 || edited.length > maxChars
			|| edited.match(/[^\u0020-\u007F\u0085\u00A0\u2028\u2029\u2018-\u201A\u201C-\u201D]/gi)) {
			$invalid.show();
			$submitBtn.prop('disabled', true);
			return;
		} else {
			$invalid.hide();
			$submitBtn.prop('disabled', false);
		}
	})

	// [문장 추가 등록]------------------------------------------------------------
	$('.js-add').click(function() {
		const text = $('.add-section textarea').val().parseToSentences().join(' ').capitalize1st(),
			orderNum = Number($(`${ONE_SENTENCE_SELECTOR}:last`)[0]?.dataset?.ordernum || 0) + 1000;

		// 전송 내용 생성.
		const command = { sentenceId: 0, passageId: passageId, eng: text, orderNum };

		$('#loadingModal').modal('show');
		// 지문 문장 수정(ajax)-----------------------------
		editPassageSentece(command, successAdd, failAdd);
		//-----------------------------------------------

		function successAdd(sentences) {
			$('#loadingModal').modal('hide');
			if (sentences.length > 0) {
				let alertMsg = `아래와 같은 ${sentences.length}개의 문장이 추가되었습니다.`;
				$('.js-cancel-add').trigger('click');

				const sentenceListSection = document.querySelector(LIST_SENTENCE_SELECTOR);
				const anims = [];
				for (let i = 0, len = sentences.length; i < len; i++) {
					const sentenceUnit = sentences[i];
					const sentenceBlock = createElement(oneSentenceJSON);
					sentenceBlock.querySelector('.sentence-text').textContent = sentenceUnit.eng;
					sentenceBlock.querySelector('.edit-section textarea').textContent = sentenceUnit.eng;
					sentenceBlock.dataset.sid = sentenceUnit.sentenceId;
					sentenceBlock.dataset.ordernum = sentenceUnit.orderNum;
					sentenceListSection.appendChild(sentenceBlock);
					alertMsg += `\n[${(i + 1)}] ${sentenceUnit.eng}`;
					anims.push(sentenceBlock);
				}
				arrangeSentences();
				calcParaLengthToggleAddBtn();
				alert(alertMsg);
				focusEffectSentence(anims);
			}
		}

		function failAdd() {
			alert('등록에 실패했습니다.');
			$('#loadingModal').modal('hide');
		}
	});

	// [문장 수정]----------------------------------------------------------------
	$(document).on('click', '.js-edit', function() {
		const $sentenceSection = $(this.closest(ONE_SENTENCE_SELECTOR));
		let origin = $sentenceSection.find('.sentence-text').text();
		let edited = $sentenceSection.find('.edit-section textarea').val()
			.parseToSentences().join(' ').capitalize1st();

		// 길이가 0이거나 영문자 외에 입력값이 있는지 검사
		if (edited.length == 0 || edited.length > maxChars
			|| edited.match(/[^\u0020-\u007F\u0085\u00A0\u2028\u2029\u2018-\u201A\u201C-\u201D]/gi)) {
			return;
		}
		// 수정 전과 동일하면 취소
		else if (edited == origin) {
			$sentenceSection.find('.collapse').collapse('toggle');
			return;
		}
		// 전송 내용 생성.
		const command = {
			sentenceId: Number($sentenceSection[0].dataset.sid),
			passageId: passageId, eng: edited, sameText: false,
			orderNum: Number($sentenceSection[0].dataset.ordernum)
		};

		// 기존 문장과 동일한 지 검사
		if (origin.toLowerCase().replace(/\s/g, '')
			== edited.toLowerCase().replace(/\s/g, '')) {
			command['sameTextSeq'] = true;
		} else {
			command['sameTextSeq'] = false;
		}

		$('#loadingModal').modal('show');
		// 지문 문장 수정(ajax)-------------------------------
		editPassageSentece(command, successEdit, failEdit);
		//-------------------------------------------------

		function successEdit(sentences) {
			$('#loadingModal').modal('hide');
			if (sentences.length > 1) {
				let alertMsg = `문장이 아래와 같이 ${sentences.length}개로 나뉘었습니다.`;
				$sentenceSection.find('.edit-section').one('hidden.bs.collapse', function() {
					$sentenceSection.hide(function() {
						const anims = [];
						for (let i = 0, len = sentences.length; i < len; i++) {
							const sentenceUnit = sentences[i];
							const $sentenceBlock = $sentenceSection.clone();
							$sentenceBlock.find('.sentence-text, textarea')
								.text(sentenceUnit.eng);
							$sentenceBlock[0].dataset.sid = sentenceUnit.sentenceId;
							$sentenceBlock[0].dataset.ordernum = sentenceUnit.orderNum;
							$sentenceSection.before($sentenceBlock);
							alertMsg += `\n[${(i + 1)}] ${sentenceUnit.eng}`;
							anims.push($sentenceBlock[0]);
						}
						$sentenceSection.remove();
						$(ONE_SENTENCE_SELECTOR).slideDown();
						arrangeSentences();
						calcParaLengthToggleAddBtn();
						alert(alertMsg);
						focusEffectSentence(anims);
					});
				});
				$sentenceSection.find('.edit-section').collapse('hide');
			} else if (sentences.length == 1) {
				alert('수정되었습니다.');
				$sentenceSection.find('.sentence-text').text(sentences[0].eng);
				$sentenceSection[0].dataset.sid = sentences[0].sentenceId;
				$sentenceSection.find('.edit-section textarea').val(sentences[0].eng);
				$sentenceSection.find('.edit-section').collapse('hide');
				focusEffectSentence($sentenceSection[0]);
			}
		}

		function failEdit() {
			alert('수정에 실패했습니다.');
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
				alert('문장이 삭제되었습니다.');
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

	// 전체 문장의 길이 계산하여 문장 추가 버튼과 지문 추가 버튼 토글하기
	function calcParaLengthToggleAddBtn() {
		const overflow = Array.from($(`${ONE_SENTENCE_SELECTOR} .sentence-text`).get(), sentence => sentence.textContent).join('').length >= 1500;

		$('.exceed-max-notice')[overflow ? 'slideDown' : 'slideUp'](100);
		$('.js-open-add-sentence')[overflow ? 'slideUp' : 'slideDown'](100);
	}

}
