/** workbook/index.html
 * @author LGM
 */
function pageinit(publicOpenWorkBooks, protectedOpenWorkBooks, classNoteBooks, memberId){
	$(window).on('unload', () => $('#loadingModal').modal('hide'));
	const masonryOptsForPassages = { itemSelector: '.passage', columnWidth: '.passage',
			gutter: 10, percentPosition: true, horizontalOrder: true, transitionDuration: '0.8s'
		};
	
	// [워크북 목록 가로 넘기기]-----------------------------------------------------
	
	if(!!publicOpenWorkBooks && $('.public-workbook-section').length > 0)
		appendList(publicOpenWorkBooks, $('.public-workbook-section .list-inline').get(0));
	if(!!protectedOpenWorkBooks && $('.protected-workbook-section').length > 0)
		appendList(protectedOpenWorkBooks, $('.protected-workbook-section .list-inline').get(0));
	if(!!classNoteBooks && $('.classnote-workbook-section').length > 0)
		appendList(classNoteBooks, $('.classnote-workbook-section .list-inline').get(0));
	
	$('.public-workbook-section,.protected-workbook-section,.classnote-workbook-section').each(function() {
		const contentLength = $(this).find('.book').length
		const deviceSizeNumber = (matchMedia('(max-width: 575.8px)').matches) ? 0
			: (matchMedia('(max-width: 675.8px)').matches) ? 1
			: (matchMedia('(max-width: 991.8px)').matches) ? 2
			: 3;
		const freeMode = [contentLength > 9, contentLength > 8, contentLength > 10, contentLength > 14][deviceSizeNumber];
		new Swiper($(this).find('.swiper')[0], {
			watchSlidesProgress: true,
			resistance: false,
			freeMode,
			slidesPerView: 'auto',
			grid: {
				fill: 'row'
			},
			breakpoints: {
				320: {
					slidesPerGroup: 3,
					autoHeight: contentLength <= 3,
					grid: {
						rows: contentLength > 6 ? 3 : contentLength > 3 ? 2 : 1
					}
				},
				576: {
					slidesPerGroup: 4,
					autoHeight: contentLength <= 4,
					grid: {
						rows: contentLength > 4 ? 2 : 1
					}
				},
				676: {
					slidesPerGroup: 5,
					autoHeight: contentLength <= 5,
					grid: {
						rows: contentLength > 5 ? 2 : 1
					}
				},
				768: {
					slidesPerGroup: 4,
					spaceBetween: 30,
					autoHeight: contentLength <= 4,
					grid: {
						rows: contentLength > 4 ? 2 : 1
					}
				},
				992: {
					slidesPerGroup: 7,
					slidesPerView: contentLength > 7 ? 7 : 'auto',
					spaceBetween: 30,
					autoHeight: contentLength <= 7,
					grid: {
						rows: contentLength > 7 ? 2 : 1
					}
				}
			},
			navigation: {
				prevEl: $(this).find('.swiper-button-prev')[0],
				nextEl: $(this).find('.swiper-button-next')[0]
			},
			lazy: true,
			on: {
				beforeInit: function(s) {
					s.isLast = contentLength < 24; // 워크북 인덱스는 페이징 사이즈 = 24
				},
				afterInit: function(s) {
					s.lazy.load();
				},
				click: function(s,e) {
					if(!s.clickedSlide) return;
					const $overviewSection = $(s.el).closest('.workbook-section').siblings('.workbook-overview-section');
					const bookDiv = s.clickedSlide||e.path.find(d=>d.matches('.book-unit'));
					const workBookId = bookDiv.dataset.workBookId,
							workBookId56 = ntoa(workBookId);
					const classType = $overviewSection.closest('.protected-workbook-section').length > 0;
					$('.book-section .book-unit').not(bookDiv).removeClass('active');
					$(bookDiv).toggleClass('active');
					if($(bookDiv).is('.active')) {
						if(!$(bookDiv).data('overview')) {
							// 개요 정보 가져오기(ajax)------------------------------
							$.getJSON(`/workbook/overview/${ntoa(bookDiv.dataset.workBookId)}`, { classType }, (overview) => {
								$(bookDiv).data('overview', overview);
								showOverview(overview);
							})
							.fail( () => alertModal('워크북정보 가져오기에 실패했습니다.\n다시 접속해 주세요.'));
							// --------------------------------------------------
						}else {
							showOverview($(bookDiv).data('overview'));
						}
					}else {
						$overviewSection.collapse('hide');
					}
					
					// 개요 정보 표시
					function showOverview({ title, description, price, sub, copy, imagePath, alias, aliasImage, passageDtoList, regDate, ssamClassDto}) {
						
						// 작성자 및 퍼스나콘
						$overviewSection.find('.writer-cover .alias').text(alias);
						$overviewSection.find('.writer-cover .personacon img')
										.css('background-image', aliasImage?.length > 0 
										? (`url(/resource/profile/images/${aliasImage})`)
										: 'var(--fc-logo-head)');
						
						// 워크북 타이틀
						$overviewSection.find('.title').text(title);
						
						// 쌤 클래스 타이틀
						if(classType && ssamClassDto) {
							$overviewSection.find('.class-name').text(ssamClassDto.className||'이름없음');
						}
						
						// 워크북 소개
						$overviewSection.find('.description').html(description);
			
						// 구독 가격
						$overviewSection.find('.price').text(price > 0
											? (price.toLocaleString() + ' gold eggs')
											: '무료');
						
						// 구독버튼 토글
						$overviewSection.find('.sub-btn').data('workBookId', workBookId)
										.toggleClass('bg-secondary', sub)
										.prop('disabled', sub)
										.text(sub ? '구독중' : '구독');
						
						//$overviewSection.find('.subs-num').text(overview.numOfSubscriber);
						
						// 등록일
						$overviewSection.find('.reg-date').text(new Date(regDate).toLocaleDateString());
			
						// 워크북 커버
						$overviewSection.find('.book-cover').toggleClass('default', imagePath == null || imagePath.length == 0)
										.find('img').attr('alt', title);
						$overviewSection.find('.book-cover img')
							.css('background-image', (imagePath?.length > 0) 
								? `url(/resource/workbook/cover/${imagePath})`:'');
						// 커버 띠지
						$overviewSection.find('.book-title')
							.text(title).toggle(imagePath == null || imagePath.length == 0);
						
						// 캐치프레이즈 설정
						$overviewSection.find('.background-image')
										.css('background-image', 'url(https://static.findsvoc.com/images/app/workbook/background/bg-'
													+ (1 + Math.floor(Math.random() * 4)) + '.jpg)');
						$overviewSection.find('.catch-phrase-section .message').html(copy.message);
						$overviewSection.find('.catch-phrase-section .alias').text(copy.alias);
						
						// 쌤 클래스 엠블럼
						if(classType && ssamClassDto) {
							if(ssamClassDto.emblemImagePath)
								$overviewSection.find('.emblem-image-section')
								.css('background-image', `url(/resource/ssam/class/${ssamClassDto.emblemImagePath})`);
							if(ssamClassDto.classUri)
								$overviewSection.find('.emblem-image-section').on('click', () => {
									location.assign(`${location.origin}/ssamclass/${ssamClassDto.classUri}`)
								});
						}
						
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
						if(!s.pageNum) s.pageNum = 2;
						let workbookType = 'public';
						if($(s.el).closest('.protected-workbook-section').length > 0)
							workbookType = 'protected';
						else if($(s.el).closest('.classnote-workbook-section').length > 0)
							workbookType = 'class';
						$.getJSON(`/workbook/${workbookType}/list/${s.pageNum++}`, function(bookPage) {
							appendList(bookPage, s.wrapperEl);
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
	})
	
	function appendList(list, container) {
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
			$dom.find('.workbook-type').addClass(`type-${book.workBookType}`);
			$dom.find('.book-title').text(book.title);
			$dom.find('.book-price').html(book.price > 0 
					? (book.price.toLocaleString() + ' gold eggs') : '멤버십 무료');
			DOMList.push($dom[0]);
			container.appendChild($dom[0])
		}
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
	$('.sub-btn').click(function() {
		if(memberId == 0) {
			confirmModal('fico 멤버십이 필요합니다.\n로그인 화면으로 이동하시겠습니까?', () => location.assign('/auth/login'));
			return;
		}
		const _this = this;
		const workBookId = $(this).data('workBookId');
		
		// 워크북 구독(ajax)-------------------------------
		_this.disabled = true;
		$.post('/workbook/subscription/' + workBookId, subscribeCallback)
		.fail(() => alertModal('워크북 구독에 실패했습니다. 화면 새로고침 후 다시 시도해 주세요.'));
		//----------------------------------------------
		
		function subscribeCallback(msg) {
			switch(msg){
			case 'success':
				$(_this).addClass('bg-secondary').prop('disabled', true).text('구독중');
				confirmModal('나의 서재에 "구독 워크북"이 추가되었습니다.\n'
					+'나의 서재로 이동하시겠습니까?', () => location.assign('/workbook/mylibrary'));
				break;
			case 'duplicated':
				$(_this).addClass('bg-secondary').prop('disabled', true).text('구독중');
				alertModal('이미 구독한 워크북입니다.');
				break;
			case 'insufficient':
				$(_this).removeClass('bg-secondary').text('구독').prop('disabled', false);
				alertModal('잔여 gold egg가 부족합니다.');
				break;
			}		
		}
	});
	// [워크북 개요의 지문 레이아웃 정렬]--------------------------------------------
	$('.workbook-overview-section').on('shown.bs.collapse', function() {
		this.scrollIntoView({block: 'center'});
		$(this).find('.list-passage-section').masonry(masonryOptsForPassages);
	}).on('hidden.bs.collapse', function() {
		const $passageSection = $(this).find('.list-passage-section');
		$passageSection.find('.passage').remove();
	})
	
   // 하단 도움말 탭 접고 펼치기 
   let currentHelpTab;
   $('.tab-section').on('show.bs.tab click', '[role=tab].active', function(e) {
		if(e.currentTarget != currentHelpTab) {
			currentHelpTab = e.currentTarget;
		}else {
			$(e.currentTarget).add(e.currentTarget.dataset.bsTarget).removeClass('active show');
			currentHelpTab = null;
		}
	});
	
}
