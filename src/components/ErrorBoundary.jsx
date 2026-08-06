import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app">
          <main className="content">
            <section className="card hero-card">
              <h2>Something went wrong</h2>
              <p>
                The app crashed. Try refreshing the page. If the problem
                persists, the data is safe — it's stored on the server.
              </p>
              <p style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-soft)', wordBreak: 'break-word' }}>
                {this.state.error?.message ?? String(this.state.error)}
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  this.setState({ error: null })
                  window.location.reload()
                }}
              >
                Reload
              </button>
            </section>
          </main>
        </div>
      )
    }

    return this.props.children
  }
}
