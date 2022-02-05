/**-----------------------------------------------------------------------------
 * 후원과 관련된 server interaction 함수 모음
 * @author LGM
 -----------------------------------------------------------------------------*/
function submitDonation(formData, csrf) {
	$.ajax({
		type: 'POST',
		url: '/donation',
		data: JSON.stringify(formData),
		contentType: 'application/json;charset=utf-8',
		beforeSend: function(xhr) {
			if(csrf != null) xhr.setRequestHeader(csrf.headerName, csrf.token);
		},
		success: function() {
			successSubmitDonation.call(this, formData.name, formData.alias);
		},
		error: function() {
			//alert('정상적으로 후원 정보를 전달하지 못 했습니다.')
		}
	})
}