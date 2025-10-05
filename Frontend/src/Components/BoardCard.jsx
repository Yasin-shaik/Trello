import React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom'; // useLocation to determine active state

const BoardCard = ({ board }) => {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const workspaceId = searchParams.get('workspaceId');
    
    // Determine the active state based on the current URL path
    // The path for the board view is /board/:boardId
    const isActive = location.pathname === `/board/${board._id}?workspaceId=${workspaceId}`;
    
    // Determine visibility icon
    const getVisibilityIcon = (visibility) => {
        switch (visibility) {
            case 'private':
                return '🔒';
            case 'public':
                return '🌎';
            case 'workspace':
            default:
                return '👥';
        }
    };

    // Base classes for the card
    const baseClasses = `
        flex items-center space-x-3 p-2.5 rounded-lg text-white shadow-md
        transition duration-150 ease-in-out cursor-pointer 
        w-full overflow-hidden h-12 text-ellipsis
    `;
    
    // Conditional classes for active/hover state
    const activeClasses = isActive 
        ? 'bg-indigo-600 font-bold shadow-lg' // Highlight color when active
        : 'hover:bg-gray-800 font-semibold'; // Hover effect when not active

    return (
        // Link component navigates to the full board view
        <Link 
            to={`/board/${board._id}?workspaceId=${workspaceId}`}
            // Use the background color property from the Board model for initial visual identity
            style={{ backgroundColor: board.background || '#0079bf' }}
            className={`${baseClasses} ${activeClasses}`}
        >
            {/* Visibility Icon */}
            <div className="text-xl flex-shrink-0">
                {getVisibilityIcon(board.visibility)}
            </div>

            {/* Board Title (Truncated) */}
            <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                {board.title}
            </span>
        </Link>
    );
};

export default BoardCard;