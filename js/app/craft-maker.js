/** 텐덤을 기초로 한 크래프트 배틀 출제를 위한 모듈
 @author LGM
 */
(function craftMaker($, window, document) {
	$.cachedScript = $.cachedScript || function( url, options ) {
		return $.ajax( $.extend( options || {}, { dataType: "script", cache: true, url }) );
	};
	if(typeof createElement == 'undefined') {
		$.cachedScript('https://static.findsvoc.com/js/util/DOM-util.min.js', {
			success: () => craftMaker($, window, document)
		});
		return;
	}
	
	let staticCraftPanel, craftToolbarGroup = {}, 
		battleAsks = [], battleTypeInfos = [], battleBtns = [], 
		// 캐싱 속성들
		categories = [], battleBooksMap = { step : [{ bbid: 10000001, title: '단계별 배틀'}] },
		battlebook_selection, workbook_battleSource,
		// 체크박스 그룹화를 위한 시퀀스값
		chkbxSeq = 0;
	let _memberId;
	const GRAMMARID_ORDERING = 880000;
	const BATTLE_TYPE_SELECTOR = 'data-battle-type';
	let undoList = [], redoList = []; // 편집 내역
	
	// 크래프트 데이터 초기화(메뉴 구성 및 출제 유형별 정보)
	$.getJSON('https://static.findsvoc.com/data/craft/maker-toolbar.json', json => {
		craftToolbarGroup = json;
		staticCraftPanel = createElement(json.craftPanel);
		battleAsks = json.battleAsks;
		battleTypeInfos = json.battleTypeInfos;
		battleBtns = json.commonEditorBtns;
	});
	let cachedAskTags = {}, cachedSources = {}, cachedCateAskTagMap = {}; // 검색어 캐시 
		
	let craftToolbar = createElement({
		el: 'div', 
		className: 'btn-toolbar row col-md-3',
		role: 'toolbar'});
	
	//------------------------ [이벤트 할당] --------------------------------------
	$(document)
	// 배틀타입, 난이도, 문법 카테고리 클릭 시 해당하는 배틀 수를 조회한다.
	.on('click', '.battle-type-section .btn, .battle-diffLevel-section .btn, .battle-category-section select', function() {
		let param = {};
		const addSection = this.closest('.add-battle-section');
		let counterSection = addSection.querySelector('.battles-counter-section');
		let statsType;
		if(!counterSection) {
			counterSection = createElement(craftToolbarGroup.battleCounterPanel)
			$.getJSON('/craft/battle/stats/total', total => {
				counterSection.querySelector('.counter-total').textContent = `${total}건`;
			}).fail(() => alertModal('전체 배틀 갯수를 조회할 수 없습니다.'));
			addSection.querySelector('.battle-type-section').before(counterSection);
		}
		if(this.matches('.battle-type-section .btn')) {
			statsType = 'type';
			const battleType = document.getElementById(this.htmlFor).value;
			param = { battleType };
		}else if(this.matches('.battle-diffLevel-section .btn')) {
			statsType = 'level';
			let diffLevel = document.getElementById(this.htmlFor).value;
			const engLength = addSection.querySelector('.battle-context').textContent.trim().length;
			diffLevel = calcDiffSpecific(diffLevel, engLength);
			param = { diffLevel };
		}else {
			statsType = 'gc';
			const categoryId = parseInt(this.value);
			param = { categoryId };
		}
		$.getJSON(`/craft/battle/stats/${statsType}`, param, function(result) {
			let section;
			switch(statsType) {
				case 'type':
					section = counterSection.querySelector('.counter-same-type');
					section.replaceChildren(createElement(Array.from(result, (count, i) => {
						return [{el: 'label', className: 'bg-fc-yellow col-auto ms-2 rounded-pill', textContent: `#${i + 1}`}, 
								{el: 'span', className: 'col-auto ps-1 pe-0', textContent: `${count}건`}]
					})));
					break;
				case 'level':
					section = counterSection.querySelector('.counter-same-difflevel')
					section.replaceChildren(createElement([
						{ el: 'span', className: 'col-auto', textContent: `${param.diffLevel}: ${result}건`}
					]));
					break;
				case 'gc':
					section = counterSection.querySelector('.counter-same-category')
					section.replaceChildren(createElement(
						{ el: 'span', className: 'col-auto', textContent: `${categories.find(c => c.cid == param.categoryId).title}: ${result}건`}
					));
					break;
			}
			if($.fn.bounce != undefined)
				$(section).bounce();
		}).fail(() => alertModal('배틀 갯수 조회에 실패했습니다.'));
	})
	// 배틀북 북 타입 선택시 해당 배틀북 목록을 불러와 표시한다.
	.on('change', '.select-book-type', function() {
		const bookType = this.value;
		const $battleSection = $(this).closest('.add-battle-section');
		const $bookSelect = $battleSection.find('.select-book');
		// 새 배틀북 생성
		if(this.value == 'new') {
			$.cachedScript('https://cdn.jsdelivr.net/npm/compressorjs/dist/compressor.min.js', {
				success : () => Compressor.setDefaults({quality: 0.8, width: 210, height: 315, maxWidth: 210, maxHeight: 315, resize: 'cover'})
			});
			$battleSection.find('.battle-book-section,.add-book-section').collapse('toggle');
			$bookSelect.empty();
			this.value = '';
			if(!$(this).data('bookPanelOpened')) {
				const $addBookSection = $battleSection.find('.add-book-section');
				openSummernote($addBookSection.find('.input-book-desc'));
				const timeConstant = `_${new Date().getTime()}`;
				$addBookSection.find('input[type="radio"]').each(function() {
					this.name += timeConstant;
					this.id += timeConstant;
				});
				$addBookSection.find('label[for]').each(function() {
					this.htmlFor += timeConstant;
				})
				$(this).data('bookPanelOpened', true);
			}
		}else {
			if(battleBooksMap[bookType]) {
				setBookList();
			}else {
				$.getJSON(`/craft/battlebook/my/${this.value}/list`, bookList => {
					battleBooksMap[bookType] = bookList;
					setBookList();
				})
			}
		}
		function setBookList() {
			$bookSelect[0].replaceChildren(createElement(Array.from(battleBooksMap[bookType], book => {
				return { el: 'option', value: book.battleBookId, textContent: book.title || '제목 없음' }
			})))
		}
	})
	.on('click', '.js-edit-battlebook-cover', function(e) {
		$(this).find('.input-book-cover').trigger('click');
	})
	.on('click', '.input-book-cover', function(e) {
		e.stopPropagation();
	})
	// [커버 이미지 변경]-----------------------------------------------------------
	.on('change', '.input-book-cover', function(e) {
		const $preview = $(this).closest('.add-book-section').find('.battlebook-cover-preview');
		let file = e.target.files[0];
		if (file == null) return false;
		const reader = new FileReader();
		reader.onload = function() {
			$preview.css('background-image', `url(${this.result})`)
					.css('opacity', '1');
			URL.revokeObjectURL(reader.result);
			$preview.siblings('.js-cancel-battlebook-cover').show();
		}
		new Compressor(file, {
			success(result) {
				reader.readAsDataURL(result);
			},
			error(err) {
				reader.readAsDataURL(file);
			}
		});
	})
	// [커버 이미지 리셋]
	.on('click', '.js-cancel-battlebook-cover', function(e) {
		e.preventDefault();
		e.stopPropagation();
		const $preview = $(this).closest('.add-book-section').find('.battlebook-cover-preview');
		$preview.css('background-image', '')
				.siblings('.input-book-cover').val(null)[0].checkValidity();
		$(this).hide();
	})	
	.on('click', '.js-cancel-add-book', function() {
		$(this).closest('.add-battle-section').find('.battle-book-section,.add-book-section').collapse('toggle');
	})
	.on('click', '.js-add-battlebook', function() {
		const $addSection = $(this).closest('.add-book-section');
		const fileInput = $addSection.find('.input-book-cover')[0];
		const bookType = {T:'theme',G:'grammar'}[$addSection.find('.input-book-type:checked').val().toUpperCase()];
		let command = new FormData($addSection[0]);
		
		if(!$addSection[0].checkValidity()) return;
		const deleteList = [];
		command.forEach((v, k) => {
			if(k.match(/_\d+/)) {
				command.append(k.replace(/_\d+/,''), v);
				deleteList.push(k);
			}
		});
		deleteList.forEach(k => command.delete(k));
		command.append('ownerId', _memberId);
		
		command.delete('files');
		if(!!fileInput.value) {
			new Compressor(fileInput.files[0], {
				success(result) {
					command.delete('coverImage');
					command.append('coverImage', result, result.name);
					// 배틀북 등록(ajax)--
					addBattleBook();
					//-------------------
				},
				error(err) {
					// 배틀북 등록(ajax)--
					addBattleBook();
					//-------------------
				}
			})
			// 배틀북 등록(ajax)--
		}else {
			command.delete('coverImage');
			addBattleBook();
		}
		
		function addBattleBook() {
			$.ajax({
				type: 'POST',
				url: '/craft/battlebook/add',
				data: command,
				processData: false, contentType: false,
				success: function(book) {
					(alertModal||alert)('배틀북을 등록했습니다.');
					// 등록한 배틀북을 배틀북 선택 목록에 추가
					if(battleBooksMap[bookType])
						battleBooksMap[bookType].push(Object.assign({battleBookId: book.bbid},book));
					// 배틀북 생성 패널이 새로 만들어지도록.
					
					$addSection.closest('.add-battle-section').find(`.select-book-type`)
						.val(bookType).trigger('change');
					$addSection.add($addSection.prev()).collapse('toggle');
					resetAddSection();
				},
				error: function() {
					(alertModal||alert)('배틀북 등록에 실패했습니다.');
				}
			})
		}
		
		function resetAddSection() {
			$addSection[0].reset();
			$addSection.find('.input-book-type[value="T"]').prop('checked', true);
			$addSection.find('.input-open-type[value="R"]').prop('checked', true);
			$addSection.find('.input-book-price').val(0);
			$addSection.find('.battlebook-cover-preview').css('background-image','');
			$addSection.find('.input-book-desc').summernote('reset');
		}
	})
	// 배틀타입 선택시 에디터 종류를 변경한다.
	.on('change', '.battle-type-section input[type=radio]', function() {
		const semanticResult = $(this).closest('.battle-section-panel').data('semantics');
		
		const makerContainer = this.closest('.add-battle-section').querySelector('.craft-maker-container');
		
		attachBattleMaker(makerContainer, semanticResult, parseInt(this.value));
	})
	// 에디터 메뉴의 질문(ask)을 선택하면 태그(tag) 프리셋값을 설정한다.
	.on('change', '.ask-select', function() {
		const addSection = this.closest('.add-battle-section');
		const selected = this.querySelector('option:checked');
		const tag = selected.dataset.tag;
		const tagInput = addSection.querySelector('.askTag');
		if(tag) tagInput.value = tag;
		else tagInput.value = '';
		
		
		const battleType = addSection.querySelector('.battle-type-section input:checked').value;
		if(battleType == '2' && (selected.value.includes('의 피수식') || selected.value.includes('의 수식'))) {
			const selector = selected.value.includes('의 피수식')? '피수식' : '수식';
			const key = selected.value.replace(`의 ${selector}`,'');
			const newKey = prompt(`???의 ${selector}어를 고르세요.\n???에 들어갈 단어를 입력하세요.`, key);
			if(newKey != null && newKey.length > 0) {
				selected.value = `${newKey}의 ${selector}`;
				selected.innerHTML = `(지정)${newKey}의 ${selector}어를 선택하세요.`;
			}else {
				selected.selected = false;
			}
		}
	})
	// 문법 카테고리 값을 변경하면 동일 문법에 대한 이전 askTag값을 사용. (내역이 없을 경우 빈 값)
	.on('change', '.battle-category-section select', function() {
		this.closest('.add-battle-section').querySelector('.askTag').value 
		= cachedCateAskTagMap[parseInt(this.value)] || '';
	})
	
	// 에디터 메뉴 내의 토글아이콘들은 다른 토글아이콘을 체크해제한다.
	.on('change', '.battle-maker [role=toolbar] [type=checkbox]', function() {
		if(!this.checked) {
			return;
		}
		this.closest('[role=toolbar]').querySelectorAll('[type=checkbox]:checked')
		.forEach(el => {
			if(this.compareDocumentPosition(el) != 0) el.checked = false;
		})
		
		const sel = getSelection();
		if(!sel.isCollapsed) {
			wrapText(this.closest('.battle-maker'));
		}
	})
	// 보기 및 정답 요소들은 다시 클릭 시 삭제된다.
	.on('click', '.battle-context *', function() {
		if(this.closest('.battle-maker')) {
			if(this.nodeName == 'SPAN') {
				if(this.closest('.add-battle-section').querySelector('.battle-type-section .btn-check:checked').value == 7) {
					this.closest('.battle-maker').querySelector('.select-kor .custom-trans').remove();
					this.closest('.battle-maker').querySelector('.select-kor').classList.remove('pe-none');
				}
				this.outerHTML = this.innerHTML;
			}else {
				this.remove();
			}
		} 
	})
	// 실행취소 및 재실행 동작
	.on('click', '.battle-maker [value=undo], .battle-maker [value=redo]', function() {
		const isUndo = this.value == 'undo';
		const editHistory = isUndo ? undoList.pop() : redoList.pop();
		const makerDiv = this.closest('.battle-maker');
		const context = makerDiv.querySelector('.battle-context');
		
		(isUndo ? redoList : undoList).push(context.innerHTML);
		context.innerHTML = editHistory;
		$(context).animate({opacity:0.5},100).animate({opacity:1},100);
		
		makerDiv.querySelector('[value=undo]').disabled = undoList.length == 0;
		makerDiv.querySelector('[value=redo]').disabled = redoList.length == 0;
	})
	.on('keyup', function(e) {
		const battleMaker = e.target.closest('.battle-maker');
		if(battleMaker) {
			if(e.ctrlKey && e.key.toUpperCase() == 'Z')
				$(battleMaker).find('[value=undo]').trigger('click');
			else if(e.ctrlKey && e.key.toUpperCase() == 'Y')
				$(battleMaker).find('[value=redo]').trigger('click');
		}
	})
	.on('input change', '.add-battle-section :input,.add-battle-section textarea', function() {
		$(this.closest('.add-battle-section')).find('.js-add-battle').prop('disabled', false);
	})
	// 배틀 등록 버튼 클릭시 배틀입력 정보를 커맨드로 취합하여 전송
	.on('click', '.js-add-battle', function() {
		const addSection = this.closest('.add-battle-section');
		
		const battleBookId = parseInt(addSection.querySelector('.select-book').value);
		if(Number.isNaN(battleBookId)) {
			alertModal('❗배틀북을 선택해 주세요.');
			return;
		}
		
		const battlePanel = addSection.closest('.battle-section-panel');
		const battleContext = addSection.querySelector('.battle-context');
		const categoryId = parseInt(addSection.querySelector('.battle-category-section select').value);
		
		const battleType = addSection.querySelector('.battle-type-section input:checked').value;
		const diffLevel = addSection.querySelector('.battle-diffLevel-section input:checked').value;
		const ask = addSection.querySelector('.ask-select').value.trim();
		const askTag = addSection.querySelector('.askTag').value.trim();
		const comment = addSection.querySelector('.comment').value.trim();
		const source = addSection.querySelector('.source').value.trim();
		const engLength = battleContext.textContent.trim().length;
		
		if(comment.length > 1500) {
			alertModal('배틀 해설의 길이가 너무 깁니다.');
			return;
		}
		
		const command = {
			battleBookId, categoryId, battleType, ask, askTag, comment, source, diffLevel, engLength,
			sentenceId: $(battlePanel).data('sentenceId'),
			memberId: _memberId,
			example: '', answer: '',
			diffSpecificLevel: calcDiffSpecific(diffLevel, engLength)
		}
				
		// 배틀 유형별 example, answer 정보 구성.
		switch(battleType) {
			case '1': {
											// [보기 위치1, 보기 위치2, ...]
				const [examples, answers] = [findPositions(battleContext, '.answer, .option'),
											// [정답 위치]
											findPositions(battleContext, '.answer')];
				if(answers.length == 0) {
					alertModal('문제로 만들 어구를 선택해 주세요.');
					return;
				}else if(examples.length == answers.length) {
					alertModal('오답 보기를 선택해 주세요.');
					return;
				}
				Object.assign(command, { example: JSON.stringify(examples), answer: JSON.stringify(answers)});
				break;
			}
			case '2':
				// [[수식어 위치1, 수식어 위치2, ...], [피수식어 위치1, 피수식어 위치2, ...], ...]
				const modifiers = findPositions(battleContext, '.modifier'),
					modificands = findPositions(battleContext, '.modificand');
				if(ask.includes('모든 피수식') && (modifiers.length > 0 || modificands.length == 0)) {
					alertModal('피수식어만 1개 이상 선택해 주세요.');
					return;
				}else if(ask.includes('모든 수식') && (modificands.length > 0 || modifiers.length == 0)) {
					alertModal('수식어만 1개 이상 선택해 주세요.');
					return;
				}else if(!ask.includes('모든') && (modifiers.length && modificands.length) == 0) {
					alertModal('수식어/피수식어를 1쌍 이상 선택해 주세요.');
					return;
				}
				command.answer = JSON.stringify([ modifiers, modificands ]);
				break;
			case '3': {
				const blank = battleContext.querySelector('.pick-right');
				if(!blank) {
					alertModal('문제로 만들 어구를 선택해 주세요.');
					return;
				}
				// [빈칸 위치, 정답 텍스트, 오답 텍스트]
				command.example = JSON.stringify([ findPositions(battleContext, '.pick-right')[0], 
												blank.textContent.trim(), blank.dataset.wrong.trim() ]);
				// [정답 텍스트]
				command.answer = JSON.stringify([ blank.textContent.trim() ]);
				break;
			}
			case '4': {
				const wrong = battleContext.querySelector('.answer-wrong');
				if(battleContext.querySelector('.option') == null) {
					alertModal('보기 어구를 선택해 주세요.');
					return;					
				}
				// [보기 위치1, 보기 위치2, ...]
				command.example = JSON.stringify(findPositions(battleContext, '.option, .answer-wrong'));
				// [정답 위치, 정답 텍스트, 오답 텍스트]
				command.answer = JSON.stringify([ findPositions(battleContext, '.answer-wrong')[0], 
												wrong.textContent.trim(), wrong.dataset.wrong.trim() ]);
				break;
			}
			case '5':
				if(battleContext.querySelectorAll('.option').length == 0) {
					alertModal('보기를 추가해 주세요.');
					return;
				}
				// 목록에서 선택한 해석id는 ask로
				command.ask = addSection.querySelector('.select-kor').value;
				// [보기 위치1, 보기 위치2, ...]
				command.example = JSON.stringify(findPositions(battleContext, '.option'));

				break;
			case '6': {
				if(battleContext.querySelector('.fill-right') == null) {
					alertModal('문제로 만들 어구를 선택해 주세요.');
					return;					
				}
				const blank = battleContext.querySelectorAll('.fill-right');
				// 목록에서 선택한 해석id는 ask로
				command.ask = addSection.querySelector('.select-kor').value;
				// [빈칸 위치, 정답 텍스트]
				command.example = JSON.stringify(Array.from(findPositions(battleContext, '.fill-right'), (pos,i) => {
					return [pos, blank[i].textContent.trim()];
				}));
				break;
			}
			case '7':
				if(battleContext.querySelectorAll('.option').length > 0) {
					command.answer = JSON.stringify(findPositions(battleContext, '.option'))
				}
				// 목록에서 선택한 해석id는 ask로(영문 구간을 따로 선택했다면 입력한 해석내용을 ask로)
				command.ask = addSection.querySelector('.select-kor').value;
				// [ 추가단어1, 추가단어2, ... ]
				command.example = JSON.stringify(addSection.querySelector('.battle-opt-ext').value.trim().split(/\s*\/\s*/));
				
				break;
			case '8': {
				const blank = battleContext.querySelector('.pick-right');
				if(!blank) {
					alertModal('문제로 만들 어구를 선택해 주세요.');
					return;
				}else if(!addSection.querySelector('.battle-opt-ext').value.trim().split(/\s*\/\s*/).join('')) {
					alertModal('오답 보기를 입력해 주세요.');
					addSection.querySelector('.battle-opt-ext').focus();
					return;
				}
				// [빈칸 위치, 정답 텍스트, [오답 텍스트1, 오답 텍스트2, ...]]
				command.example = JSON.stringify([ findPositions(battleContext, '.pick-right')[0], 
												blank.textContent.trim(), addSection.querySelector('.battle-opt-ext').value.trim().split(/\s*\/\s*/) ]);
				// [정답 텍스트]
				command.answer = JSON.stringify([ blank.textContent.trim() ]);
				break;
			}
			default: break;
		}
		
		// (ajax) 배틀 등록
		$.ajax({
			url: '/craft/battle/add',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify(command),
			success: function(response) {
				// 태그 캐시 갱신
				pushToCache(askTag, cachedAskTags);
				// 출처 캐시 갱신
				pushToCache(source, cachedSources);
				// 카테고리-태그 갱신
				cachedCateAskTagMap[categoryId] = askTag;
				// 커스텀 해석 삭제
				if(addSection.querySelector('.select-kor .custom-trans')) {
					addSection.querySelector('.select-kor .custom-trans').remove();
					addSection.querySelector('.select-kor').classList.remove('pe-none');
				}
				
				if(!document.getElementById('craftResultModal')) {
					document.body.appendChild(createElement(craftToolbarGroup.addResultModal));
				}
				
				$(addSection).find('textarea.comment').summernote('reset');
				
				$(addSection).find('.js-add-battle').prop('disabled', true);
				$('#craftResultModal .battle-id').text(response.battleId);
				$('#craftResultModal .group-count').text(response.groupCount);
				$('#craftResultModal').modal('show');
				
				
				// 워크북 내에서 등록한 경우 북타입 기본값 지정.
				battlebook_selection = { type: addSection.querySelector('.select-book-type').value, bookId: battleBookId };
				
				// 워크북 내에서 등록한 경우 배틀 출처 기본값 지정.
				if(!workbook_battleSource && command.source.length > 0 && window.location.pathname.startsWith('/workbook/passage')) {
					workbook_battleSource = command.source;
				}
				
				battleContext.replaceChildren(battleContext.textContent);
				
				command.battleId = response.battleId;
				command.grammarTitle = categories.find(c => c.cid == categoryId).title;
				if(command.battleType == '7') {
					command.kor = (command.answer != null) 
						? command.ask 
						: $(battlePanel).data('transList').find(t => t.id == parseInt(command.ask)).text.trim();
				}
				const battleList = battlePanel.querySelector('.existing-battles-section');
				const newBattle = previewBattle($(battlePanel).data('eng'), command);
				let battleGroupBtn = battleList.querySelector(`[${BATTLE_TYPE_SELECTOR}="${battleType}"]`);
				let battleGroupBlock;
				// 유형 그룹이 없을 경우
				if(!battleGroupBtn) {
					// 문장에서의 첫 등록
					if(!battleList.querySelector(`[${BATTLE_TYPE_SELECTOR}]`)) {
						// 배틀 미등록 문구 삭제
						battleList.replaceChildren();
					}
					const randId = Date.now() + 1;
					[battleGroupBtn, battleGroupBlock] = makeExistingBattle(battleType,1,randId,[]);
					battleGroupBtn = createElement(battleGroupBtn);
					battleGroupBlock = createElement(battleGroupBlock);
					battleList.append(battleGroupBtn);
					$(battleGroupBtn).css('height',0).animate({height:'100%'}, 500, function() { this.style.height = 'auto';});
					// 유형 그룹 추가
					battleList.append(battleGroupBlock)
				}
				else {
					// 기존 유형 그룹에 추가
					const battleCountBlock = battleGroupBtn.querySelector('.battle-count');
					battleCountBlock.textContent = parseInt(battleCountBlock.textContent) + 1;
					battleGroupBlock = document.querySelector(battleGroupBtn.dataset.bsTarget);
				}
				const newBattleBlock = createElement(newBattle)
				battleGroupBlock.append(newBattleBlock);
				$(newBattleBlock).css('display','none').slideDown()
			},
			error: function(err) {
				alertModal(err);
			}
		})
	})
	// 배틀 삭제
	.on('click', '.js-delete-battle', function() {
		const battleBlock = this.closest('.battle-preview-one');
		const battlesBlock = battleBlock.closest('.battle-preview')
		const battleGroupBtn = battlesBlock.previousElementSibling;
		const battleId = battleBlock.dataset.id;
		$.post(`/craft/battle/del/${battleId}`, function() {
			alertModal('배틀이 삭제되었습니다.');
			battleBlock.remove();
			const counter = battleGroupBtn.querySelector('.battle-count');
			const decreased = parseInt(counter.textContent) - 1;
			if(decreased > 0) {
				counter.textContent = decreased; 
			}else {
				battlesBlock.remove();
				battleGroupBtn.remove();
			}
		}).fail(() => alertModal('배틀 삭제에 실패했습니다.'))
	})
	/** 배틀 출제 패널을 컨테이너에 삽입
	 */
	async function openBattleMakerPanel(container, memberId, sentenceId, semanticsDiv, transList) {
		if(!$.fn.autocomplete) {
			document.head.append(createElement(
				[{el: 'link', rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/jquery-ui-dist@1.13.1/jquery-ui.min.css'},
				{el: 'link', rel: 'stylesheet', href: 'https://static.findsvoc.com/css/app/craft-maker.min.css'}]));
			// 배틀 태그(askTag)의 제시어 기능을 위해 jquery-ui 사용
			// jquery-ui와 부트스트랩의 tooltip 함수 충돌 때문에 
			// 부트스트랩 메소드를 임시 저장한 채로 jquery-ui모듈을 로드한 후 원상복구
			const _tooltip = $.fn.tooltip;
			$.cachedScript('https://cdn.jsdelivr.net/npm/jquery-ui-dist@1.13.1/jquery-ui.min.js', {
				success: () => {
					$.fn.tooltip = _tooltip;
					openBattleMakerPanel(container, memberId, sentenceId, semanticsDiv, transList);
				}
			});
			return;
		}
		
		
		// 카테고리 화면에서 최초 1회 불러오기
		const categorySection = staticCraftPanel.querySelector('.battle-category-section select');
		if(categories.length == 0) {
			$.getJSON('/grammar/category/list', results => {
				categories = results;
				let elements = Array.from(categories, c => {
					return { el:'option', value: c.cid, textContent: `${(c.parentCategory ? '└─ ':'')}${c.title}`};
				})
				categorySection.append(createElement(elements));
				openBattleMakerPanel(container, memberId, sentenceId, semanticsDiv, transList);
			});
			return;
		}
		_memberId = memberId;
		const sentenceEng = tandem.cleanSvocDOMs(semanticsDiv).innerText;
		
		// 공용 패널 복사본으로 패널 새로 생성
		let panelInstance = staticCraftPanel.cloneNode(true);
		if(typeof openSummernote == 'undefined') {
			await $.cachedScript('https://static.findsvoc.com/js/util/summernote.editor.min.js');
		}
		if(!staticCraftPanel.querySelector('.battle-comment-section textarea.comment~.note-editor')) {
			const $sentenceUnit = $(container).closest('.one-sentence-unit-section');
			if($sentenceUnit.length > 0 && $sentenceUnit.find('.note-list .note-text').length > 0) {
				$(panelInstance).find('.battle-comment-section textarea.comment').val($sentenceUnit.find('.note-list .note-text').html());
			}
			await openSummernote($(panelInstance).find('.battle-comment-section textarea.comment').removeClass('d-inline'));
		}
		
		// 배틀북 선택 초기화
		/*$(panelInstance).find('.battle-book-section .select-book-type').val('step');
		$(panelInstance).find('.battle-book-section .select-book').get(0).replaceChildren(createElement({
			el: 'option', textContent: '단계별 배틀', value: 10000001
		}))*/
		
		// 전달받은 인자값들을 패널 요소에 접근하여 얻을 수 있도록 설정
		$(panelInstance).data('semantics', semanticsDiv)
						.data('sentenceId', sentenceId)
						.data('eng', sentenceEng)
						.data('transList', transList.filter(t => !!t.id));
						
		// 패널 내의 라디오버튼들에 유니크한 이름 설정(다른 패널들과 동작이 겹치지 않도록)
		const now = Date.now();
		panelInstance.querySelectorAll('[data-radio]')
			.forEach((radioGroup, i) => {
				const radioName = `${radioGroup.dataset.radio}${now}${i}`
				radioGroup.querySelectorAll('input[type=radio]').forEach((radio, j) => {
					radio.name = radioName;
					radio.id = `${radioName}${j}`;
					radio.nextElementSibling.htmlFor = `${radioName}${j}`;
				})
		});
		// 문장에 등록된 배틀 조회
		$.getJSON(`/craft/battle/search/${sentenceId}`, battles => {
			let battleSummary = {}; // 타입별 배열로 저장(1: [a,b,c], 2: [d,e,f], ...)
			battles.forEach(battle => {
				if(battleSummary[battle.battleType] == null) 
					battleSummary[battle.battleType] = [];
				battleSummary[battle.battleType].push(battle);
			});
			const battleListSection = panelInstance.querySelector('.existing-battles-section');
			// 이전 배틀 목록 비우기
			battleListSection.replaceChildren();
			if(Object.entries(battleSummary).length == 0) {
				battleListSection.append('등록된 배틀이 없습니다.');
			}else {
				Object.entries(battleSummary).forEach((summ, i) => {
					const randId = Date.now() + i;
					battleListSection.append(createElement(
						makeExistingBattle(summ[0], summ[1].length, randId, 
							Array.from(summ[1], battle => {
								let korAttachedBattle;
								if(battle.battleType == '7') {
									korAttachedBattle = Object.assign({}, battle, {kor: transList.find( t => t.id==parseInt(battle.ask)).text.trim()});
								}else korAttachedBattle = battle;
								
								return previewBattle(sentenceEng, korAttachedBattle)
							}))));
				})
			}
		})
		
		container.replaceChildren();
		// 배틀 1 유형을 기본으로 에디터 지정
		attachBattleMaker(panelInstance.querySelector('.craft-maker-container'), semanticsDiv, 1);
		container.append(panelInstance);
		
		// 배틀 생성탭이 처음 나올 때 askTag값 임의 지정
		$(panelInstance).find('.ask-select').trigger('change');
		
		// 배틀 태그(askTag)에 제시어 기능 적용
		// 배틀 출처(source)에 제시어 기능 적용
		$(panelInstance).find('.askTag, .source').each(function() {
			const ajaxURL = `/craft/battle/${this.matches('.askTag') ? 'tag' : 'source'}/search/{}`;
			const cacheList = this.matches('.askTag') ? cachedAskTags : cachedSources;
			$(this).autocomplete({
				minLength: 1, delay: 50, source: function(req, res) {
					const term = req.term && req.term.trim();
					if(term in cacheList) {
						res(cacheList[term]);
						return;
					}
					$.getJSON(ajaxURL.replace('{}',term), function(data) {
						if(data.length > 0) cacheList[term] = data.sort();
						res(data);
					}).fail(() => {
						res([]);
					})
				}
			})
		})
		if(battlebook_selection) {
			panelInstance.querySelector('.select-book-type').value = battlebook_selection.type;
			panelInstance.querySelector('select.select-book').replaceChildren(createElement(Array.from(battleBooksMap[battlebook_selection.type], book => {
				return { el: 'option', value: book.battleBookId, textContent: book.title || '제목 없음' }
			})))
			panelInstance.querySelector('select.select-book').value = battlebook_selection.bookId;
		}
		
		if(workbook_battleSource) {
			panelInstance.querySelector('input.source').value = workbook_battleSource;
		}
	}
	
	
	/** 배틀 문제 생성.
	@param container 에디터가 들어갈 div
	@param semanticsDiv 문제 대상 .semantics-result
	@param battleType 배틀 유형(1,2,3,4,5)
	 */
	function attachBattleMaker(container, semanticsDiv, battleType) {
		container.replaceChildren();
		redoList = []; undoList = [];
		const makerDiv = createElement({el: 'div', className: 'battle-maker row', tabIndex: 0})
		container.append(makerDiv);	
		let asks = Array.from(battleTypeInfos)[battleType - 1];
		// 1, 2 유형의 경우 대상 문장에 포함된 성분들 파악해서 질문 목록에서 우선표시
		if([1,2].includes(battleType)) {
			asks.forEach(el => {
				if(el.selector != null && semanticsDiv.querySelector(`.sem${el.selector}`) != null )
					el.recommended = true;
			});
			/*asks.sort((a,b) => {
				if(!a.recommended) return 1;
				return b.recommended ? 0 : -1;
			})*/
		}
		// 배틀 유형별 툴바 표시
		appendToolbar(battleType, makerDiv);
		
		const engLength = tandem?.cleanSvocDOMs(semanticsDiv).textContent.length;
		makerDiv.querySelector('.eng-length').textContent = engLength;
		// 문장 길이에 따라 난이도 선택을 제한( engLength > 80: 중↑, engLength > 150: 상)
		//makerDiv.querySelector('.battle-level-select[value="A"]').disabled = engLength > 80;
		//makerDiv.querySelector('.battle-level-select[value="B"]').disabled = engLength > 150;
		const levelSelectorC = makerDiv.querySelector('.battle-level-select[value="C"]'),
			  levelSelectorB = makerDiv.querySelector('.battle-level-select[value="B"]');
		
		if(engLength > 150) {
			levelSelectorC.checked = true;
			bootstrap.Tooltip.getOrCreateInstance(levelSelectorC.nextElementSibling).enable();
			bootstrap.Tooltip.getOrCreateInstance(levelSelectorB.nextElementSibling).disable();
		}else {
			bootstrap.Tooltip.getOrCreateInstance(levelSelectorC.nextElementSibling).disable();
			if(engLength > 80) {
				levelSelectorB.checked = true;
				bootstrap.Tooltip.getOrCreateInstance(levelSelectorB.nextElementSibling).enable();
			}else {
				bootstrap.Tooltip.getOrCreateInstance(levelSelectorB.nextElementSibling).disable();
			}
		}
		makerDiv.querySelector('.battle-level-select[value="B"]').checked = engLength > 80;
		makerDiv.querySelector('.battle-level-select[value="C"]').checked = engLength > 150;
		
		// 배틀 유형별 질문 표시
		makerDiv.prepend(createElement(createAskSelect(battleType, asks)));
		if([1,2].includes(battleType)) {
			const selectedAsk = makerDiv.closest('.add-battle-section').querySelector('.ask-select');
			$(selectedAsk).trigger('change');
		}			
		// 수정 영역 표시
		appendContext(semanticsDiv, makerDiv);		
	}
	
	/** 주어진 버튼 그룹을 툴바에 넣어서 에디터에 탑재
	 */
	function appendToolbar(battleType, maker) {
		const btnGroup = craftToolbarGroup[`battle${battleType}`]
		craftToolbar.innerHTML = '';
		appendClassifiedElement(btnGroup, craftToolbar);
		for(let i = 0, len = battleBtns.length; i < len; i++) {
			appendClassifiedElement(battleBtns[i], craftToolbar);
		}
		maker.prepend(craftToolbar.cloneNode(true));
		
		const now = Date.now();
		const levelBtns = {el: 'div', className: 'battle-diffLevel-section col-12 col-md-3 row',
			children: [
				{el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '난이도'}
			]
		};
		[{text: '쉬움', value: 'A'},{text: '보통', value: 'B'},{text: '어려움', value: 'C'}]
		.forEach(function(level, i) {
			levelBtns.children.push({el: 'input', type: 'radio', autocomplete: 'off',
				name: `btnRadioBattleLevel${now}`,
				id: `btnRadioBattleLevel${now}${i}`,
				className: 'btn-check battle-level-select', 
				checked: i == 0, value: level.value});
			levelBtns.children.push({el: 'label', textContent: level.text, 'data-bs-toggle': i>0?'tooltip':'',
				htmlFor: `btnRadioBattleLevel${now}${i}`, 'data-bs-html': 'true', 'data-bs-title': '문장 길이로 시스템이 파악한<br>최소 난이도입니다.', 'data-bs-trigger': 'manual',
				className: 'col btn col-auto px-4 ms-1 rounded-pill btn-outline-fico'});
		})
		appendClassifiedElement(levelBtns, maker);
		
		maker.appendChild(createElement([
			{ el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '길이' },
			{ el: 'span', className: 'col-auto my-auto eng-length' }
		]))
		
		
		const categorySelect = maker.closest('.add-battle-section').querySelector('.battle-category-section select')
		if([5,6,7].includes(battleType)) {
			// 5유형의 배틀은 '어순'을 기본 문법 카테고리로 선택
			//categorySelect.value = GRAMMARID_ORDERING;
			//$(categorySelect).trigger('click');
			// 5유형의 배틀은 해석을 선택하는 영역을 추가(ask로 지정됨)
			maker.appendChild(createElement({
				el: 'div', className: 'col-12 row mt-3',
				children: [
					{el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '해석'},
					{el: 'select', className: 'select-kor form-select d-inline-block col',
					children: Array.from($(maker).closest('.battle-section-panel').data('transList'), (trans, i) => {
						return {el: 'option', value: trans.id, textContent: trans.text.trim(), 'data-trans': trans.text.trim() }
					})}
				]
			}));
		}
		if([7,8].includes(battleType)) {
			maker.appendChild(createElement({
				el: 'div', className: 'col-12 row mt-3', children: [
					{ el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '오답'},
					{ el: 'input', 
						type: 'text', 
						className: 'battle-opt-ext form-control col lh-1 my-auto', 
						placeholder: `선택지로 추가할 단어나 구들을 입력해 주세요. 추가될 단어들은 / 기호로 구분됩니다. 예) ${battleType === 7 ? '우리가/우리를' : 'we/us'}`}
				]
			}))
		}
		// 3,4,5 유형은 askTag을 먼저 비움
		if(battleType > 2) {
			$(categorySelect).trigger('change');
		}
	}
	/** 주어진 질문 목록을 에디터에 설정
	@param battleType 배틀 유형 1,2,3,4,5
	@param askArray 질문 목록 [{selector, tag, recommended}]
	 */
	function createAskSelect(battleType, askArray) {
		return {
			el: 'div', 
			className: 'col-12 col-md-3 row',
			children: [
				{	el: 'label', textContent: '질문', 
					className: 'col-auto lh-1 my-auto text-fc-purple fw-bold'
				},
				{
					el: 'select', 
					className: 'form-select ask-select col', 
					children: createAskOptions(battleType, askArray)
				}
			]};
	}
	function createAskOptions(battleType, askArray) {
		const options = [];
		askArray.forEach((one, i) => {
			const option = {el: 'option'};
			if(one.recommended) option.className = 'bg-fc-light-purple';
			option.value = one.tag || `#${battleType}`;
			if(one.tag) option['data-tag'] = one.tag;
			
			option.innerHTML = combineAsk(battleType, one.tag);
			if(i == 0 && battleType != 2) option.selected = true;
			options.push(option);
		});
		// 2유형 질문에는 정적 선택지 2개 제일 위에 추가
		if(parseInt(battleType) == 2) {
			const modifyExist = (askArray.find(v => v.recommended) != null);
			options.unshift({ 
				el: 'option', 
				className: modifyExist?'bg-fc-light-purple':'', 
				value: '의 피수식', 
				innerHTML: '(지정)___의 피수식어를 선택하세요.'
			});
			options.unshift({ 
				el: 'option', 
				className: modifyExist?'bg-fc-light-purple':'', 
				value: '의 수식', 
				innerHTML: '(지정)___의 수식어를 선택하세요.'});
			options.unshift({ 
				el: 'option', 
				className: modifyExist?'bg-fc-light-purple':'', 
				value: '모든 피수식', 
				innerHTML: '피수식어를 모두 선택하세요.'});
			options.unshift({ 
				el: 'option', 
				className: modifyExist?'bg-fc-light-purple':'', 
				value: '모든 수식', 
				selected: true, 
				innerHTML: '수식어를 모두 선택하세요.'});
		}		
		return options;
	}
	
	/** 구문분석 div로부터 원문 텍스트를 추출하여 에디터 본문으로 삽입
	 */
	function appendContext(semanticsResult, maker) {
		appendClassifiedElement({
			el: 'div', className: 'row pe-2', children: [
				{el: 'label', className: 'col-auto lh-1 my-auto text-white fw-bold', textContent: '본문'},
				{el: 'div', className: 'battle-context fs-5 bg-white mt-3 px-2 col form-control',
					textContent: tandem.cleanSvocDOMs(semanticsResult).innerText, onmouseup: () => wrapText(maker)}
			]}, maker);
	}
	// Regular expression that matches any character that is not whitespace or punctuation
	const REGEX_NOT_WHITESPACE_PUNCT = /[^\s,.!?;:…]/, 
	// Regular expression that matches any string that starts with whitespace or punctuation
		REGEX_STARTSWITH_WHITESPACE_PUNCT = /^(\s|[,.!?;:…])/,
	// Regular expression that matches any string that ends with whitespace or punctuation	
		REGEX_ENDSWITH_WHITESPACE_PUNCT = /(\s|[,.!?;:…])$/,
	// Regular expression that matches commonly used short verbs, such as "I'm", "you're", "he's", etc.
		REGEX_SHORT_VERB = /('m|'re|'s|'d|'ll|'ve)$/;
	/** BattleMaker 내부에 선택된 텍스트를 span으로 감싸고 에디터에서 선택된 메뉴에 따라 클래스 지정
	 */
	function wrapText(maker) {
		let sel = getSelection();
		// 에디터에서 선택된 메뉴버튼
		const chkdBtn = maker.querySelector('[role=toolbar] [type=checkbox]:checked');
		
		if(sel.isCollapsed || !chkdBtn) return;
		
		const context = maker.querySelector('.battle-context');
		
		if(sel.toString().replace(/\W/g,'') == context.textContent.replace(/\W/g,'')
		|| !(8 & sel.anchorNode.compareDocumentPosition(context)
			 & sel.focusNode.compareDocumentPosition(context))) return;
		
		const battleType = parseInt(maker.closest('.add-battle-section').querySelector('.battle-type-section input:checked').value);
		
		// 배틀 3,4,7 유형에 정답을 두 개 이상 선택하려는 경우 취소 
		const wrapperClass = chkdBtn.value;
		if((([3,4].includes(battleType) && wrapperClass.match(/pick-right|answer-wrong/)) || battleType == 7 || battleType == 8) 
		&& context.getElementsByClassName(wrapperClass).length > 0) {
			alertModal('이 유형의 배틀은 복수 정답을 허용하지 않습니다.\n기존 정답을 눌러 지워 주세요.');
			getSelection().removeAllRanges();
			return;
		}
		
		/* 선택 범위를 단어 단위로 선택되도록 자동 조절. 선택범위의 양끝 공백은 제거
			배틀 1, 3 유형은 띄어쓰기가 아닌 apostrophe를 기준으로 범위를 지정할 수도 있어서 예외
		*/
		// 드래그 선택 방향이 오른쪽->왼쪽이라면 방향을 뒤집는다.(아래의 로직 전개를 위해)
		if(sel.anchorNode.compareDocumentPosition(sel.focusNode) & Node.DOCUMENT_POSITION_PRECEDING
		|| (sel.anchorNode.compareDocumentPosition(sel.focusNode) == 0	// 0 : 동일 노드
		&& sel.anchorOffset > sel.focusOffset)) {
			sel.setBaseAndExtent(sel.focusNode, sel.focusOffset, sel.anchorNode, sel.anchorOffset);
		}
		// 왼쪽에 선택할 글자가 있다면 추가선택
		while(sel.anchorOffset > 0 
		&& sel.anchorNode.textContent.charAt(sel.anchorOffset).match(REGEX_NOT_WHITESPACE_PUNCT)
		&& sel.anchorNode.textContent.charAt(sel.anchorOffset -1).match(REGEX_NOT_WHITESPACE_PUNCT)
		&& (![1,3].includes(battleType) || !sel.toString().trim().match(REGEX_SHORT_VERB))) {
			sel.setBaseAndExtent(sel.anchorNode, sel.anchorOffset - 1, sel.focusNode, sel.focusOffset);
		}
		// 왼쪽 끝이 공백이거나 구두점이면 왼쪽 범위를 축소
		while(sel.toString().match(REGEX_STARTSWITH_WHITESPACE_PUNCT)) {
			sel.setBaseAndExtent(sel.anchorNode, sel.anchorOffset + 1, sel.focusNode, sel.focusOffset);
		}
		// 오른쪽에 선택할 글자가 있다면 추가선택
		while( sel.focusOffset < sel.focusNode.textContent.length
			// 마지막 글자가 공백문자가 아니고
		&& sel.focusNode.textContent.charAt(sel.focusOffset - 1).match(REGEX_NOT_WHITESPACE_PUNCT) 
			// 오른쪽 글자도 공백문자가 아닌 것 중에
		&& sel.focusNode.textContent.charAt(sel.focusOffset).match(REGEX_NOT_WHITESPACE_PUNCT)
			// 배틀 1,3 타입이 아니거나 
		&& (![1,3].includes(battleType) 
			// 텍스트 길이가 2보다 길면서 
			|| !(sel.focusNode.textContent.length > 2 
				&& sel.focusNode.textContent.substring(sel.focusOffset, sel.focusOffset + 3).trim().match(REGEX_SHORT_VERB))
			)
		) {
			sel.setBaseAndExtent(sel.anchorNode, sel.anchorOffset, sel.focusNode, sel.focusOffset + 1);
		}
		// 오른쪽 끝이 공백이거나 구두점이면 오른쪽 범위를 축소
		while(sel.toString().match(REGEX_ENDSWITH_WHITESPACE_PUNCT)) {
			sel.setBaseAndExtent(sel.anchorNode, sel.anchorOffset, sel.focusNode, sel.focusOffset - 1);
		}
		if(sel.toString().trim().length == 0 || sel.toString().replace(/\W/g,'') == context.textContent.replace(/\W/g,'')) 
			return;
			
		// Undo 리스트에 추가
		pushEditHistory(context);
		
		// 선택범위의 텍스트를 span으로 변환
		const wrapper = document.createElement('span');
		wrapper.className = wrapperClass;
		const range = sel.getRangeAt(0);
		
		wrapper.textContent = range.extractContents().textContent;
		range.insertNode(wrapper);
		sel.removeAllRanges();

		// 빈 요소가 생겼을 경우 제거	
		const emtpyWrapperTreeWalker = document.createTreeWalker(context, NodeFilter.SHOW_ELEMENT,
			{ acceptNode: node => node.textContent.length === 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP }
		);
		while(emtpyWrapperTreeWalker.nextNode()) {
			emtpyWrapperTreeWalker.currentNode.parentNode.removeChild(emtpyWrapperTreeWalker.currentNode);
		}
		
		// 새로운 wrapper로 인해 영향받는 컨텍스트 내의 모든 요소들에 trim()을 적용
		const allWrapperTreeWalker = document.createTreeWalker(context, NodeFilter.SHOW_ELEMENT);
		while(allWrapperTreeWalker.nextNode()) {
			let { textContent } = allWrapperTreeWalker.currentNode;
			if (textContent.startsWith(' ')) {
				const match = textContent.match(/^\s+/)[0];
				const textNode = document.createTextNode(match);
				allWrapperTreeWalker.currentNode.parentNode.insertBefore(textNode, allWrapperTreeWalker.currentNode);
				allWrapperTreeWalker.currentNode.textContent = textContent.substring(match.length);
				textContent = allWrapperTreeWalker.currentNode.textContent;
			}
			if (textContent.endsWith(' ')) {
				const match = textContent.match(/\s+$/)[0];
				const textNode = document.createTextNode(match);
				allWrapperTreeWalker.currentNode.parentNode.insertBefore(textNode, allWrapperTreeWalker.nextSibling)
				allWrapperTreeWalker.currentNode.textContent = textContent.substring(0, textContent.length - match.length);
			}
		}
		
		
		// 해당 구간에 대한 오답이 없을 때 롤백한다.
		if([3,4,7].includes(battleType) && wrapperClass.match(/pick-right|answer-wrong/)) {
			const wrong = prompt(`${wrapper.textContent}의 오답을 입력하세요.`);
			if(wrong) {
				wrapper.dataset.wrong = wrong;
			}else {
				context.innerHTML = undoList.pop();
			}
		}
		// 해당 구간에 대한 해석이 없을 때 롤백한다.
		if(battleType == 7) {
			const kor = prompt('선택한 구간의 해석을 입력하세요.');
			if(kor) {
				maker.querySelector('.select-kor').appendChild(createElement({
					el: 'option', className: 'custom-trans', value: kor, 'data-trans': kor, textContent: kor, selected: true
				}));
				maker.querySelector('.select-kor').classList.add('pe-none');
			}else {
				context.innerHTML = undoList.pop();
			}
		}
	}
	
	/** 배틀 조회 목록에 추가할 '유형명&갯수 표시','상세보기목록' json을 반환.
	createElement()를 사용해야 DOM화 할 수 있음.
	 */
	function makeExistingBattle(battleType, groupCount, randId, battlePreviews) {
		const viewId = `existingBattleView${randId}`;
		return [{
				el: 'div', className: 'js-open-existing-battle d-inline-block btn border', role: 'button',
				'data-battle-type': battleType,
				'data-bs-toggle': 'collapse','data-bs-target': `#${viewId}`,
				children: [
					`Battle #${battleType}: `,
					{ el: 'span', className: 'battle-count', textContent: groupCount}, 
					' 건 ',
					{ el: 'span', className: 'fold-icon text-xl align-middle' }
				]
		},
		{// 배틀 상세 정보
			el: 'div', id: `existingBattleView${randId}`,
			className: 'battle-preview fade collapse',
			children: battlePreviews
		}];
	}
	
	/** json 정보를 바탕으로 버튼 태그를 생성하여 삽입.
	버튼그룹 및 툴팁, 라벨 자동 적용.
	@param json 버튼을 포함한 태그 정보
	@param parent 태그가 삽입될 부모 요소
	 */
	function appendClassifiedElement(json, parent) {
		modifyJson(json, v => {
			// div에 클래스명이 없을 경우 버튼그룹으로 적용
			if(!v.className && v.el == 'div')
				v.className = 'btn-group col-auto';
			// 체크박스는 아니지만 title이 있다면 툴팁으로 적용
			else if(v.title && v.type != 'checkbox') {
				v['data-toggle'] = 'tooltip';
				v['data-placement'] = 'bottom';
			}
			return v;
		})
		
		const element = createElement(json);
		// 체크박스들은 토글버튼형태로 보이도록 라벨 추가 지정
		// json에서는 객체 추가가 어렵기 때문에 DOM 생성 후 진행
		element.querySelectorAll('[type=checkbox]').forEach(chkbx => {
			if(!chkbx.className) chkbx.className = 'btn-check';
			const chkbxId = `btn-check-${chkbxSeq++}`;
			chkbx.id = chkbxId;
			const label = createElement({el: 'label', htmlFor: chkbxId,
				className: 'btn btn-outline-fico', textContent: chkbx.textContent});
			if(chkbx.title) { // 체크박스에 지정된 title은 라벨을 위해 있는 것
				label.title = chkbx.title;
				label.dataset.toggle = 'tooltip';
				label.dataset.placement = 'bottom';
			}
			chkbx.after(label);
		});
		parent.append(element);
	}	

	function modifyJson(json, fn) {
		if(Array.isArray(json)) {
			json.forEach((v,i) => json[i] = modifyJson(v, fn));
		}
		else if(typeof json == 'object') {
			Object.entries(json).forEach(([key, value]) => {
				if(value && Array.isArray(value))
					value.forEach((v,i) => value[i] = modifyJson(v, fn));
				json[key] = value;
			});
		}
		return fn.apply(this, [json]);
	}
	
	/** 컨테이너 속에서 지정한 선택자에 해당하는 요소들의 위치 반환
	@param container 부모 html 요소
	@param matcher 선택자
	@returns [[start,end], [start,end],...] start/end: Number
	*/
	function findPositions(container, matcher) {
		let pos = 0, arr = [];
		container.childNodes.forEach(child => {
			const textLength = child.textContent.replaceAll(/[\n\u200b]/gm, '').length;
			if(child.className && child.matches(matcher)) {
				arr.push([pos, pos + textLength]);
			}
			pos += textLength;
		})
		return arr;
	}
	/** 요소들을 등장 순서에 따라 정렬
	 */
	function sortByPosition(a, b) {
		return a[0] - b[0];
	}
	
	/** battle json 정보를 통해 createElement() 파라미터용 json 반환
	@param eng battle의 원문 Sentence 텍스트 정보
	@param battle battle정보를 담은 JSONObject
	 */
	function previewBattle(eng, battle) {

		const preview = {
			el: 'div', 'data-id': battle.battleId, className: 'battle-preview-one m-1 ms-5 bg-light border border-2 px-2', children: [
			{ el: 'div', className: 'row', children: [
				{el: 'div', className: 'col-auto', children: [
					{el: 'label', className: 'fw-bold me-2', textContent: '질문:'},
					{el: 'span', textContent: combineAsk(parseInt(battle.battleType), battle.askTag)}
				]},
				{el: 'div', className: 'col-auto', children: [
					{el: 'label', className: 'fw-bold me-2', textContent: '난이도:'},
					{el: 'span', textContent: battle.diffLevel}
				]},
				{el: 'div', className: 'col-auto', children: [
					{el: 'label', className: 'fw-bold me-2', textContent: '문법:'},
					{el: 'span', textContent: battle.grammarTitle || '(미입력)'}
				]},
				{el: 'div', className: 'col-auto', children: [
					{el: 'label', className: 'fw-bold me-2', textContent: '출처:'},
					{el: 'span', textContent: battle.source || '(출처없음)'}
				]}
			]},
			{ el: 'div', className: 'battle-context pb-3', 
				children: createBattleContext(eng, battle)
			}
		]};
		if(_memberId == battle.memberId)
			preview.children.push({el: 'div', children: [
				{el: 'button', className: 'btn btn-sm btn-fico js-delete-battle', textContent: '삭제'}
				]
			})
		return preview;
	}
	
	function createBattleContext(eng, battle) {
		const answers = JSON.parse(battle.answer||"[]");
		const examples = JSON.parse(battle.example||"[]");
		let offsetPos = 0;
		const contextChildren = [];
		const { battleType, kor } = battle;

		const getOffsetStr = (start, _end) => eng.substring(offsetPos, start);

		const getAnswerClass = (start, end) => {
			const answer = answers.find(a => a[0] == start && a[1] == end);
			return answer ? 'answer' : 'option';
		};

		const getAnswerWrongData = (start, end) => {
			const answer = answers.find(a => a[0] == start && a[1] == end);
			return answer ? { 'data-wrong': answer[2] } : {};
		};		
		switch(battleType) {
			case '1':
			/* 성분 찾기. 
				example = [[보기1start,보기1end],[보기2start,보기2end],...]
				answer = [[정답1start,정답1end],[정답2start,정답2end],...]
			*/ 
				examples.sort(sortByPosition).forEach(([start1, end1], j, arr) => {
					contextChildren.push(getOffsetStr(offsetPos, start1));
					contextChildren.push({
						el: 'span',
						className: getAnswerClass(start1, end1), 
						textContent: eng.substring(start1, end1)
					});
					if(j == arr.length - 1 && end1 < eng.length) {
						contextChildren.push(eng.substring(end1));
					}
					offsetPos = end1;
				});
				break;
			case '2':
			/* 수식어 찾기.
				answer = [[[수식어start,수식어end],[수식어start,수식어end],...],[[피수식어start,피수식어end],[피수식어start,피수식어end],...]]
			 */
			 	const [ modifiers2, modificands2 ] = answers;
			 	// answerArr = [[start,end,class],[start,end,class],...]
			 	const answerArr = [
					 ...modifiers2.map(modifier => [...modifier, 'modifier']),
					 ...modificands2.map(modificand => [...modificand, 'modificand']),
				 ]
				answerArr.sort(sortByPosition).forEach(([start2, end2, className2], j, arr) => {
					contextChildren.push(getOffsetStr(offsetPos, start2));
					contextChildren.push({
						el: 'span',
						className: className2, 
						...getAnswerWrongData(start2, end2),
						textContent: eng.substring(start2,end2)
					});
					if(j == arr.length - 1 && end2 < eng.length) {
						contextChildren.push(eng.substring(end2));
					}
					offsetPos = end2;
				});
				break;
			case '3':
			/* 맞는 어법 찾기.
				example = [[대상start,대상end],정답텍스트,오답텍스트]
				answer = [정답텍스트]
			*/
				const [[start3, end3], _correctText, wrongText] = examples;
				contextChildren.push(getOffsetStr(offsetPos, start3));
				contextChildren.push({
					el: 'span',
					className: 'pick-right',
					'data-wrong': wrongText,
					textContent: eng.substring(start3, end3)
				});				
				if(end3 < eng.length)
					contextChildren.push(eng.substring(end3));
				break;
			case '4':
			/* 틀린 어법 찾기.
				example = [[보기1start,보기1end],[보기2start,보기2end],...]
				answer = [[정답start,정답end],정답텍스트,오답텍스트]
			 */
				const [[answer_start4, answer_end4], _answerText, wrongText4] = answers;
				examples.sort(sortByPosition).forEach(([start4, end4], j, arr) => {
					const leftStr = getOffsetStr(start4, end4);
					if(leftStr) contextChildren.push(leftStr);
					const span = {
						el: 'span',
						className: getAnswerClass(start4, end4), 
						textContent: eng.substring(start4, end4)
					};
					if(answer_start4 == start4 && answer_end4 == end4) {
						span.className = 'answer-wrong';
						span['data-wrong'] = wrongText4;
					}
					contextChildren.push(span);
					if(j == arr.length - 1 && end4 < eng.length) {
						contextChildren.push(eng.substring(end4));
					}
					offsetPos = end4;
				});
				break;
			case '5':
			/* 배열하기.
				ask = 해석 아이디(선택한 해석일 경우)
				example = [[보기1start,보기1end],[보기2start,보기2end],...]
			 */
			 	examples.sort(sortByPosition).forEach(([start5, end5], j, arr) => {
					const leftStr = getOffsetStr(start5, end5);
					if(leftStr) contextChildren.push(leftStr);
					contextChildren.push({
						el: 'span',
						className: 'option', 
						textContent: eng.substring(start5, end5)
					});
					if(j == arr.length - 1 && end5 < eng.length) {
						contextChildren.push(eng.substring(end5));
					}
					offsetPos = end5;
				});
				break;
			case '6':
			/** 빈칸 채우기
				ask = 해석 아이디(선택한 해석일 경우)
				example = [[[대상start,대상end],정답텍스트],[[대상start,대상end],정답텍스트],...]
			 */	
			 	examples.sort((a,b) => a[0][0] - b[0][0]).forEach(([[start6, end6], _text], j, arr) => {
					const leftStr = getOffsetStr(start6, end6);
					if(leftStr) contextChildren.push(leftStr);
					contextChildren.push({
						el: 'span',
						className: 'fill-right',
						textContent: eng.substring(start6, end6)
					});				
					if(j == arr.length - 1 && end6 < eng.length)
						contextChildren.push(eng.substring(end6));	
					offsetPos = end6;	 	
				});
				break;
			case '7':
			/** 해석 배열하기
				ask = 해석 아이디(선택한 해석일 경우)
				example = [추가 단어1, 추가 단어2, ...](추가 단어를 입력했을 경우)
			 */	
			 	contextChildren.push({
					el: 'div', className: 'row', children: [
						{ el: 'label', class: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '영문'},
						{ el: 'span', textContent: eng }
					]
				});
				contextChildren.push({
					el: 'div', className: 'row', children: [
						{ el: 'label', class: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '정답'},
						{ el: 'span', textContent: kor}
					]
				});
				contextChildren.push({
					el: 'div', className: 'row', children: [
						{ el: 'label', class: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '보기'},
						{ el: 'span', children: [
							...kor.split(/\s+/).map((k) => ({ el: 'span', class: 'btn border border-dark', textContent: k })),
							...examples.filter((ex) => ex.length > 0).map((k) => ({ el: 'span', class: 'btn border border-danger', textContent: k })),
						]}
					]
				});
				break;
			case '8':
			/* 맞는 어법 찾기.
				example = [[대상start,대상end],정답텍스트,[오답텍스트1,오답텍스트2,..]]
				answer = [정답텍스트]
			*/
				const [start8, end8] = examples[0];
				const leftStr = eng.substring(offsetPos, start8);
				const targetStr = eng.substring(start8, end8);
				const rightStr = eng.substring(end8);
				let leftStr8 = eng.substring(offsetPos, examples[0][0]);
				if(leftStr8) contextChildren.push(leftStr8);
				contextChildren.push(
					leftStr,
					{ el: 'span', className: 'pick-right', 'data-wrong': examples[2].join('/'), textContent: targetStr },
					rightStr
				);				
				break;
			default: break;
		}
		return contextChildren;		
	}
	
	// 컨텍스트의 html을 통째로 보관
	function pushEditHistory(context){
		undoList.push(context.innerHTML);
		redoList = [];
		context.closest('.battle-maker').querySelector('[role=toolbar] [value="undo"]').disabled = false;
	}
	
	/** 키워드를 캐시에 추가, 캐시를 정렬
	 */
	function pushToCache(keyword, cacheList) {
		if(keyword.length > 0) {
			for(let i = 0, len = keyword.length; i < len; i++) {
				for(let j = i + 1; j <= len; j++) {
					const term = keyword.substring(i, j);
					if(!(term in cacheList)) 
						cacheList[term] = [];
					if(!cacheList[term].includes(keyword))
						cacheList[term].push(keyword);
					cacheList[term].sort();
				}
			}
		}
	}
	
	// battleType과 ask값을 통해 질문을 완전한 문장으로 구성.
	function combineAsk(battleType, ask) {
		let completeAsk = battleAsks[battleType - 1].replace('{}', ask);
		if (battleType === 1 && completeAsk.includes('절의')) {
			completeAsk = completeAsk.replace('문장의', '문장에서');
		}else if(battleType === 2 && (ask.includes('의 수식') || ask.includes('의 피수식'))) {
			completeAsk = `${completeAsk}어를 선택하세요.`;
		}else if(battleType === 8) {
			completeAsk = ask;
		}
		return completeAsk;
	}
	
	// 문장 난이도(E,N,D)와 문장길이로 상세난이도 반환
	const diffLevels = {
		A: [
			{ limit: 30, rank: '이병' },
			{ limit: 60, rank: '일병' },
			{ limit: Infinity, rank: '병장' },
		],
		B: [
			{ limit: 50, rank: '하사' },
			{ limit: 70, rank: '상사' },
			{ limit: 100, rank: '소위' },
			{ limit: 120, rank: '대위' },
			{ limit: Infinity, rank: '소령' },
		],
		C: [
			{ limit: 150, rank: '대령' },
			{ limit: 200, rank: '준장' },
			{ limit: Infinity, rank: '소장' },
		],
	};	
	function calcDiffSpecific(diffLevel, engLength) {
		let diffSpecificLevel;
		if (diffLevels[diffLevel]) {
			diffSpecificLevel = diffLevels[diffLevel].find(
				({ limit }) => engLength <= limit
			)?.rank;
		}
		return diffSpecificLevel;
	}
	
	function getAsks(battleType) {
		return battleTypeInfos[parseInt(battleType) - 1];
	}
	
	window['craft'] = Object.assign({}, window['craft'], { openBattleMakerPanel, getAsks, previewBattle, combineAsk, createAskOptions, createBattleContext, calcDiffSpecific, findPositions });
})(jQuery, window, document);
