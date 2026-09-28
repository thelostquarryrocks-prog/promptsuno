import Workspace from '../../components/Workspace'
import { getSoundBrainDiscovery } from '../../lib/sound-brain-catalog'

export default function WorkspacePage() {
  const { nodes, affinities } = getSoundBrainDiscovery()
  return <Workspace discoveryNodes={nodes} affinities={affinities} />
}
