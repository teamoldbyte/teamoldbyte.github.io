/**
 * 
 */
(function($, window, tandem) {
	document.head.innerHTML +='<style>' +
		'.anatomy {' +
		'display: inline;transition: all 1s;' +
		'}' +
		'[data-role] {' +
		'width: 1em; height: 1em; display: inline-flex; overflow: hidden; background: black;line-height: 1;' +
		'}' +
		'[data-role]::before{' +
		'content: attr(data-role);color: white;' +
		'}' +
		'</style>';
	
	function createLayersFromDOM(div) {
		
		const clone = tandem.cleanSvocDOMs(div);
		// 주성분인 구 또는 절은 따로 처리
		Array.from(clone.querySelectorAll('.acls,.ncls,.advcls,.phr,.adjphr,.tor,.ger,.ptc,.advphr,.ptcphr')).forEach(el => {
			const firstChild = el.firstElementChild;
			if(el.childElementCount > 0 && el.textContent.length == firstChild.textContent.length
			&& firstChild.matches('.s,.o,.c,.oc')) el.dataset.role = firstChild.className.match(/\bs\b|\bo\b|\bc\b|\boc\b/)[0];
		});
		
		// 성분 제거(태그 해제)
		Array.from(clone.querySelectorAll('.s,.v,.o,.c,.oc,.m,.ccls')).forEach(el => $(el.firstChild).unwrap());
		// 단일 텍스트 요소 제거(태그 해제)
		Array.from(clone.querySelectorAll('.sem')).forEach(el => {
			if(!el.textContent.trim().includes(' ')) $(el.firstChild).unwrap();
		})
		// 텐덤 요소를 아나토미 요소로 전환
		removeAttrs(clone)
		clone.removeAttribute('style');
		clone.normalize();
		$(div).after(clone)
	}
	
	async function play(div) {
		if(div.matches('[data-role]')) {
			div.removeAttribute('data-role');
			$(div).animate({width: '100%'},1000);
			await sleep(2000);
		}
		for(let child of div.children) {
			$(child).show(1000);
			await sleep(2000);
		}
		for(let child of div.children) {
			await play(child);
		}
		return Promise.resolve();
	}
	const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
	function removeAttrs(elem) {
		const dataset = elem.dataset;
		for (let key in dataset) {
			if(key != 'role') elem.removeAttribute("data-" + key.split(/(?=[A-Z])/).join("-").toLowerCase());
		}				
		if(elem.nodeType == 3) elem.textContent = elem.textContent.trim();
		if(elem.nodeType == 1 && elem.hasAttributes()) {
			elem.removeAttribute('style');
			const attrs = elem.attributes;
			for(let attr of attrs) {
				elem.removeAttributeNode(attr);
			}
			elem.className = 'anatomy'
		}
		if(elem.dataset.role == undefined) elem.style.display = 'none';
		if(elem.hasChildNodes()) {
			for(let child of elem.children) removeAttrs(child);
		}	
	}
	
	window['anatomy'] = { createLayersFromDOM, play };
})(jQuery, this, tandem);
