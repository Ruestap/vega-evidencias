import test from 'node:test';
import assert from 'node:assert/strict';
import {analizarD2Shadow} from '../src/analisisShadowD2.mjs';
const tienda={id:'t1',idTienda:'127',n:'Vega Cedros',f:'Market',zonaId:'05',fechaApertura:'2026-01-01',fechaInicioEvidencias:'2026-01-01',activa:true};
const act={id:'a1',n:'Campana',cat:'Campaña',inicioEvaluacion:'2026-11-01'};
const prog={id:'p1',actividadId:'a1',tipo:'Campaña',frecuencia:'unica',inicio:'2026-11-18',fin:'2026-11-18',horaCorte:'12:00',entregables:[{id:'foto',puntosMaximos:10}],alcance:{tiendaIds:['t1']}};
const fechaHoraConsulta='2026-11-18T13:00';
test('catalogo legacy solo no inventa obligaciones',()=>{
 const x=analizarD2Shadow({tiendas:[tienda],actividades:[act],fechaHoraConsulta});
 assert.equal(x.conteos.obligaciones,0);assert.equal(x.modo,'solo_lectura');
});
test('programacion explicita genera obligacion teorica sin evidencia',()=>{
 const x=analizarD2Shadow({tiendas:[tienda],actividades:[act],programaciones:[prog],fechaHoraConsulta});
 assert.equal(x.conteos.obligaciones,1);assert.equal(x.obligaciones[0].estado,'incumplida');
});
test('programacion borrador no cuenta',()=>{
 const x=analizarD2Shadow({tiendas:[tienda],actividades:[act],programaciones:[{...prog,estado:'borrador'}],fechaHoraConsulta});
 assert.equal(x.conteos.obligaciones,0);
});
test('cierre historico excluye dias posteriores sin borrar datos',()=>{
 const x=analizarD2Shadow({tiendas:[{...tienda,activa:false,fechaCierre:'2026-11-17'}],actividades:[act],programaciones:[prog],fechaHoraConsulta});
 assert.equal(x.conteos.obligaciones,0);
});
test('programaciones invalidas se reportan sin afectar catalogo',()=>{
 const x=analizarD2Shadow({tiendas:[tienda],actividades:[act],programaciones:[{...prog,inicio:'mal'}],fechaHoraConsulta});
 assert.equal(x.conteos.errores,1);assert.equal(x.conteos.obligaciones,0);
});
