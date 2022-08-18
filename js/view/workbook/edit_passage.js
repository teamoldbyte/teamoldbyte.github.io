/** /workbook/edit_passage.html
@author LGM
 */
function pageinit() {
	const passageId = Number(sessionStorage.getItem('editingPassageId')),
		workbookId = Number(sessionStorage.getItem('workbookId'));
		
	// [지문 추가하기로 이동]
	$('#addPassageBtn').click(() =>
		location.assign('/workbook/passage/add/' + ntoa(workbookId))
	);	
	// [지문 상세보기로 이동]
	$('#viewPassageBtn').click(() => 
		location.assign('/workbook/passage/' + ntoa(workbookId) + '/' + ntoa(passageId))
	);
	// [워크북 편집 홈으로 이동]
	$('#editWorkbookBtn').click(() => 
		location.assign('/workbook/mybook/edit/' + ntoa(workbookId))
	);
	
	// [문장 순서 이동]------------------------------------------------------------
	$('.list-sentence-section')
	.sortable({
		axis: 'y',
		items: '>.one-sentence-unit-section',
		handle: '.js-move-sentence',
		classes: {
			"ui-sortable-helper": "shadow-lg"
		},
		cursor: 'move',
		update: (_event, ui) => {
			if(confirm('문장을 여기로 이동하겠습니까?')) {
				let $prev = ui.item.prev('.one-sentence-unit-section'),
					$next = ui.item.next('.one-sentence-unit-section');
				// 다음 문장이 없으면 이전문장의 ordernum + 1000
				if($next.length == 0) {
					ui.item[0].dataset.ordernum = Number($prev[0].dataset.ordernum) + 1000;
				}
				// 이전 문장이 없으면 다음 문장의 ordernum / 2
				else if($prev.length == 0) {
					const nextOrder = Number($next[0].dataset.ordernum),
						newOrder = Math.round(nextOrder / 2);
					if(newOrder == nextOrder) {
						alert('더이상 이동할 수 없습니다.');
						$('.list-sentence-section').sortable('cancel');
						return;
					}
					else ui.item[0].dataset.ordernum = newOrder;
				}
				// 그 외엔 이전 문장과 다음 문장의 ordernum 사잇값
				else {
					const prevOrder = Number($prev[0].dataset.ordernum),
						nextOrder = Number($next[0].dataset.ordernum),
						newOrder = Math.round((prevOrder + nextOrder) / 2);
					if([prevOrder, nextOrder].indexOf(newOrder) > -1) {
						alert('더이상 이동할 수 없습니다.');
						$('.list-sentence-section').sortable('cancel');
						return;
					}
					else ui.item[0].dataset.ordernum = newOrder;
				}
				
				// 전송 내용 생성.
				const command = {sentenceId: Number(ui.item.data('sid')), sameText: true,
								passageId: passageId, eng: ui.item.find('.sentence-text').text(),
								orderNum: Number(ui.item[0].dataset.ordernum)};
				
				// 지문 문장 수정(ajax)----------------------
				editPassageSentece(command, arrangeSentences);
				//----------------------------------------
				
			}else {
				$('.list-sentence-section').sortable('cancel');
			}
		}
	});
	
	// [문장 추가 블록 toggle]-----------------------------------------------------
	$('.js-open-add-sentence').click(function() {
		if(Array.from($('.one-sentence-unit-section .sentence-text').get(), sentence => sentence.textContent).join('').length >= 1500) {
			if(confirm('지문의 크기가 너무 커서 문장을 추가할 수 없습니다.\n새 지문으로 등록하시겠습니까?')) {
				location.assign('/workbook/passage/add/' + ntoa(workbookId));
			}else return;
		}
		$(this).add($('.add-section')).slideToggle(100, () => $('.add-section textarea').focus());
	});
	// [문장 추가 취소]------------------------------------------------------------
	$('.js-cancel-add').click(function() {
		$('.add-section textarea').val('').trigger('input');
		$('.add-section,.js-open-add-sentence').slideToggle(100);
	});
	
	// [문장 수정 블록 toggle]-----------------------------------------------------
	$(document).on('click', '.one-sentence-unit-section [data-toggle="collapse"]', function() {
		$(this.closest('.one-sentence-unit-section')).find('.collapse').collapse('toggle');
	});
	
	// [문장 입력 시 제한사항 적용]---------------------------------------------------
	const maxChars = 500;
	$(document).on('input', '.edit-section textarea,.add-section textarea', function() {
		const $section = $(this.closest('.edit-section,.add-section')),
			$submitBtn = $section.find('.js-edit,.js-add'),
			$invalid = $section.find('.invalid-text');
		let edited = $(this).val().parseToSentences().join(' ').capitalize1st();

		// 길이가 0이거나 영문자 외에 입력값이 있는지 검사
		if(edited.length == 0) {
			$invalid.hide();
			$submitBtn.prop('disabled', true);
		}else if(edited.length == 0 || edited.length > maxChars
		|| edited.match(/[^\u0020-\u007F\u0085\u00A0\u2028\u2029\u2018-\u201A\u201C-\u201D]/gi)) {
			$invalid.show();
			$submitBtn.prop('disabled', true);
			return;
		}
		else if($section.is('.add-section') 
			&& Array.from($('.one-sentence-unit-section .sentence-text').get(), sentence => sentence.textContent).join('').length + edited.length >= 1500
			|| $section.is('.edit-section') 
			&& Array.from($(`.one-sentence-unit-section:not(:eq(${$section.closest('.one-sentence-unit-section').index('.one-sentence-unit-section')})) .sentence-text`).get(), sentence => sentence.textContent).join('').length + edited.length >= 1500) {
			// 기존 지문 총 글자 수와 추가/수정하려는 문장의 글자수 합이 1500자 이상이라면 새 지문 등록으로 이동
			if(confirm('지문의 크기가 너무 커서 문장을 추가할 수 없습니다.\n새 지문으로 등록하시겠습니까?')) {
				location.assign('/workbook/passage/add/' + ntoa(workbookId));
			}else {
				$invalid.show();
				$submitBtn.prop('disabled', true);
			}
		}else {
			$invalid.hide();
			$submitBtn.prop('disabled', false);
		}
	})
	
	// [문장 추가 등록]------------------------------------------------------------
	$('.js-add').click(function() {
		const text = $('.add-section textarea').val().parseToSentences().join(' ').capitalize1st(),
			orderNum = Number($('.one-sentence-unit-section:last')[0].dataset.ordernum) + 1000;
		
		// 전송 내용 생성.
		const command = {sentenceId: 0, passageId: passageId, eng: text, orderNum};
		
		$('#loadingModal').modal('show');
		// 지문 문장 수정(ajax)-----------------------------
		editPassageSentece(command, successAdd, failAdd);
		//-----------------------------------------------
		
		function successAdd(sentences) {
			$('#loadingModal').modal('hide');
			if(sentences.length > 0) {
				let alertMsg = '아래와 같은 ' + sentences.length + '개의 문장이 추가되었습니다.';
				$('.js-cancel-add').trigger('click');
				
				const $sentenceList = $('.list-sentence-section');
				for(let i = 0, len = sentences.length; i < len; i++) {
					const sentenceUnit = sentences[i];
					const $sentenceBlock = $('.one-sentence-unit-section:last').clone();
					$sentenceBlock.find('.sentence-text, textarea')
									.text(sentenceUnit.eng);
					$sentenceBlock[0].dataset.sid = sentenceUnit.sentenceId;
					$sentenceBlock[0].dataset.ordernum = sentenceUnit.orderNum;
					$sentenceList.append($sentenceBlock);
					alertMsg += '\n['+(i+1)+'] ' + sentenceUnit.eng;
				}
				arrangeSentences();
				alert(alertMsg);
			}
		}
		
		function failAdd() {
			alert('등록에 실패했습니다.');
			$('#loadingModal').modal('hide');
		}		
	});
	
	// [문장 수정]----------------------------------------------------------------
	$(document).on('click', '.js-edit', function() {
		const $sentenceSection = $(this.closest('.one-sentence-unit-section'));
		let origin = $sentenceSection.find('.sentence-text').text();
		let edited = $sentenceSection.find('.edit-section textarea').val()
								.parseToSentences().join(' ').capitalize1st();

		// 길이가 0이거나 영문자 외에 입력값이 있는지 검사
		if(edited.length == 0 || edited.length > maxChars
		|| edited.match(/[^(\u0020-\u007F|\u000A|\u000C|\u000D|\u0085|\u00A0|\u2028|\u2029|\u2018-\u201A|\u201C-\u201D)]/gi)) {
			return;
		}
		// 수정 전과 동일하면 취소
		else if(edited == origin) {
			$sentenceSection.find('.collapse').collapse('toggle');
			return;
		}
		// 전송 내용 생성.
		const command = {sentenceId: Number($sentenceSection[0].dataset.sid),
						passageId: passageId, eng: edited, sameText: false,
						orderNum: Number($sentenceSection[0].dataset.ordernum)};
		
		// 기존 문장과 동일한 지 검사
		if(origin.toLowerCase().replace(/\s/g,'')
		== edited.toLowerCase().replace(/\s/g,'')) {
			command['sameTextSeq'] = true;
		}else {
			command['sameTextSeq'] = false;
		}
		
		$('#loadingModal').modal('show');
		// 지문 문장 수정(ajax)-------------------------------
		editPassageSentece(command, successEdit, failEdit);
		//-------------------------------------------------
		
		function successEdit(sentences) {
			$('#loadingModal').modal('hide');
			if(sentences.length > 1) {
				let alertMsg = '문장이 아래와 같이 ' + sentences.length + '개로 나뉘었습니다.';
				$sentenceSection.find('.edit-section').one('hidden.bs.collapse', function() {
					$sentenceSection.hide(function() {
						for(let i = 0, len = sentences.length; i < len; i++) {
							const sentenceUnit = sentences[i];
							const $sentenceBlock = $sentenceSection.clone();
							$sentenceBlock.find('.sentence-text, textarea')
											.text(sentenceUnit.eng);
							$sentenceBlock[0].dataset.sid = sentenceUnit.sentenceId;
							$sentenceBlock[0].dataset.ordernum = sentenceUnit.orderNum;
							$sentenceSection.before($sentenceBlock);
							alertMsg += '\n['+(i+1)+'] ' + sentenceUnit.eng;
						}
						$sentenceSection.remove();
						$('.one-sentence-unit-section').slideDown();
						arrangeSentences();
						alert(alertMsg);
					});
				});
				$sentenceSection.find('.edit-section').collapse('hide');
			}else if(sentences.length == 1) {
				alert('수정되었습니다.');
				$sentenceSection.find('.sentence-text').text(sentences[0].eng);
				$sentenceSection[0].dataset.sid = sentences[0].sentenceId;
				$sentenceSection.find('.edit-section textarea').val(sentences[0].eng);
				$sentenceSection.find('.edit-section').collapse('hide');
			}
		}
		
		function failEdit() {
			alert('수정에 실패했습니다.');
			$('#loadingModal').modal('hide');
		}
	})
	
	// [문장을 지문에서 삭제]--------------------------------------------------------
	.on('click','.js-del-sentence', function() {
		
		if(!confirm('문장을 삭제하시겠습니까?')) return;
		const $sentenceSection = $(this.closest('.one-sentence-unit-section'));
		// 문장 삭제(ajax)------------------------
		delPassageSentence({passageId: passageId,sentenceId: Number($sentenceSection[0].dataset.sid)}, successDel);
		//--------------------------------------
		
		function successDel() {
			alert('문장이 삭제되었습니다.');
			$sentenceSection.slideUp(function(){
				$(this).remove();
				arrangeSentences();
			})
		}
	});
	
	// - - - - - - - - - - - Embeded functions - - - - - - - - - - - - - - - - -
	// 전체 문장을 orderNum을 기준으로 재정렬
	function arrangeSentences() {
		$('.list-sentence-section').html(
			$('.one-sentence-unit-section')
				.sort((a, b) => a.dataset.ordernum - b.dataset.ordernum)
				.each((i, el) => $(el).find('.numbering-text').text(i+1))
		);
	}
}
