/** partners/admin/view_partner_profile.html
 * @author LGM
 */
function pageinit() {
	Compressor.setDefaults({ convertTypes: 'image/png,image/webp,image/jpg,image/jpeg,image/bmp,image/gif', convertSize: 1000000, resize: 'cover'});
	
	// 주소 입력에 Daum api 적용----------------------------------------------------
	const wrapper = $('#addrWrapper').get(0);
    // 현재 scroll 위치를 저장해놓는다.
	const currentScroll = Math.max(document.body.scrollTop, document.documentElement.scrollTop);
	const addrWindow = new daum.Postcode({
        oncomplete: function(data) {
			//$this.val(`${data.sido} ${data.sigungu}`);
			$(wrapper).hide();
			$('input[name="district"]').val(data.sido);
			$('input[name="address1"],#addressPreview').val(data.address);
			$('input[name="postalCode"]').val(data.zonecode);
			$('input[name="address2"]').show().val('')[0].focus();
            $('#addressPreview').show();
			// 우편번호 찾기 화면이 보이기 이전으로 scroll 위치를 되돌린다.
			document.body.scrollTop = currentScroll;
		},
		// 우편번호 찾기 화면 크기가 조정되었을때 실행할 코드를 작성하는 부분. iframe을 넣은 element의 높이값을 조정한다.
		onresize : function(size) {
			$(wrapper).css('height',size.height+'px');
		},
		width : '100%',
		height : '100%'
	});
	
	// 주소 첫째줄 클릭하면 우편주소찾기창 표시
	$('#addressPreview').on('click', function() {
		addrWindow.embed(wrapper);
		$(this).hide();
		$('input[name="address2"]').hide();
		$(wrapper).show(0);
	})
	// 우편주소찾기창 닫기
	$('#closeAddrWrapper').on('click', function() {
		$('#addrWrapper').hide();
		$('#addressPreview').show();
		$('input[name="address2"]').show();
	})
	// 연락처 자동 포맷-------------------------------------------------------------
	$('input[name="phone"]').on('input', function(e) {
		this.value = this.value.replace(/[^0-9]/g, '') // 숫자를 제외한 모든 문자 제거
		switch(true) {
			case this.value.length > 8 :
				this.value = this.value.replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3');
				break;
			case this.value.length > 7 :
				this.value = this.value.replace(/^(\d{2})(\d{3})(\d{3})$/, '$1-$2-$3');
				break;
			case this.value.length > 4 :
				this.value = this.value.replace(/^(\d{2,3})(\d{3,4})$/, '$1-$2');
				break;
			case this.value.length > 3 :
				this.value = this.value.replace(/^(\d{2,3})(\d)$/, '$1-$2');
				break;
			default: break;
		}
  			
	}).on('change', function() {
		this.value = this.value.replace(/\D/g,'');
		if(this.value.length > 8 && this.value.length < 12) {
			this.classList.remove('is-invalid')
			this.classList.add('is-valid')
		}else {
			this.classList.remove('is-valid')
			this.classList.add('is-invalid')
		}
	})
	
	// 로고 이미지에 각각 다른 압축 적용----------------------------------------
	$('.input-image').on('change', function(e) {
		let file = e.target.files[0];
		if (file == null) {
			return false;
		}
		const $preview = $(this).next('.logo-preview');
		const reader = new FileReader();
		reader.onload = function() {
			$preview
				.css('background-image', `url(${this.result})`)
				.css('opacity', '1')
				.find('.reset-image').show();
			URL.revokeObjectURL(reader.result);
		}
		let compressRatio;
		switch(this.id) {
			case 'repImage':
				compressRatio = { width: 150, height: 150 };
				break;
			case 'emblemImage':
				compressRatio = { width: 300, height: 300 };
				break;
			case 'bannerImage':
				compressRatio = { width: 800, height: 120 };
				break;
			default: break;
		}
		new Compressor(file, {
			width: compressRatio.width, height: compressRatio.height,
			success: (result) => {
				$(this).data('compressedImage', result);
				reader.readAsDataURL(result);
			},
			error(err) {
				reader.readAsDataURL(file);
			}
		});
	})
	
	// 로고 이미지 리셋
	$('.reset-image').on('click', function(e) {
		e.preventDefault();
		e.stopPropagation();
		const $preview = $(this).closest('.logo-preview');
		const $input = $(this).closest('.input-logo').find('input[type="file"]');
		$preview
			.css('backgroundImage', $input.data('org')? `url(/resource/partners/profile/${$input.data('org')})` : '')
			.css('opacity', $input.data('org')? 1 : 0.6);
		$input.removeData('compressedImage').val(null)[0].checkValidity();
		$(this).hide();
	})
	// 소개에 Summernote 적용---------------------------------------------------
	openSummernote($('#intro'));
	// -------------------------------------------------------------------------

	// '대표자와 동일' 체크하면 담당자 정보에 대표자 정보를 복사
	$('#identicalCheck').on('click', function() {
		if(this.checked) {
			if($('#repName').val().length && $('#repPhone').val().length) {
				$('#identical').val(true);
				$('#chargeName').val($('#repName').val());
				$('#chargePhone').val($('#repPhone').val());
			}else {
				alertModal('대표자 정보를 먼저 빠짐없이 입력해 주세요.');
				this.checked = false;
				return;
			}
		}else $('#identical').val(false);
		$('#chargeName').prop('readonly', this.checked);
		$('#chargePhone').prop('readonly', this.checked);
	});	
	
	
	
	const editUrls = {repImage: 'rep-image/edit', emblemImage: 'emblem-image/edit', bannerImage: 'banner-image/edit',
		intro: 'intro/edit'}
	const partnerId = $('#partnerId').val();
	$('.js-edit-btn').on('click', function(e) {
		e.preventDefault();
		const form = this.closest('form');
		
		// 유효성 검사
		form.classList.add('was-validated');
		if(!form.checkValidity()) return;
		
		// 프로필 변경은 입력폼 내용을 모두 취합하여 전송
		if(form.matches('.edit-profile-form')) {
			const formData = new FormData(form);
			$.ajax({
				type: 'POST', url: '/partners/admin/profile/edit',
				processData: false, contentType: false,
				data: formData,
				success: function() {
					$(form).find('input,select').each((_,input) => {
						input.dataset.org = input.value;
					});
					alertModal('정보가 수정되었습니다.');
				},
				error: function() {
					alertModal('정보 수정에 실패했습니다.')
				}
			});
			return;
		}
		// 추가정보의 경우 partnerId와 전달데이터 하나씩 담아서 구성(업데이트할 것이므로)
		$(form).find('input,textarea,select').filter((_,input) => {
			return input.name && input.name != 'partnerId' && !input.closest('.note-editor')
		})
		.each(async function() {
			if(this.type == 'file') {
				const compressedImage = $(this).data('compressedImage');
				if(compressedImage) {
					const formData = new FormData();
					formData.append('partnerId', partnerId);
					formData.append(this.name, compressedImage, compressedImage.name);
					await $.ajax({
						type: 'POST', url: `/partners/admin/profile/${editUrls[this.name]}`,
						processData: false, contentType: false,
						data: formData,
						success: path => {
							this.dataset.org = path;
							const $preview = $(this).next('.logo-preview');
							$preview.css('backgroundImage', `url(/resource/partners/profile/${path})`);
							$preview.find('.reset-image').hide();
							$(this).removeData('compressedImage');
							alertModal('이미지가 수정되었습니다.');
						},
						error: () => {
							alertModal('이미지 수정에 실패했습니다.');
						}
					})
				}
			}
			else if(this.dataset.org != this.value) {
				const formData = new FormData();
				formData.append('partnerId', partnerId);
				formData.append(this.name, this.value.trim());
				await $.ajax({
					type: 'POST', url: `/partners/admin/profile/${editUrls[this.name]}`,
					processData: false, contentType: false,
					data: formData,
					success: () => {
						alertModal('정보가 수정되었습니다.');
						this.dataset.org = formData.get(this.name);
					},
					error: () => {
						alertModal('정보 수정에 실패했습니다.');
					}
				});
			}
		});
	})	
}
