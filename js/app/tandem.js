/* jquery.curvedarrow.min.js */
var drawCurvedArrow=(function(){function t(e2,t2,a){let i=e2,o=a;for(let n=1e-4;n<=1;n+=1e-4){const r=(1-n)*(1-n)*e2+2*(1-n)*n*t2+n*n*a;if(r<i){i=r;}
if(r>o){o=r;}}
return[Math.round(i),Math.round(o)];}
function tt(e,b){const i=$.extend({p0x:50,p0y:50,p1x:70,p1y:10,p2x:100,p2y:100,size:30,lineWidth:10,strokeStyle:"rgb(245,238,49)",header:!0,curve:!0,className:"curved_arrow"},b),o=document.createElement("canvas");const n=i.curve?t(i.p0x,i.p1x,i.p2x):[Math.min(i.p0x,i.p1x,i.p2x),Math.max(i.p0x,i.p1x,i.p2x)],r=i.curve?t(i.p0y,i.p1y,i.p2y):[Math.min(i.p0y,i.p1y,i.p2y),Math.max(i.p0y,i.p1y,i.p2y)],p=i.size-i.lineWidth,s=n[0]-p,l=n[1]+p,x=r[0]-p,c=r[1]+p,h=i.p0x-s,y=i.p0y-x,d=i.p1x-s,u=i.p1y-x,k=i.p2x-s,m=i.p2y-x;o.className=i.className;o.style.position="absolute";o.style.top=x+"px";o.style.left=s+"px";const g=o.getContext("2d"),v=window.devicePixelRatio||1;if(o.style.width=l-s+"px",o.style.height=c-x+"px",o.width=(l-s)*v,o.height=(c-x)*v,g.scale(v,v),g.strokeStyle=i.strokeStyle,g.lineWidth=i.lineWidth,g.lineJoin="round",g.lineCap="round",g.beginPath(),g.moveTo(h,y),Math.abs(d-h)>Math.abs(u-m)&&g.lineTo(d>h?d-Math.abs(u-m):d+Math.abs(u-m),u),i.curve?g.quadraticCurveTo(d,u,k,m):(g.lineTo(d,u),g.lineTo(k,m)),g.stroke(),i.header){const e3=Math.atan2(m-u,k-d);g.translate(k,m);g.rotate(e3+1);g.beginPath();g.moveTo(0,i.size);g.lineTo(0,0);g.stroke();g.rotate(-2);g.lineTo(0,-i.size);g.stroke();g.rotate(1-e3);g.translate(-k,-m);}
e.appendChild(o);}return tt;}());

/**=============================================================================
 * 구문분석 결과를 스타일링 입혀서 대상 요소 내부에 표시
 * 
 * @param text 대상 문장 원문
 * @param svocBytes 구문분석 내용을 담은 바이트배열(Base64)
 * @param container 분석 결과 표시 영역이 삽입될 대상
 * @author LGM
 *

 * @summary 
 * 
 *
 * <b>체이닝 함수 호출 순서</b>
 * correctMarkLine(div)
 * -> checkGCDepth(div) 
 * -> checkLineEnds(div) 
 * -> (div.normalize()) 
 * -> adjustLineHeight(div) 
 * -> drawConnections(div)
 * 
 */
let portraitList = window.matchMedia('(orientation: portrait)');
async function showSemanticAnalysis(text, svocBytes, $container){
  
  // 각 문장마다의 구문분석 구분자
  window.semanticSequence = (window.semanticSequence) || 0;
  
  // (TBD) 커스텀 CSS 추가(밑줄,대괄호,글자 색상 등)--------------------------
  
  let div = $container[0].ownerDocument.createElement('div');
  div.className = 'semantics-result';
  paintBasicDOMs(text, await svocText2Arr(svocBytes) || [], div);
  $container.append(div);
  
  /**
   * div 속 내용들을 화면에 나타난 위치를 기반으로 꾸밈 요소 적용.
   * 각 꾸밈 요소들끼리 상호 영향을 받으므로, 일정 시간 간격으로 차례로 실행.
   * (코멘트 수평정렬, 코멘트 수직정렬, 수식선, 줄 높이 자동 조절.)
   */
  // 화면의 가로 사이즈 변경이 생기면 각 div마다 내부 내용을 다시 그린다.
  let resizeTimer, currWidth = window.innerWidth;
  window.addEventListener('resize', () => {
	if(!$(div).is(':visible') || currWidth == window.innerWidth) return true;
	clearTimeout(resizeTimer);
	currWidth = window.innerWidth;
	resizeTimer = setTimeout(() => requestAnimationFrame(() => correctMarkLine(div)), 100);
  });
  correctMarkLine(div);
  return div;
}

const keywordTable = {
//속성 클래스 : Cherokee (그리스 문자)
"\u0390" : "\"start\"",
"\u0391" : "\"end\"",
"\u0392" : "\"rcomment\"",
"\u0393" : "\"gcomment\"",
"\u0394" : "\"markType\"",
"\u0395" : "\"hasModificand\"",

//markType 1 - 성분 (그리스 문자)
"\u03A3" : "\"S\"",
"\u03A4" : "\"V\"",
"\u03A5" : "\"O\"",
"\u03A6" : "\"C\"",
"\u03A7" : "\"OC\"",
"\u03A9" : "\"M\"",
"\u03AA" : "\"A\"",
//table.put("\"I\"", (char)0x00e1);
	
//markType 2 - 절 (키릴 문자)
"\u0400" : "\"CCLS\"",
"\u0401" : "\"NCLS\"",
"\u0402" : "\"ACLS\"",
"\u0403" : "\"ADVCLS\"",
//table.put("\"PCLS\"", (char)0x0400);         //병렬절

//markType 3 - 구/선행사 (키릴 문자)
"\u0430" : "\"PHR\"",
"\u0431" : "\"ADJPHR\"",
"\u0432" : "\"TOR\"",
"\u0433" : "\"GER\"",
"\u0434" : "\"PTC\"",
"\u0435" : "\"RCM\"",            //선행사
"\u0436" : "\"ADVPHR\"",
"\u0437" : "\"PTCPHR\"",



//rcomment - 성분 (조지아 문자)
"\u10A0" : "\"subj\"",
"\u10A1" : "\"verb\"",
"\u10A2" : "\"obj\"",
"\u10A3" : "\"comp\"",
"\u10A4" : "\"o.c\"",
"\u10A5" : "\"prep.o.\"",
"\u10A6" : "\"i.o.\"",
"\u10A7" : "\"d.o.\"",
"\u10A8" : "\"s.s.\"",
"\u10A9" : "\"mod\"",


//gcomment - 절 (조지아 문자)
"\u10D0" : "\"[조건 | 양보] 부사절\"",
"\u10D1" : "\"조건 부사절\"",
"\u10D2" : "\"[시간 | 양보] 부사절\"",
"\u10D3" : "\"[시간 | 양태] 부사절\"",
"\u10D4" : "\"시간 부사절\"",
"\u10D5" : "\"이유 부사절\"",
"\u10D6" : "\"양보 부사절\"",
"\u10D7" : "\"부사절\"",
"\u10D8" : "\"등위절\"",
"\u10D9" : "\"병렬절\"",
"\u10DA" : "\"관계사\"",


//gcomment - 문법 (체로키 문자)
"\u13A0" : "\"수식\"",
"\u13A1" : "\"to부정사\"",
"\u13A2" : "\"의미상 주어\"",
"\u13A3" : "\"동명사\"",
"\u13A4" : "\"전치사구\"",
"\u13A5" : "\"전치사구(adj)\"",
"\u13A6" : "\"분사\"",
"\u13A7" : "\"부사구\"",
"\u13A8" : "\"부사적 보충어\"",

//modificant or gcomment의 값 (캐나다 원주민 문자)
"\u1400" : "true",
"\u1401" : "false",
"\u1402" : "null",


//json형식 요소 (캐나다 원주민 문자)
"\u1430" : "},{"
};

/* svoc인코딩 문자열을 MarkingTag[]로 반환*/
async function svocText2Arr(svocText) {
	return JSON.parse(decSvoc(await inflateSvoc(str2ab(atob(svocText)))));
}
/* MarkingTag[]를 svoc인코딩 문자열로 반환 */
async function svocArr2Text(svocList) {
	return btoa(ab2str(await deflateSvoc(encSvoc(JSON.stringify(svocList)))));
}
/* .semantics-result DOM 내용을 MarkingTag[]로 반환*/
function svocDom2Arr(node, arr) {
	const markTypes = /\b(s|v|o|c|oc|a|m|rcm|tor|ger|ptc|conj|phr|adjphr|advphr|ptcphr|cls|ncls|acls|advcls|ccls|pcls)\b/;
	// 탐색 위치 초기화
	svocDom2Arr.pos = arr ? svocDom2Arr.pos : 0;
	arr = arr ? arr : [];
	if(node.classList != null && node.classList.contains('semantics-result')) {
		const childNodes = node.childNodes;
		for(let i = 0, len = childNodes.length; i < len; i++) {
	        arr = svocDom2Arr(childNodes[i], arr);
		}
		return arr;
	}
	// 괄호가 아닌 태그이면서 자식노드(텍스트노드 포함)를 가진 span 태그일 경우 배열에 추가
	if(node.hasChildNodes() && node.nodeName == 'SPAN' 
  && !node.classList.contains('line-end') && !node.classList.contains('brkt')){
		const markType = node.className.match(markTypes);
	  if(markType != null) {
		const brktNodesCount = node.querySelectorAll('.brkt').length;
		  arr.push({markType: markType[0].toUpperCase(), 
			  start: svocDom2Arr.pos,
			  end: (svocDom2Arr.pos + node.textContent.length - brktNodesCount),
			  rcomment: node.dataset.rc, gcomment: node.dataset.gc,
			  hasModificand: (node.dataset.mfd != null)});
	  }
		// 자식노드에 대해 순환탐색
		for(let child of node.childNodes) {
			arr = svocDom2Arr(child, arr);
		}
	// 텍스트 노드일 경우 글자 길이만큼 탐색 위치를 옮김
	}else if(node.nodeType == 3){
		svocDom2Arr.pos += node.textContent.replaceAll('\n','').length;
	}
	return arr;
}

