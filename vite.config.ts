import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import path from 'node:path'

function getDevLabel(): string {
  try {
    // Branche courante uniquement (quand on est vraiment sur une branche)
    const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim()
    if (branch) return branch
  } catch {
    // ignore
  }
  // En detached HEAD (ex. worktree oir) : nom du dossier pour identifier l’agent/worktree, pas une branche d’un autre worktree
  return path.basename(process.cwd())
}

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const devLabel = command === 'serve' ? getDevLabel() : ''
  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_DEV_LABEL': JSON.stringify(devLabel),
    },
  }
})
