/** craft/index.html
 * @author LGM
 */
function pageinit(memberId) {
	if(performance.getEntriesByType('navigation')[0].type == 'back_forward') location.reload();
	
	$.cachedScript = $.cachedScript || function( url, options ) {
		return $.ajax( $.extend( options || {}, { dataType: "script", cache: true, url }) );
	};
	// 무료회원 설정
	if(memberId == 0 && localStorage.getItem('FM_NAME')) {
		$('.record-stat .alias').text(localStorage.getItem('FM_NAME'));
		// idb(IndexedDB Wrapper Library) 호출
		$.cachedScript('https://cdn.jsdelivr.net/npm/idb@7/build/umd.js').then(() => {
			// 데이터베이스 연결
			idb.openDB('findsvoc-idb', 1, {
				// 첫 연결 시 오브젝트스토어 생성
				upgrade(db) {
					const store = db.createObjectStore('StepBattle')
					store.createIndex('bid', 'bid', { unique: true});
					store.createIndex('data', 'data');
					store.createIndex('solve', 'solve');
				},
			}).then(db => {
				// 데이터베이스 정상 연결 후 'StepBattle' 오브젝트스토어를 조회
				const records = {O: 0, X: 0};
				db.transaction('StepBattle').store.openCursor().then(function iter(cursor) {
					// cursor를 루핑돌며 전적 카운트
					if(cursor) {
						records[cursor.value.solve]++;
						cursor.continue().then(iter);
					}else {
						// 카운트 완료되면 전적 업데이트
						$('#correctRecord').text(records.O);
						$('#incorrectRecord').text(records.X);
						$('#totalRecord').text(records.O + records.X);
						calcWinningRate();
						db.close();
						// 계급 아이콘도 업데이트
						$.getJSON('https://static.findsvoc.com/data/craft/rank-list.json', arr => {
							const rankClasses = arr.reverse();
							const rankTitle = rankClasses.find(rank => rank.startValue < records.O).rankTitle;
							document.querySelector('.rank-icon')
							.replaceChildren(createElement({
								el: 'object', type: 'image/svg+xml', 
								data: `https://static.findsvoc.com/images/app/craft/${rankTitle}.svg`
							}))
						});
					}
				})
			})
			
		})
	}else calcWinningRate();
	
	const countStoreName = `TCBSC_${ntoa(memberId)}`;
	// 오늘 푼 횟수
	let overCount = 0;
	const prevCountJSONString = localStorage.getItem(countStoreName)
	if(prevCountJSONString!= null && (JSON.parse(prevCountJSONString).date == new Date().toLocaleDateString())) {
		overCount = JSON.parse(prevCountJSONString).count;
	}
	if($('#overCount').length > 0) {
		overCount = parseInt($('#overCount').val());
		localStorage.setItem(countStoreName,JSON.stringify({date: new Date().toLocaleDateString(), count: overCount}));
	}
	if(overCount >= 50) {
		$('.js-play-step').addClass('disabled').removeAttr('onclick')
			.attr('data-bs-toggle', 'tooltip')
			.attr('data-bs-html', 'true')
			.attr('title', '일일 최대 플레이 횟수에 도달하였습니다.<br>내일 다시 찾아와 주세요.')
			.tooltip();
	}
	
	// 개인별 배틀 목록이 열릴 때 ajax 조회
	$('.battle-book-list').one('show.bs.collapse', function() {
		
		// (TBD) 타입별(step, grammar, theme, subscription)로 조회
		/*
		$.getJSON(`/craft/battlebook/${bookType}/list`, function() {
			
		})
		*/
	})
	
	// 배틀 플레이 버튼 동작
	$(document).on('click', '.js-play-book', function() {
		const bid = this.closest('.book').dataset.bid;
		const markType = this.dataset.mtype;
		location.assign(`/craft/battlebook/${ntoa(bid)}?markType=${markType}`);
	})
	
	
	// 승률 표시
	function calcWinningRate() {
		const victoryPercent = ((parseInt($('#correctRecord').text()) / parseInt($('#totalRecord').text())) * 100||0).toFixed(1);
		const $rateGauge = $('.winning-rate-cover .bar'); // 게이지; 45도 시작
		const $rateNeedle = $('.winning-rate-cover .needle'); // 게이지 바늘; -90도 시작
		const $rateText = $('.winning-rate-cover .rate-text');
		const $rateTextSection = $('.personal-info-block .rate-text-section');
		const rateObj = { now: 0}
		
		anime({
			targets: rateObj,
			now: 100,
			easing: 'easeOutQuad',
			delay: 500,
			update: (anim) => {
				$rateGauge.css('transform', `rotate(${45 + 1.8 * rateObj.now * victoryPercent / 100}deg)`);
				$rateNeedle.add($rateTextSection).css('transform', `rotate(${-90 + 1.8 * rateObj.now * victoryPercent / 100}deg)`);
				$rateText.text((rateObj.now * victoryPercent / 100).toFixed(1))	
			}
		})
		
	}
}	
