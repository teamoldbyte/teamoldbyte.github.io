/** /admin/craft/list_battles.html
@author LGM
 */
function pageinit(battlePage) {
	
	const battleListContainer = document.querySelector('#battleListDiv tbody');
	const battlePaginationContainer = document.querySelector('#battlePagination');

	displayBattleList(battlePage);
	
	
	/**
	 * 목록 헤더 컬럼 정렬 기능 처리
	 */
	$(document).on('click','.thlink[data-value]', function() {
		const sortName = this.dataset.value;
		const $hiddenSortName = $('#searchFormHidden_list #sortName');
		const $direction = $('#searchFormHidden_list #asc');
		if(sortName == $hiddenSortName.val()) {
			// 정렬방향을 반대로 변경한다.
			$direction.val($direction.val() != 'true');
		}else {
			$hiddenSortName.val(this.dataset.value);
		}
		$('#pageForm').submit();
	});
	
	
	// 페이지 번호를 누르면 해당 페이지로 이동
	$(document).on('click','.page-link', function() {
		$('#searchFormHidden_list #page').val(parseInt(this.dataset.pagenum));
		$('#pageForm').submit();
	})
	
	// 새 배틀목록 조회(ajax)
	$('#pageForm').on('submit', function(e) {
		e.preventDefault();
		$.ajax({
			url: '/adminxyz/craft/battle/page',
			data: $(this).serialize(),
			success: function(page) {
				displayBattleList(page);
			}, 
			error: function() {
				aler('배틀 목록 조회에 실패했습니다.');
			} 
		});
	})
	
	// 배틀 상세보기
	$(document).on('click', '.js-open-detail', function() {
		const sentenceId = this.dataset.sentenceid;
		const eng = this.textContent
		bootstrap.Tab.getOrCreateInstance(document.querySelector('#viewAskDetail')).show();
		window.scrollTo(0,document.getElementById('battleDetailSection').offsetTop)
		
		if($(this).data('battleAnswerInfo')) {
			displayAnswerInfo($(this).data('battleAnswerInfo'));
		}else {
			$.getJSON(`/adminxyz/craft/battle/${sentenceId}`, battleAnswerInfo => {
				displayAnswerInfo(battleAnswerInfo);
				$(this).data('battleAnswerInfo', battleAnswerInfo);
			}).fail(() => alert('해설 상세정보를 조회하지 못했습니다.'));
		}
		
		
		
		function displayAnswerInfo(answerInfo) {
			const answerDetailSection = document.querySelector('.explain-detail-section');

			// 구문분석 정보
			tandem.showSemanticAnalysis(eng, answerInfo.svocTag.svocBytes, $(answerDetailSection).find('.svocInfo').empty());
			// 해석 정보
			answerDetailSection.querySelector('.korInfo').replaceChildren(createElement(Array.from(answerInfo.korList, kor => {
				return { el: 'div', textContent: kor.kor };
			})));
			
			// 단어 목록 정보
			answerDetailSection.querySelector('.wordInfo')
			.replaceChildren(createElement(Array.from(answerInfo.wordList, (word, i) => {
				return 	{ "el": "span", "class": `one-word-unit-section${i>0?' ms-3':''}`, "children": [
					{ "el": "span", "class": "title fw-bold text-blue-700", textContent: word.title }].concat(Array.from(word.senseList, sense => {
						return { "el": "span", "class": "one-part-unit-section ms-2", "children": [{ 
							"el": "span", "class": "part text-palegreen", textContent: sense.partType },
							{ "el": "span", "class": "meaning ms-1", textContent: sense.meaning }
						]};
					}))
				}
			})));			
		}
	}).on('shown.bs.tab', '#viewDescDetail', function() {
		tandem.correctMarkLine(document.querySelector('#battleDetailSection .svocInfo .semantics-result'))
	})
	
	document.getElementById('battleDetailSection').appendChild(createElement([
		{ "el": "nav", "children": [
			{ "el": "div", "class": "nav nav-tabs", "role": "tablist", "children": [
				{ "el": "button", id: 'viewAskDetail', "class": "nav-link", "type": "button", "data-bs-toggle": "pill",
					"role": "tab", "aria-controls": "nav-ask", "aria-selected": "true",
					"data-bs-target": "#battleDetailSection .ask-detail-section", "children": [
					{ "el": "span", "class": "material-icons-outlined fs-16px align-text-bottom", "textContent": "inventory_2" },
					{ "el": "span", "class": "tab-title", "textContent": "문제 상세보기" }
				]},
				{ "el": "button", id: 'viewDescDetail', "class": "nav-link", "type": "button", "data-bs-toggle": "pill",
					"role": "tab", "aria-controls": "nav-explain", "aria-selected": "false",
					"data-bs-target": "#battleDetailSection .explain-detail-section", "children": [
					{ "el": "span", "class": "material-icons-outlined fs-16px align-text-bottom", "textContent": "inventory_2" },
					{ "el": "span", "class": "tab-title", "textContent": "해설 상세보기" }
				]}
			]}
		]},
		{ "el": "div", "class": "contents-section tab-content mt-3", "children": [
			{ "el": "div", "class": "ask-detail-section tab-pane fade", "role": "tabpanel", "aria-labelledby": "nav-ask-tab", "children": [
				{ el: 'div', className: 'battleTopInfo row', children: [
					{ el: 'div', className: 'col-2 row', children: [
						{ el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '종류' },
						{ el: 'select', className: 'form-select col battle-type', children: 
							Array.from(['1','2','3','4','5'], n => {return {el: 'option', value: n, textContent: `#${n}`}}) 
						}
					]},
					{ el: 'div', className: 'col-5 row', children: [
						{ el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '질문' },
						{ el: 'select', className: 'form-select col battle-ask'}
					]},
					{ el: 'div', className: 'col-2 row', children: [
						{ el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '계급' },
						{ el: 'input', className: 'form-select col battle-engLevel', readonly: true}
					]},
					{ el: 'div', className: 'col-3 row', children: [
						{ el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '출처' },
						{ el: 'input', type: 'text', className: 'form-control col battle-source' }
					]}
				]},
				{ el: 'div', className: 'battle-context my-3 p-3 border rounded' },
				{ el: 'div', className: 'battleSubInfo row', children: [
					{ el: 'div', className: 'col-4 row', children: [
						{ el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '난이도' },
						{ el: 'select', className: 'form-select col battle-diffLevel', children: Array.from([['쉬움','A'],['보통','B'],['어려움','B']], ([textContent, value]) => {
							return { el: 'option', value, textContent }}) 
						}
					]},
					{ el: 'div', className: 'col-4 row', children: [
						{ el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '문법' },
						{ el: 'select', className: 'form-select col battle-category'}
					]},
					{ el: 'div', className: 'col-4 row', children: [
						{ el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '태그' },
						{ el: 'input', type: 'text', className: 'form-control col battle-askTag' }
					]}
				] },
				{ el: 'div', className: 'battleComment row mt-3', children: [
					{ el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '한줄 코멘트' },
					{ el: 'textarea', className: 'form-control col battle-comment' }
				]}					
			]},
			{ "el": "div", "class": "explain-detail-section tab-pane fade", "role": "tabpanel", "aria-labelledby": "nav-explain-tab", "children": [
				{ el: 'div', className: 'svocInfo my-3 py-3 position-relative d-block'},
				{ el: 'div', className: 'korInfo text-fc-red' },
				{ el: 'div', className: 'wordInfo word-section mt-3'}
			]}
		]}
	]));
	$.getJSON('/grammar/category/list', categories => {
		document.querySelector('#battleDetailSection .battle-category').appendChild(createElement(Array.from(categories, c => {
			return { el:'option', value: c.cid, textContent: `${(c.parentCategory ? '└─ ':'')}${c.title}`};
		})))
	});
	
	/** 조회된 배틀을 DOM 목록 생성하여 표시하고 페이지네이션 갱신
	 */
	function displayBattleList(page) {
		// 선택한 타이틀을 제외한 나머지의 sortMark를 보이지 않도록 한다.
		$('#battleListDiv .sortMark').hide();
		const currentSortName = $('#searchFormHidden_list #sortName').val();
		const $currSortMark = $(`.thlink[data-value="${currentSortName}"]+.sortMark`);
		if($currSortMark.length > 0) {
			$currSortMark.html($('#searchFormHidden_list #asc').val() == 'false' ? '▼' : '▲').show();
		}		
		
		const totalPages = page?.totalPages,
			currPage = page?.number + 1,
			blockLength = 10, 
			currBlock = Math.floor((currPage - 1) / blockLength) + 1,
			startPage = (currBlock - 1) * blockLength + 1,
			endPage = (startPage + blockLength <= totalPages) ? (startPage + blockLength - 1) : totalPages;
		battleListContainer.replaceChildren(createElement(Array.from(page.content, battle => {
			return { el: 'tr', children: [
				{ el: 'td', textContent: battle.rnum },
				{ el: 'td', className: 'text-center', textContent: battle.bid },
				{ el: 'td', className: 'text-center', textContent: battle.battleType },
				{ el: 'td', className: 'text-center', textContent: battle.engLevel },
				{ el: 'td', className: 'text-center', textContent: battle.grammarTitle },
				{ el: 'td', className: 'text-start js-open-detail', style: 'width:300px', 'data-sentenceid': battle.sentenceId, onclick: function() {
						const detailSection = document.querySelector('#battleDetailSection .ask-detail-section');
						// 종류
						detailSection.querySelector('.battle-type').value = battle.battleType;
						// 질문
						detailSection.querySelector('.battle-ask').replaceChildren(createElement(Array.from(craft.createAskOptions(battle.battleType, craft.getAsks(battle.battleType)), option => {
							if(option.value == battle.ask) option.selected = true;
							return option;
						})))
						// 계급
						detailSection.querySelector('.battle-engLevel').value = battle.engLevel;
						// 출처
						detailSection.querySelector('.battle-source').value = battle.source;
						// 본문
						detailSection.querySelector('.battle-context').replaceChildren(createElement(craft?.createBattleContext(battle.eng, battle)));
						// 난이도
						detailSection.querySelector('.battle-diffLevel').value = battle.diffLevel;
						// 문법카테고리
						detailSection.querySelector('.battle-category').value = battle.categoryId;
						// 태그
						detailSection.querySelector('.battle-askTag').value = battle.askTag;
						//코멘트
						detailSection.querySelector('.battle-comment').value = battle.comment;
					}, children: [
						{ el: 'a', style: { display: 'inline-block', width: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}, textContent: battle.eng }
				]},
				{ el: 'td', className: 'text-center', textContent: battle.askTag },
				{ el: 'td', className: 'text-center', textContent: battle.source },
				{ el: 'td', className: 'text-center', textContent: new Date(battle.regDate).format('yyyy-MM-dd') }
				
			]}
		})));	
		
		const pageNavs = [];
		if(startPage > blockLength) {
			pageNavs.push({ el: 'li', className: 'page-item', 'aria-label': 'Previous', children: [
				{ el: 'a', className: 'page-link', 'aria-hidden': true, 'data-pagenum': startPage - 1, innerHTML: '&laquo;'}
			]});
		}
		for(let pagenum = startPage; pagenum <= endPage; pagenum++) {
			pageNavs.push({ el: 'li', className: `page-item${pagenum == currPage ? ' active':''}`, children: [
				{ el: 'a', className: 'page-link', 'data-pagenum': pagenum, textContent: pagenum }
			]});
		}
		if(endPage < totalPages) {
			pageNavs.push({ el: 'li', className: 'page-item', 'aria-label': 'Next', children: [
				{ el: 'a', className: 'page-link', 'aria-hidden': true, 'data-pagenum': endPage + 1, innerHTML: '&raquo;'}
			]});		
		}
		battlePaginationContainer.replaceChildren(createElement(pageNavs));			
	}
}
