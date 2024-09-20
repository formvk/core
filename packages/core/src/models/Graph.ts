import { each, FormPath } from '@formvk/shared'
import { isArrayFieldState, isFieldState, isFormState, isObjectFieldState } from '../shared'
import type { IFormGraph } from '../types'
import type { Form } from './Form'

export class Graph {
  constructor(public form: Form) {}

  getGraph = (): IFormGraph => {
    const graph = {}
    graph[''] = this.form.getState()
    each(this.form.fields, (field: any, identifier) => {
      graph[identifier] = field.getState()
    })
    return graph
  }

  setGraph = (graph: IFormGraph) => {
    const form = this.form
    const createField = (identifier: string, state: any) => {
      const address = FormPath.parse(identifier)
      const name = address.segments[address.segments.length - 1]
      const basePath = address.parent()
      if (isFieldState(state)) {
        return this.form.createField({ name, basePath })
      } else if (isArrayFieldState(state)) {
        return this.form.createArrayField({ name, basePath })
      } else if (isObjectFieldState(state)) {
        return this.form.createObjectField({ name, basePath })
      } else {
        return this.form.createVoidField({ name, basePath })
      }
    }
    each(graph, (state, address) => {
      if (isFormState(state)) {
        form.setState(state)
      } else {
        const field = form.fields[address]
        if (field) {
          field.setState(state)
        } else {
          createField(address, state).setState(state)
        }
      }
    })
  }
}
