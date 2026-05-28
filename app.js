
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://pmqqxqoytswntsejdold.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

let contratos = [];
let filtro = 'todos';

async function cargar() {
    const { data, error } = await supabase.from('contratos').select('*');
    if (error) console.error(error);
    else { contratos = data || []; render(); }
}

async function agregarContrato() {
    const nuevo = {
        contrato: document.getElementById('f-contrato').value.trim(),
        banco: document.getElementById('f-banco').value.trim(),
        tipo: document.getElementById('f-tipo').value,
        medio: document.getElementById('f-medio').value,
        fecha: document.getElementById('f-fecha').value,
        nota: document.getElementById('f-nota').value.trim(),
        publicado: false
    };
    if (!nuevo.contrato || !nuevo.banco) return;
    const { error } = await supabase.from('contratos').insert([nuevo]);
    if (error) alert(error.message);
    else { document.getElementById('f-contrato').value=''; cargar(); }
}

async function marcarPublicado(id) {
    const c = contratos.find(x => x.id === id);
    const { error } = await supabase.from('contratos').update({ publicado: !c.publicado }).eq('id', id);
    if (!error) cargar();
}

async function eliminar(id) {
    const { error } = await supabase.from('contratos').delete().eq('id', id);
    if (!error) cargar();
}

async function limpiarPublicados() {
    if (confirm("¿Borrar todos los publicados?")) {
        const { error } = await supabase.from('contratos').delete().eq('publicado', true);
        if (!error) cargar();
    }
}

// ... AQUÍ COPIA TU FUNCIÓN RENDER Y EL RESTO DE TUS HELPERS (diasDiff, alertaActiva, etc.) ...
// Asegúrate de eliminar cualquier referencia a localStorage en esas funciones.
// Funciones auxiliares y de visualización
function hoy() {
    const d = new Date(); d.setHours(0,0,0,0); return d;
}

function diasDiff(fechaStr) {
    const pub = new Date(fechaStr + 'T00:00:00');
    const diff = pub - hoy();
    return Math.round(diff / 86400000);
}

function alertaActiva(c) {
    if (c.publicado) return false;
    const d = diasDiff(c.fecha);
    return d === 1 || d === 0;
}

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function fmtFecha(str) {
    const [y,m,d] = str.split('-');
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return `${parseInt(d)} ${meses[parseInt(m)-1]} ${y}`;
}

function diasLabel(c) {
    if (c.publicado) return '';
    const d = diasDiff(c.fecha);
    if (d < 0) return `<span class="dias-badge dias-pasado">${Math.abs(d)} día${Math.abs(d)!==1?'s':''} vencido</span>`;
    if (d === 0) return `<span class="dias-badge dias-hoy">Hoy</span>`;
    if (d === 1) return `<span class="dias-badge dias-manana">Mañana</span>`;
    return `<span class="dias-badge dias-futuro">En ${d} días</span>`;
}

function setFiltro(f, btn) {
    filtro = f;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render();
}

function render() {
    const ahora = new Date().toLocaleDateString('es-HN',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    document.getElementById('fecha-hoy').textContent = ahora;

    const alertas = contratos.filter(c => alertaActiva(c));
    const pendientes = contratos.filter(c => !c.publicado);
    const publicados = contratos.filter(c => c.publicado);

    document.getElementById('st-total').textContent = contratos.length;
    document.getElementById('st-alerta').textContent = alertas.length;
    document.getElementById('st-pend').textContent = pendientes.length;
    document.getElementById('st-pub').textContent = publicados.length;

    const banner = document.getElementById('banner-alertas');
    if (alertas.length) {
        banner.innerHTML = `<div class="alert-banner alert-warn"><div><strong>Verificar ${alertas.length} contrato${alertas.length>1?'s':''}:</strong><div class="alert-list">${alertas.map(c=>`<div>Contrato <strong>${esc(c.contrato)}</strong> — ${esc(c.banco)} publica ${diasDiff(c.fecha)===0?'hoy':'mañana'}</div>`).join('')}</div></div></div>`;
    } else {
        banner.innerHTML = `<div class="alert-banner alert-ok"><span>Sin alertas urgentes.</span></div>`;
    }

    let lista = [...contratos].sort((a,b) => a.fecha.localeCompare(b.fecha));
    if (filtro === 'alerta') lista = lista.filter(c => alertaActiva(c));
    else if (filtro === 'pendiente') lista = lista.filter(c => !c.publicado);
    else if (filtro === 'publicado') lista = lista.filter(c => c.publicado);

    const cont = document.getElementById('lista-contratos');
    if (!lista.length) {
        cont.innerHTML = `<div class="empty-state">No hay contratos para mostrar.</div>`;
        return;
    }

    cont.innerHTML = lista.map(c => {
        const estadoTxt = c.publicado ? 'Publicado' : 'Pendiente';
        return `<div class="contract-card">
            <div class="cc-top">
                <div class="cc-main">
                    <div class="cc-banco">${esc(c.banco)} (#${esc(c.contrato)})</div>
                    <div class="cc-meta">
                        <span>${esc(c.medio)}</span> | <span>${esc(c.tipo)}</span> | <span>${estadoTxt}</span>
                        <span>${fmtFecha(c.fecha)}</span> ${diasLabel(c)}
                    </div>
                </div>
                <div class="cc-actions">
                    <button class="cc-btn" onclick="marcarPublicado(${c.id})">✅</button>
                    <button class="cc-btn del" onclick="eliminar(${c.id})">🗑️</button>
                </div>
            </div>
            ${c.nota ? `<div class="cc-nota">${esc(c.nota)}</div>` : ''}
        </div>`;
    }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('f-fecha').value = new Date().toISOString().slice(0, 10);
    cargar();
});
