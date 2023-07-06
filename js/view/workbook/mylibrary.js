/** workbook/mylibrary.html
 * @author LGM
 */
function pageinit(myWorkBookList) {
	
	if(myWorkBookList.empty) {
		$('.book-section[data-list-type="study"]').css('height', 'auto')
			.removeClass('swiper').get(0).replaceChildren(createElement({
				el: 'span', className: 'default-message', children: [
					'다른 사람이 만든 워크북을 보고 싶다면?',
					{ el: 'br'},
					'워크북 구독을 하면 여기서 볼 수 있습니다.'
				]
			}));
	}else {
		appendList(myWorkBookList, $('.book-section[data-list-type="study"] .list-inline'));
	}

	function initializeSwiper(swiperEl, page) {
		const contentLength = page.numberOfElements;
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
				prevEl: $(swiperEl).siblings('.swiper-button-section').find('.swiper-button-prev')[0],
				nextEl: $(swiperEl).siblings('.swiper-button-section').find('.swiper-button-next')[0]
			},
			lazy: {
				enabled: true,
				loadPrevNext: true
			},
			on : {
				beforeInit: function(s) {
					s.isLast =  page.last;
					if(!page.last) s.pageNum = 2;
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
				reachEnd: function(s) {
					if(s.isLast || s.isLoading) return;
					else {
						const type = s.el.dataset.listType;				
						s.isLoading = true;
						$.getJSON(`/workbook/library/${type}/list`, {pageNum:s.pageNum++},  function(bookPage) {
							delete s.isLoading;
							if(bookPage.first && bookPage.empty) {
								s.el.classList.add('h-auto');
								s.wrapperEl.remove();
								s.destroy();
							}else {
								$(s.el).find('.default-message').remove();
								//appendList(bookPage, $(s.wrapperEl));
								s.appendSlide(Array.from(bookPage.content, book => createBookDOM(book)));
								s.update();
								if(bookPage.first) {
									s.lazy.load();
								}/*else {
									s.slideNext();
								}*/
								if(bookPage.last) s.isLast = true;
							}
						})
						.fail( () => alert('워크북목록 가져오기에 실패했습니다.\n다시 접속해 주세요.'));
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
				//if(myWorkBookList.numberOfElements > (devSize.isDesktop() ? 7 : devSize.isPhone() ? 3 : 5)) {
					initializeSwiper(swiperEl, myWorkBookList);
				//}else {
					//$(swiperEl).find('.swiper-button-prev,.swiper-button-next').remove();
				//}
				break;
			}
			default: {
				$.getJSON(`/workbook/library/${listType}/list`, {pageNum: 1},  function(bookPage) {
					if(!bookPage.empty) {
						$(swiperEl).find('.default-message').remove();
						appendList(bookPage, $(swiperEl).find('.swiper-wrapper'));
						/*if(bookPage?.numberOfElements > (devSize.isDesktop() ? 7 : devSize.isPhone() ? 3 : 5)) {*/
							initializeSwiper(swiperEl, bookPage)
						/*}else {
							$(swiperEl).on('click', '.book-unit', function() {
								const $section = $(this).closest('.workbook-block');
								const workbookId56 = ntoa(this.dataset.workBookId);
								
								// 내가 작성한 워크북 여부에 따라 다른 새 페이지를 띄움-----------------------
								location.assign(`/workbook/${$section.is('#studyWorkbookSection')?'study/overview':'mybook/edit'}/${workbookId56}`);
								//----------------------------------------------------------------		
							})
							$(swiperEl).find('.swiper-lazy-preloader').remove();
							$(swiperEl).find('.swiper-lazy').each(function() {
								this.classList.remove('swiper-lazy');
								this.style.backgroundImage = `url(${this.dataset.background})`;
							})
							$(swiperEl).siblings('.swiper-button-section').find('.swiper-button-prev,.swiper-button-next').remove();
						}*/
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
		for(let i = 0,len = list.content?.length; i < len; i++) {
			const book = list.content[i];
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
}
