/** workbook/view_workbook.html
 * @author LGM
 */
function pageinit(workbookId, workbookCover, helloBook, isMyOwn, sampleCount, passageIdList) {
	$(window).on('unload', () => $('#loadingModal').modal('hide'));
	
	// 워크북 소개글이 길 경우 접고 펼치기 버튼 제공
	$(document).on('click', '.text-roll-end .fold-icon', function() {
		const $desc = $(this).closest('.description-section');
		const toExpand = $desc.is('.shrink');
		const newMaxHeight = toExpand ? '100em' : '13.5em';
		if(toExpand) {
			$desc.removeClass('shrink');
		}
		anime({
			targets: $desc[0],
			duration: 500,
			delay: 0,
			maxHeight: newMaxHeight,
			easing: 'linear',
			complete: () => {
				$(this).toggleClass('expanded');
				if(!toExpand) {
					$desc.addClass('shrink');
				}
			}
		});
	})	

	// [지문 레이아웃 정렬]--------------------------------------------
	const $listPassageSection = $('.list-passage-section');
	const $pageScroller = $('.page-scroll');
	$listPassageSection.masonry({
		// options
		itemSelector: '.passage',
		columnWidth: '.passage',
		gutter: 10,
		percentPosition: true,
		horizontalOrder: true,
		// slow transitions
		transitionDuration: '0.8s'
	});

	// [지문 추가 조회]------------------------------------------------------------
	const scrollObserver = new IntersectionObserver((entries) => {
		if (entries[0].isIntersecting) {
			const pageNum = $pageScroller.data('pagenum');
			$.getJSON(`/workbook/passages/${workbookId}?pageNum=${pageNum+1}`, successGetPassages)
				.fail(() => {
					alert('지문 조회에 실패했습니다. 다시 접속해주세요.');
				});
		}
	});
	scrollObserver.observe($pageScroller[0]);
	function successGetPassages(passages) {
		// If there are passages to display, loop through them and create the HTML elements
		if (passages != null && passages.content?.length > 0) {
			for (const passage of passages.content) {
				// Create a new passage element based on a hidden template
				const $passage = $('#hiddenDivs .passage').clone();

				// Set the passage ID
				$passage.attr('data-pid', passage.passageId);

				// Set the passage title
				const title = passage.title || '제목 없음';
				$passage.find('.passage-title')
					.text(title)
					.attr('title', title);
				if(helloBook) {
					const regDate = new Date(passage.regDate);
					$passage.find('.passage-title')
						.text(regDate.format('yyyy-MM-dd(e)'))
						.attr('title', regDate.format('yyyy-MM-dd(e)'));
				}
				$passage.find('.passage-title-section .title-input').val(title);

				// Add the "sample" class if this is the user's own passage and it is a sample
				if (isMyOwn && passage.sample) {
					$passage.addClass('sample');
				}

				// Set the passage text
				const $texts = $passage.find('.passage-text');
				for (const sentence of passage.sentenceList) {
					$texts.append(sentence.eng);
				}

				// Append the passage to the list and trigger the masonry layout
				$listPassageSection.append($passage).masonry('appended', $passage);
			}
			// Update the page number
			if (passages.last) {
				scrollObserver.disconnect();
			} else {
				$pageScroller.data('pagenum', passages.number + 1);
			}
		} else {
			scrollObserver.disconnect();
		}
	}
	
	// [지문 상세보기로 이동]--------------------------------------------------------
	$(document).on('click', '.js-view-passage', function() {
		const passageId = Number(this.closest('.passage').dataset.pid);
		sessionStorage.setItem('workbookCover', workbookCover);
		sessionStorage.setItem('passageIdList', JSON.stringify(passageIdList));
		$('#loadingModal').modal('show');
		location.assign('/workbook/passage/'+ntoa(workbookId)+'/'+ntoa(passageId));	
	});
	if(helloBook) {
	$('.js-add-passage-open').click(function() {
		location.assign('/workbook/mystack/add');
	})
	}
	else {
	$('.js-add-passage-open').click(function() {
		if(passageIdList.length >= 33) {
			$('#passageLimitModal').modal('show');
			return;
		}
		sessionStorage.setItem('workbookCover',this.dataset.cover);
		sessionStorage.setItem('passageIdList', JSON.stringify(passageIdList));
		location.assign(`/workbook/passage/add/${ntoa(workbookId)}?wtitle=${encodeURIComponent($('#title').text())}`);
	});
	
	// [지문 타이틀 수정]-----------------------------------------------------------
	$(document).on('click', '.passage-title', function(e) {
		e.stopPropagation();
		if(isMyOwn)
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
			alert('지문 제목이 수정되었습니다.');
			$(titleSection).removeClass('edit');
			$(titleSection).find('.passage-title').text(passageTitle||'제목 없음').attr('title', passageTitle||'제목 없음').show();
			$(titleSection).find('.title-input,.title-edit-btn-section').hide();
		}, () => alert('지문 제목 수정 중 오류가 발생했습니다.'));
		//-----------------------------------------------
	}).on('click', '.js-cancel-ptitle', function() {
		const titleSection = this.closest('.passage-title-section');
		const $title = $(titleSection).find('.passage-title').show();
		$(titleSection).removeClass('edit');
		$(titleSection).find('.title-input').val($title.text()).hide();
		$(titleSection).find('.title-edit-btn-section').hide();
	})
	
	// [지문 수정 화면으로 이동]-----------------------------------------------------
	.on('click', '.js-edit-passage', function(e) {
		e.stopPropagation();
		const passageId = Number(this.closest('.passage').dataset.pid);
		const passageTitle = this.closest('.passage').querySelector('.passage-title').title;
		
		sessionStorage.setItem('workbookId', workbookId);
		sessionStorage.setItem('workbookCover', workbookCover);
		sessionStorage.setItem('passageIdList', JSON.stringify(passageIdList));		
		sessionStorage.setItem('editingPassageId', passageId);
		location.assign(`/workbook/mybook/edit/passage/${ntoa(passageId)}?ptitle=${encodeURIComponent(passageTitle)}`);
	})
	
	// [지문 삭제]----------------------------------------------------------------
	$(document).on('click', '.js-del-passage', function(e) {
		e.stopPropagation();
		const $passage = $(this.closest('.passage'));
		const passageId = $passage.data('pid');
		const $listSection = $passage.closest('.list-passage-section');
		const sample = $passage.is('.sample');
		if(confirm('이 지문을 삭제하시겠습니까?')) {
			const command = {workbookId: workbookId, passageId};
			// 지문 삭제(ajax)-----------------------------------
			deletePassage(command, successDelete);
			//-------------------------------------------------
		}
		
		function successDelete() {
			alert('지문이 삭제되었습니다.');
			if(sample) sampleCount--;
			$listSection.masonry('remove', $passage).masonry('layout');
		}
	})
	// [샘플 지문으로 등록/해제]-----------------------------------------------------
	.on('click', '.js-toggle-sample', function(e) {
		e.stopPropagation();
		const $passage = $(this.closest('.passage'));
		const passageId = $passage.data('pid');
		const msg = $passage.is('.sample') ? '이 지문을 샘플에서 제외하시겠습니까?'
										: '이 지문을 샘플로 지정하시겠습니까?';
		const sample = !$passage.is('.sample');
		
		if(sample && sampleCount == 6) {
			alert('한 워크북에 지정할 샘플 지문의 최대 갯수는 6개입니다.');
			return;
		}
		
		if(confirm(msg)) {
			const command = {workbookId: workbookId, passageId, sample};
			// 샘플 지정/해제(ajax)----------------------
			editPassageSample(command, successSample);
			//----------------------------------------
		}
		
		function successSample() {
			alert('지문 샘플정보를 변경했습니다.');
			sampleCount += (sample) ? 1 : -1;
			$passage.toggleClass('sample');
		}
	});
	}
	/*
	// [내가 이 워크북에 등록한 질문 목록 조회]------------------------------------------
	$.getJSON('/qnastack/myquestion/workbook/' + workbookId, listQuestions)
	.fail(() => listQuestions([]));
	function listQuestions(questions){
		const $qnaSection = $('.qna-section');
		// 질문이 있으면 목록 표시
		if(questions.length > 0 ) {
			$qnaSection.find('.empty-list').hide();
		}
		const $qnaList = $qnaSection.find('.qna-list').empty();
		for(let i = 0, questionsLen = questions.length; i < questionsLen; i++) {
			const question = questions[i];
							//--------------------------------
			$qnaList.append(createQuestionDOM(question, false));
							//--------------------------------
		}
	}
	*/
