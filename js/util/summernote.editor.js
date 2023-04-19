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
				['view', ['help','codeview']],
				/*['grammar', ['subjectrole','actionrole','objectrole','empMod-f','empMod-b','empAdv','hinteraser']]*/],
			styleTags: [ 'p', { title: '제목', tag: 'h4', value: 'h4' } ],
			fontNames: ['RIDIBatang', 'HCRDotum'],
			fontSizes: ['10', '12', '14', '16', '18', '24', '36'],
			lang: 'ko-KR'};
	
	function onPaste($input, e) {
		let bufferText = ((e.originalEvent || e).clipboardData || window.clipboardData).getData('Text');
		if (!$input.summernote('codeview.isActivated') && bufferText != null && bufferText.length > 0) {
			e.preventDefault();
			// Firefox fix
			setTimeout(function() {
				$input.summernote('pasteHTML', bufferText.replaceAll(/\r?\n/g, '<br/>'));
			}, 10);
		}		
	}
	function onChange(contents, maxLength, $editable) {
		const maxContents = maxLength > 0 ? maxLength : 65000;
		$editable.attr('data-char-count', `현재 글자 수: ${contents.length} (스타일 정보 포함) / ${maxContents}`);
		
		$editable.toggleClass('note-overlimit', contents.length > maxContents);
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
			/*await $.cachedScript('/js/util/summernote.plugins.ssamnote.js');*/
			const customstyle = document.createElement('style');
			customstyle.innerHTML = '.note-editor.note-frame {-webkit-user-select: initial;user-select: initial;}.note-toolbar .dropdown-toggle::after{display:none;} .note-editable{font-family: "HCRDotum";white-space: break-spaces;}@media(min-width: 576px){.note-editable{background:repeating-linear-gradient(transparent,transparent 10px, #fff 10px, #fff 20px), linear-gradient(to right, transparent calc(320px - 1px), #eee 320px, transparent calc(320px + 1px));}.note-editable::before{content: "모바일 경계선";position: absolute;color: #bbb;font-size: 5px;left: 320px;top: 0;transform: translateX(-50%);}}.note-editable::after{position:absolute;right: 20px;top: 0;content:attr(data-char-count);font-size: 5px}.note-editable.note-overlimit::after{color: #f00}';
			document.head.append(customstyle);
		}
		$input.summernote(Object.assign(options, {
			callbacks: {
				onPaste: function(e) { onPaste($input, e); },
				onChange: function(contents, $editable) { 
					onChange(contents, this.maxLength, $editable); },
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
