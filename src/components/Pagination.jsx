import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
      }
    }
    
    return pages;
  };

  return (
    <div style={styles.container}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{ ...styles.button, ...styles.prevNext }}
      >
        ← Prev
      </button>
      
      {getPageNumbers().map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          style={{
            ...styles.button,
            ...(currentPage === page ? styles.activeButton : {})
          }}
        >
          {page}
        </button>
      ))}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{ ...styles.button, ...styles.prevNext }}
      >
        Next →
      </button>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    flexWrap: 'wrap'
  },
  button: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    borderRadius: 4,
    cursor: 'pointer',
    minWidth: 40,
    transition: 'all 0.2s'
  },
  activeButton: {
    backgroundColor: '#1976d2',
    color: '#fff',
    borderColor: '#1976d2'
  },
  prevNext: {
    minWidth: 70
  }
};

export default Pagination;