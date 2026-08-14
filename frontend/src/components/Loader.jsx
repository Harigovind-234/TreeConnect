import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ message = 'Loading TreeConnect...' }) => {
  return (
    <div className="loader-container">
      <div className="loader-card">
        <Loader2 className="loader-spinner animate-spin" size={42} />
        <p className="loader-text">{message}</p>
      </div>
    </div>
  );
};

export default Loader;
