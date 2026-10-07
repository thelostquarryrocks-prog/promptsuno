export type WorkspaceIconName = 'song' | 'lock' | 'unlock' | 'preview' | 'apply' | 'reject' | 'revert' | 'brain' | 'lyrics' | 'doctor' | 'send' | 'copy' | 'download' | 'external'

export default function WorkspaceIcon({ name }: { name: WorkspaceIconName }) {
  const paths = {
    song: 'M3 7h7l2-3h9v16H3V7Zm5 5h8m-8 4h5',
    lock: 'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5V10Zm7 4v3',
    unlock: 'M7 10V7a5 5 0 0 1 9-3M5 10h14v11H5V10Zm7 4v3',
    preview: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm7 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0',
    apply: 'm5 12 4 4L20 5', reject: 'm6 6 12 12M6 18 18 6',
    revert: 'M8 4 3 9l5 5M3 9h10a7 7 0 0 1 0 14',
    brain: 'M3 12h3l3-7 5 14 3-7h4', lyrics: 'm4 16 12-12 4 4L8 20H4v-4ZM13 7l4 4',
    doctor: 'M9 3h6m-5 0v7L4 20h16l-6-10V3M8 15h8',
    send: 'M4 12 20 4l-6 16-3-7-7-1Zm7 1 9-9',
    copy: 'M8 8h12v12H8V8Zm-4 8V4h12',
    download: 'M12 4v11m-5-5 5 5 5-5M5 20h14',
    external: 'M14 4h6v6m0-6-9 9M18 14v6H4V6h6',
  }
  return <svg className="workspace-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
