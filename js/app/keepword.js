/** 단어를 저장하고, 저장된 단어 목록으로 상호작용을 담당
 * @requires	.one-word-unit-section(parent; .data(sentenceId) 필요) 및 .title(descendants; lemma값)
 * @author LGM
 */
(function() {
	const SESSION_STORAGE_KEY = 'savedWordList',
		WORD_UNIT_CLASSNAME = 'one-word-unit-section',
		WORD_UNIT_SELECTOR = `.${WORD_UNIT_CLASSNAME}`;
	const saveWordBtnJson = {
		el: 'span', role: 'button', class: 'js-save-word keep-word-btn fas fa-download fa-sm', 
				dataset: { bsToggle: 'tooltip', bsTitle: '보관하기'}
	} 
	const unsaveWordBtnJson = {
		el: 'span', role: 'button',
		class: 'js-unsave-word unkeep-word-btn fas fa-bookmark',
		dataset: { bsToggle: 'tooltip', bsHtml: true, bsTitle: '보관된 단어입니다.<br>보관을 해제하려면 다시 클릭'}
	}
	/*const savedToastJson = {
		el: 'div', class: 'js-saved-toast toast align-items-center w-100', role: 'alert',
		dataset: {bsDelay: 1000}, ariaLive: 'assertive', ariaAtomic: 'true', children: [
			{ el: 'div', class: 'toast-body', textContent: '보관됨'}
		]
	}*/
	const unsavedToastJson = {
		el: 'div', class: 'js-unsaved-toast toast align-items-center text-white p-0', role: 'alert',
		style: { width: '150px', background: '#1b1f40', zIndex: 9999},
		dataset: {bsDelay: 1000}, ariaLive: 'assertive', ariaAtomic: 'true', children: [
			{ el: 'div', class: 'toast-body p-1', textContent: '보관 해제되었습니다.'}
		]
	}
	let findMatchWordObserver;
	// 브라우저에 저장된 단어 리스트가 없다면 한 번 서버 호출
	let savedWordList;
	new Promise((resolve,reject) => {
		if(sessionStorage.getItem(SESSION_STORAGE_KEY)) {
			savedWordList = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY));
			resolve();
		}else {
			$.getJSON('/memento/keepword/init', list => {
				if(!Array.isArray(list)) {
					alertModal('저장된 단어 목록을 읽어오지 못했습니다.', reject);
					return;
				}
				savedWordList = list;
				let trimmedCount = 0; // 저장공간 부족시 스토리지에서 제외할 단어 수
				(function saveDBIntoSession(){
					try {
						sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(savedWordList.slice(trimmedCount)));
						if(trimmedCount > 0) {
							alertModal('브라우저 저장 공간이 부족하여 가장 오래 전 저장한 단어 ' + trimmedCount + '개는 제외되었습니다.');
						}
						resolve();
					} catch(e) {
						if(e instanceof QuotaExceededError) {
							if(trimmedCount >= list.length) {
								alertModal('브라우저의 저장 공간이 부족합니다.');
								reject();
							}
							trimmedCount++;
							saveDBIntoSession();
						}
					}
				})();
			}).fail(() => alertModal('저장된 단어 목록을 읽어오지 못했습니다.', reject))
		}
	}).then(() => {
		return $.getScript('https://static.findsvoc.com/js/util/datetime-util.min.js');
	})
	.then(() => {
		// [보관된 단어를 화면에서 찾기]--------------------------------------------------
		$.getScript('https://static.findsvoc.com/js/public/peel.min.js', () => {
			document.head.appendChild(createElement([
				{ el: 'link', rel: 'stylesheet', href: 'https://static.findsvoc.com/css/public/peel.min.css' },
				{ el: 'link', rel: 'stylesheet', href: 'https://static.findsvoc.com/css/app/keepword.min.css' }
			]));
			$(function() {
				findMatchWordObserver = new IntersectionObserver((entries) => {
					entries.forEach((entry) => {
						if(entry.isIntersecting) {
							findMatchWordObserver.unobserve(entry.target);
							matchSavedWords(entry.target);
						}
					})
				});
				function matchSavedWords(wordUnitSection) {
					const wordId = $(wordUnitSection).data().wordId;
					const found = savedWordList.find(word => word.wordId == wordId && !word.del)
					// 보관 목록에 있는 단어일 경우
					if(found) {
						$(wordUnitSection).addClass('saved').data('keepWordId', found.keepWordId).find('.title').before($(createElement(unsaveWordBtnJson)).show());
						$(wordUnitSection).find('.meaning').each((_, meaning) => {
							meaning.style.verticalAlign = 'middle';
							const offsetWidth = Array.from(meaning.getClientRects(),r => r.width).reduce((acc,curr) => acc + curr);
							const offsetHeight = meaning.getClientRects()[0].height;
							$(meaning).wrapInner('<div class="d-inline-block peel"><div class="peel-bottom"></div></div>')
							.find('.peel').prepend(`<div class="peel-top text-center fw-bold text-primary"><div class="position-relative top-50 translate-middle-y">${new Date(found.saveDate).format(offsetWidth < 54 ? 'MM-dd' : 'yyyy-MM-dd')}</div></div><div class="peel-back"></div>`);
							const peelDiv = $(meaning).find('.peel')[0];
							peelDiv.style.width = (offsetWidth + 10) + 'px';
							peelDiv.style.height = (offsetHeight + 10) + 'px';
							const p = new Peel(peelDiv, {
								path: {
									'stroke-width': 0,
									d: `M0,0 C0,5 ${offsetWidth + 10},5 ${offsetWidth + 10},0 ${offsetWidth + 10},0 ${offsetWidth + 10},${offsetHeight+5} ${offsetWidth + 10},${offsetHeight+5} ${offsetWidth + 10},${offsetHeight+10} 0,${offsetHeight+10} 0,${offsetHeight+5} 0,${offsetHeight+5} 0,0 0,0`
								},
								bottomShadowOffset: 2,
								corner: Peel.Corners.TOP_LEFT
							});
							p.setFadeThreshold(.7);
							p.setPeelPosition(25, 10);
							p.setPeelPath(25,10, p.width / 2, p.height * 2, p.width, p.height * 2, 2 * p.width, p.height / 2);
							let initX;
							p.handleDrag(function(_evt, x, _y) {
								if (p.getAmountClipped() > 0.85) {
									p.removeEvents();
									$(p.el).closest('.meaning').text($(p.bottomLayer).text());
								}
								if(!initX) initX = x;
								const t = (x - initX) / p.width;
								this.setTimeAlongPath(t);
							});
							$(peelDiv).data('peel', p);
						});
							
					}
					// 보관 목록에 없는 단어일 경우
					else if($(wordUnitSection).is('.saved')) {
						$(wordUnitSection).removeClass('saved').find('.js-unsave-word').remove();
						$(wordUnitSection).find('.peel')?.data('peel')?.removeEvents();
						$(wordUnitSection).find('.meaning').each((_,m) => {
							$(m).text($(m).find('.peel-bottom').text());
						})
					}
				}
				$(WORD_UNIT_SELECTOR).each((_, wordUnitSection) => {
					findMatchWordObserver.observe(wordUnitSection);
				});
				const mutationObserver = new MutationObserver((mutations) => {
					mutations?.forEach(m => {
						if(m.type == 'childList') {
							m.addedNodes?.forEach(n => {
								if(n.nodeType == Node.ELEMENT_NODE 
								&& n.classList?.contains(WORD_UNIT_CLASSNAME)) {
									findMatchWordObserver.observe(n);
								}
							})
						}
					});
				})
				mutationObserver.observe(document, {childList: true,subtree:true});
			});
		})		
	})
	
	
	$(document)
	// [.one-word-unit-section 블럭에 마우스를 올리면 버튼 표시]-----------------------
	.on('mouseover', WORD_UNIT_SELECTOR, function() {
		if($(this).is('.saved,.processing') || $(this).find('.js-save-word').length > 0) return;
		const saveWordBtn = createElement(saveWordBtnJson);
		const $title = $(this).find('.title');
		$(saveWordBtn).css('--offset', Math.max($title[0].offsetWidth/2, 22) + 'px');
		$(saveWordBtn).insertAfter($title)
	})
	.on('mouseleave', WORD_UNIT_SELECTOR, function() {
		if($(this).is('.processing')) return;
		$(this).find('.js-save-word').remove();
	})
	// [단어 보관]----------------------------------------------------------------
	.on('click', '.js-save-word', function() {
		const $wordSection = $(this).closest(WORD_UNIT_SELECTOR)
		if($wordSection.is('.processing')) return;
		$wordSection.addClass('processing');
		
		const { wordId, sentenceId, workbookId } = $wordSection.data();
		
		setTimeout(() => {
			keepWord(wordId, sentenceId, workbookId)
			.then(keepWordId => {
				successSave(this, keepWordId);
			}).catch(() => alertModal('단어 보관에 실패했습니다.'))
		}, 1000);
		
		
	})
	// [단어 보관 해제]------------------------------------------------------------
	.on('click', '.js-unsave-word', function(e) {
		e.stopPropagation();
		e.stopImmediatePropagation();
		const $wordSection = $(this).closest(WORD_UNIT_SELECTOR)
		if($wordSection.is('.processing')) return;
		$wordSection.addClass('processing');
		$(this).tooltip('hide');
		const { keepWordId } = $wordSection.data();
	
		$.ajax({
			url: '/memento/word/change-status',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({keepWordId, del: true}),
			success: () => {
				unsaveFromSessionStorage(keepWordId);
				successUnsave(this);
			},
			error: () => alertModal('단어 보관 해제에 실패했습니다.')
		});
	})
	.on('hidden.bs.toast', '.js-unsaved-toast', function() {
		$(this).parent().remove();
	})
	
	//-------------------------Embedded Functions-------------------------------
	
	/** 보관했던 이력이 있으면 상태값만 바꾸고, 없으면 새로 보관
	 * @returns keepWordId
	 */
	function keepWord(wordId, sentenceId, workbookId) {
		return new Promise((resolve, reject) => {
			const indexInSavedList = savedWordList.findIndex(word => word.wordId == wordId);
			// 보관 이력이 있던 단어 재보관
			if(indexInSavedList > -1) {
				const keepWordId = savedWordList[indexInSavedList].keepWordId;
				$.ajax({
					url: '/memento/word/change-status',
					type: 'POST',
					contentType: 'application/json',
					data: JSON.stringify({keepWordId, del: false}),
					success: () => {
						savedWordList[indexInSavedList].del = false;
						sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(savedWordList));
						resolve(keepWordId);
					},
					error: reject
				});
			}
			// 신규 보관
			else {
				getNowDate().then(saveDate => {
					$.ajax({
						url: '/memento/word/save',
						type: 'POST',
						contentType: 'application/json',
						data: JSON.stringify({wordId, sentenceId, workbookId, saveDate}),
						success: (keepWordId) => {
							saveIntoSessionStorage({wordId, keepWordId, saveDate, del: false})
							resolve(keepWordId);
						},
						error: reject
					});
				})
			}		
		});
	}
	
	function saveIntoSessionStorage(keepWord) {
		const { wordId, keepWordId, saveDate, del } = keepWord;
		const object = {wordId, keepWordId, saveDate, del};
		if(!savedWordList) {
			savedWordList = [object];
		}else savedWordList.push(object);
		
		sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(savedWordList))
	}
	
	function unsaveFromSessionStorage(keepWordId) {
		if(savedWordList) {
			savedWordList.find(kwd => kwd.keepWordId == keepWordId).del = true;
			sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(savedWordList))
		}
	}
	
	function successSave(parent, keepWordId) {
		const $marker = $(createElement(unsaveWordBtnJson));
		// 보관 버튼 사라짐
		anime({
			targets: parent,
			translateY: -20,
			opacity: 0,
			easing: 'linear',
			complete: (_anim) => {
				const $wordSection = $(parent).closest(WORD_UNIT_SELECTOR);
				$(WORD_UNIT_SELECTOR).filter((_, wordSection) => $(wordSection).data('wordId') == $wordSection.data('wordId') && !$(wordSection).is('.saved,.processing'))
				.each((_, wordSection) => {
					findMatchWordObserver.unobserve(wordSection);
					findMatchWordObserver.observe(wordSection);
				})
				$wordSection.data('keepWordId', keepWordId).removeClass('processing').addClass('saved').find('.title').before($marker);
				$(parent).remove();
				$marker.fadeIn();
			}
		});
		
		/*const savedToast = createElement(savedToastJson);
		const savedToastContainer = createElement({
			el: 'div', class: 'position-absolute start-0 bottom-100'
		});
		savedToastContainer.appendChild(savedToast);
		$(savedToast).toast('show');*/
		
	}
	
	function successUnsave(parent) {
		const unsavedToast = createElement(unsavedToastJson);
		const unsavedToastContainer = createElement({
			el: 'div', class: 'position-absolute start-0 bottom-100'
		});
		unsavedToastContainer.appendChild(unsavedToast);
		const $wordSection = $(parent)
			.closest(WORD_UNIT_SELECTOR).removeData('keepWordId');
		$wordSection.prepend(unsavedToastContainer);
		parent.style.transformOrigin = '200% 0';
		anime({
			targets: parent,
			rotateX: '-90deg',
			rotateZ: '-150deg',
			scale: 2,
			opacity: 0,
			easing: 'linear',
			duration: 500,
			complete: () => {
				$(parent).remove();
				$wordSection.removeClass('saved processing').find('.meaning').each(function() {
					$(this).find('.peel').each((_,peel) => {
						const peelProgress = { t : 0};
						const instance = $(peel).data('peel');
						anime({
							targets: peelProgress,
							duration: 2000,
							t: 1,
							change: (_anim) => {
								instance.setTimeAlongPath(peelProgress.t);
							},
							complete: (_anim) => {
								instance.removeEvents();
								$(this).text($(this).find('.peel-bottom').text());
							}
						})
						
					})
				})
			}
		})
		$(unsavedToast).toast('show');
	}
	
	function getNowDate() {
		return new Promise((resolve, _reject) => {
			if(Date.prototype.format) resolve(new Date().format('yyyy-MM-dd'));
			else $.getScript('https://static.findsvoc.com/js/util/datetime-util.min.js', () =>
				resolve(new Date().format('yyyy-MM-dd'))
			);
		});
	}
	
	Object.assign(window, { keepWord });
})();
