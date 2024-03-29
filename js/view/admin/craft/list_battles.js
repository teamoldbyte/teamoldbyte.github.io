/** /admin/craft/list_battles.html
@author LGM
 */
async function pageinit() {
	
	const battleListContainer = document.querySelector('#battleListDiv tbody');
	const battlePaginationContainer = document.querySelector('#battlePagination');
	const battleTypeTitles = ['#1(성분)','#2(수식어)','#3(택일/2)','#4(틀린/n)','#5(영작)','#6(빈칸)','#7(해석)','#8(토익)'];
	//displayBattleList(battlePage, 'pageForm');
	
	if(!$.fn.autocomplete) {
		document.head.append(createElement(
				{el: 'link', rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/jquery-ui-dist@1.13.1/jquery-ui.min.css'}
		));
		$.ajax({url: 'https://cdn.jsdelivr.net/npm/jquery-ui-dist@1.13.1/jquery-ui.min.js', dataType: 'script', cache: true});
		
	}
	
	/**
	 * 배틀 검색
	 */
	let workBookTitles = {}, writerAliases = {}, allAskTags = {}, rankList = [];
	$(document)
	.on('show.bs.collapse hide.bs.collapse', '#searchBattleDiv', function(e) {
		const $btn = $('.searchIcon[data-bs-target="#searchBattleDiv"]');
		$btn.toggleClass('fa-search-minus fa-search-plus')
	})
	.on('change', '#searchTypeSelect', function() {
		const $inputSection = $(`.search-input-section.${this.value}`);
		const needsSearchBtn = /eng|workBookTitle|writer|askTag/.test(this.value);
		$('#searchBtn').toggle(needsSearchBtn);
		$('#refreshBtn').toggle(!needsSearchBtn);
		switch(this.value) {
			case 'battleBookTitle':
				if(!$inputSection.find('select').children().length) {
					$.getJSON('/adminxyz/craft/battle/search/form/booklist', list => {
						const sorted = list.sort();
						$inputSection.find('select').append(createElement(Array.from(sorted, ({name, longValue}) => {
							return {el: 'option', textContent: name, value: longValue}
						})));
						$inputSection.find('.battlebook-id').text($inputSection.find('select').val());
					})
				}
				break;
			case 'workBookTitle':
				if(!$inputSection.find('input').autocomplete('instance')) {
					$inputSection.find('input').autocomplete({
						minLength: 2, delay: 50, source: function(req, res) {
							const term = req.term && req.term.trim();
							if(term in workBookTitles) {
								res(workBookTitles[term]);
								return;
							}
							$.getJSON(`/craft/battle/workbook/search/${term}`, function(data) {
								workBookTitles[term] = data.sort();
								res(data);
							}).fail(() => {
								workBookTitles[term] = [];
								res([]);
							})
						}, select: function(event,ui) {
							event.target.value = ui.item.value;
							$('#searchBattleForm').submit();
						}
					})
				}
				break;
			case 'battleType': 
				if($inputSection.find('select').children().length == 0) {
					$inputSection.find('select').append(createElement(Array.from(battleTypeTitles, (title,i) => {
						return {el: 'option', value: i + 1, textContent: title }
					})))
				}
				break;
			case 'writer': 
				if(!$inputSection.find('input').autocomplete('instance')) {
					$inputSection.find('input').autocomplete({
						minLength: 1, delay: 50, source: function(req, res) {
							const term = req.term && req.term.trim();
							if(term in writerAliases) {
								res(writerAliases[term]);
								return;
							}
							$.getJSON(`/craft/battle/alias/search/${term}`, function(data) {
								writerAliases[term] = data.sort();
								res(data);
							}).fail(() => {
								writerAliases[term] = [];
								res([]);
							})
						}, select: function(_event, ui) {
							const [_all, alias, mid] = ui.item.value.match(/(.+) : (\d+)$/);
							$inputSection.find('.selected-writer').attr('data-mid', mid).text(alias);
							$(this).val('').next('span').show();
							$('#searchBattleForm').submit()
						}
					})
				}
				break;
			case 'askTag': {
				if(!$inputSection.find('input').autocomplete('instance')) {
					$.getJSON('/adminxyz/craft/battle/search/form/taglist', list => {
						allAskTags = list.sort();
						$inputSection.find('input').autocomplete({
							minLength: 0, delay: 50, source: allAskTags,
							select: function(event,ui) {
								event.target.value = ui.item.value;
								$('#searchBattleForm').submit();
							}
						})
					});
					$inputSection.find('input').on('click', function() {
						$(this).autocomplete('search');
					})
				}
				break;
			}
			case 'grammarTitle': {
				if(!$inputSection.find('select').children().length) {
					$.getJSON('/grammar/category/list', list => {
						$inputSection.find('select').append(createElement(Array.from(list, c => {
							return { el:'option', value: c.cid, textContent: `${(c.parentCategory ? '└─ ':'')}${c.title}`};
						})))
					})
				}
				break;
			}
			case 'engLevel': {
				if(!rankList.length) {
					$.getJSON('https://static.findsvoc.com/data/craft/rank-list.json', list => {
						list.forEach(el => {
							if(!rankList.includes(el.battleLevel))
								rankList.push(el.battleLevel);
						});
						$inputSection.find('select').append(createElement(Array.from(rankList, rank => {
							return { el: 'option', value: rank, children: [ rank ]};
						})));
					})
				}
				break;
			}
			case 'comment': {
				$('#searchBattleForm').submit();
				break;
			}
			default: break;
		}
		$(`.search-input-section.${this.value}`).show().siblings('.search-input-section').hide();
	})
	.on('change', '.search-input-section select', function() {
		if(this.closest('.battleBookTitle')) {
			$(this).closest('.search-input-section').find('.battlebook-id').text(this.value);
		}
		$('#searchBattleForm').submit();
	})
	.on('click', '.js-copy-battlebookid', function() {
		navigator?.clipboard?.writeText($('.battlebook-id').text());
		$(this).popover('show');
		setTimeout(() => $(this).popover('hide'), 1500);
	})
	.on('submit', '#searchBattleForm', function(e) {
		const command = Object.fromEntries(new FormData(this).entries());
		e.preventDefault();
		const $inputSection = $(this).find(`.search-input-section.${command.searchType}`);
		switch(command.searchType) {
			case 'battleBookTitle': case 'grammarTitle': case 'engLevel': case 'battleType': {
				command.keyword = $inputSection.find('select').val();
				break;
			}
			case 'engLength': {
				command.keyword = Array.from($inputSection.find('input').get(), input => input.value).join('~');
				break;
			}
			case 'writer': {
				command.keyword = $inputSection.find('.selected-writer').attr('data-mid');
				break;
			}
			default: {
				command.keyword = $inputSection.find('input').val()?.trim();
				break;
			}
		}
		$.getJSON(this.action, command, (battleList) => displayBattleList(battleList, 'searchBattleForm'))
		.fail(() => alertModal('배틀 검색 오류 발생'));
	})
	
	
	/**
	 * 목록 헤더 컬럼 정렬 기능 처리
	 */
	$(document).on('click','.thlink[data-value]', function() {
		const sortName = this.dataset.value;
		const searchFormId = battleListContainer.dataset.searchForm;
		const $hiddenSortName = $(`#${searchFormId} #sortName`);
		const $direction = $(`#${searchFormId} #asc`);
		if(sortName == $hiddenSortName.val()) {
			// 정렬방향을 반대로 변경한다.
			$direction.val($direction.val() != 'true');
		}else {
			$hiddenSortName.val(this.dataset.value);
		}
		$(`#${searchFormId}`).submit();
	});
	
	
	// 페이지 번호를 누르면 해당 페이지로 이동
	$(document).on('click','.page-link', function() {
		const searchFormId = battlePaginationContainer.dataset.searchForm;
		$(`#${searchFormId} #page`).val(parseInt(this.dataset.pagenum));
		$(`#${searchFormId}`).submit();
	})
	
	// 새 배틀목록 조회(ajax)
	$('#pageForm').on('submit', function(e) {
		e.preventDefault();
		$.ajax({
			url: '/adminxyz/craft/battle/page',
			data: $(this).serialize(),
			success: function(page) {
				displayBattleList(page, 'pageForm');
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
		
		const thisRow = this.closest('tr');
		const $detailSection = $('#battleDetailSection');
		if($detailSection.is('.show') && $detailSection.is($(thisRow).next())) {
			$detailSection.collapse('hide');
			return;
		}
		
		bootstrap.Tab.getOrCreateInstance(document.querySelector('#viewAskDetail')).show();
		
		if($detailSection.is('.show')) {
			$detailSection[0].scrollIntoView({ behavior: 'instant', block: 'nearest'})
		}
		$(thisRow).after($detailSection.collapse('show'));
		
		$('#editBattle').prop('disabled', true);
		
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
	})
	.on('shown.bs.collapse', '#battleDetailSection', function() {
		window.scrollTo(0,document.getElementById('battleDetailSection').offsetTop);
	})
	.on('shown.bs.tab', '#viewDescDetail', function() {
		tandem.correctMarkLine(document.querySelector('#battleDetailSection .svocInfo .semantics-result'))
	})
	
	// 배틀 수정
	$(document).on('input', '#battleDetailSection *', function(e) {
		e.stopPropagation();
		if(this.matches('.battle-diffLevel'))
			document.querySelector('.battle-engLevel').textContent = craft.calcDiffSpecific(this.value, $('#battleDetailSection').data('battleCommand').eng.length);
		$('#editBattle').prop('disabled',Array.from(document.getElementById('battleDetailSection').querySelectorAll('input, textarea, select')).every( input => input.value == input.dataset.org));
	}).on('click', '#editBattle', function() {
		const orgCommand = $('#battleDetailSection').data('battleCommand');
		let command = buildBattleCommand();
		const changed = []; // 수정된 항목 이름들
		Object.keys(command).forEach(key => {
			if(command[key] != orgCommand[key])
				changed.push(key);
		})
		let pathVariable = '';
		if(changed.length == 1) {
			pathVariable = {'askTag': '/tag', 'comment': '/comment', 'categoryId': '/category'}[changed[0]]||'';
			const tempCommand = { battleId: command.battleId };
			tempCommand[changed[0]] = command[changed[0]];
			command = tempCommand;
		}
		$.ajax({
			url: `/adminxyz/craft/battle/edit${pathVariable}`,
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify(command),
			success: function() {
				alert('배틀이 수정되었습니다.');
				const battleId = command.battleId;
				const tableRow = document.querySelector(`.data-bid[data-battleid="${battleId}"]`).closest('tr');
				changed.forEach(key => {
					switch(key) {
						case 'battleType':
							tableRow.querySelector('.data-type').textContent = command[key];
							break;
						case 'askTag':
							tableRow.querySelector('.data-asktag').textContent = command[key];
							break;
						case 'categoryId':
							tableRow.querySelector('.data-gramtitle').textContent = document.querySelector(`#battleDetailSection .battle-category option[value="${command[key]}"]`).textContent;
							break;
						case 'source':
							tableRow.querySelector('.data-source').textContent = command[key];
							break;
						case 'diffLevel':
							tableRow.querySelector('.data-englevel').textContent = command['engLevel'];
							break;
						default: break;
					}
				});
				tableRow.querySelector('.js-open-detail').onclick = () => updateBattleDetailSection(Object.assign({}, orgCommand, command, {bid: battleId}));
				updateBattleDetailSection(Object.assign({}, orgCommand, command, {bid: battleId}));
			},
			error: () => alert('배틀을 수정하지 못 했습니다.')
		})
	})
	
	// 배틀 삭제
	$(document).on('click', '#deleteBattle', function() {
		const battleId = this.dataset.battleid;
		$.post(`/adminxyz/craft/battle/del/${battleId}`, function() {
			alert('배틀이 삭제되었습니다.');
			$('#battleDetailSection').collapse('hide');
			const deleteTarget = document.querySelector(`.data-bid[data-battleid="${battleId}"]`).closest('tr');
			deleteTarget.className = 'pe-none opacity-50 bg-danger';
			deleteTarget.querySelector('.js-open-detail').onclick = () => alert('삭제된 배틀입니다.')
		}).fail(() => alert('배틀을 삭제하지 못 했습니다.'))
	})
	
	document.getElementById('battleDetailSection').querySelector('td').appendChild(createElement([
			{ "el": "nav", "children": [
				{ "el": "div", "class": "nav nav-tabs col-auto", "role": "tablist", "children": [
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
				{ "el": "div", "class": "ask-detail-section tab-pane fade row m-auto", "role": "tabpanel", "aria-labelledby": "nav-ask-tab", "children": [
					{ el: 'div', className: 'battleTopInfo row', children: [
						{ el: 'div', className: 'col-2 row', children: [
							{ el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '종류' },
							{ el: 'select', className: 'form-select col battle-type', children: 
								Array.from(['1','2','3','4','5','6','7','8'], n => {return {el: 'option', value: n, textContent: battleTypeTitles[n-1]}}) 
							}
						]},
						{ el: 'div', className: 'col-5 row', children: [
							{ el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '질문' },
							{ el: 'select', className: 'form-select col battle-ask'}
						]},
						{ el: 'div', className: 'col-auto row', children: [
							{ el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '난이도' },
							{ el: 'select', className: 'form-select col battle-diffLevel', children: Array.from([['쉬움','A'],['보통','B'],['어려움','C']], ([textContent, value]) => {
								return { el: 'option', value, textContent }}) 
							}
						]},
						{ el: 'div', className: 'col-auto row', children: [
							{ el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '계급' },
							{ el: 'span', className: 'col battle-engLevel my-auto'}
						]}
					]},
					{ el: 'div', className: 'col-12 row', children: [
						{ el: 'div', className: 'col-auto invisible', textContent: '본문'},
						{ el: 'div', className: 'col battle-context my-3 p-3 border rounded ws-breakspaces'}
					]},
					{ el: 'div', className: 'battleSubInfo col-12 row', children: [
						{ el: 'div', className: 'col-4 row', children: [
							{ el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '출처' },
							{ el: 'input', type: 'text', className: 'form-control col battle-source', maxLength: 100 }
						]},
						{ el: 'div', className: 'col-4 row', children: [
							{ el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '문법' },
							{ el: 'select', className: 'form-select col battle-category'}
						]},
						{ el: 'div', className: 'col row', children: [
							{ el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '태그' },
							{ el: 'input', type: 'text', className: 'form-control col battle-askTag', maxLength: 100 }
						]}
					] },
					{ el: 'div', className: 'battleComment col-12 mt-3', children: [
						{ el: 'label', className: 'col-auto lh-1 my-auto text-fc-purple fw-bold', textContent: '해설' },
						{ el: 'textarea', className: 'form-control col battle-comment', rows: 10, maxLength: 1500 }
					]},
					{ el: 'div', className: 'battleEditBtns mt-3 position-relative text-center', children: [
						{ el: 'button', type: 'button', id: 'deleteBattle', className: 'btn btn-outline-fico col-auto', children: [
							{ el: 'i', className: 'fas fa-trash-alt me-1'}, '삭제'
						]},
						{ el: 'button', type: 'button', id: 'editBattle', className: 'btn btn-outline-fico col-auto', disabled: true, children: [
							{ el: 'i', className: 'far fa-file-alt'},
							{ el: 'i', className: 'fas fa-pen fa-xs', style: 'left: -8px; top: 5px; position: relative;'}, '수정'
						]},
						/*{ el: 'button', type: 'button', id: 'viewNextBattle', className: 'btn btn-md btn-outline-fico col-auto fas fa-angle-right fs-3 float-end', 'data-bs-title': '다음 배틀', 'data-bs-toggle': 'tooltip'},
						{ el: 'button', type: 'button', id: 'viewPrevBattle', className: 'btn btn-md btn-outline-fico col-auto fas fa-angle-left fs-3 float-end', 'data-bs-title': '이전 배틀', 'data-bs-toggle': 'tooltip'}*/
					]}
				]},
				{ "el": "div", "class": "explain-detail-section tab-pane fade", "role": "tabpanel", "aria-labelledby": "nav-explain-tab", "children": [
					{ el: 'div', className: 'my-3 py-3 row', children: [
						{ el: 'label', className: 'col-auto lh-1 mt-3 text-fc-purple fw-bold', textContent: '분석' },
						{ el: 'div', className: 'svocInfo position-relative col'}
					]},
					{ el: 'div', className: 'row', children: [
						{ el: 'label', className: 'col-auto lh-1 text-fc-purple fw-bold', textContent: '해석' },
						{ el: 'div', className: 'korInfo text-fc-red col' }
					]},
					{ el: 'div', className: 'mt-3 row', children: [
						{ el: 'label', className: 'col-auto lh-1 text-fc-purple fw-bold', textContent: '단어' },
						{ el: 'div', className: 'wordInfo word-section col'}
					]}
				]}
		]}
	]));
	
	
	$.getJSON('/grammar/category/list', categories => {
		document.querySelector('#battleDetailSection .battle-category').appendChild(createElement(Array.from(categories, c => {
			return { el:'option', value: c.cid, textContent: `${(c.parentCategory ? '└─ ':'')}${c.title}`};
		})))
	});
	await openSummernote($('#battleDetailSection textarea.battle-comment'));
	
	
	function buildBattleCommand() {
		const command = $('#battleDetailSection').data('battleCommand'),
			askDetailSection = document.querySelector('#battleDetailSection .ask-detail-section');
		return Object.assign({}, command, {
			// 종류
			battleType: askDetailSection.querySelector('.battle-type').value,
			// 질문
			ask: askDetailSection.querySelector('.battle-ask').value,
			// 계급
			engLevel: craft.calcDiffSpecific(askDetailSection.querySelector('.battle-diffLevel').value, command.engLength),
			// 출처
			source: askDetailSection.querySelector('.battle-source').value,
			// 본문
			//askDetailSection.querySelector('.battle-context').replaceChildren(createElement(craft?.createBattleContext(battle.eng, battle)));
			// 난이도
			diffLevel: askDetailSection.querySelector('.battle-diffLevel').value,
			// 문법카테고리
			categoryId: parseInt(askDetailSection.querySelector('.battle-category').value),
			// 태그
			askTag: askDetailSection.querySelector('.battle-askTag').value,
			//코멘트
			comment: $(askDetailSection).find('.battle-comment').summernote('code')			
		});
	}
	
	/** 조회된 배틀을 DOM 목록 생성하여 표시하고 페이지네이션 갱신
	 */
	
	function displayBattleList(page, searchFormId) {
		// 배틀 상세보기는 따로 옮기기
		$('#battleDetailContainer').append($('#battleDetailSection'));
		
		// 선택한 타이틀을 제외한 나머지의 sortMark를 보이지 않도록 한다.
		$('#battleListDiv .sortMark').hide();
		const currentSortName = $(`#${searchFormId} #sortName`).val();
		const $currSortMark = $(`.thlink[data-value="${currentSortName}"]+.sortMark`);
		if($currSortMark.length > 0) {
			$currSortMark.html($(`#${searchFormId} #asc`).val() == 'false' ? '▼' : '▲').show();
		}		
		
		const totalPages = page?.totalPages,
			currPage = page?.number + 1,
			blockLength = 10, 
			currBlock = Math.floor((currPage - 1) / blockLength) + 1,
			startPage = (currBlock - 1) * blockLength + 1,
			endPage = (startPage + blockLength <= totalPages) ? (startPage + blockLength - 1) : totalPages;
		battleListContainer.dataset.searchForm = searchFormId;
		battleListContainer.replaceChildren(createElement(Array.from(page.content, (battle, i) => {
			return { el: 'tr', children: [
				{ el: 'td', className: 'data-rnum', textContent: page?.totalElements - page?.number * page?.size - i },
				{ el: 'td', className: 'data-bid text-center', textContent: battle.bid, 'data-battleid': battle.bid },
				{ el: 'td', className: 'data-englevel text-center', textContent: battle.engLevel },
				{ el: 'td', className: 'data-gramtitle text-center', textContent: battle.grammarTitle },
				{ el: 'td', className: 'data-englength text-center', textContent: battle.engLength },
				{ el: 'td', className: 'data-context text-start js-open-detail', style: 'width:300px', 'data-sentenceid': battle.sentenceId, 
					onclick: () => updateBattleDetailSection(battle), children: [
						{ el: 'a', style: { display: 'inline-block', width: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}, textContent: battle.eng }
				]},
				{ el: 'td', className: 'data-type text-start ps-3', textContent: battleTypeTitles[battle.battleType-1] },
				{ el: 'td', className: 'data-asktag text-center', textContent: battle.askTag },
				{ el: 'td', className: 'data-source text-center', textContent: battle.source },
				{ el: 'td', className: 'data-regdate text-center', textContent: new Date(battle.regDate).format('yyyy-MM-dd') }
				
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
		battlePaginationContainer.dataset.searchForm = searchFormId;
		battlePaginationContainer.replaceChildren(createElement(pageNavs));			
	}
	
	/** 배틀 상세정보란 갱신
	 */
	function updateBattleDetailSection(battle) {
		const askDetailSection = document.querySelector('#battleDetailSection .ask-detail-section');
		$('#battleDetailSection').data('battleCommand', Object.assign({}, battle, {battleId: battle.bid, diffSpecificLevel: battle.engLevel}));
		// 종류
		askDetailSection.querySelector('.battle-type').value = battle.battleType;
		askDetailSection.querySelector('.battle-type').dataset.org = battle.battleType;
		// 질문
		askDetailSection.querySelector('.battle-ask').dataset.org = battle.ask;
		askDetailSection.querySelector('.battle-ask').replaceChildren(
			createElement(Array.from(
				craft.createAskOptions(battle.battleType, 
					craft.getAsks(battle.battleType)), option => {
						if(option.value == battle.ask) option.selected = true;
						if(battle.battleType >= 5) option.value = battle.ask;
						return option;
					}
				)
			)
		)
		// 계급
		askDetailSection.querySelector('.battle-engLevel').dataset.org = battle.engLevel;
		askDetailSection.querySelector('.battle-engLevel').textContent = battle.engLevel;
		// 출처
		askDetailSection.querySelector('.battle-source').dataset.org = battle.source;
		askDetailSection.querySelector('.battle-source').value = battle.source;
		// 본문
		const contextChildren = craft?.createRangedSentenceBlock(battle.eng, battle);
		askDetailSection.querySelector('.battle-context').replaceChildren(createElement(contextChildren));
		// 난이도
		askDetailSection.querySelector('.battle-diffLevel').dataset.org = battle.diffLevel;
		askDetailSection.querySelector('.battle-diffLevel').value = battle.diffLevel;
		// 문법카테고리
		askDetailSection.querySelector('.battle-category').dataset.org = battle.categoryId;
		askDetailSection.querySelector('.battle-category').value = battle.categoryId;
		// 태그
		askDetailSection.querySelector('.battle-askTag').dataset.org = battle.askTag;
		askDetailSection.querySelector('.battle-askTag').value = battle.askTag;
		//코멘트
		askDetailSection.querySelector('.battle-comment').dataset.org = battle.comment;
		askDetailSection.querySelector('.battle-comment').value = battle.comment;
		$(askDetailSection.querySelector('.battle-comment')).summernote('reset');
		$(askDetailSection.querySelector('.battle-comment')).summernote('code', battle.comment);
		
		// 삭제, 수정버튼에 배틀아이디 할당
		askDetailSection.querySelector('#deleteBattle').dataset.battleid = battle.bid;
		
		// 수정 버튼은 초기 비활성화
		$('#editBattle').prop('disabled', true);
		
		// 이전,다음 버튼 할당
		const prevBattleBtn = document.getElementById('viewPrevBattle'),
			nextBattleBtn = document.getElementById('viewNextBattle'),
			currRow = document.querySelector(`.data-bid[data-battleid="${battle.bid}"]`).closest('tr');
		$(currRow).addClass('bg-violet-200')
			.siblings().removeClass('bg-violet-200');
//		prevBattleBtn.disabled = $(currRow).prev().length == 0;
//		nextBattleBtn.disabled = $(currRow).next().length == 0;
//		prevBattleBtn.onclick = () => $(currRow).prev()?.find('.js-open-detail')?.trigger('click');
//		nextBattleBtn.onclick = () => $(currRow).next()?.find('.js-open-detail')?.trigger('click');		
	}
}
