import { Schema } from '@formvk/schema'

// #region instance
export const schema = new Schema({
  type: 'object',
  properties: {
    username: {
      type: 'string',
      title: 'Username',
      component: 'Input',
      xCustomThing: true,
    },
  },
})
// #endregion

// #region declaration-merging
declare module '@formvk/schema' {
  interface ISchema {
    myWidget?: string
  }
}
// #endregion
