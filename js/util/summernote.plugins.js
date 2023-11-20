/**
 * Plugins for Summernote
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
        module.exports = factory(require('jquery'));
    } else {
        // Browser globals
        factory(window.jQuery);
    }
}(function ($) {
	$.extend($.summernote.options, {
		enterHtml: '<br>' // 기본 개행 태그를 <br>로 설정
	});
	// use <br> instead of <p> when 'Enter' pressed.
	$.extend($.summernote.plugins, {
		'extraButtons': function(context){
			const arrows = ['🡆', '→', '▮', '•', '·', '※', '≠'];
			// 편의기호 드롭다운 표시
			context.memo('button.extSymbols', function() {

				// Create button
				var dropdownbutton = $.summernote.ui.dropdownButton({
					title: '※',
					items: Array.from(arrows, arrow => `<button type="button" class="note-btn">${arrow}</button>`), // list of arrows
				}, function(items) {
						$(items).each(function() {
							$(this).find('.note-btn').on('click', function(e) {
								context.invoke('editor.insertText', $(this).text());
								e.preventDefault();
							}).unwrap('a');
						});
					});
				new bootstrap.Tooltip(dropdownbutton[0].querySelector('.dropdown-toggle'), {
					template: '<div class="note-tooltip bottom in"><div class="note-tooltip-arrow"></div><div class="tooltip-inner note-tooltip-content"></div></div>',
					title: '특수기호 프리셋',
					placement: 'bottom',
					trigger: 'hover'
				});
				return dropdownbutton;
			})
		},
        'brenter': function () {
            this.events = {
				// Bind on ENTER
				'summernote.enter': function (_we, e) {
					getSelection().getRangeAt(0).deleteContents();
					const range = getSelection().getRangeAt(0);
					const {endContainer, endOffset} = range;
					e.preventDefault();
					if(
						endContainer.nodeType == Node.TEXT_NODE 
					// 선택 범위가 텍스트 노드이면서
						&& (
							endOffset < endContainer.textContent.length
							// 텍스트 한 중간이거나, 바로 앞이나 뒤의 노드가 BR이면
							|| !!endContainer.nextSibling && endContainer.nextSibling?.nodeType != Node.TEXT_NODE
							|| !!endContainer.parentNode?.nextSibling && endContainer.parentNode?.nextSibling?.nodeType != Node.TEXT_NODE
						)
					|| endContainer.nodeType != Node.TEXT_NODE
						&& (
							endContainer.nextSibling?.nodeName == 'BR' 
						)
					) {
						const $br = $('<br>')
						// First, insert <br>.
						range.insertNode($br[0]);
						// Second, remove all other ranges.
						const sel = getSelection();
						sel.removeAllRanges();
						// Third, create a range of <br>, move cursor end of it.
						const brRange = new Range();
						brRange.setStartAfter($br[0]);
						sel.addRange(brRange);
						sel.collapseToEnd();
					}else {
						const $br = $('<br>')
						// First, insert <br>.
						range.insertNode($br[0]);
						range.insertNode($br[0]);
						// Second, remove all other ranges.
						const sel = getSelection();
						sel.removeAllRanges();
						// Third, create a range of <br>, move cursor end of it.
						const brRange = new Range();
						brRange.setStartAfter($br[0]);
						sel.addRange(brRange);
						sel.collapseToEnd();
					}
                },
                // 탭 키 입력 시 고정길이 공백 입력이 아닌 진짜 탭 문자 적용(css로 white-space:break-spaces;를 적용해야 함.) 
                'summernote.keydown': function(_we,e) {
					if(e.code == 'Tab' && !e.shiftKey) {
						e.preventDefault();
						const range = getSelection().getRangeAt(0);
						range.deleteContents();
						range.insertNode(document.createTextNode('	'));
						range.collapse(false)
					}
				}
            };
        }
    });
}));
