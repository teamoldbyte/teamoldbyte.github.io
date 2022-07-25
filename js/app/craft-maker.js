/** 텐덤을 기초로 한 크래프트 배틀 출제를 위한 모듈
 @author LGM
 */
(function($, window, document) {
	$.cachedScript = $.cachedScript || function( url, options ) {
		return $.ajax( $.extend( options || {}, { dataType: "script", cache: true, url }) );
	};
	
	let staticCraftPanel, craftToolbarGroup = {}, battleBtns = [], categories = [], chkbxSeq = 0;
	let _memberId;
	let undoList = [], redoList = []; // 편집 내역
	$.getJSON('https://static.findsvoc.com/data/tandem/craft-toolbar.json', json => {
//	$.getJSON('/tandem/craft-toolbar.json', json => {
		craftToolbarGroup = json;
		staticCraftPanel = createElement(json.layout);
		battleBtns = json.common;
	});
	let cachedAskTags = {}, cachedSources = {}; // 검색어 캐시 
	const commonAsk = [
		'다음 문장의 {}를 선택하세요.', 
		'[{}] 수식어와 피수식어를 선택하세요.',
		'다음 문장에서 적절한 보기를 선택하세요.',
		'다음 문장에서 어법상 틀린 것을 선택하세요.',
		'다음 어구들을 해석에 맞게 배치해 보세요.'];
	const askInfos = [
		[// Battle #1
			{selector: '.s', ask: '#1', tag: '주어(부)'},
			{selector: '.v', ask: '#1', tag: '동사(부)'},
			{selector: '.o', ask: '#1', tag: '목적어(부)'},
			{selector: '.c', ask: '#1', tag: '보어(부)'},
			{selector: '.oc', ask: '#1', tag: '목적보어(부)'},
			{selector: '.s[data-rc="s.s."]', tag: '진짜주어(부)', ask: '#1'},
			{selector: '.o[data-rc="i.o."]', tag: '간접목적어(부)', ask: '#1'},
			{selector: '.o[data-rc="d.o."]', tag: '직접목적어(부)', ask: '#1'},
			{selector: '.ptc', ask: '#1', tag: '분사'},
			{selector: '.ger', ask: '#1', tag: '동명사'},
			{selector: '.tor', ask: '#1', tag: 'to부정사'},
		],
		[// Battle #2
			{selector: '.adjphr[data-mfd],.phr[data-mfd]', ask: '#2', tag: '전치사'},
			{selector: '.tor[data-mfd],.ptc[data-mfd]', ask: '#2', tag: '준동사'},
			{selector: '.acls[data-mfd]', ask: '#2', tag: '관계사'},
			{ask: '#2', tag: '형용사'},
			{ask: '#2', tag: '동격어구/절'},
		],
		[// Battle #3
			{ask: '#3'}
			
		],
		[// Battle #4
			{ask: '#4'}
			
		],
		[// Battle #5
			{ask: '#5'}
			
		]
	]
		
	let craftToolbar = createElement({
		el: 'div', 
		className: 'btn-toolbar row col-md-3',
		role: 'toolbar'});
	
	//------------------------ [이벤트 할당] --------------------------------------
	$(document)
	// 배틀타입 선택시 에디터 종류를 변경한다.
	.on('change', '.battle-type-section input[type=radio]', function() {
		const semanticResult = $(this).closest('.battle-section-panel').data('semantics');
		
		const makerContainer = this.closest('.add-battle-section').querySelector('.craft-maker-container');
		
		attachBattleMaker(makerContainer, semanticResult, this.value)
	})
	// 에디터 메뉴의 질문(ask)을 선택하면 태그(tag) 프리셋값을 설정한다.
	.on('change', '.ask-select', function() {
		const tag = this.querySelector('option:checked').dataset.tag;
		const tagInput = this.closest('.add-battle-section').querySelector('.askTag');
		if(tag) tagInput.value = tag;
		else tagInput.value = '';
	})
	// 에디터 메뉴 내의 토글아이콘들은 다른 토글아이콘을 체크해제한다.
	.on('change', '.battle-maker [role=toolbar] [type=checkbox]', function() {
		const maker = this.closest('.battle-maker');
		const context = maker.querySelector('.battle-context');
		if(!this.checked) {
			return;
		}
		this.closest('[role=toolbar]').querySelectorAll('[type=checkbox]:checked')
		.forEach(el => {
			if(this.compareDocumentPosition(el) != 0) el.checked = false;
		})
		
		const sel = getSelection();
		if(!sel.isCollapsed) {
			pushEditHistory(context);
			wrapText(this.closest('.battle-maker'));
		}
	})
	// 보기 및 정답 요소들은 다시 클릭 시 삭제된다.
	.on('click', '.battle-context *', function() {
		if(this.closest('.battle-maker')) {
			if(this.nodeName == 'SPAN') {
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
	// 배틀 등록 버튼 클릭시 배틀입력 정보를 커맨드로 취합하여 전송
	.on('click', '.js-add-battle', function() {
		const addSection = this.closest('.add-battle-section');
		const battlePanel = addSection.closest('.battle-section-panel');
		const battleContext = addSection.querySelector('.battle-context');
		const categoryId = Number(addSection.querySelector('.battle-category-section select').value);
		const command = {
			sentenceId: $(battlePanel).data('sentenceId'),
			categoryId,
			memberId: _memberId,
			ask: addSection.querySelector('.ask-select').value.trim(),
			askTag: addSection.querySelector('.askTag').value.trim(),
			comment: addSection.querySelector('.comment').value.trim(),
			source: addSection.querySelector('.source').value.trim(),
			diffLevel: addSection.querySelector('.battle-diffLevel-section input:checked').value
		}
				
		let example = '', answer = '';
		const battleType = addSection.querySelector('.battle-type-section input:checked').value;
		
		// 배틀 유형별 example, answer 정보 구성.
		switch(battleType) {
			case '1':
				// [보기 위치1, 보기 위치2, ...]
				example = findPositions(battleContext, '.answer, .option');
				// [정답 위치]
				answer = findPositions(battleContext, '.answer');
				break;
			case '2':
				// [수식어 위치, 피수식어 위치]
				answer = [findPositions(battleContext, '.modifier')[0],
						  findPositions(battleContext, '.modificand')[0]];
				break;
			case '3':
				let blank = battleContext.querySelector('.pick-right');
				// [빈칸 위치, 정답 텍스트, 오답 텍스트]
				example = [findPositions(battleContext, '.pick-right')[0],
							blank.textContent.trim(), blank.dataset.wrong.trim()];
				// [정답 텍스트]
				answer = [blank.textContent.trim()];
				break;
			case '4':
				let wrong = battleContext.querySelector('.answer-wrong');
				// [보기 위치1, 보기 위치2, ...]
				example = findPositions(battleContext, '.option, .answer-wrong');
				// [정답 위치, 정답 텍스트, 오답 텍스트]
				answer = [findPositions(battleContext, '.answer-wrong')[0],
							wrong.textContent.trim(), wrong.dataset.wrong.trim()];
				break;
			case '5':
				// [보기 위치1, 보기 위치2, ...]
				example = findPositions(battleContext, '.option');
				// select에서 한글해석 선택
				command.ask = addSection.querySelector('.select-kor').value;
				break;
			default: break;
		}
		command.answer = JSON.stringify(answer);
		command.example = JSON.stringify(example);
		command.battleType = battleType;
		
		$.ajax({
			url: '/craft/battle/add',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify(command),
			success: function(response) {
				alert(`[등록 결과]\nbattleId: ${response.battleId}\ngroupCount: ${response.groupCount}`);
				
				battleContext.replaceChildren(battleContext.textContent);
				addSection.querySelector('.comment').value = '';
				
				command.battleId = response.battleId;
				command.grammarTitle = categories.find(c => c.cid == categoryId).title;
				const battleList = battlePanel.querySelector('.existing-battles-section');
				const newBattle = previewBattle($(battlePanel).data('eng'), command);
				let battleGroupBtn = battleList.querySelector(`[data-battle-type="${battleType}"]`);
				let battleGroupBlock;
				// 유형 그룹이 없을 경우
				if(!battleGroupBtn) {
					// 문장에서의 첫 등록
					if(!battleList.querySelector('[data-battle-type]')) {
						// 배틀 미등록 문구 삭제
						battleList.replaceChildren();
					}
					const randId = Date.now() + 1;
					battleGroupBtn = createElement({
							el: 'div', className: 'js-open-existing-battle d-inline-block btn border', role: 'button',
							'data-battle-type': battleType,
							'data-bs-toggle': 'collapse','data-bs-target': `#existingBattleView${randId}`,
							children: [
								`Battle #${battleType}: `,
								{el: 'span', className: 'battle-count', textContent: 1}, 
								' 건 ',
								{ el: 'span', className: 'fold-icon text-xl align-middle' }
							]
					});
					battleList.append(battleGroupBtn);
					$(battleGroupBtn).css('height',0).animate({height:'100%'}, 500, function() { this.style.height = 'auto';});
					// 유형 그룹 추가
					battleGroupBlock = createElement({// 배틀 상세 정보
							el: 'div', id: `existingBattleView${randId}`,
							className: 'battle-preview fade collapse'
					});
					battleList.append(battleGroupBlock)
				}
				else {
					// 기존 유형 그룹에 추가
					const battleCountBlock = battleGroupBtn.querySelector('.battle-count');
					battleCountBlock.textContent = Number(battleCountBlock.textContent) + 1;
					battleGroupBlock = document.querySelector(battleGroupBtn.dataset.bsTarget);
				}
				const newBattleBlock = createElement(newBattle)
				battleGroupBlock.append(newBattleBlock);
				$(newBattleBlock).css('display','none').slideDown()
			},
			error: function(err) {
				alert(err);
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
			alert('배틀이 삭제되었습니다.');
			battleBlock.remove();
			const counter = battleGroupBtn.querySelector('.battle-count');
			const decreased = Number(counter.textContent) - 1;
			if(decreased > 0) {
				counter.textContent = Number(counter.textContent) - 1; 
			}else {
				battlesBlock.remove();
				battleGroupBtn.remove();
			}
		}).fail(() => alert('배틀 삭제에 실패했습니다.'))
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
			await $.cachedScript('https://cdn.jsdelivr.net/npm/jquery-ui-dist@1.13.1/jquery-ui.min.js', {
				success: () => {
					$.fn.tooltip = _tooltip;
				}
			});
		}
		// 카테고리 화면에서 최초 1회 불러오기
		const categorySection = staticCraftPanel.querySelector('.battle-category-section select');
		if(categories.length == 0) {
			await $.getJSON('/grammar/category/list', results => {
				categories = results;
				let elements = Array.from(categories, c => {
					return { el:'option', value: c.cid,
						textContent: `${(c.parentCategory ? '└─ ':'')}${c.title}`};
				})
				categorySection.append(createElement(elements));
			});
		}
		_memberId = memberId;
		const sentenceEng = tandem.cleanSvocDOMs(semanticsDiv).innerText;
		
		// 공용 패널 복사본으로 패널 새로 생성
		let panelInstance = staticCraftPanel.cloneNode(true);
		// 전달받은 인자값들을 패널 요소에 접근하여 얻을 수 있도록 설정
		$(panelInstance).data('semantics', semanticsDiv)
						.data('sentenceId', sentenceId)
						.data('eng', sentenceEng)
						.data('transList', transList);
						
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
				const battleElements = [];
				Object.entries(battleSummary).forEach((summ, i) => {
					const randId = Date.now() + i;
					battleElements.push({// 배틀 유형별 갯수 정보
							el: 'div', className: 'js-open-existing-battle d-inline-block btn border', role: 'button',
							'data-battle-type': summ[0],
							'data-bs-toggle': 'collapse','data-bs-target': `#existingBattleView${randId}`,
							children: [
								`Battle #${summ[0]}: `,
								{el: 'span', className: 'battle-count', textContent: summ[1].length}, 
								' 건 ',
								{ el: 'span', className: 'fold-icon text-xl align-middle' }
							]
					});
					battleElements.push({// 배틀 상세 정보
							el: 'div', id: `existingBattleView${randId}`,
							className: 'battle-preview fade collapse',
							children: Array.from(summ[1], battle => previewBattle(sentenceEng, battle))
					});
				})
				battleListSection.append(createElement(battleElements));
			}
		})
		
		container.replaceChildren();
		// 배틀 1 유형을 기본으로 에디터 지정
		attachBattleMaker(panelInstance.querySelector('.craft-maker-container'), semanticsDiv, 1);
		container.append(panelInstance);
		
		// 배틀 생성탭이 처음 나올 때 askTag값 임의 지정
		$(panelInstance).find('.ask-select').trigger('change');
		
		// 배틀 태그(askTag)에 제시어 기능 적용
		$(panelInstance).find('.askTag').autocomplete({
			minLength: 1, delay: 50, source: function(req, res) {
				const term = req.term && req.term.trim();
				if(term in cachedAskTags) {
					res(cachedAskTags[term]);
					return;
				}
				$.getJSON(`/craft/battle/tag/search/${term}`, function(data) {
					cachedAskTags[term] = data;
					res(data);
				}).fail(() => {
					cachedAskTags[term] = null;
					res([]);
				})
			}
		})
		// 배틀 출처(source)에 제시어 기능 적용
		$(panelInstance).find('.source').autocomplete({
			minLength: 1, delay: 50, source: function(req, res) {
				const term = req.term && req.term.trim();
				if(term in cachedSources) {
					res(cachedSources[term]);
					return;
				}
				$.getJSON(`/craft/battle/source/search/${term}`, function(data) {
					cachedSources[term] = data;
					res(data);
				}).fail(() => {
					cachedSources[term] = null;
					res([]);
				})
			}
		})
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
		let asks = askInfos[battleType - 1];
		// 1, 2 유형의 경우 대상 문장에 포함된 성분들 파악해서 질문 목록에서 우선표시
		if([1,2].includes(battleType)) {
			asks.forEach(el => {
				if(el.selector != null && semanticsDiv.querySelector(`.sem${el.selector}`) != null )
					el.recommended = true;
			});
			asks.sort((a,b) => {
				if(!a.recommended) return 1;
				return b.recommended ? 0 : -1;
			})
		}
		// 배틀 유형별 툴바 표시
		appendToolbar(battleType, makerDiv);
		// 배틀 유형별 질문 표시
		appendAskSelect(battleType, asks, makerDiv);
		// 수정 영역 표시
		appendContext(semanticsDiv, makerDiv);		
		// 
		const selectedAsk = makerDiv.closest('.add-battle-section').querySelector('.ask-select');
		$(selectedAsk).trigger('change');
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
		[{text: '쉬움', value: 'E'},{text: '보통', value: 'N'},{text: '어려움', value: 'D'}]
		.forEach(function(level, i) {
			levelBtns.children.push({el: 'input', type: 'radio', autocomplete: 'off',
				name: `btnRadioBattleLevel${now}`,
				id: `btnRadioBattleLevel${now}${i}`,
				className: 'btn-check battle-level-select', 
				checked: i == 0, value: level.value});
			levelBtns.children.push({el: 'label', textContent: level.text,
				htmlFor: `btnRadioBattleLevel${now}${i}`,
				className: 'col btn col-auto px-4 ms-1 rounded-pill btn-outline-fico'});
		})
		appendClassifiedElement(levelBtns, maker);
		if(battleType == 5) {
			maker.append(createElement({
				el: 'div', className: 'col-12 col-md-3 row',
				children: [
					{el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '해석'},
					{el: 'select', className: 'select-kor form-select d-inline-block col',
					children: Array.from($(maker).closest('.battle-section-panel').data('transList'), (trans, i) => {
						return {el: 'option', value: trans.id, textContent: `${i+1}번째 해석`}
					})}
				]
			}))
		}
	}
	/** 주어진 질문 목록을 에디터에 설정
	@param battleType 배틀 유형 1,2,3,4,5
	@param askArray 질문 목록 [{selector, tag, recommended}]
	 */
	function appendAskSelect(battleType, askArray, maker) {
		const json = {
			el: 'div', 
			className: 'col-12 col-md-3 row',
			children: [
				{	el: 'label', textContent: '질문', 
					className: 'col-auto lh-1 my-auto text-fc-purple fw-bold'
				}
			]				
		};
		const select = {
			el: 'select', 
			className: 'form-select ask-select col', 
			children: []
		};
		askArray.forEach((one, i) => {
			const option = {el: 'option'};
			if(one.recommended) option.className = 'bg-fc-light-purple';
			option.value = `#${battleType}`;
			if(one.tag) option['data-tag'] = one.tag
			option.innerHTML = commonAsk[battleType - 1].replace('{}',one.tag);
			if(i == 0) option.selected = true;
			select.children.push(option);
		});
		json.children.push(select);
		maker.prepend(createElement(json));
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
	/** BattleMaker 내부에 선택된 텍스트를 span으로 감싸고 에디터에서 선택된 메뉴에 따라 클래스 지정
	 */
	function wrapText(maker) {
		let sel = getSelection();
		// 에디터에서 선택된 메뉴버튼
		const chkdBtn = maker.querySelector('[role=toolbar] [type=checkbox]:checked');
		if(!sel.isCollapsed && chkdBtn) {
			if(sel.toString().trim() == maker.querySelector('.battle-context').textContent.trim()) return;
			
			pushEditHistory(maker.querySelector('.battle-context'));
			
			const battleType = Number(maker.closest('.add-battle-section').querySelector('.battle-type-section input:checked').value);
			
			/* 선택 범위를 단어 단위로 선택되도록 자동 조절. 선택범위의 양끝 공백은 제거
				배틀 1, 3 유형은 띄어쓰기가 아닌 apostrophe를 기준으로 범위를 지정할 수도 있어서 예외
			*/
			if(![1,3].includes(battleType)) {
				// 드래그 선택 방향이 오른쪽->왼쪽이라면 방향을 뒤집는다.(아래의 로직 전개를 위해)
				if(sel.anchorNode.compareDocumentPosition(sel.focusNode) == 2
				|| (sel.anchorNode.compareDocumentPosition(sel.focusNode) == 0
				&& sel.anchorOffset > sel.focusOffset)) {
					sel.setBaseAndExtent(sel.focusNode, sel.focusOffset, sel.anchorNode, sel.anchorOffset);
				}
				// 왼쪽에 선택할 글자가 있다면 추가선택
				while(sel.anchorOffset > 0 
				&& sel.anchorNode.textContent.charAt(sel.anchorOffset).match(/\S/)
				&& sel.anchorNode.textContent.charAt(sel.anchorOffset -1).match(/\S/)) {
					sel.setBaseAndExtent(sel.anchorNode, sel.anchorOffset - 1, sel.focusNode, sel.focusOffset);
				}
				// 왼쪽 끝이 공백이면 왼쪽 범위를 축소
				while(sel.toString().match(/^\s/)) {
					sel.setBaseAndExtent(sel.anchorNode, sel.anchorOffset + 1, sel.focusNode, sel.focusOffset);
				}
				// 오른쪽에 선택할 글자가 있다면 추가선택
				while( sel.focusOffset < sel.focusNode.textContent.length - 1
				&& sel.focusNode.textContent.charAt(sel.focusOffset - 1).match(/\S/) 
				&& sel.focusNode.textContent.charAt(sel.focusOffset).match(/\S/)) {
					sel.setBaseAndExtent(sel.anchorNode, sel.anchorOffset, sel.focusNode, sel.focusOffset + 1);
				}
				// 오른쪽 끝이 공백이면 오른쪽 범위를 축소
				while(sel.toString().match(/\s$/)) {
					sel.setBaseAndExtent(sel.anchorNode, sel.anchorOffset, sel.focusNode, sel.focusOffset - 1);
				}
			}
			const wrapper = document.createElement('span');
			wrapper.className = chkdBtn.value;
			const range = sel.getRangeAt(0);
			
			wrapper.textContent = range.extractContents().textContent;
			range.insertNode(wrapper);
			sel.removeAllRanges();
			
			if(wrapper.matches('.pick-right,.answer-wrong')) {
				const wrong = prompt(`${wrapper.textContent}의 오답을 입력하세요.`);
				if(wrong) {
					wrapper.dataset.wrong = wrong;
				}else {
					$(wrapper.firstChild).unwrap();
				}
			}
		} 		
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
		})
		parent.append(element);
	}	
	
	/** json 정보를 바탕으로 html 태그를 생성하여 반환
	Element.xxx 형태로 호출이 가능한 요소여야 함.(예: for (x) -> htmlFor (o))
	@param json (el: 태그이름, children: 자식태그들, 기타: 적용 속성)
	*/
	function createElement(json) {
		// 키-값 쌍이 아닌 '문자열'인 경우 텍스트노드로 반환
		if(typeof json == 'string') return document.createTextNode(json);
		// 배열인 경우 자식 요소 뭉치로 반환
		if(Array.isArray(json)) {
			const fragment = document.createDocumentFragment();
			json.forEach(child => fragment.append(createElement(child)));
			return fragment;
		}
		const element = document.createElement(json.el);
		Object.keys(json).forEach(key => {
			if(key.match(/^data-/)) // 사용자정의 속성. data-xx 
				element.dataset[key.replace('data-', '')
				.replace(/-(\w)/g, g0 => g0.toUpperCase()[1])] = json[key];
			else if(key == 'children') { // 자식태그들
				json[key].forEach(child => 
					element.appendChild(createElement(child)));
			}else if(key != 'el') { // 나머지 속성들 적용
				element[key] = json[key];
			}
		});
		return element;
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
		const answers = JSON.parse(battle.answer);
		const examples = JSON.parse(battle.example);
		let offsetPos = 0;
		const contextChildren = [];
		if(battle.battleType == '1') {
		/* 성분 찾기. 
			example = [[보기1start,보기1end],[보기2start,보기2end],...]
			answer = [[정답1start,정답1end],[정답2start,정답2end],...]
		*/ 
			examples.sort(sortByPosition).forEach((example, j, arr) => {
				let leftStr = eng.substring(offsetPos, example[0]);
				if(leftStr) contextChildren.push(leftStr);
				contextChildren.push({
					el: 'span',
					className: (answers.find(a => a[0] == example[0] && a[1] == example[1])) ? 'answer' : 'option', 
					textContent: eng.substring(example[0],example[1])
				});
				if(j == arr.length - 1 && example[1] < eng.length) {
					contextChildren.push(eng.substring(example[1]));
				}
				offsetPos = example[1];
			});
		}else if(battle.battleType == '2') {
		/* 수식어 찾기.
			answer = [[수식어start,수식어end],[피수식어start,피수식어end]]
		 */
			answers.sort(sortByPosition).forEach((answer, j, arr) => {
				let leftStr = eng.substring(offsetPos, answer[0]);
				if(leftStr) contextChildren.push(leftStr);
				contextChildren.push({
					el: 'span',
					className: j == 0 ? 'modifier' : 'modificand', 
					textContent: eng.substring(answer[0],answer[1])
				});
				if(j == arr.length - 1 && answer[1] < eng.length) {
					contextChildren.push(eng.substring(answer[1]));
				}
				offsetPos = answer[1];
			});
		}else if(battle.battleType == '3') {
		/* 맞는 어법 찾기.
			example = [[대상start,대상end],정답텍스트,오답텍스트]
			answer = [정답텍스트]
		*/
			let leftStr = eng.substring(offsetPos, examples[0][0]);
			if(leftStr) contextChildren.push(leftStr);
			contextChildren.push({
				el: 'span',
				className: 'pick-right',
				'data-wrong': examples[2],
				textContent: eng.substring(examples[0][0],examples[0][1])
			});				
			if(examples[0][1] < eng.length)
				contextChildren.push(eng.substring(examples[0][1]));
		}else if(battle.battleType == '4') {
		/* 틀린 어법 찾기.
			example = [[보기1start,보기1end],[보기2start,보기2end],...]
			answer = [[정답start,정답end],정답텍스트,오답텍스트]
		 */
			examples.sort(sortByPosition).forEach((example, j, arr) => {
				let leftStr = eng.substring(offsetPos, example[0]);
				if(leftStr) contextChildren.push(leftStr);
				const span = {
					el: 'span',
					className: 'option', 
					textContent: eng.substring(example[0],example[1])
				};
				if(answers[0][0] == example[0] && answers[0][1] == example[1]) {
					span.className = 'answer-wrong';
					span['data-wrong'] = answers[2];
				}
				contextChildren.push(span);
				if(j == arr.length - 1 && example[1] < eng.length) {
					contextChildren.push(eng.substring(example[1]));
				}
				offsetPos = example[1];
			});
		}else if(battle.battleType == '5') {
		/* 배열하기.
			example = [[보기1start,보기1end],[보기2start,보기2end],...]
		 */
		 	examples.sort(sortByPosition).forEach((example, j, arr) => {
				let leftStr = eng.substring(offsetPos, example[0]);
				if(leftStr) contextChildren.push(leftStr);
				contextChildren.push({
					el: 'span',
					className: 'option', 
					textContent: eng.substring(example[0],example[1])
				});
				if(j == arr.length - 1 && example[1] < eng.length) {
					contextChildren.push(eng.substring(example[1]));
				}
				offsetPos = example[1];
			});
		}
		const preview = {
			el: 'div', 'data-id': battle.battleId,
			className: 'battle-preview-one m-1 ms-5 bg-light border border-2 px-2', 
			children: [
				{
					el: 'div', className: 'row', children: [
						{el: 'div', className: 'col-auto', children: [
							{el: 'label', className: 'fw-bold me-2', textContent: '질문:'},
							{el: 'span', textContent: commonAsk[battle.battleType - 1].replace('{}',battle.askTag)}
						]},
						{el: 'div', className: 'col-auto', children: [
							{el: 'label', className: 'fw-bold me-2', textContent: '난이도:'},
							{el: 'span', textContent: battle.diffLevel}
						]},
						{el: 'div', className: 'col-auto', children: [
							{el: 'label', className: 'fw-bold me-2', textContent: '문법:'},
							{el: 'span', textContent: battle.grammarTitle}
						]}
					]
				},
				{
					el: 'div', className: 'battle-context pb-3', 
					children: contextChildren
				}
			]
		};
		if(_memberId == battle.memberId)
			preview.children.push({el: 'div', children: [
				{el: 'button', className: 'btn btn-sm btn-fico js-delete-battle', textContent: '삭제'}
				]
			})
		return preview;
	}
	
	// 컨텍스트의 html을 통째로 보관
	function pushEditHistory(context){
		undoList.push(context.innerHTML);
		redoList = [];
		context.closest('.battle-maker').querySelector('[role=toolbar] [value="undo"]').disabled = false;
	}
	
	window['craft'] = Object.assign({}, window['craft'], { openBattleMakerPanel });
})(jQuery, window, document);
