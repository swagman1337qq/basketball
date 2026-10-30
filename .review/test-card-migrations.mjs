import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import{join}from'node:path';import{pathToFileURL}from'node:url';import{prepare,runtime}from'./reproduce.mjs';await prepare();const[{Game},cards]=await Promise.all(['Game','playerCard'].map(n=>import(pathToFileURL(join(runtime,'src/engine',n+'.mjs')).href)));const manifest=JSON.parse(await readFile(new URL('./card-manifest.json',import.meta.url),'utf8')),g=Game.create(2027,[0]),base=g.db.P[g.state.rosters[0][0]];let count=0;for(let i=0;i<cards.PRESET_CARDS.length;i++){const c=cards.PRESET_CARDS[i].card,p=structuredClone(base);assert.equal(cards.applyCard(p,c,g.db.C),'');assert.equal(p.name,base.name);assert.equal(p.age,base.age);assert.equal(p.id,base.id);assert.equal(p.cardPreset,i);for(const[k,v]of Object.entries(c.r))assert.equal(p.r[k],Math.round(v));count+=6;const old=manifest[i].card,row={id:'preset'+i,card:structuredClone(old)},edited={id:'preset'+i,card:structuredClone(old)};edited.card.r.ft+=.123;cards.upgradePresetCard(row);assert.deepEqual(row.card.r,c.r);cards.upgradePresetCard(edited);assert.equal(edited.card.r.ft,old.r.ft+.123);count+=2;const carrier=structuredClone(base);cards.applyCard(carrier,old,g.db.C);carrier.cardName=old.name;delete carrier.cardPreset;const before=structuredClone(carrier.r);cards.retuneCarriers({[carrier.id]:carrier});assert.equal(carrier.cardPreset,i);assert.deepEqual(carrier.r,c.r);const again=structuredClone(carrier.r);cards.retuneCarriers({[carrier.id]:carrier});assert.deepEqual(carrier.r,again);count+=3;}
const unknown=structuredClone(base),before=structuredClone(unknown.r);delete unknown.cardName;cards.retuneCarriers({[unknown.id]:unknown});assert.deepEqual(unknown.r,before);for(let i=0;i<cards.PRESET_CARDS.length;i++){
  const old=manifest[i].card,c=cards.PRESET_CARDS[i].card,p=structuredClone(base);
  for(const edit of ['style','potential','feel','work']){
    const custom={id:'preset'+i,card:structuredClone(old)};
    if(edit==='style')custom.card.ten.usage+=.123;
    if(edit==='potential')custom.card.pot+=1;
    if(edit==='feel')custom.card.intg.feel+=1;
    if(edit==='work')custom.card.pers.work+=1;
    const saved=structuredClone(custom.card);cards.upgradePresetCard(custom);assert.deepEqual(custom.card,saved);
  }
  cards.applyCard(p,old,g.db.C);delete p.cardPreset;
  for(const k of Object.keys(p.r))if(k!=='hgt')p.r[k]+=2;
  p.ten.usage=3.14159;const style=structuredClone(p.ten);
  cards.retuneCarriers({[p.id]:p});assert.equal(p.cardPreset,i);
  for(const[k,v]of Object.entries(c.r))assert.equal(p.r[k],v+(k==='hgt'?0:2));
  assert.deepEqual(p.ten,style);
  const authored=structuredClone(base),fresh=structuredClone(base);
  cards.applyCard(authored,old,g.db.C);delete authored.cardPreset;cards.applyCard(fresh,c,g.db.C);
  cards.retuneCarriers({[authored.id]:authored});assert.deepEqual(authored.ten,fresh.ten);
}
console.log('Card application, variant recognition, custom edits, growth preservation and idempotent migrations passed for all 25 cards.');