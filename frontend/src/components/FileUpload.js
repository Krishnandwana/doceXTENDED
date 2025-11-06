import React from 'react';

const FileUpload = ({ onFileChange, onFileUpload, loading, file, disabled = false }) => {
  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h5 className="card-title">Upload Document</h5>
        <p className="card-text">Select a document image to verify.</p>
        <div className="form-group">
          <input 
            type="file" 
            className="form-control-file" 
            onChange={onFileChange} 
            disabled={disabled}
            accept="image/*"
          />
        </div>
        {file && (
          <div className="mt-3">
            <img src={URL.createObjectURL(file)} alt="Preview" className="img-fluid rounded" />
          </div>
        )}
        <button 
          className="btn btn-primary mt-3 w-100" 
          onClick={onFileUpload} 
          disabled={loading || disabled}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span className="ms-2">Verifying...</span>
            </>
          ) : disabled ? (
            'Backend Disconnected'
          ) : (
            'Verify'
          )}
        </button>
      </div>
    </div>
  );
};

export default FileUpload;