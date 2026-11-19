import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizarTiendaLegacy,normalizarActividadLegacy,diagnosticarMaestros} from '../src/adaptadorLegacyD2.mjs';
test('formato legacy compatible y codigo preservado',()=>{
 const t=normalizarTiendaLegacy({id:'t1',idTienda:'142',n:'CHOSICA',f:'Market',zonaId:'06',fechaApertura:'2026-08-29',activa:true});
 assert.equal(t.id,'t1');assert.equal(t.codigoTienda,'142');assert.equal(t.formatoId,'Market');assert.equal(t.zonaId,'06');
});
test('no inventar apertura ni cierre para tienda inactiva',()=>{
 const t=normalizarTiendaLegacy({id:'t2',n:'CERRADA',activa:false});
 assert.equal(t.fechaApertura,null);assert.equal(t.fechaCierre,null);
});
test('actividad legacy no es obligacion programada',()=>{
 const a=normalizarActividadLegacy({id:'a1',n:'Menestras',dias:[1],cat:'Always On'});
 assert.deepEqual(a.diasSemana,[1]);assert.equal(a.inicioEvaluacion,null);
});
test('detecta duplicado en codigo comercial entre dos IDs internos',()=>{
 const r=diagnosticarMaestros({tiendas:[{id:'t1',idTienda:'110'},{id:'t2',idTienda:'110'}]});
 assert.ok(r.avisos.some(x=>x.tipo==='codigo_comercial_duplicado'&&x.codigo==='110'));
});
test('inactivacion sin fecha cierre es incidencia de maestro',()=>{
 const r=diagnosticarMaestros({tiendas:[{id:'t9',activa:false,idTienda:'9'}]});
 assert.ok(r.avisos.some(x=>x.tipo==='inactiva_sin_fecha_cierre'));
});
