/** /workbook/view_passage.html
 @author LGM
 */
 function pageinit(memberId, memberAlias, memberImage, workbookId, ownerId, priorityId, passageId, sentenceList) {
	const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
	const isMobile = window.visualViewport.width < 576;
	const tts = new FicoTTS({initSuccessCallback: () => {
		// 자동재생 조작 금지
		//document.querySelector('#ttsSettings .form-switch').remove();
	}});
	
	const svocMenuSectionJson = {
		el: 'div', className: 'svoc-menu-section d-block d-md-none', children: [
			{ el: 'button', type: 'button', className: 'col-auto js-add-svoc btn add-btn login-required p-0 ms-1 ms-lg-2 mb-auto',
			'data-toggle': 'tooltip', title: '구문분석 추가 등록', children: [
				{ el: 'span', className: 'material-icons fs-5', textContent: 'add_circle' }
			]},
			{ el: 'button', type: 'button', className: 'col-auto js-open-dashboard btn add-btn login-required p-0 ms-1 ms-lg-2 mb-auto',
			'data-bs-toggle': 'collapse', title: '문장 평가', children: [
				{ el: 'span', className: 'material-icons fs-5', textContent: 'assignment_turned_in' }
			]}
		]
	};
	
	const svocSectionJson = {
		el: 'div', className: 'svoc-section row position-relative', children: [
			{ el: 'div', className: 'svoc-block col my-auto' },
			{ el: 'div', className: 'svoc-mdf-btns btn-group px-2', children: [
					{ el: 'button', 'data-seq': '', 
						className: 'js-edit-svoc login-required btn p-0 pe-1',
						'data-toggle': 'tooltip', title: '분석 수정', children: [
							{ el: 'span', className: 'material-icons fs-5', textContent: 'edit_document'}
						]
					},
					{ el: 'button', 'data-seq': '', 
						className: 'js-del-svoc login-required btn p-0 ps-1',
						'data-toggle': 'tooltip', title: '분석 삭제', children: [
							{ el: 'span', className: 'material-icons fs-5', textContent: 'delete'}
						]
					}
				]
			},
			{ el: 'div', className: 'writer-section col-4 col-md-1 mt-2 mt-xl-0 btn', 'data-bs-toggle': 'collapse' , children: [
				{ el: 'div', className: 'personacon-alias alias' }
			]}
		]
	};
	const fingerSectionJson = {
		el: 'div', className: 'finger-section one-block js-finger-detail bg-gray-700', role: 'button', children: [
			{ el: 'div', className: 'sentence-text-block d-flex', children: [
					{ el: 'div', className: 'rounded-icon my-auto me-2', tabIndex: '0', 'data-toggle': 'tooltip', title: '문장을 누르면 해석·분석이 열립니다', children: [
							{ el: 'span', className: 'btn rounded-pill toggle-eye my-auto disabled', children: [
								{ el: 'i', className: 'far'}, ' 해석·분석'
							]}
						]
					},
					{ el: 'div', className: 'fold-icon-section ms-auto my-auto d-block d-md-none', children: [
							{ el: 'span', className: 'fold-icon text-3xl' }
						]
					},
					{ el: 'div', className: 'sentence-text my-auto' },
					{ el: 'div', className: 'fold-icon-section ms-auto my-auto d-none d-md-block', children: [
							{ el: 'span', className: 'fold-icon text-3xl' }
						]
					}
				]
			},
			{ el: 'div', className: 'svoc-block', style: 'display: none;' },
			{ el: 'div', className: 'trans-block mt-2', style: 'display: none;' }
		]
	}
	const noteSectionJson = {
		el: 'div', className: 'note-block one-block row g-0', children: [
			{ el: 'div', className: 'note text-section', children: [
				{ el: 'div', className: 'note-text ws-breakspaces', textContent: '노트 본문' },
				{ el: 'div', className: 'note-editor', style: 'display: none;', children: [
					{ el: 'textarea', className: 'text-input col-12' },
					{ el: 'div', className: 'form-check form-switch d-inline-block mx-1', children: [
						{ el: 'label', className: 'form-check-label text-sm', role: 'button', children: [
							{ el: 'input', type: 'checkbox', className: 'open-input form-check-input', checked: true },
							'회원들과 노트를 공유합니다.'
						]}
					]},
					{ el: 'button', type: 'button', className: 'btn p-0', 'data-bs-toggle': 'modal', 'data-bs-target': '#note-modal', children: [
						{ el: 'span', className: 'material-icons-outlined fs-6', textContent: 'help_outline' }
					]},
					{ el: 'div', className: 'note-edit-btns btn-group btn-set float-end mt-0 mt-sm-2', children: [
						{ el: 'button', type: 'button', className: 'js-edit-note-cancel btn btn-sm btn-outline-fico', textContent: '취소' },
						{ el: 'button', type: 'button', className: 'js-edit-note btn btn-sm btn-fico', textContent: '확인' }
					]}
				]}
			]},
			{ el: 'div', className: 'col-12 row g-0 personacon-section text-end mt-0 mt-md-1 text-secondary', children: [
				{ el: 'div', className: 'personacon-alias alias col-auto ms-auto fst-normal lh-sm' },
				{ el: 'div', className: 'updatedate col-auto ms-1 text-secondary text-xs lh-base' }
			]},
			{ el: 'div', className: 'note-mdf-btns-section text-end', children: [
				{ el: 'div', className: 'note-mdf-btns btn-group', children: [
					{ el: 'button', type: 'button', 
						className: 'js-edit-note-open login-required btn',
						'data-toggle': 'tooltip', title: '노트 수정', children: [
							{ el: 'span', class: 'material-icons fs-5', textContent: 'edit_document'}
						]
					},
					{ el: 'button', type: 'button', 
						className: 'js-delete-note login-required btn', 'data-toggle': 'tooltip', title: '노트 삭제', children: [
							{ el: 'span', class: 'material-icons fs-5', textContent: 'delete'}
						]
					}
				]}
			]}
		]
	};
	const transModifyBtnsJson = {
		el: 'div', className: 'trans-mdf-btns', children: [
			{ el: 'button', type: 'button', className: 'js-edit-trans-open login-required btn btn-sm py-0 pe-0 pt-0',
				'data-toggle': 'tooltip', title: '해석 수정', children: [
					{ el: 'span', className: 'material-icons fs-5', textContent: 'edit_document' }
				]
			},
			{ el: 'button', type: 'button', className: 'js-del-trans login-required btn btn-sm py-0',
				'data-toggle': 'tooltip', title: '해석 삭제', children: [
					{ el: 'span', className: 'material-icons fs-5', textContent: 'delete' }
				]
			}
		]
	}
	const transEditorJson = {
		el: 'div', className: 'trans-editor mt-2', children: [
			{ el: 'textarea', className: 'text-input form-control', placeholder: '나의 해석을 직접 등록할 수 있습니다.' },
			{ el: 'div', className: 'trans-edit-btns btn-group my-2', children: [
				{ el: 'button', type: 'button', className: 'js-edit-trans-cancel btn btn-sm btn-outline-fico', textContent: '취소' },
				{ el: 'button', type: 'button', className: 'js-edit-trans login-required btn btn-sm btn-fico', textContent: '확인' }
			]}
		]
	}
	const aiLoadingIconJson = {
		el: 'div', className: 'ailoading-icon position-relative overflow-hidden d-inline-block',
		style: { width: '50px', height: '50px' }, children: [
			{ el: 'lottie-player', className: 'position-absolute top-50 start-50 translate-middle',
				src: 'https://assets1.lottiefiles.com/packages/lf20_iJX38w.json',
				background: 'transparent', speed: '3', loop: true, autoplay: true, style: { width: '150px', height: '150px' }
			}
		]
	}
	document.querySelector('section').append(createElement([{
		el: 'div', className: 'note-modal-section modal', tabIndex: '-1', id: 'note-modal', children: [
			{ el: 'div', className: 'modal-dialog modal-dialog-centered', children: [
				{ el: 'div', className: 'modal-content', children: [
					{ el: 'div', className: 'modal-header', children: [
						{ el: 'h5', className: 'modal-title col-10', textContent: 'Note 공개/비공개' },
						{ el: 'button', type: 'button', className: 'btn-close', 'data-bs-dismiss': 'modal', ariaLabel: 'Close' }
					]},
					{ el: 'div', className: 'modal-body', children: [
						{ el: 'p', children: [
							'다른 회원들에게 작성한 노트를 ', { el: 'b', textContent: '공개할지 여부'}, '를 설정할 수 있습니다.', { el: 'br' },
							{ el: 'b', textContent: '비공개'}, ' 노트는 ', {el: 'b', textContent: '개인적인 메모' }, ' 등으로 활용할 수 있으며', { el: 'br' },
							{ el: 'b', textContent: '공개'}, ' 노트는 ', {el: 'b', textContent: '판매 목적' }, '의 워크북에서 활용할 수 있습니다.'
						]},
						{ el: 'p', children: [
							'노트를 충분히 작성을 하면 ', { el: 'b', textContent: '워크북의 품질' }, '이 올라가게 되어 다른 회원들이 ', 
							{ el: 'b', textContent: '구매할 확률' }, '이 높아집니다.'
						]}
					]}
				]}
			]}
		]
	},
	{
		el: 'div', className: 'check-modal-section modal fade', tabIndex: '-1', id: 'check-modal', children: [
			{ el: 'div', className: 'modal-dialog modal-dialog-centered', children: [
				{ el: 'div', className: 'modal-content border-0', children: [
					{ el: 'div', className: 'modal-header bg-fc-purple', children: [
						{ el: 'h5', className: 'modal-title text-white col-10', textContent: '평가 감사합니다.'},
						{ el: 'button', type: 'button', className: 'btn-close', 'data-bs-dismiss': 'modal', ariaLabel: 'Close' }
					]},
					{ el: 'div', className: 'modal-body', children: [
						{ el: 'p' }
					]},
					{ el: 'div', className: 'modal-footer justify-content-center', children: [
						{ el: 'button', type: 'button', className: 'btn btn-outline-fico', 'data-bs-dismiss': 'modal', textContent: '취소' },
						{ el: 'button', type: 'button', className: 'btn btn-fico status-submit', textContent: '제출' }
					]
					}
				]}
			]
			
			}
		]
	}]))
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
			
			if(referrerPath.includes('/workbook/passage/add')
			|| referrerPath.includes('/workbook/passage/new')) {
				// passageId 추가
				if(!passageIdList.includes(passageId)) {
					passageIdList.push(passageId);
					sessionStorage.setItem('passageIdList', JSON.stringify(passageIdList));
				}
				// 지문 추가에서 왔을 경우 모든 수정 관련 버튼 표시
				if(passageIdList.length < 30) $('#addPassageBtn').show();
			}else if(referrerPath.includes('/workbook/mybook/edit')) {
				// 워크북 수정, 지문 수정에서 왔을 경우 '지문추가'버튼 빼고 표시
				$('#addPassageBtn').remove();
			}
		} catch (error) {
			$('#addPassageBtn, #editPassageBtn, #editWorkbookBtn').remove();
		}
	}
	

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
		if($(this).siblings('.edit-block').length > 0)
			$(this).add($(this).siblings('.edit-block')).collapse('toggle');
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
			$(titleSection).find('.display-block').collapse('show').find('.passage-title-text').text(passageTitle||'제목 없음');
		}, () => alertModal('지문 제목 수정 중 오류가 발생했습니다.'));
		//-----------------------------------------------
	}).on('click', '.js-cancel-ptitle', function() {
		const titleSection = this.closest('.passage-title-block');
		const $title = $(titleSection).find('.display-block').collapse('show').find('.passage-title-text');
		$(titleSection).find('.edit-block').collapse('hide').find('.title-input').val($title.text());
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
		const $addSection = $(this).closest('.add-section');
		const $textInput = $addSection.find('.text-input');
		const content = $textInput.val().trim();
		const publicOpen = $addSection.find(':checkbox').is(':checked');
		if(content.length == 0) return;
		
		// 지문 노트 추가(ajax)--------------------------------------------------
		addPassageNote({workbookId, passageId, memberId, content, publicOpen}, appendNote);
		//--------------------------------------------------------------------
		
		function appendNote(note) {
			note['memberInfo'] = {memberId, alias: memberAlias};
						   //------------------
			const $block = createNoteDOM(note);
						   //------------------
			const $noteList = $addSection.closest('.note-section').find('.note-list').show();
			$block.prependTo($noteList);
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
	$('.js-add-passage-qna-btn').click(function() {
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
	});
	
/* ------------------------------- 문장 관련 ---------------------------------- */	

	if(isMobile) {
		$('.one-sentence-unit-section').addClass('swiper-slide')
		.parent().addClass('swiper-wrapper')
		.parent().addClass('swiper');
	}
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
		
		if(!isMobile) {
			// 접기/펼치기 설정
			$sectionClone.find('.removable-section').addClass('collapse');
			$sectionClone.on('click', '.origin-sentence-section', function(e) {
				if(e.target.closest('[class*="js-tts"]')) return;
				$sectionClone.children('.collapse').collapse('toggle')
			});
		}
		
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
		$sectionClone.find('.origin-sentence').append(createElement(
			[
				{ el: 'span', className: 'numbering-text print-removed', textContent: (i + 1) },
				{ el: 'span', className: 'sentence-text', textContent: sentence.text },
				isMobile ? '' :
				{ el: 'div', className: 'd-inline-block', children: [
					{ el: 'button', type: 'button', className: 'btn text-fc-purple ms-2 p-0 material-icons-outlined border-0 fs-3 js-tts-play-sentence', 
						'data-bs-toggle': 'tooltip', title: '재생/중지', 'data-playing': 'off', textContent: 'play_circle'
					}
				]}
			]
		))
		// 2. SVOC 표시------------------------------------------------
		const text = sentence.text, svocList = sentence.svocList,
			svocListLen = svocList?.length;
		// 구문분석 접기 버튼 추가. 2개 이상의 분석이 있으면 접기
		$sectionClone.find('.js-collapse-svoc').toggle((svocListLen > 1));

		if(isMobile) {
			$sectionClone.find('.result-semantic-section').append(createElement(svocMenuSectionJson))
						.find('.js-open-dashboard').attr('data-bs-target', `#sentence${i+1} .dashboard-section`);
		}
		
		for(let j = 0; j < svocListLen; j++) {
			
			let svocTag = svocList[j];
			const $svocBlock = $(createElement(svocSectionJson));
			$svocBlock.appendTo($sectionClone.find('.result-semantic-section'));
			tandem.showSemanticAnalysis(text, svocTag.svocBytes, $svocBlock.find('.svoc-block'))
			.then(div => {
				$(div).data('svocId', svocTag.svocId)
						.data('memberId', svocTag.memberId);
				$svocBlock.find('.writer-section')
						.find('.personacon-alias').text(svocTag.writerAlias);
				if(!isMobile) $svocBlock.find('.writer-section')
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
		$sectionClone.find('.dashboard-section .meta-status')
			.text({'S':'🥳','F':'🤯'}[sentence.metaStatus]||'🤔')
			.attr('title',{'S':'평가를 받은 문장이예요.','F':'분석이 틀렸대요.'}[sentence.metaStatus]||'아직 평가되지 않은 문장이예요.')
			
		// 4. 해석 표시 
		
		const korList = sentence.korList;
		if(korList != null && korList.length > 0) {
			const korListLen = korList.length,
				// PC면 .sentence-ext-section 안의 블럭을, 모바일이면 그 밖의 블럭을 선택
				$aiTransSection = $sectionClone.find('.ai-translation-section')
					.filter((_i,s)=> isMobile ^ (s.closest('.sentence-ext-section') != null)).show().empty();
			
			// PC에서 해석 블럭은 접고 펼치기 기능 없음
			if(!isMobile)
				$transCopyBlock.removeClass('collapse');
				
			for(let j = 0; j < korListLen; j++) {
				const $transBlock = $transCopyBlock.clone();
				const korTrans = korList[j];
				$aiTransSection.append($transBlock);
				$transBlock.data('korTid', korTrans.korId);
				
				if(korTrans.alias != 'Translator') {
					$transBlock.addClass('user-trans').find('.translator').text(` ${korTrans.alias}`);
				}else {
					$transBlock.addClass('ai-trans');
				}
				$transBlock.find('.translation-text').text(korTrans.kor);
				if(memberId == korTrans.memberId) {
					$transBlock.append(createElement(transModifyBtnsJson));
				}
			}
			// 모바일에서 각각의 해석 블럭에 접고 펼치기가 적용돼있는데, 기본으로 펼쳐두고 접힐 때는 맨 위에 하나 남기도록
			if(isMobile) {
				$aiTransSection.closest('.translation-section').find('.open-kor-btn').addClass('active');
				$aiTransSection.find('.ai-translation-block').collapse('show');
			}
		}
		// 5. 단어 표시 
		const wordList = sentence.wordList;
		if(wordList != null && wordList.length > 0) {
			const wordListLen = wordList.length,
				$wordSection = $sectionClone.find(`${isMobile?'.collapse-section .word-section':'.sentence-ext-section .word-section .one-block'}`).empty();
			
			for(let j = 0; j < wordListLen; j++) {
				const word = wordList[j], $wordBlock = $wordCopySection.clone();
				$wordBlock.find('.one-part-unit-section').remove();
				
				// 단어의 품사별 뜻 표시
				$wordSection.append($wordBlock);
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
					$partBlock.find('.part').text(sense.partType);
					$partBlock.find('.meaning').text(sense.meaning);
				}
			}
			// 데스크탑에서는 단어리스트 미리 표시
			if(!isMobile)
				$sectionClone.find('.nav-link[data-type="word-list"]').tab('show');
		}
		
	}
	// 모바일용 인터페이스 정의
	if(isMobile) {
		const swipeHappened = localStorage.getItem('fico-swipe-happened');
		if(!swipeHappened) {
			$('#loadingModal').on('hidden.bs.modal', function() {
				setTimeout(() => {
					$('.swipe-intro').show();
					setTimeout(() => $('.swipe-intro').remove(), 2000);
				}, 1000);
			})
		}
		let scrollDirectionPrev = 0;
		let lastScrollTop = $('.view-passage-section')[0].scrollTop;
		const $topMenu = $('.workbook-menu-section');
		$('.view-passage-section').css('overflow','auto').css('height','100vh').on('scroll', function() {

			
			const scrollDirectionNow = this.scrollTop > lastScrollTop ? 1 : -1;
			lastScrollTop = this.scrollTop;
			
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
		
		var swiper = new Swiper('.swiper', {
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
					const headerIntersectionObserber = new IntersectionObserver((entries) => {
						anime({targets: $topMenu.get(0), duration: 150, easing: 'linear', 
							translateY: entries[0].intersectionRatio > 0 ? 0 : '-7rem'});
					}, { rootMargin: `-${7*rem}px 0px ${0*rem}px 0px`});
					headerIntersectionObserber.observe($('.workbook-cover-section').get(0));
					
					const slideResizeObserver = new ResizeObserver((entries) => {
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
					if(tts.autoEnabled()) {
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
					
					if(!swipeHappened) localStorage.setItem('fico-swipe-happened', true);
					
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
		
		$(document)
		.on('click', '#js-mobile-menu .sentence-link', function() {
			$('#js-mobile-menu .mobile-menu-section,#js-mobile-menu .passage-sentence-nav').collapse('toggle')
			swiper.slideTo($(this).index())
		})
		.on('show.bs.collapse hide.bs.collapse', '#js-mobile-menu .passage-sentence-nav', function(e) {
			if(e.target != this) return;
			$('#js-mobile-menu .js-toggle-menu').animate(e.type == 'show' ? {rotate: '180deg'} : {rotate: '0deg'});
			$('#js-mobile-menu').css('transform', 'translateY(0)');
			// 현재 슬라이드에 해당하는 문장에 포커스 이동.
			if(e.type == 'show') $('.passage-sentence-nav .sentence.active')[0].scrollIntoView();
		})
		.on('show.bs.collapse', '.collapse-section .note-section', function() { collapseNote($(this))})
		// 단어목록을 누르면 한 줄 공간 남기고 축소
		.on('click', '.word-list-section', function() {
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
		//$($results.data('flickity').selectedElement).trigger('select.flickity')//.find('.note-section').collapse('show');
	}
	// [모든 문장 렌더링 완료 - 로딩 이미지 제거]----------------------------------------
	$('#loadingModal').on('hidden.bs.modal', function() {
		$('.full-text').show(() => {
		
			// 검색어(문장)이 있을 경우 해당 문장으로 이동
			const querySen = new URLSearchParams(location.search).get('senQuery')
			if(querySen) {
				if(isMobile) {
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
	.on('click', '#toggle-all-btn', function(e) {
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
				let textBlock = isMobile ? swiper.slides[swiper.activeIndex].querySelector('.sentence-text')
					: playBtn.closest('.origin-sentence').querySelector('.sentence-text');
				textBlock.classList.add('tts-playing');
				tts.speakRepeat(textBlock.textContent, 2, 500, () => {
					textBlock.classList.remove('tts-playing');
					playBtn.dataset.playing = 'off';
					playBtn.textContent = 'play_circle';
				});
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
		$fingerSection.append('<i class="position-relative start-50 fas fa-3x fa-spinner fa-pulse translate-middle-x"></i>');
		$fingerSection.find('.empty-list').hide();
		const sentenceId = $(this).closest('.one-sentence-unit-section').data('sentenceId');
		$.getJSON(`/workbook/search/finger/${ntoa(sentenceId)}`, (fingerList) => {
			if(fingerList != null && fingerList.length > 0) {
				$fingerSection.empty();
				const fingerListLen = fingerList.length;
				
				for(let j = 0; j < fingerListLen; j++) {
					const finger = fingerList[j], $fingerBlock = $(createElement(fingerSectionJson));
					$fingerSection.append($fingerBlock);
					$fingerBlock.data('sentenceId', finger.sentenceId)
								.find('.sentence-text').text(finger.eng);
				}
			}else {
				$fingerSection.find('.empty-list').show();
				$fingerSection.find('.fa-spinnner').remove();
			}
			$(this).removeClass('loading').addClass('loaded');
		}).fail(() => {
			alertModal('인덱스 핑거 조회에 실패했습니다.');
			$fingerSection.find('.empty-list').show();
			$fingerSection.find('.fa-spinnner').remove();
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
		if(isMobile) scrollTo(scrollX, $(this).offset().top - visualViewport.height / 2 + this.offsetHeight / 2)
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
	$(document).on('click', isMobile?'div:not(.edit-svoc)>.semantics-result':'.js-collapse-svoc', function(){
		const $sentenceSection = $(this).closest('.one-sentence-unit-section');
		$sentenceSection.find('.result-semantic-section .collapse').collapse('toggle');
		$sentenceSection.find('.js-collapse-svoc').toggleClass('expanded');
	})
	
	// [분석 결과 평가]------------------------------------------------------------
	const checkModalContents = {'S': '<b>평가를 하는 이유</b><br><br>A.I.는 인간의 언어를 이해하면서 분석하지 않습니다.<br>학습자들에게 도움이 될 수 있도록 분석 결과를 평가해주세요.<br>평가도 하고 다양한 fico Egg도 모아보세요.',
								'F': '<b>AI 분석이 정확하지 않은가요?</b><br><br>그건 회원님이 AI보다 실력이 좋다는 증거입니다.<br>직접 수정할 수도 있고 그냥 내버려 둘 수도 있습니다.<br>실력 발휘 기대합니다.'};
	const resultStatusMap = {'S': {icon: '🥳', status: 'S', tooltip: '평가를 받은 문장이예요.'},
							'F': {icon: '🤯', status: 'F', tooltip: '분석이 틀렸대요.'} };
	
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
			metaStatusCallback($statusIcon, resultStatusMap[metaStatus]);
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
					$statusIcon.text(resultStatus.icon).attr('data-bs-original-title', resultStatus.tooltip);
					contentChanged = true;
				}
			},
			complete: function() {
				$statusIcon[0].style.transform = '';
			}
		})
	}
	
	// [분석 결과 추가/편집]--------------------------------------------------------
	$(document).on('click', '.js-add-svoc, .js-edit-svoc', async function() {
		let forNew = $(this).is('.js-add-svoc');
		$('.js-add-svoc').prop('disabled', true);
		
		const $sentenceSection = $(this).closest('.one-sentence-unit-section');
		let $semantics = null;
		if(forNew) {
			// 분석 추가일 경우 최상위 분석을 복사한 폼을 생성
			let $newSection = $(createElement(svocSectionJson)).addClass('new-svoc-form');
			
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
			if(isMobile) {
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
			$semantics = $('.semantics-result[data-seq="' + this.dataset.seq + '"]');
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
			const sentenceId = Number($semantics.closest('.one-sentence-unit-section').data('sentenceId'));
			const svocId = Number($semantics.data('svocId') || 0);
			const svocCommand = {sentenceId, workbookId, passageId, ownerId, memberId, encSvocText: svocText};
			
			if(memberId == Number($semantics.data('memberId')) && svocId > 0) {
				svocCommand.svocId = svocId;
			}
			// 편집 저장(ajax)-------------------
			editSvoc(svocCommand, successSave);
			// --------------------------------
			// gramMeta도 같이 저장(ajax)---------------------------------------
			window['tandem']?.meta?.saveGramMetaFromDOM(sentenceId, $semantics[0], true, 'workbook');
			// --------------------------------------------------------------
			metaStatusCallback($semantics.closest('.one-sentence-unit-section').find('.meta-status'),resultStatusMap['S']);
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
		}
		
		// 편집 취소(분석 조작 버튼 재활성화, 신규 추가폼 삭제)
		function cancelCallback() {
			$('.js-add-svoc').prop('disabled', false);
			if(forNew) {
				$semantics.closest('.new-svoc-form').remove();
			}else {
				$semantics.closest('.svoc-section').find('.svoc-mdf-btns').show();
			}
		}
	})
	// [구문분석 삭제]-------------------------------------------------------------
	.on('click', '.js-del-svoc', function() {
		const $result = $('.semantics-result[data-seq="' + this.dataset.seq + '"]');
		const $sentenceSection = $result.closest('.one-sentence-unit-section');
		const svocId = Number($result.data('svocId'));
		if(confirm('삭제하시겠습니까?')) {
			// 구문분석 삭제(ajax)-------------
			delSvoc(svocId, successDelSvoc);
			//------------------------------
		}
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
	});
	
	// [프린트 버튼 클릭]------------------------------------------------------
	/* $(".js-print-button").click(function(){
		printPreview({
			template: $('#printTemplate')[0],
			obj2print: '.one-sentence-unit-section',
			width: window.outerWidth,
			height: window.outerHeight,
			style: '<style>:root{font-size:12px;}</style>'
		});
	}); */

	// [그래프 영역 펼치고 접기]------------------------------------------------------
	/* $(".token-tree-section .btn-area").click(function(){
		$(this).closest(".token-tree-section").find(".result-token-tree").toggle();
	}); */
	
	// [나의 해석 수정]------------------------------------------------------------
	const $transEditor = $(createElement(transEditorJson));
	$(document).on('click', '.js-edit-trans-open', function(){
		$transEditor.hide();
		let $transBlock = $(this).closest('.ai-translation-block');
		// 추가일 경우
		if(this.matches('.add-btn')){
			$(this).hide();
			$transEditor.data('mode','add').find('.text-input').val(null);
			$(this).closest(isMobile ? '.translation-section' : '.kor-list-section').find('.ai-translation-section').prepend($transEditor);
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
		const $transSection = $(_this).closest(isMobile ? '.translation-section' : '.kor-list-section');
		let jsonCommand = {sentenceId, memberId, kor};
		// 해석 수정이면 korTid 필요
		if($transEditor.data('mode') == 'edit'
		&& $transBlock.data('korTid') != null) {
			jsonCommand.korTid = Number($transBlock.data('korTid'));
		}
		if(kor.length == 0) return;
		// 문장 해석 추가/수정(ajax)-------------------------
		editSentenceTrans(jsonCommand, successEditTrans);
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
				$newTrans.append(createElement(transModifyBtnsJson));
				
				$transSection.find('.ai-translation-section').prepend($newTrans);
				$transSection.find('.add-btn').show(300);
				$newTrans.addClass('show');
				if(isMobile && !$transSection.find('.open-kor-btn').is('.active')) {
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
		}else $transEditor.closest(isMobile ? '.translation-section' : '.kor-list-section').find('.add-btn').show(300);
	})
	// [나의 해석 삭제]------------------------------------------------------------
	.on('click', '.js-del-trans', function(e){
		e.stopPropagation();
		e.stopImmediatePropagation();
		const $transBlock = $(this).closest('.ai-translation-block');
		if(confirm('삭제하겠습니까?')){
			// 문장 해석 삭제(ajax)----------------------------------------------
			delSentenceTrans(Number($transBlock.data('korTid')), successDel);
			// ---------------------------------------------------------------
		}
		
		function successDel() {
			alertModal('삭제되었습니다.');
			if($transBlock.closest('.translation-section').find('.open-kor-btn').is('.active')) {
				$transBlock.nextAll('.ai-translation-block')?.collapse('show');
			}else $transBlock.next('.ai-translation-block')?.collapse('show');
			$transBlock.fadeOut(300, () => $transBlock.remove());
		}
	})
	// [인덱스 핑거 추가정보 열기/닫기]-------------------------------------------------
	.on('click', '.js-finger-detail', async function() {
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
			$fingerBlock.find('.sentence-text, .trans-block, .svoc-block').toggle(300);
		}
		
		// 불러온 구문분석과 해석을 표시.
		async function viewFingerDetails(sentence) {
			$fingerBlock.find('.sentence-text').hide();
			
			await tandem.showSemanticAnalysis(sentence.eng, sentence.svocBytes, $fingerBlock.find('.svoc-block').show());
			
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
		const $sentenceSection = $(this).closest('.one-sentence-unit-section'); 
		const sentenceId = Number($sentenceSection.data('sentenceId'));
		const $addSection = $(this).closest('.add-section');
		const content = $addSection.find('.text-input').val().trim();
		const publicOpen = $addSection.find(':checkbox').is(':checked');
		if(content.length == 0) return;
		
		// 문장 노트 추가(ajax)----------------------------------------------------
		addSentenceNote({workbookId, sentenceId, memberId, content, publicOpen}, appendNote);
		//----------------------------------------------------------------------
		
		function appendNote(note) {
			note['memberInfo'] = {memberId, alias: memberAlias};
			const $noteList = $sentenceSection.find('.note-section>.note-list');
			 			   //------------------
			const $block = createNoteDOM(note);
						   //------------------
			$block.prependTo($noteList);
			$addSection.find('.text-input').val('').summernote('destroy');
			$addSection.hide(300, function() {
				const $noteSection = $addSection.closest('.note-section');
				$noteSection.find('.add-icon').prop('disabled', false);
				$noteSection.find('.empty-list').hide();
			})
		}
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
		const publicOpen = $textSection.find('.open-input').is(':checked');
		const content = $textSection.find('.text-input').val().trim();
		const jsonCommand = {noteId, workbookId, memberId, content, publicOpen}
		const $sentenceSection = $textSection.closest('.one-sentence-unit-section');
		const ofWhat = ($sentenceSection.length > 0) ? 'sentence' : 'passage';
		
		if(content.length == 0) return;
		// 문장 노트일 경우
		if($sentenceSection.length > 0) {
			jsonCommand.sentenceId = Number($sentenceSection.data('sentenceId'));
		}// 지문 노트일 경우
		else {
			jsonCommand.passageId = passageId;
		}

		// 노트 수정(ajax)-------------------------------
		editNote(ofWhat, jsonCommand, successEditNote);
		// --------------------------------------------
		
		function successEditNote(note) {
			if($noteSection.closest('.collapse-section').length > 0) {
				$noteSection.find('.note').toggleClass('overflow-hidden mb-4');
			}
			$textSection.find('.note-editor').hide();
			$textSection.find('.open-input').prop('checked', note.publicOpen);
			$textSection.find('.note-text').html(note.content).show();
			$noteSection.find('.updatedate').text(new Date().toLocaleDateString());
			$noteSection.find('.note-mdf-btns, .updatedate').show();
		}
	})
	// [지문/문장의 노트 삭제]-------------------------------------------------------
	.on('click', '.js-delete-note', function() {
		if(confirm('삭제하시겠습니까?')){
			// 노트 삭제
			const $noteBlock = $(this).closest('.note-block'),
				$noteSection = $noteBlock.closest('.note-section'),
				noteId = Number($noteBlock.data('noteId')),
				$sentenceSection = $noteBlock.closest('.one-sentence-unit-section'),
				ofWhat = ($sentenceSection.length > 0) ? 'sentence' : 'passage';
			
			// 노트 삭제(ajax)--------------------
			delNote(ofWhat, noteId, delCallback);
			// ---------------------------------
			function delCallback() {
				$noteBlock.fadeOut(function() {
					$(this).remove();
					if($noteSection.find('.note-block').length == 0){
						$noteSection.find('.empty-list').show();
					}
				})
			}
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
	// [지문/문장 노트 공개여부 메세지 토글]
	.on('input', '.open-input', function() {
		this.nextSibling.data = this.checked ? '회원들과 노트를 공유합니다.'
											: '노트를 비공개로 보관합니다.'
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
		const $unitSection = $(this).closest('.one-sentence-unit-section');
		const eng = $unitSection.find('.origin-sentence .sentence-text').text().trim();
		const sentenceId = $unitSection.data('sentenceId');
		confirmModal('<img class="align-baseline" src="https://static.findsvoc.com/images/icons/ssamnote.png" style="width: 5rem;">를 신청하시겠습니까?', function() {
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
				}
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
		const translations = Array.from($sentenceSection.find('.ai-translation-block'), transBlock => {
			return {id: $(transBlock).data('korTid'), text: transBlock.querySelector('.translation-text').textContent}
		})
		if(this.querySelector('.battle-section-panel') == null) {
			craft.openBattleMakerPanel(this,
				memberId,
				$sentenceSection.data('sentenceId'), 
				$sentenceSection.find('.semantics-result')[0],
				translations);
		}
	})
	
/* ------------------------------ Embed functions --------------------------- */
	// 노트 정보를 DOM으로 생성
	function createNoteDOM(note) {
		const block = createElement(noteSectionJson);
		if(isMobile) block.querySelector('.note').classList.add('overflow-hidden');
		block.dataset.noteId = note.noteId;
		// 내용
		block.querySelector('.note-text').innerHTML = note.content;
		// 날짜
		block.querySelector('.updatedate').textContent = new Date(note.updateDate||new Date()).toLocaleDateString();
		// 본인 것이 아니면 수정버튼 삭제
		if(memberId != note?.memberInfo?.memberId) {
			block.querySelector('.note-mdf-btns').remove();
		}else {
			const input = block.querySelector('.note-editor .open-input');
			input.checked = note.publicOpen;
			$(input).trigger('input');
		}
		block.querySelector('.personacon-section .alias').textContent = note?.memberInfo?.alias;
		return $(block);
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
}
/* 타이머 */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
