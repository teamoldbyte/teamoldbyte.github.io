/** json 정보를 바탕으로 html 태그를 생성하여 반환
	Element.xxx 형태로 호출이 가능한 요소여야 함.(예: for (x) -> htmlFor (o))
	
	@param json (el: 태그이름, children: 자식태그들, 'data-xx': 사용자정의 속성, style: 스타일 map, 기타: 적용 속성)
	@returns Node
	@author LGM
*/
function createElement(json) {
	// 키-값 쌍이 아닌 '문자열'인 경우 텍스트노드로 반환
	if(typeof json == 'string') return document.createTextNode(json);
	// 배열인 경우 자식 요소 뭉치로 반환
	if(Array.isArray(json)) {
		const fragment = document.createDocumentFragment();
		for(let i = 0, len = json.length; i < len; i++) {
			fragment.appendChild(createElement(json[i]));
		}
		return fragment;
	}
	const element = document.createElement(json.el);
	const keys = Object.keys(json);
	for(let i = 0, len = keys.length; i < len; i++) {
		const key = keys[i];
		if(key.match(/^data-/)) 
			// 사용자정의 속성. data-xx 
			element.dataset[key.replace('data-', '')
			.replace(/-(\w)/g, g0 => g0.toUpperCase()[1])] = json[key];
		else if(key == 'children') { 
			// 자식태그들
			const childGroupFragment = document.createDocumentFragment(),
				children = json[key];
			for(let j = 0, clen = children.length; j < clen; j++) {
				childGroupFragment.appendChild(createElement(children[j]));
			}
			element.appendChild(childGroupFragment);
		}else if(key == 'style') { 
			// 스타일 속성들. (한 번 더 들어가야 함)
			if(typeof json[key] == 'string') {
				element.style.cssText = json[key];
			}else if(typeof json[key] == 'object') {
				Object.assign(element.style, json[key]);
				/*const styleProperties = json[key],
					styleKeys = Object.keys(styleProperties);
				for(let j = 0, slen = styleKeys.length; j < slen; j++) {
					const property = styleKeys[j];
					element[key][property] = styleProperties[property];
				}*/
			}else console.error('style에 ' + typeof json[key] + '은/는 맞지 않습니다.');
		}else if(key == 'dataset') {
			Object.assign(element.dataset, json[key]);
		}
		else if(key != 'el') { // 나머지 속성들 적용
			if(typeof element[key] == 'undefined') {
				element.setAttribute(key, json[key]);
			}else element[key] = json[key];
		}		
	}
	return element;
}

/** HTML 요소를 json 객체로 반환.
최종적으로는 다시 JSON.stringify를 적용 후 사용.
참고하는 용도이며, 오류는 있을 수 있음.
 */
function parseHTML(html) {
	let fragment, json;
	fragment = document.createElement('temp');
	if(typeof html == 'string') {
		fragment.innerHTML = html;
	}else if(typeof html == 'object') {
		fragment.appendChild(html.cloneNode(true));
	}else return null;
	json = Array.from(Array.from(fragment.childNodes).filter(c => [Node.TEXT_NODE,Node.ELEMENT_NODE].includes(c.nodeType)), c => {
		if(c.nodeType == Node.TEXT_NODE) {
			const text = c.textContent;
			if(text.match(/\S/)) return text;
			else return null;
		}
		else {
			// 태그명 추출
			const el = { "el": c.nodeName.toLowerCase()};
			// 속성들 추출
			for(let attr of c.attributes) {
				el[attr.name] = attr.value || true;
			}
			// 자식 노드 추출
			if(c.hasChildNodes) {
				const children = Array.from(c.childNodes, cc => parseHTML(cc)).filter(cc => {
					return cc != null && (cc['length'] == undefined || cc['length'] > 0)
				});
				if(children.length > 0) el['children'] = children;
			}
			return el;
		}
	});
	if(json.length == 1) json = json[0];
	return json;
}

