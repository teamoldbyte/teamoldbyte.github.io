/** admin/dictionary/search_word.html
@author LGM
 */
function pageinit() {
	$('#searchWordForm').on('submit', function(e) {
		e.preventDefault();
		const searchOption = $('#searchOption').val();
		const title = $('#keywordDiv input').val().trim();
		if(title.length == 0) return;
		
		$('.showup-sense-list-section').empty();
		$.getJSON(`/adminxyz/word/search/${searchOption}`, {value: title}, function(wordList) {
			// 일반 단어 검색 결과. 대소문자가 다르게 검색된 결과를 받아오더라도 일단은 보여줘야 한다.
			// 그래야 대문자 단어가 없는 것인지, 아얘 없는 것인지를 판단할 수 있다.
			const normalWord = wordList.find(word=>word.title == title);
			const anyWord = normalWord ?? wordList?.[0];
			
			$('#searchResult').collapse('show');
			$('#searchResult').find('.saveTitle').text(title)
			$('#searchResult').find('.one-word-unit-section .word-title').text(anyWord.title);
			
			$('#searchResult .empty-list').toggle(wordList == null || wordList.length == 0 || normalWord == null);
			$('#searchResult .one-word-unit-section').toggle(anyWord != null);
			$('#searchResult .one-word-unit-section').children(':not(.title,.title-section)').remove();
			if(anyWord) {
				$('#searchResult .input-lemma').val(anyWord.lemma||'')[0].dataset.org = anyWord.lemma||'';
				$('#searchResult').get(0).dataset.wordId = anyWord.wid;
				$('#searchResult .level').text(anyWord.level);
				$('#searchResult .level-input').val(anyWord.level);
				$('#searchResult .one-word-unit-section').get(0).appendChild(createElement(createSenseListAndForm(false, anyWord.senseList)));
			}
			
			// 구동사 검색 결과
			const phrVerbs = wordList.filter(word => word.showUpSenseList?.length > 0);
			if(phrVerbs.length > 0) {
				$('.showup-sense-list-section').get(0).appendChild(createElement(Array.from(phrVerbs, (word, i) => {
					return { el: 'div', className: 'showup-word' + (i>0?' mt-4 pt-2 border-top border-2':''), 
					'data-word-id': word.wid, children: [
						{ el: 'div', className: 'title-section row mt-1 g-3', children: [
							{ el: 'div', className: 'my-auto', children: [
								{ el: 'h5', className: 'word-title title fs-5 d-inline me-2', textContent: word.title }
							]}
						]}
					].concat(createSenseListAndForm(true, word.showUpSenseList))}
				})));
			}else {
				$('.showup-sense-list-section').html('검색 결과가 없습니다.')
			}
		}).fail((xhr, status) => {
			if(status == 'parsererror') {
				$('#searchResult').collapse('show');
				$('#searchResult .saveTitle').text(title);
				$('#searchTitle, #saveTitle').val(title);
				$('#searchResult .empty-list').show();
				$('#searchResult .one-word-unit-section').hide();
			}else alertModal('에러가 발생했습니다.\n'+xhr.responseJSON.exception);
		})
	});
	
	// lemma 수정
	$('.input-lemma').on('input', function() {
		$(this).closest('.lemma-section').find('.edit-button-section').show();
	});
	$('.js-edit-lemma').on('click', function() {
		const wordId = parseInt($('#searchResult').get(0).dataset.wordId);
		const lemma = $('.input-lemma').val().trim();
		
		$.ajax({
			url: '/adminxyz/dictionary/lemma/edit',
			type: 'POST', 
			data: { wordId, lemma },
			success: () => {
				alertModal('lemma 정보가 수정되었습니다.');
				setTimeout(()=> $('#alertModal').modal('hide'), 800);
				$('.input-lemma').attr('data-org', lemma);
				$('.lemma-section .edit-button-section').hide();
			}
		})
	})
	$('.js-edit-lemma-cancel').on('click', function() {
		const $input = $('.input-lemma');
		$input.val($input[0].dataset.org);
		$(this).closest('.edit-button-section');
	})
	
	$('.level, .level-edit-open-btn').on('click', function() {
		$('#searchResult').find('.level, .level-edit-open-btn, .level-input, .js-level-edit, .js-level-cancel').toggle();
		$('#searchResult .level-input').val($('#searchResult .level').text()).focus();
	})
	
	$('.js-level-edit').on('click', function() {
		const $levelText = $('#searchResult .level');
		const $levelInput = $('#searchResult .level-input');
		
		const inputValue = parseInt($levelInput.val().trim());
		if(Number.isNaN(inputValue) || inputValue > 10000 || inputValue < 0) {
			alertModal('0~10,000 숫자를 입력해 주세요.')
			$levelInput.focus();
			return;
		}
		
		const wordId = parseInt($('#searchResult').get(0).dataset.wordId);
	
		$.ajax({
			type: 'POST',
			url: '/adminxyz/dictionary/level/edit',
			data: { wordId: wordId, level: inputValue},
			success: function() {
				alertModal('단어 난이도가 수정되었습니다.');
				$levelText.text(inputValue);
				$('#searchResult').find('.level, .level-edit-open-btn, .level-input, .js-level-edit, .js-level-cancel').toggle();
			},
			error: function() {
				alertModal('에러가 발생했습니다.\n'+xhr.responseJSON.exception);
			}
		})
	});
	
	$('.js-level-cancel').on('click', function() {
		$('#searchResult').find('.level, .level-edit-open-btn, .level-input, .js-level-edit, .js-level-cancel').toggle();
	});
	
	// 단어 등록 예약
	$('#register').on('click', function() {
		const searchTitle = $('#searchTitle').val().trim();
		const saveTitle = $('#saveTitle').val().trim();
		$.getJSON('/adminxyz/unword/add', { searchTitle, saveTitle}, function() {
			alertModal(`단어 ${searchTitle}(이)가 등록되었습니다.`);
			$('#alertModal').on('hide.bs.modal', () => location.reload());
		}).fail((xhr, status) => {
			if(status == 'parsererror') {
				alertModal(`단어 ${searchTitle}(이)가 등록되었습니다.`);
				$('#alertModal').on('hide.bs.modal', () => location.reload());
			}else alertModal('에러가 발생했습니다.\n'+xhr.responseJSON.exception);
		});
	})
	// 구동사 예문 입력 시 우클릭으로 강조 표시 처리
	$(document).on('contextmenu', '.input-example-eng', function(e) {
		const sel = getSelection();
		const input = e.target.closest('.eng');
		const range = sel.getRangeAt(0);
		if(sel.isCollapsed && !sel.focusNode.parentElement.closest('strong')) return;
		else if(!sel.isCollapsed) {
			e.preventDefault();
			const strong = createElement({ el: 'strong', textContent: range.toString()});
			range.deleteContents();
			range.insertNode(strong);
		}else if(sel.focusNode.parentElement.closest('strong')){
			const strong = sel.focusNode.parentElement.closest('strong');
			e.preventDefault();
			strong.replaceWith(strong.textContent);
			sel.removeAllRanges();
		}
		// 강조 표시 변경 후 노드 정리
		input.childNodes.forEach(n => {if(n.textContent.length == 0) n.remove()});
		let node = input.firstChild;
		while(node) {
			if(node.previousSibling?.nodeName == node.nodeName) {
				node.textContent = node.previousSibling.textContent.concat(node.textContent);
				node.previousSibling.remove();
			}
			node = node.nextSibling;
		}
		this.closest('.one-part-unit-section').querySelector('.input-meaning').dispatchEvent(new InputEvent('input'));
	})
	// 뜻 수정
	.on('click', '.js-edit-meaning', function() {
		const $senseSection = $(this).closest('.one-part-unit-section');
		const sid = parseInt($senseSection.get(0).dataset.sid);
		const $input = $senseSection.find('.input-meaning');
		const $exampleEng = $senseSection.find('.input-example-eng');
		const $exampleKor = $senseSection.find('.input-example-kor');
		const command = { meaning: $input.val().trim() };
		const isPhrasalVerb = $senseSection.closest('.showup-sense-list-section').length > 0;
		
		if(isPhrasalVerb) {
			command['wordId'] = parseInt($senseSection.closest('.showup-word').get(0).dataset.wordId);
			command['showUpId'] = sid;
			command['partType'] = $senseSection.find('.part').text();
			command['eng'] = $exampleEng.html().trim();
			command['kor'] = $exampleKor.val().trim();
		}else {
			command['senseId'] = sid;
		}
		
		$.ajax({
			url: `/adminxyz/dictionary/${isPhrasalVerb? 'showup':''}sense/edit`,
			type: 'POST',
			data: command,
			success: () => {
				alertModal(`뜻이 수정되었습니다.\n: ${command.meaning}${isPhrasalVerb?('\n예문:\n'+command.eng+'\n'+command.kor):''}`);
				$input.get(0).dataset.org = command.meaning;
				if(isPhrasalVerb) {
					$exampleEng.get(0).dataset.org = command.eng;
					$exampleKor.get(0).dataset.org = command.kor;
				}
			},
			error: () => alertModal('수정이 실패했습니다.')
		})		
	})
	// 뜻 수정 취소
	.on('click', '.js-edit-cancel', function() {
		$(this).closest('.one-part-unit-section').find('input,[contenteditable]').each(function() {
			if(this.matches('input'))
				$(this).val($(this).get(0).dataset.org);
			else
				$(this).html($(this).get(0).dataset.org);
		})
		$(this).hide();
		$(this).siblings('.js-edit-meaning').hide();		
	})
	// 뜻 추가
	.on('click', '.js-add-meaning', function() {
		const $addSection = $(this).closest('.add-new-sense-section');
		const $partSelect = $addSection.find('select');
		const $input = $addSection.find('input');
		if($input.val().trim() == 0) return;
		const isPhrasalVerb = $(this).closest('.showup-word').length > 0;
		const command = { wordId: parseInt($(this).closest('.showup-word,#searchResult').get(0).dataset.wordId), 
						partType: $partSelect.val(), meaning: $input.val().trim() };
		if(isPhrasalVerb) {
			command['eng'] = $addSection.find('.input-example-eng').html().trim();
			command['kor'] = $addSection.find('.input-example-kor').val().trim();
		}
		$.ajax({
			url: `/adminxyz/dictionary/${isPhrasalVerb ? 'showup':''}sense/add`,
			type: 'POST',
			data: command,
			success: (addedSense) => {
				alertModal(`뜻이 추가되었습니다.\n: ${addedSense.partType} ${addedSense.meaning}`);
				$('.add-new-sense-label').before(
					createElement(
						createOnePartSection(isPhrasalVerb, addedSense)
				));
			},
			error: () => alertModal('단어 뜻을 추가하지 못 했습니다.')
		})							
	})
	// 뜻 추가 취소
	.on('click', '.js-add-cancel', function() {
		$(this).hide();
		$(this).closest('.add-new-sense-section').find('.js-add-meaning').hide();
		$(this).closest('.add-new-sense-section').find('input').val('');		
	})
	// 뜻 삭제
	.on('click', '.js-del-meaning', function() {
		const $partSection = $(this).closest('.one-part-unit-section');
		const command = {};
		const _this = this;
		if(this.closest('.showup-word')) {
			command['wordId'] = parseInt($partSection.closest('.showup-word').get(0).dataset.wordId);
			command['showUpId'] = parseInt($partSection.get(0).dataset.sid);
		}else {
			command['senseId'] = parseInt($partSection.get(0).dataset.sid);
		}
		$.ajax({
			url: `/adminxyz/dictionary/${_this.closest('.showup-word')?'showup':''}sense/del`,
			type: 'POST',
			data: command,
			success: () => {
				alertModal('뜻을 삭제했습니다.');
				$partSection.remove();
			},
			error: () => alertModal('단어 뜻을 삭제하지 못 했습니다.')
		})
	})
	
	/** Simple,ShowUp 영역에 맞는 단어뜻 리스트 및 뜻 추가폼 DOM을 생성
	@param isPhrasalVerb 심플: false, 쇼업: true
	 */
	function createSenseListAndForm(isPhrasalVerb, senseList) {
		return Array.from(senseList, sense => createOnePartSection(isPhrasalVerb, sense)).concat([
			{ el: 'label', className: 'add-new-sense-label mb-3', textContent: '뜻 추가'},
			{ el: 'div', className: 'add-new-sense-section', children: [
				{ el: 'div', className: 'row g-3 mb-2', children: [
					{ el: 'div', className: 'col-2', children: [
						{ el: 'select', className: 'form-select', children: [
							{ el: 'option', value: 'n.', textContent: '명사'},
							{ el: 'option', value: 'ad.', textContent: '부사'},
							{ el: 'option', value: 'v.', textContent: '동사'},
							{ el: 'option', value: 'vt.', textContent: '타동사'},
							{ el: 'option', value: 'vi.', textContent: '자동사'},
							{ el: 'option', value: 'prep.', textContent: '전치사'},
							{ el: 'option', value: 'conj.', textContent: '접속사'},
							{ el: 'option', value: 'a.', textContent: '형용사'},
							{ el: 'option', value: 'abbr.', textContent: '약어'},
							{ el: 'option', value: 'pron.', textContent: '대명사'},
							{ el: 'option', value: 'aux.', textContent: '조동사'},
							{ el: 'option', value: 'num.', textContent: '수사'},
							{ el: 'option', value: 'ordi.', textContent: '서수'},
							{ el: 'option', value: 'int.', textContent: '감탄사'},
							{ el: 'option', value: 'det.', textContent: '한정사'},
							{ el: 'option', value: 'NN.', textContent: '명사구'},
							{ el: 'option', value: 'PP.', textContent: '전치사구'},
							{ el: 'option', value: 'ADP.', textContent: '부사구'},
							{ el: 'option', value: 'AJP.', textContent: '형용사구'},
							{ el: 'option', value: 'phrasal-v.', textContent: '구동사', selected: isPhrasalVerb},
							{ el: 'option', value: 'VP.', textContent: '동사구'}
						]},
					]},
					{ el: 'div', className: 'col-8', children: [
						{ el: 'input', type: 'text', className: 'input-meaning form-text form-control mt-0', 
						placeholder: `${isPhrasalVerb?65:100}자 이내의 뜻 입력`, maxLength: isPhrasalVerb?65:100, onclick: function() {
							$(this).closest('.add-new-sense-section').find('.js-add-meaning,.js-add-cancel').show();
						}},
					]},
					{ el: 'div', className: 'col-2', children: [
						{ el: 'button', type: 'button', className: 'js-add-meaning btn btn-fico fas fa-check', style: 'display:none;' },
						{ el: 'button', type: 'button', className: 'js-add-cancel btn btn-outline-fico fas fa-times', style: 'display: none;' }
					]}
				]},
				isPhrasalVerb ? [
					{ el: 'div', className: 'row g-3 mb-1', children: [
						{ el: 'div', className: 'col-2 text-end pe-2 lh-lg', children: [
							{ el: 'span', className: 'badge rounded-pill bg-fc-purple', textContent: 'A' }
						]},
						{ el: 'div', className: 'col-8 text-center gx-3', children: [
							{ el: 'div', className: 'input-example-eng eng form-control text-sm text-start', contentEditable: 'plaintext-only', innerHTML: '',
							'data-org': '', placeholder: '500자 이내의 예문 입력', oninput: function() {
								$(this).closest('.add-new-sense-section').find('.js-add-meaning,.js-add-cancel').show();
							}}
						]}
					]}, 
					{ el: 'div', className: 'row g-3 mb-1', children: [
						{ el: 'div', className: 'col-2 text-end pe-2 lh-lg', children: [
							{ el: 'span', className: 'badge rounded-pill bg-danger', textContent: '가' }
						]},
						{ el: 'div', className: 'col-8 text-center gx-3', children: [
							{ el: 'input', type: 'text', className: 'input-example-kor kor form-control text-sm', value: '', 
							'data-org': '', placeholder: '500자 이내의 해석 입력', oninput: function() {
								$(this).closest('.add-new-sense-section').find('.js-add-meaning,.js-add-cancel').show();
							} }
						]}
					]}
				] : ''				
			]}
		])
	}	
	/** Simple,ShowUp 영역에 맞는 단어뜻 한 개의 DOM을 생성
	@param isPhrasalVerb 심플: false, 쇼업: true
	 */	
	function createOnePartSection(isPhrasalVerb, sense) {
		return { el: 'div', className: 'one-part-unit-section g-3 mb-3', 'data-sid':sense.sid||sense.ssid||sense.showUpId, children: [
			{ el: 'div', className: 'row mb-1', children: [
				{ el: 'div', className: 'col-2 text-end pe-5 lh-lg',  children: [ 
					{ el: 'span', className: 'part fs-5 lh-1', textContent: sense.partType }
				]},
				{ el: 'div', className: 'col-8 text-center',  children: [ 
					{ el: 'input', type: 'text', className: 'input-meaning meaning form-control', value: sense.meaning, 
					'data-org': sense.meaning, maxLength: isPhrasalVerb?65:100, 
					placeholder: `${isPhrasalVerb?65:100}자 이내의 뜻 입력`, oninput: function() {
						$(this).closest('.one-part-unit-section').find('.js-edit-meaning,.js-edit-cancel').show();
					}},
				]},
				{ el: 'div', className: 'col-2',  children: [ 
					{ el: 'button', type: 'button', className: 'js-edit-meaning btn btn-fico fas fa-check w-25', style: 'display:none;' },
					{ el: 'button', type: 'button', className: 'js-edit-cancel btn btn-outline-fico fas fa-times w-25', style: 'display:none;' },
					{ el: 'button', type: 'button', className: 'js-del-meaning btn btn-outline-fico fas fa-trash w-25'}
				]}
			]},
			isPhrasalVerb ? [
				{ el: 'div', className: 'row mb-1', children: [
					{ el: 'div', className: 'col-2 text-end pe-2 lh-lg', children: [
						{ el: 'span', className: 'badge rounded-pill bg-fc-purple', textContent: 'A' }
					]},
					{ el: 'div', className: 'col-8 text-center', children: [
						{ el: 'div', className: 'input-example-eng eng form-control text-sm text-start', contentEditable: 'plaintext-only', innerHTML: sense.eng||'',
						'data-org': sense.eng||'', placeholder: '500자 이내의 예문 입력', oninput: function() {
							$(this).closest('.one-part-unit-section').find('.js-edit-meaning,.js-edit-cancel').show();
						}}
					]}, 
					{ el: 'div', className: 'col-2'}
				]},
				{ el: 'div', className: 'row', children: [
					{ el: 'div', className: 'col-2 text-end pe-2 lh-lg', children: [
						{ el: 'span', className: 'badge rounded-pill bg-danger', textContent: '가' }
					]},
					{ el: 'div', className: 'col-8 text-center', children: [
						{ el: 'input', type: 'text', className: 'input-example-kor kor form-control text-sm', value: sense.kor||'', 
						'data-org': sense.kor||'', placeholder: '500자 이내의 해석 입력', oninput: function() {
							$(this).closest('.one-part-unit-section').find('.js-edit-meaning,.js-edit-cancel').show();
						} }
					]}
				]}
			] : ''
		]}
	}
}
