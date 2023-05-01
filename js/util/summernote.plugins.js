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
	// use <br> instead of <p> when 'Enter' pressed.
	$.extend($.summernote.plugins, {
        'brenter': function () {
            this.events = {
				// Bind on ENTER
				'summernote.enter': function (_we, e) {
					const {endContainer, endOffset} = getSelection().getRangeAt(0);
					if(endContainer.nextSibling?.nodeName == 'BR' || endContainer.childNodes[endOffset - 1]?.nodeName == 'BR') {
						const br = document.createElement('BR')
						// First, insert <br>.
						$(this).summernote('insertNode', br);
						// Second, remove all other ranges.
						const sel = getSelection();
						sel.removeAllRanges();
						// Third, create a range of <br>, move cursor end of it.
						const brRange = new Range();
						brRange.setStartAfter(br);
						sel.addRange(brRange);
						sel.collapseToEnd();
					}else {
						$(this).summernote('pasteHTML','<br><br>');
					}
					e.preventDefault();
					/*// default enter is <p></p>. so prevent it.
					e.preventDefault();  
					const br = document.createElement('BR')
					$(this).summernote('insertNode', br);
					// Second, remove all other ranges.
					const sel = getSelection();
					sel.removeAllRanges();
					// Third, create a range of <br>, move cursor end of it.
					const brRange = new Range();
					brRange.setStartAfter(br);
					sel.addRange(brRange);
					sel.collapseToEnd();*/
                },
                // 탭 키 입력 시 고정길이 공백 입력이 아닌 진짜 탭 문자 적용(css로 white-space:pre를 적용해야 함.) 
                'summernote.keydown': function(_we,e) {
					if(e.code == 'Tab' && !e.shiftKey) {
						const range = getSelection().getRangeAt(0);
						range.deleteContents();
						range.insertNode(document.createTextNode('	'));
						range.collapse(false)
						e.preventDefault();
					}
				}
            };
        }
    });
}));