/* svoc문자열 인코딩(정적치환) */
function encSvoc(svoc) {
  const reverseTable = Object.keys(keywordTable).reduce(function(acc,k) {
	acc[keywordTable[k]] = k;
	return acc;
  },{});
  const keys = Object.keys(reverseTable), keysLen = keys.length;
  for(let i = 0; i < keysLen; i++) {
	svoc = svoc.replaceAll(keys[i], reverseTable[keys[i]]);
  }
  return svoc;
}
/* svoc문자열 디코딩(정적치환) */
function decSvoc(svoc) {
  const keys = Object.keys(keywordTable), keysLen = keys.length;
  for(let i = 0; i < keysLen; i++) {
	svoc = svoc.replaceAll(keys[i], keywordTable[keys[i]]);
  }
  return svoc;
}
/* 문자열을 byte[]로 변환 */
function str2ab(str) {
  let buf = new ArrayBuffer(str.length * 1); // 1 bytes for each char(2 for Uint16Array)
  let bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return bufView;
}
/* byte[]를 문자열로 변환 */
function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}
/* svoc byte[] 압축해제(문자열로)*/
async function inflateSvoc(svoc) {
  if(typeof pako == 'undefined' || typeof pako.inflate == 'undefined') {
	return new Promise((resolve) => 
	  $.getScript('https://cdn.jsdelivr.net/npm/pako/dist/pako.min.js')
		.then(() => resolve(pako.inflate(new Uint16Array(svoc), {to:'string'})))
		.fail(async() => {
		  await $.getScript('https://static.findsvoc.com/js/public/pako.min.js');
		  resolve(pako.inflate(new Uint16Array(svoc), {to:'string'}));
	}));
  }else return pako.inflate(new Uint16Array(svoc), {to:'string'});
}
/* svoc 문자열 압축(byte[]로) */
async function deflateSvoc(svoc) {
  if(typeof pako == 'undefined' || typeof pako.inflate == 'undefined') {
	return new Promise((resolve) => 
	  $.getScript('https://cdn.jsdelivr.net/npm/pako/dist/pako.min.js')
		.then(() => resolve(pako.deflate(svoc)))
		.fail(async() => {
		  await $.getScript('https://static.findsvoc.com/js/public/pako.min.js');
		  resolve(pako.deflate(svoc));
	}));
  }else return pako.deflate(svoc);
}

/**
 * 전달된 sentence 정보를 div 속에 그림.
 * 
 * 기본 JSON 객체로부터 기본 DOM을 구성하고 나면
 * 모델 외적인 부분(괄호, 레이어, 수식선)을 아래 함수들을 순차적으로 실행하여 구현
 *
 *   checkPOSDepth(div);
  
  -> splitInners(div);
  
  -> trimTextContent(div);
  
  -> shrinkRComment(div);
  
  -> wrapWithBracket(div);
 */
function paintBasicDOMs(text, svocList, div) {
  div.innerHTML = '';

  createBasicDOMs(text, svocList, div);
  
  checkPOSDepth(div);
  
  splitInners(div);
  
  trimTextContent(div);
  
  //shrinkRComment(div);
  
  wrapWithBracket(div);
  
}

/**
svocList를 기반으로 한 DOM 생성
@param text 원문장
@param svocList svocTags
 */
var createBasicDOMs = (function() {
  /** 문장 필수성분*/
  const roleTypes = ['S','V','O','C','OC','A','M'];
  const markTypesNeedBrackets = ['CONJ','PHR','ADJPHR','ADVPHR','PTCPHR','CLS','ACLS','NCLS','ADVCLS','CCLS','PCLS'];
  function privFunc(text, svocList, div) {
  // [태그 정렬]---------------------------------------------------------
  // 1차:시작 offset이 빠른 순. 2차:끝 offset이 느린 순으로 정렬
  //(동일한 위치에 마킹이 있을 경우 길이가 긴 것이 바깥쪽, 즉 먼저 나와야 한다.)
  svocList = svocList || [];
  svocList.sort(function(a, b) {
    return a.start - b.start || b.end - a.end; 
  });
  svocList = svocList.filter(function(tag){
    return !!(tag.markType) && tag.markType.length > 0;
  })
  let i = 0;
  while(svocList[i + 1] != null) {
	let tag = svocList[i], second = svocList[i + 1], third = svocList[i + 2];
	// 시작과 끝이 겹치는 태그가 3개일 경우 3번째는 일단 삭제.
	if(third != null && tag.start == third.start && tag.end == third.end) {
	  svocList.splice(i + 2, 1);
	}
    // 소괄호끼리(전명구:PHR, 형용사구:ADJPHR, to부정사:TOR, 분사:PTC)의 시작점이 겹치면 뒤의 것을 삭제.
    // PHR과 ADJPHR이 겹치면 PHR을 삭제.
    else if(['PHR','ADJPHR','TOR','PTC'].indexOf(tag.markType) > -1){
	  const phrsLen = Math.min(i + 3, svocList.length); // 무한정 검사하지 않고 최대 3개까지 검사
      for(let j = i + 1; j < phrsLen; j++) {
		let next = svocList[j];
        if(next != null && tag.start == next.start) {
          if(tag.markType == next.markType
          || (next.markType == 'PHR' && tag.markType == 'ADJPHR')){
            svocList.splice(j, 1);
          }else if(tag.markType == 'PHR' && next.markType == 'ADJPHR'){
            svocList.splice(i, 1);
            break;
          }
        }
      }
    } 
    // 형용사절,부사절은 위치가 겹치는 성분을 들고 오지 않을 경우 rcomment로 대신함.
    // -> rcomment를 보고 성분 태그를 생성.
    else if((['ACLS','ADVCLS'].indexOf(tag.markType) > -1) && tag.rcomment != null){
      // 겹치는 성분이 V면 삭제.
      if(second.start == tag.start && second.end == tag.end && second.markType == 'V'){
        svocList.splice(i + 1, 1);
      // 완전히 겹치는 태그가 없을 경우 m 태그 삽입
      } else {
        svocList.splice(i + 1, 0, 
          {markType : 'M', rcomment : tag.rcomment, start : tag.start, end : tag.end});
      }
    }
    // 동사부 내부의 동사는 표시에서 제외.
    else if(tag.markType == 'V'){
	  let j = i + 1, next = second;
	  while(next != null && next.start >= tag.start && next.end <= tag.end) {
		if(next.markType == 'V') svocList.splice(j, 1);
		next = svocList[++j];
	  }
    }
    i++;
  }
  // [항상 문장 필수 성분과 절/구 등이 겹치면 필수 성분을 안쪽으로 넣는다.]
  // 필수 성분끼리 겹칠 경우 먼저 등장한 성분을 남기고 삭제.
  i = 0;
  while(svocList[i + 1] != null) {
	let tag = svocList[i], second = svocList[i + 1];
	// 시작/끝 위치가 동일한 두 태그가 있을 때
	if(tag.start == second.start && tag.end == second.end) {
	  // 앞의 태그가 필수성분이고, 뒤의 태그가 그렇지 않으면 순서 바꿈 
      if(roleTypes.indexOf(tag.markType) > -1 && roleTypes.indexOf(second.markType) == -1){
        svocList.splice(i, 2, second, tag);
      // 앞뒤 태그 둘 다 필수성분이면 뒤의 태그 삭제
      }else if(roleTypes.indexOf(tag.markType) > -1 && roleTypes.indexOf(second.markType) > -1){
        svocList.splice(i + 1, 1);
      }
	}
	i++;
  }
  // [시작,끝,종류가 같은 중복 태그들 제외하고 태그를 모음.]
  const uniqTags = [svocList[0]];
  i = 1;
  while(svocList[i] != null) {
	const lastUniq = uniqTags.slice(-1)[0], tag = svocList[i];
    if(lastUniq.start != tag.start || lastUniq.end != tag.end 
    || lastUniq.markType != tag.markType) {
      uniqTags.push(tag);
    }
    i++;
  }
  // [구,종속절과 시작+끝이 겹치는 태그 처리]
  // 겹치는 태그에 rcomment가 있으면 구,종속절의 괄호를 크게, 
  // rcomment가 없이 겹치는 태그는 제거.(미표시)
  let prior = null;
  i = 0;
  while(uniqTags[i] != null) {
	const tag = uniqTags[i];
    if(prior != null && tag.start == prior.start && tag.end == prior.end){
      // 성분태그의 rcomment,gcomment가 없거나 절이 등위절일 경우, 겹치는 성분 태그를 제거.
      if(markTypesNeedBrackets.indexOf(prior.markType) > -1){
        if((tag.rcomment == null && tag.gcomment == null) 
        || (tag.markType != 'V' && ['CCLS','PCLS'].indexOf(prior.markType) > -1)){
          uniqTags.splice(uniqTags.indexOf(tag), 1);
        }else{
          const priorIndex = uniqTags.indexOf(prior);
          prior.brkt = tag.markType.toLowerCase();
          uniqTags.splice(priorIndex, 1, prior);
        }
      }
      // 순서가 뒤바뀐 경우도 처리.
      else if(markTypesNeedBrackets.indexOf(tag.markType) > -1){
        if((prior.rcomment == null && prior.gcomment == null) 
        || (prior.markType != 'V' && ['CCLS','PCLS'].indexOf(tag.markType) > -1)){
          uniqTags.splice(uniqTags.indexOf(prior), 1);
        }else{
          const thisIndex = uniqTags.indexOf(tag);
          const priorIndex = uniqTags.indexOf(prior);
          tag.brkt = prior.markType.toLowerCase();
          uniqTags.splice(thisIndex, 1, prior);
          uniqTags.splice(priorIndex, 1, tag);
        }
      }else{
        prior = tag;
      }
    }else{
      prior = tag;
    }
    i++;
  }
  // [마킹 태그 배열 생성]-------------------------------------------------
  // 마킹 태그는 토큰별로 2개가 한 쌍(시작,종료)으로 존재한다.
  let tagPairs = [];const openTags = [], closeTags = [];
  i = 0;
  while(uniqTags[i] != null) {
	const tag = uniqTags[i];    
    // 시작태그들을 뽑아서 저장.
    // '수식'일 경우 수식대상에 대한 정보도 시작태그에 추가한다.(종료태그에 속성을 추가할 순 없으니)
    openTags.push({mark : tag.markType, type : 'start', index : tag.start, 
          modifier : tag.hasModificand, brkt : tag.brkt,
          rcomment : tag.rcomment, gcomment : tag.gcomment});
    // 종료태그들을 뽑아서 저장
    closeTags.push({mark : tag.markType, type : 'end', index : tag.end, brkt : tag.brkt});
    i++;
  }
  // 종료태그들은 offset의 내림차순으로 정렬 후 역순으로 뒤집는다.
  // 처음부터 offset의 오름차순으로 정렬하는 것과는 다르다.
  // (동일한 위치의 토큰 중 길이가 긴 것이 먼저 나왔으니, 끝나는 것은 더 늦어야 한다.)
  closeTags.sort(function(a, b) {
    return b.index - a.index;
  });
  closeTags.reverse();
  
  // 시작태그>종료태그 순서를 유지하면서 병합 후 offset의 오름차순으로 정렬. 
  tagPairs = openTags.concat(closeTags);
  tagPairs.sort(function(a, b) {
    if(a.index != b.index){
      return a.index - b.index;
    }else if(a.type != b.type){
      return (a.type == 'start') ? 1 : -1;
    }else{
      return 0;
    }
  });
  // 각 문장마다의 구문분석 구분자
  const semanticSequence = div.dataset.seq || (window.semanticSequence++) || 0;
  div.dataset.seq = semanticSequence;
  // [배열 속 태그들을 순서대로 표시]------------------------------------------
  let increasement = 0;
  let modificandIndex = 0;
  i = 0;
  while(tagPairs[i] != null) {
    let htmlTag = "", tag = tagPairs[i];
    if(tag.type == 'start'){
      // 구/절 태그의 경우 구/절 시작 부호'(','[' 태그 삽입 후 시작태그 삽입 
      htmlTag += '<span class="sem '+ tag.mark.toLowerCase();
      // 선행사일 경우 인덱스를 남김
      if(tag.mark == 'RCM')
        htmlTag += ' mfd-' + semanticSequence + '-' + ++modificandIndex;
      htmlTag += '"';
      
      if(tag.modifier)
        htmlTag += ' data-mfd="' + semanticSequence + '-' + modificandIndex + '"';
      
      if(tag.rcomment) {
		htmlTag += ' data-rc=';
      	if(tag.rcomment.indexOf('.') > 0)
		  htmlTag += '"' + tag.rcomment + '"';
		else 
		  htmlTag += '"' + tag.rcomment.substring(0,1).toUpperCase() + '"';
	  }
	  
	  if(tag.gcomment)
		htmlTag += ' data-gc="' + tag.gcomment + '"';
	  
	  htmlTag += '>';
    }else{
      // 구/절 태그의 경우 구/절 종료태그 삽입 후 절 끝 부호')',']' 태그 삽입
      htmlTag += '</span>';
    }
    
    text = text.substring(0, increasement + tag.index) 
          + htmlTag + text.substring(increasement + tag.index);
    increasement += htmlTag.length;
    i++;
  }
  // [태그들을 html로 표시]
  div.insertAdjacentHTML('afterbegin', text);
  }
  return privFunc;
}());

