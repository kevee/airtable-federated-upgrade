import React, { useState } from 'react'
import mapping from './mapping.json'
import {
  initializeBlock,
  Box,
  FormField,
  Input,
  useBase,
  useSession,
} from '@airtable/blocks/ui'

/**
 * Main deployment builder app. Converts the current base's tables and fields
 * into a deployment object.
 * @component
 */
const DeploymentApp = () => {
  const base = useBase()
  const session = useSession()
  const [version, setVersion] = useState('0.0.0')

  const deployCode = {
    version,
    author: session.currentUser.name
      ? `${session.currentUser.name} <${session.currentUser.email}>`
      : 'unknown',
    tables: [],
  }

  const formatField = (field) => ({
    id: field.id,
    name: field.name,
    description: field.description,
    type: field.type,
    config: { ...field.config },
    sourceField: mapping.source.fields.find(
      (sourceField) => sourceField.airtableId === field.id
    ),
  })

  base.tables.forEach((table) => {
    if (table.isDeleted) {
      return
    }
    const fields = table.fields
      .filter((field) => !field.isDeleted)
      .map(formatField)
    deployCode.tables.push({
      id: table.id,
      name: table.name,
      description: table.description,
      sourceTable: mapping.source.tables.find(
        (sourceTable) => sourceTable.airtableId === table.id
      ),
      primaryField: formatField(table.primaryField),
      fields,
    })
  })

  return (
    <Box
      width="100%"
      padding={2}
      borderWidth="2px 0 0 0"
      borderStyle="solid"
      borderColor="#e5e5e5"
    >
      <FormField label="Version number">
        <Input value={version} onChange={(e) => setVersion(e.target.value)} />
      </FormField>
      <label
        htmlFor="deploy-code"
        style={{
          display: 'block',
          fontWeight: 'bold',
          marginBottom: '1rem',
        }}
      >
        Deployment code
      </label>
      <textarea
        id="deploy-code"
        style={{ fontFamily: 'monospace', width: '100%' }}
        rows="15"
        value={JSON.stringify(deployCode, null, 2)}
      />
    </Box>
  )
}

initializeBlock(() => <DeploymentApp />)
