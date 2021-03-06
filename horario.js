//V 2.8 2018-03-27
if (window.location.pathname === "/portal/mis_fichadas") {
	_Horario();
}	
if (window.location.pathname === "/portal/novedades_asistencia") {
       _Asistencia();
}	

function _Horario(){
    $.getScript("http://momentjs.com/downloads/moment-with-locales.min.js", function() {
        moment.locale("es");
        //8:00 hs
        //var Ths=8*60*60*1000;
        //9:40 hs
        var Ths=(9*60*60*1000)+(40*60*1000);
        var Horario= obtenerHorario(Ths);
        var TLibre=30*60*1000;
		calcular(Horario,TLibre);
    });
}

function _Asistencia(){
    $.getScript("http://momentjs.com/downloads/moment-with-locales.min.js", function() {
        moment.locale("en");
	asistencia();
    });
}
function calcular(Horario,TLibre) {
    var datos = $("main div.container div.row > div.col")[0];
    var n=nombreUsuario();
    $(datos).children().each(function(i, e) {
		compensa=0;
        enEdificio=0;
        switch (i) {
            case 1:
                horaIngreso = obtenerHoraIngreso(e);
				console.log('E1');
                dia=obtenerDia(e);
                break;
            case 2:
                fichadas = obtenerFichadas(e);
                tiempos = calcularPermanencia(horaIngreso, fichadas, Horario, TLibre);
                infoComputada = "Hora de ingreso: " + horaIngreso.format("HH:mm:ss");
                mostrar(tiempos, e, infoComputada,horaIngreso, Horario,TLibre);
                compensa = compensacion(tiempos,horaIngreso, Horario, TLibre)
				enEdificio=tiempos.enEdificio;
                setCookie(n+dia, compensa, 30)
				setCookie(n+dia+'enEdificio', enEdificio, 30)
                historicoSemana(dia,e);
                break;
            case 4:
                horaIngreso = obtenerHoraIngreso(e);
				console.log('E1');
                dia=obtenerDia(e);
                break;
            case 5:
                fichadas = obtenerFichadas(e);
                tiempos = calcularPermanencia(horaIngreso, fichadas, Horario, TLibre);
                infoComputada = "Hora de ingreso: " + horaIngreso.format("HH:mm:ss");
                mostrar(tiempos, e, infoComputada,horaIngreso,Horario,TLibre);
                compensa = compensacion(tiempos,horaIngreso, Horario, TLibre)
				enEdificio=tiempos.enEdificio;
                setCookie(n+dia, compensa, 30)
                setCookie(n+dia+'enEdificio', enEdificio, 30)
                historicoSemana(dia,e);
                break;
        }
    });
}

function obtenerHoraIngreso(elemento) {
	try
	{var horarioAdm = moment($(elemento).find(" > div:last-child center").html().trim(), "HH:mm");}
	catch(err)
	{
		//var primerFichada = horarioAdm;
		console.log('Error en obtenerHoraIngreso');
		console.log(err);
	}
	
	try
	{
		var primerFichada = moment($(elemento).find("h1.black-text center").html().trim().slice(-8), "HH:mm:ss");
	}
	catch(err)
	{
		var primerFichada = horarioAdm;
		console.log('Error en obtenerHoraIngreso');
		console.log(err);
	}
        
	if(EsControlable())
		if (primerFichada > horarioAdm) {
			return primerFichada;
		} else {
			return horarioAdm;
		}
	else{ return primerFichada}
}

function obtenerHorario(ThsDefault) {
    var datos = $("main div.container div.row > div.col")[0];
    var horarioIngreso =moment();
    var horarioEgreso =moment();
    var Ths = ThsDefault;
    $(datos).children().each(function(i, e) {
		switch (i) {
            case 1:
                horarioIngreso = moment($(e).find(" > div:last-child center").html().trim(), "HH:mm");
                var O = $(e).find(" > div:last-child center");
                horarioEgreso = moment($(O[1]).html().trim(), "HH:mm");
                Ths = horarioEgreso.diff(horarioIngreso);
                break;
		}
    });
    return {"horarioIngreso": horarioIngreso, "horarioEgreso": horarioEgreso, "Ths": Ths};
}

