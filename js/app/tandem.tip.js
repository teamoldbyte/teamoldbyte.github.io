/**
 * 문장 입력 팁 정보와 구문분석 도움말 정보 표시
@author LGM
 */
(function($, document, tandem) {
	const tip_tit = '<b>더 정확한 분석을 위해..',
		bFcRed = '<b class=\"text-fc-red\">',
		ex_sen_sect = '<div class=\"example-sentence-section\">',
		cor_sen = '<span class=\"correct-sentence\"><i class=\"fa fa-arrow-right\"></i>',
		thumbs_up = ' <i class="far fa-thumbs-up text-fc-purple"></i>';
	const inputRules = [
		`${tip_tit}#1</b><br>문장 분석에 ${bFcRed}중요하지 않는 문장 요소</b>를 배제하세요.<br>${ex_sen_sect}What can I do for you<b class="text-dark">, <span class="x-mark">Mom</span>?</b> <br>${cor_sen} What can I do for you?</span>${thumbs_up}</div>`,
		`${tip_tit}#2</b><br>문장 이해에 필요한 ${bFcRed}정확한 구두점</b>을 제공하세요.<br>${ex_sen_sect}Whether you like it or not ${bFcRed}you</b> must admit it now.<br>${cor_sen} Whether you like it or not<b class="me-1 text-fc-purple"><span class="text-fc-red">,</span> you</b> must admit it now.</span>${thumbs_up}</div>`,
		`${tip_tit}#3</b><br>접속사, to 등 ${bFcRed}생략을 최소화</b>하세요.<br>${ex_sen_sect}That is a <b class="me-1 text-dark">sign lightning</b> may be about to strike.<br>${cor_sen} That is a <b class="text-dark">sign <span class="text-fc-red">that</span> lightning</b> may be about to strike.</span>${thumbs_up}</div>`,
		`${tip_tit}#4</b><br>관계사와 구별되는 ${bFcRed}지시 대명사</b>를 사용하세요.<br>${ex_sen_sect}How easy is <b class="me-1 text-dark"><span class="x-mark">that</span></b> going to be to manage?<br>${cor_sen} How easy is ${bFcRed}it</b> going to be to manage?</span>${thumbs_up}</div>`,
		`${tip_tit}#5</b><br>문장 분석에 ${bFcRed}불필요한 접속사</b>를 문두에 두지 마세요.<br>${ex_sen_sect}<b class="me-1 text-dark"><span class="x-mark">But</span></b> what passion was there in a life lived with prudence?<br>${cor_sen}What passion was there in a life lived with prudence?</span>${thumbs_up}</div>`,
		`${tip_tit}#6</b><br>${bFcRed}인용구</b>가 들어간 문장은 ${bFcRed}분리</b>하여 입력해 주세요.<br>Gina explained${bFcRed}, "</b>I got into a car accident.${bFcRed}"</b><br>${cor_sen} Gina explained. I got into a car accident.</span>${thumbs_up}</div>`
	];
	const rul_div = '<div class=\"row g-0\"><div class=\"col-3 my-auto\"><b>',
		and_exampl = '</div><div class=\"col-5 example-image\">';
	const tandemRules = [
		`${rul_div}주어</b><br>(subject)${and_exampl}<span class=\"sem s inner cmnt-align-center example\" data-rc=\"S\" data-rc-min=\"S\">You</span></div><div class=\"col-4 my-auto\">subject의 약어로 S로 표시하고 주어부에 <span class=\"color-chip subj\">◼︎︎</span> 색상 적용</div></div>`,
		`${rul_div}의미상주어</b><br>(sense subject)${and_exampl}<span class=\"sem s inner cmnt-align-center example\" data-rc=\"s.s.\" data-rc-min=\"s.s.\" data-gc=\"의미상 주어\">for you</span></div><div class=\"col-4 my-auto\">sense subject의 약어로 s.s.</div></div>`,
		`${rul_div}동사</b><br>(verb)${and_exampl}<span class=\"sem v inner cmnt-align-center example\" data-rc=\"V\" data-rc-min=\"V\">are</span></div><div class=\"col-4 my-auto\">verb의 약어로 V로 표시하고 동사부에 <span class=\"color-chip verb\">◼︎︎</span> 색상 적용</div></div>`,
		`${rul_div}목적어</b><br>(object)${and_exampl}<span class=\"sem o inner cmnt-align-center example\" data-rc=\"O\" data-rc-min=\"O\">a dream</span></div><div class=\"col-4 my-auto\"></div></div>`,
		`${rul_div}진목적어</b><br>(real object)${and_exampl}<span class=\"sem o inner cmnt-align-center example\" data-rc=\"r.o.\" data-rc-min=\"r.o.\">to solve the problem</span></div><div class=\"col-4 my-auto\">real object의 약어로 r.o.</div></div>`,
		`${rul_div}부사적 보충어</b><br>(adverbial phrase)${and_exampl}<span class=\"sem a inner cmnt-align-center example\" data-rc=\"A\" data-gc=\"부사적 보충어\">in Daegu</span></div><div class=\"col-4 my-auto\"></div></div>`,
		`${rul_div}보어</b><br>(complement)${and_exampl}<span class=\"sem c inner cmnt-align-center example\" data-rc=\"C\" data-rc-min=\"c\">a vegetarian</span></div><div class=\"col-4 my-auto\"></div></div>`,
		`${rul_div}목적보어</b><br>(objective complement)${and_exampl}<span class=\"sem oc inner cmnt-align-center example\" data-rc=\"o.c.\" data-rc-min=\"o.c.\">a dream</span></div><div class=\"col-4 my-auto\"></div></div>`,
		`${rul_div}to부정사</b>${and_exampl}<span class=\"sem tor cmnt-align-center example\" data-gc=\"to부정사\">to change</span></div><div class=\"col-4 my-auto\"></div></div>`,
		`${rul_div}분사</b></div><div class=\"col-5 example-image mb-0\"><span class=\"sem ptc cmnt-align-center example\" data-gc=\"현재분사\">rising</span><span class=\"slash align-middle\">/</span><span class=\"sem ptc cmnt-align-center example\" data-gc=\"과거분사\">called</span></div><div class=\"col-4 my-auto\"></div></div>`,
		`${rul_div}동명사</b>${and_exampl}<span class=\"sem ger cmnt-align-center example\" data-gc=\"동명사\"><span class=\"sem o cmnt-align-center example\">giving</span></span></div><div class=\"col-4 my-auto\"></div></div>`,
		`${rul_div}전치사구</b><br>(prepositional phrase)${and_exampl}<span class=\"brkt phr-start example\">(</span>	<span class=\"sem phr cmnt-align-center example\" data-gc=\"전치사구\">with thier lives</span><span class=\"brkt phr-end example\">)</span></div><div class=\"col-4 my-auto\">부사역할을 하는 전명구로서 (소괄호)로 표시 <span class=\"color-chip phr\">◼︎︎</span> 색상 사용</div></div>`,
		`${rul_div}형용사구</b><br>(adjective phrase)${and_exampl}<span class=\"brkt adjphr-start example\">(</span><span class=\"sem adjphr cmnt-align-center example\" data-gc=\"전치사구(adj)\">in his pockets</span><span class=\"brkt adjphr-end example\">)</span></div><div class=\"col-4 my-auto\">형용사 역할을 하는 전명구로서 (소괄호)로 표시 <span class=\"color-chip adjphr\">◼︎︎</span> 색상 사용</div></div>`,
		`${rul_div}등위(절)</b></div><div class=\"col-5 example-image mb-0\"><span class=\"brkt ccls-start\">{</span><span> A </span><span class=\"brkt ccls-end\">}</span><span> and </span><span class=\"brkt ccls-start\">{</span><span class=\"sem ccls cmnt-align-center\" data-gc=\"등위절\"><span> B </span></span><span class=\"brkt ccls-end\">}</span></div><div class=\"col-4 my-auto\">등위 관계를 나타내는 구나 절을 {중괄호}로 표시</div></div>`,
		`${rul_div}명사절</b>${and_exampl}<span class=\"brkt ncls cls-start example\" data-lv=\"1\">[</span><span class=\"sem ncls cmnt-align-center example\" data-lv=\"1\"><span class=\"sem s outer cmnt-align-center example\" data-rc=\"S\" data-rc-min=\"s\" data-lv=\"1\"><span class=\"sem o inner cmnt-align-center example\">What</span> <span class=\"sem s inner cmnt-align-center example\">you</span> <span class=\"sem v inner cmnt-align-center example\">do</span></span></span><span class=\"brkt ncls cls-end example\" data-lv=\"1\">]</span></div><div class=\"col-4 my-auto\">명사절 범위를 [대괄호]로 지정하고 <span class=\"color-chip ncls\">◼︎︎</span> 색상으로 마크업 </div></div>`,
		`${rul_div}형용사절</b></div><div class=\"col-5 example-image\" id=\"helpAdj\"><span class=\"sem s inner cmnt-align-center example\" >a <span class=\"sem rcm mfd-00-00 cmnt-align-center example\" data-gc=\"선행사\">boy</span></span><span class=\"brkt acls cls-start example\" data-lv=\"1\">[</span><span class=\"sem acls cmnt-align-center example\" data-mfd=\"00-00\" data-rc=\"M\" data-rc-min=\"M\" data-gc=\"관계사\" data-lv=\"1\"><span class=\"sem m outer cmnt-align-center example\" data-rc=\"M\" data-rc-min=\"M\" data-lv=\"1\"><span class=\"sem s inner cmnt-align-center example\" >who</span> <span class=\"sem v inner cmnt-align-center example\" >eats</span> </span></span><span class=\"brkt acls cls-end example\" data-lv=\"1\">]</span><span class=\"sem line-end\" style=\"line-height: 29.6982px;\">&#8203;</span></div><div class=\"col-4 my-auto\">관계사절의 범위를 [대괄호]로 지정하고 <span class=\"color-chip acls\">◼︎︎</span> 색상으로 마크업. 관련 선행사 표시</div></div>`,
		`${rul_div}부사절</b>${and_exampl}<span class=\"brkt advcls cls-start example\" data-lv=\"1\">[</span><span class=\"sem advcls cmnt-align-center example\" data-rc=\"M\" data-rc-min=\"M\" data-gc=\"시간 부사절\" data-lv=\"1\"><span class=\"sem m outer cmnt-align-center example\" data-rc=\"M\" data-rc-min=\"M\" data-lv=\"1\">When <span class=\"sem s inner cmnt-align-center example\" >I</span> <span class=\"sem v inner cmnt-align-center example\">arrive</span> </span></span><span class=\"brkt advcls cls-end example\" data-lv=\"1\">]</span></div><div class=\"col-4 my-auto\"></div></div>`
	];
	// 텐덤 도움말
	const helpModal = createDefinedDiv({className: 'guide-modal-section modal fade', id: 'guide-modal', tabIndex: -1});
	const helpDialog = createDefinedDiv({className: 'modal-dialog'});
	const helpContent =  createDefinedDiv({className: 'modal-content border-0'});
	const helpHeader = createDefinedDiv({className: 'modal-header bg-fc-purple'});
	helpHeader.insertAdjacentHTML('beforeend','<h5 class="modal-title text-white">구문 분석 키워드</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button>');
	const helpBody = createDefinedDiv({className: 'modal-body py-0'});
	tandemRules.forEach( r => helpBody.insertAdjacentHTML('beforeend', r));
	const helpFooter = createDefinedDiv({className: 'modal-footer'});
	helpFooter.insertAdjacentHTML('beforeend', '<button type="button" class="btn btn-danger" data-bs-dismiss="modal">Close</button>');
	helpContent.append(helpHeader, helpBody, helpFooter);
	helpDialog.appendChild(helpContent);
	helpModal.appendChild(helpDialog);
	
	$(helpModal).one('shown.bs.modal', function() {
		tandem.drawConnections(helpBody.querySelector('#helpAdj'));
	})
	// 입력 팁
	const tipModal = createDefinedDiv({className: 'tip-modal-section modal fade', tabIndex: -1,  id: 'tip-modal'});
	const tipDialog = createDefinedDiv({className: 'modal-dialog modal-dialog-centered'});
	const tipContent =  createDefinedDiv({className: 'modal-content border-0'});
	const tipHeader = createDefinedDiv({className: 'modal-header bg-fc-purple'});
	tipHeader.insertAdjacentHTML('beforeend','<h5 class="modal-title text-white">팁</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>');
	const tipBody = createDefinedDiv({className: 'modal-body lh-lg'});
	tipContent.append(tipHeader, tipBody);
	tipDialog.appendChild(tipContent);
	tipModal.appendChild(tipDialog);
	
	$(tipModal).on('show.bs.modal', function() {
		tipBody.innerHTML = inputRules[Math.floor(Math.random() * inputRules.length)];
	})
	
	$(document).ready(() => document.body.append(helpModal, tipModal));
	
	function showRandomTip(index) {
		return inputRules[index || (Math.floor(Math.random() * inputRules.length))];
	}
	
	function createDefinedDiv(attrs) {
		let div = document.createElement('div');
		Object.keys(attrs).forEach(key => div[key] = attrs[key]);
		return div;
	}
	
	tandem['tip'] = { showRandomTip };
})(jQuery, document, tandem)
