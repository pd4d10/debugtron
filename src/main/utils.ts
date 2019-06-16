export class PortPool {
  initialPort = 10000

  getPort() {
    // TODO: test port available
    this.initialPort++
    return this.initialPort
  }
}