function obtenerFichadas(elemento) {
    var fichadas = [];
    var tipo='';
    var tipoOld='';
    $(elemento).find("tbody tr").each(function() {
        var format = "HH:mm:ss";
        hora = $(this).find("td:nth(0)").html();
        if (hora.indexOf(" ") > 0) {
            format = "DD-MM-YYYY " + format;
        }
        hh = moment(hora, format);
        tipo=$(this).find("td:nth(1)").html();
        if(tipo!=tipoOld){
            fichadas.push({
                "fichada": hh,
                "tipo": tipo
            });
        }
        tipoOld=tipo;
    });
    return fichadas;
}

function calcularPermanencia(horaIngreso, fichadas, Horario, TLibre) {
    var diff = 0;
    var total =0;
    var falta = 0;
    if(fichadas.length>0){
        // Substituyo la primer fichada por la hora de ingreso computable
        fichadas[0] = {
            "fichada": horaIngreso,
            "tipo": "Entrada"
        };
    
        for (var i = 1; i < fichadas.length; i += 2) {
            diff += moment.duration(fichadas[i].fichada.diff(fichadas[i-1].fichada));
        }
        var ahora = moment();
        // Todavía en el edificio?
        if (fichadas[fichadas.length - 1].tipo == "Entrada") {
            diff += moment.duration(ahora.diff(fichadas[fichadas.length - 1].fichada));
            ultima = ahora;
            //falta = 27000000 - diff;
            falta = Horario.Ths - TLibre - diff;
        } else {
            ultima = fichadas[fichadas.length - 1].fichada;
        }
        total = moment.duration(ultima.diff(fichadas[0].fichada));
    }
    return {"enEdificio": diff, "fuera": total - diff, "falta": falta, "total": total};
}

