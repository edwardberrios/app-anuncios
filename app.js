const CKEY = 'anuncios_clientes_v2';
let contratos = [];
let filtro = 'todos';

const hoy = () => {
  const d = new Date(); d.setHours(0,0,0,0); return d;
};

function diasDiff(fechaStr) {
  const pub = new Date(fechaStr + 'T00:00:00');
  const diff = pub - hoy();
  return Math.round(diff / 86400000);
}

function estadoContrato(c) {
  const d = diasDiff(c.fecha);
  if (c.publicado) return 'publicado';
  if (d < 0) return 'vencido';
  return 'pendiente';
}

function alertaActiva(c) {
  if (c.publicado) return false;
  const d = diasDiff(c.fecha);
  return d === 1 || d === 0;
}

// Usa directamente localStorage
async function cargar() {
  try {
    const data = localStorage.getItem(CKEY);
    contratos = data ? JSON.parse(data) : [];
  } catch(e) { 
    contratos = []; 
  }
  
  if (!contratos.length) {
    // Tus datos de ejemplo iniciales...
   // const base = new Date(); base.setHours(0,0,0,0);
    //const fmt = (d) => { const dd = new Date(base); dd.setDate(dd.getDate()+d); return dd.toISOString().slice(0,10); };
   // contratos = [
  //    {id:1, contrato:'2024-101', banco:'Banco Atlántida', tipo:'Subasta', medio:'Heraldo', fecha: fmt(1), nota:'Verificar página par', publicado:false},
  //    {id:2, contrato:'2024-102', banco:'Banco Occidente', tipo:'Edicto', medio:'La Prensa', fecha: fmt(3), nota:'', publicado:false}
 //   ];
  }
  render();
}

async function guardar() {
  localStorage.setItem(CKEY, JSON.stringify(contratos));
}

function agregarContrato() {
  const contrato = document.getElementById('f-contrato').value.trim();
  const banco = document.getElementById('f-banco').value.trim();
  const tipo = document.getElementById('f-tipo').value;
  const medio = document.getElementById('f-medio').value;
  const fecha = document.getElementById('f-fecha').value;
  const nota = document.getElementById('f-nota').value.trim();
  if (!contrato || !banco || !fecha) {
    const err = !contrato ? 'f-contrato' : !banco ? 'f-banco' : 'f-fecha';
    document.getElementById(err).focus(); return;
  }
  contratos.push({id: Date.now(), contrato, banco, tipo, medio, fecha, nota, publicado: false});
  document.getElementById('f-contrato').value='';
  document.getElementById('f-banco').value='';
  document.getElementById('f-nota').value='';
  document.getElementById('f-fecha').value='';
  guardar(); render();
}

function marcarPublicado(id) {
  const c = contratos.find(x=>x.id===id);
  if (c) { c.publicado = !c.publicado; guardar(); render(); }
}

function eliminar(id) {
  contratos = contratos.filter(x=>x.id!==id);
  guardar(); render();
}

function setFiltro(f, btn) {
  filtro = f;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

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

function render() {
  const ahora = new Date().toLocaleDateString('es-HN',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  document.getElementById('fecha-hoy').textContent = ahora;

  const alertas = contratos.filter(c=>alertaActiva(c));
  const pendientes = contratos.filter(c=>!c.publicado);
  const publicados = contratos.filter(c=>c.publicado);

  document.getElementById('st-total').textContent = contratos.length;
  document.getElementById('st-alerta').textContent = alertas.length;
  document.getElementById('st-pend').textContent = pendientes.length;
  document.getElementById('st-pub').textContent = publicados.length;

  const banner = document.getElementById('banner-alertas');
  if (alertas.length) {
    banner.innerHTML = `<div class="alert-banner alert-warn"><i class="ti ti-bell" aria-hidden="true"></i><div><strong>Verificar ${alertas.length} contrato${alertas.length>1?'s':''}:</strong><div class="alert-list">${alertas.map(c=>`<div>Contrato <strong>${esc(c.contrato)}</strong> — ${esc(c.banco)} en ${esc(c.medio)} (${esc(c.tipo)}) publica ${diasDiff(c.fecha)===0?'hoy':'mañana'} ${fmtFecha(c.fecha)}</div>`).join('')}</div></div></div>`;
  } else {
    banner.innerHTML = `<div class="alert-banner alert-ok"><i class="ti ti-circle-check" aria-hidden="true"></i><span>Sin alertas urgentes para hoy ni mañana.</span></div>`;
  }

  let lista = [...contratos].sort((a,b)=>a.fecha.localeCompare(b.fecha));
  if (filtro === 'alerta') lista = lista.filter(c=>alertaActiva(c));
  else if (filtro === 'pendiente') lista = lista.filter(c=>!c.publicado);
  else if (filtro === 'publicado') lista = lista.filter(c=>c.publicado);

  const cont = document.getElementById('lista-contratos');
  if (!lista.length) {
    cont.innerHTML = `<div class="empty-state"><i class="ti ti-file-off" aria-hidden="true"></i>No hay contratos para mostrar.</div>`;
    return;
  }

  cont.innerHTML = lista.map(c => {
    const esAlerta = alertaActiva(c);
    const medioPill = c.medio === 'Heraldo' ? 'pill-heraldo' : 'pill-laprensa';
    const tipoPill = c.tipo === 'Subasta' ? 'pill-subasta' : 'pill-edicto';
    const estadoPill = c.publicado ? 'pill-publicado' : 'pill-pendiente';
    const estadoTxt = c.publicado ? 'Publicado' : 'Pendiente';
    return `<div class="contract-card${esAlerta?' alerta-hoy':''}${c.publicado?' publicado':''}">
      <div class="cc-top">
        <div class="cc-main">
          <div class="cc-banco">${esc(c.banco)} <span style="font-size:12px;font-weight:400;color:var(--color-text-secondary)">#${esc(c.contrato)}</span></div>
          <div class="cc-meta">
            <span class="pill ${medioPill}">${esc(c.medio)}</span>
            <span class="pill ${tipoPill}">${esc(c.tipo)}</span>
            <span class="pill ${estadoPill}">${estadoTxt}</span>
            <span style="font-size:12px;color:var(--color-text-secondary);display:flex;align-items:center;gap:3px"><i class="ti ti-calendar" style="font-size:13px" aria-hidden="true"></i>${fmtFecha(c.fecha)}</span>
            ${diasLabel(c)}
          </div>
        </div>
        <div class="cc-actions">
          <button class="cc-btn" onclick="marcarPublicado(${c.id})" title="${c.publicado?'Marcar pendiente':'Marcar publicado'}"><i class="ti ti-${c.publicado?'rotate-clockwise':'circle-check'}" aria-hidden="true"></i></button>
          <button class="cc-btn del" onclick="eliminar(${c.id})" title="Eliminar"><i class="ti ti-trash" aria-hidden="true"></i></button>
        </div>
      </div>
      ${c.nota ? `<div class="cc-nota"><i class="ti ti-note" style="font-size:13px;vertical-align:-2px;margin-right:4px" aria-hidden="true"></i>${esc(c.nota)}</div>` : ''}
    </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', ()=>{
  const today = new Date().toISOString().slice(0,10);
  document.getElementById('f-fecha').value = today;
});
document.getElementById('f-fecha').value = new Date().toISOString().slice(0,10);

cargar();
