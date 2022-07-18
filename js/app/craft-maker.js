/** 텐덤을 기초로 한 문제 처리를 위한 모듈
 @author LGM
 */
(function($, window, document) {
	$.cachedScript = $.cachedScript || function( url, options ) {
		return $.ajax( $.extend( options || {}, { dataType: "script", cache: true, url }) );
	};
	
	
	let craftToolbarGroup = {}, battleBtns = [], chkbxSeq = 0;
	let undoList = [], redoList = []; // 편집 내역
	$.getJSON('https://static.findsvoc.com/data/tandem/craft-toolbar.json', json => {
		craftToolbarGroup = json;
		battleBtns = json.common;
	});
	const askInfos = [
		[// Battle #1
			{selector: '.s', ask: '#1', tag: '주어(부)', fullAsk: "다음 문장의 주어(부)를 선택하세요."},
			{selector: '.v', ask: '#1', tag: '동사(부)', fullAsk: "다음 문장의 동사(부)를 선택하세요."},
			{selector: '.o', ask: '#1', tag: '목적어(부)', fullAsk: "다음 문장의 목적어(부)를 선택하세요."},
			{selector: '.c', ask: '#1', tag: '보어(부)', fullAsk: "다음 문장의 보어(부)를 선택하세요."},
			{selector: '.oc', ask: '#1', tag: '목적보어(부)', fullAsk: "다음 문장의 목적보어(부)를 선택하세요."},
			{selector: '.s[data-rc="s.s."]', tag: '진짜주어(부)', ask: '#1', fullAsk: "다음 문장의 진짜주어(부)를 선택하세요."},
			{selector: '.o[data-rc="i.o."]', tag: '간접목적어(부)', ask: '#1', fullAsk: "다음 문장의 간접목적어(부)를 선택하세요."},
			{selector: '.o[data-rc="d.o."]', tag: '직접목적어(부)', ask: '#1', fullAsk: "다음 문장의 직접목적어(부)를 선택하세요."},
			{selector: '.ptc', ask: '#1', tag: '분사', fullAsk: "다음 문장의 분사를 선택하세요."},
			{selector: '.ger', ask: '#1', tag: '동명사', fullAsk: "다음 문장의 동명사를 선택하세요."},
			{selector: '.tor', ask: '#1', tag: 'to부정사', fullAsk: "다음 문장의 to부정사를 선택하세요."},
		],
		[// Battle #2
			{selector: '.adjphr[data-mfd],.phr[data-mfd]', ask: '#2', tag: '전치사', fullAsk: "[전치사] 수식어와 피수식어를 선택하세요."},
			{selector: '.tor[data-mfd],.ptc[data-mfd]', ask: '#2', tag: '준동사', fullAsk: "[준동사] 수식어와 피수식어를 선택하세요."},
			{selector: '.acls[data-mfd]', ask: '#2', tag: '관계사', fullAsk: "[관계사] 수식어와 피수식어를 선택하세요."},
			{ask: '#2', tag: '형용사', fullAsk: "[형용사] 수식어와 피수식어를 선택하세요."},
			{ask: '#2', tag: '동격어구/절', fullAsk: "[동격어구/절] 수식어와 피수식어를 선택하세요."},
		],
		[// Battle #3
			{ask: '#3', fullAsk: "다음 문장에서 적절한 보기를 선택하세요."}
			
		],
		[// Battle #4
			{ask: '#4', fullAsk: "다음 문장에서 어법상 틀린 것을 선택하세요."}
			
		],
		[// Battle #5
			{ask: '#5', fullAsk: "다음 어구들을 해석에 맞게 배치해 보세요."}
			
		]
	]
	document.head.insertAdjacentHTML('beforeend', 
		'<style>' +
		'.battle-maker { counter-set: quizIndex 0;counter-reset: quizIndex; outline: none; }' +
		'.battle-context { line-height: 3; }' +
		'.battle-context .answer, .battle-context .option, .battle-context .answer-wrong {' +
			'position: relative;counter-increment: quizIndex;' +
			'text-decoration:underline;' +
		'}' +
		'.battle-context .answer::after,.battle-context .option::after, .battle-context .answer-wrong::after {' +
			'position: absolute;width: calc(1em + 2px);' +
			'line-height: 1;top: 1.5em;left: 0;' +
			'text-align: center;content: "["counter(quizIndex)"]"' +
		'}' +
		'.battle-context .answer { color: red; }' +
		'.battle-context .modifier,.battle-context .modificand {position:relative;text-decoration:underline;}' +
		'.battle-context .modifier::after,.battle-context .modificand::after {' +
			'position: absolute;width: calc(1em + 2px);' +
			'line-height: 1;top: 1.5em;left: calc(50% - .5em - 1px);' +
			'text-align: center;' +
		'}' +
		'.battle-context .modificand::after { content: "피수식어"}' +
		'.battle-context .modifier::after { content: "수식어"}' +
		'.battle-context .pick-right, .battle-context .answer-wrong {position:relative; color: blue;}' +
		'.battle-context .pick-right::before, .battle-context .answer-wrong::before {' +
			'position: absolute; left: 0; bottom: 0; color: red; content: attr(data-wrong)' +
		'}' +
		'.battle-context * { cursor: pointer;}' +
		'.battle-context *:hover,.battle-context *:hover::before,.battle-context *:hover::after { background: gold}' +
		'</style>');
		
	let battleMakerPanel = createElement({el: "div", className: "battle-section-panel"});
	battleMakerPanel.insertAdjacentHTML('afterbegin',
`	<!-- 기존 문제 조회 영역 -->
	<div class="existing-battle-section pb-3 row">
		<label class="col-auto lh-1 ms-3 my-auto text-fc-red fw-bold">기존 등록 배틀 조회</label>
		<!-- 조회 결과 -->
		<div class="existing-battles-section col-auto">
			<div class="js-open-existing-battle" role="button" data-bs-toggle="collapse">
				• Battle <span class="existing-battle-type">0</span> 으로 등록 ( <span class="existing-battle-count">0</span> 건 ) <span class="fold-icon text-xl align-middle"></span>
			</div>
		</div>
	</div>						
	<!-- 배틀 추가 등록 영역 -->
	<div class="add-battle-section p-3 bg-white rounded-3">
		<!-- 배틀 타입 선택 -->
		<div class="battle-type-section pb-3 row" data-radio="btnradioBattletype">
			<label class="col-auto lh-1 my-auto text-fc-purple fw-bold">배틀 타입 선택</label>
			<input type="radio" class="btn-check" autocomplete="off" value="1" checked>
			<label class="btn rounded-pill btn-outline-fico col-auto mx-2">1. 성분 찾기</label>
			<input type="radio" class="btn-check" autocomplete="off" value="2">
			<label class="btn rounded-pill btn-outline-fico col-auto mx-2">2. 수식어 찾기</label>
			<input type="radio" class="btn-check" autocomplete="off" value="3">
			<label class="btn rounded-pill btn-outline-fico col-auto mx-2">3. 맞는 어법 찾기</label>
			<input type="radio" class="btn-check" autocomplete="off" value="4">
			<label class="btn rounded-pill btn-outline-fico col-auto mx-2">4. 틀린 어법 찾기</label>
			<input type="radio" class="btn-check" autocomplete="off" value="5">
			<label class="btn rounded-pill btn-outline-fico col-auto mx-2">5. 문장요소 배열하기</label>
		</div>
		<!-- 문제 입력 -->
		<div class="add-detail-battle-section">
			<div class="battle-editor-section pb-3">
				<!-- 문제 입력 에디터 -->
				<div class="craft-maker-container">
				</div>
			</div>
			<div class="row pb-3">
				<!-- 카테고리 입력 -->
				<div class="battle-category-section col-12 col-md-3 row">
					<label class="col-auto lh-1 my-auto text-fc-purple fw-bold">카테고리</label>
					<select class="form-select d-inline-block w-auto col">
					</select>
				</div>
				<!-- 난이도 입력 -->
				<div class="battle-diffLevel-section col-12 col-md-3 row" data-radio="btnradioBattlelevel">
					<label class="col-auto lh-1 my-auto text-fc-purple fw-bold">난이도</label>
					<input type="radio" class="btn-check battle-level-select" autocomplete="off" value="E" checked>
					<label class="col btn col-3 rounded-pill btn-outline-fico">쉬움</label>
					<input type="radio" class="btn-check battle-level-select" autocomplete="off" value="N">
					<label class="col btn col-3 ms-1 rounded-pill btn-outline-fico">보통</label>
					<input type="radio" class="btn-check battle-level-select" autocomplete="off" value="D">
					<label class="col btn col-3 ms-1 rounded-pill btn-outline-fico">어려움</label>
				</div>
				<!-- 질문에 대한 태그 입력 -->
				<div class="battle-askTag-section col-12 col-md-3 row">
					<label class="col-auto lh-1 my-auto text-fc-purple fw-bold">태그</label>
					<input type="text" class="askTag form-control d-inline-block col" placeholder="ex) 목적어(부), 관계사(카테고리명)">
				</div>
				<!-- 질문 출처 입력 -->
				<div class="battle-source-section col row me-md-2">
					<label class="col-auto lh-1 my-auto text-fc-purple fw-bold">출처</label>
					<input type="text" class="source form-control d-inline col" placeholder="ex) OOO 워크북, 2022년 6월 고3 모의고사 등">
				</div>
			</div>

			<!-- 문제 해설 -->
			<div class="battle-comment-section pb-3 row me-md-2">
				<label class="col-auto text-fc-purple fw-bold">해설</label>
				<textarea class="comment form-control d-inline col h-auto" rows="2" placeholder="문제에 대한 해설, 참조 링크 등"></textarea>
			</div>
			<div class="button-section text-center">
				<button type="button" class="js-add-battle btn btn-fico btn-lg">등록</button>
			</div>
		</div>
	</div>`);
		
	let craftToolbar = document.createElement('div');
	craftToolbar.className = 'row g-2 btn-toolbar';
	craftToolbar.setAttribute('role','toolbar');
	
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
		if(this.nodeName == 'SPAN') {
			this.outerHTML = this.innerHTML;
		}else {
			this.remove();
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
		const $battlePanel = $(addSection).closest('.battle-section-panel');
		const battleContext = addSection.querySelector('.battle-context');
		
		let example = '', answer = '';
		const battleType = addSection.querySelector('.battle-type-section input:checked').value;
		
		// 배틀 유형별 example, answer 정보 구성.
		switch(battleType) {
			case '1':
				// [보기 위치1, 보기 위치2, ...]
				example = findClassPositions(battleContext, '.answer, .option');
				// [정답 위치]
				answer = findClassPositions(battleContext, '.answer');
				break;
			case '2':
				// [수식어 위치, 피수식어 위치]
				answer = [findClassPositions(battleContext, '.modifier')[0],
						  findClassPositions(battleContext, '.modificand')[0]];
				break;
			case '3':
				let blank = battleContext.querySelector('.pick-right');
				// [빈칸 위치, 정답 텍스트, 오답 텍스트]
				example = [findClassPositions(battleContext, '.pick-right')[0],
							blank.textContent.trim(), blank.dataset.wrong.trim()];
				// [정답 텍스트]
				answer = [blank.textContent.trim()];
				break;
			case '4':
				let wrong = battleContext.querySelector('.answer-wrong');
				// [보기 위치1, 보기 위치2, ...]
				example = findClassPositions(battleContext, '.option, .answer-wrong');
				// [정답 위치, 정답 텍스트, 오답 텍스트]
				answer = [findClassPositions(battleContext, '.answer-wrong')[0],
							wrong.textContent.trim(), wrong.dataset.wrong.trim()];
				break;
			case '5':
				// [보기 위치1, 보기 위치2, ...]
				example = findClassPositions(battleContext, '.option');
				break;
			default: break;
		}
		
		
		
		const command = {
			sentenceId: $battlePanel.data('sentenceId'),
			categoryId: Number(addSection.querySelector('.battle-category-section select').value),
			memberId: $battlePanel.data('memberId'), battleType,
			ask: addSection.querySelector('.ask-select').value.trim(),
			example: JSON.stringify(example), answer: JSON.stringify(answer),
			askTag: addSection.querySelector('.askTag').value.trim(),
			comment: addSection.querySelector('.comment').value.trim(),
			source: addSection.querySelector('.source').value.trim(),
			diffLevel: addSection.querySelector('.battle-diffLevel-section input:checked').value
		}
		
		$.ajax({
			url: '/craft/battle/add',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify(command),
			success: function(response) {
				alert(`[등록 결과]\nbattleId: ${response.battleId}\ngroupCount: ${response.groupCount}`)
			},
			error: function(err) {
				alert(err);
			}
		})
	})
	
	function openBattleMakerPanel(container, memberId, sentenceId, semanticsDiv) {
		if(!$.fn.autocomplete) {
			$.cachedScript('https://cdn.jsdelivr.net/npm/jquery-ui-dist@1.13.1/jquery-ui.min.js');
		}
		const categorySection = battleMakerPanel.querySelector('.battle-category-section select');
		let panelInstance = battleMakerPanel.cloneNode(true);
		const now = Date.now();
		$(panelInstance).data('semantics', semanticsDiv)
						.data('memberId', memberId)
						.data('sentenceId', sentenceId);
						
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
			let battleSummary = {};
			battles.forEach(battle => {
				if(battleSummary[battle.battleType] == null) 
					battleSummary[battle.battleType] = [];
				battleSummary[battle.battleType].push(battle);
			});
			const battleList = panelInstance.querySelector('.existing-battles-section');
			battleList.innerHTML = '';
			if(Object.entries(battleSummary).length == 0) {
				battleList.append('등록된 배틀이 없습니다.');
			}else {
				Object.entries(battleSummary).forEach((summ, i) => {
					const randId = Date.now() + i;
					
					// 배틀 유형별 갯수 정보
					const briefInfo = createElement({el: 'div', className: 'js-open-existing-battle', role: 'button'});
					briefInfo.dataset.bsToggle = 'collapse';
					briefInfo.dataset.bsTarget = `.js-existing-battle-view${randId}`;
					
					briefInfo.innerHTML = `• Battle <span class="existing-battle-type">${summ[0]}</span> (으)로 등록 ( ${summ[1].length} 건 ) <span class="fold-icon text-xl align-middle"></span>`;
					battleList.append(briefInfo);
					
					// 배틀 상세 정보
					const battleDetails = createElement({el: 'div', 
						className: `js-existing-battle-view${randId} fade collapse`,
						textContent: JSON.stringify(summ[1])});
					battleList.append(battleDetails);
					
				})
			}
		})
		
		// 카테고리 화면에서 최초 1회 불러오기
		if(categorySection.childElementCount == 0) {
			$.getJSON('/grammar/category/list', categories => {
				categories.forEach(category => {
					categorySection.append(createElement({
						el:'option',value:category.cid,
						textContent: (category.parentCategory ? '└─ ':'') + category.title}));
				});
				panelInstance.querySelector('.battle-category-section select')
				.innerHTML = categorySection.innerHTML;
			})
		}
		container.innerHTML = '';
		// 배틀 1 유형을 기본으로 에디터 지정
		attachBattleMaker(panelInstance.querySelector('.craft-maker-container'), semanticsDiv, 1);
		container.append(panelInstance);
		
		// 배틀 생성탭이 처음 나올 때 askTag값 임의 지정
		$(panelInstance).find('.ask-select').trigger('change');
	}
	
	/** 배틀 문제 생성.
	@param container 에디터가 들어갈 div
	@param semanticsDiv 문제 대상 .semantics-result
	@param battleType 배틀 유형(1,2,3,4,5)
	 */
	function attachBattleMaker(container, semanticsDiv, battleType) {
		container.innerHTML = '';
		redoList = []; undoList = [];
		const makerDiv = createElement({el: 'div', className: 'battle-maker', tabIndex: 0})
		let asks = askInfos[battleType - 1];
		// 대상 문장에 포함된 성분들 파악해서 질문 목록에서 우선표시
		asks.forEach(el => {
			if(el.selector != null && semanticsDiv.querySelector(`.sem${el.selector}`) != null ) {
				el.recommended = true;
			}
		});
		asks.sort((a,b) => {
			if(!a.recommended) return 1;
			return b.recommended ? 0 : -1;
		})
		// 배틀 유형별 툴바 표시
		appendToolbar(craftToolbarGroup[`battle${battleType}`], makerDiv);
		// 배틀 유형별 질문 표시
		appendAskSelect(asks, makerDiv);
		// 수정 영역 표시
		appendContext(semanticsDiv, makerDiv);		
		container.append(makerDiv);	
		// 
		const selectedAsk = makerDiv.closest('.add-battle-section').querySelector('.ask-select');
		$(selectedAsk).trigger('change');
	}
	
	/** 주어진 버튼 그룹을 툴바에 넣어서 에디터에 탑재
	 */
	function appendToolbar(btnGroup, maker) {
		craftToolbar.innerHTML = '';
		appendBtn(btnGroup, craftToolbar);
		for(let i = 0, len = battleBtns.length; i < len; i++) {
			appendBtn(battleBtns[i], craftToolbar);
		}
		maker.prepend(craftToolbar.cloneNode(true));
	}
	/** 주어진 질문 목록을 에디터에 설정
	 */
	function appendAskSelect(askArray, maker) {
		const askSelect = document.createElement('select');
		askSelect.className = 'form-select ask-select';
		askArray.forEach((one, i) => {
			const option = document.createElement('option');
			if(one.recommended) option.className = 'bg-fc-light-purple';
			option.value = one.ask;
			if(one.tag) option.dataset.tag = one.tag
			option.innerHTML = one.fullAsk;
			if(i == 0) option.selected = true;
			askSelect.append(option);
		});
		maker.querySelector('[role=toolbar]').prepend(askSelect);
		$(askSelect).wrap('<div class="btn-group col-auto"></div>');
		askSelect.insertAdjacentHTML('beforebegin', '<label class="col-auto lh-1 my-auto me-2 text-fc-purple fw-bold">질문</label>');
	}
	/** 구문분석 div로부터 원문 텍스트를 추출하여 에디터 본문으로 삽입
	 */
	function appendContext(semanticsResult, maker) {
		const context = document.createElement('div');
		context.className = 'battle-context fs-5 bg-white mt-2 px-2 form-control';
		context.textContent = tandem.cleanSvocDOMs(semanticsResult).innerText;
		context.onmouseup = () => wrapText(maker);
		maker.append(context);
	}
	function wrapText(maker) {
		let sel = getSelection();
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
	
	function createElement(json) {
		const element = document.createElement(json.el);
		Object.keys(json).forEach(key => {
			if(!['el','children'].includes(key)) {
				element[key] = json[key];
			}
		})
		return element;
	}
	
	function appendBtn(btn, parent) {
		const element = createElement(btn);
		if(!btn.className) {
			switch(btn.el) {
				case 'button':
					element.className = 'btn btn-outline-dark col-auto btn-sm';
					break;
				case 'div':
					element.className = 'btn-group col-auto';
					break;
				default: break;
			}
		}
		
		if(btn.title && !(btn.type && btn.type == 'checkbox')) {
			element.dataset.toggle = 'tooltip';
			element.dataset.placement = 'bottom';
		}

		parent.append(element);

		if(btn.type && btn.type == 'checkbox') {
			if(!btn.className) element.className = 'btn-check';
			const chkbxId = 'btn-check-' + chkbxSeq++;
			element.id = chkbxId;
			const label = document.createElement('label');
			label.className = 'btn btn-outline-fico';
			label.htmlFor = chkbxId;
			label.innerHTML = btn.innerHTML;
			if(btn.title) {
				label.title = btn.title;
				label.dataset.toggle = 'tooltip';
				label.dataset.placement = 'bottom';
			}
			
			parent.append(label);
		}
		
		if(btn.children) {
			for(let i = 0, len = btn.children.length; i < len; i++) {
				appendBtn(btn.children[i], $(element));
			}
		}
	}		
	
	function findClassPositions(container, matcher) {
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
	
	function pushEditHistory(context){
		undoList.push(context.innerHTML);
		redoList = [];
		context.closest('.battle-maker').querySelector('[role=toolbar] [value="undo"]').disabled = false;
	}
	
	function removeAllAttributes(node) {
		while(node.attributes.length > 0) {
			node.removeAttribute(node.attributes[0].name);
		}
		Array.from(node.children).forEach(child => {
			if(child.nodeType == 1) removeAllAttributes(child);
		});
	}
	
	function selectComponentDOMs(div, arr) {
		let selections = arr || [];
		const children = div.children;
		for(let i = 0, len = children.length; i < len; i++) {
			const child = children[i];
			if(child.matches('.s,.v,.o,.c,.oc,.a,.m')) {
				selections.push(child);
			}else if(child.matches('.ncls,.acls,.advcls,.phr,.adjphr,.tor,.ger,.ptc,.advphr,.ptcphr')) {
				if(child.firstChild.nodeType == 1
				&& child.firstChild.matches('.s,.v,.o,.c,.oc,.a,.m')
				&& child.textContent == child.firstChild.textContent) {
					selections.push(child.firstChild);
				}
			}
		}
		if(selections.length == 0) {
			for(let i = 0, len = children.length; i < len; i++) {
				selections = selectComponentDOMs(children[i], selections);
			}
		}
		return selections;
	}
	
	window['craft'] = { openBattleMakerPanel, attachBattleMaker };
})(jQuery, window, document);
