// Deterministic regression checks for the requested fixes. Node 24+; no packages needed.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { prepare, runtime } from './reproduce.mjs';
export async function runRegressions() {
 await prepare();
 const engine = name => import(pathToFileURL(join(runtime, 'src/engine', name + '.mjs')).href);
 const [{Game}, cba, contracts, flow, picks, preFA, office, overseas] = await Promise.all(['Game','cba','contracts','cbaFlow','pickRules','preFA','frontOffice','overseas'].map(engine));
 const copy = x => JSON.parse(JSON.stringify(x)), base = copy(Game.load(copy(Game.create(2027,[0]).toSave())).toSave());
 const fresh = () => Game.load(copy(base)); const checks=[];
 const check=(name,test)=>{assert.ok(test,name);checks.push(name);};
 const boxOf=s=>({rosters:{...s.rosters},fa:[...s.fa],overseas:[...s.overseas],cap:{...s.cap}});
 {
  const g=fresh(),p=g.db.P[g.state.rosters[0][0]];Object.assign(p,{amt:40,exp:g.Y+2,opt:undefined,ext:{amt:30,yrs:2,raise:.08}});g.state.day=41;
  const before=cba.teamSalary(g,g.state,0);g.setState({dialog:{type:'abroad',pid:p.id}});g.confirmDialog();
  check('F02: overseas release preserves current cap charge',Math.abs(cba.teamSalary(g,g.state,0)-before)<.01);
  check('F02/F03: extension years remain guaranteed after release',g.state.cap[0].dead.some(d=>d.pid===p.id&&d.amts[g.Y+4]===32.4));
  check('F03: waived extension is cleared from player',!p.ext);
 }
 {
  const g=fresh(),p=g.db.P[g.state.rosters[0][0]],b=boxOf(g.state);Object.assign(p,{amt:10,exp:g.Y,ext:{amt:30,yrs:4,raise:.08},opt:undefined});
  const rem=cba.remainingGuaranteed(g,g.state,p),stretch=cba.deadSchedule(g,{...g.state,day:40},p,true);
  check('F03: guarantee covers every extension year',rem[g.Y+1]===30&&rem[g.Y+4]===37.2);
  check('CBA: in-season stretch retains current salary intact',stretch[g.Y]===10);
  contracts.waivePlayer(g,g.state,b,0,p,'buyout',0);contracts.applySigning(g,g.state,b,1,p,{method:'min',amt:3,years:1});
  check('F03: new contract cannot inherit old extension',!p.ext&&p.amt===3);
  contracts.applySigning(g,g.state,b,1,p,{method:'cap',amt:10,years:4});
  check('CBA: annual raises are a percentage of first-year salary',g.salAt(p,g.Y+3)===11.5);
 }
 {
  const g=fresh(),s=g.state,Y=g.Y+1;s.assets=s.assets.map(a=>({...a,owner:a.orig}));s.tkMine=[];s.tkTheirs=[];
  const first=s.assets.find(a=>a.yr===Y&&a.rd===1&&a.orig===0),other=s.assets.find(a=>a.yr===Y&&a.rd===1&&a.orig===1);
  check('Swaps: owned and unencumbered firsts can be offered',picks.canOfferSwap(s,Y,0,1));
  Object.assign(s,picks.toggleTradePick(s,'tkMine',first.id));Object.assign(s,picks.toggleTradePick(s,'tkTheirs','swap:'+Y));
  check('Swaps: selecting a swap removes either side’s first',!s.tkMine.includes(first.id)&&s.tkTheirs.includes('swap:'+Y));
  Object.assign(s,picks.toggleTradePick(s,'tkMine',first.id));check('Swaps: selecting a first removes either side’s swap',!s.tkTheirs.includes('swap:'+Y));
  check('Swaps: backend rejects conflicting payloads',!cba.checkTrade(g,s,0,1,[],[],[first.id],['swap:'+Y]).ok);
  first.owner=2;check('Swaps: traded-away first has no new swap available',!picks.canOfferSwap(s,Y,0,1));
  first.owner=0;s.swaps=[{id:'s',yr:Y,from:0,to:1}];
  check('F04: already committed collateral cannot be sold again',!cba.checkTrade(g,s,0,2,[],[],[first.id],[]).ok);
  s.season=Y;first.owner=2;const out=picks.settlePickRules(g,s,[{n:1,rd:1,orig:0},{n:10,rd:1,orig:1}]);
  check('F04: legacy swap cannot confiscate a third-party pick',out.assets.find(a=>a.id===first.id).owner===2);
  first.owner=0;const valid=picks.settlePickRules(g,s,[{n:1,rd:1,orig:0},{n:10,rd:1,orig:1}]);
  check('Swaps: valid right still settles to the better pick',valid.assets.find(a=>a.id===first.id).owner===1&&valid.assets.find(a=>a.id===other.id).owner===0);
 }
 {
  const g=fresh(),s=g.state;s.phase='fa';s.managed=[0,1];const p=g.db.P[s.fa.find(id=>g.db.P[id].ovr<48)];Object.assign(p,{rfa:{tid:1,qo:5},birdTid:1,yrsWith:3,ask:3});
  const start=cba.exceptionsOf(g,s,0).ntmle, salary=cba.teamSalary(g,s,0);
  g.setState({dialog:{type:'sign',pid:p.id,method:'ntmle',amt:5,years:2}});flow.userSign(g);const sheet=g.state.offerSheets?.[0];
  check('F05: a normal exception offer creates a matchable sheet',!!sheet&&!g.state.rosters[0].includes(p.id)&&p.rfa?.tid===1);
  check('F06: pending sheet reserves exception and salary',Math.abs(cba.exceptionsOf(g,g.state,0).ntmle-(start-5))<.01&&Math.abs(cba.teamSalary(g,g.state,0)-salary-5)<.01);
  const day=g.state.day;g.advanceFA(7);check('F06: pending sheet pauses the clock',g.state.day===day);
  flow.answerOfferSheet(g,sheet.id,false);
  check('F06: declined sheet spends the real exception once',g.state.rosters[0].includes(p.id)&&Math.abs(cba.capState(g.state,0).exc.ntmle-(start-5))<.01&&cba.capState(g.state,0).hardCap==='AP1');
  check('F05: completed foreign signing clears matching rights',!p.rfa);
 }
 {
  const g=fresh(),s=g.state;s.phase='fa';const p=g.db.P[s.fa.find(id=>g.db.P[id].ovr<48)];Object.assign(p,{rfa:{tid:1,qo:3},ask:3});
  check('CBA: offer sheet cannot have only one guaranteed season',!contracts.validateSigning(g,s,0,p,{method:'ntmle',amt:5,years:2,opt:'player'}).ok);
  check('F06: synthetic unfunded offer method is rejected',!contracts.validateSigning(g,s,0,p,{method:'offer',amt:5,years:3}).ok);
  delete p.rfa;
  check('CBA: unlikely incentives limited to 15% regular salary',!contracts.validateSigning(g,s,0,p,{method:'ntmle',amt:5,years:2,inc:[{amt:1,likely:false}]}).ok);
  check('CBA: incentives are unavailable on minimum exception deals',!contracts.validateSigning(g,s,0,p,{method:'min',amt:cba.nums(g).min(cba.yosOf(g,p))+.1,years:1,inc:[{amt:.1,likely:true}]}).ok);
 }
 {
  const g=fresh(),s=g.state,P=g.db.P;s.day=40;let b=boxOf(s);const fill=P[s.fa.find(id=>P[id].ovr<48)];contracts.applySigning(g,s,b,0,fill,{method:'min',amt:3,years:1});Object.assign(s,b);s.rosters[0].slice(0,4).forEach(id=>P[id].inj={name:'test',games:10});
  const p=P[s.fa.find(id=>P[id].ovr<48)];g.setState({dialog:{type:'sign',pid:p.id,method:'hardship',amt:cba.nums(g).min(cba.yosOf(g,p)),years:0}});flow.userSign(g);
  check('F08: authorized 16th hardship player can play',g.state.rosters[0].includes(p.id)&&g.canPlay());
  const extra=P[g.state.fa[0]];g.state.rosters[0].push(extra.id);check('F08: hardship does not allow an unrelated 17th standard player',!g.canPlay());
 }
 {
  const g=fresh(),s=g.state;s.assets=s.assets.map(a=>({...a,owner:a.orig}));const give=[g.Y+1,g.Y+2].map(y=>y+'-1-0'),get=[g.Y+1,g.Y+2].map(y=>y+'-1-1');
  check('F09: incoming firsts satisfy Stepien retention',!cba.checkTrade(g,s,0,1,[],[],give,get).errs.some(x=>x.includes('Stepien')));
  check('F09: uncompensated consecutive firsts are rejected',cba.checkTrade(g,s,0,1,[],[],give,[]).errs.some(x=>x.includes('Stepien')));
 }
 {
  const g=Game.create(2027,[0,1]);Object.assign(g.state,{phase:'draft',picks:[],pi:0,preFA:{opts:[]},decide:{}});
  for(const row of preFA.preFARows(g,g.state,0))if(row.required&&!row.decided)g.state.decide[(row.kind==='teamOpt'?'opt':'let')+row.pid]=true;
  const p=g.db.P[g.state.rosters[1].at(-1)];p.exp=g.Y;delete p.opt;delete p.ext;g.state.decide['let'+p.id]=true;g.startFA();check('F10: second managed club blocks unresolved decisions',g.state.phase==='draft');
  for(const tid of g.state.managed)for(const row of preFA.preFARows(g,g.state,tid))if(row.required&&!row.decided)g.state.decide[(row.kind==='teamOpt'?'opt':'let')+row.pid]=true;
  g.startFA();check('F10: second club’s let-go decision renounces its rights',g.state.phase==='fa'&&p.birdTid==null&&g.state.cap[1].renounced.includes(p.id));
 }
 {
  const g=fresh();g.state.phase='playoffs';g.state.po={rounds:[[{a:0,b:1,sa:1,sb:8,wa:0,wb:0,conf:'East',g:[]}]],champ:null,finals:{}};
  let inj=0,fat=0;const inj0=g.injTick.bind(g),fat0=g.fatigueTick.bind(g);g.injTick=(...a)=>{inj++;return inj0(...a);};g.fatigueTick=(...a)=>{fat++;return fat0(...a);};g.simPo('game');check('F11: postseason applies injury and fatigue processing once per day',inj===1&&fat===1&&g.state.games.length===1);
 }
 {
  const g=fresh();g.state.teams.push({...g.state.teams[0],tid:30},{...g.state.teams[1],tid:31});g.state.rosters[30]=[];g.state.rosters[31]=[];const p=g.db.P[g.db.cls[g.Y][0]];flow.signDraftee(g,g.state,boxOf(g.state),0,p,{n:33,rd:2},true);check('F12: expansion second-round number uses league size',p.dr.pick===1);
 }
 {
  const g=fresh(),p=g.db.P[g.state.rosters[0][0]];p.inc=[{k:'avail',target:0,amt:1,likely:false},{k:'avail',target:1000,amt:2,likely:true}];g.state.phase='playoffs';g.state.po={champ:0,rounds:[[{a:0,b:1}]]};g.state.god=true;
  office.seasonReview(g);const f=office.financesOf(g,g.state,0);
  check('F14: bonuses settle only once into the correct season',g.state.cap[0].bonusPaid===1&&g.state.bonusPaid===1&&g.state.bonusYear===g.Y);
  check('F14: current cap classification is retained until new year',p.inc[0].likely===false&&p.inc[1].likely===true&&p.inc[0].nextLikely===true&&p.inc[1].nextLikely===false);
  check('F14: earned incentives are a single cash expense',f.exp.filter(x=>x[0]==='Incentive bonuses paid').length===1&&f.exp.find(x=>x[0]==='Incentive bonuses paid')[1]===1);
  const pay=f.exp.find(x=>x[0]==='Player payroll')[1],dead=cba.deadThis(g,g.state,0);check('F14: payroll excludes bonuses shown separately',Math.abs(pay-(cba.teamSalary(g,g.state,0)-dead-(g.state.teams[0].capAdj||0)-2))<.01);
  office.seasonReview(g);check('F14: repeated review cannot pay again',g.state.bonusPaid===1);
  Object.assign(g.state,{phase:'fa',faStart:0,day:92,offerSheets:[],agentCalls:[]});g.startPreseason();check('F14: annual paid bonus ledger resets at camp',g.state.phase==='preseason'&&g.state.bonusPaid===0&&!office.financesOf(g,g.state,0).exp.some(x=>x[0]==='Incentive bonuses paid'));
 }
 {
  const g=fresh(),p=g.db.P[g.state.overseas.find(id=>g.db.P[id].abroad?.clause==='Buyout')],before=copy(g.state.assets);
  check('F16: overseas clubs cannot take NBA picks',overseas.negotiateBuyout(g,p.id,p.abroad.fee,true)?.ok===false&&JSON.stringify(before)===JSON.stringify(g.state.assets));
  check('F16: cash-only buyout still works',overseas.negotiateBuyout(g,p.id,p.abroad.fee,false)?.ok===true);
  const asset=g.state.assets.find(a=>a.rd===2&&a.yr===g.Y);asset.owner=-1;const loaded=Game.load(copy(g.toSave()));check('F16: old orphaned picks regain an NBA owner',loaded.state.assets.find(a=>a.id===asset.id).owner===asset.orig);
 }
 {
  const g=fresh(),p=g.db.P[g.state.rosters[0][0]];g.state.phase='fa';g.state.history=[{year:g.Y,teams:{0:{w:55,fin:'Lost in the first round'}}}];g.state.awards={[g.Y]:{allLeague:[[p.id]],allDef:[[p.id]]}};p.ovr=65;p.r.diq=70;
  const options=office.incentiveOptions(g,g.state,p,0,10);check('F14/CBA: team and honors bonuses use the preceding season',options.filter(x=>['playoffs','wins','allLeague','allDef'].includes(x.k)).every(x=>x.likely));
  const q=g.db.P[g.state.fa.find(id=>g.db.P[id].ovr<48)];check('CBA: likely bonuses cannot inflate the unlikely bonus limit',!contracts.validateSigning(g,g.state,0,q,{method:'ntmle',amt:10,years:2,inc:[{amt:2,likely:true},{amt:1.3,likely:false}]}).ok);
 }
 const result={passed:checks.length,checks};await writeFile(join(runtime,'..','regressions.json'),JSON.stringify(result,null,2));return result;
}

if (process.argv[1]?.endsWith('regressions.mjs')) { const result = await runRegressions(); console.log(result.passed + ' regression checks passed.'); }
