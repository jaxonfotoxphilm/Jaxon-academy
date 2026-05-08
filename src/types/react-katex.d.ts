declare module 'react-katex' {
  import * as React from 'react';
  
  export interface MathComponentProps {
    math: string;
    block?: boolean;
    errorColor?: string;
    renderError?: (error: Error | TypeError) => React.ReactNode;
    settings?: any;
    as?: string;
    children?: React.ReactNode;
  }

  export const InlineMath: React.FC<MathComponentProps>;
  export const BlockMath: React.FC<MathComponentProps>;
}
