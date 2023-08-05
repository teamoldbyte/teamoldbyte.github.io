/** memento/memento_trace.html
 * @author LGM
 */
async function pageinit(initialTraceList, totalCount, isLast) {
	$.scrollUp({ scrollText: '<i class="fas fa-angle-double-up"></i>', scrollSpeed: 0 });
	
	let tts;
	$.ajax({
		url: 'https://static.findsvoc.com/js/util/tts-util.min.js', dataType: 'script', cache: true
	}).then(() => { tts = new FicoTTS() });
	
	const EGG_SUCCESS_SOUND = 'https://static.findsvoc.com/sound/yeah.mp3';
	const EGG_LATE_SOUND = 'https://static.findsvoc.com/sound/unfortune.mp3';
	const EGG_FAIL_SOUND = 'https://static.findsvoc.com/sound/spring-bounce.mp3';
	const POP_SOUND = 'https://static.findsvoc.com/sound/cartoon-pop.mp3';

		
	//let HTML_TEMPLATE = await $.get('/fragment/memento/memento_list.html', jQuery.noop, 'html');
	let HTML_TEMPLATE = await $.get('https://static.findsvoc.com/fragment/memento/memento_list.min.html', jQuery.noop, 'html');
	const CALENDAR_OPTIONS = { language: 'ko', firstDayOfTheWeek: 2};
	const LOCAL_STORAGE_LUCK_KEY = 'mementoTodayLuck';
	const availableLuckyTryCount = Math.min(5, Math.floor(totalCount / 20)) || 1; // 이 횟수 이하에서 획득이 유효함
	let luckyEggInfo, getLuckProcessing = false;
	const DATE_FORMAT_FOR_COMPARE = 'yyyy-MM-dd';
	let calendarSeq = 0;

	const scroller = $('.page-scroll')[0];
	const scrollObserver = new IntersectionObserver((entries) => {
		if(entries[0].isIntersecting) {
			const pageNum = entries[0].target.dataset.pagenum;
			const sort = $('#sortBtn')[0].dataset.sort;
			// 지문 추가 조회(ajax)------------------------------------------------
			$.getJSON(`/memento/trace/${pageNum}`, { sort }, list => refreshTracePage(list));
			//------------------------------------------------------------------
		}
	});	
	const tracePage = {content: initialTraceList, last: isLast, number: 0};
	refreshTracePage(tracePage);
	
	// 단어 암기 완료
	$(document).on('click', '.js-check-complete', function() {
		const _this = this;
		const $traceBlock = $(this).closest('.memento-trace-block');
		confirmModal('이 단어를 암기완료 하셨습니까?', () => {
			const keepWordId = parseInt($traceBlock[0].dataset.keepWordId);
			const wordTitle = $traceBlock.find('.data-word-title').text().trim();
			$.ajax({
				url: '/memento/word/change-status',
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify({keepWordId, del: true}),
				success: () => {
					unsaveFromSessionStorage(keepWordId);
					alertModal(`단어 <b>${wordTitle}</b>를 암기 완료했습니다.`, () => {
						$traceBlock.children().prepend('<div class="completed-stamp"></div>')
						.find('.calendar-section .today').addClass('completed');
						$(_this).addClass('pe-none opacity-50');
						const targetKeepWord = initialTraceList.find(kw => kw.keepWordId == keepWordId);
						targetKeepWord.del = true;
						targetKeepWord.updateDate = new Date().format(DATE_FORMAT_FOR_COMPARE);
						createCalendarFromKeepWord($traceBlock.find('.calendar-section').empty()[0], targetKeepWord);
					})
				}
			});
		})
	})
	// 단어 예문 보기
	.on('click', '.js-view-sentence', function() {
		const $traceBlock = $(this).closest('.memento-trace-block');
		const keepWordId = parseInt($traceBlock[0].dataset.keepWordId);
		if($traceBlock.find('.sentence-section').is('.loaded')) {
			toggleCalendarAndSentence($traceBlock, $traceBlock.find('.calendar-section').is(':visible') ? 1 : 0);
			$traceBlock.find('.low-part').slideDown();
			return;
		}
		$.get(`/memento/trace/keep-sentence/${keepWordId}`, (sentence) => {
			$traceBlock.find('.sentence-section').addClass('loaded').find('.eng').html(sentence);
			$traceBlock.find('.low-part').slideDown();
			toggleCalendarAndSentence($traceBlock, 1);
		})
	})
	// 예문 닫기
	.on('click', '.js-close-sentence', function() {
		const $traceBlock = $(this).closest('.memento-trace-block');
		toggleCalendarAndSentence($traceBlock, 0);
	})
	// 단어를 킵한 워크북으로 이동
	.on('click', '.js-goto-workbook', function() {
		const $traceBlock = $(this).closest('.memento-trace-block');
		const keepWordId = parseInt($traceBlock[0].dataset.keepWordId);
		location.assign(`/memento/trace/move-workbook/${ntoa(keepWordId)}`)	
	})
	// 단어의 부가영역(달력,예문) 접기/펼치기
	.on('click', '.js-toggle-lowpart', function() {
		const active = !$(this).is('.active');
		const $traceBlock = $(this).closest('.memento-trace-block');
		$traceBlock.find('.low-part')[active? 'slideDown':'slideUp'](250);
		$(this).toggleClass('active');
	})
	// 럭키 에그
	.on('click', '.js-get-luck', async function() {
		if(totalCount < 20) {
			alertModal('아직 Today\'s Luck을 진행하기에 보관 단어 수가 부족합니다.');
			return;
		}
		luckyEggInfo = await getLuckyWordInfo();
		if(luckyEggInfo.luckies.length == 0) {
			alertModal('아직 Today\'s Luck을 진행하기에 보관 단어 수가 부족합니다.');
			return;
		}
		$('#todayLuckModal .lucky-count').text(luckyEggInfo.luckies.filter(str => str!= 'LUCKY').length);
		$('#todayLuckModal').modal('show');
		$.ajax({
			url: 'https://static.findsvoc.com/js/util/audio-util.min.js', dataType: 'script', cache: true
		}).then(() => {
			WebAudioJS.load(EGG_SUCCESS_SOUND);
			WebAudioJS.load(EGG_LATE_SOUND);
			WebAudioJS.load(EGG_FAIL_SOUND);
			WebAudioJS.load(POP_SOUND);
		});
	})
	.on('click', '.find-lucky-mode .memento-trace-block:not(.verified)', function() {
		if(getLuckProcessing) {
			alertModal('아직 확인 중인 단어가 있습니다\n잠시 뒤 시도하세요.');
			return;
		}
		const $traceBlock = $(this);
		const keepWordId = parseInt(this.dataset.keepWordId);
		const wordId = parseInt(this.dataset.wordId);
		const wordTitle = $traceBlock.find('.data-word-title').text().trim();
		getLuckProcessing = true;
		WebAudioJS.play(POP_SOUND);
		$.getJSON(`/memento/trace/keepword-meaning/${wordId}`, async senseList => {
			tts.stop();
			tts.speakRepeat(wordTitle, 10, 200);
			$traceBlock.find('.low-part').append(createElement({
				el: 'div', class: 'position-absolute w-100 h-100 top-0 start-0 text-center meaning-section',
				style: { backgroundColor: '#142a39', color: '#f6f0a0'}, 
				children: [{
					el: 'div', class: 'count-timer-section w-100', children: [
						'단어 복습 한 번 더!', {el: 'br'}, 
						'(', { el: 'span', class: 'time', textContent: 7}, '초 뒤 에그를 확인합니다.)'
					]
				}].concat(Array.from(senseList, sense => {
					return {
						el: 'div', children: [
							{ el: 'span', textContent: sense.partType, style: {
								fontFamily: '"Apple SD Gothic Neo","Segoe UI"', color: '#0aa190', fontWeight: 'bold'
							}},
							{ el: 'span', textContent: sense.meaning, style: {
								fontSize: '1.1rem', color: '#fff'
							}}
						]
					}
				}))
			})).slideDown(250, () => {
				let timer = { time: 7};
				anime({
					targets: timer,
					time: 0,
					easing: 'linear',
					duration: 7000,
					update: () => {
						$traceBlock.find('.count-timer-section .time').text(Math.ceil(timer.time));
					},
					complete: () => {
						tts.stop();
						verifyLuck();
					}
				})
			});
			
		});
		
		function verifyLuck() {
			if(luckyEggInfo.luckies.includes(ntoa(keepWordId))) {
				const indexFound = luckyEggInfo.luckies.indexOf(ntoa(keepWordId));
				const eggColor = indexFound == 0 ? 9 : generateEgg();
				if(luckyEggInfo.try <= availableLuckyTryCount) {
					const $successCover = $('#hiddenDivs #successLuckCover').clone();
					$successCover.find('.egg-container').append(createElement({
						el: 'div', style: {
							borderRadius: '50% 50% 50% 50%/60% 60% 40% 40%',
							width: '50%', height: '100%', margin: 'auto', transform: 'scale(0)',
							background: `center/ contain url(https://static.findsvoc.com/images/app/egg/egg-${eggColor+1}.png) no-repeat`
						}
					}));
					$traceBlock.children().append($successCover);
					
					anime({
						targets: $successCover.find('.egg-container>div')[0],
						scale: [0, 1],
						rotate: ['0deg', '720deg'],
						duration: 1000,
						easing: 'easeOutQuad',
						complete: () => {
							$successCover.find('.js-go-mypage').prop('disabled', false);
							$.ajax({
								type: 'POST',
								url: '/memento/luck/win',
								data: JSON.stringify([{
									keepWordId, eggColor, gold: eggColor == 9
								}]),
								contentType: 'application/json',
								success: () => {
									luckyEggInfo.luckies.splice(indexFound, 1, "LUCKY");
									if(indexFound == 0)
									luckyEggInfo.achievement = true;
									luckyEggInfo.try = luckyEggInfo.try + 1;
									localStorage.setItem(LOCAL_STORAGE_LUCK_KEY, JSON.stringify(luckyEggInfo));
								},
								error: () => {
									alertModal('일시적 오류로 에그 획득에 실패했습니다.');
								},
								complete: () => {
									getLuckProcessing = false;
									$traceBlock.addClass('verified');
								}
							})
						}
					})
					WebAudioJS.play(EGG_SUCCESS_SOUND);
					showFireworks({
						target: $successCover.find('.egg-container')[0],
						interval: 300,
						count: 1,
						time: 1000,
					})
				}else {
					luckyEggInfo.try = luckyEggInfo.try + 1;
					localStorage.setItem(LOCAL_STORAGE_LUCK_KEY, JSON.stringify(luckyEggInfo));
					getLuckProcessing = false;
					$traceBlock.addClass('verified');

					const $lateCover = $('#hiddenDivs #lateLuckCover').clone();
					$lateCover.find('.egg-container')
					.append(createElement({
						el: 'div', style: {
							borderRadius: '50% 50% 50% 50%/60% 60% 40% 40%',
							width: '50%', height: '100%', margin: 'auto', transform: 'scale(0)',
							background: `center/ contain url(https://static.findsvoc.com/images/app/egg/egg-${eggColor+1}.png) no-repeat`
						}
					}));
					$traceBlock.children().append($lateCover);
					anime({
						targets: $lateCover.find('.egg-container>div')[0],
						scale: [0, 1],
						rotate: ['0deg', '720deg'],
						opacity: {
							delay: 2000,
							duration: 1000,
							value: [1,0.1],
						},
						duration: 2000,
						easing: 'easeOutQuad'
					});
					WebAudioJS.play(EGG_LATE_SOUND);
				}
			}else {
				luckyEggInfo.try = luckyEggInfo.try + 1;
				localStorage.setItem(LOCAL_STORAGE_LUCK_KEY, JSON.stringify(luckyEggInfo));
				getLuckProcessing = false;
				$traceBlock.addClass('verified');
				
				const $failCover = $('#hiddenDivs #failLuckCover').clone();
				$traceBlock.children().append($failCover);
				$traceBlock.find('lottie-player')[0].stop();
				$traceBlock.find('lottie-player')[0].play();
				WebAudioJS.play(EGG_FAIL_SOUND);
			}
		}		
	});
	
	$('#todayLuckStart').on('click', function() {
		$('.memento-list-section').addClass('find-lucky-mode');
		$('#menuBtnGroup>button,.memento-word-menu').addClass('pe-none opacity-50');
		$('.memento-trace-block .collapse-lowpart-btn').removeClass('active');
		$('.memento-trace-block .low-part').slideUp(250);
		$('#todayLuckModal').modal('hide');
		$('#exitFindLuckyMode').show();
	})
	
	$('#exitFindLuckyMode').on('click', function() {
		$(this).hide();
		const active = JSON.parse($('#toggleCalendarsBtn')[0].dataset.active);

		$('.memento-list-section').removeClass('find-lucky-mode').find('.meaning-section').remove();
		$('#menuBtnGroup>button,.memento-word-menu').removeClass('pe-none opacity-50');

		$('.memento-trace-block .low-part')[active ? 'slideDown':'slideUp'](250);
	})
	
	async function getLuckyWordInfo() {
		let luckyWordInfo = localStorage.getItem(LOCAL_STORAGE_LUCK_KEY);
		if (luckyWordInfo && JSON.parse(luckyWordInfo).date == new Date().format(DATE_FORMAT_FOR_COMPARE)) {
			return JSON.parse(luckyWordInfo);
		} else {
			const list = await requestLuckyWordList();
			luckyWordInfo = {
				date: new Date().format(DATE_FORMAT_FOR_COMPARE),
				luckies: list,
				try: 0,
				achievement: false,
			};
			localStorage.setItem(LOCAL_STORAGE_LUCK_KEY, JSON.stringify(luckyWordInfo));
			return luckyWordInfo;
		}
		// 서버에 요청하는 함수
		async function requestLuckyWordList() {
			const response = await fetch('/memento/keepword/winnings');
			const list = await response.json();
			return list;
		}
	}
	
	function generateEgg() {
		return Math.random() * 0xa46 < 0x3e8 ? 0
		: Math.random() * 0xa46 < 0x6a4 ? 1
		: Math.random() * 0xa46 < 0x898 ? 2
		: Math.random() * 0xa46 < 0x9c4 ? 3
		: Math.random() * 0xa46 < 0xa28 ? 4
		: Math.random() * 0xa46 < 0xa3c ? 5
		: Math.random() * 0xa46 < 0xa42 ? 6
		: Math.random() * 0xa46 < 0xa45 ? 7
										: 8;
	}
	
	$('#sortBtn').on('click', function() {
		const sort = this.dataset.sort == 'recent' ? 'alphabet' : 'recent';
		
		this.dataset.sort = sort;
		$.getJSON('/memento/trace/1', { sort }, page => {
			$('.memento-list-section').empty();
			refreshTracePage(page);
		});
		$(this).find('i').toggleClass('fa-sort-alpha-down fa-sort-numeric-down-alt');
		$(this).find('span').text(sort == 'recent' ? '알파벳순' : '최근순');
	})
	
	$('#toggleCalendarsBtn').on('click', function() {
		const active = JSON.parse(this.dataset.active);

		$('.memento-trace-block .collapse-lowpart-btn').toggleClass('active', !active);
		$('.memento-trace-block .low-part')[active ? 'slideUp':'slideDown'](250);

		this.dataset.active = !active;
		$(this).toggleClass('active', !active);
		$(this).find('i').toggleClass('fa-calendar-alt fa-calendar-times');
		$(this).find('span').text(active ? '상세 모드' : '심플 모드')
	})
	
	
	function refreshTracePage(page) {
		if(scrollObserver)
			scrollObserver.unobserve(scroller);
		// 조회 정보 표시
		const DOMList = createTraceDOMList(page.content);
		$('.memento-list-section').append(DOMList);
		
		anime({
			targets: DOMList,
			scale: [0, 1],
			easing: 'linear',
			duration: 300,
			delay: anime.stagger(150),
			update: (anim) => {
				anim.animations?.forEach(function(animation) {
					if (animation.currentValue == 1) {
						animation.animatable.target.removeAttribute('style');
					}
				});
			}
		})
		
		if(!page.last && scrollObserver) {
			scroller.dataset.pagenum = page.number + 2;
			scrollObserver.observe(scroller);
		}else if(scrollObserver) {
			scrollObserver.disconnect();
		}
		
	}
	
	function createTraceDOMList(traceList) {
		return Array.from(traceList, 
			(keepword) => {
				const $traceBlock = $(HTML_TEMPLATE).find('.memento-trace-block:eq(0)').clone();
				
				$traceBlock[0].dataset.keepWordId = keepword.keepWordId||0;
				$traceBlock[0].dataset.wordId = keepword.wordId||0;
				
				// 암기 완료 여부
				if(keepword.del) {
					$traceBlock.children().prepend('<div class="completed-stamp"></div>');
				}
				
				$traceBlock.find('.data-word-title').text(keepword.wordTitle);
				$traceBlock.find('.data-save-date').text(new Date(keepword.saveDate).format('d MMM yyyy'))
				
				const testCount = keepword.mementoDtoList.length;
				const testGoal = Math.ceil(testCount / 10) * 10;
				const barColorIndex = Math.min(9, Math.floor(Math.max(0, testCount - 1) / 10));
				const barColors = ['#38b8c9','#f9d76f','#fcaf17','#f79900','#f86c6b','#d93838','#b71b1b','#a1176b','#8a33a3','#6c63ff'];
				$traceBlock.find('.data-test-count').text(testCount);
				$traceBlock.find('.data-test-goal').text(testGoal);
				$traceBlock.find('.progress').attr('ariaValueNow', testCount % 10)
				.find('.progress-bar').css({width: `${((testCount - 1) % 10 + 1) / 10 * 100}%`, backgroundColor: barColors[barColorIndex]});
				
				const $calendarSection = $traceBlock.find('.calendar-section');
				$calendarSection.addClass('fico-theme');
				//------------------------------------------------------
				createCalendarFromKeepWord($calendarSection[0], keepword)
				//------------------------------------------------------
				if($('#toggleCalendarsBtn').attr('data-active') != 'true' || $('.memento-list-section').is('.find-lucky-mode')) {
					$traceBlock.find('.low-part').hide();
				}else $traceBlock.find('.js-toggle-lowpart').addClass('active')[0].ariaPressed = true; 
				return $traceBlock[0];
			}
		);
	}	
	
	function createCalendarFromKeepWord(div, keepword) { 
		// 먼저, mementoDtoList의 길이가 0보다 큰지 확인합니다. 그렇지 않으면 캘린더를 생성하지 않고 함수를 종료합니다. 
		// 이렇게 하면 코드의 깊이를 줄일 수 있습니다. 
		if (keepword.mementoDtoList.length <= 0) { 
			const calendar = jsCalendar.new( $(div).addClass('pe-none opacity-50')[0], 0, CALENDAR_OPTIONS ); 
			calendar.goto(new Date()); return; 
		}
		// mementoDtoList를 날짜 순으로 정렬합니다. 
		const mementoList = keepword.mementoDtoList.sort( (a, b) => Date.parse(b.testDate) - Date.parse(a.testDate) );

		// div의 id가 없으면 임의의 값을 할당합니다. 
		if (!div.id) div.id = `${Date.now()}${calendarSeq++}`;

		// 캘린더를 생성합니다. min과 max 옵션을 객체 리터럴로 전달합니다. 
		const calendar = jsCalendar.new( div, new Date(keepword.saveDate), 
		{ min: new Date(keepword.saveDate), max: new Date() }, CALENDAR_OPTIONS );

		// onDateRender 함수를 정의합니다. 
		calendar.onDateRender(function (date, el, info) { 
			// td 요소는 그대로이고, 내용만 갈아끼우기 때문에 이전 스타일은 모두 없애야 함.
			el.classList.remove('saved','completed','correct','wrong','today');
			delete el.dataset.bsToggle;
			delete el.dataset.bsHtml;
			delete el.dataset.bsTitle;			
			// 툴팁 제목을 빈 문자열로 초기화합니다. 
			let tooltipTitle = '';

			// 저장한 날짜와 비교할 수 있는 형식으로 변환합니다.
			const formattedDate = date.format(DATE_FORMAT_FOR_COMPARE);
			const formattedSaveDate = new Date(keepword.saveDate).format(DATE_FORMAT_FOR_COMPARE);

			// 저장한 날짜와 같으면 클래스와 툴팁을 추가합니다.
			if (formattedDate == formattedSaveDate) {
				el.classList.add('saved');
				el.dataset.bsToggle = 'tooltip';
				el.dataset.bsHtml = 'true';
				tooltipTitle += '<p class="mb-0">단어 보관 날짜</p>';
				el.dataset.bsTitle = tooltipTitle;
			}

			// 선택된 날짜와 같으면 테스트 결과에 따라 클래스와 툴팁을 추가합니다.
			if (info.isSelected) {
				const total = mementoList.filter((m) => new Date(m.testDate).format(DATE_FORMAT_FOR_COMPARE) == formattedDate);
				const corrects = total.filter((m) => m.pass);
				el.classList.add(corrects.length / total.length > 0.5 ? "correct" : "wrong");
				el.dataset.bsToggle = 'tooltip';
				el.dataset.bsHtml = 'true';
				tooltipTitle += `<p class="mb-0">맞힘:${corrects.length}/틀림:${total.length - corrects.length}</p>`;
				el.dataset.bsTitle = tooltipTitle;
			}

			// 암기 완료된 단어이고 날짜가 업데이트 날짜와 같으면 클래스와 툴팁을 추가합니다.
			if (keepword.del && formattedDate == new Date(keepword.updateDate).format(DATE_FORMAT_FOR_COMPARE)) {
				el.classList.add('completed');
				el.dataset.bsToggle = 'tooltip';
				el.dataset.bsHtml = 'true';
				tooltipTitle = '<p class="mb-0">암기 완료 날짜</p>';
				el.dataset.bsTitle = tooltipTitle;
			}

			// 오늘자 임시표시(암기 완료할 때의 선책자로 활용)
			if (formattedDate == new Date().format(DATE_FORMAT_FOR_COMPARE)) {
				el.classList.add("today");
			}
		});

		// 캘린더에 테스트 날짜들을 선택합니다. 
		calendar.select(Array.from(keepword.mementoDtoList, (memento) => new Date(memento.testDate)));

		// 암기 완료된 단어이면 업데이트 날짜로 이동하고, 그렇지 않으면 가장 최근의 테스트 날짜로 이동합니다. 
		calendar.goto(keepword.del ? new Date(keepword.updateDate) : new Date(mementoList[0]?.testDate));
	}
	
	/**
	* 단어 하단 영역 달력과 문장을 토글
	*/
	function toggleCalendarAndSentence($block, indexToShow) {
		const calendarSection = $block.find('.calendar-section').get(0);
		const sentenceSection = $block.find('.sentence-section').get(0);
		
		$((indexToShow == 0) ? calendarSection : sentenceSection).css('visibility', 'visible');

		anime({
			targets: calendarSection,
			opacity: [indexToShow, 1 - indexToShow],
			easing: 'linear',
			duration: 300,
			complete: (_anim) => {
				if(indexToShow != 0)
					$(calendarSection).css('visibility', 'hidden');
			}
		});
		anime({
			targets: sentenceSection,
			opacity: [1 - indexToShow, indexToShow],
			easing: 'linear',
			duration: 300,
			complete: (_anim) => {
				if(indexToShow != 1)
					$(sentenceSection).css('visibility', 'hidden');
			}
		});				
	}
	
	//--------------------------------------------------------------------------
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
