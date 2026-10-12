import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

interface ErrorBoundaryProps {
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }
  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-red-600 font-sans">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <p className="mb-2">Please check the console for details.</p>
          <pre className="bg-red-50 p-4 rounded border border-red-200 overflow-auto text-sm">
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);