import { Button } from '@/components/ui/button'

function App() {
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
  }

  return (
    <main className="min-h-svh grid place-items-center gap-4 bg-background p-6 text-foreground">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        SleepTracker
      </h1>
      <p className="text-muted-foreground text-sm">
        Default is dark (#0a0a0a). Toggle to verify light mode.
      </p>
      <div className="flex gap-3">
        <Button>Click me</Button>
        <Button variant="outline" onClick={toggleTheme}>
          Toggle theme
        </Button>
      </div>
    </main>
  )
}

export default App
