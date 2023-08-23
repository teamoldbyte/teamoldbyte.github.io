/**
 * 
 */
async function pageinit(keepWordList, totalCount) {
	const tts = new FicoTTS();
	const progressCircle = document.querySelector(".autoplay-progress svg");
	const progressContent = document.querySelector(".autoplay-progress span");
	
	let HTML_TEMPLATE = await $.get('https://static.findsvoc.com/fragment/memento/auto_play.min.html', jQuery.noop, 'html');
	//let HTML_TEMPLATE = await $.get('/fragment/memento/auto_play.html', jQuery.noop, 'html');
	const LOCAL_STORAGE_CONFIG_KEY = 'MementoAutoPlayConfigs';
	const configs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY)||'{}');
	
	// TTS 자동재생여부
	let ttsAutoplay = configs.ttsAutoplay??true;
	/** 슬라이드/TTS 정지상태 */
	let paused = true;
	/* 문장 자동조회 여부 */
	let sentenceAutoLoad = configs.sentenceAutoLoad??true;
	/* 마지막 슬라이드가 끝나면 첫 슬라이드부터 재생 */
	let stopOnLastSlide = configs.stopOnLastSlide??true;
	/* 슬라이드 자동넘김 여부*/
	let autoplay = configs.autoplay??false;
	/* 슬라이드 자동넘김 시간 간격(ms) */
	let autoplayDelay = configs.autoplayDelay??10000;
	let swiperInstance, keepWordIds = [];


	if((keepWordList??[]).length == 0) {
		alertModal('학습할 단어가 없습니다.<br>내가 작성하거나 구독한 <b>워크북에서</b><br>학습이 필요한 단어를 <b>보관</b>해 보세요.<br><br>이전 화면으로 돌아갑니다.',
			() => history.back());
		$('.operation-section').addClass('pe-none opacity-50');
		return;
	}
	$('.swiper-wrapper').append(createSlideDOMList(keepWordList));
	// START
	$('#startAutoPlay, .cover-before-play').on('click', function() {
		$('#startAutoPlay').prop('disabled', true).tooltip('hide');
		$('#finishAutoPlay').prop('disabled', false);
		$('.cover-before-play').hide();
		
		// 모바일 시작종료 버튼 토글
		$('.autoplay-top-mobile-menu .start-btn').toggleClass('start-btn finish-btn')
		.find('.fas').toggleClass('fa-play fa-pause');
		
		// 모바일에서 숨겨놓은 하단 영어 예문 영역 보이기 
		$('.example-sentence-section, .options-cover').show();
		
		swiperInstance = new Swiper('.swiper', {
			centeredSlides: true,
			spaceBetween: '20%',
			autoHeight: true,
			autoplay: autoplay? {
				disableOnInteraction: false,
				stopOnLastSlide,
				delay: autoplayDelay
			} : false,
			pagination: {
				el: ".swiper-pagination",
				clickable: true
			},
			navigation: {
				nextEl: ".swiper-button-next",
				prevEl: ".swiper-button-prev"
			},
			on: {
				afterInit(s) {
					/* 좌우 내비게이션 및 페이지네이션 숨김 해제*/
					$(s.pagination.el).show();
					$(s.navigation.nextEl).add(s.navigation.prevEl).show();
					
					/* 팁 메세지 랜덤 선택 */
					const tipIndex = [0,1,2].toSorted(() => Math.random() - 0.5)[0];
					const $slide = $(s.slides[s.activeIndex]);
					$slide.find('.js-view-sentence .cover-text').each((i,el) => {
						$(el).toggle(i == tipIndex);
					});

					if(keepWordIds.length == 0)
						keepWordIds.push(parseInt(s.slides[0].dataset.keepWordId));
					
					
					paused = false;
					if(ttsAutoplay || autoplay) {
						$slide.find('.js-pause')
						.addClass('fa-pause').removeClass('fa-play');
					}
					if(ttsAutoplay)
						playWordTitle($slide.find('.word-unit-section .title').text().trim(), $slide.find('.js-pause'));
					
					if(sentenceAutoLoad) {
						$slide.find('.js-view-sentence:visible').click();
					}
				},
				autoplayTimeLeft(s, time, progress) {
					if(!s.enabled) return;
					if(time <= 0) {
						if(autoplay && (!s.isEnd || !stopOnLastSlide)) {
							s.slideNext();
						}else {
							/*console.log(time,progress)
							s.autoplay.timeLeft = 0;
							paused = true;
							progressContent.textContent = '0s';
							tts.stop(() => $(s.slides[s.activeIndex]).find('.js-pause').removeClass('fa-pause').addClass('fa-play'));*/
							$('#finishAutoPlay').trigger('click');
						}
						return;
					}
					progressCircle.style.setProperty("--progress", 100 - progress);
					progressContent.textContent = `${Math.ceil(time / 1000)}s`;
				},
				beforeSlideChangeStart(s) {
					//s.autoplay.timeLeft = autoplayDelay;
					//s.autoplay.pause();
					tts.stop(() => $(s.slides[s.activeIndex]).find('.js-pause').removeClass('fa-pause').addClass('fa-play'));
				},
				slideChange(s) {
					
					// 예문 팁 랜덤 표시
					const tipIndex = [0,1,2].toSorted(() => Math.random() - 0.5)[0];
					const $slide = $(s.slides[s.activeIndex]);
					$slide.find('.js-view-sentence .cover-text').each((i,el) => {
						$(el).toggle(i == tipIndex);
					})
					// 테스트 단어로 수집
					if(!keepWordIds.includes(parseInt($slide[0].dataset.keepWordId)))
						keepWordIds.push(parseInt($slide[0].dataset.keepWordId));
					// 예문 자동 펼치기
					if(sentenceAutoLoad) {
						$slide.find('.js-view-sentence:visible').click();
					}
				},
				transitionEnd(s) {
					const $slide = $(s.slides[s.activeIndex]);
					const $pauseBtn = $slide.find('.js-pause');
					if(autoplay || ttsAutoplay) {
						$pauseBtn.removeClass('fa-play').addClass('fa-pause');
					}
					if(autoplay) {
						if(s.autoplay.running && s.autoplay.paused)
							s.autoplay.resume();
						else if(!s.autoplay.running){
							s.autoplay.start();
						}
					}
					if(ttsAutoplay) {
						paused = false;
						playWordTitle($slide.find('.word-unit-section .title').text().trim(), $pauseBtn);
					}
					
				}
			}
		});
	});
	
	// FINISH
	$('#finishAutoPlay').on('click', function() {
		endKeepWordId = parseInt(swiperInstance.slides[swiperInstance.activeIndex].dataset.keepWordId);
		$(this).prop('disabled', true).tooltip('hide');
		$('.cover-before-play').show();
		tts.stop();

		$(swiperInstance.pagination.el).hide();
		$(swiperInstance.navigation.nextEl).add(swiperInstance.navigation.prevEl).hide();
		swiperInstance.destroy();
		swiperInstance = null;
		$('#finishModal').modal('show');
		$('#startAutoPlay').prop('disabled', false);
		
		// 모바일 시작종료 메뉴 토글
		$('.autoplay-top-mobile-menu .finish-btn').toggleClass('start-btn finish-btn')
		.find('.fas').toggleClass('fa-play fa-pause');
	})
	// (모바일) 하단 메뉴 접고 펼치기
	let prevY = scrollY, prevDir;
	const mobileConfigSection = $('.mobile-config-section-open-btn-block').get(0);
	$(window).on('scroll', function(e) {
		if(prevDir ^ (prevY < scrollY)) {
			prevDir = prevY < scrollY;
			// 위로 스크롤하면 하단 메뉴 및 펼침버튼 접기
			if(prevY >= scrollY) {
				anime({
					targets: mobileConfigSection,
					translateY: 0,
					duration: 300,
					easing: 'easeOutQuad'
				})
				$('.mobile-config-section-open-btn.active').button('toggle');
				anime({
					targets: '.mobile-config-section-open-btn .fas',
					rotate: '0deg',
					duration: 300,
					easing: 'easeOutQuad',
				})				
			}
			// 아래로 스크롤하면 펼침버튼 보이기
			anime({
				targets: $(mobileConfigSection).find('.mobile-config-section-open-btn').get(0),
				translateY: prevY < scrollY ? 0 : '100%',
				duration: 300,
				easing: 'easeOutQuad'
			})
		}
		prevY = scrollY;
	})
	$('.mobile-config-section-open-btn').on('click', function() {
		const isActive = this.classList.contains('active');
		anime({
			targets: mobileConfigSection,
			translateY: isActive ? '-100%' : 0,
			duration: 300,
			easing: 'easeOutQuad'
		});
		anime({
			targets: '.mobile-config-section-open-btn .fas',
			rotate: isActive ? '180deg' : '0deg',
			duration: 300,
			easing: 'easeOutQuad'
		})
	})
	
	$('#finishModal').on('click', '#goTest', function() {
		if(totalCount < 20) {
			alertModal(`현재 보관된 단어는 총 ${totalCount}개 입니다.\n테스트를 위해 최소 20개의 보관된 단어가 필요합니다.`);
			return;
		}
		document.forms.submitTestForm.submit();
	})
	$('form[name="submitTestForm"]').on('formdata', function(e) {
		keepWordIds.sort();
		e.originalEvent.formData.append('keepWordIds', keepWordIds);
	})
	
	// 문장 조회
	$(document).on('click', '.js-view-sentence', function() {
		$.get(`/memento/kick/autoplay/sentence/${this.dataset.wid}/${this.dataset.sid}`, (eng) => {
			$(this).hide().siblings('.eng').show().html(eng).siblings('.workbook-title').show().siblings('.guide-text').show();
		})
	})
	// 문장 자동 조회 여부
	$('.js-eng-auto-open').on('click', function() {
		sentenceAutoLoad = !$(this).is('.active');
		$(this).toggleClass('active', sentenceAutoLoad);		
	}).toggleClass('active', sentenceAutoLoad);

	// 예문 관련 팁 안보기
	$('#infoNotDisplayCheck').on('click', function() {
		$('.example-eng-info').remove();
	});

	// 모바일에서 시작 시, 팝업 모달 안보기
	const LOCAL_STORAGE_INITIAL_GUIDE_KEY = 'MementoAutoPlayGuideConfirmed';
	const guideConfirmed = JSON.parse(localStorage.getItem(LOCAL_STORAGE_INITIAL_GUIDE_KEY) || 'false');
	if(!guideConfirmed && devSize.isPhone()) {
		$('#startModal').modal('show');
	};
	$('#startModalNotDisplayCheck').on('click', function() {
		localStorage.setItem(LOCAL_STORAGE_INITIAL_GUIDE_KEY, "true");
	})
	
	$(document).on('click', '.example-sentence-section .cover-text', function() {
		$('.example-eng-info').css('scale',0).show();
		anime({
			targets: '.example-eng-info',
			scale: [0,1],
			duration: 800
		})
	});
	
	// 이전 words, 다음 words 조회
	let pageNum = 1;
	$('.js-prev-words,.js-next-words').on('click', function() {
		const prevOrNext = parseInt(this.dataset.pagenum) > pageNum ? 'next' : 'prev'; 
		pageNum = parseInt(this.dataset.pagenum);
		$.getJSON(`/memento/kick/autoplay/${pageNum}`, page => {
			const totalPages = page?.totalPages,
				currPage = page?.number + 1;
			
			// 이전, 다음 버튼 숨김설정
			$('.js-prev-words').toggle(currPage > 1).attr('data-pagenum', currPage - 1);
			$('.js-next-words').toggle(currPage < totalPages).attr('data-pagenum', currPage + 1);
			const slides = createSlideDOMList(page?.content);
			if(swiperInstance) {
				swiperInstance.autoplay.stop();
				swiperInstance.slides.forEach(s=> s.remove());
				swiperInstance.appendSlide(slides);
				$(swiperInstance.pagination.el).hide();
				$(swiperInstance.navigation.nextEl).add(swiperInstance.navigation.prevEl).hide();			
				swiperInstance.destroy();
				tts.stop();
				swiperInstance = null;
				$('#startAutoPlay').prop('disabled', false);
				
				// 모바일 시작종료 메뉴 토글
				$('.autoplay-top-mobile-menu').find('.start-btn,.finish-btn')
				.addClass('start-btn').removeClass('finish-btn')
				.find('.fas').addClass('fa-play').removeClass('fa-pause');
			}else {
				$('.swiper-wrapper').empty().append(slides);
			}
			$('.cover-before-play').show();
		})
	})
	
	// 단어 조회 날짜 선택
	const $dateTestForm = $('form[name="submitDateTestForm"]');
	flatpickr.l10ns.ko.firstDayOfWeek = 1;
	let datePickers = [];
	$('.changeTerm').each((_,btn) => {
		datePickers.push($(btn).flatpickr({
			mode: 'range', locale: 'ko', maxDate: Date.now(), clickOpens: false,
			onChange: (dates) => {
				if(dates.length === 2) {
					confirmModal(`${dates[0].format('yyyy년 MM월 dd일')}부터 ${dates[1].format('yyyy년 MM월 dd일')}까지(${(dates[1].getTime() - dates[0].getTime())/86400000 + 1}일)<br> 테스트를 진행하시겠습니까?`, () => {
						$dateTestForm.data('dateRange', dates)[0].submit();
					})
				}
			}
		}));
	});
	$('.changeTerm').on('click', function(e) {
		datePickers.find(picker => $(picker.element).is(':visible')).toggle();
	});
	$dateTestForm.on('formdata', function(e) {
		const dateRange = $dateTestForm.data('dateRange');
		e.originalEvent.formData.append('from', dateRange[0].format('yyyy-MM-dd'));
		e.originalEvent.formData.append('to', dateRange[1].format('yyyy-MM-dd'));
	})
	
	// 슬라이드 자동넘김 간격
	new bootstrap.Tooltip($('.js-open-slide-interval:visible')[0], {
		trigger: 'click', placement: 'right',
		html: true, title: $('<div class="text-center" style="width:6rem"><label class="form-label">슬라이드<br>재생 간격</label><input type="number" class="js-change-slide-interval form-control pe-0 me-1 d-inline" value="' + (autoplayDelay/1000) + '" style="width:4rem">초</div>')[0]
	});
	$(document)
	.on('shown.bs.tooltip', '.js-open-slide-interval', function() {
		$('.js-change-slide-interval')[0].focus();
	})
	.on('blur', '.js-change-slide-interval', function() {
		$('.js-open-slide-interval').tooltip('hide');
	})
	.on('change', '.js-change-slide-interval', function() {
		autoplayDelay = parseInt(this.value) * 1000;

		if(swiperInstance) {
			swiperInstance.autoplay?.stop();
			swiperInstance.params.autoplay.delay = autoplayDelay;
			swiperInstance.autoplay.timeLeft = autoplayDelay - swiperInstance.autoplay.timeLeft;
			swiperInstance.update();
			swiperInstance.autoplay.start();
		}
	})
	
	// 학습 무기반 테스트 이동
	$('.moveAutoPlayTest').on('click', () => {
		confirmModal('단어 자동모음 테스트를 시작할까요?', () => {
			location.assign('/memento/kick/autoplay/run-test');
		})
	});
	
	// 워드 메멘토 목록 이동 
	$('.moveMementoTrace').on('click', () => {
		confirmModal('보관한 단어 목록으로 이동할까요?', () => {
			location.assign('/memento/trace');
		})
	});

	// 메멘토 테스트 이동
	$('.moveMemento').on('click', () => {
		confirmModal('메멘토 테스트를 시작할까요?', () => {
			location.assign('/memento/kick/autoplay/memento-test');
		})
	})

	// moveWordSelectTest 이동 
	$('.moveWordSelectTest').on('click', () => {
		confirmModal('단어 선택 테스트를 시작할까요?', () => {
			location.assign('/memento/kick/autoplay/mapping-test');
		})
	})
	
	// 단어 보관해제
	$('.unsaveWord').on('click', function() {
		if(!swiperInstance) {
			alertModal('단어학습 중이어야 합니다.')
			return;
		}
		if(!swiperInstance.autoplay.paused)swiperInstance.autoplay.pause();
		confirmModal('지금 보고 있는 단어를 외우셨습니까?', () => {
			const toRemovedIndex = swiperInstance.activeIndex;
			const wordTitle = $(swiperInstance.slides[toRemovedIndex]).find('.word-unit-section .title:eq(0)').text().trim();
			const { keepWordId } = swiperInstance.slides[toRemovedIndex].dataset;
			$.ajax({
				url: '/memento/word/change-status',
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify({keepWordId, del: true}),
				success: () => {
					unsaveFromSessionStorage(keepWordId);
					alertModal(`단어 <b>${wordTitle}</b>를 외웠고, 보관 해제하였습니다.`, () => {
						anime({
							targets: '#delWordCount .num-text',
							rotateX: ['0deg', '720deg'],
							complete: (anim) => {
								const numText = anim.animatables[0].target;
								numText.textContent = parseInt(numText.textContent) + 1;
							}
						})
						if(swiperInstance.slides[toRemovedIndex + 1]) {
							swiperInstance.slideNext();
						}else if(swiperInstance.slides.length > 1) {
							swiperInstance.slidePrev();
						}else {
							tts.stop();
							swiperInstance.autoplay.pause();
						}
						swiperInstance.removeSlide(toRemovedIndex);
					})
				},
				error: () => alertModal('단어 보관 해제에 실패했습니다.')
			});
		}, () => {
			if(!paused) {
				swiperInstance.autoplay.resume();
			}
		})
	})
	
	// 단어 자동 넘김 설정
	$('.js-auto-slidenext').on('click', function() {
		autoplay = !$(this).is('.active');
		$(this).toggleClass('active', autoplay);
		
		if(swiperInstance) {
			if(autoplay) {
				swiperInstance.params.autoplay.delay = autoplayDelay;
				swiperInstance.params.autoplay.disableOnInteraction = false;
				swiperInstance.params.autoplay.stopOnLastSlide = stopOnLastSlide;
				swiperInstance.autoplay.start();
				swiperInstance.autoplay.resume();
				$('.js-pause').css('display','').removeClass('fa-play').addClass('fa-pause');
			}
			else {
				swiperInstance.autoplay.pause();
				swiperInstance.autoplay.stop();
				if(!autoplay && !ttsAutoplay) {
					$('.js-pause').hide();
				}
			}
		}
		
	}).toggleClass('active', autoplay);

	// 처음부터 자동재생 설정
	$('.js-change-loop').on('click', function() {
		stopOnLastSlide = $(this).is('.active');
		$(this).toggleClass('active', !stopOnLastSlide);
		if(swiperInstance) {
			swiperInstance.params.autoplay.stopOnLastSlide = stopOnLastSlide;
			swiperInstance.update();
		}
	}).toggleClass('active', !stopOnLastSlide);
	
	// TTS 자동 재생 설정
	$('.js-change-tts-autoplay').on('click', function() {
		ttsAutoplay = !$(this).is('.active');
		$(this).toggleClass('active', ttsAutoplay);
		const $slide = $(swiperInstance.slides[swiperInstance.activeIndex]);
		if(ttsAutoplay) {
			playWordTitle($slide.find('.word-unit-section .title:eq(0)').text().trim(), 
				$slide.find('.js-pause').removeClass('fa-play').addClass('fa-pause'));
			$('.js-pause').css('display','');
		}else {
			tts.stop();
			if(!autoplay && !ttsAutoplay) {
				$('.js-pause').hide();
			}
		}
	}).toggleClass('active', ttsAutoplay);
	
	// 현재 설정 저장
	$('.js-save-configs').on('click', function() {
		
		localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify({
			ttsAutoplay, autoplay, autoplayDelay, stopOnLastSlide, sentenceAutoLoad
		}));
		$(this).prev('.toast').toast('show');
	})

	// 슬라이드 재생/멈춤(TTS도 같이)
	$(document).on('click', '.js-pause', function() {
		const $this = $(this);
		if(this.matches('.fa-pause')) {
			swiperInstance.autoplay.pause();
			paused = true;
			tts.stop(()=> $this.toggleClass('fa-pause fa-play'));
		}else {
			paused = false;
			playWordTitle($this.closest('.word-unit-section').find('.title').text().trim(), $this);
			$this.toggleClass('fa-pause fa-play');
			if(swiperInstance.autoplay.running) swiperInstance.autoplay.resume();
		}
	})
	$('.autoplay-top-mobile-menu').on('click', '.start-btn,.finish-btn', function() {
		$(this.matches('.start-btn') ? '#startAutoPlay' : '#finishAutoPlay').trigger('click');
	})
	
	// 스터디 모드(전체화면) 토글
	$('#toggleFullscreen').on('click', function() {
		if(!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
		}else {
			document.exitFullscreen();
		}
	});
	$(document.documentElement).on('fullscreenchange', function() {
		if(document.fullscreenElement) {
			$('#toggleFullscreen').attr('data-bs-original-title', '학습모드를 종료합니다.');
			$('#toggleFullscreen').tooltip();
			$('#toggleFullscreen i').removeClass('fa-expand').addClass('fa-compress');
		}else {
			$('#toggleFullscreen').attr('data-bs-original-title', '학습모드를 켭니다.');
			$('#toggleFullscreen').tooltip();
			$('#toggleFullscreen i').addClass('fa-expand').removeClass('fa-compress');
		}
	})
	
	function playWordTitle(title, $btn) {
		if(ttsAutoplay && !paused) {
			tts.speakRepeat(title, 2000, 500, () => {
				$btn.removeClass('fa-pause').addClass('fa-play');
			})
		}
	}
	
	function createSlideDOMList(keepWordList) {
		return Array.from(keepWordList, keepWord => {
			const $slide = $(HTML_TEMPLATE).find('.swiper-slide').clone();
			
			$slide.attr('data-keep-word-id', keepWord.keepWordId);
			$slide.find('.data-save-date').text(new Date(keepWord.saveDate).format('yyyy.MM.dd (e)'));
			$slide.find('.data-word-title').text(keepWord.wordTitle);
			// if(keepWord.conjs?.length > 0) {
			// 	$slide.find('.word-conjs-container').empty();
			// 	$slide.find('.word-conjs-container').append(
			// 		Array.from(keepWord.conjs, (conj,i) => {
			// 			const $conjBlock = $(HTML_TEMPLATE).find('.word-conj-container').eq(0);
			// 			$conjBlock.find('.conj-text:not(:eq('+i+'))').remove();
			// 			$conjBlock.find('.data-word-conj').text(conj);
			// 			return $conjBlock;
			// 		})
			// 	)
			// }else {
			// 	$slide.find('.word-conjs-container').remove();
			// }
			$slide.find('.workbook-title').text(keepWord.workBookTitle||'');
			$slide.find('.data-phonetic').html(keepWord.phonetic?.replace(/미국식?/g,'美')?.replace(/영국식?/g,'英')||'');
			
			$slide.find('.word-sense-list-container').empty()
			.append(Array.from(keepWord.senseList, sense => {
				const $partSense = $(HTML_TEMPLATE).find('.one-part-unit-section:eq(0)');
				$partSense.find('.part').text(sense.partType);
				$partSense.find('.meaning').text(sense.meaning);
				return $partSense[0];
			}));
			
			$slide.find('.js-view-sentence').attr({'data-sid': keepWord.sentenceId, 'data-wid': keepWord.wordId});
			return $slide[0];
		});
	}
	
	const SESSION_STORAGE_KEY = 'savedWordList';
	
	function unsaveFromSessionStorage(keepWordId) {
		if(sessionStorage.getItem(SESSION_STORAGE_KEY)) {
			let savedWordList = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY));		
			if(savedWordList) {
				savedWordList = savedWordList.filter(word => word.keepWordId != keepWordId);
				sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(savedWordList))
			}
		}
	}
}
