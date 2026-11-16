import { FormPath } from '@formvk/core'

// #region match
const pattern = FormPath.parse('members.*.email')

pattern.match('members.0.email') // true
pattern.match('members.0.name') // false
// #endregion

// #region values
const values = { members: [{ email: 'a@example.com' }] }

FormPath.getIn(values, 'members.0.email') // 'a@example.com'
FormPath.setIn(values, 'members.1.email', 'b@example.com')
FormPath.deleteIn(values, 'members.0.email')
// #endregion

// #region transform
const path = FormPath.parse('members.0.email')

path.parent().toString() // 'members.0'
path.concat('domain').toString() // 'members.0.email.domain'
// #endregion

void values
