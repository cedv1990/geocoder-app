const form = document.getElementsByTagName('form')[0],
    btnConsulta = document.getElementById('btnConsulta'),
    txtDirecciones = document.getElementById('txt-direcciones'),
    jumboResult = document.getElementById('jumboResult'),
    tbl = document.getElementById('tbl'),
    spnEncontrados = document.getElementById('spnEncontrados'),
    spnFallidos = document.getElementById('spnFallidos'),
    spnFaltan = document.getElementById('spnFaltan'),
    spnTiempo = document.getElementById('spnTiempo'),
    columnas = document.querySelectorAll('[field][orderable="true"],[field][filtrable="true"], [field][orderable="true"] > i,[field][filtrable="true"] > i'),
    menu = document.getElementById('menu'),
    tabla = document.querySelector('table'),
    btnRestaura = document.querySelector('.limpiar-filtros > button');

let nOk,
    nEr,
    nTo,
    numeroRecursiones,
    direcciones,
    time,
    eventosColumnasActivos = false,
    objFiltros = {};

const worker = new Worker('js/service.js');

const mostrarDirecciones = _ => {
    jumboResult.removeAttribute('style');
    nTo = direcciones.length;
    tbl.innerHTML = '';
    spnFaltan.innerHTML = direcciones.length.toString();
    spnEncontrados.innerHTML = '0';
    spnFallidos.innerHTML = '0';

    direcciones = direcciones.map((dir, index) => { return { dir: dir, index: index } });

    tabla.classList.add('searching');

    direcciones.forEach(dir => crearFilaConsultando(dir.dir, dir.index));

    numeroRecursiones = 0;
    consultar(200);

    btnConsulta.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
};

const crearFilaConsultando = (dir, index) => {
    let tr = document.createElement('tr');
    tr.setAttribute('id', 'tr-' + index);

    let td = document.createElement('td');
    td.setAttribute('colspan', '7');
    td.setAttribute('id', 'td-' + index);

    let img = document.createElement('img');
    img.setAttribute('src', 'css/searching.gif');
    img.setAttribute('height', '30');

    td.appendChild(img);
    td.appendChild(document.createTextNode(' Consultando dirección: ' + dir));
    tr.appendChild(td);
    tbl.appendChild(tr);
};

const terminoProceso = _ => (nTo - (nOk + nEr)) === 0;

const mostrarNumeros = _ => {
    spnEncontrados.innerHTML = nOk;
    spnFallidos.innerHTML = nEr;
    spnFaltan.innerHTML = nTo - (nOk + nEr);
    if ((nOk + nEr) % 200 == 0) {
        consultar(200);
    }
    if (terminoProceso()) {
        tabla.classList.remove('searching');

        let tiempo = new Date().getTime() - time;
        tiempo/=1000;
        let hours = Math.floor( tiempo / 3600 );  
        let minutes = Math.floor( (tiempo % 3600) / 60 );
        let seconds = tiempo % 60;

        minutes = minutes < 10 ? '0' + minutes : minutes;
        
        seconds = seconds < 10 ? '0' + seconds : seconds;

        spnTiempo.innerHTML = `<i class="fas fa-stopwatch"></i> Tiempo de consulta: ${hours}:${minutes}:${round(seconds, 3)}`;

        inicializarFiltros();
        eventosColumnasActivos = true;
    }
};

const consultar = n => {
    let d = direcciones.slice(numeroRecursiones * n, (numeroRecursiones * n) + n);
    numeroRecursiones++;

    for (let i = 0; i < n && i < d.length; i++) {
        worker.postMessage({ 'cmd': 'consultar', 'dir': d[i].dir, 'id': d[i].index });
    }
};

const crearFilaResultado = (result, id, dir, sum = true) => {
    if (!result) {
        let td = document.getElementById('td-' + id);
        td.innerHTML = '';

        let p = document.createElement('p');
        p.classList.add('text-warning');
        p.innerHTML = 'Falló la búsqueda de la dirección ' + dir;

        td.appendChild(p);
        if (sum) {
            nEr++;
            mostrarNumeros();
        }
        return;
    }

    let { dirinput, dirtrad, tipo_direccion, cpocodigo, nomseccat, codseccat, localidad, latitude, longitude } = result;

    let tr = document.getElementById('tr-' + id);
    tr.innerHTML = '';

    let agregarTd = t => {
        let td = document.createElement('td');
        td.appendChild(document.createTextNode(t))
        tr.appendChild(td);
    }

    agregarTd(dirinput);
    agregarTd(dirtrad);
    agregarTd(tipo_direccion);
    agregarTd(cpocodigo);
    agregarTd(nomseccat + ' (Cód.: ' + codseccat + ')');
    agregarTd(localidad);

    let td = document.createElement('td');
    let a = document.createElement('a');
    a.setAttribute('href', `https://www.google.com/maps/?q=${latitude},${longitude}`);
    a.setAttribute('target', '_blank');
    a.classList.add('btn'); 
    a.classList.add('btn-link');
    a.innerHTML = 'Ver';
    td.appendChild(a);
    tr.appendChild(td);

    if (sum) {
        direcciones[id].data = { dirinput, dirtrad, tipo_direccion, cpocodigo, nomseccat, codseccat, localidad, latitude, longitude };
        nOk++;
        mostrarNumeros();
    }
};

