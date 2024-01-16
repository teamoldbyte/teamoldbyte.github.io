/** workbook/overview_workbook.html
 * @author LGM
 */
function pageinit(workbookId, workbookCover, passageIdList, publicOpenWorkBooks, protectedOpenWorkBooks) {
	const isMobile = window.visualViewport.width < 768;
	$(window).on('unload', () => $('#loadingModal').modal('hide'));

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
	
	appendList(publicOpenWorkBooks, $('.public-workbook-section .list-inline').get(0));
	if($('.protected-workbook-section').length > 0)
	appendList(protectedOpenWorkBooks, $('.protected-workbook-section .list-inline').get(0));
	
	new Swiper('.swiper', {
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
					if(!s.pageNum) s.pageNum = 2;
					const workbookType = $(s.el).closest('.public-workbook-section').length > 0 ? 'public' : 'protected';
					$.getJSON(`/workbook/${workbookType}/list/${s.pageNum++}`, function(bookPage) {
						appendList(bookPage, s.wrapperEl);
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
	function appendList(list, container) {
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
			container.appendChild($dom[0])
		}
	}		
}
