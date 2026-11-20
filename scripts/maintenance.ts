// Read-only checks and quarantined review packages; this command never publishes or calls models.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { loadGraph } from '../src/lib/graph';
const mode = process.argv[2] ?? 'daily';
if (!['daily','weekly','monthly'].includes(mode)) throw new Error('Choose daily, weekly or monthly');
const directory = resolve(process.env.NORMIE_REPORT_DIR ?? '.maintenance');
mkdirSync(directory, {recursive:true});
const statePath = join(directory,'state.json');
const state: any = existsSync(statePath) ? JSON.parse(readFileSync(statePath,'utf8')) : { candidates:{}, pageHashes:{} };
state.candidates ??= {}; state.pageHashes ??= {};
const report: any = { mode, checkedAt:new Date().toISOString(), health:[], findings:[], candidates:[], checks:[], publicationBlocked:true };
const g = loadGraph();
const age = (date:string) => Math.floor((Date.now()-Date.parse(date))/86400000);
const hash = (value:any) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function run(args:string[]) {
  const result = execFileSync('npm',args,{encoding:'utf8',timeout:600_000,maxBuffer:20*1024*1024});
  report.checks.push({command:['npm',...args].join(' '),output:result}); return result;
}
async function get(url:string) {
  const res = await fetch(url,{signal:AbortSignal.timeout(30_000)});
  if(!res.ok) throw new Error(`${url}: HTTP ${res.status}`); return res;
}
try {
 if(mode==='daily') {
  for(const path of ['/healthz','/','/best-ai-for/coding','/models','/tests/spreadsheet-questions','/datasets/spreadsheet-questions.json']) {
    try { const r=await get(`https://normiemode.com${path}`); const text=await r.text();
      if(!text.length || (path==='/healthz'&&text.trim()!=='ok') || (path.endsWith('.json')&&!text.trim().startsWith('{'))) throw new Error('Unexpected response body');
      report.health.push({path,ok:true});
    } catch(e) { report.health.push({path,ok:false,error:(e as Error).message}); }
  }
  for(const name of ['epoch','modelsdev','lmarena']) {
    const d=JSON.parse(readFileSync(`data/${name}.json`,'utf8'));
    if(age(d.meta.retrieved_at)>7) report.findings.push(`${name} accepted snapshot is ${age(d.meta.retrieved_at)} days old`);
    if(d.meta.as_of&&age(d.meta.as_of)>14) report.findings.push(`${name} underlying data is ${age(d.meta.as_of)} days old`);
  }
  const catalogue:any=await (await get('https://models.dev/api.json')).json();
  const acceptedDate=JSON.parse(readFileSync('data/epoch.json','utf8')).meta.retrieved_at.slice(0,10);
  state.discoverySince ??= [acceptedDate,new Date(Date.now()-90*86400000).toISOString().slice(0,10)].sort()[0];
  const baselineDate=state.discoverySince;
  const mapped = new Set([...g.models.values()].map(m=>m.source_ids.modelsdev));
  for(const [provider,p] of Object.entries<any>(catalogue)) {
    if(!['anthropic','openai','google','deepseek','moonshotai'].includes(provider)) continue;
    for(const [id,m] of Object.entries<any>(p.models??{})) {
      const key=`${provider}/${id}`;
      if(mapped.has(key)||!(m.modalities?.output??[]).includes('text')||/image|tts|live|audio|embed/i.test(id)) continue;
      // Persist unresolved discoveries without a rolling-window expiry. No automatic canonical mapping.
      if(!state.candidates[key] && (m.release_date??'')<baselineDate) continue;
      const old=state.candidates[key];
      state.candidates[key]={...old,id:key,name:m.name,releasedOn:m.release_date,firstSeen:old?.firstSeen??report.checkedAt,lastSeen:report.checkedAt,status:old?.status??'needs-provider-verification',source:'https://models.dev/api.json'};
    }
  }
  for(const [key,c] of Object.entries<any>(state.candidates)) if(!mapped.has(key)&&c.status!=='dismissed') report.candidates.push(c);
 }
 for(const plan of g.plans.values()) if(age(plan.checked_on)>30) report.findings.push(`${plan.app} plans overdue: ${age(plan.checked_on)} days since verification`);
 if(mode==='weekly') {
  run(['run','build']); run(['test']); run(['exec','--','tsx','scripts/seo-audit.ts']);
  // Source pages are observations: HTTP success/change does not count as plan verification.
  const urls=new Set<string>();
  for(const plan of g.plans.values()) for(const url of JSON.stringify(plan).match(/https?:[^"\s]+/g)??[]) urls.add(url);
  report.planObservations=[];
  for(const url of urls) {
    try { const html=await (await get(url)).text(); const digest=hash(html);
      report.planObservations.push({url,reachable:true,changed:state.pageHashes[url]!==digest,requiresHumanVerification:true}); state.pageHashes[url]=digest;
    } catch(e) {report.planObservations.push({url,reachable:false,error:(e as Error).message});}
  }
  const referenceUrls = [...new Set([...g.sources.values()].map(s=>s.url).concat([...g.tests.values()].map(t=>t.url)))];
  report.referenceLinks = await Promise.all(referenceUrls.map(async url => {
    try { await get(url.startsWith('/') ? `https://normiemode.com${url}` : url); return {url,reachable:true}; }
    catch(error) { return {url,reachable:false,error:(error as Error).message}; }
  }));
  report.evaluationEstimates=[];
  for(const suite of ['spreadsheet-questions','messy-spreadsheet-questions','unusual-transactions']) report.evaluationEstimates.push({suite,estimate:run(['run','eval','--','--suite',suite,'--dry-run'])});
  report.citationChecks='Use docs/seo/citation-prompts-v1.yaml unchanged. Consumer-product observations require a fresh web-enabled conversation and exact engine/tier/model/date/answer/citations; API substitutes are separate. No automated paid calls.';
 }
 if(mode==='monthly') {
  run(['run','demand']);
  report.gaps=[...g.intents.values()].filter(i=>i.scope==='in'&&i.coverage!=='covered').map(i=>({task:i.id,label:i.label,coverage:i.coverage,priority:i.priority}));
  report.findings.push('Demand is autocomplete interest, not search volume. Review gaps before drafting tests/pages.');
 }
 state[`${mode}LastSuccess`]=report.checkedAt;
} catch(e) { report.error=(e as Error).message; process.exitCode=1; }
const stable={...report,checkedAt:undefined,candidates:report.candidates.map((c:any)=>({...c,lastSeen:undefined}))};
report.changed=state[`${mode}ReportHash`]!==hash(stable); state[`${mode}ReportHash`]=hash(stable);
const latest=join(directory,`${mode}-latest.json`);
writeFileSync(latest,JSON.stringify(report,null,2)+'\n'); writeFileSync(statePath,JSON.stringify(state,null,2)+'\n');
console.log(JSON.stringify({mode,changed:report.changed,health:report.health,findings:report.findings,candidates:report.candidates.length,report:latest,error:report.error}));
