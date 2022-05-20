import Airtable from 'airtable'

/**
 * A simple tool that converts the table and field mappings
 * for all client Airtable bases into a single object. Just
 * for demonstration purposes.
 */
var base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base(
  'appVZByAVLBgPfcOy'
)

const mappings = []

;(async () => {
  const tables = await (
    await base('Source tables').select().all()
  ).map((record) => ({
    _id: record.getId(),
    id: record.get('ID'),
    name: record.get('Name'),
    airtableId: record.get('Airtable ID'),
  }))
  const fields = await (
    await base('Source fields').select().all()
  ).map((record) => ({
    _id: record.getId(),
    id: record.get('ID'),
    name: record.get('Name'),
    airtableId: record.get('Airtable ID'),
  }))

  const clientFields = await (
    await base('Client fields').select().all()
  ).map((record) => ({
    _id: record.getId(),
    id: record.get('Airtable ID'),
    table: record.get('Client tables')[0],
    sourceField: fields.find(
      (field) => field._id === record.get('Source fields')[0]
    ),
  }))

  const clientTables = await (
    await base('Client tables').select().all()
  ).map((record) => ({
    _id: record.getId(),
    id: record.get('Airtable ID'),
    sourceTable: tables.find(
      (table) => table._id === record.get('Source table')[0]
    ),
    fields: clientFields.filter((field) => field.table === record.getId()),
  }))

  const clients = await (
    await base('Client bases').select().all()
  ).map((record) => ({
    id: record.get('Base ID'),
    version: record.get('Version'),
    tables: clientTables.filter(
      (table) => record.get('Client tables').indexOf(table._id) > -1
    ),
  }))

  console.log(
    JSON.stringify(
      {
        source: {
          tables,
          fields,
        },
        clients,
      },
      null,
      2
    )
  )
})()
