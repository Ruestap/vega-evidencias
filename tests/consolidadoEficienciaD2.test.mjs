import test from 'node:test';
import assert from 'node:assert/strict';
import {periodoD2,indicadoresD2,consolidarEficienciaD2} from '../src/consolidadoEficienciaD2.mjs';
const tiendas=[{id:'minka',f:'Cash & Carry',zonaId:'Callao',fechaApertura:'2026-01-01'},{id:'cedros',f:'Market',zonaId:'Lima Norte',fechaApertura:'2026-01-01'}];
const p=(id,dias,ids)=>({id,actividadId:id,tipo:'Promocional',frecuencia:'fechas',fechas:dias,inicio:'2026-11-01',fin:'2026-11-30',horaCorte:'12:00',entregables:[{id:'foto',puntosMaximos:10}],alcance:{tiendaIds:ids}});
const programas=[p('lunes',['2026-11-16','2026-11-23'],['minka','cedros']),p('material',['2026-11-16'],['minka']),p('campana',['2026-11-16'],['minka'])];
const base={programaciones:programas,tiendas,periodo:periodoD2({tipo:'semana',anio:2026,mes:11,semana:3})};
test('cortes: S1 1-7, S4 22-28, S5 29-fin',()=>{
 assert.deepEqual([periodoD2({tipo:'semana',anio:2026,mes:11,semana:1}).inicio,periodoD2({tipo:'semana',anio:2026,mes:11,semana:4}).fin,periodoD2({tipo:'semana',anio:2026,mes:11,semana:5}).fin],['2026-11-01','2026-11-28','2026-11-30']);
});
test('Minka tiene 3 obligaciones el dia 16 y no recibe obligaciones de otra tienda',()=>{
 const x=consolidarEficienciaD2({...base,periodo:periodoD2({tipo:'dia',fecha:'2026-11-16'}),fechaHoraConsulta:'2026-11-16T13:00',filtros:{tiendaId:'minka'}});
 assert.equal(x.indicadores.ejecucionesProgramadas,3);assert.equal(x.indicadores.obligacionesEvaluables,3);assert.equal(x.indicadores.puntosPosibles,30);
});
test('semana S3 solo incluye los dias programados de esa semana',()=>{
 const x=consolidarEficienciaD2({...base,fechaHoraConsulta:'2026-11-21T23:59'});
 assert.equal(x.indicadores.ejecucionesProgramadas,4);assert.equal(x.indicadores.obligacionesEvaluables,4);
});
test('el mes agrega mas ejecuciones de una misma actividad sin contar fotos como obligaciones',()=>{
 const x=consolidarEficienciaD2({...base,periodo:periodoD2({tipo:'mes',anio:2026,mes:11}),fechaHoraConsulta:'2026-11-30T23:59'});
 assert.equal(x.indicadores.ejecucionesProgramadas,6);assert.equal(x.indicadores.actividadesDistintas,3);
});
test('semana futura no penaliza; eficiencia nula, no cero',()=>{
 const x=consolidarEficienciaD2({...base,periodo:periodoD2({tipo:'semana',anio:2026,mes:11,semana:4}),fechaHoraConsulta:'2026-11-19T10:00'});
 assert.equal(x.indicadores.futuras,2);assert.equal(x.indicadores.obligacionesEvaluables,0);assert.equal(x.indicadores.eficienciaPorcentaje,null);
});
test('evidencia recibida no es igual a aprobada',()=>{
 const evidencias=[{id:'e1',programacionId:'material',tiendaId:'minka',entregableId:'foto',fecha:'2026-11-16',aprobada:false}];
 const x=consolidarEficienciaD2({...base,fechaHoraConsulta:'2026-11-16T13:00',evidencias});
 assert.equal(x.indicadores.evidenciasRecibidas,1);assert.equal(x.indicadores.obligacionesAprobadas,0);assert.equal(x.indicadores.puntosPosibles,40);assert.equal(x.indicadores.puntosObtenidos,0);
});
test('evidencia aprobada suma puntos sobre 10 y cobertura de registros se separa',()=>{
 const evidencias=[{id:'e1',programacionId:'material',tiendaId:'minka',entregableId:'foto',fecha:'2026-11-16',aprobada:true,puntos:8}];
 const x=consolidarEficienciaD2({...base,fechaHoraConsulta:'2026-11-16T13:00',evidencias,filtros:{tiendaId:'minka'}});
 assert.equal(x.indicadores.eficienciaPorcentaje,26.67);assert.equal(x.indicadores.cumplimientoEnvioPorcentaje,33.33);
});
test('agrupa formato y zona usando snapshots de las obligaciones',()=>{
 const x=consolidarEficienciaD2({...base,fechaHoraConsulta:'2026-11-16T13:00',agruparPor:'formato'});
 assert.equal(x.grupos.find(r=>r.id==='Cash & Carry').ejecucionesProgramadas,3);
 assert.equal(x.grupos.find(r=>r.id==='Market').ejecucionesProgramadas,1);
});
test('exclusion aprobada es N/A y no entra en posibles',()=>{
 const id='material|minka|foto|2026-11-16';
 const x=consolidarEficienciaD2({...base,fechaHoraConsulta:'2026-11-16T13:00',exclusiones:[{obligacionId:id,aprobada:true,motivo:'Sin instalacion'}]});
 assert.equal(x.indicadores.excluidas,1);assert.equal(x.indicadores.puntosPosibles,30);
});
test('no se inventan programaciones desde el catalogo de tiendas',()=>{
 const x=consolidarEficienciaD2({...base,programaciones:[],fechaHoraConsulta:'2026-11-16T13:00'});
 assert.equal(x.indicadores.ejecucionesProgramadas,0);assert.equal(x.indicadores.eficienciaPorcentaje,null);
});
