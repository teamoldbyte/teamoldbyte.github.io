/** admin/dictionary/list_vocas.html
 * @author LGM
 */
async function pageinit(initialPage) {
	const STATUS_COLORS = { N : '#62A114', A : '#FFFF00', R : '#1462A1', C : '#808080', D : '#FF0000', P : '#FFA500', W : '#FFFFFF', H : '#A11462' };
	
	const WORKBOOK_ELEMENTS = await $.get('https://static.findsvoc.com/fragment/workbook/element_templates.min.html', jQuery.noop, 'html');
	
	displayOpenVocasPage(initialPage);
	
	$(document).on('click', '.page-link', function() {
		$.getJSON(`/adminxyz/openvocas/list/${this.dataset.pagenum}`, displayOpenVocasPage)
		.fail(() => alertModal('오픈보카 페이지 조회 실패'));
	})
	
	// 오픈보카 상세보기
	$(document).on('click', '.js-open-detail', function() {
		const thisRow = this.closest('tr');
		const $detailSection = $('#wordDetailSection');
		const detailOpened = $detailSection.is('.show');
		let { eng, tokenStart, tokenEnd, wordId } = this.dataset;
		const status = $(this).find('.data-status').text();
		const korList = Array.from(this.querySelectorAll('.data-kor'), span => span.textContent);
		
		// 이미 보고있는 대상일 경우, 상세보기 접기
		if(detailOpened && $detailSection.is($(thisRow).next())) {
			$(thisRow).removeClass('active');
			$detailSection.collapse('hide');
			return;
		}
		// 선택하
		$(thisRow).addClass('active').siblings('tr').removeClass('active');
		
		// 선택한 행 밑으로 상세보기를 끼워넣고 펼치기
		$(thisRow).after($detailSection);
		if(detailOpened) $detailSection[0].scrollIntoView({ behavior: 'instant', block: 'start'})
		else $detailSection.collapse('show');
			
		// 영문
		tokenStart = parseInt(tokenStart);
		tokenEnd = parseInt(tokenEnd);
		$detailSection.find('.eng').html(eng.substring(0,tokenStart).concat('<b>',eng.substring(tokenStart,tokenEnd),'</b>').concat(eng.substring(tokenEnd)))
		
		// 해석
		$detailSection.find('.kor-info').empty().append(createElement(Array.from(korList, kor => {
			return { el: 'div', textContent: kor };
		})));
		
		// 상태
		$detailSection.find('.status-info-block select').val(status);
		
		if($(this).data('wordInfo')) {
			displayWordInfo($(this).data('wordInfo'));
		}else {
			$.getJSON(`/adminxyz/openvocas/word-search/${wordId}`, wordDto => {
				displayWordInfo(wordDto);
				$(this).data('wordInfo', wordDto);
			}).fail(() => alert('단어 정보를 조회하지 못했습니다.'));
		}
		
		
		
		async function displayWordInfo(wordInfo) {
			// 단어 정보
			const $wordUnitSection = $detailSection.find('.one-word-unit-section');
			
			// 타이틀
			$wordUnitSection.find('.word-title').text(wordInfo.title);
			
			// 난이도
			$wordUnitSection.find('.level').text(wordInfo.wordMeta?.wordLevel);
			
			// 뜻
			$wordUnitSection.find('.one-part-unit-section').remove();
			if(!wordInfo.senseList?.length) {
				$wordUnitSection.append($(WORKBOOK_ELEMENTS).find('.word-section .empty-list').clone());
			}else {
				wordInfo.senseList?.forEach((sense, i) => {
					const $part = $(WORKBOOK_ELEMENTS).find('.one-part-unit-section').clone(true);
					$part.find('.part').text(sense.partType);
					$part.find('.meaning').text(sense.meaning);
					$wordUnitSection.append($part);
				});
			}
		}
	})
	
	// 오픈보카 상태 변경
	$('#editStatus').on('click', function() {
		const activeRow = $('.js-open-detail.active')[0];
		const vocasId = parseInt(activeRow.dataset.vocasId);
		const oldState = $(activeRow).find('.data-status').text();
		const newState = $('.status-info-block .form-select').val();
		
		if(oldState != newState) {
			$.ajax({
				url: '/adminxyz/openvocas/status',
				type: 'POST',
				data: {vocasId, oldState, newState},
				success: () => {
					alertModal('상태가 변경되었습니다.');
					$(activeRow).find('.data-status').text(newState).css('backgroundColor', STATUS_COLORS[newState]);
				},
				error: () => {
					alertModal('상태 변경에 실패했습니다.');
				}
			})
		}else alertModal('변경하려는 상태가 이전과 동일합니다.');
	})	
	
	//--------------------------------------------------------------------------
	
	function displayOpenVocasPage(page) {
		const startOffset = page?.totalElements - page?.number * page?.size;
		
		// 신청 단어 상세정보란 떼어내기
		$('#wordDetailSection').collapse('hide').appendTo($('#hiddenDivs'));
		
		// content를 테이블에 표시
		$('#openVocasListDiv tbody').empty()
		.append(Array.from(page.content, (ov, i) => {
			const $row = $('#hiddenDivs tr.js-open-detail').clone();
			
			// vocasId, wordId, eng, tokenStart, tokenEnd, 행 컬러
			Object.assign($row[0].dataset, {
				vocasId: ov.vocasId, wordId: ov.wordId, eng: ov.eng, tokenStart: ov.tokenStart, tokenEnd: ov.tokenEnd
			});
			
			// 번호
			$row.find('.data-rnum').text(startOffset - i);
			
			// 품사
			$row.find('.data-part-type').text(ov.partType);
			
			// 타이틀
			$row.find('.data-title').text(ov.title);
			
			// 토큰
			$row.find('.data-token').text(ov.token);
			
			// 추가의미(선택)
			$row.find('.data-append-meaning').text(ov.appendMeaning);
			
			// 작성자
			$row.find('.data-alias').text(ov.alias);
			
			// 상태
			$row.find('.data-status').text(ov.status).css('backgroundColor', STATUS_COLORS[ov.status]);
			
			// 등록일
			$row.find('.data-regdate').text(new Date(ov.regDate).format('yyyy-MM-dd'));
			
			// 문장해석
			$row.find('.data-kor-list').append(Array.from(ov.korList, kor => {
				const $korBlock = $('#hiddenDivs .data-kor').clone();
				$korBlock.text(kor);
				return $korBlock;
			}))
			
			return $row;
		}))
		
		// 페이지네이션 갱신
		const totalPages = page?.totalPages,
			currPage = page?.number + 1,
			blockLength = 10, 
			currBlock = Math.floor((currPage - 1) / blockLength) + 1,
			startPage = (currBlock - 1) * blockLength + 1,
			endPage = (startPage + blockLength <= totalPages) ? (startPage + blockLength - 1) : totalPages;
		
		const $pagination = $('#accountEventPagination').empty();
		if(startPage > blockLength) {
			const $prevPage = $('#hiddenDivs .page-item').clone();
			
			$prevPage[0].ariaLabel = 'Previous';
			const link = $prevPage.find('.page-link')[0];
			link.ariaHidden = true;
			link.dataset.pagenum = startPage - 1;
			link.innerHTML = '&laquo';
			$pagination.append($prevPage);
		}
		for(let pagenum = startPage; pagenum <= endPage; pagenum++) {
			const $pageItem = $('#hiddenDivs .page-item').clone();
			
			if(pagenum == currPage) $pageItem.addClass('active');
			
			const link = $pageItem.find('.page-link')[0];
			link.dataset.pagenum = pagenum;
			link.textContent = pagenum;
			
			$pagination.append($pageItem);
		}
		if(endPage < totalPages) {
			const $nextPage = $('#hiddenDivs .page-item').clone();
			
			$nextPage[0].ariaLabel = 'Next';
			const link = $nextPage.find('.page-link')[0];
			link.ariaHidden = true;
			link.dataset.pagenum = endPage + 1;
			link.innerHTML = '&raquo';
			$pagination.append($nextPage);
		}		
	}
}
