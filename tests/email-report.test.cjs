const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { randomUUID } = require('node:crypto');
const { test } = require('node:test');
const vm = require('node:vm');

const html = readFileSync(new URL('../src/index.html', `file://${__filename}`), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function boot() {
  const fieldId = randomUUID();
  const collection = {
    id: 'collection',
    name: 'Product Updates',
    description: 'Weekly status notes.',
    fields: [{ id: fieldId, type: 'long', label: 'Summary' }],
    notes: [{
      id: 'note',
      title: 'Launch recap',
      updatedAt: '2026-10-01T15:30:00.000Z',
      values: { [fieldId]: 'Shipped the first version.' },
    }],
  };
  const elements = new Map();
  function element(selector) {
    if (!elements.has(selector)) {
      elements.set(selector, {
        value: '',
        textContent: '',
        hidden: true,
        disabled: false,
        dataset: {},
        style: {},
        classList: { add() {}, remove() {}, toggle() {} },
        addEventListener() {},
        querySelector: element,
        focus() {},
        setAttribute() {},
        removeAttribute() {},
      });
    }
    return elements.get(selector);
  }
  let saved = JSON.stringify([collection]);
  const context = vm.createContext({
    crypto: { randomUUID },
    structuredClone,
    console,
    document: {
      querySelector: element,
      querySelectorAll: () => [],
      body: element('body'),
      addEventListener() {},
      createElement: () => ({ click() {}, href: '', download: '' }),
    },
    localStorage: { getItem: () => saved, setItem: (_, value) => { saved = value; } },
    setTimeout() {},
    clearTimeout() {},
    requestAnimationFrame() {},
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
    Blob: class Blob {
      constructor(parts) { this.parts = parts; }
    },
    navigator: { clipboard: { writeText: async () => {} } },
  });
  vm.runInContext(script, context);
  return { run: code => vm.runInContext(code, context) };
}

test('buildNoteReportMjml includes note, collection, and field content', () => {
  const app = boot();
  const mjml = app.run(`
    buildNoteReportMjml(
      activeCollection().notes[0],
      activeCollection()
    )
  `);
  assert.match(mjml, /^<mjml>/);
  assert.match(mjml, /Launch recap/);
  assert.match(mjml, /Product Updates/);
  assert.match(mjml, /Shipped the first version/);
  assert.match(mjml, /<mj-preview>/);
});

test('fieldValueReportHtml skips empty fields', () => {
  const app = boot();
  const body = app.run(`
    fieldValueReportHtml({ type: 'tags', label: 'Tags' }, [])
  `);
  assert.equal(body, '');
});
