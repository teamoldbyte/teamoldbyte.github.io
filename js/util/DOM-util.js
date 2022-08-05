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
				element[key] = json[key];
			}else if(typeof json[key] == 'object') {
				const styleProperties = json[key];
				for(let j = 0, slen = styleProperties.length; j < slen; j++) {
					const property = styleProperties[j];
					element[key][property] = styleProperties[property];
				}
			}else console.error('style에 ' + typeof json[key] + '은/는 맞지 않습니다.');
		}else if(key != 'el') { // 나머지 속성들 적용
			element[key] = json[key];
		}		
	}
	return element;
}
