/** 크래프트 문제 진행 화면
 * @author LGM
 */
(function craftPlayer($, window, document) {
	$.cachedScript = $.cachedScript || function( url, options ) {
		return $.ajax( $.extend( options || {}, { dataType: "script", cache: true, url }) );
	};
	if(typeof createElement == 'undefined') {
		$.cachedScript('https://static.findsvoc.com/js/util/DOM-util.min.js', {
			success: () => craftPlayer($, window, document)
		});
		return;
	}	
	let solveResults = []; // 연속 맞힘 기록
	let _contentType; // 플레이 컨텐츠 종류(step, grammar, workbook)
	let _contentId; // 지정된 컨텐츠가 있을 경우 해당 컨텐츠 아이디
	let currentBattle, battlePool = []; // 현재 문제, 현재 문제 풀
	let _memberId, _ageGroup; // 사용자 정보
	
	let selectHistory = []; // 현재 문제에서 선택한 선택지들 모음(1,2,5유형용)
	
	$(document).on('click', '.js-solve-btn', function() {
		this.disabled = true;
		const view = this.closest('.battle-section');
		const answers = JSON.parse(currentBattle.answer||"[]");
		const examples = JSON.parse(currentBattle.example||"[]");
		let correct = true;
		switch(currentBattle.battleType) {
			case '1':
				const answerIndexes = [];
				examples.sort(([a], [b]) => a - b).forEach(([start, end], i) => {
					if(null != answers.find(([aStart,aEnd]) => start == aStart && end == aEnd))
						answerIndexes.push(i);
				});
				view.querySelectorAll('.option').forEach((sel, i) => {
					if(!answerIndexes.includes(i)) {
						if(sel.matches('.selected')) {
							correct = false;
							sel.className = 'text-danger';
						}
					}else sel.className = 'text-primary';
				})
				
				break;	
			case '2':
				let [ modifiers, modificands ] = Array.from(answers, pair => Array.from(pair, m => JSON.stringify(m)));
				view.querySelectorAll('.option').forEach(opt => {
					if(!modifiers.includes(JSON.stringify(findPositions(view, opt)[0]))
					&& !modificands.includes(JSON.stringify(findPositions(view, opt)[0]))) {
						if(opt.matches('.selected')) {
							correct = false;
							opt.className = 'text-danger';
						}
					}else opt.className = 'text-primary';
				})
				break;
			case '3':
				const selectedText = view.querySelector('.example-btn-section .active').textContent;
				if(answers.includes(selectedText)) correct = true;
				else correct = false;
				break;
			case '4':
				const selectedIndex = $(view).find('.example-btn-section .active').index();
				correct = selectedIndex == Array.from(examples, e => JSON.stringify(e)).indexOf(JSON.stringify(answers[0]));
				break;
			case '5':
				correct = view.querySelector('.arranged-examples').textContent.replace(/\W/g,'').trim() == currentBattle.eng.replace(/\W/g,'').trim();
				break;
		}
		alert(correct? '맞혔습니다' : '틀렸습니다');
		const command = { memberId: _memberId, ageGroup: _ageGroup, battleId: currentBattle.bid, correct, save: false };
		$.ajax({
			url: '/craft/battle/evaluation/add',
			type: 'POST', contentType: 'application/json', data: JSON.stringify(command),
			success: () => {
				if(battlePool.length > 0) {
					_askStep();
				}else _getNextBattles();
			},
			error: () => alert('채점 전송에 실패했습니다. 재로그인 후 다시 시도해 주세요.')
		})
	})
	
	// 다음 20문제 가져오기
	function _getNextBattles() {
		const contentPath = _contentId ? `/${ntoa(_contentId)}` : ''
		const url = `/craft/battle/${_contentType}${contentPath}/next`
		$.getJSON(url, function(battles) {
			battlePool = battles;
			_askStep();
		});
	}
	
	// 한 문제 플레이어에 표시
	function _askStep() {
		currentBattle = battlePool.shift();
		selectHistory = [];
		const view = document.getElementById(`battle-${currentBattle.battleType}`);
		// 배틀 타입 표시
		view.querySelector('.battle-type').textContent = currentBattle.battleType;
		
		$(view).show().siblings().hide();
		
		const ask = view.querySelector('.ask');
		const sentence = view.querySelector('.sentence');
		const eng = currentBattle.eng;
		const answers = JSON.parse(currentBattle.answer||"[]");
		const examples = JSON.parse(currentBattle.example||"[]");
		let offsetPos = 0, leftStr, options = [];
		const contextChildren = [];
		switch(currentBattle.battleType) {
			case '1' :
				// 질문 표시
				ask.textContent = `다음 문장의 ${currentBattle.ask}를 선택하세요.`;
				// 본문 표시
				examples.forEach(([ start, end ], j, arr) => {
					leftStr = eng.substring(offsetPos, start);
					if(leftStr) contextChildren.push(leftStr);
					contextChildren.push({
						el: 'span', role: 'button', className: 'option', 
						textContent: eng.substring(start, end),
						onclick: function() {
							$(this).toggleClass('selected');
							$(view).find('.js-solve-btn').prop('disabled', sentence.querySelectorAll('.selected').length == 0);
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
				// 질문 표시
				ask.textContent = `[${currentBattle.ask}] 수식어와 피수식어를 선택하세요.`;
				// 본문 표시
			 	const [ modifiers, modificands ] = answers;
			 	const optionDummy2 = { el: 'span', role: 'button', onclick: function() {
					if(this.matches('.selected')) {
						const searchedIndex = selectHistory.indexOf(this);
						
						(selectHistory.splice(searchedIndex, 1))[0].classList.remove('selected');
						
						const pairNum = Math.floor(searchedIndex / 2) * 2 + (1 - searchedIndex % 2);
						const indexToDelete = pairNum > searchedIndex ? searchedIndex : (searchedIndex - 1);
						
						if(selectHistory[indexToDelete]) {
							(selectHistory.splice(indexToDelete, 1))[0].classList.remove('selected');
						}
					}else {
						this.classList.add('selected');
						selectHistory.push(this);
					}
					view.querySelector('.js-solve-btn').disabled = selectHistory.length == 0;
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
					'data-answer': answerText,
					textContent: `[ ${options.join(' / ')} ]`
				});				
				if(blankEnd < eng.length)
					contextChildren.push(eng.substring(blankEnd));
				sentence.replaceChildren(createElement(contextChildren));	
					
				view.querySelector('.example-btn-section').replaceChildren(
					createElement(Array.from(options, option => {
						return { el: 'button', className: 'btn btn-outline-secondary w-100', textContent: option , onclick: function() {
							$(this).addClass('active').siblings().removeClass('active');
							view.querySelector('.js-solve-btn').disabled = false;
						}};
				})));
				break;
			case '4' :
				/* 틀린 어법 찾기.
					example = [[보기1start,보기1end],[보기2start,보기2end],...]
					answer = [[정답start,정답end],정답텍스트,오답텍스트]
				 */
				const [[ answerStart, answerEnd ], answer ] = answers;
				// 보기 표시
				examples.sort(([a], [b]) => a - b).forEach(([ start, end ], j, arr) => {
					leftStr = eng.substring(offsetPos, start);
					if(leftStr) contextChildren.push(leftStr);
					const optionText = eng.substring(start, end);
					const span = {
						el: 'span',
						className: 'option text-decoration-underline', 
						textContent: optionText
					};
					if(answerStart == start && answerEnd == end) {
						span.className = 'answer-wrong text-decoration-underline';
						span['data-answer'] = answer;
					}
					contextChildren.push(span);
					// 선택지 추가
					options.push({ el: 'button', className: 'btn btn-outline-secondary w-100', textContent: optionText, onclick: function() {
							$(this).addClass('active').siblings().removeClass('active');
							view.querySelector('.js-solve-btn').disabled = false;
						}});
					if(j == arr.length - 1 && end < eng.length) {
						contextChildren.push(eng.substring(end));
					}
					offsetPos = end;
				});		
				sentence.replaceChildren(createElement(contextChildren));		
				view.querySelector('.example-btn-section').replaceChildren(createElement(options));
				break;	
			case '5' :
				/* 배열하기.
					example = [[보기1start,보기1end],[보기2start,보기2end],...]
				 */
				 
				// 해석 표시
				sentence.replaceChildren(currentBattle.kor)
				// 보기 표시
			 	examples.sort(() => Math.random() - 0.5).forEach(([ start, end ]) => {
					options.push({ el: 'button', className: 'btn btn-outline-secondary', textContent: eng.substring(start, end), onclick: function() {
						if(!this.closest('.arranged-examples')) {
							view.querySelector('.arranged-examples').appendChild(this);
						}else {
							view.querySelector('.example-btn-section').appendChild(this);
						}
						view.querySelector('.js-solve-btn').disabled = view.querySelector('.arranged-examples').childElementCount == 0;
					}
					});
				});	
				view.querySelector('.example-btn-section').replaceChildren(createElement(options));
				break;
		}
		
		// 배틀 출처 표시
		view.querySelector('.source').textContent = currentBattle.source;
	}
	
	/** 플레이어 초기화
	 */
	function initPlayer(memberId, age, contentType, contentId) {
		_memberId = memberId;
		_contentId = contentId;
		_contentType = contentType;

		if(age < 13) _ageGroup = 'E';
		else if(age < 16) _ageGroup = 'M';
		else if(age < 19) _ageGroup = 'H';
		else  _ageGroup = 'C';
		
		_getNextBattles();
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
	
	window['craft'] = Object.assign({}, window['craft'], { initPlayer });
})(jQuery, window, document);
