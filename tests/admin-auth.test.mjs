import assert from "node:assert/strict"

import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  verifyAdminPassword,
} from "../lib/admin-auth.ts"

assert.equal(ADMIN_SESSION_COOKIE, "campusmind-admin-session")

assert.equal(verifyAdminPassword("secret-pass", "secret-pass"), true)
assert.equal(verifyAdminPassword("secret-pass", "wrong-pass"), false)
assert.equal(verifyAdminPassword("", "secret-pass"), false)

const token = createAdminSessionToken("secret-pass")

assert.equal(typeof token, "string")
assert.equal(token.length, 64)
assert.equal(token, createAdminSessionToken("secret-pass"))
assert.notEqual(token, createAdminSessionToken("another-pass"))

console.log("admin auth tests passed")
