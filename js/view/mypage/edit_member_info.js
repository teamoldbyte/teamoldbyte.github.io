/**
 * /mypage/edit_member_info.html
 */
function pageinit(memberId) { 
	Compressor.setDefaults({quality: 0.8, width: 150, height: 150, maxWidth: 150, maxHeight: 150, resize: 'cover'});
	// [수정폼 열기(텍스트 입력 형식 경우)]--------------------------------------------
	$('.edit-btn').click(function() {
		const $form = $(this).closest('.member-edit-form');
		
		$form.find('.hidden-input').fadeIn();
		$form.find(':text').prop('disabled', false);
		$form.find('.edit-btn,.mdf-btns').toggle();
	});

	const $profilePreview = $('#profilePreview');
	// [사진 클릭시 수정폼 열기]-----------------------------------------------------
	$('[name=picFile]').on('change', function(e) {
		const file = e.target.files[0];
		if(file == null) return false;
		const reader = new FileReader();
		reader.onload = function() {
			$profilePreview.css('background-image', 'url('+this.result+')');
			URL.revokeObjectURL(reader.result);
		}
		new Compressor(file, {
				success(result) {
					reader.readAsDataURL(result);
				},
				error() {
					reader.readAsDataURL(file);
				}
			})
		$(this).closest('form').find('.mdf-btns').show();
	});

	// [수정폼 취소하기]------------------------------------------------------------
	$('.js-edit-cancel').click(function() {
		const $form = $(this).closest('.member-edit-form');
		
		// 프로필의 경우 원래 사진으로 되돌린다
		if($form.find('#profilePreview').length > 0) {
			$profilePreview.css('background-image', $profilePreview.data('orgdata'));
		}else {
		// 텍스트형 양식은 텍스트를 원래값으로 되돌린다.
			const $input = $form.find('[data-orgdata]');
			$input.val($input.data('orgdata'));
		}
		$form.removeClass('was-validated');
		$form.find('.hidden-input').fadeOut();
		$form.find(':text').prop('disabled', true);
		$form.find('.edit-btn,.mdf-btns').toggle();
	});

	// 비밀번호 수정
	$('#passwd, #passwdCheck').on('input', function() {
		if(this.closest('form').matches('was-validated')) {
			$('#passwdCheck').toggleClass('is-invalid', $('#passwd').val() != $('#passwdCheck').val());
		}
	})

	// [개인정보 수정 완료]---------------------------------------------------------
	$('.member-edit-form').on('submit', function(e) {
		e.preventDefault();
		if(!this.checkValidity()) return true;
		if(this.querySelector('#passwdCheck')) {
			$('#passwdCheck').toggleClass('is-invalid', $('#passwd').val() != $('#passwdCheck').val());
			if($('#passwdCheck').is('.is-invalid')) return true;
		}
		const form = this;
		const formData = new FormData(form);
		
		formData.append('memberId', memberId);
		if(form.querySelector('input[name=picFile]') != null) {
			const file = form.querySelector('input[name=picFile]').files[0];
			new Compressor(file, {
				success(result) {
					formData.delete('picFile');
					formData.append('picFile',result,result.name);
					// 개인정보 수정(ajax)------------------------------------
					postForm(form.action, formData, successEdit, failEdit);
					//----------------------------------------------------
				},
				error() {
					// 개인정보 수정(ajax)------------------------------------
					postForm(form.action, formData, successEdit, failEdit);
					//----------------------------------------------------
				}
			})
		}else {
			// 개인정보 수정(ajax)------------------------------------
			postForm(form.action, formData, successEdit, failEdit);
			//----------------------------------------------------
		}
		
		function successEdit(data) {
			alert('수정되었습니다.');
			const $input = $(form).find('[data-orgdata]');
			if($input.is('img')) {
				$('.personacon .image-section img')
					.css('background-image', $input.css('background-image'));
				$input.data('orgdata', $input.css('background-image'));
			}else {
				if($input.is('[name=alias]')) {
					$('.personacon .alias').text(data);
				}
				$input.data('orgdata', $input.val());
			}
			$(form).find('.hidden-input').fadeOut();
			$(form).find(':text').prop('disabled', true);
			$(form).find('.edit-btn,.mdf-btns').toggle();
		}
		
		function failEdit(xhr) {
			if($(form).find('[name=passwd]').length > 0 && xhr.status == 403) {
				alert('기존 비밀번호가 틀렸습니다.');
			}else {
				alert('수정 중 오류가 발생했습니다.');
			}
		}
	});	
	// [회원 탈퇴]--------------------------------------------------------------
	$('.js-delete-member').on('click', function() {
		confirmModal('<p>보안을 위해 비밀번호를 한 번 더 입력해 주세요.</p>'
			+ '<input type="password" id="js-verify-passwd" class="form-control mx-auto" placeholder="비밀번호" maxlength="16" autocomplete="password" style="width:calc(16ch + .75rem)">',
			function() {
				const passwd = $('#js-verify-passwd').val();
				if(passwd) {
					confirmModal('탈퇴 시, 지금까지 저장된 <b class="text-danger">영어 지문과 문장 기록이 모두 삭제</b>됩니다.<br>'
						+ '혹시 잠시 쉬고 싶으신 거라면, 계정을 그대로 두셔도 괜찮습니다.<br>'
						+ '그래도 탈퇴를 진행하시겠습니까?', function() {
							$.ajax({
								url: '/member/delete',
								type: 'POST',
								contentType: 'application/json',
								data: passwd, 
								success: () => {
									alertModal('탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.', () => location.assign('/'))
								},
								error: (jqXhr) => {
									if(jqXhr.status)
										alertModal(jqXhr.responseText);
									else
										alertModal('알 수 없는 오류가 발생했습니다.');
								}
							});
					});
				}else {
					alertModal('비밀번호가 입력되지 않았습니다.');
				}
			}
		)
		
		/*confirmModal('탈퇴 시, 지금까지 저장된 영어 지문과 문장 기록이 모두 삭제됩니다.<br>'
			+ '혹시 잠시 쉬고 싶으신 거라면, 계정을 그대로 두셔도 괜찮습니다.<br>'
			+ '그래도 탈퇴를 진행하시겠습니까?', function() {
				const passwd = prompt('보안을 위해 비밀번호를 한 번 더 입력해 주세요.');
				
				if(passwd) {
					$.ajax({
						url: '/member/delete',
						type: 'POST',
						contentType: 'application/json',
						data: passwd, 
						success: () => {
							alertModal('탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.', () => location.assign('/'))
						},
						error: (jqXhr) => {
							if(jqXhr.status)
								alertModal(jqXhr.responseText);
							else
								alertModal('알 수 없는 오류가 발생했습니다.');
						}
					});
				}else {
					alertModal('비밀번호가 입력되지 않았습니다.');
				}
			});*/
	});
}

function postForm(url, command, callback, errCallback) {
	$.ajax({
		url: url, type: 'POST', data: command,
		processData: false, contentType: false, success: callback,
		error: errCallback
	});
}
