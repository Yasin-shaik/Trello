import React from 'react'

export default function BoardHeader({ board, onSearch }) {
  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-300 bg-white">
        <h1 className="text-xl font-bold text-gray-900 truncate">{board.title}</h1>
        <input 
            type="text" 
            placeholder="Search cards..."
            onChange={(e) => onSearch(e.target.value)}
            className="p-1.5 text-sm rounded-md bg-white border border-gray-400 text-gray-800 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
        />
    </div>
  )
}
