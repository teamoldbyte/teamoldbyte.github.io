/** workbook/overview_workbook.html
 * @author LGM
 */
function pageinit(workbookId, workbookCover, passageIdList, page) {
	const isMobile = window.visualViewport.width < 768;
	// [지문 레이아웃 정렬]--------------------------------------------
	$('.list-passage-section').masonry({
		// options
		itemSelector: '.passage',
		columnWidth: '.passage',
		gutter: 10,
		percentPosition: true,
		horizontalOrder: true,
		// slow transitions
		transitionDuration: '0.8s'
	});

	// [지문 상세보기로 이동]--------------------------------------------------------
	$('.js-view-passage').each(function() {
		this.href = `${location.origin}/workbook/passage/${ntoa(workbookId)}/${ntoa(this.dataset.pid)}`;
	}).on('click', function(e) {
		e.preventDefault();
		sessionStorage.setItem('workbookCover', workbookCover);
		sessionStorage.setItem('passageIdList', JSON.stringify(passageIdList));
		location.assign(this.href);	
	});	
	
	// [워크북 목록 가로 넘기기]-----------------------------------------------------
	// 화면 가로길이에 따른 lazyLoad 갯수 조정(일부 잘린 항목도 보이도록)	
	let rowNum = isMobile ? 3 : 2;
	
	appendList(page)	
	
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
			reachEnd: function(s) {
				if(s.isLast || s.isLoading) return;
				else {
					s.isLoading = true;
					$.getJSON(`/workbook/recent/list/${s.pageNum++||2}`, function(bookPage) {
						appendList(bookPage);
						s.update();
						s.slideNext();
						delete s.isLoading;
						if(bookPage.last) s.isLast = true;
					})
					.fail( () => alert('워크북목록 가져오기에 실패했습니다.\n다시 접속해 주세요.'));
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
			$dom.attr('href', `${location.origin}/workbook/intro/${ntoa(book.workBookId)}`)
				.attr('title', book.title)
			const $cover = $dom.find('.book.cover');
			if(book.imagePath?.length > 0) {
				$cover.find('.default').hide();
				$cover.find('.book-title').hide();
				$cover.find('.book-cover-normal').addClass('swiper-lazy')
						.attr('data-background', `/resource/workbook/cover/${book.imagePath}`);
			}else {
				$cover.find('.swiper-lazy-preloader').remove();
				if(book.title == 'HELLO-BOOK') {
					$cover.find('.book-title').hide();
				}
				$cover.find('.book-cover-normal').hide();
			}
			$dom.find('.book-title').text(book.title);
			DOMList.push($dom[0]);
		}
		$('.book-section .list-inline').append(DOMList)
	}		
}
