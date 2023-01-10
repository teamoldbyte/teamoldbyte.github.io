/**
 * Summernote(Rich Text Editor)
@author LGM
 */
(function($, bootstrap, window, document) {
	/* Allow user to set any option except for dataType, cache, and url
	Use $.ajax() since it is more flexible than $.getScript
	Return the jqXHR object so we can chain callbacks */
	$.cachedScript = $.cachedScript || function( url, options ) {
		return $.ajax( $.extend( options || {}, { dataType: "script", cache: true, url }) );
	};	
	
	const options = {
			tabDisable: true,
			tabSize: 5,
			colorButton: { foreColor: '#FF0000', backColor: '#FFFF00' },
			toolbar: [ ['style', ['style']],
				['font', ['bold', 'italic', 'underline', 'clear']],
				['fontname', ['fontsize']],
				['color', ['forecolor', 'backcolor']],
				['para', ['ul', 'ol', 'paragraph']],
				['table', ['table']],
				['insert', ['link', 'picture', 'video']],
				['view', ['help','codeview']] ],
			styleTags: [ 'p', { title: '제목', tag: 'h4', value: 'h4' } ],
			fontNames: ['RIDIBatang', 'HCRDotum'],
			fontSizes: ['10', '12', '14', '16', '18', '24', '36'],
			lang: 'ko-KR'};
	
	function onPaste($input, e) {
		let bufferText = ((e.originalEvent || e).clipboardData || window.clipboardData).getData('Text');
		if (bufferText != null && bufferText.length > 0) {
			e.preventDefault();
			// Firefox fix
			setTimeout(function() {
				$input.summernote('pasteHTML', bufferText.replaceAll(/\r?\n/g, '<br/>'));
			}, 10);
		}		
	}
	function onChange(contents, $input, $editable) {
		const maxContents = 65000,
			popover = bootstrap.Popover.getOrCreateInstance($editable[0],
				{
					html: true, title: '<span class="fw-bold">※ 경고</span>',
					trigger: 'manual',
					content: '<span class="fw-bold text-danger">본문 내용이 너무 길어 마지막 입력이 취소되었습니다.</span>'
				});
		if (contents.length > maxContents) {
			$input.summernote('undo');
			setTimeout(() => popover.show(), 150);
			$editable.blur();
		} else popover.hide();		
	}
	function uploadImage(formData, $input) {
		$.ajax({
			type: 'POST',
			url: '/sn/fileUpload',
			data: formData,
			processData: false,
			contentType: false,
			success: function(resourceUrlList) {
				for (let i = 0, len = resourceUrlList.length; i < len; i++) {
					const resourceUrl = resourceUrlList[i];
					if (resourceUrl == null || resourceUrl.startsWith('NOT_ALLOWED')) {
						alert('허용되지 않는 형식의 파일입니다.\n파일: '
							+ resourceUrl.replace('NOT_ALLOWED', ''));
					} else 
						$input.summernote('insertImage', resourceUrl);
				}
			},
			error: function() {
				//-----------------------------------
				alert('파일을 업로드하지 못했습니다. 다시 시도해 주세요.')
				//-----------------------------------
			}
		});		
	}
	async function openSummernote($input) {
		if (typeof $.summernote == 'undefined') {
			$('head').append('<link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote-lite.min.css">');
			await $.cachedScript('https://cdn.jsdelivr.net/combine/npm/summernote@0.8.18/dist/summernote-lite.min.js,npm/summernote@0.8.18/lang/summernote-ko-KR.min.js');
			await $.cachedScript('https://static.findsvoc.com/js/util/summernote.plugins.min.js');
			const customstyle = document.createElement('style');
			customstyle.innerHTML = '.note-editor.note-frame {-webkit-user-select: initial;user-select: initial;}.note-toolbar .dropdown-toggle::after{display:none;} .note-editable{font-family: "HCRDotum";}';
			document.head.append(customstyle);
		}
		$input.summernote(Object.assign(options, {
			callbacks: {
				onPaste: function(e) { onPaste($input, e); },
				onChange: function(contents, $editable) { onChange(contents, $(this), $editable); },
				onImageUpload: function(files) {
					let formData = new FormData();
					for (let i = 0, filesLen = files.length; i < filesLen; i++) {
						if (files[i].size > 1024 * 1024) {
							alert('업로드 용량 초과: ' + Math.ceil(files[i].size / 1024) + 'KB\n(최대 용량: 1024KB)');
							return;
						} else formData.append('files', files[i]);
					}
					uploadImage(formData, $(this));
				}
			}
		}));
	}
	
	window['openSummernote'] = openSummernote;
})(jQuery, bootstrap, window, document);
