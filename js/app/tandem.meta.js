/** GramMeta 정보 추출, metaStatus 수정
 @author LGM
 */
(function($, document, tandem) {
	/**
	 * GramMetaCode
	 * @description 한 문장에서 나올 수 있는 문법적 특성 메타문자열. 
	 * 기본적으로는 이 목록에 없는 것들은 필터아웃되며,
	 * 최종적으로 레코드로 등록시에는 '형식' 혹은 '절' 관련 메타문자는 앞에 '+' 기호를 붙이고,
	 * 주절의 형식은 '+MAIN_' 문자열을 앞에 붙인다.
	 */
	const GRAMMETA_CODE_LIST = [
		"FORM_ONE", // 41000, "1형식"
		"FORM_ONE_ADV", // 42150, "1A형식"
		"FORM_ONE_PO", // 42155, "-"
		"FORM_TWO", // 42000, "2형식"
		"FORM_TWO_NOUN_COMP", // 42100, "2형식_명사_주격보어"
		"FORM_TWO_GER_COMP", // 42200, "2형식_동명사_주격보어", true
		"FORM_TWO_ADJ_COMP", // 42300, "2형식_형용사_목적보어"
		"FORM_TWO_TO_COMP", // 42300, "2형식_to부정사_주격보어", true
		"FORM_TWO_PREP_COMP", // 4240, "2형식_전치사_주격보어", true
		"FORM_TWO_NCLS_COMP", // 42500, "2형식_명사절_주격보어", true
		"FORM_THREE", // 43000, "3형식"
//		"FORM_THREE_VI_PREP", // 43100, "3형식_전치사_목적어", true
		"FORM_THREE_NOUN_OBJ", // 43200, "3형식_명사_목적어", true
		"FORM_THREE_GER_OBJ", // 43300, "3형식_동명사_목적어", true
		"FORM_THREE_TO_OBJ", // 43500, "3형식_to부정사_목적어", true
		"FORM_THREE_INTERR_OBJ", // 43700, "3형식_의문사_목적어", true
		"FORM_THREE_NCLS_OBJ", // 43900, "3형식_명사절_목적어", true
		"FORM_FOUR", // 44000, "4형식"
		"FORM_FIVE", // 45000, "5형식"
		"FORM_FIVE_NOUN_OC", // 45100, "5형식_명사_목적보어", true
		"FORM_FIVE_GER_OC", // 45200, "5형식_동명사_목적보어", true
		"FORM_FIVE_ADJ_OC", // 45300, "5형식_형용사_목적보어", true
		"FORM_FIVE_AP_OC", // 45400, "5형식_현재분사_목적보어", true
		"FORM_FIVE_PP_OC", // 45500, "5형식_과거분사_목적보어", true
		"FORM_FIVE_TO_OC", // 45600, "5형식_to부정사_목적보어", true
		"FORM_FIVE_RV_OC", // 45700, "5형식_원형부정사_목적보어", true
		"FORM_FIVE_INTERR_OBJ", // 45800, "5형식_의문사_목적어", true
		"FORM_FIVE_PREP_OC", // 45900, "5형식_전치사구_목적보어", true
		"CLAUSE", // 31000, "절"
		"CCLS", // 31100, "등위절"
		"CCLS_FOR", // 31110, "등위절(for)"
		"CCLS_BESIDE", // 31111, "등위절(besides)"
		"CCLS_YET", // 31120, "등위절(yet)"
		"CCLS_NOR", // 31130, "등위절(nor)"
		"NCLS", // 31200, "명사절"
		"NCLS_SUBJ", // 31210, "명사절(주어)"
		"NCLS_ACTUAL_SUBJ", //31211, "명사절(진주어)"
		"NCLS_ACTUAL_OBJ", //31221, "명사절(진목적어)"		
		"NCLS_OBJ", // 31220, "명사절(목적어)"
		"NCLS_COMP", // 31230, "명사절(보어)"
		"NCLS_TO_OBJ", // 2023.05.31 추가. 
		"NCLS_GER_OBJ", // 2023.05.31 추가. 
		"NCLS_PTC_OBJ", // 2023.05.31 추가. 
		"NCLS_APPO", // 2023.05.31 추가. 
		"NCLS_INTERR_SUBJ", // 2023.06.02 추가. 
		"NCLS_INTERR_ACTUAL_SUBJ", // 2023.06.02 추가. 
		"NCLS_INTERR_ACTUAL_OBJ", // 2023.06.02 추가. 
		"NCLS_INTERR_OBJ", // 2023.06.02 추가. 
		"NCLS_INTERR_COMP", // 2023.06.02 추가. 
		"NCLS_INTERR_TO_OBJ", // 2023.06.02 추가. 
		"NCLS_INTERR_GER_OBJ", // 2023.06.02 추가. 
		"NCLS_INTERR_PTC_OBJ", // 2023.06.02 추가. 
		"NCLS_NRP", // 2023.06.02 추가. 
		"NCLS_NRP_SUBJ", // 2023.06.02 추가. 
		"NCLS_NRP_ACTUAL_SUBJ", // 2023.06.02 추가. 
		"NCLS_NRP_ACTUAL_OBJ", // 2023.06.02 추가. 
		"NCLS_NRP_OBJ", // 2023.06.02 추가. 
		"NCLS_NRP_COMP", // 2023.06.02 추가. 
		"NCLS_NRP_TO_OBJ", // 2023.06.02 추가. 
		"NCLS_NRP_GER_OBJ", // 2023.06.02 추가. 
		"NCLS_NRP_PTC_OBJ", // 2023.06.02 추가. 
		"NCLS_NCLC", // 2023.06.02 추가. 
		"NCLS_NCLC_SUBJ", // 2023.06.02 추가. 
		"NCLS_NCLC_ACTUAL_SUBJ", // 2023.06.02 추가. 
		"NCLS_NCLC_ACTUAL_OBJ", // 2023.06.02 추가. 
		"NCLS_NCLC_OBJ", // 2023.06.02 추가. 
		"NCLS_NCLC_COMP", // 2023.06.02 추가. 
		"NCLS_NCLC_TO_OBJ", // 2023.06.02 추가. 
		"NCLS_NCLC_GER_OBJ", // 2023.06.02 추가. 
		"NCLS_NCLC_PTC_OBJ", // 2023.06.02 추가. 
		"ACLS", // 31300, "형용사절"
		"ACLS_WHO", // 31310, "관계대명사(who)"
		"ACLS_WHO_SUBJ", // 31310, "관계대명사(who)"
		"ACLS_WHO_OBJ", // 31310, "관계대명사(who)"
		"ACLS_WHO_COMP", // 31310, "관계대명사(who)"
		"ACLS_WHOSE", // 3131?, "관계대명사(whose)"
		"ACLS_WHOM", // 3131?, "관계대명사(whom)" 
		"ACLS_WHOM_SUBJ", // 3131?, "관계대명사(whom)" 
		"ACLS_WHOM_OBJ", // 3131?, "관계대명사(whom)" 
		"ACLS_WHOM_COMP", // 3131?, "관계대명사(whom)" 
		"ACLS_WHOM_PO", // 2023.05.30 추가; 관계사가 전치사 목적어인 경우가 which만 있을리 없다. 
		"ACLS_WHICH", // 31320, "관계대명사(which)"
		"ACLS_WHICH_SUBJ", // 31320, "관계대명사(which)"
		"ACLS_WHICH_OBJ", // 31320, "관계대명사(which)"
		"ACLS_WHICH_COMP", // 31320, "관계대명사(which)"
		"ACLS_WHICH_PO", // 2023.05.23 추가
		"ACLS_THAT", // 31330, "관계대명사(that)"
		"ACLS_THAT_SUBJ", // 31330, "관계대명사(that)"
		"ACLS_THAT_OBJ", // 31330, "관계대명사(that)"
		"ACLS_THAT_COMP", // 31330, "관계대명사(that)"
		"ACLS_THAT_PO", // 2023.05.30 추가; 관계사가 전치사 목적어인 경우가 which만 있을리 없다. 
		"ADVCLS", // 31400, "부사절"
		"ADVCLS_IF", // 31410, "부사절(if)"
		"ADVCLS_UNLESS", // 31411, "부사절(unless)"
		"ADVCLS_WHEN", // 31420, "부사절(when)"
		"ADVCLS_WHILE", // 31421, "부사절(while)"
		"ADVCLS_UNTIL", // 31423, "부사절(until)"
		"ADVCLS_BEFORE", // 31424, "부사절(before)"
		"ADVCLS_AFTER", // 31425, "부사절(after)"
		"ADVCLS_BECAUSE", // 31430, "부사절(because)"
		"ADVCLS_SINCE", // 31431, "부사절(since)"
		"ADVCLS_THOUGH", // 31440, "부사절(though)"
		"ADVCLS_ALTHOUGH", // 31441, "부사절(although)"
		"ADVCLS_EVEN_THOUGH", // 31442, "부사절(even though)"
		"ADVCLS_SO_THAT", // 31450, "부사절(so that)"
		"ADVCLS_SUCH_THAT", // 31451, "부사절(such that)"
		"ADVCLS_AS", // 31460, "부사절(as)"
		"ADVCLS_AS_IF", // 31461, "부사절(as if)"
		"ADVCLS_WHERE", // 31470, "부사절(where)"
		"PCLS", // 31500, "병렬절"
		"TO", // 13000, "to부정사"
		"TO_SUBJ", // 13100, "to부정사(주어)"
		"TO_OBJ", // 13200, "to부정사(목적어)"
		"TO_ACTUAL_SUBJ", //13210, "to부정사(진주어)"
		"TO_ACTUAL_OBJ", // 13250, "to부정사(진목적어)"
		"TO_COMP", // 13300, "to부정사(보어)"
		"TO_ADJ", // 13500, "to부정사(형용사)"
		"TO_ADV", // 13600, "to부정사(부사)"
		"GER", // 15000, "동명사"
		"GER_SUBJ", // 15100, "동명사(주어)"
		"GER_SUBJ_PP", // 15110, "동명사(완료형 주어)"
		"GER_OBJ", // 15200, "동명사(목적어)"
		"GER_ACTUAL_OBJ", // 15220, "동명사(진목적어)"
		"GER_COMP", // 15300, "동명사(보어)"
		"PTC", // 17000, "분사"
		"AP", // 17100, "현재분사"
		"AP_OC", // 17110, "현재분사(목적격 보어)"
		"AP_COMP", // 17120, "현재분사(보어)"
		"PP", // 17500, "과거분사"
		"PP_OC", // 17510, "과거분사(목적격 보어)"
		"PP_COMP", // 17520, "과거분사(보어)"
		"SENSE_OBJ", // 2023.04.08 추
		"SENSE_SUBJ", // 18000, "의미상 주어"
		"ACTUAL_SUBJ",	// 18100, "진주어"
		"ACTUAL_OBJ",	// 18200, "진목적어"
		"MODI", // 1800, "수식"
		"MODI_POST_AP", // 1820, "현재분사(후치수식)"
		"MODI_PRE_AP", // 1825, "현재분사(전치수식)"
		"MODI_POST_PP", // 1830, "과거분사(후치수식)"
		"MODI_POST_TO", // 2023.05.31 추가.
		"MODI_POST_PREP", // 2023.05.31 추가.
		"MODI_PRE_ADJ", // 2023.05.31 추가.
		"INTERR", // 3000, "의문사"
		"INTERR_SUBJ", // 3100, "의문사(주어)"
		"INTERR_OBJ", // 3200, "의문사(목적어)"
		"INTERR_COMP", // 3300, "의문사(보어)"
		"PREP_ADJ", // 2023.05.31 추가.
		"PREP_ADVBIAL", // 5100, "전치사구(보어)"
		"PREP_OBJ_ADVBIAL", // 5200, "전치사구(목적격 보어)"
		"PHR", // 10000, "전치사구"
		"PHR_ABOARD", // 10090, "aboard"
		"PHR_ABOUT", // 10100, "about"
		"PHR_ABOVE", // 10110, "above"
		"PHR_ACCORDING", // 10121, "according"
		"PHR_ACROSS", // 10120, "across"
		"PHR_AFTER", // 10130, "after"
		"PHR_AGAINST", // 10140, "against"
		"PHR_AHEAD_OF", // 10142, "ahead of"
		"PHR_ALONG", // 10150, "along"
		"PHR_ALONG_WITH", // 10151, "along with"
		"PHR_ALONGSIDE", // 10153, "alongside"
		"PHR_AMID", // 10158, "amid"
		"PHR_AMIDST", // 10159, "amidst"
		"PHR_AMONG", // 10160, "among"
		"PHR_AMONGST", // 10161, "amongst"
		"PHR_ANTI", // 10163, "anti"
		"PHR_APART_FROM", // 10165, "apart from"
		"PHR_AROUND", // 10170, "around"
		"PHR_AS", // 10180, "as"
		"PHR_AS_FOR", // 10181, "as for"
		"PHR_AS_PER", // 10182, "as per"
		"PHR_AS_TO", // 10183, "as to"
		"PHR_AS_WELL_AS", // 10184, "as well as"
		"PHR_AS_OF", // 10185, "as of"
		"PHR_ASIDE", // 10186, "aside"
		"PHR_ASTRIDE", // 10187, "astride"
		"PHR_AT", // 10190, "at"
		"PHR_ATOP", // 10192, "atop"
		"PHR_AWAY_FROM", // 10194, "away from"
		"PHR_BAR", // 10195, "bar"
		"PHR_BARRING", // 10196, "barring"
		"PHR_BECAUSE_OF", // 10199, "because of"
		"PHR_BEFORE", // 10200, "before"
		"PHR_BEHIND", // 10220, "behind"
		"PHR_BELOW", // 10230, "below"
		"PHR_BENEATH", // 10240, "beneath"
		"PHR_BESIDE", // 10250, "beside"
		"PHR_BESIDES", // 10255, "besides"
		"PHR_BETWEEN", // 10260, "between"
		"PHR_BEYOND", // 10270, "beyond"
		"PHR_BUT", // 10280, "but"
		"PHR_BUT_FOR", // 10281, "but for"
		"PHR_BY", // 10290, "by"
		"PHR_BY_MEANS_OF", // 10292, "by means of"
		"PHR_CIRCA", // 10293, "circa"
		"PHR_CLOSE_TO", // 10294, "close to"
		"PHR_CONCERNING", // 10295, "concerning"
		"PHR_CONSIDERING", // 10296, "considering"
		"PHR_CONTRARY_TO", // 10297, "contrary to"
		"PHR_COUNTING", // 10298, "counting"
		"PHR_CUM", // 10299, "cum"
		"PHR_DESPITE", // 10300, "despite"
		"PHR_DEPENDING_ON", // 10301, "depending on"
		"PHR_DOWN", // 10330, "down"
		"PHR_DUE_TO", // 10345, "due to"
		"PHR_DURING", // 10350, "during"
		"PHR_EXCEPT", // 10400, "except"
		"PHR_EXCEPT_FOR", // 10405, "except for"
		"PHR_EXCEPTING", // 10410, "excepting"
		"PHR_EXCLUDING", // 10415, "excluding"
		"PHR_FOLLOWING", // 10490, "following"
		"PHR_FOR", // 10500, "for"
		"PHR_FORWARD_OF", // 10505, "forward of"
		"PHR_FROM", // 10510, "from"
		"PHR_FURTHER_TO", // 10550, "further to"
		"PHR_GIVEN", // 10560, "given"
		"PHR_GONE", // 10565, "gone"
		"PHR_IN", // 10600, "in"
		"PHR_IN_ADDITION_TO", // 10601, "in addition to"
		"PHR_IN_BETWEEN", // 10602, "in between"
		"PHR_IN_CASE_OF", // 10603, "in case of"
		"PHR_IN_FACE_OF", // 10604, "in face of"
		"PHR_IN_FAVOUR_OF", // 10605, "in favour of"
		"PHR_IN_FRONT_OF", // 10606, "in front of"
		"PHR_IN_LIEU_OF", // 10607, "in lieu of"
		"PHR_IN_SPITE_OF", // 10608, "in spite of"
		"PHR_IN_VIEW_OF", // 10609, "in view of"
		"PHR_INTO", // 10610, "into"
		"PHR_INCLUDING", // 10611, "including"
		"PHR_INSIDE", // 10615, "inside"
		"PHR_INSTEAD_OF", // 10620, "instead of"
		"PHR_LESS", // 10690, "less"
		"PHR_LIKE", // 10700, "like"
		"PHR_MINUS", // 10740, "minus"
		"PHR_NEAR", // 10800, "near"
		"PHR_NEAR_TO", // 10810, "near to"
		"PHR_NEXT_TO", // 10820, "next to"
		"PHR_NOTWITHSTANDING", // 10870, "notwithstanding"
		"PHR_OF", // 10900, "of"
		"PHR_OFF", // 10910, "off"
		"PHR_ON", // 10920, "on"
		"PHR_ON_ACCOUNT_OF", // 10921, "on account of"
		"PHR_ON_BEHALF_OF", // 10922, "on behalf of"
		"PHR_ON_BOARD", // 10923, "on board"
		"PHR_ON_TO", // 10924, "on to"
		"PHR_ONTO", // 10925, "onto"
		"PHR_ON_TOP_OF", // 10926, "on top of"
		"PHR_OPPOSITE", // 10930, "opposite"
		"PHR_OPPOSITE_TO", // 10931, "opposite to"
		"PHR_OTHER_THAN", // 10933, "other than"
		"PHR_OUT", // 10935, "out"
		"PHR_OUT_OF", // 10936, "out of"
		"PHR_OUTSIDE", // 10937, "outside"
		"PHR_OUTSIDE_OF", // 10938, "outside of"
		"PHR_OVER", // 10940, "over"
		"PHR_OWING_TO", // 10942, "owing to"
		"PHR_PAST", // 10945, "past"
		"PHR_PENDING", // 10946, "pending"
		"PHR_PER", // 10947, "per"
		"PHR_PLUS", // 10948, "plus"
		"PHR_PREPARATORY_TO", // 10949, "preparatory to"
		"PHR_PRIOR_TO", // 10950, "prior to"
		"PHR_PRO", // 10951, "pro"
		"PHR_RE", // 10970, "re"
		"PHR_REGARDING", // 10972, "regarding"
		"PHR_REGARDLESS_OF", // 10974, "regardless of"
		"PHR_RESPECTING", // 10976, "respecting"
		"PHR_ROUND", // 10978, "round"
		"PHR_SAVE", // 10980, "save"
		"PHR_SAVE_FOR", // 10982, "save for"
		"PHR_SAVING", // 10984, "saving"
		"PHR_SINCE", // 11000, "since"
		"PHR_THROUGH", // 11100, "through"
		"PHR_THRU", // 11102, "thru"
		"PHR_THROUGHOUT", // 11104, "throughout"
		"PHR_TILL", // 11106, "till"
		"PHR_TO", // 11110, "to"
		"PHR_TOGETHER_WITH", // 11112, "together with"
		"PHR_TOUCHING", // 11114, "touching"
		"PHR_TOWARD", // 11120, "toward"
		"PHR_TOWARDS", // 11121, "towards"
		"PHR_THAN", // 11130, "than"
		"PHR_THANKS_TO", // 11132, "thanks to"
		"PHR_UNDER", // 11200, "under"
		"PHR_UNDERNEATH", // 11202, "underneath"
		"PHR_UNLIKE", // 11204, "unlike"
		"PHR_UNTIL", // 11206, "until"
		"PHR_UNTO", // 2023.04.08 추가
		"PHR_UP", // 11250, "up"
		"PHR_UP_AGAINST", // 11252, "up against"
		"PHR_UP_TO", // 11254, "up to"
		"PHR_UP_UNTIL", // 11256, "up until"
		"PHR_UPON", // 11260, "upon"
		"PHR_VERSUS", // 11295, "versus"
		"PHR_VIA", // 11300, "via"
		"PHR_WITH", // 11400, "with"
		"PHR_WITH_REFERENCE_TO", // 11402, "with reference to"
		"PHR_WITH_REGARD_TO", // 11404, "with regard to"
		"PHR_WITHOUT", // 11410, "without"
		"PHR_WITHIN", // 11420, "within"
		"VERB_PHR", // 19000, "동사구"
		"CLEFT_IT"	//2023.09.25 추가(광)
	]
	const TANDEM_TAGS = ['s', 'ss', 'v', 'o', 'po', 'c', 'a', 'oc', 'm', 'rcm', 'tor', 'to', 'ger', 'go', 'ptc', 'ptco', 'appo', 'conj',
		'phr', 'adjphr', 'advphr', 'ptcphr', 'cls', 'ncls', 'acls', 'advcls', 'ccls', 'pcls', 'cleft'];
	const FORM_COMPONENT_ROLES = ['s', 'v', 'o', 'po', 'c', 'a', 'oc', 'm', 'to', 'go', 'ptco', 'appo']; // 문장형식 성분들
	const RELATIVE_PRONOUNS = ['who', 'whose', 'whom', 'which', 'that']; // 관계대명사
	// 부사절 접속사
	const ADV_CONJUNCTIONS = ['if', 'unless', 'when', 'while', 'until', 'before', 'after', 'because', 'since', 'though', 'although', 'even though', 'so that', 'such that', 'as if', 'as', 'where'];
	const CO_CONJUNCTIONS = ['for', 'beside', 'yet', 'nor'];	// 특수 등위접속사들
	// 전치사
	const PREPOSITIONS = ['aboard', 'about', 'above', 'according', 'across', 'after', 'against', 'ahead of', 'along with', 'alongside', 'along', 'amidst', 'amid', 'amongst', 'among', 'anti', 'apart from', 'around', 'as for', 'as per', 'as to', 'as well as', 'as of', 'aside', 'astride', 'as', 'atop', 'at', 'away from', 'barring', 'bar', 'because of', 'before', 'behind', 'below', 'beneath', 'besides', 'beside', 'between', 'beyond', 'but for', 'but', 'by means of', 'by', 'circa', 'close to', 'concerning', 'considering', 'contrary to', 'counting', 'cum', 'despite', 'depending on', 'down', 'due to', 'during', 'except for', 'excepting', 'except', 'excluding', 'following', 'forward of', 'for', 'from', 'further to', 'given', 'gone', 'in addition to', 'in between', 'in case of', 'in face of', 'in favour of', 'in front of', 'in lieu of', 'in spite of', 'in view of', 'into', 'including', 'inside', 'instead of', 'in', 'less', 'like', 'minus', 'near to', 'near', 'next to', 'notwithstanding', 'off', 'of', 'on account of', 'on behalf of', 'on board', 'on to', 'onto', 'on top of', 'on', 'opposite to', 'opposite', 'other than', 'out of', 'out', 'outside of', 'outside', 'over', 'owing to', 'past', 'pending', 'per', 'plus', 'preparatory to', 'prior to', 'pro', 're', 'regarding', 'regardless of', 'respecting', 'round', 'save', 'save for', 'saving', 'since', 'through', 'thru', 'throughout', 'till', 'together with', 'touching', 'toward', 'towards', 'to', 'than', 'thanks to', 'underneath', 'under', 'unlike', 'until', 'up against', 'up to', 'up until', 'upon', 'up', 'versus', 'via', 'with reference to', 'with regard to', 'without', 'within', 'with'];

	const INDIRECT_OBJ = 'i.o.';
	const DIRECT_OBJ = 'd.o.';
	const ACTUAL_SUBJ = '(진)s';
	const ACTUAL_OBJ = '(진)o';
	const PREP_OBJ = '(전)o';	// 2023.05.31 길다싶은 rcomment는 모두 이와 같은 형태로 통일.
	const SENSE_SUBJ = '(의)s';
	const extraRolecomments = [ INDIRECT_OBJ, DIRECT_OBJ, ACTUAL_OBJ, ACTUAL_SUBJ, PREP_OBJ, SENSE_SUBJ ];

	function gramMetaStrFromDOM(div) {		
		let gramMeta = gramMetaArr2Str(gramMetaFromSemantics(semanticsFromDOMs(div)));
		// MYSQL 검색을 위해 특정 키워드들은 + 기호를 접두사로 붙인다.
		return gramMeta.replace(/(\bFORM_\w*|\bNCLS\w*|\bADVCLS\w*|\bPCLS\w*|\bCCLS\w*|\bACLS\w*)/g,'+$1');
	}
	/** DOM을 분석하여 문법 특징 파악
	@param {Element} div .semantics-result 태그
	@returns {Array<{
		text: 문자열, 
		role: 성분, 
		pos: 성분의품사, 
		children: 자식성분,
		rc: 기타성분_성분코멘트,
		cc: 등위절_접속사
		prep: 전치사구_전치사,
		rp: 형용사절_관계사,
		adv: 부사절_접속사,
		modi: 수식_전치/후치_분사/부정사/형용사구
		
	}>} semantics
	 */
	function semanticsFromDOMs(div) {

		const cloneDiv = tandem.cleanSvocDOMs(div);
		const children = cloneDiv.children;
		let semantics = [];
		for (let i = 0, len = children.length; i < len; i++) {
			const child = children[i], grandChild = child.firstElementChild;
			let oneRole;

			// 한 문자열이 2개의 문법태그를 가질 경우
			if (child.childElementCount > 0 && grandChild.textContent == child.textContent) {
				let roleChild, posChild, pos;
				// 필수성분 태그를 바깥으로, 품사 태그를 안쪽으로 재정렬
				if (findClassIn(grandChild, FORM_COMPONENT_ROLES)) {
					roleChild = grandChild; posChild = child;
				} else {
					roleChild = child; posChild = grandChild;
				}
				oneRole = findClassIn(roleChild, TANDEM_TAGS); 
				pos = findClassIn(posChild, TANDEM_TAGS); 
				
				// 성분품사 파악 후 바깥 태그 제거
				// 문법요소 목록에 추가하되, pos으로써 품사를 추가
				if (oneRole) {
					const sem = { role: oneRole, pos, text: grandChild.textContent, children: semanticsFromDOMs(grandChild) };
					// 필수성분 외의 성분rcomment가 있으면 추가
					Object.keys(roleChild.dataset).forEach( d => {
						const rcomment = roleChild.dataset[d];
						if(d == 'rc' && extraRolecomments.includes(rcomment)) {
							sem[d] = rcomment;
						}
					});
					switch(sem.pos) {
						case 'phr':
							const prep = findPrepKeyword(posChild);
							if (prep) sem.prep = prep;
							break;
						case 'acls':
							const rp = findRPKeyword(posChild);
							if (rp) sem.rp = rp;
							break;
						case 'advcls':
							const adv = findAdvKeyword(posChild);
							if (adv) sem.adv = adv;
							break;
						case 'ptc':
							const ptctense = tenseAppendedPtc(posChild);
							if (ptctense) sem.pos = ptctense;
							break;
					}
					semantics.push(sem);
				}
			}
			// 한 문자열이 하나의 태그로만 이루어진 경우
			else {
				oneRole = findClassIn(child, TANDEM_TAGS);
				if (oneRole) {
					const sem = { role: oneRole, text: child.textContent, children: semanticsFromDOMs(child) };
					// 필수성분 외의 성분rcomment가 있으면 추가
					Object.keys(child.dataset).forEach( d => {
						const rcomment = child.dataset[d];
						if(d == 'rc' && extraRolecomments.includes(rcomment)) {
							sem[d] = rcomment;
						}
					});					
					switch(sem.role) {
						case 'phr': case 'adjphr':
							const prep = findPrepKeyword(child);
							if (prep) sem.prep = prep;
							break;
						case 'ccls':
							const cc = findCCKeyword(child);
							if (cc) sem.cc = cc;
							break;
						case 'ptc':
							const ptctense = tenseAppendedPtc(child);
							if (ptctense) sem.role = ptctense;
							break;
						case 'rcm':
							const modi = getModiKeyword(child);
							if (modi) sem.modi = modi;
							break;
					}
					semantics.push(sem);
				}
			}
		}
		return semantics;
	}
	function findClassIn(element, classes) {
		return classes.find(one => element.classList.contains(one));
	}
	/**
	 * Find Relative Pronouns
	 * 주어진 관계절의 관계대명사를 찾아서 반환한다.
	 */
	function findRPKeyword(element, givenKey) {
		let rpKeyword = null;
		// 탐색할 관계대명사가 주어진 경우(부모 형용사절의 자식 형용사절에 대한 탐색)
		if (givenKey != undefined) {
			// 주어진 관계대명사를 갖고 있다면 true, 아니라면 false를 반환
			return element.textContent.match(new RegExp(`\\b${givenKey}\\b`, 'gi')) != null;
		}
		for (let i = 0, len = RELATIVE_PRONOUNS.length; i < len; i++) {
			const keyword = RELATIVE_PRONOUNS[i];
			// 특정 관계대명사가 자식 형용사절이 아닌 자신만의 것이라면 관계대명사를 반환
			// 'OO로 시작'이 아닌 'OO를 포함'이라는 식을 쓰는 이유는, 'most of whom'과 같은 형태가 있을 수 있기 때문 
			if (element.textContent.match(new RegExp(`\\b${keyword}\\b`, 'gi'))?.length 
			> Array.from(element.querySelectorAll('.acls')).filter(child => findRPKeyword(child, keyword)).length) {
				rpKeyword = keyword;
				break;
			}
		}
		return rpKeyword;
	}
	/**
	 * Find Adverbial Conjunctions
	 * 주어진 부사절의 접속사를 찾아서 반환한다.
	 */
	function findAdvKeyword(element) {
		let advKeyword = null;
		for (let i = 0, len = ADV_CONJUNCTIONS.length; i < len; i++) {
			const keyword = ADV_CONJUNCTIONS[i];
			if (element.textContent.length > 0
				&& element.textContent.toLowerCase().startsWith(keyword)) {
				advKeyword = keyword;
				break;
			}
		}
		return advKeyword;
	}
	/**
	 * 주어진 요소의 등위접속사를 찾아서 반환
	 */
	function findCCKeyword(element) {
		let ccKeyword = null;
		for (let i = 0, len = CO_CONJUNCTIONS.length; i < len; i++) {
			const keyword = CO_CONJUNCTIONS[i];
			// 특정 등위접속사가 자신의 앞에 있다면 반환.
			// 일반적으로 등위접속사에 태그가 적용돼있지 않기 때문에, 자신의 바로 앞은 빈 칸, 그 앞이 등위접속사이다.
			// .wholeText를 통해 인접 텍스트노드를 모두 읽기 때문에 ' and ' 같은 형태로 읽혀진다.
			if (element.previousSibling != null &&
				(new RegExp(`${keyword} $`, 'i')).test(element.previousSibling.wholeText)) {
				ccKeyword = keyword;
				break;
			}
		}
		return ccKeyword;
	}
	/**
	 * 주어진 전치사구가 어떤 전치사를 시작으로 하고 있는지를 반환.
	 */
	function findPrepKeyword(element) {
		let prepKeyword = null;
		for (let i = 0, len = PREPOSITIONS.length; i < len; i++) {
			const keyword = PREPOSITIONS[i];
			if (element.textContent.length > 0
				&& element.textContent.toLowerCase().startsWith(`${keyword} `)) {
				prepKeyword = keyword;
				break;
			}
		}
		return prepKeyword;
	}
	/** 대상 태그가 현재분사면 'ap', 과거분사면 'pp' 반환
	@param {Element} element 대상 태그
	 */
	function tenseAppendedPtc(element) {
		return /^\w+ing\b/.test(element.textContent) ? 'ap' : 'pp';
	}
	/** 대상 태그의 수식어를 찾아서 적절한 GramMeta값 반환
	@param {Element} element 대상 태그
	 */
	function getModiKeyword(element) {
		const modifier = document.querySelector(`[data-mfd="${element.className.match(/mfd-(\d+-\d+)/)[1]}"]`);
		const modifierWrapper = modifier?.closest('.ptc,.adjphr,.tor');
		const modifierType = modifierWrapper?.className?.match(/ptc|adjphr|tor/)?.[0];
		let modiPOS;
		switch(modifierType) {
			case 'adjphr':
				const prep = findPrepKeyword(modifierWrapper);
				if(prep) modiPOS = 'prep'; // MODI_POST_PREP
				else modiPOS = 'adj'
				break;
			case 'tor':
				modiPOS = 'to';	// MODI_POST_TO
				break;
			case 'ptc':
				modiPOS = tenseAppendedPtc(modifierWrapper); // MODI_POST_PP, MODI_POST_AP, MODI_PRE_AP
				break;
			default:
				break;
		}
		if(modiPOS) return `${(element.compareDocumentPosition(modifier) & Node.DOCUMENT_POSITION_PRECEDING)?'pre':'post'}_${modiPOS}`;
		else return null;
	}
	// GramMeta에 없는 값은 소문자로 구별
	const roleTable = {
		s: 'SUBJ', v: 'VERB', o: 'OBJ', po: 'PO', c: 'COMP', oc: 'OC', a: 'ADV', m: 'MODI',
		rcm: 'MODI', tor: 'TO', to: 'TO_OBJ', ger: 'GER', go: 'GER_OBJ', ptc: 'PTC', ptco: 'PTC_OBJ', appo: 'APPO', ap: 'AP', pp: 'PP', conj: 'conj', phr: 'PREP',
		adjphr: 'adjphr', advphr: 'advphr', ptcphr: 'ptcphr', cls: 'CLAUSE',
		ncls: 'NCLS', acls: 'ACLS', advcls: 'ADVCLS', ccls: 'CCLS', pcls: 'PCLS'
	};
	/** 주어진 배열에서 (keyName, keyValue)이 일치하는 쌍이 있는지 여부
	@param {Array} arr 전체 배열
	@param {String} keyName 키
	@param {String} keyValue 값
	 */
	function hasKey(arr, keyName, keyValue) {
		return arr.some(el => el[keyName] == keyValue);
	}
	/** GramMeta 양식에 맞춰 공백은 '_' 기호로, 소문자는 대문자로 변환
	@param {String} name 대상 GramMeta문자열
	 */
	function createMeta(name) {
		return name.toUpperCase().replaceAll(' ', '_');
	}
	/**
	semantics 배열로부터 GramMeta 정보 생성
	 */
	function gramMetaFromSemantics(semantics, gramDepth) {
		let formType, metaSet = [], depth = gramDepth || 1;
		// 동사를 갖고 있어야 형식이 지정됨(to부정사/동명사/분사는 동사로 표시하지 않으므로 형식을 갖지 않는다.)
		if(!metaSet.some(m => m.startsWith('FORM'))) {
			// oc가 있으면 5형식
			if (hasKey(semantics, 'role', 'oc')) {
				formType = 'FORM_FIVE';
			}
			// o가 2개 이상이면 4형식
			else if (hasKey(semantics, 'rc', 'i.o.')) {
				formType = 'FORM_FOUR';
			}
			// o가 1개 있으면 3형식
			else if (hasKey(semantics, 'role', 'o')) {
				formType = 'FORM_THREE';
			}
			// c가 있으면 2형식
			else if (hasKey(semantics, 'role', 'c')) {
				formType = 'FORM_TWO';
			}
			// 이외에 v가 있으면 1형식(a가 있으면 1a형식)
			else if (hasKey(semantics, 'role', 'v')) {
				formType = `FORM_ONE${hasKey(semantics, 'role', 'a') ? '_ADV' : ''}`;
			}
			// 인식된 문장 형식을 set에 추가
			// 중첩태그를 우선하기 위해 단순 문장 형식에는 depth를 1 늘인다.
			if (formType != undefined && !hasKey(metaSet, 'name', formType)) {
				// 전치사목적어는 특수구조이므로 먼저 추가
				if(hasKey(semantics, 'role', 'po') && !hasKey(metaSet, 'name', 'FORM_ONE_PO')) {
					metaSet.push({ depth: depth + 1, name: 'FORM_ONE_PO'});
				}
				
				metaSet.push({ depth: depth + 1, name: formType });
			}
		}
		
		// 2개의 태그가 중첩된 형태일 경우(pos 존재) GramMeta 이름에 이어붙인다.
		// 문장형식 이름에도 이어붙인다.
		const hasTypes = semantics.filter(sem => sem.pos != null);
		for (let i = 0, len = hasTypes.length; i < len; i++) {
			const semantic = hasTypes[i],
				role = roleTable[semantic.role];
			let pos = roleTable[semantic.pos];
			let twoMixed = `${pos}_${role}`;
			/*if(semantic.rc == PREP_OBJ) {
				twoMixed = 'VI_PREP';
			}*/
			
			const threeMixed = formType ? `${formType}_${twoMixed}` : twoMixed; // ex: FORM_THREE_GER_OBJ

			// 3항 태그를 우선 인식
			if (!hasKey(metaSet, 'name', threeMixed))
				metaSet.push({ depth, name: threeMixed });
			// 다음으로 2항 태그 인식
			if (!hasKey(metaSet, 'name', twoMixed))
				metaSet.push({ depth, name: twoMixed });
			
			// 진주어나 진목적어가 있다변 태그 추가
			if([ACTUAL_OBJ, ACTUAL_SUBJ].includes(semantic.rc)) {
				metaSet.push({ depth, name: `${pos}_ACTUAL_${semantic.rc == ACTUAL_OBJ ? 'OBJ' : 'SUBJ'}` });
				metaSet.push({ depth: depth + 1, name: `ACTUAL_${semantic.rc == ACTUAL_OBJ ? 'OBJ':'SUBJ'}`})
			}
			// 다음으로 품사와 성분을 인식(다항 태그보다는 후순위므로 depth 1증가)
			if (!hasKey(metaSet, 'name', pos))
				metaSet.push({ depth: depth + 1, name: pos });
			if (!hasKey(metaSet, 'name', role))
				metaSet.push({ depth: depth + 1, name: role });
			// '절'이 있으면 태그 추가
			if (pos?.includes('CLS') && !hasKey(metaSet, 'name', 'CLAUSE')) {
				metaSet.push({ depth: depth + 1, name: 'CLAUSE' });
			}
			// '분사'가 있으면 태그 추가
			if (['AP', 'PP'].includes(pos) && !hasKey(metaSet, 'name', 'PTC')) {
				metaSet.push({ depth: depth + 1, name: 'PTC' });
			}
			// '의미상 주어'가 있으면 태그 추가
			if(semantic.rc == SENSE_SUBJ) 
				metaSet.push({ depth: depth + 1, name: 'SENSE_SUBJ'})
		}

		// 전체 태그별 GramMeta 추가 후, 자식 태그를 다시 순회하며 반복
		for (let i = 0, len = semantics.length; i < len; i++) {
			const child = semantics[i], role = roleTable[child.role];

			// 전치사를 가졌다면 PHR_OO_OO 형태의 GramMeta를 추가
			if (child.prep) {
				if(child.role == 'adjphr') {
					const prepAdjMeta = createMeta('prep adj')
					if (!hasKey(metaSet, 'name', prepAdjMeta))
						metaSet.push({ depth: depth + 1, name: prepAdjMeta });
				}
				
				const prepMeta = createMeta(`phr ${child.prep}`);
				if (!hasKey(metaSet, 'name', prepMeta))
					metaSet.push({ depth: depth + 1, name: prepMeta });
			}
			// 등위접속사를 가졌다면 CCLS_OO 형태의 GramMeta를 추가
			else if (child.cc) {
				const ccMeta = createMeta(`ccls ${child.cc}`);
				if (!hasKey(metaSet, 'name', ccMeta))
					metaSet.push({ depth: depth + 1, name: ccMeta });
			}
			// 관계접속사를 가졌다면 ACLS_OO 형태의 GramMeta를 추가
			else if (child.rp) {
				const rpRole = child.children?.find(ss => ss.text == child.rp)?.role;
				if(!!rpRole) {
					const rpRoleMeta = createMeta(`acls ${child.rp} ${roleTable[rpRole]}`)
					if (!hasKey(metaSet, 'name', rpRoleMeta))
						metaSet.push({ depth: depth + 1, name: rpRoleMeta });
				}else {
					const rpMeta = createMeta(`acls ${child.rp}`);
					if (!hasKey(metaSet, 'name', rpMeta))
						metaSet.push({ depth: depth + 1, name: rpMeta });
				}
			}
			// 부사절접속사를 가졌다면 ADVCLS_OO 형태의 GramMeta를 추가
			else if (child.adv) {
				const advMeta = createMeta(`advcls ${child.adv}`);
				if (!hasKey(metaSet, 'name', advMeta))
					metaSet.push({ depth: depth + 1, name: advMeta });
			}
			// 수식선을 가진 요소를 가졌다면 MODI_OO 형태의 GramMeta를 추가
			if (child.modi) {
				const modiMeta = createMeta(`modi ${child.modi}`);
				if (!hasKey(metaSet, 'name', modiMeta))
					metaSet.push({ depth: depth + 1, name: modiMeta });
			}
			if (!hasKey(metaSet, 'name', role))
				metaSet.push({ depth: depth + 1, name: role });

			// 분사를(AP,PP) 가졌다면 PTC를 GramMeta에 또 추가
			if (['AP', 'PP'].includes(role) && !hasKey(metaSet, 'name', 'PTC')) {
				metaSet.push({ depth: depth + 1, name: 'PTC' });
			}
			// 분사구문(PTCPHR)이 있으면 PTCPHR을 GramMeta에 추가
			if(child.ptcphr) {
				metaSet.push({ depth: depth + 1, name: 'PTCPHR'});
			}
			// 진주어나 진목적어가 있으면 태그 추가
			if([ACTUAL_OBJ,ACTUAL_SUBJ].includes(child.rc))
				metaSet.push({ depth: depth + 1, name: `ACTUAL_${child.rc == ACTUAL_OBJ ? 'OBJ':'SUBJ'}`})
			// '의미상 주어'가 있으면 태그 추가
			if(child.rc == SENSE_SUBJ) 
				metaSet.push({ depth: depth + 1, name: 'SENSE_SUBJ'});
			
			// 'It that' 강조구문이 있으면 태그 추가	
			if(child.role == 'cleft' && child.text.match(/^[iI]t/))
				metaSet.push({ depth: depth + 1, name: 'CLEFT_IT'})

			// 자식 태그들에 대해 다시 수행
			if (child.children.length > 0) {
				const childMetas = gramMetaFromSemantics(child.children, depth + 2);
				for (let j = 0, len2 = childMetas.length; j < len2; j++) {
					const childMeta = childMetas[j];
					if (!hasKey(metaSet, 'name', childMeta.name))
						metaSet.push({ depth: childMeta.depth, name: childMeta.name });
				}
			}
		}
		return metaSet;
	}

	function gramMetaArr2Str(gramMetaArr) {
		const filtered = gramMetaArr
			.filter(meta => GRAMMETA_CODE_LIST.includes(meta.name))
			.filter((meta,_i,arr) => !arr.some(gm => gm?.name?.startsWith(`${meta.name}_`)))
			.map(meta => meta.name);
		const filtered2 = [];
		filtered.forEach(meta => {
			if(!filtered2.includes(meta)) {
				if(meta.startsWith('FORM') && !filtered2.some(m => m.startsWith('+MAIN_'))) {
					filtered2.push(`+MAIN_${meta}`);
				}else filtered2.push(meta);
			}
		})
		return filtered2.sort((s1, s2) => {
				// 1순위: 길이순 정렬. 2순위: 알파벳순 정렬
				let result = s2.length - s1.length;
				if (result === 0) {
					return s1.localeCompare(s2);
				}
				return result;
			}).join(' ');
	}
	
	/** div를 해석한 gramMeta 정보를 저장한다.
	@param sentenceId 문장 sid(Number)
	@param div .semantics-result div(Element)
	@param svocUpdate svoc가 업데이트되는 상황인지(Boolean)
	@param domain gramMeta 추출이 이루어지는 도메인(워크북, 피코쌤, ...)
	 */
	function saveGramMetaFromDOM(sentenceId, div, svocUpdate, domain) {
		const gramMeta = gramMetaStrFromDOM(div);
		return new Promise((resolve,reject) => {
			$.ajax({
				url: `/${domain}/sentence/grammeta/edit`,
				type: 'POST',
				data: JSON.stringify({sentenceId, gramMeta, metaStatus: svocUpdate ? 'S' : 'U'}),
				contentType: 'application/json',
				success: () => resolve(gramMeta),
				error: reject
			});
		})
	}
	
	/** 문장의 metaStatus를 S 또는 F로 저장한다.
	@param sentenceId 문장 sid(Number)
	@param metaStatus S(Success) / F(Fail)
	@param domain metaStatus 평가가 이루어지는 도메인(워크북, 피코쌤, ...)
	 */
	function submitMetaStatus(sentenceId, metaStatus, domain, callback) {
		$.ajax({
			url: `/${domain}/sentence/metastatus/edit`,
			type: 'POST',
			data: JSON.stringify({sentenceId, metaStatus}),
			contentType: 'application/json',
			success: callback,
			error: () => alert('분석 평가 중 에러가 발생했습니다.')
		})
	}

	tandem['meta'] = { gramMetaStrFromDOM, saveGramMetaFromDOM, submitMetaStatus };
})(jQuery, document, tandem);
