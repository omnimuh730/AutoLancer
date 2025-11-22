import React, { createContext, useContext, useMemo, useState } from 'react';

const ApplierContext = createContext({ applier: null, setApplier: () => {} });

export const ApplierProvider = ({ children }) => {
  const [applier, setApplier] = useState(null);
  const value = useMemo(() => ({ applier, setApplier }), [applier]);
  return <ApplierContext.Provider value={value}>{children}</ApplierContext.Provider>;
};

export const useApplier = () => useContext(ApplierContext);

export default ApplierContext;
