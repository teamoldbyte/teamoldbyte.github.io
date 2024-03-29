/** 크래프트 문제 진행 화면
 * @author LGM
 */
(function craftPlayer($, window, document) {
	$.cachedScript = $.cachedScript || function( url, options ) {
		return $.ajax( $.extend( options || {}, { dataType: "script", cache: true, url }) );
	};
	
	const SEARCH_PARAMS = new URLSearchParams(location.search);
	const CLICK_SOUND = 'https://static.findsvoc.com/sound/popdrop.mp3',
		NEXT_SOUND = 'https://static.findsvoc.com/sound/page-flip.mp3',
		CORRECT_SOUND = 'https://static.findsvoc.com/sound/coin.mp3',
		INCORRECT_SOUND = 'https://static.findsvoc.com/sound/egg_crack.mp3';
	
	const newRankModal = { el: 'div', id: 'newRankModal', className: 'modal', tabIndex: '-1', 'data-bs-backdrop': 'static', style: { zIndex: 1071, background: 'radial-gradient(circle, white 25%, #fff4)' }, children: [
		{ el: 'div', className: 'modal-dialog modal-dialog-centered overflow-hidden m-0', style: 'max-width: 100%', children: [
			{ el: 'div', className: 'modal-content bg-transparent border-0', children: [
				{ el: 'div', className: 'modal-header border-0 d-block text-center' },
				{ el: 'div', className: 'modal-body w-100 text-center', style: 'min-height: 77vmin', children: [
					{ el: 'span', className: 'circle-dark', 
					style: { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '70vmin', height: '70vmin', backgroundColor: 'var(--fc-purple)', borderRadius: '37vmin', zIndex: 1 }
					, children: [ { el: 'object', data: 'https://static.findsvoc.com/images/app/egg/new-title.svg',
						style: { position: 'absolute', top: '3vmin', left: '37.5%', width: '25%', height: '20%', zIndex: 2, overflow: 'visible'}}] 
					},
					{ el: 'span', className: 'circle-dark-dashed', style: { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%) translateZ(0)', borderRadius: '37vmin', backgroundColor: 'transparent', border: '2vmin dashed var(--fc-purple)', width: '76vmin', height: '76vmin' }
					}
				]},
				{ el: 'div', className: 'modal-footer d-block border-0 text-center', children: [
					{ el: 'button', className: 'btn btn-outline-fico rounded-5 col-md-2 col-4 fs-5 fw-bold', 'data-bs-dismiss': 'modal', textContent: '닫기'}
				]}
			]}
		]}
	]};
	
	const tts = new FicoTTS();
	$(function() {
		
		
		// 스크롤을 내리면 메뉴를 화면 상단에 고정
		const header = document.querySelector('.craft-header-section');
		const scSection = document.querySelector('.scrolling-section');
		let prevY = scrollY;
		$(window).on('scroll', function(){
			requestAnimationFrame(() => {
				// 헤더 크기(대:150px, 소:35px)에 맞춰서 스타일 변경
				if(scrollY > prevY) { // 스크롤 내림
					if(scrollY > 40) {
						scSection.style.marginTop = '75px';
						header.classList.add('min');
					}
				}else { // 스크롤 올림 
					if(scrollY < 40) {
						scSection.style.marginTop = '0';
						header.classList.remove('min');
					}
				}
				prevY = scrollY;
			})
		});
		// 화면 꺼짐 방지 https://cdn.jsdelivr.net/npm/nosleep.js@0.12.0/dist/NoSleep.min.js (play_craft.html)
		let noSleep = new NoSleep();
		document.addEventListener('click', function enableNoSleep() {
		  document.removeEventListener('click', enableNoSleep, false);
		  noSleep.enable();
		}, false);
		
		// 사운드 로드
		WebAudioJS.load(CLICK_SOUND);
		WebAudioJS.load(NEXT_SOUND);
		WebAudioJS.load(CORRECT_SOUND);
		WebAudioJS.load(INCORRECT_SOUND);
	})
	
	let nextBtnObserver = new IntersectionObserver((entries) => {
		moveSolveBtn(!entries[0].isIntersecting);
	}, { threshold: 1.0})
	
	let solveResults = []; // 연속 맞힘 기록
	let rankClasses = []; // 계급도(ajax)
	let _bookTypeStr; // 플레이 컨텐츠 종류(step, theme, grammar)
	let stepCommand = {}; // 단계별 문제 호출 및 평가 전송 시 전송할 커맨드
	let bookMarkCommand = {}; // 배틀북(단계별 포함) 문제 호출 및 평가 전송 시 전송할 커맨드 (비회원은 사용X)
	let _lastBattleId; // 마지막으로 푼 배틀ID(풀 때마다 갱신됨)
	let isLastPageOfTheBook = false; // 현재 페이지에서는 더 풀 문제가 없음 여부
	let _battleBookId; // 지정된 컨텐츠가 있을 경우 해당 컨텐츠 아이디
	let _todayBattleSolveCount; // 오늘자 배틀 풀이 횟수
	let _todaySolveLimit = 50; // 일일 배틀 풀이 최대 횟수
	const MAX_NUMS_PER_POOL = 25; // 한 번에 가져올 수 있는 최대 배틀 수(이 미만을 가져왔다는 것은 문제가 모자라다는 것)
	let currentBattle, battlePool = [], allBattlePool = []; // 현재 문제, 현재 문제 풀
	let currentView;
	let _memberId, _ageGroup, memberId56; // 사용자 정보
	let _battleRecord; // 배틀 전적 정보
	let currRank, currRankBase, nextRankBase; // 현재 계급명, 현재 및 다음 계급의 시작 정답수
	let _progressNum, _battleSize; // 배틀북 내에서 진행도를 표시하기 위한 변수
	
	/*
	TBD:
		비회원의 경우 FreeMembership 가입할 때부터 memberId 로컬에 저장.
		서버로 문제 요청 시 memberId, battleId, engLevel 전달.
		문제를 조회 혹은 풀 때마다 indexedDB 업데이트하여 저장.
		
	 */
	
	const DB_NAME = 'findsvoc-idb';	// url 호스트별로 유일한 데이터베이스명을 가집니다.
	let DB_VERSION = 2;	// 데이터베이스 버전(테이블 스키마 변경이 필요할 경우 올리세요.)
	//let req, idb, idbstore;
	let storeName;
	let STORE_NAME_BOOKTYPE_MAP = {step: 'StepBattle', theme: 'ThemeBattle', grammar: 'GrammarBattle'};
	// 키릴자모(\u0040~\u04FF)를 이용한 치환 테이블
	const SUBSTITUTION_TABLE = {
		"\u0400": "\"bid\":",
		"\u0401": "\"rnum\":",
		"\u0402": "\"categoryId\":",
		"\u0403": "\"sentenceId\":",
		"\u0404": "\"memberId\":",
		"\u0405": "\"diffLevel\":",
		"\u0406": "\"engLength\":",
		"\u0407": "\"engLevel\":",
		"\u0408": "\"battleType\":",
		"\u0409": "\"eng\":",
		"\u040A": "\"grammarTitle\":",
		"\u040B": "\"askTag\":",
		"\u040C": "\"ask\":",
		"\u040D": "\"source\":",
		"\u040E": "\"comment\":",
		"\u040F": "\"example\":",
		"\u0410": "\"answer\":",
		"\u0411": "\"regDate\":",
		"\u0412": "\"updateDate\":",
		"\u0413": "\"[[",
		"\u0414": "]]\"",
		"\u0415": "],["
	}
	function substitute(inputString) {
		let pattern = new RegExp(Array.from(Object.keys(SUBSTITUTION_TABLE)).join("|"), "g");
		return inputString.replace(pattern, (match) => SUBSTITUTION_TABLE[match]);
	}
	function r_substitute(inputString) {
		let reverseSUBS_TABLE = new Map(Object.entries(SUBSTITUTION_TABLE).map(([key,value]) => [value, key]));
		let pattern = new RegExp(Array.from(reverseSUBS_TABLE.keys()).join("|").replace(/\[/g,'\\['), "g");
		return inputString.replace(pattern, (match) => reverseSUBS_TABLE.get(match));
	}
	function bytes2Battle(bytes) {
		return JSON.parse(substitute(pako.inflateRaw(bytes, { to: 'string'})));
	}
	function battle2Bytes(battle) {
		return pako.deflateRaw(r_substitute(JSON.stringify(battle)));
	}
	
	let selectHistory = []; // 현재 문제에서 선택한 선택지들 모음(1,2,5유형용)
	let allBattleBriefList = [] // 배틀 네비게이션용 목록 (목록에서 골라서 바로 풀기)
	$(document)
	// 단계별 배틀북 제외하고 리뷰배틀/오답배틀/보관배틀에 대한 전체 목록 조회
	.on('click', '.js-history', async function() {
		if(allBattleBriefList.length == 0) {
			await $.getJSON('/craft/battlebook/evaluation/list', {...bookMarkCommand}, list => {
				allBattleBriefList = list;
				// 목록 div 채우기
				$('.list-battle-section').empty().append(
					createElement(Array.from(allBattleBriefList, ({battleId, eng, regDate}, i) => {
						return { el: 'div', className: 'battle-block js-navigate-to', 'data-bid': battleId, children: [
							{ el: 'span', className: 'number', textContent: i + 1 },
							{ el: 'span', className: 'eng', textContent: eng },
							{ el: 'span', className: 'date', textContent: new Date(regDate).format('yyyy.MM.dd') },
						]}
				})));
			});
		}
		
		// 목록 div 펼치기
		if(this.classList.contains('opened')) {
			this.classList.remove('opened');
			anime({
				targets: '.battle-menu-section',
				bottom: ['50vh', 0],
				easing: 'linear',
				duration: 150
			});
		}else {
			this.classList.add('opened');
			// 현재의 순번 찾기
			const currentIndex = allBattleBriefList.findIndex(({battleId}) => battleId == currentBattle.bid);
			const $current = $('.list-battle-section').find('.battle-block').eq(currentIndex).addClass('active');
			$current.siblings('.battle-block').removeClass('active');
			anime({
				targets: '.battle-menu-section',
				bottom: [0, '50vh'],
				easing: 'linear',
				duration: 150,
				changeComplete: () => {
					$current[0].scrollIntoView();
				}
			});
		}
	})
	// 전체 배틀 목록에서 선택하여 풀이 진행
	.on('click', '.js-navigate-to', function() {
		stopAllTTS();
		
		currentView.querySelector('.tts-block')?.remove();
		WebAudioJS.play(NEXT_SOUND);
		$('.js-next-btn').toggleClass('js-solve-btn js-next-btn').text('확인');
		document.querySelector('.craft-layout-content-section').classList.remove('bg-fc-transparent');
		
		// 맞힘/틀림 메세지 숨김
		anime({
			targets: '.js-result-msg',
			bottom: 0,
			height: 0,
			duration: 500,
			easing: 'easeInOutExpo',
			complete: anim => anim.animatables.forEach(msg => msg.target.remove())	
		})
		nextBtnObserver.disconnect();
		
		const selectedIndex = $(this).index('.battle-block');
		_lastBattleId = selectedIndex > 0 ? allBattleBriefList[selectedIndex - 1] : 0;// 선택한 배틀의 이전 배틀 ID
		_progressNum = selectedIndex;
		calcProgress();
		// 문제를 조회(ajax)하여 진행
		_getNextBattles();
		$('.js-history').removeClass('opened');
		anime({
			targets: '.battle-menu-section',
			bottom: ['50vh', 0],
			easing: 'linear',
			duration: 150
		});
	})
	// 배틀 저장(ajax)
	.on('click', '#save-btn', function() {
		WebAudioJS.play(CLICK_SOUND)
		$.getJSON('/craft/battle/save', 
			{ memberId: _memberId, battleBookId: _battleBookId, battleId: currentBattle.bid, save: !currentBattle.saved }, (saved) => {
				currentBattle.saved = saved;
				// 버튼 상태 전환
				$(this).addClass('pe-none');
				anime({
				    targets: this.closest('.save-button-section'),
				    begin: function(anim) {
						anim.animatables[0].target.style.transformOrigin = 'right bottom';
					},
				    scale: [1,1.7,1],
				    rotate: ['0deg', '3deg', '-3deg', '3deg', '0deg'],
				    changeComplete: () => {
						$(this).removeClass('pe-none').toggleClass('reverse', saved);
						// 저장여부를 알리는 메세지
						const saveMsg = createElement({"el":"div","class":'toast battle-save-result-msg fade show',
							"role":"alert","aria-live":"assertive","aria-atomic":"true", "data-bs-autohide": "true", "data-bs-delay": 2000, "textContent": currentBattle.saved?"저장되었습니다.":"저장이 취소되었습니다."})
						this.parentElement.appendChild(saveMsg);
						bootstrap.Toast.getOrCreateInstance(saveMsg).show();
						saveMsg.addEventListener('hidden.bs.toast', () => saveMsg.remove())
					}
				})
				
		}).always((_x,s) => {
			if(s == 'parsererror') {
				loginExpiredModal();
			}});
		
	})
	// 풀이 전송(ajax)
	.on('click', '.js-solve-btn', function() {
		const view = currentView;
		const answers = JSON.parse(currentBattle.answer||"[]");
		const examples = JSON.parse(currentBattle.example||"[]");
		let correct = true;
		
		// 채점 전송 버튼을 단계 넘김 버튼으로 전환 
		$(this).toggleClass('js-solve-btn js-next-btn').text('다음');
		$(view).find('.haptic-btn').addClass('pe-none');
		
		// 배틀타입, 문제 축소버전으로 표시
		$(view).find('.battle-type-block, .ask-block, .simple-ask-block').fadeToggle();
		
		// 각 배틀타입에 맞게 채점 진행
		switch(currentBattle.battleType) {
			case '1': {
				const answerIndexes = [];
				examples.sort(([a], [b]) => a - b).forEach(([start, end], i) => {
					const isAnswer = answers.some(([aStart, aEnd]) => start === aStart && end === aEnd);
					if(isAnswer) answerIndexes.push(i);
				});
				
				view.querySelectorAll('.option').forEach((sel, i) => {
					if(answerIndexes.includes(i)) sel.classList.add('right');
					else if(sel.matches('.selected')) {
						correct = false;
						sel.classList.add('wrong');
					}
				})
				appendSentenceTTSBtns(view.querySelector('.ask-section .sentence'));
				break;
			}
			case '2':
				view.querySelectorAll('.option,.modifier,.modificand').forEach(opt => {
					if (!opt.matches('.selected')) opt.classList.add('unselected');
					
					if(currentBattle.ask.includes('모든')) {
						if(selectHistory.includes(opt) && opt.matches('.modifier, .modificand')) {
							opt.classList.add('right');
						}else if(selectHistory.includes(opt) ^ opt.matches('.modifier, .modificand')) {
							correct = false;
							if(selectHistory.includes(opt)) opt.classList.add('wrong');
						}
					}else {
						if(selectHistory.includes(opt) && opt.matches(selectHistory.indexOf(opt) % 2 ? '.modificand' : '.modifier'))
							opt.classList.add('right');							
						else if (selectHistory.includes(opt)) {
							opt.classList.add('wrong');
							correct = false;
						} else if (opt.matches('.modificand.unselected,.modifier.unselected')) correct = false;
					}
				})
				view.querySelector('.mod-guide-text').remove();
				appendSentenceTTSBtns(view.querySelector('.ask-section .sentence'));
				break;
			case '3': {
				const selectedOpt = view.querySelector('.example-btn-section .active');
				const selectedText = selectedOpt.textContent;
				const selectedIndex = Array.from(view.querySelectorAll('.example-btn-section button')).indexOf(selectedOpt);
				correct = answers.includes(selectedText);

				view.querySelectorAll('.pick-right .pick-option').forEach((opt, i) => {
					if (i === selectedIndex) {
						const className = correct ? 'right' : 'wrong';
						opt.classList.add(className);
					} else if (!correct) {
						opt.classList.add('right');
					}
				})

				view.querySelector('.example-btn-section').style.display = 'none';
				appendSentenceTTSBtns(view.querySelector('.ask-section .sentence'));
				break;
			}
			case '4': {
				const selectedIndex = $(view).find('.example-btn-section .active').index();
				const answerIndexes = [];
				examples.sort(([a], [b]) => a - b).forEach(([start, end], i) => {
					if(null != answers.find(([aStart,aEnd]) => start == aStart && end == aEnd))
						answerIndexes.push(i);
				});
				appendSentenceTTSBtns(view.querySelector('.ask-section .sentence'));
				view.querySelector('.example-btn-section').style.display = 'none';
				view.querySelectorAll('.sentence .option,.sentence .answer-wrong').forEach((sel, i) => {
					if(answerIndexes.includes(i)) {
						sel.classList.add('right');
						// 정답 원문 텍스트 표시
						const rightAnswer = createElement({ 
							el: 'span', className: 'original-text', 
							style: {
								opacity: 0, position: 'absolute', left: `${sel.offsetLeft - 14}px`, top: `${sel.offsetTop}px`
							}, children: [
								{ el: 'span', className: 'label-text', textContent: '정답 : '},
								{ el: 'span', textContent: sel.dataset.answer }
							]});
						sel.parentElement.appendChild(rightAnswer);
						anime({
							targets: rightAnswer,
							top: '-=30',
							opacity: 1,
							delay: 600
						})
					}else if(i == selectedIndex) {
						correct = false;
						sel.classList.add('wrong');
					}
				})
				break;
			}
			case '5':
				correct = view.querySelector('.arranged-example-section').textContent.replace(/\W/g,'').trim() == currentBattle.eng.replace(/\W/g,'').trim();
				view.querySelector('.arranged-example-section').prepend(createElement({ el: 'div', className: 'full-sentence', textContent: currentBattle.eng}));
				view.querySelector('.example-btn-section').style.display = 'none';
				appendSentenceTTSBtns(view.querySelector('.arranged-example-section .full-sentence'));
				break;
			case '6':
				const rightOptions = Array.from(examples, ([ [], text ]) => {
					return text.split(/\s+/);
				}).reduce((acc, curr) => (acc).concat(curr), []);
				view.querySelectorAll('.example-btn-section input').forEach((input, i) => {
					if(input.value.trim().toLowerCase() == rightOptions[i].toLowerCase()) {
						input.className = 'right';
					}else {
						input.className = 'wrong';
						correct = false;
					}
				})
				view.querySelector('.arranged-example-section').prepend(createElement({ el: 'div', className: 'full-sentence', textContent: currentBattle.eng}))
				appendSentenceTTSBtns(view.querySelector('.arranged-example-section .full-sentence'));
				break;
			case '7': {
				/*let options = Array.from((currentBattle.answer?currentBattle.ask:currentBattle.kor).split(/\s+/), option => option.replace(/[,.!?]$/,''));
				let tempOption = '';
				options = options.reduce((acc, curr, i, arr) => {
					if(curr.length > 1) {
						const newAcc = (acc||[]).concat([ tempOption.length > 0 ? `${tempOption} ${curr}` : curr ]);
						tempOption = '';
						return newAcc;
					}else {
						tempOption += tempOption.length > 0 ? ` ${curr}` : curr;
						if(i == arr.length - 1) {
							return (acc||[]).concat([ tempOption ]);
						}else return acc;
					}
				},[]);			*/
				const answers_exclude_symbols = Array.from(answers, a => a.replace(/[,.!?]$/,''));
				if(view.querySelectorAll('.arranged-example-section .btn').length != answers.length){
					view.querySelectorAll('.arranged-example-section .btn').forEach( option => {
						if(answers_exclude_symbols.includes(option.textContent)) {
							option.classList.add('right');
						}else {
							option.classList.add('wrong');
						}
					})					
					correct = false;
				} 
				else {
					view.querySelectorAll('.arranged-example-section .btn').forEach( option => {
						if(answers_exclude_symbols.includes(option.textContent)) {
							option.classList.add('right');
						}else {
							option.classList.add('wrong');
							correct = false;
						}
					})
				}
				view.querySelector('.arranged-example-section').prepend(
					createElement({ el: 'div', className: 'full-sentence', textContent: answers.join(' ')
				}));
				view.querySelector('.example-btn-section').style.display = 'none';
				appendSentenceTTSBtns(view.querySelector('.ask-section .sentence'));
				break;
			}
			case '8': {
				const activeBtn = view.querySelector('.example-btn-section .active');
				const sentenceEl = view.querySelector('.ask-section .sentence');
				appendSentenceTTSBtns(sentenceEl);
				view.querySelector('.example-btn-section').style.display = 'none';

				correct = answers.includes(activeBtn.textContent);
				const pickRightEl = view.querySelector('.sentence .pick-right');
				pickRightEl.textContent = correct ? answers[0] : activeBtn.textContent;
				pickRightEl.classList.add(correct ? 'right' : 'wrong');

				if (!correct) {
					const rightAnswerEl = createElement({
						el: 'span',
						className: 'original-text',
						style: {
							opacity: 0,
							position: 'absolute',
							left: `${pickRightEl.offsetLeft - 14}px`,
							top: `${pickRightEl.offsetTop}px`
						}, children: [
							{ el: 'span', className: 'label-text', textContent: '정답 : '},
							{ el: 'span', textContent: answers[0] }
						]
					});
					pickRightEl.parentElement.appendChild(rightAnswerEl);

					anime({
						targets: rightAnswerEl,
						top: '-=30',
						opacity: 1,
						delay: 600
					});
				}
				break;	
			}
			default: break;
		}
		// 정답문장 듣기 버튼 표시
		function appendSentenceTTSBtns(parent) {
			parent.appendChild(createElement({ el: 'div', className: 'tts-block text-end', style: { transform: 'scale(0)'}, children:[
				{ el: 'button', id: 'ttsPlay', class: 'btn d-inline w-auto text-info ms-2 p-0 material-icons-outlined fs-2 border-0 shadow-none bg-transparent',
					'data-bs-toggle': 'tooltip', title: '문장 듣기/중지', 'data-playing': 'false', textContent: 'play_circle',
					onclick: function() {
						const on = this.dataset.playing == 'true';
						if(on) {
							stopAllTTS();
						}else {
							stopAllTTS(this);
							this.dataset.playing = 'true';
							this.textContent = 'stop_circle';
							tts.speakRepeat(currentBattle.eng, 2, 1000, () => {
								this.dataset.playing = 'false';
								this.textContent = 'play_circle';
							});
						}
						
						
						
						
						
						
					}
				},{ el: 'button', id: 'ttsSetting', class: 'btn d-inline w-auto text-info ms-2 p-0 material-icons-outlined fs-2 border-0 shadow-none bg-transparent',
					'data-bs-toggle': 'tooltip', title: '음성 설정', textContent: 'tune', onclick: function() {
						stopAllTTS();
						tts.openSettings();
			}}]}));
			anime({
				targets: view.querySelector('.tts-block'),
				scale: 1,
				delay: 600,
				complete: () => {
					if(tts.autoEnabled()) {
						view.querySelector('#ttsPlay')?.dispatchEvent(new Event('click'));
					}
				} 
			})
		}
		// 오늘자 풀이량 카운트
		if(bookMarkCommand.markType === 'b') {
			_todayBattleSolveCount.count++;
			window.localStorage.setItem(`TCBSC_${ntoa(_memberId)}`, JSON.stringify(_todayBattleSolveCount));
		}
		// 맞힘/틀림에 따른 알림
		WebAudioJS.play(correct ? CORRECT_SOUND : INCORRECT_SOUND);
		const resultToast = createElement({"el":"div","class":'js-result-msg result-toast',
								style: { transformOrigin: 'top'}});
		document.querySelector('.craft-header-section').append(resultToast);
		// 해설화면에 달수 캐릭터 안보이도록 투명화
		//document.querySelector('.craft-layout-content-section').classList.add('bg-fc-transparent');
		anime.timeline({
			targets: resultToast,
		}).add({
			begin: function(anim) {
				const _this = anim.animatables[0].target;
				_this.textContent = correct ? '정답입니다.' : '오답입니다.';
				_this.style.visibility = 'visible';
				_this.style.color = '#00000000';
				_this.style.backgroundColor = correct ? '#00bcd4' : '#f44336';
			},
			bottom: '-2em',
			width: ['2rem', '50%'],
			height: ['0rem', '2rem'],
			duration: 1000,
			easing: 'easeInOutExpo'
		}).add({
			color: '#FFF',
			easing: 'linear'
		})/*.add({
			delay: 2000,
			begin: () => resultToast.style.transformOrigin = 'top',
			bottom: 0,
			height: 0,
			easing: 'easeInOutExpo',
			complete: () => resultToast.remove()
		})*/;
		// 틀렸을 땐 짜릿한 진동 벌칙
		if(!correct) {
			if(window.ANI && window.ANI?.vibrate) {
				window.ANI.vibrate([200,50,100,50,100]);
			}else if(navigator?.vibrate) {
				navigator.vibrate([200,50,100,50,100]);
			}
		}
		_lastBattleId = currentBattle.bid;
		const command = { memberId: _memberId, ageGroup: _ageGroup, battleBookId: _battleBookId, 
					battleBookMarkId: bookMarkCommand.markId,
					battleId: currentBattle.bid, correct, save: Boolean(currentBattle.saved) };
		if(_memberId == 0 && memberId56 != null) command['memberId56'] = memberId56; 
		if(bookMarkCommand != null && bookMarkCommand.markType != null) command['markType'] = bookMarkCommand.markType;
		// 설명 펼치기
		$(view).find('.explain-section').slideDown(500).find('.comment-section').html(currentBattle.comment || '작성된 코멘트가 없습니다.');
		// (ajax) 해설정보 조회 및 표시
		$.getJSON(`/craft/battle/${currentBattle.sentenceId}`, battleAnswerInfo => 
				displayAnswerInfo(currentBattle.eng, view.querySelector('.explain-section'), battleAnswerInfo))
		.always((_x, s) => {
			if(s == 'parsererror') { // 세션 만료로 인해 JSON이 아닌 로그인 페이지 html을 받은 경우
				loginExpiredModal();
			}else {
				// (ajax) 배틀 채점 정보 전송 ! 배틀북 내의 가장 나중 배틀보다 이전의 배틀을 풀었을 땐 전송하지 않는다.
				$.ajax({
					url: '/craft/battle/evaluation/add',
					type: 'GET', contentType: 'application/json', data: command,
					success: async() => { 
						if(!!_memberId || !!memberId56) {
							if(correct) { 
								_battleRecord.correct++;
							}
							if(_memberId == 0) {
								const db = await idb.openDB(DB_NAME, DB_VERSION);
								const tx = db.transaction(storeName, 'readwrite');
								const store = tx.objectStore(storeName);
								const index = store.index('bid');
								
								for await(const cursor of index.iterate(ntoa(currentBattle.bid))) {
									const record = { ...cursor.value, solve: (correct ? 'O': 'X')}
									cursor.update(record);
								}
								await tx.done;
								
								//const item = { data: battle2Bytes(currentBattle) };							
								//item.solve = correct? 'O': 'X';
								//await db.put(storeName, item, keyPath);
								/*req = indexedDB.open(DB_NAME, DB_VERSION);
								req.onsuccess = function() {
									idb = this.result;
									const tx = idb.transaction(['StepBattle'], 'readwrite');
									tx.onabort = idbAbort;												
									idbstore = tx.objectStore('StepBattle');
									idbstore.index('bid').openCursor().onsuccess = function() {
										let cursor = this.result;
										if(cursor) {
											if(cursor.key == currentBattle.bid) {
												const record = cursor.value;
												record.solve = correct? 'O': 'X';
												cursor.update(record);
											}
											cursor.continue();
										}
									};
								};	*/
							}
							moveSolveBtn(true);
							if(_progressNum != null) _progressNum++;
							calcProgress();
							// (리뷰/오답/보관 제외)배틀을 끝까지 다 풀었으면 lastBattleId = -1 호출
							if(bookMarkCommand.markType === 'b' && _progressNum >= _battleSize) {
								$.getJSON(`/craft/battlebook/${_bookTypeStr}`, {...bookMarkCommand, lastBattleId: -1});
								//solveAllsOfBook();
							}
						}else {
							moveSolveBtn(true);
							if(_progressNum != null) _progressNum++;
						}
					},
					error: () => alert('채점 전송에 실패했습니다. 재로그인 후 다시 시도해 주세요.'),
					complete: (_x,s) => {
						if(s == 'parsererror') loginExpiredModal();
					}
				})
			}
		});
	})
	// 단계 넘김 버튼을 누르면 단계 넘김 버튼을 다시 채점 전송 버튼으로 전환 후 다음 문제 진행
	.on('click', '.js-next-btn', function(e) {
		stopAllTTS();
		if(bookMarkCommand.markType === 'b' && _todayBattleSolveCount.count >= _todaySolveLimit) {
			solveLimitExceed();
			e.preventDefault();
			e.stopPropagation();
			return;
		}
		
		currentView.querySelector('.tts-block')?.remove();
		WebAudioJS.play(NEXT_SOUND);
		$(this).toggleClass('js-solve-btn js-next-btn').text('확인');
		document.querySelector('.craft-layout-content-section').classList.remove('bg-fc-transparent');
		
		// 맞힘/틀림 메세지 숨김
		anime({
			targets: '.js-result-msg',
			bottom: 0,
			height: 0,
			duration: 500,
			easing: 'easeInOutExpo',
			complete: anim => anim.animatables.forEach(msg => msg.target.remove())	
		})
		nextBtnObserver.disconnect();
		// 클라이언트에 남은 다음 문제 진행
		if(battlePool.length > 0) {
			_askStep();
		}
		else if(isLastPageOfTheBook) {
			//$.getJSON(`/craft/battlebook/${_bookTypeStr}`, {...bookMarkCommand, lastBattleId: -1});
			solveAllsOfBook();
		}
		// 남은 문제가 없으면 새로 문제를 조회(ajax)하여 진행	
		else _getNextBattles();		
	})
	// svoc 분석이 펼쳐질 때 줄바꿈 재처리
	.on('shown.bs.collapse', '.svoc-section', function() {
		tandem.correctMarkLine(this.querySelector('.semantics-result'))
	})
	// 햅틱 효과
	.on('click', '.haptic-btn', function() {
		if(!this.textContent.match(/[^\w\s,.!?'"]/))
			tts.speak(this.textContent);
		else
			WebAudioJS.play(CLICK_SOUND);
	})
	
	/** 다음 20문제 가져오기
	*/
	function _getNextBattles() {
		
		// 이미 화면 내에 갖고 있는 문제라면
		if(allBattlePool[_progressNum]) {
			const firstUndefinedIndex = allBattlePool.slice(_progressNum).findIndex(x => x === undefined);
			battlePool = firstUndefinedIndex === -1 ? allBattlePool.slice(_progressNum) 
				: allBattlePool.slice(_progressNum, _progressNum + firstUndefinedIndex);
			isLastPageOfTheBook = (_progressNum + battlePool.length >= _battleSize);
			_askStep();
			return;
		}
		
		const url = `/craft/battlebook/${_bookTypeStr}`;
		const data = _bookTypeStr === 'step' && bookMarkCommand.markType === 'b'
  			? { ...stepCommand, ...bookMarkCommand, lastBattleId: _lastBattleId, rankLevel: currRank.battleLevel }
  			: { ...bookMarkCommand, lastBattleId: _lastBattleId };
  		
  		// 서버로부터 문제 조회
		$.getJSON(url, data, function(battles) {
			battlePool = battles;
			isLastPageOfTheBook = (_bookTypeStr == 'step' && battles.length < MAX_NUMS_PER_POOL || _progressNum + battles.length >= _battleSize);
			if(battles.length == 0) {
				// 1. 방문자는 그대로 종료
				if(!_memberId && !memberId56) {
					solveAllsOfBook
				}
				// 처음 진입부터 풀 배틀이 없는 경우는 
				// 2. 이 배틀북을 진행할 조건이 미달하거나
				else if(currentBattle == null && _lastBattleId == 0) {
					solveAllsOfBook();
				}
				// 3. 지난 회차에서 배틀북 끝까지 풀고 그만두거나
				// 	다시 첫문제로 돌아온 후 아직 풀이를 안 한 상황
				else if(currentBattle == null && _lastBattleId != -1) {
					_lastBattleId = -1;
					_progressNum = 0;
					calcProgress();
					_getNextBattles();
				} else solveAllsOfBook();
			}
			else { // 조회된 문제가 있을 경우
				// 전체 배틀 풀에 추가
				battles.forEach((battle, i) => {
					allBattlePool[i + _progressNum] = battle;
				});
				if(_memberId == 0 && Cookies.get('FMID')) {
					// 무료회원은 조회된 문제들을 모두 IndexedDB에 저장한다.
					idb.openDB(DB_NAME, DB_VERSION).then(async db => {
						const tx = db.transaction(storeName, 'readwrite');
						await Promise.all(Array.from(battles, battle => {
							return tx.store.add({bid: ntoa(battle.bid), data: battle2Bytes(battle), solve: '' });
						}).concat([tx.done]))
						_askStep();
					})
					
					/*req = indexedDB.open(DB_NAME, DB_VERSION);
					req.onsuccess = function() {
						idb = this.result;
						const tx = idb.transaction(['StepBattle'], 'readwrite');
						tx.onabort = idbAbort;
						idbstore = tx.objectStore('StepBattle');
						idbstore.openCursor().onsuccess = insertNext;
						
						let i = 0;
						function insertNext() {
							if(i < battles.length) {
								const battle = battles[i++];
								idbstore.add({ bid: battle.bid, data: battle, solve: '' }, battle.bid)
										.onsuccess = insertNext;
							}else {
								_askStep();
							}
						}
					};*/				
				}else _askStep();
			}
		}).fail(() => {
			if(currentBattle == null && _lastBattleId != -1) {
				_lastBattleId = -1;
				_getNextBattles();
			}else solveAllsOfBook();			
		});
	}
	
	// 한 문제 플레이어에 표시
	function _askStep() {
		currentBattle = battlePool.shift();
		if(bookMarkCommand.markType == 's') currentBattle.saved = true;
		selectHistory = [];
		currentView = document.getElementById(`battle-${currentBattle.battleType}`);

		const ask = currentView.querySelector('.ask-block .ask');
		const simpleAsk = currentView.querySelector('.simple-ask-block .ask');
		const sentence = currentView.querySelector('.sentence');
		const eng = currentBattle.eng;
		const answers = JSON.parse(currentBattle.answer||"[]");
		const examples = JSON.parse(currentBattle.example||"[]");
		let offsetPos = 0, leftStr, options = [];
		const contextChildren = [];

		scrollTo(0,0);
		document.querySelector('.craft-header-section').classList.remove('min');
		document.querySelector('.scrolling-section').style.marginTop = '0';
		
		$(currentView).find('.battle-type-block, .ask-block').show();
		$(currentView).find('.simple-ask-block').hide();
		
		// 배틀 타입 표시
		currentView.querySelector('.battle-type').textContent = currentBattle.battleType;
		
		// 저장여부 표시
		$('#save-btn').toggleClass('reverse', Boolean(currentBattle.saved));
		
		// 선택지 표시
		if(currentView.querySelector('.example-btn-section'))
			currentView.querySelector('.example-btn-section').style.display = '';
		
		// 다른 배틀 섹션 숨김
		$(currentView).show().siblings('.battle-section').hide();
		anime({
			targets: currentView,
			duration: 1000,
			delay: 300,
			left: ['100vw', 0],
		})
		// 확인버튼 숨김
		moveSolveBtn(true);
			
		// 해설 숨김
		$(currentView).find('.explain-section').hide().find('.collapse').collapse('hide');
		

		switch(currentBattle.battleType) {
			case '1' : {
				// 질문 표시
				ask.textContent = `다음 문장의 ${currentBattle.ask}를 선택하세요.`;
				simpleAsk.textContent = ask.textContent;
				// 본문 표시
				examples.forEach(([ start, end ], j, arr) => {
					leftStr = eng.substring(offsetPos, start);
					if(leftStr) contextChildren.push(leftStr);
					contextChildren.push({
						el: 'span', role: 'button', className: 'option haptic-btn shadow-none', 
						textContent: eng.substring(start, end),
						onclick: function() {
							$(this).toggleClass('selected');
							
							moveSolveBtn(sentence.querySelectorAll('.selected').length == 0);
						}
					});
					if(j == arr.length - 1 && end < eng.length) {
						contextChildren.push(eng.substring(end));
					}
					offsetPos = end;
				});
				sentence.replaceChildren(createElement(contextChildren));
				break;
			}
			case '2' : {
			
				const modGuideText = createElement({el: 'span', class: 'mod-guide-text'});
				// 질문 표시
				if(currentBattle.ask.includes('모든')) {
					ask.textContent = `${currentBattle.ask.includes('피수식')?'피수식어':'수식어'}를 모두 선택하세요.`;
					modGuideText.textContent = `${currentBattle.ask.includes('피수식')?'피수식어':'수식어'} 선택`;
					$(modGuideText).addClass(currentBattle.ask.includes('피수식')?'text-modificand':'text-modifier');
				}else if(currentBattle.ask.match(/의 수식|의 피수식/)) {
					ask.textContent = `${currentBattle.ask}어를 선택하세요.`;
					modGuideText.textContent = `${currentBattle.ask.includes('피수식')?'피수식어':'수식어'} 선택`;
					$(modGuideText).addClass(currentBattle.ask.includes('피수식')?'text-modificand':'text-modifier');
				}else {
					ask.textContent = `[${currentBattle.ask}] 수식어와 피수식어를 선택하세요.`;
					modGuideText.textContent = '수식어 선택' // 항상 수식어부터 선택하도록.
					$(modGuideText).addClass('text-modifier');
				}
				
				currentView.querySelector('.ask-section').appendChild(modGuideText);
				simpleAsk.textContent = ask.textContent;
				// 본문 표시
			 	const [ modifiers, modificands ] = answers;
			 	const optionDummy = { el: 'span', role: 'button', onclick: function() {
					// 선택 해제
					if(this.matches('.selected')) {
						const searchedIndex = selectHistory.indexOf(this);
						
						(selectHistory.splice(searchedIndex, 1))[0].classList.remove('selected', 'text-modifier', 'text-modificand');
						
						// 선택 해제 시 수식어-피수식어 쌍을 선택하는 문제에서는 선택 같이 해제되도록.
						// 다시 수식어부터 선택해야 함.
						if(currentBattle.ask.match(/모든|의 수식|의 피수식/) == null) {
							const pairNum = Math.floor(searchedIndex / 2) * 2 + (1 - searchedIndex % 2);
							const indexToDelete = pairNum > searchedIndex ? searchedIndex : (searchedIndex - 1);
							
							if(selectHistory[indexToDelete]) {
								(selectHistory.splice(indexToDelete, 1))[0].classList.remove('selected');
							}
							
							modGuideText.textContent = selectHistory.length % 2 ? '피수식어 선택' : '수식어 선택';
							$(modGuideText).addClass('text-modifier').removeClass('text-modificand');
						}else if(selectHistory.length == 0) {
							const findingModificand = currentBattle.ask.includes('피수식');
							$(modGuideText).toggleClass('text-modifier', !findingModificand);
							$(modGuideText).toggleClass('text-modificand', findingModificand);
						}
					// 선택 추가
					}else {
						this.classList.add('selected');
						selectHistory.push(this);
						if(currentBattle.ask.match(/모든|의 수식|의 피수식/) == null) {
							modGuideText.textContent = `${['수식어','피수식어'][selectHistory.length % 2]} 선택`;
							const findingModificand = selectHistory.length % 2 == 1;
							this.classList.add(findingModificand ? 'text-modifier' : 'text-modificand');
							$(modGuideText).toggleClass('text-modifier', !findingModificand);
							$(modGuideText).toggleClass('text-modificand', findingModificand);
						}else {
							const findingModificand = currentBattle.ask.includes('피수식');
							this.classList.add(findingModificand ? 'text-modificand' : 'text-modifier');
						}
					}
					moveSolveBtn(selectHistory.length == 0);
				}}
			 	// answerArr = [[start,end,class],[start,end,class],...] (class: modifier, modificand)
			 	const answerArr = Array.from(modifiers, modifier => modifier.concat('modifier'))
		 						.concat(Array.from(modificands, modificand => modificand.concat('modificand')));
				answerArr.sort(([a], [b]) => a - b).forEach(([ start, end, className ], j, arr) => {
					leftStr = eng.substring(offsetPos, start);
					if(leftStr) {
						if(leftStr.includes(' ')) {
							Array.from(leftStr.split(' ').filter(s => s.length > 0), s => {
								return Object.assign({ className: `option d-inline-block haptic-btn shadow-none`, textContent: s }, optionDummy);
							}).forEach( el => contextChildren.push(el, ' '));
						}else contextChildren.push(leftStr, ' ');
					}
					contextChildren.push(Object.assign({ className: `${className} d-inline-block haptic-btn shadow-none`, textContent: eng.substring(start, end) }, optionDummy));
					if(end < eng.length) contextChildren.push(' ');
					if(j == arr.length - 1 && end < eng.length) {
						if(eng.indexOf(' ', end) > -1) {
							Array.from(eng.substring(end).split(' ').filter(s => s.length > 0), s => {
								return Object.assign({ className: 'option d-inline-block haptic-btn shadow-none', textContent: s }, optionDummy);
							}).forEach( el => contextChildren.push(el, ' '));
						}else contextChildren.push(eng.substring(end));
					}
					offsetPos = end;
				});
				
				sentence.replaceChildren(createElement(contextChildren));
				break;
			}
			case '3' : {
				/* 맞는 어법 찾기.
					example = [[대상start,대상end],정답텍스트,오답텍스트]
					answer = [정답텍스트]
				*/
				const [[ blankStart, blankEnd ], answerText, wrongText ] = examples;
				leftStr = eng.substring(offsetPos, blankStart);
				if(leftStr) contextChildren.push(leftStr);
				options = [answerText, wrongText].sort(() => Math.random() - 0.5);
				contextChildren.push({
					el: 'span',
					className: 'pick-right',
					'data-answer': answerText, children: [
						'[ ', 
						{ el: 'span', class: 'pick-option', textContent: options[0] },
						' / ',
						{ el: 'span', class: 'pick-option', textContent: options[1] },
						' ]'
					]
				});				
				if(blankEnd < eng.length)
					contextChildren.push(eng.substring(blankEnd));
				sentence.replaceChildren(createElement(contextChildren));	
					
				currentView.querySelector('.example-btn-section').replaceChildren(
					createElement(Array.from(options, option => {
						return { el: 'button', className: 'btn btn-outline-fico haptic-btn shadow-none', textContent: option , onclick: function() {
							$(this).addClass('active').siblings().removeClass('active');
							moveSolveBtn(false);
						}};
				})));
				break;
			}
			case '4' : {
				/* 틀린 어법 찾기.
					example = [[보기1start,보기1end],[보기2start,보기2end],...]
					answer = [[정답start,정답end],정답텍스트,오답텍스트]
				 */
				const [[ answerStart, answerEnd ], answer, wrong ] = answers;
				// 보기 표시
				examples.sort(([a], [b]) => a - b).forEach(([ start, end ], j, arr) => {
					leftStr = eng.substring(offsetPos, start);
					if(leftStr) contextChildren.push(leftStr);
					let optionText = eng.substring(start, end);
					const span = {
						el: 'span',
						className: 'option text-decoration-underline', 
						textContent: optionText
					};
					if(answerStart == start && answerEnd == end) {
						span.className = 'answer-wrong text-decoration-underline';
						span.textContent = wrong;
						optionText = wrong;
						span['data-answer'] = answer;
					}
					contextChildren.push(span);
					// 선택지 추가
					options.push({ el: 'button', className: 'btn btn-outline-fico haptic-btn shadow-none', textContent: optionText, onclick: function() {
							$(this).addClass('active').siblings().removeClass('active');
							moveSolveBtn(false);
						}});
					if(j == arr.length - 1 && end < eng.length) {
						contextChildren.push(eng.substring(end));
					}
					offsetPos = end;
				});		
				sentence.replaceChildren(createElement(contextChildren));		
				currentView.querySelector('.example-btn-section').replaceChildren(createElement(options));
				break;	
			}
			case '5' : {
				/* 배열하기.
					example = [[보기1start,보기1end],[보기2start,보기2end],...]
				 */
				 
				// 해석 표시
				sentence.replaceChildren(currentBattle.kor)
				// 보기 표시
				const arrangedSection = currentView.querySelector('.arranged-example-section');
				
				// 문제가 문장의 일부만 있을 경우 텍스트와 빈칸을 조합하여 문제로 표시
				if(Array.from(examples, ([start,end]) => eng.substring(start, end)).join('').replace(/\W/g,'').length
				!= eng.replace(/\W/g,'').length) {
					examples.forEach(([ start, end ], j, arr) => {
						// 문장의 끝이 아닌 어구가 구두점으로 끝날 경우 구두점까지 포함하여 보기로 표시
						const endWithComma = end + ((end < eng.length - 1 && /[,.]/.test(eng.charAt(end)))? 1 : 0)
						leftStr = eng.substring(offsetPos, start);
						if(leftStr) contextChildren.push(leftStr);
						if(start == 0 || (leftStr != null && leftStr.match(/\w/g) != null)) {
							contextChildren.push({
								el: 'div', className: 'arranged-example d-inline-block', 'data-full': 1
							});
						}else {
							if(typeof contextChildren[contextChildren.length - 1] == 'object')
								contextChildren[contextChildren.length - 1]['data-full']++;
							else
								contextChildren[contextChildren.length - 2]['data-full']++;
						}
						if(j == arr.length - 1 && end < eng.length) {
							contextChildren.push(eng.substring(end));
						}
						offsetPos = endWithComma;										
						
					})
				}else contextChildren.push({el: 'div', className: 'arranged-example d-inline-block'})
				
			 	examples.sort(() => Math.random() - 0.5).forEach(([ start, end ], i) => {
					// 문장의 끝이 아닌 어구가 구두점으로 끝날 경우 구두점까지 포함하여 보기로 표시
					const endWithComma = end + ((end < eng.length - 1 && /[,.]/.test(eng.charAt(end)))? 1 : 0)
					options.push({ el: 'span', className: 'btn btn-outline-fico haptic-btn shadow-none', 
						'data-opt': i, textContent: eng.substring(start, endWithComma), onclick: throwSelect
					});
				});
				currentView.querySelector('.example-btn-section').replaceChildren(createElement(options));
				// 선택 초기화
				arrangedSection.replaceChildren(createElement(contextChildren));
				$(currentView).find('.arranged-example,.example-btn-section').sortable({
					items: '.haptic-btn',
					connectWith: '.arranged-example:not(.full),.example-btn-section'
				})
				// 보기가 다시 선택지 영역으로 들어오면 서브밋 버튼 표시 변경
				.on('sortreceive', (e,ui) => {
					if(e.target.matches('.example-btn-section')) {
						const optNum = ui.item[0].dataset.opt;
						if(ui.sender[0].dataset.full != null) ui.sender[0].classList.remove('full');
						$(currentView).find(`arranged-example [data-opt="${optNum}"]`).remove();
						$(currentView).find(`.example-btn-section [data-opt="${optNum}"]`).not(ui.item[0]).show().removeClass('selected pe-none');
					}else {
						if(e.target.dataset.full != null && e.target.childElementCount >= parseInt(e.target.dataset.full))
							e.target.classList.add('full');
					}
					moveSolveBtn(currentView.querySelectorAll('.arranged-example .haptic-btn').length != JSON.parse(currentBattle.example).length);
				$(currentView).find('.example-btn-section')
				}).on('sortover', (_e,ui) => {
					const optNum = ui.item[0].dataset.opt;
					$(currentView).find(`.example-btn-section [data-opt="${optNum}"]`).not(ui.item[0]).hide();
				}).on('sortout', (_e,ui) => {
					const optNum = ui.item[0].dataset.opt;
					if(ui.sender[0]?.matches('.arranged-example'))
						$(currentView).find(`.example-btn-section [data-opt="${optNum}"]`).not(ui.item[0]).show();
				})
				
				break;
			}
			case '6' : {
				/** 빈칸 채우기
					example = [[[대상start,대상end],정답텍스트],[[대상start,대상end],정답텍스트]]
				 */
				 examples.sort(([[a]],[[b]]) => a - b).forEach(([[ start, end ], text], j, arr) => {
					leftStr = eng.substring(offsetPos, start);
					if(leftStr) contextChildren.push(leftStr);
					
					text.split(/\s+/).forEach((token, i) => {
						if(i > 0) contextChildren.push(' ')
						if(token.length > 0) {
							contextChildren.push({
								el: 'input', type: 'text', style: { width: `${token.length}em`}, pattern: '[0-9A-z!?.,]',
								placeholder: token.length > 1 ? token.substring(0,1) : '', autocapitalize: 'off',
								autocomplete: 'off', autocorrect: 'off', spellcheck: "false",
								onfocus: function() {
									this.placeholder = '';
									// 타이핑 위치와 확인버튼이 겹치면 스크롤 이동
									const thisTop = this.getBoundingClientRect().top;
									const nextBtnTop = document.querySelector('.js-next-btn, .js-solve-btn').getBoundingClientRect().top;
									const topDiff = Math.abs(nextBtnTop - thisTop);
									if(topDiff < 76.5) {
										scrollTo(scrollX, scrollY + 76.5 - topDiff);
									}
								}, onblur: function() {
									this.placeholder = token.length > 1 ? token.substring(0,1) : '';
								}
							});
						}
					})
					if(j == arr.length - 1 && end < eng.length) {
						contextChildren.push(eng.substring(end));
					}
					offsetPos = end;					
				});
				currentView.querySelector('.arranged-example-section').replaceChildren();
				currentView.querySelector('.ask-section .sentence.kor').textContent = currentBattle.kor;
				currentView.querySelector('.example-btn-section').replaceChildren(createElement(contextChildren));
				$(currentView).on('input', '.example-btn-section input', function() {
					moveSolveBtn(!Array.from(currentView.querySelectorAll('.example-btn-section input')).every(input => input.value.length > 0));
				})
				break;
			}
			case '7' : {
				/** 해석 배열하기
				  	answer = [정답1, 정답2]
					example = [오답1, 오답2]
					ask = [밑줄 칠 위치]
				 */
				let options = [...examples, ...answers];
				currentView.querySelector('.ask-section .sentence.eng').textContent = eng;
				
				// 부분해석 범위가 있는 경우, sentence의 해당 범위를 밑줄 처리
				if(currentBattle.ask.match(/\[.*]/)) {
					const answerRange = new Range();
					const askRange = JSON.parse(currentBattle.ask)[0]
					answerRange.selectNode(sentence.firstChild)
					answerRange.setStart(sentence.firstChild, askRange[0]);
					answerRange.setEnd(sentence.firstChild, askRange[1]);
					answerRange.insertNode(createElement({el: 'span', 
						className: 'text-decoration-underline', textContent: answerRange.extractContents().textContent
					}));
				}
				const arrangedSection = currentView.querySelector('.arranged-example-section');
				let tempOption = '';
				options = options/*.reduce((acc, curr, i, arr) => {
					if(curr.length > 1) {
						
						const newAcc = (acc||[]).concat([ tempOption.length > 0 ? `${tempOption} ${curr}` : curr ]);
						tempOption = '';
						return newAcc;
					}else {
						tempOption += tempOption.length > 0 ? ` ${curr}` : curr;
						if(i == arr.length - 1) {
							return (acc||[]).concat([ tempOption ]);
						}else return acc;
					}
					// 오답을 선택지에 추가하여 랜덤섞기
				}, []).concat(examples)*/.sort(() => Math.random() - 0.5);
				options.forEach( option => {
					contextChildren.push({ el: 'span', className: 'btn btn-outline-fico haptic-btn shadow-none', 
						textContent: option.replace(/[,.!?]$/,''), onclick: throwSelect
					});					
				})
				// 선택 초기화
				arrangedSection.replaceChildren(createElement({el: 'div', className: 'arranged-example d-inline-block'}));
				$(arrangedSection).sortable({
					items: '> .haptic-btn'
				});
				$(currentView).find('.arranged-example,.example-btn-section').sortable({
					items: '.haptic-btn',
					connectWith: '.arranged-example:not(.full),.example-btn-section'
				})
				// 보기가 다시 선택지 영역으로 들어오면 서브밋 버튼 표시 변경
				.on('sortreceive', (e,ui) => {
					if(e.target.matches('.example-btn-section')) {
						const optNum = ui.item[0].dataset.opt;
						$(currentView).find(`arranged-example [data-opt="${optNum}"]`).remove();
						$(currentView).find(`.example-btn-section [data-opt="${optNum}"]`).not(ui.item[0]).show().removeClass('selected pe-none');
					}
					moveSolveBtn(currentView.querySelectorAll('.arranged-example .haptic-btn').length != JSON.parse(currentBattle.example).length);
				$(currentView).find('.example-btn-section')
				}).on('sortover', (_e,ui) => {
					const optNum = ui.item[0].dataset.opt;
					$(currentView).find(`.example-btn-section [data-opt="${optNum}"]`).not(ui.item[0]).hide();
				}).on('sortout', (_e,ui) => {
					const optNum = ui.item[0].dataset.opt;
					if(ui.sender[0]?.matches('.arranged-example'))
						$(currentView).find(`.example-btn-section [data-opt="${optNum}"]`).not(ui.item[0]).show();
				})
				currentView.querySelector('.example-btn-section').replaceChildren(createElement(contextChildren));
				break;
			}
			case '8' : {
				/* 맞는 어법 찾기.
					example = [[대상start,대상end],정답텍스트,[오답텍스트1,오답텍스트2,...]]
					answer = [정답텍스트]
				*/
				const [[ blankStart, blankEnd ], answerText, wrongTexts ] = examples;
				leftStr = eng.substring(offsetPos, blankStart);
				if(leftStr) contextChildren.push(leftStr);
				wrongTexts.push(answerText);
				options = wrongTexts.sort(() => Math.random() - 0.5);
				contextChildren.push({
					el: 'span',
					className: 'pick-right',
					'data-answer': answerText, 
					textContent: '-------'
				});				
				if(blankEnd < eng.length)
					contextChildren.push(eng.substring(blankEnd));
				sentence.replaceChildren(createElement(contextChildren));	
					
				currentView.querySelector('.example-btn-section').replaceChildren(
					createElement(Array.from(options, option => {
						return { el: 'button', className: 'btn btn-outline-fico haptic-btn shadow-none', textContent: option , onclick: function() {
							$(this).addClass('active').siblings().removeClass('active');
							moveSolveBtn(false);
						}};
				})));
				break;	
			}
			default: break;
		}
		
		// 배틀 출처 표시
		//view.querySelector('.source').textContent = currentBattle.source;
		const layoutSection = document.querySelector('.craft-layout-content-section');
		layoutSection.style.backgroundPositionY 
		= `${currentView.querySelector('.ask-section').getBoundingClientRect().top - ((window.innerWidth>=992)? (layoutSection.clientHeight/layoutSection.clientWidth > 334/355 ? layoutSection.clientWidth * 142 / 355 : layoutSection.clientHeight * 151 / 355) : (window.innerWidth * 285 / 355))}px`;
	}
	
	/** 플레이어 초기화
	 */
	async function initPlayer(age, battleRecord, command, progressNum, battleSize) {
		_bookTypeStr = location.pathname.match(/(?:\/craft\/battle\/)(\w+)/)[1];
		_battleRecord = battleRecord;
		bookMarkCommand = command
		bookMarkCommand.regDate = new Date(command.regDate);
		_memberId = command?.memberId||0;
		if(!_memberId) _todaySolveLimit = 25;
		_battleBookId = command.battleBookId;
		_lastBattleId = command.lastBattleId;
		if(progressNum != null) _progressNum = progressNum; // progressNum은 현재의 지나온 갯수
		if(battleSize != null) _battleSize = battleSize;
		
		// Today Craft Battle Solve Count
		if(bookMarkCommand.markType === 'b') {
			if(window.localStorage.getItem(`TCBSC_${ntoa(_memberId)}`)) {
				_todayBattleSolveCount = JSON.parse(window.localStorage.getItem(`TCBSC_${ntoa(_memberId)}`));
				if(_todayBattleSolveCount.date != new Date().toLocaleDateString()) {
				// 풀이기록이 없다면 0으로 기록
					_todayBattleSolveCount.date = new Date().toLocaleDateString();
					_todayBattleSolveCount.count = 0;
				}else if(_todayBattleSolveCount.count >= _todaySolveLimit) {
				// 풀이제한량을 초과했다면 종료
					solveLimitExceed();
					return;
				}
			}else _todayBattleSolveCount = { date: new Date().toLocaleDateString(), count: 0}
		}
		
		// 오답/보관 배틀 최소갯수
		if(['w','s'].includes(bookMarkCommand.markType) && ( _battleSize == 0
		|| SEARCH_PARAMS.get('completed') != 'true' && _battleSize < 10)) {
			solveAllsOfBook();
		}

		// 비회원일 경우 로컬에서 기록 탐색
		if(!_memberId) {
			$('#save-btn').addClass('opacity-50');
			$(document).off('click', '#save-btn');
			document.querySelector('.save-button-section').dataset.bsToggle = 'tooltip';
			document.querySelector('.save-button-section').title = '배틀 보관 기능은 fico 회원에게 제공됩니다.';
			$('.save-button-section').tooltip('hide');
			if(typeof Cookies == 'undefined') {
				await $.cachedScript('https://cdn.jsdelivr.net/npm/js-cookie/dist/js.cookie.min.js');
			}
			memberId56 = Cookies.get('FMID');
			
			if(memberId56) {
				// idb(IndexedDB Wrapper Library) 호출
				await $.cachedScript('https://cdn.jsdelivr.net/npm/idb@7/build/umd-with-async-ittr.js');
				await $.cachedScript('https://cdn.jsdelivr.net/npm/pako/dist/pako.min.js');
				storeName = STORE_NAME_BOOKTYPE_MAP[_bookTypeStr] + ntoa(_battleBookId);
				
				stepCommand['age'] = parseInt(localStorage.getItem('FM_AGE'));
				
				_battleRecord = { correct: 0, incorrect: 0 };
				
				const databases = await indexedDB.databases();
				databases.forEach(({name, version}) => (name == DB_NAME) && (version >= DB_VERSION) && (DB_VERSION = version))
				idb.openDB(DB_NAME, DB_VERSION, {
					async upgrade(db, oldVer, _, tx) {
						const newstore = db.createObjectStore(storeName, { autoIncrement: true});
						newstore.createIndex('bid', 'bid'); // 배틀 ID(base56)
						newstore.createIndex('data', 'data'); // 실제 Battle
						newstore.createIndex('solve', 'solve'); // 풀이 결과; 맞음: O, 틀림: X, 기본값 없음
						
						if(oldVer == 1) { // 1버전엔 StepBattle만 있었음.
							const oldstore = tx.objectStore('StepBattle');
							const records = await oldstore.getAll();
							records.sort((a, b) => {
								return a.data.rnum - b.data.rnum;
							})
							// 레코드를 변형하여 2버전으로 마이그레이션
							for(const record of records) {
								await newstore.add({...record, bid: ntoa(record.bid), data: battle2Bytes(record.data)});
							}
							db.deleteObjectStore('StepBattle')
						}
					}
				}).then(async db => {
					if(db.objectStoreNames.contains(storeName)) {
						let lastRnum = 0;
						let cursor = await db.transaction(storeName).store.openCursor();
						_progressNum = 0;
						while(cursor) {
							const battle = bytes2Battle(cursor.value.data);
							// 풀었던 배틀일 경우(solve 값이 "O" 혹은 "X", 안풀었을 경우 "")
							if(/[OX]/.test(cursor.value.solve)) {
								// 레코드(전적)에 합산
								_battleRecord[cursor.value.solve == 'O' ? 'correct':'incorrect']++;
								// 마지막으로 푼 배틀 찾아서 lastBattleId 할당하기
								if(_bookTypeStr !== 'step') {
									_lastBattleId = battle.bid;
								}
								else if(battle.rnum > lastRnum) {
									lastRnum = battle.rnum;
									_lastBattleId = battle.bid;
								}
								_progressNum++;
							}else {
								// 아직 풀지 않은 배틀은 이제 풀어야 할 배틀 풀에 저장
								battlePool.push(battle);
							}
							cursor = await cursor.continue();
						}
						if(_bookTypeStr == 'step') battlePool.sort((a,b) => a.rnum - b.rnum);
						initDatas(stepCommand.age);
					}else {
						db.close();
						db = await idb.openDB(DB_NAME, ++DB_VERSION, {
							upgrade(db) {
								const newstore = db.createObjectStore(storeName, { autoIncrement: true});
								newstore.createIndex('bid', 'bid'); // 배틀 ID(base56)
								newstore.createIndex('data', 'data'); // 실제 Battle
								newstore.createIndex('solve', 'solve'); // 풀이 결과; 맞음: O, 틀림: X, 기본값 없음
								
								initDatas(stepCommand.age);
							}
						})
					}
				})
			}else initDatas(20);
			
			
			/*req = indexedDB.open(DB_NAME, DB_VERSION);
			req.onsuccess = function listBattles() {
				idb = this.result;
				if(!idb.objectStoreNames.contains('StepBattle')) {
					req = indexedDB.open(DB_NAME, ++DB_VERSION);
					
					req.onsuccess = listBattles;
					req.onupgradeneeded = createBattleStore;
				}else {
					const tx = idb.transaction(['StepBattle'], 'readonly');
					
					tx.onabort = idbAbort;			
					idbstore = tx.objectStore('StepBattle');
					// 전체 레코드를 조회
					req = idbstore.openCursor();
					req.onsuccess = getBattlesFromIDB
				}
			};
			// 테이블 스키마 변경이 필요할 경우 아래 코드를 변경하세요.
			req.onupgradeneeded = createBattleStore;*/
			
		}else initDatas(age);
		
		/*function createBattleStore(db) {
			idbstore = db.createObjectStore('StepBattle');
			idbstore.createIndex('bid', 'bid', { unique: true});
			idbstore.createIndex('data', 'data'); // 실제 Battle
			idbstore.createIndex('solve', 'solve', { unique: false}); // 풀이 결과; 맞음: O, 틀림: X, 기본값 없음
			initDatas(age);
		}*/
		/*let lastRnum = 0;
		function getBattlesFromIDB() {
			const cursor = this.result;
			if(cursor) {
				const battle = cursor.value.data;
				// 풀었던 배틀일 경우
				if(/[OX]/.test(cursor.value.solve)) {
					// 레코드(전적)에 합산
					_battleRecord[cursor.value.solve == 'O' ? 'correct':'incorrect']++;
					// 마지막으로 푼 배틀 찾아서 lastBattleId 할당하기
					if(battle.rnum > lastRnum) {
						lastRnum = battle.rnum;
						_lastBattleId = battle.bid;
					}
				}else {
					// 아직 풀지 않은 배틀은 이제 풀어야 할 배틀 풀에 저장
				 	battlePool.push(battle);
				}
				cursor.continue();
			}else {
				battlePool.sort((a,b) => a.rnum - b.rnum);
				initDatas(age);
			} 			
		}*/
	}
	
	function throwSelect(e) {
		const _this = e.target;
		const targetSection = currentView.querySelector(
			_this.closest('.example-btn-section') 
				? '.arranged-example-section' : '.example-btn-section');
		const clone = _this.cloneNode(true);
		const thrower = _this.cloneNode(true);
		clone.style.visibility = 'hidden';
		thrower.style.display = 'block';
		thrower.style.position = 'fixed';
		thrower.style.transform = 'translateZ(0)';
		if(targetSection.matches('.arranged-example-section') && !targetSection.querySelector('.arranged-example'))
			targetSection.appendChild(createElement({ el: 'span', className: 'arranged-example'}));
		
		if(targetSection.matches('.arranged-example-section') && !targetSection.querySelector('.arranged-example:not(.full)')) {
			return;
		}
		
		(targetSection.querySelector('.arranged-example:not(.full)') || targetSection).appendChild(clone);
		
		_this.parentElement.appendChild(thrower);
		// 정답공간으로 선택지 발사
		anime({
			targets: thrower,
			begin: () => {
				const targetParent = clone.parentElement;
				if(targetParent.dataset.full != null) {
					if(targetParent.childElementCount == parseInt(targetParent.dataset.full))
						targetParent.classList.add('full');
				}else {
					_this.parentElement.classList.remove('full');
				}
				_this.remove();
			},
			top: [$(_this).offset().top, $(clone).offset().top],
			left: [$(_this).offset().left, $(clone).offset().left],
			easing: 'linear',
			complete: () => {
				thrower.remove();
				clone.style.visibility = 'visible';
				clone.onclick = throwSelect;
			},
			duration: 100
		})
		
		$(_this).toggleClass('selected pe-none', targetSection.matches('.arranged-example-section'));
		if(currentView.matches('#battle-5')) {
			moveSolveBtn(currentView.querySelectorAll('.arranged-example .haptic-btn').length != JSON.parse(currentBattle.example).length);		
		}else if(currentView.matches('#battle-7')) {
			moveSolveBtn(currentView.querySelectorAll('.arranged-example .haptic-btn').length == 0);
		}
	}
	
	/** 연령그룹 계산, 문제를 조회하고 프로그레스 표시
	 */
	function initDatas(age) {
		stepCommand['age'] = age;
		// 나이를 연령대로 변환
		switch (true) {
			case (age < 13):
				_ageGroup = 'E';	// Elementary
				break;
			case (age < 16):
				_ageGroup = 'M';	// 
				break;
			case (age < 19):
				_ageGroup = 'H';
				break;
			default:
				_ageGroup = 'C';
				break;
		}
		// 지난 회차에 배틀북에 포함된 문제를 다 푼 경우 (단계별 진행 시엔 battleSize,progressNum 모두 null이다)
		if(!!_battleSize && _battleSize == _progressNum) {
			_progressNum = 0;
			_lastBattleId = -1;
			if(bookMarkCommand.markType === 'b') {
				$.getJSON(`/craft/battlebook/${_bookTypeStr}`, {...bookMarkCommand, lastBattleId: -1});
				solveAllsOfBook();
			}
		}
		// 진급 진행도 표시
		calcProgress().then(() => {
			// 문제 풀이 비어있다면 다음 문제 가져오기
			if(battlePool.length == 0) _getNextBattles();
			else _askStep();
		});		
	}

	/** 회원의 세션이 만료됐을 때 표시하는 모달
	 */
	function loginExpiredModal() {
		if(!document.getElementById('loginExpiredModal')) {
			document.querySelector('.craft-layout-content-section').appendChild(createElement({
				"el":"div","id":"loginExpiredModal","class":"modal fade","data-bs-backdrop":"static","data-bs-keyboard":"false","tabIndex":-1,"children":[
					{"el":"div","class":"modal-dialog modal-md modal-dialog-centered","children":[
						{"el":"div","class":"modal-content","children":[
							{"el":"div","class":"modal-body row g-0","children":[
								{"el":"div","class":"text-section my-3 text-center text-dark","innerHTML":"이용 시간이 만료되었습니다."},
								{"el":"div","class":"button-section row g-1","children":[
									{"el":"button","class":"btn btn-fico",onclick: () => {
										location.replace(_memberId == 0 ? '/craft/main' : '/auth/login');
									},"textContent": _memberId == 0 ? '시작 화면으로' : "로그인"}
								]}
							]}
						]}
					]}
				]}));
		}
		bootstrap.Modal.getOrCreateInstance(document.getElementById('loginExpiredModal')).show();
	}
	
	/** 배틀북 내의 문제 모두 소진 --> 다시 플레이 요구
	 */
	function solveAllsOfBook() {
		
		// 단계별 배틀의 마지막 문제에 도달
		if(_bookTypeStr === 'step' && bookMarkCommand.markType === 'b') {
			
			// 단계별 배틀 최고 계급까지 오른 상태면 
			if(currRank.rankTitle == '대장') {
				if(!document.getElementById('newRankModal')) {
					document.body.prepend(createElement(newRankModal));
				}
				$('#newRankModal .modal-body .new-obj').remove();
				
				const newRank = createElement({
					el: 'div', className: 'new-obj', children: [
						{ el: 'p', className: 'fs-3', textContent: '단계별 배틀을 정복하셨습니다.'},
						{ el: 'p', className: 'fs-6', textContent: '다른 배틀북도 정복하는 건 어떨까요?'}
					],
					style: { position: 'absolute', left: '50%', top: 'calc(50% + 4vmin)', 
						zIndex: 1071, transformOrigin: 'center', opacity: 0, transform: 'translate(-50%,-50%) translateZ(0)'
					}
				});
				$('#newRankModal .modal-body').append(newRank);
				$('#newRankModal button').text('시작화면으로').on('click',function() {
					location.replace('/craft/main');
				});
				$('#newRankModal').modal('show');
				anime({
					targets: '#newRankModal .circle-dark object',
					scale: [0,1],
					duration: 1200
				})
				anime({
					targets: '#newRankModal .circle-dark-dashed',
					rotateZ: 360,
					duration: 8000,
					loop: true,
					easing: 'linear'
				})
	
				showFireworks({
					target: $('#newRankModal .modal-body')[0],
					particles: 20, 
					distance: 100,
					interval: 200, 
					size: 15
				});
				anime({
					targets: newRank,
					duration: 1000,
					scale: [0,1],
					opacity: [0,1]
				})
			}else { // 최고 계급에 도달하지 않았는데 마지막 문제에 도달한 경우는 현 계급용으로 준비된 문제 수로 진급에 실패했다는 의미
				if($('#lowVictoryModal').length == 0) {
					document.querySelector('.craft-layout-content-section').appendChild(createElement({
						"el":"div","id":"lowVictoryModal","class":"modal fade","data-bs-backdrop":"static","data-bs-keyboard":"false","tabIndex":-1,"children":[
							{"el":"div","class":"modal-dialog modal-md modal-dialog-centered","children":[
								{"el":"div","class":"modal-content","children":[
									{"el":"div","class":"modal-body row g-0","children":[
										{"el":"div","class":"text-section my-3 text-center text-dark",
										"innerHTML":"We are sorry to inform you that You perished in battle."},
										{el: 'lottie-player', src: 'https://assets1.lottiefiles.com/packages/lf20_k8p8cymw.json', background: 'transparent', autoplay: true, speed: '1', loop: true},
										{"el":"div","class":"button-section row g-1","children":[
											{"el":"button","class":"btn btn-fico",onclick: () => location.replace('/craft/main'),"textContent":"BattleCraft 학습목록으로 가기"},
										]}
									]}
								]}
							]}
						]
					}))
				}
				$('#lowVictoryModal').modal('show');
			}
		}
		
		// 단계별 배틀 진행을 제외하고(단계별 리뷰/오답/보관 및 테마별/문법별 진행/리뷰/오답/보관)
		else if(!document.getElementById('lastBattleModal')) {
			let modalBody = [];
			
			// (오답/보관 등)배틀 진행할 조건이 미달하다는 메세지
			if(_lastBattleId == 0 && _battleSize == 0) {
				modalBody.push({"el":"div","class":"text-section my-3 text-center text-dark",
					"innerHTML":bookMarkCommand.markType == 'w' ? '<b>틀린 배틀</b>이 없습니다😎':'<b>보관한 배틀</b>이 없습니다.📁'});
			}else if(_lastBattleId == 0 && _battleSize < 10 && SEARCH_PARAMS.get('completed') != 'true') {
				modalBody.push({"el":"div","class":"text-section my-3 text-center text-dark",
					"innerHTML": `배틀북을 끝까지 풀었거나<br><b>${bookMarkCommand.markType == 'w' ? '틀린':'보관한'} 배틀</b>이 10개 이상 쌓였을 때 플레이 할 수 있습니다.`});
			}
			// 배틀북 진행을 마친 메세지
			else if(bookMarkCommand.markType === 'b') {
				modalBody.push({"el":"div","class":"text-section my-3 text-center text-dark",
					"innerHTML": `축하합니다.<br>이 배틀북을 모두 ${(_memberId == 0) ? "풀었으니 다른 배틀북도 플레이":"풀어 리뷰 버튼이 활성화 되었습니다.<br><i class=\"icon fas fa-history\"></i> 버튼을 눌러 복습"} 해 보세요.`});
			}
			// 배틀북 리뷰/오답/보관 풀기를 마친 메세지
			else { 
				modalBody.push({"el":"div","class":"text-section my-3 text-center text-dark",
					"innerHTML": "주어진 배틀을 모두 풀었습니다." });
			}
			// 메인으로 가는 버튼
			modalBody.push({"el":"div","class":"button-section row g-1","children":[
				{"el":"button","class":"btn btn-fico",onclick: () => location.replace('/craft/main'),"textContent":"BattleCraft 학습목록으로 가기"}
			]});
			// 리뷰/오답/보관 풀기일 경우 현재 화면에서 다시풀기 가능. 무료회원은 그대로 종료. 다시 풀기 불가능.
			if(bookMarkCommand.markType !== 'b' && (SEARCH_PARAMS.get('completed') == 'true' || _battleSize > 10)) {
				modalBody[1].children.push({"el":"button","class":"btn btn-outline-fico", 'data-bs-dismiss': 'modal',"textContent":"첫 배틀부터 다시 플레이", onclick: async () => {
					isLastPageOfTheBook = false;
					_lastBattleId = -1;
					_progressNum = 0;
					battlePool = [];
					calcProgress();
					_getNextBattles();
				}});
			}
			document.querySelector('.craft-layout-content-section').appendChild(createElement({
				"el":"div","id":"lastBattleModal","class":"modal fade","data-bs-backdrop":"static","data-bs-keyboard":"false","tabIndex":-1,"children":[
					{"el":"div","class":"modal-dialog modal-md modal-dialog-centered","children":[
						{"el":"div","class":"modal-content","children":[
							{"el":"div","class":"modal-body row g-0","children":modalBody}
						]}
					]}]}));
			// 배틀 진행을 마친 경우 팡파레
			if(bookMarkCommand.markType == 'b') $('#lastBattleModal').on('shown.bs.modal', function() {
				showFireworks(this);
			})		
		}
		$('#lastBattleModal').modal('show');
	}
	
	/** 일일 최대 플레이 횟수 초과 모달
	 */
	function solveLimitExceed() {
		if(!document.getElementById('battleExceedModal')) {
			document.querySelector('.craft-layout-content-section').appendChild(createElement({
				"el":"div","id":"battleExceedModal","class":"modal fade","data-bs-backdrop":"static","data-bs-keyboard":"false","tabIndex":-1,"children":[
					{"el":"div","class":"modal-dialog modal-md modal-dialog-centered","children":[
						{"el":"div","class":"modal-content","children":[
							{"el":"div","class":"modal-body row g-0","children":[
								{"el":"div","class":"text-section my-3 text-center text-dark","innerHTML":"일일 최대 플레이 횟수에 도달하였습니다.<br>내일 다시 찾아와 주세요."},
								{"el":"div","class":"button-section row g-1","children":[
									{"el":"button","class":"btn btn-fico",onclick: () => location.replace('/craft/main'),"textContent":"BattleCraft 학습목록으로 가기"}
			]}]}]}]}]}));
		}
		bootstrap.Modal.getOrCreateInstance(document.getElementById('battleExceedModal')).show();
	}
	
	async function calcProgress() {
		if(_bookTypeStr === 'step' && bookMarkCommand.markType === 'b') {
			const prevRankBase = currRankBase;
			return new Promise((resolve, reject) => {
				if(rankClasses.length == 0) {
					$.getJSON('https://static.findsvoc.com/data/craft/rank-list.json', arr => {
						rankClasses = arr.reverse();
						synchronousCalcRank();
						resolve();
					})
					.fail(() => {alert('계급도를 가져오는데 실패했습니다.'); reject();});
				}else {
					synchronousCalcRank();
					resolve();
				}
			})
			function synchronousCalcRank() {
				for(let i = 0, len = rankClasses.length; i < len; i++) {
					if(_battleRecord.correct > rankClasses[i].startValue) {
						currRank = rankClasses[i];
						currRankBase = currRank.startValue + 1;
						nextRankBase = (i > 0) ? (rankClasses[i - 1].startValue + 1) : 9999;
						break;
					}
				}
				
				// 진급을 하면 축하 연출
				if(prevRankBase < currRankBase) {
					if(!document.getElementById('newRankModal')) {
						document.body.prepend(createElement(newRankModal));
					}
					$('#newRankModal .modal-body .new-obj').remove();
					
					const newRank = createElement({
						el: 'div', className: 'new-obj', style: { position: 'absolute', left: '50%', top: 'calc(50% + 4vmin)', width: '37.5vmin', height: '50vmin', 
							maxWidth: '50vmin', zIndex: 1071, maxHeight: '50vmin', transformOrigin: 'center', opacity: 0, transform: 'translate(-50%,-50%) translateZ(0)',
							background: `center/ cover url(https://static.findsvoc.com/images/app/craft/${currRank.rankTitle}.svg) no-repeat`
						}
					});
					$('#newRankModal .modal-body').append(newRank);
					$('#newRankModal').modal('show');
					anime({
						targets: '#newRankModal .circle-dark object',
						scale: [0,1],
						duration: 1200
					})
					anime({
						targets: '#newRankModal .circle-dark-dashed',
						rotateZ: 360,
						duration: 8000,
						loop: true,
						easing: 'linear'
					})
		
					showFireworks({
						target: $('#newRankModal .modal-body')[0],
						particles: 20, 
						distance: 100,
						interval: 200, 
						size: 15
					});
					anime({
						targets: newRank,
						duration: 1000,
						scale: [0,1],
						opacity: [0,1]
					})
					/*showFireworks({target:$('.battle-section:visible')[0], distance: 100, size: 10})
					const newRankImage = createElement({ el: 'img', src: `https://static.findsvoc.com/images/app/craft/${currRankTitle}.svg`, class: 'position-absolute start-50 top-50 w-50', style: 'transform: translate(-50%, -50%)'});
					document.body.appendChild(newRankImage);
					anime({
						targets: newRankImage,
						scale: [0, 1],
						easing: 'cubicBezier(0,2,1,2)',
						duration: 1000,
						complete: () => setTimeout( () => newRankImage.remove(), 3000)
					})*/
				}
				const rankProgress = document.querySelector('.progress-bar');
				const rankPercent = ((_battleRecord.correct - currRankBase) * 100 / (nextRankBase - currRankBase)).toFixed(1);
				rankProgress.ariaValueNow = rankPercent;
				rankProgress.textContent = `${rankPercent}%`;
				rankProgress.style.width = `${rankPercent}%`;			
			}			
		}else {
			return new Promise(resolve => {
				const bookProgress = document.querySelector('.progress-bar');
				if(!_memberId && !memberId56) {
					bookProgress.textContent = '비회원의 플레이는 기록되지 않습니다'
					bookProgress.style.width = '100%';
				}else {
					const bookPercent = !_battleSize ? '0.0' : (_progressNum * 100 / _battleSize).toFixed(1);
					bookProgress.ariaValueNow = bookPercent;
					bookProgress.textContent = `${bookPercent}%`;
					bookProgress.style.width = `${bookPercent}%`;				
				}
				resolve();
			})
		}
	}
	
	/** 해설 내용 표시
	 */
	function displayAnswerInfo(eng, explainSection, answerInfo) {
		
		// 해석 정보
		explainSection.querySelector('.trans-section').replaceChildren(createElement(Array.from(answerInfo.korList, (kor, i) => {
			return { el : 'div', className: 'row', children: [
				{ el : 'div', className: 'col-auto ps-2 pe-0', children: [
					{ el: 'span', className: `material-icons ${i >= (answerInfo.korList.length - 3) ? 'ai-trans' : 'user-trans'}`, 
					/*textContent: i >= (answerInfo.korList.length - 3) ? 'manage_accounts' : 'person', 
					style: `color:${i >= (answerInfo.korList.length - 3) ? ['#4F9BA7','#37728E','#1F4775'][i] : '#5169E6'}` */}]},
				{ el: 'div', className: 'trans-text col', textContent: kor.kor }
			]} ;
		})));
		
		// 단어 목록 정보
		explainSection.querySelector('.words-section')
		.replaceChildren(answerInfo.wordList.length > 0 ? createElement(Array.from(answerInfo.wordList, word => {
			return 	{ "el": "span", "class": 'one-word-unit-section', "data-sentence-id": answerInfo.svocTag.sentenceId, "children": [
				{ "el": "span", "class": "title", textContent: word.title, "data-playing": 'false', onclick: function(e) {
					e.stopPropagation();
					const on = this.dataset.playing == 'true';
					if(on) {
						stopAllTTS();
					}else {
						stopAllTTS(this);
						this.dataset.playing = 'true';
						this.classList.add('tts-playing','blink-2');
						tts.speakRepeat(word.title, 2, 500, () => {
							this.classList.remove('tts-playing', 'blink-2');
							this.dataset.playing = 'false';
						});
					}
				} }].concat(Array.from(word.senseList, (sense,i) => {
					return { "el": "span", "class": `one-part-unit-section${i>0? ' ms-2':''}`, "children": [{ 
						"el": "span", "class": "part", textContent: sense.partType },
						{ "el": "span", "class": "meaning", textContent: sense.meaning }
					]};
				}))
			}
		})) : '해당 문장에서 fico AI가 설정한 난이도 이상의 단어를 찾지 못했습니다.');	
		
		// 미리 펼치기(구분분석 표시하기 전에)
		$(explainSection).find('.collapse').collapse('show');

		// 구문분석 정보
		tandem.showSemanticAnalysis(eng, answerInfo.svocTag.svocBytes, $(explainSection).find('.svoc-section').empty())
		.then(() => nextBtnObserver.observe(explainSection.lastElementChild));
		
		// 계급 진행도만 보일 정도로 상태바 스크롤
		document.querySelector('.craft-header-section').classList.remove('min');
		document.querySelector('.scrolling-section').style.marginTop = '0';		
		scrollTo(0, 75);
	}
	function stopAllTTS(except) {
		tts.stop();
		
		document.querySelectorAll('#ttsPlay,.tts-playing').forEach(playBtn => {
			if(except == playBtn) return;
			if(playBtn.matches('#ttsPlay')) {
				playBtn.textContent = 'play_circle';
			}else if(playBtn.matches('.tts-playing')) {
				playBtn.classList.remove('tts-playing', 'blink-2');
			}
			playBtn.dataset.playing = 'false';
		})
	}
	/** 확인/다음 버튼을 옆으로 움직인다(true: 우측, false: 좌측)
	 */
	function moveSolveBtn(right) {
		anime({
			targets: '.js-solve-btn,.js-next-btn', duration: 500, easing: 'easeOutQuart', left: right? '110%' : '45%'
		});
	}
	
	function idbAbort(event) {
	  const error = event.target.error; // DOMException
	  if (error.name == 'QuotaExceededError') {
	    alert('웹 저장공간을 정리 후 다시 이용해 주세요.');
	    location.replace('/craft/main');
	  }
	}			
	
	
	window['craft'] = Object.assign({}, window['craft'], { initPlayer });
})(jQuery, window, document);
