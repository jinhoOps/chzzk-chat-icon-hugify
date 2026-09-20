import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const script = path.resolve('install-online.ps1');
const quote = s => "'" + s.replaceAll("'", "''") + "'";
function createArchive(root, version) {
 const payload = path.join(root, 'payload');
 const archive = path.join(root, 'payload.zip');
 fs.mkdirSync(payload);
 fs.writeFileSync(path.join(payload, 'manifest.json'), JSON.stringify({manifest_version:3,name:'test',version}));
 fs.writeFileSync(path.join(payload, 'new-file.txt'), version);
 const command = `$ErrorActionPreference='Stop'; Compress-Archive -Path ${quote(path.join(payload,'*'))} -DestinationPath ${quote(archive)} -Force`;
 const result = spawnSync('powershell',['-NoProfile','-EncodedCommand',Buffer.from(command,'utf16le').toString('base64')],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr || result.stdout);
 return archive;
}
function scenario({folders=['Default','Profile 1'],state=true,profile='',input='2',dry=false,browser='chrome',releaseVersion='',expectUpdate=false}={}) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'hugify-test-'));
 const data=path.join(root,'사용자 User Data'), app=path.join(root,'app');
 fs.mkdirSync(data); fs.mkdirSync(app);
 fs.writeFileSync(path.join(app,'manifest.json'),JSON.stringify({manifest_version:3,name:'test',version:'1.0.0'}));
 fs.writeFileSync(path.join(app,'old-file.txt'),'old');
 for(const name of folders) { fs.mkdirSync(path.join(data,name)); fs.writeFileSync(path.join(data,name,'Preferences'),'{}'); }
 fs.writeFileSync(path.join(data,'Local State'),state ? JSON.stringify({profile:{info_cache:{Default:{name:'개인'},'Profile 1':{name:'업무'}}}}) : '{broken');
 const before=fs.readFileSync(path.join(data,'Local State'));
 const archive = releaseVersion ? createArchive(root, releaseVersion) : '';
 const releaseMock = releaseVersion
  ? `function Invoke-RestMethod { param([string]$Uri,[string]$OutFile,[hashtable]$Headers) if($OutFile) { Copy-Item -LiteralPath ${quote(archive)} -Destination $OutFile; return }; [pscustomobject]@{ tag_name=${quote('v'+releaseVersion)}; draft=$false; prerelease=$false; assets=@([pscustomobject]@{name='hugify-extension.zip';browser_download_url='https://example.test/hugify-extension.zip'}) } }`
  : `function Invoke-RestMethod { throw 'Unexpected network' }`;
 const command = `$ErrorActionPreference='Stop'; [Console]::OutputEncoding=[Text.Encoding]::UTF8
 function Start-Process { param($FilePath,$ArgumentList) Write-Host ('LAUNCH:' + ($ArgumentList -join '|')) }
 function Invoke-WebRequest { throw 'Unexpected network' }
 ${releaseMock}
 function Read-Host { return ${quote(input)} }
 & ${quote(script)} -Browser ${browser} -InstallDir ${quote(app)} -UserDataDir ${quote(data)} ${profile ? '-Profile '+quote(profile) : ''} ${dry ? '-DryRun' : ''}`;
 try {
  const r=spawnSync('powershell',['-NoProfile','-EncodedCommand',Buffer.from(command,'utf16le').toString('base64')],{encoding:'utf8',timeout:15000});
  assert.deepEqual(fs.readFileSync(path.join(data,'Local State')),before);
  assert.deepEqual(fs.readdirSync(data).sort(),['Local State',...folders].sort());
  if(expectUpdate) {
   const installed=JSON.parse(fs.readFileSync(path.join(app,'manifest.json'),'utf8'));
   assert.equal(installed.version,releaseVersion,`${r.stdout}\n${r.stderr}`);
   assert.ok(fs.existsSync(path.join(app,'new-file.txt')));
   assert.equal(fs.existsSync(path.join(app,'old-file.txt')),false);
   assert.deepEqual(fs.readdirSync(root).filter(name=>name.includes('.hugify-')),[]);
  }
  return r;
 } finally { fs.rmSync(root,{recursive:true,force:true}); }
}
test('selects named profile and quotes spaced paths',()=>{ const r=scenario(); assert.equal(r.status,0,r.stderr); assert.ok(r.stdout.includes('업무')); assert.ok(r.stdout.includes('--profile-directory="Profile 1"|chrome://extensions/')); assert.ok(r.stdout.includes('사용자 User Data"')); assert.ok(!r.stdout.includes('--load-extension')); });
test('single Whale profile auto-selects',()=>{ const r=scenario({folders:['Default'],browser:'whale',input:'q'}); assert.equal(r.status,0,r.stderr); assert.ok(r.stdout.includes('--profile-directory="Default"|whale://extensions/')); });
test('explicit profile skips prompt',()=>{ const r=scenario({profile:'Profile 1',input:'q'}); assert.equal(r.status,0,r.stderr); assert.ok(r.stdout.includes('LAUNCH:')); });
test('invalid, missing and cancelled profiles never launch',()=>{ for(const config of [{profile:'../New'},{folders:[]},{input:'q'}]) {const r=scenario(config); assert.notEqual(r.status,0); assert.ok(!r.stdout.includes('LAUNCH:'));} });
test('corrupt Local State falls back to existing directories',()=>{const r=scenario({state:false,folders:['Default']}); assert.equal(r.status,0,r.stderr); assert.ok(r.stdout.includes('--profile-directory="Default"'));});
test('multi-profile dry-run never prompts or launches',()=>{const r=scenario({dry:true,input:'q'}); assert.equal(r.status,0,r.stderr); assert.ok(!r.stdout.includes('LAUNCH:')); assert.ok(r.stdout.includes('Profile selection required'));});
test('newer Release is downloaded and atomically replaces the old app',()=>{const r=scenario({releaseVersion:'1.0.1',expectUpdate:true}); assert.equal(r.status,0,r.stderr); assert.ok(r.stdout.includes('LAUNCH:'));});
test('Whale prioritizes Profile 1 over Default and defaults to 1 on Enter',()=>{const r=scenario({folders:['Default','Profile 1'],browser:'whale',input:''}); assert.equal(r.status,0,r.stderr); assert.ok(r.stdout.includes('--profile-directory="Profile 1"|whale://extensions/')); assert.ok(r.stdout.includes('1. 업무 [Profile 1]')); assert.ok(r.stdout.includes('2. 개인 [Default]'));});
test('Chrome retains Default as option 1 and defaults to 1 on Enter',()=>{const r=scenario({folders:['Default','Profile 1'],browser:'chrome',input:''}); assert.equal(r.status,0,r.stderr); assert.ok(r.stdout.includes('--profile-directory="Default"|chrome://extensions/')); assert.ok(r.stdout.includes('1. 개인 [Default]')); assert.ok(r.stdout.includes('2. 업무 [Profile 1]'));});
