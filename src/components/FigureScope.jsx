import React from 'react';

/**
 * Numbering scope for figures. `App`'s atlas view provides the current node id
 * so each node numbers its own figures; the scroll carrier keeps the default
 * `document` scope so the whole article shares one sequence. Kept out of the
 * component barrel on purpose: it is renderer plumbing, not an MDX component.
 */
export const FigureScope = React.createContext('document');

export function FigureScopeProvider({ scope, children }) {
  return <FigureScope.Provider value={scope || 'document'}>{children}</FigureScope.Provider>;
}

export function useFigureScope() {
  return React.useContext(FigureScope);
}
