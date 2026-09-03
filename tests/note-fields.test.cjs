const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { randomUUID } = require('node:crypto');
const { test } = require('node:test');
const vm = require('node:vm');

const html = readFileSync(new URL('../src/index.html', `file://${__filename}`), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// Minimal DOM adapter: execute the actual app and its registered event handlers.
function setup(values = {}) {
  const fields = ['checklist', 'tags', 'links', 'attachments', 'number', 'short', 'wikipedia']
    .map(type => ({ id: type, type, label: type }));
  const collection = {
    id: 'collection', name: 'Test', fields,
    notes: [{ id: 'note', title: 'Existing note', updatedAt: new Date().toISOString(), values }],
  };
  const elements = new Map();
  const inputs = new Map();
  function element(selector) {
    if (!elements.has(selector)) elements.set(selector, {
      value: '', dataset: {}, style: {},
      classList: { add() {}, remove() {}, toggle() {} },
      addEventListener() {}, querySelector: element, focus() {},
    });
    return elements.get(selector);
  }
  let saved = JSON.stringify([collection]);
  const context = vm.createContext({
    crypto: { randomUUID }, structuredClone, console,
    document: {
      querySelector: element,
      querySelectorAll: selector => inputs.get(selector) || [],
      body: element('body'), addEventListener() {},
    },
    localStorage: { getItem: () => saved, setItem: (_, value) => { saved = value; } },
    setTimeout() {}, clearTimeout() {}, requestAnimationFrame() {},
  });
  vm.runInContext(script, context);
  const run = code => vm.runInContext(code, context);
  run("openNoteModal('note')");
  return {
    run, element, inputs,
    draft: () => JSON.parse(run('JSON.stringify(noteDraft.values)')),
    saved: () => JSON.parse(saved)[0].notes[0].values,
    click: (action, id, index = 0) => element('#note-fields').onclick({
      target: { dataset: { [action]: id, index }, closest: () => null },
    }),
  };
}

for (const empty of [undefined, null]) {
  test(`checklist added to an existing note with ${empty} value supports add, edit, save and reopen`, async () => {
    const app = setup({ checklist: empty });
    await app.click('addCheck', 'checklist');
    assert.deepEqual(app.draft().checklist, [{ text: '', done: false }]);
    app.inputs.set('[data-check-text]', [{ dataset: { checkText: 'checklist', index: 0 }, value: 'First item' }]);
    app.inputs.set('[data-check-done]', [{ dataset: { checkDone: 'checklist', index: 0 }, checked: true }]);
    await app.click('addCheck', 'checklist');
    assert.deepEqual(app.draft().checklist, [{ text: 'First item', done: true }, { text: '', done: false }]);
    await app.click('removeCheck', 'checklist', 1);
    app.run('saveNote()');
    assert.deepEqual(app.saved().checklist, [{ text: 'First item', done: true }]);
    app.run("openNoteModal('note')");
    assert.deepEqual(app.draft().checklist, [{ text: 'First item', done: true }]);
  });
}

test('other missing array fields support their add handlers', async () => {
  const app = setup();
  await app.click('addLink', 'links');
  app.element('#note-fields').onkeydown({
    key: 'Enter', preventDefault() {},
    target: { value: 'tag', dataset: { addTag: 'tags' }, matches: selector => selector === '[data-add-tag]' },
  });
  app.element('#note-fields').onchange({
    target: {
      matches: () => true, dataset: { file: 'attachments' },
      files: [{ name: 'example.txt', size: 10, type: 'text/plain' }],
    },
  });
  assert.deepEqual(app.draft().links, ['']);
  assert.deepEqual(app.draft().tags, ['tag']);
  assert.deepEqual(app.draft().attachments, [{ name: 'example.txt', size: 10, type: 'text/plain' }]);
});

test('opening and cancelling preserves stored values and keeps draft arrays independent', async () => {
  const original = { checklist: [{ text: 'Keep me', done: true }], number: 0, short: '' };
  const app = setup(original);
  assert.deepEqual(app.draft().checklist, original.checklist);
  assert.equal(app.draft().number, 0);
  assert.equal(app.draft().short, '');
  await app.click('addCheck', 'checklist');
  assert.deepEqual(app.saved(), original);
  app.run("closeModal(noteModal); openNoteModal('note')");
  assert.deepEqual(app.draft().checklist, original.checklist);
});

test('new notes still initialize every field with its correct empty value', async () => {
  const app = setup();
  app.run('openNoteModal()');
  assert.deepEqual(app.draft(), {
    checklist: [], tags: [], links: [], attachments: [], number: '', short: '',
    wikipedia: { query: '', results: [] },
  });
  await app.click('addCheck', 'checklist');
  assert.equal(app.draft().checklist.length, 1);
});