/**
.semantic-result DOM을 정리하여 반환(괄호, 화살표 등을 정리. 원본은 수정하지 않음.)
 */
function cleanSvocDOMs(div) {
	const parent = div.cloneNode(true);
	const extras = parent.querySelectorAll('.brkt,.line-end,canvas.curved_arrow');
	for(let i = 0, len = extras.length; i < len; i++) extras[i].remove();
	
	return parent;
}

/**
DOM을 분석하여 문법 특징 파악
 */
var semanticsFromDOMs = (function() {
	const allTypes = ['s','v','o','c','a','oc','m','rcm','tor','ger','ptc','conj',
			'phr','adjphr','advphr','ptcphr','cls','ncls','acls','advcls','ccls','pcls'];
	const formComponents = ['s','v','o','c','a','oc','m']; // 문장형식 요소들
	const prepKeywords = ['aboard', 'about', 'above', 'according', 'across', 'after', 'against', 'ahead of', 'along with', 'alongside', 'along', 'amidst', 'amid', 'amongst', 'among', 'anti', 'apart from', 'around', 'as for', 'as per', 'as to', 'as well as', 'as of', 'aside', 'astride', 'as', 'atop', 'at', 'away from', 'barring', 'bar', 'because of', 'before', 'behind', 'below', 'beneath', 'besides', 'beside', 'between', 'beyond', 'but for', 'but', 'by means of', 'by', 'circa', 'close to', 'concerning', 'considering', 'contrary to', 'counting', 'cum', 'despite', 'depending on', 'down', 'due to', 'during', 'except for', 'excepting', 'except', 'excluding', 'following', 'forward of', 'for', 'from', 'further to', 'given', 'gone', 'in addition to', 'in between', 'in case of', 'in face of', 'in favour of', 'in front of', 'in lieu of', 'in spite of', 'in view of', 'into', 'including', 'inside', 'instead of', 'in', 'less', 'like', 'minus', 'near to', 'near', 'next to', 'notwithstanding', 'off', 'of', 'on account of', 'on behalf of', 'on board', 'on to', 'onto', 'on top of', 'on', 'opposite to', 'opposite', 'other than', 'out of', 'out', 'outside of', 'outside', 'over', 'owing to', 'past', 'pending', 'per', 'plus', 'preparatory to', 'prior to', 'pro', 're', 'regarding', 'regardless of', 'respecting', 'round', 'save', 'save for', 'saving', 'since', 'through', 'thru', 'throughout', 'till', 'together with', 'touching', 'toward', 'towards', 'to', 'than', 'thanks to', 'underneath', 'under', 'unlike', 'until', 'up against', 'up to', 'up until', 'upon', 'up', 'versus', 'via', 'with reference to', 'with regard to', 'without', 'within', 'with']
	function findClassIn(element, classes) {
		return classes.find(one => element.classList.contains(one));
	}
	function findPrepKeyword(element) {
		let prepKeyword = null;
		for(let j = 0, len2 = prepKeywords.length; j < len2; j++) {
			const keyword = prepKeywords[j];
			if(element.textContent.length > 0 
			&& element.textContent.toLowerCase().startsWith(keyword)) {
				prepKeyword = keyword;
				break;
			}
		}
		return prepKeyword;		
	}
	function privFunc(div) {
		const children = div.children;
		let semantics = [];
		for(let i = 0, len = children.length; i < len; i++) {
			const child = children[i], grandChild = child.firstElementChild;
			let oneRole;
			
			// key에 해당하는 성분인지 검사
			if(child.childElementCount > 0 && grandChild.textContent == child.textContent) {
				const outerClass = findClassIn(child, allTypes),
					innerClass =  findClassIn(grandChild, allTypes);
				let type;
				if(findClassIn(grandChild, formComponents)) {
					oneRole = innerClass; type = outerClass;
				}else {
					oneRole = outerClass; type = innerClass;
				}
				child.parentElement.replaceChild(grandChild,child)
				if(oneRole) {
					const sem = {key: oneRole, type: type, children: privFunc(grandChild)};
					if(sem.type == 'phr') {
						const prep = findPrepKeyword(grandChild);
						if(prep) sem.prep = prep;
					}
					semantics.push(sem);
				}
			}else {
				oneRole = findClassIn(child, allTypes);
				if(oneRole) {
					const sem = {key: oneRole, children: privFunc(child)};
					if(sem.key == 'phr') {
						const prep = findPrepKeyword(child);
						if(prep) sem.prep = prep;
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
	const roleTable = {s: 'SUBJ', v: 'VERB', o: 'OBJ', c: 'COMP', oc: 'OC', a: 'A', m: 'MODI',
			rcm: 'rcm', tor: 'TO', ger: 'GER', ptc: 'PTC', conj: 'conj', phr: 'PREP', 
			adjphr: 'adjphr', advphr: 'advphr', ptcphr: 'ptcphr', cls: 'CLAUSE',
			ncls: 'NCLS', acls: 'ACLS', advcls: 'ADVCLS', ccls: 'CCLS', pcls: 'PCLS'};
			
	function hasKey(arr, keyName, keyValue) {
		return arr.some(el => el[keyName] == keyValue);
	}		
	function privFunc(semantics, gramDepth) {
		let formType, metaSet = [], depth = gramDepth || 1;
		// 5형식
		if(hasKey(semantics, 'key', 'oc')) {
			formType = 'FORM_FIVE';
		}
		// 4형식
		else if(semantics.filter(sem => sem.key == 'o').length > 1) {
			formType = 'FORM_FOUR';
		}
		// 3형식
		else if(hasKey(semantics, 'key', 'o')) {
			formType = 'FORM_THREE';
		}
		// 2형식
		else if(hasKey(semantics, 'key', 'c')) {
			formType = 'FORM_TWO';
		}else if(hasKey(semantics, 'key', 'v')) {
			formType = 'FORM_ONE';
		}
		// 성분이 준동사 혹은 구,절의 형태일 경우(type 존재) GramMeta 이름에 이어붙인다.
		const hasTypes = semantics.filter(sem => sem.type != null);
		for(let i = 0, len = hasTypes.length; i < len; i++) {
			const key = roleTable[hasTypes[i].key],
				type = roleTable[hasTypes[i].type],
				twoMixed = `${type}_${key}`, 
				threeMixed = (formType?`${formType}_`:'')+ twoMixed;
				
			if(!hasKey(metaSet, 'name', threeMixed)) 
				metaSet.push({depth, name: threeMixed});
			if(!hasKey(metaSet, 'name', twoMixed)) 
				metaSet.push({depth, name: twoMixed});
			if(!hasKey(metaSet, 'name', type)) 
				metaSet.push({depth: depth + 1, name: type});
			if(!hasKey(metaSet, 'name', key)) 
				metaSet.push({depth: depth + 1, name: key});
			// '절'이 있으면 태그 추가
			if(type.includes('CLS') && !hasKey(metaSet, 'name', 'CLAUSE')) {
				metaSet.push({depth: depth + 1, name: 'CLAUSE'});
			}
		}
		if(formType != undefined && !hasKey(metaSet, 'name', formType)) 
			metaSet.push({depth: depth + 1, name: formType});
		
		// 자식 태그를 다시 순회
		for(let i = 0, len = semantics.length; i < len; i++) {
			const child = semantics[i], key = roleTable[child.key];
			if(!hasKey(metaSet, 'name', key)) 
				metaSet.push({depth: depth + 1, name: key});
			if(child.prep) {
				const prepMeta = ('phr ' + child.prep).toUpperCase().replaceAll(' ','_');
				if(!hasKey(metaSet, 'name', prepMeta))
					metaSet.push({depth: depth + 1, name: prepMeta});
			}
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


var gramMetaArr2Str = (function() {
	const nonKeywords = ['SUBJ','VERB','OBJ','COMP','OC','A'];
	
	function privFunc(gramMetaArr) {
		return gramMetaArr.filter(meta => !nonKeywords.includes(meta.name))
								.sort((a,b) => a.depth - b.depth)
								.map(meta => meta.name).join(' ');
	}
	return privFunc;
}());

/**
 * 성분 태그(동사 제외)가 자식으로 성분 태그(동사 포함)를 지니면 .outer, 지니지 앖으면 .inner 지정.
 * 성분 태그의 rcomment를 depth에 따라 더 밑으로 위치시키기 위함.
 * 
 * 성분: s v o c oc m
 */
function checkPOSDepth(element){
  const posClasses = '.s, .v, .o, .c, .oc, .a, .m',
        children = element.querySelectorAll(posClasses);
  let base = 0;
  
  // 자신의 depth 초기화
  element.removeAttribute('data-lv');
  
  if(children.length > 0 && !element.matches('.sem.v')) {
	for(let i = 0, len = children.length; i < len; i++) {
      base = Math.max(base, checkPOSDepth(children[i]) + 1);
	}
    if(element.matches(posClasses) && base > 0) element.setAttribute('data-lv', base);

    element.classList.remove('inner');
    if(element.matches(posClasses)) element.classList.add('outer');
  } else {
    element.classList.remove('outer');
    if(element.matches(posClasses)) element.classList.add('inner');
  }
  return base;
}

/**
 * 절과 구 태그 양쪽으로 괄호 태그를 추가.
 * 절과 구는 아니지만 내부 성분 레이어를 가지는 성분 태그 양쪽에도 괄호 태그를 추가.
 * + 분사구,to부정사구도 성분 레이어를 가질 수 있다.
 */
function wrapWithBracket(div){
  // 기존 괄호 제거
  $(div.querySelectorAll('.cls-start,.cls-end,.ccls-start,.ccls-end,.phr-start,.phr-end,'
  + '.adjphr-start,.adjphr-end,.conj-start,.conj-end,.etc-start,.etc-end')).remove();
  // 괄호 적용할 대상을 trim
  trimTextContent(div);
  
  $(div).find('.acls, .ncls, .advcls, .cls, .ccls, .pcls, .phr, .adjphr, .advphr, .ptcphr, .conj')
  .add($(div).find('.sem[data-lv]').filter(function(){
    return (this.textContent.length != this.parentElement.textContent.length
        || $(this.parentElement).is('.ptc, .tor'));
  })).get().reverse().forEach(function(el) {
	let clsType = el.className.match(/\bacls\b|\bncls\b|\badvcls\b|\bcls\b|\bccls\b|pcls\b|\bphr\b|\badjphr\b|\badvphr\b|\bptcphr\b|\bconj\b/);
	clsType = (clsType != null && clsType.length > 0) ? clsType[0] : '';
    let brackets, type = 'etc';
	switch(clsType) {
      case 'ccls': case 'pcls':
        type = 'ccls';
        brackets = ['{', '}'];
        break;
      case 'conj': 
      case 'phr': case 'adjphr': 
        type = clsType; 
        brackets = ['(', ')'];
        break;
      case 'advphr': case 'ptcphr':
        type = 'phr'
        brackets = ['(', ')'];
        break;
      case 'acls': case 'advcls': case 'ncls': case 'cls':
        type = clsType + ' cls';
        brackets = ['[', ']'];
        break;
      default:
        brackets = ['[', ']'];
        break;
	}
    
    let openBracket = div.ownerDocument.createElement('span');
    let closeBracket = div.ownerDocument.createElement('span');
    
    openBracket.className = 'brkt ' + type + '-start';
    closeBracket.className = 'brkt ' + type + '-end';
    openBracket.textContent = brackets[0];
    closeBracket.textContent = brackets[1];
    // cls나 etc 타입의 괄호끼리 레이어 처리
    if(brackets.indexOf('[') > -1){
      let childLv = Number(el.dataset.lv || 0);
      $(el).find('.sem[data-lv],.brkt[data-lv]').each(function(){
        if(el.textContent.replaceAll(/[\[\]\(\)\{\}]/g,'').length > this.textContent.replaceAll(/[\[\]\(\)\{\}]/g,'').length){
          childLv = Math.max(childLv, Number(this.dataset.lv) + 1);
        }else{
          childLv = Math.max(childLv, Number(this.dataset.lv));
        }
      });
      if(childLv > 0){
        el.dataset.lv = childLv;
        openBracket.dataset.lv = childLv;
        closeBracket.dataset.lv = childLv;
      }
    }
    el.insertAdjacentElement('beforebegin', openBracket);
    el.insertAdjacentElement('afterend', closeBracket);
  });
}

/**
 * 화면상의 줄 끝마다 .line-end 요소를 추가.
 * 수식선의 높이 결정에 영향.
 */
function checkLineEnds(div) {
  $(div).find('.line-end').remove();
  const rem = parseFloat(getComputedStyle(div.ownerDocument.documentElement).fontSize);
  
  // 말단 텍스트 노드들을 선택
  let textNodes = getLeafNodes([div]).filter(function(v){
    return v.nodeType == 3;
  });
  textNodes.forEach(function(n){
    let unit = n;
    let match = unit.data.substring(1).match(/[\s-]/);
    while(unit.nodeType == 3 && match != null && (match.index > -1)){
      // 줄바꿈 기준에 맞추어 텍스트를 분리.
      // 'A B' -> 'A',' B' 
      // 'A-B' -> 'A-','B'
      unit.splitText(match.index + (match[0] == '-' ? 2 : 1));
      unit = unit.nextSibling;
      match = unit.data.substring(1).match(/[\s-]/);
    }
  });
  // 분리된 텍스트 노드들을 다시 선택.
  textNodes = getLeafNodes([div]).filter(function(v){
    return v.nodeType == 3;
  });
  let pos = 0, prevNode;
  const basisDistance = rem / 2;
  textNodes.forEach(function(n, i){
    let range = new Range();
    range.selectNode(n);
    const nodeFirstRect = range.getClientRects()[0];
    // 이전 노드보다 왼쪽에 있거나 마지막 노드일 경우 line-end 추가.
    if((nodeFirstRect != null && nodeFirstRect.x  < (pos - 1/* basisDistance */)) 
    /* || (textNodes.length == i + 1) */){
      let endWrapper = div.ownerDocument.createElement('span');
      endWrapper.className = 'sem line-end';
      endWrapper.insertAdjacentHTML('afterbegin', '&#8203;\n');  // zeroWidthSpace
      // if(i < textNodes.length - 1){
        if(prevNode.data != null && prevNode.data.match(/[\S]/) != null){
          prevNode.replaceWith(prevNode,endWrapper);
        }else{
          prevNode.replaceWith(endWrapper,prevNode);
        }
      // }else {
      // if(textNodes.length == i + 1){
      //   n.replaceWith(n, endWrapper.cloneNode(true));
      // }
    }
    prevNode = n
    range.selectNode(prevNode);
    if(range.getClientRects().length > 0) {
      pos = range.getClientRects()[0].x;
    }  
  });
  const lastEndWrapper = div.ownerDocument.createElement('span');
  lastEndWrapper.className = 'sem line-end';
  lastEndWrapper.insertAdjacentHTML('afterbegin', '&#8203;\n');  // zeroWidthSpace
  div.appendChild(lastEndWrapper);
  // div.normalize();
  requestAnimationFrame(function(){
    adjustLineHeight(div);
  });
}

/**
 * 성분 태그를 제외한 태그들의 gcomment는 상단에 위치하므로 
 * 간섭 여부에 따라 층을 만들어 표시.
 * 줄나눔에 따라 결과가 달라지므로 correctMarkLine 후에 실행.
 *
 * 상단 gcomment를 갖는 태그: cls, ccls, pcls acls, advcls, rcm
 */
function checkGCDepth(div) {
  const rem = parseFloat(getComputedStyle(div.ownerDocument.documentElement).fontSize);
  const tagsWithGComment = div.querySelectorAll('.sem[data-gc]'),
        tagsLen = tagsWithGComment.length;
  let i = 0, el = tagsWithGComment[0];
  function sequentialFunc() {
    let priorTop, priorLeft, base = 0;
    for(let j = i; j < tagsLen; j++){
      const curr = tagsWithGComment[j], rects = curr.getClientRects();
      const currRect = (curr.classList.contains('odd') && rects.length > 1) ? rects[1] : rects[0]; 
      const currTop = currRect == null ? 0 : currRect.top;
      let currLeft = currRect == null ? 0 :currRect.left;
      if(curr.classList.contains('rcm')){
        if(curr.classList.contains('cmnt-align-start')){
          currLeft -= rem;
        }else{
          currLeft += currRect.width 
                - parseFloat(getComputedStyle(curr, '::after').width)
                - parseFloat(getComputedStyle(curr, '::after').right);
        }
      }else{
        currLeft += parseFloat(getComputedStyle(curr, '::after').left); // ::after left값+
      }
      
      if(j > i) {
		const priorTag = tagsWithGComment[j - 1];
        const priorGCWidth = parseFloat(getComputedStyle(priorTag, '::after').width);
        // gcomment끼리 너무 가까우면 앞의 gcomment 높이를 +1 
        if(Math.abs(priorTop - currTop) < rem
        && Math.abs(priorLeft - currLeft) < (5 + priorGCWidth)
		&& (!curr.classList.contains('rcm') || !priorTag.classList.contains('rcm')
		  || curr.textContent != priorTag.textContent)) {
			el.dataset.gcLv = ++base;
        }else{
          break;
        }
      }
      priorTop = currTop;
      priorLeft = currLeft;
    }
    i++;
    el = tagsWithGComment[i];
    if(i < tagsLen){
      requestAnimationFrame(sequentialFunc);
    }else{
      requestAnimationFrame(function(){
        checkLineEnds(div);
      });
    }
  }
  sequentialFunc();
}
/**
 * inner 태그끼리의 겹침을 없앤다. (V(S)V) -> (V)(S)(V)
 * 목적어를 제외한 성분끼리 바로 앞뒤로 붙어있으면 하나의 태그로 합친다.
 * (목적어는 간접목적어 직접목적어일 수 있다.)
 */
function splitInners(div){
  const inners = div.getElementsByClassName('sem inner'),
        innerSvocRegex = /\b([svca]|oc)\b inner/;
  for(let i = 0, len = inners.length; i < len; i++){
    let one = inners[i];
    if(one == null) continue;
    // inner 내부에 inner가 있는 경우
    if(one.getElementsByClassName('sem inner').length > 0){
      let range = new Range();
      const childNodes = one.childNodes;
      for(let j = 0, len2 = childNodes.length; j < len2; j++) {
      	const child = childNodes[j];
        // 자식의 자식이 inner일 경우
        if(child.nodeType == 1
        && child.getElementsByClassName('inner').length > 0) {
          child.childNodes.forEach(function(desc) {
            if(desc.nodeType != 1 || !desc.matches('.inner')) {
              let clone = div.ownerDocument.createElement('span');
              clone.className = 'sem v inner';
              clone.dataset.rc = one.dataset.rc;
			  clone.dataset.rcMin = one.dataset.rcMin;
              range.selectNode(desc);
              range.surroundContents(clone);
            }
          });
        }
        // 자식이 inner일 경우
        else if(child.nodeType != 1 || !child.matches('.inner')) {
          let clone = div.ownerDocument.createElement('span');
          clone.className = 'sem v inner';
          clone.dataset.rc = one.dataset.rc;
		  clone.dataset.rcMin = one.dataset.rcMin;
          range.selectNode(child);
          range.surroundContents(clone);
        }
      }
      one.outerHTML = one.innerHTML;
    }
    // inner 내부에 inner는 없고, 바로 다음 element와 동일한 성분이면 묶어주기.
    // 목적어-목적어는 제외.
    else if(one.matches('.s,.v,.c,.oc,.a')){
      let next = one.nextSibling;
      if(next != null){
        let nextToNext = next.nextSibling;
        if(next.nodeType == 1 
        && next.className.match(innerSvocRegex) != null
        && one.className.match(innerSvocRegex)[0] 
          == next.className.match(innerSvocRegex)[0]){
          one.insertAdjacentHTML('beforeEnd', next.innerHTML);
          next.remove();
          // 1,2,3에서 1을 검사하여 1,2가 합쳐져서 1+2,3이 됐다면 다시 1+2를 검사.
          i--; 
        }else if(next.nodeType != 1 
        && (next.data == null || next.data.match(/[^\s]/) == null)
        && nextToNext != null && nextToNext.nodeType ==1
        && nextToNext.className.match(innerSvocRegex) != null
        && one.className.match(innerSvocRegex)[0] 
          == nextToNext.className.match(innerSvocRegex)[0]){
          one.insertAdjacentHTML('beforeEnd', next.data + nextToNext.innerHTML);
          next.remove();
          nextToNext.remove();
          i--;
        }
      }
    }
  }
}

/**
 * 태그의 텍스트 내용에 trim을 적용하여 가장자리 공백을 표시에서 제외
 * 중첩된 태그의 텍스트가 가장자리 공백을 가질 경우 내부 태그에서부터 부모 태그 순서대로 공백을 밀어낸다.
 */
function trimTextContent(div){
  const sems = div.querySelectorAll('.sem:not(.line-end)');
  
  let blank = new Text();
  blank.data = ' ';
  for(let i = sems.length - 1; i >= 0; i--){
    let one = sems[i];
    if(!one.hasChildNodes()){
      continue;
    }
    while(one.firstChild.nodeType == 3 && one.firstChild.data.startsWith(' ')){
      one.firstChild.data = one.firstChild.data.substring(1);
      one.parentNode.insertBefore(blank.cloneNode(), one);
    }
    
    while(one.lastChild.nodeType == 3 && one.lastChild.data.endsWith(' ')){
      one.lastChild.data = one.lastChild.data.slice(0,-1);
      one.parentNode.insertBefore(blank.cloneNode(), one.nextSibling);
    }
  }
}

/**
 * inner 태그 중 성분 표시 텍스트 길이가 3자 이하면 
 * 성분 표시를 1글자로 줄인다.(소문자로 표시)
 */
var shrinkRComment = (function() { 
  function prv(div){
	  const inners = div.getElementsByClassName('sem inner');
	  for(let one of inners){
	    if(one.dataset.rc != null && one.dataset.rc.indexOf('.') <= 0
	    && prv_getTextWidth(one.textContent, getComputedStyle(one).font, div) 
		< prv_getTextWidth(one.dataset.rc, getComputedStyle(one,'::before').font, div) - 4){
	      one.dataset.rc = one.dataset.rc[0].toLowerCase();
	    }
	  }
  }
  /**
   * HTML5 기능인 canvas.measureText를 사용하여 주어진 텍스트의 가로길이(px단위)를 계산하여 반환
   * (예: 글자수에 따른 단어 선택지 크기를 계산하여 표시할 갯수 지정.)
   * 
   * @param {String} text 화면에 표시할 텍스트 내용
   * @param {String} font 텍스트에 지정된 폰트 css (e.g. "19px Nunito Sans").
   * 
   * @see http://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
   */
  function prv_getTextWidth(text, font, div) {
      // getTextWidth.canvas가 없으면 생성, 있으면 재사용
      const canvas = prv_getTextWidth.canvas || (prv_getTextWidth.canvas = div.ownerDocument.createElement("canvas"));
      const context = canvas.getContext("2d");
      context.font = font;
      return context.measureText(text).width;
  }
  
  return prv;
}());
/**
 * 요소의 텍스트가 한 줄인지, 여러 줄인지에 따라 코멘트의 정렬을 수정.
 */
function correctMarkLine(div){
  div.removeAttribute('style');
  const elementsHaveAlign = div.querySelectorAll('.cmnt-align-center,.cmnt-align-start');
  for(let i = 0, len = elementsHaveAlign.length; i < len; i++) {
	elementsHaveAlign[i].classList.remove('cmnt-align-center','cmnt-align-start','odd');
  }
  const elements = div.querySelectorAll('.sem:not(.line-end)'/*'.s,.o,.c,.v,.oc,.m,.cls'*/);
  for(let i = 0, len = elements.length; i < len; i++) {
	const el = elements[i];
    /*  단어가 위 아래 두 그룹으로 분리되었으나 첫번째 그룹의 너비가 한 글자 미만인 경우
      첫 번째 그룹은 무시하고 두 번째 그룹에 가운데 정렬 적용.  
      left위치는 첫번째 그룹을 기준으로 적용되므로 
      첫 번째, 두 번째 그룹의 left값 차이만큼 왼쪽으로 이동. */
	const rects = el.getClientRects();
    if(rects.length > 1) {
	  if((el.matches('.rcm') || rects[0].width < 10)) {
		const indent = el.matches('.rcm') ? (rects[rects.length - 1].right - rects[0].left)
										: (rects[1].left - rects[0].left);
		const indentMin = el.matches('.rcm') ? indent : (indent + rects[1].width / 2);
		el.style.setProperty('--indent', indent + 'px');
		el.style.setProperty('--indent-min', indentMin + 'px');
		el.classList.remove('cmnt-align-start');
		el.classList.add('cmnt-align-center','odd');
	  } else {
		el.style.setProperty('--indent', null);
		el.style.setProperty('--indent-min', null);
		el.classList.remove('cmnt-align-center','odd');
		el.classList.add('cmnt-align-start');
	  }
    }else{
      el.style.setProperty('--indent', null);
      el.style.setProperty('--indent-min', null);
      el.classList.remove('cmnt-align-start','odd');
      el.classList.add('cmnt-align-center');
    }	
  }
  requestAnimationFrame(function(){
	checkGCDepth(div);
  });
}
/**
 * 수식 관계에 대한 화살표를 표시한다.
 * 수식 대상과 수식어의 상대적 위치에 따라 화살표의 길이 및 높이를 달리 표현한다.
 *
 * 높이가 있는 gcomment와 괄호를 연결하는 선을 표시한다.
 *
 * @param div 수식태그와 수식대상을 포함하는 부모 element(jQuery Object)
 */
var drawConnections = (function() {
	async function prv(div){
	  const lines = div.querySelectorAll('.curved_arrow,.gc_line');
	  for(let i = 0, len = lines.length; i < len; i++) {
		if(lines[i].parentNode) lines[i].parentNode.removeChild(lines[i]);
	  }
	  const ownerDocument = div.ownerDocument;
	  
	  const rem = parseFloat(getComputedStyle(ownerDocument.documentElement).fontSize);
	  const divOffset = $(div).offset(), divLeft = divOffset.left, divTop = divOffset.top,
	    ownerWindow = ownerDocument.defaultView,
	    scrolledDivLeft = ownerWindow.scrollX - divLeft, 
	    scrolledDivTop = ownerWindow.scrollY - divTop;
	  let drawSettings1 = {lineWidth: rem/8, size: rem/3, strokeStyle: '#FFCC99', header:false},
	    drawSettings2 = {lineWidth: rem/8, size: rem/3, strokeStyle: '#FFCC99'};
	  let eachLineRects = [], currentLineTop = (div.getClientRects()[0] == null) ? 0 :div.getClientRects()[0].top;
	  const lineEnds = div.querySelectorAll('.line-end');
	  for(let i = 0, len = lineEnds.length; i < len; i++) {
	    const bottom = currentLineTop + parseFloat(getComputedStyle(lineEnds[i]).lineHeight);
	    eachLineRects.push({top:currentLineTop, bottom}); 
	    currentLineTop = bottom;
	  }
	  const modifiers = div.querySelectorAll('[data-mfd]');
	  for(let i = 0, len = modifiers.length; i < len; i++) {
		const modifier = modifiers[i];
	    // 수식어 자식들
	    const modifierChildNodes = getLeafNodes([modifier]);
	    // 수식 대상
	    const modificand = div.querySelector('.sem.mfd-' + modifier.dataset.mfd);
	    if(modificand == null) continue;
	    
	    const modificandChildNodes = getLeafNodes([modificand]);
	    const mdfChildLen = modifierChildNodes.length,
	      mdfdChildLen = modificandChildNodes.length;
	    let i_mb = 0, i_me = mdfChildLen - 1, i_tb = 0, i_te = mdfdChildLen - 1;
	    let modBeginNode = modifierChildNodes[i_mb++],
	      modEndNode = modifierChildNodes[i_me--],
	      targetBeginNode = modificandChildNodes[i_tb++],
		  targetEndNode = modificandChildNodes[i_te--];
	    // 줄바꿈 기호가 수식 대상의 마지막 노드면, 그 앞 노드를 선택.
	    if(targetEndNode.parentElement.classList.contains('line-end')){
	      targetEndNode = modificandChildNodes[i_te--];
	    }
	    // 해당 노드가 실제하지 않는 노드일 경우 다음(앞/뒤) 노드 선택
	    while(modBeginNode.length == 0 && i_mb < mdfChildLen) {
		  modBeginNode = modifierChildNodes[i_mb++];
		}
	    while(modEndNode.length == 0 && i_me >= 0) {
		  modEndNode = modifierChildNodes[i_me--];
		}
	    while(targetBeginNode.length == 0 && i_tb < mdfdChildLen) {
		  targetBeginNode = modificandChildNodes[i_tb++];
		}
	    while(targetEndNode.length == 0 && i_te >= 0) {
		  targetEndNode = modificandChildNodes[i_te--];
		}
	    // 수식어구와 수식 대상의 coordinates(top,left,right)
	    const modBeginCoord = getCoord(modBeginNode),
	      modEndCoord = getCoord(modEndNode),
	      targetBeginCoord = getCoord(targetBeginNode),
	      targetEndCoord = getCoord(targetEndNode);
	    if(!(modBeginCoord && modEndCoord && targetBeginCoord && targetEndCoord)){
	      continue;
	    }  
	    // 수식어구와 수식 대상의 화살표 위치 높이 보정값(폰트 top, size에 의한 변경치)
	    const modBeginTop = modBeginCoord.top + getTextTopMove(modBeginNode),
	      modEndTop = modEndCoord.top + getTextTopMove(modEndNode),
	      targetBeginTop = targetBeginCoord.top + getTextTopMove(targetBeginNode),
	      targetEndTop = targetEndCoord.top + getTextTopMove(targetEndNode);
	    
	    // 문장이 포함된 전체 영역
	    const textareaWidth = parseFloat(getComputedStyle(div).width) || 0;
	    // 화살표의 높이
	    let arrowHeight = 0;
	    // 좌측 상단을 기준으로 한 처음과 마지막 노드의 Coord
	    let first, last, 
	    // 화살표의 시작,끝 {x,y}좌표
	      startX = scrolledDivLeft, startY = scrolledDivTop, 
	      endX = scrolledDivLeft, endY = scrolledDivTop;
	    // 수식어와 피수식어가 다른 줄에 있음 여부.
	    let isDiffLine = false;
	    // 수식어와 피수식어을 포함한 줄에서 첫 줄과 마지막 줄을 제외한 줄.
	    let interLines = [];
	
		// 피수식어가 윗줄
		if(targetEndCoord.top + targetEndCoord.height < modBeginCoord.top){
		  isDiffLine = true;
		  first = targetEndCoord; last = modBeginCoord;
		  startX += modBeginCoord.left + rem / 3;  startY += modBeginTop - rem;
		  endX += targetEndCoord.right - rem / 3;  endY += targetEndTop - rem;
	  
		  drawSettings1.p0x =  0;  drawSettings2.p0y =  endY;
		  drawSettings2.p0x =  textareaWidth;  drawSettings2.p1y =  endY;
		}
		// 피수식어가 아랫줄
		else if(targetBeginCoord.top > modEndCoord.top + modEndCoord.height){
		  isDiffLine = true;
		  first = modEndCoord; last = targetBeginCoord;
		  startX += modEndCoord.right - rem / 3;   startY += modEndTop - rem;
		  endX += targetBeginCoord.left + rem / 3; endY += targetBeginTop - rem;
	        
		  drawSettings1.p0x =  textareaWidth;  drawSettings2.p0y =  endY;
		  drawSettings2.p0x =  0;  drawSettings2.p1y =  endY;        
		}
		// 수식 대상이 같은 줄 && 왼쪽
		else if(targetEndCoord.x < modBeginCoord.x){
		  first = targetEndCoord; last = modBeginCoord;
		  startX += modBeginCoord.left + rem / 3;  startY += modBeginTop - rem;
		  endX += targetEndCoord.right - rem / 3;  endY += targetEndTop - rem;
	        
		  drawSettings1.p0x =  (startX + endX) / 2; drawSettings2.p0y = startY;
		  drawSettings2.p0x =  (startX + endX) / 2; drawSettings2.p1y = startY;        
		}
		// 수식 대상이 같은 줄 && 오른쪽
		else if(targetBeginCoord.x > modEndCoord.x){
		  first = modEndCoord; last = targetBeginCoord;
		  startX += modEndCoord.right - rem / 3;   startY += modEndTop - rem;
		  endX += targetBeginCoord.left + rem / 3; endY += targetBeginTop - rem;
	        
		  drawSettings1.p0x =  (startX + endX) / 2; drawSettings2.p0y = startY;
		  drawSettings2.p0x =  (startX + endX) / 2; drawSettings2.p1y = startY;        
		}
	    // 처음과 끝을 제외한 사이 줄 계산
	    if(!(first && last)) continue;
	    const yMin = Math.min(first.top, last.top), 
	          yMax = Math.max(first.top, last.top);
		for(let j = 0, len2 = eachLineRects.length; j < len2; j++) {
		  const rect = eachLineRects[j];
	      if(rect.top > yMin && rect.bottom < yMax){
	        interLines.push(rect.bottom - div.getClientRects()[0].top - rem);
	      }
		}
	    
	    // 처음과 끝 사이의 거리에 따른 화살표 높이 계산
	    // distance: 수식어와 피수식어 사이의 거리(가로). 여러 줄이면 거쳐가는 줄의 길이까지 포함
	    const distance = last.left + 2 * rem / 3 - first.right
	          + (isDiffLine ? (textareaWidth * (interLines.length + 1)) : 0) ;
	    arrowHeight = 15 + (0.03 * distance);
	    
	    // 각 화살표의 아이디 할당
	    drawSettings1.className = 'curved_arrow start mfd' + modifier.dataset.mfd;
	    drawSettings2.className = 'curved_arrow end mfd' + modifier.dataset.mfd;
	    
	    // 계산된 화살표 높이를 적용한 최종 화살표 canvas 좌표 설정
	    drawSettings1.p0y = startY - arrowHeight;
	    drawSettings1.p1x = startX;  drawSettings1.p1y = startY - arrowHeight;
	    drawSettings1.p2x = startX; drawSettings1.p2y = startY;
	    
	    drawSettings2.p0y -= arrowHeight;
	    drawSettings2.p1x =  endX;  drawSettings2.p1y -= arrowHeight; 
	    drawSettings2.p2x = endX;  drawSettings2.p2y = endY;
	    /* 화살표 시작 */
	    //$(div).curvedArrow(drawSettings1);
	    drawCurvedArrow(div, drawSettings1);
	    /* 화살표 끝 */
	    drawCurvedArrow(div, drawSettings2);
	    //$(div).curvedArrow(drawSettings2);
	    /* 사이 행 줄 긋기 */
	    for(let j = 0, len2 = interLines.length; j < len2; j++) {
	      requestAnimationFrame(function(){
	        drawHorizontal(0, interLines[j],arrowHeight, textareaWidth, ownerDocument, drawSettings1);
	      });
		}
	  }
	
	  // [gcomment 이음선 표시]
	  const elementsHaveGcLv = div.querySelectorAll('[data-gc-lv]');
	  for(let i = 0, len = elementsHaveGcLv.length; i < len; i++) {
		const el = elementsHaveGcLv[i];
	    const commentCss = getComputedStyle(el,'::after'),
	          rect = el.getClientRects()[el.matches('.odd') ? 1 : 0],
	          commentTop = parseFloat(commentCss.top) + scrolledDivTop + rect.top,
	          commentLeft = parseFloat(commentCss.left) + scrolledDivLeft + rect.left;
	    let options = {p0x: commentLeft, p0y: commentTop + 0.35 * rem,
	             p1y: commentTop + 0.35 * rem,
	             curve: false, lineWidth: 1, header: false, size: 2,
	             className: 'gc_line', strokeStyle:'rgb(158,175,234)'};
	    // 괄호를 가지는 품사들은 gcomment의 위치가 다름을 인식.
	    if(el.matches('.cls,.ncls,.acls,.advcls,.phr,.adjphr,.advphr,.ptcphr')) {
	      const prevRects = el.previousElementSibling.getClientRects(),
	            prevLastRect = prevRects[prevRects.length - 1];
	      options.p1x = scrolledDivLeft + rect.left - 0.25 * rem;
	      options.p2x = options.p1x;
	      // 앞에 위치한 괄호 상단에 이음선이 끝나도록
	      options.p2y = scrolledDivTop + prevLastRect.top  
	                     + prevLastRect.height * 0.17;
	    }
	    // 문장 필수성분의 gcomment 높이 차이
	    else {
	      options.p1x = scrolledDivLeft + rect.left + 0.25 * rem;
	      options.p2x = options.p1x;
	      // 텍스트 박스 상단 첫글자 위치에 이음선이 끝나도록.
	      options.p2y = scrolledDivTop + rect.top;
	    }
	    drawCurvedArrow(div, options);
	    //$(div).curvedArrow(options);
	  }
  }
  /**
   * 대상 노드(텍스트노드 포함)의 실제 사각 정보(top,left,right,width 등)를 반환
   */
  function getCoord(node){
    let range = node.ownerDocument.createRange();
    range.selectNodeContents(node);
    const rects = range.getClientRects();
    if(rects.length > 0){
      return rects[0];
    }
  }
  
  /**
   * 대상 텍스트노드 top 위치 변경치 반환(-top+fontSize)
   */
  function getTextTopMove(node) {
    return (parseFloat(getComputedStyle(node.parentElement).fontSize) || 16)
      - (parseFloat(getComputedStyle(node.parentElement).top) || 0);
  }
  
  /**
   * 주어진 시작지점부터 일정 길이의 수평의 직선을 그린다.
   */
  function drawHorizontal(xPos, yPos, height, length, ownerDocument, settings){
    const padding = settings.size - settings.lineWidth;
    let canvas = ownerDocument.createElement('canvas');
    canvas.className = settings.className.replace('start','btwn');
    canvas.style.position = 'absolute';
    canvas.style.top = (yPos - height - padding) + 'px';
    canvas.style.left = (xPos - padding) +'px';
    canvas.dataset.height = height;
    
    let ctx = canvas.getContext('2d');
    canvas.style.width = 2 * padding + length + 'px';
    canvas.style.height = 2 * padding + settings.lineWidth + 'px';
    // 디바이스 픽셀 비율에 의한 흐릿함 보정
    const dpr = window.devicePixelRatio || 1;
    canvas.width = (2 * padding + length) * dpr;
    canvas.height = (2 * padding + settings.lineWidth) * dpr; 
    ctx.scale(dpr, dpr);
      
    ctx.strokeStyle = settings.strokeStyle;
    ctx.lineWidth = settings.lineWidth;
    ctx.moveTo(padding, padding);
    ctx.lineTo(length + padding, padding);
    ctx.stroke();
    div.append(canvas);
  }
  return prv;
}());
/**
 * 각 줄마다 높이를 컨텐츠들 높이에 맞춘다.
 * line-height: 윗줄과 아랫줄의 offset 차이. 0이면 완전히 겹쳐진다.
 */
var adjustLineHeight = (function() {
  function prv(div) {
	  const rem = parseFloat(getComputedStyle(div.ownerDocument.documentElement).fontSize);
	  
	  // 미리 기본 줄 높이를 부족할 정도로 낮춘다.
	  div.style.lineHeight = '1rem';
	  // 말단 텍스트 노드들을 선택
	  const textNodes = getLeafNodes([div]).filter(function(v){
	    return v.nodeType == 3;
	  });
	  let lineNumber = 0;
	  let prevLineLowerHeight = 0, 
	    maxContentHeight = 0, maxUpperHeight = 0, maxLowerHeight = 0;
	  // 각 줄의 최고 높이에 해당하는 줄높이를 갖는 span을 줄 끝에 삽입.
	  for(let i = 0, len = textNodes.length; i < len; i++) {
	    let n = textNodes[i];
	    let range = new Range();
	    range.selectNode(n);
	    const nodeFirstRect = range.getClientRects()[0];
	    // 공백이 아닌 노드면 높이를 측정 후 최고 높이를 갱신.
	    if(nodeFirstRect != null && n.data != null && n.data.match(/[^\s]/) != null){
	      let contentHeight = nodeFirstRect.height;
	      // 괄호의 경우 contentHeight 따로 계산
	      if(n.parentElement.matches('.etc-start,.etc-end,.cls-start,.cls-end')){
	        // 괄호 실질크기: height의 66%, 윗부분: 84%, 아래부분: 16%, 
	        // 중심: 텍스트 bottom(top 0 기준)
	        contentHeight = rem * 1.35;
	        const top = parseFloat(getComputedStyle(n.parentElement).top),
	              brktHeight = nodeFirstRect.height * 0.66,
	              brktTop = brktHeight * 0.84 - top - contentHeight * 0.77,
	              brktBottom = brktHeight * 0.16 + top - contentHeight * 0.23;
	        maxUpperHeight = Math.max(maxUpperHeight, brktTop);
	        maxLowerHeight = Math.max(maxLowerHeight, brktBottom);
	      }
	      // 마지막 노드(line-end)가 아닐 경우 최고 높이 갱신.
	      if(n.parentElement == null ||!n.parentElement.classList.contains('line-end')){
	        maxContentHeight = Math.max(maxContentHeight, contentHeight);
	        
	        const pseudoHeights = getPseudoHeights(n, nodeFirstRect, rem);
	        maxUpperHeight = Math.max(maxUpperHeight, pseudoHeights.upperHeight);
	        maxLowerHeight = Math.max(maxLowerHeight, pseudoHeights.lowerHeight);
	      }
	      // 계산된 최대높이를 line-end에 적용
	      else{
	        // line-height 조정의 목적은 윗줄의 lower 요소들과 현재줄의 upper요소들의 겹침 방지이다.
	        // 따라서 '윗줄 lower 높이 + 현재줄 upper 높이 + 텍스트 높이'만큼의 차이 필요.
	        n.parentElement.style.lineHeight 
	          = Math.max(maxContentHeight, rem * 1.35
	          + maxUpperHeight + prevLineLowerHeight
	          + (lineNumber > 0 ? (rem * 0.5/*여유 간격*/) : 0)) + 'px';
	        prevLineLowerHeight = maxLowerHeight;
	        if(i == len - 1) {
	          // 마지막의 하단부 크기만큼 아랫쪽 간격 추가.
	          div.style.paddingBottom = maxLowerHeight + 'px';
	        }else {
	          // 줄의 마지막이 되면 변수들 초기화
	          maxContentHeight = 0;
	          maxUpperHeight = 0;
	          maxLowerHeight = 0;
	        }
	        lineNumber++;
	      }
	    }  
	  }
	  requestAnimationFrame(function(){
	    // 줄높이 조정이 끝나면 인쇄용 페이지 나눔 적용
	    /*var ownerDocument = div.ownerDocument;
	    if(ownerDocument.querySelector('.print-section') != null) {
	      $(ownerDocument).find('.page-breaker').removeClass('page-breaker');
	      var printHeight = parseFloat(getComputedStyle(ownerDocument.querySelector('.print-section')).height)
	              - parseFloat(getComputedStyle(ownerDocument.querySelector('.page-header')).height)
	              - parseFloat(getComputedStyle(ownerDocument.querySelector('.page-footer')).height);
	      var nextPageBoundary = ownerDocument.querySelector('.page-body').getClientRects()[0].top + printHeight;
	      
	      $(ownerDocument).find('p,div,.line-end').filter(function() {
	        return (this.getClientRects().length > 0) && $(this).find('p,div,.line-end').length == 0;
	      }).each(function() {
	        if(this.getClientRects()[0].bottom > nextPageBoundary) {
	          this.classList.add('page-breaker');
	          nextPageBoundary = this.getClientRects()[0].top + printHeight;
	        }
	      })
	      
	    }*/
	    drawConnections(div);  
	  });
  }
  //--------------------------- Embeded functions --------------------------//
  // pseudo element(::before, ::after)를 갖고 있으면 높이에 포함.
  function getPseudoHeights(node, rect, rem) {
    const parent = node.parentElement;
    const $parents = $(parent).parents('.sem')
                .add(parent.matches('.sem') ? parent : null), 
          parentsLen = $parents.length;
    let upperHeight = 0, lowerHeight = 0;
    for(let i = 0; i < parentsLen; i++) {
      const oneParent = $parents.get(i);
      const parentRects = oneParent.getClientRects(),
        firstRect = parentRects[0], oddRect = parentRects[1];
      const nearFirstNode = (!oneParent.matches('.odd') && Math.max(
                    Math.abs(firstRect.left - rect.left),
                    Math.abs(firstRect.top - rect.top)) < 16);
      const nearOddNode = (oneParent.matches('.odd') && (oddRect != null) && Math.max(
                    Math.abs(oddRect.left - rect.left),
                    Math.abs(oddRect.top - rect.top)) < 16);
      // [1. 성분표시 밑줄 높이 적용.(최상위 부모의 것 적용)]
      // ORL: OutmostRcommentLine
      const ORL = $(oneParent).parents('[data-rc]').get(0)
            || (oneParent.matches('[data-rc]') ? oneParent : null); 
      let underlineHeight;
      if(ORL != null) {
        underlineHeight = parseFloat(getComputedStyle(ORL).paddingBottom);
        lowerHeight = Math.max(lowerHeight, underlineHeight);
      }
      // [2. 부모 요소(this) rcomment의 높이 적용.]
      const beforeStyle = getComputedStyle(oneParent, '::before');

      if(oneParent.matches('[data-rc]') && nearOddNode 
      && isFinite(parseFloat(beforeStyle.bottom))) {
        lowerHeight = Math.max(lowerHeight, underlineHeight, 0 
                - parseFloat(beforeStyle.bottom)
				// 모바일은 rcomment에 padding 들어감
				+ (portraitList.matches? parseFloat(beforeStyle.paddingBottom):0)
                - parseFloat(beforeStyle.lineHeight) * 0.5 
                + parseFloat(beforeStyle.fontSize) * 0.5);
      }else if(oneParent.matches('[data-rc]') && nearFirstNode 
      && isFinite(parseFloat(beforeStyle.top))) {
        lowerHeight = Math.max(lowerHeight, underlineHeight, 
                parseFloat(beforeStyle.top) - rem * 1.35
				// 모바일은 rcomment에 padding 들어감
				+ (portraitList.matches? parseFloat(beforeStyle.paddingBottom):0)
                + parseFloat(beforeStyle.lineHeight) * 0.5
                + parseFloat(beforeStyle.fontSize) * 0.5);
      }
      
      // [3. 부모 요소(this)가 자신(node,rect)과 가깝다면 부모 gcomment 높이 적용.]
      if(oneParent.matches('[data-gc]') && (nearFirstNode || nearOddNode)){
        const afterStyle = getComputedStyle(oneParent, '::after');
        upperHeight = Math.max(upperHeight,
            oneParent.matches('.odd') ?
            ((parseFloat(afterStyle.bottom) || 0)
            + parseFloat(afterStyle.lineHeight) * 0.5
            + parseFloat(afterStyle.fontSize) * 0.5)
            : (parseFloat(afterStyle.fontSize) * 0.5
            - parseFloat(afterStyle.top) 
            - parseFloat(afterStyle.lineHeight) * 0.5)
            );
      }
    }
    return {upperHeight, lowerHeight};
  }
  return prv;
}());
/**
* 자식을 더이상 갖지 않는 노드들을 모두 선택하여 반환.
*/
function getLeafNodes(nodes, result = []){
  for(let i = 0, length = nodes.length; i < length; i++){
    if(nodes[i] == null){
      continue;
    }
    if(!nodes[i].childNodes || nodes[i].childNodes.length === 0){
      result.push(nodes[i]);
    }else{
      result = getLeafNodes(nodes[i].childNodes, result);
    }
  }
  return result;
}

/**
 * 프린트 미리보기 새 창을 띄움.
 * 프린트 미리보기창에서 용지 선택, 헤더/푸터 수정을 행함.
 */
function printPreview(options ) {
  var opt = $.extend({
    obj2print:'body',
    style:'',
    script: null,
    width:'670',
    height:screen.height-105,
    top:0,
    left:'center',
    resizable : 'yes',
    scrollbars:'yes',
    status:'no',
    title:'인쇄 미리보기'
  }, options );
  if(opt.left == 'center'){
      opt.left=(screen.width/2)-(opt.width/2);
  }
  $(opt.obj2print).find(" input").each(function(){
      $(this).attr('value',$(this).val());
  });
  $(opt.obj2print).find(" textarea").each(function(){
      $(this).html($(this).val());
  });
  // css, js 등 <head> 요소 모아서 문자열화
  var headers = document.head.cloneNode(true),
    exHeaders = headers.querySelectorAll('script:not([src])'), 
    exHeadersLen = exHeaders.length;
  for(let i = 0; i < exHeadersLen; i++) {
    headers.removeChild(exHeaders[i]);
  }
  // <body> 요소 모아서 문자열화
  var printSection = opt.template.cloneNode(true),
    objs = document.querySelectorAll(opt.obj2print),
    objsLen = objs.length;
  if(opt.template) {
    var printBody = printSection.querySelector('.page-body');
    for(let i = 0; i < objsLen; i++) {
      printBody.appendChild(objs[i].cloneNode(true));
    }
  }
  var str = "<!DOCTYPE html><html>"
      + "<head>"+ headers.innerHTML + opt.style + "</head>"
      + "<body class='print-section mx-auto'>" + printSection.innerHTML + "</body></html>";
  //top open multiple instances we have to name newWindow differently, so getting milliseconds
  var d = new Date();
  var n = 'newWindow' + d.getMilliseconds();
  var newWindow = window.open(
          "", 
          n, 
          "width=" + opt.width +
          ",top=" + opt.top +
          ",height=" + opt.height +
          ",left=" + opt.left +
          ",resizable=" + opt.resizable +
          ",scrollbars=" + opt.scrollbars +
          ",status=" + opt.status
          );
  var newDoc = newWindow.document;
  newDoc.write(str);
  newDoc.title = opt.title;

  $(newDoc).on('click', '.print-btn', function() {
    newWindow.print();
  }).on('change', '.selectSize', function() {
    $(newDoc).find('.print-section').css('width', this.value.split('/')[0] + 'mm')
              .css('height', this.value.split('/')[1] + 'mm');
    $(newDoc).find('.semantics-result').each(function(){
      correctMarkLine(this);
    });
  })
  setTimeout(function() {
    var results = newDoc.querySelectorAll('.semantics-result'),
      i = 0, resultsLen = results.length;
    function sequenceFunc() {
      if(i < resultsLen) {
        results[i].removeAttribute('style');
        correctMarkLine(results[i]);
        i++
        requestAnimationFrame(sequenceFunc);
      }
    }
    sequenceFunc();
  }, 2000);
}
/**=============================================================================
 * 형태소 및 의존성 트리구조를 표시
 * 
 * @param tokenList 대상 토큰 리스트
 * @param container 트리구조 표시 영역이 삽입될 대상
 * @param setting 차트 표시 옵션 (allowHtml, size, allowCollapse, nodeClass)
 */
async function drawTokenTree(tokenList, container, setting){
  if(typeof tokenList == 'undefined' || typeof container == 'undefined' || container.length == 0) {
    console.error('Can\'t draw token tree. Either tokenList or container is null.');
    return;
  }
  if(typeof google == 'undefined' || typeof google.visualization == 'undefined') {
	await $.getScript('https://www.gstatic.com/charts/loader.js');
  }
  if(!google.visualization || !google.visualization.OrgChart){
    await google.charts.load('current', {packages:['orgchart']});
    google.charts.setOnLoadCallback(async function(){
      await drawTokenTree(tokenList, container, setting);  
    });
  }else{
    var drawSetting = {'allowHtml': true, 'size': 'large', 
             'allowCollapse': true, 'nodeClass':'node'};
    Object.assign(drawSetting, setting);
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Index');
    data.addColumn('string', 'Name and Desc');
    data.addColumn('string', 'ToolTip');
    
    var div = container[0].ownerDocument.createElement('div');
    div.className = 'tokentree-result';
    container.append(div);
    tokenList.forEach(function(token){
      data.addRow([{
        v:token.tokenIndex.toString(),  // v: 토큰 아이디
        // f: 표시내용. 토큰 라벨 표시
        f:'<span class="node-label">' + token.edgeLabel + '</span>'
        + '<hr style="padding:0">'   
        + '<div class="node-desc">'
          // 토큰  단어 스펠
          + '<span class="node-text">' + token.tokenText + '</span><br>'  
          // 토큰 단어 품사
          + '<span class="node-part">(' + token.partOfSpeech + ')</span>'
          + '<hr style="padding:0">'  
          // 토큰 인덱스 번호
          + '<span class="node-index">' + token.tokenIndex + '</span>'
          // 토큰 범위
          + '<span class="node-range">(' + token.tokenStart + '~' + token.tokenEnd +')</span>' 
          + '</div>'},
        // 헤드 토큰 아이디
        token.dependencyIndex.toString(),'원형 : ' + token.lemma]);  
    });
    // Create the chart.
    var chart = new google.visualization.OrgChart(div);
    // html 태그방식으로 표시하기 위해 allowHtml:true
    chart.draw(data, drawSetting);    
  }
}

function readyDictFor(div){
  if(div.ownerDocument.getElementById('dictModuleArea') == null){
    let dictArea = div.ownerDocument.createElement('div');
    dictArea.id = 'dictModuleArea';
    div.ownerDocument.body.append(dictArea);
    div.ownerDocument.body.addEventListener('mousedown', function(e){
      if($(e.target).closest('.dictionary-box').length == 0) {
        $('.dictionary-box').remove();
      }
    })
  }
 
  div.removeEventListener('mouseup',showDict);
  div.addEventListener('mouseup', showDict);
  
  /*--------------------------- embed functions ----------------------------*/
  function showDict(e) {
    var x = (e.type == 'touchstart') ? e.touches[0].clientX : e.clientX;
       var y = (e.type == 'touchstart') ? e.touches[0].clientY : e.clientY;
    var word = getWordAtPoint(x, y);
    if(word != null){
      searchForDict(word);
    }
  }
  
  function successSearchWord(result, x, y) {
    let dictArea = div.ownerDocument.getElementById('dictModuleArea');
    var title = result.keyword;
    
    var dict = div.ownerDocument.createElement('div');
    dictArea.append(dict)
    dict.className = 'dictionary-box p-3';
    dict.style.right = 5 + 'px';
    dict.style.top = /*window.scrollY + y +*/ 5 + 'px';
    dict.innerHTML = '<h4 class="header">' + result.keyword + '</h4><hr>';
    result.desc.forEach(function(e){
      dict.innerHTML += '<p class="desc">' + e + '</p>';
    });
  }
  
  function searchForDict(word) {
    /*$.ajax({
      type : 'GET',
      data : {keyword:word.text},
      url : '/sample/semantic/demo',
      success : function(result){
        successSearchWord({keyword:word.text, desc: ['뜻 1입니다.','뜻 2입니다.','뜻 3입니다.']}, 
        word.x, word.y);
      }
    })*/
    successSearchWord({keyword:word.text, desc: ['뜻 1입니다.','뜻 2입니다.','뜻 3입니다.']}, 
              word.x, word.y);
  }
  
  /**
   * 마우스/터치 포인터가 위치한 곳의 단어 값을 반환
   * 알파벳 정보가 없는 문자열은 null 취급
   */
  function getWordAtPoint(x, y) {
    let sel = getSelection(), range, ret, startX, endY;
    if(!sel.isCollapsed){
      ret = sel.toString().trim();
      let rect = sel.getRangeAt(0).getClientRects()[0];
      startX = rect.x;
      endY = rect.y + rect.height;
    }else {
      if (div.ownerDocument.caretPositionFromPoint) {
        range = div.ownerDocument.caretPositionFromPoint(x, y);
      } else if (div.ownerDocument.caretRangeFromPoint) {
        range = div.ownerDocument.caretRangeFromPoint(x, y);
      } else {
        console.error("[This browser supports neither document.caretRangeFromPoint"
                + " nor document.caretPositionFromPoint.]");
        return(null);
      }
      if(typeof Selection.prototype.modify === 'function'){
        sel = getSelection();
        sel.modify('move', 'backward', 'word');
        sel.modify('extend', 'forward', 'word');
        ret = sel.toString().trim();
        if(sel.rangeCount == 0){
          return(null);
        }
        let rect = sel.getRangeAt(0).getClientRects()[0];
        startX = rect.x;
        endY = rect.y + rect.height;
        if(rect.y > y || y > (rect.y + rect.height)){
          return(null)
        }
      }else if(typeof Range.prototype.expand === 'function') {
        range.expand('word');
        ret = range.toString().trim();
        let rect = range.getClientRects()[0];
        startX = rect.x;
        endY = rect.y + rect.height;
      } else {
        console.error('[This browser supports neither Selection.modify nor Range.expand.]');
      }
      if(ret.match(/\w+/gi) == null){
        return(null);
      }
    }
    return({text: ret, x: startX, y: endY});
  }
}