// alert를 대신하여 BootStrap Modal을 생성해서 표시
function alertModal(msg, callback) {
	document.activeElement.blur();
	let modal = document.getElementById('alertModal');
	if(!modal) {
		modal = createElement({
			"el":"div","id":"alertModal","class":"modal fico-modal fade","data-bs-backdrop":"static","tabIndex":0,"children":[
				{"el":"div","class":"modal-dialog modal-md modal-dialog-centered","children":[
					{"el":"div","class":"modal-content","children":[
						{"el":"div","class":"modal-header no-title","children":[
							{"el":"h5","class":"mb-0"},
							{"el":"button","type":"button","class":"btn btn-close fas fa-times","data-bs-dismiss":"modal"}
						]},
						{"el":"div","class":"modal-body row g-0","children":[
							{"el":"div","class":"text-section my-auto text-center text-dark","innerHTML":msg.replace(/\n/g,'<br>')}
						]},
						{"el":"div","class":"modal-footer row gx-2 col-md-6 col-8 mx-auto","children":[
							{"el":"div","class":"col text-center","children":[
								{"el":"button","class":"btn btn-fico w-100", 'data-bs-dismiss':'modal',"textContent": "확인"}
							]}
						]}
		]}]}]});
		document.body.appendChild(modal);
		modal.addEventListener('shown.bs.modal', onShown);	
	}else modal.querySelector('.text-section').innerHTML = msg.replace(/\n/g,'<br>');
	window.addEventListener('keydown', onEnter);
	modal.addEventListener('hidden.bs.modal', onHidden);
	
	function onEnter(event) {
		if((event.key == 'Enter' || event.key == ' ') && modal.matches('.show')) {
			window.removeEventListener('keydown', onEnter);
			if(bootstrap?.Modal?.getInstance(modal)._isTransitioning) {
				modal.addEventListener('shown.bs.modal', immediatelyHide);
			}else {
				bootstrap?.Modal?.getInstance(modal).hide();
			}
			
			function immediatelyHide() {
				modal.removeEventListener('shown.bs.modal', immediatelyHide);
				bootstrap?.Modal?.getInstance(modal).hide();
			}
		}
	}
	
	function onShown() {
		modal.querySelector('.modal-footer button[data-bs-dismiss]').focus();
	}
	
	function onHidden() {
		if(callback) callback();
		
		window.removeEventListener('keydown', onEnter);
		modal.removeEventListener('hidden.bs.modal', onHidden);
	}
	bootstrap?.Modal?.getOrCreateInstance(modal).show();
}
// window.confirm을 대신하여 Bootstrap Modal을 생성해서 표시. '확인'을 누르면 callback 실행
function confirmModal(msg, confirmedCallback, deniedCallback) {
	document.activeElement.blur();
	let modal = document.getElementById('confirmModal');
	if(!modal) {
		modal = createElement({
			"el":"div","id":"confirmModal","data-bs-backdrop":"static", 'data-bs-return': '0',
			"class":"modal fico-modal fade","tabIndex":0,"children":[
				{"el":"div","class":"modal-dialog modal-md modal-dialog-centered","children":[
					{"el":"div","class":"modal-content","children":[
						{"el":"div","class":"modal-header no-title","children":[
							{"el":"h5","class":"mb-0"},
							{"el":"button","type":"button","class":"btn btn-close fas fa-times","data-bs-dismiss":"modal"}
						]},						
						{"el":"div","class":"modal-body row g-0","children":[
							{"el":"div","class":"text-section my-auto text-center text-dark","innerHTML":msg.replace(/\n/g,'<br>')}
						]},
						{"el":"div","class":"modal-footer row gx-2 col-md-6 col-8 mx-auto","children":[
							{"el":"div","class":"col text-center","children":[
								{"el":"button","class":"btn btn-fico w-100","textContent": "확인", onclick: () => {
									modal.dataset.bsReturn = 1;
									bootstrap?.Modal?.getInstance(modal).hide();
								}}
							]},
              {"el":"div","class":"col text-center","children":[
								{"el":"button","class":"btn btn-outline-fico w-100", "textContent": "취소", 'data-bs-dismiss':'modal'}
							]}
						]}						
		]}]}]});
		document.body.appendChild(modal);
		modal.addEventListener('shown.bs.modal', onShown);
	}else {
		modal.dataset.bsReturn = 0;
		modal.querySelector('.text-section').innerHTML = msg.replace(/\n/g,'<br>');
	}
	window.addEventListener('keydown', onEnter);
	
	modal.addEventListener('hidden.bs.modal', onHide);
	
	function onEnter(event) {
		if((event.key == 'Enter' || event.key == ' ') && modal.matches('.show')) {
			window.removeEventListener('keydown', onEnter);
			if(bootstrap?.Modal?.getInstance(modal)._isTransitioning) {
				modal.addEventListener('shown.bs.modal', immediatelyHide);
			}else {
				immediatelyHide();
			}
			
			function immediatelyHide() {
				modal.removeEventListener('shown.bs.modal', immediatelyHide);
				if(document.activeElement?.compareDocumentPosition(modal) == Node.DOCUMENT_POSITION_CONTAINS) {
					document.activeElement.dispatchEvent(new MouseEvent('click'));
				}else {
					modal.querySelector('.modal-footer button').dispatchEvent(new MouseEvent('click'));
				}
			}			
		}
	}	
	
	function onShown() {
		modal.querySelector('.modal-footer button').focus();
	}

	function onHide(event) {
		const bsReturn = parseInt(event.target.dataset.bsReturn);
		if (bsReturn > 0) {
			if (confirmedCallback) {
				confirmedCallback();
			}
		} else {
			if (deniedCallback) {
				deniedCallback();
			}
		}
		modal.removeEventListener('hidden.bs.modal', onHide)
	}
	
	bootstrap?.Modal?.getOrCreateInstance(modal).show();
}
