/** memento/test_result.html
 * @author LGM
 */
async function pageinit(initialTraceList) {
	$.scrollUp({ scrollText: '<i class="fas fa-angle-double-up"></i>', scrollSpeed: 0 });
	
	let HTML_TEMPLATE = await $.get('https://static.findsvoc.com/fragment/memento/memento_list.min.html', jQuery.noop, 'html');

	const CALENDAR_OPTIONS = { language: 'ko', firstDayOfTheWeek: 2};
	const DATE_FORMAT_FOR_COMPARE = 'yyyy-MM-dd';
	let calendarSeq = 0;
	
	const DOMList = createTraceDOMList(initialTraceList);
	$('.memento-list-section').empty().append(DOMList);	
	
	anime({
		targets: DOMList,
		scale: [0, 1],
		easing: 'linear',
		duration: 300,
		delay: anime.stagger(150)
	})
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
	.on('click', '.js-close-sentence', function() {
		const $traceBlock = $(this).closest('.memento-trace-block');
		toggleCalendarAndSentence($traceBlock, 0);
	})
	
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
		alertModal('Today\'s Luck은 나의 단어 보관 목록 화면에서 가능합니다.');
	})
		
	$('#sortBtn').on('click', function() {
		const sort = this.dataset.sort == 'recent' ? 'alphabet' : 'recent';
		const newTraceList = Array.from(initialTraceList);
		const newDOMList = createTraceDOMList(sort == 'recent' ? initialTraceList 
			: newTraceList.sort((a, b) => {
				if(a.wordTitle < b.wordTitle) return -1;
				else if(a.wordTitle > b.wordTitle) return 1;
				else return 0;
			}))
		$('.memento-list-section').empty().append(newDOMList);
		anime({
			targets: newDOMList,
			scale: [0, 1],
			easing: 'linear',
			duration: 300,
			delay: anime.stagger(150)
		})
		
		this.dataset.sort = sort;
		$(this).find('i').toggleClass('fa-sort-alpha-down fa-sort-numeric-down');
		$(this).find('span').text(sort == 'recent' ? '알파벳순' : '테스트순');
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
				
				const pass = keepword.mementoDtoList[0]?.pass;
				$traceBlock.find('.data-word-title')
					.text(keepword.wordTitle)
					.css('color', pass ? '#8F8' : '#F88');
				
				
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
					$traceBlock.find('.low-part').css('display','none');
				}else $traceBlock.find('.js-toggle-lowpart').addClass('active');
				return $traceBlock[0];
			}
		);
	}
	function createCalendarFromKeepWord(div, keepword) {
		if(keepword.mementoDtoList.length > 0) {
			const mementoList = keepword.mementoDtoList.sort((a,b) => Date.parse(b.testDate) - Date.parse(a.testDate));
			if(!div.id) div.id = `${Date.now()}${calendarSeq++}`;
			const calendar = jsCalendar.new(div, new Date(keepword.saveDate),
				Object.assign({min: new Date(keepword.saveDate), max: new Date()}, CALENDAR_OPTIONS));
			calendar.onDateRender(function(date,el,info) {
				// td 요소는 그대로이고, 내용만 갈아끼우기 때문에 이전 스타일은 모두 없애야 함.
				el.classList.remove('saved','completed','correct','wrong','today');
				delete el.dataset.bsToggle;
				delete el.dataset.bsHtml;
				delete el.dataset.bsTitle;
				let tooltipTitle = ''
				// 저장한 날짜
				if(date.format(DATE_FORMAT_FOR_COMPARE) == new Date(keepword.saveDate).format(DATE_FORMAT_FOR_COMPARE)) {
					el.classList.add('saved');
					el.dataset.bsToggle = 'tooltip';
					el.dataset.bsHtml = 'true'
					tooltipTitle += '<p class="mb-0">단어 보관 날짜</p>';
					el.dataset.bsTitle = tooltipTitle;
				}
				
				if(info.isSelected) {
					const total = mementoList.filter(m => new Date(m.testDate).format(DATE_FORMAT_FOR_COMPARE) == date.format(DATE_FORMAT_FOR_COMPARE));
					const corrects = total.filter(m => m.pass);
					el.classList.add(corrects.length / total.length > 0.5 ? 'correct' : 'wrong');
					el.dataset.bsToggle = 'tooltip';
					el.dataset.bsHtml = 'true'
					tooltipTitle += '<p class="mb-0">맞힘:'+corrects.length+'/틀림:'+(total.length - corrects.length)+'</p>'
					el.dataset.bsTitle = tooltipTitle;
				}
				// 암기 완료된 단어
				if(keepword.del && date.format(DATE_FORMAT_FOR_COMPARE) == new Date(keepword.updateDate).format(DATE_FORMAT_FOR_COMPARE)) {
					el.classList.add('completed');
					el.dataset.bsToggle = 'tooltip';
					el.dataset.bsHtml = 'true'
					tooltipTitle = '<p class="mb-0">암기 완료 날짜</p>';
					el.dataset.bsTitle = tooltipTitle;
				}
				// 오늘자 임시표시(암기 완료할 때의 선책자로 활용)
				if(date.format(DATE_FORMAT_FOR_COMPARE) == new Date().format(DATE_FORMAT_FOR_COMPARE)) {
					el.classList.add('today');
				}
			})
			calendar.select(Array.from(keepword.mementoDtoList, memento => new Date(memento.testDate)));
			if(keepword.del) {
				calendar.goto(new Date(keepword.updateDate));
			}else {
				calendar.goto(new Date(mementoList[0]?.testDate));
			}
		}else {
			const calendar = jsCalendar.new($(div).addClass('pe-none opacity-50')[0], 0, CALENDAR_OPTIONS);
			calendar.goto(new Date());
		}		
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
