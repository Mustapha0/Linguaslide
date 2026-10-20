import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { exportDeckToPptx } from '../src/pptxExport.js';

const deck = {
  schemaVersion: '1.0.0', templateId: 'ipa-grid', title: 'IPA export validation', language: 'English',
  theme: { name: 'IPA Grid', typeface: 'Inter', colorTokens: { background: '#F5F7FA', primary: '#182638', secondary: '#637286', accent: '#2E77B7' } },
  slides: [
    { id:'slide-1', type:'title', title:'IPA export validation', slots:{body:'Editable PowerPoint test'}, speakerNotes:'Introduce the purpose of the test.' },
    { id:'slide-2', type:'ipa-chart', title:'IPA Chart', slots:{}, speakerNotes:'Discuss the vowel symbols.' },
    { id:'slide-3', type:'minimal-pairs', title:'Minimal Pairs', slots:{}, speakerNotes:'Compare the vowel contrast.' },
    { id:'slide-4', type:'interlinear-gloss', title:'Interlinear Gloss', slots:{}, speakerNotes:'Walk through each gloss tier.' },
    { id:'slide-5', type:'syntax-tree', title:'Syntax Tree', slots:{}, speakerNotes:'Explain the constituent structure.' }
  ]
};

test('creates a valid editable PPTX package with slide XML and speaker notes', async () => {
  const result = await exportDeckToPptx(deck);
  assert.equal(result.slides, deck.slides.length);
  assert.ok(result.blob instanceof Blob, 'PPTX blob should be returned for save-to-device');
  const tmp = '/tmp/linguaslides-export-test.pptx';
  fs.writeFileSync(tmp, Buffer.from(await result.blob.arrayBuffer()));
  execFileSync('unzip', ['-t', tmp], { stdio: 'pipe' });
  const entries = execFileSync('unzip', ['-Z1', tmp], { encoding: 'utf8' });
  assert.match(entries, /ppt\/slides\/slide1\.xml/);
  assert.match(entries, /ppt\/slides\/slide5\.xml/);
  assert.match(entries, /ppt\/notesSlides\/notesSlide1\.xml/);
  fs.unlinkSync(tmp);
});

test('rejects an empty deck', async () => {
  await assert.rejects(() => exportDeckToPptx({ title: 'Empty', slides: [] }), /Create a deck/);
});
