import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
  initializeBlock,
  Box,
  Text,
  Select,
  Button,
  Heading,
  useBase,
} from '@airtable/blocks/ui'
import cmp from 'semver-compare'
import mapping from './mapping.json'
import testDeployment from '../../deployments/1.2.2.json'

/**
 * Some sample deployment data.
 */
const deployments = [
  { version: '1.2.2', notes: 'Adds an email field', config: testDeployment },
  {
    version: '1.2.3',
    notes: 'Makes the name field required',
    config: testDeployment,
  },
]

const currentVersion = '1.1.1'

/**
 * Preview of what a particular version deployment will do to the Airtable base
 * @component
 * @example
 * const version = {version: '1.2.1', config: {}}
 * const back = () => setBack(true)
 * return (
 *   <UpgradePreview version={version} back={() => { setUpgrading(false) }} />
 * )
 */
const UpgradePreview = ({ version, back }) => {
  const base = useBase()
  const [upgradeResults, setUpgradeResults] = useState(false)

  const changes = []

  const baseMapping = mapping.clients.find((client) => client.id === base.id)

  /*
   * Iterate over tables and create an array of changes to review then implement.
   * Each change is an object with a `note` to let the user what will happen and an
   * `action` function that we pass to
   **/
  base.tables.forEach((table) => {
    const mappedTable = baseMapping.tables.find(
      (mappingTable) => mappingTable.id === table.id
    )
    const { sourceTable } = mappedTable
    const sourceFields = mappedTable.fields

    const versionTable = version.config.tables.find(
      (versionTable) => versionTable.id === sourceTable.airtableId
    )
    versionTable.fields.forEach((versionField) => {
      const sourceField = sourceFields.find(
        (mappingField) =>
          mappingField.sourceField.airtableId === versionField.id
      )
      if (!sourceField) {
        changes.push({
          note: (
            <>
              Create a new field <strong>{versionField.name}</strong> in the
              table {table.name}.
            </>
          ),
          action: () =>
            new Promise((resolve) => {
              table
                .createFieldAsync(
                  versionField.name,
                  versionField.type,
                  versionField.config.options,
                  versionField.description
                )
                .then((result) => {
                  resolve(
                    <>
                      Added new field <strong>{versionField.name}</strong> to{' '}
                      <strong>{table.name}</strong>
                    </>
                  )
                })
            }),
        })
      }
    })
  })

  const performUpgrade = async () => {
    const results = await Promise.all(changes.map(({ action }) => action()))
    setUpgradeResults(results)
  }

  return (
    <>
      <Button icon="chevronLeft" onClick={back}>
        Back to version list
      </Button>
      {upgradeResults ? (
        <>
          <Text>Your Airtable base has been upgraded!</Text>
          <ul style={{ listStyleType: 'none', padding: 'none' }}>
            {upgradeResults.map((result, index) => (
              <li key={`result-${index}`}>
                <Text marginTop={2}>{result}</Text>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p>Upgrade preview for version {version.version} </p>
          <Heading>Changes preview</Heading>
          <ul style={{ listStyleType: 'none', padding: 'none' }}>
            {changes.map((change, index) => (
              <li key={`preview-${index}`}>
                <Text marginTop={2}>{change.note}</Text>
              </li>
            ))}
          </ul>
          <Button onClick={performUpgrade}>Upgrade</Button>
        </>
      )}
    </>
  )
}

UpgradePreview.propTypes = {
  /**
   * Deployment configuration object
   */
  version: PropTypes.object.isRequired,
  /**
   * Function to run when back button is clicked
   */
  back: PropTypes.func.isRequired,
}

/**
 * Main upgrade app. Presents a dropdown of available versions to upgrade to,
 * then passes the selected version to `UpgradePreview`.
 * @component
 */
const UpgradeApp = () => {
  const potentialDeployments = deployments.filter(
    (deployment) => cmp(deployment.version, currentVersion) > 0
  )
  const [nextVersion, setNextVersion] = useState(
    potentialDeployments[0].version
  )
  const [upgrading, setUpgrading] = useState(false)

  return (
    <Box width="100%" padding={2}>
      {upgrading ? (
        <UpgradePreview
          version={potentialDeployments.find(
            ({ version }) => version === nextVersion
          )}
          back={() => {
            setUpgrading(false)
          }}
        />
      ) : (
        <>
          {potentialDeployments.length ? (
            <>
              <Text>There are upgrades available</Text>
              <Select
                options={potentialDeployments.map((deployment, key) => ({
                  value: deployment.version,
                  label: `${deployment.version}: ${deployment.notes}`,
                }))}
                value={potentialDeployments[0].version}
                onChange={(newValue) => setNextVersion(newValue)}
                width="320px"
              />
              <Button
                style={{ marginTop: '1rem' }}
                onClick={() => setUpgrading(true)}
                icon="bolt"
                variant="primary"
              >
                Preview upgrade
              </Button>
            </>
          ) : (
            <Text>You are all up to date!</Text>
          )}
        </>
      )}
    </Box>
  )
}

initializeBlock(() => <UpgradeApp />)
