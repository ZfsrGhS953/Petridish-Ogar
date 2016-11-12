




/*
     FILE ARCHIVED ON 12:13:33 янв 5, 2016 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 4:13:08 мая 8, 2016.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
function htmlspecialchars(html) {
      html = html.replace(/&/g, "&amp;");
      html = html.replace(/</g, "&lt;");
      html = html.replace(/>/g, "&gt;");
      html = html.replace(/"/g, "&quot;");
      return html;
}

var ellle = 0;



function getRandomInt(min, max)	{
	  return Math.floor(Math.random() * (max - min + 1)) + min;
	}



var chart_update_interval = 10;



var __STORAGE_PREFIX = "petridish__";

function LS_getValue(aKey, aDefault) {
	var val = localStorage.getItem(__STORAGE_PREFIX + aKey);
	if (null === val && 'undefined' != typeof aDefault) return aDefault;
	return val;
}
 
function LS_setValue(aKey, aVal) {
	localStorage.setItem(__STORAGE_PREFIX + aKey, aVal);
}

function GetRgba(hex_color, opacity)
{
    var patt = /^#([\da-fA-F]{2})([\da-fA-F]{2})([\da-fA-F]{2})$/;
    var matches = patt.exec(hex_color);
    return "rgba("+parseInt(matches[1], 16)+","+parseInt(matches[2], 16)+","+parseInt(matches[3], 16)+","+opacity+")";
}

function secondsToHms(d) 
{
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s);
}

var chart = null;
var chart_data = [];
var chart_counter = 0;
var stat_canvas = null;

var stats = null;
var my_cells = null;
var my_color = "#ff8888";
var pie = null;
var stats_chart;

var display_chart = LS_getValue('display_chart', 'true') === 'true';
var display_stats = LS_getValue('display_stats', 'false') === 'true';






jQuery(document).ready(function() {




var insertt = '';

   // jQuery('#overlays').append(insertt);








    jQuery('#stats').hide(0);   
    jQuery('#serverstats').hide(0);   
    jQuery('#statssmall').hide(0);   
    jQuery('#stats').hide(0);  
    window.livekills = jQuery('#livekills');
});




function sharethis(record, server) {

 var title = 'My top score! ';
 var description = 'I have scored ' + record + ' mass at the petridish.pw game at the ' + server + ' server! Go with we?';
 var descriptiontwi = 'I have scored ' + record + ' mass at the petridish.pw game! Go with we?';
 var gameurl = encodeURI('/web/20160105121333/http://petridish.pw');
 var imageurl = '/web/20160105121333/http://petridish.pw/petri.jpg';
 var hashtags = 'petridish,agar,agario';
 var vktext = 'Post to vk.com';
 var fbtext = 'Share on Facebook';
 var twtext = 'Tweet this!';
 var maintext = 'Share <br/>this result';

if (settedlang == 'ru') {
 title = 'Мой рекорд! ';
 description = 'Я набрал ' + record + ' массы в игре petridish.pw на сервере ' + server + ', го со мной?';
 descriptiontwi = 'Я набрал ' + record + ' массы в игре petridish.pw - го со мной?';
 vktext = 'Сохранить в Вконтакте';
 fbtext = 'Поделиться ссылкой в Фейсбуке';
 twtext = 'Поделиться ссылкой в Твиттере';
 maintext = 'Поделиться<br/>результатом';
}

var output = '<div style="text-align:center;margin-top:20px;">';

output += '<div style="margin-left:70px;color:red;font-weight:bold;float:left;"><div style="margin-top:10px;margin-right:10px;">' + maintext + '</div></div><div style="float:left;">';

output += '<a href="http://vkontakte.ru/share.php?url=' + gameurl + '&title=' + title + '&description=' + description + '&image=' + imageurl + '&noparse=true" onclick="window.open(this.href, this.title, `toolbar=0, status=0, width=548, height=325`); return false" title="' + vktext + '" target="_parent"><img style="margin-right:10px;" src="/index_files/img/stats-vk.gif" alt="' + vktext + '" title="' + vktext + '"/></a>';

output += '<a href="http://www.facebook.com/sharer.php?s=100&p[url]=' + gameurl + '&p[title]=' + title + '&p[summary]=' + description + '&p[images][0]=' + imageurl + '" onclick="window.open(this.href, this.title, `toolbar=0, status=0, width=548, height=325`); return false" title="' + fbtext + '" target="_parent"><img style="margin-right:10px;"  src="/index_files/img/stats-fb.gif" alt="' + fbtext + '" title="' + fbtext + '"/></a>';

output += '<a href="http://twitter.com/share?text=' + title + descriptiontwi + '&hashtags=' + hashtags + '&url=' + gameurl + '" onclick="window.open(this.href, this.title, `toolbar=0, status=0, width=548, height=325`); return false" target="_parent" title="' + twtext + '"><img style="margin-right:10px;" src="/index_files/img/stats-twitter.gif" alt="' + twtext + '" title="' + twtext + '"/></a>';

output += '</div></div>';

return output;

}









function OnChangeDisplayStats(display)
{
    LS_setValue('display_stats', display ? 'true' : 'false');
    display_stats = display;
    RenderStats(false);
}



function ResetStats()
{
    stats = {
        pellets: {num:0, mass:0},
        w: {num:0, mass:0},
        cells: {num:0, mass:0},
        viruses: {num:0, mass:0},

        birthday: Date.now(),
        time_of_death: null,
        high_score: 0,
        top_slot: Number.POSITIVE_INFINITY,

        gains: {},
        losses: {},
    };
}

function OnGainMass(me, other)
{



    var mass = Math.floor((other.size * other.size)/100);
    if (other.isVirus){
        stats.viruses.num++;
        stats.viruses.mass += mass; //TODO: shouldn't add if  game mode is teams
    }
    else if (other.size <= 75 && other.size != 35 && !other.name){
        stats.pellets.num++;
        stats.pellets.mass += mass;
    }
	// heuristic to determine if mass is 'w', not perfect
    else if ((!other.name && other.size == 35) && (other.sizeCache && other.sizeCache._value == 12)){
        if (other.color != me.color){ //dont count own ejections, again not perfect
            stats.w.num++;
            stats.w.mass += other.sizeCache._value;

        }
    }
    else { 

	//not perfect i know but still better than it was
	if ((other.color != me.color) && (other.name != me.name)) {
        var key = other.name + ':' + other.color;
        stats.cells.num++;
        stats.cells.mass += mass;
        if (stats.gains[key] == undefined)
            stats.gains[key] = {num: 0, mass: 0};
        stats.gains[key].num++;
        stats.gains[key].mass += mass;

	}
    }
}

function OnLoseMass(me, other) {
	if ((other.color != me.color) && (other.name != me.name)) {
    var mass = Math.floor((me.size * me.size)/100);
    var key = other.name + ':' + other.color;
    if (stats.losses[key] == undefined)
        stats.losses[key] = {num: 0, mass: 0};;
    stats.losses[key].num++;
    stats.losses[key].mass += mass;
	}
}

function DrawPie(pellet, w, cells, viruses, numpellet, numw, numcells, numviruses)
{
    var total = pellet + w + cells + viruses;
	if (total > 0) {

    pie = new CanvasJS.Chart("pieArea", {
        title: null,
        animationEnabled: false,
        legend:{
            verticalAlign: "bottom",
            horizontalAlign: "center",
            fontSize: 12,
            fontFamily: "Helvetica"        
        },
        theme: "theme2",
        data: [{        
            type: "pie",       
            startAngle:-20,      
            showInLegend: true,
            toolTipContent:"{legendText} {y}%",
            dataPoints: [
                {  y: 100*pellet/total, legendText: numpellet + " " + pelletst + " (+" + pellet + " " + masst + ")"},
                {  y: 100*cells/total, legendText: numcells + " " + cellst + " (+" + cells + " " + masst + ")"},
                {  y: 100*w/total, legendText: numw + " w (+" + w + " " + masst + ")"},
                {  y: 100*viruses/total, legendText: numviruses + " " + virusest + " (+" + viruses + " " + masst + ")"},
            ]
        }]
    });


	pie.render();   
}

}



function GetTopN(n, p)
{
	var r = [];
	var a = Object.keys(stats[p]).sort(function(a, b) {return -(stats[p][a].mass - stats[p][b].mass)});
    for (var i = 0; i < n && i < a.length; ++i){
        var key = a[i];
        var mass = stats[p][key].mass;
        var name = key.slice(0,key.length-8);
        if (!name) name = "An unnamed cell";
        var color = key.slice(key.length-7);
		r.push({name:name, color:color, mass:Math.floor(mass)});
    }	
	return r;
}

function AppendTopN(n, p, list)
{
	var a = GetTopN(n,p);
    for (var i = 0; i < a.length; ++i){
        var text = htmlspecialchars(a[i].name) + ' (' + (p == 'gains' ? '+' : '-') + a[i].mass + ' mass)';
        list.append('<li style="font-size: 12px; "><div style="width: 12px; height: 12px; border-radius: 50%; margin-right:5px; background-color: ' + a[i].color + '; display: inline-block;"></div>' + text + '</li>');
    }
	return a.length > 0;
}


function showtoppers() {
	$("#statstoday #toppers tr").show();
	$("#statstoday #showallpers").hide();
}

function showtopclans() {
	$("#statstoday #topclans tr").show();
	$("#statstoday #showallclans").hide();
}

function showtoppersy() {
	$("#statsyesterday #toppers tr").show();
	$("#statsyesterday #showallpers").hide();
}

function showtopclansy() {
	$("#statsyesterday #topclans tr").show();
	$("#statsyesterday #showallclans").hide();
}

function showtoppersyy() {
	$("#statstwodays #toppers tr").show();
	$("#statstwodays #showallpers").hide();
}

function showtopclansyy() {
	$("#statstwodays #topclans tr").show();
	$("#statstwodays #showallclans").hide();
}

function showtoppersa() {
	$("#statsalltime #toppers tr").show();
	$("#statsalltime #showallpers").hide();
}

function showtopclansa() {
	$("#statsalltime #topclans tr").show();
	$("#statsalltime #showallclans").hide();
}


//var loaddate = '';
function DrawStats(game_over) {
    if (!stats) return;
            


	jQuery('#statArea').empty();
    jQuery('#pieArea').empty();
    jQuery('#gainArea').empty();
    jQuery('#lossArea').empty();
    jQuery('#chartArea').empty();

   
    if (game_over){


$('#stats').show();
$('#serverstats').show();

var srrv = $("#region option:selected:selected").attr("mode") + ' №' + $("#region option:selected:selected").attr("modenumber");
var soname = '';
var bba = $("#region option:selected:selected").attr("sname");
if (bba && bba.length > 1) {
 bba = bba.substr(0,bba.length-3);
 soname = ' (' + bba + ')';
}
$("#sername").html(srrv+soname);


loadstats("today");
// here




$('#helloDialog').hide();
$('#descriptionDialog').hide();

    jQuery('#statssmall').hide();
		jQuery("#spectateBtn").show();

        stats.time_of_death = Date.now();
	}
    var time = stats.time_of_death ? stats.time_of_death : Date.now();
    var seconds = (time - stats.birthday)/1000;
	
	var list = jQuery('<ul>');
    list.append('<li style="font-size: 14px; ">' + gametimet + '<br/><h2>' + secondsToHms(seconds) + '</h2></li>');
    list.append('<li style="font-size: 14px; ">' + hight + '<br/><h2>' + ~~(stats.high_score/100) + '</h2></li>');
    if (stats.top_slot == Number.POSITIVE_INFINITY){
        list.append('<li style="font-size: 14px; ">' + lbmaxt + '<br/>' + nopet + '</li>');
    }
    else{
        list.append('<li style="font-size: 14px; ">' + lbmaxt + '<br/><h2>' + stats.top_slot + '</h2></li>');

    }
    
var srrv = $("#region option:selected:selected").attr("mode") + ' №' + $("#region option:selected:selected").attr("modenumber");
var soname = '';
var bba = $("#region option:selected:selected").attr("sname");
if (bba && bba.length > 1) {
 bba = bba.substr(0,bba.length-3);
 soname = ' (' + bba + ')';
}

    jQuery('#statArea').append('<div id="statsheader"><img src="/index_files/img/stats-logo.gif" /><br/><strong>' + titlet + '</strong><br/><strong>' + settednick + ' @ ' + srrv + soname + '</strong></div>');
    jQuery('#statArea').append(list);



    var sha = sharethis(~~(stats.high_score/100), srrv);
    jQuery('#statArea').append('<br style="clear:both;"/>');
    jQuery('#statArea').append(sha);
    jQuery('#statsheader').css("text-align","center");

	
    DrawPie(stats.pellets.mass, stats.w.mass, stats.cells.mass, stats.viruses.mass, stats.pellets.num, stats.w.num, stats.cells.num, stats.viruses.num);

	jQuery('#gainArea').append('<h2><img style="margin-right: 10px;" src="/index_files/img/stats-gains.gif" />' + topgt + '</h2>');
	list = jQuery('<ol>');
    if (AppendTopN(5, 'gains', list))
		jQuery('#gainArea').append(list);
	else
		jQuery('#gainArea').append('<ul><li style="font-size: 12px; ">' + noeatt + '</li></ul>');

 
	 
    jQuery('#lossArea').append('<h2><img style="margin-right: 10px;" src="/index_files/img/stats-losses.gif" />' + toplt + '</h2>');
	list = jQuery('<ol>');
	if (AppendTopN(5, 'losses', list))
		jQuery('#lossArea').append(list);
    else
		jQuery('#lossArea').append('<ul><li style="font-size: 12px; ">' + noeatyout + '</li></ul>');
	
	if (stats.time_of_death !== null){
		//jQuery('#chartArea').width(700).height(200);
		//stat_chart = CreateChart('chartArea', my_color, true);
		//stat_chart.render();
	}
	else {
		jQuery('#chartArea').width(700).height(0);
	}
}

var styles = {
	heading: {font:"30px Ubuntu", spacing: 41, alpha: 1},
	subheading: {font:"25px Ubuntu", spacing: 31, alpha: 1},
	normal: {font:"17px Ubuntu", spacing: 21, alpha: 0.6}
}

var g_stat_spacing = 0;
var g_display_width = 220;
var g_layout_width = g_display_width;

function AppendText(text, context, style)
{
	context.globalAlpha = styles[style].alpha;
	context.font = styles[style].font;
	g_stat_spacing += styles[style].spacing;
    
    var width = context.measureText(text).width;
    g_layout_width = Math.max(g_layout_width, width);    
	context.fillText(text, g_layout_width/2 - width/2, g_stat_spacing);
}

function RenderStats(reset)
{
	if (reset) g_layout_width = g_display_width;
	if (!display_stats || !stats) return;
	g_stat_spacing = 0;	
	
	var gains = GetTopN(3, 'gains');
	var losses =  GetTopN(3, 'losses');
	var height = 30 + styles['heading'].spacing + styles['subheading'].spacing * 2 + styles['normal'].spacing * (4 + gains.length + losses.length);
		
	stat_canvas = document.createElement("canvas");
	var scale = Math.min(g_display_width, .3 * window.innerWidth) / g_layout_width;
	stat_canvas.width = g_layout_width * scale;
    stat_canvas.height = height * scale;
	var context = stat_canvas.getContext("2d");
	context.scale(scale, scale);
		
    context.globalAlpha = .4;
    context.fillStyle = "#000000";
    context.fillRect(0, 0, g_layout_width, height);
        
    context.fillStyle = "#FFFFFF";
	AppendText(statst, context, 'heading');

	var text = stats.pellets.num + " " + pelletst + " (" + ~~(stats.pellets.mass) + ")";
	AppendText(text, context,'normal');		
	text = stats.w.num + " w (" + ~~(stats.w.mass) + ")";
	AppendText(text, context,'normal');
    text = stats.cells.num + " " + cellst + " (" + ~~(stats.cells.mass) + ")";
	AppendText(text, context,'normal');
	text = stats.viruses.num + " " + virusest + " (" + ~~(stats.viruses.mass) + ")";
	AppendText(text, context,'normal');
		
	AppendText(topgt,context,'subheading');
	for (var j = 0; j < gains.length; ++j){
		text = (j+1) + ". " + htmlspecialchars(gains[j].name) + " (" + gains[j].mass + ")";
		context.fillStyle = gains[j].color;			
		AppendText(text, context,'normal');
	}
		
	context.fillStyle = "#FFFFFF";
	AppendText(toplt,context,'subheading');
	for (var j = 0; j < losses.length; ++j){
		text = (j+1) + ". " + htmlspecialchars(losses[j].name) + " (" + losses[j].mass + ")";
		context.fillStyle = losses[j].color;			
		AppendText(text, context,'normal');
	}
}  

jQuery(window).resize(function() {
    RenderStats(false);
});

window.OnGameStart = function(cells)
{	
	if(cells){
		my_cells = cells;
	}
    ResetStats();
    RenderStats(true);

	
	try{
		for(var i=0;i<region.children.length;i++){
			if(document.getElementById("S"+i).value==socketaddr.split("ws://")[1]) {var server=document.getElementById("S"+i);};
		}
	
		curser = $(server).attr("mode") + ' #' + $(server).attr("modenumber") + ' ' + $(server).attr("sname") + " Map" + $(server).attr("map") + " Food" + $(server).attr("food") + " - <span id='onlinestat'>" + $(server).attr("online") + "</span>/" + $(server).attr("connectlimit") + " online (<span id='uptime'>0</span>)";
		$("#curser").html(curser);
		jQuery('#specbutton').hide(); 
		setSpectate(false);
		jQuery('#spectateBtn').hide();
	} catch(e){};

}

window.OnShowOverlay = function(game_in_progress)
{
    DrawStats(!game_in_progress);
}

window.OnUpdateMass = function(mass) 
{
    stats.high_score = Math.max(stats.high_score, mass);
}

window.OnCellEaten = function(predator, prey) {
	var name1 = predator.name;
	var name2 = prey.name;
	if(name1 == '') { name1 = 'An unnamed cell';  }
	if(name2 == '') { name2 = 'An unnamed cell';  }
	var thismass = Math.floor((prey.size * prey.size)/100);
	var someEated = false;

	if ((thismass >= 51) && (!prey.isVirus) && (name1 != name2)) {
		livekills.append('<div class="battlelog"><strong style="color:' + predator.color + '">' + htmlspecialchars(name1) + '</strong> eats <strong style="color:' + prey.color + '">' + htmlspecialchars(name2) + '</strong> (+' + thismass  + ' mass)</div>'); 
		someEated = true;

	}
	if (prey.isVirus) {
		livekills.append('<div class="battlelog"><strong style="color:' + predator.color + '">' + htmlspecialchars(name1) + '</strong> eats a <strong style="color:green;">virus</strong> (+' + thismass  + ' mass)</div>'); 
		someEated = true;

	}

	if (someEated && livekills.find('.battlelog:visible').length > 5) { jQuery('.battlelog:visible').eq(0).hide(); }
	if (someEated && livekills.find('.battlelog').length > 100) { jQuery('.battlelog').eq(0).remove(); }

    if (!my_cells) return;

    if (my_cells.indexOf(predator) != -1){

	if (prey.name != '') { 
	}



        OnGainMass(predator, prey);
        RenderStats(false);
    }
    if (my_cells.indexOf(prey) != -1){
        OnLoseMass(prey, predator);
        RenderStats(false);
    }    
}

window.OnLeaderboard = function(position) {
    stats.top_slot = Math.min(stats.top_slot, position);
}

window.OnDraw = function(context) {
    display_stats && stat_canvas && context.drawImage(stat_canvas, 10, 10);   
}

var yesterdayloaded = 0;
var twodaysloaded = 0;

loadstats = function(interval,override) { 
  if (interval == "today")  {
	time=new Date();
	if($("#region option:selected:selected").attr("stats")){
		var statspref = $("#region option:selected:selected").attr("stats").toLowerCase();
	} else {
		var statspref = "";
	}
	statspref += '-stats-' + datefromserver + '.txt?' + Math.random();
	var difff = time - loaddate;
	if ((difff > 600000) || (override === true))  {

	/*$("#statstoday").load("http://stat.petridish.pw/stats/final/" + statspref, function(response, status, xhr) {

  if ( status == "error" ) {
    var msg = "No top data yet";
    $( "#statstoday" ).html( msg  ).show();
  }

	 var pers = $("#statstoday #toppers tr").length;
	 if (pers > 5) { $("#statstoday #toppers").after("<div id='showallpers' onclick='showtoppers();'>" + showallt + "</div>"); }
	 var claans = $("#statstoday #topclans tr").length;
	 if (claans > 5) { $("#statstoday #topclans").after("<div id='showallclans' onclick='showtopclans();'>"+ showallt +"</div>"); }
	 loaddate = new Date();
	 console.log("Updating server stats");
		});*/

	}

	$(".actualstats").hide();
	$("#statstoday").show();
	$(".interval").removeClass('active'); 
	$("#inttoday").addClass('active'); 


 }


  if (interval == "yesterday")  {
	var statspref = $("#region option:selected:selected").attr("stats").toLowerCase();
	statspref += '-stats-' + datefromserveryesterday + '.txt?' + Math.random();
     if (yesterdayloaded != 1) {
	$("#statsyesterday").load("/web/20160105121333/http://stat.petridish.pw/stats/final/" + statspref, function() {
	 var pers = $("#statsyesterday #toppers tr").length;
	 if (pers > 5) { $("#statsyesterday #toppers").after("<div id='showallpers' onclick='showtoppersy();'>" + showallt + "</div>"); }
	 var claans = $("#statsyesterday #topclans tr").length;
	 if (claans > 5) { $("#statsyesterday #topclans").after("<div id='showallclans' onclick='showtopclansy();'>"+ showallt +"</div>"); }
	 console.log("Updating yesterday server stats");
	 yesterdayloaded = 1;
	});
     }
	$(".actualstats").hide();
	$("#statsyesterday").show();
	$(".interval").removeClass('active'); 
	$("#intyesterday").addClass('active'); 

	$("#statsyesterday #toppers tr").hide();
	$("#statsyesterday #toppers tr.top").show();
	$("#statsyesterday #showallpers").show();
	$("#statsyesterday #topclans tr").hide();
	$("#statsyesterday #topclans tr.top").show();
	$("#statsyesterday #showallclans").show();

 }


  if (interval == "twodays")  {
	var statspref = $("#region option:selected:selected").attr("stats").toLowerCase();
	statspref += '-stats-' + datefromserveryesterdaymore + '.txt?' + Math.random();
     if (twodaysloaded != 1) {
	$("#statstwodays").load("/web/20160105121333/http://stat.petridish.pw/stats/final/" + statspref, function() {
	 var pers = $("#statstwodays #toppers tr").length;
	 if (pers > 5) { $("#statstwodays #toppers").after("<div id='showallpers' onclick='showtoppersyy();'>" + showallt + "</div>"); }
	 var claans = $("#statstwodays #topclans tr").length;
	 if (claans > 5) { $("#statstwodays #topclans").after("<div id='showallclans' onclick='showtopclansyy();'>"+ showallt +"</div>"); }
	 console.log("Updating 2yesterday server stats");
	 twodaysloaded = 1;
	});
     }
	$(".actualstats").hide();
	$("#statstwodays").show();
	$(".interval").removeClass('active'); 
	$("#inttwodays").addClass('active'); 

	$("#statstwodays #toppers tr").hide();
	$("#statstwodays #toppers tr.top").show();
	$("#statstwodays #showallpers").show();
	$("#statstwodays #topclans tr").hide();
	$("#statstwodays #topclans tr.top").show();
	$("#statstwodays #showallclans").show();




 }


  if (interval == "alltime")  {
	time=new Date();
	var statspref = $("#region option:selected:selected").attr("stats").toLowerCase();
	statspref += '-alltime.txt?' + Math.random();
	var difffa = time - alltimeloaddate;
	if ((difffa > 600000) || (override === true))  {

	$("#statsalltime").load("/web/20160105121333/http://stat.petridish.pw/stats/alltime/" + statspref, function() {
	 var pers = $("#statsalltime #toppers tr").length;
	 if (pers > 5) { $("#statsalltime #toppers").after("<div id='showallpers' onclick='showtoppersa();'>" + showallt + "</div>"); }
	 var claans = $("#statsalltime #topclans tr").length;
	 if (claans > 5) { $("#statsalltime #topclans").after("<div id='showallclans' onclick='showtopclansa();'>"+ showallt +"</div>"); }
	 alltimeloaddate = new Date();
	 console.log("Updating alltime server stats");
		});

	}


    
	$(".actualstats").hide();
	$("#statsalltime").show();
	$(".interval").removeClass('active'); 
	$("#intalltime").addClass('active'); 

	$("#statsalltime #toppers tr").hide();
	$("#statsalltime #toppers tr.top").show();
	$("#statsalltime #showallpers").show();
	$("#statsalltime #topclans tr").hide();
	$("#statsalltime #topclans tr.top").show();
	$("#statsalltime #showallclans").show();



 }

}