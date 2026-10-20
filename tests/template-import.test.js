import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeImportedTemplate } from '../src/templateImport.js';

const sample = {
  id: 'map-isogloss', name: 'Map / Isogloss', layout: 'map',
  category: 'Dialectology', tags: ['Dialectology', 'Sociolinguistics'],
  theme: {
    background: '#F3F0E5', primary: '#293B36', text: '#293B36',
    muted: '#68766E', accent: '#B35E45', fontFamily: 'Source Serif 4'
  },
  layouts: [{ type: 'title', title: 'Dialect boundaries' }, { type: 'map', title: 'Isogloss map' }]
};

test('imports map template and preserves its colors/layout/font', () => {
  const theme = normalizeImportedTemplate(sample, 123);
  assert.equal(theme.id, 'custom-map-isogloss-123');
  assert.equal(theme.layout, 'map');
  assert.equal(theme.bg, '#f3f0e5');
  assert.equal(theme.ink, '#293b36');
  assert.equal(theme.muted, '#68766e');
  assert.equal(theme.accent, '#b35e45');
  assert.equal(theme.font, 'Source Serif 4');
  assert.deepEqual(theme.map, ['Dialect boundaries', 'Isogloss map']);
});

test('accepts deck-style colorTokens and wrapped template JSON', () => {
  const theme = normalizeImportedTemplate({ template: {
    id: 'wrapped-map', name: 'Wrapped Map', layout: 'map',
    theme: { colorTokens: { background: '#112233', primary: '#223344', secondary: '#334455', accent: '#445566' }, typeface: 'JetBrains Mono' },
    slides: [{ title: 'Atlas' }]
  }}, 456);
  assert.equal(theme.layout, 'map');
  assert.equal(theme.bg, '#112233');
  assert.equal(theme.ink, '#223344');
  assert.equal(theme.muted, '#334455');
  assert.equal(theme.accent, '#445566');
  assert.equal(theme.font, 'JetBrains Mono');
});

test('defaults to the plain frame layout when layout is omitted', () => {
  assert.equal(normalizeImportedTemplate({ ...sample, layout: undefined }, 1).layout, 'frame');
});

test('rejects malformed colors instead of silently replacing them', () => {
  assert.throws(() => normalizeImportedTemplate({ ...sample, theme: { ...sample.theme, accent: '#B35E' } }), /Invalid theme\.accent color/);
});

test('rejects unsupported explicit layouts', () => {
  assert.throws(() => normalizeImportedTemplate({ ...sample, layout: 'unknown' }), /Unsupported layout/);
});

test('rejects missing names and malformed slide entries', () => {
  assert.throws(() => normalizeImportedTemplate({ layouts: [{}] }), /Missing required field: name/);
  assert.throws(() => normalizeImportedTemplate({ ...sample, layouts: ['not an object'] }), /Every layouts\/slides item/);
});

test('keeps imported slide titles, types and body text', () => {
  const theme = normalizeImportedTemplate({
    name: 'Mine', theme: { background: '#102030', text: '#eeeeee', accent: '#ff8800' },
    layouts: [{ type: 'title', title: 'Hello', body: [] }, { type: 'content', title: 'Points', body: ['One', 'Two'] }]
  }, 1);
  assert.equal(theme.content.length, 2);
  assert.deepEqual(theme.content[1], { type: 'content', title: 'Points', body: ['One', 'Two'] });
  assert.equal(theme.bg, '#102030');
});

test('accepts colors nested in theme.colors, short hex and hex without #', () => {
  const theme = normalizeImportedTemplate({
    name: 'Nested', theme: { colors: { background: 'fff', text: '112233', accent: 'rgb(255, 0, 0)' }, font: 'Georgia' },
    layouts: [{ title: 'A' }]
  }, 2);
  assert.equal(theme.bg, '#ffffff');
  assert.equal(theme.ink, '#112233');
  assert.equal(theme.accent, '#ff0000');
  assert.equal(theme.font, 'Source Serif 4');
});

test('accepts a deck JSON exported by the app (no top-level name)', () => {
  const theme = normalizeImportedTemplate({
    templateId: 'x', title: 'My deck',
    theme: { name: 'Deck Theme', typeface: 'Inter', colorTokens: { background: '#0b2037', primary: '#f3f7fc', secondary: '#a5b6c9', accent: '#55d8e5' } },
    slides: [{ type: 'title', title: 'My deck', slots: { body: 'Intro' } }, { type: 'x', title: 'Two', slots: { body: 'A\nB' } }]
  }, 3);
  assert.equal(theme.name, 'Deck Theme');
  assert.equal(theme.bg, '#0b2037');
  assert.deepEqual(theme.content[1].body, ['A', 'B']);
});