const round = (num, decimales = 2) => {
    let signo = (num >= 0 ? 1 : -1);
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

const pintarTablaFiltrada = (data, restaurar = true) => {
    data.forEach(obj => {
        crearFilaConsultando(obj.dir, obj.index);
        crearFilaResultado(obj.data, obj.index, obj.dir, false);
    });
    if (restaurar)
        btnRestaura.classList.add('visible');
};

const filtrarDatos = (field, text) => {
    tbl.innerHTML = '';
    tbl.data = direcciones.filter(a => a.data && a.data[field].toLowerCase().lastIndexOf(text) >= 0);
    pintarTablaFiltrada(tbl.data);
};

const ordenarDatos = (field, asc) => {
    tbl.innerHTML = '';
    let ordered = tbl.data.filter(a => a.data).sort((a, b) => {
        if (a.data[field].toLowerCase() > b.data[field].toLowerCase())
            return 1;
        else if (b.data[field].toLowerCase() > a.data[field].toLowerCase())
            return -1;
        return 0;
    });
    if (!asc) ordered.reverse();

    tbl.data = ordered.concat(tbl.data.filter(a => !a.data));

    pintarTablaFiltrada(tbl.data);
};

const inicializarFiltros = _ => {
    if(!eventosColumnasActivos) {
        let mostrarMenu = ({ top, left, filtrable, orderable, field }) => {
            objFiltros[field] = objFiltros[field] || {};

            menu.setAttribute('style', `top: ${top}px; left: ${left}px;`);
            menu.classList.add('visible');
            
            if (filtrable) {
                var divfilter = document.createElement('div');
                var txtFilter = document.createElement('input');
                txtFilter.field = field;
                txtFilter.classList.add('form-control');
                if (objFiltros[field] && objFiltros[field].filterText)
                    txtFilter.value = objFiltros[field].filterText;

                txtFilter.onkeyup = function() {
                    filtrarDatos(this.field, this.value);
                    objFiltros[this.field].filterText = this.value
                };

                var icon = document.createElement('i');
                icon.classList.add('fas');
                icon.classList.add('fa-search');
                divfilter.appendChild(icon);
                divfilter.appendChild(txtFilter);
                menu.appendChild(divfilter);
            }
            if (orderable) {
                var orderAscending = document.createElement('div');
                orderAscending.innerHTML = '<i class="fas fa-sort-alpha-down"></i> Ordenar A-Z';
                orderAscending.field = field;
                orderAscending.onclick = function () {
                    ordenarDatos(this.field, true);
                    objFiltros[field].orderedAsc = true;
                    objFiltros[field].orderedDes = false;
                };
                menu.appendChild(orderAscending);

                var orderDescending = document.createElement('div');
                orderDescending.innerHTML = '<i class="fas fa-sort-alpha-up"></i> Ordenar Z-A';
                orderDescending.field = field;
                orderDescending.onclick = function () {
                    ordenarDatos(this.field, false);
                    objFiltros[field].orderedAsc = false;
                    objFiltros[field].orderedDes = true;
                };
                menu.appendChild(orderDescending);
            }
        };

        columnas.forEach(col => {
            col.addEventListener('click', e => {
                e.preventDefault();
                if (!tabla.classList.contains('searching')){
                    var element = e.target;
                    if (element.tagName !== 'TH') element = e.target.parentNode;
                    menu.innerHTML = '';
                    var { top, left, height } = element.getBoundingClientRect();
                    var filtrable = element.getAttribute('filtrable') === 'true';
                    var orderable = element.getAttribute('orderable') === 'true';
                    var field = element.getAttribute('field');
                    mostrarMenu({top: top + height + window.scrollY, left, filtrable, orderable, field});
                }
            });
        });

        tbl.data = direcciones;
    }
}

worker.addEventListener('message', e => {
    let { id, data, dir } = e.data;
    crearFilaResultado(data, id, dir);
});

document.querySelectorAll('.year').forEach(el => el.innerHTML = new Date().getFullYear());

document.body.onclick = e => {
    if (
        (!e.target.getAttribute('field') && !e.target.parentNode.getAttribute('field'))
        ||
        (e.target.getAttribute('filtrable') === 'false' && e.target.getAttribute('orderable') === 'false')
        ||
        (e.target.parentNode.getAttribute('filtrable') === 'false' && e.target.parentNode.getAttribute('orderable') === 'false')
    ) {
        if (e.target.tagName !== 'INPUT')
            menu.classList.remove('visible');
    }
};

btnRestaura.onclick = function() {
    this.classList.remove('visible');
    objFiltros = {};

    tbl.innerHTML = '';

    pintarTablaFiltrada(direcciones, false);

    tbl.data = direcciones;
};

const onScroll = _ => menu.classList.remove('visible');

document.querySelector('.table-responsive-md').onscroll = onScroll;

document.querySelector('.table-responsive-md').ontouchmove = onScroll;

form.onsubmit = e => e.preventDefault();

btnConsulta.onclick = _ => {
    if (form.checkValidity()) {
        nOk = 0;
        nEr = 0;
        nTo = 0;
        time = new Date().getTime();
        spnTiempo.innerHTML = '';
        objFiltros = {};
        eventosColumnasActivos = false;
        direcciones = txtDirecciones.value.split('\n').filter(dir => dir.replace(/ /ig, '') !== '');
        mostrarDirecciones();
    }
};