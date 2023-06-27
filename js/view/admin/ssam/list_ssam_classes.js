/** /admin/ssam/list_ssam_classes.html
@author LGM
 */
async function pageinit() {
	const classPaginationContainer = document.querySelector('#ssamClassPagination');
	const classListContainer = document.querySelector('#classListDiv tbody');
	//displaySentenceList(sentencePage, 'pageForm');
	
	if(!$.fn.autocomplete) {
		document.head.append(createElement(
			{el: 'link', rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/jquery-ui-dist@1.13.1/jquery-ui.min.css'}
		));
		await $.ajax({url: 'https://cdn.jsdelivr.net/npm/jquery-ui-dist@1.13.1/jquery-ui.min.js', dataType: 'script', cache: true});
		
	}
	
	/**
	 * 센텐스 검색
	 */
	/*let sentenceSuggestCache = {}, writerSuggestCache = {};
	$(document)
	.on('show.bs.collapse hide.bs.collapse', '#searchSentenceDiv', function(e) {
		const $btn = $('.searchIcon[data-bs-target="#searchSentenceDiv"]');
		$btn.toggleClass('fa-search-minus fa-search-plus')
	})
	.on('change', '#searchTypeSelect', function() {
		const $inputSection = $(`.search-input-section.${this.value}`);
		const needsSearchBtn = !/metaStatus/.test(this.value);
		const $currentTextInput = $('.search-input-section:visible :text');
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
				if($currentTextInput.length > 0) $inputSection.find('input').val($currentTextInput.val())
				break;
			case 'gramMeta':
				if($currentTextInput.length > 0) $inputSection.find('input').val($currentTextInput.val())
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
				if($currentTextInput.length > 0) $inputSection.find('input').val($currentTextInput.val())
				break;
			default: break;
		}
		$inputSection.show().siblings('.search-input-section').hide();
	})
	// 범위형 입력값은 최소값과 최대값이 동기화돼서 움직이도록(최소값이 변하면 최대값은 무조건 최소값 이상으로.)
	.on('change', '.search-input-section [type="number"],.search-input-section [type="date"]', function() {
		const $inputPairs = $(this).closest('.search-input-section').find('input');
		const isFrom = $inputPairs.index(this) == 0;
		const $pairInput = $inputPairs.eq(1 - $inputPairs.index(this));

		let fromValue = isFrom ? this.value : $pairInput.val();
		let toValue = isFrom ? $pairInput.val() : this.value;
		
		if(this.type == 'number') {
			fromValue = parseInt(fromValue)
			toValue = parseInt(toValue)
		}else {
			fromValue = Date.parse(fromValue);
			toValue = Date.parse(toValue);
		}
		if(fromValue > toValue) {
			$pairInput.val(this.value);
		}
	})
	.on('change', '.search-input-section select', function() {
		$('#searchSentenceForm').submit();
	})
	.on('submit', '#searchSentenceForm', function(e,data) {
		const command = Object.fromEntries(new FormData(this).entries());
		// 페이지 네비게이션도 아니고 갱신이 아닌 경우 페이지 번호는 1로 고정
		if(data != 'pageNav' && !e?.originalEvent?.submitter?.matches('#refreshBtn')) {
			command.page = 1;
		}
		if(e?.originalEvent?.submitter) {
			delete command.sortName;
			delete command.asc;
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
			case 'regDate': case 'updateDate': {
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
	*/
	/**
	 * 목록 헤더 컬럼 정렬 기능 처리
	 */
	$(document).on('click','.thlink[data-value]', function() {
		const sortName = this.dataset.value;
		const searchFormId = classListContainer.dataset.searchForm;
		const $hiddenSortName = $(`#${searchFormId} #sortName`);
		const $direction = $(`#${searchFormId} #asc`);
		if(sortName == $hiddenSortName.val()) {
			// 정렬방향을 반대로 변경한다.
			$direction.val($direction.val() != 'true');
		}else {
			$hiddenSortName.val(this.dataset.value);
		}
		$(`#${searchFormId}`).trigger('submit','sort');
	});
	
	// 페이지 번호를 누르면 해당 페이지로 이동
	$(document).on('click','.page-link', function() {
		const searchFormId = classPaginationContainer.dataset.searchForm;
		$(`#${searchFormId} #page`).val(parseInt(this.dataset.pagenum));
		$(`#${searchFormId}`).trigger('submit','pageNav')
	});
	// 새 센텐스목록 조회(ajax)
	/*$('#pageForm').on('submit', function(e) {
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
	})*/
	// 센텐스 상세보기
	$(document).on('click', '.js-open-detail', function() {
		const thisRow = this.closest('tr');
		const $detailSection = $('#ssamClassDetailSection');
		const info = thisRow.dataset;
		let ssam;
		if($detailSection.is('.show') && $detailSection.is($(thisRow).next())) {
			$detailSection.collapse('hide', () => $('#ssamClassDetailContainer').append($detailSection));
			return;
		}
		$(thisRow).addClass('active').siblings('tr').removeClass('active');
		
		$.getJSON(`/adminxyz/ssam/view/${info.ssamId}`, ssamDto => {
			ssam = ssamDto;
			viewDetailInfo(info)
			if($detailSection.is('.show')) {
				$detailSection[0].scrollIntoView({ behavior: 'instant', block: 'nearest'})
			}
			$(thisRow).after($detailSection.collapse('show'));
		}).fail(() => alertModal('쌤정보 조회 실패'))
		
		
		async function viewDetailInfo() {
			const $detailSection = $('#ssamClassDetailSection');
			$detailSection.find('.class-name-info').text($(thisRow).find('.class-name-data').text());
			$detailSection.find('.class-size-info').text($(thisRow).find('.class-size-data').text());
			$detailSection.find('.class-phone-info').text($(thisRow).find('.class-phone-data').text());
			$detailSection.find('.class-uri-info')
				.text(`${location.origin}/ssam/class/${info.classUri}`)
				.attr('href', `/ssam/class/${info.classUri}`);
			$detailSection.find('.address-info').text($(thisRow).find('.address-data').text());
			$detailSection.find('.postal-code-info').text(info.postalCode);
			$detailSection.find('.reg-date-info').text($(thisRow).find('.reg-date-data').text());
			
			$detailSection.find('.ssam-name-info').text(ssam.name);
			$detailSection.find('.ssam-work-place-info').text(ssam.workPlace);
			if(ssam?.image?.length > 0) {
				$detailSection.find('.ssam-image-info')
				.removeClass('profile-default').css('background', `center / cover url(/resource/profile/images/${ssam.image}) no-repeat`);
			}else {
				$detailSection.find('.ssam-image-info').addClass('profile-default').removeAttr('style');
			}
			
			if(!$('.emblem-image-path-data').is('.profile-default')) {
				$detailSection.find('.emblem-image-path-info').removeClass('logo-default').css('background', $('.emblem-image-path-data').css('background'));
			}else {
				$detailSection.find('.emblem-image-path-info').css('background','').addClass('logo-default');
			}
			
			if(info.bannerImagePath?.length > 0) {
				$detailSection.find('.banner-image-path-info')
					.removeClass('logo-default').css('background', `center / contain url(/resource/ssam/class/${info.bannerImagePath}) no-repeat`);
			}else {
				$detailSection.find('.banner-image-path-info').css('background','').addClass('logo-default');
			}
			$detailSection.find('.class-intro-info').html(info.classIntro);

		}
	})
	
	// 문장 상세보기 펼쳐질 때 스크롤 이동
	.on('shown.bs.collapse', '#ssamClassDetailSection', function() {
		window.scrollTo(0,document.getElementById('ssamClassDetailSection').offsetTop);
	})
	
	
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
				{ el: 'td', className: 'data-useful text-center', 'data-useful': useful??true, style: {display: 'none'} },
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
