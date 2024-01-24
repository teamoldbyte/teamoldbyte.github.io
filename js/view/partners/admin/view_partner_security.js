/** partners/admin/view_partner_security.html
 * @author LGM
 */
function pageinit(uri) {
	// [수정폼 열기]--------------------------------------------
	$('.js-edit-btn').click(function() {
		const $form = $(this).closest('form');
		
		$form.find('.js-hidden-input').fadeIn();
		$form.find('.js-edit-btn,.js-mdf-btns').toggle();
	});	
	// [수정폼 취소하기]------------------------------------------------------------
	$('.js-edit-cancel').click(function() {
		const form = this.closest('form');
		
		$(form).removeClass('was-validated');
		form.reset();
		$(form).find('.js-hidden-input,.js-edit-btn,.js-mdf-btns').toggle();
	});
	
	// 비밀번호 수정
	$('#passwd, #passwdCheck').on('input', function() {
		$('#passwdCheck')[0].setCustomValidity($('#passwd').val() != $('#passwdCheck').val()?'값 불일치':'');
	});
	$('#editPasswdForm').on('submit', function(e) {
		e.preventDefault();
		$('#passwdCheck').trigger('input');
		if(!this.checkValidity()) return;
		const formData = new FormData(this);
		$.ajax({
			url: `/partners/${decodeURIComponent(uri)}/admin/account/passwd/edit`,
			type: 'POST',
			data: formData,
			processData: false, contentType: false,
			success: () => {
				alertModal('비밀번호가 성공적으로 변경되었습니다.');
				$(this).removeClass('was-validated')[0].reset();
				$(this).find('.js-hidden-input,.js-edit-btn,.js-mdf-btns').toggle();
			},
			error: jqxhr => {
				if(jqxhr.status == 400 && jqxhr.responseText)
					alertModal(jqxhr.responseText);
				else {
					alertModal('비밀번호 수정에 실패했습니다.');
				}
			}
		})
	})	
}
