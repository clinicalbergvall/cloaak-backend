// React shim to resolve namespace issues
import * as ReactAll from 'react';

declare global {
  namespace React {
    export = ReactAll;
  }
}

export {};