/**
 * 화면을 구성하는 이펙트 처리
 @author LGM
 */
(function($,document,ScrollReveal) {
	$(document).ready(function(){
		// [activates Bootstrap tooltips] --------------------------------------
		$('body').tooltip({
			selector:'[data-toggle="tooltip"],[data-bs-toggle="tooltip"]', 
			trigger:'hover'});
		$(document).on('click', '[data-toggle="tooltip"], [data-bs-toggle="tooltip"]', function(){
			$(this).tooltip('hide');
		}); 
		/* [activates Scroll Reveals] --------------------------------------- */
		ScrollReveal({duration: 1000, reset: false, viewOffset:{top:0,bottom:0}});
		ScrollReveal().reveal('.sr-showup',{delay: 100, distance: '20px', viewOffset:{top:50,bottom:50}});
		ScrollReveal().reveal('.sr-slideup',{delay: 400, interval: 100, opacity: 1, distance: '100%'});
		/* ------------------------------------------------------------------ */	
	})
	// [Bootstrap Validation]---------------------------------------------------
	.on('submit', '.needs-validation', function(event) {
		if(!this.checkValidity()) {
			event.preventDefault();
			event.stopPropagation();
		}
		this.classList.add('was-validated');
	})
	
	/* [bouncing on click button] ------------------------------------------- */
	.on('click','button,.btn', function() {
		let orgTransform = getComputedStyle(this).transform;
		orgTransform = (orgTransform != null && orgTransform.includes('matrix'))? (orgTransform + ' ') : '';
		const scaleArr = [orgTransform + 'scale3d(1, 1, 1)', orgTransform + 'scale3d(1.25, 0.75, 1)',
						orgTransform + 'scale3d(0.75, 1.25, 1)', orgTransform + 'scale3d(1.15, 0.85, 1)',
						orgTransform + 'scale3d(0.95, 1.05, 1)', orgTransform + 'scale3d(1.05, 0.95, 1)'];
						
		this.animate({"transform" : scaleArr, "-webkit-transform" : scaleArr}, 600);
	})
	/* ---------------------------------------------------------------------- */
})(jQuery, document, ScrollReveal);
