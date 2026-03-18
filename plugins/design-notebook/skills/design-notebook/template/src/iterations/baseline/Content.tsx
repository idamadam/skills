export function Content(_props: { state: Record<string, never> }) {
  return (
    <div style={{
      minHeight: 400,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--nb-font-sans)',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: 360,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        <div style={{
          fontSize: 15,
          fontWeight: 500,
          color: 'var(--nb-text)',
        }}>
          No iterations yet
        </div>
        <div style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: 'var(--nb-text-dim)',
        }}>
          Share a screenshot or describe a concept to create your first iteration. The notebook will record each step as you explore.
        </div>
      </div>
    </div>
  )
}
