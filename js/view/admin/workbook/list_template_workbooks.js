/** /admin/workbook/list_template_workbooks.html
@author LGM
 */
function pageinit() {

	// 선택한 타이틀을 제외한 나머지의 sortMark를 보이지 않도록 한다.
	$('#workbookListDiv .sortMark').hide();
	const $currSortMark = $('.thlink[data-value="' + $('#searchFormHidden_list #sortName').val() + '"]+.sortMark');
	if($currSortMark.length > 0) {
		const $direction = $('#searchFormHidden_list #asc');
		$currSortMark.html($direction.val() == 'false' ? '▼' : '▲').show();
	}
	/**
	 * 목록 헤더 컬럼 정렬 기능 처리
	 */
	$('.thlink[data-value]').click(function() {
		const sortName = this.dataset.value;
		const $hiddenSortName = $('#searchFormHidden_list #sortName');
		const $direction = $('#searchFormHidden_list #asc');
		if(sortName == $hiddenSortName.val()) {
			// 정렬방향을 반대로 변경한다.
			$direction.val($direction.val() == 'true' ? 'false' : 'true');
		}else {
			$hiddenSortName.val(this.dataset.value);
		}
		$('#pageForm').submit();
	});
	
	
	// 페이지 번호를 누르면 해당 페이지로 이동
	$('.page-link').click(function() {
		$('#searchFormHidden_list #page').val(parseInt(this.dataset.pagenum));
		$('#pageForm').submit();
	});
	
	

	
	// 템플릿 상세보기 (상태, 지문 목록)
	$(document).on('click', '.js-open-detail', function() {
		const thisRow = this.closest('tr');
		const $detailSection = $('#templateDetailSection');
		const info = thisRow.dataset;
		if($detailSection.is(':visible') && $detailSection.is($(thisRow).next())) {
			$detailSection.hide(() => $('#templateDetailContainer').append($detailSection));
			return;
		}
		$(thisRow).addClass('active').siblings('tr').removeClass('active');
		
		$.getJSON(`/adminxyz/workbook/template/passages/${info.wid}`, passages => {
			passages.sort((a,b) => a.orderNum - b.orderNum);
			if($detailSection.is(':visible')) {
				$detailSection[0].scrollIntoView({ behavior: 'instant', block: 'nearest'})
			}
			$detailSection.show(() =>  {
				$(thisRow).after($detailSection);
				viewDetailInfo(passages);
			});
		}).fail(() => alertModal('지문 목록 조회 실패'))
		
		
		async function viewDetailInfo(passages) {
			$detailSection.find('.template-status-info [name="status"][value="'+$(thisRow).find('.template-status-data')[0].dataset.type+'"]').prop('checked', true);
			
			$detailSection.find('.template-title-info').text($(thisRow).find('.template-title-data').text());
			$detailSection.find('.template-wid-info').text(info.wid);
			
			const $passageList = $detailSection.find('.list-passage-section').empty();
			for(let i = 0, len = passages?.length; i < len; i++) {
				const $passage = $('#hiddenDivs .passage').clone();
				const passage = passages[i];
				// passageId
				$passage.attr('data-pid', passage.passageId)
				// orderNum
						.attr('data-order-num', passage.orderNum)
				
				// title
				$passage.find('.passage-title').text(passage.title||'제목 없음')
													.attr('title', passage.title||'제목 없음');
				$passage.find('.passage-title-section .title-input').val(passage.title);
				
				$passageList.append($passage)/*.masonry('appended', $passage)*/;
			}
			$passageList.sortable({
				classes: {
					"ui-sortable-helper": "shadow-lg"
				},
				cursor: 'move',
				update: (_event, ui) => {
					if (confirm('문장을 여기로 이동하겠습니까?')) {
						let $prev = ui.item.prev('.passage'),
							$next = ui.item.next('.passage');
						// 다음 문장이 없으면 이전문장의 ordernum + 1000
						if ($next.length == 0) {
							ui.item[0].dataset.orderNum = Number($prev[0].dataset.orderNum) + 1000;
						}
						// 이전 문장이 없으면 다음 문장의 ordernum / 2
						else if ($prev.length == 0) {
							const nextOrder = Number($next[0].dataset.orderNum),
								newOrder = Math.round(nextOrder / 2);
							if (newOrder == nextOrder) {
								alertModal('더이상 이동할 수 없습니다.');
								$passageList.sortable('cancel');
								return;
							}
							else ui.item[0].dataset.orderNum = newOrder;
						}
						// 그 외엔 이전 문장과 다음 문장의 ordernum 사잇값
						else {
							const prevOrder = Number($prev[0].dataset.orderNum),
								nextOrder = Number($next[0].dataset.orderNum),
								newOrder = Math.round((prevOrder + nextOrder) / 2);
							if ([prevOrder, nextOrder].indexOf(newOrder) > -1) {
								alertModal('더이상 이동할 수 없습니다.');
								$passageList.sortable('cancel');
								return;
							}
							else ui.item[0].dataset.orderNum = newOrder;
						}
	
						// 전송 내용 생성.
						const command = { workbookId: parseInt($('#templateDetailSection .template-wid-info').text()),
							passageId: parseInt(ui.item[0].dataset.pid), 
							orderNum: parseInt(ui.item[0].dataset.orderNum)
						};
	
						// 지문 순서 수정(ajax)----------------------
						$.ajax({
							url: '/workbook/passage/order/edit',
							type: 'POST',
							data: JSON.stringify(command),
							contentType: 'application/json',
							success: () => alertModal('지문 순서가 성공적으로 변경되었습니다.'),
							error: () => alertModal('지문 순서 변경이 실패했습니다.', () => {
								$passageList.sortable('cancel');
							})
						})
	
					} else {
						$passageList.sortable('cancel');
					}
				}
			});
		}
	});
	
	// [템플릿 개요편집 이동]-------------------------------------------------------
	$('#editTemplate').on('click', function() {
		const workbookId = parseInt($('#templateDetailSection .template-wid-info').text());
		location.assign(`/workbook/mybook/edit/${ntoa(workbookId)}`);
	})
	
	// [템플릿 상태 변경]
	$('#changeBookType').on('click', function() {
		const workBookType = $('input[name="status"]:checked').val();
		const workBookId = parseInt($('#templateDetailSection .template-wid-info').text());
		$.ajax({
			url: '/workbook/mybook/edit/type', 
			type: 'POST', 
			data: JSON.stringify({workBookId, workBookType: workBookType}),
			contentType: 'application/json', 
			success: () => {
				alertModal('템플릿 상태가 변경되었습니다.');
				$('tr.active .template-status-data').attr('data-type', workBookType).text(workBookType=='e'?'작성중':'다운로드 가능');
			},
			error: () => {
				alertModal('템플릿 상태 변경에 실패했습니다.');
				$('input[name="status"]').filter(s=> s.value == $('tr.active .template-status-data').attr('data-type')).prop('checked', true);
			}
		});
	});
	
	// [지문 목차 등록으로 이동]-----------------------------------------------------
	$('#addPassageTitles').on('click', function() {
		const workbookId = parseInt($('#templateDetailSection .template-wid-info').text().trim());
		const title = encodeURIComponent($('#templateDetailSection .template-title-info').text().trim());
		location.assign(`/adminxyz/template/passagetitle/batch/${ntoa(workbookId)}?wtitle=${title}`);
	})
	
	// [지문 타이틀 수정]-----------------------------------------------------------
	$(document).on('click', '.passage-title', function() {
		$(this).hide().siblings('.title-input,.title-edit-btn-section').show()
		.closest('.passage-title-section').addClass('edit');
	}).on('click','.js-edit-ptitle', function() {
		const titleSection = this.closest('.passage-title-section');
		const passageTitle = $(titleSection).find('.title-input').val().trim();

		const command = {
			passageId: this.closest('.passage').dataset.pid }
		if(passageTitle.length > 0) {
			command['passageTitle'] = passageTitle;
		}
		// (ajax) 지문 타이틀 수정-----------
		editPassageTitle(command, () => {
			alertModal('지문 제목이 수정되었습니다.');
			$(titleSection).removeClass('edit');
			$(titleSection).find('.passage-title').text(passageTitle||'제목 없음').attr('title', passageTitle||'제목 없음').show();
			$(titleSection).find('.title-input,.title-edit-btn-section').hide();
		}, () => alertModal('지문 제목 수정 중 오류가 발생했습니다.'));
		//-----------------------------------------------
	}).on('click', '.js-cancel-ptitle', function() {
		const titleSection = this.closest('.passage-title-section');
		const $title = $(titleSection).find('.passage-title').removeAttr('style');
		$(titleSection).removeClass('edit');
		$(titleSection).find('.title-input').val($title.text()).hide();
		$(titleSection).find('.title-edit-btn-section').hide();
	})	
	
	// [지문 삭제]----------------------------------------------------------------
	$(document).on('click', '.js-del-passage', function() {
		const $passage = $(this.closest('.passage'));
		const passageId = $passage.data('pid');
		if(confirm('이 지문을 삭제하시겠습니까?')) {
			const command = {workbookId: parseInt($('#templateDetailSection .template-wid-info').text()), passageId};
			// 지문 삭제(ajax)-----------------------------------
			deletePassage(command, successDelete);
			//-------------------------------------------------
		}
		
		function successDelete() {
			alertModal('지문이 삭제되었습니다.');
			$passage.remove();
		}
	})	
}
