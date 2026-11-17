<script setup lang="ts">
import { computed } from 'vue'

interface TableColumn {
  key: string
  title: string
}

interface TableAction {
  label: string
  danger?: boolean
  onClick: (record: any) => void
}

interface TablePagination {
  current: number
  pageSize: number
  total: number
}

const props = withDefaults(
  defineProps<{
    columns: TableColumn[]
    records: Record<string, any>[]
    actions?: TableAction[]
    pagination?: TablePagination
    empty?: string
    createText?: string
  }>(),
  { empty: 'No records' }
)

const emit = defineEmits<{
  create: []
  pageChange: [current: number]
}>()

const pageCount = computed(() =>
  props.pagination ? Math.max(1, Math.ceil(props.pagination.total / props.pagination.pageSize)) : 1
)
</script>

<template>
  <div class="dv-table">
    <div v-if="$slots.toolbar" class="dv-table__toolbar">
      <slot name="toolbar" />
    </div>

    <table class="dv-table__table">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key">{{ column.title }}</th>
          <th v-if="actions?.length">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(record, index) in records" :key="record.id ?? index">
          <td v-for="column in columns" :key="column.key">{{ record[column.key] }}</td>
          <td v-if="actions?.length" class="dv-table__actions">
            <button
              v-for="action in actions"
              :key="action.label"
              :class="['dv-table__btn', action.danger ? 'dv-table__btn--danger' : 'dv-table__btn--ghost']"
              @click="action.onClick(record)"
            >
              {{ action.label }}
            </button>
          </td>
        </tr>
        <tr v-if="records.length === 0">
          <td :colspan="columns.length + (actions?.length ? 1 : 0)" class="dv-table__empty">{{ empty }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="pagination || createText" class="dv-table__footer">
      <template v-if="pagination">
        <button
          class="dv-table__btn dv-table__btn--ghost"
          :disabled="pagination.current <= 1"
          @click="emit('pageChange', pagination.current - 1)"
        >
          Prev
        </button>
        <span>{{ pagination.current }} / {{ pageCount }}</span>
        <button
          class="dv-table__btn dv-table__btn--ghost"
          :disabled="pagination.current >= pageCount"
          @click="emit('pageChange', pagination.current + 1)"
        >
          Next
        </button>
      </template>
      <button v-if="createText" class="dv-table__btn dv-table__create" @click="emit('create')">{{ createText }}</button>
    </div>
  </div>
</template>

<style>
.dv-table {
  margin-top: 16px;
  font-size: 14px;
  color: var(--vp-c-text-1, #1e293b);
}

.dv-table__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;
}

.dv-table__table {
  width: 100%;
  border-collapse: collapse;
}

.dv-table__table th,
.dv-table__table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid var(--vp-c-divider, #e2e8f0);
}

.dv-table__table th {
  font-weight: 500;
  color: var(--vp-c-text-2, #64748b);
}

.dv-table__actions {
  white-space: nowrap;
}

.dv-table__empty {
  color: var(--vp-c-text-2, #64748b);
}

.dv-table__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-top: 14px;
  font-size: 13px;
  color: var(--vp-c-text-2, #64748b);
}

.dv-table__btn {
  padding: 7px 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  color: #fff;
  cursor: pointer;
  background-color: var(--vp-c-brand-1, #2563eb);
  transition:
    opacity 0.2s,
    border-color 0.2s,
    color 0.2s;
}

.dv-table__btn:hover {
  opacity: 0.88;
}

.dv-table__btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.dv-table__btn--ghost {
  color: var(--vp-c-text-1, #1e293b);
  background-color: transparent;
  border-color: var(--vp-c-divider, #e2e8f0);
}

.dv-table__btn--danger {
  color: #e5484d;
  background-color: transparent;
}

.dv-table__create {
  margin-left: auto;
}
</style>
