/**
 * 지정한 형식으로 날짜를 표시.
 */
Date.prototype.format = function(f) {
    if (!this.valueOf()) return " ";
 
    const weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    const d = this;
     
    return f.replace(/(yyyy|yy|MM|dd|E|e|HH|hh|mm|ss|a\/p)/g, function($1) {
        switch ($1) {
            case "yyyy": return d.getFullYear();
            case "yy": return (d.getFullYear() % 1000).zf(2);
            case "MM": return (d.getMonth() + 1).zf(2);
            case "dd": return d.getDate().zf(2);
            case "E": return weekName[d.getDay()];
            case "e": return weekName[d.getDay()][0];
            case "HH": return d.getHours().zf(2);
            case "hh": return ((h = d.getHours() % 12) ? h : 12).zf(2);
            case "mm": return d.getMinutes().zf(2);
            case "ss": return d.getSeconds().zf(2);
            case "a/p": return d.getHours() < 12 ? "오전" : "오후";
            default: return $1;
        }
    });
};

/**
 * 해당 날짜의 주차를 표시. (예:2020-04-03 = 16)
 */
Date.prototype.getWeek = function() {
	const begin = new Date(this.getFullYear(), 0, 1);
	return Math.ceil((((this - begin) / 86400000) + begin.getDay() + 1) / 7);
};

String.prototype.zf = function(len) {return this.padStart(len, 0)};
Number.prototype.zf = function(len) {return this.toString().zf(len);};
