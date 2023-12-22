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
			tabSize: 4,
			minHeight: 200,
			colorButton: { foreColor: '#FF0000', backColor: '#FFFF00' },
			popover: {
				image: [
					['image', ['resizeFull', 'resizeHalf', 'resizeQuarter', 'resizeNone']],
					['float', ['floatLeft', 'floatRight', 'floatNone']],
					['remove', ['removeMedia']]
				],
				link: [
					['link', ['linkDialogShow', 'unlink']]
				],
				table: [ ['total', ['addRowDown', 'addRowUp', 'addColLeft', 'addColRight', 'deleteRow', 'deleteCol', 'deleteTable']]],
				air: [
					['color', ['color']],
					['font', ['bold', 'underline', 'clear']],
					['para', ['ul', 'paragraph']],
					['table', ['table']],
					['insert', ['link', 'picture']]
				]
			},
			toolbar: [ ['style', ['style']],
				['font', ['bold', 'italic', 'underline', 'clear']],
				['fontname', ['fontsize']],
				['color', ['forecolor', 'backcolor']],
				['para', ['ul', 'ol', 'paragraph']],
				['table', ['table']],
				['insert', ['link', 'picture', 'video']],
				['extsymbols', ['extSymbols']],
				['view', ['help','codeview']],
				/*['grammar', ['subjectrole','actionrole','objectrole','empMod-f','empMod-b','empAdv','hinteraser']]*/],
			styleTags: [ 'p', { title: '제목', tag: 'h4', value: 'h4' } ],
			fontNames: ['RIDIBatang', 'HCRDotum'],
			fontSizes: ['10', '12', '14', '16', '18', '24', '36'],
			lang: 'ko-KR',
			};
	
	function onPaste($input, e) {
		let bufferText = ((e.originalEvent || e).clipboardData || window.clipboardData).getData('Text');
		if (!$input.summernote('codeview.isActivated') && bufferText != null && bufferText.length > 0) {
			e.preventDefault();
			// Firefox fix
			setTimeout(function() {
				$input.summernote('pasteHTML', bufferText.quoteNormalize().replaceAll(/\r?\n/g, '<br/>'));
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
			// css 파일 로드
			document.head.appendChild(createElement([{
				el: 'link', rel: 'stylesheet', type: 'text/css',
				href: 'https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote-lite.min.css'
			},{ el: 'link', rel: 'stylesheet', type: 'text/css',
				href: 'https://static.findsvoc.com/css/public/summernote.custom.min.css'
			}]))
			await $.cachedScript('https://cdn.jsdelivr.net/combine/npm/summernote@0.8.18/dist/summernote-lite.min.js,npm/summernote@0.8.18/lang/summernote-ko-KR.min.js');
			await $.cachedScript('https://static.findsvoc.com/js/util/summernote.plugins.min.js');
//			await $.cachedScript('/js/util/summernote.plugins.js');
//			await $.cachedScript('/js/util/summernote.plugins.ssamnote.js');
		}
		if(typeof String.prototype.quoteNormalize == 'undefined') {
			await $.cachedScript('https://static.findsvoc.com/js/util/text-util.min.js');
		}
		$input.summernote(Object.assign(options, {
			callbacks: {
				onInit: function() {
					$.extend($.summernote.options.tooltip, { container: 'body' });
					$input.data('summernote').layoutInfo.editor.find('.note-table-popover .note-btn-group').addClass('d-inline-flex');
				},
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
