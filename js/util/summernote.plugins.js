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
	/*$.extend($.summernote.options, {
		enterHtml: '<br>' // 기본 개행 태그를 <br>로 설정
	});*/
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
					template: '<div class="note-tooltip top in"><div class="note-tooltip-arrow"></div><div class="tooltip-inner note-tooltip-content"></div></div>',
					title: '특수기호 모음',
					placement: 'top',
					trigger: 'hover'
				});
				return dropdownbutton;
			})
		},
        'customEvents': function () {
            this.events = {
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
