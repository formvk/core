// #region format
// format string
const formatDescriptor = { validator: 'email' }
// #endregion

// #region fn
// custom function
const functionDescriptor = {
  validator: (value: number) => value > 0 || 'must be positive',
}
// #endregion

// #region rules
// rule object, or an array of them
const rulesDescriptor = {
  validator: [
    { required: true, message: 'Name is required' },
    { minLength: 3, maxLength: 20, message: 'Use 3–20 characters' },
  ],
}
// #endregion

void formatDescriptor
void functionDescriptor
void rulesDescriptor
