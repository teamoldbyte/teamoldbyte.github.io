/** 단어를 저장하고, 저장된 단어 목록으로 상호작용을 담당
 * @requires	.one-word-unit-section(parent; .data(sentenceId) 필요) 및 .title(descendants; lemma값)
 * @author LGM
 */
(function() {
	let memberId;
	const saveWordBtnJson = {
		el: 'span', role: 'button', class: 'js-save-word position-relative bg-transparent border-0 fas fa-piggy-bank', 
		style: { color: '#ff3899'}, dataset: { bsToggle: 'tooltip', bsTitle: '보관하기'}
	}
	const unsaveWordBtnJson = {
		el: 'span', role: 'button',  style: 'display: none',
		class: 'js-unsave-word fas fa-bookmark text-warning position-absolute',
		dataset: { bsToggle: 'tooltip', bsHtml: true, bsTitle: '보관된 단어입니다.<br>이 버튼을 누르면<br>보관이 해제됩니다.'}
	}
	const savedToastJson = {
		el: 'div', class: 'js-saved-toast toast align-items-center w-100', role: 'alert',
		dataset: {bsDelay: 1000}, ariaLive: 'assertive', ariaAtomic: 'true', children: [
			{ el: 'div', class: 'toast-body', textContent: '보관됨'}
		]
	}
	const unsavedToastJson = {
		el: 'div', class: 'js-unsaved-toast toast align-items-center w-100', role: 'alert',
		dataset: {bsDelay: 1000}, ariaLive: 'assertive', ariaAtomic: 'true', children: [
			{ el: 'div', class: 'toast-body', textContent: '보관 해제됨'}
		]
	}
	
	$(document)
	// [.one-word-unit-section 블럭에 마우스를 올리면 버튼 표시]-----------------------
	.on('mouseover', '.one-word-unit-section:not(.saved,.processing)', function() {
		if($(this).find('.js-save-word').length > 0) return;
		const saveWordBtn = createElement(saveWordBtnJson);
		$(saveWordBtn).insertAfter($(this).find('.title'))
	})
	.on('mouseleave', '.one-word-unit-section:not(.processing)', function() {
		$(this).find('.js-save-word').remove();
	})
	// [단어 보관]----------------------------------------------------------------
	.on('click', '.js-save-word', function() {
		const $wordSection = $(this).closest('.one-word-unit-section')
		if($wordSection.is('.processing')) return;
		$wordSection.addClass('processing');
		
		
		const wordText = $wordSection.find('.title').text().trim();
		const sentenceId = parseInt($wordSection.data('sentenceId'));
		
		$.ajax({
			url: '/word/save',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({memberId, wordText, sentenceId, save: true}),
			success: () => successSave(this),
			error: () => alertModal('단어 보관에 실패했습니다.')
		})
		
	})
	.on('hidden.bs.toast', '.js-saved-toast', function() {
		const $wordSection = $(this).closest('.one-word-unit-section');
		const $marker = $(createElement(unsaveWordBtnJson));
		$wordSection.removeClass('processing').addClass('saved').find('.title').before($marker);
		$(this).closest('.js-save-word').remove();
		$marker.slideDown();
	})
	// [단어 보관 해제]------------------------------------------------------------
	.on('click', '.js-unsave-word', function() {
		const $wordSection = $(this).closest('.one-word-unit-section')
		if($wordSection.is('.processing')) return;
		$wordSection.addClass('processing');
		
		const wordText = $wordSection.find('.title').text().trim();		
		const sentenceId = parseInt($wordSection.data('sentenceId'));

		$.ajax({
			url: '/word/save',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({memberId, wordText, sentenceId, save: false}),
			success: () => successUnsave(this),
			error: () => alertModal('단어 보관 해제에 실패했습니다.')
		})
	})
	.on('hidden.bs.toast', '.js-unsaved-toast', function() {
		const $wordSection = $(this).closest('.one-word-unit-section');
		$(this).closest('.js-unsave-word').remove();
		$wordSection.removeClass('saved processing');
	})
	
	//-------------------------Embedded Functions-------------------------------
	function init(memberIdParam) {
		memberId = memberIdParam;
	}
	function successSave(parent) {
		const savedToast = createElement(savedToastJson);
		const savedToastContainer = createElement({
			el: 'div', class: 'position-absolute start-0 bottom-100'
		});
		savedToastContainer.appendChild(savedToast);
		$(parent).append(savedToastContainer);
		$(savedToast).toast('show');
	}
	
	function successUnsave(parent) {
		const unsavedToast = createElement(unsavedToastJson);
		const unsavedToastContainer = createElement({
			el: 'div', class: 'position-absolute start-0 bottom-100'
		});
		unsavedToastContainer.appendChild(unsavedToast);
		$(parent).append(unsavedToastContainer);
		$(unsavedToast).toast('show');
		
	}
	window['wordManager'] = { init };
})();
