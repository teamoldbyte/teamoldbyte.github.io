/** /workbook/view_passage.html
 @author LGM
 */
 async function pageinit(memberId, memberAlias, memberImage, memberRoleType, workbookId, ownerId, priorityId, passageId, sentenceList) {
	const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
	const tts = new FicoTTS({initSuccessCallback: () => {
		// PC에선 자동재생 조작 금지
		if(!devSize.isPhone())
			document.querySelector('#ttsSettings .form-switch').remove();
	}});
	const WORKBOOK_ELEMENTS = await $.get('https://static.findsvoc.com/fragment/workbook/element_templates.min.html', jQuery.noop, 'html'); 
//	const WORKBOOK_ELEMENTS = await $.get('/fragment/workbook/element_templates.html', jQuery.noop, 'html'); 
	
	
	const partTypeMap = {
		'n.':'명사', 'v.':'동사','vt.':'타동사','vi.':'자동사','a.':'형용사','ad.':'부사','prep.':'전치사','conj.':'접속사','int.':'감탄사', 'abbr.': '약어', 'pron.': '대명사',
		'NP.' : '명사구', 'phrasal-v.': '구동사', 'VP.' : '동사구', 'PP.': '전치사구', 'ADP.': '부사구', 'AJP.': '형용사구'
	}
/*

<!-- 분석 평가 모달 영역 -->
<div class="check-modal-section modal fade" tabindex="-1"  id="check-modal">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content border-0">
      <div class="modal-header bg-fc-purple">
        <h5 class="modal-title text-white col-10">평가 감사합니다.</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
      	<p>평가 </p>
      </div>
      <div class="modal-footer justify-content-center">
        <button type="button" class="btn btn-outline-fico" data-bs-dismiss="modal">취소</button>
        <button type="button" class="btn btn-fico status-submit">제출</button>
      </div>
    </div>
  </div>
</div>
	<!-- 질문 블럭. -->
	<div class="qna-unit accordion-item bg-transparent my-auto">
		<!-- 접었을때 보이는 타이틀 목록 -->
		<div class="title-block row g-0 accordion-header pe-lg-3" role="button">
			<div class="accordion-button collapsed bg-transparent text-reset d-block d-lg-flex " data-bs-toggle="collapse">
				<div class="col-auto col-lg-1 my-auto">
		           <span class="q-status btn btn-sm text-middle text-white w-100"></span>
		        </div>
				<div class="col-auto col-lg-9 p-0 ps-lg-3 my-1">
					<span class="question-text fw-bold">질문 제목</span>
					<div class="question-section row g-0">
						<div class="col-11 question text-section">
							<span class="col-12 d-inline-block question-text text-truncate">질문 내용</span>
						</div>
					</div>
				</div>
				
				<!-- 작성자 영역 -->
				<div class="col-12 col-lg-2 row g-0 float-end personacon-section my-auto position-relative">
					<div class="col-auto mx-auto">
						<th:block th:replace="~{/incl/user_personacon::user_md}" class="mx-auto"></th:block>
					</div>
					
					<div class="personacon-info col-9 col-xl-8 col-md-7 float-end my-auto">
						<div class="personacon-alias alias text-truncate text-start">작성자명</div>
						<span class="regdate">최종 수정일</span>
						<!-- <span class="-icon material-icons-outlined position-absolute">arrow_drop_down</span> -->
					</div>
				</div>
			</div>
		</div>
		
		<!-- 질문의 본문 내용 -->
		<div class="content-block collapse accordion-collapse login-required">
			<!-- 질문을 펼쳤을 때 질문내용 -->
			<div class="accordion-body">
				<div class="question-section mb-3 row g-0 fade">
					<div class="col-2 col-lg-1 personacon-section ">
						<th:block th:replace="~{/incl/user_personacon::user_md}" class="mx-auto"></th:block>
						<div class="personacon-alias alias">질문자명</div>
					</div>
					<div class="col-10 question text-section">
						<div class="question-text d-inline-block mx-2 p-3 rounded-6 bg-white">질문 내용</div>
						<div class="ms-2 mt-1">
							<div class="regdate d-inline-block">0000. 00. 00.</div>
							<div class="qna-mdf-btns d-inline-block border border-2 rounded-3 border-color-bluegray" style="display: none;">
								<button type="button" class="js-edit-question-open login-required d-inline btn btn-sm py-0 pe-0 pt-0"
									data-toggle="tooltip" title="질문 수정">
									<span class="material-icons fs-5 text-bluegray-300">edit</span>
								</button>
								<button type="button" class="js-del-question d-inline btn btn-sm py-0"
									data-toggle="tooltip" title="질문 삭제">
									<span class="material-icons fs-5 text-bluegray-300">delete</span>
								</button>
							</div>
						</div>
					</div>
					<form class="col-10 col-lg-11 edit-section needs-validation" style="display: none;">
						<div class="title-section mt-0 row form-control d-flex">
							<label class="col-form-label p-0" style="width: fit-content;">제목:</label>
							<input type="text" class="q-title col border-0" style="outline: none;" required>
						</div>
						<textarea class="form-control text-input login-required"></textarea>
						<div class="qna-edit-btns btn-group btn-set mt-2">
							<button type="button" class="cancel-edit-question btn btn-sm btn-outline-fico">취소</button>
							<button type="submit" class="js-edit-question btn btn-sm btn-fico">수정</button>
						</div>				
					</form>
				</div>
				<!-- .answer-section 삽입구간 -->
				<div class="answer-list"></div>
				<div class="add-section mt-5"><form class="needs-validation">
					<input type="text" class="form-control text-input login-required border-0"
						placeholder="질문자의 궁금증을 해결할 답변을 추가하고, fico 코인을 획득하세요.">
					<div class="qna-add-btns btn-set text-end mt-3" style="display: none;">
						<button type="button" class="cancel-add-answer-btn btn btn-sm btn-outline-fico">취소</button>
						<button type="button" class="js-add-answer-btn btn btn-sm btn-fico">등록</button>
					</div>
				</form></div>
				<!-- 질문에 대한 설문 조사 -->
				<div class="survey-section row g-0 mt-3" style="display: none;">
					<div class="form-check">
						<label class="form-check-label">
						<input class="form-check-input" type="radio" name="evaluation" value="A"> 
							선택한 답변은 <b class="text-palered">만족</b>하며 문제가 해결되어 질문을 <b class="text-palegreen">종료</b>합니다.</label>
					</div>
					<div class="form-check">
						<label class="form-check-label">
						<input class="form-check-input" type="radio" name="evaluation" value="B"> 
							선택한 답변에 <b class="text-palered">만족</b>하지만 동일 답변자에게 <b class="text-palegreen">추가/보충 질문</b>을 요청합니다.</label>
						
					</div>
					<div class="form-check">
						<label class="form-check-label">
						<input class="form-check-input" type="radio" name="evaluation" value="C"> 
							선택한 답변에 <b class="text-palered">불만족</b>하며 <b class="text-palegreen">다른 피코쌤의 답변</b>을 요청합니다.</label>
					</div>
					<div class="form-check">
						<label class="form-check-label">
						<input class="form-check-input" type="radio" name="evaluation" value="D"> 
							선택한 답변에 <b class="text-palered">불만족</b>한 채로 질문을 <b class="text-palegreen">종료</b>합니다.
						</label>
					</div>
					<div class="answer-survey-btns btn-group">
						<button type="button" class="js-satisfy-cancel btn btn-outline-fico">취소</button>
						<button type="button" class="js-satisfy-btn btn btn-fico">확인</button>
					</div>
				</div>
			</div>
		</div>
	</div>
	<!-- 질문을 펼쳤을 때 답변내용 -->
	<div class="answer-section mb-2">
		<div class="answer-block row g-0">
			<div class="col-10 ms-auto answer text-section text-end">
				<div class="col-auto answer-text text-start d-inline-block mx-2 p-3 rounded-6 bg-white">답변 내용</div>
				<div style="min-height: 2.75rem;">
					<div class="satis-btns btn-group">
						<button type="button" class="js-survey-answer btn btn-sm text-success"
							data-bs-custom-class="text-xs"
							data-toggle="tooltip" title="이 답변으로 질문이 해결됐습니다." value="A">
							<span class="material-icons">verified</span>
						</button>
						<button type="button" class="js-survey-answer btn btn-sm text-primary"
							data-bs-custom-class="text-xs"
							data-toggle="tooltip" title="이 답변을 채택하고, 답변자에게 추가질문을 합니다." value="B">
							<span class="material-icons">add_task</span>
						</button>
						<button type="button" class="js-survey-answer btn btn-sm text-warning"
							data-bs-custom-class="text-xs"
							data-toggle="tooltip" title="이 답변으로 해결되지 않습니다. 다른 답변을 기다립니다." value="C">
							<span class="material-icons">mood_bad</span>
						</button>
						<button type="button" class="js-survey-answer btn btn-sm text-danger"
							data-bs-custom-class="text-xs"
							data-toggle="tooltip" title="이 답변으로 해결되지 않습니다. 질문을 종료합니다." value="D">
							<span class="material-icons">gpp_bad</span>
						</button>
					</div>
					<div class="qna-mdf-btns d-inline">
						<button type="button" class="js-edit-answer-open btn btn-sm py-0 pe-0 pt-0"
							data-toggle="tooltip" title="답변 수정">
							<span class="material-icons fs-5">edit</span>
						</button>
						<button type="button" class="js-del-answer btn btn-sm py-0"
							data-toggle="tooltip" title="답변 삭제">
							<span class="material-icons fs-5">delete</span>
						</button>
					</div>
					<div class="regdate d-none d-md-inline-block">0000. 00. 00.</div>
				</div>
			</div>
			<form class="col-10 edit-section ms-auto" style="display: none;">
				<textarea class="form-control text-input login-required"></textarea>
				<div class="qna-edit-btns btn-group btn-set">
					<button type="button" class="cancel-edit-answer btn btn-sm btn-outline-fico">취소</button>
					<button type="submit" class="js-edit-answer btn btn-sm btn-fico">수정</button>
				</div>				
			</form>
			<div class="col-2 col-lg-1 personacon-section mb-auto">
				<th:block th:replace="~{/incl/user_personacon::user_md}" class="mx-auto"></th:block>
				<div class="personacon-alias alias">답변자명</div>
			</div>
		</div>
	</div>
	<!-- 질문 추가 폼(답변 평가시) -->
	<div class="question-add-form add-section one-block" style="display: none">
		<div class="title-section mt-0 row form-control d-flex">
			<label class="col-form-label p-0" style="width: fit-content;">제목:</label>
			<input type="text" class="q-title col border-0" style="outline: none;" required>
		</div>
		<textarea class="form-control text-input login-required" ></textarea>
		<div class="qna-add-btns btn-group btn-set" style="display: none;">
			<button type="button" class="cancel-add-qna-btn btn btn-sm btn-outline-fico">취소</button>
			<button type="button" class="js-add-question-btn btn btn-sm btn-fico">등록</button>
		</div>
	</div>	
 */	
	// 페이지를 떠나면 떠있는 로딩모달(분석중임을 알리는 모달)을 닫는다.
	$(window).on('unload', () => $('#loadingModal').modal('hide'));
	
	// 현재 페이지에서만 로고에 글래스 효과 추가 
	$('.workbook-menu-section').find('.logo-link-section').addClass('glass-effect');
	
	
	// 모바일이 아니거나 화면회전 기능을 지원하지 않으면 화면회전 버튼 삭제
	if(!/Mobi/.test(navigator?.userAgent) || !screen.orientation ) {
		$('.js-rotate-btn').remove();
	}
	const passageIdList = JSON.parse(sessionStorage.getItem('passageIdList'));
	
	// [워크북 편집, 지문 편집, 지문 추가 화면으로의 이동 버튼 설정]-------------------------
	if(document.referrer.length > 0){
		try {
			const referrerPath = new URL(document.referrer).pathname;
			
			// 지문 등록을 통해 온 경우
			if(referrerPath.includes('/workbook/passage/add')
			|| referrerPath.includes('/workbook/passage/new')) {
				// passageId 추가
				if(!passageIdList.includes(passageId)) {
					passageIdList.push(passageId);
					sessionStorage.setItem('passageIdList', JSON.stringify(passageIdList));
				}
				// 지문 추가에서 왔을 경우 지문 갯수가 제한갯수보다 많으면 지문 추가 버튼 삭제
				// 이외의 모든 수정 관련 버튼 표시
				if(passageIdList.length >= 33) $('#addPassageBtn').remove();
			}else if(referrerPath.includes('/workbook/mybook/edit') || referrerPath.includes('/workbook/passage/sentence/add')) {
				// 워크북 수정, 지문 수정, 지문 문장추가(클래스워크북)에서 왔을 경우 '지문추가'버튼 빼고 표시
				$('#addPassageBtn').remove();
			}
		} catch (error) {
			$('#addPassageBtn').remove();
		}
	}else $('#addPassageBtn').remove();
	

/* ------------------------------- 지문 관련 ---------------------------------- */
	
	if(passageIdList != null) {
		// 이전 지문 버튼 설정----------------------------------------------------------
		if(passageIdList.indexOf(passageId) > 0) {
			const prevId = passageIdList[passageIdList.indexOf(passageId) - 1];
			$('.js-prev-passage').on('click', function(){
				$('#loadingModal').modal('show');
				location.assign('/workbook/passage/' + ntoa(workbookId) + '/' + ntoa(prevId));
			});
		}else {
			$('.js-prev-passage').remove();
		}
		// 다음 지문 버튼 설정
		if(passageIdList.indexOf(passageId) > -1 
		&& passageIdList.indexOf(passageId) < passageIdList.length - 1) {
			const nextId = passageIdList[passageIdList.indexOf(passageId) + 1];
			$('.js-next-passage').on('click', function(){
				$('#loadingModal').modal('show');
				location.assign('/workbook/passage/' + ntoa(workbookId) + '/' + ntoa(nextId));
			});
		}else {
			$('.js-next-passage').remove();
		}
	}else{
		$('.js-prev-passage,.js-next-passage').remove();
	}
	// [지문의 문장 클릭 시 해당 문장의 블럭으로 이동]------------------------------------
	$('.sentence-link').click(function() {
		const $targetSentence = $('#sentence' + this.dataset.sno + ' .origin-sentence-section');
		$targetSentence.trigger('click');
	});
	// [지문 타이틀 수정]-----------------------------------------------------------
	$('.passage-title-block').on('click', '.display-block', function() {
		if($(this).siblings('.edit-block').length > 0) {
			const isShown = $(this).is('.show');
			$('.passage-title-block .edit-block').collapse(isShown?'show':'hide');
			$('.passage-title-block .display-block').collapse(isShown?'hide':'show');
			if(isShown) $('.passage-title-block .title-input:visible')[0].focus();
		}
	}).on('click','.js-edit-ptitle', function() {
		const titleSection = this.closest('.passage-title-block');
		const passageTitle = $(titleSection).find('.title-input').val().trim();

		const command = {
			passageId: passageId }
		if(passageTitle.length > 0) {
			command['passageTitle'] = passageTitle;
		}
		// (ajax) 지문 타이틀 수정-----------
		editPassageTitle(command, () => {
			alertModal('지문 제목이 수정되었습니다.');
			$(titleSection).find('.edit-block').collapse('hide');
			// PC,모바일 화면에서 수정사항 동시반영
			$('.passage-title-block .display-block').collapse('show').find('.passage-title-text').text(passageTitle||'제목 없음');
			$('.title-input').val(passageTitle||'');
			
		}, () => alertModal('지문 제목 수정 중 오류가 발생했습니다.'));
		//-----------------------------------------------
	}).on('click', '.js-cancel-ptitle', function() {
		const orgText = $('.passage-title-text').text();
		$('.passage-title-block .edit-block').collapse('hide').find('.title-input').val(orgText);
		$('.passage-title-block .display-block').collapse('show');
	})
	
	// 지문의 노트/질문 토글 설정-----------------------------------------------------
	$('#passageNotes, #passageQnas').on('show.bs.collapse', function(e) {
		if(!$(e.target).is('.qna-section,.note-section')) return;
		$(this).siblings('.collapse').collapse('hide');
		$(this).closest('.passage-comment-section').addClass('bg-fc-light-purple');
	}).on('hide.bs.collapse', function(e){
		if(!$(e.target).is('.qna-section,.note-section')) return;
		// 모두 접히면 테두리 해제
		if($(this).siblings('.collapse.show').length == 0) {
			$(this).closest('.passage-comment-section').removeClass('bg-fc-light-purple');
		}
	});
	// [지문의 노트 목록 가져오기(1회)]-----------------------------------------------------
	$('#passageNotes,#passageNotes_mobile').one('show.bs.collapse', function(){
		const $noteSection = $(this);
		
		if($noteSection.is('.loading')) return;
		
		$noteSection.addClass('loading');
		// 지문노트 새로 가져오기(ajax)---------------------------------------
		$.getJSON(`/workbook/passage/note/list/${workbookId}/${passageId}/${memberId}`, notes => listNotes(notes))
		.fail(() => alertModal('노트 가져오기에 실패했습니다.\n다시 접속해 주세요.'));
		//---------------------------------------------------------------
		
		
		function listNotes(notes){
			const $noteList = $noteSection.find('.note-list').empty();
			if(notes.length > 0) {
				$noteList.siblings('.empty-list').hide();
			}
			for(let i = 0, notesLen = notes.length; i < notesLen; i++) {
				const note = notes[i];
							   //------------------
				const $block = createNoteDOM(note);
							   //------------------
				$block.appendTo($noteList);
			}
			$noteSection.removeClass('loading');
		}
	});
	
	// [지문의 노트 추가]
	$('.js-add-passage-note-btn').click(function() {
		const btn = this;
		const $addSection = $(this).closest('.add-section');
		const $textInput = $addSection.find('.text-input');
		const content = $textInput.val().trim();
		const publicOpen = JSON.parse($addSection.find('.note-open-input').val());
		if(content.length == 0) return;
		
		btn.disabled = true;
		// 지문 노트 추가(ajax)--------------------------------------------------
		$.ajax({
			url: '/workbook/passage/note/add', type: 'POST', contentType: 'application/json',
			data: JSON.stringify({workbookId, passageId, memberId, content, publicOpen}),
			success: appendNote,
			error: (jqxhr) => {
				if(jqxhr.status == 403)
					location.assign('/membership/expired');
				else
					alertModal('노트 등록에 실패했습니다. 페이지 새로고침 후 다시 시도해 주세요.')
			},
			complete: () => btn.disabled = false
		})
		//--------------------------------------------------------------------
		
		function appendNote(note) {
			note['memberInfo'] = {memberId, alias: memberAlias};
			const $noteList = $addSection.closest('.note-section').find('.note-list').show();
			$noteList.each((_,el) => {
						   //-----------------------
				const newNote = createNoteDOM(note);
						   //-----------------------
				$(newNote).appendTo($(el))[0].focus();
			})
			$textInput.val('');
			$addSection.toggle(300, function() {
				$(this).siblings('.empty-list').hide();
				$addSection.closest('.note-section').find('.add-icon').prop('disabled', false);
			});
		}
	});
	
	// [지문의 질문 목록 가져오기(1회)]--------------------------------------------------
	$('#passageQnas').one('show.bs.collapse', function(){
		const $qnaSection = $(this);
		
		if($qnaSection.is('.loading')) return;
		$qnaSection.addClass('loading');
		
		// 지문의 질문 가져오기(ajax)---------------------------------------------
		$.getJSON(['/qnastack/question/workbook/passage', workbookId, passageId].join('/'),
		listQuestions).fail(() => alertModal('질문 가져오기에 실패했습니다.\n다시 접속해 주세요.'));
		//------------------------------------------------------------------
		
		function listQuestions(questions){
			// 질문이 있으면 목록 표시
			if(questions.length > 0 ) {
				$qnaSection.find('.empty-list').hide();
			}
			const $qnaList = $qnaSection.find('.qna-list').empty();
			for(let i = 0, questionsLen = questions.length; i < questionsLen; i++) {
				const question = questions[i];
								  //--------------------------------
				const $question = createQuestionDOM(question, false);
								  //--------------------------------
				$question.find('.accordion-collapse')
					 	.attr('data-bs-parent', '#passageQnas .qna-list');
				$qnaList.append($question);
			}
			$qnaSection.removeClass('loading');
		}
	});
	// [지문의 질문 추가]----------------------------------------------------------
/*	$('.js-add-passage-qna-btn').click(function() {
		const $addSection = $(this).closest('.add-section');
		const $content = $addSection.find('.text-input');
		const title = $addSection.find('.q-title').val().trim();
		const content = $content.val().trim();
		if(content.length == 0) return;
		const command = {
				targetId: passageId, title, content, qtype: 'P',
				workbookId, passageId, questionerId: memberId, priorityId
		}
		
		// 지문 질문 추가(ajax)----------------------------------------------------
		addQuestion('workbook', command, successAddQuestion);
		//----------------------------------------------------------------------
		
		function successAddQuestion(question) {
			const $qnaList = $addSection.closest('.qna-section').find('.qna-list').show();
							  //-------------------------------
			const $question = createQuestionDOM(question, true);
							  //-------------------------------
			$question.find('.accordion-collapse')
				 	.attr('data-bs-parent', '#passageQnas .qna-list');			
			$qnaList.prepend($question);
			$content.val('').summernote('destroy');
			$addSection.hide(300, function() {
				const $noteSection = $addSection.closest('.qna-section');
				$noteSection.find('.add-icon').prop('disabled', false);
				$noteSection.find('.empty-list').hide();
			})
		}		
	});*/
	
/* ------------------------------- 문장 관련 ---------------------------------- */	

	/*if(isMobile) {
		$('.one-sentence-unit-section').addClass('swiper-slide')
		.parent().addClass('swiper-wrapper')
		.parent().addClass('swiper');
	}*/
	// 문장별 요소(해석,분석,단어,핑거) 표시--------------------------------------------
	let $results = $('.result-section');
	let $copySection = $('.one-sentence-unit-section').clone();
	let $transCopyBlock = $copySection.find('.ai-translation-block:eq(0)');
	let $wordCopySection = $copySection.find('.one-word-unit-section:eq(0)');
	let $partCopySection = $copySection.find('.one-part-unit-section:eq(0)');


	const sentenceListLen = sentenceList.length;
	if(sentenceListLen == 0) {
		$('#loadingModal').modal('hide');
	}
	for(let i = 0; i < sentenceListLen; i++){
		const sentence = sentenceList[i];
	//	$results.append(createElement(sentenceViewer.completeSentenceSection(sentence, i)));
		
		
		let $sectionClone;
		if(i > 0) {
			$sectionClone = $copySection.clone();
			$results.append($sectionClone);
		}else {
			$sectionClone = $('.one-sentence-unit-section:eq(0)');
		}
		// 문장 Id 설정
		$sectionClone.data('sentenceId', sentence.sentenceId).attr('id','sentence' + (i+1))
					.data('metaEvaluated', ['S','F'].includes(sentence.metaStatus))
					.find('.origin-sentence-section')
		$sectionClone.on('click', '.origin-sentence-section', function(e) {
				if(e.target.closest('[class*="js-tts"]')) return;
				$sectionClone.children('.collapse').collapse('toggle')
			});	
		/*if(!isMobile) {
			// 접기/펼치기 설정
			$sectionClone.find('.removable-section').addClass('collapse');
			$sectionClone.on('click', '.origin-sentence-section', function(e) {
				if(e.target.closest('[class*="js-tts"]')) return;
				$sectionClone.children('.collapse').collapse('toggle')
			});
		}*/
		
		// 탭 설정
		/*$sectionClone.find('.sentence-ext-section').each(function() {
			const tabType = this.dataset.type;
			this.dataset.bsTarget = '#sentence' + (i+1) + ' .' + tabType + '-section';
			const tabTrigger = new bootstrap.Tab(this);
			const $tabBtn = $(this);
			const $target = $(this.dataset.bsTarget);
			$tabBtn.on('click', e => { 
				e.preventDefault();
				if(!$tabBtn.is('.active')) {
					tabTrigger.show();
				}else{
					$target.collapse('hide');
				}
			}).one('shown.bs.tab', function() {
				// 로딩 표시
				$target.find('.ailoading').prepend(createElement(aiLoadingIconJson));
				setTimeout(() => {
		               // 로딩 제거
		               $target.find('.ailoading').remove();
		               $target.find('.afterload').fadeIn(300);
	            }, 1000);
			}).on('shown.bs.tab', function() {
				$target.collapse('show');
			}).on('hidden.bs.tab', function() {
				$target.removeClass('show');
			});
			$target.on('hidden.bs.collapse', function(e) {
				// collapse 이벤트는 부모까지 전파되므로 자기 자신에게 일어난 이벤트인지 확인.
				if(e.target != $target.get(0)) return;
				$target.removeClass('active');
				$tabBtn.removeClass('active').attr('aria-selected', false).blur();
			})
		});*/
		// 단어/노트/배틀 접고 펼치기
		
		$sectionClone.find('.collapse-btn').each(function() {
			this.dataset.bsTarget = `#sentence${i+1} ${this.dataset.collapseSelector}`;
		})
		
		// 1. 원문 표시--------------------------------------------------------
		$sectionClone.find('.origin-sentence').append($(WORKBOOK_ELEMENTS).children('.origin-sentence-container').clone(true).children())
		.find('.numbering-text').text((i + 1)).next('.sentence-text').text(sentence.text)
			
		// 2. SVOC 표시------------------------------------------------
		const text = sentence.text, svocList = sentence.svocList,
			svocListLen = svocList?.length;
		// 구문분석 접기 버튼 추가. 2개 이상의 분석이 있으면 접기
		$sectionClone.find('.js-collapse-svoc').toggle((svocListLen > 1));

		$sectionClone.find('.result-semantic-section').append($(WORKBOOK_ELEMENTS).children('.svoc-menu-section').clone(true))
					.find('.js-open-dashboard').attr('data-bs-target', `#sentence${i+1} .dashboard-section`);
		
		for(let j = 0; j < svocListLen; j++) {
			let svocTag = svocList[j];
			const $svocBlock = $(WORKBOOK_ELEMENTS).children('.svoc-section').clone(true);
			$svocBlock.appendTo($sectionClone.find('.result-semantic-section'));
			tandem.showSemanticAnalysis(text, svocTag.svocBytes, $svocBlock.find('.svoc-block'))
			.then(div => {
				$(div).data('svocId', svocTag.svocId)
						.data('memberId', svocTag.memberId);
				$svocBlock.find('.writer-section')
						.find('.personacon-alias').text(svocTag.writerAlias);
				$svocBlock.find('.writer-section')
					.attr('data-bs-target', `#sentence${i+1} .dashboard-section`)
				
				let $mdfBtns = $svocBlock.find('.svoc-mdf-btns');
				$mdfBtns.find('[data-seq]').attr('data-seq', div.dataset.seq);
				if(memberId != svocTag.memberId) {
					$mdfBtns.remove();
				}
				const $personacon = $('#hiddenDivs .member-personacon').clone(true);
				if(svocTag.image) {
					const profile = $personacon.find('.personacon-profile')
										.removeClass('profile-default')[0];
					profile.style.background = 'url(/resource/profile/images/'
								+ svocTag.image + ') center/cover no-repeat';
				}
				$svocBlock.find('.writer-section').prepend($personacon);
				
				if(memberId != null && memberId > 0
				&& window['tandem'] != undefined && tandem['meta'] != undefined
				&& j + 1 == svocListLen && sentence.metaStatus != null && sentence.metaStatus == 'N') {
					// gramMeta 저장(ajax)---------------------------------------
					tandem.meta.saveGramMetaFromDOM(sentence.sentenceId, div, false, 'workbook');
					// ---------------------------------------------------------
				}
				if(j > 0) $(div).closest('.svoc-section').addClass('collapse');
				if(j + 1 == svocListLen && i + 1 == sentenceListLen) {
					$('#loadingModal').modal('hide')
				}
			});
		}
		
		// 3. 분석 평가 표시
		const expression = getMetaStatusExpression(sentence.metaStatus);
		$sectionClone.find('.dashboard-section .meta-status')
			.text(expression.icon)
			.attr('title', expression.msg)
			
		// 4. 해석 표시 
		
		const korList = sentence.korList;
		if(korList != null && korList.length > 0) {
			const korListLen = korList.length,
				// PC면 .sentence-ext-section 안의 블럭을, 모바일이면 그 밖의 블럭을 선택
				$aiTransSection = $sectionClone.find('.ai-translation-section')
					/*.filter((_i,s)=> isMobile ^ (s.closest('.sentence-ext-section') != null))*/.show().empty();
			
			// PC에서 해석 블럭은 접고 펼치기 기능 없음
			/*if(!isMobile)
				$transCopyBlock.removeClass('collapse');*/
				
			for(let j = 0; j < korListLen; j++) {
				const $transBlock = $transCopyBlock.clone();
				const korTrans = korList[j];
				$transBlock.data('korTid', korTrans.korId);
				
				if(korTrans.alias != 'Translator') {
					$transBlock.addClass('user-trans').find('.translator').text(` ${korTrans.alias}`);
				}else {
					$transBlock.addClass('ai-trans');
				}
				$transBlock.find('.translation-text').text(korTrans.kor);
				if(memberId == korTrans.memberId) {
					$transBlock.append($(WORKBOOK_ELEMENTS).find('.trans-mdf-btns').clone(true));
				}
				$aiTransSection.append($transBlock);
			}
			// 모바일에서 각각의 해석 블럭에 접고 펼치기가 적용돼있는데, 기본으로 펼쳐두고 접힐 때는 맨 위에 하나 남기도록

				$aiTransSection.closest('.translation-section').find('.open-kor-btn').addClass('active');
				$aiTransSection.find('.ai-translation-block').collapse('show');
			
		}
		// 5. 단어 표시 
		const wordList = sentence.wordList;
		if(wordList != null && wordList.length > 0) {
			const wordListLen = wordList.length,
//				$wordSection = $sectionClone.find(`${isMobile?'.collapse-section .word-section':'.sentence-ext-section .word-section .one-block'}`).empty();
				$wordSection = $sectionClone.find('.collapse-section .word-section, .sentence-ext-section .word-section .one-block').empty();
			
			for(let j = 0; j < wordListLen; j++) {
				const word = wordList[j], $wordBlock = $wordCopySection.clone();
				
				// wordId, sentenceId, workbookId를 할당(단어모듈용)
				$wordBlock.data({wordId: word.wid, sentenceId: sentence.sentenceId, workbookId, sentenceWordId: word.sentenceWordId});
				
				// 우선 복사 원본의 뜻 부분들을 삭제
				$wordBlock.find('.one-part-unit-section').remove();
				
				// 단어의 품사별 뜻 새로 표시
				$wordBlock.find('.title').text(word.title).attr('data-playing','off').click(function(e){
						e.stopPropagation();
						const on = this.dataset.playing == 'on';
						if(on) {
							stopAllTTS();
						}else {
							stopAllTTS(this);
							this.dataset.playing = 'on';
							this.classList.add('tts-playing','blink-2');
							tts.speakRepeat(word.title, 2, 500, () => {
								this.classList.remove('tts-playing', 'blink-2');
								this.dataset.playing = 'off';
							});
						}
				});
				const senseList = word.senseList;
				if(senseList == null) continue;
				let senseListLen = senseList.length;
				
				for(let k = 0; k < senseListLen; k++) {
					const sense = senseList[k], $partBlock = $partCopySection.clone();
					
					$wordBlock.append($partBlock);
					$partBlock.find('.part').text(sense.partType).attr('title', partTypeMap[sense.partType]);
					$partBlock.find('.meaning').text(sense.meaning);
				}
				$wordSection.append($wordBlock);
			}
			// 데스크탑에서는 단어리스트 미리 표시
			if(!devSize.isPhone())
				$sectionClone.find('.nav-link[data-type="word-list"]').tab('show');
		}
		
	}
	let scrollDirectionPrev = 0;
	let lastScrollTop = $('.view-passage-section')[0].scrollTop;
	const $topMenu = $('.workbook-menu-section');
	$(document).on('scroll', function() {
		const scrollDirectionNow = scrollY > lastScrollTop ? 1 : -1;
		lastScrollTop = scrollY;
		
		if(scrollDirectionPrev == scrollDirectionNow) return;
		if($('#js-mobile-menu .passage-sentence-nav').is('.show')) return;
		scrollDirectionPrev = scrollDirectionNow;

		// 스크롤 내릴 땐 모바일 하단 메뉴 숨기고, 올릴 땐 보이기.
		anime({
			targets: '#js-mobile-menu',
			easing: 'linear',
			duration: 200,
			translateY: scrollDirectionNow > 0 ?'100%' : 0
		})
	});
	let headerIntersectionObserber, slideResizeObserver, swiper;
	
	
	$(window).on('resize', function() {
		// 휴대폰 세로 사이즈가 아닐 경우
		if(!devSize.isPhone()) {
			slideResizeObserver?.disconnect();
			//swiper.slideTo(0, 0)
			swiper?.disable();
			$('.one-sentence-unit-section').removeClass(getSwiperClasses)
				.parent('.result-section').removeClass(getSwiperClasses).attr('style','')
					.parent().removeClass(getSwiperClasses)
		}else {
			$('.one-sentence-unit-section').addClass(function() {
				return ['swiper-slide'].concat($(this).data('swiperClass'));
			}).parent('.result-section').addClass(function() {
					return ['swiper-wrapper'].concat($(this).data('swiperClass'));
				}).parent().addClass(function() {
					return ['swiper'].concat($(this).data('swiperClass'));
				});
			if(swiper) {
				swiper.enable();
				swiper.slides.forEach(slide => slideResizeObserver.observe(slide));
			}else {
				initializeSwiper();
			}
		}
	}).trigger('resize');
	
	function initializeSwiper() {
		swiper = new Swiper('.swiper', {
			breakpoints: {
				576: {
					enabled: false
				}
			},
			autoHeight: true,
			speed: 250,
			navigation: {
				prevEl: '.js-prev-sentence',
				nextEl: '.js-next-sentence'
			},
			pagination: {
				el: '.swiper-pagination',
				clickable: true
			},
			spaceBetween: 30,
			on : {
				afterInit: function(s) {
					headerIntersectionObserber = new IntersectionObserver((entries) => {
						anime({targets: $topMenu.get(0), duration: 150, easing: 'linear', 
							translateY: entries[0].intersectionRatio > 0 ? 0 : '-7rem'});
					}, { rootMargin: `-${7*rem}px 0px ${0*rem}px 0px`});
					headerIntersectionObserber.observe($('.workbook-cover-section').get(0));
					
					slideResizeObserver = new ResizeObserver((entries) => {
						if(entries.find(entry => entry.target == s.slides[s.activeIndex])) {
							s.update();
						}
					});
					s.slides.forEach(slide => slideResizeObserver.observe(slide));
					
					let initialSlide = s.slides[0];
					
					const $firstNote = $(initialSlide).find('.collapse-section .note-section');
					$firstNote.collapse('show');
					collapseNote($firstNote);
					$('.passage-sentence-nav .sentence').eq(this.activeIndex).addClass('active');
					if(devSize.isPhone() && tts.autoEnabled()) {
						if($('#loadingModal').is('.show')) {
							$('#loadingModal').on('hidden.bs.modal', playFirst);
						}else playFirst();
						function playFirst() {
							setTimeout(() => {
								$('.js-tts-play-sentence').trigger('click');
							}, 500);
						}
					}
				},
				slideChange: function() {
					$(this.slides[this.activeIndex]).find('.note-section').collapse('show');
					$('.passage-sentence-nav .sentence').eq(this.activeIndex).addClass('active')
					.siblings('.sentence').removeClass('active');
					
					stopAllTTS();
				},
				slideChangeTransitionEnd: function(s) {
					scrollTo(0, $results[0].offsetTop);
					
					if(!localStorage.getItem('fico-swipe-happened')) 
						localStorage.setItem('fico-swipe-happened', true);
					
					setTimeout(() => {
						$(s.slides[s.activeIndex]).find('.semantics-result:visible').each(function() {
							tandem.correctMarkLine(this);
						})
						if(tts.autoEnabled()) {
							$('.js-tts-play-sentence').trigger('click');
						}
					}, 500);
				}
			}
		})		
	}
	
	function getSwiperClasses(_,name) {
		const swiperClasses = name.match(/swiper[-\w]*/g);
		$(this).data('swiperClass', swiperClasses);
		return swiperClasses;
	}
	$(document)
	// (모바일) 문장 목록에서 문장을 누르면 해당 문장 슬라이드로 이동.
	.on('click', '#js-mobile-menu .sentence-link', function() {
		$('#js-mobile-menu .mobile-menu-section,#js-mobile-menu .passage-sentence-nav').collapse('toggle')
		swiper.slideTo($(this).index())
	})
	// (모바일) 하단 화살표를 눌러 메뉴가 펼쳐지거나 접힐 때 화살표 방향 토글
	.on('show.bs.collapse hide.bs.collapse', '#js-mobile-menu .passage-sentence-nav', function(e) {
		if(e.target != this) return;
		$('#js-mobile-menu .js-toggle-menu').animate(e.type == 'show' ? {rotate: '180deg'} : {rotate: '0deg'});
		$('#js-mobile-menu').css('transform', 'translateY(0)');
		// 현재 슬라이드에 해당하는 문장에 포커스 이동.
		if(e.type == 'show') $('.passage-sentence-nav .sentence.active')[0].scrollIntoView();
	})
	// 
	.on('show.bs.collapse', '.collapse-section .note-section', function() { collapseNote($(this))})
	// (모바일) 단어목록을 누르면 한 줄 공간 남기고 축소
	.on('click', '.word-list-section', function() {
		if(!devSize.isPhone()) return; // 모바일이 아니면 리턴
		const $wordSection = $(this).find('.word-section');
		if(this.matches('.shrink')) {
			$wordSection.animate({ height: `${$wordSection.data('orgHeight')}px` });
			this.classList.remove('shrink');
		}else {
			this.classList.add('shrink');
			if(!$wordSection.data('orgHeight')) $wordSection.data('orgHeight', $wordSection.height());
			$wordSection.animate({ height: '1.5rem' }, 300);
		}
	})
	// 노트를 누르면 한 줄 공간 남기고 축소
	.on('click', '.note-list .note-text', function() {
		if(!devSize.isPhone()) return; // 모바일이 아니면 리턴
		if(this.matches('.shrink')) {
			$(this).animate({ height: `${$(this).data('orgHeight')}px` });
			this.classList.remove('shrink');
		}else {
			this.classList.add('shrink');
			if(!$(this).data('orgHeight')) $(this).data('orgHeight', $(this).height());
			$(this).animate({ height: '1.5rem' }, 300);
		}
	});
	
	function collapseNote($noteSection) {
		const $sentenceSection = $noteSection.closest('.one-sentence-unit-section'); 
		const sentenceId = $sentenceSection.data('sentenceId');
		
		
		if($noteSection.is('.loading,.loaded') || !sentenceId) return;
		$noteSection.addClass('loading')
				.find('.empty-list').show();
		// 문장의 노트 새로 가져오기(ajax)-------------------------------------
		$.getJSON(`/workbook/sentence/note/list/${workbookId}/${sentenceId}/${memberId}`, notes => listNotes(notes))
		.fail( () => alertModal('노트 가져오기에 실패했습니다.\n다시 접속해 주세요.'));
		//---------------------------------------------------------------
		
		function listNotes(notes){
			// 노트가 있으면 목록 표시
			if(notes.length > 0 ) {
				$noteSection.find('.empty-list').hide();
			}
			const $noteList = $noteSection.find('.note-list').empty();
			for(let i = 0, notesLen = notes.length; i < notesLen; i++) {
				const note = notes[i];
							   //------------------
				const $block = createNoteDOM(note);
							   //------------------
				$block.appendTo($noteList);
			}
			$noteSection.toggleClass('loading loaded');
		}
	}	
	// 모바일용 인터페이스 정의
	if(devSize.isPhone()) {
		const swipeHappened = localStorage.getItem('fico-swipe-happened');
		if(!swipeHappened) {
			$('#loadingModal').on('hidden.bs.modal', function() {
				setTimeout(() => {
					$('.swipe-intro').show();
					setTimeout(() => $('.swipe-intro').remove(), 2000);
				}, 1000);
			})
		}
		//$($results.data('flickity').selectedElement).trigger('select.flickity')//.find('.note-section').collapse('show');
	}
	// [모든 문장 렌더링 완료 - 로딩 이미지 제거]----------------------------------------
	$('#loadingModal').on('hidden.bs.modal', function() {
		$('.full-text').show(() => {
		
			// 검색어(문장)이 있을 경우 해당 문장으로 이동
			const querySen = new URLSearchParams(location.search).get('senQuery')
			if(querySen) {
				if(devSize.isPhone()) {
					const initialSlide = Array.from(swiper.slides).find(slide => {
						return querySen == slide.querySelector('.sentence-text').textContent;
					});
					console.log('slide move')
					swiper.slideTo(swiper.slides.indexOf(initialSlide));
				}else {
					$(Array.from(document.querySelectorAll('.origin-sentence-section')).find(s => {
						return querySen == s.querySelector('.sentence-text').textContent;
					})).trigger('click');
				}
			}
		});
	});
//	setTimeout(() => $('#loadingModal').modal('hide'), 2000);
	$(document)
	// [전체 문장 접고 펼치기]-------------------------------------------------------
	.on('click', '#toggle-all-btn', function() {
		const showOrHide = $(this).find('.fold-icon').is('.expanded')?'hide':'show'
		// 스크롤 방지해놓고 전체 문장 접고 펼치기
		$('.one-sentence-unit-section>.collapse').trigger('prv.scroll').collapse(showOrHide);
		$(this).find('.fold-icon').toggleClass('expanded');
	})
	// [각 문장들 스크롤 방지]
	.on('prv.scroll', '.one-sentence-unit-section>.collapse', function() {
		this.dataset.scroll = 'false';
	})
	// [한 문장단위 접고 펼치기]------------------------------------------------------
	.on('show.bs.collapse hide.bs.collapse','.one-sentence-unit-section>.collapse', function(e) {
		if(e.target != e.currentTarget) return;
		const $unitSection = $(this).closest('.one-sentence-unit-section');
		$unitSection.toggleClass('active', e.type == 'show')
		.find('.origin-sentence-section')
		.attr('aria-expanded', e.type == 'show');
		if(e.type == 'show' && e.target.dataset.scroll != 'false') {
			$unitSection[0].scrollIntoView();
		}
		e.target.dataset.scroll = 'true';
	})
	.on('click', '.js-tts-play-all, .js-tts-play-sentence', function(e) {
		e.stopPropagation();
		const playBtn = this;
		const on = playBtn.dataset.playing == 'on';
		if(on) {
			stopAllTTS();
		}else {
			stopAllTTS(playBtn);
			
			playBtn.dataset.playing = 'on';
			playBtn.textContent = 'stop_circle';
			if(playBtn.matches('.js-tts-play-all')) {
				const links = $('.full-text .sentence-link').get();
				let currLink;
				playAll();
				function playAll() {
					
					if(currLink) currLink.classList.remove('tts-playing', 'blink-2');
					if(playBtn.dataset.playing == 'off') return;
					if(links.length > 0) {
					// tts-util에서 한 번 플레이 후 callback을 null로 초기화 하기 때문에, 그 직후 다시 실행하기 위함. 
						setTimeout(() => {
							currLink = links.shift();
							currLink.classList.add('tts-playing', 'blink-2');
							tts.speak(currLink.textContent, playAll);
						}, 0)
					}else {
						playBtn.dataset.playing = 'off';
						playBtn.textContent = 'play_circle';					
					}
				};
			} else {
				// 모바일일 경우 현재 슬라이드의 문장. 데스크탑일 경우 재생버튼이 속한 문장.
				let textBlock = $(playBtn).closest('.origin-sentence').find('.sentence-text:visible')[0] || swiper.slides[swiper.activeIndex]?.querySelector('.sentence-text');
				if(textBlock) {
					textBlock.classList.add('tts-playing');
					tts.speakRepeat(textBlock.textContent, 2, 500, () => {
						textBlock.classList.remove('tts-playing');
						playBtn.dataset.playing = 'off';
						playBtn.textContent = 'play_circle';
					});
				}
			}
		}
	})
	.on('click', '.js-tts-setting', function(e) {
		e.stopPropagation();
		stopAllTTS();
		tts.openSettings();
	});
	
	function stopAllTTS(except) {
		tts.stop();
		
		document.querySelectorAll('[class*="js-tts-play"][data-playing="on"],.tts-playing').forEach(playBtn => {
			if(except == playBtn) return;
			if(playBtn.matches('[class*="js-tts-play"]')) {
				playBtn.textContent = 'play_circle';
			}else if(playBtn.matches('.tts-playing')) {
				playBtn.classList.remove('tts-playing', 'blink-2');
			}
			playBtn.dataset.playing = 'off';
		})
	}
	$(document).on('shown.bs.collapse', '.one-sentence-unit-section>.collapse', function(e) {
		// 문장/구문분석이 펼쳐지면 구문분석 스타일 새로고침
		if(e.target.matches('.removable-section') && e.target == e.currentTarget) {
			const $sentenceSection = $(this).closest('.one-sentence-unit-section'); 
			const sentenceId = $sentenceSection.data('sentenceId');

			$(e.target).find('.semantics-result').filter(':visible').each(function() {
				tandem.correctMarkLine(this);
			});
			if(!$sentenceSection.data('metaEvaluated')) {
				$(e.target).find('.dashboard-section').collapse('show');
			}
			
			// 노트 최초 1회 조회
			const $noteSection = $sentenceSection.find('.sentence-ext-section .note-section')
			if(!$noteSection.is('.loading,.loaded')) {
				$noteSection.addClass('loading');
				$noteSection.find('.empty-list').show();
				// 문장의 노트 새로 가져오기(ajax)-------------------------------------
				$.getJSON(`/workbook/sentence/note/list/${workbookId}/${sentenceId}/${memberId}`, 
					notes => listNotes(notes)
				)
				.fail( () => alertModal('노트 가져오기에 실패했습니다.\n다시 접속해 주세요.'));
				//---------------------------------------------------------------
				
			}
			
			function listNotes(notes){
				// 노트가 있으면 목록 표시
				if(notes.length > 0 ) {
					$noteSection.find('.empty-list').hide();
				}
				const $noteList = $noteSection.find('.note-list').empty();
				for(let i = 0, notesLen = notes.length; i < notesLen; i++) {
					const note = notes[i];
								   //------------------
					const $block = createNoteDOM(note);
								   //------------------
					$block.appendTo($noteList);
				}
				$noteSection.toggleClass('loading loaded');
			}			
		}
	})
	/** 
	 * 인덱스 핑거리스트는 문장별로 한 번씩 서버를 조회
	 */
	.on('show.bs.collapse', '.related-list', function() {
		if(this.matches('.loaded,.loading')) return;
		let $fingerSection = $(this).addClass('loading position-relative')
		$fingerSection.append('<i class="loading-icon w-auto offset-6 text-center fa-2x fas fa-spin fa-circle-notch text-fc-purple"></i>');
		$fingerSection.find('.empty-list').hide();
		const sentenceId = $(this).closest('.one-sentence-unit-section').data('sentenceId');
		$.getJSON(`/workbook/search/finger/${ntoa(sentenceId)}`, (fingerList) => {
			if(fingerList != null && fingerList.length > 0) {
				$fingerSection.empty();
				const fingerListLen = fingerList.length;
				
				for(let j = 0; j < fingerListLen; j++) {
					const finger = fingerList[j], $fingerBlock = $(WORKBOOK_ELEMENTS).find('.finger-section').clone(true);
					if(!['A','S'].includes(memberRoleType)) {
						$fingerBlock.find('.svoc-mdf-btns').remove();
					}
					$fingerSection.append($fingerBlock);
					$fingerBlock.data('sentenceId', finger.sentenceId)
								.find('.sentence-text').text(finger.eng);
				}
			}else {
				$fingerSection.find('.empty-list').show();
				$fingerSection.find('.loading-icon').remove();
			}
			$(this).removeClass('loading').addClass('loaded');
		}).fail(() => {
			alertModal('인덱스 핑거 조회에 실패했습니다.');
			$fingerSection.find('.empty-list').show();
			$fingerSection.find('.loading-icon').remove();
			$(this).removeClass('loading').addClass('loaded');
		});
	})
	.on('shown.bs.collapse', '.svoc-section', function() {
		tandem.correctMarkLine(this.querySelector('.semantics-result'));
	})
	// 평가 대시보드 펼치기
	$(document).on('show.bs.collapse', '.dashboard-section', function() {
		$(this).prev('.result-semantic-section').addClass('border-bottom-0');
		
		//대시보드의 팁 문구 랜덤 변경
		$(this).find('.tip-content-section').hide(0, function() {
			const sentence = $(this).closest('.one-sentence-unit-section').find('.origin-sentence .sentence-text').text();
			
			$(this).html(tandem?.tip?.showRandomTip(sentence.match(/['"]/)?5:undefined)).fadeIn();
		});
	})
	// 모바일에서 분석평가 대시보드가 열리면 스크롤 이동
	.on('shown.bs.collapse', '.dashboard-section', function() {
		if(devSize.isPhone()) scrollTo(scrollX, $(this).offset().top - visualViewport.height / 2 + this.offsetHeight / 2)
	})
	.on('hidden.bs.collapse', '.dashboard-section', function() {
		$(this).prev('.result-semantic-section').removeClass('border-bottom-0');
	})
	
	// [문장의 번역 영역 펼치고 접기]------------------------------------------------------- 
	/*$(document).on('click', isMobile?'.ai-translation-block':'.open-kor-btn,.ai-translation-block .translation-text', function() {
		const $transSection = $(this).closest(".translation-section");
		const $elements = $transSection.find(".ai-translation-block:not(:first)");
		const $foldBtn = $transSection.find('.open-kor-btn');
		$elements.collapse($foldBtn.is('.active') ? 'hide' : 'show');
		$foldBtn.find('.fold-icon').toggleClass('expanded',!$foldBtn.is('.active')); 
		$foldBtn.toggleClass('active');
	})*/
	
	// [분석 결과 접기/펼치기]-------------------------------------------------------
	$(document).on('click', 'div:not(.edit-svoc)>.semantics-result,.js-collapse-svoc', function(){
		const $sentenceSection = $(this).closest('.one-sentence-unit-section');
		$sentenceSection.find('.result-semantic-section .collapse').collapse('toggle');
		$sentenceSection.find('.js-collapse-svoc').toggleClass('expanded');
	})
	
	// [분석 결과 평가]------------------------------------------------------------
	const checkModalContents = {'S': '<b>평가를 하는 이유</b><br><br>A.I.는 인간의 언어를 이해하면서 분석하지 않습니다.<br>학습자들에게 도움이 될 수 있도록 분석 결과를 평가해주세요.<br>평가도 하고 다양한 fico Egg도 모아보세요.',
								'F': '<b>AI 분석이 정확하지 않은가요?</b><br><br>그건 회원님이 AI보다 실력이 좋다는 증거입니다.<br>직접 수정할 수도 있고 그냥 내버려 둘 수도 있습니다.<br>실력 발휘 기대합니다.'};
	
	// 분석 평가 모달을 띄운 버튼에 따라 모달 속 내용 설정(문장정보, metaStatus)
	$('#check-modal').on('show.bs.modal', function(e) {
		const modalBtn = e.relatedTarget;
		const submitBtn = this.querySelector('.status-submit');
		const metaStatus = modalBtn.dataset.metaStatus;
		submitBtn.dataset.metaStatus = metaStatus;
		this.querySelector('.modal-body').innerHTML = checkModalContents[metaStatus];
		$(submitBtn).data('sentenceSection', $(modalBtn.closest('.one-sentence-unit-section')));
	});	
	// 분석 평가 제출
	$('#check-modal .status-submit').on('click', function() {
		const $sentence = $(this).data('sentenceSection');
		const metaStatus = this.dataset.metaStatus;
		const $statusIcon = $sentence.find('.dashboard-section .meta-status');
		// metaStatus 저장(ajax)-------------------------------------------------
		tandem?.meta?.submitMetaStatus($sentence.data('sentenceId'), metaStatus, 'workbook', () => {
			metaStatusCallback($statusIcon, getMetaStatusExpression(metaStatus));
		});
		// ---------------------------------------------------------------------
		$('#check-modal').modal('hide');
	})
	function metaStatusCallback($statusIcon, resultStatus) {
		let contentChanged = false;
		// 실행했던 버튼은 비활성화
		$statusIcon.closest('.dashboard-section')
			.find('.edit-meta-status-btn[data-meta-status]').each(function() {
				if(!this.disabled) {
					const disabledWrapper = $(this).prop('disabled', true)
						.wrap('<span data-bs-original-title="이미 평가한 문장입니다."></span>')
						.parent()[0];
					new bootstrap.Tooltip(disabledWrapper, {trigger: 'hover focus'}).enable();
					disabledWrapper.querySelector('.material-icons').className = 'material-icons text-gray-400';
				}
			})
		// 평가 완료 문구 표시
		const $completeMsg = $statusIcon.next();
		$completeMsg.popover('show');
		setTimeout(() => $completeMsg.popover('dispose'), 3000);
		// 평가결과 이모티콘 변화
		anime({
			targets: $statusIcon[0],
			rotateX: 360,
			scale: [
				{value: 3, duration: 500, easing: 'easeOutBack'},
				{value: 1, duration: 2500, easing: 'easeInBounce'}
			],
			delay: 300,
			duration: 3000,
			update: function(anim) {
				// 회전하는 도중 바뀐 metaStatus을 아이콘에 적용
				if(!contentChanged && anim.progress > 20) {
					$statusIcon.text(resultStatus.icon).attr({title: resultStatus.msg, dataBsOriginalTitle: resultStatus.msg});
					contentChanged = true;
				}
			},
			complete: function() {
				$statusIcon[0].style.transform = '';
			}
		})
	}
	
	// [분석 결과 추가/편집]--------------------------------------------------------
	const unauthorizedBtns = [];
	$(document).on('click', '.js-add-svoc, .js-edit-svoc', async function() {
		const editorOpenBtn = this;
		let forNew = $(this).is('.js-add-svoc');
		const isIndexFinger = !!this.closest('.js-finger-detail');
		const sentenceId = parseInt(isIndexFinger 
			? $(this).closest('.js-finger-detail').data('sentenceId') 
			: $(this).closest('.one-sentence-unit-section').data('sentenceId'));
		// 화면 내의 다른 '구문분석 추가' 버튼은 비활성화
		$('.js-add-svoc').prop('disabled', true);
		
		const $sentenceSection = $(this).closest('.one-sentence-unit-section');
		let $semantics = null;
		if(forNew && !isIndexFinger) {
			// 분석 추가일 경우 최상위 분석을 복사한 폼을 생성
			let $newSection = $(WORKBOOK_ELEMENTS).children('.svoc-section').clone(true).addClass('new-svoc-form');
			
			$newSection.find('.personacon-alias').text(memberAlias);
			const $personacon = $('#hiddenDivs .member-personacon').clone(true);
			if(memberImage) {
				const profile = $personacon.find('.personacon-profile')
											.removeClass('profile-default')[0];
				profile.style.background = 'url(/resource/profile/images/'
									+ memberImage + ') center/cover no-repeat';
			}
						
			$newSection.find('.writer-section')
						.attr('data-bs-target', $sentenceSection.find('.writer-section').get(0).dataset.bsTarget)
						.prepend($personacon);
			const text = $sentenceSection.find('.origin-sentence .sentence-text').text();
			const svocBytes = await tandem.getSvocBytes($sentenceSection.find('.semantics-result').get(0));
			if(devSize.isPhone()) {
				$sentenceSection.find('.svoc-menu-section').after($newSection);
			}else {
				$sentenceSection.find('.result-semantic-section').prepend($newSection);
			}
			$semantics = $(await tandem.showSemanticAnalysis(text, svocBytes, $newSection.find('.svoc-block')));
			$semantics.data('memberId', memberId);
			$newSection.find('.svoc-mdf-btns').hide().find('[data-seq]')
						.attr('data-seq', $semantics.attr('data-seq'));
		}else {
			// 분석 수정일 경우 현재 분석 폼에 에디터 적용
			//$semantics = $('.semantics-result[data-seq="' + this.dataset.seq + '"]');
			$semantics = $(this).closest('.svoc-section').find('.semantics-result');
			$(this).closest('.svoc-mdf-btns').hide();
		}
		
		// 에디터 열기----------------------------------------------
		$semantics.svoceditor(forNew, saveFunc, cancelCallback);
		// -------------------------------------------------------
		setTimeout(() => {
			tandem.correctMarkLine($semantics[0])
		}, 500);
		// 편집 저장 실행
		function saveFunc(svocText) {
			const svocId = Number($semantics.data('svocId') || 0);
			const svocCommand = {sentenceId, workbookId, passageId, ownerId, memberId, encSvocText: svocText};
			
			if(memberId == Number($semantics.data('memberId')) && svocId > 0) {
				svocCommand.svocId = svocId;
			}
			// 편집 저장(ajax)-------------------
			// tandem.editor.js에서 리턴 받아서 처리
			return editSvoc(svocCommand, successSave, failSave);
			// --------------------------------
		}
		
		// 편집 저장 콜백(신규 분석 표식 해제 및 svocId 할당. 분석 접기/펼치기 대상 재정의)
		function successSave(newSvocId) {
			if(forNew && newSvocId != null) {
				$semantics.closest('.new-svoc-form').removeClass('new-svoc-form');
				$semantics.data('svocId', newSvocId);
				$sentenceSection.find('.js-collapse-svoc').addClass('expanded').show();
				$semantics.closest('.svoc-section').nextAll('.svoc-section').collapse('show');
			}
			$semantics.closest('.svoc-section').find('.svoc-mdf-btns').show();
			_restoreSvocAddBtns();
			// gramMeta도 같이 저장(ajax)---------------------------------------
			window['tandem']?.meta?.saveGramMetaFromDOM(sentenceId, $semantics[0], true, 'workbook');
			if(!isIndexFinger)
				metaStatusCallback($semantics.closest('.one-sentence-unit-section').find('.meta-status'),getMetaStatusExpression('S'));
			// --------------------------------------------------------------
		}
		
		// 저장 실패(편집기 닫고 분석 추가버튼도 비활성화)
		function failSave() {
			unauthorizedBtns.push(editorOpenBtn);
			_restoreSvocAddBtns();
			alertModal('이 문장의 구분분석을\n등록/수정할 권한이 없습니다.\n저장된 분석을 지우고 에디터를 닫습니다.');
		}
		
		// 편집 취소(분석 조작 버튼 재활성화, 신규 추가폼 삭제)
		function cancelCallback() {
			_restoreSvocAddBtns();
			if(forNew) {
				$semantics.closest('.new-svoc-form').remove();
			}else {
				$semantics.closest('.svoc-section').find('.svoc-mdf-btns').show();
			}
		}
		
		// 하나의 편집기를 열면서 비활성화했던 다른 편집열기 버튼들 원상태로
		function _restoreSvocAddBtns() {
			$('.js-add-svoc').each(function() {
				const addSvocBtn = this;
				// 저장 실패했던 버튼들 계속 비활성화
				$(this).prop('disabled', unauthorizedBtns.some(unauthBtn => {
					return (unauthBtn === addSvocBtn);
				}));
			});			
		}
	})
	// [구문분석 삭제]-------------------------------------------------------------
	.on('click', '.js-del-svoc', function() {
		const $result = $('.semantics-result[data-seq="' + this.dataset.seq + '"]');
		const $sentenceSection = $result.closest('.one-sentence-unit-section');
		const svocId = Number($result.data('svocId'));
											// 구문분석 삭제(ajax)-------------
		confirmModal('삭제하시겠습니까?', () => delSvoc(svocId, successDelSvoc));
											//------------------------------
		// 삭제된 분석 화면에서 제거
		function successDelSvoc() {
			$result.closest('.svoc-section').fadeOut(() => {
				$result.closest('.svoc-section').remove();
				// 남은 구문분석이 1개면 접기/펼치기 버튼 숨김
				if($sentenceSection.find('.svoc-section').length < 2) {
					$sentenceSection.find('.js-collapse-svoc').hide();
				}
				// 접기/펼치기 대상 변경
				$sentenceSection.find('.svoc-section').first().removeClass('collapse show');
				$sentenceSection.find('.svoc-section').slice(1).addClass('collapse');
			});
		}
	})
	// 인덱스핑거의 유용성 false로 지정
	.on('click', '.js-set-worthless', function() {
		const sentenceId = $(this).closest('.js-finger-detail').data('sentenceId');
		confirmModal('<div class="text-start row"><span class="col-12 text-center">완전한 문장의 구성으로 충족되지 않습니다.<br>다음과 같은 경우에 해당합니다.</span><div class="mx-auto w-auto d-block"><br>	• 오타가 포함된 문장<br>	• 불완전하게 잘린 문장<br>	• 문장구성이 안되는 문장<br>	• 불완전한 인용구, 구두점오류가 있는 문장<br>	• 기타 비문장</div></div>', () => {
			$.ajax({
				url: '/sentence/useful/edit',
				type: 'POST',
				data: JSON.stringify({sentenceId, useful: false}),
				contentType: 'application/json',
				success: () => {
					this.classList.remove('js-set-worthless', 'text-danger');
					this.classList.add('text-secondary')
					this.title = '유용하지 않은 문장입니다.';
					this.style.pointerEvent = 'none';
					alertModal('useful값을 false로 수정했습니다.');
				},
				error: () => {
					alertModal('useful 정보 수정에 실패했습니다.')
				}
			});
		})
	})
	
	// [프린트 버튼 클릭]------------------------------------------------------
	$(".js-print-button").on('click', function(){
		const workBookTitle = $('.workbook-title-section:eq(0)').text().trim();
		const passageTitle = $('.passage-title-text:eq(0)').text().trim();
		window._printModel = { workBookTitle, passageTitle, memberAlias, sentenceList };
		window.open('/sample/workbook/print_passage.html');

	}); 

	// [그래프 영역 펼치고 접기]------------------------------------------------------
	/* $(".token-tree-section .btn-area").click(function(){
		$(this).closest(".token-tree-section").find(".result-token-tree").toggle();
	}); */
	
	// [나의 해석 수정]------------------------------------------------------------
	const $transEditor = $('#hiddenDivs .trans-editor');
	$(document).on('click', '.js-edit-trans-open', function(){
		$transEditor.hide();
		let $transBlock = $(this).closest('.ai-translation-block');
		// 추가일 경우
		if(this.matches('.add-btn')){
			$(this).hide();
			$transEditor.data('mode','add').find('.text-input').val(null);
			$(this).closest(devSize.isPhone() ? '.translation-section' : '.kor-list-section').find('.ai-translation-section').prepend($transEditor);
		}
		// 수정일 경우
		else {
			$transBlock.find('.trans-mdf-btns, .translation-text').hide();
			$transEditor.data('mode','edit').find('.text-input')
						.val($transBlock.find('.translation-text').text());
			$transBlock.before($transEditor);
		}
		$transEditor.show(300);
		
	}).on('click', '.js-edit-trans', function(){
		const _this = this, $transBlock = $transEditor.next('.ai-translation-block');
		const sentenceId = Number($(this).closest('.one-sentence-unit-section').data('sentenceId')), 
			kor = $transEditor.find('.text-input').val().trim();
		const $transSection = $(_this).closest(devSize.isPhone() ? '.translation-section' : '.kor-list-section');
		let jsonCommand = {sentenceId, memberId, kor};
		// 해석 수정이면 korTid 필요
		if($transEditor.data('mode') == 'edit'
		&& $transBlock.data('korTid') != null) {
			jsonCommand.korTid = Number($transBlock.data('korTid'));
		}
		if(kor.length == 0) return;
		
		_this.disabled = true;
		// 문장 해석 추가/수정(ajax)-------------------------
		$.ajax({
			url: '/workbook/sentence/kor/edit', type: 'POST', contentType: 'application/json',
			data: JSON.stringify(jsonCommand),
			success: successEditTrans,
			error: (jqxhr) => {
				if(jqxhr.status == 403)
					location.assign('/membership/expired');
				else
					alertModal('해석 등록/수정이 실패했습니다.');
			},
			complete: () => _this.disabled = false
		});
		// ----------------------------------------------

		function successEditTrans(tid){
			$transEditor.hide(300, () => $transEditor.appendTo('#hiddenDivs'));
			// 해석 수정이면 해석 내용만 수정해서 표시
			if($transEditor.data('mode') == 'edit'){
				$transBlock.find('.translation-text').text(kor).show(300);
				$transBlock.find('.trans-mdf-btns').show(300);
			}
			// 해석 추가면 새로운 해석 블럭을 생성하여 추가 표시
			else{
				const $newTrans = $transCopyBlock.clone();
				$newTrans.data('korTid', tid).find('.translation-text').text(kor);
				$newTrans.addClass('user-trans');
				$newTrans.find('.translator').text(' ' + memberAlias);
				$newTrans.append($(WORKBOOK_ELEMENTS).find('.trans-mdf-btns').clone(true));
				
				$transSection.find('.ai-translation-section').prepend($newTrans);
				$transSection.find('.add-btn').show(300);
				$newTrans.addClass('show');
				if(devSize.isPhone() && !$transSection.find('.open-kor-btn').is('.active')) {
					$newTrans.siblings('.ai-translation-block').removeClass('show');
				}
			}
		}
	})
	.on('click', '.js-edit-trans-cancel', function(){
		$transEditor.fadeOut(300, () => $transEditor.appendTo('#hiddenDivs'));
		if($transEditor.data('mode') == 'edit') {
			// 수정 대상 해석 텍스트 복구
			const $transBlock = $transEditor.next('.ai-translation-block');
			$transBlock.find('.trans-mdf-btns, .translation-text').show(300);
		}else $transEditor.closest(devSize.isPhone() ? '.translation-section' : '.kor-list-section').find('.add-btn').show(300);
	})
	// [나의 해석 삭제]------------------------------------------------------------
	.on('click', '.js-del-trans', function(e){
		e.stopPropagation();
		e.stopImmediatePropagation();
		const $transBlock = $(this).closest('.ai-translation-block');
										// 문장 해석 삭제(ajax)--------------------
		confirmModal('삭제하겠습니까?', () => delSentenceTrans(Number($transBlock.data('korTid')), successDel));
										// -------------------------------------
		
		function successDel() {
			alertModal('삭제되었습니다.');
			if($transBlock.closest('.translation-section').find('.open-kor-btn').is('.active')) {
				$transBlock.nextAll('.ai-translation-block')?.collapse('show');
			}else $transBlock.next('.ai-translation-block')?.collapse('show');
			$transBlock.fadeOut(300, () => $transBlock.remove());
		}
	})
	
	// [인덱스 핑거 추가정보 열기/닫기]-------------------------------------------------
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
			
			const $semantics = $(await tandem.showSemanticAnalysis(sentence.eng, sentence.svocBytes, $fingerBlock.find('.svoc-section').show().find('.svoc-block')));
			if(!!sentence.svocId) {
				$semantics.data('svocId', sentence.svocId);
			}
			$fingerBlock.removeClass('bg-gray-700').find('.trans-block').text(sentence.kor).show();
			$fingerBlock.find('.fold-icon').addClass('expanded');
			$btn.toggleClass('disabled active loading loaded');
		}
	})
	// [문장의 노트 목록 가져오기(1회)]------------------------------------------------
	/*.on('show.bs.tab', '.one-sentence-unit-section .nav-link[data-type=note]', async function(){

	})*/
	// [문장의 노트 추가]-----------------------------------------------------------
	.on('click', '.js-add-sentence-note-btn', function() {
		const _this = this;
		const $sentenceSection = $(this).closest('.one-sentence-unit-section'); 
		const sentenceId = Number($sentenceSection.data('sentenceId'));
		const $addSection = $(this).closest('.add-section');
		const content = $addSection.find('.text-input').val().trim();
		const noteAccess = $addSection.find('.note-open-input').val();
		if(content.length == 0) return;
		
		_this.disabled = true;
		// 문장 노트 추가(ajax)----------------------------------------------------
		$.ajax({
			url: '/workbook/sentence/note/add', type: 'POST', contentType: 'application/json',
			data: JSON.stringify({workbookId, sentenceId, memberId, content, noteAccess}),
			success: appendNote,
			error: (jqxhr) => {
				if(jqxhr.status == 403)
					location.assign('/membership/expired');
				else
					alertModal('노트 등록에 실패했습니다. 페이지 새로고침 후 다시 시도해 주세요.')
			},
			complete: () => _this.disabled = false
		})
		//----------------------------------------------------------------------
		
		function appendNote(note) {
			note['memberInfo'] = {memberId, alias: memberAlias};
			const $noteList = $sentenceSection.find('.note-section>.note-list');
			$noteList.each((_,el) => {
			 			   //------------------
				$(el).prepend(createNoteDOM(note));
						   //------------------
			})
			$addSection.find('.text-input').val('').summernote('destroy');
			$addSection.hide(300, function() {
				const $noteSection = $addSection.closest('.note-section');
				$noteSection.find('.add-icon').prop('disabled', false);
				$noteSection.find('.empty-list').hide();
			})
		}
	})
	// [문장의 오픈보카 폼]---------------------------------------------------------
	.on('click', '.js-open-voca-form', function() {
		const $sentenceUnit = $(this).closest('.one-sentence-unit-section');
		
		// 대상 문장 텍스트 세팅
		$('#openVocaModal').find('.original-sentence,.original-sentence-background')
		.text($sentenceUnit.find('.origin-sentence .sentence-text').text());
		
		// 1단계를 제외한 모든 단계 닫고, 유형 선택 초기화
		$('#openVocaModal .voca-reg-phase').hide().eq(0).show()
		.find('input[name="vocaTypeCheck"]').prop('checked', false);
		
		// 해석 목록 세팅
		$('#openVocaModal .trans-list').empty().append(createElement({
			el: 'ol', children: Array.from($sentenceUnit.find('.translation-section:eq(0) .ai-translation-block .translation-text'), block => {
			return {
				el: 'li', class: 'translation-text', textContent: block.textContent
			}
		})}));
		
		// 텍스트, 표제어 초기화
		$('#openVocaModal').find('.text-in-sentence,.lemma').val('')
		
		// 등록된 뜻 초기화
		$('#openVocaModal .meaning').html('<p class="p-2">등록하고자 하는 표제어가 기본형이 맞는지 확인 후 OK를 눌러 검색해 주세요.</p>')
		
		// 품사, 추가의미 초기화
		$('#openVocaModal').find('.part-type,.additional-meaning').empty().val('').prop('disabled', true);
		
		// 대상 문장 div 지정 (sentenceId, wordId 따기 위함)
		$('#openVocaModal').data('sentenceUnit', $sentenceUnit).modal('show');
		
		// 등록 버튼 비활성화
		$('#addVoca').prop('disabled', true);
		toggleOpenVocaBtns('addVoca');
	})
	// [오픈보카 유형 선택]---------------------------------------------------------
	.on('change', 'input[name="vocaTypeCheck"]', function() {
		$('#openVocaModal .original-sentence-background').text($('#openVocaModal .original-sentence').text());
		$('#openVocaModal').find('.text-in-sentence,.lemma,.additional-meaning').empty().val('').removeClass('is-valid is-invalid');
		$('#openVocaModal .meaning').html('<p class="p-2">등록하고자 하는 표제어가 기본형이 맞는지 확인 후 OK를 눌러 검색해 주세요.</p>')
		$('#addVoca,#appendVoca,#requestVoca,#changeVoca,.part-type,.additional-meaning').prop('disabled', true);
		if(this.value) {
			$('#openVocaModal .part-type').empty().append(`<option value="${this.value}" selected>${this.value} ${partTypeMap[this.value]}</option>`)
		}else {
			$('#openVocaModal .part-type').empty()
			.append(createElement(Array.from(Object.entries(partTypeMap).slice(0, 11), ([key,value]) => {
				return { el: 'option', value: key, textContent: key + ' ' + value };
			}))).prepend(createElement({
				el: 'option', textContent: '문장에서 쓰인 품사를 목록에서 선택합니다.', selected: true, disabled: true, value: ''
			}));
		}
		$(this).closest('.voca-reg-phase').next('.voca-reg-phase').slideDown();
	})
	// [오픈보카 범위 선택]---------------------------------------------------------
	.on('mousedown', '#openVocaModal .original-sentence', function() {
		$(this).siblings('.original-sentence-background').text(this.textContent);
	});
	// 문장 영역과 문장 배경 영역의 스크롤 동기화
	$('#openVocaModal .original-sentence').on('scroll', function() {
		$('#openVocaModal .original-sentence-background')[0].scrollTop = this.scrollTop;
	});
	$(document)
	.on('mouseup', '#openVocaModal .original-sentence', function() {
		const sel = getSelection();
		const text = this.textContent;
		if(!sel.anchorNode.isSameNode(sel.focusNode)) return;
		if(sel.type == 'Range' && sel.toString().trim().length > 0) {
			
			const position = sel.anchorNode.compareDocumentPosition(sel.focusNode);
			let backwards = false;
			// position == 0 if nodes are the same
			if (!position && sel.anchorOffset > sel.focusOffset || 
			  position === Node.DOCUMENT_POSITION_PRECEDING)
			  backwards = true; 

			if(backwards) {
				sel.setBaseAndExtent(sel.focusNode, sel.focusOffset, sel.anchorNode, sel.anchorOffset);
			}
			let { anchorNode, anchorOffset, focusNode, focusOffset} = sel;
			// 양끝 공백이 있으면 제거합니다.
			while (/^(\s|[.,?!'"])/.test(text.substring(anchorOffset))) {
				anchorOffset++;
			}
			while (/(\s|'s|[.,?!'"])$/.test(text.substring(0, focusOffset))) {
				focusOffset--;
			}
			// 범위 바깥에 단어가 계속된다면 범위 확장
			while(anchorOffset > 0 && /\w/.test(text[anchorOffset - 1])) {
				anchorOffset--;
			}
			while(focusOffset < text.length && /\w/.test(text[focusOffset])) {
				focusOffset++;
			}
			
			sel.setBaseAndExtent(focusNode, focusOffset, anchorNode, anchorOffset);
			
			// '단어'는 공백을 포함하면 안됨.
			if(!$('input[name="vocaTypeCheck"]:checked').val() && sel.toString().includes(' ',1)) {
				alertModal('공백을 포함한 경우는 \'구\'로 등록해 주세요.');
				return;
			}
			
			const offsets = [sel.anchorOffset,sel.focusOffset].sort((a,b) => a - b);
			const $nextPhase = $(this).closest('.voca-reg-phase').next('.voca-reg-phase').slideDown();
			$nextPhase.find('.word-start').val(offsets[0]);
			$nextPhase.find('.word-end').val(offsets[1]);
			$nextPhase.find('.text-in-sentence,.lemma').val(sel.toString().substring(0, 50)).removeClass('is-valid is-invalid');
			$nextPhase.find('.additional-meaning').empty().val('')
			$nextPhase.find('.part-type,.additional-meaning').prop('disabled', true);
			$nextPhase.find('.meaning').html('<p class="p-2">등록하고자 하는 표제어가 기본형이 맞는지 확인 후 OK를 눌러 검색해 주세요.</p>')
			$('#addVoca,#appendVoca,#requestVoca,#changeVoca').prop('disabled', true);
			$nextPhase.find('.lemma').trigger('input').focus();
			
			const backface = $('#openVocaModal .original-sentence-background').get(0).firstChild;
			const backRange = new Range();
			backRange.setStart(backface, offsets[0]);
			backRange.setEnd(backface, offsets[1]);
			backRange.surroundContents($('<span class="bg-info"></span>').get(0))
		}
	})
	.on('input', '#openVocaModal .lemma', function() {
		const text = this.value.trim();
		$(this).toggleClass('is-invalid', text.length == 0 || text.length > 50)
			.toggleClass('is-valid', text.length > 0 && text.length <= 50)
			.siblings('.uppercase-feedback').toggle(this.value.trim().toLowerCase() != this.value.trim());
		$('#openVocaModal .meaning').html('<p class="p-2">등록하고자 하는 표제어가 기본형이 맞는지 확인 후 OK를 눌러 검색해 주세요.</p>');
		$('#openVocaModal .word-id').val(0);
		$('#addVoca,#appendVoca,#requestVoca,#changeVoca').prop('disabled', true);
	})
	.on('click', '#searchVoca', function() {
		if(!$('#openVocaModal .text-in-sentence').val()) {
			alertModal('문장 내에서 어휘를 먼저 드래그해 주세요.');
			return;
		}
		const $lemma = $('#openVocaModal .lemma');
		const text = $lemma.val().trim();
		const vocaType = $('input[name="vocaTypeCheck"]:checked').val();
		const searchPartType = vocaType == 'phrasal-v.' ? 'pv' : 'np';
		if(!text || $lemma.is('.is-invalid')) {
			return;
		}
		$('#openVocaModal .word-id').val(0);
		$.getJSON('/openvocas/search/word', { text, partType: searchPartType }, vocaInfoList => {
			$('#openVocaModal').find('.part-type,.additional-meaning').prop('disabled', false);
			$('#addVoca, #appendVoca,#requestVoca,#changeVoca').prop('disabled', false);
			
			const dbWord = searchPartType == 'pv' ? vocaInfoList.find(voca => voca.title == text)
												: vocaInfoList[0]; // 커맨드에 wordId는 하나만 할당할 수 있으므로 하나만 찾는다. 
			if(dbWord)
				$('#openVocaModal .word-id').val(dbWord.wordId??0);
	
			// 품사목록 재설정
			const legacyTypes = new Set(); // DB에 등록된 품사들
			const partTypes = new Set(vocaType?[vocaType]:[]);
			vocaInfoList?.forEach(vocaInfo => {
				vocaInfo?.meaningList?.forEach(meaning => {
					const searchedPartType = meaning.match(/[^\.]+/)[0]+'.';
					legacyTypes.add(searchedPartType);
					partTypes.add(searchedPartType);
				})
			});
			// '구' 형태들은 위에서 고른 품사와 DB에 등록된 품사들을 차례로 표시
			if(vocaType) {
				$('#openVocaModal .part-type').empty().append(
					createElement(Array.from(partTypes, (val,i) => {
						return { el: 'option', value: val, selected: i == 0, 
						textContent: val + ' ' + partTypeMap[val], style: { background: legacyTypes.has(val) ? 'var(--fc-yellow)' : '' } };
					})));
			}else {
				$('#openVocaModal .part-type option').each((_,el) => {
					if(legacyTypes.has(el.value)) {
						el.style.background = 'var(--fc-yellow)';
						if(legacyTypes.size == 1) el.selected = true;
					}
				})
			}
	
			// 검색결과 단어가 있을 경우
			if(vocaInfoList?.length > 0) {
				const $sentenceUnit = $('#openVocaModal').data('sentenceUnit');
				
				// 구일 경우 각 단어별로 뜻을 뭉쳐서 목록화
				if(vocaType) {
					$('#openVocaModal .meaning').empty()
					.append($('<ul class="list-group list-group-flush"></ul>')
					.append(createElement(Array.from(vocaInfoList, vocaInfo => {
						return { el: 'li', class: 'list-group-item', children: [
							{ el: 'span', class: 'pv-title fw-bold me-5', textContent: vocaInfo.title },
							vocaInfo.meaningList.join(' ')
						]}
					}))));
				}
				// 단어일 경우 바로 여러 줄의 텍스트로 뜻 표시
				else {
					$('#openVocaModal .meaning').empty()
					.append($('<ul class="list-group list-group-flush"></ul>')
					.append(createElement(Array.from(vocaInfoList[0].meaningList, meaning => {
						return { el: 'li', class: 'list-group-item', textContent: meaning }
					}))));
				}
				
				//const $senseTypeSelect = $('#openVocaModal .additional-sense-type');
				// 현재 추가의미 품사목록 select에 있는 품사들
				//const senseTypes = Array.from($senseTypeSelect.find('option').get(), opt => opt.value).filter(stype => stype.length > 0);
				const wordUnit = $sentenceUnit.find('.one-word-unit-section').get().find(unit => {
					return Array.from(vocaInfoList, vocaInfo => vocaInfo.wordId).includes($(unit).data('wordId'));
				});
				
				// 문장의 단어 리스트로 이미 등록된 경우
				if(wordUnit) {
					/*const senseTypesInWordList = Array.from($(wordUnit).find('.part').get(), part => part.textContent);
					$('#openVocaModal .additional-sense-type')
					.append(createElement(Array.from(senseTypesInWordList.filter(p => !senseTypes.includes(p)), (part, i) => {
						return { el: 'option', selected: i == 0, value: part, textContent: partTypeMap[part]};
					})));*/
					$('#appendVoca').prop('disabled', false);
					toggleOpenVocaBtns('appendVoca');
				}
				// 사전으로는 등록됐지만 문장 단어 리스트에 없는 경우
				else {
					/*if(!/\s/.test(text)) {
						// 구가 아닌 단어를 추가할 때 품사는 임의로 선택할 수 있도록
						$('#openVocaModal .additional-sense-type').empty()
						.append(createElement(Array.from(Object.entries(partTypeMap).slice(0, 9), ([key,value]) => {
							return { el: 'option', value: key, textContent: value };
						})));
					}else {
						// 구를 추가할 때에는 이미 등록된 품사들 중에서 선택할 수 있도록
						$('#openVocaModal .additional-sense-type')
						.append(createElement(Array.from(Array.from(vocaInfoList.meaningList, meaning => {
							return meaning.match(/[a-zA-Z-]+\./)[0];
						}).filter(partType => !senseTypes.includes(partType)), (partType,i) => {
							return { el: 'option', selected: i == 0, value: partType, textContent: partTypeMap[partType]}
						})));
					}*/
					$('#addVoca').prop('disabled', false);
					toggleOpenVocaBtns('addVoca');
				}					
			}
			// 사전으로 등록되지 않은 단어
			else {
				if(!vocaType) { // 구가 아닌 단어일 경우, 등록을 막는다.
					$('#openVocaModal .meaning').html('<p class="p-2 text-center">시스템에 등록되지 않은 어휘입니다.<br>등록을 요청할 수 있습니다.</p>')
					$('#openVocaModal .uppercase-feedback').hide();
					$('.part-type,.additional-meaning').prop('disabled', true);
					$('#requestVoca').prop('disabled', false);
					toggleOpenVocaBtns('requestVoca');
				}else {
					$('#openVocaModal .meaning').html('<p class="p-2">시스템에 등록되지 않은 어휘입니다.</p>')
				/*if(!/\s/.test(text)) {
					// 구가 아닌 단어를 추가할 때 품사는 임의로 선택할 수 있도록
					$('#openVocaModal .additional-sense-type').empty()
					.append(createElement(Array.from(Object.entries(partTypeMap).slice(0, 9), ([key,value]) => {
							return { el: 'option', value: key, textContent: value };
						})));
				}*/
					$('#addVoca').prop('disabled', false);
					toggleOpenVocaBtns('addVoca');
				}
			}
		})
	})
	/*.on('change', '#openVocaModal .meaning .form-check-input', function() {
		if(this.checked) {
			$('#openVocaModal .meaning .form-check-input').not(this).prop('checked', false);
			//$('#openVocaModal .lemma').val($(this.labels[0]).find('.pv-title').text());
			$('#openVocaModal .word-id').val(this.value);
		}else {
			$('#openVocaModal .word-id').val(0);
		}
	})*/
	// 품사 선택
	.on('change', '#openVocaModal .part-type', function() {
		const $wordInList = $('#openVocaModal').data('sentenceUnit')
			.find('.one-word-unit-section:visible').filter((_,w) => $(w).data('wordId') == parseInt($('#openVocaModal .word-id').val()||0));
		// 단어목록에 있는 단어일 때 품사를 선택하면
		if($wordInList.length > 0) {
			// vi.와 vt.를 동시에 가지면 사실상 v.임
			let orgPartTypes = new Set(Array.from($wordInList.find('.part').get(), p => p?.textContent));
			if(orgPartTypes.has('vi.') && orgPartTypes.has('vt.')) {
				orgPartTypes.delete('vi.'); orgPartTypes.delete('vt.');
				orgPartTypes.add('v.');
			}
			// 단어목록에 표시된 품사가 아닌 경우 등록 버튼을 '품사 변경'으로 수정
			if(!orgPartTypes.has(this.value)) {
				$('#changeVoca').text($('#openVocaModal .additional-meaning').val().trim().length > 0 ?'품사 변경 및 뜻 추가' : '품사 변경');
				$('#changeVoca').prop('disabled', false);
				toggleOpenVocaBtns('changeVoca');
			}else {
				$('#appendVoca').prop('disabled', false);
				toggleOpenVocaBtns('appendVoca');
			}
		}else {
			$('#addVoca').prop('disabled', false);
			toggleOpenVocaBtns('addVoca');
		}
	})
	.on('input', '#openVocaModal .additional-meaning', function() {
		const $btn = $('#addVoca,#appendVoca,#requestVoca,#changeVoca').filter((_,b) => b.style.zIndex == 0);
		if($btn.is('#changeVoca')) {
			$btn.text(this.value.trim().length > 0 ? '품사 변경 및 뜻 추가' : '품사 변경')
		}
		
		$('#addVoca,#appendVoca').prop('disabled', !this.value.trim().length && !parseInt($('#openVocaModal .word-id').val()));
		$('#changeVoca').prop('disabled', !!this.value.trim().length && !parseInt($('#openVocaModal .word-id').val()));
	})
	
	.on('click', '#addVoca,#appendVoca,#requestVoca,#changeVoca', async function() {
		const _this = this;
		const $sentenceUnit = $('#openVocaModal').data('sentenceUnit');
		const wordId = parseInt($('#openVocaModal .word-id').val()),
		 vocaType = $('input[name="vocaTypeCheck"]:checked').val(),
		 partType = $('#openVocaModal .part-type').val(),
		 appendMeaning = $('#openVocaModal .additional-meaning').val().trim(),
		 sentenceId = $sentenceUnit.data('sentenceId'),
		 title = $('#openVocaModal .lemma').val().trim(),
		 token = $('#openVocaModal .text-in-sentence').val().trim(),
		 start = parseInt($('#openVocaModal .word-start').val()),
		 end = parseInt($('#openVocaModal .word-end').val());
		
		const adding = $(this).is('#addVoca,#requestVoca');
		const requesting = $(this).is('#requestVoca');
		let url = adding ? `/openvocas/new/${vocaType? 'phrase':'word'}`
			: $(this).is('#changeVoca')? '/workbook/sentence/word/change-part'
			: '/openvocas/append/meaning';
		
		// 품사도 선택하지 않고, 추가의미가 입력된 경우
		if(!partType && appendMeaning?.length > 0) {
			alertModal('품사가 선택되지 않은 추가의미가 있습니다.', () => $('#openVocaModal .part-type').focus());
			return;
		}
		
		// 1. '단어' 이외 유형에서 검색된 wordId도 없고 추가의미도 없거나, 
		// 2. '단어' 유형에서 wordId는 있는데 품사 선택을 안했거나,
		// 3. '단어' 유형에서 wordId도 있고 품사도 선택했는데 등록된 품사도 아니고 추가의미도 입력하지 않았을 때
		if((!!vocaType && !wordId && !appendMeaning) 
		|| (!vocaType && wordId && !partType)
		|| (!vocaType && wordId && !!partType && !appendMeaning 
			&& $('#openVocaModal .meaning .list-group-item').filter((_,el) =>  el.textContent.startsWith(partType)).length == 0)) {
			alertModal('등록된 의미들 중 선택을 하거나 추가의미를 입력해 주세요.');
			return;
		}
		let command;
		
		if(_this.id == 'changeVoca') {
			command = { 
				sentenceWordId: $sentenceUnit.find('.one-word-unit-section:visible').filter((_,w) => $(w).data('wordId') == wordId).data('sentenceWordId')
				, newPartType: partType };
			if(appendMeaning?.length > 0) {
				await $.ajax({
					url, type: 'POST', data: command
				});
				url = '/openvocas/append/meaning';
				command = { wordId: wordId || 0, partType, appendMeaning, sentenceId, title, token, start, end };
			}		
		}else {
			command = { wordId: wordId || 0, partType, appendMeaning, sentenceId, title, token, start, end };
		}
		
		_this.disabled = true;
		$.ajax({ url, type: 'POST', data: command,
			 success: word => {
				if(!!word && Object.getOwnPropertyNames(word).includes('senseList')) {
					const $wordSection = $sentenceUnit.find('.word-section>.one-block');
					if(adding) {
						const $wordBlock = $wordCopySection.clone();
						
						// wordId, sentenceId, workbookId를 할당(단어모듈용)
						$wordBlock.data({wordId: word.wid||wordId, sentenceId, workbookId, sentenceWordId: word.sentenceWordId });
						
						// 우선 복사 원본의 뜻 부분들을 삭제
						$wordBlock.find('.one-part-unit-section').remove();
						
						// 단어의 품사별 뜻 새로 표시
						$wordBlock.find('.title').text(word.title).attr('data-playing','off').click(function(e){
								e.stopPropagation();
								const on = this.dataset.playing == 'on';
								if(on) {
									stopAllTTS();
								}else {
									stopAllTTS(this);
									this.dataset.playing = 'on';
									this.classList.add('tts-playing','blink-2');
									tts.speakRepeat(word.title, 2, 500, () => {
										this.classList.remove('tts-playing', 'blink-2');
										this.dataset.playing = 'off';
									});
								}
						});
						if(requesting) {
							$wordBlock.addClass('pe-none');
							$wordBlock.append($('<span class="meaning fst-italic">빠른 시일 내에 등록될 예정입니다.<span>'));
						}else {
							const senseList = word.senseList;
							// '단어'를 검색결과의 뜻 선택만 했을 경우, senseList = []
							if(senseList.length == 0) {
								// "vt. 가다"와 같은 형태의 텍스트를 검색결과에서 추출
								const meaningChoice = $('#openVocaModal .meaning .list-group-item').filter((_,el) => {
									return el.textContent.startsWith(partType);
								}).text();
								
								senseList.push({ partType, meaning: meaningChoice.substring(partType.length + 1)})
							}
							
							for(const element of senseList) {
								const sense = element, $partBlock = $partCopySection.clone();
								
								$wordBlock.append($partBlock);
								$partBlock.find('.part').text(sense.partType).attr('title', partTypeMap[sense.partType]);
								$partBlock.find('.meaning').text(sense.meaning);
							}
						}
						$wordSection.find('.empty-list').remove();
						$wordSection.append($wordBlock);						 
					}
					// 의미 및 품사 추가만 한 경우
					else {
						const $wordBlock = $wordSection.find('.one-word-unit-section').filter((_,el) => $(el).data('wordId') == wordId);
						
						$wordBlock.find('.one-part-unit-section').remove();
						const senseList = word.senseList;
						let senseListLen = senseList.length;
						for(let k = 0; k < senseListLen; k++) {
							const sense = senseList[k], $partBlock = $partCopySection.clone();
							
							$wordBlock.append($partBlock);
							$partBlock.find('.part').text(sense.partType).attr('title', partTypeMap[sense.partType]);
							$partBlock.find('.meaning').text(sense.meaning);
							
						}
					}
					alertModal(requesting? '등록이 요청되었습니다. 빠른 시일 내로 등록해 드리겠습니다.' : '등록되었습니다. 단어목록을 확인해 주세요.', 
					() => $('#openVocaModal').modal('hide'));
				} else if(_this.id == 'changeVoca') {
					const $wordBlock = $sentenceUnit.find('.one-word-unit-section').filter((_,w) => $(w).data('wordId') == wordId);
					$wordBlock.find('.one-part-unit-section').remove();
					const meaning = $('#openVocaModal .meaning .list-group-item').filter((_,m) => m.textContent.startsWith(partType)).text().substring(partType.length).trim()
					, $partBlock = $partCopySection.clone();
					$partBlock.find('.part').text(partType).attr('title', partTypeMap[partType]);
					$partBlock.find('.meaning').text(meaning);
					
					$wordBlock.append($partBlock);
					alertModal('품사를 변경했습니다\n등록창을 닫습니다.', () => $('#openVocaModal').modal('hide'));
				}
				 else {
					alertModal('등록결과를 조회할 수 없습니다\n등록창을 닫습니다.', () => $('#openVocaModal').modal('hide'))
				}				 
			 },
			 error: () => {
				 alertModal('등록에 실패했습니다.');
			 },
			 complete: () => _this.disabled = false
		});
	})
	
	/*
	// [문장의 질문 목록 가져오기(1회)]-----------------------------------------------
	.one('show.bs.tab', '.one-sentence-unit-section .nav-link[data-type=qna]', function() {
		const $_this = $(this);
		const $sentenceSection = $_this.closest('.one-sentence-unit-section'); 
		const sentenceId = $sentenceSection.data('sentenceId');
		const $qnaSection = $(this.dataset.bsTarget);
		const $qnaList = $qnaSection.find('.qna-list');
		
		if($_this.is('.loading')) return;
		$_this.addClass('loading');
		$qnaSection.find('.empty-list').show();
		// 문장의 질문목록 새로 가져오기(ajax)----------------------------------
		$.getJSON(['/qnastack/question/workbook/sentence',workbookId,sentenceId].join('/'), 
					questions => listQuestions(questions))
		.fail( jqxhr => alertModal('질문 가져오기에 실패했습니다.\n다시 접속해 주세요.'));
		//---------------------------------------------------------------
		
		function listQuestions(questions){
			// 질문이 있으면 목록 표시
			if(questions.length > 0 ) {
				$qnaSection.find('.empty-list').hide();
			}
			for(let i = 0, questionsLen = questions.length; i < questionsLen; i++) {
				const question = questions[i];
								  //--------------------------------
				const $question = createQuestionDOM(question, false);
								  //--------------------------------
				$question.find('.accordion-collapse')
					 	.attr('data-bs-parent', 
					 		'#' + $sentenceSection.attr('id')+' .qna-list');							
				$qnaList.append($question);
			}
			$_this.removeClass('loading');
		}
	})
	// [문장 질문 등록]----------------------------------------------------------------
	.on('submit', '.sentence-qna-add-form', function(e) {
		e.preventDefault();
		const $addSection = $(this).closest('.add-section'); 
		const $sentenceSection = $(this).closest('.one-sentence-unit-section');
		const title = $addSection.find('.q-title').val().trim();
		const $content = $addSection.find('.text-input');
		const content = $content.val().trim();
		const command = {
				targetId: Number($sentenceSection.data('sentenceId')),
				qtype: 'S', workbookId, passageId, questionerId: memberId, priorityId,
				title, content
		}
		// 질문 등록(ajax)-------------------------
		addQuestion('workbook', command, successAddQuestion);
		//---------------------------------------
		
		function successAddQuestion(question) {
			const $qnaList = $sentenceSection.find('.qna-section>.qna-list');
							  //-------------------------------
			const $question = createQuestionDOM(question, true);
							  //-------------------------------
			$question.find('.accordion-collapse')
				 	.attr('data-bs-parent', 
				 		'#'+$sentenceSection.attr('id')+' .qna-list');							  
			$qnaList.prepend($question);
			$content.val('');
			$addSection.hide(300, function() {
				const $noteSection = $addSection.closest('.qna-section');
				$noteSection.find('.add-icon').prop('disabled', false);
				$noteSection.find('.empty-list').hide();
			})
		}
	})
	*/
/* -------------------------------- 지문/문장 공통------------------------------ */
	
	// [지문/문장의 노트 수정 폼 열기]-------------------------------------------------
	.on('click', '.js-edit-note-open', async function() {
		
		const $noteSection = $(this).closest('.note-block')
		const $textSection = $noteSection.find('.text-section');
		$noteSection.find('.note-mdf-btns').hide();
		const $content = $textSection.find('.note-text').hide();
		if(this.closest('.collapse-section')) {
			$noteSection.find('.note').toggleClass('overflow-hidden mb-4');
		}
		const $noteEditor = $textSection.find('.note-editor').show();
		const $summernote = $noteEditor.find('.text-input').val($content.html());
		$textSection.find('.open-input').trigger('input');
		//if($(this).closest('.passage-comment-section').length == 0){
			// Summernote 에디터 설정------
			openSummernote($summernote);
			// -------------------------
	})
	// [지문/문장의 노트 수정 폼 닫기]------------------------------------------------
	.on('click', '.js-edit-note-cancel', function() {
		const $textSection = $(this).closest('.text-section');
		const $noteSection = $(this).closest('.note-block');
		if(this.closest('.collapse-section')) {
			$(this).closest('.note').toggleClass('overflow-hidden mb-4');
		}
		$textSection.find('.note-editor, .note-text')
					.add($noteSection.find('.note-mdf-btns')).toggle();
	})
	// [지문/문장의 노트 수정 완료]---------------------------------------------------
	.on('click', '.js-edit-note', function() {
		const $textSection = $(this).closest('.text-section');
		const $noteSection = $(this).closest('.note-block');
		const noteId = Number($noteSection.data('noteId'));
		const noteAccess = $textSection.find('.note-open-input').val();
		const content = $textSection.find('.text-input').summernote('code').trim();
		const jsonCommand = {noteId, workbookId, memberId, content}
		const $sentenceSection = $textSection.closest('.one-sentence-unit-section');
		const ofWhat = ($sentenceSection.length > 0) ? 'sentence' : 'passage';
		
		if(content.length == 0) return;
		// 문장 노트일 경우
		if(ofWhat == 'sentence') {
			jsonCommand.sentenceId = Number($sentenceSection.data('sentenceId'));
			jsonCommand.noteAccess = noteAccess;
		}// 지문 노트일 경우
		else {
			jsonCommand.passageId = passageId;
			jsonCommand.publicOpen = JSON.parse(noteAccess);
		}

		// 노트 수정(ajax)-------------------------------
		editNote(ofWhat, jsonCommand, successEditNote);
		// --------------------------------------------
		
		function successEditNote(note) {
			if($noteSection.closest('.collapse-section').length > 0) {
				$noteSection.find('.note').toggleClass('overflow-hidden mb-4');
			}
			$textSection.find('.note-editor').hide();
			$textSection.find('.note-open-input').val((note.noteAccess||note.publicOpen).toString());
			$textSection.find('.note-text').html(note.content).show();
			$noteSection.find('.updatedate').text(new Date().toLocaleDateString());
			$noteSection.find('.note-mdf-btns, .updatedate').show();
		}
	})
	// [지문/문장의 노트 삭제]-------------------------------------------------------
	.on('click', '.js-delete-note', function() {
		const $noteBlock = $(this).closest('.note-block'),
			$noteSection = $noteBlock.closest('.note-section'),
			noteId = Number($noteBlock.data('noteId')),
			$sentenceSection = $noteBlock.closest('.one-sentence-unit-section'),
			ofWhat = ($sentenceSection.length > 0) ? 'sentence' : 'passage';
		confirmModal('삭제하시겠습니까?', () => {
			// 노트 삭제(ajax)--------------------
			delNote(ofWhat, noteId, delCallback);
			// ---------------------------------
		});
		function delCallback() {
			$noteBlock.fadeOut(function() {
				$(this).remove();
				if($noteSection.find('.note-block').length == 0){
					$noteSection.find('.empty-list').show();
				}
			})
		}
	})
	// [지문/문장 노트 추가 폼 열기]--------------------------------------------
	.on('click', '.note-section .add-icon', async function(){
		$(this).prop('disabled', true);
		const $section = $(this).closest('.note-section');
		const $addSection = $section.find('.add-section');
		//if($(this).closest('.passage-comment-section').length == 0) 
			// Summernote 에디터 세팅--------------------------
			openSummernote($addSection.find('.text-input'));
			// ---------------------------------------------
		$addSection.show(300, function() {
			$section.find('.empty-list').hide();
		});
		
	})
	// [지문/문장 노트 추가 폼 닫기]----------------------------------------------------
	.on('click', '.cancel-add-note-btn', function() {
		const $addSection = $(this).closest('.add-section');
		const $summernote = $addSection.find('.text-input').val('');
		if(typeof $summernote.summernote == 'function') {
			$summernote.summernote('destroy');
		}
		$addSection.hide(300, function() {
			const $noteSection = $addSection.closest('.note-section');
			$noteSection.find('.add-icon').prop('disabled', false);
			if($noteSection.find('.note-list .note-block').length == 0 ){
				$noteSection.find('.empty-list').show();
			}
		});
	})
	// [피코쌤 노트 신청]-----------------------------------------------------------
	.on('click', '.js-request-note', function() {
		const _this = this;
		const $unitSection = $(this).closest('.one-sentence-unit-section');
		const eng = $unitSection.find('.origin-sentence .sentence-text').text().trim();
		const sentenceId = $unitSection.data('sentenceId');
		confirmModal('<img class="align-baseline" src="https://static.findsvoc.com/images/icons/ssamnote.png" style="width: 5rem;">를 신청하시겠습니까?', function() {
			_this.disabled = true;
			$.ajax({
				url: '/workbook/ssamnote/request',
				type: 'POST',
				data: {
					workbookId, passageId, sentenceId, eng
				},
				success: function(msg) {
					if(msg) {
						alertModal(msg);
					}else {
						alertModal('정상적으로 신청 완료되었습니다.\n신청하신 노트는 09:00~18:00 사이 처리됩니다.\n(당일 처리되지 못 한 노트는 다음 영업일에 처리됩니다.)');
					}
				}, error: function() {
					alertModal('신청이 정상적으로 처리되지 못 했습니다.')
				},
				complete: () => _this.disabled = false
			})
		})
	})
	/*
	// [지문/문장 질문 추가 폼 열기]--------------------------------------------------
	.on('click', '.qna-section .add-icon', async function() {
		$(this).prop('disabled', true).tooltip('hide');
		const $section = $(this).closest('.qna-section');
		const $addSection = $section.children('.add-section');

		if($(this).closest('.passage-comment-section').length > 0) {
			// Summernote 에디터 세팅--------------------------
			openSummernote($addSection.find('.text-input'));
			// ---------------------------------------------
			$addSection.show(300, function() {
				$section.find('.empty-list').hide();
			});
		}else {
			$addSection.show(300, async function() {
				$section.find('.empty-list').hide();
				// Svoc 구문분석 복사 --------------------------
				const $sentenceSection = $section.closest('.one-sentence-unit-section'); 
				const $svocBlock = $addSection.find('.svoc-block');
	
				if($svocBlock.children().length > 0) return;
				const text = $sentenceSection.find('.origin-sentence .sentence-text').text();
				const svocBytes = await tandem.getSvocBytes($sentenceSection.find('.semantics-result').get(0));

				$semantics = $(await tandem.showSemanticAnalysis(text, svocBytes, $svocBlock));
				
				$addSection.find('textarea').get(0).focus();
			});
		}
	})
	// [지문/문장의 질문 추가 폼 닫기]------------------------------------------------
	.on('click', '.cancel-add-qna-btn', function() {
		const $addSection = $(this).closest('.add-section');
		$addSection.find('.svoc-block').empty();
		$addSection.find('.text-input').val('');

		$addSection.hide(300, function() {
			const $qnaSection = $addSection.closest('.qna-section');
			$qnaSection.find('.add-icon').prop('disabled', false);
			if($qnaSection.find('.qna-list .qna-block').length == 0 ) {
				$qnaSection.find('.empty-list').show();
			}
		});
		// 추가질문의 경우 답변 평가지 닫기
		$(this).closest('.survey-section')?.find('.js-satisfy-cancel')?.trigger('click');
	})
	// [질문 수정폼 열기]-----------------------------------------------------------
	.on('click', '.js-edit-question-open', function() {
		$question = $(this).closest('.question-section');
		$contentSection = $question.find('.text-section').slideUp();
		$editSection = $question.find('.edit-section').slideDown();
		$qnaUnit = $question.closest('.qna-unit');
		// 제목
		$editSection.find('.q-title').val($qnaUnit.find('.title-block .question-text:eq(0)').text());
		// 내용
		$editSection.find('.text-input').val($qnaUnit.data('content'));
		// Summernote 에디터 설정---------------------------
		openSummernote($editSection.find('.text-input'));
		//-----------------------------------------------
	})
	// [질문 수정폼 닫기]-----------------------------------------------------------
	.on('click', '.cancel-edit-question', function() {
		const $editSection = $(this).closest('.edit-section');
		const $contentSection = $editSection.closest('.question-section').find('.text-section');
		$editSection.find('.text-input').val('').summernote('destroy');
		$editSection.slideUp();
		$contentSection.slideDown();
	})
	// [질문 수정 완료]------------------------------------------------------------
	.on('submit', '.question-section .edit-section', function(e) {
		e.preventDefault();
		e.stopPropagation();
		const $editSection = $(this).closest('.edit-section');
		const $qnaUnit = $editSection.closest('.qna-unit');
		const title = $editSection.find('.q-title').val().trim();
		const content = $editSection.find('.text-input').val();
		
		if(content.length == 0){
			alertModal('내용을 입력해 주세요.');
			return false;
		}else {
			const questionCommand = {
				questionId: $qnaUnit.data('questionId'), title, content, 
				targetId: $qnaUnit.data('targetId'), 
				workbookId, passageId,
				qtype: $qnaUnit.data('qType'), questionerId: memberId,
				priorityId: $qnaUnit.data('priorityId'),
				questionStatus: $qnaUnit.data('qStatus')
			}
			
			// 질문 수정(ajax)--------------------------------------------
			editQuestion('workbook', questionCommand, successEditQuestion);
			//----------------------------------------------------------
			
			function successEditQuestion(question) {
				$editSection.find('.text-input').val('').summernote('destroy');
				$editSection.slideUp();
				$qnaUnit.find('.question-section .text-section').slideDown();
				
				// 질문 제목
				$qnaUnit.find('.title-block .question-text:eq(0)')
						.html(question.title.replace('[추가질문]',
								'<span class="text-violet">[추가질문]</span>'));
				// 질문 내용
				$qnaUnit.find('.title-block .question-section .question-text')
						 .text($('<div></div>').html(question.content).text());
				$qnaUnit.find('.content-block .question-text').html(question.content);
			}	
		}
	})
	// [질문 삭제]----------------------------------------------------------------
	.on('click', '.js-del-question', function() {
		const $qnaUnit = $(this).closest('.qna-unit');
		
		if(confirm('질문을 정말 삭제하시겠습니까?')) {
			const questionId = $qnaUnit.data('questionId');
			// 질문 삭제(ajax)-----------------------------
			delQuestion('workbook', questionId, successDel);
			//-------------------------------------------
			
			function successDel(question) {
				alertModal('삭제되었습니다.');
				if(typeof question != 'object' || question == null) {
					$qnaUnit.slideUp(function() {
						$(this).closest('.qna-block').remove();
					});
				}else {
					// 질문 제목
					$qnaUnit.find('.title-block .question-text:eq(0)').text(question.title);
					// 질문 내용
					$qnaUnit.find('.title-block .question-section .question-text')
							 .text($('<div></div>').html(question.content).text());
					$qnaUnit.find('.content-block .question-text').html(question.content);
					// 질문 상태(완료)
					expressQstatus($qnaUnit.find('.q-status'), 'C');
				}
			}
		}
	})	
	// [지문/문장의 질문 답변 목록 가져오기]-----------------------------------------------
	.on('show.bs.collapse', '.qna-list .content-block', async function() {
		const $contentBlock = $(this);
		const $qnaSection = $(this).closest('.qna-unit');
		const questionId = $qnaSection.data('questionId');
		const qType = $qnaSection.data('qType');
		const targetId = $qnaSection.data('targetId');
		
		if($contentBlock.is('.loading,.loaded')) return;
		if(!$contentBlock.is('.loaded')) { 
			// $_this.find('.-icon').text($contentBlock.is('.collapse.show')
			//							? 'arrow_drop_down' : 'arrow_drop_up');
			//$contentBlock.collapse('toggle'); 
			//$_this.find('.qna-mdf-btns')
			//.add($contentBlock.find('.question-section .qna-mdf-btns')).toggle();
			//return;
			$contentBlock.addClass('loading');
		}
			
		// 질문 답변 목록 가져오기(ajax)------------------------------------------
		$.getJSON(['/qnastack/answers',qType,questionId,targetId].join('/'), 
					{from: 'w'}, listAnswers)
		.fail(jqXHR => {
			alertModal('질문의 상세내용을 가져오지 못했습니다. 다시 접속해 주세요.');
			$contentBlock.removeClass('loading');
		});
		//-------------------------------------------------------------------
		
		async function listAnswers(answerInfo) {
			const answerList = answerInfo.answerList;
			const $questionSection = $contentBlock.find('.question-section');
			const $insertPos = $contentBlock.find('.answer-list');
			const showList = [$questionSection];
			
			// 질문이 펼쳐지면서 편집버튼 표시(자기 질문일 경우)
			$questionSection.find('.qna-mdf-btns').show();
			
			// 답변 표시
			if(answerList?.length > 0) {
				for(let i = 0, len = answerList.length; i < len; i++) {
					const answer = answerList[i];
										   //----------------------------------
					const $answerSection = createAnswerDOM(answer, $qnaSection);
										   //----------------------------------
					$answerSection.appendTo($insertPos);
					showList.push($answerSection);
				}
			}else { // 답변이 없을 때
				
			}
			for(let i = 0, len = showList.length; i < len; i++) {
				await sleep(600);
				showList[i].addClass('show');
			}
			$contentBlock.toggleClass('loading loaded');
		}
	})
	// [답변 추가 폼 열기]----------------------------------------------------------
	.on('click', '.qna-unit .add-section .text-input', function() {
		// Summernote 에디터 세팅--
		openSummernote($(this));
		//----------------------
		$(this).closest('.add-section').find('.qna-add-btns').slideDown();
	})
	// [답변 추가 폼 닫기]----------------------------------------------------------
	.on('click', '.cancel-add-answer-btn', function() {
		const $addSection = $(this).closest('.add-section');
		
		$addSection.find('.text-input').val('').summernote('destroy');
		$(this).closest('.qna-add-btns').slideUp();
	})
	// [답변 추가 등록]------------------------------------------------------------
	.on('click', '.js-add-answer-btn', function() {
		const $addSection = $(this).closest('.add-section');
		const $qnaSection = $addSection.closest('.qna-unit');
		const $input = $addSection.find('.text-input');
		const content = $input.summernote('code').trim();
		
		if(content.length == 0) {
			alertModal('내용을 입력해 주세요.');
			return false;
		}
		const command = {questionId: Number($qnaSection.data('questionId')),
						writerId: memberId, content};
		// 답변 등록(ajax)---------------------
		addAnswer(command, successAddAnswer);
		//-----------------------------------
		
		function successAddAnswer(answer) {
			$input.val('').summernote('destroy');
			$addSection.find('.qna-add-btns').slideUp();
								   //----------------------------------
			const $answerSection = createAnswerDOM(answer, $qnaSection);
								   //----------------------------------
			$answerSection.insertBefore($addSection);
			sleep(600);
			
			$answerSection.addClass('show');
		}
	})	
	// [답변 수정폼 열기]-----------------------------------------------------------
	.on('click', '.js-edit-answer-open', function() {
		$answer = $(this).closest('.answer-section');
		$contentSection = $answer.find('.text-section').slideUp();
		$editSection = $answer.find('.edit-section').slideDown();
		// 내용
		$editSection.find('.text-input').val($answer.find('.answer-text').html());
		// Summernote 에디터 설정---------------------------
		openSummernote($editSection.find('.text-input'));
		//-----------------------------------------------		
	})
	// [답변 수정폼 닫기]-----------------------------------------------------------
	.on('click', '.cancel-edit-answer', function() {
		const $editSection = $(this).closest('.edit-section');
		const $contentSection = $editSection.closest('.answer-section').find('.text-section');
		$editSection.find('.text-input').val('').summernote('destroy');
		$editSection.slideUp();
		$contentSection.slideDown();
	})
	// [답변 수정 완료]------------------------------------------------------------
	.on('submit', '.answer-section .edit-section', function(e) {
		e.preventDefault();
		e.stopPropagation();
		const $editSection = $(this);
		const $answer = $editSection.closest('.answer-section');
		const $contentSection = $answer.find('.text-section');
		const $qnaUnit = $answer.closest('.qna-unit');
		const content = $editSection.find('.text-input').val().trim();
		
		if(content.length == 0) {
			alertModal('내용을 입력해 주세요.');
			return false;
		}
		const command = {questionId: Number($qnaUnit.data('questionId')),
						answerId: $answer.data('answerId'),
						writerId: memberId, content};
		// 답변 수정(ajax)-----------------
		editAnswer(command, successEdit);
		//-------------------------------
		
		function successEdit(answer) {
			alertModal('수정되었습니다.');
			$editSection.find('.text-input').val('').summernote('destroy');
			$editSection.add($contentSection).slideToggle();
			$answer.find('.answer-text').html(answer.content);
		}
	})
	// [답변 삭제]----------------------------------------------------------------
	.on('click', '.js-del-answer', function() {
		const $answer = $(this).closest('.answer-section');
		
		if(confirm('답변을 정말 삭제하시겠습니까?')) {
			const answerId = $answer.data('answerId');
			// 답변 삭제(ajax)----------------
			delAnswer(answerId, successDel);
			//------------------------------
			
			function successDel() {
				alertModal('삭제되었습니다.');
				$answer.slideUp(function() {
					$(this).remove();
				});
			}
		}		
	})	
	// [특정 답변을 선택하여 평가지 펼치기]--------------------------------
	.on('click', '.js-survey-answer', function() {
		const $btnGroup = $(this).closest('.satis-btns').addClass('active');
		$btnGroup.closest('.qna-unit').find('.satis-btns').not($btnGroup).addClass('inactive');
		const $surveySection = $(this).closest('.qna-unit').find('.survey-section').show();
		$surveySection.closest('.content-block').children('.add-section').hide();
		$surveySection.data('answerId', $(this).closest('.answer-section').data('answerId'))
					  .data('memberId', $(this).closest('.answer-section').data('memberId'));
		$surveySection.find('[name=evaluation][value='+$(this).val()+']')
					  .prop('checked',true).trigger('input');
		$surveySection[0].scrollIntoView();
	})
	// [답변 평가지 닫기]-----------------------------------------------------------
	.on('click', '.js-satisfy-cancel', function() {
		const $surveySection = $(this).closest('.survey-section').slideUp();
		$surveySection.closest('.content-block').children('.add-section').show();
		$(this).closest('.qna-unit').find('.satis-btns').removeClass('active inactive');
	})
	// [체크된 평가에 따른 처리(추가질문 폼 처리)]
	.on('input', ':radio[name=evaluation]', function() {
		if(this.value == 'B') {
			const $addSection = $('.question-add-form').appendTo($(this).closest('.survey-section')).slideDown();
			$addSection.find('.q-title').val('[추가질문] ' + $addSection.closest('.qna-unit').find('.question-text:eq(0)').text());
			$addSection.find('.text-input').val('');
			// Summernote 에디터 세팅--------------------------
			openSummernote($addSection.find('.text-input'));
			// ---------------------------------------------
			$addSection.find('.qna-add-btns').slideDown();
			$(this).closest('.survey-section').children('.answer-survey-btns').slideUp();
		}else {
			$(this).closest('.survey-section').find('.question-add-form .q-title')?.val('');
			if(typeof $.summernote != 'undefined')
				$(this).closest('.survey-section').find('.question-add-form .text-input')?.val('').summernote('destroy');
			$(this).closest('.survey-section').find('.question-add-form')?.hide(300);
			$(this).closest('.survey-section').find('.answer-survey-btns').slideDown();
		}
	})
	// [답변 평가]----------------------------------------------------------------
	.on('click', '.js-satisfy-btn', function() {
		const $surveySection = $(this).closest('.survey-section');
		const answerId = $surveySection.data('answerId');
		const writerId = $surveySection.data('memberId');
		const $question = $(this).closest('.qna-unit');
		const questionId = $question.data('questionId');
		const evaluation = $surveySection.find('[name=evaluation]:checked').val();
		const questionStatus = 'ABD'.indexOf(evaluation) > -1 ? 'C' : 'A';
		const command = {questionId, answerId, writerId, evaluation, questionStatus};
		
		// 답변 평가(ajax)------------------------
		evaluateAnswer(command, successEvalute);
		//--------------------------------------
		
		function successEvalute() {
			alertModal('평가가 완료되었습니다.');
			$surveySection.slideUp();
			
			// 질문상태 변경
			$question.data('qStatus', questionStatus);
			expressQstatus($question.find('.q-status'), questionStatus);
			// 답변 상태 변경
			const $answer = $question.find('.answer-section').filter(function() {
				return $(this).data('answerId') == answerId;
			});
			$answer.find('.satis-btns').remove();
			if('AB'.indexOf(evaluation) > -1) {
				$answer.find('.answer-text')
					   .before('<div class="material-icons text-yellow-400">emoji_events</div>');
			}
			 if(questionStatus == 'C') {
	            $question.find('.satis-btns').remove();
	         }else {
	            $surveySection.closest('.content-block').children('.add-section').show();
	         }
		}
	})
	// [답변 평가 - 추가적인 질문 완료]-----------------------------------------------
	.on('click', '.js-add-question-btn', function() {
		const $addSection = $(this).closest('.add-section');
		const $qnaUnit = $addSection.closest('.qna-unit');
		const $content = $addSection.find('.text-input');
		const title = $addSection.find('.q-title').val().trim();
		const content = $content.val().trim();
		if(content.length == 0) return;
		const questionCommand = {
			targetId: $qnaUnit.data('targetId'), title, content, 
			workbookId, passageId,
			priorityId: $(this).closest('.survey-section').data('memberId'),
			qtype: $qnaUnit.data('qType'), questionerId: memberId
		}

		// 질문 추가(ajax)------------------------------------------
		addQuestion('workbook', questionCommand, successAddQuestion);
		//--------------------------------------------------------
		
		function successAddQuestion(question) {
			const $qnaList = $('.qna-list').show();
			const parentId = $qnaList.closest('[id]').attr('id');
							  //-------------------------------
			const $question = createQuestionDOM(question, true);
							  //-------------------------------
			$question.find('.accordion-collapse')
				 	.attr('data-bs-parent', '#' + parentId + ' .qna-list');							  
			$qnaList.prepend($question);
			$content.val('').summernote('destroy');
			$addSection.hide(300, function() {
				$(this).closest('.qna-add-btns').data('openBtn')?.prop('disabled', false);
			})
			// 추가질문의 경우
			if($addSection.closest('.survey-section').length > 0) {
				$addSection.closest('.survey-section').find('.js-satisfy-btn').trigger('click');
			}
		}			
	})
	*/
	// 크래프트 출제 패널 동작
	.on('show.bs.collapse', '.craft-section', function() {
		const $sentenceSection = $(this).closest('.one-sentence-unit-section');
		$sentenceSection.find('.dashboard-section').collapse('hide');
		const translations = Array.from($sentenceSection.find('.ai-translation-section').eq(0).find('.ai-translation-block'), transBlock => {
			return {id: $(transBlock).data('korTid'), text: transBlock.querySelector('.translation-text').textContent}
		})
		if(this.querySelector('.battle-section-panel') == null) {
			craft.openBattleMakerPanel(this,
				memberId,
				memberRoleType,
				$sentenceSection.data('sentenceId'), 
				$sentenceSection.find('.semantics-result')[0],
				translations);
		}
	})
	
	
	// [피코쌤 영역]
	if(['A','S'].includes(memberRoleType)) {
		const WORD_UNIT_CLASSNAME = 'one-word-unit-section',
			WORD_UNIT_SELECTOR = `.${WORD_UNIT_CLASSNAME}`;
		const delWordBtnJson = {
			el: 'span', role: 'button', class: 'js-del-word fas fa-trash-alt', 
			dataset: { bsToggle: 'tooltip', bsTitle: '삭제'}
		}	
		// -----------------------------단어 삭제---------------------------------
		$(document)
		// [.one-word-unit-section 블럭에 마우스를 올리면 버튼 표시]-----------------------
		.on('mouseover', WORD_UNIT_SELECTOR, function() {
			if($(this).find('.js-del-word').length > 0) return;
			const delWordBtn = createElement(delWordBtnJson);
			const $title = $(this).find('.title');
			$(delWordBtn).insertAfter($title)
		})
		.on('mouseleave', WORD_UNIT_SELECTOR, function() {
			$(this).find('.js-del-word').remove();
		})
		// [단어 삭제]----------------------------------------------------------------
		.on('click', '.js-del-word', function(e) {
			e.stopPropagation();
			const $wordSection = $(this).closest(WORD_UNIT_SELECTOR)
			
			const { sentenceWordId } = $wordSection.data();
			const title = $wordSection.find('.title').text().trim();
			confirmModal(`이 문장에서 단어 ${title}을(를) 삭제하시겠습니까?`, () => {
				$.ajax({
					url: '/workbook/sentence/word/del',
					type: 'POST', contentType: 'application/json',
					data: JSON.stringify(sentenceWordId),
					success: () => {
						alertModal('단어가 삭제되었습니다.', () => {
							$wordSection.slideUp(() => $wordSection.remove())
						})
					},
					error: (jqxhr) => {
						alertModal(jqxhr.responseText);
					}
				})
			})
			
			
		})		
	}
	
/* ------------------------------ Embed functions --------------------------- */
	// 노트 정보를 DOM으로 생성
	function createNoteDOM(note) {
		const block = $(WORKBOOK_ELEMENTS).children(`.note-block.${note?.hasOwnProperty('sentenceId')?'sentence':'passage'}-note`).clone(true)[0];
		if(devSize.isPhone()) block.querySelector('.note').classList.add('overflow-hidden');
		block.dataset.noteId = note.noteId;
		// 내용
		block.querySelector('.note-text').innerHTML = note.content;
		// 날짜
		block.querySelector('.updatedate').textContent = new Date(note.updateDate||new Date()).toLocaleDateString();
		// 본인 것이 아니면 수정버튼 삭제
		if(memberId != note?.memberInfo?.memberId) {
			block.querySelector('.note-mdf-btns').remove();
		}else {
			const $input = $(block).find('.note-editor .note-open-input');
			// input.value = true (O), $input.val("true") (O), $input.val(true) (X)
			// ∴ val() 안에는 숫자 혹은 문자열이어야 함.
			$input.val((note.noteAccess??note.publicOpen).toString());
			$input.trigger('input');
		}
		block.querySelector('.personacon-section .alias').textContent = note?.memberInfo?.alias;
		return $(block);
	}
	
	// metaStatus 값에 따른 표시정보
	function getMetaStatusExpression(status) {
		switch(status) {
			case 'S':
				return { icon: '🥳', msg: '평가를 받은 문장이예요.' };
			case 'F':
				return { icon: '🤯', msg: '분석이 틀렸대요.' };
			default:
				return { icon: '🤔', msg: '아직 평가되지 않은 문장이예요.' };
		}
	}
	// 질문 정보를 DOM으로 생성
/*	var qSeq = 0;
	function createQuestionDOM(question, isMine) {
		const $question = $('#hiddenDivs .qna-unit').clone();
		const $block = $('<div class="qna-block one-block row g-0 p-0"></div>');
		// Question 정보 설정
		$question.data('questionId', question.qid)
				 .data('qType', question.qtype)
				 .data('qStatus', question.qstatus)
				 .data('priorityId', question.priorityId)
				 .data('targetId', question.targetId)
				 .data('content', question.content)
				 .data('isMine', question.questioner.mid == memberId);
		// 질문 상태
		expressQstatus($question.find('.q-status'), question.qstatus);
		// 질문자 정보
		const questioner = !isMine ? question.questioner
						: {alias: memberAlias, image : memberImage, memberId : memberId}; 
		const $personacon = $question.find('.personacon-section');
		$personacon.find('.alias').text(questioner.alias);
		if(questioner.image) {
			$personacon.find('.personacon-profile')
						.removeClass('profile-default')
						.css('background','url(/resource/profile/images/'
						+ questioner.image + ') center/cover no-repeat');
		} 
		$question.find('.regdate').text(
				(isMine ? new Date() : new Date(question.regDate)).toLocaleDateString());
		// 질문 제목
		$question.find('.title-block .question-text:eq(0)')
				 .html(question.title.replace('[추가질문]', 
						 '<span class="text-violet">[추가질문]</span>'));
		// 질문 내용
		$question.find('.title-block .question-section .question-text')
				 .text($('<div></div>').html(question.content).text());
		$question.find('.content-block .question-text').html(question.content);
		// 본인 질문이 아니면 수정,평가버튼 삭제
		if(memberId != questioner.mid) {
			$question.find('.qna-mdf-btns, .survey-section').remove();
		}
		// 완료된 질문인 경우 답변입력란,평가버튼 삭제
		if('C' == question.qstatus) {
			$question.find('.add-section, .survey-section').remove();
		}
		// 본인 질문이 아니고 본인이 답변 우선권자가 아니면 답변입력란 비활성화
		if('R' == question.qstatus &&  question.questioner.mid != memberId
		&& memberId != question.priorityId) {
			$question.find('.add-section .text-input')
					 .attr('placeholder', '답변 우선권자의 답변을 기다리는 중입니다..')
					 .prop('disabled', true);
		}
		$question.attr('id', 'question' + qSeq)
				 .find('.accordion-button')
				 .attr('data-bs-target', '#question' + qSeq + ' .content-block');

		qSeq++;
		$question.appendTo($block);
		if(memberId == 0) $block.find('.collapse').hide();
		return $block;
	}
	function expressQstatus($qStatus, qStatus) {
		$qStatus.removeClass('bg-bittersweetshimmer bg-jazzberryjam bg-violet bg-coolblack');
		switch(qStatus) {
		case 'H':
			$qStatus.addClass('bg-bittersweetshimmer').text('대기중');
			break;
		case 'A':
			$qStatus.addClass('bg-jazzberryjam').text('다른 답변 요청');
			break;
		case 'R':
			$qStatus.addClass('bg-violet').text('답변예약');
			break;
		case 'C':
			$qStatus.addClass('bg-coolblack').text('완료');
			break;
		default:
			break;
		}
	}
	// 답변 정보를 DOM으로 생성
	function createAnswerDOM(answer, $question) {
		const $answerSection = $('#hiddenDivs .answer-section').clone().addClass('fade');
		// 답변자 정보
		$answerSection.data('answerId', answer.aid)
					  .data('memberId', answer.writer.mid);
		$answerSection.find('.alias').text(answer.writer?.alias);
		if(answer.writer?.image?.length > 0) {
			const $personacon = $answerSection.find('.personacon-section');
			const profile = $personacon.find('.personacon-profile')
								.removeClass('profile-default')[0];
			profile.style.background = 'url(/resource/profile/images/'
						+ answer.writer.image + ') center/cover no-repeat';
		}
		// 만족된 답변은 트로피 표시
		if(answer.satisLevel == 100) {
			$answerSection.find('.answer-text')
						  .before('<div class="material-icons text-yellow-400">emoji_events</div>');
		}
		// 본인 답변이 아니거나 평가가 된 답변은 수정버튼 삭제
		if(answer.writer.mid != memberId || answer.satisLevel > 0) {
			$answerSection.find('.qna-mdf-btns').remove();
		}
		// 본인 질문이 아니거나 평가가 된 답변은 평가버튼 삭제
		if(!$question.data('isMine') || answer.satisLevel > 0) {
			$answerSection.find('.satis-btns').remove();
		}
		// 날짜
		$answerSection.find('.regdate').text(new Date(answer.regDate).toLocaleDateString());
		// 답변 내용
		$answerSection.find('.answer-text').html(answer.content);
		return $answerSection;
	}
*/		
	
	function toggleOpenVocaBtns(idToShow) {
		anime({
			targets: $('#addVoca,#appendVoca,#requestVoca,#changeVoca').get(),
			rotateX: (el) => el.id === idToShow ? '0deg' : '180deg',
			duration: 400,
			easing: 'linear',
			update: anim => {
				if(anim.progress > 50)
					anim.animatables.forEach(animatable => {
						const isTargetToShow = animatable.target.id == idToShow;
						animatable.target.style.zIndex = isTargetToShow ? 0 : -1;
						animatable.target.disabled = !isTargetToShow;
					})
			}
		});
	}
}
/* 타이머 */
//const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
