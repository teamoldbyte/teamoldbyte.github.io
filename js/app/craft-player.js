/** 크래프트 문제 진행 화면
 * @author LGM
 */
(function craftPlayer($, window, document) {
	$.cachedScript = $.cachedScript || function( url, options ) {
		return $.ajax( $.extend( options || {}, { dataType: "script", cache: true, url }) );
	};
	
	$(function() {
		// 스크롤을 내리면 메뉴를 화면 상단에 고정
		const header = document.querySelector('.craft-header-section');
		const scSection = document.querySelector('.scrolling-section');
		let prevY = scrollY;
		$(window).on('scroll', function(e){
			requestAnimationFrame(() => {
				// 헤더 크기(대:150px, 소:35px)에 맞춰서 스타일 변경
				if(scrollY > prevY) { // 스크롤 내림
					if(scrollY >= 115) {
						scSection.style.marginTop = '150px';
						header.classList.add('min');
					}
				}else { // 스크롤 올림 
					if(scrollY < 115) {
						scSection.style.marginTop = '0';
						header.classList.remove('min');
					}
				}
				prevY = scrollY;
			})
		})
	})
	
	let nextBtnObserver = new IntersectionObserver((entries) => {
		moveSolveBtn(!entries[0].isIntersecting);
	}, { threshold: 1.0})
	
	let solveResults = []; // 연속 맞힘 기록
	let rankClasses = []; // 계급도(ajax)
	let _contentType; // 플레이 컨텐츠 종류(step, grammar, workbook)
	let _contentId; // 지정된 컨텐츠가 있을 경우 해당 컨텐츠 아이디
	let currentBattle, battlePool = []; // 현재 문제, 현재 문제 풀
	let currentView;
	let _memberId, _ageGroup; // 사용자 정보
	let _battleRecord; // 배틀 전적 정보
	let currRankTitle, currRankBase, nextRankBase; // 현재 계급명, 현재 및 다음 계급의 시작 정답수
	
	
	
	/*
	TBD:
		비회원의 경우 FreeMembership 가입할 때부터 memberId 로컬에 저장.
		서버로 문제 요청 시 memberId, battleId, engLevel 전달.
		문제를 조회 혹은 풀 때마다 indexedDB 업데이트하여 저장.
		
	 */
	
	
	
	
	
	
	
	const DB_NAME = 'findsvoc-idb';	// url 호스트별로 유일한 데이터베이스명을 가집니다.
	const DB_VERSION = 1;	// 데이터베이스 버전(테이블 스키마 변경이 필요할 경우 올리세요.)
	let req, idb, idbstore;
	
	let selectHistory = []; // 현재 문제에서 선택한 선택지들 모음(1,2,5유형용)
	
	$(document)
	// 배틀 저장(ajax)
	.on('click', '#save-btn', function() {
		$.getJSON('/craft/battle/mybattle/save', 
			{ memberId: _memberId, battleId: currentBattle.bid, save: !currentBattle.saved }, (saved) => {
				currentBattle.saved = saved;
				// 버튼 상태 전환
				$(this).toggleClass('reverse', saved);
				
				// 저장여부를 알리는 메세지
				const saveMsg = createElement({"el":"div","class":'toast align-items-center position-absolute end-0 top-0 mt-4 me-5 w-auto text-center',
					"role":"alert","aria-live":"assertive","aria-atomic":"true", "data-bs-autohide": "true", "data-bs-delay": 2000, "textContent": currentBattle.saved?"저장되었습니다.":"저장이 취소되었습니다."})
				this.appendChild(saveMsg);
				bootstrap.Toast.getOrCreateInstance(saveMsg).show();
				saveMsg.addEventListener('hidden.bs.toast', () => saveMsg.remove())
		});
		
	})
	// 풀이 전송(ajax)
	.on('click', '.js-solve-btn', function() {
		const view = currentView;
		const answers = JSON.parse(currentBattle.answer||"[]");
		const examples = JSON.parse(currentBattle.example||"[]");
		let correct = true;
		
		// 채점 전송 버튼을 단계 넘김 버튼으로 전환 
		$(this).toggleClass('js-solve-btn js-next-btn').text('다음');
		$(view).find('.ask-section,.example-btn-section,.arranged-examples').addClass('pe-none');
		
		// 배틀타입, 문제 축소버전으로 표시
		$(view).find('.battle-type-block, .ask-block, .simple-ask-block').fadeToggle();
		
		// 각 배틀타입에 맞게 채점 진행
		switch(currentBattle.battleType) {
			case '1':
				const answerIndexes = [];
				examples.sort(([a], [b]) => a - b).forEach(([start, end], i) => {
					if(null != answers.find(([aStart,aEnd]) => start == aStart && end == aEnd))
						answerIndexes.push(i);
				});
				view.querySelectorAll('.option').forEach((sel, i) => {
					if(answerIndexes.includes(i))
						sel.classList.add('right');
					else if(sel.matches('.selected')) {
						correct = false;
						sel.classList.add('wrong');
					}
				})
				
				break;	
			case '2':
				view.querySelectorAll('.option,.modifier,.modificand').forEach(opt => {
					if(!opt.matches('.selected')) opt.classList.add('unselected');
					if(currentBattle.ask.includes('모든')) {
						if(selectHistory.includes(opt) && opt.matches('.modifier, .modificand')) {
							opt.classList.add('right');
						}else if(selectHistory.includes(opt) ^ opt.matches('.modifier, .modificand')) {
							correct = false;
							if(selectHistory.includes(opt)) {
								opt.classList.add('wrong');
							}
						}
					}else {
						if(selectHistory.includes(opt) && opt.matches(selectHistory.indexOf(opt) % 2 ? '.modifier' : '.modificand')) {
							opt.classList.add('right');							
						}else if(selectHistory.includes(opt)) {
							opt.classList.add('wrong');
							correct = false;
						}else {
							correct = false;
						}
					}
				})
				break;
			case '3':
				const selectedOpt3 = view.querySelector('.example-btn-section .active');
				const selectedText3 = selectedOpt3.textContent;
				const selectedIndex3 = Array.from(view.querySelectorAll('.example-btn-section button')).indexOf(selectedOpt3);
				if(answers.includes(selectedText3)) correct = true;
				else correct = false;
				view.querySelectorAll('.pick-right .pick-option').forEach((opt, i) => {
					if(i == selectedIndex3) {
						opt.classList.add(correct ? 'right' : 'wrong');
					}else if(!correct) {
						opt.classList.add('right');
					}
				})
				view.querySelector('.example-btn-section').style.display = 'none';
				break;
			case '4':
				const selectedIndex4 = $(view).find('.example-btn-section .active').index();
				const answerIndexes4 = [];
				examples.sort(([a], [b]) => a - b).forEach(([start, end], i) => {
					if(null != answers.find(([aStart,aEnd]) => start == aStart && end == aEnd))
						answerIndexes4.push(i);
				});
				view.querySelectorAll('.sentence .option,.sentence .answer-wrong').forEach((sel, i) => {
					if(answerIndexes4.includes(i))
						sel.classList.add('right');
					else if(i == selectedIndex4) {
						correct = false;
						sel.classList.add('wrong');
					}
				})
				view.querySelector('.example-btn-section').style.display = 'none';
				break;
			case '5':
				correct = view.querySelector('.arranged-examples').textContent.replace(/\W/g,'').trim() == currentBattle.eng.replace(/\W/g,'').trim();
				view.querySelector('.arranged-examples').prepend(createElement({ el: 'div', className: 'full-sentence', textContent: currentBattle.eng}));
				view.querySelector('.example-btn-section').style.display = 'none';
				break;
			case '6':
				const rightOptions = Array.from(examples, ([ [], text ]) => {
					return text.split(/\s+/);
				}).reduce((acc, curr) => acc.concat(curr), []);
				view.querySelectorAll('.example-btn-section input').forEach((input, i) => {
					if(input.value.toLowerCase() == rightOptions[i].toLowerCase()) {
						input.className = 'right';
					}else {
						input.className = 'wrong';
						correct = false;
					}
				})
				view.querySelector('.arranged-examples').prepend(createElement({ el: 'div', className: 'full-sentence', textContent: currentBattle.eng}))
				break;
			case '7':
				let options7 = currentBattle.kor.split(/\s+/);
				let tempOption = '';
				options7 = options7.reduce((acc, curr, i, arr) => {
					if(curr.length > 1) {
						const newAcc = acc.concat([ tempOption.length > 0 ? `${tempOption} ${curr}` : curr ]);
						tempOption = '';
						return newAcc;
					}else {
						tempOption += tempOption.length > 0 ? ` ${curr}` : curr;
						if(i == arr.length - 1) {
							return acc.concat([ tempOption ]);
						}
					}
				},[]);			
				if(view.querySelectorAll('.arranged-examples .btn').length != options7.length){
					view.querySelectorAll('.arranged-examples .btn').forEach( option => {
						if(options7.includes(option.textContent)) {
							option.classList.add('right');
						}else {
							option.classList.add('wrong');
						}
					})					
					correct = false;
				} 
				else {
					view.querySelectorAll('.arranged-examples .btn').forEach( option => {
						if(options7.includes(option.textContent)) {
							option.classList.add('right');
						}else {
							option.classList.add('wrong');
							correct = false;
						}
					})
				}
				view.querySelector('.arranged-examples').prepend(createElement({ el: 'div', className: 'full-sentence', textContent: currentBattle.kor}));
				view.querySelector('.example-btn-section').style.display = 'none';
				
				break;
			default: break;
		}
		// 맞힘/틀림에 따른 알림
		const resultToast = createElement({"el":"div","class":'js-result-msg result-toast',
								style: { transformOrigin: 'top'},
								"textContent": correct ? '정답입니다.' : '오답입니다.'});
		document.querySelector('.craft-header-section').append(resultToast);
		// 해설화면에 캐릭터 안보이도록 투명화
		document.querySelector('.craft-layout-content-section').classList.add('bg-fc-transparent');
		anime.timeline({
			targets: resultToast,
		}).add({
			begin: () => {
				resultToast.style.visibility = 'visible';
				resultToast.style.color = '#00000000';
			},
			bottom: '-2rem',
			backgroundColor: correct ? '#00bcd4' : '#f44336',
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
		const command = { memberId: _memberId, ageGroup: _ageGroup, battleId: currentBattle.bid, correct, save: Boolean(currentBattle.saved) };
		
		// 설명 펼치기
		$(view).find('.explain-section').show().find('.comment-section').text(currentBattle.comment || '작성된 코멘트가 없습니다.');
		// (ajax) 해설정보 조회 및 표시
		$.getJSON(`/craft/battle/${currentBattle.sentenceId}`, battleAnswerInfo => 
				displayAnswerInfo(currentBattle.eng, view.querySelector('.explain-section'), battleAnswerInfo))
		// (ajax) 배틀 채점 정보 전송
		$.ajax({
			url: '/craft/battle/evaluation/add',
			type: 'GET', contentType: 'application/json', data: command,
			success: () => { 
				if(correct) { 
					_battleRecord.correct++; 
				}
				if(_memberId == 0) {
					req = window.indexedDB.open(DB_NAME, DB_VERSION);
					req.onsuccess = function() {
						idb = this.result;
						const tx = idb.transaction(['StepBattle'], 'readwrite');
						idbstore = tx.objectStore('StepBattle');
						idbstore.index('bid').openCursor().onsuccess = function() {
							let cursor = this.result;
							if(cursor) {
								if(cursor.key == currentBattle.bid) {
									const record = cursor.value;
									record.solve = correct? 'O': 'X';
									cursor.update(record);
									return;
								}
								cursor.continue();
							}
						};
					};	
				}
				
				moveSolveBtn(true);
				calcRank(); },
			error: () => alert('채점 전송에 실패했습니다. 재로그인 후 다시 시도해 주세요.')
		})
	})
	// 단계 넘김 버튼을 누르면 단계 넘김 버튼을 다시 채점 전송 버튼으로 전환 후 다음 문제 진행
	.on('click', '.js-next-btn', function() {
		$(this).toggleClass('js-solve-btn js-next-btn').text('확인');
		document.querySelector('.craft-layout-content-section').classList.remove('bg-fc-transparent');
		$(currentView).find('.ask-section,.example-btn-section,.arranged-examples').removeClass('pe-none');
		
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
		// 남은 문제가 없으면 새로 문제를 조회(ajax)하여 진행	
		else _getNextBattles();		
	})
	// svoc 분석이 펼쳐질 때 줄바꿈 재처리
	.on('shown.bs.collapse', '.svoc-section', function() {
		tandem.correctMarkLine(this.querySelector('.semantics-result'))
	})
	
	/** 다음 20문제 가져오기
	*/
	function _getNextBattles() {
		const contentPath = _contentId ? `/${ntoa(_contentId)}` : ''
		const url = `/craft/battle/${_contentType}${contentPath}/next`
		$.getJSON(url, function(battles) {
			battlePool = battles;
			if(battles.length == 0) alert('조회된 문제가 없습니다.')
			else {
				if(_memberId == 0) {
					req = window.indexedDB.open(DB_NAME, DB_VERSION);
					req.onsuccess = function() {
						idb = this.result;
						const tx = idb.transaction(['StepBattle'], 'readwrite');
						idbstore = tx.objectStore('StepBattle');
						let i = 0;
						insertNext();
						function insertNext() {
							if(i < battles.length) {
								const battle = battles[i++];
								idbstore.add({ bid: battle.bid, data: battle, solve: '' }, battle.bid)
										.onsuccess = insertNext;
							}else _askStep();
						}
					};				
				}else _askStep();
			}
		}).fail(() => alert('새로운 문제를 조회할 수 없습니다.'));
	}
	
	// 한 문제 플레이어에 표시
	function _askStep() {
		currentBattle = battlePool.shift();
		selectHistory = [];
		currentView = document.getElementById(`battle-${currentBattle.battleType}`);

		const ask = currentView.querySelector('.ask');
		const simpleAsk = currentView.querySelector('.simple-ask-block');
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
			case '1' :
				// 질문 표시
				ask.textContent = `다음 문장의 ${currentBattle.ask}를 선택하세요.`;
				simpleAsk.textContent = ask.textContent;
				// 본문 표시
				examples.forEach(([ start, end ], j, arr) => {
					leftStr = eng.substring(offsetPos, start);
					if(leftStr) contextChildren.push(leftStr);
					contextChildren.push({
						el: 'span', role: 'button', className: 'option', 
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
			case '2' :
			
				const modGuideText = createElement({el: 'span', class: 'mod-guide-text'});
				// 질문 표시
				if(currentBattle.ask.includes('모든')) {
					ask.textContent = `${currentBattle.ask.includes('피수식')?'피수식어':'수식어'}를 모두 선택하세요.`;
					modGuideText.textContent = `${currentBattle.ask.includes('피수식')?'피수식어':'수식어'} 선택`;
				}else {
					ask.textContent = `[${currentBattle.ask}] 수식어와 피수식어를 선택하세요.`;
					
				}
				simpleAsk.textContent = ask.textContent;
				// 본문 표시
			 	const [ modifiers, modificands ] = answers;
			 	const optionDummy2 = { el: 'span', role: 'button', onclick: function() {
					if(this.matches('.selected')) {
						const searchedIndex = selectHistory.indexOf(this);
						
						(selectHistory.splice(searchedIndex, 1))[0].classList.remove('selected');
						
						// 선택 해제 시 수식어-피수식어 쌍을 선택하는 문제에서는 선택 같이 해제되도록.
						if(!currentBattle.ask.includes('모든')) {
							const pairNum = Math.floor(searchedIndex / 2) * 2 + (1 - searchedIndex % 2);
							const indexToDelete = pairNum > searchedIndex ? searchedIndex : (searchedIndex - 1);
							
							if(selectHistory[indexToDelete]) {
								(selectHistory.splice(indexToDelete, 1))[0].classList.remove('selected');
							}
						}
					}else {
						this.classList.add('selected');
						selectHistory.push(this);
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
								return Object.assign({ className: 'option d-inline-block', textContent: s }, optionDummy2);
							}).forEach( el => contextChildren.push(el, ' '));
						}else contextChildren.push(leftStr, ' ');
					}
					contextChildren.push(Object.assign({ className: `${className} d-inline-block`, textContent: eng.substring(start, end) }, optionDummy2));
					if(end < eng.length) contextChildren.push(' ');
					if(j == arr.length - 1 && end < eng.length) {
						if(eng.indexOf(' ', end) > -1) {
							Array.from(eng.substring(end).split(' ').filter(s => s.length > 0), s => {
								return Object.assign({ className: 'option d-inline-block', textContent: s }, optionDummy2);
							}).forEach( el => contextChildren.push(el, ' '));
						}else contextChildren.push(eng.substring(end));
					}
					offsetPos = end;
				});
				
				sentence.replaceChildren(createElement(contextChildren));
				break;
			case '3' :
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
						return { el: 'button', className: 'btn btn-outline-fico', textContent: option , onclick: function() {
							$(this).addClass('active').siblings().removeClass('active');
							moveSolveBtn(false);
						}};
				})));
				break;
			case '4' :
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
					options.push({ el: 'button', className: 'btn btn-outline-fico', textContent: optionText, onclick: function() {
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
			case '5' :
				/* 배열하기.
					example = [[보기1start,보기1end],[보기2start,보기2end],...]
				 */
				 
				// 해석 표시
				sentence.replaceChildren(currentBattle.kor)
				// 보기 표시
				const arrangedSection = currentView.querySelector('.arranged-examples');
			 	examples.sort(() => Math.random() - 0.5).forEach(([ start, end ]) => {
					options.push({ el: 'span', className: 'btn btn-outline-fico', textContent: eng.substring(start, end), onclick: function() {
						if(!this.closest('.arranged-examples') && !this.matches('.selected')) {
							const clone = this.cloneNode(true);
							const thrower = this.cloneNode(true);
							clone.style.visibility = 'hidden';
							thrower.style.position = 'fixed';
							arrangedSection.appendChild(clone);
							
							this.parentElement.appendChild(thrower);
							// 정답공간으로 선택지 발사
							anime({
								targets: thrower,
								top: [$(this).offset().top, $(clone).offset().top],
								left: [$(this).offset().left, $(clone).offset().left],
								easing: 'linear',
								complete: () => {
									thrower.remove();
									clone.style.visibility = 'visible';
								},
								duration: 100
							})
							
							clone.onclick = () => {
								const throwBack = clone.cloneNode(true);
								clone.style.visibility = 'hidden';
								throwBack.style.position = 'fixed';
								arrangedSection.appendChild(throwBack);
								// 정답지에서 선택지로 발사
								anime({
									targets: throwBack,
									top: [ $(clone).offset().top, $(this).offset().top ],
									left: [ $(clone).offset().left, $(this).offset().left],
									easing: 'linear',
									complete: () => {
										throwBack.remove();
										clone.remove();
										$(this).removeClass('selected pe-none');	
										moveSolveBtn(arrangedSection.childElementCount != examples.length);
									},
									duration: 100
								})
								
							}
							$(this).addClass('selected pe-none');
						}
						
						moveSolveBtn(arrangedSection.childElementCount != examples.length);
					}
					});
				});
				currentView.querySelector('.example-btn-section').replaceChildren(createElement(options));
				// 선택 초기화
				arrangedSection.replaceChildren();
				$(arrangedSection).sortable();
				
				break;
			case '6' :
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
								el: 'input', style: { width: `${token.length}em`}, pattern: '[0-9A-z!?.,]',
								placeholder: token.length > 1 ? token.substring(0,1) : '', autocapitalize: 'off',
								onfocus: function() {
									// 타이핑 위치와 확인버튼이 겹치면 스크롤 이동
									const thisTop = this.getBoundingClientRect().top;
									const nextBtnTop = document.querySelector('.js-next-btn, .js-solve-btn').getBoundingClientRect().top;
									const topDiff = Math.abs(nextBtnTop - thisTop);
									if(topDiff < 76.5) {
										scrollTo(scrollX, scrollY + 76.5 - topDiff);
									}
								}
							});
						}
					})
					if(j == arr.length - 1 && end < eng.length) {
						contextChildren.push(eng.substring(end));
					}
					offsetPos = end;					
				});
				currentView.querySelector('.arranged-examples').replaceChildren();
				currentView.querySelector('.ask-section .sentence.kor').textContent = currentBattle.kor;
				currentView.querySelector('.example-btn-section').replaceChildren(createElement(contextChildren));
				$(currentView).on('input', '.example-btn-section input', function() {
					moveSolveBtn(!Array.from(currentView.querySelectorAll('.example-btn-section input')).every(input => input.value.length > 0));
				})
				break;
			case '7' :
				/** 해석 배열하기
					example = [오답1, 오답2]
				 */
				let options7 = currentBattle.kor.split(/\s+/);
				const arrangedSection7 = currentView.querySelector('.arranged-examples');
				let tempOption = '';
				options7 = options7.reduce((acc, curr, i, arr) => {
					if(curr.length > 1) {
						const newAcc = acc.concat([ tempOption.length > 0 ? `${tempOption} ${curr}` : curr ]);
						tempOption = '';
						return newAcc;
					}else {
						tempOption += tempOption.length > 0 ? ` ${curr}` : curr;
						if(i == arr.length - 1) {
							return acc.concat([ tempOption ]);
						}
					}
				}, []).concat(examples).sort(() => Math.random() - 0.5);
				options7.forEach( option => {
					contextChildren.push({ el: 'span', className: 'btn btn-outline-fico', textContent: option, onclick: function() {
						if(!this.closest('.arranged-examples') && !this.matches('.selected')) {
							const clone = this.cloneNode(true);
							const thrower = this.cloneNode(true);
							clone.style.visibility = 'hidden';
							thrower.style.position = 'fixed';
							arrangedSection7.appendChild(clone);
							
							this.parentElement.appendChild(thrower);
							// 정답공간으로 선택지 발사
							anime({
								targets: thrower,
								top: [$(this).offset().top, $(clone).offset().top],
								left: [$(this).offset().left, $(clone).offset().left],
								easing: 'linear',
								complete: () => {
									thrower.remove();
									clone.style.visibility = 'visible';
								},
								duration: 100
							})
							
							clone.onclick = () => {
								const throwBack = clone.cloneNode(true);
								clone.style.visibility = 'hidden';
								throwBack.style.position = 'fixed';
								arrangedSection7.appendChild(throwBack);
								// 정답지에서 선택지로 발사
								anime({
									targets: throwBack,
									top: [ $(clone).offset().top, $(this).offset().top ],
									left: [ $(clone).offset().left, $(this).offset().left],
									easing: 'linear',
									complete: () => {
										throwBack.remove();
										clone.remove();
										$(this).removeClass('selected pe-none');	
										moveSolveBtn(arrangedSection7.childElementCount == 0);
									},
									duration: 100
								})
								
							}
							$(this).addClass('selected pe-none');
						}
						
						moveSolveBtn(arrangedSection7.childElementCount == 0);
					}
					});					
				})
				// 선택 초기화
				arrangedSection7.replaceChildren();
				currentView.querySelector('.ask-section .sentence.eng').textContent = eng;
				currentView.querySelector('.example-btn-section').replaceChildren(createElement(contextChildren));
				break;
			default: break;
		}
		
		// 배틀 출처 표시
		//view.querySelector('.source').textContent = currentBattle.source;
		
		document.querySelector('.craft-layout-content-section').style.backgroundPositionY 
		= `${currentView.querySelector('.ask-section').getBoundingClientRect().top - window.innerWidth * 285 / 355}px`;
	}
	
	/** 플레이어 초기화
	 */
	function initPlayer(memberId, age, contentType, contentId, battleRecord) {
		_memberId = memberId;
		_contentId = contentId;
		_contentType = contentType;
		_battleRecord = battleRecord;

		// 비회원일 경우 로컬에서 기록 탐색
		if(_memberId == 0) {
			document.querySelector('#save-btn').disabled = true;
			_battleRecord = { numOfTest: 0, correct: 0, incorrect: 0 };
			req = window.indexedDB.open(DB_NAME, DB_VERSION);
			req.onsuccess = function() {
				idb = this.result;
				const tx = idb.transaction(['StepBattle'], 'readonly');
				idbstore = tx.objectStore('StepBattle');
				// 전체 레코드를 조회
				req = idbstore.openCursor();
				req.onsuccess = function() {
					const cursor = this.result;
					if(cursor) {
						switch(cursor.value.solve) {
							case 'O':
								_battleRecord.correct++;
								break;
							case 'X':
								_battleRecord.incorrect++;
								break;
							default:
							 	battlePool.push(cursor.value.data);
								break;	
						}
						cursor.continue();
					}else initDatas(age);
				}
			};
			// 테이블 스키마 변경이 필요할 경우 아래 코드를 변경하세요.
			req.onupgradeneeded = function() {
				idb = this.result;
				idbstore = idb.createObjectStore('StepBattle');
				idbstore.createIndex('bid', 'bid', { unique: true});
				idbstore.createIndex('data', 'data'); // 실제 Battle
				idbstore.createIndex('solve', 'solve', { unique: false}); // 풀이 결과; 맞음: O, 틀림: X, 기본값 없음
			}
		}else initDatas(age);
		
	}
	
	/** 연령그룹 계산, 문제를 조회하고 프로그레스 표시
	 */
	function initDatas(age) {
		// 나이를 연령대로 변환
		if(age < 13) _ageGroup = 'E';
		else if(age < 16) _ageGroup = 'M';
		else if(age < 19) _ageGroup = 'H';
		else  _ageGroup = 'C';
		// 문제 풀이 비어있다면 다음 문제 가져오기
		if(battlePool.length == 0) _getNextBattles();
		else _askStep();
		// 진급 진행도 표시
		calcRank();		
	}
	
	/** 컨테이너 속에서 지정한 선택자에 해당하는 요소들의 위치 반환
	@param container 부모 html 요소
	@param matcher 선택자
	@returns [[start,end], [start,end],...] start/end: Number
	*/
	function findPositions(container, matcher) {
		let pos = 0, arr = [];
		container.childNodes.forEach(child => {
			const textLength = child.textContent.replaceAll(/[\n\u200b]/gm, '').length;
			if(child.className && (typeof matcher == 'string' ? child.matches(matcher) : (child == matcher))) {
				arr.push([pos, pos + textLength]);
			}
			pos += textLength;
		})
		return arr;
	}
	
	function calcRank() {
		const prevRankBase = currRankBase;
		
		if(rankClasses.length == 0) {
			$.getJSON('https://static.findsvoc.com/data/craft/rank-list.json', arr => {
				rankClasses = arr.reverse();
				calcRank();
			})
			.fail(() => alert('계급도를 가져오는데 실패했습니다.'));
			return;
		}
		for(let i = 0, len = rankClasses.length; i < len; i++) {
			if(_battleRecord.correct > rankClasses[i].startValue) {
				currRankTitle = rankClasses[i].rankTitle;
				currRankBase = rankClasses[i].startValue + 1;
				nextRankBase = (i > 0) ? rankClasses[i - 1].startValue : 9999;
				break;
			}
		}
		
		// 진급을 하면 축하 연출
		if(prevRankBase < currRankBase) {
			showFireworks({target:$('.battle-section:visible')[0], distance: 100, size: 10})
			const newRankImage = createElement({ el: 'img', src: `https://static.findsvoc.com/images/app/craft/${currRankTitle}.svg`, class: 'position-absolute start-50 top-50 w-50', style: 'transform: translate(-50%, -50%)'});
			document.body.appendChild(newRankImage);
			anime({
				targets: newRankImage,
				scale: [0, 1],
				easing: 'cubicBezier(0,2,1,2)',
				duration: 1000,
				complete: () => setTimeout( () => newRankImage.remove(), 3000)
			})
		}
		const rankProgress = document.querySelector('.progress-bar');
		
		const rankPercent = ((_battleRecord.correct - currRankBase) * 100 / nextRankBase).toFixed(1);
		rankProgress.ariaValueNow = rankPercent;
		rankProgress.textContent = `${rankPercent}%`;
		rankProgress.style.width = `${rankPercent}%`;
	}
	
	/** 해설 내용 표시
	 */
	function displayAnswerInfo(eng, explainSection, answerInfo) {
		
		// 해석 정보
		explainSection.querySelector('.trans-section').replaceChildren(createElement(Array.from(answerInfo.korList, (kor, i) => {
			return { el : 'div', className: 'row', children: [
				{ el : 'div', className: 'col-auto ps-2 pe-0', children: [{ el: 'span', className: 'material-icons fs-5', 
					textContent: i >= (answerInfo.korList.length - 3) ? 'manage_accounts' : 'person', 
					style: `color:${i >= (answerInfo.korList.length - 3) ? ['#4F9BA7','#37728E','#1F4775'][i] : '#5169E6'}` }]},
				{ el: 'div', className: 'trans-text col', textContent: kor.kor }
			]} ;
		})));
		
		// 단어 목록 정보
		explainSection.querySelector('.words-section')
		.replaceChildren(answerInfo.wordList.length > 0 ? createElement(Array.from(answerInfo.wordList, word => {
			return 	{ "el": "span", "class": 'one-word-unit-section', "children": [
				{ "el": "span", "class": "title", textContent: word.title }].concat(Array.from(word.senseList, sense => {
					return { "el": "span", "class": "one-part-unit-section", "children": [{ 
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
	
	function moveSolveBtn(right) {
		anime({
			targets: '.js-solve-btn,.js-next-btn', duration: 500, easing: 'easeOutQuart', left: right? '110%' : '45%'
		});
	}
	
	window['craft'] = Object.assign({}, window['craft'], { initPlayer });
})(jQuery, window, document);
