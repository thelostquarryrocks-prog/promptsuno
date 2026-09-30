import { connection } from 'next/server'
import Workspace from '../../components/Workspace'
import { getSoundBrainDiscovery } from '../../lib/sound-brain-catalog'

export default async function WorkspacePage() {
  await connection()
  const { nodes, affinities } = getSoundBrainDiscovery()
  return <Workspace discoveryNodes={nodes} affinities={affinities} />
}
