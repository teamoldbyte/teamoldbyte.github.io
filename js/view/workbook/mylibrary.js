/** workbook/mylibrary.html
 * @author LGM
 */
async function pageinit(myWorkBookPage) {
	// 슬라이드 이동거리를 일정하게 유지하기 위해 렌더링하지 않고 보관중인 워크북 목록
	const workBooksTobeRendered = { study: [], open: [], working: [], coworking: [] };
	if(myWorkBookPage.empty) {
		$('.book-section[data-list-type="study"]').prepend(createElement({
				el: 'span', className: 'default-message', children: [
					'다른 사람이 만든 워크북을 보고 싶다면?',
					{ el: 'br'},
					'워크북 구독을 하면 여기서 볼 수 있습니다.'
				]
			})).find('.list-inline').css('height', 'auto');
	}else {
		workBooksTobeRendered['study'] = myWorkBookPage.content;
		let isLast = true, pageNum = 1;
		if(myWorkBookPage.numberOfElements > getBookCountPerView() && !myWorkBookPage.last) {
			await $.getJSON('/workbook/library/study/list', {pageNum:2},  function(bookPage) {
				workBooksTobeRendered['study'] = workBooksTobeRendered['study'].concat(bookPage.content);
				isLast = bookPage.last;
				pageNum++;
			})		
		}
		const myFirstSubscriptionList = workBooksTobeRendered['study'].splice(0, getBookCountPerView() * 2);
		appendList(myFirstSubscriptionList, $('.book-section[data-list-type="study"] .list-inline'))
		initializeSwiper($('#studyWorkbookSection .swiper')[0], myFirstSubscriptionList, pageNum, isLast);
	}

	function initializeSwiper(swiperEl, list, pageNum, last) {
		const contentLength = list.length;
		const deviceSizeNumber = (matchMedia('(max-width: 575.8px)').matches) ? 0
			: (matchMedia('(max-width: 675.8px)').matches) ? 1
			: (matchMedia('(max-width: 991.8px)').matches) ? 2
			: 3;
		const freeMode = [contentLength > 9, contentLength > 8, contentLength > 10, contentLength > 14][deviceSizeNumber];
		new Swiper(swiperEl, {
			watchSlidesProgress: true,
			//resistance: false,
			 // if rows > 1, slidesPerView:'auto' not compatible
			slidesPerView: 'auto',
			freeMode,
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
					spaceBetween: 28,
					autoHeight: contentLength <= 4,
					grid: {
						rows: contentLength > 4 ? 2 : 1
					}
				},
				992: {
					slidesPerGroup: 7,
					slidesPerView: contentLength > 7 ? 7 : 'auto',
					spaceBetween: 28,
					autoHeight: contentLength <= 7,
					grid: {
						rows: contentLength > 7 ? 2 : 1
					}
				}
			},
			navigation: {
				prevEl: $(swiperEl).siblings('.swiper-button-section').find('.swiper-button-prev')[0],
				nextEl: $(swiperEl).siblings('.swiper-button-section').find('.swiper-button-next')[0]
			},
			lazy: {
				enabled: true,
				loadPrevNext: true
			},
			on : {
				beforeInit: function(s) {
					s.isLast =  last;
					if(!last) s.pageNum = pageNum + 1;
				},
				afterInit: function(s) {
					if(!freeMode) s.lazy.load();
//					if(page.first) s.lazy.load();
				},
				click: function(s) {
					if(!s.clickedSlide) return;
					const $section = $(s.clickedSlide).closest('.workbook-block');
					const workbookId56 = ntoa(s.clickedSlide.dataset.workBookId);
					
					// 내가 작성한 워크북 여부에 따라 다른 새 페이지를 띄움-----------------------
					location.assign(`/workbook/${$section.is('#studyWorkbookSection')?'study/overview':'mybook/edit'}/${workbookId56}`);
					//----------------------------------------------------------------				
				},
				slideNextTransitionStart: function(s) {
					// 로드 중이거나, 마지막 페이지까지 로드했었거나, 슬라이드를 넘기도 나서도 한 페이지분 이상 슬라이드가 뒤에 남아있으면 취소
					if(s.isLast || s.isLoading || (s.slides.length - s.visibleSlidesIndexes.slice(-1)[0] - 1) >= getBookCountPerView()) return;
					else {
						const type = s.el.dataset.listType;
						s.isLoading = true;
						// 온전히 한 페이지를 넘기기 위해 추가로 필요한 슬라이드 수
						const requiredNum = getBookCountPerView() - (s.slides.length - s.visibleSlidesIndexes.slice(-1)[0] - 1)%getBookCountPerView();
						const cachedList = workBooksTobeRendered[type].splice(0,requiredNum);
						// 서버 로드는 끝났고, 캐쉬된 것이 남았을 때
						if(s.loadOver) {
							s.appendSlide(Array.from(cachedList, book => createBookDOM(book)));
							// 슬라이드 마지막임을 마크
							s.isLast = workBooksTobeRendered[type].length == 0;
							return;
						}
						// 캐쉬된 것으로도 렌더링하기에 모자라면 서버로부터 로드
						if(cachedList.length < requiredNum) {
							// 캐쉬목록을 모자란대로 슬라이드로 우선 추가
							s.appendSlide(Array.from(cachedList, book => createBookDOM(book)));
							$.getJSON(`/workbook/library/${type}/list`, {pageNum:s.pageNum++},  function(bookPage) {
								delete s.isLoading;
								// 첫 로드 결과가 비었으면 목록을 한줄로 변경하고 스와이프 해제
								if(bookPage.first && bookPage.empty) {
									s.el.classList.add('h-auto');
									s.wrapperEl.remove();
									s.destroy();
								}else {
									// 목록이 비었을 때의 메세지 삭제
									$(s.el).find('.default-message').remove();
									// 캐시 목록에 데이터 추가
									workBooksTobeRendered[type] = workBooksTobeRendered[type].concat(bookPage.content);
									// 캐시목록에서 뷰를 채울만큼 슬라이드로 추가 
									s.appendSlide(Array.from(workBooksTobeRendered[type].splice(0,requiredNum - cachedList.length), book => createBookDOM(book)));
									s.update();
									// 첫페이지면 이미지 강제로드
									if(bookPage.first) {
										s.lazy.load();
									}
									// 서버 로드는 끝났음을 마크
									if(bookPage.last) s.loadOver = true;
								}
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
	$('.swiper').each(function() {
		const swiperEl = this;
		const listType = this.dataset.listType;
		switch(listType) {
			case 'study': {
				//if(myWorkBookPage.numberOfElements > (devSize.isDesktop() ? 7 : devSize.isPhone() ? 3 : 5)) {

				//}else {
					//$(swiperEl).find('.swiper-button-prev,.swiper-button-next').remove();
				//}
				break;
			}
			default: {
				$.getJSON(`/workbook/library/${listType}/list`, {pageNum: 1},  function(bookPage) {
					if(!bookPage.empty) {
						$(swiperEl).find('.default-message').remove();
						workBooksTobeRendered[listType] = bookPage.content;
						let isLast = bookPage.last, pageNum = 1;
						if(!isLast && bookPage.numberOfElements < getBookCountPerView() * 2) {
							$.getJSON(`/workbook/library/${listType}/list`, {pageNum: 2},  function(bookPage2) {
								isLast = bookPage2.last;
								pageNum = 2;
								workBooksTobeRendered[listType] = workBooksTobeRendered[listType].concat(bookPage2.content);
								const renderList = workBooksTobeRendered[listType].splice(0, getBookCountPerView() * 2);
								appendList(renderList, $(swiperEl).find('.swiper-wrapper'));
								initializeSwiper(swiperEl, renderList, pageNum, isLast);
							});
						}else {
							const renderList = workBooksTobeRendered[listType].splice(0, getBookCountPerView() * 2);
							appendList(renderList, $(swiperEl).find('.swiper-wrapper'));
							initializeSwiper(swiperEl, renderList, pageNum, isLast);
						}
					}else {
						$(swiperEl).on('click', '.book-unit', function() {
							const $section = $(this).closest('.workbook-block');
							const workbookId56 = ntoa(this.dataset.workBookId);
							
							// 내가 작성한 워크북 여부에 따라 다른 새 페이지를 띄움-----------------------
							location.assign(`/workbook/${$section.is('#studyWorkbookSection')?'study/overview':'mybook/edit'}/${workbookId56}`);
							//----------------------------------------------------------------		
						})
						$(swiperEl).siblings('.swiper-button-section').find('.swiper-button-prev,.swiper-button-next').remove();
					}
				})
				.fail( () => alert('워크북목록 가져오기에 실패했습니다.\n다시 접속해 주세요.'));
			}
		}
		
		
	})
	// [나의 판매중/작성중 워크북 조회 화살표 모양 토글]-----------------------------------
	$(document).on('show.bs.collapse hide.bs.collapse', '.bookshelf-section', function(e) {
		const $section = $(this).closest('.workbook-block');
		const $foldIcon = $section.find('.title-section .fold-icon');
		$foldIcon.toggleClass('expanded', e.type == 'show');
	})
	
	$('.bookshelf-section:not(.show)').collapse('show');
	
	// 추가 로드된 워크북 표시. 마지막일 경우 lastloaded 클래스 추가.
	function appendList(list, $container) {
		let DOMList = [];
		for(let i = 0,len = list.length; i < len; i++) {
			const book = list[i];
			DOMList.push(createBookDOM(book));
		}
		$container.append(DOMList);
	}
	function createBookDOM(book) {
		const $dom = $('#hiddenDivs .book-unit').clone();
		const $cover = $dom.attr('data-work-book-id', book.workBookId)
							.find('.book-cover');
					
		$dom.find('.book-title').text(book.title);
		$cover.find('img').attr('alt', book.title);
		
		if(book.title == 'HELLO-BOOK') {
			$cover.addClass('hello-book').find('.swiper-lazy-preloader').remove();
			$dom.find('.book-title').hide();
		}else if(book.imagePath == null || book.imagePath.length == 0) {
			$cover.addClass('default').find('.swiper-lazy-preloader').remove();
		}else {
			$cover.find('img').addClass('swiper-lazy').attr('data-background', `/resource/workbook/cover/${book.imagePath}`);
			$dom.find('.book-title').hide();
		}
			
		$dom.find('.book-price').html(book.price > 0 
				? (book.price.toLocaleString() + ' fico') : '멤버십 무료');
		
		if(book.numOfSubscribers != undefined) {
			$dom.append('<span class="subs-num">' + book.numOfSubscribers + '</span>');
		}
		
		return $dom[0];
	}
	
	function getBookCountPerView() {
		return matchMedia('(min-width: 992px)').matches ? 14
			: matchMedia('(min-width: 768px)').matches ? 8
			: matchMedia('(min-width: 676px)').matches ? 10
			: matchMedia('(min-width: 576px)').matches ? 8
			: 9
	}
}
