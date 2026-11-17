# API Reference

## `TableModel`

The table model that aggregates the search form, pagination, records, add/edit popups and removal actions.

### Type parameters

| Parameter       | Constraint | Default            | Description             |
| --------------- | ---------- | ------------------ | ----------------------- |
| `IRecord`       | `object`   | `any`              | Table record type       |
| `IState`        | `object`   | `any`              | Extra model state type  |
| `ISearchValues` | `object`   | `Partial<IRecord>` | Search form values type |
| `IEditValues`   | `object`   | `Partial<IRecord>` | Edit form values type   |
| `IAddValues`    | `object`   | `Partial<IRecord>` | Add form values type    |

### Constructor

```ts
new TableModel(options: TableOptions)
```

Every `TableOptions` field is optional:

| Option          | Type                                   | Description                                                 |
| --------------- | -------------------------------------- | ----------------------------------------------------------- |
| `state`         | `IState`                               | Extra state, available in `compile` through `$state`        |
| `search`        | See signature below                    | Search method returning records or a result with pagination |
| `edit`          | `(values) => Promise<boolean \| void>` | Edit method; a truthy result refreshes the table            |
| `add`           | `(values) => Promise<boolean \| void>` | Add method; a truthy result refreshes from page one         |
| `remove`        | `(record) => Promise<boolean \| void>` | Remove method; a truthy result refreshes the table          |
| `auto`          | `boolean`                              | Whether `onMount` loads automatically, defaults to `true`   |
| `addOptions`    | `PopupOptions<IAddValues>`             | Form options for the add popup                              |
| `editOptions`   | `PopupOptions<IEditValues>`            | Form options for the edit popup                             |
| `searchOptions` | `IFormProps<ISearchValues>`            | Search form options such as `values` and `initialValues`    |
| `pagination`    | `Partial<IPagination>`                 | Initial pagination merged over the defaults                 |

The `search` signature:

```ts
search?: (
  values: ISearchValues,
  pagination: IPagination
) => Promise<ITableResult<IRecord> | false | void | IRecord[]>
```

Returning an array derives `total` from its length; returning `false` or `void` keeps the current records untouched.

### State

| Member                         | Type                      | Description                                           |
| ------------------------------ | ------------------------- | ----------------------------------------------------- |
| `state`                        | `IState`                  | Observable extra state                                |
| `form`                         | `Form<ISearchValues>`     | Search form instance                                  |
| `pagination`                   | `IPagination`             | Current pagination; replacing the whole object reacts |
| `records`                      | `IRecord[]`               | Records of the current page                           |
| `addPopup`                     | `PopupModel<IAddValues>`  | Add popup model                                       |
| `editPopup`                    | `PopupModel<IEditValues>` | Edit popup model                                      |
| `TableModel.defaultPagination` | `IPagination`             | Static defaults: `1 / 20 / 0`                         |

### Methods

| Method                       | Description                                                        |
| ---------------------------- | ------------------------------------------------------------------ |
| `setPagination(pagination?)` | Merges pagination fields; a no-op when omitted                     |
| `resetSearch()`              | Loads from page one with the current form values (fields are kept) |
| `onSearch(pagination?)`      | Loads the given page, or page one when omitted                     |
| `search()`                   | Submits the search form, then loads data                           |
| `onMount()`                  | Runs `onSearch()` once unless `auto` is `false`                    |
| `onAdd(values)`              | Calls `add`; on success returns to page one and refreshes          |
| `onEdit(values)`             | Calls `edit`; on success returns to page one and refreshes         |
| `onRemove(record, cb?)`      | Calls `remove`; on success refreshes, or runs `cb` instead         |
| `compile(columns, scope?)`   | Compiles table columns with `$table` and `$state` injected         |

## `PopupModel`

The popup form model. It rebuilds the form on `open` and closes automatically when the submit callback returns a truthy value.

### `PopupOptions`

`PopupOptions<IValues>` extends `IFormProps<IValues>`, i.e. every form option accepted by `createForm`.

### State

| Member    | Type            | Description               |
| --------- | --------------- | ------------------------- |
| `visible` | `boolean`       | Whether the popup is open |
| `form`    | `Form<IValues>` | Current form instance     |

### Methods

| Method                          | Description                                                            |
| ------------------------------- | ---------------------------------------------------------------------- |
| `constructor(submit, options?)` | `submit` returning a truthy value closes the popup                     |
| `open(values?, initialValues?)` | Rebuilds the form with given values and opens; omitting keeps defaults |
| `close()`                       | Hides the popup without destroying the form                            |
| `onSubmit()`                    | Submits the form and resolves with the `submit` result                 |
| `createForm(options?)`          | `protected`; subclasses can override form creation                     |

## Types

```ts
interface IPagination {
  current: number
  pageSize: number
  total: number
}

interface ITableResult<IRecord extends object> {
  records?: IRecord[]
  pagination?: IPagination
}

type TableScope<Model extends TableModel = TableModel, State = Model['state']> = {
  $table: Model
  $state: State
}
```

`TableScope` describes the model context available to renderers, so table components can share the same generic shape.
