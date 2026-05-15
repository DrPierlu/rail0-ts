export class Rail0ApiError extends Error {
  readonly status: number
  readonly error: string

  constructor(status: number, body: { error: string; message: string }) {
    super(body.message)
    this.name = 'Rail0ApiError'
    this.status = status
    this.error = body.error
  }
}
