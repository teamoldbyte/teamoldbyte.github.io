/** json 정보를 바탕으로 html 태그를 생성하여 반환
	Element.xxx 형태로 호출이 가능한 요소여야 함.(예: for (x) -> htmlFor (o))
	
	@param json (el: 태그이름, children: 자식태그들, 'data-xx': 사용자정의 속성, style: 스타일 map, 기타: 적용 속성)
	@returns Node
	@author LGM
*/
function createElement(json) {
	// 키-값 쌍이 아닌 '문자열'인 경우 텍스트노드로 반환
	if (typeof json === "string") return document.createTextNode(json);
	// 배열인 경우 자식 요소 뭉치로 반환
	if(Array.isArray(json)) {
		const fragment = document.createDocumentFragment();
		for(let i = 0, len = json.length; i < len; i++) {
			fragment.appendChild(createElement(json[i]));
		}
		return fragment;
	}
	const element = document.createElement(json.el);
	
	for (const [key, value] of Object.entries(json)) {
		if (key === "children") {
			// If the key is "children", create a document fragment and append each child element to it.
			const childFragment = document.createDocumentFragment();
			const childrenLen = value.length;
			for (let j = 0; j < childrenLen; j++) {
				childFragment.appendChild(createElement(value[j]));
			}
			element.appendChild(childFragment);
		} else if (key === "style") {
			// If the key is "style", apply each style property to the element's style object.
			if (typeof value === "string") {
				element.style.cssText = value;
			} else if (typeof value === "object") {
				Object.assign(element.style, value);
			} else {
				console.error(`Invalid type for "style": ${typeof value}`);
			}
		} else if (key.startsWith("data-")) {
			// If the key starts with "data-", set the corresponding dataset property on the element.
			element.dataset[
				key.replace(/^data-/, '').replace(/-(\w)/g, (_m, p1) => p1.toUpperCase())
			] = value;
		} else if (key !== "el") {
			// Otherwise, set the key as an attribute or property on the element.
			element[key] = value;
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
	const modal = document.getElementById('alertModal');
	if (!modal) {
		const button = {
			el: "button",
			class: "btn btn-fico",
			"data-bs-dismiss": "modal",
			textContent: "확인",
		};
		const children = [
			{
				el: "div",
				class: "text-section my-3 text-center text-dark",
				innerHTML: msg.replace(/\n/g, "<br>"),
			},
			{
				el: "div",
				class: "button-section row g-1 col-6 mx-auto",
				children: [button],
			},
		];
		const modalContent = {
			el: "div",
			class: "modal-content",
			children: [
				{
					el: "div",
					class: "modal-body row g-0",
					children: children,
				},
			],
		};
		const modalDialog = {
			el: "div",
			class: "modal-dialog modal-md modal-dialog-centered",
			children: [modalContent],
		};
		const modalEl = {
			el: "div",
			id: "alertModal",
			class: "modal fade",
			"data-bs-backdrop": "static",
			tabIndex: 0,
			children: [modalDialog],
		};
		const modal = createElement(modalEl);
		document.body.appendChild(modal);
		modal.addEventListener("keypress", function(event) {
			if (event.code === "Enter") {
				const modalInstance = bootstrap?.Modal?.getInstance(modal);
				modalInstance && modalInstance.hide();
			}
		});
		modal.addEventListener("hidden.bs.modal", onHidden);
	} else {
		const textSection = modal.querySelector(".text-section");
		textSection && (textSection.innerHTML = msg.replace(/\n/g, "<br>"));
	}
	modal.removeEventListener("hidden.bs.modal", onHidden);
	modal.addEventListener("hidden.bs.modal", onHidden);
	function onHidden() {
		if (callback) callback();
	}
	const modalInstance = bootstrap?.Modal?.getOrCreateInstance(modal);
	modalInstance && modalInstance.show();
}
// window.confirm을 대신하여 Bootstrap Modal을 생성해서 표시. '확인'을 누르면 callback 실행
function confirmModal(msg, callback) {
	let modal = document.getElementById('confirmModal');
	if(!modal) {
		modal = createElement({
			"el":"div","id":"confirmModal","data-bs-backdrop":"static", 'data-bs-return': '0',
			"class":"modal fade","tabIndex":0,"children":[
				{"el":"div","class":"modal-dialog modal-md modal-dialog-centered","children":[
					{"el":"div","class":"modal-content","children":[
						{"el":"div","class":"modal-body row g-0","children":[
							{"el":"div","class":"text-section my-3 text-center text-dark","innerHTML":msg.replace(/\n/g,'<br>')},
							{"el":"div","class":"button-section row gx-2 col-md-6 col-8 mx-auto","children":[
								{ "el": "div", className: 'col text-center', children: [
									{"el":"button","class":"btn btn-fico w-100","textContent": "확인", onclick: () => {
										modal.dataset.bsReturn = 1;
										bootstrap?.Modal?.getInstance(modal).hide();
									}}
								]},
								{ "el": "div", className: 'col text-center', children: [
									{"el":"button","class":"btn btn-outline-fico w-100", "textContent": "취소", 'data-bs-dismiss':'modal'}
								]}
		]}]}]}]}]});
		document.body.appendChild(modal);
		modal.addEventListener('keypress', function(event) {
			if(event.code == 'Enter') {
				modal.dataset.bsReturn = 1;
				bootstrap?.Modal?.getInstance(modal).hide();
			}
		})
		modal.addEventListener('hide.bs.modal', (e) => onHide(e));
	}else {
		modal.dataset.bsReturn = 0;
		modal.querySelector('.text-section').innerHTML = msg.replace(/\n/g,'<br>');
	}
	function onHide(event) {
		if(Boolean(parseInt(event.target.dataset.bsReturn))) callback();
	}
	
	bootstrap?.Modal?.getOrCreateInstance(modal).show();
}
