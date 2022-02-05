/**
 * 마이페이지 관련 스크립트
 * @author LGM
 */

function postForm(url, command, callback, errCallback) {
	$.ajax({
		url: url, type: 'POST', data: command,
		processData: false, contentType: false, success: callback,
		error: errCallback
	});
}