import test from 'node:test';
import assert from 'node:assert/strict';
import { prevalidarActivacionD2 } from '../src/prevalidacionActivacionD2.mjs';
const tiendas=[{id:'minka',n:'Minka',f:'Supermayorista',fechaApertura:'2020-01-01'},{id:'nueva',n:'Nueva',f:'Market',fechaApertura:'2026-12-01'}];
const propuesta={id:'previa',actividadId:'grid',tipo:'Promocional',objetoEvaluacion:'Grid en góndola',inicio:'2026-11-23',fin:'2026-11-27',frecuencia:'semanal',diasSemana:[1,2,3,4,5],horaCorte:'10:30',alcance:{tiendaIds:['minka']},asignaciones:[{tiendaId:'minka'}],entregables:[{id:'implementacion',nombre:'Grid',puntosMaximos:10}],estado:'borrador',activo:false};
const correr=(p,otros=[])=>prevalidarActivacionD2({propuesta:p,tiendas,programaciones:otros,fechaHoraConsulta:'2026-11-19T14:00'});
test('cinco obligaciones de Minka en S4 pasan a revisión sin activarse',()=>{const r=correr(propuesta);assert.equal(r.listoParaRevision,true);assert.equal(r.estado,'lista_para_revision');assert.equal(r.totales.obligaciones,5);assert.deepEqual(r.totales.porSemana,[['2026-11 · S4',5]]);});
test('tienda que todavía no abrió no genera obligaciones ni se autoriza',()=>{const r=correr({...propuesta,alcance:{tiendaIds:['nueva']},asignaciones:[{tiendaId:'nueva'}]});assert.equal(r.listoParaRevision,false);assert.match(r.errores.join(' '),/No hay obligaciones/);});
test('programación repetida activa bloquea posibles duplicidades',()=>{const existente={...propuesta,id:'activa',estado:'activa',activo:true};const r=correr(propuesta,[existente]);assert.equal(r.listoParaRevision,false);assert.equal(r.conflictos,5);});
test('borradores no son obligaciones activas y no bloquean',()=>{const r=correr(propuesta,[{...propuesta,id:'otro',estado:'borrador',activo:false}]);assert.equal(r.listoParaRevision,true);});
test('actividad diferente en Minka el mismo día no es duplicada',()=>{const r=correr(propuesta,[{...propuesta,id:'otra-actividad',actividadId:'material-pop',estado:'activa',activo:true}]);assert.equal(r.listoParaRevision,true);});
test('tienda diferente el mismo día no es duplicada',()=>{const r=correr(propuesta,[{...propuesta,id:'otra-tienda',alcance:{tiendaIds:['nueva']},asignaciones:[{tiendaId:'nueva'}],estado:'activa',activo:true}]);assert.equal(r.listoParaRevision,true);});
test('programación incompleta impide revisión',()=>{const r=correr({...propuesta,alcance:{tiendaIds:[]},asignaciones:[]});assert.equal(r.listoParaRevision,false);});
test('falta de fecha de consulta bloquea cálculo',()=>{const r=prevalidarActivacionD2({propuesta,tiendas});assert.equal(r.listoParaRevision,false);});
test('inicio pasado presenta aviso de retroactividad sin borrar historia',()=>{const r=prevalidarActivacionD2({propuesta:{...propuesta,inicio:'2026-11-16',fin:'2026-11-20'},tiendas,fechaHoraConsulta:'2026-11-19T14:00'});assert.ok(r.avisos.some(x=>x.includes('retroactiva')));});

test('dos objetos diferentes de la misma actividad no se bloquean',()=>{const r=correr(propuesta,[{...propuesta,id:'otro-objeto',objetoEvaluacion:'Carteles exteriores',estado:'activa',activo:true}]);assert.equal(r.listoParaRevision,true);});
