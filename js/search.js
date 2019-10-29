var form = document.getElementsByTagName('form')[0];
var btnConsulta = document.getElementById('btnConsulta');
var txtDirecciones = document.getElementById('txt-direcciones');
var jumboResult = document.getElementById('jumboResult');
var tbl = document.getElementById('tbl');
var spnEncontrados = document.getElementById('spnEncontrados');
var spnFallidos = document.getElementById('spnFallidos');
var spnFaltan = document.getElementById('spnFaltan');
var spnTiempo = document.getElementById('spnTiempo');

var nOk,
    nEr,
    nTo,
    numeroRecursiones,
    direcciones,
    time;

var worker = new Worker('js/service.js');

form.onsubmit = function(e) {
    e.preventDefault();
};

btnConsulta.onclick = function() {
    if (form.checkValidity()) {
        nOk = 0;
        nEr = 0;
        nTo = 0;
        time = new Date().getTime();
        spnTiempo.innerHTML = '';
        direcciones = txtDirecciones.value.split('\n');
        mostrarDirecciones();
    }
};

var mostrarDirecciones = function() {
    jumboResult.removeAttribute('style');
    nTo = direcciones.length;
    tbl.innerHTML = '';
    spnFaltan.innerHTML = direcciones.length.toString();
    spnEncontrados.innerHTML = '0';
    spnFallidos.innerHTML = '0';

    direcciones = direcciones.map(function(dir, index){ return { dir: dir, index: index }; });

    direcciones.forEach(function(dir) {
        crearFilaConsultando(dir.dir, dir.index);
    });

    numeroRecursiones = 0;
    consultar(200);

    btnConsulta.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
};

var crearFilaConsultando = function(dir, index) {
    var tr = document.createElement('tr');
    tr.setAttribute('id', 'tr-' + index);

    var td = document.createElement('td');
    td.setAttribute('colspan', '7');
    td.setAttribute('id', 'td-' + index);

    var img = document.createElement('img');
    img.setAttribute('src', 'css/searching.gif');
    img.setAttribute('height', '30');

    td.appendChild(img);
    tr.appendChild(td);
    tbl.appendChild(tr);
};

var mostrarNumeros = function() {
    spnEncontrados.innerHTML = nOk;
    spnFallidos.innerHTML = nEr;
    spnFaltan.innerHTML = nTo - (nOk + nEr);
    if ((nOk + nEr) % 200 == 0) {
        consultar(200);
    }
    if ((nTo - (nOk + nEr)) === 0) {
        var tiempo = new Date().getTime() - time;
        tiempo/=1000;
        var hours = Math.floor( tiempo / 3600 );  
        var minutes = Math.floor( (tiempo % 3600) / 60 );
        var seconds = tiempo % 60;

        minutes = minutes < 10 ? '0' + minutes : minutes;
        
        seconds = seconds < 10 ? '0' + seconds : seconds;

        spnTiempo.innerHTML = `<i class="fas fa-stopwatch"></i> Tiempo de consulta: ${hours}:${minutes}:${round(seconds, 3)}`;
    }
};

var consultar = function(n) {
    var d = direcciones.slice(numeroRecursiones * n, (numeroRecursiones * n) + n);
    numeroRecursiones++;

    for (var i = 0; i < n && i < d.length; i++) {
        worker.postMessage({ 'cmd': 'consultar', 'dir': d[i].dir, 'id': d[i].index });
    }
};

var crearFilaResultado = function(result, id, dir) {
    if (!result) {
        var td = document.getElementById('td-' + id);
        td.innerHTML = '';

        var p = document.createElement('p');
        p.classList.add('text-warning');
        p.innerHTML = 'Falló la búsqueda de la dirección ' + dir;

        td.appendChild(p);
        nEr++;
        mostrarNumeros();
        return;
    }

    var { dirinput, dirtrad, tipo_direccion, cpocodigo, nomseccat, codseccat, localidad, latitude, longitude } = result;

    var tr = document.getElementById('tr-' + id);
    tr.innerHTML = '';

    var agregarTd = function(t) {
        var td = document.createElement('td');
        td.appendChild(document.createTextNode(t))
        tr.appendChild(td);
    }

    agregarTd(dirinput);
    agregarTd(dirtrad);
    agregarTd(tipo_direccion);
    agregarTd(cpocodigo);
    agregarTd(nomseccat + ' (Cód.: ' + codseccat + ')');
    agregarTd(localidad);

    var td = document.createElement('td');
    var a = document.createElement('a');
    a.setAttribute('href', `https://www.google.com/maps/?q=${latitude},${longitude}`);
    a.setAttribute('target', '_blank');
    a.classList.add('btn'); 
    a.classList.add('btn-link');
    a.innerHTML = 'Ver';
    td.appendChild(a);
    tr.appendChild(td);

    nOk++;
    mostrarNumeros();
};

var round = function (num, decimales = 2) {
    var signo = (num >= 0 ? 1 : -1);
    num = num * signo;
    if (decimales === 0) //con 0 decimales
        return signo * Math.round(num);
    // round(x * 10 ^ decimales)
    num = num.toString().split('e');
    num = Math.round(+(num[0] + 'e' + (num[1] ? (+num[1] + decimales) : decimales)));
    // x * 10 ^ (-decimales)
    num = num.toString().split('e');
    return signo * (num[0] + 'e' + (num[1] ? (+num[1] - decimales) : -decimales));
}

worker.addEventListener('message', function (e) {
    var { id, data, dir } = e.data;
    crearFilaResultado(data, id, dir);
});

document.querySelectorAll('.year').forEach(function(el) {
    el.innerHTML = new Date().getFullYear();
});