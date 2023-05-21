/** /admin/sentence/list_sentences.html
@author LGM
 */
async function pageinit(memberId, alias, image) {
	
	const sentenceListContainer = document.querySelector('#sentenceListDiv tbody');
	const sentencePaginationContainer = document.querySelector('#sentencePagination');
	//displaySentenceList(sentencePage, 'pageForm');
	
	if(!$.fn.autocomplete) {
		document.head.append(createElement(
			{el: 'link', rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/jquery-ui-dist@1.13.1/jquery-ui.min.css'}
		));
		await $.ajax({url: 'https://cdn.jsdelivr.net/npm/jquery-ui-dist@1.13.1/jquery-ui.min.js', dataType: 'script', cache: true});
		
	}
	
	const WORKBOOK_ELEMENTS = await $.get('https://static.findsvoc.com/data/workbook/element_templates.min.html', jQuery.noop, 'html');
//	const WORKBOOK_ELEMENTS = await $.get('/data/workbook/element_templates.html', jQuery.noop, 'html');
	
	/**
	 * 센텐스 검색
	 */
	let sentenceSuggestCache = {}, writerSuggestCache = {};
	$(document)
	.on('show.bs.collapse hide.bs.collapse', '#searchSentenceDiv', function(e) {
		const $btn = $('.searchIcon[data-bs-target="#searchSentenceDiv"]');
		$btn.toggleClass('fa-search-minus fa-search-plus')
	})
	.on('change', '#searchTypeSelect', function() {
		const $inputSection = $(`.search-input-section.${this.value}`);
		const needsSearchBtn = !/metaStatus/.test(this.value);
		$('#searchBtn').toggle(needsSearchBtn);
		$('#refreshBtn').toggle(!needsSearchBtn);
		switch(this.value) {
			case 'eng':
				if(!$inputSection.find('input').autocomplete('instance')) {
					$inputSection.find('input').autocomplete({
						minLength: 2, delay: 50, source: function(req, res) {
							const term = req.term && req.term.trim();
							if(term in sentenceSuggestCache) {
								res(sentenceSuggestCache[term]);
								return;
							}
							$.getJSON('/sentence/search', {eng: term}, function(data) {
								sentenceSuggestCache[term] = Array.from(data, sentence => sentence.eng).sort();
								res(sentenceSuggestCache[term]);
							}).fail(() => {
								sentenceSuggestCache[term] = [];
								res([]);
							})
						}, select: function(event,ui) {
							event.target.value = ui.item.value;
							$('#searchSentenceForm').submit();
						}
					})
				}
				break;
			case 'writer': 
				if(!$inputSection.find('input').autocomplete('instance')) {
					$inputSection.find('input').autocomplete({
						minLength: 1, delay: 50, source: function(req, res) {
							const term = req.term && req.term.trim();
							if(term in writerSuggestCache) {
								res(writerSuggestCache[term]);
								return;
							}
							$.getJSON(`/sentence/alias/search/${term}`, function(data) {
								writerSuggestCache[term] = data.sort();
								res(data);
							}).fail(() => {
								writerSuggestCache[term] = [];
								res([]);
							})
						}, select: function(_event, ui) {
							const [_all, alias, mid] = ui.item.value.match(/(.+) : (\d+)$/);
							$inputSection.find('.selected-writer').attr('data-mid', mid).text(alias);
							$(this).val('').next('span').show();
							$('#searchSentenceForm').submit()
						}
					})
				}
				break;
			default: break;
		}
		
		$(`.search-input-section.${this.value}`).show().siblings('.search-input-section').hide();
	})
	.on('change', '.search-input-section select', function() {
		$('#searchSentenceForm').submit();
	})
	.on('submit', '#searchSentenceForm', function(e) {
		const command = Object.fromEntries(new FormData(this).entries());
		// 갱신이 아닌 경우 페이지 번호는 1로 고정
		if(!e?.originalEvent?.submitter?.matches('#refreshBtn')) {
			command.page = 1;
		}
		e.preventDefault();
		const $inputSection = $(this).find(`.search-input-section.${command.searchType}`);
		switch(command.searchType) {
			case 'metaStatus': {
				command.keyword = $inputSection.find('select').val();
				break;
			}
			case 'senlength': case 'searchCount': case 'fscore': {
				command.keyword = Array.from($inputSection.find('input').get(), input => input.value).join('~');
				break;
			}
			case 'regDate': {
				command.fromDate = $inputSection.find('input:eq(0)').val();
				command.toDate = $inputSection.find('input:eq(1)').val();
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
		$.getJSON(this.action, command, (sentenceList) => displaySentenceList(sentenceList, 'searchSentenceForm'))
		.fail(() => alertModal('센텐스 검색 오류 발생'));
	})
	$('#searchTypeSelect').trigger('change');
	
	/**
	 * 목록 헤더 컬럼 정렬 기능 처리
	 */
	$(document).on('click','.thlink[data-value]', function() {
		const sortName = this.dataset.value;
		const searchFormId = sentenceListContainer.dataset.searchForm;
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
		const searchFormId = sentencePaginationContainer.dataset.searchForm;
		$(`#${searchFormId} #page`).val(parseInt(this.dataset.pagenum));
		$(`#${searchFormId}`).submit();
	})
	
	// 새 센텐스목록 조회(ajax)
	$('#pageForm').on('submit', function(e) {
		e.preventDefault();
		$.ajax({
			url: '/adminxyz/sentence/page',
			data: $(this).serialize(),
			success: function(page) {
				displaySentenceList(page, 'pageForm');
			}, 
			error: function() {
				aler('센텐스 목록 조회에 실패했습니다.');
			} 
		});
	})
	// 센텐스 상세보기
	$(document).on('click', '.js-open-detail', function() {
		const sentenceId = this.dataset.sentenceId;
		const eng = this.textContent
		
		const thisRow = this.closest('tr');
		const $detailSection = $('#sentenceDetailSection');
		if($detailSection.is('.show') && $detailSection.is($(thisRow).next())) {
			$detailSection.collapse('hide');
			return;
		}
		$(thisRow).addClass('active').siblings('tr').removeClass('active');
		
		if($detailSection.is('.show')) {
			$detailSection[0].scrollIntoView({ behavior: 'instant', block: 'nearest'})
		}
		$(thisRow).after($detailSection.collapse('show'));
		
		$('#editSentence').prop('disabled', true);
		
		$detailSection.find('.tab-pane').removeClass('loading loaded');
		if($(this).data('sentenceInfo')) {
			displaySentenceInfo($(this).data('sentenceInfo'));
		}else {
			$.getJSON(`/adminxyz/sentence/svoc/search/${sentenceId}`, sentenceAnswerInfo => {
				displaySentenceInfo(Object.assign(sentenceAnswerInfo, {gramMeta: $(thisRow).find('.data-grammeta')[0].dataset.gramMeta}));
				$(this).data('sentenceInfo', sentenceAnswerInfo);
			}).fail(() => alert('해설 상세정보를 조회하지 못했습니다.'));
		}
		
		
		
		function displaySentenceInfo(sentenceInfo) {
			const $detailSection = $('#sentenceDetailSection');
			$detailSection[0].dataset.sentenceId = sentenceId;
			
			// 구문분석 정보
			if(sentenceInfo.svocList?.length) {
				const svocTag = sentenceInfo.svocList[0];
				if(svocTag.memberId != memberId) {
					$detailSection.find('.js-del-svoc').hide();
				}
				// 구문분석 파싱하여 표시
				tandem.showSemanticAnalysis(eng, svocTag.svocBytes, $detailSection.find('.svoc-block').empty())
				.then(result => {
					$(result).data('svocId', svocTag.svocId)
						.data('memberId', svocTag.memberId);
					// 분석 작성자 표시
					$detailSection.find('.writer-section .personacon-alias').text(svocTag.writerAlias);
					if(svocTag.image) {
						const profile = $detailSection.find('.writer-section .personacon-profile')
											.removeClass('profile-default')[0];
						profile.style.background = `url(/resource/profile/images/${svocTag.image}) center/cover no-repeat`;
					}else {
						const profile = $detailSection.find('.writer-section .personacon-profile').addClass('profile-default')[0];
						profile.style.background = 'var(--fc-logo-head) center/cover no-repeat';
					}
				})
			}
			// 해석 정보
			$detailSection.find('.kor-info').empty().append(createElement(Array.from(sentenceInfo.korList, kor => {
				return { el: 'div', textContent: kor.kor };
			})));
			// GramMeta 정보
			$detailSection.find('.gram-info :text').val(sentenceInfo.gramMeta);
			// useful 정보
			$detailSection.find('.useful-info :radio[name="useful"]').filter(function() {
				if(this.value == $(thisRow).find('.data-useful')[0].dataset.useful)
					this.checked = true;
			});
			// 단어 목록 정보(탭 목록 첫번째)
			const $wordList = $detailSection.find('#nav-wordlist').empty();
			const $wordUnitTemplate = $(WORKBOOK_ELEMENTS).find('.one-word-unit-section');
			if(!sentenceInfo.wordList?.length) {
				$wordList.append($wordUnitTemplate.find('.empty-list').clone());
			}
			sentenceInfo.wordList?.forEach((word, i) => {
				const $wordUnit = $wordUnitTemplate.clone(false).empty();
				
				const $title = $wordUnitTemplate.find('.title').clone(true).text(word.title);
				$wordUnit.append($title);
				
				word?.senseList?.forEach(sense => {
					const $part = $wordUnitTemplate.find('.one-part-unit-section').clone(true);
					$part.find('.part').text(sense.partType);
					$part.find('.meaning').text(sense.meaning);
					$wordUnit.append($part);
				});
				
				$wordList.append($wordUnit);
			});
			// 항상 단어목록(첫번째 탭)을 펼치기
			bootstrap?.Tab?.getOrCreateInstance($detailSection.find('#nav-wordlist-tab')[0])?.show();
			
		}
	})
	// 탭 목록(단어목록, 인덱스핑거 목록, 워크북 목록, 배틀 목록)
	.on('show.bs.tab', '#sentenceDetailSection .nav-link', function(e) {
		const $tabPane = $(this.dataset.bsTarget);
		
		if($tabPane.is('.loaded,.loading')) return;
		
		$tabPane.addClass('loading');
		const sentenceId = $('#sentenceDetailSection')[0].dataset.sentenceId;
		switch($tabPane[0].id.match(/nav-(\w+)/)[1]) {
			case 'wordlist':
				$tabPane.addClass('loaded').removeClass('loading');
				break;
			case 'indexfinger': 
				$tabPane.empty().append($(WORKBOOK_ELEMENTS).find('.loading-icon').clone(true));
				$.getJSON(`/workbook/search/finger/${ntoa(sentenceId)}`, (fingerList) => {
					const $fingerListTemplate = $(WORKBOOK_ELEMENTS).find('.related-list');
					if(fingerList != null && fingerList.length > 0) {
						const fingerListLen = fingerList.length;
						
						for(let j = 0; j < fingerListLen; j++) {
							const finger = fingerList[j], $fingerBlock = $fingerListTemplate.find('.finger-section').clone(true);
							$tabPane.append($fingerBlock);
							$fingerBlock.data('sentenceId', finger.sentenceId)
										.find('.sentence-text').text(finger.eng);
						}
					}else {
						$tabPane.append($fingerListTemplate.find('.empty-list').clone(true));
					}
					$tabPane.removeClass('loading').addClass('loaded')
							.find('.loading-icon').remove();
				}).fail(() => {
					$tabPane.removeClass('loading').addClass('loaded')
							.find('.loading-icon').remove();
					alertModal('인덱스 핑거 조회에 실패했습니다.');
				});
				break;
			case 'sentencenote':
				`/workbook/sentence/note/list/${workbookId}/${sentenceId}/${memberId}`
				break;
			case 'workbook':
				break;
			case 'battle':
				break;
			default: break;
		}
	})
	
	// 문장 상세보기 펼쳐질 때 스크롤 이동
	.on('shown.bs.collapse', '#sentenceDetailSection', function() {
		window.scrollTo(0,document.getElementById('sentenceDetailSection').offsetTop);
	})
	// 인덱스 핑거 상세보기
	.on('click', '.js-finger-detail', async function(e) {
		// 인덱스 핑거의 svoc 수정 버튼 혹은 수정 영역에서는 이벤트 취소
		if(e.target.closest('.edit-svoc,.svoc-mdf-btns') || !e.target.closest('.js-finger-detail')) return;
		const $fingerBlock = $(this);
		const $btn = $fingerBlock.find('.toggle-eye');
		const sentenceId = $fingerBlock.data('sentenceId');
		
		if($btn.is('.loading')) {
			return;
		}else if(!$btn.is('.loaded')) {
			$btn.addClass('loading');
			// 핑거 추가정보 가져오기(ajax)--------------------------------
			await $.getJSON('/workbook/sentence/finger/' + sentenceId, 
					(sentence) => viewFingerDetails(sentence))
			.fail(() => alertModal('해석·분석 가져오기에 실패했습니다.\n다시 접속해 주세요.'))
			//--------------------------------------------------------
		}else {
			$fingerBlock.toggleClass('bg-gray-700').find('.fold-icon')
						.toggleClass('expanded',!$btn.is('.active'));
			$btn.toggleClass('active disabled');
			$fingerBlock.find('.sentence-text, .trans-block, .svoc-section').toggle(300);
		}
		
		// 불러온 구문분석과 해석을 표시.
		async function viewFingerDetails(sentence) {
			$fingerBlock.find('.sentence-text').hide();
			
			await tandem.showSemanticAnalysis(sentence.eng, sentence.svocBytes, $fingerBlock.find('.svoc-section').show().find('.svoc-block'));
			
			$fingerBlock.removeClass('bg-gray-700').find('.trans-block').text(sentence.kor).show();
			$fingerBlock.find('.fold-icon').addClass('expanded');
			$btn.toggleClass('disabled active loading loaded');
		}
	})
	
	// svoc 수정
	.on('click', '.js-edit-svoc', async function() {
		const sentenceType = this.closest('.js-finger-detail') ? 'indexFinger' : 'searchResult';
		// 인덱스 핑거 내에서의 수정일 경우와 문장검색결과를 선택해서 수정하는 경우를 분리하여 sentenceId 획득
		const sentenceId = parseInt($(this).closest('.js-finger-detail').data('sentenceId') || $('.one-sentence-row.active').find('.js-open-detail')[0].dataset.sentenceId);
		const $semantics = $(this).closest('.svoc-section').find('.semantics-result');
		$(this).closest('.svoc-mdf-btns').hide();
		
		// 에디터 열기----------------------------------------------
		$semantics.svoceditor(false, saveFunc, cancelCallback);
		// -------------------------------------------------------
		setTimeout(() => {
			tandem.correctMarkLine($semantics[0])
		}, 500);
		// 편집 저장 실행
		function saveFunc(svocText) {
			const svocId = parseInt($semantics.data('svocId') || 0);
			const svocCommand = {sentenceId, memberId, encSvocText: svocText};
			
			// 본인 작성일 경우 svocId를 추가하여 수정 실행
			if(memberId == parseInt($semantics.data('memberId')) && svocId > 0) {
				svocCommand.svocId = svocId;
			}
			// 편집 저장(ajax)-------------------
			$.ajax({
				url: '/adminxyz/sentence/svoc/edit', 
				type: 'POST', 
				data: JSON.stringify(svocCommand),
				contentType: 'application/json', success: successSave,
				error: cancelCallback
			});
			// --------------------------------
			// gramMeta도 같이 저장(ajax)---------------------------------------
			const gramMeta = window['tandem']?.meta?.saveGramMetaFromDOM(sentenceId, $semantics[0], true, 'adminxyz');
			if(sentenceType == 'searchResult') {
				$('#sentenceDetailSection .gram-info :text').val(gramMeta);
			}
			// --------------------------------------------------------------
		}
		
		// 편집 저장 콜백(svocId 할당. 분석 접기/펼치기 대상 재정의)
		function successSave(newSvocId) {
			$semantics.data('svocId', newSvocId);
			if(memberId) {
				$semantics.data('memberId', memberId);
			}
			// 
			if(sentenceType == 'searchResult'){
				if(alias) {
					$('#sentenceDetailSection .writer-section .alias').text(alias);
				}
				$('#sentenceDetailSection .writer-section .personacon-profile').toggleClass('profile-default',!image)
				.css('backgroundImage', `${!image? 'var(--fc-logo-head)':('url(/resource/profile/images/' + image + ')')} center/cover no-repeat`)
			}
			$semantics.closest('.svoc-section').find('.svoc-mdf-btns').show();
		}
		
		// 편집 취소(분석 조작 버튼 재활성화, 신규 추가폼 삭제)
		function cancelCallback() {
			$semantics.closest('.svoc-section').find('.svoc-mdf-btns').show();
		}
	})
	// gramMeta 수정
	$('#editGramMeta').on('click', function() {
		const gramMetaCell = $('.one-sentence-row.active').find('.data-grammeta')[0];
		const metaCell = $('.one-sentence-row.active').find('.data-metastatus')[0];
		const gramMeta = $(this).closest('.gram-info').find('input').val();
		const sentenceId = parseInt($(this).closest('tr')[0].dataset.sentenceId);
		$.ajax({
			url: '/adminxyz/sentence/grammeta/edit',
			type: 'POST',
			data: JSON.stringify({sentenceId, gramMeta, metaStatus: 'S'}),
			contentType: 'application/json',
			success: () => {
				gramMetaCell.dataset.gramMeta = gramMeta;
				metaCell.textContent = META_LONG['S'];
				alertModal('GramMeta 정보를 수정했습니다.');
			},
			error: () => alertModal('GramMeta 정보 수정에 실패했습니다.')
		});
	});
	// useful 수정
	$('#editUseful').on('click', function() {
		const valueCell = $('.one-sentence-row.active').find('.data-useful')[0];
		const useful = $(':radio[name="useful"]:checked').val() == 'true';
		const sentenceId = parseInt($(this).closest('tr')[0].dataset.sentenceId);
		$.ajax({
			url: '/adminxyz/sentence/useful/edit',
			type: 'POST',
			data: JSON.stringify({sentenceId, useful}),
			contentType: 'application/json',
			success: () => {
				valueCell.dataset.useful = useful;
				alertModal('useful 정보를 수정했습니다.');
			},
			error: () => alertModal('useful 정보 수정에 실패했습니다.')
		});
	});
	
	
	/** 조회된 센텐스을 DOM 목록 생성하여 표시하고 페이지네이션 갱신
	 */
	const META_LONG = {N: 'Not',U: 'Upd',S: 'Suc',F: 'Fail'};
	function displaySentenceList(page, searchFormId) {
		// 센텐스 상세보기는 따로 옮기기
		$('#sentenceDetailContainer').append($('#sentenceDetailSection'));
		
		// 선택한 타이틀을 제외한 나머지의 sortMark를 보이지 않도록 한다.
		$('#sentenceListDiv .sortMark').hide();
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
		sentenceListContainer.dataset.searchForm = searchFormId;
		sentenceListContainer.replaceChildren(createElement(Array.from(page.content, ({eng,senlength,sentenceId,gramMeta,searchCount,metaStatus,useful,fscore,regDate}, i) => {
			return { el: 'tr', class: 'one-sentence-row', children: [
				{ el: 'td', className: 'data-rnum', textContent: page?.totalElements - page?.number * page?.size - i },
				{ el: 'td', className: 'data-sid text-center', textContent: sentenceId },
				{ el: 'td', className: 'data-englength text-center', textContent: senlength || 0 },
				{ el: 'td', className: 'data-eng text-start js-open-detail ps-3 text-truncate', role: 'button', 'data-sentence-id': sentenceId, textContent: eng },
				{ el: 'td', className: 'data-grammeta text-center', 'data-gram-meta': gramMeta, style: {display: 'none'} },
				{ el: 'td', className: 'data-useful text-center', 'data-useful': useful, style: {display: 'none'} },
				{ el: 'td', className: 'data-searchcount text-center', textContent: searchCount || 0 },
				{ el: 'td', className: 'data-fscore ', textContent: fscore || 0 },
				{ el: 'td', className: 'data-metastatus ', textContent: META_LONG[metaStatus] },
				{ el: 'td', className: 'data-regdate text-center', textContent: new Date(regDate).format('yyyy-MM-dd') }
				
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
		sentencePaginationContainer.dataset.searchForm = searchFormId;
		sentencePaginationContainer.replaceChildren(createElement(pageNavs));			
	}

}
