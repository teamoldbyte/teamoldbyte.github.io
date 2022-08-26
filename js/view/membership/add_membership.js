/** /membership/add_membership.html
@author LGM
 */
function pageinit(membershipCommand) {
	const loggedin = membershipCommand.mid != 0;
	
	let nextTimer; 
	let orderItemList = [];
	
	const donationModalJson = {
		el: 'div', id: 'done-info-modal', className: 'modal fade done-info-modal', tabIndex: '-1',
		'data-bs-backdrop': 'static', 'data-bs-keyboard': 'false', 'aria-labelledby': 'donationModalLabel', ariaHidden: 'true', children: [
			{ el: 'div', className: 'modal-dialog modal-dialog-centered', children: [
				{ el: 'div', className: 'modal-content bg-yellow-150 shadow', children: [
					{ el: 'div', className: 'modal-header', children: [
						{ el: 'h5', id: 'donationModalLabel', className: 'modal-title text-lmd fw-bold w-100 text-center', textContent: '후원자 정보' },
						{ el: 'button', type: 'button', id: 'closeDonation', className: 'btn-close position-absolute top-3 end-3' }
					]},
					{ el: 'div', className: 'modal-body', children: [
						// 후원자 정보 입력
						{ el: 'div', id: 'phase-1', className: 'payment-phase input-form-section border-0 collapse show', children: [
							{ el: 'form', id: 'paymentForm', className: 'needs-validation', noValidate: true, children: [
								{ el: 'div', className: 'input-name row g-3 align-items-center mb-3', children: [
									{ el: 'div', className: 'col-3 col-md-2 text-end mb-auto', children: [
										{ el: 'label', htmlFor: 'inputName', className: 'col-form-label text-smd fw-bold', textContent: '후원자명' }
									]},
									{ el: 'div', className: 'col-9 col-md-10 position-relative', children: [
										{ el: 'input', type: 'text', id: 'inputName', name: 'remitter', value: membershipCommand.remitter, autocomplete: 'off', className: 'form-control', 'aria-describedby': 'nameHelpInline', required: true },
										{ el: 'div', className: 'invalid-feedback', innerHTML: '&nbsp;&nbsp;후원자명은 비울 수 없습니다.' }
									]},
									{ el: 'div', className: 'help-text-section col-9 col-md-10 ms-auto my-0', children: [
										{ el: 'span', id: 'nameHelpInline', className: 'form-text ms-0 ms-lg-2', textContent: '송금 때 사용하실 송금자명과 동일한 이름으로 입력해 주세요.' }
									]}
								]},
								{ el : 'div', className: 'input-phone row g-3 align-items-center mb-3', children: [
									{ el: 'div', className: 'col-3 col-md-2 text-end mb-auto', children: [
										{ el: 'label', htmlFor: 'inputPhone', className: 'col-form-label text-smd fw-bold', textContent: '전화번호' }
									]},
									{ el: 'div', className: 'col-9 col-md-10 position-relative', children: [
										{ el: 'input', type: 'text', id: 'inputPhone', name: 'phone', className: 'form-control', placeholder: '예) 01012345678', autocomplete: 'off', pattern: '[0-9]{9,12}', value: membershipCommand.phone, 'aria-describedby': 'phoneHelpInline', required: true },
										{ el: 'div', className: 'invalid-feedback', innerHTML: '&nbsp;&nbsp;올바른 전화번호를 입력해 주십시오.' }
									]},
									{ el: 'div', className: 'help-text-section col-9 col-md-10 ms-auto my-0', children: [
										{ el: 'span', id: 'phoneHelpInline', className: 'form-text ms-0 ms-lg-2', textContent: '전화번호는 암호화 되니 반드시 숫자로 입력해 주세요.' }
									]}
								]},
								{ el: 'div', className: 'input-email row g-3 align-items-center mb-3', children: [
									{ el: 'div', className: 'col-3 col-md-2 text-end mb-auto', children: [
										{ el: 'label', htmlFor: 'inputEmail', className: 'col-form-label text-smd fw-bold', textContent: '이메일' }
									]},
									{ el: 'div', className: 'col-9 col-md-7 position-relative', children: [
										{ el: 'input', type: 'email', id: 'inputEmail', name: 'email', value: membershipCommand.email, className: 'form-control', 'aria-describedby': 'emailHelpInline', autocomplete: 'off', required: true },
										{ el: 'div', className: 'invalid-feedback', innerHTML: '&nbsp;&nbsp;올바른 이메일을 입력해 주십시오.' }
									]},
									{ el: 'div', className: 'd-none d-md-block col-12 col-md-3 text-end mb-auto', children: [
										{ el: 'input', type: 'email', className: 'check-email-input form-control d-none', value: membershipCommand.email, required: true },
										{ el: 'button', type: 'button', className: 'check-email-btn btn btn-outline-fico', disabled: true, textContent: '중복 검사' }
									]},
									{ el: 'div', className: 'help-text-section col-9 col-md-10 ms-auto my-0', children: [
										{ el: 'span', id: 'emailHelpInline', className: 'form-text ms-0 ms-lg-2', textContent: '생성될 계정의 이메일을 입력해 주세요.' }
									]},
									{ el: 'div', className: 'd-block d-md-none col-9 text-end mb-auto ms-auto mt-1', children: [
										{ el: 'input', type: 'email', className: 'check-email-input form-control d-none', value: membershipCommand.email, required: true },
										{ el: 'button', type: 'button', className: 'check-email-btn btn btn-outline-fico w-100', disabled: true, textContent: '중복 검사' }
									]}
								]},
								// 동의 체크
								/*
								<div class="mt-4">
									<div class="form-check">
										<input class="form-check-input" type="checkbox" value="" id="flexCheckDefault"> <label
											class="form-check-label" for="flexCheckDefault">
											이용약관 및 결제유의사항 동의 </label>
									</div>
									<div class="form-check">
										<input class="form-check-input" type="checkbox" value="" id="flexCheckChecked"> <label
											class="form-check-label" for="flexCheckChecked">
											개인정보제공 동의 </label>
									</div>
								</div>								
								 */
								{ el: 'div', className: 'button-section text-end mt-2', children: [
									{ el: 'button', type: 'submit', className: 'btn btn-fico', disabled: true, textContent: '다음' }
								]}
							]}
						]},
						// 2. 구매상품 및 가격 안내
						{ el: 'div', id: 'phase-2', className: 'payment-phase collapse', children: [
							{ el: 'div', className: 'payment-info text-center', children: [
								{ el: 'p', children: [
									{ el: 'span', className: 'name fw-bold', textContent: 'fico'},
									{ el: 'br' },
									{ el: 'span', className: 'price fw-bold' },
									'원을 결제합니다.'
								]}
							]},
							// QR 이미지 영역
							{ el: 'div', className: 'qr-images-section row g-0', children: [
								{ el: 'div', className: 'qr-kakao-section text-center col-md-6 mx-auto my-3', children: [
									{ el: 'span', className: 'd-block mx-auto mb-4', children: [
										{ el: 'span', className: 'text-danger', children: [
											'오류가 발생한 경우,', { el: 'br' }, '아래 메일로 문의해주세요.'
										]},
										{ el: 'br' },
										'teamoldbyte@gmail.com',
										{ el: 'br' }
									]},
									{ el: 'span', className: 'kakaopay-logo d-none d-md-block', children: [
										{ el: 'img', alt: 'kakaopay', src: 'https://static.findsvoc.com/images/common/etc/logo/kakaopay_ci.svg' }
									]},
									{ el: 'div', className: 'pt-2', children: [
										{ el: 'img', className: 'qr-image', alt: 'QR코드', src: 'https://static.findsvoc.com/images/common/qr-kakaopay.png' }
									]}
								]}
							]},
							{ el: 'div', className: 'account-info-section text-center mb-1', children: [
								{ el: 'div', children: [
									{ el: 'span', className: 'fw-bold d-block', textContent: '입금 계좌 안내' }
								]},
								{ el: 'div', children: [
									{ el: 'span', className: 'name fw-bold', textContent: '카카오뱅크' },
									{ el: 'span', className: 'account-num pe-1', textContent: '3333-04-8952631' },
									{ el: 'input', type: 'hidden', id: 'accountNum', value: '3333-04-8952631' },
									{ el: 'button', className: 'btn btn-warning btn-copy far fa-copy', onclick: () => window.navigator.clipboard.writeText($('#accountNum').val()),
										'data-bs-container': 'body', 'data-bs-toggle': 'popover', 'data-bs-placement': 'top', 'data-bs-content': 'copied', textContent: '복사' },
									{ el: 'span', className: 'name d-block', textContent: '[예금주: 이승렬]' }
								]}
							]},
							{ el: 'div', className: 'progress', children: [
								{ el: 'div', className: 'progress-bar progress-bar-striped progress-bar-animated', role: 'progressbar', 'aria-valuenow': '0', 'aria-valuemin': '0', 'aria-valuemax': '100' }
							]},
							{ el: 'div', className: 'button-section text-center position-relative pt-3', children: [
								{ el: 'button', type: 'button', id: 'cancelPayment', className: 'btn btn-outline-fico position-absolute top-2 start-0', textContent: '취소' },
								{ el: 'span', className: 'waiting-msg placeholder-wave', textContent: '결제 대기 및 처리 중입니다...' },
								{ el: 'span', className: 'd-block text-danger text-sm', innerHTML: '입금을 하시고 나면<br> 창을 끄지 말고 \'다음\'을 눌러주세요.' },
								{ el: 'button', type: 'button', className: 'btn btn-fico position-absolute top-2 end-0', 'data-bs-toggle': 'collapse', 'data-bs-target': '#phase-2,#phase-3', disabled: true, textContent: '다음' }
							]}
						]},
						// PHASE 3
						{ el: 'div', id: 'phase-3', className: 'payment-phase input-form-section border-0 collapse', children: [
							{ el: 'form', id: 'membershipForm', className: 'needs-validation', action: '/membership', method: 'post', noValidate: true, children: 
								Array.from(['mid','phone','remitter','totalAmount'], att => { 
									return { el: 'input', type: 'hidden', id: att, name: att, value: membershipCommand[att] }}).concat([
										{ el: 'div', className: 'input-email row g-3 align-items-center mb-3', children: [
											{ el: 'div', className: 'col-3 col-md-2 text-end mb-auto', children: [
												{ el: 'label', className: 'col-form-label text-smd fw-bold', textContent: '이메일' }
											]},
											{ el: 'div', className: 'col-9 col-md-10 position-relative', children: [
												{ el: 'input', type: 'email', name: 'email', className: 'form-control', value: membershipCommand.email, 'aria-describedby': 'emailHelpInline', required: !loggedin, readOnly: true },
												{ el: 'div', className: 'invalid-feedback', innerHTML: '&nbsp;&nbsp;올바른 이메일을 입력해 주십시오.' }
											]},
											{ el: 'div', className: 'help-text-section col-9 col-md-10 ms-auto my-0', children: [
												{ el: 'span', id: 'emailHelpInline', className: 'form-text ms-2', textContent: '계정의 아이디로 사용될 이메일입니다.' }
											]}
										]},
										{ el: 'div', className: 'input-password row g-3 align-items-center mb-3', children: [
											{ el: 'div', className: 'col-3 col-md-2 text-end mb-auto', children: [
												{ el: 'label', htmlFor: 'passwd', className: 'col-form-label text-smd fw-bold', textContent: '비밀번호' }
											]},
											{ el: 'div', className: 'col-9 col-md-10 position-relative', children: [
												{ el: 'input', type: 'password', className: 'form-control', id: 'passwd', name: 'passwd', autocomplete: 'off', 'aria-describedby': 'passwordHelpInline', required: !loggedin, pattern: "[A-z0-9!+-./\u0022#$%&'()*:;?@\[\]^_`{|}~\\]{8,16}"/*, oninput: document.getElementById('passwdCheck').setAttribute('pattern',this.value);*/},
												{ el: 'div', className: 'invalid-feedback', innerHTML: '&nbsp;&nbsp;8~16자의 영문 대소문자, 숫자, 특수문자만 가능합니다.' }
											]},
											{ el: 'div', className: 'help-text-section col-9 col-md-10 ms-auto my-0', children: [
												{ el: 'span', id: 'passwordHelpInline', className: 'form-text ms-2', textContent: '생성될 계정의 비밀번호를 입력해 주세요.' }
											]}
										]},
										{ el: 'div', className: 'input-password-check row g-3 align-items-center mb-3', children: [
											{ el: 'div', className: 'col-3 col-md-2 text-end mb-auto', children: [
												{ el: 'label', htmlFor: 'passwd', className: 'col-form-label text-smd fw-bold', textContent: '비밀번호 확인' }
											]},
											{ el: 'div', className: 'col-9 col-md-10 position-relative', children: [
												{ el: 'input', type: 'password', id: 'passwdCheck', className: 'form-control', autocomplete: 'off', 'aria-describedby': 'passwdCheckHelpInline', required: !loggedin },
												{ el: 'div', className: 'invalid-feedback', innerHTML: '&nbsp;&nbsp;위에서 입력한 비밀번호와 맞지 않습니다.' }
											]},
											{ el: 'div', className: 'help-text-section col-9 col-md-10 ms-auto my-0', children: [
												{ el: 'span', id: 'passwdCheckHelpInline', className: 'form-text ms-2', textContent: '위에서 입력한 비밀번호를 한번 더 입력해 주세요.'}
											]}
										]},
										{ el: 'div', className: 'input-name row g-3 align-items-center mb-3', children: [
											{ el: 'div', className: 'col-3 col-md-2 text-end mb-auto', children: [
												{ el: 'label', className: 'col-form-label text-smd fw-bold', textContent: '이름' }
											]},
											{ el: 'div', className: 'col-9 col-md-10 position-relative', children: [
												{ el: 'input', type: 'text', name: 'name', value: membershipCommand.name, className: 'form-control', 'aria-describedby': 'nameHelpInline', required: !loggedin},
												{ el: 'div', className: 'invalid-feedback', innerHTML: '&nbsp;&nbsp;이름은 비울 수 없습니다.' }
											]},
											{ el: 'div', className: 'help-text-section col-9 col-md-10 ms-auto my-0', children: [
												{ el: 'span', id: 'nameHelpInline', className: 'form-text ms-2', textContent: '계정 소유자의 이름을 입력하세요.' }
											]}
										]},
										{ el: 'div', className: 'input-email row g-3 align-items-center mb-3', children: [
											{ el: 'div', className: 'col-3 col-md-2 text-end mb-auto', children: [
												{ el: 'label', className: 'col-form-label text-smd fw-bold', textContent: '성별'}
											]},
											{ el: 'div', className: 'col-9 col-md-10 position-relative', children: 
											Array.from([['M','남성'],['F','여성']], (v,k) => {
												return { el: 'div', className: 'form-check form-check-inline', children: [
													{ el: 'input', type: 'radio', className: 'form-check-input', id: `sexCheck${k}`, name: 'sex', checked: membershipCommand.sex == v[0], value: v[0], required: !loggedin},
													{ el: 'label', htmlFor: `sexCheck${k}`, className: 'form-check-label', textContent: v[1]}
												]};
											}).concat([
												{ el: 'div', className: 'invalid-feedback', innerHTML: '&nbsp;&nbsp;성별을 선택해 주세요.'}
											])
											},
											{ el: 'div', className: 'help-text-section col-9 col-md-10 ms-auto my-0', children: [
												{ el: 'span', id: 'sexHelpInline', className: 'form-text ms-2', textContent: '성별을 선택해 주세요.'}
											]}
										]},
										{ el: 'div', className: 'input-birth row g-3 align-items-center mb-3', children: [
											{ el: 'div', className: 'col-3 col-md-2 text-end mb-auto', children: [
												{ el: 'label', className: 'col-form-label text-smd fw-bold', textContent: '출생연도' }
											]},
											{ el: 'div', className: 'col-9 col-md-10 position-relative', children: [
												{ el: 'select', className: 'form-select', name: 'birthYear', 'aria-describedby': 'birthHelpInline', required: !loggedin, children: 
											[{ el: 'option', disabled: true, selected: true, value: '', textContent: '--선택--'}]
											.concat(Array.from(new Array(88), (v,k) => {
												const year = 1920 + k;
												return { el: 'option', value: year, textContent: year, selected: membershipCommand.birthYear == year}
											}))}
											]},
											{ el: 'div', className: 'help-text-section col-9 col-md-10 ms-auto my-0', children: [
												{ el: 'span', id: 'birthHelpInline', className: 'form-text ms-2', textContent: '학습 컨텐츠 추천을 위해 출생연도를 입력해 주세요.'}
											]}
										]},
										// 동의 체크
										/*<div class="mt-4">
											<div class="form-check">
												<input class="form-check-input" type="checkbox" value="" id="flexCheckDefault"> <label
													class="form-check-label" for="flexCheckDefault">
													이용약관 및 결제유의사항 동의 </label>
											</div>
											<div class="form-check">
												<input class="form-check-input" type="checkbox" value="" id="flexCheckChecked"> <label
													class="form-check-label" for="flexCheckChecked">
													개인정보제공 동의 </label>
											</div>
										</div>*/
										{ el: 'div', className: 'button-section text-end mt-2', children: [
											{ el: 'button', type: 'button', className: 'btn btn-outline-fico', 'data-bs-toggle': 'collapse', 'data-bs-target': '#phase-2,#phase-3', textContent: '이전' },
											{ el: 'button', type: 'submit', className: 'btn btn-fico', textContent: '완료'}
										]}									
									])
							}
						]}
					]}
				]}
			]}
		]
	}

	const desktopInfoMOdalJson = {
		el: 'div', id: 'guide-modal', className: 'modal fade', tabIndex: '-1', children: [
			{ el: 'div', className: 'modal-dialog modal-dialog-centered', children: [
				{ el: 'div', className: 'modal-content', children: [
					{ el: 'div', className: 'modal-header', children: [
						{ el: 'h5', className: 'modal-title', textContent: '데스크톱/태블릿 웹 브라우저 접속 지원' },
						{ el: 'button', type: 'button', className: 'btn-close', 'data-bs-dismiss': 'modal', ariaLabel: 'Close' }
					]},
					{ el: 'div', className: 'modal-body row g-0', children: [
						{ el: 'div', className: 'col-lg-4 membership-image text-center', children: [
							{ el: 'img', alt: 'membership', src: 'https://static.findsvoc.com/images/app/membership/DDM-12.png' }
						]},
						{ el: 'p', className: 'col-lg-8', children: [
							{ el: 'b', className: 'text-fc-red', textContent: '데스크톱' },
							'과 ',
							{ el: 'b', className: 'text-fc-red', textContent: '태블릿' },
							'에서도 ',
							{ el: 'span', className: 'app-name-text', textContent: 'fico' },
							'에 접속할 수 있도록 하는 ', { el: 'b', textContent: '부가 서비스'}, '입니다', { el: 'br'},
							'워크북 등 ', { el: 'b', textContent: '콘텐츠 작성' }, '이 많거나 보다 ', { el: 'b', textContent: '넓은 화면'}, '에서 학습하고자 하는 분들에게 추천합니다.', { el: 'br'},
							'findsvoc.com에서 체험해 보세요.'
						]}
					]}
				]}
			]}
		]
	};

	const emailDuplicateModalJson = {
		el: 'div', id: 'check-modal', className: 'check-modal-section modal fade', tabIndex: '-1', 'data-bs-backdrop': 'static', children: [
			{ el: 'div', className: 'modal-dialog modal-dialog-centered', children: [
				{ el: 'div', className: 'modal-content border-0', children: [
					{ el: 'div', className: 'modal-header bg-fc-purple', children: [
						{ el: 'h5', className: 'modal-title text-white col-10', textContent: '이메일 중복 검사' },
						{ el: 'button', type: 'button', className: 'btn-close', 'data-bs-dismiss': 'modal', ariaLabel: 'Close' }
					]},
					{ el: 'div', className: 'modal-body', children: [
						{ el: 'p', children: [
							'해당 E-mail은 이미 ', { el: 'b', textContent: 'fico 계정'}, '으로 등록되어 있습니다.', { el: 'br'},
							'본인 계정일 경우 ', { el: 'b', textContent: '로그인 후 마이 페이지에서 연장' }, '해 주세요.', { el: 'br'}, { el: 'br'},
							{ el: 'b', textContent: '비밀번호 재발급' }, '이나 ', { el: 'b', textContent: '계정 부정 사용 신고' }, '를 하려면', { el: 'br'},
							'teamoldbyte@gmail.com 으로 문의 바랍니다.', { el: 'br'}
						]}
					]},
					{ el: 'div', className: 'modal-footer justify-content-center', children: [
						{ el: 'button', type: 'button', className: 'btn btn-outline-fico', 'data-bs-dismiss': 'modal', textContent: '다시 입력' },
						{ el: 'button', type: 'button', className: 'btn btn-fico status-submit', onclick: () => location.assign('/auth/login'), textContent: '로그인' }
					]}
				]}
			]}
		]
	}

	$(document).on('show.bs.modal', '#done-info-modal', function(e) {
		const button = e.relatedTarget;
		const memberShipInfoDiv = button.closest('.membership-info-parent');
		const iid = memberShipInfoDiv.querySelector('.iid').value;
		const itemName = memberShipInfoDiv.querySelector('.membership-info .name').value;
		const price = memberShipInfoDiv.querySelector('.membership-info .price').innerHTML;
		
		orderItemList = [iid];
		$(this).find('.btn-close').show();
		this.querySelector('.payment-info .name').innerHTML = itemName.replace(/(-.+)/,'<span class="d-inline-block">$1</span>');
		this.querySelector('.payment-info .price').innerHTML = price;
		$('#totalAmount').val(price.replace(/\D/g,''));
		
		if(loggedin) {
			$('#phase-1,#phase-2').collapse('toggle');
		}
	})
	// 모달이 닫힐 때 초기화
	.on('hide.bs.modal', '#done-info-modal', function(e) {
		$('#phase-2 .progress-bar').attr('aria-valuenow', 0);
		clearTimeout(nextTimer);
		document.querySelector('#phase-1 form').classList.remove('was-validated')
		document.querySelector('#phase-1 form').reset();
		$('#inputEmail').trigger('input');
		document.querySelector('#phase-3 form').reset();
		$('#donationModalLabel').text('후원자 정보');
		$('#phase-2 [data-bs-toggle=collapse]').prop('disabled', true);
		$('#phase-2,#phase-3').collapse('hide');
		$('#phase-1').collapse('show');
	});
	
	$(document).on('click', '#closeDonation', function() {
		if(confirm('가입 진행을 취소하시겠습니까?\n진행 중이던 정보는 저장되지 않습니다.')) 
			$('#done-info-modal').modal('hide');
	})
	.on('click', '#cancelPayment', function() {
		if(confirm('입금 대기 및 처리 중입니다. 가입을 취소하시겠습니까?')) {
			$('#phase-2 .progress-bar').attr('aria-valuenow', 0);
			clearTimeout(nextTimer);
			$('#phase-1,#phase-2').collapse('toggle');
			$('#done-info-modal').modal('hide');
		} 
	})
	
	// phase-1 시작
	.on('show.bs.collapse', '#phase-1', function() {
	   $('#done-info-modal .btn-close').show();
	   $('#donationModalLabel').text('후원자 정보');
	})
	
	// 이메일 중복검사
	.on('input', '#inputEmail', function() {
		if(this.value != $('.check-email-input').val())
			$('.check-email-input').val('');
		$('.check-email-btn').prop('disabled', !this.checkValidity())
	})
	.on('click', '.check-email-btn', function() {
		const email = $('#inputEmail').val();
		// 이메일 중복검사(ajax)-----------------------------------
		$.getJSON('/membership/email/check', {email}, result => {
			$('.check-email-input').val(result ? '' : email).trigger('input');
			$('#paymentForm').addClass('was-validated');
			if(result) $('.check-modal-section').modal('show');
			else alert('사용가능한 E-mail입니다. 가입 진행을 계속해 주세요.');
		});
		// ----------------------------------------------------
	})
	.on('input', '#phase-1 input', function() {
		const form = this.form;
		const submitBtn = form.querySelector('[type="submit"]');
		if(Array.from(form.querySelectorAll('input')).every(input => input.checkValidity())) {
			submitBtn.toggleAttribute('disabled', false);
			$(submitBtn).bounce();
		}else submitBtn.toggleAttribute('disabled', true);
	})
	
	// 후원자 정보 임시전송
	.on('submit', '#phase-1 form', function(e) {
		e.preventDefault();
		const data = Object.fromEntries(new FormData(this).entries());
		if(this.checkValidity()) {
			postJSON('/temp/membership',data, () => {
				$('#phase-1,#phase-2').collapse('toggle');
			}, 
			'가입 처리 중 오류가 발생하였습니다.\nteamoldbyte@gmail.com 로 문의 바랍니다.');
		}
	})
	
	// phase-2 시작
	.on('show.bs.collapse', '#phase-2', function() {
		$('#done-info-modal .btn-close').hide();
		$('#donationModalLabel').text('송금을 진행해주세요.');
		clearInterval(nextTimer);
		let progress = Number($('#phase-2 .progress-bar').attr('aria-valuenow'));
		if(progress < 100) {
			nextTimer = setInterval(() => {
				if(progress < 100) {
					progress++;
					$('#phase-2 .progress-bar').attr('aria-valuenow', progress)
											.width(`${progress}%`);
					$('#phase-2 [data-bs-toggle=collapse]').prop('disabled', true);
				}else {
					$('#phase-2 [data-bs-toggle=collapse]').prop('disabled', false);
				}
			}, 1000);
		}
	})
	// phase-2 완료
	
	// phase-3 시작
	.on('show.bs.collapse', '#phase-3', function() {
		if(loggedin) {
			$('[name="passwd"]').removeAttr('name');
			$('#membershipForm').submit();
			return;
		}
		$('#donationModalLabel').text('회원가입 정보');
		
		// 송금자, 이메일 정보 phase-2에서 획득
		this.querySelector('[name="remitter"]').value 
		= this.querySelector('[name="name"]').value = $('#inputName').val().trim();
		this.querySelector('[name=email]').value = $('#inputEmail').val().trim();
		this.querySelector('[name=phone]').value = $('#inputPhone').val().trim();
	})
	// 비밀번호 입력시 확인패턴도 변경
	.on('input', '#passwd', function() {
		document.getElementById('passwdCheck').setAttribute('pattern',this.value);
	})
	// phase-3 완료
	.on('submit', '#membershipForm', function(e) {
		e.preventDefault();
		const data = Object.fromEntries(new FormData(this).entries());
		if(this.checkValidity()) {
			data["orderItemList"] = orderItemList;
			postJSON('/membership',data, msg => {
				alert(msg + '\n\'확인\'을 누르면 ' + (loggedin?'메인':'로그인') +' 화면으로 이동합니다.');
				location.assign(loggedin?'/':'/auth/login');
				//$('#done-info-modal').modal('hide');
			}, '가입 처리 중 오류가 발생하였습니다.\nteamoldbyte@gmail.com 로 문의 바랍니다.');
		}
	});
	
	document.querySelector('.membership-section').appendChild(createElement(donationModalJson));
	document.querySelector('.tandem-layout-content-section').appendChild(createElement([desktopInfoMOdalJson, emailDuplicateModalJson]))
}
/**
AJAX 전송 단축함수
*/
function postJSON(url, jsonCommand, callback, failMsg) {
	$.ajax({
		url: url, type: 'POST', data: JSON.stringify(jsonCommand),
		contentType: 'application/json', success: callback,
		error: () => {
			alert(failMsg);
			$('#done-info-moal').modal('hide');
		}
	});
}	
