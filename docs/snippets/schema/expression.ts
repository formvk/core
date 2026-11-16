import { createExpression } from '@formvk/schema'

// #region guide-expression
// Pass the scope shape as the generic parameter; without it T defaults to object and no property completion is available.
const exp = createExpression<{ role: string; age: number; subscribe: boolean; email: string }>('$values')

exp.role.eq('admin') // '{{$values.role === "admin"}}'
exp.age.gte(18) // '{{$values.age >= 18}}'
exp.subscribe.and(exp.email) // '{{$values.subscribe && $values.email}}'
// #endregion

// #region api-expression
const apiExp = createExpression<{ plan: string; subscribe: boolean }>('$values')

apiExp.plan.eq('enterprise') // '{{$values.plan === "enterprise"}}'
apiExp.subscribe.not() // '{{!$values.subscribe}}'
apiExp.plan.ter('pro', 'free') // '{{$values.plan ? "pro" : "free"}}'
// #endregion
