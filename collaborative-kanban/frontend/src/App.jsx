import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const socket = io('http://localhost:3001');

const initialData = {
  tasks: {
    'task-1': { id: 'task-1', content: 'Set up Vite frontend architecture' },
    'task-2': { id: 'task-2', content: 'Configure Node.js WS server handles' },
    'task-3': { id: 'task-3', content: 'Implement real-time sync mechanism' },
  },
  columns: {
    'column-todo': {
      id: 'column-todo',
      title: 'To Do',
      taskIds: ['task-1', 'task-2'],
    },
    'column-in-progress': {
      id: 'column-in-progress',
      title: 'In Progress',
      taskIds: ['task-3'],
    },
    'column-done': {
      id: 'column-done',
      title: 'Done',
      taskIds: [],
    },
  },
  columnOrder: ['column-todo', 'column-in-progress', 'column-done'],
};
function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [boardData, setBoardData] = useState(initialData);

  // 1. ALL HOOKS MUST SIT AT THE TOP UNBLOCKED
  const updateBoardFromNetwork = useCallback((newBoardState) => {
    setBoardData(newBoardState);
  }, []);

  const onDragEnd = useCallback((result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const startColumn = boardData.columns[source.droppableId];
    const finishColumn = boardData.columns[destination.droppableId];

    if (startColumn === finishColumn) {
      const newTaskIds = Array.from(startColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = { ...startColumn, taskIds: newTaskIds };
      const updatedBoard = {
        ...boardData,
        columns: { ...boardData.columns, [newColumn.id]: newColumn },
      };

      setBoardData(updatedBoard);
      socket.emit('card-moved', updatedBoard);
      return;
    }

    const startTaskIds = Array.from(startColumn.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStartColumn = { ...startColumn, taskIds: startTaskIds };

    const finishTaskIds = Array.from(finishColumn.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinishColumn = { ...finishColumn, taskIds: finishTaskIds };

    const updatedBoard = {
      ...boardData,
      columns: {
        ...boardData.columns,
        [newStartColumn.id]: newStartColumn,
        [newFinishColumn.id]: newFinishColumn,
      },
    };

    setBoardData(updatedBoard);
    socket.emit('card-moved', updatedBoard);
  }, [boardData]);

  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    
    socket.on('initial-board-state', (data) => {
      updateBoardFromNetwork(data);
    });

    socket.on('board-updated', (data) => {
      updateBoardFromNetwork(data);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('initial-board-state');
      socket.off('board-updated');
    };
  }, [updateBoardFromNetwork]);

  // ==========================================
  // 2. PLACE CONDITIONAL GUARDS HERE (AFTER HOOKS)
  // ==========================================
  if (!boardData || !boardData.columnOrder) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f172a', color: '#f8fafc' }}>
        <h3>Hydrating System Board State from Database...</h3>
      </div>
    );
  }


return (
    <div style={{ padding: '30px', background: '#0f172a', minHeight: '100vh', color: '#f8fafc', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0' }}>Collaborative Kanban Board</h1>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>
          Pipeline Status: <span style={{ color: isConnected ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>{isConnected ? 'Connected ✅' : 'Disconnected ❌'}</span>
        </p>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        {/* The Flex Container now ONLY holds your column mappings */}
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          {boardData.columnOrder.map((columnId) => {
            const column = boardData.columns[columnId];
            const tasks = column.taskIds.map((taskId) => boardData.tasks[taskId]);

            return (
              <div key={column.id} style={{ background: '#1e293b', borderRadius: '8px', width: '300px', padding: '15px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 15px 0', paddingBottom: '10px', borderBottom: '2px solid #334155', color: '#cbd5e1' }}>{column.title}</h3>
                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                padding: '15px',
                                background: '#334155',
                                borderRadius: '6px',
                                color: '#f1f5f9',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                cursor: 'grab',
                                ...provided.draggableProps.style,
                              }}
                            >
                              {task.content}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}

export default App;