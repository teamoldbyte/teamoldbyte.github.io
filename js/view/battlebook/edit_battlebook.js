/** battlebook/edit_battlebook.html
 * 
 */
function pageinit(battleBookId) {
	
	$('.js-overview-battlebook').on('click', function() {
		location.assign(`/battlebook/overview/${ntoa(battleBookId)}`);
	})
	// [커버 이미지 미리보기 변경]-----------------------------------------------------------
	let $imgPreview = $('.battlebook-info-section .book-cover img');
	$('[name="coverImage"]').on('change', function(e) {
		let file = e.target.files[0];
		if(file == null) return false;
		
		const reader = new FileReader();
		reader.onload = function() {
			$imgPreview.css('background-image','url(' + this.result + ')')
			.closest('.book-cover').removeClass('default').find('.book-title').hide();
			URL.revokeObjectURL(reader.result);
		}
		new Compressor(file, {
			success(result) {
				reader.readAsDataURL(result);
			},
			error(err) {
				reader.readAsDataURL(file);
			}
		});
	});
	
	// 편집 입력칸 클릭 시 수정 활성화 및 버튼 표시
	$(document).on('focus click', '.edit-hover:not(.active) *', function(e) {
		e.stopImmediatePropagation();
		e.stopPropagation();
		const $block = $(this.closest('.edit-hover'));
		const $input = $block.find('.battlebook-edit-input');
		$block.addClass('active');
		if($input.is(':file')) {
			$input.data('originData', $imgPreview.css('background-image'));
			$block.find('.mdf-btns').css('display', 'block');
		}else {
			$input.prop('readonly', false);
			$input.data('originData', $input.is(':radio')
									? $input.filter(':checked').val() : $input.val());
			
			$block.find('.mdf-btns').show();
			if($input.is('textarea')){
				if(!$input.data('summernote')) {
					openSummernote($input);
				}else {
					$input.siblings('.note-editor').show();
				}
				$block.find('.description:not(textarea)').hide();
			}
		}
		$block.find('.edit-badge').hide();
	});
	// [수정 취소 및 비활성화]-------------------------------------------------------
	$('.js-edit-cancel').click(function(e) {
		e.stopPropagation();
		const $block = $(this.closest('.edit-hover'));
		const $input = $block.find('.battlebook-edit-input');
		
		if($input.is(':file')) {// 커버이미지는 원래이미지로 복구
			$imgPreview.css('background-image', $input.data('originData'));
			if($input.data('originData') == 'none') {
				$imgPreview
				.closest('.book-cover').addClass('default').find('.book-title').show();
			}
		}else {
			if($input.is(':radio')) {
				$input.filter('[value="'+$input.data('originData')+'"]').prop('checked', true);
			}else {
				$input.val($input.data('originData'));
			}
			if($input.is('textarea')) {
				$input.siblings('.note-editor').hide()
				$block.find('.description:not(textarea)').show();
			}else {
				$input.prop('readonly', true);
			}
		}
		$block.removeClass('active').find('.edit-badge').show().removeAttr('style');
		$block.find('.mdf-btns').hide().find('button').not(this).prop('disabled', true);
	});
	
	// [입력 내용이 있으면 수정 확인 버튼 활성화]----------------------------------------
	$('.edit-hover input, .edit-hover select, .edit-hover textarea').on('input', function() {
		$(this.closest('.edit-hover')).find('.mdf-btns button').prop('disabled', false);
	});
	
	// [워크북 내용 수정]-------------------------------------------------------
	$('.edit-battlebook-form').submit(function(e) {
		e.preventDefault();
		const $input = $(this).find('.battlebook-edit-input');
		const $block = $input.closest('.edit-hover');
		const form = this;
		if($input.is(':file')) {
			const command = new FormData();
			command.append('battleBookId', battleBookId);
			new Compressor($input.get(0).files[0], {
				success(result) {
					command.append($input.attr('name'), result, result.name);
					// 배틀북 정보 수정(ajax)--------------------------------
					$.ajax({
						url: form.action,
						type: 'POST',
						data: command,
						processData: false,
						contentType: false,
						success: successEdit,
						error: () => alertModal('수정에 실패했습니다.')
					})
					//---------------------------------------------------
				},
				error(err) {
					command.append($input.attr('name'), $input.get(0).files[0]);
					// 배틀북 정보 수정(ajax)--------------------------------
					$.ajax({
						url: form.action,
						type: 'POST',
						data: command,
						processData: false,
						contentType: false,
						success: successEdit,
						error: () => alertModal('수정에 실패했습니다.')
					})
					//---------------------------------------------------
				}
			})
		}else {
			const command = {battleBookId: battleBookId};
			command[$input.attr('name')] = $input.is(':radio')// 라디오버튼 타입이면 체크된 값만 사용
											? ($input.filter(':checked').val() == 'true')
											: $input.is('textarea') ? $input.summernote('code').trim()
											// type="number"면 숫자로 파싱
											: ($input.attr('type')=='number') ? parseInt($input.val())
											: $input.val().trim();
			// 배틀북 정보 수정(ajax)--------------------------------
			$.ajax({
				url: form.action,
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(command),
				success: successEdit,
				error: () => alertModal('수정에 실패했습니다.')
			})
			//---------------------------------------------------
		}
		
		function successEdit() {
			alertModal('수정되었습니다.');
			// 편집모드 해제
			$block.removeClass('active').find('.edit-badge').show().removeAttr('style');
			// 편집 버튼들 숨기기
			$block.find('.mdf-btns').hide();
			// 소개영역은 html로 다시 표시
			if($input.is('textarea')) {
				$input.siblings('.note-editor').hide();
				$(form).siblings('.description').html($input.val()).show();
			}
			// 수정일 갱신
			$('.update-date').text(new Date().toLocaleDateString());
		}
	});
}