/* ------------------------------ Embed functions --------------------------- */

/*
	// 질문 정보를 DOM으로 생성
	function createQuestionDOM(question, isMine) {
		const $question = $('#hiddenDivs .qna-unit').clone();
		const $block = $('<div class="qna-block one-block px-3 py-2 px-lg-4 py-lg-3 row g-0" role="button"></div>');
		// Question 정보 설정
		$question.data('questionId', question.qid)
				 .data('qType', question.qtype)
				 .attr('data-pid', question.passageId)
				 .data('targetId', question.targetId)
				 .data('content', question.content);
		// 질문자 정보
		const questioner = question.questioner; 
		const $personacon = $question.find('.personacon-section');
		$personacon.find('.alias').text(questioner.alias);
		if(questioner.image) {
			const profile = $personacon.find('.personacon-profile')
								.removeClass('profile-default')[0];
			profile.style.background = 'url(/resource/profile/images/'
						+ questioner.image + ') center/cover no-repeat';
		} 
		$question.find('.regdate').text(new Date(question.regDate).toLocaleDateString());
		// 질문 제목
		$question.find('.question-text:eq(0)').text(question.title);
		// 질문 내용
		$question.find('.question-text:eq(1)')
				 .text($('<div></div>').html(question.content).text());
		$question.appendTo($block);
		return $block;
	}	
*/	
}
