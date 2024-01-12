/** craft/index.html
 * @author LGM
 */
async function pageinit(memberId, memberRoleType) {
	if(performance.getEntriesByType('navigation')[0].type == 'back_forward') location.reload();
	
	// 등급 표시란 배경 애니메이션(기어가는 바다거북)


	/*const turtle = document.getElementById('anim-turtle');
	const { width, height} = document.getElementById('turtle-section').getBoundingClientRect();
	function getAngle(toX, toY) {
		const { top, left} = turtle.style;
		const dx = parseFloat(left) - toX;
		const dy = toY - parseFloat(top);
		let theta = Math.atan2(height * dy, width * dx); // 범위 (-π, π]
		theta *= 180 / Math.PI; // 라디안을 각도로 변환
		if (theta < 0) theta += 360; // 범위 [0, 360)
		return theta;
	}
	let turtleTimeline;
	addTimeline();
	function addTimeline() {
		let turtleX = 100, turtleY = 0;
		turtleTimeline = anime.timeline({
			before: (el) => {
				el.style.left = '100%';
				el.style.top = '0%';
			},
			targets: '#anim-turtle',
			delay: 2000,
			duration: 1000,
			easing: 'easeOutCubic'
		});
		while(turtleX > 0 && turtleY < 100) {
			const toX = turtleX - Math.random() * 10;
			const toY = turtleY + Math.random() * 10;
			turtleX = toX;
			turtleY = toY;
			turtleTimeline.add({
				left: `${toX}%`,
				top: `${toY}%`,
				rotate: {
					delay: 0,
					easing: 'linear',
					value: (el) => {
					return `-${getAngle(toX, toY)}deg`;
				}
				},
				loopBegin: (anim) => {
					const el = anim.animatables[0].target;
					anime.timeline({
						targets: '#anim-turtle-r',
						transformOrigin: '20% 90%',
					})
					.add({
						rotate: '-60deg',
						duration: 1000,
						easing: 'linear',
					}).add({
						delay: 1000,
						rotate: '0deg',
						duration: 1000
					});
					anime.timeline({
						targets: '#anim-turtle-l',
						transformOrigin: '10% -10%',
					}).add({
						rotate: '60deg',
						duration: 1000,
						easing: 'linear',
					}).add({
						delay: 1000,
						rotate: '0deg',
						duration: 1000
					});
				},
				loopComplete: (anim) => {
					const el = anim.animatables[0].target;
					if(anim.animatables.length > 0 && (parseFloat(el.style.left) <= 0 || parseFloat(el.style.top) >= 100)) {
						el.style.left = '100%';
						el.style.top = '0%';
						turtleX = 100; 
						turtleY = 0;
						turtleTimeline = null;
						addTimeline();
					}
				}
			})
		}
	}*/
	
	const WANDERER = !Cookies?.get('EID') && !Cookies?.get('FMID');
	const URL_MEMBERSHIP_FREE = '/membership/free',
		URL_PLAY_BASE = '/craft/battle/';
	let wanderingBooks = [];
	let DB_NAME = 'findsvoc-idb'
	let DB_VERSION = 2;
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
	function r_substitute(inputString) {
		let reverseSUBS_TABLE = new Map(Object.entries(SUBSTITUTION_TABLE).map(([key,value]) => [value, key]));
		let pattern = new RegExp(Array.from(reverseSUBS_TABLE.keys()).join("|").replace(/\[/g,'\\['), "g");
		return inputString.replace(pattern, (match) => reverseSUBS_TABLE.get(match));
	}
	function battle2Bytes(battle) {
		return pako.deflateRaw(r_substitute(JSON.stringify(battle)));
	}	
	$.cachedScript = $.cachedScript || function( url, options ) {
		return $.ajax( $.extend( options || {}, { dataType: "script", cache: true, url }) );
	};
	const GOLD_MEMBERSHIP_SERVICE_MESSAGE = '<span style="color: gold;text-shadow:0 0 1px darkgoldenrod">골드 멤버십 서비스</span>입니다.\n문장 구조와 표현을 확인할 수 있는 \n<b>다양한 테스트</b>를 통해 문장을 완전히 파악해 보세요.';
	// 무료회원 설정
	if(memberId == 0 && Cookies.get('FMID')) {
		$('.record-stat .alias').text(localStorage.getItem('FM_NAME'));
		// idb(IndexedDB Wrapper Library) 호출
		const StepBattleStoreName = `StepBattle${ntoa(10000001)}`;
		await $.cachedScript('https://cdn.jsdelivr.net/npm/idb@7/build/umd-with-async-ittr.js');
		await $.cachedScript('https://cdn.jsdelivr.net/npm/pako/dist/pako.min.js');
		// 데이터베이스 연결
		(await indexedDB.databases()).forEach(({name,version}) => { if((name == DB_NAME) && (version >= DB_VERSION)) DB_VERSION = version});
		idb.openDB('findsvoc-idb', DB_VERSION, {
			// 첫 연결 시 오브젝트스토어 생성
			async upgrade(db, oldVer, _, tx) {
				const newstore = db.createObjectStore(StepBattleStoreName, { autoIncrement: true });
				newstore.createIndex('bid', 'bid'); // 배틀 ID
				newstore.createIndex('data', 'data'); // 실제 Battle
				newstore.createIndex('solve', 'solve'); // 풀이 결과; 맞음: O, 틀림: X, 기본값 없음
				/*------------- 이전 버전의 데이터 마이그레이션용 --------------------*/
				if(oldVer == 1) { // 1버전엔 StepBattle만 있었음.
					const oldstore = tx.objectStore('StepBattle');
					const records = await oldstore.getAll();
					records.sort((a, b) => {
						return a.data.rnum - b.data.rnum;
					})
					for(const record of records) {
						await newstore.add({...record, bid: ntoa(record.bid), data: battle2Bytes(record.data)});
					}
					db.deleteObjectStore('StepBattle')
				}
				/*------------------------------------------------------------*/
			},
		}).then(db => {
			// 데이터베이스 정상 연결 후 'StepBattle' 오브젝트스토어를 조회
			const records = {O: 0, X: 0};
			db.transaction(StepBattleStoreName).store.openCursor().then(function iter(cursor) {
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
	}else {
		if(memberId == 0) {
			wanderingBooks = JSON.parse(localStorage.getItem('wanderingBooks')) || [];
		}
		calcWinningRate();
	}
	
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
	
	// (단계별 배틀을 제외한) 배틀 목록이 열릴 때 ajax 조회
	const BOOKTYPE_FULLNAMES = {T: 'theme', S: 'subscription', G: 'grammar'};
	const SUBS_BOOK_BTNS = [{classname:'rewind',mtype:'r',fas:'history', title: '리뷰 플레이'},
							{classname:'wrong',mtype:'w',fas:'times', title: '오답 플레이'},
							{classname:'save',mtype:'s',fas:'save', title: '보관 플레이'}];
	$('.battle-book-list').one('show.bs.collapse', function() {
		let listBookType = this.className.match(/subscription|theme|grammar/);
		if(listBookType) listBookType = listBookType[0];
		else return;
		
		const bookListEl = this.querySelector('.book-list-container');
		if(bookListEl == null) return;
		const paginationEl = bookListEl.nextElementSibling?.querySelector('.swiper-pagination');
		$.ajax({
			url: `/craft/battlebook/${listBookType}/list`,
			success: bookList => {
				if(!bookList?.pageable) {
					alertModal('올바른 데이터를 받지 못했습니다.\n화면을 새로고침 해주세요.');
					return;
				}
				this.setAttribute('initialized', true);
				if(!bookList || bookList?.content?.length == 0) return;
				bookListEl.querySelectorAll('.book')?.forEach(b => b.remove());
				bookListEl.appendChild(createBookDOMList(bookList, listBookType));
				paginationEl?.querySelectorAll('.page-item')?.forEach(p => p.remove());
				paginationEl?.appendChild(createElement(getPaginations(bookList)));
			},
			
			error: (xhr) => {
				if(xhr.status == 401) {
					alertModal('접속시간이 초과되었습니다.\n로그인 화면으로 이동합니다.', () => location.assign('/auth/login?destPage=/craft/main'));
				}else if(xhr.status == 403){
					alertModal(GOLD_MEMBERSHIP_SERVICE_MESSAGE);
				}else {
					alertModal('배틀북 조회에 실패했습니다.\n화면 새로고침 후 다시 시도해 주세요.');
				}
			}
		})
	}).on('click', '.page-item', function() {
		if(this.classList.contains('swiper-pagination-bullet-active')) return;
		const paginationEl = this.closest('.pagination-section');
		const bookType = paginationEl.dataset.content;
		const pageNum = this.dataset.pagenum;
		
		const bookListEl = paginationEl.previousElementSibling;
		if(bookListEl == null) return;
		const pageItemContainer = bookListEl.nextElementSibling?.querySelector('.swiper-pagination');
		$.ajax({
			url: `/craft/battlebook/${bookType}/list`,
			data: { pageNum },
			success: bookList => {
				if(!bookList?.pageable) {
					alertModal('올바른 데이터를 받지 못했습니다.\n화면을 새로고침 해주세요.');
					return;
				}
				bookListEl.querySelectorAll('.book')?.forEach(b => b.remove());
				bookListEl.appendChild(createBookDOMList(bookList, bookType));
				pageItemContainer?.querySelectorAll('.page-item')?.forEach(p => p.remove());
				pageItemContainer?.appendChild(createElement(getPaginations(bookList)));
			},
			
			error: (xhr) => {
				if(xhr.status == 401) {
					alertModal('접속시간이 초과되었습니다.\n로그인 화면으로 이동합니다.', () => location.assign('/auth/login?destPage=/craft/main'));
				}else if(xhr.status == 403){
					alertModal(GOLD_MEMBERSHIP_SERVICE_MESSAGE);
				}else {
					alertModal('배틀북 조회에 실패했습니다.\n화면 새로고침 후 다시 시도해 주세요.');
				}
			}
		})
	})
	
	// 
	// battle-book-list의 collapse 이벤트를 적용한 직후에 collapse 이벤트 임의 발생
	if(!!memberId && ['A','S','M'].includes(memberRoleType) && sessionStorage.getItem('subscriptionBattleOpened') == 'true') {
		$('.battle-book-list.subscription').collapse('show');
	}
	
	function createBookDOMList(bookList, listType) {
		return createElement(Array.from(bookList?.content, 
				({battleBookId, bbid, title, bookType, description, imagePath, completed, price, openType},i) => {
					const titleText = { el: 'span', className: 'title-text', textContent: title };
					const bookCoverClass = `book-cover${!!imagePath?'':' default'}`;
					const bookCoverStyle = !!imagePath ? {backgroundImage: `url(/resource/battlebook/cover/${imagePath})`} : {};
					return  listType == 'subscription' 
					// 구독 배틀북
					? { el: 'div', className: 'book col-6 row g-0', dataset: 
						{ bid: battleBookId||bbid, bookType: BOOKTYPE_FULLNAMES[bookType], title, completed},
					children: [
						{ el: 'div', className: 'col-auto', children: [
							{ el: 'div', className: bookCoverClass, children: [
								{ el: 'img', src: 'https://static.findsvoc.com/images/app/workbook/bookcover/book_paper.png', style: bookCoverStyle},
								completed ? { el: 'span', className: 'completed' }
								:{ el: 'span', className: 'play-btn-cover js-play-book', 'data-mtype': 'b', title: '배틀북 플레이' }
							]}
						]},
						{ el: 'div', className: 'col position-relative book-info-section', children: [
							{ el: 'div', className: 'my-1', children: [titleText]},
							{ el: 'div', className: 'button-section col-12 row row-cols-3 g-0 text-center btn-group', children: 
							Array.from(SUBS_BOOK_BTNS, ({classname,mtype,fas,title}) => {
								return (mtype === 'r' && !completed) ? 
								{ el: 'div', title: '배틀을 끝까지 완료 후 리뷰 플레이가 가능합니다.', children: [
									{ el: 'button', className: 'rewind-book-btn btn w-100', disabled: true, children: [
										{ el: 'i', className: `icon fas fa-${fas}`}
									]}
								]}
								:{ el: 'button', className: `js-play-book ${classname}-book-btn btn`, 'data-mtype': mtype, title, children: [
									{ el: 'i', className: `icon fas fa-${fas}`}
								]}
							})}
						]}
					]} 
					// 구독 대상 배틀북
					: { el: 'div', className: 'book js-open-overview col text-center', 
					dataset: {
						bid: battleBookId||bbid, title, bookType: BOOKTYPE_FULLNAMES[bookType], description, imagePath: imagePath||'', completed, price, openType
					}, style: `order: ${i}`, children: [
							{ el: 'div', className: bookCoverClass, children: [
								{ el: 'img', src: 'https://static.findsvoc.com/images/app/workbook/bookcover/book_paper.png', style: bookCoverStyle}
							]},
							{ el: 'div', className: 'title-text-section', children: [ titleText ]}
						]
					};
			}))
	}
	
	/**
	 * 조회한 목록으로 페이지네이션 정보를 표시
	 */
	function getPaginations(page) {
		const totalPages = page.totalPages,	// 전체 페이지 수
			currPage = page.number + 1,		// 현재 페이지(1부터)
			blockLength = 10,
			currBlock = Math.ceil(currPage / blockLength),	// 현재 페이지리스트 뭉치 번호(1부터)
			startPage = (currBlock - 1) * blockLength + 1,				// 페이지리스트 첫번째 번호(1부터)
			endPage = (startPage + blockLength <= totalPages) ? (startPage + blockLength - 1) : totalPages; // 페이지리스트 마지막 번호
		
		const pages = [];
		for(let i = startPage; i <= endPage; i++) {
			pages.push({
				el: 'span', className: `page-item swiper-pagination-bullet${currPage==i?' swiper-pagination-bullet-active':''}`,
				'data-pagenum': i
			})
		}
		if(startPage > blockLength)
			pages.unshift({
				el: 'span', className: 'page-item', role: 'button', 'data-pagenum': startPage - 1 , innerHTML: '&laquo;'
			})
		if(endPage < totalPages) 
			pages.push({
				el: 'span', className: 'page-item', role: 'button', 'data-pagenum': endPage + 1, innerHTML: '&raquo;'
			})
		return pages;
	}
	
	// 주제별 배틀북 개요 펼치기
	let COLS_IN_ROW = devSize.isPhone() ? 3 : devSize.isTablet() ? 4 : 5;
	$(window).on('resize', function() {
		COLS_IN_ROW = devSize.isPhone() ? 3 : devSize.isTablet() ? 4 : 5;
		$('.battlebook-overview-section').each(function() {
			const targetBook = $(this).data('targetBook');
			if(targetBook) {
				this.style.order = (Math.floor(targetBook.style.order / COLS_IN_ROW) + 1) * COLS_IN_ROW;
			}
		})
	})
	const OPEN_TYPE_INFO = {'T': '클래스용', 'P': '회원/비회원', 'M': '회원용'}
	$(document).on('click', '.js-open-overview', function() {
		const $overviewSection = $(this).siblings('.battlebook-overview-section');
		const { bid, title, description, imagePath, price, openType, completed } = this.dataset;
		if($overviewSection.data('targetBook') == this) {
			$overviewSection.collapse('hide');
			$overviewSection.data('targetBook', null);
		}else {
			$overviewSection.data('targetBook', this);
			// 개요 정보 가져오기(ajax)---------------------------------------------
			$.getJSON(`/craft/battlebook/overview/${ntoa(bid)}`, sub => {
				let listBookType = this.closest('.battle-book-list').className.match(/subscription|theme|grammar/);
				if(listBookType) listBookType = listBookType[0];
				const order = (Math.floor(this.style.order / COLS_IN_ROW) + 1) * COLS_IN_ROW;
				$overviewSection.css('order',  order);
				if($overviewSection.is('.show')) $overviewSection[0].scrollIntoView({behavior: 'smooth', block: 'nearest'});
				else $overviewSection.collapse('show');
				$overviewSection.find('.book-title').text(title);
				const $cover = $overviewSection.find('.book-cover');
				if(imagePath?.length > 0) {
					$cover.removeClass('default').find('img').css('background-image', `url(/resource/battlebook/cover/${imagePath})`);
				}else {
					$cover.addClass('default').find('img').css('background-image', '');
				}
				$overviewSection.find('.description').html(description);
				$overviewSection.find('.book-open-type').text(OPEN_TYPE_INFO[openType]).attr('data-open', openType);
				$overviewSection.find('.book-price').text(price.toLocaleString());
				$overviewSection.find('.sub-btn')
					.toggleClass('bg-secondary', (memberId == 0 && openType != 'P' || memberId == 0 && completed == 'true') || (memberId != 0 && !!sub) || (!sub && memberRoleType == 'U'))
					.prop('disabled', (memberId == 0 && openType != 'P' || memberId == 0 && completed == 'true') || (memberId != 0 && !!sub) || (!sub && memberRoleType == 'U'))
					.html(memberId == 0 ? openType == 'P'? completed == 'true' ? '플레이 완료' : '<i class="fas fa-play me-3"></i>바로 플레이' :'회원 전용' 
						: !!sub ? '구독중' : (memberRoleType == 'U') ? '구독 불가 (멤버십 만료)' : '구독');
			})
			.fail(() => alertModal('배틀북 정보 가져오기에 실패했습니다.\n다시 접속해 주세요.'));
			// -----------------------------------------------------------------
		}
	})
	$('.battlebook-overview-section, .battle-book-list').on('shown.bs.collapse', function(e) {
		let listBookType = this.className.match(/subscription|theme|grammar/);
		// 개인별 학습 펼침 여부를 저장
		if(listBookType == 'subscription') sessionStorage.setItem('subscriptionBattleOpened', 'true');
		e.stopPropagation();
		this.scrollIntoView({behavior: 'smooth', block: 'nearest'});
	}).on('hide.bs.collapse', function() {
		let listBookType = this.className.match(/subscription|theme|grammar/);
		// 개인별 학습 펼침 여부를 저장
		if(listBookType == 'subscription') sessionStorage.setItem('subscriptionBattleOpened', 'false');
		
	})
	
	// 배틀 구독 혹은 플레이
	$('.battlebook-overview-section').on('click', '.sub-btn', function() {
		const { bid, title, openType, bookType, completed } = $(this).closest('.battlebook-overview-section').data('targetBook').dataset;
		if(!memberId) { // 로그인 사용자가 아닌 경우
			if(openType == 'P') { // 전체 오픈 배틀북에 한해(비회원 및 방문자에게 있어 바로 플레이 대상임)
				if(Cookies.get('FMID')) { // 비회원은 곧바로 플레이
					location.assign(`${URL_PLAY_BASE}${bookType}/b/${ntoa(parseInt(bid))}?title=${encodeURIComponent(title)}&bookType=${bookType}&completed=${completed}&wanderer=${WANDERER}`);
					return;
				}else { // 방문자는 가입 의사를 묻는다.
					askMembershipModal(`${URL_PLAY_BASE}${bookType}/b/${ntoa(parseInt(bid))}?title=${encodeURIComponent(title)}&bookType=${bookType}&completed=${completed}&wanderer=${WANDERER}`);
					return;
				}
			}else { // 전체 오픈이 아닌 배틀북을 비회원,방문자가 풀려는 경우 로그인 화면으로 이동.
				if(confirmModal('fico 멤버십이 필요합니다.\n로그인 화면으로 이동하시겠습니까?')) location.assign('/auth/login');
				return;
			}
		}
		
		$.post(`/craft/battlebook/subscription/${bid}`, (msg) => {
			switch(msg){
			case 'success':
				alertModal(`"${title}"을(를) 구독하였습니다.\n개인별 학습에서 구독한 배틀북을 확인할 수 있습니다.\n녹색 플레이 버튼을 눌러 배틀을 풀어보세요`, () => {
					$(this).prop('disabled', true).text('구독중');
					if($('.battle-book-list.subscription').attr('initialized')) {
						$.getJSON('/craft/battlebook/subscription/list', bookList => {
							$('.my-book-type.subscription .book-list-container').empty()
							.append(createBookDOMList(bookList, 'subscription'))
							.collapse('show');
						})
					}else {
						$('.battle-book-list.subscription').collapse('show');
					}
				});
				break;
			case 'duplicated':
	        	alertModal('이미 구독한 배틀북입니다.\n\'개인별 학습\'을 참고해 주세요.');
	         	break;
			case 'insufficient':
				alertModal('잔여 fico 코인이 부족합니다.');
				break;
			}		
		})
		.fail(jqxhr => {
			switch(jqxhr.status) {
				case 403:
					alertModal(GOLD_MEMBERSHIP_SERVICE_MESSAGE)
					break;
				default:
					alertModal('배틀북 구독에 실패했습니다. 화면 새로고침 후 다시 시도해 주세요.');
					break;
			}
		});
	})
	
	// 배틀 플레이 버튼 동작
	$(document)
	.on('click', '.js-play-step', function() {
		// 단계별 배틀은 비회원가입이라도 해야 플레이 할 수 있다.
		if(WANDERER) location.assign(URL_MEMBERSHIP_FREE);
		else if(!memberId && Cookies?.get('EID')) location.assign('/auth/login?destPage=/craft/main');
		else location.assign(`${URL_PLAY_BASE}step/b?title=단계별 학습&bookType=step&wanderer=${WANDERER}`);
	})
	.on('click', '.js-play-book', function() {
		const { bid, title, bookType, completed } = this.closest('.book').dataset;
		const markType = this.dataset.mtype;
		const bidPath = bookType === 'step' ? '' : `/${ntoa(bid)}`;
		const completedParam = completed === undefined ? '' : `&completed=${completed}`;
		// 방문자는 비회원가입을 할지 말지 물어보고, 가입 혹은 그대로 플레이
		if(WANDERER) askMembershipModal(`${URL_PLAY_BASE}${bookType}/${markType}${bidPath}?title=${encodeURIComponent(title)}&bookType=${bookType}${completedParam}&wanderer=${WANDERER}`);
		else location.assign(`${URL_PLAY_BASE}${bookType}/${markType}${bidPath}?title=${encodeURIComponent(title)}&bookType=${bookType}${completedParam}&wanderer=${WANDERER}`);
	});
	
	/**
	 * 비회원 가입 의사를 물어보고 가입 혹은 플레이 화면으로 이동.
	 */
	function askMembershipModal(destPage) {
		const targetBook = destPage.match(/(?:craft\/battle\/\w+\/\w\/)(\w+)/)[1];
		if(wanderingBooks.includes(targetBook)) {
			location.assign(destPage);
			return;
		}
		const modal = 
		document.getElementById('askMembershipModal') ||document.body.appendChild(createElement({
			"el":"div","id":"askMembershipModal","data-bs-backdrop":"static", 'data-bs-return': '0',
			"class":"modal fade","tabIndex":0,"children":[
				{"el":"div","class":"modal-dialog modal-md modal-dialog-centered","children":[
					{"el":"div","class":"modal-content","children":[
						{"el":"div","class":"modal-header bg-fc-purple py-1 px-3","children":[
							{"el":"h5","class":"modal-title","textContent":"이용 안내"},
							{"el":"button","class":"btn fas fa-times text-light p-0","data-bs-dismiss":"modal","aria-label":"Close"}
						]},
						{"el":"div","class":"modal-body row g-0","children":[
							{"el":"div","class":"text-section mb-3 text-center text-dark","innerHTML":"<span class='app-name-text'>fico</span> 이용자 <b class='text-fc-red'>가입</b>시 테스트 <b>진행기록</b>과 <b>전적 정보</b>가 <b>저장</b>되어 다음에도 로그인없이 배틀을 <b>이어서 이용</b>할 수 있습니다."},
							{ "el": "div", className: 'col text-center', children: [
								{"el":"button","class":"btn btn-fico w-100","innerHTML": "<b>예</b><br><span class='fs-7'>(이용자 간편가입)</span>", onclick: () => {
									location.assign(`/membership/free?destPage=${destPage}`);
								}}
							]},
							{ "el": "div", className: 'col text-center', children: [
								{"el":"button","class":"btn btn-outline-fico w-100", "innerHTML": "<b>아니오</b><br><span class='fs-7'>(가입없이 진행)</span>", onclick: () => {
									wanderingBooks.push(targetBook);
									localStorage.setItem('wanderingBooks', JSON.stringify(wanderingBooks));
									location.assign(destPage);
								}}
							]}
						]}
					]}
				]}
			]}
		));
		$(modal).modal('show');
	}

	
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
			update: (_anim) => {
				$rateGauge.css('transform', `rotate(${45 + 1.8 * rateObj.now * victoryPercent / 100}deg)`);
				$rateNeedle.add($rateTextSection).css('transform', `rotate(${-90 + 1.8 * rateObj.now * victoryPercent / 100}deg)`);
				$rateText.text((rateObj.now * victoryPercent / 100).toFixed(1))	
			}
		})
		
	}
}	
