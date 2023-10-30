/** /mypage/view_account.html
@author LGM
 */
function pageinit(tray, normalEggCount, goldEggCount) {
	let eggInfoList = [];
	$.getJSON('https://static.findsvoc.com/data/egg/egg-info.json', list => {
		eggInfoList = list;
	})
	// [보유 에그 표시]------------------------------------------------------------
	const eggInfos = document.querySelectorAll('.egg-dimention-section .egg-info');
	for(let i = 0; i < 9; i++) {
		if(tray[i] > 0) eggInfos[i].role = 'button';
		let eggClass = 'egg';
		if(tray[i] == 0) eggClass += ' uncollected';
		else {
			eggClass += ` egg-${i + 1}`;
			if(i > 4) eggClass += ' metallic';
		}
		eggInfos[i].appendChild(createElement([
			// 에그 그래픽 영역
			{ el: 'div', className: 'egg-wrapper m-auto', style: 'transform: scale(0)', children: [
				{ el: 'div', className: eggClass, children: [
					{ el: 'div', className: 'fill' },
					{ el: 'div', className: 'shading' },
					{ el: 'div', className: 'key' },
					{ el: 'div', className: 'highlight' }
				]}
			]},
			// 에그 카운터 영역
			{ el: 'div', className: 'egg-count-section text-center mt-2', children: [
				{ el: 'span', className: 'egg-count', innerText: tray[i] > 0 ? tray[i] : '' }
			]}
		]))
	}
	// 골드 추가
	eggInfos[9].appendChild(createElement([
		{ el: 'div', className: 'egg-wrapper m-auto', style: 'transform: scale(0)', children: [
			{ el: 'div', className: 'egg metallic gold', children: [
				{ el: 'div', className: 'fill' },
				{ el: 'div', className: 'shading' },
				{ el: 'div', className: 'key' },
				{ el: 'div', className: 'highlight' }
			]}
		]},
		{ el: 'div', className: 'egg-count-section text-center mt-2', children: [
			{ el: 'span', className: 'egg-count', innerText: goldEggCount }
		]}
	]))
	// 에그를 하나씩 표시
	anime({
		targets: '.egg-dimention-section .egg-info .egg-wrapper',
		delay: anime.stagger(100,{start:500}),
		duration: 1000,
		scale: [0,1]
	});
	
	// [총 에그 보유량(숫자) 표시]---------------------------------------------------
	setTimeout(() => {
		anime.timeline({
			duration: 1000,
			easing: 'linear',
			round: 1
		})
		.add({
			targets: '#total-egg-count',
			textContent: [0, normalEggCount || 0]
		})
		.add({
			targets: '#total-gold-egg-count',
			textContent: [0, goldEggCount || 0]
		})
	}, 500);
	
	// [버킷 진행도 표시]---------------------------------------------------------
	/*let bucketLevel = 1, bucketSize = 1, _quotient = normalEggCount;
	while(_quotient >= 9) {
		_quotient /= 3;
		bucketSize *= 3;
		bucketLevel++;
	}
	bucketLevel = Math.max(1, bucketLevel);
	
	// 버킷 전체보기 세팅
	const bucketHistory = [];
	for(let i = 0; i < bucketLevel; i++) {
		bucketHistory.push({
			el: 'div', className: 'col-4 row g-0 my-4', children: [
				{ el: 'div', className: 'col-10 text-center', children: [
					{ el: 'div', className: `bucket-icon bucket-${i+1} text-warning` },
					{ el: 'div', className: 'text-xl', innerText: `Lv.${i+1}` }
				]},
				{ el: 'div', className: 'col-2 my-auto text-center', children: [
					{ el: 'i', className: 'fas fa-arrow-right text-2xl text-gray-400' }
				]}
			]});
	}
	bucketHistory.push({
		el: 'div', className: 'col-4 row g-0 my-4', children: [
			{ el: 'div', className: 'col-10 text-center', children: [
				{ el: 'div', className: 'bucket-icon uncollected text-gray-400' },
				{ el: 'div', className: 'text-xl' }
			]},
			{ el: 'div', className: 'col-2 my-auto text-center' }
		]});

	// 총 9개의 버킷 표시
	const bucketJSONs = [];
	let restCount = normalEggCount, count;
	for(let i = 0; i < 9; i++) {
		if(restCount / bucketSize >= 1) count = bucketSize;
		else count = Math.max(0, restCount % bucketSize);
		restCount -= bucketSize;
		bucketJSONs.push({
			el: 'div', className: `bucket-icon position-relative bucket-${bucketLevel}`,
			role: 'button', 'data-bs-toggle': 'tooltip', 'data-count': count,
			title: `${count}/${bucketSize}`
		});
	}
	document.querySelector('.total-egg-section').appendChild(createElement(bucketJSONs));
	const bucketDOMs = document.querySelectorAll('.total-egg-section .bucket-icon');
	// 버킷을 차례대로 채워나감
	const buckettimeline = anime.timeline({ duration: 500, easing: 'linear' })
	setTimeout(() => {
		for(let i = 0; i < 9; i++)
			buckettimeline.add({
				targets: bucketDOMs[i],
				update: function(anim) {
					// 버킷의 바닥부터 채워짐
					const target = anim.animatables[0].target;
					target.style.backgroundImage = `-webkit-linear-gradient(90deg, var(--fc-purple) ${parseInt(target.dataset.count)/bucketSize * anim.progress}%, #fff 0%)`;
				},
				complete: function(anim) {
					const target = anim.animatables[0].target;
					// 가득찬 버킷은 톡톡 터지는 효과 표시
					if(parseInt(target.dataset.count) == bucketSize)
						showFireworks({ target,
							size: 5, distance: 40, particles: 10, count: 1,
							time: 1, interval: 1,
							top: '-30px', left: 'calc(50% - 40px)',
							width: '80px', height: '80px',
							colors: ['#bb99bff','#99bbff']
						})
				}
			}, '-=200')
	}, 1000);*/
	
	
	// [에그를 클릭하면 에그정보 상세보기]--------------------------------------------------
	$(document).on('click', '.egg-info', function(e) {
		const detail = document.querySelector('.egg-detail-section');
		const selectedEgg = this.querySelector('.egg');
		const eggIndex = parseInt((selectedEgg.className.match(/egg-(\d+)/)||{ 1 : 10 })[1]) - 1;
		if(selectedEgg.matches('.uncollected')) return;
		
		if(devSize.isPhone()) {
			if(window.history.state != 'eggModal')
				window.history.pushState('eggModal', 'eggModal');
			$('html').addClass('overflow-hidden');
		}
		
		// 골드 여부
		const isGold = selectedEgg.matches('.gold');
		// 골드 여부에 따라 표시여부가 달라지는 항목들 선택자
		const selectiveInfo = Array.from(['count-text','hatching-info'], s => '.egg-text-info-section .'+s).join(',');
		
		$(detail).find(selectiveInfo).toggle(!isGold);
		
		// 에그 종류에 따른 클래스 추가
		let eggClass = `egg egg-${eggIndex + 1}`;
		if(eggIndex > 4) eggClass += ' metallic';
		if(eggIndex == 9) eggClass += ' gold';
		detail.querySelector('.egg').className = eggClass;
		// 에그 이름
		let eggBadgeClass = 'pastel';
		if(eggIndex == 9) eggBadgeClass = 'gold';
		else if(eggIndex > 4) eggBadgeClass = 'shining';
		detail.querySelector('.egg-text-info-section .name').innerHTML 
			= `<span class="badge egg-sort ${eggBadgeClass}">name</span>` + eggInfoList[eggIndex].name;
		// 에그 부화 d-day
		if(!isGold) 
			detail.querySelector('.egg-text-info-section .egg-count').textContent 
			= 900 - parseInt(this.querySelector('.egg-count').textContent)
		// 에그 타이틀
		detail.querySelector('.egg-text-info-section .title').innerHTML = eggInfoList[eggIndex].title;
		// 에그 설명
		detail.querySelector('.egg-text-info-section .desc').innerHTML = eggInfoList[eggIndex].desc;
		
		// 골드의 경우 반짝임 효과
		if(isGold) 
			showFireworks({target: detail.querySelector('.egg'),
				size: 1, distance: 100, colors: ['#FFFFFF'], interval: 500, count: 5, particles: 5
			});
		// 데스크톱용 상세보기 위치 설정
		if(!devSize.isPhone()) {
			if(e.currentTarget.getBoundingClientRect().x > window.innerWidth / 2) {
				detail.style.left = 'unset';
				detail.style.right = `${document.body.clientWidth - this.offsetLeft - this.offsetWidth}px`;
			}else {
				detail.style.right = 'unset';
				detail.style.left = `${e.currentTarget.getBoundingClientRect().x}px`;
			}
			detail.style.top = `${e.currentTarget.offsetTop}px`;
			detail.querySelector('.btn-close')?.remove();
		}
		// 모바일용 상세보기 위치
		else {
			detail.style.position = 'fixed';
			detail.style.top = 0;
		}
		$(detail).show(200);
	})
	// [에그 상세보기에서 커서를 떼면 닫기]---------------------------------------------
	.on('mouseleave', '.egg-detail-section', function(e) {
		if(devSize.isPhone()) return;
		e.stopPropagation();
		e.stopImmediatePropagation();
		$('.egg-detail-section').hide();
	})
	if(devSize.isPhone()) {
		window.addEventListener('popstate', () => {
			if(history.state != 'eggModal') {
				$('.egg-detail-section').hide(100);
				$('html').removeClass('overflow-hidden');
			} 
		})
	}

	// [에그 내역 조회]------------------------------------------------------------
	$('#accountEventTable').one('show.bs.collapse', function() {
		// 코인내역 조회(ajax)------------------------------
		$.getJSON('/mypage/account/event/list', listEvents)
		.fail(() => {
			alert('에그 내역을 불러오지 못했습니다.');
		});
		//-----------------------------------------------
	});
	// [에그 내역 추가 조회]--------------------------------------------------------
	$(document).on('click', '#accountEventPagination .page-link', function() {
		const pageNum = this.dataset.pagenum;
		// 에그 내역 추가 조회(ajax)-------------------------------------------
		$.getJSON('/mypage/account/event/list', { pageNum }, listEvents)
		.fail(() => alert('에그 내역을 불러오지 못했습니다.'));
		//------------------------------------------------------------------
	})
	// [버킷을 클릭하면 버킷 전체정보 보기]---------------------------------------------
	/*$(document).on('click', '.bucket-icon', function() {
		$('#bucket-modal').modal('show');
	});*/
	function listEvents(events) {
		const eventList = document.getElementById('accountEventList');
		if(!events?.empty) {
			const contents = events.content
			// 레코드 표시
			const eventRecords = [];
			for(let i = 0, len = contents.length; i < len; i++) {
				const myEvent = contents[i];
				eventRecords.push(
					{ el: 'tr', children: [
						// 레코드 번호 표시
						{ el: 'td', className: 'd-none d-md-table-cell', scope: 'row', innerText: events.size * events.number + i + 1 },
						// 이벤트 상세
						{ el: 'td', innerText: myEvent.description },
						{ el: 'td', children: [
							// 에그 표시
							myEvent.amount != 0 
							? { el: 'span', className: 'text-' + (myEvent.amount < 0 ? 'danger':'success'),
							children: [
								{ el: 'i', className: `fas fa-egg ${myEvent.gold ? 'egg-icon gold':'text-white text-stroke-gray'} ms-3 me-2` },
								Number(myEvent.amount).toLocaleString('ko-KR',{signDisplay:'always'})
							]} : ''
						]},
						// 날짜
						{ el: 'td', innerText: new Date(myEvent.txDate).format('yyyy-MM-dd(e)') }
					]}
				);
			}
			eventList.replaceChildren(createElement(eventRecords));
			// 페이지네이션 표시
			const pagination = document.getElementById('accountEventPagination');
			const totalPages = events.totalPages;
			const currPage = events.number;
			const startNum = Math.floor(currPage / 10) * 10 + 1;
			const endNum = Math.min(startNum + 9, totalPages);
			const pageitems = [];
			
			// 이전 버튼
			if(startNum > 10) pageitems.push({
				el: 'li', className: 'page-item', ariaLabel: 'Previous', children: [
					{ el: 'a', className: 'page-link', ariaHidden: true, 'data-pagenum': startNum - 1, innerHTML: '&laquo;' }
				]});
			// 페이지번호 버튼
			for(let pi = startNum; pi <= endNum; pi++) pageitems.push({
				el: 'li', className: 'page-item' + (pi == currPage + 1 ? ' active' : ''), children: [
					{ el: 'a', className: 'page-link', 'data-pagenum': pi, innerHTML: pi }
				]});
			// 다음 버튼
			if(startNum + 9 < totalPages) pageitems.push({
				el: 'li', className: 'page-item', ariaLabel: 'Next', children: [
					{ el: 'a', className: 'page-link', ariaHidden: true, 'data-pagenum': startNum + 10, innerHTML: '&raquo;' }
				]});
			pagination.replaceChildren(createElement(pageitems));
		} else {
			eventList.replaceChildren(createElement({el: 'tr', children: [{el: 'td', colSpan: 4, innerText: '내역이 존재하지 않습니다.'}]}));
		}
	}
	
	// [바우처 내역 조회]-----------------------------------------------------------
	$('#myTab .nav-link').on('show.bs.tab', function(e) {
		$('#myTab .nav-link').not(this).removeClass('active');
		const $contentDiv = $(e.target.dataset.bsTarget);
		if(e.target.matches('#voucherTab') && $contentDiv.find('tbody').is(':empty')) {
			$.getJSON('/voucher/purchase/list', listVouchers)
		}
	});
	$(document).on('click', '#voucherTable .page-link', function() {
		const pageNum = this.dataset.pagenum;
		$.getJSON('/voucher/purchase/list', { pageNum }, listVouchers)
	});
	
	function listVouchers(vouchersPage) {
		const voucherTable = document.getElementById('voucherTable');
		if(!vouchersPage?.empty) {
			const contents = vouchersPage.content
			// 레코드 표시
			const records = [];
			for(let i = 0, len = contents.length; i < len; i++) {
				const voucher = contents[i];
				records.push(
					{ el: 'tr', children: [
						// 레코드 번호 표시
						{ el: 'td', className: 'd-none d-md-table-cell', scope: 'row', innerText: vouchersPage.size * vouchersPage.number + i + 1 },
						// 이벤트 상세
						{ el: 'td', innerText: voucher.title },
						{ el: 'td', innerText: voucher.amount },
						// 날짜
						{ el: 'td', className: 'd-none d-md-table-cell', innerText: new Date(voucher.regDate).format('yyyy-MM-dd(e)') }
					]}
				);
			}
			voucherTable.querySelector('tbody').replaceChildren(createElement(records));
			// 페이지네이션 표시
			const pagination = voucherTable.querySelector('.pagination');
			const totalPages = vouchersPage.totalPages;
			const currPage = vouchersPage.number;
			const startNum = Math.floor(currPage / 10) * 10 + 1;
			const endNum = Math.min(startNum + 9, totalPages);
			const pageitems = [];
			
			// 이전 버튼
			if(startNum > 10) pageitems.push({
				el: 'li', className: 'page-item', ariaLabel: 'Previous', children: [
					{ el: 'a', className: 'page-link', ariaHidden: true, 'data-pagenum': startNum - 1, innerHTML: '&laquo;' }
				]});
			// 페이지번호 버튼
			for(let pi = startNum; pi <= endNum; pi++) pageitems.push({
				el: 'li', className: 'page-item' + (pi == currPage + 1 ? ' active' : ''), children: [
					{ el: 'a', className: 'page-link', 'data-pagenum': pi, innerHTML: pi }
				]});
			// 다음 버튼
			if(startNum + 9 < totalPages) pageitems.push({
				el: 'li', className: 'page-item', ariaLabel: 'Next', children: [
					{ el: 'a', className: 'page-link', ariaHidden: true, 'data-pagenum': startNum + 10, innerHTML: '&raquo;' }
				]});
			pagination.replaceChildren(createElement(pageitems));
		} else {
			voucherTable.querySelector('tbody').replaceChildren(createElement({el: 'tr', children: [{el: 'td', colSpan: 4, innerText: '내역이 존재하지 않습니다.'}]}));
		}
	}	
	
	
	// [코인 충전 혹은 멤버십 연장 버튼을 눌러 결제 모달 표시]------------------------------
	$('.js-open-extend').click(function() {
		if($('#modalDiv').children().length == 0) {
			$('#modalDiv').load('/mypage/membership/extend .modal', displayModal);
		}else displayModal();
		
		function displayModal() {
			$('#modalDiv .modal').modal('show');
		}
		
	});
	let nextTimer; 
	let orderItemList = [];
	$(document)
	// [가입연장 모달 실행]---------------------------------------------------------
	.on('show.bs.modal', '#done-info-modal', function() {
		clearInterval(nextTimer);
		$('#donationModalLabel').text('멤버십을 선택해 주세요.');
	})
	// [상품 선택 완료]------------------------------------------------------------
	.on('submit', '#selectItemForm', function() {
		if(this.checkValidity()) {
			event.preventDefault();
			const $item = $('#phase-1 [name=orderItem]:checked');
			const itemName = $item.data('itemname');
			const price = $item.next('.membership-block').find('.price').text();
			
			$('#totalAmount').val(price.replace(/\D+/g,''));
			orderItemList = [$item.val()];
			$('#phase-2 .payment-info .name').text(itemName);
			$('#phase-2 .payment-info .price').text(price);
			$('#phase-1,#phase-2').collapse('toggle');
		}
	})
	// [멤버십 선택]---------------------------------------------------------------
	.on('show.bs.collapse', '#modalDiv #phase-1', function() {
		$('#donationModalLabel').text('멤버십을 선택해 주세요.');
	})
	// [결제 대기]----------------------------------------------------------------
	.on('show.bs.collapse', '#modalDiv #phase-2', function() {
		
		$('#donationModalLabel').text('송금을 진행해 주세요.');
		$('#phase-2 [data-bs-target="#phase-2,#phase-3"]').prop('disabled', true);
		clearInterval(nextTimer);
		$('#phase-2 .progress-bar').attr('aria-valuenow', 0).width(0);
		let progress = 0
		nextTimer = setInterval(() => {
			if(progress < 100) {
				progress++;
				$('#phase-2 .progress-bar').attr('aria-valuenow', progress)
										.width(progress + '%');
				$('#phase-2 [data-bs-target="#phase-2,#phase-3"]').prop('disabled', true);
			}else {
				clearInterval(nextTimer);
				$('#phase-2 [data-bs-target="#phase-2,#phase-3"]').prop('disabled', false).trigger('click');
			}
		}, 1000);
	})
	// [가입정보 확인 및 수정]-------------------------------------------------------
	.on('show.bs.collapse', '#modalDiv #phase-3', function() {
		$('#donationModalLabel').text('회원가입 정보');
	})
	// [추가정보 입력 완료]---------------------------------------------------------
	.on('submit', '#paymentForm', function(e) {
		e.preventDefault();
		const submitter = e.originalEvent.submitter;
		const data = Object.fromEntries(new FormData(this).entries());
		if(this.checkValidity()) {
			submitter.disabled = true;
			$('#modalDiv .modal').modal('hide');
			data["orderItemList"] = orderItemList;
			$.ajax({
				url: '/membership', type: 'POST', 
				data: JSON.stringify(data),
				contentType: 'application/json', 
				success: () => {
					alertModal('멤버십이 연장되었습니다.\n다시 로그인해 주세요.', () => document.forms.logout.submit());
				},
				error: () => {
					alertModal('가입 처리 중 오류가 발생하였습니다.\nteamoldbyte@gmail.com 로 문의 바랍니다.', () => $('#done-info-moal').modal('hide'));
				},
				complete: () => submitter.disabled = false
			})
		}
	})
	// 모바일 화면일 경우 에그 내역 페이지네이션을 작게
	function fitWindowSize() {
		$('#accountEventPagination').toggleClass('pagination-sm', devSize.isPhone());
		$('#accountEventList').toggleClass('align-middle text-sm', devSize.isPhone());
	}
	fitWindowSize();
	window.addEventListener('resize', fitWindowSize);
	
	document.body.append(createElement([
		{ "el": "div", "class": "modal fade", "id": "egg-explain-modal", "tabindex": "-1", 
			"aria-labelledby": "eggExplainModalLabel", "aria-hidden": true, "children": [
			{ "el": "div", "class": "modal-dialog modal-dialog-centered", "children": [
				{ "el": "div", "class": "modal-content", "children": [
					{ "el": "div", "class": "modal-header", "children": [
						{ "el": "button",
							"type": "button",
							"class": "btn-close",
							"data-bs-dismiss": "modal",
							"aria-label": "Close"
						}
					]},
					{ "el": "div", "class": "modal-body", "children": [
						{ "el": "p", "children": [
							{ "el": "h5", "textContent": "에그는 무엇인가요?" },

							"에그는 ",
							{ "el": "span", "class": "app-name-text", "textContent": "fico" },
							"에서 사용되는 포인트입니다.",{ "el": "br" },
							{ "el": "b", "textContent": "총 9개" },
							"로 구성되며 에그마다 다른 확률로 무작위로 배포됩니다.",{ "el": "br" },
							"골드 에그는 ",
							{ "el": "span", "class": "app-name-text", "textContent": "fico" },
							" 코인으로서 ",
							{ "el": "b", "textContent": "골드 콘텐츠 결제" },
							"에 사용할 수 있습니다.",{ "el": "br" },
							{ "el": "br" },

							{ "el": "h5", "textContent": "에그를 모을 수 있는 방법?" },
							"1. 나의 워크북 공개하기",{ "el": "br" },
							"2. 잘못된 구문 분석 수정하기",{ "el": "br" },
							"3. 배틀 북에서 정답 맞히기",{ "el": "br" },
							{ "el": "span", "class": "text-smd", "textContent": "다양한 콘텐츠에서 에그를 수집할 수 있도록 지속적으로 제공하겠습니다." },{ "el": "br" },
							{ "el": "br" },

							{ "el": "h5", "textContent": "에그를 모아서 무엇을 할 수 있나요?" },
							"무작위로 수집한 플레인 에그를 ",
							{ "el": "b", "textContent": "골드 에그로 변경" },
							"할 수 있습니다.",{ "el": "br" },
							"골드 에그를 모아 ",
							{ "el": "b", "textContent": "골드 콘텐츠 결제" },
							"에 사용하세요.",{ "el": "br" },
						]}
					]}
				]}
			]}
		]},
		/*{ el: 'div', className: 'bucket-detail-section modal', id: 'bucket-modal', tabIndex: '-1', children: [
			{ el: 'div', className: 'modal-dialog modal-dialog-centered', children: [
				{ el: 'div', className: 'modal-content', children: [
					{ el: 'div', className: 'modal-header', children: [
						{ el: 'h5', textContent: '획득 버킷'},
						{ el: 'button', type:'button', className: 'btn-close', 'data-bs-dismiss': 'modal'},
					]},
					{ el: 'div', className: 'modal-body px-1 px-md-5', children: [
						{ el: 'div', className: 'bucket-history row g-0', children: bucketHistory }
					]}
				]}
			]}
		]},*/
		{ el: 'div', className: 'egg-detail-section' + (devSize.isPhone() ? ' top-50 translate-middle-y' : ''), style: { display: 'none', position: 'absolute', zIndex: 1062 }, children: [
			{ el: 'div', className: 'btn btn-close position-absolute end-3', onclick: () => {
				if(devSize.isPhone() && window.history.state == 'eggModal') {
					window.history.back();
				}else {
					$('.egg-detail-section').hide(100);
				}} },
			{ el: 'div', className: 'row g-0', children: [
				{ el: 'div', className: 'col-12 col-md-8', children: [
					{ el: 'div', className: 'egg-wrapper', children: [
						{ el: 'div', className: 'shadow', children: [
							//{ el: 'div', className: 'main' },
							{ el: 'div', className: 'secondary'}
						]},
						{ el: 'div', className: 'egg', children: [
							{ el: 'div', className: 'fill' },
							{ el: 'div', className: 'shading' },
							{ el: 'div', className: 'key' },
							{ el: 'div', className: 'highlight' }
						]}
					]}
				]},
				{ el: 'div', className: 'egg-text-info-section col-12 col-md-4 mt-5 mt-md-0', children: [
					{ el: 'h4', className: 'name' },
					{ el: 'span', className: 'title' },
					{ el: 'span', className: 'desc' },
					{ el: 'span', className: 'writer', textContent: '- Alalos Eggsy -' },
					{ el: 'div', className: 'footer-text', children: [
						{ el: 'span', className: 'count-text mb-0', children: [
							'Hatching D-Day : ', { el: 'span', className: 'egg-count' }, ' left.'
						]},
						{ el: 'span', className: 'hatching-info', textContent: '에그를 부화시켜 마법사 에그시가 숨겨놓은 선물을 받아가세요.' }
					]},
				]}
			]}
		]}
	]));
} //end of ready
