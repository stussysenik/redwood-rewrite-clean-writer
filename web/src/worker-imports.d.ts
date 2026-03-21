// Type declarations for Vite's ?worker import suffix
declare module '*?worker' {
  const WorkerConstructor: {
    new (): Worker
  }
  export default WorkerConstructor
}
