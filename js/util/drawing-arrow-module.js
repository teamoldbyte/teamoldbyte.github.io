/**
 * 화살표 그리기 모듈 (drawing-arrow-module.js)
 * IIFE(즉시 실행 함수) 패턴을 적용하여 내부 구현 은닉
 */
(function(window) {
    'use strict';

    // 🔒 [Private] 외부에서 접근 불가능한 캡슐화된 상수
    const DEVICE_PIXEL_RATIO = window.devicePixelRatio || 1;

    // 🔒 [Private] 외부에서 접근 불가능한 캡슐화된 헬퍼 함수
    function quadraticCurveMinMax(p0, p1, p2) {
        let min = Math.min(p0, p2);
        let max = Math.max(p0, p2);
        const denom = (p0 - 2 * p1 + p2);
        
        if (denom !== 0) {
            const t = (p0 - p1) / denom;
            if (t > 0 && t < 1) {
                const val = (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
                if (val < min) min = val;
                if (val > max) max = val;
            }
        }
        return [Math.round(min), Math.round(max)];
    }

    // 🔓 [Public] 외부에서 사용할 수 있도록 구성된 메인 함수
    function drawCurvedArrow(parent, options) {
        const settings = Object.assign({
            p0x: 50, p0y: 50,
            p1x: 70, p1y: 10,
            p2x: 100, p2y: 100,
            size: 30, lineWidth: 10,
            strokeStyle: 'rgb(245,238,49)',
            header: true, curve: true,
            className: 'curved_arrow'
        }, options);
        
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

        const canvas = document.createElement('canvas');

        canvas.style.position = 'absolute';
        canvas.style.top = y_min + 'px';
        canvas.style.left = x_min + 'px';
        canvas.style.width = (x_max - x_min) + 'px';
        canvas.style.height = (y_max - y_min) + 'px';
        
        canvas.width = (x_max - x_min) * DEVICE_PIXEL_RATIO;
        canvas.height = (y_max - y_min) * DEVICE_PIXEL_RATIO;

        const ctx = canvas.getContext('2d');
        ctx.setTransform(DEVICE_PIXEL_RATIO, 0, 0, DEVICE_PIXEL_RATIO, 0, 0);

        ctx.strokeStyle = settings.strokeStyle;
        ctx.lineWidth = settings.lineWidth;
        ctx.lineJoin = 'miter';
        ctx.lineCap = 'butt';
        
        const arrowPath = new Path2D();
        arrowPath.moveTo(p0x, p0y);

        if (Math.abs(p1x - p0x) > Math.abs(p1y - p2y)) {
            arrowPath.lineTo(
                (p1x > p0x) ? (p1x - Math.abs(p1y - p2y)) : (p1x + Math.abs(p1y - p2y)),
                p1y
            );
        }

        if (settings.curve) {
            arrowPath.quadraticCurveTo(p1x, p1y, p2x, p2y);
            
            ctx.strokeStyle = "white";
            ctx.lineWidth = settings.lineWidth + 2;
            ctx.stroke(arrowPath);
        } else {
            arrowPath.lineTo(p1x, p1y);
            arrowPath.lineTo(p2x, p2y);
        }

        ctx.strokeStyle = settings.strokeStyle;
        ctx.lineWidth = settings.lineWidth;
        ctx.stroke(arrowPath);
        
        if (settings.header) {
            const angle = Math.atan2(p2y - p1y, p2x - p1x);

            ctx.save();
            ctx.translate(p2x, p2y);
            ctx.rotate(angle);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-settings.size, settings.size / 2);
            ctx.moveTo(0, 0);
            ctx.lineTo(-settings.size, -settings.size / 2);
            ctx.stroke();

            ctx.restore();
        }

        canvas.className = settings.className;
        parent.appendChild(canvas);
        
        return canvas;
    }

    // 전역 객체(window)에 오직 drawCurvedArrow만 노출시킴
    window.drawCurvedArrow = drawCurvedArrow;

})(window);
