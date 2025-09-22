
const FicoPaymentHandler = (() => {
	const CLIENT_KEY = 'live_gck_P9BRQmyarYxp6gP1xd07VJ07KzLN';
	const allowedRequestPaymentKeys = [
		"orderId", "orderName", "successUrl", "failUrl", "customerName", "customerEmail", "customerMobilePhone"
	]
	let _widgetOptions = {
		successUrl: window.location.origin + "/payment/request/success", // 결제 요청이 성공하면 리다이렉트되는 URL
		failUrl: window.location.origin + "/payment/request/fail", // 결제 요청이 실패하면 리다이렉트되는 URL,
	}, _tossPayments, _widgets, _paymentMethodWidget;
	
	const paymentSDKPromise = $.getScript('https://js.tosspayments.com/v2/standard', () => {
		_tossPayments = TossPayments(CLIENT_KEY);
	});

	/**
	 * 결제 위젯 렌더링.
	 * 
	 * @selector DOM 선택자
	 * @widgetOptions 렌더링 및 결제 요청에 필요한 파라미터
	 */
	const renderWidget = async (selector, widgetOptions) => {
		await paymentSDKPromise;
		Object.assign(_widgetOptions, widgetOptions);
		const {customerKey, amount} = _widgetOptions;
		_widgets = _tossPayments.widgets({ customerKey });
		await _widgets.setAmount({
			currency: 'KRW', value: amount
		});
		_paymentMethodWidget = await _widgets.renderPaymentMethods({ selector });
	}
	/**
	 * 결제 요청
	 */
	const requestPayment = () => {
		const params = Object.fromEntries(Object.entries(_widgetOptions).filter(([key, value]) => 
			allowedRequestPaymentKeys.includes(key) && value !== undefined
		));
		_widgets.requestPayment(params);
	} 
	
	/**
	 * 결제 위젯 리셋
	 */
	const destroy = () => {
		_paymentMethodWidget?.destroy();
	}
			  
	return {
		renderWidget,
		requestPayment,
		destroy
	}
})();