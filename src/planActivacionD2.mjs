/** D2 P5: plan de activacion EN MEMORIA. No escribe, aprueba ni activa en Firestore. */
import { proyectarBorradorD2 } from './modeloProgramacionesD2.mjs';
import { prevalidarActivacionD2 } from './prevalidacionActivacionD2.mjs';

const fechaValida = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s ?? '')) && !Number.isNaN(Date.parse(`${s}T12:00:00Z`));
const semana = d => `${d.slice(0,7)} · S${Math.min(5,Math.ceil(Number(d.slice(8,10))/7))}`;
const n = v => Number.isFinite(Number(v)) ? Number(v) : 0;

/** Solo para visualizar impacto propuesto; NUNCA una orden para activar. */
export function prepararPlanActivacionD2({propuesta,tiendas=[],programaciones=[],fechaHoraConsulta}={}) {
  const revision = prevalidarActivacionD2({propuesta,tiendas,programaciones,fechaHoraConsulta});
  const muestra = proyectarBorradorD2(propuesta,tiendas);
  const fechaConsulta = String(fechaHoraConsulta ?? '').slice(0,10);
  const porTienda = new Map(), porSemana = new Map();
  let anteriores=0, hoy=0, futuras=0, puntosMaximos=0;
  for(const o of muestra.obligaciones){
    const fecha=o.fechaInicio;
    if(fecha<fechaConsulta) anteriores++;
    else if(fecha===fechaConsulta) hoy++;
    else futuras++;
    puntosMaximos+=n(o.puntosMaximos);
    const tid=String(o.tiendaId),s=semana(fecha);
    if(!porTienda.has(tid))porTienda.set(tid,{tiendaId:tid,obligaciones:0,puntosMaximos:0,primerDia:fecha,ultimoDia:fecha});
    const t=porTienda.get(tid);
    t.obligaciones++;t.puntosMaximos+=n(o.puntosMaximos);
    if(fecha<t.primerDia)t.primerDia=fecha;
    if(fecha>t.ultimoDia)t.ultimoDia=fecha;
    if(!porSemana.has(s))porSemana.set(s,{periodo:s,obligaciones:0,puntosMaximos:0});
    const w=porSemana.get(s);w.obligaciones++;w.puntosMaximos+=n(o.puntosMaximos);
  }
  const avisos=[...revision.avisos];
  if(anteriores>0)avisos.push(`${anteriores} ejecuciones propuestas tienen fecha anterior a la consulta. Nunca se deben penalizar retroactivamente al activar.`);
  if(!fechaValida(fechaConsulta))avisos.push('La fecha de consulta no es valida.');
  return {
    estado:revision.errores.length?'bloqueado':'apto_para_solicitar_revision',
    soloSimulacion:true, puedeActivarse:false, puedeModificarPuntajes:false,
    errores:revision.errores,avisos:[...new Set(avisos)],
    resumen:{obligaciones:muestra.obligaciones.length,tiendas:porTienda.size,puntosMaximos,anteriores,hoy,futuras},
    porTienda:[...porTienda.values()].sort((a,b)=>a.tiendaId.localeCompare(b.tiendaId)),
    porSemana:[...porSemana.values()].sort((a,b)=>a.periodo.localeCompare(b.periodo)),
    controlRequerido:['Aprobacion por usuario autorizado distinto del creador','Persistencia con auditoria y version congelada','Verificacion de duplicados en transaccion','Regla explicita de inicio sin penalizacion retroactiva','Permisos Firestore verificados'],
  };
}
