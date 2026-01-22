/**
 * /mypage/list_order.html
 */
$(function() {
	$(document)
	// 주문 상세 보기(동시에 환불 내역 조회)
	.on('show.bs.collapse', '.js-list-refund', function() {
		const _this = this;
		const $orderBlock = $(this).closest('.order-detail-block');
		const orderId = this.dataset.orderId;
		$.getJSON(`/order/refund/list/${orderId}`, function(refundList) {
			$(_this).addClass('listed')
			const $refundListDiv = $orderBlock.find('.refund-list');
			// 요청된 순서대로 표시
			refundList.sort((a, b) => a.rid - b.rid);
			displayRefundList($refundListDiv, refundList);
			
			// 환불 요청 중인 아이템들은 환불 요청 가능 대상에서 제외
			refundList.filter(r => r.status == 'R').forEach((refund) => {
				$orderBlock.find(`.js-refund-checkbox[value=${refund.orderLineItem.lid}]`)
				.prop('disabled', true);
			})
			// 환불 요청 대상이 없으면 환불 요청 버튼 자체를 비활성화
			if($orderBlock.find('.js-refund-checkbox:enabled').get().length == 0) {
				$orderBlock.find('.js-open-refund-request').prop('disabled', true);
			}
			$(_this).removeClass('js-list-refund');
		});
	})
	// 환불 요청
	.on('click', '.js-open-refund-request', function() {
		const _this = this;
		const $orderDetailBlock = $(this).closest('.order-detail-block');
		if(!$(this).is('.selecting')) {
			$orderDetailBlock.find('.refund-checkbox').show().each((_, el) => $(el).find('.js-refund-checkbox').prop('checked', false));
			$orderDetailBlock.find('.js-cancel-refund-select').show();
			$(this).addClass('selecting');
			return;
		}
		const orderId = parseInt(this.dataset.orderId);
		const refundItemMap = Object.create(null);
		const orderLineItemIdList = [];
		$orderDetailBlock.find('.js-refund-checkbox:checked').each((_, el) => {
			// 환불 요청 결과에는 OrderLineItem 및 Item의 정보가 없기 때문에 직접 할당
			const $itemBlock = $(el).closest('.order-line-item-block');
			const orderLineItemId = parseInt(el.value);
			const name = $itemBlock.find('.item-name').text().trim();
			const quantity = parseInt($itemBlock.find('.quantity').text());
			refundItemMap[orderLineItemId] = {name, quantity};
			orderLineItemIdList.push(orderLineItemId);
		});
		if(orderLineItemIdList.length == 0) {
			alertModal('환불 요청할 상품을 선택해 주세요.');
			return;
		}
		confirmModal('<p>환불을 요청하시겠습니까?</p>'
			+ '<input type="textarea" id="inputRefundReason" class="form-control" placeholder="환불사유" style="resize:none;">',
			function() {
				const reason = $('#inputRefundReason').val();
				if(reason) {
					$orderDetailBlock.find('.refund-checkbox,.js-cancel-refund-select').hide();
					$(_this).removeClass('selecting');
					$.ajax({
						type: 'POST',
						url: '/order/refund/request',
						contentType: 'application/json',
						data: JSON.stringify({
							orderId, reason, orderLineItemIdList
						}),
						success: function(refundList) {
							alertModal('<p>환불 요청이 접수되었습니다.</p>'
							+ '<p>관리자가 요청을 확인한 뒤 환불 요건을 검토합니다.<br>'
							+ '이용 내역이 있을 경우 해당 금액을 차감하여 환불되며,<br>'
							+ '처리는 영업일 기준 3일 이내에 완료됩니다.<br>'
							+ '환불 완료 시 문자 또는 이메일로 안내드립니다.</p>'
							+ '<p>자세한 내용은 "<a href="/policy/refund">환불 정책</a>"을 참조하세요.</p>');
							if(refundList) {
								// 환불 요청 대상이 없으면 환불 요청 버튼 자체를 비활성화
								if($orderDetailBlock.find('.js-refund-checkbox:enabled').get().length == 0) {
									$orderDetailBlock.find('.js-open-refund-request').prop('disabled', true);
								}								
									
								refundList.forEach((refund, i, arr) => {
									const orderLineItemId = refund.orderLineItem.lid;
									
									// 환불 요청한 아이템들은 환불 요청 가능 대상에서 제외
									$orderDetailBlock.find(`.js-refund-checkbox[value=${orderLineItemId}]`).prop('disabled', true);
									
									const itemProperties = refundItemMap[orderLineItemId];
									arr[i].orderLineItem['quantity'] = itemProperties.quantity;
									arr[i].orderLineItem['item'] = {name: itemProperties.name};
								});
								displayRefundList($orderDetailBlock.find('.refund-list'), refundList);
							}
						},
						error: function() {
							alertModal('환불 요청이 실패했습니다.');
						}
					})
				}else {
					alertModal('환불사유를 입력해 주세요.');
				}
			}
		)
	})
	// 환불 상품 선택 취소
	.on('click', '.js-cancel-refund-select', function() {
		const $orderDetailBlock = $(this).closest('.order-detail-block');
		$orderDetailBlock.find('.js-open-refund-request').removeClass('selecting');	
		$orderDetailBlock.find('.refund-checkbox').add(this).hide();
	})
	// 환불 취소
	.on('click', '.js-open-refund-cancel', function() {
		const refundId = this.dataset.refundId;
		const $refundBlock = $(this).closest('.refund-detail-block');
		const orderLineItemId = $refundBlock.get(0).dataset.lid;
		const $orderDetailBlock = $refundBlock.closest('.order-detail-block');
		confirmModal('환불을 취소하시겠습니까?', function() {
			$.ajax({
				type: 'POST', url: '/order/refund/cancel',
				contentType: 'application/json',
				data: refundId,
				success: function() {
					// 취소됨 표시
					$refundBlock.find('.btn-area').empty().append($('#hiddenDivs .refund-cancelled-group').clone().children());
					// 다시 환불 요청 가능하게 체크박스 및 버튼 활성화
					$orderDetailBlock.find(`.js-refund-checkbox[value=${orderLineItemId}]`).prop('disabled', false);
					$orderDetailBlock.find('.js-open-refund-request').prop('disabled', false);
				},
				error: function() {
					alertModal('환불 취소에 실패했습니다.');
				}
			})
		})
	})
	
	function displayRefundList($listArea, refundList) {
		for(refund of refundList) {
			const $el = $('#hiddenDivs .refund-detail-block').clone();
			$el.find('.name').text(refund.orderLineItem.item?.name??'이름 없음');
			$el.find('.quantity').text(refund.orderLineItem.quantity??'수량정보 없음');
			$el.find('.amount').text(refund.refundAmount);
			$el.get(0).dataset.lid = refund.orderLineItem.lid;
			switch(refund.status) {
				case 'R':
					const $cancelGroup = $('#hiddenDivs .refund-requested-group').clone();
					$cancelGroup.find('.js-open-refund-cancel')[0].dataset.refundId = refund.rid;
					$el.find('.btn-area').append($cancelGroup.children());
					$el.find('.amount').text('-');
					break;
				case 'F':
					$el.find('.btn-area').append($('#hiddenDivs .refund-refunded-group').clone().children());
					break;
				case 'J':
					$el.find('.btn-area').append($('#hiddenDivs .refund-rejected-group').clone().children());
					break;
				case 'X':
					$el.find('.btn-area').append($('#hiddenDivs .refund-cancelled-group').clone().children());
					break;
				
			}
			$el.find('.reason').text(refund.reason);
			$el.find('.request-date').text((new Date(refund.updateDate)).format('yyyy-MM-dd HH:mm'));
			if(refund.refundDate)
				$el.find('.refund-date').text((new Date(refund.refundDate)).format('yyyy-MM-dd HH:mm'));
			$listArea.append($el);
		}		
	}
})
