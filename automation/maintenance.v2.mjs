import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,mkdir,readFile,writeFile,rm,open} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
export const name='normieMode.maintenanceV2';
export const version=2;
export const description='Isolated, review-only Normie Mode maintenance with durable state and semantic evidence checks.';
const exec=promisify(execFile);
export default async function maintenance(input={}) {
 const mode=String(input.mode??'daily');
 if(!['daily','weekly','monthly'].includes(mode)) throw new Error('Invalid maintenance mode');
 const stateRoot=String(input.stateRoot??'/workspace/lara/mycode/normie-maintenance-state');
 await mkdir(stateRoot,{recursive:true});
 let lock;
 try { lock=await open(join(stateRoot,'maintenance.lock'),'wx'); }
 catch(e) {if(e.code==='EEXIST') throw new Error('Another maintenance run holds the lock; inspect before retrying');throw e;}
 const dir=await mkdtemp(join(tmpdir(),'normie-maintenance-'));
 const repo=join(dir,'repo');
 const runId=new Date().toISOString().replace(/[:.]/g,'-');
 const reportDir=join(stateRoot,'runs',runId);await mkdir(reportDir,{recursive:true});
 const report={mode,runId,completed:false,publicationBlocked:true,checks:[],sourceBranch:input.sourceBranch??'maintenance/evidence-loop'};
 const command=async(cmd,args,cwd=repo)=>{
   try {const r=await exec(cmd,args,{cwd,env:{...process.env,NORMIE_REPORT_DIR:stateRoot},timeout:900_000,maxBuffer:30*1024*1024});
    report.checks.push({command:[cmd,...args].join(' '),ok:true}); await writeFile(join(reportDir,`${report.checks.length}.log`),r.stdout+r.stderr);return r.stdout.trim();}
   catch(e){report.checks.push({command:[cmd,...args].join(' '),ok:false});await writeFile(join(reportDir,`${report.checks.length}.log`),String(e.stdout??'')+String(e.stderr??'')+e.message);throw e;}
 };
 const clean=o=>Array.isArray(o)?o.map(clean):o&&typeof o==='object'?Object.fromEntries(Object.entries(o).filter(([k])=>k!=='retrieved_at').map(([k,v])=>[k,clean(v)])):o;
 try {
  await command('git',['clone','--depth','1','--branch',report.sourceBranch,'https://github.com/andymdavid/normie-mode',repo],dir);
  report.baseCommit=await command('git',['rev-parse','HEAD']);
  await command('npm',['ci','--ignore-scripts']);
  await command('npm',['run','maintenance','--',mode]);
  const observation=JSON.parse(await readFile(join(stateRoot,`${mode}-latest.json`),'utf8'));
  report.observation=observation;report.changed=observation.changed;
  const paths=mode==='daily'?['data/epoch.json','data/modelsdev.json','data/lmarena.json']:mode==='monthly'?['data/demand.json']:[];
  const before=new Map();for(const p of paths) before.set(p,await readFile(join(repo,p),'utf8'));
  if(mode==='daily') {
   report.before=JSON.parse(await command('npm',['run','--silent','impact']));
   await command('npm',['run','import']);
  }
  // Monthly collection occurred during maintenance; compare to the checked-out commit, not the new file.
  if(mode==='monthly') for(const p of paths) before.set(p,await command('git',['show',`HEAD:${p}`]));
  const changed=[];
  for(const p of paths) {
   const old=before.get(p);const next=await readFile(join(repo,p),'utf8');
   if(JSON.stringify(clean(JSON.parse(old)))!==JSON.stringify(clean(JSON.parse(next)))) changed.push(p);
   else await writeFile(join(repo,p),old);
  }
  report.changedPaths=changed;
  if(changed.length) {
   await command('npm',['run','verify']);
   if(mode==='daily') report.after=JSON.parse(await command('npm',['run','--silent','impact']));
   const digest=createHash('sha256');for(const p of changed)digest.update(JSON.stringify(clean(JSON.parse(await readFile(join(repo,p),'utf8')))));
   const branch=`maintenance/${mode}-${digest.digest('hex').slice(0,12)}`;report.reviewBranch=branch;
   const prs=JSON.parse(await command('gh',['pr','list','--repo','andymdavid/normie-mode','--head',branch,'--state','all','--json','url,state']));
   if(prs.length) report.pullRequest=prs[0].url;
   else if(input.pushReviewBranch!==false) {
    await command('git',['switch','-c',branch]);
    await command('git',['config','user.name','Lara']);await command('git',['config','user.email','lara@localhost']);
    await command('git',['add','--',...changed]);
    await command('git',['commit','-m',`Data: reviewed maintenance candidate ${runId.slice(0,10)}`]);
    await command('git',['push','origin',branch]);
    const body=join(reportDir,'pull-request.md');
    const changedPicks=(report.after??[]).filter(row=>JSON.stringify(row.picks)!==JSON.stringify(report.before?.find(old=>old.task===row.task)?.picks)).map(row=>({task:row.task,before:report.before?.find(old=>old.task===row.task)?.picks,after:row.picks}));
    report.changedPicks=changedPicks;
    const impacts=(report.after??[]).map(row=>{const before=report.before?.find(x=>x.task===row.task);return JSON.stringify(before?.picks)===JSON.stringify(row.picks)?null:{task:row.task,before:before?.picks,after:row.picks};}).filter(Boolean);report.verdictChanges=impacts;
    await writeFile(body,`Refresh accepted source snapshots with explicit coverage checks. This is a review candidate; no merge/deployment occurred.\n\nSource branch: ${report.sourceBranch}; base ${report.baseCommit}.\n\nChanged: ${changed.join(', ')}.\n\nValidation: npm run verify. Changed task picks: ${JSON.stringify(report.verdictChanges)}. Full observations and before/after verdicts: ${reportDir}/report.json.\n\nChanged picks:\n\n\`\`\`json\n${JSON.stringify(changedPicks,null,2)}\n\`\`\`\n\nExact source mappings, consumer-plan access and changed picks require owner review.\n`);
    report.pullRequest=await command('gh',['pr','create','--repo','andymdavid/normie-mode','--base','main','--head',branch,'--title',`Normie Mode ${mode} evidence review ${runId.slice(0,10)}`,'--body-file',body,'--draft']);
   }
   report.changed=true;
  }
  report.completed=true;
 }catch(e){report.error=String(e.message);report.changed=true;}
 finally {
  await writeFile(join(reportDir,'report.json'),JSON.stringify(report,null,2)+'\n');
  await writeFile(join(stateRoot,`${mode}-run-latest.json`),JSON.stringify({...report,reportPath:join(reportDir,'report.json')},null,2)+'\n');
  await rm(dir,{recursive:true,force:true});await lock.close();await rm(join(stateRoot,'maintenance.lock'));
 }
 if(!report.completed) throw new Error(`Maintenance failed: ${report.error}; report ${join(reportDir,'report.json')}`);
 return {...report,reportPath:join(reportDir,'report.json')};
}
