/** 텐덤을 기초로 한 문제 처리를 위한 모듈
 @author LGM
 */
(function($, window, document) {
	let craftToolbarGroup = {}, battleBtns = [], chkbxSeq = 0;
	let undoList = [], redoList = []; // 편집 내역
	$.getJSON('https://static.findsvoc.com/data/tandem/craft-toolbar.json', json => {
		craftToolbarGroup = json;
		battleBtns = json.common;
	});
	const allAsks = [
		[// Battle #1
			{role: 's', ask: "다음 문장의 주어(부)를 선택하세요."},
			{role: 'v', ask: "다음 문장의 동사(부)를 선택하세요."},
			{role: 'o', ask: "다음 문장의 목적어(부)를 선택하세요."},
			{role: 'c', ask: "다음 문장의 보어(부)를 선택하세요."},
			{role: 'oc', ask: "다음 문장의 목적보어(부)를 선택하세요."}
		],
		[// Battle #2
			{role: 'phr', ask: "[전치사] 수식어와 피수식어를 선택하세요."},
			{role: 'verbid', ask: "[준동사] 수식어와 피수식어를 선택하세요."},
			{role: 'rel', ask: "[관계사] 수식어와 피수식어를 선택하세요."},
			{role: 'adj', ask: "[형용사] 수식어와 피수식어를 선택하세요."},
			{role: 'appo', ask: "[동격어구/절] 수식어와 피수식어를 선택하세요."},
		],
		[// Battle #3
			{role: 'BetweenTwo', ask: "다음 문장에서 적절한 보기를 선택하세요."}
			
		],
		[// Battle #4
			{role: 'wrong', ask: "다음 문장에서 어법상 틀린 것을 선택하세요."}
			
		],
		[// Battle #5
			{role: 'arrange', ask: "다음 어구들을 해석에 맞게 배치해 보세요."}
			
		]
	]
	document.head.insertAdjacentHTML('beforeend', 
		'<style>' +
		'.battle-maker {' +
			'line-height:3;counter-set: quizIndex 0;counter-reset: quizIndex;border-style: outset;' +
			'border-radius: 1rem;outline: none;padding: 0rem 1rem;' +
		'}' +
		'.battle-context .answer, .battle-context .option, .battle-context .answer-wrong {' +
			'position: relative;counter-increment: quizIndex;' +
			'text-decoration:underline;' +
		'}' +
		'.battle-context .answer::after,.battle-context .option::after, .battle-context .answer-wrong::after {' +
			'position: absolute;width: calc(1em + 2px);' +
			'line-height: 1;top: 1.5em;left: calc(50% - .5em - 1px);' +
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
		'.battle-context *:hover { background: gold}' +
		'</style>');
		
	let battleMakerPanel = createElement({el: "div", className: "battle-section-panel"});
	battleMakerPanel.insertAdjacentHTML('afterbegin',
`	<!-- 기존 문제 조회 영역 -->
	<div class="existing-battle-section border-bottom mb-3 pb-3">
		<h5 class="mb-3">기존 등록 배틀 조회</h5>
		<!-- 조회 결과 -->
		<div>
			<div class="js-open-existing-battles" role="button" data-bs-toggle="collapse">
				• Battle <span class="existing-battle-type">0</span> 으로 등록 ( <span class="existing-battle-count">0</span> 건 ) <span class="fold-icon text-xl align-middle"></span>
			</div>
		</div>
		<!-- 기존 등록 배틀 상세보기 영역 -->
		<div class="js-existing-battle-view fade collapsed">
			<p>---- 기존 등록 배틀 상세보기 영역. 추가 구현 예정 ----</p>
			
		</div>
	</div>						
	<!-- 배틀 추가 등록 영역 -->
	<div class="add-battle-section">
		<!-- 배틀 타입 선택 -->
		<div class="battle-type-section mb-3">
			<h5 class="mb-3">배틀 타입 선택</h5>
			<input type="radio" name="battleTypeSelect" autocomplete="off" value="1">
			1. 성분 찾기
			<input type="radio" name="battleTypeSelect" autocomplete="off" value="2">
			2. 수식어 찾기
			<input type="radio" name="battleTypeSelect" autocomplete="off" value="3">
			3. 맞는 어법 찾기
			<input type="radio" name="battleTypeSelect" autocomplete="off" value="4">
			4. 틀린 어법 찾기
			<input type="radio" name="battleTypeSelect" autocomplete="off" value="5">
			5. 문장요소 배열하기
		</div>
		<!-- 문제 입력 -->
		<div class="add-detail-battle-section">
			<div class="battle-editor-section">
				<h5 class="mb-3">문제</h5>
				<!-- 문제 입력 에디터 -->
				<div class="craft-maker-container">
				</div>
			</div>
			<div class="row g-2 mb-3">
				<!-- 카테고리 입력 -->
				<div class="battle-category-section col-12 col-md-6">
					<h5 class="mb-3">카테고리</h5>
					<select class="form-select">
					</select>
				</div>
				<!-- 난이도 입력 -->
				<div class="battle-diffLevel-section col-12 col-md-6">
					<h5 class="mb-3">난이도</h5>
					<select class="form-select">
						<option value="E">쉬움</option>
						<option value="N" selected>보통</option>
						<option value="D">어려움</option>
					</select>
				</div>
			</div>
			<!-- 질문에 대한 태그 입력 -->
			<div class="battle-askTag-section mb-3">
				<h5 class="mb-3">질문에 대한 태그</h5>
				<input type="text" class="askTag form-control" placeholder="ex) 목적어(부), 관계사(카테고리명)">
			</div>
			<!-- 문제 해설 -->
			<div class="battle-comment-section mb-3">
				<h5 class="mb-3">해설</h5>
				<textarea class="comment form-control" rows="2" placeholder="문제에 대한 해설, 참조 링크 등"></textarea>
			</div>
			<div class="battle-source-section mb-3">
				<h5 class="mb-3">출처</h5>
				<input type="text" class="source form-control" placeholder="ex) OOO 워크북, 2022년 6월 고3 모의고사 등">
			</div>
			<div class="button-section text-end">
				<button type="button" class="js-add-battle btn btn-fico">등록</button>
			</div>
		</div>
	</div>`);
		
	let craftToolbar = document.createElement('div');
	craftToolbar.className = 'row g-2 btn-toolbar';
	craftToolbar.setAttribute('role','toolbar');
	
	
	$(document)
	.on('change', '.battle-type-section input[type=radio]', function() {
		const semanticResult = $(this).closest('.battle-section-panel').data('semantics');
		
		const makerContainer = this.closest('.add-battle-section').querySelector('.craft-maker-container');
		
		attachBattleMaker(makerContainer, semanticResult, this.value)
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
	}).on('click', '.battle-context *', function() {
		if(this.nodeName == 'SPAN') {
			this.outerHTML = this.innerHTML;
		}else {
			this.remove();
		}
	}).on('click', '.battle-maker [value=undo], .battle-maker [value=redo]', function() {
		const isUndo = this.value == 'undo';
		const editHistory = isUndo ? undoList.pop() : redoList.pop();
		const makerDiv = this.closest('.battle-maker');
		const context = makerDiv.querySelector('.battle-context');
		
		(isUndo ? redoList : undoList).push(context.innerHTML);
		context.innerHTML = editHistory;
		$(context).animate({opacity:0.5},100).animate({opacity:1},100);
		
		makerDiv.querySelector('[value=undo]').disabled = undoList.length == 0;
		makerDiv.querySelector('[value=redo]').disabled = redoList.length == 0;
	}).on('click', '.js-add-battle', function() {
		const addSection = this.closest('.add-battle-section');
		const $battlePanel = $(addSection).closest('.battle-section-panel');
		const battleContext = addSection.querySelector('.battle-context');
		
		let example = '', answer = '';
		const battleType = Number(addSection.querySelector('[name=battleTypeSelect]:checked').value);
		switch(battleType) {
			case 1:
				example = findClassPositions(battleContext, '.answer, .option');
				answer = findClassPositions(battleContext, '.answer');
				break;
			case 2:
				answer = [findClassPositions(battleContext, '.modifier')[0],
						  findClassPositions(battleContext, '.modificand')[0]];
				break;
			case 3:
				let blank = battleContext.querySelector('.pick-right');
				example = [findClassPositions(battleContext, '.pick-right')[0],
							blank.textContent.trim(), blank.dataset.wrong.trim()];
				answer = [blank.textContent.trim()];
				break;
			case 4:
				let wrong = battleContext.querySelector('.answer-wrong');
				example = findClassPositions(battleContext, '.option, .answer-wrong');
				answer = [findClassPositions(battleContext, '.answer-wrong')[0],
							wrong.textContent.trim()];
				break;
			case 5:
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
			diffLevel: addSection.querySelector('.battle-diffLevel-section select').value
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
		const categorySection = battleMakerPanel.querySelector('.battle-category-section select');
		let panelInstance = battleMakerPanel.cloneNode(true);
		
		$(panelInstance).data('semantics', semanticsDiv)
						.data('memberId', memberId)
						.data('sentenceId', sentenceId);
		
		// 문장에 등록된 배틀 조회
		$.getJSON(`/craft/battle/search/${sentenceId}`, battles => {
			
		})
		
		// 카테고리 화면에서 최초 1회 불러오기
		if(categorySection.childElementCount == 0) {
			categorySection.append(createElement({el:'option',selected:'selected',disabled:'disabled',innerHTML: '카테고리 선택'}))
			$.getJSON('/grammar/category/list', categories => {
				categories.forEach(category => {
					categorySection.append(createElement({
						el:'option',value:category.cid,
						textContent: (category.parentCategory ? '└─':'') + category.title}));
				});
				panelInstance.querySelector('.battle-category-section select')
				.innerHTML = categorySection.innerHTML;
			})
		}
		container.innerHTML = '';
		container.append(panelInstance);
	}
	
	/** 배틀 문제 생성.
	@param container 에디터가 들어갈 div
	@param semanticsDiv 문제 대상 .semantics-result
	@param battleType 배틀 유형(1,2,3,4,5)
	 */
	function attachBattleMaker(container, semanticsDiv, battleType) {
		container.innerHTML = '';
		redoList = []; undoList = [];
		const makerDiv = document.createElement('div');
		makerDiv.className = 'battle-maker';
		let asks = allAsks[battleType - 1];
		if(battleType == 1) {
			// 대상 문장에 포함된 성분들 파악해서 질문 목록에서 우선표시
			asks.forEach(el => {
				if(semanticsDiv.querySelector(`.sem.${el.role}`) != null ) {
					el.recommended = true;
				}
			});
			asks.sort((a,b) => {
				if(!a.recommended) return 1;
				return b.recommended ? 0 : -1;
			})
		}
		appendToolbar(craftToolbarGroup[`battle${battleType}`], makerDiv);
		appendAskSelect(asks, makerDiv);
		appendContext(semanticsDiv, makerDiv);		
		container.append(makerDiv);	
	}
	
	function appendToolbar(btnGroup, parent) {
		craftToolbar.innerHTML = '';
		appendBtn(btnGroup, craftToolbar);
		for(let i = 0, len = battleBtns.length; i < len; i++) {
			appendBtn(battleBtns[i], craftToolbar);
		}
		parent.prepend(craftToolbar.cloneNode(true));
	}
	function appendAskSelect(askArray, maker) {
		const askSelect = document.createElement('select');
		askSelect.className = 'form-select ask-select';
		askArray.forEach(one => {
			const option = document.createElement('option');
			if(one.recommended) option.className = 'bg-dark text-white';
			option.value = `find${one.role.toUpperCase()}`;
			option.innerHTML = one.ask;
			askSelect.append(option);
		});
		maker.querySelector('[role=toolbar]').prepend(askSelect);
		$(askSelect).wrap('<div class="col-auto"></div>');
	}
	function appendContext(semanticsResult, maker) {
		const context = document.createElement('div');
		context.className = 'battle-context bg-white my-3 px-2';
		context.textContent = tandem.cleanSvocDOMs(semanticsResult).innerText;
		context.onmouseup = () => wrapText(maker);
		maker.append(context);
	}
	function wrapText(maker) {
		const sel = getSelection();
		const chkdBtn = maker.querySelector('[role=toolbar] [type=checkbox]:checked');
		if(!sel.isCollapsed && chkdBtn) {
			if(sel.toString().trim() == maker.querySelector('.battle-context').textContent.trim()) return;
			
			pushEditHistory(maker.querySelector('.battle-context'));
			
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
