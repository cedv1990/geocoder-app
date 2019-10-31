const consultaDireccion = (dir, id) => {
    let dirOriginal = dir;
    dir = dir.replace(/av cl/gi, 'CL');
    dir = dir.replace(/av kr/gi, 'KR');
    dir = dir.replace(/av|ka|kr kr/gi, 'KR');
    dir = dir.replace(/[^a-z0-9]|BGDE|MANGA|LAGUITO/gi, ' ');

    fetch('https://catalogopmb.catastrobogota.gov.co/PMBWeb/web/geocodificador?cmd=geocodificar&query=' + dir)
    .then(res => {
        if (res.ok) 
            res.json().then(r => {
                if (r.response.data)
                    self.postMessage({ data: r.response.data, id, dir });
                else
                    self.postMessage({ data: null, id, dir: dirOriginal });
            });
        else
            self.postMessage({ data: null, id, dir: dirOriginal });
    })
    .catch(e => {
        console.log(e, { id, dir: dirOriginal });
        self.postMessage({ data: null, id, dir: dirOriginal });
    });
};

self.addEventListener('message', e => {
    let data = e.data;
    let { dir, id } = data;
    switch (data.cmd) {
        case 'consultar':
            consultaDireccion(dir, id);
            break;
        default:
            self.postMessage({ 'result': 'comandoDesconocido' });
    }
}, false);