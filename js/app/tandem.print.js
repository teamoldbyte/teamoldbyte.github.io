/** svoc가 포함된 화면을 프린트
@author LGM
 */
(function($, window, document, screen, tandem){
	/**
	 * 프린트 미리보기 새 창을 띄움.
	 * 프린트 미리보기창에서 용지 선택, 헤더/푸터 수정을 행함.
	 */
	function preview(options) {
		let opt = $.extend({
			obj2print: 'body',
			style: '',
			script: null,
			width: '670',
			height: screen.height - 105,
			top: 0,
			left: 'center',
			resizable: 'yes',
			scrollbars: 'yes',
			status: 'no',
			title: '인쇄 미리보기'
		}, options);
		if (opt.left == 'center') {
			opt.left = (screen.width / 2) - (opt.width / 2);
		}
		$(opt.obj2print).find(" input").each(function() {
			$(this).attr('value', $(this).val());
		});
		$(opt.obj2print).find(" textarea").each(function() {
			$(this).html($(this).val());
		});
		// css, js 등 <head> 요소 모아서 문자열화
		let headers = document.head.cloneNode(true),
			exHeaders = headers.querySelectorAll('script:not([src])'),
			exHeadersLen = exHeaders.length;
		for (let i = 0; i < exHeadersLen; i++) {
			headers.removeChild(exHeaders[i]);
		}
		// <body> 요소 모아서 문자열화
		let printSection = opt.template.cloneNode(true),
			objs = document.querySelectorAll(opt.obj2print),
			objsLen = objs.length;
		if (opt.template) {
			let printBody = printSection.querySelector('.page-body');
			for (let i = 0; i < objsLen; i++) {
				printBody.appendChild(objs[i].cloneNode(true));
			}
		}
		let str = "<!DOCTYPE html><html>"
			+ "<head>" + headers.innerHTML + opt.style + "</head>"
			+ "<body class='print-section mx-auto'>" + printSection.innerHTML + "</body></html>";
		//top open multiple instances we have to name newWindow differently, so getting milliseconds
		let d = new Date();
		let n = 'newWindow' + d.getMilliseconds();
		let newWindow = window.open(
			"",
			n,
			"width=" + opt.width +
			",top=" + opt.top +
			",height=" + opt.height +
			",left=" + opt.left +
			",resizable=" + opt.resizable +
			",scrollbars=" + opt.scrollbars +
			",status=" + opt.status
		);
		let newDoc = newWindow.document;
		newDoc.write(str);
		newDoc.title = opt.title;

		$(newDoc).on('click', '.print-btn', function() {
			newWindow.print();
		}).on('change', '.selectSize', function() {
			$(newDoc).find('.print-section').css('width', this.value.split('/')[0] + 'mm')
				.css('height', this.value.split('/')[1] + 'mm');
			$(newDoc).find('.semantics-result').each(function() {
				tandem.correctMarkLine(this);
			});
		})
		setTimeout(function() {
			let results = newDoc.querySelectorAll('.semantics-result'),
				i = 0, resultsLen = results.length;
			function sequenceFunc() {
				if (i < resultsLen) {
					results[i].removeAttribute('style');
					correctMarkLine(results[i]);
					i++
					requestAnimationFrame(sequenceFunc);
				}
			}
			sequenceFunc();
		}, 2000);
	}
	tandem['printview'] = preview;
})(jQuery, window, document, screen, tandem);
