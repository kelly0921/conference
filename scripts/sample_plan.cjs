/* Feed approved fictional case records to the real application's exporter. */
const {application} = require('./application_runtime.cjs');
const app = application();
const sample = app.run(`(() => {
  ensurePreset('ghc');
  const p=getPlan(), c=SNAPSHOT.exampleCases.jordan;
  p.name='GHC 2026 - Jordan (fictional sample)';
  p.goal=c.goal;
  p.targets=[{...c.target,type:'Role or employer'}];
  p.activities=[c.commitment,c.session].map(x=>({...x,timezone:x.timeZone,fixed:true}));
  p.notes=[{...c.followup,done:c.followup.status.startsWith('Sent')}];
  p.printPreferences={};
  return {version:SNAPSHOT.snapshotVersion,contentSha256:SNAPSHOT.contentSha256,
    event:{name:p.name,date:p.date,end:p.end,format:p.format,location:p.location,timezone:p.timezone,goal:p.goal},
    sections:exportSections(p),text:fieldPlanText(p)};
})()`);
process.stdout.write(JSON.stringify(sample,null,2)+'\n');
