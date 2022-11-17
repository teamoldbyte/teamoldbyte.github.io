/** workbook/mylibrary.html
 * @author LGM
 */
function pageinit() {
	new Swiper('.swiper', {
		slidesPerView: 'auto',
		watchSlidesProgress: true,
		simulateTouch: true,
		resistance: false,
		slidesPerGroupAuto: true,
		preloadImages: false,
		grid: {
			rows: 2
		},
		navigation: {
			prevEl: '.swiper-button-prev',
			nextEl: '.swiper-button-next'
		},
		lazy: {
			enabled: true,
			loadPrevNext: true
		},
		on : {
			afterInit: function(s) {
				s.pageNum = (s.slides.length > 0) ? 2 : 1;
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
					$.getJSON(`/workbook/library/${type}/list`, {pageNum:s.pageNum++||1},  function(bookPage) {
						delete s.isLoading;
						if(bookPage.first && bookPage.empty) {
							s.el.classList.add('h-auto');
							s.wrapperEl.remove();
							s.destroy();
						}else {
							$(s.el).find('.default-message').remove();
							appendList(bookPage, $(s.wrapperEl));
							s.update();
							if(bookPage.first) {
								s.lazy.load();
							}else {
								s.slideNext();
							}
							if(bookPage.last) s.isLast = true;
						}
					})
					.fail( () => alert('워크북목록 가져오기에 실패했습니다.\n다시 접속해 주세요.'));
				}
			}
		}
	});
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
			
			if(book.numOfSubscribers != undefined 
			&& $container.closest('#openWorkbookSection').length > 0) {
				$dom.append('<span class="subs-num">' + book.numOfSubscribers + '</span>');
			}
			DOMList.push($dom[0]);
		}
		$container.append(DOMList);
	}	
}