function mostrar1(tiempos, elemento, infoComputada, horaIngreso, Horario,TLibre) {
     //mostrar2();
    var compensa = compensacion(tiempos,horaIngreso, Horario, TLibre);
	var style='';
	if (tiempos.enEdificio<6*60*60*1000)
		style='color:red;'
	var mensaje = 'En edificio <span class="enEdifi" style="'+style+'">' + formatearHora(tiempos.enEdificio) + '</span> -- Fuera: ' + formatearHora(tiempos.fuera) ;
	boleta = 0;
    if (tiempos.falta !== 0) {
		salida = moment().add(tiempos.falta, "ms");
		salida2 = horaIngreso.add(Horario.Ths,"ms");
		
		if ((salida > salida2 || compensa<0) && (tiempos.enEdificio>6*60*60*1000)) {	
            boleta= CalcualarBoleta(salida,salida2,tiempos.fuera,TLibre,compensa);
			if (salida > salida2)
					salida = salida2;
			mensaje += '-- Salida: ' + salida.format("HH:mm:ss")+ '  <a href="#" title="Boleta de salida" style="color: #fafafa"><i class="fa fa-sign-out" aria-hidden="true"></i><span class="boleta" style="color:red">'+formatearHora(boleta)+'</span></a>';
		}
		else{        
			if (salida > salida2)
				salida = salida2;
			mensaje += '-- Salida: ' + salida.format("HH:mm:ss");
		}
		
	    if(salida<moment())
			if ($("main div.container").find('div.chau').length === 0){
				$("main div.container").prepend( '<div class="chau col s12" style="background-color:orange;"><h3 style="background-color:orange;"><center>¡¡Chauuu!! Te podes ir <i class="fa fa-hand-stop-o" aria-hidden="true"></i></center></h1></div>');
				parpadear();
			}
        if (!window.actualizarPermanencia)
            window.actualizarPermanencia = setInterval(function(){ calcular(Horario,TLibre);}, 1000);
    }else{
		var d=horaIngreso.clone();
		salida = horaIngreso.add(tiempos.total.asMilliseconds(),"ms");
		salida2 = d.add(Horario.Ths,"ms");
		if ((salida > salida2 || compensa<0) && tiempos.enEdificio>6*60*60*1000){			
			boleta= CalcualarBoleta(salida,salida2,tiempos.fuera,TLibre,compensa);
			mensaje += '-- Salida: ' + salida.format("HH:mm:ss");
			if (boleta>0)
				mensaje += '  <a href="#" title="Boleta de salida" style="color: #fafafa"><i class="fa fa-sign-out" aria-hidden="true"></i><span class="boleta" style="color:red">'+formatearHora(boleta)+'</span></a>';
		}else
		mensaje += '-- Salida: ' + salida.format("HH:mm:ss");
	}
	if ($(elemento).find('table tfoot').length > 0) {
        $(elemento).find('table tfoot h3 span.enEdifi').html(formatearHora(tiempos.enEdificio));
		$(elemento).find('table tfoot h3 span.enEdifi').attr('style',style);
		$(elemento).find('table tfoot h3 span.comp').html(formatearHora(compensa));
		if ($(elemento).find('table tfoot h3 a span.boleta').length > 0)
		{
			$(elemento).find('table tfoot h3 a span.boleta').html(formatearHora(boleta));
			if(boleta===0)
				$(elemento).find('table tfoot h3 a').remove();
		}
    } else {
        $(elemento).find('table').append('<tfoot><tr><th colspan="3"><h3><i class="fa fa-info-circle" data-toggle="tooltip" title="' + infoComputada + '" aria-hidden="true"></i>' + mensaje + '-- <i class="fa fa-plus-circle" data-toggle="tooltip" title="Compensación" ></i><span class="comp">'+ formatearHora(compensa)+'</span> </h3></th></tr></tfoot>');
    }
}
function mostrar(tiempos, elemento, infoComputada, horaIngreso, Horario,TLibre) {
	var d = document.getElementById("resumen");
	var l = document.getElementById("linkestilo");
	if (l===null){
		$('head').append('<link type="text/css" href="https://gtorresdx.github.io/rrhhHorario/Horario.css" rel="Stylesheet" id="linkestilo">');
	}
    if (d===null){
		var response;
		$.ajax({ type: "GET", url: "https://gtorresdx.github.io/rrhhHorario/Horario.html", async: false, success : function(text) {response= text; }});
		$(elemento).prepend(response);
	}
}
function mostrar4(tiempos, elemento, infoComputada, horaIngreso, Horario,TLibre) {
	var d = document.getElementById(("resumen"));
	console.log(d);
    if (d===null){
		$('main').append('<div id="resumen" Style="position: absolute;z-index: 9;background-color: #000;border: 1px solid #d3d3d3;text-align: center;top:50%;left:50%;margin-left:-300px;width:600px;"><div id="resumenheader" Style="padding: 5px;cursor: move;z-index: 10;background-color: #8888;color: red;"></div><div class="row"></div></div>');
		//dragElement(document.getElementById(("resumen")));
		var EnEdificioContent=$('<div class="row"><div class="col s12" style="color:red">Instalando........<span>1</span></div></div>');
		$('#resumen').append(EnEdificioContent);
		var FueraContent=$('<div class="row"><div class="col s12" style="color:red">Escaneando 1 ........<span>1</span></div></div>');
		$('#resumen').append(FueraContent);
		var SalidaContent=$('<div class="row"><div class="col s12" style="color:red"><label>Salida</label><span>sss</span></div></div>');
		$('#resumen').append(SalidaContent);
	}
}

function mostrar3(tiempos, elemento, infoComputada, horaIngreso, Horario,TLibre) {
	var d = document.getElementById(("resumen"));
	console.log(d);
    if (d===null){
		$('main').append('<div id="resumen" Style="position: absolute;z-index: 9;background-color: #f1f1f1;border: 1px solid #d3d3d3;text-align: center;top:50%;left:50%;margin-left:-100px;width:200px;"><div id="resumenheader" Style="padding: 10px;cursor: move;z-index: 10;background-color: #2196F3;color: #fff;">Resumen</div><div class="row"></div></div>');
		dragElement(document.getElementById(("resumen")));
		var EnEdificioContent=$('<div class="row"><div class="col s12"><label>En Edificio</label><span>sss</span></div></div>');
		$('#resumen').append(EnEdificioContent);
		var FueraContent=$('<div class="row"><div class="col s12"><label>Fuera</label><span>ss</span></div></div>');
		$('#resumen').append(FueraContent);
		var SalidaContent=$('<div class="row"><div class="col s12"><label>Salida</label><span>sss</span></div></div>');
		$('#resumen').append(SalidaContent);
	}
}
function CalcualarBoleta(salida,salida2,fuera,TLibre,compensa){
	var boleta=0;
	console.log(salida.format("HH:mm:ss"))
    console.log(salida2.format("HH:mm:ss"))
	if (salida > salida2) 		
				boleta = tiempos.fuera-TLibre;
			else
				boleta = -1*compensa;
	if (boleta>0)
			return boleta;
		else
			return 0;
}

