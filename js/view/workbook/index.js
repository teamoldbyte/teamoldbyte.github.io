/** workbook/index.html
 * @author LGM
 */
function pageinit(publicOpenWorkBooks, protectedOpenWorkBooks, classNoteBooks, memberId, isClassMember){
	$(window).on('unload', () => $('#loadingModal').modal('hide'));
	const masonryOptsForPassages = { itemSelector: '.passage', columnWidth: '.passage',
			gutter: 10, percentPosition: true, horizontalOrder: true, transitionDuration: '0.8s'
		};
	
	// [워크북 목록 가로 넘기기]-----------------------------------------------------
	// 슬라이드 이동거리를 일정하게 유지하기 위해 렌더링하지 않고 보관중인 워크북 목록
	const workBooksTobeRendered = { public: [], protected: [], classnote: [] };
	Object.keys(workBooksTobeRendered).forEach(async key => {
		const workbooks = {public: publicOpenWorkBooks, protected: protectedOpenWorkBooks, classnote: classNoteBooks}[key];
		const $workbookSection = $(`.${key}-workbook-section`);
		if(!!workbooks && $workbookSection.length > 0) {
			let pageNum = 1;
			workBooksTobeRendered[key] = workbooks.content;
			if(workbooks.numberOfElements > getBookCountPerView() && !workbooks.last) {
				await $.getJSON(`/workbook/${key.replace('note','')}/list/${++pageNum}`, function(bookPage) {
					workBooksTobeRendered[key] = workBooksTobeRendered[key].concat(bookPage?.content)
					appendList(workBooksTobeRendered[key].splice(0, getBookCountPerView() * 2), $workbookSection.find('.swiper-wrapper'));
				})
			}else appendList(workBooksTobeRendered[key].splice(0, getBookCountPerView() * 2), $workbookSection.find('.swiper-wrapper'));
		const contentLength = $workbookSection.find('.book').length
		const deviceSizeNumber = (matchMedia('(max-width: 575.8px)').matches) ? 0
			: (matchMedia('(max-width: 675.8px)').matches) ? 1
			: (matchMedia('(max-width: 991.8px)').matches) ? 2
			: 3;
		const freeMode = [contentLength > 9, contentLength > 8, contentLength > 10, contentLength > 14][deviceSizeNumber];
		new Swiper($workbookSection.find('.swiper')[0], {
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
				prevEl: $workbookSection.find('.swiper-button-prev')[0],
				nextEl: $workbookSection.find('.swiper-button-next')[0]
			},
			lazy: true,
			on: {
				beforeInit: function(s) {
					s.isLast = workbooks.last; // 워크북 인덱스는 페이징 사이즈 = 24
					if(!workbooks.last) s.pageNum = pageNum + 1;
				},
				afterInit: function(s) {
					s.lazy.load();
				},
				click: function(s,e) {
					
					if(!s.clickedSlide) return;
					const $overviewSection = $(s.el).closest('.workbook-section').siblings('.workbook-overview-section');
					const bookDiv = s.clickedSlide||e.path.find(d=>d.matches('.book-unit'));
					const classType = $overviewSection.closest('.protected-workbook-section').length > 0;
					
					// 클래스회원 및 P골드회원을 제외하고는 클래스워크북 안내만 보여주기
					if(classType && !isClassMember) {
						alertModal('클래스 멤버십 전용 워크북입니다.\n멤버십 소개 화면에서 다른 멤버십과 비교해 보세요.', () => location.assign('/membership'))
						return;
					}
					
					$('.book-section .book-unit').not(bookDiv).removeClass('active');
					$(bookDiv).toggleClass('active');
					// 워크북 소개글은 기본적으로 '접힘' 상태로. (길지 않은 소개글에선 펼치기 버튼 안나타남.)
					$overviewSection.find('.description-section').addClass('shrink').css('max-height', '13.5rem');
					if($(bookDiv).is('.active')) {
						if(!$(bookDiv).data('overview')) {
							// 개요 정보 가져오기(ajax)------------------------------
							$.getJSON(`/workbook/overview/${ntoa(bookDiv.dataset.workBookId)}`, { classType }, (overview) => {
								$(bookDiv).data('overview', overview);
								showOverview($overviewSection, overview);
							})
							.fail( () => alertModal('워크북정보 가져오기에 실패했습니다.\n다시 접속해 주세요.'));
							// --------------------------------------------------
						}else {
							showOverview($overviewSection, $(bookDiv).data('overview'));
						}
					}else {
						$overviewSection.collapse('hide');
					}
					

				},
				slideNextTransitionStart: function(s) {
					// 로드 중이거나, 마지막 페이지까지 로드했었거나, 슬라이드를 넘기도 나서도 한 페이지분 이상 슬라이드가 뒤에 남아있으면 취소
					if(s.isLast || s.isLoading || (s.slides.length - s.visibleSlidesIndexes.slice(-1)[0] - 1) >= getBookCountPerView()) return;
					else {
						let workbookType = key == 'classnote'?'class':key;
						s.isLoading = true;
						// 온전히 한 페이지를 넘기기 위해 추가로 필요한 슬라이드 수
						const requiredNum = getBookCountPerView() - (s.slides.length - s.visibleSlidesIndexes.slice(-1)[0] - 1)%getBookCountPerView();
						const cachedList = workBooksTobeRendered[key].splice(0,requiredNum);
						// 서버 로드는 끝났고, 캐쉬된 것이 남았을 때
						if(s.loadOver) {
							s.appendSlide(Array.from(cachedList, book => createBookDOM(book)));
							// 슬라이드 마지막임을 마크
							s.isLast = workBooksTobeRendered[key].length == 0;
							return;
						}
						// 캐쉬된 것으로도 렌더링하기에 모자라면 서버로부터 로드
						if(cachedList.length < requiredNum) {
							// 캐쉬목록을 모자란대로 슬라이드로 우선 추가
							s.appendSlide(Array.from(cachedList, book => createBookDOM(book)));
							$.getJSON(`/workbook/${workbookType}/list/${s.pageNum++}`,  function(bookPage) {
								delete s.isLoading;
								// 목록이 비었을 때의 메세지 삭제
								$(s.el).find('.default-message').remove();
								// 캐시 목록에 데이터 추가
								workBooksTobeRendered[key] = workBooksTobeRendered[key].concat(bookPage.content);
								// 캐시목록에서 뷰를 채울만큼 슬라이드로 추가 
								s.appendSlide(Array.from(workBooksTobeRendered[key].splice(0,requiredNum - cachedList.length), book => createBookDOM(book)));
								s.update();
								// 첫페이지면 이미지 강제로드
								if(bookPage.first) {
									s.lazy.load();
								}
								// 서버 로드는 끝났음을 마크
								if(bookPage.last) s.loadOver = true;
							})
							.fail( () => alert('워크북목록 가져오기에 실패했습니다.\n다시 접속해 주세요.'));
						}else {
							// 캐쉬된 것으로 뷰를 채우기 충분하면 뷰크기만큼 잘라서 슬라이드로 추가
							delete s.isLoading;
							s.appendSlide(Array.from(cachedList, book => createBookDOM(book)));
							s.update();
						}
					}
				}
			}
		});			
		}
	});
	
	function appendList(list, $container) {
		let DOMList = [];
		for(let i = 0,len = list?.length; i < len; i++) {
			const book = list[i];
			DOMList.push(createBookDOM(book));
		}
		$container.append(DOMList)
	}	
	function createBookDOM(book) {
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
		return $dom[0];
	}
	// 워크북 개요 정보 표시
	function showOverview($overviewSection, { workbookId, title, description, price, sub, copy, imagePath, alias, aliasImage, passageDtoList, regDate, ssamClassDto}) {
		const classType = $overviewSection.closest('.classnote-workbook-section').length > 0;
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
		$overviewSection.find('.sub-btn').data('workBookId', workbookId)
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
			return { el: 'a', className: 'passage sample', href: `${location.origin}/workbook/passage/${ntoa(workbookId)}/${ntoa(passage.passageId)}`,
			textContent: Array.from(passage.sentenceList, sentence => sentence.eng).join(' '), onclick: function(e) {
				e.preventDefault();
				sessionStorage.setItem('workbookCover', imagePath);
				sessionStorage.setItem('passageIdList', JSON.stringify(pids));
				$('#loadingModal').modal('show');
				location.assign(`/workbook/passage/${ntoa(workbookId)}/${ntoa(passage.passageId)}`);
			}}
		})));
		
		
		if($overviewSection.is('.collapse.show')) {
			$overviewSection[0].scrollIntoView();
			$passageSection.masonry(masonryOptsForPassages);
		}else {
			$overviewSection.collapse('show');
		}
	}	
	$('.workbook-overview-section').on('shown.bs.collapse', function() {
		this.scrollIntoView();
		$(this).find('.list-passage-section').masonry(masonryOptsForPassages);
	})
	
	// 워크북 소개글이 길 경우 접고 펼치기 버튼 제공
	$(document).on('click', '.text-roll-end .fold-icon', function() {
		const $desc = $(this).closest('.description-section');
		const toExpand = $desc.is('.shrink');
		const newMaxHeight = toExpand ? '100em' : '13.5em';
		if(toExpand) {
			$desc.removeClass('shrink');
		}
		anime({
			targets: $desc[0],
			duration: 500,
			delay: 0,
			maxHeight: newMaxHeight,
			easing: 'linear',
			complete: () => {
				$(this).toggleClass('expanded');
				if(!toExpand) {
					$desc.addClass('shrink');
				}
			}
		});
	})
	
	// [튜토리얼 확인하기 버튼 클릭]---------------------------------------------------------------
	$('#js-play-tutorial').click(function(){
		$.ajax({dataType: 'script', cache: true, url:'https://static.findsvoc.com/js/app/tutorials.min.js'});
	});
	// [워크북 구독]---------------------------------------------------------------
	$('.sub-btn').click(function() {
		if(memberId == 0) {
			confirmModal('<span class="app-name-text">fico</span> 멤버십이 필요합니다.\n로그인 화면으로 이동하시겠습니까?', () => location.assign('/auth/login'));
			return;
		}
		const _this = this;
		const workBookId = $(this).data('workBookId');
		
		// 워크북 구독(ajax)-------------------------------
		_this.disabled = true;
		$.post('/workbook/subscription/' + workBookId, subscribeCallback)
		.fail((xhr) => {
			if(xhr.status == 403) {
				location.assign('/membership/expired');
				return;
			}
			alertModal('워크북 구독에 실패했습니다. 화면 새로고침 후 다시 시도해 주세요.')});
		//----------------------------------------------
		
		function subscribeCallback(msg) {
			switch(msg){
			case 'success':
				$(_this).addClass('bg-secondary').prop('disabled', true).text('구독중');
				confirmModal('나의 서재에 "구독 워크북"이 추가되었습니다.\n'
					+'나의 서재로 이동하시겠습니까?', () => location.assign('/workbook/mylibrary'));
				break;
			case 'duplicated':
				$(_this).addClass('bg-secondary').text('구독중').prop('disabled', true);
				alertModal('이미 구독한 워크북입니다.');
				break;
			case 'insufficient':
				$(_this).removeClass('bg-secondary').text('구독').prop('disabled', false);
				alertModal('잔여 gold egg가 부족합니다.');
				break;
			case 'unauthorized':
				$(_this).addClass('bg-secondary').text('구독').prop('disabled', true);
				alertModal('골드 멤버십 워크북입니다.\n자신의 학습자료를 워크북으로 만들어 보세요.');
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
	
	function getBookCountPerView() {
		return matchMedia('(min-width: 992px)').matches ? 14
			: matchMedia('(min-width: 768px)').matches ? 8
			: matchMedia('(min-width: 676px)').matches ? 10
			: matchMedia('(min-width: 576px)').matches ? 8
			: 9
	}	
}
