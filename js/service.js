var consultaDireccion = function (dir, id) {
    dir = dir.replace(/av cl/gi, 'CL');
    dir = dir.replace(/av kr/gi, 'KR');
    dir = dir.replace(/av|ka|kr kr/gi, 'KR');
    dir = dir.replace(/[^a-z0-9]|BGDE|MANGA|LAGUITO/gi, ' ');

    fetch('https://catalogopmb.catastrobogota.gov.co/PMBWeb/web/geocodificador?cmd=geocodificar&query=' + dir)
    .then(res => {
        if (res.ok) 
            res.json().then(r => {
                if (r.response.data)
                    self.postMessage({data:r.response.data,id:id,dir:dir});
                else
                    self.postMessage({data:null,id:id,dir:dir});
            });
        else
            self.postMessage({data:null,id:id,dir:dir});
    })
    .catch(e => {
        console.log(e, {id:id,dir:dir});
        self.postMessage({data:null,id:id,dir:dir});
    });
}

self.addEventListener('message', function (e) {
    var data = e.data;
    var { dir, id } = data;
    switch (data.cmd) {
        case 'consultar':
            consultaDireccion(dir, id);
            break;
        default:
            self.postMessage({ 'result': 'comandoDesconocido' });
    };
}, false);