/** /workbook/view_passage.html
 @author LGM
 */
 async function pageinit(memberId, memberAlias, memberImage, memberRoleType, workbookId, ownerId, priorityId, passageId, sentenceList) {
	if(history.length == parseInt(sessionStorage.getItem('historyLength'))) {
		alert('비정상적 접근입니다.');
		sessionStorage.removeItem('historyLength');
		location.replace('/');
	}else sessionStorage.setItem('historyLength', history.length);
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
		'NP.' : '명사구', 'phrasal-v.': '구동사', 'VP.' : '동사구', 'PP.': '전치사구', 'ADP.': '부사구', 'AJP.': '형용사구', 'IP.': '관용어', 'CP.': '연어'
	}

	// 페이지를 떠나면 떠있는 로딩모달(분석중임을 알리는 모달)을 닫는다.
	$(window).on('unload', () => $('#loadingModal').modal('hide'));
	
	// 현재 페이지에서만 로고에 글래스 효과 추가 
	$('.workbook-menu-section').find('.logo-link-section').addClass('glass-effect');
	
	
	// 모바일이 아니거나 화면회전 기능을 지원하지 않으면 화면회전 버튼 삭제
	if(!/Mobi/.test(navigator?.userAgent) || !screen.orientation ) {
		$('.js-rotate-btn').remove();
	}
/* ------------------------------- 지문 관련 ---------------------------------- */
	
	// [지문의 문장 클릭 시 해당 문장의 블럭으로 이동]------------------------------------
	$('.sentence-link').one('click',function _aa() {
		$('.sentence-link').off('click', _aa).not(this).addClass('pe-none opacity-50');
		
		const i = $(this).index('.sentence-link');
		const sentence = sentenceList[i];
	//	$results.append(createElement(sentenceViewer.completeSentenceSection(sentence, i)));
		
		$.getJSON(`/sermes/count/update/${sentence.sentenceId}`);
		
		let $sectionClone = $('.one-sentence-unit-section:eq(0)');
		// 문장 Id 설정
		$sectionClone.data('sentenceId', sentence.sentenceId).attr('id','sentence' + (i+1))
					.data('metaEvaluated', ['S','F'].includes(sentence.metaStatus))
					.find('.origin-sentence-section')
		$sectionClone.find('.removable-section').collapse('show');
		
		// 단어/노트/배틀 접고 펼치기
		
		$sectionClone.find('.collapse-btn').each(function() {
			this.dataset.bsTarget = `#sentence${i+1} ${this.dataset.collapseSelector}`;
		})
		
		// 1. 원문 표시--------------------------------------------------------
		$sectionClone.find('.origin-sentence').append($(WORKBOOK_ELEMENTS).children('.origin-sentence-container').clone(true).children())
		.find('.sentence-text').text(sentence.text);
		$sectionClone.find('.numbering-text').remove();
			
		// 2. SVOC 표시------------------------------------------------
		const text = sentence.text, svocList = sentence.svocList;

		$sectionClone.find('.result-semantic-section').append($(WORKBOOK_ELEMENTS).children('.svoc-menu-section').clone(true))
					.find('.js-open-dashboard').attr('data-bs-target', `#sentence${i+1} .dashboard-section`);
		
			let svocTag = svocList[0];
			const $svocBlock = $(WORKBOOK_ELEMENTS).children('.svoc-section').clone(true);
			$svocBlock.appendTo($sectionClone.find('.result-semantic-section'));
			tandem.showSemanticAnalysis(text, svocTag.svocBytes, $svocBlock.find('.svoc-block'))
			.then(div => {
				$svocBlock.find('.writer-section').empty().append($('#hiddenDivs').find('.help-icon,.tip-icon,.js-rotate-btn').clone());
				
				let $mdfBtns = $svocBlock.find('.svoc-mdf-btns');
				$mdfBtns.find('[data-seq]').attr('data-seq', div.dataset.seq);
				if(memberId != svocTag.memberId) {
					$mdfBtns.remove();
				}
			});
		
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
			// 구 형태의 어휘가 있으면 has-user-vocas 클래스 추가
			$wordSection.closest('.word-list-section').toggleClass('has-user-vocas', wordList.some(w => w.senseList.some(s=>/[A-Z]|phrasal-v/.test(s.partType))));
			
			for(let j = 0; j < wordListLen; j++) {
				const word = wordList[j], $wordBlock = $wordCopySection.clone();
				
				// 구 형태의 파트타입을 가지면 user-vocas-word 클래스 추가
				$wordBlock.toggleClass('user-vocas-word', word.senseList.some(s=>/[A-Z]|phrasal-v/.test(s.partType)))
				
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
		// 인덱스 핑거 표시
			let $fingerSection = $sectionClone.find('.related-list').addClass('loading position-relative show')
			$fingerSection.append('<i class="loading-icon w-auto offset-6 text-center fa-2x fas fa-spin fa-circle-notch text-fc-purple"></i>');
			$fingerSection.find('.empty-list').hide();
			const sentenceId = $sectionClone.data('sentenceId');
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
				$fingerSection.removeClass('loading').addClass('loaded');
			}).fail(() => {
				alertModal('인덱스 핑거 조회에 실패했습니다.');
				$fingerSection.find('.empty-list').show();
				$fingerSection.find('.loading-icon').remove();
				$fingerSection.removeClass('loading').addClass('loaded');
			});
			setTimeout(() => $('.result-section')[0].scrollIntoView(), 500);
	});
	// [지문 타이틀 수정]-----------------------------------------------------------

	
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
	$(document).one('click', '.origin-sentence-section', function __a(e) {

	});	

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
	.one('click', '#js-mobile-menu .sentence-link', function() {
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
	
	$(document)
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

/* -------------------------------- 지문/문장 공통------------------------------ */
	
	// [지문/문장의 노트 수정 폼 열기]-------------------------------------------------

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
							const $wordListSection = $wordSection.closest('.word-list-section');
							$wordListSection.toggleClass('has-user-vocas', $wordListSection.find('.part').get().some(p => /[A-Z]|phrasal-v/.test(p.textContent)));
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
}
/* 타이머 */
//const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
