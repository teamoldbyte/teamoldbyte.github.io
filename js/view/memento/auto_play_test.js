/** memento/auto_play_test.html
 * @author LGM
 */
async function pageinit(testSentenceList, testType) {
	const tts = new FicoTTS();
	
	const COMPLETE_SOUND = 'https://static.findsvoc.com/sound/yeah.mp3';
	const TRANSITION_SOUND = 'https://static.findsvoc.com/sound/page-flip.mp3';
	$.ajax({
		url: 'https://static.findsvoc.com/js/util/audio-util.min.js', dataType: 'script', cache: true
	}).then(() => {
		WebAudioJS.load(COMPLETE_SOUND);
		WebAudioJS.load(TRANSITION_SOUND);
	})
	$.ajax({
		url: 'https://cdn.jsdelivr.net/npm/typewriter-effect@2.20.1/dist/core.min.js', dataType: 'script', cache: true
	})
	const progressCircle = document.querySelector(".autoplay-progress svg");
	const progressContent = document.querySelector(".autoplay-progress span");
	
	let HTML_TEMPLATE = await $.get('https://static.findsvoc.com/fragment/memento/auto_play_test.min.html', jQuery.noop, 'html');
	//let HTML_TEMPLATE = await $.get('/fragment/memento/auto_play_test.html', jQuery.noop, 'html');
	const LOCAL_STORAGE_CONFIG_KEY = 'MementoAutoPlayTestConfigs';
	const configs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY)||'{}');
		
	// 단어 TTS 자동재생여부
	let wordAutoplay = configs.wordAutoplay??true;
	// 문장 TTS 자동재생여부
	let sentenceAutoplay = configs.sentenceAutoplay??true;
	// 문장 재생 횟수
	let sentenceRepeat = configs.sentenceRepeat?? 1;
			
	let swiperInstance, timerAnim;
	const oxList = new Set();
	if( location.pathname.includes('/mapping-test'))
		$('#mappingTestCoverGuide').show();
	$('.swiper-slide.end').before(createSlideList(testSentenceList));
	// START
	$('#startAutoPlay, .cover-before-play').on('click', function() {
		$('#startAutoPlay').prop('disabled', true).tooltip('hide');
		$('#finishAutoPlay').prop('disabled', false);
		$('.cover-before-play,.cover-before-play-cover').hide();
		$('#waitingLottie').show();
		if(swiperInstance) {
			swiperInstance.enable();
			return;
		}
		let timer;
		swiperInstance = new Swiper('.swiper', {
			centeredSlides: true,
			pagination: {
				el: ".swiper-pagination",
				clickable: true
			},
			on: {
				afterInit(s) {
					/* 좌우 내비게이션 및 페이지네이션 숨김 해제*/
					$(s.pagination.el).show();
					$(s.pagination.bullets[s.slides.length - 1]).toggleClass('swiper-pagination-bullet swiper-pagination-hidden');
					
					/* 카운터 타이머 애니메이션 시작 */
					const totalCount = testSentenceList.length;
					timer = { time : totalCount * 20, ext: 0, loop: 0};
					timerAnim = anime({
						targets: timer,
						easing: 'linear',
						duration: 20000 * totalCount,
						time: 0,
						update: (anim) => {
							progressCircle.style.setProperty("--progress", anim.progress / 100 - 1);
							progressContent.textContent = `${Math.ceil(timer.time)}s`;
							// 제한시간 50% 경과시 색 바뀜 
							if(anim.progress > 50) {
								progressCircle.style.stroke = '#d16464';
								progressContent.style.color = '#d16464';
							}
							// 제한시간 90% 경과시 크기 바뀜
							if(anim.progress > 90) {
								progressCircle.style.scale = 1.3;
								progressContent.style.scale = 1.3;
							}
						},
						complete: (_anim) => {
							timerAnim = anime({
								targets: timer,
								easing: 'linear',
								duration: 20000 * totalCount,
								time: [0, 20 * totalCount],
								loop: 100,
								update: (anim) => {
									timer.ext = timer.loop * 20 * totalCount + timer.time;
									progressCircle.style.setProperty("--progress", anim.progress / 100);
									progressContent.textContent = `+${Math.floor(timer.ext)}s`;							
								},
								loopComplete: (_anim) => {
									timer.loop++;
									timer.time = 0;
								}
								
							})
						}
					});
				},
				transitionStart(_s) {
					tts.stop();
					WebAudioJS.play(TRANSITION_SOUND);
				},
				transitionEnd(s) {
					if(timerAnim.paused) timerAnim.play()
					$(s.slides[s.activeIndex - 1]).find('button').attr('tabIndex', -1).trigger('blur');
				},
				reachEnd(s) {
					$(s.pagination.el).hide()
					timerAnim.pause();
					$('.operation-section,.config-section').css('visibility','hidden');
					
					$('.time-result-msg .elapsed-time').text(Math.round(testSentenceList.length * 20 - timer.time + timer.ext));
					$('.time-result-msg .expected-time').text(testSentenceList.length * 20);
					
					if(timer.ext > 0) {
						$('.time-over-msg').slideDown();
						$('.time-result-msg .additional-msg').text(`${Math.round(timer.ext)}초 초과!`)
					}else if(timer.time > 0 && timer.time > testSentenceList.length * 20 /10) {
						$('.time-result-msg .additional-msg').text(`${Math.round(timer.time)}초나 여유있게 풀어냈습니다!`)
					}else {
						$('.time-result-msg .additional-msg').text('아슬아슬했습니다! 좀 더 암기하기를 추천합니다.')
					}
					$('.autoplay-progress').hide();
					WebAudioJS.play(COMPLETE_SOUND);
					showFireworks({
						target: s.slides[s.slides.length - 1],
						size: 15, particles: 15
					});
					s.disable();
				}
			}
		});
	});
	
	// FINISH
	$('#finishAutoPlay').on('click', function() {
		$(this).prop('disabled', true).tooltip('hide');
		$('.cover-before-play').show();
		timerAnim.pause();
		
		if(oxList.size > 0) {
			confirmModal('지금 바로 테스트 결과를 보시겠습니까?', () => {
				$('#getResultForm').submit();
			}, () => {
				$('.cover-before-play').hide();
				$(this).prop('disabled', false);
				if(!timerAnim.completed) timerAnim.play();
			});
		}else {
			confirmModal('아직 푼 문제가 없습니다. 뒤로 돌아가시겠습니까?', () => {
				history.back();
			}, () => {
				$('.cover-before-play').hide();
				$(this).prop('disabled', false);
				if(!timerAnim.completed) timerAnim.play();
			})
		}
	})
	
	$('#getResultForm').on('formdata', function(e) {
		e.originalEvent.formData.append('keepWordIds', Array.from(oxList).toString());
	})
	
	$('#toggleFullscreen').on('click', function() {
		if(!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
		}else {
			document.exitFullscreen();
		}
	})
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
	$('#changeWordAutoPlay')
	.toggleClass('fa-volume-up', wordAutoplay)
	.toggleClass('fa-volume-mute opacity-50', !wordAutoplay)
	.attr('data-active', wordAutoplay)
	.on('click', function() {
		const active = !JSON.parse(this.dataset.active);
		wordAutoplay = active;
		$(this).toggleClass('active', active);
		$(this).toggleClass('fa-volume-up fa-volume-mute opacity-50')
	})
	$('#changeSentenceAutoPlay')
	.toggleClass('fa-comment', sentenceAutoplay)
	.toggleClass('fa-comment-slash opacity-50', !sentenceAutoplay)
	.attr('data-active', sentenceAutoplay)
	.on('click', function() {
		const active = !JSON.parse(this.dataset.active);
		sentenceAutoplay = active;
		$(this).toggleClass('active', active);
		$(this).toggleClass('fa-comment fa-comment-slash opacity-50')
	})
	// 문장 재생 횟수
	$('#changeSentenceRepeat .number').text(sentenceRepeat);
	new bootstrap.Tooltip($('#changeSentenceRepeat')[0], {
		trigger: 'click', placement: 'right',
		html: true, title: $('<div class="text-center" style="width:6rem"><label class="form-label">문장<br>반복 재생 횟수</label><input type="number" min="1" class="js-change-sentence-repeat form-control pe-0 me-1 d-inline" value="' + sentenceRepeat + '" style="width:4rem">회</div>')[0]
	});
	$(document)
	// 다음 슬라이드로
	.on('click', '.js-next-slide', slideToNextUnsolved)
	.on('shown.bs.tooltip', '#changeSentenceRepeat', function() {
		$('.js-change-sentence-repeat').val(sentenceRepeat)[0].focus();
	})
	.on('blur', '.js-change-sentence-repeat', function() {
		$('#changeSentenceRepeat').tooltip('hide');
	})
	.on('change', '.js-change-sentence-repeat', function() {
		sentenceRepeat = Math.max(1,parseInt(this.value));
		$('#changeSentenceRepeat .number').text(sentenceRepeat);
	})	
	// 현재 설정 저장
	$('#saveConfigs').on('click', function() {
		
		localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify({
			wordAutoplay, sentenceAutoplay, sentenceRepeat
		}));
		$(this).prev('.toast').toast('show');
	});
	
	//--------------------------------------------------------------------------
	function createSlideList(testList) {
		
		if(testType == 'mapping-test') {
			const fullOptionList = [];
			testList?.forEach(test => {
				test?.keepWordDtoList?.forEach(kwd => {
					if(!fullOptionList.some(option => option.title == kwd.title)) {
						fullOptionList.push(kwd);
					}
				})
			})
			return Array.from(testList, (test) => {
				const { kor, keepWordDtoList } = test;
				const $slide = $(HTML_TEMPLATE).find('.swiper-slide.mapping-test').clone();
				
				// 해석 표시
				$slide.find('.kor-section .kor').text(kor)
				
				// 보기 구성
				$slide.find('.guide-section .option-count').text(keepWordDtoList.length);
				let options = Array.from(keepWordDtoList);
				if(options.length < 8) {
					options = options.concat(
						fullOptionList.sort(() => Math.random() - 0.5)
						.filter(option => !options.some(option2 => option.keepWordId == option2.keepWordId ))
						.slice(0,8 - options.length));
				}
				options.sort(() => Math.random() - 0.5);
				$slide.find('.options-section')
				.append(Array.from(options, word => {
					const $optionBlock = $(HTML_TEMPLATE).find('.option-block').eq(0).clone();
					$optionBlock.find('.option').text(word.title).data('keepWordId', word.keepWordId)
					.on('click', function() {
						if(wordAutoplay) {
							tts.stop(() => tts.speak(word.title));
						}
						$slide.find('.choose-complete-section').toggle($slide.find('.option.active').length > 0); 
					})
					return $optionBlock;
				}))
				$slide.on('click', '.js-choose-complete', function() {
					const $btn = $(this).addClass('pe-none');
					const choices = $slide.find('.option.active').get();
					const records = Array.from(keepWordDtoList, answer => {
						return { keepWordId: answer.keepWordId, pass: choices.some(choose => $(choose).data('keepWordId') == answer.keepWordId)};
					})
					
					timerAnim.pause();
					
					$.ajax({
						url: '/memento/test/records',
						type: 'POST',
						data: JSON.stringify(records),
						contentType: 'application/json',
						success: () => {
							keepWordDtoList.forEach(kw => {
								oxList.add(kw.keepWordId);
							})
							
							$slide.find('.option').addClass('pe-none');
							$slide.find('.option').get()
							.forEach(choice => {
								if(keepWordDtoList.some(kwd => kwd.keepWordId == $(choice).data('keepWordId')))
									$(choice).addClass('answer');
								else {
									$(choice).addClass('not-answer');
								}
							})
							$(swiperInstance.pagination.bullets[swiperInstance.activeIndex]).addClass('position-relative')
							.append(createElement({
								el: 'span', class: 'pagination-bullet-check fas fa-check fa-sm top-0 start-0', style: {
									position: 'absolute', color: '#0dcaf0', transform: 'translate(-10%, -50%)'
								}
							}));
							const charCount = test.eng.replace(/\W/g,'').length;
							const expectedSpeakLength = charCount * 60 / (5.1 * 250);
							const sentenceSection = createElement({
								el: 'div', style: { marginTop: '1rem',color: 'var(--slate)', fontSize: '1.2rem'},
							})
							$slide.find('.kor-section').append(sentenceSection);
							new Typewriter(sentenceSection, {
								delay: (expectedSpeakLength * 1000 / charCount), cursor: ''
							}).typeString(test.eng).callFunction(() => {
								
								anime({
									targets: $btn.siblings('.js-next-slide').get(),
									duration: 400,
									rotateX: ['180deg','0deg'],
									easing: 'linear'
								})
								anime({
									targets: $btn.get(),
									duration: 400,
									easing: 'linear',
									rotateX: ['0deg','180deg'],
									update: (anim) => {
										if(anim.progress > 50)
										$btn.css('zIndex', -1)
									}
								})
							}).start();
						},
						error: () => {
							alertModal('풀이 제출에 실패했습니다.');
							$btn.removeClass('pe-none');
							reject();
						}
					});
					new Promise((resolve, _reject) => {
						if(sentenceAutoplay) {
							tts.stop(() => tts.speakRepeat(test.eng, sentenceRepeat, 250, () => setTimeout(() => resolve(), 500)));
						}else {
							setTimeout(() => resolve(), 1000);
						}
					})
				})
				
				return $slide;	
			})
		}else {
			return Array.from(testList, (test, i) => {
				const { keepWordId, eng, kor, title, sentenceLeftPart, sentenceRightPart } = test;
				const $slide = $(HTML_TEMPLATE).find('.swiper-slide.eng-test').clone();
				
				// 문장 표시
				const $sentenceLeftPart = $slide.find('.sentence-section .eng:first-child');
				const $sentenceRightPart = $slide.find('.sentence-section .eng:last-child');
				if(sentenceLeftPart) {
					$sentenceLeftPart.text(sentenceLeftPart)
				}else $sentenceLeftPart.remove();
				
				$slide.find('.sentence-section .invisible').text(title);
				
				if(sentenceRightPart) {
					$sentenceRightPart.text(sentenceRightPart)
				}else $sentenceRightPart.remove();
				
				// 해석 표시
				$slide.find('.kor-section .kor').text(kor)
				
				// 보기 구성
				let options = testList.filter((_, w_i) => i != w_i);
				options.sort(() => Math.random() - 0.5);
				$slide.find('.options-section')
				.append(Array.from(options.slice(0,7).concat([test]).sort(() => Math.random() - 0.5), word => {
					const $optionBlock = $(HTML_TEMPLATE).find('.option-block').eq(0).clone();
					const pass = word.keepWordId == keepWordId;
					$optionBlock.find('.option').text(word.title);
					$optionBlock.on('click', '.option', function() {
						const option = this;
						$slide.find('.option').addClass('pe-none');
						Promise.all([
							// 1. 재생 중인 TTS 멈춤
							Promise.resolve(timerAnim.pause()),
							// 2. 풀이 전송
							new Promise((resolve, reject) => {
								$.ajax({
									url: '/memento/test/record',
									type: 'POST',
									data: {keepWordId, pass},
									success: function() {
										//oxList.push(pass);
										oxList.add(keepWordId);
										$(option).addClass('active');
										$(swiperInstance.pagination.bullets[swiperInstance.activeIndex]).addClass('position-relative')
										.append(createElement({
											el: 'span', class: 'pagination-bullet-check fas fa-check fa-sm top-0 start-0', style: {
												position: 'absolute', color: '#0dcaf0', transform: 'translate(-10%, -50%)'
											}
										}));
										resolve();
									},
									error: () => {
										$slide.find('.option').removeClass('pe-none');
										alertModal('풀이 제출에 실패했습니다.');
										reject();
									}
								})
							}),
							// 3. 선택 단어 및 정답 문장 TTS 재생
							new Promise((resolve, _reject) => {
								if(wordAutoplay) {
									tts.speak(word.title, () => {
										if(sentenceAutoplay) {
											setTimeout(() => tts.speakRepeat(eng, sentenceRepeat, 250, () => resolve()), 500);
										}else {
											setTimeout(() => resolve(), 500);
										}
									});
								}else if(sentenceAutoplay) {
									tts.speakRepeat(eng, sentenceRepeat, 250, () => setTimeout(() => resolve(), 500));
								}else {
									setTimeout(() => resolve(), 1000);
								}
							})
						]).then(() => slideToNextUnsolved());
					});
					return $optionBlock;
				}));
				
				return $slide;	
			})
		}
	}
	
	function slideToNextUnsolved() {
		
		setTimeout(() => {
			const { slides, activeIndex, pagination } = swiperInstance;
			// 아직 풀이한 슬라이드가 아니면 return (풀이 전송 중에 사용자가 임의로 이동한 경우)
			if(!pagination.bullets[activeIndex].querySelector('.pagination-bullet-check')) return;
			// 풀이한 슬라이드의 모든 버튼 선택불가 처리
			$(slides[activeIndex]).find('button').attr('tabIndex', -1).trigger('blur');
			// 아직 풀지 않은 슬라이드 중 첫번째 인덱스
			const unsolvedIndex = pagination.bullets.findIndex(b => {
				return !(b.querySelector('.pagination-bullet-check'));
			});
			// 마지막 슬라이드는 풀이 종료를 알리는 슬라이드임.
			const lastIndex = slides.length - 1;
			// 뒷 슬라이드 중 아직 안 푼 첫 번째 슬라이드로 이동.
			for(let i = activeIndex; i < lastIndex; i++) {
				if(!pagination.bullets[i].querySelector('.pagination-bullet-check')) {
					swiperInstance.slideTo(i);
					return;
				}
			}
			// 뒷슬라이드는 다 풀었으면 1.앞슬라이드 중 안 푼 슬라이드로 이동 OR 2.마지막 슬라이드로 이동.
			swiperInstance.slideTo(unsolvedIndex);
			return;
			
		}, 200);		
	}
}
