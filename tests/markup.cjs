const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const local=fs.readFileSync(path.join(root,'每日事件.html'),'utf8');
const source=fs.readFileSync(path.join(root,'cloud/app/workbench/document.ts'),'utf8');
const cloud=JSON.parse(source.slice('export default '.length).trim().replace(/;$/,''));
for(const [version,html] of [['local',local],['cloud',cloud]]){
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length,version+': duplicate HTML IDs');
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(script);
 for(const match of script.matchAll(/getElementById\(\s*['"]([^'"]+)['"]\s*\)/g))assert(ids.includes(match[1]),`${version}: missing #${match[1]}`);
 for(const id of ['dateStream','inboxList','eventActionsDialog','eventActionsEdit','eventActionsDelete','mobileEditor','exportData','importData'])assert(ids.includes(id));
 assert(html.includes('width=device-width'));
 assert(!script.includes('data-order-event'));
 assert(html.includes('touch-drag-handle'));
 const menu=html.match(/<div class="event-actions-options">([\s\S]*?)<\/div>/)[1];assert.equal((menu.match(/<button/g)||[]).length,2);
}
assert(local.includes('id="saveStatus"'));assert(!local.includes('id="saveWarning"'));
for(const term of ['identity.userId','startCloud(', 'fetch(', 'syncCloud', 'cloudReady','/signin-with-chatgpt','/signout-with-chatgpt'])assert(!local.includes(term),term);
assert(local.includes('daily_event_workbench_github_share_v1'));
assert(cloud.includes('/*IDENTITY*/null'));
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'cloud/.openai/hosting.json'),'utf8')),{d1:'DB',r2:null});
console.log('PASS: both pages parse, all referenced IDs exist, menus/backup controls and public identity boundaries verified.');
