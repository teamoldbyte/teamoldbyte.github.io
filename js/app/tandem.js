/** svoc태그 표시와 그 역실행을 위한 모듈
@author LGM
 */
(function($, window, document) {
	// ==========================================
	// 화살표 그리기 모듈 비동기 동적 로더 (싱글톤 패턴)
	// ==========================================
	let arrowModulePromise = null;

	function loadDrawingArrowModule() {
	    if (typeof drawCurvedArrow === 'function') return Promise.resolve();
	    if (arrowModulePromise) return arrowModulePromise;

	    // 💡 $.getScript()의 자동 캐시 무효화(타임스탬프 쿼리스트링 삽입) 방지를 위해 
		// $.ajax를 사용하여 cache 옵션을 명시적으로 활성화
	    arrowModulePromise = $.ajax({
	        url: 'https://static.findsvoc.com/js/util/drawing-arrow-module.min.js',
	        dataType: "script",
	        cache: true 
	    });

	    return arrowModulePromise;
	}

	let portraitList = window.matchMedia('(orientation: portrait)');
	let cachedRem = null;
	
	// rem 값을 반환하는 헬퍼 함수
    function getRootEm(doc = document) {
        if (!cachedRem) {
            cachedRem = parseFloat(getComputedStyle(doc.documentElement).fontSize);
        }
        return cachedRem;
    }

	let resizeTimer;
	window.addEventListener('resize', () => {
		// 리사이즈가 발생할 때마다 캐시를 비우고 타이머를 초기화
		cachedRem = null;
		clearTimeout(resizeTimer);
		
		resizeTimer = setTimeout(() => {
			// ✅ 디바운스(Debounce) 기법 적용: 리사이즈가 완전히 끝난 100ms 뒤에 딱 한 번만 DOM을 탐색 및 재계산
			const $semantics = $('.semantics-result:visible');
			for(let j = 0, len = $semantics.length; j < len; j++) {
				correctMarkLine($semantics[j]);
			}
		}, 100);
	});

	/**=============================================================================
	 * 구문분석 결과를 스타일링 입혀서 대상 요소 내부에 표시
	 * 
	 * @param text 대상 문장 원문
	 * @param svocBytes 구문분석 내용을 담은 바이트배열(Base64)
	 * @param container 분석 결과 표시 영역이 삽입될 대상
	 * @author LGM
	 *
	 * @summary 
	 * <b>체이닝 함수 호출 순서</b>
	 * correctMarkLine(div)
	 * -> checkGCDepth(div) 
	 * -> checkLineEnds(div) 
	 * -> adjustLineHeight(div) 
	 * -> await drawConnections(div) (화살표 모듈 비동기 로드 포함)
	 * 
	 * 💡 Time Stop 렌더링: DOM의 display를 브라우저 몰래 조작하여 
	 * 리페인트를 막은 상태에서 모든 계산을 수행하므로 화면 깜빡임(달그락거림)이 없습니다.
	 */
	async function showSemanticAnalysis(text, svocBytes, $container) {
		// 각 문장마다의 구문분석 구분자
		window.semanticSequence = window.semanticSequence || 0;

		// (TBD) 커스텀 CSS 추가(밑줄,대괄호,글자 색상 등)--------------------------

		let div = $container[0].ownerDocument.createElement('div');
		div.className = 'semantics-result';
		paintBasicDOMs(text, await svocText2Arr(svocBytes) || [], div);
		
        // 💡 DOM에 붙임 (그러나 JS 스레드가 점유 중이므로 화면에는 아직 그려지지 않음)
        $container.append(div);

        /**
		 * div 속 내용들을 화면에 나타난 위치를 기반으로 꾸밈 요소 적용.
		 * 각 꾸밈 요소들끼리 상호 영향을 받으므로, 일정 시간 간격으로 차례로 실행.
		 * (코멘트 수평정렬, 코멘트 수직정렬, 수식선, 줄 높이 자동 조절)
		 */
		await correctMarkLine(div);
        return div;
	}

	const keywordTable = {
		//속성 클래스 : Cherokee (그리스 문자)
		"\u0390": "\"start\"", "\u0391": "\"end\"", "\u0392": "\"rcomment\"", "\u0393": "\"gcomment\"", "\u0394": "\"markType\"", "\u0395": "\"hasModificand\"",
		
		//markType 1 - 성분 (그리스 문자)
		"\u03A3": "\"S\"", "\u03A4": "\"V\"", "\u03A5": "\"O\"", "\u03A6": "\"C\"", "\u03A7": "\"OC\"", "\u03A8": "\"PO\"", "\u03A9": "\"M\"", "\u03AA": "\"A\"", "\u03AB": "\"TO\"", "\u03AC": "\"GO\"", "\u03AD": "\"PTCO\"", "\u03AE": "\"APPO\"",
		
		//markType 2 - 절 (키릴 문자)
		"\u0400": "\"CCLS\"", "\u0401": "\"NCLS\"", "\u0402": "\"ACLS\"", "\u0403": "\"ADVCLS\"",
		
		//markType 3 - 구/선행사 (키릴 문자)
		"\u0430": "\"PHR\"", "\u0431": "\"ADJPHR\"", "\u0432": "\"TOR\"", "\u0433": "\"GER\"", "\u0434": "\"PTC\"", "\u0435": "\"RCM\"", "\u0436": "\"ADVPHR\"", "\u0437": "\"PTCPHR\"",
		
		//rcomment - 성분 (조지아 문자)
		"\u10A0": "\"S\"", "\u10A1": "\"V\"", "\u10A2": "\"O\"", "\u10A3": "\"C\"", "\u10A4": "\"o.c\"", "\u10A5": "\"(전)o\"", "\u10A6": "\"i.o.\"", "\u10A7": "\"d.o.\"", "\u10A8": "\"(의)s\"", "\u10A9": "\"mod\"", "\u10AA": "\"(부)o\"", "\u10AB": "\"(동)o\"", "\u10AC": "\"(분)o\"", "\u10AD": "\"동격\"",
		
		//gcomment - 절 (조지아 문자)
		"\u10D0": "\"[조건 | 양보] 부사절\"", "\u10D1": "\"조건 부사절\"", "\u10D2": "\"[시간 | 양보] 부사절\"", "\u10D3": "\"[시간 | 양태] 부사절\"", "\u10D4": "\"시간 부사절\"", "\u10D5": "\"이유 부사절\"", "\u10D6": "\"양보 부사절\"", "\u10D7": "\"부사절\"", "\u10D8": "\"등위절\"", "\u10D9": "\"병렬절\"", "\u10DA": "\"관계사\"",
		
		//gcomment - 문법 (체로키 문자)
		"\u13A0": "\"수식\"", "\u13A1": "\"to부정사\"", "\u13A2": "\"의미상 주어\"", "\u13A3": "\"동명사\"", "\u13A4": "\"전치사구\"", "\u13A5": "\"전치사구(adj)\"", "\u13A6": "\"분사\"", "\u13A7": "\"부사구\"", "\u13A8": "\"부사적 보충어\"",
		
		//modificant or gcomment의 값 (캐나다 원주민 문자)
		"\u1400": "true", "\u1401": "false", "\u1402": "null", 
		
		//json형식 요소 (캐나다 원주민 문자)
		"\u1430": "},{"
	};
	const ENCODE_REGEX = new RegExp(Object.values(keywordTable).join('|'), 'g');
	const DECODE_REGEX = new RegExp(Object.keys(keywordTable).join('|'), 'g');
	const reverseMap = Object.fromEntries(Object.entries(keywordTable).map(([k,v]) => [v,k]));
	
	/* .semantics-result DOM 내용으로부터 svoc인코딩 문자열 추출 */
	async function getSvocBytes(div) { return svocArr2Text(svocDom2Arr(div)); }
	
	/* svoc인코딩 문자열을 MarkingTag[]로 반환*/
	async function svocText2Arr(svocText) { return JSON.parse(decSvoc(await callPakoFunc(() => pako.inflate(new Uint16Array(str2ab(atob(svocText))), { to: 'string' })))); }
	
	/* MarkingTag[]를 svoc인코딩 문자열로 반환 */
	async function svocArr2Text(svocList) { return btoa(ab2str(await callPakoFunc(() => pako.deflate(encSvoc(JSON.stringify(svocList)))))); }
	
	/* .semantics-result DOM 내용을 MarkingTag[]로 반환*/
	const MARK_TYPES_REGEX = /\b(s|ss|v|o|po|to|go|ptco|c|oc|a|m|appo|rcm|tor|ger|ptc|conj|phr|adjphr|advphr|ptcphr|cls|ncls|acls|advcls|ccls|pcls|cleft)\b/;
	function svocDom2Arr(node, arr) {
		svocDom2Arr.pos = arr ? svocDom2Arr.pos : 0;
		arr = arr ? arr : [];
		
		/** 마킹태그를 조사할 Node 목록 */
		const stack = [node];
		while (stack.length > 0) {
			const n = stack.pop();
			
			// node가 'semantics-result' 클래스(구문분석 블럭의 컨테이너)라면, node의 자식들을 순회하면서 stack에 추가.
			if (n.classList != null && n.classList.contains('semantics-result')) {
				for (let i = n.childNodes.length - 1; i >= 0; i--) stack.push(n.childNodes[i]);
			}
			// 자식노드(최소 텍스트노드)를 가진 span 태그면서, 실질적 마킹태그를 갖는 태그들을 조사(수식선, 줄바꿈, 괄호 등은 제외)
			else if (n.hasChildNodes() && n.nodeName == 'SPAN' && !n.classList.contains('line-end') && !n.classList.contains('brkt')) {
				
				// Extract the semantic mark type from the node's class name.
				const markType = MARK_TYPES_REGEX.exec(n.className);
				
				// If a valid semantic mark type was found, add the mark to the array.
				if (markType != null) {
					const brktNodesCount = n.getElementsByClassName('brkt').length,
					textLength = n.textContent.split(/\n|\u200b/).join('').length;
					arr.push({
						markType: markType[0].toUpperCase(), start: svocDom2Arr.pos, end: (svocDom2Arr.pos + textLength - brktNodesCount),
						rcomment: n.dataset.rc, gcomment: n.dataset.gc, hasModificand: (n.dataset.mfd != null)
					});
				}
				
				// Add the node's children to the stack.
				for (let i = n.childNodes.length - 1; i >= 0; i--) stack.push(n.childNodes[i]);
			}
			// If the node is a text node, update the position counter.
			else if (n.nodeType == Node.TEXT_NODE) {
				svocDom2Arr.pos += n.textContent.replaceAll(/[\n\u200b]/gm, '').length;
			}
		}
		return arr;
	}

	/* svoc문자열 인코딩(정적치환) */
	function encSvoc(svoc) { return svoc.replace(ENCODE_REGEX, matched => reverseMap[matched]); }
	/* svoc문자열 디코딩(정적치환) */
	function decSvoc(svoc) { return svoc.replace(DECODE_REGEX, match => keywordTable[match]); }

	/**
	 * 전달된 sentence 정보를 div 속에 그림.
	 * 기본 JSON 객체로부터 기본 DOM을 구성하고 나면
	 * 모델 외적인 부분(괄호, 레이어, 수식선)을 차례로 실행하여 구현
	 */
	function paintBasicDOMs(text, svocList, div) {
		div.innerHTML = '';
		createBasicDOMs(text, svocList, div);
		checkPOSDepth(div);
		splitInners(div);
		trimTextContent(div);
		wrapWithBracket(div);
	}

	/** 문장 성분*/
	const roleTypes = ['S', 'SS', 'V', 'O', 'PO', 'TO', 'GO', 'PTCO', 'C', 'OC', 'A', 'M', 'APPO'];
	const markTypesNeedBrackets = ['CONJ', 'PHR', 'ADJPHR', 'ADVPHR', 'PTCPHR', 'CLS', 'ACLS', 'NCLS', 'ADVCLS', 'CCLS', 'PCLS'];
	
	/**
	svocList를 기반으로 한 DOM 생성
	@param text 원문장
	@param svocList svocTags
	 */
	function createBasicDOMs(text, svocList, div) {
		// [태그 정렬]---------------------------------------------------------
		// 1차: 시작 offset이 빠른 순. 2차: 끝 offset이 느린 순으로 정렬
		// (동일한 위치에 마킹이 있을 경우 길이가 긴 것이 바깥쪽, 즉 먼저 나와야 한다.)
		svocList = svocList || [];
		svocList.sort((a, b) => a.start - b.start || b.end - a.end);
		
		// 마크타입이 없는 태그들은 걸러낸다
		svocList = svocList.filter((tag) => !!(tag.markType));
		let i = 0;
		while (svocList[i + 1] != null) {
			const [tag, second, third] = svocList.slice(i, i + 3);
			// 이전 태그들 중에 범위가 일부 겹치는 태그가 있으면
			const unclosedTag = svocList.find((priorTag,j) => j < i && priorTag.end > tag.start && priorTag.end < tag.end);
			if(unclosedTag) {
				// 1. unclosedTag 안에 아무 성분이 없고 tag에 의해 수식받는 요소뿐이면, unclosedTag를 tag 바로 앞에서 잘라냄.
				if(!svocList.find((priorTag,j) => j < i 
					&& (unclosedTag.start < priorTag.start && priorTag.end <= unclosedTag.end || unclosedTag.start == priorTag.start && priorTag.end < unclosedTag.end) 
					&& roleTypes.includes(priorTag.markType)) && ['ADJPHR','ACLS'].includes(tag.markType)) {
					unclosedTag.end = tag.start - 1;
				}
				// 2. 그 외엔 unclosedTag 범위를 확장시켜 tag를 포함하도록 함.
				else {
					unclosedTag.end = tag.end;
				}
			}
			
			// 시작과 끝이 겹치는 태그가 3개일 경우 3번째는 일단 삭제.
			if (third != null && tag.start == third.start && tag.end == third.end) { svocList.splice(i + 2, 1); }
			
			// 소괄호끼리(전명구:PHR, 형용사구:ADJPHR, to부정사:TOR, 분사:PTC)의 시작점이 겹치면 뒤의 것을 삭제.
			// PHR과 ADJPHR이 겹치면 PHR을 삭제.
			else if (['PHR', 'ADJPHR', 'TOR', 'PTC'].indexOf(tag.markType) > -1) {
				const phrsLen = Math.min(i + 3, svocList.length); // 무한정 검사하지 않고 최대 3개까지 검사
				for (let j = i + 1; j < phrsLen; j++) {
					let next = svocList[j];
					if (next != null && tag.start == next.start) {
						if (tag.markType == next.markType || (next.markType == 'PHR' && tag.markType == 'ADJPHR')) { svocList.splice(j, 1); } 
                        else if (tag.markType == 'PHR' && next.markType == 'ADJPHR') { svocList.splice(i, 1); break; }
					}
				}
			}
			// 형용사절,부사절은 위치가 겹치는 성분을 들고 오지 않을 경우 rcomment로 대신함.
			// -> rcomment를 보고 성분 태그를 생성.
			else if ((['ACLS', 'ADVCLS'].indexOf(tag.markType) > -1) && tag.rcomment != null) {
				// 겹치는 성분이 V면 m 태그로 교체.
				if (second.start == tag.start && second.end == tag.end && second.markType == 'V') {
					svocList.splice(i, 2, Object.assign(tag, {rcomment: null}), Object.assign(second, {markType: 'M', rcomment: 'M'}));
				}
				// 완전히 겹치는 태그가 없을 경우 m 태그 삽입
				else {
					svocList.splice(i + 1, 0, { markType: 'M', rcomment: tag.rcomment, start: tag.start, end: tag.end });
				}
			}
			// 동사부 내부의 동사는 표시에서 제외.
			else if (tag.markType == 'V') {
				let j = i + 1, next = second;
				while (next != null && next.start >= tag.start && next.end <= tag.end) {
					if (next.markType == 'V') svocList.splice(j, 1);
					next = svocList[++j];
				}
			}
			i++;
		}
		
		// [항상 문장 필수 성분과 절/구 등이 겹치면 필수 성분을 안쪽으로 넣는다.]
		// 필수 성분끼리 겹칠 경우 먼저 등장한 성분을 남기고 삭제.
		i = 0;
		while (svocList[i + 1] != null) {
			let tag = svocList[i], second = svocList[i + 1];
			// 시작/끝 위치가 동일한 두 태그가 있을 때
			if (tag.start == second.start && tag.end == second.end) {
				// 앞의 태그가 성분이고, 뒤의 태그가 품사면 순서 바꿈
				if (roleTypes.indexOf(tag.markType) > -1 && roleTypes.indexOf(second.markType) == -1) { svocList.splice(i, 2, second, tag); }
				// 앞뒤 태그 둘 다 성분태그면 뒤의 태그 삭제
                else if (roleTypes.indexOf(tag.markType) > -1 && roleTypes.indexOf(second.markType) > -1) { svocList.splice(i + 1, 1); }
			}
			i++;
		}
		
		// [시작,끝,종류가 같은 중복 태그들 제외하고 태그를 모음.]
		const uniqTags = [svocList[0]];
		i = 1;
		while (svocList[i] != null) {
			const lastUniq = uniqTags.slice(-1)[0], tag = svocList[i];
			if (lastUniq.start != tag.start || lastUniq.end != tag.end || lastUniq.markType != tag.markType) { uniqTags.push(tag); }
			i++;
		}
		
		// [구,종속절과 시작+끝이 겹치는 태그 처리]
		// 겹치는 태그에 rcomment가 있으면 구,종속절의 괄호를 크게, 
		// rcomment가 없이 겹치는 태그는 제거.(미표시)
		let prior = null;
		i = 0;
		while (uniqTags[i] != null) {
			const tag = uniqTags[i];
			if (prior != null && tag.start == prior.start && tag.end == prior.end) {
				// 성분태그의 rcomment,gcomment가 없거나 등위절/병렬절과 겹치는 경우, 겹치는 성분 태그를 제거.
				// to부정사나 분사는 자체 괄호가 없어서 형용사구,부사구를 한 번 더 치면서 gcomment를 병합하기 때문에 제외.
				if (markTypesNeedBrackets.indexOf(prior.markType) > -1 && !['TOR','PTC'].includes(tag.markType)) {
					if ((tag.rcomment == null && tag.gcomment == null) || (tag.markType != 'V' && ['CCLS', 'PCLS'].indexOf(prior.markType) > -1)) {
						uniqTags.splice(uniqTags.indexOf(tag), 1);
					} else {
						const priorIndex = uniqTags.indexOf(prior);
						prior.brkt = tag.markType.toLowerCase();
						uniqTags.splice(priorIndex, 1, prior);
					}
				}
				// 순서가 뒤바뀐 경우도 처리.
				else if (markTypesNeedBrackets.indexOf(tag.markType) > -1 && !['TOR','PTC'].includes(prior.markType)) {
					if ((prior.rcomment == null && prior.gcomment == null) || (prior.markType != 'V' && ['CCLS', 'PCLS'].indexOf(tag.markType) > -1)) {
						uniqTags.splice(uniqTags.indexOf(prior), 1);
					} else {
						const thisIndex = uniqTags.indexOf(tag);
						const priorIndex = uniqTags.indexOf(prior);
						tag.brkt = prior.markType.toLowerCase();
						uniqTags.splice(thisIndex, 1, prior);
						uniqTags.splice(priorIndex, 1, tag);
					}
				} else { prior = tag; }
			} else { prior = tag; }
			i++;
		}
		
		// [마킹 태그 배열 생성]-------------------------------------------------
		// 마킹 태그는 토큰별로 2개가 한 쌍(시작,종료)으로 존재한다.
		let tagPairs = []; const openTags = [], closeTags = [];
		i = 0;
		while (uniqTags[i] != null) {
			const tag = uniqTags[i];
			// 시작태그들을 뽑아서 저장.
			// '수식'일 경우 수식대상에 대한 정보도 시작태그에 추가한다.(종료태그에 속성을 추가할 순 없으니)
			openTags.push({ mark: tag.markType, type: 'start', index: tag.start, modifier: tag.hasModificand, brkt: tag.brkt, rcomment: tag.rcomment, gcomment: tag.gcomment });
			// 종료태그들을 뽑아서 저장
			closeTags.push({ mark: tag.markType, type: 'end', index: tag.end, brkt: tag.brkt });
			i++;
		}
		// 종료태그들은 offset의 내림차순으로 정렬 후 역순으로 뒤집는다.
		// 처음부터 offset의 오름차순으로 정렬하는 것과는 다르다.
		// (동일한 위치의 토큰 중 길이가 긴 것이 먼저 나왔으니, 끝나는 것은 더 늦어야 한다.)
		closeTags.sort((a, b) => b.index - a.index);
		closeTags.reverse();

		// 시작태그>종료태그 순서를 유지하면서 병합 후 offset의 오름차순으로 정렬. 
		tagPairs = openTags.concat(closeTags);
		tagPairs.sort((a, b) => {
			if (a.index != b.index) return a.index - b.index;
			else if (a.type != b.type) return (a.type == 'start') ? 1 : -1;
			else return 0;
		});
		
		// 각 문장마다의 구문분석 구분자
		const semanticSequence = div.dataset.seq || (window.semanticSequence++) || 0;
		div.dataset.seq = semanticSequence;
		
		// [배열 속 태그들을 순서대로 표시]------------------------------------------
		let resultChunks = []; let lastIndex = 0; let modificandIndex = 0;
		i = 0;
		while (tagPairs[i] != null) {
			let htmlTag = "", tag = tagPairs[i];
			if (tag.type == 'start') {
				// 구/절 태그의 경우 구/절 시작 부호'(','[' 태그 삽입 후 시작태그 삽입
				htmlTag += `<span class="sem ${tag.mark.toLowerCase()}`;
				// 선행사일 경우 인덱스를 남김
				if (tag.mark == 'RCM') htmlTag += ` mfd-${semanticSequence}-${++modificandIndex}`;
				htmlTag += '"';
				if (tag.modifier) htmlTag += ` data-mfd="${semanticSequence}-${modificandIndex}"`;
				if (tag.rcomment) htmlTag += ` data-rc="${tag.rcomment}"`; 
				if (tag.gcomment) htmlTag += ` data-gc="${tag.gcomment}"`;
				htmlTag += '>';
			} else {
				// 구/절 태그의 경우 구/절 종료태그 삽입 후 절 끝 부호')',']' 태그 삽입
				htmlTag += '</span>';
			}
			
			// 1. 이전 위치부터 현재 태그 시작점까지의 원문 텍스트를 배열에 push
            resultChunks.push(text.substring(lastIndex, tag.index));
            // 2. 생성된 HTML 마킹 태그를 배열에 push
            resultChunks.push(htmlTag);
			lastIndex = tag.index;
			i++;
		}
		
		// 3. 마지막 태그 이후에 남은 텍스트 push
		resultChunks.push(text.substring(lastIndex));
		
		// 4. DOM 삽입 성능 최적화를 위해 배열 요소들을 한 번에 합쳐서 DOM에 삽입 (O(N) 보장)
		div.insertAdjacentHTML('afterbegin', resultChunks.join(''));
	}

	/**
	.semantic-result DOM을 정리하여 반환(괄호, 화살표 등을 정리. 원본은 수정하지 않음.)
	 */
	function cleanSvocDOMs(div) {
		const parent = div.cloneNode(true);
		const extras = parent.querySelectorAll('.brkt,.line-end,canvas.curved_arrow');
		for (let i = 0, len = extras.length; i < len; i++) extras[i].remove();
		return parent;
	}

	/**
	 * 성분 태그(동사 제외)가 자식으로 성분 태그(동사 포함)를 지니면 .outer, 지니지 않으면 .inner 지정.
	 * 성분 태그의 rcomment를 depth에 따라 더 밑으로 위치시키기 위함.
	 * * 성분: s v o c oc m
	 */
	const posClasses = ['.s', '.v', '.o', '.po', '.to', '.go', '.ptco', '.appo', '.c', '.oc', '.a', '.m'];
	function checkPOSDepth(element) {
		const children = element.querySelectorAll('.sem');
		let base = posClasses.some(cls => element.matches(cls)) ? 1 : 0;
		let childBase = 0;
		
		// 자신의 depth 초기화
		element.removeAttribute('data-lv');
		if (children.length > 0 && !element.matches('.sem.v')) {
			for (let i = 0, len = children.length; i < len; i++) {
				childBase = Math.max(childBase, checkPOSDepth(children[i]));
			}
		}
		if(base) {
			if(childBase > 0) {
				element.classList.remove('inner');
				element.classList.add('outer');
				element.setAttribute('data-lv', childBase);
			}else {
				element.classList.remove('outer');
				element.classList.add('inner');
			}
		}
		return base + childBase;
	}

	const bracketclassList = ['acls', 'ncls', 'advcls', 'ccls', 'pcls', 'cls', 'adjphr', 'advphr', 'ptcphr', 'phr', 'conj'];
	const BRACKET_TYPES = {
		ccls: { type: 'ccls', brackets: ['{', '}'] }, pcls: { type: 'ccls', brackets: ['{', '}'] }, conj: { type: 'conj', brackets: ['(', ')'] },
		phr: { type: 'phr', brackets: ['(', ')'] }, adjphr: { type: 'adjphr', brackets: ['(', ')'] }, advphr: { type: 'phr', brackets: ['(', ')'] }, ptcphr: { type: 'phr', brackets: ['(', ')'] },
		acls: { type: 'acls cls', brackets: ['[', ']'] }, advcls: { type: 'advcls cls', brackets: ['[', ']'] }, ncls: { type: 'ncls cls', brackets: ['[', ']'] }, cls: { type: 'cls', brackets: ['[', ']'] },
	};
	
	/**
	 * 절과 구 태그 양쪽으로 괄호 태그를 추가.
	 * 절과 구는 아니지만 내부 성분 레이어를 가지는 성분 태그 양쪽에도 괄호 태그를 추가.
	 * + 분사구,to부정사구도 성분 레이어를 가질 수 있다.
	 */	
	function wrapWithBracket(div) {
		// 기존 괄호 제거
		Array.from(div.querySelectorAll('.cls-start,.cls-end,.ccls-start,.ccls-end,.phr-start,.phr-end,.adjphr-start,.adjphr-end,.conj-start,.conj-end,.etc-start,.etc-end')).forEach(el => el.remove())
		
		// 괄호 적용할 대상을 trim
		trimTextContent(div);
		
		// 괄호 적용 대상 선정
		$(div).find('.acls, .ncls, .advcls, .cls, .ccls, .pcls, .phr, .adjphr, .advphr, .ptcphr, .conj, .sem[data-lv]:not(:only-child), .ptc > .sem[data-lv], .tor > .sem[data-lv], .ger > .sem[data-lv]')
			.get().reverse().forEach(function(el) {
				
				// 괄호 타입과 모양 결정
				const clsType = bracketclassList.find(className => el.classList.contains(className)) || '';
				const { type, brackets } = BRACKET_TYPES[clsType] || { type: 'etc', brackets: ['[', ']'] };
				
				// 괄호 태그 생성
				let openBracket = div.ownerDocument.createElement('span');
				let closeBracket = div.ownerDocument.createElement('span');
				openBracket.className = `brkt ${type}-start`; closeBracket.className = `brkt  ${type}-end`;
				openBracket.textContent = brackets[0]; closeBracket.textContent = brackets[1];
				
				// cls나 etc 타입의 괄호끼리 레이어 처리
				if (brackets.includes('[')) {
					let childLv = parseInt(el.dataset.lv || 0);
					const elements = el.querySelectorAll('.sem[data-lv], .brkt[data-lv]');
					let maxLv = childLv;
					for (let i = 0; i < elements.length; i++) {
						const element = elements[i];
						const textContent = element.textContent.replace(/[[\](){}]/g, '');
						maxLv = Math.max(maxLv, parseInt(element.dataset.lv || 0) + (textContent.length > el.textContent.replace(/[[\](){}]/g, '').length ? 1 : 0));
					}
					if (maxLv > 0) { el.dataset.lv = maxLv; openBracket.dataset.lv = maxLv; closeBracket.dataset.lv = maxLv; }
				}
				el.insertAdjacentElement('beforebegin', openBracket);
				el.insertAdjacentElement('afterend', closeBracket);
			});
	}

	// ====================================================================
	// 3. 줄바꿈 라인 삽입
	// ====================================================================
	/**
	 * 화면상의 줄 끝마다 .line-end 요소를 추가.
	 * 수식선의 높이 결정에 영향.
	 */
	function checkLineEnds(div) {
		const rem = getRootEm(div.ownerDocument);
		$(div).find('.line-end').remove();

		// 말단 텍스트 노드들을 선택
		let textNodes = getTextNodes(div).filter(v => v.nodeType == Node.TEXT_NODE);
		
		// 모바일이나 프린트에서는 줄바꿈으로 인한 여백이 보기 싫으므로 word-break: break-all;
		if(getComputedStyle(div).wordBreak == 'break-all') {
			textNodes.forEach(n => {
				let a = n;
				while(a.length > 1) a = a.splitText(1);
			})
		} else {
			textNodes.forEach(function(n) {
				let unit = n;
				let match = unit.data.substring(1).match(/[\s-]/);
				while (unit.nodeType == Node.TEXT_NODE && match != null && (match.index > -1)) {
					// 줄바꿈 기준에 맞추어 텍스트를 분리.
					// 'A B' -> 'A',' B' 
					// 'A-B' -> 'A-','B'
					unit.splitText(match.index + (match[0] == '-' ? 2 : 1));
					unit = unit.nextSibling;
					match = unit.data.substring(1).match(/[\s-]/);
				}
			});
		}
		
		// 분리된 텍스트 노드들을 다시 선택.
		textNodes = getTextNodes(div).filter(v => v.nodeType == Node.TEXT_NODE);
		let pos = 0, prevNode;
		textNodes.forEach(n => {
			let range = document.createRange();
			range.selectNode(n);
			const nodeFirstRect = range.getClientRects()[0];
			
			// 이전 노드 끝보다 왼쪽에 시작하거나 마지막 노드일 경우 line-end 추가.
			if (nodeFirstRect != null && nodeFirstRect.x < (pos - 1*rem)) {
				let endWrapper = div.ownerDocument.createElement('span');
				endWrapper.className = 'sem line-end';
				endWrapper.insertAdjacentHTML('afterbegin', '&#8203;\n');  // zeroWidthSpace
				if (prevNode?.data?.match(/\S/)) { prevNode?.replaceWith(prevNode, endWrapper); } 
				else { prevNode?.replaceWith(endWrapper, prevNode); }
			}
			prevNode = n
			range.selectNode(prevNode);
			const endRects = range.getClientRects();
			if (endRects.length > 0) {
				const endRect = endRects[endRects.length - 1];
				pos = endRect.x + endRect.width;
			}
		});
		
		const lastEndWrapper = div.ownerDocument.createElement('span');
		lastEndWrapper.className = 'sem line-end';
		lastEndWrapper.insertAdjacentHTML('afterbegin', '&#8203;\n');  // zeroWidthSpace
		div.appendChild(lastEndWrapper);
	}

	// ====================================================================
	// 2. GComment 간섭 깊이 계산
	// ====================================================================
	/**
	 * 성분 태그를 제외한 태그들의 gcomment는 상단에 위치하므로 
	 * 간섭 여부에 따라 층을 만들어 표시.
	 * 
	 * 💡 강제 동기식 레이아웃(Reflow)을 방지하기 위해 
	 * Read(좌표 수집) -> Logic(충돌 계산) -> Write(스타일 적용) 순서로 분리하여 렌더링 최적화
	 */
	function checkGCDepth(div) {
		const rem = getRootEm(div.ownerDocument);
		const tagsWithGComment = Array.from(div.querySelectorAll('.sem[data-gc]'));
		const numTags = tagsWithGComment.length;
		// gcomment가 없으면 지연 없이 바로 다음 체이닝으로 넘어감
		if (numTags === 0) return;

		// [Phase 1: Read] DOM 측정 (기하 정보 수집)
		const metrics = tagsWithGComment.map(tag => {
			const rects = tag.getClientRects();
			const isOdd = tag.classList.contains('odd');
			const rect = (isOdd && rects.length > 1) ? rects[1] : rects[0];
			const gcStyle = getComputedStyle(tag, '::after');
			const gcWidth = parseFloat(gcStyle.width) || 0;
			const gcLeft = parseFloat(gcStyle.left) || 0;
			const gcRight = parseFloat(gcStyle.right) || 0;
			let top = rect ? rect.top : 0;
			let left = rect ? rect.left : 0;

			if (tag.classList.contains('rcm')) {
				if (tag.classList.contains('cmnt-align-start')) { left -= rem; } 
				else if (rect != null) { left += rect.width - gcWidth - gcRight; }
			} else { left += Math.max(0, gcLeft); }

			return {
				tag, top, left, gcWidth,
				isRcm: tag.classList.contains('rcm'), isTor: tag.classList.contains('tor'), isPtc: tag.classList.contains('ptc'),
				isAdjphr: tag.classList.contains('adjphr'), isAdvphr: tag.classList.contains('advphr'),
				textContent: tag.textContent, newGc: tag.dataset.gc, deleteGc: false, gcLv: undefined
			};
		});

		// [Phase 2: Logic] 간섭 계산
		for (let i = 0; i < numTags; i++) {
			const elMetric = metrics[i];
			let priorTop = elMetric.top;
			let priorLeft = elMetric.left;
			let base = 0;

			for (let j = i + 1; j < numTags; j++) {
				const currMetric = metrics[j];
				const priorMetric = metrics[j - 1];

				// gcomment 간섭(Overlap) 체크 조건
				if (Math.abs(priorTop - currMetric.top) < rem &&
					Math.abs(priorLeft - currMetric.left) < (5 + priorMetric.gcWidth) &&
					(!currMetric.isRcm || !priorMetric.isRcm || currMetric.textContent !== priorMetric.textContent)) {
					// 특수 조건: tor, ptc와 형용사/부사구의 병합 처리
					if (currMetric.isTor) {
						if (priorMetric.isAdjphr) { currMetric.deleteGc = true; priorMetric.newGc = '[to부정사 | 형용사구]'; break; } 
						else if (priorMetric.isAdvphr) { currMetric.deleteGc = true; priorMetric.newGc = '[to부정사 | 부사구]'; break; }
					} else if (currMetric.isPtc) {
						if (priorMetric.isAdjphr) { currMetric.deleteGc = true; priorMetric.newGc = '[분사 | 형용사구]'; break; } 
						else if (priorMetric.isAdvphr) { currMetric.deleteGc = true; priorMetric.newGc = '[분사 | 부사구]'; break; }
					}
					// 간섭이 발생했으므로 depth(층) 증가
					elMetric.gcLv = ++base;
				} else { break; }
				priorTop = currMetric.top;
				priorLeft = currMetric.left;
			}
		}

		// [Phase 3: Write] 계산 결과를 단일 프레임에 일괄 반영
		metrics.forEach(metric => {
			// gcLv 정리
			if (metric.gcLv !== undefined) metric.tag.dataset.gcLv = metric.gcLv;
			else delete metric.tag.dataset.gcLv;

			// gc 텍스트 병합/삭제 반영
			if (metric.deleteGc) delete metric.tag.dataset.gc;
			else if (metric.tag.dataset.gc !== metric.newGc) metric.tag.dataset.gc = metric.newGc;
		});
	}

	/**
	 * inner 태그끼리의 겹침을 없앤다. (V(S)V) -> (V)(S)(V)
	 * 목적어를 제외한 성분끼리 바로 앞뒤로 붙어있으면 하나의 태그로 합친다.
	 * (목적어는 간접목적어 직접목적어일 수 있다.)
	 */
	const INNER_SVOC_ARR = ['s','v','c','oc','a','po'];
	const INNER_SVOC_REGEX = Array.from(INNER_SVOC_ARR, s => `.inner.${s}`).toString()
	function splitInners(div) {
		const inners = div.getElementsByClassName('sem inner');
		for (let i = 0, len = inners.length; i < len; i++) {
			let one = inners[i];
			if (one == null) continue;
			
			// inner 내부에 inner가 있는 경우
			if (one.getElementsByClassName('sem inner').length > 0) {
				let range = new Range();
				const childNodes = one.childNodes;
				for (let j = 0, len2 = childNodes.length; j < len2; j++) {
					const child = childNodes[j];
					// 자식의 자식이 inner일 경우
					if (child.nodeType == Node.ELEMENT_NODE && child.getElementsByClassName('inner').length > 0) {
						child.childNodes.forEach(function(desc) {
							if (desc.nodeType != Node.ELEMENT_NODE || !desc.matches('.inner')) {
								let clone = div.ownerDocument.createElement('span');
								clone.className = 'sem v inner';
								clone.dataset.rc = one.dataset.rc; clone.dataset.rcMin = one.dataset.rcMin;
								range.selectNode(desc); range.surroundContents(clone);
							}
						});
					}
					// 자식이 inner가 아니거나 텍스트 노드일 경우
					else if (child.nodeType != Node.ELEMENT_NODE || !child.matches('.inner')) {
						let clone = div.ownerDocument.createElement('span');
						clone.className = 'sem v inner';
						clone.dataset.rc = one.dataset.rc; clone.dataset.rcMin = one.dataset.rcMin;
						range.selectNode(child); range.surroundContents(clone);
					}
				}
				one.outerHTML = one.innerHTML;
			}
			// inner 내부에 inner는 없고, 바로 다음 element와 동일한 성분이면 묶어주기.
			// 목적어-목적어는 제외.
			else if (one.matches(INNER_SVOC_REGEX)) {
				let next = one.nextSibling;
				if (next?.nextSibling?.nodeType == Node.ELEMENT_NODE) {
					let nextToNext = next.nextSibling;
					if (next.nodeType == Node.ELEMENT_NODE && next.matches(INNER_SVOC_REGEX) && hasSameInnerSvocClasses(one, nextToNext)) {
						one.insertAdjacentHTML('beforeEnd', next.innerHTML);
						next.remove(); 
						// 1,2,3에서 1을 검사하여 1,2가 합쳐져서 1+2,3이 됐다면 다시 1+2를 검사.
						i--;
					} else if (next.nodeType != Node.ELEMENT_NODE && (next.data == null || next.data.match(/[^\s]/) == null) && nextToNext.matches(INNER_SVOC_REGEX) && hasSameInnerSvocClasses(one, nextToNext)) {
						one.insertAdjacentHTML('beforeEnd', next.data + nextToNext.innerHTML);
						next.remove(); nextToNext.remove(); 
						// 1,2,3에서 1을 검사하여 1,2가 합쳐져서 1+2,3이 됐다면 다시 1+2를 검사.
						i--;
					}
				}
			}
		}
	}
	function hasSameInnerSvocClasses(element1, element2) {
		const classes1 = Array.from(element1.classList).filter(cl => INNER_SVOC_ARR.includes(cl));
		const classes2 = Array.from(element2.classList).filter(cl => INNER_SVOC_ARR.includes(cl));
		return classes1.every(cl => classes2.includes(cl));
	}
	
	/**
	 * 태그의 텍스트 내용에 trim을 적용하여 가장자리 공백을 표시에서 제외
	 * 중첩된 태그의 텍스트가 가장자리 공백을 가질 경우 내부 태그에서부터 부모 태그 순서대로 공백을 밀어낸다.
	 */
	function trimTextContent(div) {
		const sems = div.querySelectorAll('.sem:not(.line-end)');
		let blank = new Text(); blank.data = ' ';
		for (let i = sems.length - 1; i >= 0; i--) {
			let one = sems[i];
			if (!one.hasChildNodes()) continue;
			while (one.firstChild.nodeType == Node.TEXT_NODE && one.firstChild.data.startsWith(' ')) {
				one.firstChild.data = one.firstChild.data.substring(1);
				one.parentNode.insertBefore(blank.cloneNode(), one);
			}
			while (one.lastChild.nodeType == Node.TEXT_NODE && one.lastChild.data.endsWith(' ')) {
				one.lastChild.data = one.lastChild.data.slice(0, -1);
				one.parentNode.insertBefore(blank.cloneNode(), one.nextSibling);
			}
		}
	}

	/**
	 * 분석결과 DOM의 레이아웃을 최종적으로 정렬하고 수식선을 그리는 마스터 함수.
	 * 
	 * 💡 Time Stop 렌더링: 
	 * 닫혀있는 아코디언 내부에서도 좌표 계산이 가능하도록 요소들을 임시로 전개(display: block)한 뒤, 
	 * 모든 DOM 계산이 끝나면 원복합니다. (Reflow 최소화)
	 */
	async function correctMarkLine(div) {
		if(!div) return;
		// 🌟 1. Time Stop을 걸기 '전'에 화살표 모듈부터 100% 준비시킵니다.
	    // (여기서 기다리는 동안에는 어차피 화면이 닫혀 있으므로 아무 문제가 없습니다)
	    await loadDrawingArrowModule();
		
		// 🌟 2. [Time Stop 시작] 나를 숨기고 있는 닫힌 아코디언 껍데기들 모두 찾기
		const hiddenAncestors = [];
		let curr = div;
		
		while (curr && curr.nodeType === 1 && curr !== document.documentElement) {
			const computedStyle = getComputedStyle(curr);
			if (computedStyle.display === 'none' || computedStyle.height === '0px') {
				hiddenAncestors.push({
					el: curr,
					origStyle: curr.getAttribute('style') || ''
				});
			}
			curr = curr.parentNode;
		}

		// 🌟 제자리 강제 전개 (position: absolute 절대 안 씀!)
		// 원래 레이아웃 흐름을 100% 유지한 채로 브라우저 몰래 펼침.
		hiddenAncestors.forEach(item => {
			item.el.style.setProperty('display', 'block', 'important');
			item.el.style.setProperty('visibility', 'hidden', 'important');
			item.el.style.setProperty('height', 'auto', 'important');
		});

		// --- 1단계: 마크 라인 및 코멘트 정렬 ---
		// 1. Write Phase: 텍스트 없는 태그 삭제 및 클래스 초기화
		div.removeAttribute('style');
		
		const semNodes = Array.from(div.getElementsByClassName('sem'));
		semNodes.forEach(elem => {
			if (!elem.textContent.trim()) elem.remove();
			// 정렬 관련 클래스 리셋
			elem.classList.remove('cmnt-align-center', 'cmnt-align-start', 'odd');
		});
		
		const elements = semNodes.filter(el => !el.classList.contains('line-end') && el.parentNode);
		
		// 2. Read Phase: DOM을 수정하지 않고 좌표 정보만 수집
		const updates = elements.map(el => {
			const rects = el.getClientRects();
            let state = 'center'; // 기본값 (rects.length <= 1 일 때)
            let indent = null;
            let indentMin = null;
			if (rects.length > 1) {
				if (el.matches('.rcm') || rects[0].width < 10) {
					/* 단어가 위 아래 두 그룹으로 분리되었으나 첫 번째 그룹에 코멘트를 표기하기 어려울 경우
					  첫 번째 그룹은 무시하고 두 번째 그룹에 가운데 정렬 적용.(=.odd)  
					  left위치는 첫번째 그룹을 기준으로 적용되므로 
					  첫 번째, 두 번째 그룹의 left값 차이만큼 왼쪽으로 이동. */
                    state = 'odd'; // 그룹 분리 + 코멘트 예외 처리
					const indentVal = (el.matches('.rcm') ? rects[rects.length - 1].right : rects[1].left) - rects[0].left;
					indent = `${indentVal}px`;
					indentMin = `${el.matches('.rcm') ? indentVal : (indentVal + rects[1].width / 2)}px`;
				}else {
					state = 'start' // 일반적인 다중 줄 처리
				}
			}
			return { el, state, indent, indentMin };
		});

		// 3. Write Phase: 수집된 정보를 바탕으로 일괄 DOM 업데이트
		updates.forEach(({ el, state, indent, indentMin }) => {
			switch (state) {
				case 'odd':
                    el.style.setProperty('--indent', indent);
                    el.style.setProperty('--indent-min', indentMin);
                    el.classList.add('cmnt-align-center', 'odd');
                    break;

                case 'start':
                    el.style.removeProperty('--indent');
                    el.style.removeProperty('--indent-min');
                    el.classList.add('cmnt-align-start');
                    break;

                case 'center': // 기본값 (rects.length <= 1 인 경우)
                default:
                    el.style.removeProperty('--indent');
                    el.style.removeProperty('--indent-min');
                    el.classList.add('cmnt-align-center');
                    break;
            }
		});

		// 🌟 100% 완벽한 크기가 확보된 상태에서 체이닝 순차 실행
		checkGCDepth(div);
		checkLineEnds(div);
		adjustLineHeight(div);
		drawConnections(div);

		// 🌟 [Time Stop 해제] 브라우저가 화면을 그리기 직전에 껍데기들을 다시 닫아놓음
		hiddenAncestors.forEach(item => {
			if (item.origStyle) {
				item.el.setAttribute('style', item.origStyle);
			} else {
				item.el.removeAttribute('style');
			}
		});
	}

	
	// ====================================================================
	// 5. 캔버스 수식선 및 이음선 렌더링 (화살표 모듈 비동기 로드 / 절대 좌표 매핑)
	// ====================================================================
	/**
	 * 수식 관계에 대한 화살표를 표시한다.
	 * 수식 대상과 수식어의 상대적 위치에 따라 화살표의 길이 및 높이를 달리 표현한다.
	 * 높이가 있는 gcomment와 괄호를 연결하는 선을 표시한다.
	 *
	 * @param div 수식태그와 수식대상을 포함하는 부모 element
	 */
	function drawConnections(div, settings) {
		
		Array.from(div.querySelectorAll('.curved_arrow,.gc_line')).forEach(line => line.remove());
		
		const ownerDocument = div.ownerDocument;
		const rem = getRootEm(ownerDocument);

		// 🌟 jQuery .offset() 퇴출. getBoundingClientRect() 기반의 정밀 계산
		const divRect = div.getBoundingClientRect();
		const scrolledDivLeft = -divRect.left;
		const scrolledDivTop = -divRect.top;

		let drawSettings1 = Object.assign({ lineWidth: rem / 10, size: rem / 3, strokeStyle: '#FFCC99', header: false }, settings),
			drawSettings2 = Object.assign({ lineWidth: rem / 10, size: rem / 3, strokeStyle: '#FFCC99' }, settings);
		
		let eachLineRects = [], currentLineTop = divRect.top;
		
		// 현재 각 줄의 상단위치, 하단 위치를 모은다.
		const lineEnds = div.querySelectorAll('.line-end');
		for (let i = 0, len = lineEnds.length; i < len; i++) {
			const bottom = currentLineTop + parseFloat(getComputedStyle(lineEnds[i]).lineHeight);
			eachLineRects.push({ top: currentLineTop, bottom });
			currentLineTop = bottom;
		}
		
		// DOM 삽입 부하를 줄이기 위해 Fragment 생성 (가상 DOM)
		const canvasFragment = document.createDocumentFragment();
		
		// 수식어들을 돌면서 수식선을 그린다
		const modifiers = div.querySelectorAll('[data-mfd]');
		for (let i = modifiers.length - 1; i >= 0; i--) {
			const modifier = modifiers[i];
			const modifierChildNodes = getTextNodes(modifier).filter(node => node.textContent != '\u200b\n');
			const modificand = div.querySelector(`.sem.mfd-${modifier.dataset.mfd}`);
			if (modificand == null) continue;

			const modificandChildNodes = getTextNodes(modificand).filter(node => node.textContent != '\u200b\n');
			const mdfChildLen = modifierChildNodes.length, mdfdChildLen = modificandChildNodes.length;
			let i_mb = 0, i_me = mdfChildLen - 1, i_tb = 0, i_te = mdfdChildLen - 1;
			let modBeginNode = modifierChildNodes[i_mb++], modEndNode = modifierChildNodes[i_me--],
				targetBeginNode = modificandChildNodes[i_tb++], targetEndNode = modificandChildNodes[i_te--];
			
			if (targetEndNode && targetEndNode.parentElement && targetEndNode.parentElement.classList.contains('line-end')) { targetEndNode = modificandChildNodes[i_te--]; }
			for (; i_mb < mdfChildLen && modBeginNode.length === 0; i_mb++) modBeginNode = modifierChildNodes[i_mb];
			for (let j = i_me; j >= 0 && modEndNode.length === 0; j--) modEndNode = modifierChildNodes[j];
			for (; i_tb < mdfdChildLen && targetBeginNode.length === 0; i_tb++) targetBeginNode = modificandChildNodes[i_tb];
			for (let j = i_te; j >= 0 && targetEndNode.length === 0; j--) targetEndNode = modificandChildNodes[j];
			
			const modLeftCoord = getCoords(modBeginNode)[0], modRightCoord = getCoords(modEndNode).slice(-1)[0],
				  targetLeftCoord = getCoords(targetBeginNode)[0], targetRightCoord = getCoords(targetEndNode).slice(-1)[0];
				  
			if (!(modLeftCoord && modRightCoord && targetLeftCoord && targetRightCoord)) continue;
			
			const modLeftTop = modLeftCoord.top + getTextTopMove(modBeginNode), modRightTop = modRightCoord.top + getTextTopMove(modEndNode),
				  targetLeftTop = targetLeftCoord.top + getTextTopMove(targetBeginNode), targetRightTop = targetRightCoord.top + getTextTopMove(targetEndNode);

			const textareaWidth = divRect.width || parseFloat(getComputedStyle(div).width) || 0;
			let arrowHeight = 15;
			let first, last, startX = scrolledDivLeft, startY = scrolledDivTop, endX = scrolledDivLeft, endY = scrolledDivTop;
			let interLines = [];

			if (targetRightTop + targetRightCoord.height < modLeftTop) {
				first = targetRightCoord; last = modLeftCoord;
				startX += modLeftCoord.left + rem / 3; startY += modLeftTop - rem;
				endX += targetRightCoord.right - rem / 3; endY += targetRightTop - rem;
				drawSettings1.p0x = 0; drawSettings2.p0y = endY; drawSettings2.p0x = textareaWidth; drawSettings2.p1y = endY;
			} else if (targetLeftTop > modRightTop + modRightCoord.height) {
				first = modRightCoord; last = targetLeftCoord;
				startX += modRightCoord.right - rem / 3; startY += modRightTop - rem;
				endX += targetLeftCoord.left + rem / 3; endY += targetLeftTop - rem;
				drawSettings1.p0x = textareaWidth; drawSettings2.p0y = endY; drawSettings2.p0x = 0; drawSettings2.p1y = endY;
			} else if (targetRightCoord.x < modLeftCoord.x) {
				first = targetRightCoord; last = modLeftCoord;
				startX += modLeftCoord.left + rem / 3; startY += modLeftTop - rem;
				endX += targetRightCoord.right - rem / 3; endY += targetRightTop - rem;
				drawSettings1.p0x = (startX + endX) / 2; drawSettings2.p0y = startY; drawSettings2.p0x = (startX + endX) / 2; drawSettings2.p1y = startY;
			} else if (targetLeftCoord.x > modRightCoord.x) {
				first = modRightCoord; last = targetLeftCoord;
				startX += modRightCoord.right - rem / 3; startY += modRightTop - rem;
				endX += targetLeftCoord.left + rem / 3; endY += targetLeftTop - rem;
				drawSettings1.p0x = (startX + endX) / 2; drawSettings2.p0y = startY; drawSettings2.p0x = (startX + endX) / 2; drawSettings2.p1y = startY;
			}

			if (!(first && last)) continue;
			const yMin = Math.min(first.top, last.top), yMax = Math.max(first.top, last.top);
				  
			for (let j = 0, len2 = eachLineRects.length; j < len2; j++) {
				const rect = eachLineRects[j];
				// 🌟 Y축 보정도 Native rect 기반으로 오차 없이 맵핑
				if (rect.top > yMin && rect.bottom < yMax) { interLines.push(rect.bottom - divRect.top - rem); }
			}

			drawSettings1.className = `curved_arrow start mfd${modifier.dataset.mfd}`; drawSettings2.className = `curved_arrow end mfd${modifier.dataset.mfd}`;
			drawSettings1.p0y = startY - arrowHeight; drawSettings1.p1x = startX; drawSettings1.p1y = startY - arrowHeight; drawSettings1.p2x = startX; drawSettings1.p2y = startY;
			drawSettings2.p0y -= arrowHeight; drawSettings2.p1x = endX; drawSettings2.p1y -= arrowHeight; drawSettings2.p2x = endX; drawSettings2.p2y = endY;

			drawCurvedArrow(canvasFragment, drawSettings1); drawCurvedArrow(canvasFragment, drawSettings2);

			for (let j = 0, len2 = interLines.length; j < len2; j++) {
				drawHorizontal(0, interLines[j], arrowHeight, textareaWidth, canvasFragment, drawSettings1);
			}
		}

		// [gcomment 이음선 표시]
		const elementsHaveGcLv = div.querySelectorAll('[data-gc-lv]');
		for (let i = 0, len = elementsHaveGcLv.length; i < len; i++) {
			const el = elementsHaveGcLv[i];
			const commentCss = getComputedStyle(el, '::after');
			
			const rects = el.getClientRects();
			const rect = rects[el.matches('.odd') && rects.length > 1 ? 1 : 0] || rects[0];
			if (!rect) continue; // 요소가 크기를 갖지 못하면 이음선 패스

			const commentTop = (el.matches('.odd') ? (rem - parseFloat(commentCss.bottom)) : parseFloat(commentCss.top)) + scrolledDivTop + rect.top;
			const commentLeft = Math.max(7, parseFloat(commentCss.left)) + scrolledDivLeft + rect.left;
			
			let options = {
				p0x: commentLeft, p0y: commentTop + 0.35 * rem, p1y: commentTop + 0.35 * rem,
				curve: false, lineWidth: 1, header: false, size: 2, className: 'gc_line', strokeStyle: 'rgb(158,175,234)'
			};

			if (el.matches('.cls,.ncls,.acls,.advcls,.phr,.adjphr,.advphr,.ptcphr')) {
				const prevEl = el.previousElementSibling;
				const prevRects = prevEl ? prevEl.getClientRects() : [];
				const prevLastRect = prevRects.length > 0 ? prevRects[prevRects.length - 1] : null;

				options.p1x = scrolledDivLeft + rect.left - 0.25 * rem;
				options.p2x = options.p1x;
				options.p2y = scrolledDivTop + (el.matches('.odd') || !prevLastRect ? (rect.top) : (prevLastRect.top + prevLastRect.height * 0.17));
			} else {
				options.p1x = scrolledDivLeft + rect.left + 0.25 * rem;
				options.p2x = options.p1x;
				options.p2y = scrolledDivTop + rect.top;
			}
			drawCurvedArrow(canvasFragment, options);
		}
		
		div.appendChild(canvasFragment);
	}

	/**
	 * 대상 노드(텍스트노드 포함)의 실제 사각 정보(top,left,right,width 등)를 반환
	 */
	function getCoords(node) {
		let range = node.ownerDocument.createRange(); range.selectNodeContents(node);
		const rects = Array.from(range.getClientRects()); const filteredRects = rects.filter(r => r.width > 0);
		return filteredRects.length > 0 ? [filteredRects[0], filteredRects[filteredRects.length - 1]] : [null, null];
	}

	/**
	 * 대상 텍스트노드 top 위치 변경치 반환(-top+fontSize)
	 */
	function getTextTopMove(node) {
		return (parseFloat(getComputedStyle(node.parentElement).fontSize) || 16) - (parseFloat(getComputedStyle(node.parentElement).top) || 0);
	}

	/**
	 * 주어진 시작지점부터 일정 길이의 수평의 직선을 그린다.
	 */
	function drawHorizontal(xPos, yPos, height, length, div, settings) {
		const padding = settings.size - settings.lineWidth;
		let canvas = div.ownerDocument.createElement('canvas');
		canvas.className = settings.className.replace('start', 'btwn');
		canvas.style.position = 'absolute';
		canvas.style.top = `${yPos - height - padding}px`; canvas.style.left = `${xPos - padding}px`;
		canvas.dataset.height = height;

		let ctx = canvas.getContext('2d');
		canvas.style.width = `${2 * padding + length}px`; canvas.style.height = `${2 * padding + settings.lineWidth}px`;
		
		// 디바이스 픽셀 비율에 의한 흐릿함 보정
		const dpr = window.devicePixelRatio || 1;
		canvas.width = (2 * padding + length) * dpr; canvas.height = (2 * padding + settings.lineWidth) * dpr;
		ctx.scale(dpr, dpr);

		ctx.strokeStyle = settings.strokeStyle; ctx.lineWidth = settings.lineWidth;
		ctx.moveTo(padding, padding); ctx.lineTo(length + padding, padding); ctx.stroke();
		div.append(canvas);
	}

	// ====================================================================
	// 4. 줄 높이 계산 적용
	// ====================================================================
	/**
	 * 각 줄마다 높이를 컨텐츠들 높이에 맞춘다.
	 * line-height: 윗줄과 아랫줄의 DOMRect offset 차이. 0이면 완전히 겹쳐진다.
	 
	 Tandem에서 쓰인 글꼴들 주요 크기 정보(font-size:1000px 기준. baseLine으로부터의 거리)
	 ※ 특수상단 및 특수하단: 특정 기호 표시만을 위해 사용한 폰트의 경우 해당 기호의 크기 따로 필요.
	 	
		  폰트명					|Box상단	|Box하단		|대문자상단	|소문자상단	|특수상단	|특수하단
	 ------------------------------------------------------------------------------
	 *	Corbel(문장텍스트)			|952		|-269			|653		|464
	 
	 *	Heebo(대괄호)				|1048		|-421			|711		|575		|811		|-152
	 
	 *	Raleway Dots(점대괄호)		|918		|-213			|710		|520		|726		|-29
	 
	 *	Cardo(중괄호)				|990		|-364			|688		|449		|847		|-184
	 
	 *	Poller One(소괄호)			|938		|-251			|726		|484		|825		|-238
	 
	 *	Nanumbarunpen(gcomment)		|970		|-304			|724		|437
	 
	 *	Nanum Gothic(rcomment)		|850		|-300			|700		|500
	 
	 */
	function adjustLineHeight(div) {
		const rem = getRootEm(div.ownerDocument);
		
		// 미리 기본 줄 높이를 부족할 정도로 낮춘다.
		div.style.lineHeight = '1rem';
		
		// 말단 텍스트 노드들을 선택
		const textNodes = getTextNodes(div);
		
		const styleUpdates = []; // Write 작업을 모아둘 캐시 배열
		let lineNumber = 0;
		let prevLineLowerHeight = 0, maxContentHeight = 0, maxUpperHeight = 0, maxLowerHeight = 0;

		// pseudo element(::before, ::after)를 갖고 있으면 높이에 포함.
		function getPseudoHeights(node, rect, rem) {
			const parent = node.parentElement;
			const $parents = $(parent).parents('.sem').add(parent.matches('.sem') ? parent : null), parentsLen = $parents.length;
			let upperHeight = 0, lowerHeight = 0;
			for (let i = 0; i < parentsLen; i++) {
				const oneParent = $parents.get(i);
				const parentRects = oneParent.getClientRects(), firstRect = parentRects[0], oddRect = parentRects[1];
				const nearFirstNode = (!oneParent.matches('.odd') && Math.max(Math.abs(firstRect.left - rect.left), Math.abs(firstRect.top - rect.top)) < 16);
				const nearOddNode = (oneParent.matches('.odd') && (oddRect != null) && Math.max(Math.abs(oddRect.left - rect.left), Math.abs(oddRect.top - rect.top)) < 16);

				// [1. 성분표시 밑줄 높이 적용.(최상위 부모의 것 적용)]
				// ORL: OutmostRcommentLine
				const ORL = $(oneParent).parents('[data-rc]').get(0) || (oneParent.matches('[data-rc]') ? oneParent : null);
				let underlineHeight;
				if (ORL != null) { underlineHeight = parseFloat(getComputedStyle(ORL).paddingBottom); lowerHeight = Math.max(lowerHeight, underlineHeight); }
				
				// [2. 부모 요소(this) rcomment의 높이 적용.]
				const beforeStyle = getComputedStyle(oneParent, '::before');

				if (oneParent.matches('[data-rc]') && nearOddNode && isFinite(parseFloat(beforeStyle.bottom))) {
					lowerHeight = Math.max(lowerHeight, underlineHeight, 0 - parseFloat(beforeStyle.bottom) 
						// 모바일은 rcomment에 padding 들어감
						+ (portraitList.matches ? parseFloat(beforeStyle.paddingBottom) : 0) - parseFloat(beforeStyle.lineHeight) * 0.5 + parseFloat(beforeStyle.fontSize) * 0.5);
				} else if (oneParent.matches('[data-rc]') && nearFirstNode && isFinite(parseFloat(beforeStyle.top))) {
					lowerHeight = Math.max(lowerHeight, underlineHeight, parseFloat(beforeStyle.top) - rem * 1.35 
						// 모바일은 rcomment에 padding 들어감
						+ (portraitList.matches ? parseFloat(beforeStyle.paddingBottom) : 0) + parseFloat(beforeStyle.lineHeight) * 0.5 + parseFloat(beforeStyle.fontSize) * 0.5);
				}

				// [3. 부모 요소(this)가 자신(node,rect)과 가깝다면 부모 gcomment 높이 적용.]
				if (oneParent.matches('[data-gc]') && (nearFirstNode || nearOddNode)) {
					const afterStyle = getComputedStyle(oneParent, '::after');
					upperHeight = Math.max(upperHeight, oneParent.matches('.odd') ? ((parseFloat(afterStyle.bottom) || 0) + parseFloat(afterStyle.lineHeight) * 0.5 + parseFloat(afterStyle.fontSize) * 0.5) : (parseFloat(afterStyle.fontSize) * 0.5 - parseFloat(afterStyle.top) - parseFloat(afterStyle.lineHeight) * 0.5));
				}
			}
			return { upperHeight, lowerHeight };
		}

		// 각 줄의 최고 높이에 해당하는 줄높이를 갖는 span을 줄 끝에 삽입.
		for (let i = 0, len = textNodes.length; i < len; i++) {
			let n = textNodes[i];
			let range = new Range(); range.selectNode(n);
			const nodeFirstRect = range.getClientRects()[0], parentEl = n.parentElement;
			
			// 공백이 아닌 노드면 높이를 측정 후 최고 높이를 갱신.
			if (nodeFirstRect != null && n.data != null && n.data.match(/[^\s]/) != null) {
				let contentHeight = nodeFirstRect.height;
				// 대괄호의 경우 contentHeight 따로 계산
				if (parentEl.matches('.etc-start,.etc-end,.cls-start,.cls-end')) {
					// 괄호 실질크기: height의 66%, 윗부분: 84%, 아래부분: 16%, 
					// 중심: 텍스트 bottom(top 0 기준)
					contentHeight = rem * 1.35;
					const top = parseFloat(getComputedStyle(parentEl).top)
					let brktHeight, brktTop, brktBottom;
					if (parentEl.matches('.cls-start,.cls-end')) {
						brktHeight = nodeFirstRect.height * 963 / 1469; brktTop = brktHeight * 811 / 963 - top - contentHeight; brktBottom = brktHeight * 152 / 963 + top;
					} else {
						brktHeight = nodeFirstRect.height * 755 / 1131; brktTop = brktHeight * 726 / 755 - top - contentHeight; brktBottom = brktHeight * 29 / 755 + top;
					}
					maxUpperHeight = Math.max(maxUpperHeight, brktTop); maxLowerHeight = Math.max(maxLowerHeight, brktBottom);
				}
				
				// 마지막 노드(line-end)가 아닐 경우 최고 높이 갱신.
				if (parentEl == null || !parentEl.classList.contains('line-end')) {
					maxContentHeight = Math.max(maxContentHeight, contentHeight);
					const pseudoHeights = getPseudoHeights(n, nodeFirstRect, rem);
					maxUpperHeight = Math.max(maxUpperHeight, pseudoHeights.upperHeight); maxLowerHeight = Math.max(maxLowerHeight, pseudoHeights.lowerHeight);
				}
				// 계산된 최대높이를 line-end에 적용
				else {
					// line-height 조정의 목적은 윗줄의 lower 요소들과 현재줄의 upper요소들의 겹침 방지이다.
					// 따라서 '윗줄 lower 높이 + 현재줄 upper 높이 + 텍스트 높이'만큼의 차이 필요.
					const calcLineHeight = Math.max(maxContentHeight, rem * 1.35 + maxUpperHeight + prevLineLowerHeight + (lineNumber > 0 ? (rem * 0.5/*여유 간격*/) : 0));
					styleUpdates.push({ element: parentEl, lineHeight: `${calcLineHeight}px`, isLastLine: (i === len - 1), paddingBottom: `${maxLowerHeight}px` });
					prevLineLowerHeight = maxLowerHeight; maxContentHeight = 0; maxUpperHeight = 0; maxLowerHeight = 0; lineNumber++;
				}
			}
		}

		styleUpdates.forEach(update => { update.element.style.lineHeight = update.lineHeight; });
		if (styleUpdates.length > 0 && styleUpdates[styleUpdates.length - 1].isLastLine) {
			div.style.paddingBottom = styleUpdates[styleUpdates.length - 1].paddingBottom;
		}
	}

	/**
	* 자식을 더이상 갖지 않는 텍스트 노드들을 모두 선택하여 반환.
	*/
	function getTextNodes(container) {
	    const textNodes = []; 
		// NodeFilter.SHOW_TEXT를 사용하여 텍스트 노드만 빠르게 추출
		const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false); let node;
	    while (node = walker.nextNode()) textNodes.push(node);
	    return textNodes;
	}

	/**
	 * 부모와 자식 노드를 서로 맞바꿈. (손자 노드들은 제자리)
	 */
	function swapParentAndChild(parent, child) {
		if(!parent.contains(child)) { console.warn(`${parent}는 ${child}의 부모가 아닙니다.`); return; }
		parent.parentNode.replaceChild(child, parent);
		Array.from(child.childNodes).forEach(descendant => parent.appendChild(descendant));
		child.appendChild(parent);
	}

	window['tandem'] = { showSemanticAnalysis, checkGCDepth, checkPOSDepth, svocText2Arr, svocArr2Text, cleanSvocDOMs, correctMarkLine, createBasicDOMs, drawConnections, splitInners, getSvocBytes, trimTextContent, wrapWithBracket, swapParentAndChild };
})(jQuery, this, document);
