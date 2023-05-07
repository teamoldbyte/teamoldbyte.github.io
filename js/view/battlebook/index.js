/** battlebook/index.html
 * 
 */
function pageinit(memberId) {
	
/*	new Swiper('.swiper',{
		slidesPerView: 5,
		grid: {
			rows: 2,
			fill: 'row'
		},
		pagination: {
			el: '.swiper-pagination'
		},
		breakpoints: {
			992: {
			}
		}
	})*/
	
	$('.js-view-battlebook').each(function() {
		this.href = `/battlebook/overview/${ntoa(this.dataset.id)}`;
		delete this.dataset.id;
	})
	$('.js-edit-battlebook').each(function() {
		this.href = `/battlebook/mybook/edit/${ntoa(this.dataset.id)}`;
		delete this.dataset.id;
	})
	
	// 내 소유의 북 커버에 마우스를 올리면 상세보기or편집하기 메뉴 표시
	$(document).on('mouseover', '.book-unit:not(.blank)', function() {
		$(this).find('.hover-menu').fadeIn(300);
	}).on('mouseleave', '.book-unit:not(.blank)', function() {
		$(this).find('.hover-menu').fadeOut(300);
	})
	
	// 자신의 배틀북 목록 조회
	let visibleListSection = $('.book-list-section[data-type="myall"]').get(0);
	$('.js-list-book-btn').on('click', function() {
		const {type} = this.dataset;
		
		const listSection = $(`.book-list-section[data-type="${type}"]`).get(0);
		const paginationEl = listSection.querySelector('.pagination-section');
		if(visibleListSection == listSection) {
			return;
		}
		$.ajax({
			url: `/battlebook/${type}/list`,
			success: bookList => {
				listSection.querySelectorAll('.book-unit:not(.blank)').forEach(unit => unit.remove());
				listSection.insertBefore(createBookDOMList(bookList, type.startsWith('my')), paginationEl);
				paginationEl.querySelector('.swiper-pagination').replaceChildren(createElement(getPaginations(bookList)));
				
				$(visibleListSection).add(listSection).fadeToggle();
				visibleListSection = listSection;
			},
			error: () => {
				alertModal('배틀북 목록을 조회하지 못 했습니다.\n 화면을 새로고침하거나 다시 로그인해 주세요.');
			}
		})
	});
	$('.pagination-section').on('click', '.page-item', function() {
		const pageNum = this.dataset.pagenum;
		const paginationEl = this.closest('.pagination-section');
		const listSection = this.closest('.book-list-section');
		const {type} = paginationEl.dataset;
		$.ajax({
			url: `/battlebook/${type}/list`, data: { pageNum },
			success: bookList => {
				listSection.querySelectorAll('.book-unit:not(.blank)').forEach(unit => unit.remove());
				listSection.insertBefore(createBookDOMList(bookList, type.startsWith('my')), paginationEl);
				paginationEl.querySelector('.swiper-pagination').replaceChildren(createElement(getPaginations(bookList)));
			},
			error: () => {
				alertModal('배틀북 목록을 조회하지 못 했습니다.\n 화면을 새로고침하거나 다시 로그인해 주세요.');
			}
		})
		
	})
	
	function createBookDOMList(bookList, mine) {
		return createElement(Array.from(bookList?.content, 
			({battleBookId, bbid, title, bookType, description, imagePath, completed, price, openType},i) => {
				const bookCoverClass = `book-cover${!!imagePath?'':' default'}`;
				const bookCoverStyle = !!imagePath ? {backgroundImage: `url(/resource/battlebook/cover/${imagePath})`} : {};
				return  { el: 'div', className: 'book-unit', dataset: {
					bid: battleBookId||bbid, title, bookType, description, imagePath: imagePath||'', completed, price, openType
				}, children: [
					{ el: mine ? 'div' : 'a', className: `book-cover-bg position-relative${mine?'':' d-inline-block'}`, href: mine ? '': `/battlebook/overview/${ntoa(battleBookId)}`, children: [
						{ el: 'div', className: bookCoverClass, children: [
							{ el: 'img', src: 'https://static.findsvoc.com/images/app/workbook/bookcover/book_paper.png', style: bookCoverStyle},
							mine ? { el: 'div', className: 'hover-menu position-absolute top-50 start-50 translate-middle', 
							style: { zIndex: 1, display: 'none'}, children: [
								{ el: 'a', className: 'btn btn-fico js-view-battlebook', href: `/battlebook/overview/${ntoa(battleBookId)}`, textContent: '상세보기' },
								{ el: 'a', className: 'btn btn-fico js-edit-battlebook mt-2', href: `/battlebook/mybook/edit/${ntoa(battleBookId)}`, textContent: '상세보기' },
							]} : ''		
						]}
					]},
					{ el: 'div', className: 'book-title-section', children: [
						{ el: 'span', className: 'book-title-text', textContent: title}
					]}
				]}
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
}
