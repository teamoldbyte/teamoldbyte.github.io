/** GramMeta 정보 추출
 @author LGM
 */
(function($, window, document) {
	window.gramMetaStrFromDOM = function(div) {
		return gramMetaArr2Str(gramMetaFromSemantics(semanticsFromDOMs(div)));
	}
	
	/** DOM을 분석하여 문법 특징 파악
	 */
	window.semanticsFromDOMs = (function() {
		const allTypes = ['s','v','o','c','a','oc','m','rcm','tor','ger','ptc','conj',
				'phr','adjphr','advphr','ptcphr','cls','ncls','acls','advcls','ccls','pcls'];
		const formComponents = ['s','v','o','c','a','oc','m']; // 문장형식 요소들
		const relPronounKeywords = ['who','whose','whom','which','that']; // 관계대명사
		// 부사절 접속사
		const advConjKeywords = ['if','unless','when','while','until','before','after','because','since','though','although','even though','so that','such that','as if','as','where'];
		const ccKeywords = ['for','beside','yet','nor'];	// 특수 등위접속사들
		// 전치사
		const prepKeywords = ['aboard','about','above','according','across','after','against','ahead of','along with','alongside','along','amidst','amid','amongst','among','anti','apart from','around','as for','as per','as to','as well as','as of','aside','astride','as','atop','at','away from','barring','bar','because of','before','behind','below','beneath','besides','beside','between','beyond','but for','but','by means of','by','circa','close to','concerning','considering','contrary to','counting','cum','despite','depending on','down','due to','during','except for','excepting','except','excluding','following','forward of','for','from','further to','given','gone','in addition to','in between','in case of','in face of','in favour of','in front of','in lieu of','in spite of','in view of','into','including','inside','instead of','in','less','like','minus','near to','near','next to','notwithstanding','off','of','on account of','on behalf of','on board','on to','onto','on top of','on','opposite to','opposite','other than','out of','out','outside of','outside','over','owing to','past','pending','per','plus','preparatory to','prior to','pro','re','regarding','regardless of','respecting','round','save','save for','saving','since','through','thru','throughout','till','together with','touching','toward','towards','to','than','thanks to','underneath','under','unlike','until','up against','up to','up until','upon','up','versus','via','with reference to','with regard to','without','within','with'];
		function findClassIn(element, classes) {
			return classes.find(one => element.classList.contains(one));
		}
		function findRPKeyword(element, givenKey) {
			let rpKeyword = null;
			// 탐색할 관계대명사가 주어진 경우(부모 형용사절의 자식 형용사절에 대한 탐색)
			if(givenKey != undefined) {
				// 주어진 관계대명사를 갖고 있다면 true, 아니라면 false를 반환
				return element.textContent.match(new RegExp(`\\b${givenKey}\\b`,'gi')) != null;
			}
			for(let i = 0, len = relPronounKeywords.length; i < len; i++) {
				const keyword = relPronounKeywords[i];
				// 특정 관계대명사가 자식 형용사절이 아닌 자신만의 것이라면 관계대명사를 반환
				// 'OO로 시작'이 아닌 'OO를 포함'이라는 식을 쓰는 이유는, 'most of whom'과 같은 형태가 있을 수 있기 때문 
				if(element.textContent.match(new RegExp(`\\b${keyword}\\b`,'gi'))?.length > Array.from(element.querySelectorAll('.acls')).filter(child => findRPKeyword(child, keyword)).length) {
					rpKeyword = keyword;
					break;
				}
			}
			return rpKeyword;
		}
		function findAdvKeyword(element) {
			let advKeyword = null;
			for(let i = 0, len = advConjKeywords.length; i < len; i++) {
				const keyword = advConjKeywords[i];
				if(element.textContent.length > 0 
				&& element.textContent.toLowerCase().startsWith(keyword)) {
					advKeyword = keyword;
					break;
				}
			}
			return advKeyword;
		}
		function findCCKeyword(element) {
			let ccKeyword = null;
			for(let i = 0, len = ccKeywords.length; i < len; i++) {
				const keyword = ccKeywords[i];
				// 특정 등위접속사가 자신의 앞에 있다면 반환.
				// 일반적으로 등위접속사에 태그가 적용돼있지 않기 때문에, 자신의 바로 앞은 빈 칸, 그 앞이 등위접속사이다.
				// .wholeText를 통해 인접 텍스트노드를 모두 읽기 때문에 ' and ' 같은 형태로 읽혀진다.
				if(element.previousSibling != null &&
				(new RegExp(`${keyword} $`,'i')).test(element.previousSibling.wholeText)) {
					ccKeyword = keyword;
					break;
				}
			}
			return ccKeyword;
		}
		function findPrepKeyword(element) {
			let prepKeyword = null;
			// 전치사구가 어떤 전치사를 시작으로 하고 있는지를 반환.
			for(let i = 0, len = prepKeywords.length; i < len; i++) {
				const keyword = prepKeywords[i];
				if(element.textContent.length > 0 
				&& element.textContent.toLowerCase().startsWith(keyword)) {
					prepKeyword = keyword;
					break;
				}
			}
			return prepKeyword;		
		}
		function tenseAppendedPtc(element) {
			return /^\w+ing\b/.test(element.textContent) ? 'ap' : 'pp';
		}
		function getPtcModi(element) {
			const modifier = document.querySelector(`[data-mfd="${element.className.match(/mfd-(\d+-\d+)/)[1]}"]`);
			if(modifier.classList.contains('ptc')) {
				const ptctense = tenseAppendedPtc(modifier);
				if(element.compareDocumentPosition(modifier) & 2) {
					return `pre_${ptctense}`;
				}else return `post_${ptctense}`;
			}else return null;
		}
		function privFunc(div) {
			const cloneDiv = div.cloneNode(true);
			const children = cloneDiv.children;
			let semantics = [];
			for(let i = 0, len = children.length; i < len; i++) {
				const child = children[i], grandChild = child.firstElementChild;
				let oneRole;
				
				// 한 문자열이 2개의 문법태그를 가질 경우
				if(child.childElementCount > 0 && grandChild.textContent == child.textContent) {
					const outerClass = findClassIn(child, allTypes),
						innerClass =  findClassIn(grandChild, allTypes);
					let type;
					// 필수성분 태그를 바깥으로, 품사 태그를 안쪽으로 재정렬
					if(findClassIn(grandChild, formComponents)) {
						oneRole = innerClass; type = outerClass;
					}else {
						oneRole = outerClass; type = innerClass;
					}
					child.parentElement.replaceChild(grandChild,child)
					
					// 문법요소 목록에 추가하되, type으로써 품사를 추가
					if(oneRole) {
						const sem = {key: oneRole, type: type, text: child.textContent, children: privFunc(grandChild)};
						if(sem.type == 'phr') {
							const prep = findPrepKeyword(grandChild);
							if(prep) sem.prep = prep;
						}else if(sem.type == 'acls') {
							const rp = findRPKeyword(grandChild);
							if(rp) sem.rp = rp;
						}else if(sem.type == 'advcls') {
							const adv = findAdvKeyword(grandChild);
							if(adv) sem.adv = adv;
						}else if(sem.type == 'ptc') {
							const ptctense = tenseAppendedPtc(grandChild);
							if(ptctense) sem.type = ptctense;
						}
						semantics.push(sem);
					}
				}
				// 한 문자열이 하나의 태그로만 이루어진 경우
				else {
					oneRole = findClassIn(child, allTypes);
					if(oneRole) {
						const sem = {key: oneRole, text: child.textContent, children: privFunc(child)};
						if(sem.key == 'phr') {
							const prep = findPrepKeyword(child);
							if(prep) sem.prep = prep;
						}else if(sem.key == 'ccls') {
							const cc = findCCKeyword(child);
							if(cc) sem.cc = cc;
						}else if(sem.key == 'ptc') {
							const ptctense = tenseAppendedPtc(child);
							if(ptctense) sem.key = ptctense;
						}else if(sem.key == 'rcm') {
							const ptcmodi = getPtcModi(child);
							if(dir) sem.ptcmodi = ptcmodi;
						}
						semantics.push(sem);
					}
				}
			}
			return semantics;
		}
		return privFunc;
	}());
	/**
	semantics 배열로부터 GramMeta 정보 생성
	 */
	var gramMetaFromSemantics = (function() {
		// GramMeta에 없는 값은 소문자로 구별
		const roleTable = {s: 'SUBJ', v: 'VERB', o: 'OBJ', c: 'COMP', oc: 'OC', a: 'ADV', m: 'MODI',
				rcm: 'MODI', tor: 'TO', ger: 'GER', ptc: 'PTC', ap: 'AP', pp: 'PP', conj: 'conj', phr: 'PREP', 
				adjphr: 'adjphr', advphr: 'advphr', ptcphr: 'ptcphr', cls: 'CLAUSE',
				ncls: 'NCLS', acls: 'ACLS', advcls: 'ADVCLS', ccls: 'CCLS', pcls: 'PCLS'};
				
		function hasKey(arr, keyName, keyValue) {
			return arr.some(el => el[keyName] == keyValue);
		}		
		function createMeta(name) {
			return name.toUpperCase().replaceAll(' ','_');
		}
		function privFunc(semantics, gramDepth) {
			let formType, metaSet = [], depth = gramDepth || 1;
			// oc가 있으면 5형식
			if(hasKey(semantics, 'key', 'oc')) {
				formType = 'FORM_FIVE';
			}
			// o가 2개 이상이면 4형식
			else if(semantics.filter(sem => sem.key == 'o').length > 1) {
				formType = 'FORM_FOUR';
			}
			// o가 1개 있으면 3형식
			else if(hasKey(semantics, 'key', 'o')) {
				formType = 'FORM_THREE';
			}
			// c가 있으면 2형식
			else if(hasKey(semantics, 'key', 'c')) {
				formType = 'FORM_TWO';
			}
			// 이외에 v가 있으면 1형식(a가 있으면 1a형식)
			else if(hasKey(semantics, 'key', 'v')) {
				formType = `FORM_ONE${hasKey(semantics, 'key', 'a')?'_ADV':''}`;
			}
			// 인식된 문장 형식을 set에 추가
			// 중첩태그를 우선하기 위해 단순 문장 형식에는 depth를 1 늘인다.
			if(formType != undefined && !hasKey(metaSet, 'name', formType)) 
				metaSet.push({depth: depth + 1, name: formType});
			// 2개의 태그가 중첩된 형태일 경우(type 존재) GramMeta 이름에 이어붙인다.
			// 문장형식 이름에도 이어붙인다.
			const hasTypes = semantics.filter(sem => sem.type != null);
			for(let i = 0, len = hasTypes.length; i < len; i++) {
				const semantic = hasTypes[i],
					key = roleTable[semantic.key];
				let type = roleTable[semantic.type];
				
				const twoMixed = `${type}_${key}`;
				const threeMixed = formType ? `${formType}_${twoMixed}` : twoMixed;
					
				// 3항 태그를 우선 인식
				if(!hasKey(metaSet, 'name', threeMixed)) 
					metaSet.push({depth, name: threeMixed});
				// 다음으로 2항 태그 인식
				if(!hasKey(metaSet, 'name', twoMixed)) 
					metaSet.push({depth, name: twoMixed});
				// 다음으로 품사와 성분을 인식(다항 태그보다는 후순위므로 depth 1증가)
				if(!hasKey(metaSet, 'name', type)) 
					metaSet.push({depth: depth + 1, name: type});
				if(!hasKey(metaSet, 'name', key)) 
					metaSet.push({depth: depth + 1, name: key});
				// '절'이 있으면 태그 추가
				if(type.includes('CLS') && !hasKey(metaSet, 'name', 'CLAUSE')) {
					metaSet.push({depth: depth + 1, name: 'CLAUSE'});
				}
				// '분사'가 있으면 태그 추가
				if(['AP','PP'].includes(type) && !hasKey(metaSet, 'name', 'PTC')) {
					metaSet.push({depth: depth + 1, name: 'PTC'});
				}
			}
			
			// 전체 태그별 GramMeta 추가 후, 자식 태그를 다시 순회하며 반복
			for(let i = 0, len = semantics.length; i < len; i++) {
				const child = semantics[i], key = roleTable[child.key];
	
				// 전치사를 가졌다면 PHR_OO_OO 형태의 GramMeta를 추가
				if(child.prep) {
					const prepMeta = createMeta(`phr ${child.prep}`);
					if(!hasKey(metaSet, 'name', prepMeta))
						metaSet.push({depth: depth + 1, name: prepMeta});
				}
				// 등위접속사를 가졌다면 CCLS_OO 형태의 GramMeta를 추가
				else if(child.cc) {
					const ccMeta = createMeta(`ccls ${child.cc}`);
					if(!hasKey(metaSet, 'name', ccMeta))
						metaSet.push({depth: depth + 1, name: ccMeta});
				}
				// 관계접속사를 가졌다면 ACLS_OO 형태의 GramMeta를 추가
				else if(child.rp) {
					const rpMeta = createMeta(`acls ${child.rp}`);
					if(!hasKey(metaSet, 'name', rpMeta))
						metaSet.push({depth: depth + 1, name: rpMeta});
				}
				// 부사절접속사를 가졌다면 ADVCLS_OO 형태의 GramMeta를 추가
				else if(child.adv) {
					const advMeta = createMeta(`advcls ${child.adv}`);
					if(!hasKey(metaSet, 'name', advMeta))
						metaSet.push({depth: depth + 1, name: advMeta});
				}
				// 수식선을 가진 분사를 가졌다면 MODI_OO 형태의 GramMeta를 추가
				if(child.ptcmodi) {
					const modiMeta = createMeta(`modi ${child.ptcmodi}`);
					if(!hasKey(metaSet, 'name', modiMeta))
						metaSet.push({depth: depth + 1, name: modiMeta});
				}
				if(!hasKey(metaSet, 'name', key)) 
					metaSet.push({depth: depth + 1, name: key});
				
				// 분사를(AP,PP) 가졌다면 PTC를 GramMeta에 또 추가
				if(['AP','PP'].includes(key) && !hasKey(metaSet, 'name', 'PTC')) {
					metaSet.push({depth: depth + 1, name: 'PTC'});
				}
				
				// 자식 태그들에 대해 다시 수행
				if(child.children.length > 0) {
					const childMetas = gramMetaFromSemantics(child.children, depth + 2);
					for(let j = 0, len2 = childMetas.length; j < len2; j++) {
						const childMeta = childMetas[j];
						if(!hasKey(metaSet, 'name', childMeta.name)) 
							metaSet.push({depth: childMeta.depth, name: childMeta.name});
					}
				}
			}
			return metaSet;
		}
		return privFunc;
	}());
	
	const gramMetaCodes = [
	"FORM_ONE",
	"FORM_ONE_ADV",
	"FORM_TWO",
	"FORM_TWO_NOUN_COMP",
	"FORM_TWO_GER_COMP",
	"FORM_TWO_ADJ_COMP",
	"FORM_TWO_TO_COMP",
	"FORM_TWO_PREP_COMP",
	"FORM_TWO_NCLS_COMP",
	"FORM_THREE",
	"FORM_THREE_VI_PREP",
	"FORM_THREE_NOUN_OBJ",
	"FORM_THREE_GER_OBJ",
	"FORM_THREE_TO_OBJ",
	"FORM_THREE_INTERR_OBJ",
	"FORM_THREE_NCLS_OBJ",
	"FORM_FOUR",
	"FORM_FIVE",
	"FORM_FIVE_NOUN_OC",
	"FORM_FIVE_GER_OC",
	"FORM_FIVE_ADJ_OC",
	"FORM_FIVE_AP_OC",
	"FORM_FIVE_PP_OC",
	"FORM_FIVE_TO_OC",
	"FORM_FIVE_RV_OC",
	"FORM_FIVE_INTERR_OBJ",
	"FORM_FIVE_PREP_OC",
	"CLAUSE",
	"CCLS",
	"CCLS_FOR",
	"CCLS_BESIDE",
	"CCLS_YET",
	"CCLS_NOR",
	"NCLS",
	"NCLS_SUBJ",
	"NCLS_OBJ",
	"NCLS_COMP",
	"ACLS",
	"ACLS_WHO",
	"ACLS_WHOSE",
	"ACLS_WHOM",
	"ACLS_WHICH",
	"ACLS_THAT",
	"ADVCLS",
	"ADVCLS_IF",
	"ADVCLS_UNLESS",
	"ADVCLS_WHEN",
	"ADVCLS_WHILE",
	"ADVCLS_UNTIL",
	"ADVCLS_BEFORE",
	"ADVCLS_AFTER",
	"ADVCLS_BECAUSE",
	"ADVCLS_SINCE",
	"ADVCLS_THOUGH",
	"ADVCLS_ALTHOUGH",
	"ADVCLS_EVEN_THOUGH",
	"ADVCLS_SO_THAT",
	"ADVCLS_SUCH_THAT",
	"ADVCLS_AS",
	"ADVCLS_AS_IF",
	"ADVCLS_WHERE",
	"PCLS",
	"TO",
	"TO_SUBJ",
	"TO_OBJ",
	"TO_ACTUAL_OBJ",
	"TO_COMP",
	"TO_ADJ",
	"TO_ADV",
	"GER",
	"GER_SUBJ",
	"GER_SUBJ_PP",
	"GER_OBJ",
	"GER_ACTUAL_OBJ",
	"GER_COMP",
	"PTC",
	"AP",
	"AP_OC",
	"AP_COMP",
	"PP",
	"PP_OC",
	"PP_COMP",
	"MODI",
	"MODI_POST_AP",
	"MODI_PRE_AP",
	"MODI_POST_PP",
	"INTERR",
	"INTERR_SUBJ",
	"INTERR_OBJ",
	"INTERR_COMP",
	"PREP_ADVBIAL",
	"PREP_OBJ_ADVBIAL",
	"PHR",
	"PHR_ABOARD",
	"PHR_ABOUT",
	"PHR_ABOVE",
	"PHR_ACCORDING",
	"PHR_ACROSS",
	"PHR_AFTER",
	"PHR_AGAINST",
	"PHR_AHEAD_OF",
	"PHR_ALONG",
	"PHR_ALONG_WITH",
	"PHR_ALONGSIDE",
	"PHR_AMID",
	"PHR_AMIDST",
	"PHR_AMONG",
	"PHR_AMONGST",
	"PHR_ANTI",
	"PHR_APART_FROM",
	"PHR_AROUND",
	"PHR_AS",
	"PHR_AS_FOR",
	"PHR_AS_PER",
	"PHR_AS_TO",
	"PHR_AS_WELL_AS",
	"PHR_AS_OF",
	"PHR_ASIDE",
	"PHR_ASTRIDE",
	"PHR_AT",
	"PHR_ATOP",
	"PHR_AWAY_FROM",
	"PHR_BAR",
	"PHR_BARRING",
	"PHR_BECAUSE_OF",
	"PHR_BEFORE",
	"PHR_BEHIND",
	"PHR_BELOW",
	"PHR_BENEATH",
	"PHR_BESIDE",
	"PHR_BESIDES",
	"PHR_BETWEEN",
	"PHR_BEYOND",
	"PHR_BUT",
	"PHR_BUT_FOR",
	"PHR_BY",
	"PHR_BY_MEANS_OF",
	"PHR_CIRCA",
	"PHR_CLOSE_TO",
	"PHR_CONCERNING",
	"PHR_CONSIDERING",
	"PHR_CONTRARY_TO",
	"PHR_COUNTING",
	"PHR_CUM",
	"PHR_DESPITE",
	"PHR_DEPENDING_ON",
	"PHR_DOWN",
	"PHR_DUE_TO",
	"PHR_DURING",
	"PHR_EXCEPT",
	"PHR_EXCEPT_FOR",
	"PHR_EXCEPTING",
	"PHR_EXCLUDING",
	"PHR_FOLLOWING",
	"PHR_FOR",
	"PHR_FORWARD_OF",
	"PHR_FROM",
	"PHR_FURTHER_TO",
	"PHR_GIVEN",
	"PHR_GONE",
	"PHR_IN",
	"PHR_IN_ADDITION_TO",
	"PHR_IN_BETWEEN",
	"PHR_IN_CASE_OF",
	"PHR_IN_FACE_OF",
	"PHR_IN_FAVOUR_OF",
	"PHR_IN_FRONT_OF",
	"PHR_IN_LIEU_OF",
	"PHR_IN_SPITE_OF",
	"PHR_IN_VIEW_OF",
	"PHR_INTO",
	"PHR_INCLUDING",
	"PHR_INSIDE",
	"PHR_INSTEAD_OF",
	"PHR_LESS",
	"PHR_LIKE",
	"PHR_MINUS",
	"PHR_NEAR",
	"PHR_NEAR_TO",
	"PHR_NEXT_TO",
	"PHR_NOTWITHSTANDING",
	"PHR_OF",
	"PHR_OFF",
	"PHR_ON",
	"PHR_ON_ACCOUNT_OF",
	"PHR_ON_BEHALF_OF",
	"PHR_ON_BOARD",
	"PHR_ON_TO",
	"PHR_ONTO",
	"PHR_ON_TOP_OF",
	"PHR_OPPOSITE",
	"PHR_OPPOSITE_TO",
	"PHR_OTHER_THAN",
	"PHR_OUT",
	"PHR_OUT_OF",
	"PHR_OUTSIDE",
	"PHR_OUTSIDE_OF",
	"PHR_OVER",
	"PHR_OWING_TO",
	"PHR_PAST",
	"PHR_PENDING",
	"PHR_PER",
	"PHR_PLUS",
	"PHR_PREPARATORY_TO",
	"PHR_PRIOR_TO",
	"PHR_PRO",
	"PHR_RE",
	"PHR_REGARDING",
	"PHR_REGARDLESS_OF",
	"PHR_RESPECTING",
	"PHR_ROUND",
	"PHR_SAVE",
	"PHR_SAVE_FOR",
	"PHR_SAVING",
	"PHR_SINCE",
	"PHR_THROUGH",
	"PHR_THRU",
	"PHR_THROUGHOUT",
	"PHR_TILL",
	"PHR_TO",
	"PHR_TOGETHER_WITH",
	"PHR_TOUCHING",
	"PHR_TOWARD",
	"PHR_TOWARDS",
	"PHR_THAN",
	"PHR_THANKS_TO",
	"PHR_UNDER",
	"PHR_UNDERNEATH",
	"PHR_UNLIKE",
	"PHR_UNTIL",
	"PHR_UP",
	"PHR_UP_AGAINST",
	"PHR_UP_TO",
	"PHR_UP_UNTIL",
	"PHR_UPON",
	"PHR_VERSUS",
	"PHR_VIA",
	"PHR_WITH",
	"PHR_WITH_REFERENCE_TO",
	"PHR_WITH_REGARD_TO",
	"PHR_WITHOUT",
	"PHR_WITHIN",
	"VERB_PHR"
	]
	const nonKeywords = ['SUBJ','VERB','OBJ','COMP','OC','ADV'];
	function gramMetaArr2Str(gramMetaArr) {
		return gramMetaArr.filter(meta => gramMetaCodes.includes(meta.name) && !nonKeywords.includes(meta.name))
									.sort((a,b) => a.depth - b.depth)
									.map(meta => meta.name).join(' ');
	}	
})(jQuery, window, document);
