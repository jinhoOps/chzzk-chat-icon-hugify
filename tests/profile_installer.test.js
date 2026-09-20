import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const script = path.resolve('install-online.ps1');
const quote = s => "'" + s.replaceAll("'", "''") + "'";
function scenario({folders=['Default','Profile 1'],state=true,profile='',input='2',dry=false,browser='chrome'}={}) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'hugify-test-'));
 const data=path.join(root,'사용자 User Data'), app=path.join(root,'app');
 fs.mkdirSync(data); fs.mkdirSync(app);
 fs.writeFileSync(path.join(app,'manifest.json'),JSON.stringify({manifest_version:3,name:'test'}));
 for(const name of folders) { fs.mkdirSync(path.join(data,name)); fs.writeFileSync(path.join(data,name,'Preferences'),'{}'); }
 fs.writeFileSync(path.join(data,'Local State'),state ? JSON.stringify({profile:{info_cache:{Default:{name:'개인'},'Profile 1':{name:'업무'}}}}) : '{broken');
 const before=fs.readFileSync(path.join(data,'Local State'));
 const command = `$ErrorActionPreference='Stop'; [Console]::OutputEncoding=[Text.Encoding]::UTF8
 function Start-Process { param($FilePath,$ArgumentList) Write-Host ('LAUNCH:' + ($ArgumentList -join '|')) }
 function Invoke-WebRequest { throw 'Unexpected network' }
 function Invoke-RestMethod { throw 'Unexpected network' }
 function Read-Host { return ${quote(input)} }
 & ${quote(script)} -Browser ${browser} -InstallDir ${quote(app)} -UserDataDir ${quote(data)} ${profile ? '-Profile '+quote(profile) : ''} ${dry ? '-DryRun' : ''}`;
 try {
  const r=spawnSync('powershell',['-NoProfile','-EncodedCommand',Buffer.from(command,'utf16le').toString('base64')],{encoding:'utf8',timeout:15000});
  assert.deepEqual(fs.readFileSync(path.join(data,'Local State')),before);
  assert.deepEqual(fs.readdirSync(data).sort(),['Local State',...folders].sort());
  return r;
 } finally { fs.rmSync(root,{recursive:true,force:true}); }
}
test('selects named profile and quotes spaced paths',()=>{ const r=scenario(); assert.equal(r.status,0,r.stderr); assert.ok(r.stdout.includes('업무')); assert.ok(r.stdout.includes('--profile-directory="Profile 1"|chrome://extensions/')); assert.ok(r.stdout.includes('사용자 User Data"')); assert.ok(!r.stdout.includes('--load-extension')); });
test('single Whale profile auto-selects',()=>{ const r=scenario({folders:['Default'],browser:'whale',input:'q'}); assert.equal(r.status,0,r.stderr); assert.ok(r.stdout.includes('--profile-directory="Default"|whale://extensions/')); });
test('explicit profile skips prompt',()=>{ const r=scenario({profile:'Profile 1',input:'q'}); assert.equal(r.status,0,r.stderr); assert.ok(r.stdout.includes('LAUNCH:')); });
test('invalid, missing and cancelled profiles never launch',()=>{ for(const config of [{profile:'../New'},{folders:[]},{input:'q'}]) {const r=scenario(config); assert.notEqual(r.status,0); assert.ok(!r.stdout.includes('LAUNCH:'));} });
test('corrupt Local State falls back to existing directories',()=>{const r=scenario({state:false,folders:['Default']}); assert.equal(r.status,0,r.stderr); assert.ok(r.stdout.includes('--profile-directory="Default"'));});
test('multi-profile dry-run never prompts or launches',()=>{const r=scenario({dry:true,input:'q'}); assert.equal(r.status,0,r.stderr); assert.ok(!r.stdout.includes('LAUNCH:')); assert.ok(r.stdout.includes('Profile selection required'));});
