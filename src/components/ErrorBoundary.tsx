import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'অপ্রত্যাশিত ত্রুটি ঘটেছে'
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Application ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen relative flex items-center justify-center p-4">
          <div className="glass-atmospheric-canvas" aria-hidden="true" />
          <div className="max-w-md w-full glass-surface rounded-2xl p-6 sm:p-8 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl glass-3d-icon-well text-[#B45309] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold text-[#132219]">
              সিস্টেমে সাময়িক ত্রুটি দেখা দিয়েছে
            </h1>
            <p className="text-sm text-[#3F5247] leading-relaxed">
              অনুগ্রহ করে পৃষ্ঠাটি পুনরায় লোড করুন। আপনার স্থানীয় অগ্রগতি ব্রাউজারে সংরক্ষিত রয়েছে।
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold btn-3d-emerald rounded-xl cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>পুনরায় লোড করুন</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
