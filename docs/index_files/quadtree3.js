




/*
     FILE ARCHIVED ON 13:10:28 янв 5, 2016 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 4:13:09 мая 8, 2016.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
var QUAD={};QUAD.init=function(args){var TOP_LEFT=0;var TOP_RIGHT=1;var BOTTOM_LEFT=2;var BOTTOM_RIGHT=3;var PARENT=4;var maxChildren=args.maxChildren||2;var maxDepth=args.maxDepth||4;function Node(x,y,w,h,depth){this.x=x;this.y=y;this.w=w;this.h=h;this.depth=depth;this.items=[];this.nodes=[];}
Node.prototype={x:0,y:0,w:0,h:0,depth:0,items:null,nodes:null,exists:function(selector){for(var i=0;i<this.items.length;++i){var item=this.items[i];if(item.x>=selector.x&&item.y>=selector.y&&item.x<selector.x+ selector.w&&item.y<selector.y+ selector.h){return true;}}
if(this.nodes.length!=0){var self=this;return this.findOverlappingNodes(selector,function(dir){return self.nodes[dir].exists(selector);});}
return false;},retrieve:function(item,callback){for(var i=0;i<this.items.length;++i){callback(this.items[i]);}
if(this.nodes.length!=0){var self=this;this.findOverlappingNodes(item,function(dir){self.nodes[dir].retrieve(item,callback);});}},insert:function(item){if(this.nodes.length!=0){var i=this.findInsertNode(item);this.nodes[i].insert(item);}else{if(this.items.length>=maxChildren&&this.depth<maxDepth){this.divide();this.nodes[this.findInsertNode(item)].insert(item);}else{this.items.push(item);}}},findInsertNode:function(item){if(item.x<this.x+(this.w/2)){if(item.y<this.y+(this.h/2)){return TOP_LEFT;}
return BOTTOM_LEFT;}
if(item.y<this.y+(this.h/2)){return TOP_RIGHT;}
return BOTTOM_RIGHT;},findOverlappingNodes:function(item,callback){if(item.x<this.x+(this.w/2)){if(item.y<this.y+(this.h/2)){if(callback(TOP_LEFT))return true;}
if(item.y>=this.y+ this.h/2){if(callback(BOTTOM_LEFT))return true;}}
if(item.x>=this.x+(this.w/2)){if(item.y<this.y+(this.h/2)){if(callback(TOP_RIGHT))return true;}
if(item.y>=this.y+ this.h/2){if(callback(BOTTOM_RIGHT))return true;}}
return false;},divide:function(){var childrenDepth=this.depth+ 1;var width=(this.w/2);var height=(this.h/2);this.nodes.push(new Node(this.x,this.y,width,height,childrenDepth));this.nodes.push(new Node(this.x+ width,this.y,width,height,childrenDepth));this.nodes.push(new Node(this.x,this.y+ height,width,height,childrenDepth));this.nodes.push(new Node(this.x+ width,this.y+ height,width,height,childrenDepth));var oldChildren=this.items;this.items=[];for(var i=0;i<oldChildren.length;i++){this.insert(oldChildren[i]);}},clear:function(){for(var i=0;i<this.nodes.length;i++){this.nodes[i].clear();}
this.items.length=0;this.nodes.length=0;}};var internalSelector={x:0,y:0,w:0,h:0};return{root:(function(){return new Node(args.minX,args.minY,args.maxX- args.minX,args.maxY- args.minY,0);}()),insert:function(item){this.root.insert(item);},retrieve:function(selector,callback){this.root.retrieve(selector,callback);},retrieve2:function(x,y,w,h,callback){internalSelector.x=x;internalSelector.y=y;internalSelector.w=w;internalSelector.h=h;this.root.retrieve(internalSelector,callback);},exists:function(selector){return this.root.exists(selector);},clear:function(){this.root.clear();}};};









function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function eraseCookie(name) {
	createCookie(name,"",-1);
}

function htmlspecialchars(html) {
      // Сначала необходимо заменить &
      html = html.replace(/&/g, "&amp;");
      // А затем всё остальное в любой последовательности
      html = html.replace(/</g, "&lt;");
      html = html.replace(/>/g, "&gt;");
      html = html.replace(/"/g, "&quot;");
      // Возвращаем полученное значение
      return html;
}


$(document).ready(function () {
  $.fn.onTypeFinished = function(func) {
     var T = undefined, S = 0, D = 1000;
     $(this).bind("keypress", onKeyPress).bind("focusout", onTimeOut);
     function onKeyPress() {
        clearTimeout(T);
        if (S == 0) { S = new Date().getTime(); D = 1000; T = setTimeout(onTimeOut, 1000); return; }
        var t = new Date().getTime();
        D = (D + (t - S)) / 2; S = t; T = setTimeout(onTimeOut, D * 2);
     }
 
      function onTimeOut() {
           func.apply(); S = 0;
      }
      return this;
   };
});




function connn(id,title) {
yesterdayloaded = 0;
twodaysloaded = 0;

var soccc = socketaddr.substr(5,socketaddr.length);

//console.log(soccc);
	if (socketState == 0)  {
loaddate = '';
alltimeloaddate = '';
//console.log('we 1');
//startthegame();setUnlimitedZoom(false);
		startthegame();
		//startthegame();
		setSpectate(false);
		setUnlimitedZoom(false);
		setSpectate(false);
		$("#clientstatus").css("margin-bottom","1px");
		$("#playBtn").show();
		connect('ws://' + id + '');
		setSpectate(false);
		curser = $("#region option:selected:selected").attr("mode") + ' #' + $("#region option:selected:selected").attr("modenumber") + ' ' + $("#region option:selected:selected").attr("sname") + " Map" + $("#region option:selected:selected").attr("map") + " Food" + $("#region option:selected:selected").attr("food") + " - <span id='onlinestat'>" + $("#region option:selected:selected").attr("online") + "</span>/" + $("#region option:selected:selected").attr("connectlimit") + " online (<span id='uptime'>0</span>)";
		$("#curser").html(curser);
		setTimeout('setSpectate(false);startthegame();setSpectate(false);setUnlimitedZoom(false);', 1000);
	}

	if ((socketState == 1) && (soccc == id))  {
//console.log('we 2');
		setSpectate(false);
		startthegame();
		setUnlimitedZoom(false);
	}


	if ((socketState == 1) && (soccc != id))  {
//console.log('we 3');
loaddate = '';
alltimeloaddate = '';
		setSpectate(false);
		setUnlimitedZoom(false);
		setSpectate(false);
		$("#clientstatus").css("margin-bottom","1px");
		$("#playBtn").show();
		connect('ws://' + id + '');
		curser = $("#region option:selected:selected").attr("mode") + ' #' + $("#region option:selected:selected").attr("modenumber") + ' ' + $("#region option:selected:selected").attr("sname") + " Map" + $("#region option:selected:selected").attr("map") + " Food" + $("#region option:selected:selected").attr("food") + " - <span id='onlinestat'>" + $("#region option:selected:selected").attr("online") + "</span>/" + $("#region option:selected:selected").attr("connectlimit") + " online (<span id='uptime'>0</span>)";
		$("#curser").html(curser);
		setTimeout('setSpectate(false);startthegame();setSpectate(false);setUnlimitedZoom(false);', 1000);
	}

	
}





function connnspec(id,title) {
yesterdayloaded = 0;
twodaysloaded = 0;
//console.log(playerGroup.length);

var soccc = socketaddr.substr(5,socketaddr.length);
//console.log(soccc);
	

	if (socketState == 0)  {
//console.log('we 1');
loaddate = '';
alltimeloaddate = '';
		startthegame();
		setSpectate(true);
		$("#clientstatus").css("margin-bottom","1px");
		$("#playBtn").show();
		connect('ws://' + id + '');
		curser = $("#region option:selected:selected").attr("mode") + ' #' + $("#region option:selected:selected").attr("modenumber") + ' ' + $("#region option:selected:selected").attr("sname") + " Map" + $("#region option:selected:selected").attr("map") + " Food" + $("#region option:selected:selected").attr("food") + " - <span id='onlinestat'>" + $("#region option:selected:selected").attr("online") + "</span>/" + $("#region option:selected:selected").attr("connectlimit") + " online (<span id='uptime'>0</span>)";
		$("#curser").html(curser);
		setSpectate(true);
		startthegame();
		setTimeout('setSpectate(true);startthegame();', 1000);
	}

	if ((socketState == 1) && (soccc == id))  {
//console.log('we 2');
if (playerGroup.length == 0) {
		jQuery('#specbutton').show();
		setSpectate(true);
		setUnlimitedZoom(true);
		startthegame();
}
if (playerGroup.length > 0) {
		jQuery('#specbutton').hide();
		setSpectate(false);
		setUnlimitedZoom(false);
		startthegame();
}

	}

	if ((socketState == 1) && (soccc != id))  {
//console.log('we 3');
loaddate = '';
alltimeloaddate = '';
		setSpectate(true);
		$("#clientstatus").css("margin-bottom","1px");
		$("#playBtn").show();
		connect('ws://' + id + '');
		curser = $("#region option:selected:selected").attr("mode") + ' #' + $("#region option:selected:selected").attr("modenumber") + ' ' + $("#region option:selected:selected").attr("sname") + " Map" + $("#region option:selected:selected").attr("map") + " Food" + $("#region option:selected:selected").attr("food") + " - <span id='onlinestat'>" + $("#region option:selected:selected").attr("online") + "</span>/" + $("#region option:selected:selected").attr("connectlimit") + " online (<span id='uptime'>0</span>)";
		$("#curser").html(curser);
		setSpectate(true);
		startthegame();
		setTimeout('setSpectate(true);startthegame();', 1000);
	}
}












function connnspecnew(id,title) {
yesterdayloaded = 0;
twodaysloaded = 0;
//console.log(playerGroup.length);

var soccc = socketaddr.substr(5,socketaddr.length);
//console.log(soccc);
	

	if (socketState == 0)  {
//console.log('we 1');
loaddate = '';
alltimeloaddate = '';
		startthegame();
		setSpectate(true);
		$("#clientstatus").css("margin-bottom","1px");
		$("#playBtn").show();
		connect('ws://' + id + '');
		curser = $("#region option:selected:selected").attr("mode") + ' #' + $("#region option:selected:selected").attr("modenumber") + ' ' + $("#region option:selected:selected").attr("sname") + " Map" + $("#region option:selected:selected").attr("map") + " Food" + $("#region option:selected:selected").attr("food") + " - <span id='onlinestat'>" + $("#region option:selected:selected").attr("online") + "</span>/" + $("#region option:selected:selected").attr("connectlimit") + " online (<span id='uptime'>0</span>)";
		$("#curser").html(curser);
		setSpectate(true);
		startthegame();
	}

	if ((socketState == 1) && (soccc == id))  {
//console.log('we 2');
if (playerGroup.length == 0) {
		jQuery('#specbutton').show();
		setSpectate(true);
		setUnlimitedZoom(true);
		startthegame();
}
if (playerGroup.length > 0) {
		jQuery('#specbutton').hide();
		setSpectate(false);
		setUnlimitedZoom(false);
		startthegame();
}

	}

	if ((socketState == 1) && (soccc != id))  {
//console.log('we 3');
loaddate = '';
alltimeloaddate = '';
		setSpectate(true);
		$("#clientstatus").css("margin-bottom","1px");
		$("#playBtn").show();
		connect('ws://' + id + '');
		curser = $("#region option:selected:selected").attr("mode") + ' #' + $("#region option:selected:selected").attr("modenumber") + ' ' + $("#region option:selected:selected").attr("sname") + " Map" + $("#region option:selected:selected").attr("map") + " Food" + $("#region option:selected:selected").attr("food") + " - <span id='onlinestat'>" + $("#region option:selected:selected").attr("online") + "</span>/" + $("#region option:selected:selected").attr("connectlimit") + " online (<span id='uptime'>0</span>)";
		$("#curser").html(curser);
		setSpectate(true);
		startthegame();
		setTimeout('setSpectate(true);startthegame();', 1000);
	}
}

