(function($){
    $.fn.curvedArrow = function(options){
        const settings = $.extend({
            p0x: 50,
            p0y: 50,
            p1x: 70,
            p1y: 10,
            p2x: 100,
            p2y: 100,
            size: 30,
            lineWidth: 10,
            strokeStyle: 'rgb(245,238,49)',
			header: true,
			curve: true,
			className: 'curved_arrow'
        }, options);
        
        const canvas = document.createElement('canvas');
        $(canvas).appendTo(this);
        const x_min_max = settings.curve 
				? quadraticCurveMinMax(settings.p0x, settings.p1x, settings.p2x)
				: [Math.min(settings.p0x, settings.p1x, settings.p2x),
					Math.max(settings.p0x, settings.p1x, settings.p2x)];
        const y_min_max = settings.curve
				? quadraticCurveMinMax(settings.p0y, settings.p1y, settings.p2y)
				: [Math.min(settings.p0y, settings.p1y, settings.p2y),
					Math.max(settings.p0y, settings.p1y, settings.p2y)];
        const padding = settings.size - settings.lineWidth;

        const x_min = x_min_max[0] - padding,
        	x_max = x_min_max[1] + padding,
        	y_min = y_min_max[0] - padding,
        	y_max = y_min_max[1] + padding;

        const p0x = settings.p0x - x_min,
        	p0y = settings.p0y - y_min,
        	p1x = settings.p1x - x_min,
        	p1y = settings.p1y - y_min,
        	p2x = settings.p2x - x_min,
        	p2y = settings.p2y - y_min;

        canvas.style.position = 'absolute';
        canvas.style.top = y_min + 'px';
        canvas.style.left = x_min + 'px';


        const ctx = canvas.getContext('2d');
		// Resolution Correction(화면의 픽셀 배율이 1보다 클때 canvas가 흐려지는 현상 보정)
        const devicePixelRatio = window.devicePixelRatio || 1,
			backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
							ctx.mozBackingStorePixelRatio ||
							ctx.msBackingStorePixelRatio ||
							ctx.oBackingStorePixelRatio ||
							ctx.backingStorePixelRatio || 1;
		const ratio = devicePixelRatio / backingStoreRatio;
		
		canvas.style.width = x_max - x_min + 'px';
		canvas.style.height = y_max - y_min + 'px';
        canvas.width = (x_max - x_min) * ratio;
        canvas.height = (y_max - y_min) * ratio;
		ctx.scale(ratio,ratio);
        // Styling
        ctx.strokeStyle = settings.strokeStyle;
        ctx.lineWidth = settings.lineWidth;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Arrow body
        ctx.beginPath();
        ctx.moveTo(p0x, p0y);

		// 화살표의 꺾이는 곡률 수정---------------------------
		// 높이가 1이면        높이가 2면
		//       ──			   ────
		//     /             /
		//     │            /
		//                  │
		//                  │
		if(Math.abs(p1x - p0x) > Math.abs(p1y-p2y)){
			ctx.lineTo((p1x>p0x)?(p1x-Math.abs(p1y-p2y)):(p1x+Math.abs(p1y-p2y)),p1y);
		}// --------------------------------------------
		if(settings.curve) {
			ctx.quadraticCurveTo(p1x, p1y, p2x, p2y);
		}else{
			ctx.lineTo(p1x, p1y);
			ctx.lineTo(p2x, p2y);
		}
        ctx.stroke();
        
		if(settings.header){
	        // Arrow head
	        const angle = Math.atan2(p2y - p1y, p2x - p1x);
	        ctx.translate(p2x, p2y);
	        
	        // Right side
	        ctx.rotate(angle + 1);
	        ctx.beginPath();
	        ctx.moveTo(0, settings.size);
	        ctx.lineTo(0, 0);
	        ctx.stroke();
	        
	        // Left side
	        ctx.rotate(-2);
	        ctx.lineTo(0, -settings.size);
	        ctx.stroke();
	        // Restore context
	        ctx.rotate(1 - angle);
	        ctx.translate(-p2x, -p2y);
		}


        return $(canvas).addClass(settings.className);
    }

    function quadraticCurveMinMax(p0, p1, p2){
        let min = p0, max = p2;
        const t_step = 0.0001;
        for (let qstep=t_step; qstep <= 1; qstep += t_step){
            const peekVal = (1 - qstep) * (1 - qstep) * p0 + 2 * (1 - qstep) * qstep * p1 + (qstep * qstep * p2);
            if (peekVal < min) min = peekVal;
            if (peekVal > max) max = peekVal;
        }
        return [Math.round(min), Math.round(max)];
    }
}(jQuery));