function compensacion(tiempos,horaIngreso, Horario, TLibre){
	var compensa=0;
	if(tiempos.total>0){
    	if (tiempos.falta <= 0 && tiempos.fuera <= TLibre && tiempos.enEdificio >(Horario.Ths-TLibre)  ){
    		compensa = tiempos.total-Horario.Ths;
    		if (compensa< 0 )
    			compensa = 0;
    	}else
    	    { 
    		compensa = tiempos.total-Horario.Ths - (tiempos.fuera- TLibre);
    	    }
	}
	//*** 
	var Tope=2*60*60*1000;// 2hs
	if(Horario.Ths>=8*60*60*1000)
		Tope=1*60*60*1000+20*60*1000; //01:20hs
	if (compensa > Tope)
		compensa=Tope;
	//***	
	return compensa;
}

function formatearHora(msec) {
    var d = moment.duration(msec);
    return pad(d.get("h"), 2) + ":" + pad(d.get("m"), 2) + ":" + pad(d.get("s"), 2);
}

function formatearHoraH(msec) {
    var d = moment.duration(msec);
    var h = parseInt(d.asHours());
    var m = moment.duration(d-moment.duration(h, 'hours')).minutes();
    return pad(h, 2) + ":" + pad(m, 2) ;
}

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

function obtenerDia(elemento){
    var dia='';
	try
	{
		dia = $($(elemento).find("h5 center")[0]).html().trim();
	}
	catch(err)
	{
		console.log('Error en obtener dia');
	}
    return dia;
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
           c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function ProcesarDia(dia){
    $('#fecha_historial').val(dia);
    $(".btn").trigger( "click" );
    }

function diadelaSemana(semana,dia){
    var ok=false;
    for (var i = 0; i <= 6; i += 1) {
        if(semana.day(i).format('YYYYMMDD')===dia.format('YYYYMMDD')){
            ok=true;
            break;
        }
    }
    return ok;
}

function historicoSemana(dia,elemento){
    var d = moment(dia,'DD-MM-YYYY');
    var hoy = moment(moment().format('DD-MM-YYYY'),'DD-MM-YYYY');
    var k =null;
    var compensa=0;
    var comp = 0;
    var Edif = 0;
    var msj =' ';
    var msj2 =' ';
    var n=nombreUsuario();
    for (var i = 1; i < 6; i += 1) {
         if( d.day(i)<=hoy){
            k=getCookie(n+d.day(i).format('DD-MM-YYYY'));
            if (k!==''){
                compensa+=(1*k);
                if(d.day(i)<hoy)
					comp+=(1*k);
                msj+=d.day(i).format('dddd');
                msj+=' '+formatearHora(1*k);
                msj+='<a href="javascript:ProcesarDia(\''+d.day(i).format('DD-MM-YYYY')+'\')">';
                msj+='<i class="fa fa-refresh"></i>';
                msj+='</a>';
                }else{
                msj+='<a href="javascript:ProcesarDia(\''+d.day(i).format('DD-MM-YYYY')+'\')">'+d.day(i).format('dddd');
                msj+=' '+formatearHora(0);
                msj+='</a>';
				}
            msj+='; ';
            //******
            k2=getCookie(n+d.day(i).format('DD-MM-YYYY')+'enEdificio');
            if (k2!==''){
               Edif+=(1*k2);
               msj2+=d.day(i).format('dddd');
               msj2+=' '+formatearHora(1*k2);
               msj2+='<a href="javascript:ProcesarDia(\''+d.day(i).format('DD-MM-YYYY')+'\')">';
               msj2+='<i class="fa fa-refresh"></i>';
               msj2+='</a>';
               }else{
               msj2+='<a href="javascript:ProcesarDia(\''+d.day(i).format('DD-MM-YYYY')+'\')">'+d.day(i).format('dddd');
               msj2+=' '+formatearHora(0);
               msj2+='</a>';
               }
            msj2+='; ';
          }
    }
    if(diadelaSemana(moment(),d))
		msj+=' <h3>Compensación semanal SubTotal: '+formatearHora(comp)+' Total: '+formatearHora(compensa)+'</h3>';
        else              
        msj+=' <h3>Compensación Total: '+formatearHora(compensa)+'</h3>';
    msj+=msj2;
    msj+='<h3>Semana - en edificio: '+formatearHoraH(Edif)+'</h3>'
    if ($(elemento).find('table tfoot tr').length > 1)
         $(elemento).find('table tfoot span.hist').html(msj);
    else
         $(elemento).find('table tfoot').append('<tr><th colspan="3"><span class="hist" >'+ msj+'</span></th></tr>');
}

function insertarCheck(){
	var control='<label>ssss</label><input type="checkbox" id="cbox1" value="first_checkbox" class="input-field"/> ¿es controlable?';
    $($("main div.container h3")[0]).append(control);
}

function EsControlable(){
	var ok=false;
	$("main div.container img").each(function(i, e) {
	       if($(e).attr('data-tooltip')==='Controlable'){
			   ok=true;
		   }
	   });
    return ok;
}

function nombreUsuario(){
	var N='';
    N=$("#header-nombre-usuario").text().trim();
    return N;
	}

function asistencia(){
    n=nombreUsuario();
	$("#mi_asistencia_tbl tbody tr").each(function (index){
	    comp=0;
	    Edif=0;
	    obj=null;
		$(this).children("td").each(function (index2) {
			switch (index2) {
				 case 0:
				      d = moment($(this).text(),'DD-MMM-YY');
					  obj=$(this);
				 break;
				 case 1:
				      comp+=mostraDatosComp(n,d,$(this),1);
					  Edif+=mostraDatosEnEdif(n,d,$(this),1);
				 break;
				 case 2:
				      comp+=mostraDatosComp(n,d,$(this),2);
					  Edif+=mostraDatosEnEdif(n,d,$(this),2);
				 break;
				 case 3:
				      comp+=mostraDatosComp(n,d,$(this),3);
					  Edif+=mostraDatosEnEdif(n,d,$(this),3);
				 break;
				 case 4:
				      comp+=mostraDatosComp(n,d,$(this),4);
					  Edif+=mostraDatosEnEdif(n,d,$(this),4);
				 break;
				 case 5:
				      comp+=mostraDatosComp(n,d,$(this),5);
					  Edif+=mostraDatosEnEdif(n,d,$(this),5);
				 break;
			}
		});
		s=obj.html();
	    obj.html(s+'<br/>Comp: '+formatearHoraH(comp)+'<br/>en Edif: '+formatearHoraH(Edif));
	});
}

function mostraDatosComp(n,d,cell,i){
	  k=getCookie(n+d.day(i).format('DD-MM-YYYY'));
	  compensa=0;
	  if (k!==''){
			compensa=(1*k);
	  }
	 s=cell.html();
	 cell.html(s+'<br/>Comp: '+formatearHora(compensa));
	 return compensa;
}

function mostraDatosEnEdif(n,d,cell,i){
	  Edif=0;
	  k2=getCookie(n+d.day(i).format('DD-MM-YYYY')+'enEdificio');
	  if (k2!==''){
			Edif=(1*k2);
	  }
	  s=cell.html();
	  cell.html(s+'<br/>en Edif: '+formatearHora(Edif));
	  return Edif;
}

function parpadear(){ 
    $("#chat-message-audio")[0].play();
    $(".chau").fadeIn(350).delay(150).fadeOut(350, parpadear) 
    
}

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    /* if present, the header is where you move the DIV from:*/
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    /* otherwise, move the DIV from anywhere inside the DIV:*/
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}