import test from 'node:test';
import assert from 'node:assert/strict';
import { messageText, validMessage, participantPair } from '../src/lib/community-chat.ts';
test('mensagens aceitam no máximo 500 caracteres', () => {
  assert.equal(validMessage('a'.repeat(500)), true);
  assert.equal(validMessage('a'.repeat(501)), false);
  assert.equal(validMessage('🙏'.repeat(500)), true);
  assert.equal(validMessage('  '), false);
});
test('conteúdo é texto sem HTML', () => {
  assert.equal(messageText('<b>Paz</b> <script>alert(1)</script>'), 'Paz alert(1)');
});
test('um par tem a mesma identidade em ambas as direções', () => {
  assert.deepEqual(participantPair('b', 'a'), { user_a: 'a', user_b: 'b' });
  assert.deepEqual(participantPair('a', 'b'), participantPair('b', 'a'));
  assert.throws(() => participantPair('a', 'a'));
});