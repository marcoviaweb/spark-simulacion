import assert from 'node:assert/strict';
import {timeline,durations,lerpProgress} from './src/simulation.js';
import {sales,validSales,totals,categories,phases} from './src/content.js';
for(let p=0;p<6;p++){
 assert.equal(timeline(p,0).complete,false);
 assert.equal(timeline(p,durations[p]).complete,true);
 assert.equal(timeline(p,1000).time,durations[p]);
 let previous=-1;
 for(let time=0;time<=durations[p];time+=.25){const state=timeline(p,time);assert.ok(state.event>=previous);previous=state.event;assert.ok(state.progress>=0&&state.progress<=1);}
}
assert.equal(timeline(1,2).event,0);assert.equal(timeline(1,4).event,1);assert.equal(timeline(1,8).event,2);
assert.equal(sales.length,8);assert.equal(validSales.length,7);
assert.equal(sales.filter(s=>s.partition===6&&s.valid).length,0);
assert.deepEqual(totals.map(t=>t.amount),[300,120,80]);
const arrivals=categories.map(c=>validSales.filter((s,j)=>s.category===c&&14>=7+j*.5));
assert.deepEqual(arrivals.map(a=>a.length),[2,2,3]);
assert.deepEqual(arrivals.map(a=>a.reduce((sum,s)=>sum+s.amount,0)),totals.map(t=>t.amount));
assert.equal(lerpProgress(0,3,4),0);assert.equal(lerpProgress(5,3,4),.5);assert.equal(lerpProgress(9,3,4),1);
assert.ok(phases.every(p=>!p.actor.includes('+')));
console.log('Verificadas las seis secuencias, el orden de coordinación, las seis particiones, el descarte de V8 y los tres totales.');
