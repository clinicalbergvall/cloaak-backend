// Define React types to resolve namespace issues
declare module 'react' {
  export * from 'react';
}

// Global React namespace definition
declare global {
  namespace React {
    export = __React;
  }
}

// Import actual React types
import * as __React from 'react';