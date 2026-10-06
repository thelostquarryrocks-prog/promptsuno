import { connection } from 'next/server'
import Workspace from '../../components/Workspace'
import { getSoundBrainDiscovery } from '../../lib/sound-brain-catalog'

export default async function WorkspacePage() {
  await connection()
  const { nodes, affinities } = getSoundBrainDiscovery()
  return <Workspace discoveryNodes={nodes} affinities={affinities} assistanceAvailable={process.env.WORKSPACE_ASSIST_ENABLED === 'true' && Boolean(process.env.OPENAI_API_KEY)} />
}
