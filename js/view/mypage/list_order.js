/**
 * /mypage/list_order.html
 */
$(function() {
	$(document)
	// 주문 상세 보기(문의 상태가 환불접수중이거나 환불완료인 경우 환불 내역 조회)
	.on('show.bs.collapse', '.js-list-refund:not(.listed)', function() {
		const _this = this;
		const $orderBlock = $(this).closest('.order-detail-block');
		const orderId = this.dataset.orderId;
		$.getJSON(`/order/refund/list/${orderId}`, function(refundList) {
			$(_this).addClass('listed')
			const $refundListDiv = $orderBlock.find('.refund-list');
			
			displayRefundList($refundListDiv, refundList);

			$(_this).removeClass('js-list-refund');
		});
	})
	// 환불 요청
	.on('click', '.js-open-refund-request', function() {
		const $orderDetailBlock = $(this).closest('.order-detail-block');
		const {orderId, orderLineItemId} = this.dataset;
		confirmModal('<p>환불을 요청하시겠습니까?</p>'
			+ '<input type="textarea" id="inputRefundReason" class="form-control" placeholder="환불사유" style="resize:none;">',
			function() {
				const reason = $('#inputRefundReason').val();
				if(reason) {
					$.ajax({
						type: 'POST',
						url: '/order/refund/request',
						contentType: 'application/json',
						data: JSON.stringify({
							orderId: parseInt(orderId), reason,
							orderLineItemIdList: [parseInt(orderLineItemId)]
						}),
						success: function(refundList) {
							alertModal('<p>환불 요청이 접수되었습니다.</p>'
							+ '<p>관리자가 요청을 확인한 뒤 환불 요건을 검토합니다.<br>'
							+ '이용 내역이 있을 경우 해당 금액을 차감하여 환불되며,<br>'
							+ '처리는 영업일 기준 3일 이내에 완료됩니다.<br>'
							+ '환불 완료 시 문자 또는 이메일로 안내드립니다.</p>'
							+ '<p>자세한 내용은 "<a href="/policy/refund">환불 정책</a>"을 참조하세요.</p>');
							if(refundList) {
								$orderDetailBlock.find('.refund-area').empty().append($('#hiddenDivs .refund-process-group').clone().children());
								displayRefundList($orderDetailBlock.find('.refund-list'), refundList);
								$orderDetailBlock.find('.order-status').text('환불 요청');
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
	// 환불 취소
	.on('click', '.js-open-refund-cancel', function() {
		const $orderDetailBlock = $(this).closest('.order-detail-block');
		const refundId = this.dataset.refundId;
		const $refundBlock = $orderDetailBlock.find('.refund-detail-block').filter((_, el) => {
			return el.dataset.refundId == refundId;
		});
		
		const orderId = $orderDetailBlock[0].dataset.orderId;
		const orderLineItemId = $orderDetailBlock.find('.order-line-item-block')[0].dataset.orderLineItemId;
		confirmModal('환불을 취소하시겠습니까?', function() {
			$.ajax({
				type: 'POST', url: '/order/refund/cancel',
				contentType: 'application/json',
				data: refundId,
				success: function() {
					$orderDetailBlock.find('.order-status').text('결제 완료');
					$refundBlock.find('.status').text('환불 취소');
					const $refundArea = $orderDetailBlock.find('.refund-area');
					const $refundRequest = $('#hiddenDivs .refund-request-group').clone();
					$refundRequest.find('button')[0].dataset.orderId = orderId;
					$refundRequest.find('button')[0].dataset.orderLineItemId = orderLineItemId;
					$refundArea.empty().append($refundRequest.children());
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
			if(refund.status == 'R') {
				$listArea.closest('.order-detail-block').find('.js-open-refund-cancel')[0].dataset.refundId = refund.rid;
				$el.find('.amount').text('-');
			}
			$el.find('.status').text(refund.status);
			$el.find('.reason').text(refund.reason);
			$el.find('.request-date').text((new Date(refund.updateDate)).format('yyyy-MM-dd HH:mm'));
			if(refund.refundDate)
				$el.find('.refund-date').text((new Date(refund.refundDate)).format('yyyy-MM-dd HH:mm'));
			$listArea.append($el);
			$el[0].dataset.refundId = refund.rid
		}		
	}
})
