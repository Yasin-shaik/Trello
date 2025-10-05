import React from 'react'
import BoardList from '../Components/BoardList'
import BoardView from '../Components/BoardView'
export default function Boards() {
  return (
    <div className='flex max-h-178'>
        <BoardList/>
        <BoardView/>
    </div>
  )
}
