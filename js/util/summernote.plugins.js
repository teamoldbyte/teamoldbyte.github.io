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
			      e.preventDefault();  
			      $(this).summernote('pasteHTML', '<br>&#8203;');
                }
            };
        }
    });
}));