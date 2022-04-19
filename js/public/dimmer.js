/** https://gist.github.com/taylor8294/9cb80f8f40704e8a5e540021ce11344d */
(function(window,document,undefined){

    var Dimmer = function(options){

        this.options = Object.assign({}, Dimmer.defaults, options)

        if(!this.isDomNode(this.options.parent)) this.options.parent = Dimmer.defaults.parent
        if(this.options.opacity > 1 && this.options.opacity <= 100) this.options.opacity = this.options.opacity/100
        else if(this.options.opacity > 1 && this.options.opacity <= 255) this.options.opacity = this.options.opacity/255
        else if(this.options.opacity < 0 || (this.options.opacity > 1 && this.options.opacity > 255)) this.options.opacity = Dimmer.defaults.opacity
        if(this.options.fadeDuration < 0) this.options.fadeDuration=Dimmer.defaults.fadeDuration;
        else if(this.options.fadeDuration < 10) this.options.fadeDuration=this.options.fadeDuration*1000;
        this.options.padding = parseFloat(this.options.padding) || parseFloat(this.options.padding)===0 ? parseFloat(this.options.padding) : Dimmer.defaults.padding;
        this.options.borderRadius = parseFloat(this.options.borderRadius) || parseFloat(this.options.borderRadius)===0 ? Math.max(parseFloat(this.options.borderRadius),0) : Dimmer.defaults.borderRadius;
        if(this.options.transitionDuration < 0) this.options.transitionDuration=Dimmer.defaults.transitionDuration;
        else if(this.options.transitionDuration < 10) this.options.transitionDuration=this.options.transitionDuration*1000;
        if(this.options.resizeDebounce < 0) this.options.resizeDebounce=Dimmer.defaults.resizeDebounce;
        else if(this.options.resizeDebounce < 10) this.options.resizeDebounce=this.options.resizeDebounce*1000;
        this.options.resizeDebounce=Math.max(this.options.resizeDebounce,100);
        this.options.zIndex = parseInt(this.options.zIndex) || Dimmer.defaults.zIndex;
        this.options.easing = ['none','linear','swing','default'].indexOf(this.options.easing.trim().toLowerCase()) ? this.options.easing.trim().toLowerCase() : Dimmer.defaults.easing;

        this.init();
    };

    Dimmer.defaults = {
        parent: document.body,
        opacity: 0.5,
        fadeDuration: 1000,
        padding: 5,
        borderRadius: 5,
        transitionDuration: 1000,
        resizeDebounce: 100,
        zIndex: 99,
        easing: 'swing'
    };

    (function() {
		// 캔버스를 설정하고 준비
        this.init = function(){
            
            this.els = [];
            this.rects = [];
            this.parent = this.options.parent;
            this.parentRect = this.parent.getBoundingClientRect();

            // Create canvas element
            this.canvas = document.createElement('canvas');
            this.canvas.width  = Math.max(this.parent.clientWidth, this.parent.scrollWidth);
            this.canvas.height = Math.max(this.parent.clientHeight,this.parent.scrollHeight);
            this.ctx = this.canvas.getContext('2d');

            this.canvas.style.position = 'absolute'
            this.canvas.style.top = '0px'
            this.canvas.style.left = '0px'
            this.canvas.style.zIndex = this.options.zIndex
            this.canvas.style.pointerEvents = 'none'
            this.canvas.style.opacity = '0'

            window.addEventListener('resize', (function(){
                clearTimeout(this.resizeHandle);
                this.resizeHandle = setTimeout(this.resize.bind(this),this.options.resizeDebounce)
            }).bind(this));
            
            this.options.parent.appendChild(this.canvas);

            this.anims = [];
            this.isVisible = false;
            this.resizeHandle = null;

            // Fix page resizing after load, bug
            /*setTimeout(this.resize.bind(this),1000)
            setTimeout(this.resize.bind(this),2000)
            setTimeout(this.resize.bind(this),5000)
            setTimeout(this.resize.bind(this),8000)*/

            this.draw();
        }
		/** 캔버스를 초기화하고 dimm 목록을 비운다.*/
        this.cleanup = function(){
            this.clear();
            this.rects = [];
            this.els = [];
        }
		/** 캔버스를 초기화*/
        this.clear = function(){
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        this.roundedRect = function(x, y, w, h, r, doFill, doStroke) {
            if(!r && r !== 0) r = this.options.borderRadius;
            if (typeof r === 'number') {
              r = {tl: r, tr: r, br: r, bl: r};
            } else {
              var defaultR = {tl: this.options.borderRadius, tr: this.options.borderRadius, br: this.options.borderRadius, bl: this.options.borderRadius};
              for (var side in defaultR) {
                r[side] = r[side] || defaultR[side];
              }
            }
            if(doFill === undefined) doFill = true;

            this.ctx.beginPath();
            this.ctx.moveTo(x + r.tl, y);
            this.ctx.lineTo(x + w - r.tr, y);
            this.ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
            this.ctx.lineTo(x + w, y + h - r.br);
            this.ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
            this.ctx.lineTo(x + r.bl, y + h);
            this.ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
            this.ctx.lineTo(x, y + r.tl);
            this.ctx.quadraticCurveTo(x, y, x + r.tl, y);
            this.ctx.closePath();
            if(doFill) this.ctx.fill();
            if(doStroke) this.ctx.stroke();
        }

        this.isPercent = function(val){
            return /^\s*\-?(\d+\.?\d*|\d*\.\d+)%\s*$/.test(val)
        }

        this.calcPercent = function(rect){
            return {
                x: this.isPercent(rect.x) ? this.canvas.width*parseFloat(rect.x)/100 : parseFloat(rect.x),
                y: this.isPercent(rect.y) ? this.canvas.height*parseFloat(rect.y)/100 : parseFloat(rect.y),
                width: this.isPercent(rect.width) ? this.canvas.width*parseFloat(rect.width)/100 : parseFloat(rect.width),
                height: this.isPercent(rect.height) ? this.canvas.height*parseFloat(rect.height)/100 : parseFloat(rect.height)
            }
        }
        
        this.draw = function(){
            this.clear()
            this.ctx.globalAlpha = this.options.opacity;
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.globalAlpha = 1.0;
            //this.ctx.fillStyle = '#FFFFFF';
            this.ctx.globalCompositeOperation = 'destination-out';
            this.rects.forEach((rect) => {
                let r = this.calcPercent(rect),
                    x = Math.max(r.x-this.options.padding,0),
                    y = Math.max(r.y-this.options.padding,0),
                    w = Math.min(r.width+2*this.options.padding-(r.x<0?Math.abs(r.x):0),this.canvas.width-x),
                    h = Math.min(r.height+2*this.options.padding-(r.y<0?Math.abs(r.y):0),this.canvas.height-y);
                this.roundedRect(x, y, w, h);
            })
            this.ctx.globalCompositeOperation = 'source-over';
        }

        this.ease = function(p,type) {
            switch(type){
                case 'none':
                case 'linear':
                    return p;
                case 'swing':
                case 'default':
                default:
                    return 0.5 - Math.cos( p * Math.PI ) / 2;
            }
        }
        
        this.fadeOut = function(opts){
            if(this.isFadingOut() || !this.isVisible) return;

            let currentOpacity = parseFloat(this.canvas.style.opacity) || 1;

            if(typeof opts == 'function') opts = {duration: this.options.fadeDuration, onComplete: opts}
            else if(typeof opts == 'number') opts = {duration: opts}
            else if(typeof opts != 'object') opts = {duration: this.options.fadeDuration}
            
            let anim = {type:'fadeOut', start:0, stop:false};
            this.anims.push(anim);
            let step = (function(timestamp){
                if (!anim.start) anim.start = timestamp;
                let progress = opts.duration == 0 ? 1 : this.ease(Math.min((timestamp - anim.start)/opts.duration,1));
                this.canvas.style.opacity = (1-progress)*currentOpacity;
                if (this.canvas.style.opacity>0 && !anim.stop) requestAnimationFrame(step);
                else {
                    if(!anim.stop) this.isVisible = false;
                    this.removeAnim(anim.start,anim.type);
                    if(opts.onComplete && typeof opts.onComplete == 'function') opts.onComplete()
                }
            }).bind(this)
            this.stopFadeIn();
            requestAnimationFrame(step)
        }
        
        this.fadeIn = function(opts){
            let currentOpacity = !this.isVisible ? 0 : (parseFloat(this.canvas.style.opacity) || 1);
            if(this.isFadingIn() || currentOpacity >= 0.99) return false;

            if(typeof opts == 'function') opts = {duration: this.options.fadeDuration, onComplete: opts}
            else if(typeof opts == 'number') opts = {duration: opts}
            else if(typeof opts != 'object') opts = {duration: this.options.fadeDuration}

            if((!opts.duration && opts.duration!==0) || opts.duration < 0) opts.duration = this.options.fadeDuration
            if(opts.duration<10) opts.duration = opts.duration*1000

            let anim = {type:'fadeIn', start:0, stop:false, startY: window.scrollY+window.innerHeight/2, targetY: this.getAverageY()};
            this.anims.push(anim);
            this.isVisible = true;
            let step = (function(timestamp){
                if (!anim.start) anim.start = timestamp;
                let progress = opts.duration == 0 ? 1 : this.ease(Math.min((timestamp - anim.start)/opts.duration,1));
                this.canvas.style.opacity = currentOpacity + progress*(1-currentOpacity);
                window.scrollTo(0,this.lerp(anim.startY-window.innerHeight/2,anim.targetY-window.innerHeight/2,progress))
                if (this.canvas.style.opacity<1 && !anim.stop) requestAnimationFrame(step);
                else {
                    this.removeAnim(anim.start,anim.type);
                    if(opts.onComplete && typeof opts.onComplete == 'function') opts.onComplete()
                }
            }).bind(this)
            this.stopFadeOut();
            requestAnimationFrame(step)
        }

        this.stop = function(start,type){
            this.anims.filter((anim) => (start || start===0 ? anim.start == start : true) && (type ? anim.type == type : true)).forEach((anim) => anim.stop = true)
        }
        this.stopFadeOut = function(start){
            this.stop(start,'fadeOut')
        }
        this.stopFadeIn = function(start){
            this.stop(start,'fadeIn')
        }
        this.stopTransition = function(start){
            this.stop(start,'transition')
        }
        this.removeAnim = function(start,type){
            let i = this.anims.findIndex((anim) => (start || start===0 ? anim.start == start : true) && (type ? anim.type == type : true))
            while(i >= 0){
                this.anims.splice(i,1)
                i = this.anims.findIndex((anim) => (start || start===0 ? anim.start == start : true) && (type ? anim.type == type : true))
            }
        }
        this.isFadingOut = function(){
            return this.anims.findIndex((anim) => anim.type == 'fadeOut' && !anim.stop) >= 0
        }
        this.isFadingIn = function(){
            return this.anims.findIndex((anim) => anim.type == 'fadeIn' && !anim.stop) >= 0
        }
        this.isTransitioning = function(){
            return this.anims.findIndex((anim) => anim.type == 'transition' && !anim.stop) >= 0
        }

        this.resize = function(){
            // If the canvas is not visible, remove it so we get the right document size
            if(!this.isVisible && this.canvas.parentElement){
                this.canvas.parentElement.removeChild(this.canvas)
            }
            // Resize the canvas
            this.canvas.width  = Math.max(this.parent.clientWidth, this.parent.scrollWidth);
            this.canvas.height = Math.max(this.parent.clientHeight,this.parent.scrollHeight);
            if(this.isVisible) this.transition();
            else if(!this.canvas.parentElement) this.options.parent.appendChild(this.canvas)
        }

        this.isDomNode = function(el){
            try {
                if(el instanceof HTMLElement || el instanceof SVGElement) return true
            } catch(e){}
            return (el && typeof el == 'object' && el.nodeType == 1)
        }

        this.isDomNodeList = function(list){
            try {
                if(list instanceof NodeList) return true
            } catch(e){}
            return (list && typeof list == 'object' && list.constructor.name == 'NodeList');
        }

        this.isJqueryObject = function(obj){
            if(typeof jQuery == 'undefined') return false
            try {
                if(obj instanceof jQuery) return true
            } catch(e){}
            return(obj && typeof obj == 'object' && obj.jquery);
        }

        this.isWithinDoc = function(rect){
            let r = this.calcPercent(rect)
            return !(r.width <= 0 || r.height <= 0 || r.x+r.width < 0 || r.x > this.canvas.width || r.y+r.height < 0 || r.y > this.canvas.height);
        }

        this.getRect = function(el){
            let r
            if(this.isDomNode(el)) r = el.getBoundingClientRect()
            else if(el.width !== undefined && el.height !== undefined) r = el
            else r = false
            if(r && r.top !== undefined) {
				r.x -= this.parentRect.x;
				r.y += -this.parentRect.y + this.parent.scrollTop;
			}
            return r
        }

        this.getAverageY = function(){
            let y = 0, area = 0;
            this.els.forEach((el) => {
                let r = this.calcPercent(this.getRect(el)), a=r.width*r.height
                y += (r.y+r.height/2)*a
                area += a
            })
            return y/area
        }

		/** a 지점에서 b 지점까지 p% 만큼 이동한 지점 반환 */
        this.lerp = function(a,b,p){
            return a+p*(b-a)
        }

        this.highlight = function(els, opts){
			this.parentRect = this.parent.getBoundingClientRect();
            if(!els) els = []
            if(!Array.isArray(els)) els = [els]
            let i = els.length-1
            while(i >= 0){
                if(this.isDomNodeList(els[i]) || this.isJqueryObject(els[i]))
                    els = els.slice(0,i).concat(Array.from(els[i])).concat(els.slice(i+1))
                else if(typeof els[i] == 'string')
                    els = els.slice(0,i).concat(Array.from(document.querySelectorAll(els[i]))).concat(els.slice(i+1))
                else if(!this.isDomNode(els[i]) && (!els[i] || !els[i].width>0 || !els[i].height>0))
                    els.splice(i,1)
                i--;
            }

            let defaults = {
                add: false,
                duration: this.options.transitionDuration,
                easing: this.options.easing,
            }
            if(typeof opts == 'boolean') opts = {add: opts}
            else if(typeof opts == 'number') opts = {duration: opts}
            else if(typeof opts == 'function') opts = {onComplete: opts}
            else if(typeof opts != 'object') opts = {}
            opts = Object.assign(defaults,opts)

            els = els.filter((e) => {
                let r = this.getRect(e)
                return this.isWithinDoc(r)
            })
            if(opts.add) this.els = this.els.concat(els)
            else this.els = els

            let that = this;

            if(!this.isVisible){
                this.resize();
                this.transition({duration: 0, onComplete: function(){ that.fadeIn({onComplete: opts.onComplete}) }, easing: opts.easing})
            } else {
                if(this.isFadingOut()) this.fadeIn()
                this.transition({duration: opts.duration, onComplete: opts.onComplete, easing: opts.easing})
            }
        }
        
        this.rehighlight = function(opts){
            if(typeof opts == 'boolean') opts = {add: opts}
            else if(typeof opts == 'number') opts = {duration: opts}
            else if(typeof opts == 'function') opts = {onComplete: opts}
            else if(typeof opts != 'object') opts = {}
            opts.add = true

            this.highlight(false,opts)
        }
        
        this.transition = function(opts){
            let defaults = {
                duration: this.options.transitionDuration,
                easing: this.options.easing
            }
            if(typeof opts == 'number') opts = {duration: opts}
            else if(typeof opts == 'boolean') opts = {follow: opts}
            else if(typeof opts == 'function') opts = {onComplete: opts}
            else if(typeof opts != 'object') opts = {}
            opts = Object.assign(defaults,opts)

            if((!opts.duration && opts.duration!==0) || opts.duration < 0) opts.duration = this.options.transitionDuration
            if(opts.duration<10) opts.duration = opts.duration*1000
            if(opts.easing == 'none' || opts.easing == 'linear') opts.easing = false;

            this.stopTransition()

            // add any new rects that we need
            while(this.rects.length < this.els.length){
                this.rects.push({x:this.canvas.width/2-this.options.padding,y:-this.options.padding*2,width:-2*this.options.padding,height:-2*this.options.padding})
            }
            // create as many targets as we need (one for each current rect)
            let targetRectsUnsorted = []
            this.parentRect = this.parent.getBoundingClientRect();
            this.rects.forEach((rect,i)=>{
                let target = this.els.length > i ? this.calcPercent(this.getRect(this.els[i])) :
                    {
                        x:this.canvas.width/2-this.options.padding,
                        y:-this.options.padding*2,
                        width:-2*this.options.padding,
                        height:-2*this.options.padding
                    }
                targetRectsUnsorted.push(target)
            })
            // for each current rect, find distance to each target
            let distances = []
            this.rects.forEach((rect,i)=>{
                targetRectsUnsorted.forEach((target,j)=>{
                    let d2 = Math.pow(rect.x-target.x,2)+Math.pow(rect.y-target.y,2)
                    distances.push({from:i,to:j,dist:d2})
                })
            })

            // sort distances asc
            distances.sort((a,b)=>{
                return a.dist-b.dist
            })

            // find nearest pairs (keeping track of rects already paired up)
            let usedRect = [], usedTarget = [], targetIndices = []
            this.rects.forEach(()=>{
                usedRect.push(false)
                usedTarget.push(false)
                targetIndices.push(-1)
            })
            distances.forEach((o)=>{
                if(!usedRect[o.from] && !usedTarget[o.to]){
                    usedRect[o.from] = usedTarget[o.to] = true
                    targetIndices[o.from] = o.to
                }
            })

            // sort target rects into order just found
            let targetRects = []
            targetIndices.forEach((idx)=>{
                targetRects.push(targetRectsUnsorted[idx])
            })
            
            // create anim object with nicely paired targets
            let anim = {type:'transition', start:0, stop:false, startRects: this.rects.slice(0), targetRects: targetRects, startY: window.scrollY+window.innerHeight/2, targetY: this.getAverageY()};
            
            this.anims.push(anim);
            
            // step function
            var step = (function(timestamp){
                if (!anim.start) anim.start = timestamp;
                let progress = opts.duration == 0 ? 1 : Math.min((timestamp - anim.start)/opts.duration,1);
                if(opts.easing) progress = this.ease(progress)
                if(!anim.stop){
                    this.rects.forEach((rect,i,arr)=>{
                        let target = anim.targetRects[i]
                        arr[i].x = this.lerp(anim.startRects[i].x,target.x,progress)
                        arr[i].y = this.lerp(anim.startRects[i].y,target.y,progress)
                        arr[i].width = this.lerp(anim.startRects[i].width,target.width,progress)
                        arr[i].height = this.lerp(anim.startRects[i].height,target.height,progress)
                    })
                    if(opts.duration>0) window.scrollTo(0,this.lerp(anim.startY-window.innerHeight/2,anim.targetY-window.innerHeight/2,progress))
                    this.draw()
                    if (progress < 1) requestAnimationFrame(step);
                }
                if(anim.stop || progress >= 1) {
                    if(!anim.stop){
                        this.rects = this.rects.filter(this.isWithinDoc.bind(this))
                        this.draw()
                    }
                    this.removeAnim(anim.start,anim.type);
                    if(opts.onComplete && typeof opts.onComplete == 'function') opts.onComplete()
                }
            }).bind(this)

            // start animating
            requestAnimationFrame(step)
        }

    }).call(Dimmer.prototype);

    window.Dimmer = Dimmer;

})(this,this.document)

//let dimmer = new Dimmer({})
//dimmer.highlight('.panel');
