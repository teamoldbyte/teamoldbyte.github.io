/** /membership/add_membership.html
@author LGM
 */
function pageinit(membershipCommand) {
	const loggedin = membershipCommand.mid != 0;
	let nextTimer; 
	let orderItemList = [];
	
/*	const donationModalJson = {
		el: 'div', id: 'done-info-modal', className: 'modal fade done-info-modal', tabIndex: '-1',
		'data-bs-backdrop': 'static', 'data-bs-keyboard': 'false', 'aria-labelledby': 'donationModalLabel', ariaHidden: 'true', children: [
			{ el: 'div', className: 'modal-dialog modal-dialog-centered', children: [
				{ el: 'div', className: 'modal-content shadow', children: [
					{ el: 'div', className: 'modal-header', children: [
						{ el: 'h5', id: 'donationModalLabel', className: 'modal-title text-lmd fw-bold w-100 text-center', textContent: '입금자 정보' },
						{ el: 'button', type: 'button', id: 'closeDonation', className: 'btn-close position-absolute top-3 end-3' }
					]},
					{ el: 'div', className: 'modal-body', children: [
						// 후원자 정보 입력
						{ el: 'div', id: 'phase-1', className: 'payment-phase input-form-section border-0 collapse show', children: [
							{ el: 'form', id: 'paymentForm', className: 'needs-validation', noValidate: true, children: [
								{ el: 'div', className: 'input-name row g-3 align-items-center mb-3', children: [
									{ el: 'div', className: 'col-3 col-md-2 text-end mb-auto', children: [
										{ el: 'label', htmlFor: 'inputName', className: 'col-form-label text-smd fw-bold', textContent: '입금자명' }
									]},
									{ el: 'div', className: 'col-9 col-md-10 position-relative', children: [
										{ el: 'input', type: 'text', id: 'inputName', name: 'remitter', maxLength: 10, value: membershipCommand.remitter != 'fico' ? membershipCommand.remitter : '', autocomplete: 'off', className: 'form-control', 'aria-describedby': 'nameHelpInline', pattern: '[가-힣]{2,}', required: true },
										{ el: 'div', className: 'invalid-feedback', innerHTML: '&nbsp;&nbsp;이름을 한글로 올바르게 입력해 주십시오.' }
									]},
									{ el: 'div', className: 'help-text-section col-9 col-md-10 ms-auto my-0', children: [
										{ el: 'span', id: 'nameHelpInline', className: 'form-text ms-0 ms-lg-2', textContent: '송금 때 사용하실 송금자명과 동일한 이름으로 입력해 주십시오.' }
									]}
								]},
								{ el : 'div', className: 'input-phone row g-3 align-items-center mb-3', children: [
									{ el: 'div', className: 'col-3 col-md-2 text-end mb-auto', children: [
										{ el: 'label', htmlFor: 'inputPhone', className: 'col-form-label text-smd fw-bold', textContent: '전화번호' }
									]},
									{ el: 'div', className: 'col-9 col-md-10 position-relative', children: [
										{ el: 'input', type: 'text', id: 'inputPhone', name: 'phone', className: 'form-control', placeholder: '예) 01012345678', autocomplete: 'off', pattern: '[0-9]{8,11}', value: membershipCommand.phone, 'aria-describedby': 'phoneHelpInline', required: true },
										{ el: 'div', className: 'invalid-feedback', innerHTML: '&nbsp;&nbsp;올바른 전화번호를 입력해 주십시오.' }
									]},
									{ el: 'div', className: 'help-text-section col-9 col-md-10 ms-auto my-0', children: [
										{ el: 'span', id: 'phoneHelpInline', className: 'form-text ms-0 ms-lg-2', textContent: '전화번호는 암호화 되니 반드시 숫자로 입력해 주십시오.' }
									]}
								]},
								{ el: 'div', className: 'input-email row g-3 align-items-center mb-3', children: [
									{ el: 'div', className: 'col-3 col-md-2 text-end mb-auto', children: [
										{ el: 'label', htmlFor: 'inputEmail', className: 'col-form-label text-smd fw-bold', textContent: '이메일' }
									]},
									{ el: 'div', className: 'col-9 col-md-7 position-relative', children: [
										{ el: 'input', type: 'email', id: 'inputEmail', name: 'email', value: membershipCommand.email, className: 'form-control', 'aria-describedby': 'emailHelpInline', maxlength: 100, autocomplete: 'off', required: true },
										{ el: 'div', className: 'invalid-feedback', innerHTML: '&nbsp;&nbsp;올바른 이메일을 입력해 주십시오.' }
									]},
									{ el: 'div', className: 'd-none d-md-block col-12 col-md-3 text-end mb-auto', children: [
										{ el: 'input', type: 'email', className: 'check-email-input form-control d-none', value: membershipCommand.email, required: true, maxlength: 100},
										{ el: 'button', type: 'button', className: 'check-email-btn btn btn-outline-fico', disabled: true, textContent: '중복 검사' }
									]},
									{ el: 'div', className: 'help-text-section col-9 col-md-10 ms-auto my-0', children: [
										{ el: 'span', id: 'emailHelpInline', className: 'form-text ms-0 ms-lg-2', textContent: '생성될 계정의 이메일을 입력해 주십시오.' }
									]},
									{ el: 'div', className: 'd-block d-md-none col-9 text-end mb-auto ms-auto mt-1', children: [
										{ el: 'input', type: 'email', className: 'check-email-input form-control d-none', value: membershipCommand.email, required: true, maxlength: 100},
										{ el: 'button', type: 'button', className: 'check-email-btn btn btn-outline-fico w-100', disabled: true, textContent: '중복 검사' }
									]}
								]},
								// 동의 체크
								
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
									{ el: 'span', className: 'account-num pe-1', textContent: '3333-33-2062712' },
									{ el: 'input', type: 'hidden', id: 'accountNum', value: '3333-33-2062712' },
									{ el: 'button', className: 'btn btn-warning btn-copy far fa-copy', onclick: () => window.navigator.clipboard.writeText($('#accountNum').val()),
										'data-bs-container': 'body', 'data-bs-toggle': 'popover', 'data-bs-placement': 'top', 'data-bs-content': 'copied', textContent: '복사' },
									{ el: 'span', className: 'name d-block', textContent: '[예금주: 강한별]' }
								]}
							]},
							{ el: 'div', className: 'progress', children: [
								{ el: 'div', className: 'progress-bar progress-bar-striped progress-bar-animated', role: 'progressbar', 'aria-valuenow': '0', 'aria-valuemin': '0', 'aria-valuemax': '100' }
							]},
							{ el: 'div', className: 'button-section text-center position-relative pt-3', children: [
								{ el: 'button', type: 'button', id: 'cancelPayment', className: 'btn btn-outline-fico position-absolute top-2 start-0', textContent: '취소' },
								{ el: 'span', className: 'waiting-msg placeholder-wave', textContent: '결제 대기 및 처리 중입니다...' },
								{ el: 'span', className: 'mt-3 d-block text-warning text-sm', innerHTML: '처리가 완료될 때까지 이 창을 닫지 마십시오' },
								{ el: 'button', type: 'button', className: 'btn btn-fico position-absolute top-2 end-0', 'data-bs-toggle': 'collapse', 'data-bs-target': '#phase-2,#phase-3', disabled: true, textContent: '다음' }
							]}
						]},
						// PHASE 3
						{ el: 'div', id: 'phase-3', className: 'payment-phase input-form-section border-0 collapse', children: [
							{ el: 'form', id: 'membershipForm', className: 'needs-validation', action: '/membership', method: 'post', noValidate: true, children: 
								Array.from(['mid','phone','remitter','totalAmount','memberRoleName'], att => { 
									return { el: 'input', type: 'hidden', id: att, name: att, value: membershipCommand[att]??'' }}).concat([
										{ el: 'div', className: 'input-email row g-3 align-items-center mb-3', children: [
											{ el: 'div', className: 'col-3 col-md-2 text-end mb-auto', children: [
												{ el: 'label', className: 'col-form-label text-smd fw-bold', textContent: '이메일' }
											]},
											{ el: 'div', className: 'col-9 col-md-10 position-relative', children: [
												{ el: 'input', type: 'email', name: 'email', className: 'form-control', value: membershipCommand.email, 'aria-describedby': 'emailHelpInline', required: !loggedin, readOnly: true, maxlength: 100 },
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
												{ el: 'input', type: 'password', className: 'form-control', id: 'passwd', name: 'passwd', autocomplete: 'off', 'aria-describedby': 'passwordHelpInline', required: !loggedin, pattern: ".{8,16}"},
												{ el: 'div', className: 'invalid-feedback', innerHTML: '&nbsp;&nbsp;8~16자의 영문 대소문자, 숫자, 특수문자만 가능합니다.' }
											]},
											{ el: 'div', className: 'help-text-section col-9 col-md-10 ms-auto my-0', children: [
												{ el: 'span', id: 'passwordHelpInline', className: 'form-text ms-2', textContent: '생성될 계정의 비밀번호를 입력해 주십시오.' }
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
												{ el: 'span', id: 'passwdCheckHelpInline', className: 'form-text ms-2', textContent: '위에서 입력한 비밀번호를 한번 더 입력해 주십시오.'}
											]}
										]},
										{ el: 'div', className: 'input-name row g-3 align-items-center mb-3', children: [
											{ el: 'div', className: 'col-3 col-md-2 text-end mb-auto', children: [
												{ el: 'label', className: 'col-form-label text-smd fw-bold', textContent: '이름' }
											]},
											{ el: 'div', className: 'col-9 col-md-10 position-relative', children: [
												{ el: 'input', type: 'text', name: 'name', value: membershipCommand.name, className: 'form-control', 'aria-describedby': 'nameHelpInline', required: !loggedin, maxlength: 10, pattern: '[가-힣]{2,}'},
												{ el: 'div', className: 'invalid-feedback', innerHTML: '&nbsp;&nbsp;이름을 한글로 올바르게 입력해 주십시오.' }
											]},
											{ el: 'div', className: 'help-text-section col-9 col-md-10 ms-auto my-0', children: [
												{ el: 'span', id: 'nameHelpInline', className: 'form-text ms-2', textContent: '계정 소유자의 이름을 입력하십시오.' }
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
												{ el: 'div', className: 'invalid-feedback', innerHTML: '&nbsp;&nbsp;성별을 선택해 주십시오.'}
											])
											},
											{ el: 'div', className: 'help-text-section col-9 col-md-10 ms-auto my-0', children: [
												{ el: 'span', id: 'sexHelpInline', className: 'form-text ms-2', textContent: '성별을 선택해 주십시오.'}
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
												const year = new Date().getFullYear() - 101 + k;
												return { el: 'option', value: year, textContent: year, selected: membershipCommand.birthYear == year}
											}).reverse())}
											]},
											{ el: 'div', className: 'help-text-section col-9 col-md-10 ms-auto my-0', children: [
												{ el: 'span', id: 'birthHelpInline', className: 'form-text ms-2', textContent: '학습 컨텐츠 추천을 위해 출생연도를 입력해 주십시오.'}
											]}
										]},
										// 동의 체크
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
*/
/*	const desktopInfoMOdalJson = {
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
	};*/

/*	const emailDuplicateModalJson = {
		el: 'div', id: 'check-modal', className: 'check-modal-section modal fade', tabIndex: '-1', 'data-bs-backdrop': 'static', children: [
			{ el: 'div', className: 'modal-dialog modal-dialog-centered', children: [
				{ el: 'div', className: 'modal-content border-0', children: [
					{ el: 'div', className: 'modal-header bg-fc-purple', children: [
						{ el: 'h5', className: 'modal-title text-white col-10', textContent: '이메일 중복 검사' },
						{ el: 'button', type: 'button', className: 'btn-close', 'data-bs-dismiss': 'modal', ariaLabel: 'Close' }
					]},
					{ el: 'div', className: 'modal-body', children: [
						{ el: 'p', style: 'margin-left: 3.0rem;', children: [
							'해당 E-mail은 이미 ', { el: 'b', className: 'app-name-text', textContent: 'fico' }, { el: 'b', textContent: ' 계정'}, '으로 등록되어 있습니다.', { el: 'br'}, 
							{ el: 'br'},
							'▪ ', { el: 'b', className: 'text-fc-red', textContent: 'DONATION 혹은 골드 멤버십' }, ' 가입한 적이 있는 경우', { el: 'br'}, 
							{ el: 'b', style: 'margin-left: 1.25rem;', textContent: '로그인 > 마이페이지 > Purchase History' }, '에서 연장해 주세요.',{ el: 'br'}, 
							{ el: 'br'}, 
							'▪ ', { el: 'b', className: 'text-fc-red', textContent: '파트너스 클래스 멤버십' }, ' 회원인 경우', { el: 'br'}, 
							{ el: 'b', style: 'margin-left: 1.25rem;', textContent: '로그인 > 멤버십 페이지' }, '에서 골드 멤버십 가입을 해 주세요.', { el: 'br'},  
							{ el: 'br'}, 
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
	}*/
	
	// 멤버십 목록 월/연 토글 동작
	$('.membership-item-list-section .toggle-block').on('click', '.monthly,.yearly', function() {
		if($(this).is('.monthly.is-monthly,.yearly.is-yearly')) return;
		// 목록에 나타난 카드들의 월/연 클래스명 토글
		$(this).siblings().add(this).add('.membership-item-list-section .membership-item-block').toggleClass('is-monthly is-yearly')
		// 골드멤버십의 월/연 가격 토글
		$('.membership-item-block.gold-membership .price-block').toggle();
	})

	// [모바일] 선택한 골드멤버십에 따른 표시 전환
	$('.membership-item-block.gold-membership .toggle-block').on('click', '.monthly,.yearly', function() {
		const isMonthly = $(this).is('.monthly');
		const $itemBlock = $(this).closest('.membership-item-block');
		$itemBlock.find('.toggle-block').find('.monthly,.yearly').toggleClass('is-monthly', isMonthly).toggleClass('is-yearly', !isMonthly);
		$itemBlock.find('.price-block.monthly').toggle(isMonthly);
		$itemBlock.find('.price-block.yearly').toggle(!isMonthly);
		
		$itemBlock.find('.iid').val(this.dataset.iid);
		$itemBlock.find('.item-full-name').val(this.dataset.itemName);
		$itemBlock.find('.item-real-price').val(this.dataset.price);
	});
//	const tossPayments = TossPayments(clientKey);
	$(document).on('show.bs.modal', '#done-info-modal', function(e) {
		const button = e.relatedTarget;
		const $memberShipInfoDiv = $(button).closest('.membership-item-block').find('.price-block:visible');
		const iid = $memberShipInfoDiv.find('.iid').val();
		const itemName = $memberShipInfoDiv.find('.item-full-name').val();
		const price = $memberShipInfoDiv.find('.item-real-price').val();
		
		orderItemList = [iid];
		$(this).find('.btn-close').show();
//		this.querySelector('.payment-info .name').innerHTML = itemName.replace(/(-.+)/,'<span class="d-inline-block">$1</span>');
//		this.querySelector('.payment-info .price').innerHTML = price;
		$('#totalAmount').val(price.replace(/\D/g,''));
		$('#orderName').val(itemName);
		// 이미 로그인한 경우(회원임) 이메일 고정.
		$('#phase-1 form').toggleClass('was-validated', loggedin);
		$('#passwd,#passwdCheck').prop('required', !loggedin).prop('readonly', loggedin);
		if(loggedin) {
			$('.check-email-btn').prop('disabled', true);
			$('#inputName').val(membershipCommand.remitter != 'fico' ? membershipCommand.remitter : '');
			$('#inputPhone').val(membershipCommand.phone);
			$('#inputEmail,.check-email-input').val(membershipCommand.email);
			$('#inputEmail').prop('readonly', loggedin);
			
			Array.from(['mid','phone','remitter','memberRoleName'], att => {
				$(`#${att}`).val(membershipCommand[att??'']);
			});
			$(`[name="sex"][value="${membershipCommand.sex}"]`).prop('checked', true);
			$(`.input-birth option[value="${membershipCommand.birthYear}"]`).prop('selected', true);
			
			$('#phase-1 form :submit').prop('disabled', !$('#membershipForm')[0].checkValidity());
			if(membershipCommand.remitter != 'fico') {
				$('#phase-1 form :submit').trigger('click');
			}
		}
	})
	// 모달이 닫힐 때 초기화
	.on('hide.bs.modal', '#done-info-modal', function(e) {
		clearTimeout(nextTimer);
		$('#phase-1 form').removeClass('was-validated');
		FicoPaymentHandler?.destroy();
				
		if(!loggedin) $('#phase-1 form')[0].reset();
		$('#inputEmail').trigger('input');
		$('#donationModalLabel').text('회원 정보 입력');
		$('#phase-2 [data-bs-toggle=collapse]').prop('disabled', true);
		$('#phase-2,#phase-3').collapse('hide');
		$('#phase-1').collapse('show');
	});
	
	$(document).on('click', '#closeDonation', function() {
		confirmModal('가입 진행을 취소하시겠습니까?\n진행 중이던 정보는 저장되지 않습니다.', 
		() => $('#done-info-modal').modal('hide'));
	})
	
	// phase-1 시작
	.on('show.bs.collapse', '#phase-1', function() {
	   $('#done-info-modal .btn-close').show();
//	   $('#donationModalLabel').text('입금자 정보');
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
			else alertModal('사용가능한 E-mail입니다. 가입 진행을 계속해 주세요.');
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
	.on('input', '#inputName', function() {
		$(this).toggleClass('is-invalid', this.value.trim() == 'fico');
		if(this.value.trim() == 'fico') {
			alertModal('사용할 수 없는 이름입니다.');
		}
	})
	
	// 후원자 정보 임시전송
	.on('submit', '#phase-1 form', function(e) {
		e.preventDefault();
		const submitter = e.originalEvent.submitter;
		this.querySelector('[name="remitter"]').value 
				= this.querySelector('[name="name"]').value = $('#inputName').val().trim();
				this.querySelector('[name=email]').value = $('#inputEmail').val().trim();
				this.querySelector('[name=phone]').value = $('#inputPhone').val().trim();
		const data = Object.fromEntries(new FormData(this).entries());
		if(this.checkValidity()) {
			submitter.disabled = true;
			$('#order-processing').show();
			$('#payment-methods, #phase-2 :submit').hide()
			$('#phase-1,#phase-2').collapse('toggle');
			data["orderItemList"] = orderItemList;
			$.ajax({
				url: '/membership/order', type: 'POST', data: JSON.stringify(data),
				contentType: 'application/json',
				success: async ({memberId56, orderId56}) => {
					await FicoPaymentHandler.renderWidget('#payment-methods', {
						orderId: orderId56, orderName: $('#orderName').val(),
						amount: parseInt($('#totalAmount').val()),
						customerKey: memberId56, 
						customerName: $('#inputName').val(),
						customerEmail: $('#inputEmail').val(),
						customerMobilePhone: $('#phone').val(),
					});
					
					$('#order-processing').hide();
					$('#payment-methods, #phase-2 :submit').show();
				},
				error: () => {
					alertModal('가입 처리 중 오류가 발생하였습니다.\nteamoldbyte@gmail.com 로 문의 바랍니다.', () => $('#done-info-moal').modal('hide'))
				},
				complete: () => submitter.disabled = false
			});				
		}
	})
	.on('click', '#phase-2 :submit', function() {
		FicoPaymentHandler.requestPayment();	
	})
	
	// phase-2 시작
	.on('show.bs.collapse', '#phase-2', function() {
		$('#donationModalLabel').text('결제')
	})
	// 비밀번호 입력시 확인패턴도 변경
	.on('input', '#passwd,#passwdCheck', function() {
		if(this.closest('form').matches('.was-validated')) {
			$('#passwdCheck').toggleClass('is-invalid', $('#passwd').val() != $('#passwdCheck').val());
		}
	})
	
	// 필요 모달 html 호출하여 렌더링
	$.get('https://static.findsvoc.com/fragment/membership/incl/order_modal.html', fragment => {
		const $wrapper = $('<div>').append(fragment);
		
		// 올해를 기준으로 출생년도 목록 세팅
		const $birthSelect = $wrapper.find('.input-birth select');
		const currentYear = new Date().getFullYear();
		const startYear = currentYear - 14;
		const endYear = currentYear - 101;
		const length = startYear - endYear + 1;
		Array.from({ length }, (_, i) => {
			$birthSelect.append(`<option value="${startYear - i}">${startYear - i}</option>`);
		});
		// 출생년도 기본 선택은 없음으로
		$birthSelect.find('option[disabled]').prop('selected', true)

		$('.membership-section').append($wrapper.find('#done-info-modal'));
		$('.tandem-layout-content-section').append($wrapper.find('#check-modal'));
	}, 'html');
}
