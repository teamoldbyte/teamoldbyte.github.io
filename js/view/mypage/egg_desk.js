/** /mypage/egg_desk.html
 * @author LGM
 */
function pageinit(tray, normalNumber, goldNumber) {
	/** 교환가치 비율 */
	const _EGG_EX_RATIOS = [0.0016, 0.0025, 0.005, 0.01, 0.05, 0.25, 0.5, 1, 2];
	/** 현재 최고 인덱스 번호 */
	const _CURR_EGG_MAX_INDEX = tray.findLastIndex((n,i) => n > 0 && i < 9);
	/** 교환 총량 미리보기 */
	const resultCounter = $('.egg-value-point').get(0);
	/** 교환 총량 실질값 비리보기 */
	const resultDigitCounter = $('.available-egg-count').get(0);
	/** 에그 슬라이더 라벨 리스트 */
	const eggRangeSection = $('.egg-icon-list').get(0);
	/** 교환 실행 버튼 */
	const exchangeBtn = $('#exchangeBtn').on('click', function() {
		confirmModal('선택하신 구간 내의 모든 에그를 골드에그로 교환합니다. \n계속하시겠습니까?', () => {
			$('#exchangeForm').submit();
		});
	}).get(0);
	
	// 초기값 계산
	calcExchangeableEggs(10);
	// 슬라이더 최대 범위 설정
	$('#egg-range').val(_CURR_EGG_MAX_INDEX);
	
	// 총 9개의 에그 그리기
	const eggCountDOMs = [];
	tray.filter((_num,i) => i < 9).forEach((num, i) => {
		eggCountDOMs.push({
			el: 'label', className: `egg-label egg-${i+1}${i > _CURR_EGG_MAX_INDEX ? ' uncollected':''}`, 
			'data-value': num, children: [
				{ el: 'i', className: 'fas fa-egg egg-icon' },
				{ el: 'span', className: 'egg-count', textContent: num.toLocaleString() }
			]
		});
	});
	eggRangeSection.appendChild(createElement(eggCountDOMs));
	
	// 슬라이더를 움직이면 교환 갯수 재계산
	let prevRange = _CURR_EGG_MAX_INDEX;
	$('#egg-range').on('input', function() {
		if(this.value > _CURR_EGG_MAX_INDEX) this.value = _CURR_EGG_MAX_INDEX;
		if(prevRange == this.value) return;
		else prevRange = this.value;
		// 현재값으로 다시 계산
		$(`.egg-icon:eq(${parseInt(this.value)+1})`).bounce();
		calcExchangeableEggs(this.value);
	})
	
	/**
	 * @param maxIndex 마지막 인덱스(from 0, maxIndex 포함)
	 */
	function calcExchangeableEggs(maxIndex) {
		let estimatedBalance = 0;
		for(let i = 0, len = Math.min(maxIndex, _CURR_EGG_MAX_INDEX) + 1; i < len; i++) {
			estimatedBalance += tray[i] * _EGG_EX_RATIOS[i];
		}
		anime({
			targets: resultCounter,
			textContent: estimatedBalance,
			round: 10000,
			duration: 500
		})
		anime({
			targets: resultDigitCounter,
			textContent: Math.floor(estimatedBalance),
			duration: 750,
			round: 1
		})
		exchangeBtn.disabled = estimatedBalance < 1;
	}	
	
	//--------------------------------------------------------------------------
	//			바 우 처 구 매
	//--------------------------------------------------------------------------
	const voucherOrderModalJson = {
		el: 'div', id: 'voucherOrderModal', className: 'modal fade done-info-modal', tabIndex: '-1',
		'data-bs-backdrop': 'static', 'data-bs-keyboard': 'false', 'aria-labelledby': 'voucherOrderModalLabel', ariaHidden: 'true', children: [
			{ el: 'div', id: 'done-info-modal', className: 'modal-dialog modal-dialog-centered', children: [
				{ el: 'div', className: 'modal-content shadow', children: [
					{ el: 'div', className: 'modal-header', children: [
						{ el: 'h5', id: 'voucherOrderModalLabel', className: 'modal-title text-lmd fw-bold w-100 text-center', textContent: '송금을 진행해 주세요.' },
						{ el: 'button', type: 'button', className: 'btn-close position-absolute top-3 end-3', 'data-bs-dismiss': 'modal' }
					]},
					{ el: 'div', className: 'modal-body', children: [
						// 2. 구매상품 및 가격 안내
						{ el: 'div', id: 'phase-2', className: 'payment-phase collapse show', children: [
							{ el: 'div', className: 'payment-info text-center', children: [
								{ el: 'p', children: [
									{ el: 'span', className: 'name fw-bold' },
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
									{ el: 'span', className: 'account-num px-1', textContent: '3333-04-8952631' },
									{ el: 'input', type: 'hidden', id: 'accountNum', value: '3333-04-8952631' },
									{ el: 'button', className: 'btn btn-warning btn-copy far fa-copy', onclick: () => window.navigator.clipboard.writeText('3333-04-8952631'),
										'data-bs-container': 'body', 'data-bs-toggle': 'popover', 'data-bs-placement': 'top', 'data-bs-content': 'copied', textContent: '복사' },
									{ el: 'span', className: 'name d-block', textContent: '[예금주: 이승렬]' }
								]}
							]},
							{ el: 'div', className: 'progress', children: [
								{ el: 'div', className: 'progress-bar progress-bar-striped progress-bar-animated', role: 'progressbar', 'aria-valuenow': '0', 'aria-valuemin': '0', 'aria-valuemax': '100' }
							]},
							{ el: 'div', className: 'button-section text-center position-relative pt-3', children: [
								{ el: 'button', type: 'button', className: 'btn btn-outline-fico position-absolute top-2 start-0', 'data-bs-dismiss': 'modal', textContent: '취소' },
								{ el: 'span', className: 'waiting-msg placeholder-wave', textContent: '결제 대기 및 처리 중입니다...' },
								{ el: 'span', className: 'd-block text-danger text-sm', innerHTML: '입금을 하시고 나면<br> 창을 끄지 말고 \'완료\'를 눌러주세요.' },
								{ el: 'button', type: 'button', id: 'purchaseVoucher', className: 'btn btn-fico position-absolute top-2 end-0', disabled: true, textContent: '완료' }
							]}
						]}
					]}
				]}
			]}
		]
	}	

	
	// 바우처 선택 활성화 표시
	$(document).on('click', '.gold-egg-voucher', function() {
		$(this).addClass('selected').siblings('.gold-egg-voucher').removeClass('selected');
		$('#openVoucherOrder').prop('disabled', false);
	});
	
	let anim; // 결제 진행바 애니메이션
	// 바우처 선택->구매창 표시
	$('#openVoucherOrder').click(function() {
		const $selectedVoucher = $('.gold-egg-voucher.selected');
		
		
		if(!document.getElementById('voucherOrderModal')) {
			document.body.appendChild(createElement(voucherOrderModalJson));
			anim = anime({
				targets: '#voucherOrderModal .progress-bar',
				duration: 100000, round: 1, width: ['0%', '100%'], autoplay: false, easing: 'cubicBezier(.5,.6,.5,.4)',
				complete: () => $('#purchaseVoucher').prop('disabled', false)
			})
			$('#voucherOrderModal').on('hide.bs.modal', function() {
				$('#purchaseVoucher').prop('disabled', true)
				anim.pause();
				anim.seek(0);
			})
		}
		$('#voucherOrderModal .payment-info .name').text($selectedVoucher.find('.description').text());
		$('#voucherOrderModal .payment-info .price').text($selectedVoucher.find('.price').text());
		$('#voucherOrderModal').modal('show');
		anim.play();
	});
	
	// 바우처 구매 완료
	$(document).on('click', '#purchaseVoucher', function() {
		const $selectedVoucher = $('.gold-egg-voucher.selected');
		const itemId = parseInt($selectedVoucher.find('input[name="iid"]').val());
		$('#voucherForm [name=itemId]').val(itemId);
		const eggCount = parseInt($selectedVoucher.find('.egg-count').text());
		
		$('#voucherForm').append(createElement({ el: 'input', type:'hidden', name: 'eggCount', value: eggCount }));
		$('#voucherForm').submit();
	});
	
	// 세로방향 휴대폰일 때에만 스와이프 적용
	if(devSize.isPhone()) {
		const voucherGallery = $('.voucher-list').get(0),
			slideWidth = voucherGallery.offsetWidth * 0.85,
			slidesOffset = voucherGallery.offsetWidth * 0.075;
		$('.voucher-list').addClass('swiper');
		$('.voucher-list-wrapper').addClass('swiper-wrapper').removeClass('row')
			.after(createElement([
				{ el: 'div', className: 'swiper-pagination position-relative bottom-0' },
				{ el: 'div', className: 'swiper-button-prev', tabIndex: 0, role: 'button', ariaLabel: 'Prev slide' },
				{ el: 'div', className: 'swiper-button-next', tabIndex: 0, role: 'button', ariaLabel: 'Next slide' }
			]));
		$('.gold-egg-voucher').addClass('swiper-slide');
		
		
		new Swiper('.voucher-list',{
			loop: true,
			pagination: {
				el: '.swiper-pagination'
			},
			initialSlide: 1,
			width: slideWidth,
			slidesOffsetBefore: slidesOffset,
			centeredSlides: true,
			spaceBetween: 10,
			navigation: {
			    nextEl: '.swiper-button-next',
			    prevEl: '.swiper-button-prev',
 			},
 			on: {
				slideChange: (swiper) => {
					$(swiper.slides[swiper.activeIndex]).trigger('click');
				} 
			}
		});
	}	
}
