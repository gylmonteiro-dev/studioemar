import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDemoUsers } from './demo-seed';

test('configura credenciais próprias para a homologação', () => {
  const users = buildDemoUsers({
    defaultPasswordHash: 'student-hash',
    users: {
      'user-ana': {
        mustSetPassword: false,
        passwordHash: 'student-hash',
      },
      'user-carlos': {
        name: 'Elissandro',
        email: 'Elissandro@MAIL.COM',
        mustSetPassword: false,
        passwordHash: 'trainer-hash',
      },
    },
  });

  const trainer = users.find((user) => user.id === 'user-carlos');
  const firstAccessStudent = users.find((user) => user.id === 'user-ana');

  assert.equal(trainer?.name, 'Elissandro');
  assert.equal(trainer?.email, 'elissandro@mail.com');
  assert.equal(trainer?.passwordHash, 'trainer-hash');
  assert.equal(firstAccessStudent?.mustSetPassword, false);
  assert.equal(firstAccessStudent?.passwordHash, 'student-hash');
});
