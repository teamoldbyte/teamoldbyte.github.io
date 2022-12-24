/** workbook/index.html
 * @author LGM
 */
function pageinit(recentOpenWorkBooks, memberId){
	$('#loadingModal').modal('hide');
	const isMobile = window.visualViewport.width < 768;
	const masonryOptsForPassages = { itemSelector: '.passage', columnWidth: '.passage',
			gutter: 10, percentPosition: true, horizontalOrder: true, transitionDuration: '0.8s'
		};
	
	// [워크북 목록 가로 넘기기]-----------------------------------------------------
	// 화면 가로길이에 따른 lazyLoad 갯수 조정(일부 잘린 항목도 보이도록)
	let rowNum = isMobile ? 3 : 2;
	
	appendList(recentOpenWorkBooks)
	
	let swiper = new Swiper('.swiper', {
		slidesPerView: 'auto',
		watchSlidesProgress: true,
		simulateTouch: true,
		resistance: false,
		slidesPerGroupAuto: true,
		grid: {
			rows: rowNum
		},
		navigation: {
			prevEl: '.swiper-button-prev',
			nextEl: '.swiper-button-next'
		},
		lazy: true,
		on: {
			click: function(s,e) {
				if(!s.clickedSlide) return;
				const $overviewSection = $('.workbook-overview-section');
				const bookDiv = s.clickedSlide||e.path.find(d=>d.matches('.book-unit'));
				const workBookId = bookDiv.dataset.workBookId,
						workBookId56 = ntoa(workBookId);
				$('.book-section .book-unit').not(bookDiv).removeClass('active');
				$(bookDiv).toggleClass('active');
				if($(bookDiv).is('.active')) {
					if(!$(bookDiv).data('overview')) {
						// 개요 정보 가져오기(ajax)------------------------------
						$.getJSON(`/workbook/overview/${ntoa(bookDiv.dataset.workBookId)}`, (overview) => {
							$(bookDiv).data('overview', overview);
							showOverview(overview);
						})
						.fail( () => alertModal('워크북정보 가져오기에 실패했습니다.\n다시 접속해 주세요.'));
						// --------------------------------------------------
					}else {
						showOverview($(bookDiv).data('overview'));
					}
				}else {
					$('.workbook-overview-section').collapse('hide');
				}
				
				// 개요 정보 표시
				function showOverview({ title, description, price, sub, copy, imagePath, alias, aliasImage, passageDtoList, regDate}) {
					$overviewSection.find('.writer-cover .alias').text(alias);
					$overviewSection.find('.writer-cover .personacon img')
									.css('background-image', aliasImage?.length > 0 
									? (`url(/resource/profile/images/${aliasImage})`)
									: 'var(--fc-logo-head)');
					
					$('#subscribeWorkbook').data('workBookId', workBookId);
					
					$overviewSection.find('.title').text(title);
					
					$overviewSection.find('.description').text(description);
		
					$overviewSection.find('.price').text(price > 0
										? (price.toLocaleString() + ' fico')
										: '무료');
					
					$overviewSection.find('#subscribeWorkbook')
									.toggleClass('bg-secondary', sub)
									.prop('disabled', sub)
									.text(sub ? '구독중' : '구독');
					
					//$overviewSection.find('.subs-num').text(overview.numOfSubscriber);
					
					$overviewSection.find('.reg-date').text(new Date(regDate).toLocaleDateString());
		
					$overviewSection.find('.book-cover').toggleClass('default', imagePath == null || imagePath.length == 0)
									.find('img').attr('alt', title);
					$overviewSection.find('.book-cover img')
						.css('background-image', (imagePath?.length > 0) 
							? `url(/resource/workbook/cover/${imagePath})`:'');
					$overviewSection.find('.book-title')
						.text(title).toggle(imagePath == null || imagePath.length == 0);
					
					$overviewSection.find('.background-image')
									.css('background-image', 'url(https://static.findsvoc.com/images/app/workbook/background/bg-'
												+ (1 + Math.floor(Math.random() * 4)) + '.jpg)');
					$overviewSection.find('.catch-phrase-section .message').html(copy.message);
					$overviewSection.find('.catch-phrase-section .alias').text(copy.alias);
					
					const $passageSection = $overviewSection.find('.list-passage-section');
					$passageSection.empty();
					if($passageSection.data('masonry') != undefined) {
						$passageSection.masonry('destroy');
					}
					const passages = passageDtoList;
					// 지문간 이동 내비게이션 데이터
					const pids = passages.map(dto => {return dto.passageId});
					// 샘플지문 목록을 표시
					$passageSection.get(0).appendChild(createElement(Array.from(passages, passage => {
						return { el: 'a', className: 'passage sample', href: `${location.origin}/workbook/passage/${workBookId56}/${ntoa(passage.passageId)}`,
						textContent: Array.from(passage.sentenceList, sentence => sentence.eng).join(' '), onclick: function(e) {
							e.preventDefault();
							sessionStorage.setItem('workbookCover', imagePath);
							sessionStorage.setItem('passageIdList', JSON.stringify(pids));
							$('#loadingModal').modal('show');
							location.assign(`/workbook/passage/${workBookId56}/${ntoa(passage.passageId)}`);
						}}
					})));
					
					
					if($overviewSection.is('.collapse.show')) {
						$overviewSection[0].scrollIntoView();
						$passageSection.masonry(masonryOptsForPassages);
					}else {
						$overviewSection.collapse('show');
					}
				}
			},
			reachEnd: function(s) {
				if(s.isLast || s.isLoading) return;
				else {
					s.isLoading = true;
					$.getJSON(`/workbook/public/list/${s.pageNum++||2}`, function(bookPage) {
						appendList(bookPage);
						s.update();
						s.slideNext();
						delete s.isLoading;
						if(bookPage.last) s.isLast = true;
					})
					.fail( () => alertModal('워크북목록 가져오기에 실패했습니다.\n다시 접속해 주세요.'));
				}
			}
		}
	});
	swiper.pageNum = 2;
	
	function appendList(list) {
		let DOMList = [];
		for(let i = 0,len = list.content?.length; i < len; i++) {
			const book = list.content[i];
			const $dom = $('#hiddenDivs .book-unit').clone();
			$dom.attr('href', `${location.origin}/workbook/intro/${ntoa(book.workBookId)}`);
			const $cover = $dom.attr('data-work-book-id', book.workBookId).find('.book.cover');
			if(book.imagePath?.length > 0) {
				$cover.find('.default').hide();
				$cover.find('.book-title').hide();
				$cover.find('.book-cover-normal').addClass('swiper-lazy').attr('data-background', `/resource/workbook/cover/${book.imagePath}`);
			}else {
				$cover.find('.swiper-lazy-preloader').remove();
				if(book.title == 'HELLO-BOOK') {
					$cover.find('.book-title').hide();
				}
				$cover.find('.book-cover-normal').hide();
			}
			
			$dom.find('.workbook-type').text(book.workBookType);
			$dom.find('.workbook-type').addClass('type-'+book.workBookType);
			$dom.find('.book-title').text(book.title);
			$dom.find('.book-price').html(book.price > 0 
					? (book.price.toLocaleString() + ' fico') : '멤버십 무료');
			DOMList.push($dom[0]);
		}
		$('.book-section .list-inline').append(DOMList)
	}	
	$('.workbook-overview-section').on('shown.bs.collapse', function() {
		this.scrollIntoView();
		$(this).find('.list-passage-section').masonry(masonryOptsForPassages);
	})
	
	// [튜토리얼 확인하기 버튼 클릭]---------------------------------------------------------------
	$('#js-play-tutorial').click(function(){
		$.ajax({dataType: 'script', cache: true, url:'https://static.findsvoc.com/js/app/tutorials.min.js'});
	});
	// [워크북 구독]---------------------------------------------------------------
	$('#subscribeWorkbook').click(function() {
		if(memberId == 0) {
			if(confirm('fico 멤버십이 필요합니다.\n로그인 화면으로 이동하시겠습니까?')) location.assign('/auth/login');
			return;
		}
		const $btn = $(this);
		const workBookId = $(this).data('workBookId');
		
		// 워크북 구독(ajax)-------------------------------
		subscribeWorkbook(workBookId, subscribeCallback);
		//----------------------------------------------
		
		function subscribeCallback(msg) {
			switch(msg){
			case 'success':
				$btn.addClass('bg-secondary').prop('disabled', true).text('구독중');
				if(confirm('나의 서재에 "구독 워크북"이 추가되었습니다.\n'
					+'나의 서재로 이동하시겠습니까?')) location.assign('/workbook/mylibrary');
				break;
			case 'duplicated':
				alertModal('이미 구독한 워크북입니다.');
				break;
			case 'insufficient':
				alertModal('잔여 fico 코인이 부족합니다.');
				break;
			}		
		}
	});
	// [워크북 개요의 지문 레이아웃 정렬]--------------------------------------------
	$('.workbook-overview-section').on('shown.bs.collapse', function() {
		this.scrollIntoView({block: 'center'});
		$('.workbook-overview-section .list-passage-section').masonry(masonryOptsForPassages);
	}).on('hidden.bs.collapse', function() {
		const $passageSection = $(this).find('.list-passage-section');
		$passageSection.find('.passage').remove();
	})
	
   // 탭 접고 펼치기 
   $('.tab-section').on('click show.bs.tab', '[role=tab]', function() {
      event.cancelBubble = true;
      // 이미 열려진 탭에 대해선 이벤트 'show.bs.tab'이 발동하지 않으므로
      // 이벤트 페이즈는 3으로 넘어간다. 이 경우 탭 숨기기
      if(event.eventPhase == Event.BUBBLING_PHASE) {
         $(this).add(this.dataset.bsTarget).removeClass('active');
         $(this).attr('aria-selected', false);
      }
      $(this).closest('.nav-tabs') // 탭버튼 뭉치의 스타일 변경
            .toggleClass('active', event.eventPhase != Event.BUBBLING_PHASE);
   });
	
}
