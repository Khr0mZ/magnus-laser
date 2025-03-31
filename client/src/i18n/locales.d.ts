declare module '*.json' {
    const value: { [key: string]: Record<string, unknown> }
    export default value
}
